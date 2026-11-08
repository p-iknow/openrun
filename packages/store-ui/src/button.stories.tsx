import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonVariant } from './button.js';

// Record로 적어 Button에 종류가 추가되면 여기서 타입 오류가 난다.
const variantSet = {
  primary: true,
  secondary: true,
} satisfies Record<ButtonVariant, true>;
const variants = Object.keys(variantSet) as ButtonVariant[];

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Button 바탕, 파일 첫 줄에 `'use client'`). Server Component에서도 import할 수 있지만 직렬화할 수 있는 props만 넘긴다. `onClick`은 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 주요 행동은 `primary`, 보조 행동은 `secondary`로 고른다. 높이 52px, 모서리 `rounded-button`(14px). Tab으로 이동하면 포커스 테두리가 보인다.",
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: variants },
    onClick: { action: 'click' },
  },
  args: {
    children: '예매하기',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };

export const Secondary: Story = {
  args: { variant: 'secondary', children: '공유하기' },
};

/** 종류와 관계없이 같은 회색으로 그리고, 누를 수 없다. */
export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: '다음' },
};

/** 보조 버튼은 바탕이 원래 회색이라 비활성일 때 글자색만 바뀐다. 활성 상태와 나란히 비교한다. */
export const SecondaryDisabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex gap-sm">
      <Button variant="secondary">공유하기</Button>
      <Button variant="secondary" disabled>
        공유하기
      </Button>
    </div>
  ),
};
