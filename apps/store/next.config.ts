import type { NextConfig } from 'next';

// 공연 이미지(포스터, 상세 이미지)는 API가 SHOW_IMAGE_BASE_URL로 만든 완전한 URL로 온다. 그중 포스터를 next/image로 최적화하며, next/image는 허용한 주소의 이미지만 최적화한다.
// 값이 없으면 허용 목록이 비어 공연 이미지 최적화 요청이 400으로 실패한다. 빌드는 API와 환경 변수 없이 통과해야 하므로 오류로 막지 않는다.
const showImageBaseUrl = process.env.SHOW_IMAGE_BASE_URL
  ? new URL(process.env.SHOW_IMAGE_BASE_URL)
  : null;
// URL의 hostname은 IPv6 주소를 대괄호째 돌려준다.
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: showImageBaseUrl
      ? [
          new URL(
            `${showImageBaseUrl.origin}${showImageBaseUrl.pathname.replace(/\/+$/, '')}/**`,
          ),
        ]
      : [],
    // 최적화 서버는 사설 IP로 풀리는 주소를 SSRF 방지를 위해 거부한다. 개발 환경의 공연 이미지는 localhost(스토어 자신)에 있으므로,
    // 공연 이미지 주소가 루프백(localhost, 127.0.0.1, [::1])일 때만 허용한다. 허용 목록이 공연 이미지 주소 하나뿐이라 다른 내부 주소는 여전히 막힌다.
    dangerouslyAllowLocalIP: LOOPBACK_HOSTS.has(
      showImageBaseUrl?.hostname ?? '',
    ),
  },
};

export default nextConfig;
