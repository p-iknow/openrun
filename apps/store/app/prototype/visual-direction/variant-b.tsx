'use client';
// PROTOTYPE: 방향 B(단정한 잡지형). 작은 모서리, 얇은 구분선, 굵고 큰 제목, 촘촘한 정보.
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
import s from './variant-b.module.css';

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
      <div className={s.testNotice}>테스트 결제만 가능한 가상 서비스입니다</div>
      <div className={s.headerInner}>
        <Link href="?variant=B" className={s.logo}>
          OPENRUN
        </Link>
        <nav className={s.genreNav}>
          {genres.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </nav>
        <label className={s.search}>
          <input placeholder="공연 제목 검색" />
          <span aria-hidden>⌕</span>
        </label>
      </div>
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
    <Link href={`?variant=B&show=${show.id}`} className={s.card}>
      <div className={s.posterWrap}>
        <Poster show={show} className={s.poster} />
      </div>
      <div className={s.cardBody}>
        <span className={s.cardGenre}>
          {show.genre} · {show.region}
        </span>
        <strong className={s.cardTitle}>{show.title}</strong>
        <span className={s.cardMeta}>{show.venue}</span>
        <span className={s.cardMeta}>{show.period}</span>
        <div className={s.badgeRow}>
          <Badge status={show.status} />
          {isAlmostSoldOut(show) && <span className={s.almost}>매진 임박</span>}
          {show.rating !== null && (
            <span className={s.rating}>
              ★{show.rating.toFixed(1)} ({show.reviewCount})
            </span>
          )}
        </div>
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
  const [sort, setSort] = useState(sorts[0]);
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
  const activeCount = selectedStatuses.length + selectedGenres.length;

  return (
    <main className={s.container}>
      <div className={s.pageHead}>
        <h1>공연</h1>
        <p>
          전체 <b>{filtered.length}</b>건
        </p>
      </div>

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
              초기화 ↺
            </button>
          </div>
          <FilterGroups {...groups} />
        </aside>

        <section>
          <div className={s.toolbar}>
            <button
              type="button"
              className={s.mobileFilterButton}
              onClick={() => setSheetOpen(true)}
            >
              필터{activeCount > 0 && <b> {activeCount}</b>}
            </button>
            <div className={s.sortTabs}>
              {sorts.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={cx(s.sortTab, o === sort && s.sortTabOn)}
                  onClick={() => setSort(o)}
                >
                  {o}
                </button>
              ))}
            </div>
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
              이전
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
              다음
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
            <div className={s.sheetHead}>
              <h2>필터</h2>
              <button
                type="button"
                className={s.textButton}
                onClick={() => setSheetOpen(false)}
              >
                닫기 ✕
              </button>
            </div>
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
                {filtered.length}건 보기
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
      <nav className={s.breadcrumb}>
        <Link href="?variant=B">공연</Link> / <span>{show.genre}</span>
      </nav>
      <div className={s.detailHead}>
        <div className={s.badgeRow}>
          <Badge status={show.status} />
          {isAlmostSoldOut(show) && <span className={s.almost}>매진 임박</span>}
        </div>
        <h1 className={s.detailTitle}>{show.title}</h1>
        <p className={s.detailSub}>
          {show.period} <span>|</span> {show.venue}
          {show.rating !== null && (
            <>
              {' '}
              <span>|</span> ★ {show.rating.toFixed(1)} · 리뷰{' '}
              {show.reviewCount}
            </>
          )}
        </p>
      </div>

      <div className={s.detailLayout}>
        <div>
          <div className={s.summary}>
            <div className={s.detailPosterWrap}>
              <Poster show={show} className={s.poster} />
            </div>
            <table className={s.infoTable}>
              <tbody>
                <tr>
                  <th>장르</th>
                  <td>{show.genre}</td>
                </tr>
                <tr>
                  <th>공연장</th>
                  <td>{show.venue}</td>
                </tr>
                <tr>
                  <th>관람 시간</th>
                  <td>{show.runtime}</td>
                </tr>
                <tr>
                  <th>관람 연령</th>
                  <td>{show.age}</td>
                </tr>
                <tr>
                  <th>가격</th>
                  <td>
                    {show.grades.map((g) => (
                      <div key={g.name} className={s.priceRow}>
                        <span>{g.name}</span>
                        <b>{formatPrice(g.price)}</b>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <nav className={s.tabs}>
            {[
              '공연 정보',
              '캐스팅',
              '취소·환불 규정',
              '공연장',
              `리뷰 ${show.reviewCount}`,
            ].map((t, i) => (
              <span key={t} className={cx(s.tab, i === 0 && s.tabOn)}>
                {t}
              </span>
            ))}
          </nav>

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
              <h2 className={s.stepTitle}>
                <span>01</span> 날짜
              </h2>
              <div className={s.calendarHead}>
                <button type="button" aria-label="이전 달">
                  ‹
                </button>
                <strong>2026. 11</strong>
                <button type="button" aria-label="다음 달">
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
                  const available = d >= 24 && d <= 29;
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
              <h2 className={s.stepTitle}>
                <span>02</span> 회차
              </h2>
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
                        {p.time}
                        <small>
                          {p.date.slice(5)} ({p.weekday})
                        </small>
                        {soldOut && (
                          <span className={cx(s.badge, s.badgeMuted)}>
                            매진
                          </span>
                        )}
                      </span>
                      <span className={s.remaining}>
                        {p.remaining
                          .map((r) => `${r.grade} ${r.seats}`)
                          .join(' · ')}
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
              {show.status === 'UPCOMING' &&
                '판매 오픈 전입니다. 2026.11.20(금) 14:00에 판매를 시작합니다.'}
              {show.status === 'SOLD_OUT' && '모든 회차가 매진되었습니다.'}
              {show.status === 'CANCELLED' &&
                '회차가 취소되었습니다. 결제한 주문은 모두 환불됩니다.'}
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

export function VariantB({ showId }: { showId: string | undefined }) {
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
