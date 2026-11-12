# openrun

가상의 공연을 예매하는 티켓팅 플랫폼이다. 풀스택 학습과 포트폴리오를 위해 만든다.

| 경로                  | 내용                                       |
| --------------------- | ------------------------------------------ |
| `apps/store`          | 스토어 화면 (Next.js)                      |
| `apps/api`            | API (NestJS, Drizzle, PostgreSQL)          |
| `packages/api-client` | `apps/api/openapi.json`에서 만든 API 클라이언트 |
| `packages/store-ui`   | 스토어 디자인 시스템 (토큰, 컴포넌트)      |

## 준비물

- [mise](https://mise.jdx.dev/): Node와 pnpm 버전을 `.mise.toml`에 맞춘다.
- Docker: PostgreSQL과 Mailpit을 띄운다.

## 실행

```sh
mise install                # Node, pnpm 설치
pnpm install                # 의존성 설치

cp apps/api/.env.example apps/api/.env
cp apps/store/.env.example apps/store/.env

pnpm infra:up               # PostgreSQL, Mailpit 실행
pnpm db:migrate             # 마이그레이션 적용
pnpm db:seed                # 개발용 공연 데이터 넣기

pnpm dev                    # 스토어, API, store-ui 감시 빌드 함께 실행
```

<http://localhost:3001>을 열면 공연 카드 목록이 보인다. API는 <http://localhost:3000/shows>에서 응답한다.

`pnpm db:seed`는 공연장 3곳, 공연 20개, 공연마다 3~15회차를 넣는다. 다시 실행하면 비우고 다시 넣는다. 공연의 제목, 장르, 관람 연령, 러닝타임, 소개(한 줄 소개, 줄거리, 관람 포인트)는 `apps/api/src/db/seed-shows.ts`에 직접 쓴 가상의 내용이다. Faker 시드 값이 고정이라 공연장과 회차 수도 늘 같고, 날짜만 실행 시각 기준으로 다시 만든다.

시드는 공연마다 가상의 포스터(장르별 그림과 색, 제목, 공연 기간, 공연장)와 상세 이미지 두 장(소개, 관람 포인트)을 PNG로 만들어 `apps/store/public/show-images/`의 `posters/`, `details/`에 쓴다. 이 폴더는 git에 올리지 않으며 시드를 다시 돌리면 다시 만든다. 이미 시드를 넣은 DB에 `pnpm db:migrate`로 포스터 경로 컬럼을 더하면 공연과 회차가 비워지므로 `pnpm db:seed`를 다시 실행한다.

| 환경 변수         | 파일                                | 뜻                                                                                                                      |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | `apps/api/.env`                     | PostgreSQL 주소                                                                                                         |
| `SHOW_IMAGE_BASE_URL` | `apps/api/.env`, `apps/store/.env` | 공연 이미지(포스터, 상세 이미지) 저장소의 주소. API는 이 값과 저장소 안 경로를 합친 완전한 URL을 돌려주고, 스토어는 이 주소의 이미지만 `next/image`로 최적화한다. 두 파일의 값을 같게 둔다. |
| `API_INTERNAL_URL` | `apps/store/.env`                  | 서버 렌더링이 API를 호출하는 내부 주소                                                                                  |

`pnpm dev`는 `packages/store-ui`를 감시 빌드하므로 토큰이나 컴포넌트를 고치면 스토어에 바로 반영된다.

끝낼 때는 `pnpm dev`를 Ctrl+C로 멈추고 `pnpm infra:down`을 실행한다.

## 검사

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:integration       # Docker 필요. pre-commit에서는 돌지 않는다.
pnpm build                  # API와 DB 없이 통과한다.
```

## store-ui

`packages/store-ui`는 tsc로 소스 파일 하나당 출력 파일 하나를 `dist`에 만든다. 스토어의 빌드와 타입 검사는 이 빌드 뒤에 실행된다.

- 토큰은 `@openrun/store-ui/tokens.css`에 있다. 스토어는 `apps/store/app/globals.css`에서 Tailwind 뒤에 불러오고, `@source`로 `dist`를 읽어 컴포넌트가 쓰는 클래스를 만든다.
- Tailwind에는 의미 토큰만 노출한다. 색은 `bg-primary`, `text-text-secondary`처럼, 간격·글자 크기·모서리·최대 폭은 `p-lg`, `text-body`, `rounded-card`, `max-w-content`처럼 쓴다. `bg-blue-500`, `p-4`, `text-sm`, `max-w-7xl` 같은 기본 클래스는 만들어지지 않는다. 예외로 `0`은 `--spacing-0` 토큰이 있어 `p-0`, `m-0`, `gap-0`, `inset-0`처럼 숫자로 쓸 수 있다.
- 클래스는 Tailwind v4의 짧은 문법으로 쓴다. `aspect-[3/4]`가 아니라 `aspect-3/4`, `max-h-[var(--x)]`가 아니라 `max-h-(--x)`다. `apps/store`와 `packages/store-ui`의 oxlint가 `eslint-plugin-better-tailwindcss`의 `enforce-canonical-classes`로 검사하고, `pnpm lint`와 pre-commit에서 실패한다. `oxlint --fix`로 고칠 수 있다. `rootFontSize`를 주지 않아 `h-[16px]`를 `h-lg` 같은 토큰으로 바꾸라고 하지는 않는다. 이 검사는 `className`, `cn`, `cva` 같은 곳의 클래스만 읽으므로, 스토리의 `args` 같은 일반 문자열은 리뷰에서 확인한다.
- 이 플러그인은 패키지 폴더에서 실행해야 `tailwindcss`와 CSS 진입 파일을 찾는다. 그래서 두 패키지에 각자 `.lintstagedrc`를 두어 lint-staged가 그 폴더에서 oxlint를 돌리게 했다. lint-staged는 설정을 합치지 않으므로 루트 `.lintstagedrc`를 바꾸면 두 파일도 같이 바꾼다.
- 컴포넌트는 `@openrun/store-ui`에서 import한다. 서버용 컴포넌트는 Server Component에서 바로 쓸 수 있다.
- 클라이언트용 컴포넌트는 파일 첫 줄(import보다 앞)에 `'use client'`를 둔다. tsc가 파일별로 출력하므로 지시어가 `dist`에도 남는다. Server Component에서도 import할 수 있지만 직렬화할 수 있는 props(문자열, 숫자, 불리언, 요소)만 넘긴다. `onClick` 같은 함수는 앱의 클라이언트 컴포넌트에서 넘긴다.
- 지시어가 빠졌을 때 `next build`가 실패하는 것은 그 파일이 훅(`useState` 등)을 직접 import할 때뿐이다. Button처럼 Base UI 컴포넌트(이미 `'use client'`가 있다)를 감싸기만 하는 파일은 지시어가 빠져도 빌드가 통과하므로 리뷰에서 확인한다.
- 클래스는 `@openrun/store-ui`의 `cn`으로 합친다. 조건부 클래스를 이어 붙이고(clsx), 같은 속성의 클래스는 뒤에 온 것만 남긴다(tailwind-merge). 의미 토큰 이름을 알도록 설정했으므로, `tokens.css`에 글자 크기·간격·모서리·그림자·최대 폭 토큰을 추가하면 `packages/store-ui/src/cn.ts`에도 추가한다. 글자 크기, 간격, 모서리는 빠뜨리면 `cn.spec.ts`가 실패한다.

| 컴포넌트 | 구분 |
| -------- | ---- |
| Badge    | 서버 |
| Skeleton | 서버 |
| Button   | 클라이언트 |

### Storybook

```sh
pnpm storybook              # http://localhost:6006
```

앱과 API 없이 토큰(`Foundations/Tokens`)과 컴포넌트를 본다. 토큰 화면은 `tokens.css`를 직접 읽어 그리므로 토큰을 고치면 함께 바뀐다. 글꼴은 스토어와 같은 `pretendard` 패키지의 파일을 `@font-face`로 불러온다. 스토리마다 아래 Accessibility 탭에서 접근성 위반을 확인한다. 빌드는 접근성 위반으로 실패하지 않는다.

스토리는 소스 옆에 `*.stories.tsx`로 두며 `dist`에는 들어가지 않는다. Storybook 빌드는 `store-ui`의 `build`와 별도인 `build-storybook` 작업이다. 루트 `pnpm build`가 두 작업을 함께 돌리므로 스토리가 깨지면 `pnpm build`가 실패한다. `dev`, `typecheck` 등은 `build`(tsc)만 기다리고 Storybook 빌드는 기다리지 않는다.
