import { HttpStatus } from '@nestjs/common';
import { ProblemException } from '../problem-details/problem.exception.js';

// 로그인이 필요한데 세션이 없거나 만료됐다. 스토어는 code를 보고 로그인 화면으로 보낸다.
export function createAuthenticationRequiredException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.UNAUTHORIZED,
    code: 'AUTHENTICATION_REQUIRED',
    detail: '로그인이 필요합니다.',
  });
}
