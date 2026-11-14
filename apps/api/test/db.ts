import { drizzle } from 'drizzle-orm/node-postgres';
import { inject } from 'vitest';

// 통합 테스트가 함께 쓰는 DB 연결. globalSetup(setup/postgres.ts)이 띄운 컨테이너에 붙는다.
export const db = drizzle(inject('databaseUrl'));
