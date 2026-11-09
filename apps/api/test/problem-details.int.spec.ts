import {
  Controller,
  Get,
  HttpStatus,
  type INestApplication,
} from '@nestjs/common';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  inject,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ProblemException } from '../src/problem-details/problem.exception.js';
import { ShowsService } from '../src/shows/shows.service.js';

// 검증하는 엔드포인트가 아직 없어서, 앱 예외를 던지는 테스트용 경로를 붙인다.
@Controller('test-problems')
class ProblemThrowingController {
  @Get('validation')
  failValidation(): never {
    throw new ProblemException({
      status: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_FAILED',
      detail: '요청 값이 올바르지 않습니다.',
      errors: [{ field: 'page', detail: '1 이상의 정수여야 합니다.' }],
    });
  }

  @Get('unavailable')
  failUnavailable(): never {
    throw new ProblemException({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'PAYMENT_GATEWAY_DOWN',
      detail: 'pg-internal:8443 timeout',
    });
  }
}

describe('오류 응답', () => {
  let app: INestApplication<App>;

  async function startApp(
    configure: (builder: TestingModuleBuilder) => TestingModuleBuilder = (
      builder,
    ) => builder,
  ) {
    const moduleRef = await configure(
      Test.createTestingModule({
        imports: [AppModule],
        controllers: [ProblemThrowingController],
      }),
    ).compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  }

  beforeAll(() => {
    vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  afterEach(async () => {
    await app.close();
  });

  it('없는 경로는 404 Problem Details로 응답한다', async () => {
    await startApp();

    const response = await request(app.getHttpServer()).get('/no-such-path');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/,
    );
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Cannot GET /no-such-path',
      code: 'NOT_FOUND',
    });
  });

  it('예상하지 못한 오류는 내부 메시지를 숨긴 500 Problem Details로 응답한다', async () => {
    await startApp((builder) =>
      builder.overrideProvider(ShowsService).useValue({
        findAll: () => {
          throw new Error('connection to db-internal:5432 refused');
        },
      }),
    );

    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/,
    );
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: '서버에서 요청을 처리하지 못했습니다.',
      code: 'INTERNAL_SERVER_ERROR',
    });
    expect(response.text).not.toContain('db-internal');
  });

  it('앱 예외는 앱 오류 코드와 필드별 오류를 담아 응답한다', async () => {
    await startApp();

    const response = await request(app.getHttpServer()).get(
      '/test-problems/validation',
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: '요청 값이 올바르지 않습니다.',
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'page', detail: '1 이상의 정수여야 합니다.' }],
    });
  });

  it('5xx 앱 예외는 앱 오류 코드는 싣고 설명은 숨긴다', async () => {
    await startApp();

    const response = await request(app.getHttpServer()).get(
      '/test-problems/unavailable',
    );

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      code: 'PAYMENT_GATEWAY_DOWN',
      detail: '서버에서 요청을 처리하지 못했습니다.',
    });
    expect(response.text).not.toContain('pg-internal');
  });
});
