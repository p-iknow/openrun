import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AllowedOrigins } from './allowed-origins.js';
import { createOriginNotAllowedException } from './origin-not-allowed.js';
import {
  getPathname,
  hasCookie,
  isAuthEntryPath,
  isSafeMethod,
} from './request-kind.js';

/**
 * 쿠키가 없는 로그인과 가입 요청이 다른 사이트에서 보낸 것이면 막는다(로그인 CSRF, Better Auth의 formCsrfMiddleware와 같음).
 * 다른 사이트가 공격자 계정으로 로그인시키면 피해자가 입력한 정보가 공격자 계정에 쌓인다.
 * 이 요청은 쿠키를 쓰지 않고 새로 굽기 때문에, 쿠키가 실린 요청만 보는 OriginCheckMiddleware에 걸리지 않는다.
 *
 * OriginCheckMiddleware와 판단 방식이 반대다. 그쪽은 허용 출처임을 증명해야 통과하지만(Origin이 없으면 Referer로라도),
 * 여기서는 다른 사이트에서 왔다는 증거(Sec-Fetch, 틀린 Origin)가 있을 때만 막는다.
 * 로그인 CSRF는 피해자의 브라우저에 쿠키를 심어야 성립하므로, Origin을 보내지 않는 curl이나 서버 간 호출은 공격 수단이 아니라 정상 로그인이다.
 * Origin이 없으면 이미 통과시키므로 Referer로 대신 증명할 필요가 없다(Better Auth와 같음).
 * 허용 출처는 Better Auth처럼 신뢰 출처 전체가 아니라 경로별로 고른다. 어드민 로그인은 어드민 출처에서만 받는다.
 */
@Injectable()
export class LoginCsrfMiddleware implements NestMiddleware {
  constructor(private readonly allowedOrigins: AllowedOrigins) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    const pathname = getPathname(request);
    if (
      isSafeMethod(request) ||
      hasCookie(request) ||
      !isAuthEntryPath(pathname)
    ) {
      next();
      return;
    }
    if (isCrossSiteNavigation(request)) {
      throw createOriginNotAllowedException();
    }
    const origin = request.get('origin');
    // Origin이 없으면 다른 사이트에서 왔다는 증거가 없으므로 통과시킨다(curl, 서버 간 호출).
    if (origin === undefined) {
      next();
      return;
    }
    if (origin !== this.allowedOrigins.getOriginFor(pathname)) {
      throw createOriginNotAllowedException();
    }
    next();
  }
}

// 다른 사이트의 페이지가 폼 제출이나 링크로 이동시킨 요청. 두 헤더는 브라우저만 붙이고 페이지의 스크립트는 바꿀 수 없다.
function isCrossSiteNavigation(request: Request): boolean {
  return (
    request.get('sec-fetch-site') === 'cross-site' &&
    request.get('sec-fetch-mode') === 'navigate'
  );
}
