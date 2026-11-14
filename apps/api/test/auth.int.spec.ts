import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { parseSetCookie, type SetCookie } from 'cookie';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  inject,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { Clock } from '../src/clock/clock.module.js';
import { sessions } from '../src/db/schema/users.js';
import { db } from './db.js';
import { userFactory } from './factory.js';

// 없는 이메일에서도 비밀번호 해시를 계산하는지 세려고, 실제 구현을 감싼 스파이로 바꾼다.
vi.mock(import('../src/auth/password.js'), async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, hashPassword: vi.fn(original.hashPassword) };
});

const DEFAULT_NOW = '2026-02-01T00:00:00Z';
const AUTH_SECRET = 'test-auth-secret-0123456789abcdefghijklmnop';
const SESSION_COOKIE = 'openrun.session_token';

const DAY_MS = 24 * 60 * 60 * 1000;

let app: INestApplication<App>;
// 테스트마다 바꿀 수 있는 현재 시각. 앱의 Clock이 이 값을 돌려준다.
let now: Date;

beforeAll(() => {
  vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  vi.stubEnv('SHOW_IMAGE_BASE_URL', 'https://images.example.com/openrun');
  vi.stubEnv('AUTH_SECRET', AUTH_SECRET);
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$client.end();
});

beforeEach(async () => {
  await db.execute(
    'TRUNCATE sessions, accounts, users RESTART IDENTITY CASCADE',
  );

  now = new Date(DEFAULT_NOW);
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(Clock)
    .useValue({ now: () => now })
    .compile();

  app = moduleRef.createNestApplication({ logger: false });
  await app.init();
});

afterEach(async () => {
  await app.close();
});

// 로그인하고 받은 세션 쿠키를 돌려준다. 다음 요청에 Cookie 헤더로 그대로 실을 수 있게 `이름=값`도 함께 준다.
async function signIn({
  email = 'user@example.com',
  password = 'password1!',
  rememberMe = true,
}: { email?: string; password?: string; rememberMe?: boolean } = {}): Promise<{
  cookie: SetCookie;
  header: string;
}> {
  const response = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({ email, password, rememberMe });
  expect(response.status).toBe(200);
  const cookie = findSessionCookie(response);
  if (!cookie?.value) {
    throw new Error('세션 쿠키를 받지 못했습니다.');
  }
  return {
    cookie,
    header: `${SESSION_COOKIE}=${encodeURIComponent(cookie.value)}`,
  };
}

function findSessionCookie(response: request.Response): SetCookie | undefined {
  const headers = [response.headers['set-cookie'] ?? []].flat();
  return headers
    .map((header) => parseSetCookie(header))
    .find((cookie) => cookie.name === SESSION_COOKIE);
}

// 쿠키 값 `토큰.서명`에서 토큰만 꺼낸다.
function getToken(cookie: SetCookie): string {
  const value = cookie.value ?? '';
  return value.slice(0, value.lastIndexOf('.'));
}

function getSession(cookieHeader: string) {
  return request(app.getHttpServer())
    .get('/auth/session')
    .set('Cookie', cookieHeader);
}

describe('POST /auth/sign-in', () => {
  it('맞는 이메일과 비밀번호로 로그인하면 서명된 세션 쿠키를 받고, 그 쿠키로 현재 세션을 조회한다', async () => {
    const userId = await userFactory.build({
      email: 'kim@example.com',
      name: '김오픈',
      password: 'password1!',
      emailVerifiedAt: '2026-01-01T00:00:00Z',
    });
    const agent = request.agent(app.getHttpServer());

    const signIn = await agent.post('/auth/sign-in').send({
      email: 'kim@example.com',
      password: 'password1!',
      rememberMe: true,
    });

    expect(signIn.status).toBe(200);
    expect(signIn.headers['set-cookie']?.[0]).toMatch(
      new RegExp(`^${SESSION_COOKIE}=[A-Za-z0-9]{32}\\.`),
    );
    const session = await agent.get('/auth/session');
    expect(session.status).toBe(200);
    expect(session.body).toEqual({
      user: {
        id: userId,
        email: 'kim@example.com',
        name: '김오픈',
        emailVerified: true,
      },
    });
  });
});

describe('POST /auth/sign-in 실패', () => {
  const INVALID_CREDENTIALS = {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    detail: '이메일 또는 비밀번호가 올바르지 않습니다.',
    code: 'INVALID_CREDENTIALS',
  };

  it('틀린 비밀번호는 401 INVALID_CREDENTIALS이고 쿠키를 내리지 않는다', async () => {
    await userFactory.build({
      email: 'kim@example.com',
      password: 'password1!',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: 'kim@example.com',
        password: 'wrong1!',
        rememberMe: true,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(INVALID_CREDENTIALS);
    expect(findSessionCookie(response)).toBeUndefined();
  });

  it('없는 이메일도 같은 401이고, 비밀번호 해시를 한 번 계산해 응답 시간으로 구분되지 않게 한다', async () => {
    await userFactory.build({ email: 'kim@example.com' });
    vi.mocked(hashPassword).mockClear();

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: 'nobody@example.com',
        password: 'password1!',
        rememberMe: true,
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(INVALID_CREDENTIALS);
    expect(hashPassword).toHaveBeenCalledTimes(1);
  });
});

describe('POST /auth/sign-in 이메일', () => {
  it('앞뒤 공백을 지우고 소문자로 바꿔 비교한다', async () => {
    await userFactory.build({
      email: 'kim@example.com',
      password: 'password1!',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        email: '  Kim@Example.COM ',
        password: 'password1!',
        rememberMe: true,
      });

    expect(response.status).toBe(200);
  });
});

describe('세션 토큰', () => {
  it('DB에는 쿠키 토큰의 SHA-256 해시만 있다', async () => {
    await userFactory.build();

    const { cookie } = await signIn();

    // 유출됐을 때 바로 쓸 수 없는지가 요구 사항이라, 응답으로는 알 수 없는 DB 내용을 직접 본다.
    const token = getToken(cookie);
    const rows = await db
      .select({ tokenHash: sessions.tokenHash })
      .from(sessions);
    expect(rows).toEqual([
      { tokenHash: createHash('sha256').update(token).digest('hex') },
    ]);
    const [stored] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.tokenHash, token));
    expect(stored).toBeUndefined();
  });

  it('서명이 틀린 쿠키는 로그인하지 않은 것으로 다룬다', async () => {
    await userFactory.build();
    const { cookie } = await signIn();
    const token = getToken(cookie);
    const forged = `${token}.${createHash('sha256').update('forged').digest('base64')}`;

    const response = await getSession(
      `${SESSION_COOKIE}=${encodeURIComponent(forged)}`,
    );

    expect(response.status).toBe(200);
    expect(response.text).toBe('null');
  });
});

describe('GET /auth/session', () => {
  it('로그인하지 않았으면 200과 null이다', async () => {
    const response = await request(app.getHttpServer()).get('/auth/session');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.text).toBe('null');
  });
});

describe('로그인 상태 유지', () => {
  const AUTHENTICATION_REQUIRED = {
    type: 'about:blank',
    title: 'Unauthorized',
    status: 401,
    detail: '로그인이 필요합니다.',
    code: 'AUTHENTICATION_REQUIRED',
  };

  function moveClock(ms: number) {
    now = new Date(new Date(DEFAULT_NOW).getTime() + ms);
  }

  function getMe(cookieHeader: string) {
    return request(app.getHttpServer()).get('/me').set('Cookie', cookieHeader);
  }

  it('켜면 쿠키가 HttpOnly, SameSite=Lax이고 Max-Age가 7일이다', async () => {
    await userFactory.build();

    const { cookie } = await signIn({ rememberMe: true });

    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  });

  it('켜면 마지막 연장 뒤 1일이 지나기 전에는 쿠키를 다시 내리지 않는다', async () => {
    await userFactory.build();
    const { header } = await signIn({ rememberMe: true });

    moveClock(DAY_MS - 1);
    const response = await getSession(header);

    expect(response.body).not.toBeNull();
    expect(findSessionCookie(response)).toBeUndefined();
  });

  it('켜면 마지막 연장 뒤 1일이 지난 첫 요청에서 지금부터 7일로 연장하고 쿠키를 다시 내린다', async () => {
    await userFactory.build();
    const { cookie, header } = await signIn({ rememberMe: true });

    moveClock(DAY_MS);
    const extended = await getSession(header);

    expect(extended.body).not.toBeNull();
    expect(findSessionCookie(extended)).toMatchObject({
      value: cookie.value,
      maxAge: 7 * 24 * 60 * 60,
    });
    // 처음 만료(로그인 뒤 7일)가 지나도 연장한 만료(로그인 뒤 8일) 전이면 통한다.
    moveClock(8 * DAY_MS - 1);
    expect((await getMe(header)).status).toBe(200);
  });

  it('켜고 연장하지 않았으면 7일 뒤 만료되어 /me가 401 AUTHENTICATION_REQUIRED이고 쿠키를 지운다', async () => {
    await userFactory.build();
    const { header } = await signIn({ rememberMe: true });

    moveClock(7 * DAY_MS);
    const response = await getMe(header);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(AUTHENTICATION_REQUIRED);
    expect(findSessionCookie(response)).toMatchObject({ value: '' });
  });

  it('끄면 쿠키에 Max-Age가 없다', async () => {
    await userFactory.build();

    const { cookie } = await signIn({ rememberMe: false });

    expect(cookie.maxAge).toBeUndefined();
    expect(cookie.expires).toBeUndefined();
  });

  it('끄면 연장하지 않고 1일 뒤 만료된다', async () => {
    await userFactory.build();
    const { header } = await signIn({ rememberMe: false });

    moveClock(DAY_MS - 1);
    const beforeExpiry = await getMe(header);
    expect(beforeExpiry.status).toBe(200);
    expect(findSessionCookie(beforeExpiry)).toBeUndefined();

    moveClock(DAY_MS);
    const afterExpiry = await getMe(header);
    expect(afterExpiry.status).toBe(401);
    expect(afterExpiry.body).toEqual(AUTHENTICATION_REQUIRED);
  });

  it('로그인하지 않고 /me를 부르면 401 AUTHENTICATION_REQUIRED다', async () => {
    const response = await request(app.getHttpServer()).get('/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(AUTHENTICATION_REQUIRED);
  });
});

describe('GET /me', () => {
  it('로그인한 사용자를 돌려준다', async () => {
    const userId = await userFactory.build({
      email: 'kim@example.com',
      name: '김오픈',
      emailVerifiedAt: null,
    });
    const { header } = await signIn({ email: 'kim@example.com' });

    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Cookie', header);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: userId,
      email: 'kim@example.com',
      name: '김오픈',
      emailVerified: false,
    });
  });
});

describe('POST /auth/sign-out', () => {
  it('세션 행과 쿠키를 지워, 같은 쿠키로는 더 이상 로그인되지 않는다', async () => {
    await userFactory.build();
    const { header } = await signIn();

    const response = await request(app.getHttpServer())
      .post('/auth/sign-out')
      .set('Cookie', header);

    expect(response.status).toBe(204);
    expect(findSessionCookie(response)).toMatchObject({ value: '' });
    expect((await getSession(header)).text).toBe('null');
  });

  it('이미 끊긴 세션이나 쿠키 없이 불러도 204다', async () => {
    await userFactory.build();
    const { header } = await signIn();
    await request(app.getHttpServer())
      .post('/auth/sign-out')
      .set('Cookie', header);

    const again = await request(app.getHttpServer())
      .post('/auth/sign-out')
      .set('Cookie', header);
    const withoutCookie = await request(app.getHttpServer()).post(
      '/auth/sign-out',
    );

    expect(again.status).toBe(204);
    expect(withoutCookie.status).toBe(204);
  });
});

describe('다시 로그인', () => {
  it('로그인한 채 다시 로그인하면 이전 세션은 지워진다', async () => {
    await userFactory.build();
    const first = await signIn();

    const second = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .set('Cookie', first.header)
      .send({
        email: 'user@example.com',
        password: 'password1!',
        rememberMe: true,
      });

    expect(second.status).toBe(200);
    expect((await getSession(first.header)).text).toBe('null');
    const secondCookie = findSessionCookie(second);
    expect(secondCookie?.value).not.toBe(first.cookie.value);
    expect(
      (
        await getSession(
          `${SESSION_COOKIE}=${encodeURIComponent(secondCookie?.value ?? '')}`,
        )
      ).body,
    ).not.toBeNull();
  });
});
