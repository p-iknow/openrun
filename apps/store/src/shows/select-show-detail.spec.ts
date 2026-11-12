import { describe, expect, it } from 'vitest';
import { ApiError } from '../api-error';
import type { ShowDetail, ShowDetailResult } from './fetch-show-detail';
import { selectShowDetail } from './select-show-detail';

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

function successOf(data: ShowDetail): ShowDetailResult {
  return { data, response: new Response(null, { status: 200 }) };
}

function errorOf({
  status,
  error,
}: {
  status: number;
  error: unknown;
}): ShowDetailResult {
  return {
    error,
    response: new Response(null, { status }),
  } as ShowDetailResult;
}

describe('selectShowDetail', () => {
  it('공연 정보를 화면 문구로 바꾼다', () => {
    const detail = selectShowDetail(
      successOf(
        showOf({
          period: {
            // UTC로는 2월 28일이지만 한국 시간으로는 3월 1일 오전이다.
            start: '2026-02-28T15:30:00.000Z',
            end: '2026-03-20T10:30:00.000Z',
          },
        }),
      ),
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

  it('관람 연령이 0이면 전체 관람가다', () => {
    expect(selectShowDetail(successOf(showOf({ minAge: 0 })))).toMatchObject({
      ageRating: '전체 관람가',
    });
  });

  it('판매 예정이면 판매 오픈 일시를 한국 시각으로 보여 준다', () => {
    expect(
      selectShowDetail(
        successOf(
          showOf({
            salesStatus: 'upcoming',
            salesOpenAt: '2026-03-01T05:00:00.000Z',
          }),
        ),
      ),
    ).toMatchObject({
      salesStatus: { label: '판매 예정', tone: 'success' },
      salesOpenAt: '2026.03.01 14:00 판매 오픈',
      isSalesEnded: false,
    });
  });

  it('공연 판매 상태가 판매 종료면 판매 종료로 표시한다', () => {
    expect(
      selectShowDetail(successOf(showOf({ salesStatus: 'ended' }))),
    ).toMatchObject({
      salesStatus: { label: '판매 종료', tone: 'neutral' },
      isSalesEnded: true,
    });
  });

  it('회차를 한국 날짜별로 묶고, 회차마다 시각과 판매 상태를 보여 준다', () => {
    const detail = selectShowDetail(
      successOf(
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
      ),
    );

    expect(detail?.performanceDays).toEqual([
      {
        date: '2026.03.01 (일)',
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
        date: '2026.03.02 (월)',
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
      successOf(
        showOf({
          performances: [
            performanceOf({
              id: 1,
              remainingSeats: 3,
              isAlmostSoldOut: true,
            }),
            performanceOf({ id: 2, salesStatus: 'upcoming' }),
          ],
        }),
      ),
    );

    expect(detail?.performanceDays[0]?.performances).toEqual([
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

  it('없는 공연(SHOW_NOT_FOUND) 응답은 null로 바꾼다', () => {
    const detail = selectShowDetail(
      errorOf({
        status: 404,
        error: {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: '공연을 찾을 수 없습니다.',
          code: 'SHOW_NOT_FOUND',
        },
      }),
    );

    expect(detail).toBeNull();
  });

  it('그 밖의 오류 응답은 ApiError로 던진다', () => {
    expect(() =>
      selectShowDetail(
        errorOf({
          status: 500,
          error: {
            type: 'about:blank',
            title: 'Internal Server Error',
            status: 500,
            detail: '서버에서 요청을 처리하지 못했습니다.',
            code: 'INTERNAL_SERVER_ERROR',
          },
        }),
      ),
    ).toThrow(
      expect.objectContaining({
        constructor: ApiError,
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
      }),
    );
  });
});
