import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

// 스토어에 가입한 사람이다. 운영자는 이 테이블이 아니라 따로 둔다(ADR 0010).
export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // 소문자로 정규화해 넣는다. 탈퇴(1.8)하면 지우므로 NULL을 허용한다.
  // PostgreSQL의 UNIQUE는 NULL끼리 겹치는 것으로 보지 않으므로, 유니크는 이메일이 있는 행에만 걸린다.
  email: text().unique(),
  name: text().notNull(),
  // 이메일 인증을 마친 일시다. NULL이면 인증하지 않았다.
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// 로그인 수단의 제공자다. 1.4b에서 google, kakao를 더한다.
export const ACCOUNT_PROVIDERS = ['credential'] as const;
export type AccountProvider = (typeof ACCOUNT_PROVIDERS)[number];

export const accountProvider = pgEnum('account_provider', ACCOUNT_PROVIDERS);

// 사용자의 로그인 수단 하나다(Better Auth의 account 테이블). 이메일 로그인 계정(credential)이 비밀번호 해시를 갖는다.
// 사용자 테이블에 비밀번호를 두지 않아, 소셜 로그인만 쓰는 사용자도 같은 모양이 된다.
export const accounts = pgTable(
  'accounts',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: accountProvider().notNull(),
    // 제공자 안에서 이 계정을 가리키는 값이다. 이메일 로그인 계정은 Better Auth처럼 사용자 id를 넣는다.
    providerAccountId: text('provider_account_id').notNull(),
    // scrypt 해시(`솔트:키`, hex)다. 이메일 로그인 계정에만 있다.
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // 같은 제공자의 같은 계정이 두 사용자에게 연결되지 않게 막는다.
    unique().on(table.provider, table.providerAccountId),
    index().on(table.userId),
  ],
);

// 사용자의 로그인 세션이다(ADR 0009). 쿠키의 토큰 원문은 저장하지 않고 SHA-256 해시만 둔다.
export const sessions = pgTable(
  'sessions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    tokenHash: text('token_hash').notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // 로그인 상태 유지를 골랐는지다. 켜면 7일 동안 유지하며 연장하고, 끄면 1일 뒤 끝나며 연장하지 않는다.
    rememberMe: boolean('remember_me').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.userId)],
);
