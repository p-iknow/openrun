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
