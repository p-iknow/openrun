## 코딩 표준

코드를 쓰거나 리뷰할 때 `CODING_STANDARDS.md`를 따른다.

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
