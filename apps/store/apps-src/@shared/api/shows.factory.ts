import * as Factory from 'factory.ts';
import type { ShowDetail, ShowPage } from './shows';

// 테스트 데이터 팩토리. build()는 모든 필드를 기본값으로 채우고, 테스트는 검증에 필요한 값만 넘긴다.
// 객체는 기본값과 합치고, 배열은 통째로 바꾼다.

type ShowSummary = ShowPage['items'][number];
type Performance = ShowDetail['performances'][number];

export const showSummaryFactory = Factory.Sync.makeFactory<ShowSummary>({
  id: 1,
  title: '달빛 정원',
  genre: 'musical',
  venueName: '예술의전당',
  period: {
    start: '2026-04-10T05:00:00.000Z',
    end: '2026-04-20T05:00:00.000Z',
  },
  salesStatus: 'on_sale',
  salesOpenAt: null,
  posterUrl: 'http://localhost:3001/posters/show-01.png',
});

// 전체 개수를 주지 않으면 항목 수로 채운다.
export const showPageFactory = Factory.Sync.makeFactory<ShowPage>({
  items: [],
  page: 1,
  size: 20,
  totalCount: 0,
  totalPages: 1,
}).withDerivation('totalCount', (page) => page.items.length);

export const showDetailFactory = Factory.Sync.makeFactory<ShowDetail>({
  id: 1,
  title: '달빛 정원',
  genre: 'musical',
  minAge: 8,
  runningMinutes: 150,
  description: '달빛 아래 정원에서 벌어지는 이야기',
  posterUrl: 'http://localhost:3001/posters/show-01.png',
  venue: { id: 1, name: '예술의전당' },
  period: {
    start: '2026-04-10T05:00:00.000Z',
    end: '2026-04-20T05:00:00.000Z',
  },
  salesStatus: 'on_sale',
  salesOpenAt: null,
  detailImages: [],
  seatGrades: [],
  performances: [],
});

export const performanceFactory = Factory.Sync.makeFactory<Performance>({
  id: 1,
  startsAt: '2026-04-10T05:00:00.000Z',
  salesStatus: 'on_sale',
  remainingSeats: 120,
  totalSeats: 300,
  isAlmostSoldOut: false,
});
