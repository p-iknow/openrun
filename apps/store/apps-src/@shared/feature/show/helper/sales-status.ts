import type { components } from '@openrun/api-client';
import type { BadgeTone } from '@openrun/store-ui';

// 판매 상태 배지. 공연 목록과 공연 상세가 함께 쓴다.

type PerformanceSalesStatus = components['schemas']['PerformanceSalesStatus'];
type ShowSalesStatus = components['schemas']['ShowSalesStatus'];

export interface SalesStatusBadgeData {
  label: string;
  tone: BadgeTone;
}

// Record로 적어 API에 판매 상태가 추가되면 여기서 타입 오류가 난다.
// 상세에는 시작 전 회차만 와서 회차의 판매 종료는 오지 않지만, 공연 판매 상태와 함께 쓰므로 둔다.
export const PERFORMANCE_SALES_STATUS_BADGES = {
  on_sale: { label: '판매 중', tone: 'primary' },
  upcoming: { label: '판매 예정', tone: 'success' },
  sold_out: { label: '매진', tone: 'neutral' },
  cancelled: { label: '회차 취소', tone: 'danger' },
  ended: { label: '판매 종료', tone: 'neutral' },
} satisfies Record<PerformanceSalesStatus, SalesStatusBadgeData>;

// 공연 판매 상태의 값은 회차 판매 상태 중 셋이라, 같은 이름과 색을 쓴다. 판매 종료는 상세에서만 보인다.
export const SHOW_SALES_STATUS_BADGES = {
  on_sale: PERFORMANCE_SALES_STATUS_BADGES.on_sale,
  upcoming: PERFORMANCE_SALES_STATUS_BADGES.upcoming,
  ended: PERFORMANCE_SALES_STATUS_BADGES.ended,
} satisfies Record<ShowSalesStatus, SalesStatusBadgeData>;
