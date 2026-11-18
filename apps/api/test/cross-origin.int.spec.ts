import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  type INestApplication,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
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

const STORE_ORIGIN = 'http://store.example.com';
const ADMIN_ORIGIN = 'http://admin.example.com';
// 세션이 유효한지와 상관없이 쿠키가 실렸는지만 본다.
const COOKIE = 'openrun.session_token=anything';

const ORIGIN_NOT_ALLOWED = {
  type: 'about:blank',
  title: 'Forbidden',
  status: 403,
  detail: '허용하지 않은 출처의 요청입니다.',
  code: 'ORIGIN_NOT_ALLOWED',
};

// 어드민 API가 아직 없어서, 테스트용 경로를 붙인다. 미들웨어는 있는 경로에만 붙는다.
@Controller('admin/test')
class AdminTestController {
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  create(@Body() _body: unknown): void {}
}

let app: INestApplication<App>;

beforeAll(() => {
  vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  vi.stubEnv('SHOW_IMAGE_BASE_URL', 'https://images.example.com/openrun');
  vi.stubEnv('AUTH_SECRET', 'test-auth-secret-0123456789abcdefghijklmnop');
  vi.stubEnv('STORE_ORIGIN', STORE_ORIGIN);
  vi.stubEnv('ADMIN_ORIGIN', ADMIN_ORIGIN);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [AdminTestController],
  }).compile();
  app = moduleRef.createNestApplication({ logger: false });
  await app.init();
});

afterEach(async () => {
  await app.close();
});

function signOut() {
  return request(app.getHttpServer())
    .post('/auth/sign-out')
    .set('Cookie', COOKIE);
}

describe('쿠키가 실린 변경 요청의 Origin 검사', () => {
  it('허용 목록에 없는 Origin은 403 ORIGIN_NOT_ALLOWED다', async () => {
    const response = await signOut().set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(403);
    expect(response.body).toEqual(ORIGIN_NOT_ALLOWED);
  });

  it('스토어 출처는 통과한다', async () => {
    const response = await signOut().set('Origin', STORE_ORIGIN);

    expect(response.status).toBe(204);
  });

  it('Origin이 없으면 Referer의 출처로 판단한다', async () => {
    const allowed = await signOut().set('Referer', `${STORE_ORIGIN}/login`);
    const rejected = await signOut().set(
      'Referer',
      'https://evil.example.com/login',
    );

    expect(allowed.status).toBe(204);
    expect(rejected.status).toBe(403);
  });

  it('Origin과 Referer가 모두 없으면 403이다', async () => {
    const response = await signOut();

    expect(response.status).toBe(403);
    expect(response.body).toEqual(ORIGIN_NOT_ALLOWED);
  });

  it('쿠키가 실렸어도 GET은 검사하지 않는다', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', COOKIE)
      .set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(200);
  });

  it('/admin/*는 스토어 출처를 막고 어드민 출처만 통과시킨다', async () => {
    const fromStore = await request(app.getHttpServer())
      .post('/admin/test')
      .set('Cookie', COOKIE)
      .set('Origin', STORE_ORIGIN);
    const fromAdmin = await request(app.getHttpServer())
      .post('/admin/test')
      .set('Cookie', COOKIE)
      .set('Origin', ADMIN_ORIGIN);

    expect(fromStore.status).toBe(403);
    expect(fromStore.body).toEqual(ORIGIN_NOT_ALLOWED);
    expect(fromAdmin.status).toBe(204);
  });

  it('사용자 API는 어드민 출처를 막는다', async () => {
    const response = await signOut().set('Origin', ADMIN_ORIGIN);

    expect(response.status).toBe(403);
  });
});

describe('쿠키 없는 로그인 요청(로그인 CSRF)', () => {
  function signIn() {
    return request(app.getHttpServer()).post('/auth/sign-in').send({
      email: 'nobody@example.com',
      password: 'password1!',
      rememberMe: true,
    });
  }

  it('다른 사이트의 폼 제출(Sec-Fetch-Site: cross-site, Sec-Fetch-Mode: navigate)은 403이다', async () => {
    const response = await signIn()
      .set('Sec-Fetch-Site', 'cross-site')
      .set('Sec-Fetch-Mode', 'navigate');

    expect(response.status).toBe(403);
    expect(response.body).toEqual(ORIGIN_NOT_ALLOWED);
  });

  it('허용 목록에 없는 Origin은 403이다', async () => {
    const response = await signIn().set('Origin', 'https://evil.example.com');

    expect(response.status).toBe(403);
  });

  it('스토어 출처에서 보내면 검사를 통과해 로그인을 처리한다', async () => {
    const response = await signIn()
      .set('Origin', STORE_ORIGIN)
      .set('Sec-Fetch-Site', 'same-site')
      .set('Sec-Fetch-Mode', 'cors');

    // 없는 사용자라 로그인은 실패하지만 출처 검사는 통과했다.
    expect(response.status).toBe(401);
  });
});

describe('변경 요청의 본문 형식', () => {
  it('JSON이 아닌 본문은 415 UNSUPPORTED_MEDIA_TYPE이다', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .set('Origin', STORE_ORIGIN)
      .type('form')
      .send('email=nobody@example.com&password=password1!&rememberMe=true');

    expect(response.status).toBe(415);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Unsupported Media Type',
      status: 415,
      detail: '요청 본문은 application/json이어야 합니다.',
      code: 'UNSUPPORTED_MEDIA_TYPE',
    });
  });

  it('본문이 없는 변경 요청은 Content-Type을 보지 않는다', async () => {
    const response = await signOut().set('Origin', STORE_ORIGIN);

    expect(response.status).toBe(204);
  });
});

describe('CORS', () => {
  function preflight(origin: string) {
    return request(app.getHttpServer())
      .options('/auth/sign-in')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
  }

  it.each([STORE_ORIGIN, ADMIN_ORIGIN])(
    '%s의 preflight에 credentials를 허용하는 헤더를 보낸다',
    async (origin) => {
      const response = await preflight(origin);

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      // 출처마다 다른 Access-Control-Allow-Origin을 돌려주므로, 캐시가 출처별로 응답을 나눠 저장하도록 Vary: Origin이 필요하다.
      // 이 헤더는 우리 코드가 아니라 cors 패키지가 origin에 문자열을 넘기면 붙여 준다.
      expect(response.headers['vary']).toMatch(/Origin/);
    },
  );

  it('다른 출처의 preflight에는 CORS 헤더를 보내지 않는다', async () => {
    const response = await preflight('https://evil.example.com');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });

  it('스토어 출처의 일반 요청에도 CORS 헤더를 보낸다', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/session')
      .set('Origin', STORE_ORIGIN);

    expect(response.headers['access-control-allow-origin']).toBe(STORE_ORIGIN);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
