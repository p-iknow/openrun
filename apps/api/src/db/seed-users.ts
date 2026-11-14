import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { hashPassword } from '../auth/password.js';
import { accounts, users } from './schema/users.js';

// 로컬에서 바로 로그인해 볼 데모 사용자다. 비밀번호는 README에 적는 고정값이다.
// 운영 데모용 값은 3단계 배포에서 운영 비밀값으로 정한다.
export const DEMO_USER = {
  email: 'demo@example.com',
  password: 'openrun1234!',
  name: '김데모',
};

/** 이메일을 인증한 데모 사용자와 이메일 로그인 계정을 넣는다. */
export async function insertDemoUser({
  db,
  now,
}: {
  db: NodePgDatabase;
  now: Date;
}): Promise<void> {
  const passwordHash = await hashPassword(DEMO_USER.password);
  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      emailVerifiedAt: now,
    })
    .returning({ id: users.id });
  if (!user) {
    throw new Error('데모 사용자를 넣지 못했습니다.');
  }
  await db.insert(accounts).values({
    userId: user.id,
    provider: 'credential',
    providerAccountId: String(user.id),
    passwordHash,
  });
}
