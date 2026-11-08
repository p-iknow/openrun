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
pnpm db:seed                # 공연 데이터 넣기

pnpm dev                    # 스토어, API, store-ui 감시 빌드 함께 실행
```

<http://localhost:3001>을 열면 DB에 저장된 공연 제목이 보인다. API는 <http://localhost:3000/shows>에서 응답한다.

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
- Tailwind에는 의미 토큰만 노출한다. 색은 `bg-primary`, `text-text-secondary`처럼, 간격·글자 크기·모서리·최대 폭은 `p-lg`, `text-body`, `rounded-card`, `max-w-content`처럼 쓴다. `bg-blue-500`, `p-4`, `text-sm`, `max-w-7xl` 같은 기본 클래스는 만들어지지 않는다.
- 컴포넌트는 `@openrun/store-ui`에서 import한다. 서버용 컴포넌트는 Server Component에서 바로 쓸 수 있다.

| 컴포넌트 | 구분 |
| -------- | ---- |
| Badge    | 서버 |
| Skeleton | 서버 |

### Storybook

```sh
pnpm storybook              # http://localhost:6006
```

앱과 API 없이 토큰(`Foundations/Tokens`)과 컴포넌트를 본다. 토큰 화면은 `tokens.css`를 직접 읽어 그리므로 토큰을 고치면 함께 바뀐다. 글꼴은 스토어와 같은 `pretendard` 패키지의 파일을 `@font-face`로 불러온다. 접근성 애드온은 위반을 실패로 표시한다.

스토리는 소스 옆에 `*.stories.tsx`로 두며 `dist`에는 들어가지 않는다. `store-ui`의 `build`가 Storybook도 `storybook-static`에 빌드하므로, 스토리가 깨지면 `pnpm build`가 실패한다.
