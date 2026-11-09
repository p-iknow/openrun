import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty({ type: String, description: '잘못된 값의 이름' })
  field: string;

  @ApiProperty({ type: String, description: '잘못된 이유' })
  detail: string;
}

// RFC 9457 Problem Details에 앱 오류 코드와 필드별 오류를 더한 형식(ADR 0007).
export class ProblemDetailsDto {
  @ApiProperty({
    type: String,
    description: '오류 종류 URI',
    example: 'about:blank',
  })
  type: string;

  @ApiProperty({
    type: String,
    description: 'HTTP 상태 문구',
    example: 'Not Found',
  })
  title: string;

  @ApiProperty({ type: 'integer', description: 'HTTP 상태 코드', example: 404 })
  status: number;

  @ApiProperty({ type: String, description: '사람이 읽는 설명' })
  detail: string;

  @ApiProperty({
    type: String,
    description:
      '앱 오류 코드. 클라이언트는 문구 대신 이 값으로 오류를 구분한다.',
    example: 'NOT_FOUND',
  })
  code: string;

  @ApiPropertyOptional({
    type: [FieldErrorDto],
    description: '검증 오류일 때 필드별 오류',
  })
  errors?: FieldErrorDto[];
}
