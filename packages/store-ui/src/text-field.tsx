'use client';

import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// Server Component에서 쓸 때는 직렬화할 수 있는 props만 넘기고, onValueChange는 클라이언트 컴포넌트에서만 넘긴다.
// Field.Root가 라벨과 입력 칸에 같은 id를 이어 주고, 비활성·포커스 상태를 data-disabled, data-focused로 둘 다에 붙인다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

export interface TextFieldProps {
  /** 늘 보이는 라벨. 입력 칸의 접근 가능한 이름이 된다. */
  label: string;
  /** 폼으로 제출할 때 쓰는 이름. 예: 제목 검색이면 `q`. */
  name?: string;
  /** `search`이면 모바일 키보드에 검색 키가 나오고, 브라우저가 지우기 버튼을 붙이기도 한다. */
  type?: 'text' | 'search';
  /** 라벨을 대신하지 않는 짧은 예시. 입력하면 사라진다. */
  placeholder?: string;
  /** 처음 값. 비제어로만 쓰고, 바뀐 값은 `onValueChange`로 받는다. 주소의 검색어를 채울 때 쓴다. */
  defaultValue?: string;
  /** 함수라서 Server Component에서는 넘길 수 없다. 앱의 클라이언트 컴포넌트에서 넘긴다. */
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function TextField({
  label,
  name,
  type = 'text',
  placeholder,
  defaultValue,
  onValueChange,
  disabled = false,
}: TextFieldProps) {
  return (
    <Field.Root
      name={name}
      disabled={disabled}
      className="flex flex-col gap-sm"
    >
      <Field.Label className="text-body-sm font-semibold text-text-secondary data-disabled:text-text-tertiary">
        {label}
      </Field.Label>
      <Input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        className={cn(
          // 방향 A: 테두리 없이 회색 면으로 칸을 보이고, 모서리는 Button과 같은 14px로 맞춘다.
          'h-[52px] w-full rounded-button bg-surface-muted px-lg text-body text-text transition-colors',
          // 회색 면 위에서 대비 4.5:1을 넘는 글자 토큰은 text-secondary뿐이라 placeholder도 이 색을 쓴다.
          'placeholder:text-text-secondary',
          // 입력 칸은 마우스로 눌러도 어디에 쓰는지 보여야 하므로 focus-visible이 아니라 focus에 테두리를 그린다.
          // 안쪽으로 그려 옆 요소와 겹치지 않게 하고, 바탕을 흰색으로 바꿔 쓰는 중임을 드러낸다.
          // 테두리 색은 평소에 정해 둔다. 포커스 때 정하면 transition-colors가 글자색(검정)에서 파랑으로 넘어가며 깜빡인다.
          'outline-primary focus:bg-surface focus:outline-2 focus:-outline-offset-2',
          'data-disabled:cursor-not-allowed data-disabled:text-text-tertiary',
        )}
      />
    </Field.Root>
  );
}
