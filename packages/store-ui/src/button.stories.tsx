import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button.js';

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
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
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
