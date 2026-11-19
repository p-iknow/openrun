import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { AllowedOrigins } from './allowed-origins.js';
import { CorsMiddleware } from './cors.middleware.js';
import { JsonBodyMiddleware } from './json-body.middleware.js';
import { LoginCsrfMiddleware } from './login-csrf.middleware.js';
import { OriginCheckMiddleware } from './origin-check.middleware.js';

// 다른 출처에서 오는 요청의 규칙(CORS, 일반 CSRF와 로그인 CSRF의 출처 검사, JSON 본문)을 모든 경로에 붙인다.
// main.ts의 enableCors가 아니라 미들웨어로 두어야 main.ts를 거치지 않는 테스트 앱에도 같이 붙는다.
@Module({
  providers: [AllowedOrigins],
})
export class CrossOriginModule implements NestModule {
  // 순서가 중요하다. preflight는 CORS가 먼저 응답하고, 출처를 확인한 뒤에 본문 형식을 본다.
  // '{*splat}'는 루트(/)까지 포함한 모든 경로다. Nest 미들웨어는 컨트롤러에 없는 경로에는 붙지 않는다.
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        CorsMiddleware,
        OriginCheckMiddleware,
        LoginCsrfMiddleware,
        JsonBodyMiddleware,
      )
      .forRoutes('{*splat}');
  }
}
