// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.

// 문서 순서. 각 문서의 앞뒤 링크와 index.html의 전체 목록을 여기서 만든다.
// 새 문서를 만들면 여기에 한 줄 추가한다.
const learnDocuments = [
  ['001-nestjs-기초.html', '001 NestJS 기초'],
  ['002-데코레이터와-메타데이터.html', '002 데코레이터와 메타데이터'],
  ['003-의존성-주입.html', '003 의존성 주입'],
  ['004-drizzle-스키마와-DB-연결.html', '004 Drizzle 스키마와 DB 연결'],
  ['005-통합-테스트-구성.html', '005 통합 테스트 구성'],
  ['006-nextjs-렌더링-시점과-캐시.html', '006 Next.js 렌더링 시점과 캐시'],
  ['007-openapi-fetch로-API-호출과-오류-처리.html', '007 openapi-fetch 호출과 오류 처리'],
];

function linkItem(href, label, kind) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = href;
  if (kind) {
    const kindElement = document.createElement('span');
    kindElement.className = 'doc-nav-kind';
    kindElement.textContent = kind;
    link.append(kindElement);
  }
  link.append(label);
  item.append(link);
  return item;
}

// 목록에 있는 문서면 목차 아래에 앞뒤 문서와 전체 목록 링크를 그린다.
function renderDocumentNav() {
  const nav = document.querySelector('nav');
  const currentFile = decodeURIComponent(location.pathname).split('/').pop();
  const index = learnDocuments.findIndex(([file]) => file === currentFile);
  if (!nav || index === -1) return;

  const heading = document.createElement('strong');
  heading.textContent = '학습 문서';
  const list = document.createElement('ol');
  list.className = 'doc-nav';
  const previous = learnDocuments[index - 1];
  const next = learnDocuments[index + 1];
  if (previous) list.append(linkItem(previous[0], previous[1], '이전'));
  if (next) list.append(linkItem(next[0], next[1], '다음'));
  list.append(linkItem('index.html', `전체 문서 (${learnDocuments.length})`));
  nav.append(heading, list);
}

// index.html의 [data-doc-index] 목록을 채운다.
function renderDocumentIndex() {
  const list = document.querySelector('[data-doc-index]');
  if (!list) return;
  for (const [file, label] of learnDocuments) {
    list.append(linkItem(file, label));
  }
}

// `language-*` 클래스가 있는 코드 블록만 강조한다. 클래스가 없는 블록은 그대로 둔다.
function highlightCode() {
  document.querySelectorAll('pre code[class*="language-"]').forEach((codeElement) => {
    hljs.highlightElement(codeElement);
  });
}

renderDocumentNav();
renderDocumentIndex();
highlightCode();
