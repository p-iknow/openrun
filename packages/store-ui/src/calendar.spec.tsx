import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Calendar, getAdjacentMonth, getCalendarWeeks } from './calendar.js';

describe('getCalendarWeeks', () => {
  it('일요일부터 토요일까지 주 단위로 나누고, 달에 속하지 않는 칸은 null로 채운다', () => {
    // 2026년 3월 1일은 일요일, 31일은 화요일이다.
    const weeks = getCalendarWeeks('2026-03');

    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
    ]);
    expect(weeks[4]).toEqual([
      '2026-03-29',
      '2026-03-30',
      '2026-03-31',
      null,
      null,
      null,
      null,
    ]);
  });

  it('1일이 일요일이 아니면 첫 주 앞을 null로 채운다', () => {
    // 2026년 11월 1일은 일요일, 2026년 12월 1일은 화요일이다.
    expect(getCalendarWeeks('2026-12')[0]).toEqual([
      null,
      null,
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
    ]);
  });

  it('윤년 2월은 29일까지다', () => {
    expect(getCalendarWeeks('2028-02').flat().at(-1)).toBe(null);
    expect(getCalendarWeeks('2028-02').flat().filter(Boolean).at(-1)).toBe(
      '2028-02-29',
    );
  });
});

describe('getAdjacentMonth', () => {
  it.each([
    { month: '2026-03', offset: 1, expected: '2026-04' },
    { month: '2026-12', offset: 1, expected: '2027-01' },
    { month: '2026-01', offset: -1, expected: '2025-12' },
  ])(
    '$month에서 $offset달 옮기면 $expected다',
    ({ month, offset, expected }) => {
      expect(getAdjacentMonth({ month, offset })).toBe(expected);
    },
  );
});

describe('Calendar', () => {
  function render(props: Partial<Parameters<typeof Calendar>[0]> = {}) {
    return renderToStaticMarkup(
      <Calendar
        label="관람일"
        month="2026-03"
        selectedDate="2026-03-10"
        enabledDates={['2026-03-10', '2026-03-12']}
        {...props}
      />,
    );
  }

  it('고를 수 있는 날만 누를 수 있고, 고른 날은 aria-pressed로 알린다', () => {
    const html = render();

    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>10<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>12<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>11<\/button>/);
  });

  it('보여 줄 수 있는 달의 처음과 끝에서는 이전 달, 다음 달 버튼을 막는다', () => {
    const html = render({ minMonth: '2026-03', maxMonth: '2026-04' });

    expect(html).toMatch(/<button[^>]*aria-label="이전 달"[^>]*disabled=""/);
    expect(html).not.toMatch(
      /<button[^>]*aria-label="다음 달"[^>]*disabled=""/,
    );
  });
});
