import type { FactoryProvider } from '@nestjs/common';
import { createSessionGuard } from '../auth/session-guard.js';
import { type SessionPolicy, SessionManager } from '../auth/session-manager.js';
import { Clock } from '../clock/clock.module.js';
import {
  readAuthSecret,
  readCookieDomain,
  readUseSecureCookies,
} from '../config/env.js';
import { UserSessionStore } from './user-session-store.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// 로그인 상태 유지를 켜면 7일 동안 유지하고, 마지막 연장 뒤 1일이 지난 첫 요청에서 다시 7일로 연장한다(Better Auth와 같음).
const REMEMBERED_POLICY: SessionPolicy = {
  expiresInMs: 7 * DAY_MS,
  updateAgeMs: DAY_MS,
  persistentCookie: true,
};
// 끄면 1일 뒤 끝나고 연장하지 않는다. 쿠키에 Max-Age가 없어 브라우저를 닫으면 사라진다.
const NOT_REMEMBERED_POLICY: SessionPolicy = {
  expiresInMs: DAY_MS,
  updateAgeMs: null,
  persistentCookie: false,
};

const COOKIE_NAME = 'openrun.session_token';
// __Secure- 접두사를 붙이면 브라우저가 Secure 쿠키로만 받는다.
const SECURE_COOKIE_PREFIX = '__Secure-';

/** 사용자 세션의 SessionManager 주입 토큰. */
export const USER_SESSION_MANAGER = Symbol('USER_SESSION_MANAGER');

/** 사용자 로그인이 필요한 핸들러에 붙이는 가드. */
export const UserSessionGuard = createSessionGuard(USER_SESSION_MANAGER);

export const userSessionManagerProvider: FactoryProvider<SessionManager> = {
  provide: USER_SESSION_MANAGER,
  inject: [UserSessionStore, Clock],
  useFactory: (store: UserSessionStore, clock: Clock) => {
    const secure = readUseSecureCookies();
    return new SessionManager({
      store,
      clock,
      secret: readAuthSecret(),
      cookie: {
        name: secure ? `${SECURE_COOKIE_PREFIX}${COOKIE_NAME}` : COOKIE_NAME,
        domain: readCookieDomain(),
        secure,
      },
      getPolicy: ({ rememberMe }) =>
        rememberMe ? REMEMBERED_POLICY : NOT_REMEMBERED_POLICY,
    });
  },
};
