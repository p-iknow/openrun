'use client';

import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { cn } from './cn.js';

// 클라이언트용 컴포넌트다. 지시어와 props 규칙은 Button과 같다.
// 검색 막대처럼 쓰는 입력 칸이다. 예매 사이트의 검색 칸처럼 라벨을 화면에 보이지 않고, 오른쪽 돋보기 버튼이 감싼 폼을 제출한다.
// 라벨은 sr-only로 남겨 스크린 리더가 읽는 이름이 된다. placeholder는 라벨을 대신하지 않는다.
// Tailwind가 dist에서 클래스를 찾을 수 있도록 클래스 이름을 문자열 그대로 둔다.

export interface SearchFieldProps {
  /** 화면에는 보이지 않고 스크린 리더가 읽는 이름. 예: `공연 제목 검색`. */
  label: string;
  /** 폼으로 제출할 때 쓰는 이름. 예: 제목 검색이면 `q`. */
  name?: string;
  /** 무엇을 찾는지 알려 주는 짧은 글자. 입력하면 사라진다. */
  placeholder?: string;
  /** 처음 값. 비제어로만 쓴다. 주소의 검색어를 채울 때 쓴다. */
  defaultValue?: string;
  /** 입력할 수 있는 최대 글자 수(UTF-16 단위). 서버가 받는 길이를 넘지 않게 막을 때 쓴다. */
  maxLength?: number;
  /** 돋보기 버튼의 접근 가능한 이름. */
  submitLabel?: string;
}

export function SearchField({
  label,
  name,
  placeholder,
  defaultValue,
  maxLength,
  submitLabel = '검색',
}: SearchFieldProps) {
  return (
    <Field.Root name={name} className="relative">
      <Field.Label className="sr-only">{label}</Field.Label>
      <Input
        type="search"
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className={cn(
          // 오른쪽 돋보기 버튼 자리(52px)만큼 글자가 들어가지 않게 비운다.
          'h-[52px] w-full rounded-button border border-border-input bg-surface pr-[52px] pl-lg text-body text-text transition-colors',
          'hover:not-focus:border-border-input-hover',
          // 흰 바탕에서도 text-tertiary는 대비가 약 3:1이라, 4.5:1을 넘는 text-secondary를 쓴다.
          'placeholder:text-text-secondary',
          // 포커스 모양은 TextField와 같다.
          'outline-primary focus:border-primary focus:outline-1 focus:-outline-offset-2',
        )}
      />
      <button
        type="submit"
        aria-label={submitLabel}
        className={cn(
          'absolute top-0 right-0 flex size-[52px] items-center justify-center rounded-button text-text-secondary transition-colors',
          'hover:text-primary',
          'outline-primary focus-visible:outline-2 focus-visible:-outline-offset-4',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[20px]"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" />
        </svg>
      </button>
    </Field.Root>
  );
}
