export interface Env {
  databaseUrl: string;
  /** 포스터 키 앞에 붙여 포스터의 완전한 URL을 만드는 주소. 예: `http://localhost:3001/posters` */
  posterBaseUrl: string;
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    databaseUrl: required(source, { name: 'DATABASE_URL' }),
    posterBaseUrl: required(source, { name: 'POSTER_BASE_URL' }),
  };
}

function required(
  source: NodeJS.ProcessEnv,
  { name }: { name: string },
): string {
  const value = source[name];
  if (!value) {
    throw new Error(`필수 환경 변수가 없습니다: ${name}`);
  }
  return value;
}
