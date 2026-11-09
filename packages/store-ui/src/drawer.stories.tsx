import type { Meta, StoryObj } from '@storybook/react-vite';
import { overlay, OverlayProvider } from 'overlay-kit';
import { useState } from 'react';
import { Button } from './button.js';
import { Drawer } from './drawer.js';
import { ToggleGroup } from './toggle-group.js';

const meta = {
  title: 'Components/Drawer',
  component: Drawer.Root,
  subcomponents: {
    'Drawer.Trigger': Drawer.Trigger,
    'Drawer.Popup': Drawer.Popup,
    'Drawer.Header': Drawer.Header,
    'Drawer.Title': Drawer.Title,
    'Drawer.Description': Drawer.Description,
    'Drawer.Body': Drawer.Body,
    'Drawer.Footer': Drawer.Footer,
    'Drawer.Close': Drawer.Close,
  },
  tags: ['autodocs'],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "**클라이언트용** 컴포넌트다(Base UI Drawer 바탕, 파일 첫 줄에 `'use client'`). 부품을 쓰는 쪽에서 조립하는 compound 컴포넌트이고, 부품은 `Drawer.Root`, `Drawer.Trigger`, `Drawer.Popup`, `Drawer.Header`, `Drawer.Title`, `Drawer.Description`, `Drawer.Body`, `Drawer.Footer`, `Drawer.Close`이다. 부품은 'use client' 파일에 두고 `Drawer` 객체는 지시어 없는 파일에서 묶어, Server Component에서도 `Drawer.Root`처럼 쓸 수 있다. Server Component에서도 import할 수 있지만 직렬화할 수 있는 props와 요소만 넘기고, `onOpenChange`, `onCloseComplete`, `Drawer.Close`의 `onClick`은 함수라서 앱의 클라이언트 컴포넌트에서만 넘긴다. 화면 아래에서 올라오는 시트이고, 아래로 밀거나 바깥을 누르거나 Esc를 누르거나 머리의 닫기 버튼을 누르면 닫힌다. 열리면 포커스가 시트 안에 머물고 뒤 화면은 스크롤되지 않으며, 닫히면 포커스가 열기 전 요소(보통 여는 버튼)로 돌아간다. 본문이 길면 `Drawer.Body`만 스크롤되고 `Drawer.Footer`는 늘 보인다. `Drawer.Trigger` 없이 쓰려면 `Drawer.Root`에 `open`과 `onOpenChange`를 넘겨 열림 상태를 제어한다.",
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
} satisfies Meta<typeof Drawer.Root>;

export default meta;

type Story = StoryObj<typeof Drawer.Root>;

/** 여는 버튼, 머리, 본문만 있는 시트. 열림 상태는 Drawer가 스스로 관리한다. */
export const Default: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger>열기</Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>제목</Drawer.Title>
          <Drawer.Description>시트에 대한 짧은 설명.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>
          <p className="text-body">
            아래로 밀거나, 바깥을 누르거나, Esc를 누르면 닫힌다.
          </p>
        </Drawer.Body>
      </Drawer.Popup>
    </Drawer.Root>
  ),
};

/** `Drawer.Footer`의 `Drawer.Close`는 열림 상태를 제어하지 않아도 시트를 닫는다. 본문이 길어도 footer는 늘 보인다. */
export const WithFooter: Story = {
  render: () => (
    <Drawer.Root>
      <Drawer.Trigger>열기</Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>긴 본문</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="flex flex-col gap-md">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-body">
                본문 {i + 1}번째 줄
              </p>
            ))}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close>취소</Drawer.Close>
          <Drawer.Close variant="primary">확인</Drawer.Close>
        </Drawer.Footer>
      </Drawer.Popup>
    </Drawer.Root>
  ),
};

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
 * 고르는 중인 값은 적용(`Drawer.Close`의 `onClick`)을 눌러야 반영되고, 적용 없이 닫으면 버린다.
 */
export const WithToggleGroup: Story = {
  render: function Render() {
    const [applied, setApplied] = useState<Filters>({ a: ['a2'], b: [] });
    const [draft, setDraft] = useState<Filters>(applied);
    // 초기화할 때 ToggleGroup을 다시 그려 빈 값으로 되돌린다. ToggleGroup은 비제어로만 쓴다.
    const [resetKey, setResetKey] = useState(0);
    return (
      <div className="flex flex-col items-start gap-md">
        <Drawer.Root
          onOpenChange={(nextOpen) => {
            if (nextOpen) setDraft(applied);
          }}
        >
          <Drawer.Trigger>필터</Drawer.Trigger>
          <Drawer.Popup>
            <Drawer.Header>
              <Drawer.Title>필터</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
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
            </Drawer.Body>
            <Drawer.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setDraft(emptyFilters);
                  setResetKey((k) => k + 1);
                }}
              >
                초기화
              </Button>
              <Drawer.Close variant="primary" onClick={() => setApplied(draft)}>
                적용
              </Drawer.Close>
            </Drawer.Footer>
          </Drawer.Popup>
        </Drawer.Root>
        <p className="text-body-sm text-text-secondary">
          적용한 값: {[...applied.a, ...applied.b].join(', ') || '없음'}
        </p>
      </div>
    );
  },
};

/**
 * 여는 버튼을 Drawer와 떨어진 곳에 둔다. `Drawer.Trigger`를 빼고 `Drawer.Root`에 `open`과 `onOpenChange`를 넘긴다.
 * 버튼 모양과 위치는 쓰는 쪽이 정한다. 닫히면 포커스가 이 버튼으로 돌아간다.
 */
export const WithoutTrigger: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <span className="text-title font-bold">목록</span>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            따로 둔 버튼
          </Button>
        </div>
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Popup>
            <Drawer.Header>
              <Drawer.Title>제목</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <p className="text-body">
                Esc나 바깥 누르기로 닫으면 포커스가 따로 둔 버튼으로 돌아간다.
              </p>
            </Drawer.Body>
          </Drawer.Popup>
        </Drawer.Root>
      </div>
    );
  },
};

/**
 * overlay-kit으로 시트를 코드로 연다. 상태를 따로 두지 않고 `overlay.openAsync`가 준 값을 그대로 넘긴다.
 * `isOpen`은 `open`에, `close`는 `onOpenChange`와 footer 버튼에, `unmount`는 닫히는 애니메이션이 끝난 뒤 부르는 `onCloseComplete`에 넘긴다.
 * `openAsync`는 `close`에 넘긴 값으로 끝나므로, 확인을 눌렀는지 결과로 받을 수 있다.
 */
export const WithOverlayKit: Story = {
  render: function Render() {
    const [result, setResult] = useState('아직 열지 않음');
    return (
      <OverlayProvider>
        <div className="flex flex-col items-start gap-md">
          <Button
            variant="secondary"
            onClick={async () => {
              const confirmed = await overlay.openAsync<boolean>(
                ({ isOpen, close, unmount }) => (
                  <Drawer.Root
                    open={isOpen}
                    onOpenChange={() => close(false)}
                    onCloseComplete={unmount}
                  >
                    <Drawer.Popup>
                      <Drawer.Header>
                        <Drawer.Title>제목</Drawer.Title>
                        <Drawer.Description>
                          overlay-kit으로 연 시트.
                        </Drawer.Description>
                      </Drawer.Header>
                      <Drawer.Body>
                        <p className="text-body">
                          확인을 누르면 true, 그 밖의 방법으로 닫으면 false로
                          끝난다.
                        </p>
                      </Drawer.Body>
                      <Drawer.Footer>
                        <Button onClick={() => close(true)}>확인</Button>
                      </Drawer.Footer>
                    </Drawer.Popup>
                  </Drawer.Root>
                ),
              );
              setResult(confirmed ? '확인을 눌러 닫음' : '확인 없이 닫음');
            }}
          >
            overlay-kit으로 열기
          </Button>
          <p className="text-body-sm text-text-secondary">결과: {result}</p>
        </div>
      </OverlayProvider>
    );
  },
};
