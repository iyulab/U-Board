// Example data written for the sample — the station, the office and its cases are made up. Keep it consistent: it is
// 14:30 on a Thursday in late October. Of the eight files on the desk three are kept, two have owners contacted, two
// were handed back today and one is due for disposal on Sunday. The office keeps 96 items — the kinds in the chart add
// up to it; the memo's figures and the counter's queue agree with the files.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T05:28:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T05:30:00.000Z',
  responses: {
    desk: {
      '/desk/today': {
        value: { date: '10월 22일 목요일', time: '14:30', received: '23', returned: '11', kept: '96', disposal: '7', note: '오후 3시 순환 열차 종점 정리분 도착 예정' },
        updatedAt: at,
      },
      '/desk/cases': {
        value: {
          a: { no: 'No. 1022-07', item: '검정 백팩', where: '3번 승강장 의자', when: '10/22 08:14', note: '노트북 1·충전기', state: 'contacted', stamp: '연락', since: '09:02 문자' },
          b: { no: 'No. 1022-11', item: '은색 휴대전화', where: '하행 열차 6호차', when: '10/22 09:40', note: '파란 케이스', state: 'returned', stamp: '인계', since: '11:15' },
          c: { no: 'No. 1022-15', item: '장우산(남색)', where: '동쪽 출구 계단', when: '10/22 10:05', note: '나무 손잡이', state: 'kept', stamp: '보관', since: 'C-14 칸' },
          d: { no: 'No. 1015-03', item: '갈색 가죽 지갑', where: '매표소 앞', when: '10/15 17:22', note: '신분증 없음', state: 'disposal', stamp: '폐기', since: 'D-3 · 10/25' },
          e: { no: 'No. 1022-18', item: '어린이 운동화', where: '상행 열차 2호차', when: '10/22 11:31', note: '한 짝 · 210 mm', state: 'kept', stamp: '보관', since: 'B-02 칸' },
          f: { no: 'No. 1021-29', item: '무선 이어폰', where: '화장실 세면대', when: '10/21 19:48', note: '흰색 · 각인 J', state: 'contacted', stamp: '연락', since: '10/22 10:30' },
          g: { no: 'No. 1022-02', item: '서류 봉투', where: '대합실 벤치', when: '10/22 06:55', note: '회사 로고', state: 'returned', stamp: '인계', since: '13:40' },
          h: { no: 'No. 1022-21', item: '접이식 자전거', where: '자전거 보관대', when: '10/22 12:10', note: '자물쇠 없음', state: 'kept', stamp: '보관', since: '창고 2' },
        },
        updatedAt: at,
      },
      '/desk/kinds': {
        value: [
          { kind: '우산', count: 31 },
          { kind: '가방', count: 18 },
          { kind: '전자기기', count: 15 },
          { kind: '의류', count: 13 },
          { kind: '지갑·카드', count: 11 },
          { kind: '기타', count: 8 },
        ],
        updatedAt: at,
      },
      '/desk/queue': {
        value: [
          { time: '14:12', who: '김○○', item: '검정 백팩', state: 'checking', word: '본인 확인' },
          { time: '14:21', who: '박○○', item: '무선 이어폰', state: 'waiting', word: '대기' },
          { time: '14:26', who: '이○○', item: '장우산', state: 'waiting', word: '대기' },
          { time: '14:28', who: '최○○', item: '어린이 운동화', state: 'ready', word: '인계 준비' },
          { time: '14:29', who: '정○○', item: '갈색 가죽 지갑', state: 'checking', word: '본인 확인' },
          { time: '14:30', who: '한○○', item: '접이식 자전거', state: 'waiting', word: '대기' },
        ],
        updatedAt: at,
      },
    },
  },
};
