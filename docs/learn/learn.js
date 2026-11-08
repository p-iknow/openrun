// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.

// 모든 문서의 목차 아래에 그리는 문서 목록. 새 문서를 만들면 여기에 한 줄 추가한다.
const learnDocuments = [
  ['001-nestjs-기초.html', '001 NestJS 기초'],
  ['002-데코레이터와-메타데이터.html', '002 데코레이터와 메타데이터'],
  ['003-의존성-주입.html', '003 의존성 주입'],
  ['004-drizzle-스키마와-DB-연결.html', '004 Drizzle 스키마와 DB 연결'],
  ['005-통합-테스트-구성.html', '005 통합 테스트 구성'],
  ['006-nextjs-렌더링-시점과-캐시.html', '006 Next.js 렌더링 시점과 캐시'],
  ['007-openapi-fetch로-API-호출과-오류-처리.html', '007 openapi-fetch 호출과 오류 처리'],
];

function renderDocumentList() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const currentFile = decodeURIComponent(location.pathname).split('/').pop();

  const heading = document.createElement('strong');
  heading.textContent = '학습 문서';
  const list = document.createElement('ol');
  list.className = 'doc-list';
  for (const [file, label] of learnDocuments) {
    const link = document.createElement('a');
    link.href = file;
    link.textContent = label;
    if (file === currentFile) link.setAttribute('aria-current', 'page');
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  nav.append(heading, list);
}

// `language-*` 클래스가 있는 코드 블록만 강조한다. 클래스가 없는 블록은 그대로 둔다.
function highlightCode() {
  document.querySelectorAll('pre code[class*="language-"]').forEach((codeElement) => {
    hljs.highlightElement(codeElement);
  });
}

renderDocumentList();
highlightCode();
