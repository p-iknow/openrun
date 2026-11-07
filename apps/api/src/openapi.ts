import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module.js';

// preview 모드는 프로바이더를 만들지 않으므로 DB 연결 정보 없이 라우트 메타데이터만 읽는다.
export async function createOpenApiDocument(): Promise<OpenAPIObject> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  try {
    const config = new DocumentBuilder()
      .setTitle('openrun API')
      .setVersion('0.0.0')
      .build();
    return SwaggerModule.createDocument(app, config);
  } finally {
    await app.close();
  }
}
