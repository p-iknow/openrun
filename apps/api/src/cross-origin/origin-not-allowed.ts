import { HttpStatus } from '@nestjs/common';
import { ProblemException } from '../problem-details/problem.exception.js';

// 일반 CSRF(OriginCheckMiddleware)와 로그인 CSRF(LoginCsrfMiddleware)가 같은 응답으로 막는다.
export function createOriginNotAllowedException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.FORBIDDEN,
    code: 'ORIGIN_NOT_ALLOWED',
    detail: '허용하지 않은 출처의 요청입니다.',
  });
}
