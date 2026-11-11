import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { GENRES, type Genre } from '../db/schema/shows.js';
import {
  SHOW_SALES_STATUSES,
  type ShowSalesStatus,
} from './show-sales-status.js';

export const DEFAULT_PAGE_SIZE = 20;
// 한 번에 너무 많은 행을 읽지 않게 막는다. 스토어는 20으로 고정해 쓴다.
export const MAX_PAGE_SIZE = 100;

const PAGE_MESSAGE = '1 이상의 정수여야 합니다.';
const SIZE_MESSAGE = `1 이상 ${MAX_PAGE_SIZE} 이하의 정수여야 합니다.`;

// 쿼리 문자열은 모두 글자로 오므로 @Type으로 숫자로 바꾼 뒤 검증한다. 숫자가 아니면 NaN이 되어 @IsInt에서 걸린다.
// class-validator는 아래 데코레이터부터 검사하므로, 어느 규칙에 걸려도 같은 문구가 나오게 필드마다 문구를 하나로 둔다.
export class ShowListQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    // JS가 정확히 다루는 정수까지만 받는다. offset도 PostgreSQL bigint 범위 안에 머문다.
    maximum: Number.MAX_SAFE_INTEGER,
    default: 1,
    description:
      '페이지 번호(1부터). 마지막 페이지를 넘으면 오류가 아니라 빈 items로 응답한다.',
  })
  @Type(() => Number)
  @IsInt({ message: PAGE_MESSAGE })
  @Min(1, { message: PAGE_MESSAGE })
  @Max(Number.MAX_SAFE_INTEGER, { message: PAGE_MESSAGE })
  page: number = 1;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    description: '페이지 크기',
  })
  @Type(() => Number)
  @IsInt({ message: SIZE_MESSAGE })
  @Min(1, { message: SIZE_MESSAGE })
  @Max(MAX_PAGE_SIZE, { message: SIZE_MESSAGE })
  size: number = DEFAULT_PAGE_SIZE;
}

export class ShowPeriodDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '첫 회차의 시작 일시',
  })
  start: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '마지막 회차의 시작 일시',
  })
  end: string;
}

export class ShowSummaryDto {
  @ApiProperty({ type: 'integer', description: '공연 ID' })
  id: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  title: string;

  @ApiProperty({ enum: GENRES, enumName: 'Genre', description: '장르' })
  genre: Genre;

  @ApiProperty({ type: String, description: '공연장 이름' })
  venueName: string;

  @ApiProperty({ type: ShowPeriodDto, description: '공연 기간' })
  period: ShowPeriodDto;

  @ApiProperty({
    enum: SHOW_SALES_STATUSES,
    enumName: 'ShowSalesStatus',
    description:
      '공연 판매 상태. 회차마다 판매 중, 판매 예정, 판매 종료 중 하나로 센 뒤 가장 앞선 것을 고른다. 매진인 회차는 판매 중, 취소된 회차는 판매 종료로 센다.',
  })
  salesStatus: ShowSalesStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      '판매 예정일 때 가장 이른 판매 오픈 일시. 판매 예정이 아니면 null이다.',
  })
  salesOpenAt: string | null;

  @ApiProperty({
    type: String,
    format: 'uri',
    description: '3:4 포스터 이미지의 완전한 URL',
  })
  posterUrl: string;
}

export class ShowPageDto {
  @ApiProperty({ type: [ShowSummaryDto] })
  items: ShowSummaryDto[];

  @ApiProperty({ type: 'integer', description: '현재 페이지(1부터)' })
  page: number;

  @ApiProperty({ type: 'integer', description: '페이지 크기' })
  size: number;

  @ApiProperty({ type: 'integer', description: '조건에 맞는 전체 공연 수' })
  totalCount: number;

  @ApiProperty({
    type: 'integer',
    description: '전체 페이지 수. 공연이 없으면 0이다.',
  })
  totalPages: number;
}
