import { ApiProperty } from '@nestjs/swagger';

// 로그인한 사용자. 로그인 응답, 현재 세션, 내 정보가 같은 모양으로 돌려준다.
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
