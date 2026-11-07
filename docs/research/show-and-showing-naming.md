# 공연과 회차의 영어 이름 조사

조사일은 2026-11-07이다. 대상은 공연(현재 `Performance`)과 회차(현재 `Showing`)이고, 저장소에 코드가 아직 없어 이름을 바꾸는 비용은 문서 수정뿐이다.

## 결론 요약

| 이름 쌍 (공연 / 회차) | 근거 | 단점 | 판단 |
|---|---|---|---|
| **`Show` / `Performance`** | 회차를 performance로 부르는 것이 극장 업계 표현이다(Broadway League, Tessitura, OvationTix). 같은 쌍을 쓰는 레포가 3개이고, 공개 레포 중 극장 전용 2단계 모델 8개에서 회차 이름의 최다(5개)다. `PerformanceSeat` 선례도 있다. ID가 뚜렷이 다르다. | `performance`가 성능, 전역 객체와 겹친다. 다만 실험상 오류는 컴파일에서 드러나고, 문서는 성능을 한글로 쓴다. 한국 자료는 `prf`, `Performance`를 공연에 자주 써서 처음에 오독할 수 있다. | **추천** |
| `Show` / `Showing` | 전역, 성능과 겹치지 않는다. 용어집의 파생어(`ShowingSeat`, `ShowingCancellation`)를 그대로 둔다. | 사전과 코드 모두 영화, 부동산 쪽 의미가 강하다. 극장 전용 표본에서 사용 0건이다. `show_id`와 `showing_id`가 비슷하고 타입이 같아 혼동해도 컴파일된다(추론). | **차점** |
| `Performance` / `Showing` (현행) | KOPIS, 멜론티켓과 공연 단위 표현이 맞는다. 바꿀 것이 없다. | `performance` 충돌과 `Showing`의 영화 어감을 함께 갖는다. | 유지할 이유가 약함 |

- **추론:** 증거만 보면 업계 어휘와 공개 선례가 `Show` / `Performance`를 지지하고, `performance` 위험은 정확성이 아니라 가독성 문제로 확인됐다(Q6). 그래서 이 쌍을 추천한다.
- **판단이 뒤집히는 조건:** 부하 테스트 코드와 지표에서 `performance_id`가 성능 지표로 읽히는 불편, 또는 한국어 독자의 공연/회차 오독을 업계 정확성보다 크게 본다면 `Show` / `Showing`을 고른다. 이때는 ID 혼동을 막는 브랜드 타입을 함께 두는 편이 낫다.
- **공연 쪽 이름은 어느 경우든 `Show`가 낫다.** 전역 충돌이 없고 용례가 넓다. `Production`은 극장 용어로 정확하지만 `NODE_ENV=production`과 겹친다.
- **이행 주의(추론):** 추천안을 택하면 `Performance`의 뜻이 공연에서 회차로 바뀐다. 문서를 고칠 때는 `Performance`→`Show`를 먼저 하고 `Showing`→`Performance`를 나중에 해야 뜻이 섞이지 않는다.

## 표기와 검증 방법

각 항목은 **공식 자료**(공식 문서, 사전, 업계 단체), **관찰**(실제 사용), **실험**, **추론**으로 구분한다. "검색 요약"은 본문을 직접 열지 못해 검색 도구의 요약으로만 확인했다는 뜻이고, 인용 문구의 정확성이 직접 열람보다 낮다.

**실험**은 임시 디렉터리에서 내가 작성한 코드로만 했다. `--ignore-scripts`로 설치한 TypeScript 7.0.2, `@types/node` 26.6.6, `drizzle-orm` 0.45.4, Node 26.12.1, 공식 이미지 `postgres:18-alpine`(18.6), Headless Chrome 150을 썼다. 클론하거나 받은 레포 코드는 실행하지 않았다.

## Q1. 티켓팅과 이벤트 시스템의 두 단계 용어

| 시스템 | 공연 단계 | 회차 단계 | 확인 수준과 출처 |
|---|---|---|---|
| Tessitura | Title > Production > Production Season | Performance | **공식 자료(간접)** 라이선스 기관의 스테이징 API 도움말에 `ProductionSeason`, `FirstPerformanceDate` 등이 있다([도움말](https://ts-stg-appgw.calacademy.org/TessituraService/Help/Api/GET-TXN-ProductionSeasons-id)). 4단계 쓰임은 [포럼](https://communitytest.tessitura.com/tessitura_software_forums/f/tessitura_ticketing-0/13622/production-elements-structure) 글로만 확인했고, 공식 제품 문서는 찾지 못했다. 기관마다 단계 쓰임이 다르다. |
| AudienceView Professional (구 OvationTix) | production | performance | 검색 요약. [API 문서](https://api.ovationtix.com/public)는 직접 열람 시 403이다. Unlimited 제품의 공개 API 문서는 찾지 못했다. |
| Spektrix | Event | Instance | **공식 자료** `eventId`가 "ID of the existing Event to which the new instance belongs."이고 `start`가 일시다([문서](https://integrate.spektrix.com/docs/api/events-instances/creating-updating/creating-event-instances)). `planId`도 인스턴스에 있다. |
| Ticketsolve | Show | Event | 검색 요약. `shows.xml`의 각 show가 `events.xml`로 이어진다([개발자 안내](https://ticketsolve.zendesk.com/hc/en-us/articles/360057030432), 직접 열람 403). |
| Eventbrite | series parent (Event Series) | occurrence (Event) | **공식 자료** "Each occurrence is backed by an Event, and will be associated with the series parent event"([API](https://www.eventbrite.com/platform/api)). |
| Ticket Tailor | Event series | Event occurrence | **공식 자료** 페이지 제목이 "Create an event occurrence"다([문서](https://developers.tickettailor.com/docs/api/create-event-series-event)). 용어 정의는 없다. |
| Universe | Listing | Event | **공식 자료** "A Listing consists of one or many Events (dates)"([문서](https://developers.universe.com/reference/listings)). |
| pretix | Event (`has_subevents`) | SubEvent | **공식 자료** "an event date (also called sub-event)"([문서](https://docs.pretix.eu/dev/api/resources/subevents.html)). |
| Ticketmaster Discovery | Attraction | Event | **공식 자료** Attraction은 "artists, sports, packages, plays and so on"이다([문서](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)). 문서 예시에 `localDate`, `venues`, `attractions` 키가 있다. 시리즈 필드는 찾지 못했다(문서 약 22만 자 중 앞 10만 자는 요약, 뒤는 키워드 검색으로 확인). |
| SeatGeek | performers | events | 검색 요약. `/events`, `/performers`, `/venues`로 나뉜다. [개발자 포털](https://developer.seatgeek.com/)은 클라이언트 렌더링이라 내용을 읽지 못했다. 작품 단위 자원은 확인되지 않았다. |
| Bandsintown | Artist | Event | **공식 자료** 아티스트별 이벤트 목록이다. 작품, 시리즈 언급이 없다([안내](https://help.artists.bandsintown.com/en/articles/9186477-api-documentation)). |
| Veezi (영화) | Film | Session | **공식 자료** `FilmId`, `FilmPackageId`가 세션을 영화와 잇는다([문서](https://api.us.veezi.com/help/Sessions)). |

**관찰:**

- 라이브 시스템 11개 중 회차 단계가 Event 5, Occurrence 2, Performance 2, Instance 1, SubEvent 1이다. `Showing`, `Showtime`은 없다.
- 극장에 특화된 4개(Tessitura, OvationTix, Spektrix, Ticketsolve)만 보면 Performance 2, Instance 1, Event 1이다.
- 공연 단계는 Production, Show, Event series, Listing, Attraction으로 흩어져 있어 표준이 없다.

**추론:** 범용 시스템의 `Event`는 대체로 "일시가 있는 한 번"을 뜻한다. 그래서 `Event`를 공연 단계에 쓰면 Ticketmaster, Universe 어휘와 뜻이 어긋난다.

## Q2. 데이터 표준

**공식 자료 (schema.org):**

- [`Event`](https://schema.org/Event): "An event happening at a certain time and location". 반복 이벤트는 "may be structured as separate Event objects."
- [`TheaterEvent`](https://schema.org/TheaterEvent): "Event type: Theater performance." 즉 한 번의 상연이고 회차 단계에 해당한다.
- `superEvent` / `subEvent`: "An event that this event is a part of." / "An Event that is part of this event."
- [`EventSeries`](https://schema.org/EventSeries): "A series of Events."로, 묶음을 나타낼 수 있다. 다만 극장 공연 기간 전용 타입은 없다.
- [`workPerformed`](https://schema.org/workPerformed): "A work performed in some event, for example a play performed in a TheaterEvent." 범위는 `CreativeWork`다. 작품은 이벤트와 다른 타입이다.
- [`ScreeningEvent`](https://schema.org/ScreeningEvent): "A screening of a movie or other video." 영화는 screening, 극장은 performance로 나뉜다.
- [`TheaterGroup`](https://schema.org/TheaterGroup): "A theater group or company". 단체를 뜻하며 이 결정과 직접 관련은 없다.

**공식 자료 (Google):** 날짜별로 티켓이 따로 있는 공연은 "add a separate `Event` element for each performance."라고 안내한다([Event 구조화 데이터](https://developers.google.com/search/docs/appearance/structured-data/event)).

**추론:** 표준은 `Show`류 이름을 정하지 않지만, 회차를 performance로 읽는 쪽을 지지한다. 공연을 `Event`로 두면 표준의 `Event`와 단위가 어긋난다.

## Q3. 한국 자료

**공식 자료 (KOPIS):** [API 항목](https://kopis.or.kr/por/cs/openapi/openApiList.do?menuId=MNU_00074)과 [개발가이드 PDF](https://kopis.or.kr/upload/openApi/%EA%B3%B5%EC%97%B0%EC%98%88%EC%88%A0%ED%86%B5%ED%95%A9%EC%A0%84%EC%82%B0%EB%A7%9DOpenAPI%EA%B0%9C%EB%B0%9C%EA%B0%80%EC%9D%B4%EB%93%9C.pdf)를 직접 읽었다.

| 요소 | 가이드 설명 |
|---|---|
| `pblprfr` | 공연목록 조회 서비스 |
| `mt20id` | 공연 ID |
| `prfnm` | 공연명 |
| `prfpdfrom`, `prfpdto`, `prfpd` | 공연시작일, 공연종료일, 공연기간 |
| `prfstate` | 공연상태 |
| `openrun` | 오픈런 여부 |
| `dtguidance` | 공연시간. 예: "화요일 ~ 금요일(20:00), 토요일(16:00,19:00), 일요일(15:00,18:00)" |
| `prfdtcnt` | 상연횟수 |
| `mt10id`, `fcltynm` | 공연시설 ID, 공연시설명 |

- `prf`는 performance의 축약으로 보이나(추론), 축약 뜻을 밝힌 문구는 찾지 못했다. 사이트 저작권 표기는 "KOREA PERFORMING ARTS BOX OFFICE INFORMATION SYSTEM"이다.
- 32쪽 가이드를 텍스트로 추출해 검색한 결과 "회차"는 0건이다. 회차 단위의 ID나 요소는 없고, 시간은 `dtguidance` 문자열과 `prfdtcnt` 집계로만 나타난다.

**관찰 (공개 페이지의 URL과 HTML, 내부 스키마 아님):**

| 서비스 | 공연 | 회차 | 출처 |
|---|---|---|---|
| 멜론티켓 | `prodId`, 경로 `/performance/` | `scheduleNo`, `perfDay`. 템플릿 주석이 "회차 일자", "회차 - 시간 템플릿"이다. | [공연 페이지](https://ticket.melon.com/performance/index.htm?prodId=210000) |
| 예스24 | `IdPerf`, 경로 `/Perf/` | `idTime`, `PerfDate`. 주석이 "회차정보"다. | [공연 페이지](https://ticket.yes24.com/Perf/50000) |
| 인터파크/NOL | `goodsCode` | `playSeq` | 비공식 도구: [interpark-ticket-watcher](https://github.com/potados99/interpark-ticket-watcher/blob/main/lib/Config.ts)가 `playSeq`를 "공연 회차"로 설명한다. [NOL 상품 페이지](https://nol.yanolja.com/ticket/products/26007498)는 직접 요청 시 403이다. |
| NOL World (영문) | | 라벨은 "Date/Time"이다. Round, Performance 라벨은 없었다. | [상품 페이지](https://world.nol.com/en/ticket/places/21000636/products/25002550) |
| 티켓링크 | 확인 불가 | 확인 불가 | [상품 페이지](https://www.ticketlink.co.kr/product/50000)의 초기 HTML에 용어가 없었다. |

**확인하지 못한 것:** 네 서비스의 공개 개발자 문서나 공식 기술 블로그는 찾지 못했다. 위 이름은 웹 파라미터이며 내부 모델 이름이라는 뜻이 아니다.

**추론:** 한국 쪽 공식 표현은 공연을 performance 계열로 쓴다. 회차는 영어 표준이 없고 서비스마다 `schedule`, `time`, `seq`로 다르다. `Show` / `Performance`는 이 관행과 단어가 교차하므로 용어집에 명시해야 한다.

## Q4. 영어 단어의 뜻

Oxford Learner's, Merriam-Webster, Cambridge, Britannica, IBDB, broadway.org 시간표 페이지는 직접 열람 시 403이었다. Oxford는 확인하지 못했고, Merriam-Webster와 Cambridge는 검색 요약으로 대신했다. Dictionary.com(American, Collins 수록)은 직접 읽었다.

| 단어 | 내용 | 출처 |
|---|---|---|
| performance | "a musical, dramatic, or other entertainment presented before an audience." 동시에 "the manner in which or the efficiency with which something reacts or fulfills its intended purpose." | [Dictionary.com](https://www.dictionary.com/browse/performance) |
| production | "the organization and presentation of a dramatic entertainment." / "the entertainment itself." | [Dictionary.com](https://www.dictionary.com/browse/production) |
| show | "a theatrical production, performance, or company." / "a radio or television program." / "a movie." | [Dictionary.com](https://www.dictionary.com/browse/show) |
| run | "a continuous series of performances, as of a play." | [Dictionary.com](https://www.dictionary.com/browse/run) |
| showing | "a show, display, or exhibition." Collins는 "a presentation, exhibition, or display". | [Dictionary.com](https://www.dictionary.com/browse/showing) |
| showing | 작품 등을 전시하는 것과 영화 상영의 뜻을 든다(검색 요약). | [Merriam-Webster](https://www.merriam-webster.com/dictionary/showing) |
| showing | 학습자 사전은 정해진 시간의 TV 프로그램 방영, 영화관 상영으로 풀이한다. 본 사전은 대중이 무언가를 볼 기회로 넓게 풀이하며 예문이 영화다(검색 요약). | [Cambridge Learner's](https://dictionary.cambridge.org/dictionary/learner-english/showing), [Cambridge](https://dictionary.cambridge.org/dictionary/english/showing) |
| showtime | "the time at which an entertainment is scheduled to begin." | [Dictionary.com](https://www.dictionary.com/browse/showtime), 같은 취지 [Merriam-Webster](https://www.merriam-webster.com/dictionary/showtime)(검색 요약) |

**공식 자료 (업계 단체):**

- [Broadway League 통계](https://www.broadwayleague.com/research/statistics-broadway-nyc/): "Broadway shows"를 표제로 쓰고, "Playing Weeks represent the overall number of weeks of performance logged by all productions", "New productions reflect productions that officially opened within that season."라고 쓴다. 집계도 "performances through the week ending March 8, 2020"로 적는다. 용어 정의 문구는 없다.
- [broadway.org 안내](https://www.broadway.org/llms.txt): "Show listings reflect productions currently on sale.", "Performance times are generated per week". [시간표 페이지](https://www.broadway.org/performance-times)는 제목이 "Performance Times", 열 이름이 "Show Time"이다(열 이름은 검색 요약).
- [IBDB](https://www.ibdb.com/broadway-production/544008)는 "Previews"와 "# Perf."를 따로 센다(검색 요약).

**답:** 위 자료에서 `showing`이 라이브 공연의 한 회를 가리키는 사례는 찾지 못했다. Merriam-Webster의 run 항목에 "performances or showings"가 함께 나온다는 요약이 있으나 직접 확인하지 못했다. 참고로 극장 공연 영상을 영화관에서 트는 NT Live 안내는 ["screenings"](https://mapi.cineworld.co.uk/static/en/uk/blog/nt-live-upcoming-screenings)라고 쓴다(검색 요약).

**추론:** `showing`은 문법적으로 틀리지 않지만 주로 영화와 전시에 쓰인다. 원어민 독자는 영화 시스템으로 짐작할 수 있다. 코퍼스 빈도 비교는 하지 않았으므로 "라이브에 쓰이지 않는다"가 아니라 "권위 자료에서 찾지 못했다"는 수준의 결론이다. `showtime`은 시각을 뜻해서 공연장을 가진 엔티티 이름으로는 뜻이 좁다.

## Q5. 공개 코드베이스

표는 "레포 표"에 있고 여기에는 선정 방법과 집계만 적는다. 스타와 코드는 2026-11-07 기준이다.

**선정 방법:**

- **표본 K (한국어 라이브):** `gh search repos`의 "공연 예매", "티켓 예매 시스템", "콘서트 예매", "티켓팅 공연 회차"를 스타순으로 본 뒤 설명으로 라이브 공연 레포를 골랐다. 이름을 기준으로 고르지 않았다. 스타순 상위를 빠짐없이 본 것은 아니고, 엔티티가 없는 레포는 뺐다.
- **표본 E (영어권, 범용):** "theatre booking system", "theater ticketing", "concert ticketing", "ticketmaster clone" 등의 검색 결과에 내가 아는 오픈소스(pretix, alf.io, Hi.Events, Attendize, Audience1st, Camdram, uobtheatre)를 더했다. 뒤의 것들은 내 선택이라 편향될 수 있다. 대학 연극 프로젝트를 일부러 찾았으므로 Performance 쪽으로 기울 수 있다.
- **표본 M (영화):** "movie booking system", "cinema booking", "movie ticket booking"의 스타 상위에서 회차 모델이 확인되는 것만 넣었다. ByteByteGo는 코드 검색에서 왔다.
- **표본 N (이름 검색, 집계 제외):** `class PerformanceSeat`, `class PerformanceRound`, `class Showing`, `model Showing`의 코드 검색이다. 이름으로 찾았으므로 분포 근거가 아니다.
- 모두 `gh api`로 트리와 파일을 읽었고 실행하지 않았다.

**한계:** 대부분 스타가 적은 학습 프로젝트다. 상용 시스템의 내부 스키마는 볼 수 없다. 일부는 파일 이름으로만 분류했다(표에 표시). GitHub 코드 검색은 상위 일부만 돌려주고 대소문자와 단어 경계가 느슨하다.

**집계:**

| 표본 | 2단계 모델 | 공연 이름 | 회차 이름 |
|---|---|---|---|
| K 12개 | 12 | Concert 5, Performance 2, Event 2, Show 1, Goods 1, Ticket 1 | Schedule 계열 7, Performance 2, EventSession 1, DateTime 1, PlayTime 1 |
| E 극장 전용 8개 | 8 | Show 3, Play 2, Production 1, Event 1, PerformanceDetails 1 | **Performance 5**, Schedule 2, Showdate 1 |
| E 범용 2개 | 2 | Event 2 | SubEvent 1, EventOccurrence 1 |
| M 7개 | 7 | Movie 또는 Film 계열 | Showtime 3, Session 1, Screening 1, Show 1, Schedule 1 |

단일 단계 모델(공연에 일시를 직접 둠)은 K에 8개(Concert 4, Performance 2, Event 2), E에 6개(Event 4, Concert 1, Performance 1) 더 있다.

**관찰:**

- 라이브 표본(K와 E의 2단계 22개)에서 회차를 `Showing`이나 `Showtime`으로 부른 레포는 0개다. `Round`도 0개다.
- `Show` + `Performance` 쌍은 [Camdram](https://github.com/camdram/camdram), [theatre-royal](https://github.com/elliotip04/theatre-royal-booking-system), [ticket-core](https://github.com/ticket-project/ticket-core) 3개다. ticket-core는 한국어 프로젝트이고, Javadoc에 "Show의 특정 상영 회차다"라고 적어 뜻을 설명한다.
- 한국어 레포에서 `Performance`의 뜻은 갈린다. K 전체 20개 중 공연 뜻이 4개(min-ticketing, curtain, bookticket, OurTicket), 회차 뜻이 2개(ticket-core, LimdaeIl/concert)다. N에서도 `Concert`와 `Performance`를 함께 둔 레포 3개([SKALA-Archive/ticket_backend](https://github.com/SKALA-Archive/ticket_backend), [LimdaeIl/hall-backend](https://github.com/LimdaeIl/hall-backend), [mrpark219/open-rush](https://github.com/mrpark219/open-rush))와 `Performance`와 `Schedule`을 함께 둔 레포 1개([hyeongmin90/TicketFlow](https://github.com/hyeongmin90/TicketFlow))가 있다(파일 이름 기준).
- `Schedule` 계열이 K에서 가장 많지만 용어집은 스케줄을 피하라고 정했다.
- N의 Prisma `model Showing` 코드 검색 상위 23개 레포 중 모델이 실제로 있는 18개를 읽으면 부동산 매물 방문이 12, 영화가 5, 라이브 이벤트가 1([EveboxBE](https://github.com/tabuhcoding/EveboxBE), `Events`와 `Seatmap` 참조)이다. 이 검색은 Prisma 사용 레포로 치우쳐 있다.
- N의 `Showing.*` 파일 8개 중 영화가 6개이고, 1개는 도메인 무관, 1개는 미확인이다. 라이브는 없다.
- N의 `PerformanceRound`: [picket-back](https://github.com/be17-picket/picket-back)이 `Product` / `PerformanceRound` / `RoundTime`을 쓴다. 한국어 직역으로 보이지만(추론) 스타 0개 사례다.

## Q6. 충돌과 실무 위험

### 전역 이름

**공식 자료:** [MDN `Performance`](https://developer.mozilla.org/en-US/docs/Web/API/Performance), [Node 전역](https://nodejs.org/api/globals.html)의 `performance`, `Event`, [MDN `Window.event`](https://developer.mozilla.org/en-US/docs/Web/API/Window/event)(폐기 예정).

**실험:** Node와 Chrome에서 `typeof`를 확인했다.

- 둘 다 전역: `performance`(object), `Performance`, `Event`(function)
- Chrome만: `scheduler`(object). 대문자 `Schedule`은 없다.
- 둘 다 없음: `Show`, `Showing`, `Showtime`, `Production`, `Session`, `Schedule`, `Round`, `Program`, `Work`, `Title`, `Occurrence`, `Instance`

Node 문서의 전역 페이지는 `Performance` 클래스를 나열하지 않지만 Node 26 런타임에는 있다. 다른 런타임 버전은 확인하지 않았다.

**실험 (tsc, `dom` 설정과 Node 설정 양쪽 결과 동일):**

| 코드 | 결과 |
|---|---|
| import 없이 `(p: Performance) => p.now()` | **통과.** 전역 타입으로 해석된다. |
| import 없이 `(p: Performance) => p.title` | TS2339: `Property 'title' does not exist on type 'Performance'` |
| `for (const performance of performances) { performance.now() }` | TS2339: `Property 'now' does not exist on type '{ id: number; }'` |

**판단:** 도메인 필드를 쓰는 순간 컴파일 오류가 나므로 조용한 런타임 버그로 이어질 가능성은 낮다(추론). 비용은 혼란스러운 오류 메시지와, 측정 코드 근처의 변수 이름 충돌이다. 자동 import가 전역 때문에 뜨지 않을 수도 있는데, 편집기 동작은 시험하지 않았다.

### PostgreSQL 키워드

**공식 자료:** [Key Words 부록, PG 18](https://www.postgresql.org/docs/current/sql-keywords-appendix.html). "non-reserved"는 "allowed as column or table names"이고, 빈칸은 일반 식별자다.

| 단어 | PostgreSQL | SQL:2023 |
|---|---|---|
| `SHOW` | non-reserved | **reserved** |
| `SESSION` | non-reserved | non-reserved |
| `EVENT`, `PROGRAM` | non-reserved | 없음 |
| `WORK` | non-reserved | non-reserved |
| `OCCURRENCE`, `INSTANCE`, `SECTION` | 빈칸 | non-reserved |
| `PERFORMANCE`, `PRODUCTION`, `ROUND`, `SCHEDULE`, `TITLE`, `RUN`, `SHOWING`, `SHOWTIME` | 표에 없음 | 표에 없음 |
| `ORDER` | **reserved, requires AS** | reserved |
| `USER` | **reserved** | reserved |

- **복수형:** `SHOWS`, `SESSIONS`, `EVENTS`, `PERFORMANCES`, `PRODUCTIONS`, `SHOWINGS` 모두 표에 없다.
- **실험:** PG 18.6의 `pg_get_keywords()`도 같은 결과다. `CREATE TABLE show`, `session`, `event`, `program`, `work`와 `SELECT * FROM show` 모두 따옴표 없이 성공했다.
- **실험:** Drizzle은 `select "show"."id" ... from "show"`처럼 식별자를 모두 따옴표로 감싼다.

**판단:** 후보 중 PostgreSQL에서 막히는 이름은 없다. `show`는 단수형을 쓸 때 사람이 `SHOW` 명령과 헷갈릴 수 있고 표준 SQL에서는 예약어이므로 복수형 `shows`가 안전하다. 진짜 주의 대상은 용어집의 `Order`와 `User`이며 복수형 `orders`, `users`로 피한다.

### 프로젝트 안의 다른 뜻

**관찰:** 문서 전체에서 영어 `performance`는 용어집 한 줄뿐이고, 성능은 한글로 14줄, 부하/k6는 27줄, 아웃박스는 7줄, 세션은 15줄이다(`grep`, 이 파일 작성 전 기준). 문서의 겹침은 작고, 겹침은 주로 앞으로 쓸 식별자에서 생긴다.

| 후보 | 위험 | 근거 |
|---|---|---|
| `Performance` | 성능 뜻과 겹친다. `performance_id`가 지표 라벨로 들어가면 읽기 어렵고, 검색 결과에 두 뜻이 섞인다. | 사전의 두 뜻(Q4), 실험. 지표 부분은 추론 |
| `Event` | 아웃박스의 이벤트, `@nestjs/event-emitter`의 `@OnEvent()`, DOM `Event`와 겹친다. 공연 단계에 쓰기 가장 나쁘다. | [NestJS Events](https://docs.nestjs.com/techniques/events), [ROADMAP](../ROADMAP.md) 7단계 |
| `Production` | `NODE_ENV` 값 "production"과 겹친다. `prod`가 두 뜻이 된다. | [Next.js](https://nextjs.org/docs/pages/guides/environment-variables): "The allowed values for `NODE_ENV` are `production`, `development` and `test`." |
| `Session` | 로그인 세션, `@Session()`과 겹친다. `SessionSeat`, `SessionCancellation`이 인증 용어로 읽힌다. Veezi 등 영화 쪽 용례가 있다. | [NestJS Session](https://docs.nestjs.com/techniques/session), [Veezi](https://api.us.veezi.com/help/Sessions) |
| `Schedule` | `@nestjs/schedule`과 겹치고, 용어집이 `_Avoid_: 스케줄`로 금지했다. 한국 레포 다수가 쓰는 이름이지만 이 프로젝트에서는 제외한다. | [NestJS Scheduling](https://docs.nestjs.com/techniques/task-scheduling), [GLOSSARY](../../GLOSSARY.md) |
| `Round` | 회차의 직역이지만 `Math.round`, SQL `round()`와 겹치고 영어로는 경기 라운드로 읽힌다. `RoundSeat`는 "둥근 좌석"으로도 읽힌다. | 추론. 라이브 표본 0건 |
| `Program` | `ts.Program`, 일반어 프로그램과 겹치고 PG 키워드다. 공연 단계 표본 0건이다. | PG 표, 추론 |
| `Title`, `Work` | `show.title` 같은 필드와 겹치고(`Title.title`), `Work`는 워커, 작업 큐와 겹친다. 작품 자체를 뜻해 판매 단위와 어긋난다. `Title`은 Tessitura의 상위 묶음이다. | 추론, Q1 |
| `Occurrence`, `Instance` | `Instance`는 서버 인스턴스와 겹친다. 부하 테스트에서 혼동된다. `Occurrence`는 충돌이 적지만 길고 일상어가 아니다. | 추론 |
| `Show` | 프런트엔드의 동사 `show`와 겹친다. `showSeats`, `showDetails`가 boolean인지 공연의 것인지 헷갈린다. `isShowing`, `setShowing`도 같다. | 추론 |

### 파생 이름과 쌍의 가독성

| 쌍 | 회차 좌석 | 회차 취소 | FK | 평가(추론) |
|---|---|---|---|---|
| `Show` / `Performance` | `PerformanceSeat` | `PerformanceCancellation` | `show_id`, `performance_id` | 두 ID가 뚜렷이 다르다. `PerformanceSeat`는 라이브 표본에 선례가 많다. 이름이 길다. |
| `Show` / `Showing` | `ShowingSeat` | `ShowingCancellation` | `show_id`, `showing_id` | 세 글자 차이다. 자동 완성에서 틀리기 쉽고 `eq(seats.showingId, showId)`가 같은 정수 타입이면 컴파일된다. 쓰기는 FK가 막아도 읽기는 잘못된 행을 돌려줄 수 있다. |
| `Show` / `Showtime` | `ShowtimeSeat` | `ShowtimeCancellation` | `show_id`, `showtime_id` | `Showing`보다 구분되지만 뜻이 시각이어서 `showtime.startsAt`이 중복처럼 보인다. 영화 표본의 최다 이름이다. |
| `Performance` / `Showing` | `ShowingSeat` | `ShowingCancellation` | `performance_id`, `showing_id` | ID는 구분된다. 공연 쪽 충돌과 회차 쪽 어감이 함께 남는다. |
| `Production` / `Performance` | `PerformanceSeat` | `PerformanceCancellation` | `production_id`, `performance_id` | 극장 용어로 가장 정확하지만 환경 이름과 성능 뜻 양쪽에 걸린다. |
| `Event` / `Occurrence` | `OccurrenceSeat` | `OccurrenceCancellation` | `event_id`, `occurrence_id` | 범용 플랫폼 관행이지만 아웃박스 이벤트와 직접 부딪힌다. |

`Venue`, `Seat`, `Section`, `SeatGrade`, `SalesStatus`와는 어느 쌍도 충돌하지 않는다. `Section`은 표준 SQL의 non-reserved 키워드일 뿐이다.

## 레포 표

분류 칸의 `(파일)`은 파일 이름으로만 분류했다는 뜻이다. 나머지는 엔티티나 스키마를 읽었다.

### 표본 K: 한국어 라이브 공연

| 레포 | ★ / 최근 push | 공연 | 회차 | 좌석 |
|---|---|---|---|---|
| [f-lab-edu/min-ticketing](https://github.com/f-lab-edu/min-ticketing) | 36 / 2024-11 | `Performance` | `PerformanceDateTime` (`showTime` 필드) | `PerformancePlaceSeat`(장소 소속) |
| [pbg0205/concert](https://github.com/pbg0205/concert) | 3 / 2025-11 | `Concert` | `ConcertSchedule` | `ConcertSeat` |
| [STOS-INC/concert-reservation](https://github.com/STOS-INC/concert-reservation) | 3 / 2023-11 | `Concert` | `Schedule` | `ScheduledSeat` (파일) |
| [ticket-project/ticket-core](https://github.com/ticket-project/ticket-core) | 2 / 2026-11 | `Show` (`SHOWS`) | `Performance` (`PERFORMANCES`) | `PerformanceSeat` |
| [beyond-sw-camp/be23-2nd-team5-articket-be](https://github.com/beyond-sw-camp/be23-2nd-team5-articket-be) | 2 / 2026-03 | `Concert` | `ConcertSchedule` | `Seat` (파일) |
| [tikitaka-team-8/tikitaka](https://github.com/tikitaka-team-8/tikitaka) | 2 / 2026-09 | `Event` | `EventSession` (`sessionNumber`) | `ScheduleSeat` |
| [f-lab-edu/getto-ticket](https://github.com/f-lab-edu/getto-ticket) | 2 / 2025-02 | `Goods` | `PlayTime` (`playOrder`) | `Seat`, `BookingSeat` |
| [minjun7984/doridos-msa](https://github.com/minjun7984/doridos-msa) | 1 / 2025-04 | `Ticket` | `Schedule` | `ScheduleSeat` |
| [bellsilver7/curtain](https://github.com/bellsilver7/curtain) | 0 / 2026-09 | `Performance` | `Schedule` | `ScheduleSeat` |
| [sunpark123/TicketFlow](https://github.com/sunpark123/TicketFlow) | 0 / 2026-03 | `Event` | `EventSchedules` | `Seats` (파일) |
| [LimdaeIl/concert](https://github.com/LimdaeIl/concert) | 0 / 2026-08 | `Concert` | `Performance` | `PerformanceSeat` |
| [frank220203/tdd-cleanarchitecture-ticketing](https://github.com/frank220203/tdd-cleanarchitecture-ticketing) | 0 / 2024-08 | `Concert` | `ConcertSchedule` | `Seat` (파일) |

단일 단계: [wlwlsus/allback-with-k8s](https://github.com/wlwlsus/allback-with-k8s)(★42, `Concert`), [f-lab-edu/ticketing-practice](https://github.com/f-lab-edu/ticketing-practice)(★3, `Concert`), [kochungcheon/OurTicket](https://github.com/kochungcheon/OurTicket)(★2, `Performance`, 일시는 Embeddable), [sunsurely/bookticket](https://github.com/sunsurely/bookticket)(★1, `Performance`), [hyundododo/ticketing](https://github.com/hyundododo/ticketing)(★1, `Concert`), [naraeit77/zump](https://github.com/naraeit77/zump)(★1, `concerts`), [KTH1007/ticket-rush](https://github.com/KTH1007/ticket-rush)(★0, `event`, `EventSchedule`은 값 객체), [Choi-Seunghwan/reserveX](https://github.com/Choi-Seunghwan/reserveX)(★0, `Event`).

### 표본 E: 영어권과 범용 라이브

| 레포 | ★ / 최근 push | 공연 | 회차 | 비고 |
|---|---|---|---|---|
| [HiEventsDev/Hi.Events](https://github.com/HiEventsDev/Hi.Events) | 4134 / 2026-11 | `Event` | `EventOccurrence` | 2026-02 마이그레이션으로 도입. 범용 |
| [pretix/pretix](https://github.com/pretix/pretix) | 2562 / 2026-11 | `Event` | `SubEvent` | 범용 |
| [yangbodong22011/TTMS](https://github.com/yangbodong22011/TTMS) | 45 / 2017-03 | `Play` | `Schedule` | 학습 프로젝트 |
| [camdram/camdram](https://github.com/camdram/camdram) | 24 / 2026-11 | `Show` | `Performance` | 케임브리지 학생 연극 포털. 판매 없음 |
| [armandofox/audience1st](https://github.com/armandofox/audience1st) | 19 / 2026-08 | `Show` | `Showdate` | 극장 박스오피스 |
| [BristolSTA/uobtheatre-api](https://github.com/BristolSTA/uobtheatre-api) | 7 / 2026-10 | `Production` | `Performance` | 대학 연극 예매. `PerformanceSeatGroup` |
| [yangchaoy259189888/Theatre-Management-System](https://github.com/yangchaoy259189888/Theatre-Management-System) | 5 / 2018-06 | `Play` | `Schedule` | (파일) |
| [thenglee/theater-ticketing](https://github.com/thenglee/theater-ticketing) | 4 / 2020-06 | `Event` | `Performance` | Rails |
| [elliotip04/theatre-royal-booking-system](https://github.com/elliotip04/theatre-royal-booking-system) | 3 / 2022-12 | `Show` | `Performance` | 학습 프로젝트 |
| [MouseCreator/RedTheatre](https://github.com/MouseCreator/RedTheatre) | 0 / 2024-12 | `PerformanceDetails` | `Performance` | 학습 프로젝트 |

단일 단계: [Attendize/Attendize](https://github.com/Attendize/Attendize)(★4282), [alfio-event/alf.io](https://github.com/alfio-event/alf.io)(★1629), [kousen/mockhub](https://github.com/kousen/mockhub)(★9, 파일), [hamidfarmani/ticketmaster-clone](https://github.com/hamidfarmani/ticketmaster-clone)(★2, 파일)는 `Event`다. [kittipat1413/ticket-reservation](https://github.com/kittipat1413/ticket-reservation)(★16, 파일)은 `concert`, [TheMysteriousStranger90/TheatreProjectMicroservices](https://github.com/TheMysteriousStranger90/TheatreProjectMicroservices)(★2)는 `Performance`다.

### 표본 M: 영화 예매

| 레포 | ★ | 작품 | 회차 |
|---|---|---|---|
| [georgesimos/cinema-plus](https://github.com/georgesimos/cinema-plus) | 380 | `movie` | `showtime` |
| [ChengHo/CinemaBookingSystem](https://github.com/ChengHo/CinemaBookingSystem) | 325 | `SysMovie` | `SysSession` |
| [ByteByteGoHq/ood-interview](https://github.com/ByteByteGoHq/ood-interview) | 302 | `Movie` | `Screening` |
| [hoc081098/Movie-Ticket-Booking](https://github.com/hoc081098/Movie-Ticket-Booking) | 97 | `movie` | `show-time` (파일) |
| [ChunhThanhDe/cinema-booking](https://github.com/ChunhThanhDe/cinema-booking) | 89 | `movie` | `show_time` (파일) |
| [projectworldsofficial/Online-Movie-Ticket-Booking-System-in-php](https://github.com/projectworldsofficial/Online-Movie-Ticket-Booking-System-in-php) | 81 | `tbl_movie` | `tbl_shows`, 시각은 `tbl_show_time` |
| [hepangda/ttms-bs](https://github.com/hepangda/ttms-bs) | 4 | `Movie` | `Schedule` |

### 표본 N: 이름 검색 (집계 제외)

| 레포 | ★ | 이름 |
|---|---|---|
| [IEr090/ticketline](https://github.com/IEr090/ticketline) | 0 | `Event` / `Performance` / `PerformanceSeat` (파일) |
| [q4yz/Software-Engineering-Project-Group-Assignment](https://github.com/q4yz/Software-Engineering-Project-Group-Assignment) | 0 | `Event` / `Performance` / `PerformanceSeat` (파일) |
| [rickertmar/KinoticketSystem](https://github.com/rickertmar/KinoticketSystem) | 2 | `Movie` / `Showing` (회차별 좌석 복사) |
| [kwyrzyk/cinema-app](https://github.com/kwyrzyk/cinema-app) | 0 | `Film` / `Showing` (파일) |
| [ithai5/KinoXP](https://github.com/ithai5/KinoXP) | 0 | `Movie` / `Showtime` (파일) |
| [Musfique55/movie-ticket-server](https://github.com/Musfique55/movie-ticket-server) | 0 | `Movie` / `ShowTime` / ShowSeat(마이그레이션 이름) |
| [tabuhcoding/EveboxBE](https://github.com/tabuhcoding/EveboxBE) | 0 | `Events` / `Showing` / `Seatmap` |

## 확인하지 못한 것

- Oxford 사전의 정의. Merriam-Webster, Cambridge, Britannica는 직접 열람하지 못해 검색 요약에 의존했다. broadway.org 시간표 페이지와 IBDB도 같다.
- Broadway League의 공식 용어 정의. 통계 페이지의 쓰임만 확인했다.
- `showing`의 라이브와 영화 사용 빈도 비교. 코퍼스 조사는 하지 않았다.
- Tessitura의 공식 제품 문서, AudienceView Unlimited API, OvationTix와 Ticketsolve 문서 원문, SeatGeek 포털 본문.
- 인터파크/NOL, 멜론티켓, 예스24, 티켓링크의 내부 스키마와 공식 개발 문서. 멜론티켓 글로벌 사이트는 응답 406으로 영문 라벨을 보지 못했다.
- 편집기의 자동 import 동작, 실제 부하 테스트 도구에서 `performance_id`가 얼마나 불편한지. 후자는 코드가 생겨야 판단할 수 있다.
