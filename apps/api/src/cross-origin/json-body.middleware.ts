import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ProblemException } from '../problem-details/problem.exception.js';
import { isSafeMethod } from './request-kind.js';

/**
 * 본문이 있는 변경 요청은 application/json만 받는다.
 * 폼 제출처럼 preflight 없이 다른 사이트에서 보낼 수 있는 형식(text/plain, form-urlencoded, multipart)을 막아
 * Origin 검사와 SameSite=Lax 쿠키 위에 한 겹을 더한다(ADR 0009).
 */
@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    if (
      !isSafeMethod(request) &&
      hasBody(request) &&
      !request.is('application/json')
    ) {
      throw new ProblemException({
        status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        code: 'UNSUPPORTED_MEDIA_TYPE',
        detail: '요청 본문은 application/json이어야 합니다.',
      });
    }
    next();
  }
}

// Content-Length: 0인 요청(본문 없는 fetch POST)은 Content-Type이 없어도 받는다.
// request.is()는 Content-Length 헤더만 있으면 0이어도 본문이 있다고 보므로 따로 확인한다.
function hasBody(request: Request): boolean {
  const contentLength = request.get('content-length');
  return (
    request.get('transfer-encoding') !== undefined ||
    (contentLength !== undefined && contentLength !== '0')
  );
}
