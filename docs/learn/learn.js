// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.

// 폴더와 폴더 안 문서 순서, 태그. 각 문서의 태그, 앞뒤 링크, index.html의 전체 목록을 여기서 만든다.
// 새 문서를 만들면 그 폴더의 documents에 한 줄 추가한다. 태그 이름은 README.md의 태그 목록을 따른다.
const learnFolders = [
  {
    folder: 'next',
    title: 'Next.js',
    documents: [
      { file: '00-nextjs-렌더링-시점과-캐시.html', title: '00 Next.js 렌더링 시점과 캐시', tags: ['nextjs'] },
      { file: '01-openapi-fetch로-API-호출과-오류-처리.html', title: '01 openapi-fetch 호출과 오류 처리', tags: ['openapi', 'nextjs'] },
      { file: '02-서버가-받는-use-client-이름표.html', title: "02 서버가 받는 'use client' 파일: 이름표 붙은 가짜", tags: ['nextjs'] },
      { file: '03-서버-컴포넌트-단계와-SSR-단계.html', title: '03 Server Component 단계와 SSR 단계', tags: ['nextjs'] },
      { file: '04-server-component가-해결하는-문제.html', title: '04 Server Component가 해결하는 문제', tags: ['nextjs'] },
      { file: '05-hydration-자세히.html', title: '05 hydration 자세히', tags: ['nextjs'] },
      { file: '06-next-image가-해결하는-문제와-동작-방식.html', title: '06 next/image가 해결하는 문제와 동작 방식', tags: ['nextjs'] },
      { file: '07-redirect와-notFound-흐름을-끊는-함수.html', title: '07 redirect와 notFound: 흐름을 끊는 함수', tags: ['nextjs'] },
      { file: '08-useSearchParams와-Suspense-경계.html', title: '08 useSearchParams와 Suspense 경계', tags: ['nextjs'] },
      { file: '09-검색-폼-GET-폼과-비제어-입력.html', title: '09 검색 폼: GET 폼, 숨은 입력 칸, 비제어 입력과 key', tags: ['nextjs'] },
      { file: '10-숨은-입력-칸으로-쿼리-보존하기.html', title: '10 숨은 입력 칸으로 쿼리 보존하기', tags: ['nextjs'] },
    ],
  },
  {
    folder: 'nest',
    title: 'NestJS',
    documents: [
      { file: '00-nestjs-기초.html', title: '00 NestJS 기초', tags: ['nestjs'] },
      { file: '01-데코레이터와-메타데이터.html', title: '01 데코레이터와 메타데이터', tags: ['nestjs'] },
      { file: '02-의존성-주입.html', title: '02 의존성 주입', tags: ['nestjs'] },
      { file: '03-통합-테스트-구성.html', title: '03 통합 테스트 구성', tags: ['testing'] },
      { file: '04-예외-필터와-APP_FILTER.html', title: '04 예외 필터와 APP_FILTER', tags: ['nestjs'] },
      { file: '05-파이프와-검증.html', title: '05 파이프와 검증', tags: ['nestjs', 'openapi'] },
    ],
  },
  {
    folder: 'zod',
    title: 'zod',
    documents: [{ file: '00-zod-기초.html', title: '00 zod 기초: 실행 중에도 남는 타입', tags: ['zod'] }],
  },
  {
    folder: 'db-and-drizzle',
    title: 'DB와 Drizzle',
    documents: [
      { file: '00-drizzle-스키마와-DB-연결.html', title: '00 Drizzle 스키마와 DB 연결', tags: ['drizzle', 'nestjs'] },
      { file: '01-프론트엔드-개발자를-위한-DB-개념.html', title: '01 프론트엔드 개발자를 위한 DB 개념', tags: ['database'] },
      { file: '02-drizzle-스키마-문법.html', title: '02 Drizzle 스키마 문법', tags: ['drizzle'] },
      { file: '03-drizzle-쿼리-문법.html', title: '03 Drizzle 쿼리 문법', tags: ['drizzle'] },
      { file: '04-공연장-공연-회차-스키마.html', title: '04 공연장·공연·회차 스키마', tags: ['drizzle', 'database'] },
      { file: '05-공연-목록-쿼리-읽기.html', title: '05 공연 목록 쿼리 읽기', tags: ['drizzle', 'database'] },
      { file: '06-판매-상태-쿼리-읽기.html', title: '06 판매 상태 쿼리 읽기', tags: ['drizzle', 'database'] },
      { file: '07-구역-좌석-회차-좌석-스키마.html', title: '07 구역·좌석·회차 좌석 스키마', tags: ['drizzle', 'database'] },
      { file: '08-마이그레이션.html', title: '08 마이그레이션', tags: ['drizzle', 'database'] },
      { file: '09-공연-제목-검색-쿼리-읽기.html', title: '09 공연 제목 검색 쿼리 읽기', tags: ['drizzle', 'database'] },
    ],
  },
  {
    folder: 'design-system',
    title: '디자인 시스템',
    documents: [
      { file: '00-토큰-CSS를-읽는-파서.html', title: '00 토큰 CSS를 읽는 파서', tags: ['design-system', 'testing'] },
      { file: '01-storybook-설정과-스토리-문법.html', title: '01 Storybook 설정과 스토리 문법', tags: ['design-system'] },
      { file: '02-cn과-tailwind-merge-확장.html', title: '02 cn과 tailwind-merge 확장', tags: ['design-system'] },
      { file: '03-라이브러리-빌드와-use-client-경계.html', title: "03 라이브러리 빌드와 'use client' 경계", tags: ['design-system', 'nextjs'] },
      { file: '04-useRender로-요소-바꿔-끼우기.html', title: '04 useRender로 요소 바꿔 끼우기', tags: ['base-ui', 'design-system'] },
    ],
  },
  {
    folder: 'style',
    title: '스타일',
    documents: [
      { file: '00-tailwind-배치-패턴.html', title: '00 Tailwind 배치 패턴', tags: ['css'] },
      { file: '01-버튼으로-보는-tailwind-배치와-상태-패턴.html', title: '01 Button으로 보는 Tailwind 배치와 상태 패턴', tags: ['css', 'design-system'] },
    ],
  },
];

// 문서 하나하나에 폴더를 붙여 한 줄로 편다. 앞뒤 링크는 같은 폴더 안에서만 잇는다.
const learnDocuments = learnFolders.flatMap(({ folder, documents }) =>
  documents.map((doc) => ({ ...doc, folder, path: `${folder}/${doc.file}` })),
);

// 문서는 폴더 안에 있고 index.html은 루트에 있으므로, 주소의 마지막 두 조각으로 현재 문서를 찾는다.
const currentPath = decodeURIComponent(location.pathname).split('/').slice(-2).join('/');
const current = learnDocuments.find((doc) => doc.path === currentPath);
// 문서에서 루트(index.html, 다른 폴더)로 가는 상대 경로의 앞부분
const rootPrefix = current ? '../' : '';

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
  if (!current || !heading) return;
  heading.after(tagList(current.tags, `${rootPrefix}index.html`));
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

// 목록에 있는 문서면 목차 아래에 같은 폴더의 앞뒤 문서와 전체 목록 링크를 그린다.
function renderDocumentNav() {
  const nav = document.querySelector('nav');
  if (!nav || !current) return;

  const folder = learnFolders.find((f) => f.folder === current.folder);
  const index = folder.documents.findIndex((doc) => doc.file === current.file);
  const list = element('ol', 'doc-nav');
  const previous = folder.documents[index - 1];
  const next = folder.documents[index + 1];
  if (previous) list.append(navItem(previous.file, previous.title, '이전'));
  if (next) list.append(navItem(next.file, next.title, '다음'));
  list.append(navItem(`${rootPrefix}index.html`, `전체 문서 (${learnDocuments.length})`));
  nav.append(element('strong', '', folder.title), list);
}

// index.html의 [data-doc-index]에 태그 필터와 폴더별 목록을 그린다.
// 주소의 #태그로 고른 태그의 문서만 보여 주고, #이 없으면 전체를 보여 준다. 고른 태그의 문서가 없는 폴더는 숨긴다.
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
  container.append(filter);

  const groups = [];
  for (const { folder, title, documents } of learnFolders) {
    const group = element('section', 'doc-group');
    const list = element('ol', 'doc-index');
    for (const doc of documents) {
      const item = element('li');
      item.dataset.tags = doc.tags.join(' ');
      const link = element('a', '', doc.title);
      link.href = `${folder}/${doc.file}`;
      item.append(link, tagList(doc.tags, ''));
      list.append(item);
    }
    group.append(element('h2', '', title), list);
    container.append(group);
    groups.push({ group, list });
  }

  function applyFilter() {
    const selected = decodeURIComponent(location.hash.slice(1));
    const tag = allTags.includes(selected) ? selected : '';
    for (const link of filter.querySelectorAll('a')) {
      if (link.dataset.tag === tag) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    for (const { group, list } of groups) {
      for (const item of list.children) {
        item.hidden = tag !== '' && !item.dataset.tags.split(' ').includes(tag);
      }
      group.hidden = [...list.children].every((item) => item.hidden);
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
