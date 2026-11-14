import type { components } from '@openrun/api-client';

type Genre = components['schemas']['Genre'];

// 장르의 화면 이름. 공연 목록 필터와 공연 상세가 함께 쓴다.
export const GENRE_LABELS: Record<Genre, string> = {
  musical: '뮤지컬',
  play: '연극',
  concert: '콘서트',
  classical_dance: '클래식·무용',
  kids_family: '아동·가족',
};
