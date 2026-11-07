import { Inject, Injectable } from '@nestjs/common';
import { asc } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module.js';
import { shows } from '../db/schema/shows.js';

@Injectable()
export class ShowsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findAll() {
    return this.db
      .select({ id: shows.id, title: shows.title })
      .from(shows)
      .orderBy(asc(shows.id));
  }
}
