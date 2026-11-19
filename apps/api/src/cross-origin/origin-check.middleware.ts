import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ProblemException } from '../problem-details/problem.exception.js';
import { AllowedOrigins } from './allowed-origins.js';
import { getPathname, isAuthEntryPath, isSafeMethod } from './request-kind.js';

// CSRF 토큰 대신 요청을 보낸 출처를 확인해 다른 사이트가 쿠키를 실어 보낸 변경 요청을 막는다(ADR 0009).
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  constructor(private readonly allowedOrigins: AllowedOrigins) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    if (isSafeMethod(request)) {
      next();
      return;
    }
    const pathname = getPathname(request);
    const allowed = this.allowedOrigins.getOriginFor(pathname);
    const hasCookie = Boolean(request.get('cookie'));
    if (hasCookie && getRequestOrigin(request) !== allowed) {
      throw createOriginNotAllowedException();
    }
    if (
      !hasCookie &&
      isAuthEntryPath(pathname) &&
      isForgedAuthEntryRequest({ request, allowed })
    ) {
      throw createOriginNotAllowedException();
    }
    next();
  }
}

/**
 * 쿠키가 없는 로그인과 가입 요청이 다른 사이트에서 보낸 것인지 판단한다(로그인 CSRF, Better Auth의 formCsrfMiddleware와 같음).
 * 다른 사이트가 공격자 계정으로 로그인시키면 피해자가 입력한 정보가 공격자 계정에 쌓인다.
 * 쿠키가 실린 요청과 판단 방식이 반대다. 쿠키가 실린 요청은 허용 출처임을 증명해야 통과하지만(Origin이 없으면 Referer로라도),
 * 여기서는 다른 사이트에서 왔다는 증거(Sec-Fetch, 틀린 Origin)가 있을 때만 막는다.
 * 쿠키가 없으면 빼앗을 세션이 없고, Origin을 보내지 않는 정상 요청(curl, 서버 간 호출)도 받아야 하기 때문이다.
 * Origin이 없으면 이미 통과시키므로 Referer로 대신 증명할 필요가 없다(Better Auth와 같음).
 * 허용 출처는 Better Auth처럼 신뢰 출처 전체가 아니라 경로별로 고른다. 어드민 로그인은 어드민 출처에서만 받는다.
 */
function isForgedAuthEntryRequest({
  request,
  allowed,
}: {
  request: Request;
  allowed: string;
}): boolean {
  const isCrossSiteNavigation =
    request.get('sec-fetch-site') === 'cross-site' &&
    request.get('sec-fetch-mode') === 'navigate';
  const origin = request.get('origin');
  return isCrossSiteNavigation || (!!origin && origin !== allowed);
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
