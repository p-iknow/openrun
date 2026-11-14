import Link from 'next/link';

// 페이지가 notFound()를 부르면(없는 공연) 이 화면으로 바뀐다.
export function ShowDetailPageNotFound() {
  return (
    <main className="flex flex-col items-center gap-md py-2xl text-center">
      <h1 className="text-heading font-bold">공연을 찾을 수 없습니다</h1>
      <p className="text-body-sm break-keep text-text-secondary">
        주소가 맞는지 확인하거나 공연 목록에서 다시 찾아 주세요.
      </p>
      <Link
        href="/"
        className="font-semibold text-primary-strong hover:underline"
      >
        공연 목록으로
      </Link>
    </main>
  );
}
