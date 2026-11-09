import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from './openapi.js';

describe('OpenAPI 문서', () => {
  it('DB 없이 만들 수 있고, GET /shows 응답을 공연 페이지로 적는다', async () => {
    const document = await createOpenApiDocument();

    expect(document.paths['/shows']?.get?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ShowPageDto' },
        },
      },
    });
  });

  it('모든 경로의 오류 응답을 Problem Details로 적는다', async () => {
    const document = await createOpenApiDocument();

    expect(document.paths['/shows']?.get?.responses.default).toMatchObject({
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/ProblemDetailsDto' },
        },
      },
    });
  });
});
