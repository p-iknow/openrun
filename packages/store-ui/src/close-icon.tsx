// Drawer와 Dialog 머리의 닫기 버튼 안에 그리는 X 아이콘. 패키지 진입점에서는 내보내지 않는다.
// 버튼의 접근 가능한 이름은 버튼의 aria-label이 맡으므로 아이콘은 스크린 리더에서 숨긴다.
export function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-[20px]"
    >
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}
