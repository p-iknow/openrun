import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
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
import { shows } from '../src/db/schema/shows.js';

describe('GET /shows', () => {
  const db = drizzle(inject('databaseUrl'));
  let app: INestApplication<App>;

  beforeAll(() => {
    vi.stubEnv('DATABASE_URL', inject('databaseUrl'));
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await db.$client.end();
  });

  beforeEach(async () => {
    await db.execute('TRUNCATE shows RESTART IDENTITY');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('공연이 없으면 빈 목록을 돌려준다', async () => {
    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('저장된 공연의 id와 title을 돌려준다', async () => {
    await db
      .insert(shows)
      .values([{ title: '레미제라블' }, { title: '오페라의 유령' }]);

    const response = await request(app.getHttpServer()).get('/shows');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, title: '레미제라블' },
      { id: 2, title: '오페라의 유령' },
    ]);
  });
});
