import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ProblemDetailsDto } from './problem-details.dto.js';
import { ProblemException } from './problem.exception.js';

// 어디서 난 오류든(없는 경로, 검증 실패, 예상하지 못한 오류) RFC 9457 Problem Details로 보낸다(ADR 0007).
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const problem = toProblem(exception);
    if (problem.status >= 500) {
      // 응답에는 내부 메시지를 싣지 않으므로, 원인은 서버 로그에서만 볼 수 있다.
      this.logger.error(exception);
    }

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(problem.status)
      .type('application/problem+json')
      .json(problem);
  }
}

function toProblem(exception: unknown): ProblemDetailsDto {
  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  // Nest가 던지는 HttpException에는 앱 오류 코드가 없으므로 상태 이름(NOT_FOUND 등)을 코드로 쓴다.
  const code =
    exception instanceof ProblemException
      ? exception.code
      : (HttpStatus[status] ?? 'HTTP_ERROR');
  // 5xx의 메시지에는 DB 주소 같은 내부 정보가 담길 수 있어 고정 문구로 바꾼다.
  const detail =
    exception instanceof HttpException && status < 500
      ? exception.message
      : '서버에서 요청을 처리하지 못했습니다.';
  const errors =
    exception instanceof ProblemException ? exception.errors : undefined;

  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    detail,
    code,
    ...(errors && { errors }),
  };
}
