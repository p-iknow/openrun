import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module.js';
import { ShowsModule } from './shows/shows.module.js';

@Module({
  imports: [DatabaseModule, ShowsModule],
})
export class AppModule {}
