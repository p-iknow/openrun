'use client';
// PROTOTYPE: 방향 A(부드러운). 큰 모서리, 넉넉한 여백, 그림자 없는 면 구분.
import Link from 'next/link';
import { useState } from 'react';
import {
  formatPrice,
  genres,
  isAlmostSoldOut,
  performances,
  salesStatusLabel,
  shows,
  sorts,
  statuses,
  type MockShow,
  type SalesStatus,
} from './mock-data';
import { Poster } from './poster';
import s from './variant-a.module.css';

const badgeTone: Record<SalesStatus, string> = {
  UPCOMING: s.badgeNeutral ?? '',
  ON_SALE: s.badgePrimary ?? '',
  SOLD_OUT: s.badgeMuted ?? '',
  CANCELLED: s.badgeDanger ?? '',
};

function cx(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(' ');
}

function Badge({ status }: { status: SalesStatus }) {
  return (
    <span className={cx(s.badge, badgeTone[status])}>
      {salesStatusLabel[status]}
    </span>
  );
}

function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link href="?variant=A" className={s.logo}>
          openrun
        </Link>
        <label className={s.search}>
          <span className={s.searchIcon} aria-hidden>
            ⌕
          </span>
          <input placeholder="공연 제목을 검색하세요" />
        </label>
        <nav className={s.headerNav}>
          <span>내 예매</span>
          <span>로그인</span>
        </nav>
      </div>
      <div className={s.testNotice}>테스트 결제만 가능한 가상 서비스입니다</div>
    </header>
  );
}

function FilterGroups({
  selectedStatuses,
  selectedGenres,
  toggleStatus,
  toggleGenre,
}: {
  selectedStatuses: SalesStatus[];
  selectedGenres: string[];
  toggleStatus: (v: SalesStatus) => void;
  toggleGenre: (v: string) => void;
}) {
  return (
    <>
      <section className={s.filterGroup}>
        <h3>판매 상태</h3>
        <div className={s.chips}>
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              className={cx(s.chip, selectedStatuses.includes(st) && s.chipOn)}
              aria-pressed={selectedStatuses.includes(st)}
              onClick={() => toggleStatus(st)}
            >
              {salesStatusLabel[st]}
            </button>
          ))}
        </div>
      </section>
      <section className={s.filterGroup}>
        <h3>장르</h3>
        <div className={s.chips}>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={cx(s.chip, selectedGenres.includes(g) && s.chipOn)}
              aria-pressed={selectedGenres.includes(g)}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function ShowCard({ show }: { show: MockShow }) {
  return (
    <Link href={`?variant=A&show=${show.id}`} className={s.card}>
      <div className={s.posterWrap}>
        <Poster show={show} className={s.poster} />
      </div>
      <div className={s.cardBody}>
        <div className={s.badgeRow}>
          <Badge status={show.status} />
          {isAlmostSoldOut(show) && <span className={s.almost}>매진 임박</span>}
        </div>
        <strong className={s.cardTitle}>{show.title}</strong>
        <span className={s.cardMeta}>
          {show.region} · {show.venue}
        </span>
        <span className={s.cardMeta}>{show.period}</span>
        {show.rating !== null && (
          <span className={s.rating}>
            ★ {show.rating.toFixed(1)} <span>({show.reviewCount})</span>
          </span>
        )}
      </div>
    </Link>
  );
}

function ListPage() {
  const [selectedStatuses, setStatuses] = useState<SalesStatus[]>([
    'UPCOMING',
    'ON_SALE',
  ]);
  const [selectedGenres, setGenres] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(1);

  const toggleStatus = (v: SalesStatus) =>
    setStatuses((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  const toggleGenre = (v: string) =>
    setGenres((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );

  const filtered = shows.filter(
    (sh) =>
      (selectedStatuses.length === 0 || selectedStatuses.includes(sh.status)) &&
      (selectedGenres.length === 0 || selectedGenres.includes(sh.genre)),
  );

  const groups = {
    selectedStatuses,
    selectedGenres,
    toggleStatus,
    toggleGenre,
  };

  return (
    <main className={s.container}>
      <div className={s.listLayout}>
        <aside className={s.filterPanel}>
          <div className={s.filterHead}>
            <h2>필터</h2>
            <button
              type="button"
              className={s.textButton}
              onClick={() => {
                setStatuses([]);
                setGenres([]);
              }}
            >
              초기화
            </button>
          </div>
          <FilterGroups {...groups} />
        </aside>

        <section className={s.results}>
          <div className={s.resultsHead}>
            <h1>
              공연 <span className={s.count}>{filtered.length}</span>
            </h1>
            <select className={s.sortSelect} defaultValue={sorts[0]}>
              {sorts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className={s.mobileBar}>
            <button
              type="button"
              className={s.mobileFilterButton}
              onClick={() => setSheetOpen(true)}
            >
              필터
              {selectedStatuses.length + selectedGenres.length > 0 &&
                ` ${selectedStatuses.length + selectedGenres.length}`}
            </button>
            {[
              ...selectedStatuses.map((st) => salesStatusLabel[st]),
              ...selectedGenres,
            ].map((label) => (
              <span key={label} className={cx(s.chip, s.chipOn)}>
                {label}
              </span>
            ))}
            {genres
              .filter((g) => !selectedGenres.includes(g))
              .map((g) => (
                <button
                  key={g}
                  type="button"
                  className={s.chip}
                  onClick={() => toggleGenre(g)}
                >
                  {g}
                </button>
              ))}
          </div>

          <div className={s.grid}>
            {filtered.map((sh) => (
              <ShowCard key={sh.id} show={sh} />
            ))}
          </div>

          <nav className={s.pagination} aria-label="페이지">
            <button
              type="button"
              className={s.pageArrow}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={cx(s.pageNumber, n === page && s.pageCurrent)}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={s.pageArrow}
              onClick={() => setPage((p) => Math.min(5, p + 1))}
            >
              ›
            </button>
          </nav>
        </section>
      </div>

      {sheetOpen && (
        <div className={s.sheetBackdrop} onClick={() => setSheetOpen(false)}>
          <div
            className={s.sheet}
            role="dialog"
            aria-label="필터"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={s.sheetHandle} />
            <h2 className={s.sheetTitle}>필터</h2>
            <div className={s.sheetBody}>
              <FilterGroups {...groups} />
            </div>
            <div className={s.sheetFooter}>
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => {
                  setStatuses([]);
                  setGenres([]);
                }}
              >
                초기화
              </button>
              <button
                type="button"
                className={s.primaryButton}
                onClick={() => setSheetOpen(false)}
              >
                {filtered.length}개 공연 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const calendarDays = Array.from({ length: 35 }, (_, i) => i + 1); // 2026년 11월 1일은 일요일

function DetailPage({ show }: { show: MockShow }) {
  const [day, setDay] = useState(24);
  const [perfIndex, setPerfIndex] = useState(0);
  const bookable = show.status === 'ON_SALE';

  return (
    <main className={s.container}>
      <Link href="?variant=A" className={s.backLink}>
        ‹ 공연 목록
      </Link>
      <div className={s.detailLayout}>
        <div className={s.detailMain}>
          <div className={s.hero}>
            <div className={s.heroBackdrop}>
              <Poster show={show} className={s.heroBackdropPoster} />
            </div>
            <Poster show={show} className={s.heroPoster} />
          </div>

          <div className={s.titleBlock}>
            <div className={s.badgeRow}>
              <Badge status={show.status} />
              {isAlmostSoldOut(show) && (
                <span className={s.almost}>매진 임박</span>
              )}
              <span className={cx(s.badge, s.badgeNeutral)}>{show.genre}</span>
            </div>
            <h1 className={s.detailTitle}>{show.title}</h1>
            {show.rating !== null && (
              <span className={s.rating}>
                ★ {show.rating.toFixed(1)}{' '}
                <span>· 리뷰 {show.reviewCount}개</span>
              </span>
            )}
          </div>

          <nav className={s.anchorTabs}>
            {[
              '공연 정보',
              '가격',
              '캐스팅',
              '취소·환불 규정',
              '공연장',
              '리뷰',
            ].map((t, i) => (
              <span
                key={t}
                className={cx(s.anchorTab, i === 0 && s.anchorTabOn)}
              >
                {t}
              </span>
            ))}
          </nav>

          <dl className={s.infoList}>
            <dt>공연장</dt>
            <dd>{show.venue}</dd>
            <dt>기간</dt>
            <dd>{show.period}</dd>
            <dt>관람 시간</dt>
            <dd>{show.runtime}</dd>
            <dt>관람 연령</dt>
            <dd>{show.age}</dd>
          </dl>

          <section className={s.section}>
            <h2>가격</h2>
            <ul className={s.priceList}>
              {show.grades.map((g) => (
                <li key={g.name}>
                  <span>{g.name}</span>
                  <strong>{formatPrice(g.price)}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.section}>
            <h2>취소·환불 규정</h2>
            <p className={s.paragraph}>
              관람일 10일 전까지는 수수료 없이 취소할 수 있습니다. 이후에는 예매
              금액의 10~30%가 취소 수수료로 부과되며, 관람 당일에는 취소할 수
              없습니다.
            </p>
          </section>
          <div className={s.spacer} />
        </div>

        <aside className={s.bookingPanel}>
          {bookable ? (
            <>
              <div className={s.calendarHead}>
                <button
                  type="button"
                  className={s.calendarArrow}
                  aria-label="이전 달"
                >
                  ‹
                </button>
                <strong>2026.11</strong>
                <button
                  type="button"
                  className={s.calendarArrow}
                  aria-label="다음 달"
                >
                  ›
                </button>
              </div>
              <div className={s.calendar}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <span key={d} className={s.weekday}>
                    {d}
                  </span>
                ))}
                {calendarDays.map((d, i) => {
                  const inMonth = d >= 1 && d <= 30;
                  const available = d >= 24 && d <= 30 && d !== 30;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!available}
                      className={cx(
                        s.day,
                        !inMonth && s.dayOut,
                        available && s.dayAvailable,
                        d === day && s.daySelected,
                      )}
                      onClick={() => setDay(d)}
                    >
                      {inMonth ? d : ''}
                    </button>
                  );
                })}
              </div>
              <div className={s.performanceList}>
                {performances.map((p, i) => {
                  const soldOut = p.remaining.every((r) => r.seats === 0);
                  return (
                    <button
                      key={`${p.date}-${p.time}`}
                      type="button"
                      disabled={soldOut}
                      className={cx(
                        s.performance,
                        i === perfIndex && s.performanceOn,
                        soldOut && s.performanceSoldOut,
                      )}
                      onClick={() => setPerfIndex(i)}
                    >
                      <span className={s.performanceTime}>
                        {p.date.slice(5)} ({p.weekday}) {p.time}
                        {soldOut && (
                          <span className={cx(s.badge, s.badgeMuted)}>
                            매진
                          </span>
                        )}
                      </span>
                      <span className={s.remaining}>
                        {p.remaining.map((r) => (
                          <span key={r.grade}>
                            {r.grade} <b>{r.seats}</b>
                          </span>
                        ))}
                      </span>
                      <span className={s.cast}>{p.cast}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className={cx(s.primaryButton, s.bookButton)}
              >
                예매하기
              </button>
            </>
          ) : (
            <div className={s.notBookable}>
              <Badge status={show.status} />
              <p>
                {show.status === 'UPCOMING' &&
                  '판매 오픈 전입니다. 2026.11.20(금) 14:00에 판매를 시작합니다.'}
                {show.status === 'SOLD_OUT' && '모든 회차가 매진되었습니다.'}
                {show.status === 'CANCELLED' &&
                  '회차가 취소되었습니다. 결제한 주문은 모두 환불됩니다.'}
              </p>
            </div>
          )}
        </aside>
      </div>

      <div className={s.mobileCta}>
        <button
          type="button"
          className={cx(s.primaryButton, s.bookButton)}
          disabled={!bookable}
        >
          {bookable ? '예매하기' : salesStatusLabel[show.status]}
        </button>
      </div>
    </main>
  );
}

export function VariantA({ showId }: { showId: string | undefined }) {
  const show = showId
    ? shows.find((sh) => String(sh.id) === showId)
    : undefined;
  return (
    <div className={s.root}>
      <Header />
      {show ? <DetailPage show={show} /> : <ListPage />}
    </div>
  );
}
