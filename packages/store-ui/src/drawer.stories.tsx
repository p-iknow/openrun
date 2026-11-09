import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button.js';
import { Drawer } from './drawer.js';
import { ToggleGroup } from './toggle-group.js';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Drawer 바탕, 파일 첫 줄에 `'use client'`). Server Component에서도 import할 수 있지만 직렬화할 수 있는 props와 요소만 넘긴다. `onOpenChange`는 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 화면 아래에서 올라오는 시트이고, 아래로 밀거나 바깥을 누르거나 Esc를 누르거나 닫기 버튼을 누르면 닫힌다. 열리면 포커스가 시트 안에 머물고 뒤 화면은 스크롤되지 않으며, 닫히면 포커스가 열었던 버튼으로 돌아간다. 본문이 길면 본문만 스크롤되고 `footer`의 버튼은 늘 보인다. `footer`의 버튼으로 시트를 닫으려면 `open`과 `onOpenChange`로 열림 상태를 제어한다.",
      },
    },
    // 시트는 화면 폭을 꽉 채우므로 작은 휴대폰 폭으로 확인한다.
    viewport: {
      options: {
        narrow: {
          name: '360px',
          styles: { width: '360px', height: '720px' },
          type: 'mobile',
        },
      },
    },
  },
  globals: { viewport: { value: 'narrow', isRotated: false } },
  argTypes: {
    onOpenChange: { action: 'openChange' },
  },
  args: {
    triggerLabel: '열기',
    title: '제목',
    description: '시트에 대한 짧은 설명.',
    children: (
      <p className="text-body">
        아래로 밀거나, 바깥을 누르거나, Esc를 누르면 닫힌다.
      </p>
    ),
  },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 본문만 있는 시트. 열림 상태는 컴포넌트가 스스로 관리한다. */
export const Default: Story = {};

const groupA = [
  { value: 'a1', label: '항목 하나' },
  { value: 'a2', label: '항목 둘' },
  { value: 'a3', label: '항목 셋' },
  { value: 'a4', label: '조금 긴 항목 넷' },
  { value: 'a5', label: '항목 다섯' },
  { value: 'a6', label: '항목 여섯' },
];

const groupB = [
  { value: 'b1', label: '빨강' },
  { value: 'b2', label: '파랑' },
  { value: 'b3', label: '초록', disabled: true },
];

interface Filters {
  a: string[];
  b: string[];
}

const emptyFilters: Filters = { a: [], b: [] };

/**
 * 모바일 필터 예시. 시트 안에 ToggleGroup 두 개를 넣고, 아래에 초기화와 적용 버튼을 둔다.
 * 시트는 닫히면 내용을 지우므로, 적용한 값은 시트 밖(실제 화면에서는 주소)에 두고 열 때마다 `defaultValue`로 채운다.
 * 시트 안에서 고르는 중인 값은 적용을 눌러야 반영되고, 적용 없이 닫으면 버린다.
 * 적용을 누르면 시트를 닫아야 하므로 `open`과 `onOpenChange`로 열림 상태를 제어한다.
 */
export const WithToggleGroup: Story = {
  parameters: { controls: { disable: true } },
  args: { triggerLabel: '필터', title: '필터', description: undefined },
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState<Filters>({ a: ['a2'], b: [] });
    const [draft, setDraft] = useState<Filters>(applied);
    // 초기화할 때 ToggleGroup을 다시 그려 빈 값으로 되돌린다. ToggleGroup은 비제어로만 쓴다.
    const [resetKey, setResetKey] = useState(0);
    return (
      <div className="flex flex-col items-start gap-md">
        <Drawer
          {...args}
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) setDraft(applied);
            setOpen(nextOpen);
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDraft(emptyFilters);
                  setResetKey((k) => k + 1);
                }}
              >
                초기화
              </Button>
              <Button
                onClick={() => {
                  setApplied(draft);
                  setOpen(false);
                }}
              >
                적용
              </Button>
            </>
          }
        >
          <div key={resetKey} className="flex flex-col gap-xl">
            <ToggleGroup
              label="분류"
              items={groupA}
              defaultValue={draft.a}
              onValueChange={(a) => setDraft((d) => ({ ...d, a }))}
            />
            <ToggleGroup
              label="색"
              items={groupB}
              defaultValue={draft.b}
              onValueChange={(b) => setDraft((d) => ({ ...d, b }))}
            />
          </div>
        </Drawer>
        <p className="text-body-sm text-text-secondary">
          적용한 값: {[...applied.a, ...applied.b].join(', ') || '없음'}
        </p>
      </div>
    );
  },
};
