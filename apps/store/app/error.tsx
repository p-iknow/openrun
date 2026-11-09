'use client';

import { Button } from '@openrun/store-ui';
import { useEffect } from 'react';

// 페이지 렌더링 중 오류(API가 응답하지 않거나 오류로 응답한 경우 등)가 나면 이 화면으로 바뀐다.
// 운영 모드에서는 서버 컴포넌트의 오류 메시지가 브라우저로 오지 않으므로, 원인과 상관없이 같은 안내를 보여 준다.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center gap-md py-2xl text-center">
      <h1 className="text-heading font-bold">화면을 불러오지 못했습니다</h1>
      <p className="text-body-sm break-keep text-text-secondary">
        잠시 후 다시 시도해 주세요.
      </p>
      {/* retry는 서버 컴포넌트를 다시 요청해 그린다. reset은 다시 요청하지 않아 같은 오류가 난다. */}
      <Button onClick={() => retry()}>다시 시도</Button>
    </main>
  );
}
