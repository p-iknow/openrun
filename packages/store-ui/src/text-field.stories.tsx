import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './text-field.js';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Field와 Input 바탕, 파일 첫 줄에 `'use client'`). Server Component에서도 import할 수 있지만 직렬화할 수 있는 props만 넘긴다. `onValueChange`는 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 라벨은 늘 보이고 입력 칸과 연결되어 라벨을 누르면 입력 칸에 포커스가 간다. 테두리 없는 회색 면, 높이 52px, 모서리 `rounded-button`(14px). 포커스되면 바탕이 흰색으로 바뀌고 안쪽에 테두리가 생긴다.",
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['text', 'search'] },
    onValueChange: { action: 'valueChange' },
  },
  args: {
    label: '공연 제목',
    name: 'q',
    type: 'search',
    placeholder: '제목으로 찾기',
  },
  // 실제 화면처럼 폭을 줄여 보여 준다. 컴포넌트는 부모 폭을 꽉 채운다.
  render: (args) => (
    <div className="max-w-[360px]">
      <TextField {...args} />
    </div>
  ),
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 포커스된 모습. 스토리가 열리면 입력 칸에 포커스를 준다. */
export const Focused: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector('input')?.focus();
  },
};

/** 값이 있는 모습. 주소의 검색어를 `defaultValue`로 채운다. */
export const Filled: Story = {
  args: { defaultValue: '햄릿' },
};

/** 라벨과 글자가 흐려지고 입력할 수 없다. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: '햄릿' },
};
