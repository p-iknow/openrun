import { Global, Injectable, Module } from '@nestjs/common';

// 현재 시각을 돌려준다. 판매 상태처럼 시각에 따라 달라지는 값은 DB의 now() 대신 이 값을 SQL 파라미터로 넘겨 계산한다.
// 추상 클래스를 주입 토큰으로 써서, 테스트는 overrideProvider(Clock)로 고정 시각을 끼운다.
export abstract class Clock {
  abstract now(): Date;
}

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

@Global()
@Module({
  providers: [{ provide: Clock, useClass: SystemClock }],
  exports: [Clock],
})
export class ClockModule {}
