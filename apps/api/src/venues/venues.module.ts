import { Module } from '@nestjs/common';

// 공연장(venues 테이블)을 소유하는 모듈이다(ADR 0003). 공연장 쓰기는 아직 시드뿐이라 프로바이더가 없고,
// 공연 목록이 공연장 이름을 읽는 것은 읽기 전용 JOIN이라 shows 모듈에서 한다.
@Module({})
export class VenuesModule {}
