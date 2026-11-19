import { HttpStatus, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { ProblemException } from '../problem-details/problem.exception.js';
import { isSafeMethod } from './request-kind.js';

/**
 * 본문이 있는 변경 요청은 application/json만 받는다.
 * 폼 제출처럼 preflight 없이 다른 사이트에서 보낼 수 있는 형식(text/plain, form-urlencoded, multipart)을 막아
 * Origin 검사, SameSite=Lax 쿠키와 함께 CSRF를 막는다(ADR 0009).
 */
@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    if (
      !isSafeMethod(request) &&
      hasBody(request) &&
      // 문자열 비교가 아니라 request.is()로 본다. `application/json; charset=utf-8`처럼 매개변수가 붙어도 같은 JSON이다.
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

// 형식을 따질 본문이 있는지. 본문 없는 변경 요청(예: 로그아웃)은 Content-Type이 없으니 형식을 보지 않고 받는다.
// 브라우저는 본문 없는 POST에 Content-Length: 0을 붙이므로 길이가 0이면 본문이 없는 것으로 본다.
// request.is()로는 이 확인을 대신할 수 없다. 본문이 없으면 null을, Content-Length: 0이면 false를 돌려줘 둘 다 415가 된다.
function hasBody(request: Request): boolean {
  const contentLength = request.get('content-length');
  return (
    // 길이를 미리 알리지 않고 조각으로 보내는 본문(chunked)
    request.get('transfer-encoding') !== undefined ||
    // 길이가 0보다 큰 본문
    (contentLength !== undefined && contentLength !== '0')
  );
}
