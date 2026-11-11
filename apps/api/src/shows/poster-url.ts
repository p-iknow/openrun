import { readPosterBaseUrl } from '../config/env.js';

// 포스터 저장 위치(지금은 스토어의 정적 파일, 1.7부터 MinIO)를 바꿀 때는 POSTER_BASE_URL만 바꾼다.
export const POSTER_BASE_URL = Symbol('POSTER_BASE_URL');

export const posterBaseUrlProvider = {
  provide: POSTER_BASE_URL,
  useFactory: (): string => readPosterBaseUrl(),
};

// 주소 끝에 /가 있어도 없어도 경로 앞에 /를 하나만 둔다.
export function posterUrlOf(
  posterPath: string,
  { baseUrl }: { baseUrl: string },
): string {
  return `${baseUrl.replace(/\/+$/, '')}/${posterPath}`;
}
