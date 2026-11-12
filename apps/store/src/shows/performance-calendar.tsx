'use client';

import { Badge, Calendar } from '@openrun/store-ui';
import { useState } from 'react';
import type { PerformanceDayData } from './select-show-detail';

// NOL 티켓 상세의 예매 패널처럼 달력에서 날짜를 고르면 그날의 회차를 보여 준다.
// 회차가 있는 날만 고를 수 있고, 처음에는 가장 이른 날이 골라져 있다. 회차 선택과 예매 버튼은 1.5에서 넣는다.
// 고른 날짜와 보고 있는 달은 이 화면 안의 상태다. 주소에 넣지 않아 새로고침하면 가장 이른 날로 돌아간다.
export function PerformanceCalendar({ days }: { days: PerformanceDayData[] }) {
  const firstDate = days[0]?.date ?? null;
  const lastDate = days.at(-1)?.date ?? null;
  const [selectedDate, setSelectedDate] = useState(firstDate);
  // 'YYYY-MM-DD'의 앞 7글자가 달이다.
  const [month, setMonth] = useState(firstDate?.slice(0, 7) ?? '');
  const selectedDay = days.find((day) => day.date === selectedDate);

  if (firstDate === null) {
    return null;
  }

  return (
    <div className="flex flex-col gap-lg">
      <Calendar
        label="관람일"
        month={month}
        onMonthChange={setMonth}
        minMonth={firstDate.slice(0, 7)}
        maxMonth={lastDate?.slice(0, 7)}
        enabledDates={days.map((day) => day.date)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      {selectedDay === undefined ? null : (
        <section aria-live="polite" className="border-t border-border pt-lg">
          <h3 className="mb-sm text-body-sm font-semibold">
            {selectedDay.label}
          </h3>
          <ul className="flex flex-col gap-sm">
            {selectedDay.performances.map((performance) => (
              <li
                key={performance.id}
                className="flex items-center gap-sm rounded-card border border-border px-md py-sm"
              >
                <span className="font-semibold tabular-nums">
                  {performance.time}
                </span>
                <Badge tone={performance.salesStatus.tone}>
                  {performance.salesStatus.label}
                </Badge>
                <span className="ml-auto flex items-center gap-sm text-body-sm">
                  {performance.isAlmostSoldOut ? (
                    <span className="font-semibold text-warning">
                      매진 임박
                    </span>
                  ) : null}
                  {performance.remainingSeats === null ? null : (
                    <span className="text-text-secondary tabular-nums">
                      {performance.remainingSeats}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
