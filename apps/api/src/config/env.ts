export interface Env {
  databaseUrl: string;
}

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const databaseUrl = source.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('필수 환경 변수가 없습니다: DATABASE_URL');
  }

  return { databaseUrl };
}
