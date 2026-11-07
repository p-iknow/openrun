import { Module } from '@nestjs/common';
import { ShowsModule } from './shows/shows.module.js';

@Module({
  imports: [ShowsModule],
})
export class AppModule {}
