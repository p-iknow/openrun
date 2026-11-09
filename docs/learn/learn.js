// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.

// 문서 순서와 태그. 각 문서의 태그, 앞뒤 링크, index.html의 전체 목록을 여기서 만든다.
// 새 문서를 만들면 여기에 한 줄 추가한다. 태그 이름은 README.md의 태그 목록을 따른다.
const learnDocuments = [
  { file: '001-nestjs-기초.html', title: '001 NestJS 기초', tags: ['nestjs'] },
  { file: '002-데코레이터와-메타데이터.html', title: '002 데코레이터와 메타데이터', tags: ['nestjs'] },
  { file: '003-의존성-주입.html', title: '003 의존성 주입', tags: ['nestjs'] },
  { file: '004-drizzle-스키마와-DB-연결.html', title: '004 Drizzle 스키마와 DB 연결', tags: ['drizzle', 'nestjs'] },
  { file: '005-통합-테스트-구성.html', title: '005 통합 테스트 구성', tags: ['testing'] },
  { file: '006-nextjs-렌더링-시점과-캐시.html', title: '006 Next.js 렌더링 시점과 캐시', tags: ['nextjs'] },
  {
    file: '007-openapi-fetch로-API-호출과-오류-처리.html',
    title: '007 openapi-fetch 호출과 오류 처리',
    tags: ['openapi', 'nextjs'],
  },
  { file: '008-토큰-CSS를-읽는-파서.html', title: '008 토큰 CSS를 읽는 파서', tags: ['design-system', 'testing'] },
  { file: '009-storybook-설정과-스토리-문법.html', title: '009 Storybook 설정과 스토리 문법', tags: ['design-system'] },
  { file: '010-cn과-tailwind-merge-확장.html', title: '010 cn과 tailwind-merge 확장', tags: ['design-system'] },
  {
    file: '011-버튼으로-보는-tailwind-배치와-상태-패턴.html',
    title: '011 Button으로 보는 Tailwind 배치와 상태 패턴',
    tags: ['design-system'],
  },
  {
    file: '012-라이브러리-빌드와-use-client-경계.html',
    title: "012 라이브러리 빌드와 'use client' 경계",
    tags: ['design-system', 'nextjs'],
  },
  {
    file: '013-useRender로-요소-바꿔-끼우기.html',
    title: '013 useRender로 요소 바꿔 끼우기',
    tags: ['base-ui', 'design-system'],
  },
  {
    file: '014-서버가-받는-use-client-이름표.html',
    title: "014 서버가 받는 'use client' 파일: 이름표 붙은 가짜",
    tags: ['nextjs'],
  },
];

const currentFile = decodeURIComponent(location.pathname).split('/').pop();
const currentIndex = learnDocuments.findIndex((doc) => doc.file === currentFile);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 태그 하나를 전체 목록 페이지의 그 태그 보기로 가는 링크로 만든다.
function tagList(tags, hrefPrefix) {
  const list = element('ul', 'tags');
  list.setAttribute('aria-label', '태그');
  for (const tag of tags) {
    const link = element('a', '', tag);
    link.href = `${hrefPrefix}#${tag}`;
    const item = element('li');
    item.append(link);
    list.append(item);
  }
  return list;
}

// 목록에 있는 문서면 제목 아래에 태그를 그린다.
function renderTags() {
  const heading = document.querySelector('main h1');
  if (currentIndex === -1 || !heading) return;
  heading.after(tagList(learnDocuments[currentIndex].tags, 'index.html'));
}

function navItem(href, label, kind) {
  const item = element('li');
  const link = element('a');
  link.href = href;
  if (kind) link.append(element('span', 'doc-nav-kind', kind));
  link.append(label);
  item.append(link);
  return item;
}

// 목록에 있는 문서면 목차 아래에 앞뒤 문서와 전체 목록 링크를 그린다.
function renderDocumentNav() {
  const nav = document.querySelector('nav');
  if (!nav || currentIndex === -1) return;

  const list = element('ol', 'doc-nav');
  const previous = learnDocuments[currentIndex - 1];
  const next = learnDocuments[currentIndex + 1];
  if (previous) list.append(navItem(previous.file, previous.title, '이전'));
  if (next) list.append(navItem(next.file, next.title, '다음'));
  list.append(navItem('index.html', `전체 문서 (${learnDocuments.length})`));
  nav.append(element('strong', '', '학습 문서'), list);
}

// index.html의 [data-doc-index]에 태그 필터와 전체 목록을 그린다.
// 주소의 #태그로 고른 태그의 문서만 보여 주고, #이 없으면 전체를 보여 준다.
function renderDocumentIndex() {
  const container = document.querySelector('[data-doc-index]');
  if (!container) return;

  const allTags = [...new Set(learnDocuments.flatMap((doc) => doc.tags))];
  const filter = element('ul', 'tags tag-filter');
  filter.setAttribute('aria-label', '태그로 고르기');
  const filterLinks = [['', `전체 ${learnDocuments.length}`]].concat(
    allTags.map((tag) => [tag, `${tag} ${learnDocuments.filter((doc) => doc.tags.includes(tag)).length}`]),
  );
  for (const [tag, label] of filterLinks) {
    const link = element('a', '', label);
    link.href = `#${tag}`;
    link.dataset.tag = tag;
    const item = element('li');
    item.append(link);
    filter.append(item);
  }

  const list = element('ol', 'doc-index');
  for (const doc of learnDocuments) {
    const item = element('li');
    item.dataset.tags = doc.tags.join(' ');
    const link = element('a', '', doc.title);
    link.href = doc.file;
    item.append(link, tagList(doc.tags, ''));
    list.append(item);
  }
  container.append(filter, list);

  function applyFilter() {
    const selected = decodeURIComponent(location.hash.slice(1));
    const tag = allTags.includes(selected) ? selected : '';
    for (const link of filter.querySelectorAll('a')) {
      if (link.dataset.tag === tag) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    for (const item of list.children) {
      item.hidden = tag !== '' && !item.dataset.tags.split(' ').includes(tag);
    }
  }
  window.addEventListener('hashchange', applyFilter);
  applyFilter();
}

// `language-*` 클래스가 있는 코드 블록만 강조한다. 클래스가 없는 블록은 그대로 둔다.
function highlightCode() {
  document.querySelectorAll('pre code[class*="language-"]').forEach((codeElement) => {
    hljs.highlightElement(codeElement);
  });
}

renderTags();
renderDocumentNav();
renderDocumentIndex();
highlightCode();
