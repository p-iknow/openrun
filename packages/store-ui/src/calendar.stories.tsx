import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Calendar } from './calendar.js';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(파일 첫 줄에 `'use client'`). 한 달을 일요일부터 보여 주고 날짜 하나를 고른다. 보여 줄 달(`month`), 고를 수 있는 날짜(`enabledDates`), 고른 날짜(`selectedDate`)를 모두 쓰는 쪽이 정하는 제어 컴포넌트라, `onMonthChange`와 `onSelectDate`로 받은 값을 다시 넣어야 바뀐다. 날짜는 시간대와 상관없는 글자(`2026-03-01`)로 주고받는다. 고를 수 없는 날은 흐리게 보이고 누를 수 없으며, 고른 날은 파랑 원으로 보이고 `aria-pressed`로 알린다. `minMonth`, `maxMonth`를 넘는 쪽의 달 이동 버튼은 막힌다.",
      },
    },
  },
  argTypes: {
    onMonthChange: { action: 'monthChange' },
    onSelectDate: { action: 'selectDate' },
  },
  args: {
    label: '날짜',
    month: '2026-03',
    minMonth: '2026-03',
    maxMonth: '2026-04',
    enabledDates: ['2026-03-03', '2026-03-05', '2026-03-10', '2026-03-21'],
    selectedDate: '2026-03-05',
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 달력은 부모 폭을 채우므로, 실제 회차 패널과 비슷한 폭에 둔다.
export const Default: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <Calendar {...args} />
    </div>
  ),
};

export const NothingSelected: Story = {
  ...Default,
  args: { selectedDate: null },
};

// 달을 옮기고 날짜를 고르는 모습. 쓰는 쪽이 상태를 들고 다시 넣는다.
export const Interactive: Story = {
  render: function InteractiveCalendar(args) {
    const [month, setMonth] = useState(args.month);
    const [selectedDate, setSelectedDate] = useState(args.selectedDate);
    return (
      <div className="w-[320px]">
        <Calendar
          {...args}
          month={month}
          onMonthChange={setMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    );
  },
  args: {
    enabledDates: [
      '2026-03-03',
      '2026-03-05',
      '2026-03-10',
      '2026-04-02',
      '2026-04-18',
    ],
  },
};
