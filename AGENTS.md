## 코딩 표준

코드를 쓰거나 리뷰할 때 `CODING_STANDARDS.md`를 따른다.

## 실제 서비스와 같은 결정

도메인 규칙, 데이터 구조, 화면 흐름을 정할 때는 실제 예매 서비스(인터파크 티켓, YES24 티켓, 멜론티켓 등)가 하는 방식을 기준으로 삼는다. 실제 방식을 확신하지 못하면 조사해서 근거와 함께 제시한다. 범위는 줄여도 되지만(기능을 빼거나 시드로 대신하기), 남긴 모델은 실제와 같은 모양으로 둔다. 실제와 다르게 정할 때는 무엇이 다르고 왜 그런지 스펙, ADR, PR 중 그 결정을 남기는 곳에 적는다.

## Agent skills

### Issue tracker

이슈와 스펙은 GitHub Issues(`p-iknow/openrun`)에서 관리한다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 라벨 5개를 그대로 쓴다. See `docs/agents/triage-labels.md`.

### Domain docs

단일 구성으로, 루트의 `GLOSSARY.md`와 `docs/adr/`를 쓴다. See `docs/agents/domain.md`.

### Ticket workflow

`/implement`로 티켓을 구현할 때 브랜치, PR, 이해 확인 질문은 `docs/agents/ticket-workflow.md`를 따른다.

## 병합 후 정리

사용자가 PR을 병합했다고 알리면 `main`으로 옮겨 최신으로 맞추고 PR의 로컬 브랜치를 지운다. squash 병합한 브랜치는 `git branch -d`가 거부하므로, PR이 `MERGED`이고 PR의 마지막 커밋이 로컬 브랜치 끝과 같은지 확인한 뒤 `git branch -D`로 지운다. 완료 기준: `git branch` 목록에 그 브랜치가 없다.
