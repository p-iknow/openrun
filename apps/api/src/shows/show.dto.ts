import { ApiProperty } from '@nestjs/swagger';
import { GENRES, type Genre } from '../db/schema/shows.js';
import {
  SHOW_SALES_STATUSES,
  type ShowSalesStatus,
} from './show-sales-status.js';

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
