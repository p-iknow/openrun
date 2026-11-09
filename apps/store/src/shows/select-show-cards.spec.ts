import { describe, expect, it } from 'vitest';
import type { ShowPage } from './fetch-shows';
import { selectShowCards } from './select-show-cards';

function pageOf(items: ShowPage['items']): ShowPage {
  return { items, page: 1, size: 20, totalCount: items.length, totalPages: 1 };
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
        },
      ]),
    );

    expect(cards).toEqual([
      {
        id: 7,
        title: '달빛 정원',
        venueName: '샤롯데씨어터',
        period: '2026.03.01 ~ 2026.03.20',
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
        },
      ]),
    );

    expect(card?.period).toBe('2026.04.10');
  });
});
