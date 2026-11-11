import { HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';
import type { FieldErrorDto } from './problem-details.dto.js';
import { ProblemException } from './problem.exception.js';

// @Query({ schema })처럼 매개변수에 붙인 스키마(zod 등 Standard Schema)로 요청 값을 검증한다.
// 실패하면 필드별 오류를 담은 400 Problem Details로 보낸다(ADR 0007). 스키마가 없는 매개변수는 건너뛴다.
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) => {
      // 한 필드가 여러 규칙에 걸릴 수 있어 필드마다 처음 걸린 것 하나만 남긴다.
      const errors = new Map<string, FieldErrorDto>();
      for (const issue of issues) {
        const field = (issue.path ?? [])
          .map((segment) =>
            typeof segment === 'object' ? String(segment.key) : String(segment),
          )
          .join('.');
        if (!errors.has(field)) {
          errors.set(field, { field, detail: issue.message });
        }
      }
      return new ProblemException({
        status: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_FAILED',
        detail: '요청 값이 올바르지 않습니다.',
        errors: [...errors.values()],
      });
    },
  });
}
