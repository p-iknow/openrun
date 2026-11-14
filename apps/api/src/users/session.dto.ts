import { ApiProperty } from '@nestjs/swagger';

export class SessionUserDto {
  @ApiProperty({ type: 'integer', description: '사용자 ID' })
  id: number;

  @ApiProperty({ type: String, description: '이메일' })
  email: string;

  @ApiProperty({ type: String, description: '이름' })
  name: string;

  @ApiProperty({ type: Boolean, description: '이메일 인증을 마쳤는지' })
  emailVerified: boolean;
}

// 현재 세션. 로그인 직후 무엇을 보여 줄지 정하는 값을 모아 둔다.
export class SessionDto {
  @ApiProperty({ type: SessionUserDto, description: '로그인한 사용자' })
  user: SessionUserDto;
}
