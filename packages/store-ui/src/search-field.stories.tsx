import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchField } from './search-field.js';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**클라이언트용** 컴포넌트다(Base UI Field와 Input 바탕, 파일 첫 줄에 `\'use client\'`). 예매 사이트의 검색 막대처럼 라벨을 화면에 보이지 않고(sr-only로 스크린 리더에만 읽힌다) placeholder로 무엇을 찾는지 알린다. 오른쪽 돋보기 버튼은 `type="submit"`이라 감싼 폼을 제출하고, Enter로도 제출된다. 입력 칸은 TextField와 같은 흰 바탕, 회색 테두리, 높이 52px, 모서리 `rounded-button`(14px)이고 포커스되면 테두리가 2px 파랑으로 바뀐다.',
      },
    },
  },
  args: {
    label: '공연 제목 검색',
    name: 'q',
    placeholder: '공연 제목으로 찾기',
  },
  // 실제 화면처럼 폭을 줄이고 폼으로 감싼다. 제출해도 페이지를 옮기지 않는다.
  render: (args) => (
    <form
      className="max-w-[400px]"
      onSubmit={(event) => event.preventDefault()}
    >
      <SearchField {...args} />
    </form>
  ),
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 값이 있는 모습. 주소의 검색어를 `defaultValue`로 채운다. */
export const Filled: Story = {
  args: { defaultValue: '햄릿' },
};
