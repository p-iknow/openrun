import { HttpStatus } from '@nestjs/common';
import { ProblemException } from '../problem-details/problem.exception.js';

// shows.id는 PostgreSQL integer다. 이 범위를 넘는 값을 쿼리에 넘기면 DB가 오류를 낸다.
const MAX_SHOW_ID = 2_147_483_647;

export function createShowNotFoundException(): ProblemException {
  return new ProblemException({
    status: HttpStatus.NOT_FOUND,
    code: 'SHOW_NOT_FOUND',
    detail: '공연을 찾을 수 없습니다.',
  });
}

// 경로의 id를 공연 id로 바꾼다. 양의 정수가 아니면 그런 공연은 있을 수 없으므로 400이 아니라 404로 응답한다.
export function parseShowId(value: string): number {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > MAX_SHOW_ID) {
    throw createShowNotFoundException();
  }
  return Number(value);
}
