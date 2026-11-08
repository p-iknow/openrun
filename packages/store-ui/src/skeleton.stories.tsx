import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './skeleton.js';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**서버용** 컴포넌트다. 훅을 쓰지 않으므로 Server Component에서 바로 import한다. 크기와 비율은 `className`으로 정한다. 장식용이라 스크린 리더에서 숨기므로, 로딩 중임은 감싸는 영역이 `aria-busy` 등으로 알린다. 움직임 줄이기 설정에서는 깜박이지 않는다.',
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { className: 'h-[96px] w-[240px]' },
};

/** 포스터가 로드되기 전 같은 크기를 차지하는 3:4 자리 표시자. */
export const Poster: Story = {
  args: { className: 'aspect-[3/4] w-[180px]' },
};

/** 포스터 카드 하나의 자리 표시자: 포스터, 제목, 날짜. */
export const PosterCard: Story = {
  render: () => (
    <div aria-busy="true" className="flex w-[180px] flex-col gap-sm">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-[20px] w-full" />
      <Skeleton className="h-[16px] w-2/3" />
    </div>
  ),
};
