import { ApiProperty } from '@nestjs/swagger';
import { GENRES, type Genre } from '../db/schema/shows.js';
import {
  PERFORMANCE_SALES_STATUSES,
  type PerformanceSalesStatus,
} from './performance-sales-status.js';
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

export class VenueDto {
  @ApiProperty({ type: 'integer', description: '공연장 ID' })
  id: number;

  @ApiProperty({ type: String, description: '공연장 이름' })
  name: string;
}

export class PerformanceDto {
  @ApiProperty({ type: 'integer', description: '회차 ID' })
  id: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '회차 시작 일시',
  })
  startsAt: string;

  @ApiProperty({
    enum: PERFORMANCE_SALES_STATUSES,
    enumName: 'PerformanceSalesStatus',
    description:
      '판매 상태. 회차 취소, 판매 종료(시작됨), 판매 예정(판매 오픈 전), 매진(남은 좌석 0), 판매 중 순으로 먼저 맞는 것이다. 상세에는 시작 전 회차만 오므로 판매 종료는 오지 않는다.',
  })
  salesStatus: PerformanceSalesStatus;

  @ApiProperty({ type: 'integer', description: '남은 회차 좌석 수' })
  remainingSeats: number;

  @ApiProperty({ type: 'integer', description: '전체 회차 좌석 수' })
  totalSeats: number;

  @ApiProperty({
    type: Boolean,
    description:
      '매진 임박 여부. 판매 중이면서 남은 좌석이 전체의 10% 이하일 때 true다.',
  })
  isAlmostSoldOut: boolean;
}

export class ShowDetailImageDto {
  @ApiProperty({
    type: String,
    format: 'uri',
    description: '상세 이미지의 완전한 URL',
  })
  url: string;
}

export class ShowDetailDto {
  @ApiProperty({ type: 'integer', description: '공연 ID' })
  id: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  title: string;

  @ApiProperty({ enum: GENRES, enumName: 'Genre', description: '장르' })
  genre: Genre;

  @ApiProperty({
    type: 'integer',
    description: '관람할 수 있는 최소 나이(만 나이). 0이면 전체 관람가다.',
  })
  minAge: number;

  @ApiProperty({ type: 'integer', description: '러닝타임(분)' })
  runningMinutes: number;

  @ApiProperty({
    type: String,
    description:
      '공연 소개 본문. 상세 이미지에 담긴 소개를 글로 옮긴 것으로, 화면에는 이미지를 보이고 화면 낭독기에는 이 글을 읽힌다.',
  })
  description: string;

  @ApiProperty({
    type: String,
    format: 'uri',
    description: '3:4 포스터 이미지의 완전한 URL',
  })
  posterUrl: string;

  @ApiProperty({ type: VenueDto, description: '공연장' })
  venue: VenueDto;

  @ApiProperty({ type: ShowPeriodDto, description: '공연 기간' })
  period: ShowPeriodDto;

  @ApiProperty({
    enum: SHOW_SALES_STATUSES,
    enumName: 'ShowSalesStatus',
    description:
      '공연 판매 상태. 판매 종료면 모든 회차가 끝났거나 취소됐다는 뜻이다.',
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
    type: [ShowDetailImageDto],
    description:
      '공연 소개를 담은 세로로 긴 이미지들. 보여 줄 순서대로 담는다.',
  })
  detailImages: ShowDetailImageDto[];

  @ApiProperty({
    type: [PerformanceDto],
    description:
      '시작 전 회차를 시작 일시 순으로 담는다. 시작된 회차(판매 종료)는 넣지 않는다.',
  })
  performances: PerformanceDto[];
}
