import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// 기본값 true는 부팅 오류에서 process.abort()를 호출한다. 오류를 던져 메시지와 함께 종료하게 한다.
const app = await NestFactory.create(AppModule, { abortOnError: false });
await app.listen(3000);
