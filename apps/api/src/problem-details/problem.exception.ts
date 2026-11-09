import { HttpException } from '@nestjs/common';
import type { FieldErrorDto } from './problem-details.dto.js';

// 앱이 직접 던지는 오류. 앱 오류 코드(code)와 검증 오류의 필드별 오류(errors)를 응답에 싣는다.
export class ProblemException extends HttpException {
  readonly code: string;
  readonly errors?: FieldErrorDto[];

  constructor(options: {
    status: number;
    code: string;
    detail: string;
    errors?: FieldErrorDto[];
  }) {
    super(options.detail, options.status);
    this.code = options.code;
    this.errors = options.errors;
  }
}
