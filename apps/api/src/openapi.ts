import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  getSchemaPath,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ProblemDetailsDto } from './problem-details/problem-details.dto.js';

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
      // 전역 예외 필터가 모든 오류를 이 형식으로 보내므로, 경로마다 적지 않고 한 번에 붙인다.
      .addGlobalResponse({
        status: 'default',
        description: '오류(Problem Details)',
        content: {
          'application/problem+json': {
            schema: { $ref: getSchemaPath(ProblemDetailsDto) },
          },
        },
      })
      .build();
    return SwaggerModule.createDocument(app, config, {
      extraModels: [ProblemDetailsDto],
    });
  } finally {
    await app.close();
  }
}
