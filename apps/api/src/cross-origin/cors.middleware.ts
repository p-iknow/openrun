import { Injectable, type NestMiddleware } from '@nestjs/common';
import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import { AllowedOrigins } from './allowed-origins.js';

/**
 * 스토어와 어드민 출처만 쿠키를 실어(credentials) API를 부를 수 있게 한다.
 * 경로별로 어느 출처가 변경 요청을 보낼 수 있는지는 OriginCheckMiddleware가 따로 막으므로, 여기서는 두 출처 모두에 허용한다.
 * 다른 출처에는 CORS 헤더를 보내지 않아 브라우저가 응답을 읽지 못하게 한다.
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<typeof cors>;

  constructor(allowedOrigins: AllowedOrigins) {
    const origins = new Set([allowedOrigins.store, allowedOrigins.admin]);
    // 옵션을 고정하면 cors는 출처와 상관없이 Access-Control-Allow-Credentials를 붙이므로, 요청마다 옵션을 고른다.
    // origin: false면 아무 CORS 헤더도 붙이지 않고 다음으로 넘긴다.
    this.handler = cors((request, callback) => {
      const origin = request.headers.origin;
      callback(
        null,
        origin && origins.has(origin)
          ? { origin, credentials: true }
          : { origin: false },
      );
    });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    this.handler(request, response, next);
  }
}
