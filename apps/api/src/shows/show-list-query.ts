import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 20;
// 한 번에 너무 많은 행을 읽지 않게 막는다. 스토어는 20으로 고정해 쓴다.
const MAX_PAGE_SIZE = 100;

const PAGE_MESSAGE = '1 이상의 정수여야 합니다.';
const SIZE_MESSAGE = `1 이상 ${MAX_PAGE_SIZE} 이하의 정수여야 합니다.`;

// GET /shows의 쿼리. 이 스키마 하나에서 검증(StandardSchemaValidationPipe), OpenAPI 쿼리 파라미터, 타입이 모두 나온다.
// 쿼리 문자열은 모두 글자로 오므로 coerce로 숫자로 바꾼 뒤 검증한다. 숫자가 아니면 NaN이 되어 걸린다.
// 값이 없으면 default가 먼저 적용되어 coerce를 거치지 않는다. 스키마에 없는 쿼리는 z.object가 버린다.
export const showListQuerySchema = z.object({
  page: z.coerce
    .number(PAGE_MESSAGE)
    // zod의 int()는 JS가 정확히 다루는 정수(Number.MAX_SAFE_INTEGER)까지만 받는다. offset도 PostgreSQL bigint 범위 안에 머문다.
    .int(PAGE_MESSAGE)
    .min(1, PAGE_MESSAGE)
    .default(1)
    .meta({
      description:
        '페이지 번호(1부터). 마지막 페이지를 넘으면 오류가 아니라 빈 items로 응답한다.',
    }),
  size: z.coerce
    .number(SIZE_MESSAGE)
    .int(SIZE_MESSAGE)
    .min(1, SIZE_MESSAGE)
    .max(MAX_PAGE_SIZE, SIZE_MESSAGE)
    .default(DEFAULT_PAGE_SIZE)
    .meta({ description: '페이지 크기' }),
});

export type ShowListQuery = z.infer<typeof showListQuerySchema>;
