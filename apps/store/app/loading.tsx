import { Skeleton } from '@openrun/store-ui';
import { ShowCardList, ShowCardSkeleton } from '../src/shows/show-card';

// 페이지가 API 응답을 기다리는 동안 보여 준다. 실제 목록과 같은 배치라 응답이 와도 자리가 흔들리지 않는다.
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="공연 목록을 불러오는 중">
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      {/* 넓은 화면은 장르와 판매 상태 칩 줄(라벨 한 줄 + 높이 40px 칩)과 같은 높이를 차지한다. 칩은 주소를 알아야 그릴 수 있어 자리만 둔다. */}
      <div className="mb-xl hidden flex-col gap-md sm:flex">
        {[0, 1].map((row) => (
          <div key={row} className="flex flex-col gap-sm">
            <span className="text-body-sm">
              <Skeleton className="h-lh w-[48px]" />
            </span>
            <Skeleton className="h-[40px] w-[320px] max-w-full rounded-full" />
          </div>
        ))}
      </div>
      {/* 좁은 화면은 필터 버튼 자리다. 선택 개수를 알아야 폭이 정해지므로 "필터" 버튼 폭으로 둔다. */}
      <Skeleton className="mb-xl h-[52px] w-[80px] rounded-button sm:hidden" />
      {/* "공연 N개" 줄과 같은 높이를 차지한다. */}
      <p className="mb-md text-body-sm">
        <Skeleton className="h-lh w-[64px]" />
      </p>
      <ShowCardList>
        {Array.from({ length: 8 }, (_, index) => (
          <ShowCardSkeleton key={index} />
        ))}
      </ShowCardList>
    </main>
  );
}
