import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module.js';
import { sessions } from '../db/schema/users.js';
import type { SessionStore, StoredSession } from '../auth/session-manager.js';
import { Clock } from '../clock/clock.module.js';

// 사용자 세션 테이블(sessions)을 읽고 쓴다. 세션의 규칙은 인증 모듈의 SessionManager가 정한다.
@Injectable()
export class UserSessionStore implements SessionStore {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  async create({
    subjectId,
    ...session
  }: Parameters<SessionStore['create']>[0]): Promise<void> {
    const now = this.clock.now();
    await this.db.insert(sessions).values({
      ...session,
      userId: subjectId,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const [session] = await this.db
      .select({
        id: sessions.id,
        subjectId: sessions.userId,
        expiresAt: sessions.expiresAt,
        rememberMe: sessions.rememberMe,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash));
    return session ?? null;
  }

  async extend({
    id,
    expiresAt,
  }: {
    id: number;
    expiresAt: Date;
  }): Promise<boolean> {
    const updated = await this.db
      .update(sessions)
      .set({ expiresAt, updatedAt: this.clock.now() })
      .where(eq(sessions.id, id))
      .returning({ id: sessions.id });
    return updated.length > 0;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }
}
