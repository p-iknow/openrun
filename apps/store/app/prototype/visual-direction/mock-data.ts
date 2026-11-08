// PROTOTYPE: 1.2 시각적 방향 비교용 가짜 데이터. 방향을 고른 뒤 이 폴더째 지운다.

export type SalesStatus = 'UPCOMING' | 'ON_SALE' | 'SOLD_OUT' | 'CANCELLED';

export const salesStatusLabel: Record<SalesStatus, string> = {
  UPCOMING: '판매 예정',
  ON_SALE: '판매 중',
  SOLD_OUT: '매진',
  CANCELLED: '회차 취소',
};

export type MockPerformance = {
  date: string;
  weekday: string;
  time: string;
  remaining: { grade: string; seats: number }[];
  cast: string;
};

export type MockShow = {
  id: number;
  title: string;
  genre: string;
  venue: string;
  region: string;
  period: string;
  runtime: string;
  age: string;
  status: SalesStatus;
  /** 남은 회차 좌석 비율(0~1). 매진 임박 표시를 계산하는 데만 쓴다. */
  remainingRatio: number;
  rating: number | null;
  reviewCount: number;
  posterHue: [number, number];
  grades: { name: string; price: number }[];
};

const gradesLarge = [
  { name: 'VIP석', price: 170000 },
  { name: 'R석', price: 140000 },
  { name: 'S석', price: 110000 },
  { name: 'A석', price: 80000 },
];
const gradesSmall = [
  { name: 'R석', price: 66000 },
  { name: 'S석', price: 55000 },
];

export const shows: MockShow[] = [
  {
    id: 1,
    title: '달의 정원사',
    genre: '뮤지컬',
    venue: '한빛아트센터 대극장',
    region: '서울',
    period: '2026.11.24 ~ 2027.03.14',
    runtime: '170분(인터미션 20분)',
    age: '8세 이상',
    status: 'ON_SALE',
    remainingRatio: 0.06,
    rating: 4.9,
    reviewCount: 438,
    posterHue: [262, 320],
    grades: gradesLarge,
  },
  {
    id: 2,
    title: '마지막 기차는 새벽에 떠난다',
    genre: '연극',
    venue: '대학로 소나무극장',
    region: '서울',
    period: '2026.10.02 ~ 2026.12.27',
    runtime: '100분',
    age: '중학생 이상',
    status: 'ON_SALE',
    remainingRatio: 0.42,
    rating: 4.6,
    reviewCount: 164,
    posterHue: [200, 230],
    grades: gradesSmall,
  },
  {
    id: 3,
    title: '유리 도시의 왈츠',
    genre: '뮤지컬',
    venue: '푸른숲 씨어터',
    region: '서울',
    period: '2026.12.22 ~ 2027.02.28',
    runtime: '150분(인터미션 15분)',
    age: '8세 이상',
    status: 'UPCOMING',
    remainingRatio: 1,
    rating: null,
    reviewCount: 0,
    posterHue: [180, 140],
    grades: gradesLarge,
  },
  {
    id: 4,
    title: '겨울 바다 콘서트: 파도',
    genre: '콘서트',
    venue: '해오름홀',
    region: '부산',
    period: '2026.12.31',
    runtime: '120분',
    age: '전체 관람가',
    status: 'SOLD_OUT',
    remainingRatio: 0,
    rating: 4.8,
    reviewCount: 88,
    posterHue: [210, 190],
    grades: gradesSmall,
  },
  {
    id: 5,
    title: '붉은 여우의 재판',
    genre: '연극',
    venue: '세움소극장',
    region: '서울',
    period: '2026.09.08 ~ 2026.11.29',
    runtime: '110분',
    age: '14세 이상',
    status: 'ON_SALE',
    remainingRatio: 0.18,
    rating: 4.3,
    reviewCount: 21,
    posterHue: [8, 30],
    grades: gradesSmall,
  },
  {
    id: 6,
    title: '호두까기 사중주',
    genre: '클래식',
    venue: '은하음악당',
    region: '대구',
    period: '2026.12.18 ~ 2026.12.20',
    runtime: '90분',
    age: '초등학생 이상',
    status: 'CANCELLED',
    remainingRatio: 0.7,
    rating: null,
    reviewCount: 0,
    posterHue: [40, 10],
    grades: gradesSmall,
  },
  {
    id: 7,
    title: '사막의 등대지기',
    genre: '뮤지컬',
    venue: '한빛아트센터 중극장',
    region: '서울',
    period: '2026.11.11 ~ 2027.02.08',
    runtime: '160분(인터미션 20분)',
    age: '8세 이상',
    status: 'ON_SALE',
    remainingRatio: 0.09,
    rating: 4.7,
    reviewCount: 302,
    posterHue: [30, 50],
    grades: gradesLarge,
  },
  {
    id: 8,
    title: '작은 별 탐험대',
    genre: '아동/가족',
    venue: '꿈나무홀',
    region: '경기',
    period: '2026.12.05 ~ 2027.01.25',
    runtime: '70분',
    age: '24개월 이상',
    status: 'ON_SALE',
    remainingRatio: 0.55,
    rating: 4.5,
    reviewCount: 57,
    posterHue: [48, 160],
    grades: gradesSmall,
  },
  {
    id: 9,
    title: '그림자 없는 남자',
    genre: '연극',
    venue: '대학로 소나무극장 2관',
    region: '서울',
    period: '2027.01.08 ~ 2027.03.01',
    runtime: '95분',
    age: '15세 이상',
    status: 'UPCOMING',
    remainingRatio: 1,
    rating: null,
    reviewCount: 0,
    posterHue: [240, 280],
    grades: gradesSmall,
  },
  {
    id: 10,
    title: '백야: 오케스트라 갈라',
    genre: '클래식',
    venue: '은하음악당',
    region: '서울',
    period: '2026.12.12',
    runtime: '100분',
    age: '초등학생 이상',
    status: 'SOLD_OUT',
    remainingRatio: 0,
    rating: 4.9,
    reviewCount: 41,
    posterHue: [220, 200],
    grades: gradesLarge,
  },
  {
    id: 11,
    title: '오래된 편지들의 밤',
    genre: '뮤지컬',
    venue: '푸른숲 씨어터 2관',
    region: '서울',
    period: '2026.10.13 ~ 2027.01.03',
    runtime: '120분',
    age: '13세 이상',
    status: 'ON_SALE',
    remainingRatio: 0.33,
    rating: 4.4,
    reviewCount: 96,
    posterHue: [340, 20],
    grades: gradesSmall,
  },
  {
    id: 12,
    title: '네온 스트리트 라이브',
    genre: '콘서트',
    venue: '라이트홀',
    region: '서울',
    period: '2027.01.17 ~ 2027.01.18',
    runtime: '150분',
    age: '전체 관람가',
    status: 'UPCOMING',
    remainingRatio: 1,
    rating: null,
    reviewCount: 0,
    posterHue: [290, 180],
    grades: gradesSmall,
  },
];

export const genres = ['뮤지컬', '연극', '콘서트', '클래식', '아동/가족'];
export const statuses: SalesStatus[] = [
  'UPCOMING',
  'ON_SALE',
  'SOLD_OUT',
  'CANCELLED',
];
export const sorts = ['인기순', '공연 임박순', '최근 등록순', '제목순'];

export const performances: MockPerformance[] = [
  {
    date: '2026.11.24',
    weekday: '화',
    time: '19:30',
    remaining: [
      { grade: 'VIP석', seats: 0 },
      { grade: 'R석', seats: 4 },
      { grade: 'S석', seats: 12 },
      { grade: 'A석', seats: 31 },
    ],
    cast: '서하늘, 윤지호, 백소라',
  },
  {
    date: '2026.11.25',
    weekday: '수',
    time: '14:30',
    remaining: [
      { grade: 'VIP석', seats: 2 },
      { grade: 'R석', seats: 0 },
      { grade: 'S석', seats: 8 },
      { grade: 'A석', seats: 20 },
    ],
    cast: '김도윤, 윤지호, 한예린',
  },
  {
    date: '2026.11.25',
    weekday: '수',
    time: '19:30',
    remaining: [
      { grade: 'VIP석', seats: 0 },
      { grade: 'R석', seats: 0 },
      { grade: 'S석', seats: 0 },
      { grade: 'A석', seats: 0 },
    ],
    cast: '서하늘, 정우진, 백소라',
  },
];

/** 잔여 비율 10% 이하인 판매 중 공연만 매진 임박으로 보여 준다. 판매 상태가 아니다. */
export function isAlmostSoldOut(show: MockShow): boolean {
  return show.status === 'ON_SALE' && show.remainingRatio <= 0.1;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}
