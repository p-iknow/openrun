import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ClockModule } from './clock/clock.module.js';
import { DatabaseModule } from './db/database.module.js';
import { ProblemDetailsFilter } from './problem-details/problem-details.filter.js';
import { ShowsModule } from './shows/shows.module.js';
import { VenuesModule } from './venues/venues.module.js';

@Module({
  imports: [ClockModule, DatabaseModule, VenuesModule, ShowsModule],
  // APP_FILTER로 등록해야 main.ts를 거치지 않는 테스트 앱에도 같은 처리가 붙는다.
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class AppModule {}
