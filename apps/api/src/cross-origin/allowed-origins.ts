import { readAdminOrigin, readStoreOrigin } from '../config/env.js';

/** 쿠키를 실어 API를 부를 수 있는 출처. 스토어는 사용자 API를, 어드민은 `/admin/*` API를 부른다. */
export class AllowedOrigins {
  readonly store = readStoreOrigin();
  readonly admin = readAdminOrigin();

  /** 이 경로의 변경 요청을 보낼 수 있는 출처. `/admin/*`는 어드민만, 나머지는 스토어만이다. */
  getOriginFor(path: string): string {
    return isAdminPath(path) ? this.admin : this.store;
  }
}

function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}
