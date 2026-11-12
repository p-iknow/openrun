import {
  PerformanceDayListSkeleton,
  PerformancePanel,
  ShowDetailLayout,
  ShowInfoSkeleton,
} from '../../../src/shows/show-detail';

// 페이지가 API 응답을 기다리는 동안 보여 준다. 상세와 같은 틀이라 응답이 와도 자리가 흔들리지 않는다.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="공연 정보를 불러오는 중">
      <ShowDetailLayout
        info={<ShowInfoSkeleton />}
        panel={
          <PerformancePanel>
            <PerformanceDayListSkeleton />
          </PerformancePanel>
        }
      />
    </div>
  );
}
