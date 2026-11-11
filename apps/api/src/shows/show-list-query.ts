import { z } from 'zod';

const DEFAULT_PAGE_SIZE = 20;
// 한 번에 너무 많은 행을 읽지 않게 막는다. 스토어는 20으로 고정해 쓴다.
const MAX_PAGE_SIZE = 100;

export const SHOW_SORTS = ['start_date', 'newest'] as const;
export type ShowSort = (typeof SHOW_SORTS)[number];

const PAGE_MESSAGE = '1 이상의 정수여야 합니다.';
const SIZE_MESSAGE = `1 이상 ${MAX_PAGE_SIZE} 이하의 정수여야 합니다.`;

const MAX_QUERY_LENGTH = 50;
const Q_MESSAGE = `앞뒤 공백을 빼고 ${MAX_QUERY_LENGTH}자 이하의 글자여야 합니다.`;

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
  // 앞뒤 공백을 지운 뒤 길이를 잰다. 빈 값은 검색하지 않는 것으로 보고 서비스가 건너뛴다.
  q: z
    .string(Q_MESSAGE)
    .trim()
    .max(MAX_QUERY_LENGTH, Q_MESSAGE)
    .optional()
    .meta({
      description: `공연 제목 검색어. 앞뒤 공백을 지우고, 빈 값이면 검색하지 않는다. 대소문자를 구분하지 않는 부분 일치이며 %, _, \\도 글자 그대로 찾는다. 최대 ${MAX_QUERY_LENGTH}자.`,
    }),
  sort: z
    .enum(SHOW_SORTS, `${SHOW_SORTS.join(', ')} 중 하나여야 합니다.`)
    .default('start_date')
    .meta({
      description:
        '정렬. start_date는 첫 회차 일시가 이른 순(기본), newest는 등록 일시가 늦은 순이다. 정렬값이 같으면 id로 순서를 고정한다.',
    }),
});

export type ShowListQuery = z.infer<typeof showListQuerySchema>;
