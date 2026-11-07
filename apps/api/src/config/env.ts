export interface Env {
  databaseUrl: string;
}

const REQUIRED_KEYS = ['DATABASE_URL'] as const;

export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const missing = REQUIRED_KEYS.filter((key) => !source[key]);
  if (missing.length > 0) {
    throw new Error(`필수 환경 변수가 없습니다: ${missing.join(', ')}`);
  }

  return { databaseUrl: source.DATABASE_URL as string };
}
