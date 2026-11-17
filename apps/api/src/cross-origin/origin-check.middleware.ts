import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ProblemException } from '../problem-details/problem.exception.js';
import { AllowedOrigins } from './allowed-origins.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// 쿠키 없이도 보내는 로그인과 가입 요청. 사용자와 운영자(`/admin/...`)의 경로를 함께 본다.
const SIGN_IN_PATH_PATTERN = /^(\/admin)?\/auth\/(sign-in|sign-up)$/;

// CSRF 토큰 대신 요청을 보낸 출처를 확인해 다른 사이트가 쿠키를 실어 보낸 변경 요청을 막는다(ADR 0009).
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  constructor(private readonly allowedOrigins: AllowedOrigins) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(request.method)) {
      next();
      return;
    }
    // Nest가 미들웨어를 경로에 마운트해 request.path는 마운트 뒤의 나머지만 담으므로, 원래 URL의 경로를 쓴다.
    const pathname = getPathname(request);
    const allowed = this.allowedOrigins.getOriginFor(pathname);
    if (request.get('cookie')) {
      if (getRequestOrigin(request) !== allowed) {
        throw createOriginNotAllowedException();
      }
    } else if (SIGN_IN_PATH_PATTERN.test(pathname)) {
      checkSignInRequest({ request, allowed });
    }
    next();
  }
}

/**
 * 쿠키가 없는 로그인과 가입 요청을 검사한다(로그인 CSRF, Better Auth의 formCsrfMiddleware와 같음).
 * 다른 사이트가 공격자 계정으로 로그인시키면 피해자가 입력한 정보가 공격자 계정에 쌓인다.
 * 쿠키가 없으면 Origin이 없는 요청(서버 간 호출, curl)도 받아야 하므로, 브라우저가 붙이는 헤더가 있을 때만 막는다.
 */
function checkSignInRequest({
  request,
  allowed,
}: {
  request: Request;
  allowed: string;
}): void {
  const isCrossSiteNavigation =
    request.get('sec-fetch-site') === 'cross-site' &&
    request.get('sec-fetch-mode') === 'navigate';
  if (isCrossSiteNavigation) {
    throw createOriginNotAllowedException();
  }
  const origin = request.get('origin');
  if (origin && origin !== allowed) {
    throw createOriginNotAllowedException();
  }
}

function getPathname(request: Request): string {
  return new URL(request.originalUrl, 'http://localhost').pathname;
}

// Origin이 없으면(오래된 브라우저, 일부 같은 출처 요청) Referer의 출처를 쓴다. 둘 다 없으면 null이다.
function getRequestOrigin(request: Request): string | null {
  const origin = request.get('origin');
  if (origin) {
    return origin;
  }
  const referer = request.get('referer');
  return referer ? (URL.parse(referer)?.origin ?? null) : null;
}

function createOriginNotAllowedException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.FORBIDDEN,
    code: 'ORIGIN_NOT_ALLOWED',
    detail: '허용하지 않은 출처의 요청입니다.',
  });
}
