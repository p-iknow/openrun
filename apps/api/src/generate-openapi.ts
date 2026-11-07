import { writeFile } from 'node:fs/promises';
import { createOpenApiDocument } from './openapi.js';

// tsx(esbuild)는 데코레이터 메타데이터를 만들지 않으므로, tsc로 빌드한 dist에서 실행한다.
const document = await createOpenApiDocument();
const output = new URL('../openapi.json', import.meta.url);
await writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
