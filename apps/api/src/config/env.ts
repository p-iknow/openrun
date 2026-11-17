// 환경 변수는 쓰는 곳마다 따로 읽는다. 시드처럼 DB만 쓰는 스크립트가 쓰지 않는 값까지 요구하지 않게 하기 위해서다.
// 앱은 이 값들을 쓰는 프로바이더를 부팅 때 만들므로, 필수 값이 빠지면 부팅에서 실패한다.

export function readDatabaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  return getOrThrow({ source, name: 'DATABASE_URL' });
}

/** 공연 이미지(포스터, 상세 이미지)의 저장소 안 경로 앞에 붙여 완전한 URL을 만드는 주소. 예: `http://localhost:3001/show-images` */
export function readShowImageBaseUrl(
  source: NodeJS.ProcessEnv = process.env,
): string {
  return getOrThrow({ source, name: 'SHOW_IMAGE_BASE_URL' });
}

// HMAC 키로 쓰기에 짧으면 추측할 수 있으므로 길이를 확인한다. Better Auth도 32자보다 짧으면 경고한다.
const MIN_AUTH_SECRET_LENGTH = 32;

/** 세션 쿠키 서명(HMAC-SHA256)의 키. 32자 이상의 난수 문자열이다. */
export function readAuthSecret(
  source: NodeJS.ProcessEnv = process.env,
): string {
  const value = getOrThrow({ source, name: 'AUTH_SECRET' });
  if (value.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET은 ${MIN_AUTH_SECRET_LENGTH}자 이상이어야 합니다.`,
    );
  }
  return value;
}

/** 사용자 세션 쿠키의 Domain 속성. 스토어와 API가 서브도메인으로 나뉘는 배포에서 상위 도메인을 적는다. 없으면 API 호스트에만 전송된다. */
export function readCookieDomain(
  source: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return source.COOKIE_DOMAIN || undefined;
}

/** 쿠키에 Secure 속성과 `__Secure-` 접두사를 붙일지. 운영 환경(NODE_ENV=production)은 HTTPS로만 서비스하고, 로컬은 http://localhost라 Secure 쿠키를 쓸 수 없다. */
export function shouldUseSecureCookies(
  source: NodeJS.ProcessEnv = process.env,
): boolean {
  return source.NODE_ENV === 'production';
}

function getOrThrow({
  source,
  name,
}: {
  source: NodeJS.ProcessEnv;
  name: string;
}): string {
  const value = source[name];
  if (!value) {
    throw new Error(`필수 환경 변수가 없습니다: ${name}`);
  }
  return value;
}
