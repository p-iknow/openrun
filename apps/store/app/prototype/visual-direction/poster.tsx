// PROTOTYPE: 3:4 가짜 포스터. 실제 시드 포스터(1.3)를 대신한다.
import type { MockShow } from './mock-data';

export function Poster({
  show,
  className,
}: {
  show: MockShow;
  className?: string;
}) {
  const [a, b] = show.posterHue;
  const gradientId = `poster-${show.id}`;
  return (
    <svg
      className={className}
      viewBox="0 0 300 400"
      role="img"
      aria-label={`${show.title} 포스터`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${a} 55% 28%)`} />
          <stop offset="100%" stopColor={`hsl(${b} 65% 52%)`} />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${gradientId})`} />
      <circle
        cx={80 + ((show.id * 37) % 160)}
        cy={120 + ((show.id * 53) % 120)}
        r="70"
        fill="white"
        opacity="0.12"
      />
      <circle
        cx={220 - ((show.id * 29) % 120)}
        cy={260}
        r="110"
        fill="black"
        opacity="0.15"
      />
      <text
        x="24"
        y="44"
        fill="white"
        opacity="0.8"
        fontSize="14"
        letterSpacing="3"
      >
        {show.genre}
      </text>
      <text x="24" y="330" fill="white" fontSize="28" fontWeight="800">
        {show.title.length > 9 ? `${show.title.slice(0, 9)}…` : show.title}
      </text>
      <text x="24" y="362" fill="white" opacity="0.75" fontSize="13">
        {show.period}
      </text>
    </svg>
  );
}
