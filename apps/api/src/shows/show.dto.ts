import { ApiProperty } from '@nestjs/swagger';
import { GENRES, type Genre } from '../db/schema/shows.js';

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
