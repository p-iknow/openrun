// file://로 열어도 동작하도록 ES 모듈이 아닌 일반 스크립트로 둔다.

// 폴더와 폴더 안 문서 순서, 태그. 각 문서의 태그, 앞뒤 링크, index.html의 전체 목록을 여기서 만든다.
// 새 문서를 만들면 그 폴더의 documents에 한 줄 추가한다. 태그 이름은 README.md의 태그 목록을 따른다.
const learnFolders = [
  {
    folder: 'react-next',
    title: 'React와 Next.js',
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
      { file: '09-검색-폼-제출과-비제어-입력.html', title: '09 검색 폼: 제출, 비제어 입력과 key', tags: ['nextjs'] },
      { file: '10-숨은-입력-칸으로-쿼리-보존하기.html', title: '10 숨은 입력 칸으로 쿼리 보존하기', tags: ['nextjs'] },
      { file: '11-useOptimistic이-해결하는-문제와-원리.html', title: '11 useOptimistic이 해결하는 문제와 원리', tags: ['react'] },
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
    documents: [
      { file: '00-zod-기초.html', title: '00 zod 기초: 실행 중에도 남는 타입', tags: ['zod'] },
      { file: '01-반복-쿼리를-배열로-받기.html', title: '01 반복 쿼리를 배열로 받기: preprocess, array, enum', tags: ['zod', 'url-state', 'openapi'] },
      { file: '02-체이닝의-실행-순서.html', title: '02 체이닝의 실행 순서: 이어 붙이기와 문지기', tags: ['zod'] },
    ],
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
      { file: '10-장르-판매-상태-필터-쿼리-읽기.html', title: '10 장르·판매 상태 필터 쿼리 읽기', tags: ['drizzle', 'database'] },
      { file: '11-행-단위-값과-그룹-단위-값.html', title: '11 행 단위 값과 그룹 단위 값, 함수 종속성', tags: ['database'] },
      { file: '12-좌석-등급-스키마와-복합-외래-키.html', title: '12 좌석 등급 스키마와 복합 외래 키', tags: ['drizzle', 'database'] },
      { file: '13-다대다-관계와-연결-테이블.html', title: '13 다대다 관계와 연결 테이블', tags: ['database'] },
      { file: '14-좌석-등급-쿼리-읽기.html', title: '14 좌석 등급 쿼리 읽기', tags: ['drizzle', 'database'] },
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
    folder: 'store-logic',
    title: '스토어 로직',
    documents: [
      { file: '00-공연-목록-쿼리-정리와-주소-만들기.html', title: '00 공연 목록 쿼리: 정리하고 주소 만들기', tags: ['url-state'] },
      { file: '01-필터-시트-임시-쿼리와-useOptimistic.html', title: '01 필터 시트: 임시 쿼리, 제어 컴포넌트, useOptimistic', tags: ['url-state', 'react'] },
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
  document.querySelectorAll('pre code[data-lines]').forEach(markLines);
}

// code의 data-lines="3-8 10"이 가리키는 줄(1부터)에 배경색을 칠한다. 범위는 공백으로 나눈다.
// 구문 강조가 만든 span이 여러 줄에 걸칠 수 있으므로, 줄마다 span을 새로 열고 닫아 줄 단위로 감싼다.
function markLines(codeElement) {
  const marked = new Set();
  for (const range of codeElement.dataset.lines.trim().split(/\s+/)) {
    const [start, end = start] = range.split('-').map(Number);
    for (let line = start; line <= end; line += 1) marked.add(line);
  }
  const lines = [document.createElement('span')];
  const appendText = (text, ancestors) => {
    let parent = lines.at(-1);
    for (const ancestor of ancestors) {
      const copy = ancestor.cloneNode(false);
      parent.append(copy);
      parent = copy;
    }
    parent.append(text);
  };
  const walk = (node, ancestors) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split('\n').forEach((part, index) => {
          if (index > 0) lines.push(document.createElement('span'));
          if (part !== '') appendText(part, ancestors);
        });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, [...ancestors, child]);
      }
    }
  };
  walk(codeElement, []);
  if (lines.length > 1 && lines.at(-1).textContent === '') lines.pop();
  // 줄바꿈은 줄 span 밖에 두어, 칠한 줄의 상자가 다음 줄까지 늘어나지 않게 한다.
  codeElement.replaceChildren(
    ...lines.flatMap((line, index) => {
      line.className = marked.has(index + 1) ? 'code-line marked' : 'code-line';
      return index === lines.length - 1 ? [line] : [line, '\n'];
    }),
  );
}

// .erd(테이블 관계도)의 외래 키 선을 그린다. 상자 배치는 CSS grid가 하고, 이 함수는 상자를 읽어 선만 얹는다.
// 칸(li)의 data-ref="테이블.칸"이 외래 키, data-ref-composite가 복합 외래 키의 한 칸이다. 여러 개면 공백으로 나눈다.
// 칸의 data-key="PK FK"는 칸 이름 앞의 배지가 된다.
const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(tag, attributes) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function erdColumnName(item) {
  return item.dataset.col ?? item.firstChild.textContent.trim();
}

function setUpErd(erd) {
  const canvas = element('div', 'erd-canvas');
  canvas.append(...erd.children);
  erd.append(canvas);

  const columns = new Map(); // '테이블.칸' → li
  const tables = [...canvas.querySelectorAll('.erd-table')];
  for (const table of tables) {
    table.tabIndex = 0;
    for (const item of table.querySelectorAll('li')) {
      const name = erdColumnName(item);
      columns.set(`${table.dataset.table}.${name}`, item);
      const keys = (item.dataset.key ?? '').split(' ').filter(Boolean);
      if (keys.length > 0) {
        const badges = element('span', 'erd-keys');
        for (const key of keys) badges.append(element('span', `erd-key ${key.toLowerCase()}`, key));
        item.prepend(badges);
      }
    }
  }

  const links = [];
  for (const table of tables) {
    for (const item of table.querySelectorAll('li')) {
      for (const [attribute, composite] of [
        ['ref', false],
        ['refComposite', true],
      ]) {
        for (const target of (item.dataset[attribute] ?? '').split(' ').filter(Boolean)) {
          const targetItem = columns.get(target);
          if (!targetItem) {
            console.warn(`erd: ${table.dataset.table}.${erdColumnName(item)}의 대상 ${target}이 없다`);
            continue;
          }
          const note = element('span', composite ? 'erd-ref composite' : 'erd-ref', `→ ${target}`);
          item.append(note);
          links.push({ from: table, fromItem: item, to: targetItem.closest('.erd-table'), toItem: targetItem, composite });
        }
      }
    }
  }

  const svg = svgElement('svg', { class: 'erd-lines', 'aria-hidden': 'true' });
  // CSS가 늦게 오거나 빠져도 SVG가 흐름에 끼어 캔버스를 키우고, 그 크기로 다시 그리는 고리가 생기지 않게 위치를 직접 정한다.
  svg.style.cssText = 'position: absolute; inset: 0; overflow: visible; pointer-events: none';
  canvas.prepend(svg);

  function draw() {
    svg.replaceChildren();
    const base = canvas.getBoundingClientRect();
    svg.setAttribute('width', base.width);
    svg.setAttribute('height', base.height);
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left - base.left, right: rect.right - base.left, mid: rect.top - base.top + rect.height / 2 };
    };
    // 같은 열 안의 선은 상자 왼쪽 바깥으로 돌린다. 겹치지 않게 선마다 조금씩 더 바깥으로 민다.
    const sameColumnCount = new Map();
    for (const link of links) {
      const fromBox = box(link.from);
      const toBox = box(link.to);
      const y1 = box(link.fromItem).mid;
      const y2 = box(link.toItem).mid;
      let x1, x2, s1, s2, d;
      if (toBox.left >= fromBox.right - 1) {
        [x1, s1, x2, s2] = [fromBox.right, 1, toBox.left, -1];
      } else if (toBox.right <= fromBox.left + 1) {
        [x1, s1, x2, s2] = [fromBox.left, -1, toBox.right, 1];
      } else {
        [x1, s1, x2, s2] = [fromBox.left, -1, toBox.left, -1];
      }
      // 선은 상자에서 수평으로 STUB만큼 곧게 나온 뒤 휜다. 끝 표시가 그 곧은 구간에 놓여 선과 어긋나지 않는다.
      const STUB = 20;
      const a1 = x1 + s1 * STUB;
      const a2 = x2 + s2 * STUB;
      let curve;
      if (s1 === s2) {
        const key = Math.round(Math.min(x1, x2));
        const order = sameColumnCount.get(key) ?? 0;
        sameColumnCount.set(key, order + 1);
        const bend = Math.min(a1, a2) - 10 - order * 8;
        curve = `C${bend} ${y1} ${bend} ${y2} ${a2} ${y2}`;
      } else {
        const dx = Math.max(16, Math.abs(a2 - a1) / 2);
        curve = `C${a1 + s1 * dx} ${y1} ${a2 + s2 * dx} ${y2} ${a2} ${y2}`;
      }
      d = `M${x1} ${y1} L${a1} ${y1} ${curve} L${x2} ${y2}`;
      const group = svgElement('g', { class: link.composite ? 'erd-link composite' : 'erd-link' });
      group.append(svgElement('path', { d }));
      // 외래 키 쪽(N, 여러 개)은 세 갈래 까마귀 발, 가리키는 쪽(1, 하나)은 세로 막대다.
      const foot = x1 + s1 * 12;
      group.append(svgElement('path', { class: 'erd-mark-line', d: `M${foot} ${y1} L${x1} ${y1 - 6} M${foot} ${y1} L${x1} ${y1} M${foot} ${y1} L${x1} ${y1 + 6}` }));
      const bar = x2 + s2 * 9;
      group.append(svgElement('path', { class: 'erd-mark-line', d: `M${bar} ${y2 - 6} L${bar} ${y2 + 6}` }));
      const many = svgElement('text', { class: 'erd-card', x: x1 + s1 * 16, y: y1 - 5, 'text-anchor': s1 > 0 ? 'start' : 'end' });
      many.textContent = 'N';
      const one = svgElement('text', { class: 'erd-card', x: x2 + s2 * 13, y: y2 - 5, 'text-anchor': s2 > 0 ? 'start' : 'end' });
      one.textContent = '1';
      group.append(many, one);
      link.group = group;
      svg.append(group);
    }
  }

  // 상자나 칸에 마우스를 올리거나 상자에 포커스가 가면, 그것과 이어진 선과 칸만 강조한다.
  // 복합 외래 키는 칸 하나에 올려도 같은 제약의 선을 모두 강조한다.
  function touches(link, target) {
    return target.matches('li')
      ? link.fromItem === target || link.toItem === target
      : link.from === target || link.to === target;
  }
  function sameConstraint(a, b) {
    return a === b || (a.composite && b.composite && a.from === b.from && a.to === b.to);
  }
  function focus(target) {
    canvas.classList.toggle('is-focused', target !== null);
    for (const item of canvas.querySelectorAll('li.is-active')) item.classList.remove('is-active');
    for (const table of tables) table.classList.remove('is-related');
    for (const link of links) {
      const active = target !== null && links.some((hit) => touches(hit, target) && sameConstraint(hit, link));
      link.group.classList.toggle('is-active', active);
      if (!active) continue;
      svg.append(link.group); // 강조한 선을 다른 선 위에 그린다
      link.fromItem.classList.add('is-active');
      link.toItem.classList.add('is-active');
      link.from.classList.add('is-related');
      link.to.classList.add('is-related');
    }
  }
  for (const table of tables) {
    table.addEventListener('mouseenter', () => focus(table));
    table.addEventListener('focus', () => focus(table));
    table.addEventListener('mouseleave', () => focus(null));
    table.addEventListener('blur', () => focus(null));
    for (const item of table.querySelectorAll('li')) {
      item.addEventListener('mouseenter', () => focus(item));
      item.addEventListener('mouseleave', () => focus(table));
    }
  }

  draw();
  new ResizeObserver(draw).observe(canvas);
  // 웹 글꼴이 늦게 오면 상자 크기가 바뀌므로 한 번 더 그린다. 실패해도 이미 그린 선이 남는다.
  void document.fonts?.ready.then(draw);
}

function renderErds() {
  document.querySelectorAll('.erd').forEach(setUpErd);
}

renderTags();
renderDocumentNav();
renderDocumentIndex();
highlightCode();
renderErds();
