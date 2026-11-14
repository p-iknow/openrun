import { readShowImageBaseUrl } from '../config/env.js';

// 공연 이미지(포스터, 상세 이미지) 저장소의 주소다. 저장 위치(지금은 스토어의 정적 파일, 1.7부터 MinIO)를 바꿀 때는 SHOW_IMAGE_BASE_URL만 바꾼다.
export const SHOW_IMAGE_BASE_URL = Symbol('SHOW_IMAGE_BASE_URL');

export const showImageBaseUrlProvider = {
  provide: SHOW_IMAGE_BASE_URL,
  useFactory: (): string => readShowImageBaseUrl(),
};

// 저장소 안 경로(예: posters/show-01.png)를 완전한 URL로 만든다. 주소 끝에 /가 있어도 없어도 경로 앞에 /를 하나만 둔다.
export function buildShowImageUrl({
  baseUrl,
  path,
}: {
  baseUrl: string;
  path: string;
}): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path}`;
}
