import { ApiProperty } from '@nestjs/swagger';

export class ShowDto {
  @ApiProperty({ type: 'integer', description: '공연 ID' })
  id: number;

  @ApiProperty({ type: String, description: '공연 제목' })
  title: string;
}
