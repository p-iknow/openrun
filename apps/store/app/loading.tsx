import { ShowCardList, ShowCardSkeleton } from '../src/shows/show-card';

// 페이지가 API 응답을 기다리는 동안 보여 준다. 실제 목록과 같은 배치라 응답이 와도 자리가 흔들리지 않는다.
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="공연 목록을 불러오는 중">
      <h1 className="mb-lg text-heading font-bold">공연</h1>
      <ShowCardList>
        {Array.from({ length: 8 }, (_, index) => (
          <ShowCardSkeleton key={index} />
        ))}
      </ShowCardList>
    </main>
  );
}
