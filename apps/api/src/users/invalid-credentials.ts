import { HttpStatus } from '@nestjs/common';
import { ProblemException } from '../problem-details/problem.exception.js';

// 없는 이메일과 틀린 비밀번호에 같은 응답을 보내, 어느 쪽이 틀렸는지로 가입 여부를 알 수 없게 한다.
export function createInvalidCredentialsException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.UNAUTHORIZED,
    code: 'INVALID_CREDENTIALS',
    detail: '이메일 또는 비밀번호가 올바르지 않습니다.',
  });
}
