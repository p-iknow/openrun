import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** 서버 상태를 바꾸지 않는 메서드인지. CSRF 방어(Origin 검사, JSON 본문)는 이 밖의 변경 요청에만 건다. */
export function isSafeMethod(request: Request): boolean {
  return SAFE_METHODS.has(request.method);
}

// Nest가 미들웨어를 경로에 마운트해 request.path는 마운트 뒤의 나머지만 담으므로, 원래 URL의 경로를 쓴다.
export function getPathname(request: Request): string {
  return new URL(request.originalUrl, 'http://localhost').pathname;
}

const ADMIN_PREFIX = '/admin';

/** 어드민 API(`/admin/*`)의 경로인지. */
export function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

const AUTH_ENTRY_PATHS = new Set(['/auth/sign-in', '/auth/sign-up']);

/** 쿠키 없이 보내는 로그인과 가입 요청의 경로인지. 사용자와 운영자(`/admin/auth/...`)의 경로를 함께 본다. */
export function isAuthEntryPath(pathname: string): boolean {
  const path = isAdminPath(pathname)
    ? pathname.slice(ADMIN_PREFIX.length)
    : pathname;
  return AUTH_ENTRY_PATHS.has(path);
}

/** 쿠키가 실렸는지. 세션이 유효한지는 보지 않는다. 출처가 틀린 요청은 세션과 상관없이 막으므로 DB를 읽기 전에 헤더만 본다. */
export function hasCookie(request: Request): boolean {
  return Boolean(request.get('cookie'));
}

/** 요청을 보낸 출처. Origin이 없으면(오래된 브라우저, 일부 같은 출처 요청) Referer의 출처를 쓴다. 둘 다 없으면 null이다. */
export function getRequestOrigin(request: Request): string | null {
  const origin = request.get('origin');
  if (origin) {
    return origin;
  }
  const referer = request.get('referer');
  return referer ? (URL.parse(referer)?.origin ?? null) : null;
}
