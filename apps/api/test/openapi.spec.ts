import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from '../src/openapi.js';

describe('OpenAPI 문서', () => {
  it('DB 없이 만들 수 있고, GET /shows 응답을 공연 배열로 적는다', async () => {
    const document = await createOpenApiDocument();

    expect(document.paths['/shows']?.get?.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: { $ref: '#/components/schemas/ShowDto' },
          },
        },
      },
    });
    expect(document.components?.schemas?.ShowDto).toEqual({
      type: 'object',
      properties: {
        id: { type: 'integer', description: '공연 ID' },
        title: { type: 'string', description: '공연 제목' },
      },
      required: ['id', 'title'],
    });
  });
});
