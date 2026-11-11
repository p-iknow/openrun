import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './select.js';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Select 바탕, 파일 첫 줄에 `'use client'`). Server Component에서도 import할 수 있지만 직렬화할 수 있는 props(`items` 배열 포함)만 넘긴다. `onValueChange`는 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 키보드로 쓸 수 있다: Tab으로 트리거에 가서 Enter, Space, 위아래 화살표로 열고, 화살표나 글자로 항목을 옮겨 Enter로 고르며, Esc로 닫는다. `name`을 주면 고른 값이 숨은 입력에 담겨 폼으로 제출된다. 트리거는 TextField와 같은 흰 바탕과 회색 테두리, 높이 52px, 모서리 14px이고, 열리면 테두리가 2px 파랑이 된다. 목록은 트리거 아래에 뜨고, 고른 항목은 연한 파랑, 가리킨 항목은 연한 회색 바탕이다.",
      },
    },
  },
  argTypes: {
    onValueChange: { action: 'valueChange' },
  },
  args: {
    label: '정렬',
    name: 'sort',
    placeholder: '정렬 기준',
    items: [
      { value: 'latest', label: '최신순' },
      { value: 'popular', label: '인기순' },
      { value: 'closing', label: '마감 임박순' },
    ],
  },
  // 실제 화면처럼 폭을 줄여 보여 준다. 컴포넌트는 부모 폭을 꽉 채운다.
  render: (args) => (
    <div className="max-w-[240px]">
      <Select {...args} />
    </div>
  ),
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 고른 값이 없어 placeholder가 보인다. */
export const Default: Story = {};

/** 고른 값이 트리거에 보이고, 목록을 열면 그 항목에 체크 표시가 있다. */
export const Selected: Story = {
  args: { defaultValue: 'popular' },
};

/** 라벨과 글자가 흐려지고 열 수 없으며, Tab으로도 가지 않는다. */
export const Disabled: Story = {
  args: { defaultValue: 'popular', disabled: true },
};

/** 목록 위 줄 오른쪽에 놓는 작은 글자 드롭다운. 라벨은 화면에서 숨기고, 목록은 트리거의 오른쪽 끝에 맞춰 연다. */
export const Inline: Story = {
  args: { variant: 'inline', defaultValue: 'latest' },
  render: (args) => (
    <div className="flex max-w-[480px] items-center justify-between">
      <p className="text-body font-semibold">공연 18개</p>
      <Select {...args} />
    </div>
  ),
};
