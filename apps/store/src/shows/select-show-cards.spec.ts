import { describe, expect, it } from 'vitest';
import type { ShowPage } from '../api/shows';
import { selectShowCards } from './select-show-cards';

type ShowSummary = ShowPage['items'][number];

function pageOf(items: ShowPage['items']): ShowPage {
  return { items, page: 1, size: 20, totalCount: items.length, totalPages: 1 };
}

// 판매 상태 테스트에서 바꾸지 않는 값은 고정한다.
function summaryOf(overrides: Partial<ShowSummary>): ShowSummary {
  return {
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
    ...overrides,
  };
}

describe('selectShowCards', () => {
  it('공연 기간을 한국 날짜로 바꿔 시작일 ~ 종료일로 보여 준다', () => {
    const cards = selectShowCards(
      pageOf([
        {
          id: 7,
          title: '달빛 정원',
          genre: 'musical',
          venueName: '샤롯데씨어터',
          period: {
            // UTC로는 2월 28일이지만 한국 시간으로는 3월 1일 오전이다.
            start: '2026-02-28T15:30:00.000Z',
            end: '2026-03-20T10:30:00.000Z',
          },
          salesStatus: 'on_sale',
          salesOpenAt: null,
          posterUrl: 'http://localhost:3001/posters/show-07.png',
        },
      ]),
    );

    expect(cards).toEqual([
      {
        id: 7,
        title: '달빛 정원',
        venueName: '샤롯데씨어터',
        period: '2026.03.01 ~ 2026.03.20',
        salesStatus: { label: '판매 중', tone: 'primary' },
        salesOpenAt: null,
        posterUrl: 'http://localhost:3001/posters/show-07.png',
      },
    ]);
  });

  it('첫 회차와 마지막 회차가 한국 날짜로 같은 날이면 날짜 하나만 보여 준다', () => {
    const [card] = selectShowCards(
      pageOf([
        {
          id: 1,
          title: '하루 공연',
          genre: 'concert',
          venueName: '예술의전당',
          period: {
            start: '2026-04-10T05:00:00.000Z',
            end: '2026-04-10T10:30:00.000Z',
          },
          salesStatus: 'on_sale',
          salesOpenAt: null,
          posterUrl: 'http://localhost:3001/posters/show-01.png',
        },
      ]),
    );

    expect(card?.period).toBe('2026.04.10');
  });

  it.each([
    { salesStatus: 'on_sale', expected: { label: '판매 중', tone: 'primary' } },
    {
      salesStatus: 'upcoming',
      expected: { label: '판매 예정', tone: 'success' },
    },
    { salesStatus: 'ended', expected: { label: '판매 종료', tone: 'neutral' } },
  ] as const)(
    '판매 상태 $salesStatus: 배지 문구와 톤으로 바꾼다',
    ({ salesStatus, expected }) => {
      const [card] = selectShowCards(pageOf([summaryOf({ salesStatus })]));

      expect(card?.salesStatus).toEqual(expected);
    },
  );

  it('판매 오픈 일시를 한국 날짜와 시각으로 보여 준다', () => {
    const [card] = selectShowCards(
      pageOf([
        summaryOf({
          salesStatus: 'upcoming',
          // UTC로는 2월 14일 오후지만 한국 시간으로는 2월 15일 오전 2시다.
          salesOpenAt: '2026-02-14T17:00:00.000Z',
        }),
      ]),
    );

    expect(card?.salesOpenAt).toBe('2026.02.15 02:00 판매 오픈');
  });
});
