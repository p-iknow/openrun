import { describe, expect, it } from 'vitest';
import type { ShowDetail } from '@shared/api/shows';
import { selectShowDetail } from './show-detail-page.helper';

type Performance = ShowDetail['performances'][number];

function showOf(overrides: Partial<ShowDetail>): ShowDetail {
  return {
    id: 7,
    title: '달빛 정원',
    genre: 'play',
    minAge: 13,
    runningMinutes: 120,
    description: '달빛 아래 정원에서 벌어지는 이야기',
    posterUrl: 'http://localhost:3001/posters/show-07.png',
    venue: { id: 1, name: '샤롯데씨어터' },
    period: {
      start: '2026-04-10T05:00:00.000Z',
      end: '2026-04-20T05:00:00.000Z',
    },
    salesStatus: 'on_sale',
    salesOpenAt: null,
    detailImages: [],
    seatGrades: [],
    performances: [],
    ...overrides,
  };
}

function performanceOf(overrides: Partial<Performance>): Performance {
  return {
    id: 1,
    startsAt: '2026-04-10T05:00:00.000Z',
    salesStatus: 'on_sale',
    remainingSeats: 120,
    totalSeats: 300,
    isAlmostSoldOut: false,
    ...overrides,
  };
}

describe('selectShowDetail', () => {
  it('공연 정보를 화면 문구로 바꾼다', () => {
    const detail = selectShowDetail(
      showOf({
        period: {
          // UTC로는 2월 28일이지만 한국 시간으로는 3월 1일 오전이다.
          start: '2026-02-28T15:30:00.000Z',
          end: '2026-03-20T10:30:00.000Z',
        },
      }),
    );

    expect(detail).toMatchObject({
      title: '달빛 정원',
      genre: '연극',
      venueName: '샤롯데씨어터',
      period: '2026.03.01 ~ 2026.03.20',
      ageRating: '만 13세 이상',
      runningTime: '120분',
      description: '달빛 아래 정원에서 벌어지는 이야기',
      posterUrl: 'http://localhost:3001/posters/show-07.png',
      salesStatus: { label: '판매 중', tone: 'primary' },
      salesOpenAt: null,
      isSalesEnded: false,
    });
  });

  it('좌석 등급마다 가격을 원 단위 문구로, 구역 이름을 쉼표로 이어 보여 준다', () => {
    const detail = selectShowDetail(
      showOf({
        seatGrades: [
          {
            name: 'VIP석',
            price: 170_000,
            sectionNames: ['A구역', 'B구역'],
          },
          { name: 'A석', price: 8_000, sectionNames: ['C구역'] },
        ],
      }),
    );

    expect(detail.seatGrades).toEqual([
      { name: 'VIP석', price: '170,000원', sections: 'A구역, B구역' },
      { name: 'A석', price: '8,000원', sections: 'C구역' },
    ]);
  });

  it('관람 연령이 0이면 전체 관람가다', () => {
    expect(selectShowDetail(showOf({ minAge: 0 }))).toMatchObject({
      ageRating: '전체 관람가',
    });
  });

  it('판매 예정이면 판매 오픈 일시를 한국 시각으로 보여 준다', () => {
    expect(
      selectShowDetail(
        showOf({
          salesStatus: 'upcoming',
          salesOpenAt: '2026-03-01T05:00:00.000Z',
        }),
      ),
    ).toMatchObject({
      salesStatus: { label: '판매 예정', tone: 'success' },
      salesOpenAt: '2026.03.01 14:00 판매 오픈',
      isSalesEnded: false,
    });
  });

  it('공연 판매 상태가 판매 종료면 판매 종료로 표시한다', () => {
    expect(selectShowDetail(showOf({ salesStatus: 'ended' }))).toMatchObject({
      salesStatus: { label: '판매 종료', tone: 'neutral' },
      isSalesEnded: true,
    });
  });

  it('회차를 한국 날짜별로 묶고, 회차마다 시각과 판매 상태를 보여 준다', () => {
    const detail = selectShowDetail(
      showOf({
        performances: [
          // 한국 시간 3월 1일(일) 14:00, 19:30
          performanceOf({ id: 1, startsAt: '2026-03-01T05:00:00.000Z' }),
          performanceOf({
            id: 2,
            startsAt: '2026-03-01T10:30:00.000Z',
            salesStatus: 'sold_out',
            remainingSeats: 0,
          }),
          // UTC로는 3월 1일이지만 한국 시간으로는 3월 2일(월) 00:30이다.
          performanceOf({
            id: 3,
            startsAt: '2026-03-01T15:30:00.000Z',
            salesStatus: 'cancelled',
          }),
        ],
      }),
    );

    expect(detail.performanceDays).toEqual([
      {
        date: '2026-03-01',
        label: '2026.03.01 (일)',
        performances: [
          {
            id: 1,
            time: '14:00',
            salesStatus: { label: '판매 중', tone: 'primary' },
            remainingSeats: '잔여 120석',
            isAlmostSoldOut: false,
          },
          {
            id: 2,
            time: '19:30',
            salesStatus: { label: '매진', tone: 'neutral' },
            remainingSeats: null,
            isAlmostSoldOut: false,
          },
        ],
      },
      {
        date: '2026-03-02',
        label: '2026.03.02 (월)',
        performances: [
          {
            id: 3,
            time: '00:30',
            salesStatus: { label: '회차 취소', tone: 'danger' },
            remainingSeats: null,
            isAlmostSoldOut: false,
          },
        ],
      },
    ]);
  });

  it('남은 좌석은 판매 중 회차에만 보여 준다', () => {
    const detail = selectShowDetail(
      showOf({
        performances: [
          performanceOf({ id: 1, remainingSeats: 3, isAlmostSoldOut: true }),
          performanceOf({ id: 2, salesStatus: 'upcoming' }),
        ],
      }),
    );

    expect(detail.performanceDays[0]?.performances).toEqual([
      expect.objectContaining({
        remainingSeats: '잔여 3석',
        isAlmostSoldOut: true,
      }),
      expect.objectContaining({
        salesStatus: { label: '판매 예정', tone: 'success' },
        remainingSeats: null,
      }),
    ]);
  });
});
