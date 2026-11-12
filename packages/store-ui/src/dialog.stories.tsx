import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button.js';
import * as Dialog from './dialog.js';
import { ToggleGroup } from './toggle-group.js';

const meta = {
  title: 'Components/Dialog',
  component: Dialog.Root,
  subcomponents: {
    'Dialog.Popup': Dialog.Popup,
    'Dialog.Header': Dialog.Header,
    'Dialog.Title': Dialog.Title,
    'Dialog.Description': Dialog.Description,
    'Dialog.Body': Dialog.Body,
    'Dialog.Footer': Dialog.Footer,
  },
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Dialog 바탕, 파일 첫 줄에 `'use client'`). 부품을 쓰는 쪽에서 조립하는 compound 컴포넌트이고, 부품은 `Dialog.Root`, `Dialog.Popup`, `Dialog.Header`, `Dialog.Title`, `Dialog.Description`, `Dialog.Body`, `Dialog.Footer`이다. 묶는 방식과 Server Component에서 쓰는 규칙은 Drawer와 같다. 화면 가운데에 뜨는 대화상자이고, 바깥을 누르거나 Esc를 누르거나 머리의 닫기 버튼을 누르면 닫힌다. 열리면 포커스가 대화상자 안에 머물고 뒤 화면은 스크롤되지 않으며, 닫히면 포커스가 열기 전 요소(보통 여는 버튼)로 돌아간다. 열림 상태는 늘 `Dialog.Root`의 `open`과 `onOpenChange`로 제어하고, `Dialog.Footer`의 버튼도 `onOpenChange(false)`처럼 상태를 바꿔 닫는다. 머리, 본문, 아래 행동 줄의 모양은 Drawer와 같아, 좁은 화면은 Drawer, 넓은 화면은 Dialog로 같은 내용을 보일 수 있다.",
      },
    },
  },
} satisfies Meta<typeof Dialog.Root>;

export default meta;

type Story = StoryObj<typeof Dialog.Root>;

/** 여는 버튼, 머리, 본문만 있는 대화상자. */
export const Default: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          열기
        </Button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Popup>
            <Dialog.Header>
              <Dialog.Title>제목</Dialog.Title>
              <Dialog.Description>
                대화상자에 대한 짧은 설명.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <p className="text-body">바깥을 누르거나 Esc를 누르면 닫힌다.</p>
            </Dialog.Body>
          </Dialog.Popup>
        </Dialog.Root>
      </>
    );
  },
};

const groupA = [
  { value: 'a1', label: '항목 하나' },
  { value: 'a2', label: '항목 둘' },
  { value: 'a3', label: '항목 셋' },
];

/**
 * 필터 예시. ToggleGroup을 고른 뒤 적용을 눌러야 반영되고, 적용 없이 닫으면 버린다.
 * 적용과 초기화는 일반 Button이고, 적용은 값을 반영한 뒤 `setOpen(false)`로 닫는다.
 */
export const WithFooter: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [applied, setApplied] = useState<string[]>(['a2']);
    const [draft, setDraft] = useState<string[]>(applied);
    return (
      <div className="flex flex-col items-start gap-md">
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(applied);
            setOpen(true);
          }}
        >
          필터
        </Button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Popup>
            <Dialog.Header>
              <Dialog.Title>필터</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <ToggleGroup
                label="분류"
                items={groupA}
                value={draft}
                onValueChange={setDraft}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="secondary" onClick={() => setDraft([])}>
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
            </Dialog.Footer>
          </Dialog.Popup>
        </Dialog.Root>
        <p className="text-body-sm text-text-secondary">
          적용한 값: {applied.join(', ') || '없음'}
        </p>
      </div>
    );
  },
};
