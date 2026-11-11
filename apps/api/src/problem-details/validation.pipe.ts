import {
  HttpStatus,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';
import { ProblemException } from './problem.exception.js';

// DTO의 class-validator 규칙으로 요청 값을 검증하고, 실패하면 필드별 오류를 담은 400 Problem Details로 보낸다(ADR 0007).
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    // DTO의 @Type과 기본값을 적용한 인스턴스를 핸들러에 넘긴다.
    transform: true,
    // DTO에 없는 쿼리 값은 오류로 보지 않고 버린다.
    whitelist: true,
    // 필드마다 처음 걸린 규칙 하나만 남겨 필드별 오류를 하나로 둔다.
    stopAtFirstError: true,
    exceptionFactory: (errors: ValidationError[]) =>
      new ProblemException({
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        detail: '요청 값이 올바르지 않습니다.',
        // 쿼리 DTO는 중첩 객체가 없으므로 최상위 필드의 오류만 옮긴다.
        errors: errors.map((error) => ({
          field: error.property,
          detail: Object.values(error.constraints ?? {})[0] ?? '',
        })),
      }),
  });
}
