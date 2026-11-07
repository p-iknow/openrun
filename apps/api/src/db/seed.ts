import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readEnv } from '../config/env.js';
import { shows } from './schema/shows.js';

// 임시 시드다. 1.3에서 Faker 시드로 교체한다.
// 매번 비우고 같은 id부터 다시 넣으므로 여러 번 실행해도 결과가 같다.
const db = drizzle(readEnv().databaseUrl);

try {
  await db.transaction(async (tx) => {
    await tx.execute(sql`TRUNCATE ${shows} RESTART IDENTITY`);
    await tx
      .insert(shows)
      .values([{ title: '레미제라블' }, { title: '오페라의 유령' }]);
  });
  console.log('공연 2개를 넣었습니다.');
} finally {
  await db.$client.end();
}
