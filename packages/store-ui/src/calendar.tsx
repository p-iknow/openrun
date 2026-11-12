'use client';

import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// 한 달을 보여 주고 날짜 하나를 고르는 달력이다. 무엇을 고를 수 있는지(enabledDates)와 고른 날짜, 보여 줄 달은 쓰는 쪽이 정하는 제어 컴포넌트다.
// 날짜는 시간대와 상관없는 글자('2026-03-01')로 주고받는다. 어느 시간대의 날짜인지는 쓰는 쪽이 정한다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year: year ?? 0, monthIndex: (monthNumber ?? 1) - 1 };
}

function formatDate({
  year,
  monthIndex,
  day,
}: {
  year: number;
  monthIndex: number;
  day: number;
}): string {
  return `${String(year).padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 달('2026-03')을 일요일부터 시작하는 주로 나눈다. 칸마다 날짜('2026-03-01')를 두고, 그 달이 아닌 칸은 null이다.
 * 날짜 계산은 UTC로 해 실행하는 곳의 시간대와 상관없이 같은 결과가 나온다.
 */
export function getCalendarWeeks(month: string): (string | null)[][] {
  const { year, monthIndex } = parseMonth(month);
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  // 다음 달 0일은 이번 달의 마지막 날이다.
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: dayCount }, (_, index) =>
      formatDate({ year, monthIndex, day: index + 1 }),
    ),
  ];
  const weeks: (string | null)[][] = [];
  for (let start = 0; start < cells.length; start += 7) {
    const week = cells.slice(start, start + 7);
    weeks.push([
      ...week,
      ...Array.from({ length: 7 - week.length }, () => null),
    ]);
  }
  return weeks;
}

/** 달('2026-03')에서 offset달 옮긴 달을 돌려준다. 예: `{ month: '2026-12', offset: 1 }` → `2027-01` */
export function getAdjacentMonth({
  month,
  offset,
}: {
  month: string;
  offset: number;
}): string {
  const { year, monthIndex } = parseMonth(month);
  const moved = new Date(Date.UTC(year, monthIndex + offset, 1));
  return formatDate({
    year: moved.getUTCFullYear(),
    monthIndex: moved.getUTCMonth(),
    day: 1,
  }).slice(0, 7);
}

export interface CalendarProps {
  /** 달력의 접근 가능한 이름. 예: `관람일` */
  label: string;
  /** 보여 줄 달. 예: `2026-03` */
  month: string;
  /** 이전 달, 다음 달 버튼을 누르면 옮겨 갈 달을 받는다. 받은 값을 `month`로 다시 넣어야 달이 바뀐다. */
  onMonthChange?: (month: string) => void;
  /** 이전 달 버튼으로 갈 수 있는 가장 이른 달. 없으면 막지 않는다. */
  minMonth?: string;
  /** 다음 달 버튼으로 갈 수 있는 가장 늦은 달. 없으면 막지 않는다. */
  maxMonth?: string;
  /** 고를 수 있는 날짜들. 나머지 날은 흐리게 보이고 누를 수 없다. 예: `['2026-03-01']` */
  enabledDates: string[];
  /** 고른 날짜. 없으면 null. */
  selectedDate: string | null;
  /** 날짜를 누르면 그 날짜를 받는다. 받은 값을 `selectedDate`로 다시 넣어야 고른 날이 바뀐다. */
  onSelectDate?: (date: string) => void;
}

const navButtonClass = cn(
  'inline-flex size-[32px] items-center justify-center rounded-full text-text-secondary',
  'outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
  'hover:not-disabled:bg-surface-muted disabled:cursor-not-allowed disabled:text-text-tertiary',
);

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[20px]"
    >
      <path d={path} />
    </svg>
  );
}

export function Calendar({
  label,
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  enabledDates,
  selectedDate,
  onSelectDate,
}: CalendarProps) {
  const { year, monthIndex } = parseMonth(month);
  const enabled = new Set(enabledDates);
  // 'YYYY-MM' 글자는 사전 순과 시간 순이 같아 글자로 비교한다.
  const hasPreviousMonth = minMonth === undefined || month > minMonth;
  const hasNextMonth = maxMonth === undefined || month < maxMonth;

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          disabled={!hasPreviousMonth}
          onClick={() =>
            onMonthChange?.(getAdjacentMonth({ month, offset: -1 }))
          }
          className={navButtonClass}
        >
          <NavIcon path="M12 5l-5 5 5 5" />
        </button>
        {/* 달을 옮기면 스크린 리더가 바뀐 달을 읽는다. */}
        <p aria-live="polite" className="font-bold tabular-nums">
          {year}.{String(monthIndex + 1).padStart(2, '0')}
        </p>
        <button
          type="button"
          aria-label="다음 달"
          disabled={!hasNextMonth}
          onClick={() =>
            onMonthChange?.(getAdjacentMonth({ month, offset: 1 }))
          }
          className={navButtonClass}
        >
          <NavIcon path="M8 5l5 5-5 5" />
        </button>
      </div>
      <table className="w-full table-fixed border-collapse text-center text-body-sm">
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday}
                scope="col"
                className="pb-xs text-caption font-normal text-text-tertiary"
              >
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getCalendarWeeks(month).map((week) => (
            <tr key={week.find((date) => date !== null)}>
              {week.map((date, index) => (
                <td key={date ?? `empty-${index}`} className="p-0">
                  {date === null ? null : enabled.has(date) ? (
                    <button
                      type="button"
                      aria-pressed={date === selectedDate}
                      onClick={() => onSelectDate?.(date)}
                      className={cn(
                        'mx-auto flex size-[36px] items-center justify-center rounded-full font-semibold tabular-nums',
                        'outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
                        'hover:not-aria-pressed:bg-surface-muted',
                        'aria-pressed:bg-primary aria-pressed:text-on-primary',
                      )}
                    >
                      {Number(date.slice(8))}
                    </button>
                  ) : (
                    // 고를 수 없는 날도 버튼으로 두어 칸 크기와 날짜 위치를 맞추고, 비활성으로 알린다.
                    <button
                      type="button"
                      disabled
                      className="mx-auto flex size-[36px] cursor-default items-center justify-center text-text-tertiary tabular-nums"
                    >
                      {Number(date.slice(8))}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
