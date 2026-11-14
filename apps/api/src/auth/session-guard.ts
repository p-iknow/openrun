import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  type Type,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createAuthenticationRequiredException } from './authentication-required.js';
import type {
  AuthenticatedSession,
  SessionManager,
} from './session-manager.js';

// 가드가 확인한 세션을 컨트롤러에 넘기는 자리다.
const AUTHENTICATED_SESSION = Symbol('AUTHENTICATED_SESSION');

type RequestWithSession = Request & {
  [AUTHENTICATED_SESSION]?: AuthenticatedSession;
};

/**
 * 주입 토큰이 가리키는 SessionManager로 세션을 확인하는 로그인 가드를 만든다.
 * 사용자 세션과 운영자 세션은 SessionManager(세션 테이블과 쿠키)만 바꿔 같은 가드를 쓴다.
 * 세션이 없거나 만료됐으면 401 AUTHENTICATION_REQUIRED다.
 */
export function createSessionGuard(
  sessionManagerToken: symbol,
): Type<CanActivate> {
  @Injectable()
  class SessionGuard implements CanActivate {
    constructor(
      @Inject(sessionManagerToken)
      private readonly sessionManager: SessionManager,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const http = context.switchToHttp();
      const request = http.getRequest<RequestWithSession>();
      const session = await this.sessionManager.authenticate({
        request,
        response: http.getResponse<Response>(),
      });
      if (!session) {
        throw createAuthenticationRequiredException();
      }
      request[AUTHENTICATED_SESSION] = session;
      return true;
    }
  }
  return SessionGuard;
}

/** 로그인 가드가 확인한 세션. 가드를 붙인 핸들러에서만 쓴다. */
export const CurrentSession = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedSession => {
    const session = context.switchToHttp().getRequest<RequestWithSession>()[
      AUTHENTICATED_SESSION
    ];
    if (!session) {
      throw new Error(
        '로그인 가드를 붙이지 않은 핸들러에서 세션을 읽었습니다.',
      );
    }
    return session;
  },
);
