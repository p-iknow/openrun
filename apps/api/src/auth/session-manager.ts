import { parseCookie } from 'cookie';
import type { CookieOptions, Request, Response } from 'express';
import type { Clock } from '../clock/clock.module.js';
import {
  createSessionToken,
  hashSessionToken,
  readSignedSessionToken,
  signSessionToken,
} from './session-token.js';

/** 저장소에서 읽은 세션. 주체(subject)는 사용자 세션이면 사용자, 운영자 세션이면 운영자다. */
export interface StoredSession {
  id: number;
  subjectId: number;
  expiresAt: Date;
  rememberMe: boolean;
}

/**
 * 세션 행을 읽고 쓰는 곳. 세션 테이블을 소유한 모듈이 구현해 넘긴다.
 * 사용자 세션과 운영자 세션은 테이블만 다르고 같은 SessionManager 로직을 쓴다.
 */
export interface SessionStore {
  create(input: {
    tokenHash: string;
    subjectId: number;
    expiresAt: Date;
    rememberMe: boolean;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<StoredSession | null>;
  /** 만료 일시를 다시 쓴다. 그새 행이 지워졌으면 false다. */
  extend(input: { id: number; expiresAt: Date }): Promise<boolean>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

/** 세션 하나의 만료와 연장 규칙. */
export interface SessionPolicy {
  expiresInMs: number;
  /** 마지막 연장 뒤 이만큼 지난 첫 요청에서 만료를 지금부터 expiresInMs로 다시 쓴다. null이면 연장하지 않는다. */
  updateAgeMs: number | null;
  /** true면 쿠키에 Max-Age(expiresInMs)를 둔다. false면 브라우저를 닫을 때 사라지는 쿠키다. */
  persistentCookie: boolean;
}

export interface SessionCookieSettings {
  name: string;
  /** 없으면 Domain 속성을 두지 않아 API 호스트에만 전송된다. */
  domain?: string;
  secure: boolean;
}

export interface AuthenticatedSession {
  sessionId: number;
  subjectId: number;
}

export interface SessionManagerOptions {
  store: SessionStore;
  cookie: SessionCookieSettings;
  /** 쿠키 서명 키(AUTH_SECRET). */
  secret: string;
  clock: Clock;
  getPolicy: (session: { rememberMe: boolean }) => SessionPolicy;
}

// Better Auth를 본뜬 DB 세션의 발급, 검증, 연장, 폐기(ADR 0009).
// 쿠키에는 `토큰.HMAC 서명`을, DB에는 토큰의 SHA-256 해시만 둔다. 요청마다 DB에서 세션을 읽는다(쿠키 캐시 없음).
export class SessionManager {
  // 한 요청에서 가드와 컨트롤러가 함께 불러도 DB 조회와 연장을 한 번만 하도록 결과를 요청에 묶어 둔다.
  private readonly authenticated = new WeakMap<
    Request,
    Promise<AuthenticatedSession | null>
  >();

  constructor(private readonly options: SessionManagerOptions) {}

  /** 새 세션을 만들고 쿠키를 내린다. 요청에 이전 세션 쿠키가 있으면 그 세션은 지운다. */
  async issue({
    request,
    response,
    subjectId,
    rememberMe,
  }: {
    request: Request;
    response: Response;
    subjectId: number;
    rememberMe: boolean;
  }): Promise<void> {
    const { store, secret, clock, getPolicy } = this.options;
    const previousToken = this.readToken(request);
    if (previousToken) {
      await store.deleteByTokenHash(hashSessionToken(previousToken));
    }

    const token = createSessionToken();
    const policy = getPolicy({ rememberMe });
    await store.create({
      tokenHash: hashSessionToken(token),
      subjectId,
      expiresAt: new Date(clock.now().getTime() + policy.expiresInMs),
      rememberMe,
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    });
    this.setCookie({
      response,
      value: signSessionToken({ token, secret }),
      policy,
    });
  }

  /**
   * 요청의 세션 쿠키로 세션을 찾는다. 없거나 만료됐으면 null이다.
   * 만료된 세션은 지우고 쿠키도 지운다. 연장할 때가 됐으면 만료를 다시 쓰고 쿠키를 다시 내린다.
   */
  authenticate({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Promise<AuthenticatedSession | null> {
    let result = this.authenticated.get(request);
    if (!result) {
      result = this.findSession({ request, response });
      this.authenticated.set(request, result);
    }
    return result;
  }

  /** 세션 행과 쿠키를 지운다. 세션이 이미 없어도 그대로 끝난다. */
  async revoke({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Promise<void> {
    const token = this.readToken(request);
    if (token) {
      await this.options.store.deleteByTokenHash(hashSessionToken(token));
    }
    this.clearCookie(response);
  }

  private async findSession({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Promise<AuthenticatedSession | null> {
    const { store, secret, clock, getPolicy } = this.options;
    const token = this.readToken(request);
    if (!token) {
      return null;
    }
    const tokenHash = hashSessionToken(token);
    const session = await store.findByTokenHash(tokenHash);
    if (!session) {
      this.clearCookie(response);
      return null;
    }

    const now = clock.now().getTime();
    if (session.expiresAt.getTime() <= now) {
      await store.deleteByTokenHash(tokenHash);
      this.clearCookie(response);
      return null;
    }

    const policy = getPolicy(session);
    // 만료 일시에서 유지 기간을 빼면 마지막으로 만료를 정한(발급하거나 연장한) 시각이다(Better Auth와 같음).
    const lastRefreshedAt = session.expiresAt.getTime() - policy.expiresInMs;
    if (
      policy.updateAgeMs !== null &&
      lastRefreshedAt + policy.updateAgeMs <= now
    ) {
      const extended = await store.extend({
        id: session.id,
        expiresAt: new Date(now + policy.expiresInMs),
      });
      // 확인한 뒤 연장하기 전에 다른 요청(로그아웃)이 행을 지웠다.
      if (!extended) {
        this.clearCookie(response);
        return null;
      }
      this.setCookie({
        response,
        value: signSessionToken({ token, secret }),
        policy,
      });
    }

    return { sessionId: session.id, subjectId: session.subjectId };
  }

  // 서명이 맞는 쿠키의 토큰만 돌려준다. 서명이 틀리면 DB를 조회하지 않고 없는 것으로 다룬다.
  private readToken(request: Request): string | null {
    const value = parseCookie(request.get('cookie') ?? '')[
      this.options.cookie.name
    ];
    if (!value) {
      return null;
    }
    return readSignedSessionToken({ value, secret: this.options.secret });
  }

  private setCookie({
    response,
    value,
    policy,
  }: {
    response: Response;
    value: string;
    policy: SessionPolicy;
  }): void {
    response.cookie(this.options.cookie.name, value, {
      ...this.buildCookieOptions(),
      ...(policy.persistentCookie && { maxAge: policy.expiresInMs }),
    });
  }

  private clearCookie(response: Response): void {
    response.clearCookie(this.options.cookie.name, this.buildCookieOptions());
  }

  private buildCookieOptions(): CookieOptions {
    const { domain, secure } = this.options.cookie;
    return {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
      ...(domain && { domain }),
    };
  }
}
