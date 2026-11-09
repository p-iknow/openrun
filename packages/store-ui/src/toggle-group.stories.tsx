import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleGroup } from './toggle-group.js';

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI ToggleGroup 바탕, 파일 첫 줄에 `'use client'`). Server Component에서도 import할 수 있지만 직렬화할 수 있는 props(`items` 배열 포함)만 넘긴다. `onValueChange`는 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 칩을 여러 개 고를 수 있고, 누를 때마다 고른 값 전체를 배열로 받는다. 칩마다 `aria-pressed`로 선택 상태를 알린다. 키보드로 쓸 수 있다: Tab으로 묶음에 들어가 좌우 화살표로 칩을 옮기고, Enter나 Space로 고르거나 푼다. 칩은 원형 모서리에 회색 면이고, 고르면 연한 파랑 바탕에 파랑 글자와 체크 표시가 붙는다. 좁은 화면에서는 다음 줄로 넘어간다.",
      },
    },
  },
  argTypes: {
    onValueChange: { action: 'valueChange' },
  },
  args: {
    label: '종류',
    items: [
      { value: 'a', label: '전체 보기' },
      { value: 'b', label: '새 항목' },
      { value: 'c', label: '인기 항목' },
      { value: 'd', label: '추천' },
      { value: 'e', label: '곧 마감' },
    ],
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 고른 칩이 없다. 눌러서 여러 개를 고를 수 있다. */
export const Default: Story = {};

/** 고른 칩은 연한 파랑 바탕에 체크 표시가 붙어, 색을 구분하지 못해도 알 수 있다. */
export const Selected: Story = {
  args: { defaultValue: ['b', 'd'] },
};

/** 칩 하나만 누를 수 없다. 고른 칩(`추천`)이 비활성이면 바탕은 연한 파랑을 유지하고 글자만 흐려진다. */
export const DisabledItem: Story = {
  args: {
    defaultValue: ['d'],
    items: [
      { value: 'a', label: '전체 보기' },
      { value: 'b', label: '새 항목' },
      { value: 'c', label: '인기 항목', disabled: true },
      { value: 'd', label: '추천', disabled: true },
    ],
  },
};

/** 묶음 전체를 누를 수 없다. 라벨도 흐려진다. */
export const Disabled: Story = {
  args: { defaultValue: ['b'], disabled: true },
};

/** 360px 폭에서는 칩이 다음 줄로 넘어간다. */
export const Narrow: Story = {
  render: (args) => (
    <div className="w-[360px] border border-dashed border-border p-lg">
      <ToggleGroup {...args} />
    </div>
  ),
};
