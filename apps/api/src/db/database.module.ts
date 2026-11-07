import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { readEnv } from '../config/env.js';

export const DATABASE = Symbol('DATABASE');
// drizzle()이 안에서 만든 pg Pool은 $client로 꺼낼 수 있다.
export type Database = NodePgDatabase & { $client: Pool };

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => drizzle(readEnv().databaseUrl),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async onApplicationShutdown() {
    await this.db.$client.end();
  }
}
