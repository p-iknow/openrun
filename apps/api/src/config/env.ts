// 환경 변수는 쓰는 곳마다 따로 읽는다. 시드처럼 DB만 쓰는 스크립트가 쓰지 않는 값까지 요구하지 않게 하기 위해서다.
// 앱은 두 값을 모두 쓰는 프로바이더를 부팅 때 만들므로, 어느 값이든 빠지면 부팅에서 실패한다.

export function readDatabaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  return required(source, { name: 'DATABASE_URL' });
}

/** 포스터 키 앞에 붙여 포스터의 완전한 URL을 만드는 주소. 예: `http://localhost:3001/posters` */
export function readPosterBaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  return required(source, { name: 'POSTER_BASE_URL' });
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
