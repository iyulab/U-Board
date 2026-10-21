// Example data written for the sample, not recorded from a source — no public source carries a library's month.
// Keep it consistent: the September report of a mid-sized city library, written the first days of October. Visits
// rose with the new term and the reading-week programmes; loans run above last year from spring on; fiction leads the
// subjects; school-age readers and people in their forties (parents) come most.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-05T00:00:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-05T00:30:00.000Z',
  responses: {
    library: {
      '/library/report': {
        issuer: '시립 한가람 도서관',
        title: '9월 이용 리포트',
        period: '2026년 9월 1일 – 9월 30일',
        issue: '제38호',
        published: '10월 5일',
        visits: 41860,
        visitsChange: '12% 늘었습니다',
        loans: 28415,
        topSubject: '문학',
        note: '독서의 달 프로그램 여섯 개에 512명이 참여했고, 새로 가입한 회원은 1,204명입니다.',
        source: '출처: 도서관 이용 시스템 · 출입 계수기 집계(예시 데이터). 비중은 반올림해 합이 100이 아닐 수 있습니다.',
        page: '1 / 1',
        updatedAt: at,
      },
      '/library/figures': {
        value: [
          { label: '방문', value: 41860, unit: '명', change: '전월 대비 +12%' },
          { label: '대출', value: 28415, unit: '권', change: '전월 대비 +8%' },
          { label: '신규 회원', value: 1204, unit: '명', change: '전월 대비 +31%' },
          { label: '프로그램 참여', value: 512, unit: '명', change: '6개 프로그램' },
        ],
        updatedAt: at,
      },
      '/library/loans': {
        value: [
          { month: '1월', thisYear: 22140, lastYear: 21980 },
          { month: '2월', thisYear: 20310, lastYear: 20850 },
          { month: '3월', thisYear: 24620, lastYear: 23120 },
          { month: '4월', thisYear: 25480, lastYear: 23760 },
          { month: '5월', thisYear: 26110, lastYear: 24300 },
          { month: '6월', thisYear: 25240, lastYear: 23900 },
          { month: '7월', thisYear: 27930, lastYear: 26410 },
          { month: '8월', thisYear: 26310, lastYear: 25120 },
          { month: '9월', thisYear: 28415, lastYear: 25880 },
        ],
        updatedAt: at,
      },
      '/library/subjects': {
        value: [
          { rank: 1, subject: '문학', loans: 9870, share: '35%' },
          { rank: 2, subject: '사회과학', loans: 4120, share: '15%' },
          { rank: 3, subject: '아동 그림책', loans: 3980, share: '14%' },
          { rank: 4, subject: '역사', loans: 2460, share: '9%' },
          { rank: 5, subject: '기술과학', loans: 2310, share: '8%' },
          { rank: 6, subject: '예술', loans: 1720, share: '6%' },
        ],
        updatedAt: at,
      },
      '/library/ages': {
        value: [
          { age: '어린이', people: 7420 },
          { age: '10대', people: 6880 },
          { age: '20대', people: 4310 },
          { age: '30대', people: 5260 },
          { age: '40대', people: 8140 },
          { age: '50대', people: 4720 },
          { age: '60대 이상', people: 5130 },
        ],
        updatedAt: at,
      },
      '/library/programmes': {
        value: [
          { name: '작가와의 만남 — 가을 소설 낭독', when: '9월 6일(토) 오후 2시', came: 118, places: 120 },
          { name: '어린이 그림책 만들기 4주 과정', when: '9월 매주 수요일', came: 24, places: 24 },
          { name: '중장년 디지털 도서관 이용 교실', when: '9월 17일(수) 오전 10시', came: 31, places: 40 },
        ],
        updatedAt: at,
      },
    },
  },
};
