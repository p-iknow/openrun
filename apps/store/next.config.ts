import type { NextConfig } from 'next';

// 포스터는 API가 POSTER_BASE_URL로 만든 완전한 URL로 온다. next/image는 허용한 주소의 이미지만 최적화한다.
// 값이 없으면 허용 목록이 비어 포스터 최적화 요청이 400으로 실패한다. 빌드는 API와 환경 변수 없이 통과해야 하므로 오류로 막지 않는다.
const posterBaseUrl = process.env.POSTER_BASE_URL
  ? new URL(process.env.POSTER_BASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: posterBaseUrl
      ? [
          new URL(
            `${posterBaseUrl.origin}${posterBaseUrl.pathname.replace(/\/+$/, '')}/**`,
          ),
        ]
      : [],
    // 최적화 서버는 사설 IP로 풀리는 주소를 SSRF 방지를 위해 거부한다. 개발 환경의 포스터는 localhost(스토어 자신)에 있으므로,
    // 포스터 주소가 localhost일 때만 허용한다. 허용 목록이 포스터 주소 하나뿐이라 다른 내부 주소는 여전히 막힌다.
    dangerouslyAllowLocalIP: posterBaseUrl?.hostname === 'localhost',
  },
};

export default nextConfig;
