import { PerformanceCalendarSkeleton } from './show-detail-page.sub/performance-calendar';
import { PerformancePanel } from './show-detail-page.sub/performance-panel';
import { PerformanceSheetSkeleton } from './show-detail-page.sub/performance-sheet';
import { ShowDetailLayout } from './show-detail-page.sub/show-detail-layout';
import { ShowInfoSkeleton } from './show-detail-page.sub/show-info/show-info';

// 페이지가 API 응답을 기다리는 동안 보여 준다. 상세와 같은 틀이라 응답이 와도 자리가 흔들리지 않는다.
export function ShowDetailPageLoading() {
  return (
    <div aria-busy="true" aria-label="공연 정보를 불러오는 중">
      <ShowDetailLayout
        info={<ShowInfoSkeleton />}
        panel={
          <PerformancePanel>
            <PerformanceCalendarSkeleton />
          </PerformancePanel>
        }
        bottomBar={<PerformanceSheetSkeleton />}
      />
    </div>
  );
}
