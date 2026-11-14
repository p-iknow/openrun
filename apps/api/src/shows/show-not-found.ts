import { HttpStatus } from '@nestjs/common';
import { ProblemException } from '../problem-details/problem.exception.js';

// 없는 공연, 있을 수 없는 id, 회차가 없는 공연에 같은 404를 보낸다. 스토어는 code로 없는 공연을 알아본다.
export function createShowNotFoundException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.NOT_FOUND,
    code: 'SHOW_NOT_FOUND',
    detail: '공연을 찾을 수 없습니다.',
  });
}
