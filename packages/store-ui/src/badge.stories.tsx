import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeTone } from './badge.js';

// Record로 적어 Badge에 톤이 추가되면 여기서 타입 오류가 난다.
const toneSet = {
  neutral: true,
  primary: true,
  success: true,
  warning: true,
  danger: true,
} satisfies Record<BadgeTone, true>;
const tones = Object.keys(toneSet) as BadgeTone[];

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**서버용** 컴포넌트다. 훅을 쓰지 않으므로 Server Component에서 바로 import한다. 도메인 의미 없이 톤 5개만 갖고, 판매 상태 같은 의미는 앱이 톤을 골라 붙인다.',
      },
    },
  },
  argTypes: {
    tone: { control: 'inline-radio', options: tones },
  },
  args: {
    children: '배지',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { tone: 'neutral' } };
export const Primary: Story = { args: { tone: 'primary' } };
export const Success: Story = { args: { tone: 'success' } };
export const Warning: Story = { args: { tone: 'warning' } };
export const Danger: Story = { args: { tone: 'danger' } };

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-sm">
      {tones.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};
