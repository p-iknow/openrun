import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { DATABASE, type Database } from '../db/database.module.js';
import { accounts, users } from '../db/schema/users.js';
import { createInvalidCredentialsException } from './invalid-credentials.js';
import type { SessionUserDto } from './session.dto.js';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** 이메일 로그인 계정의 비밀번호를 확인하고 사용자 id를 돌려준다. 틀리면 401 INVALID_CREDENTIALS다. */
  async verifyCredentials({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<number> {
    const [account] = await this.db
      .select({ userId: accounts.userId, passwordHash: accounts.passwordHash })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(and(eq(users.email, email), eq(accounts.provider, 'credential')));

    if (!account?.passwordHash) {
      // 비밀번호 해시는 수십 ms가 걸린다. 없는 이메일에서도 한 번 계산해 응답 시간으로 가입 여부를 알 수 없게 한다(Better Auth와 같음).
      await hashPassword(password);
      throw createInvalidCredentialsException();
    }
    const matches = await verifyPassword({
      password,
      hash: account.passwordHash,
    });
    if (!matches) {
      throw createInvalidCredentialsException();
    }
    return account.userId;
  }

  /** 세션 응답에 담을 사용자. 세션이 가리키는 사용자이므로 늘 있다. */
  async findSessionUser(userId: number): Promise<SessionUserDto> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.id, userId));
    // 탈퇴(1.8)하면 이메일을 지우지만 세션도 함께 지우므로, 세션이 있는 사용자는 이메일이 있다.
    if (!user?.email) {
      throw new Error(`세션의 사용자를 찾지 못했습니다: ${userId}`);
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerifiedAt !== null,
    };
  }
}
