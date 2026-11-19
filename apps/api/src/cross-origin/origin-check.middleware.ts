import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AllowedOrigins } from './allowed-origins.js';
import { createOriginNotAllowedException } from './origin-not-allowed.js';
import {
  getPathname,
  getRequestOrigin,
  hasCookie,
  isSafeMethod,
} from './request-kind.js';

/**
 * 쿠키가 실린 변경 요청은 그 경로의 허용 출처에서 보낸 것이어야 한다(일반 CSRF, Better Auth의 originCheck와 같음).
 * CSRF 토큰 대신 요청을 보낸 출처를 확인해, 다른 사이트가 피해자의 쿠키를 실어 보낸 요청을 막는다(ADR 0009).
 * 허용 출처임을 증명해야 통과한다. Origin이 없으면 Referer로 증명하고, 둘 다 없으면 막는다.
 * 쿠키가 없는 요청은 빼앗을 세션이 없어 보지 않는다. 그중 로그인과 가입은 LoginCsrfMiddleware가 본다.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  constructor(private readonly allowedOrigins: AllowedOrigins) {}

  use(request: Request, _response: Response, next: NextFunction): void {
    if (isSafeMethod(request) || !hasCookie(request)) {
      next();
      return;
    }
    const allowed = this.allowedOrigins.getOriginFor(getPathname(request));
    if (getRequestOrigin(request) !== allowed) {
      throw createOriginNotAllowedException();
    }
    next();
  }
}
