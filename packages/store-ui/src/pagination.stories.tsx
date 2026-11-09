import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './pagination.js';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**서버용** 컴포넌트다. 훅을 쓰지 않으므로 Server Component에서 바로 import한다. props는 직렬화할 수 있는 값(현재 페이지, 전체 페이지 수, 기본 주소, 쿼리 이름)만 받고 함수 prop은 받지 않는다. 각 번호는 `<a href>` 링크라서 주소(`?page=`)로 공유할 수 있고 자바스크립트 없이도 이동한다. 기본 주소에 있던 쿼리(필터 등)는 유지한다. 번호는 현재 페이지 주변 최대 5개만 보이고, 현재 페이지는 `primary`로 채우며 `aria-current="page"`를 붙인다. 처음과 끝에서는 이전·다음이 비활성이다. Storybook 안에서 링크를 누르면 실제로 주소가 바뀌므로 모양만 확인한다.',
      },
    },
  },
  args: {
    baseUrl: '/shows',
    queryName: 'page',
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 첫 페이지. 이전이 비활성이다. */
export const First: Story = { args: { currentPage: 1, totalPages: 10 } };

/** 중간 페이지. 현재 페이지를 가운데에 두고 앞뒤로 2개씩 보여 준다. */
export const Middle: Story = { args: { currentPage: 5, totalPages: 10 } };

/** 마지막 페이지. 다음이 비활성이다. */
export const Last: Story = { args: { currentPage: 10, totalPages: 10 } };

/** 전체가 1페이지. 이전과 다음이 모두 비활성이다. */
export const SinglePage: Story = { args: { currentPage: 1, totalPages: 1 } };
