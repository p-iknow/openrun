# openrun

가상의 공연을 예매하는 티켓팅 플랫폼이다. 풀스택 학습과 포트폴리오를 위해 만든다.

| 경로                  | 내용                                       |
| --------------------- | ------------------------------------------ |
| `apps/store`          | 스토어 화면 (Next.js)                      |
| `apps/api`            | API (NestJS, Drizzle, PostgreSQL)          |
| `packages/api-client` | `apps/api/openapi.json`에서 만든 API 클라이언트 |

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

pnpm dev                    # 스토어와 API 함께 실행
```

<http://localhost:3001>을 열면 DB에 저장된 공연 제목이 보인다. API는 <http://localhost:3000/shows>에서 응답한다.

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
