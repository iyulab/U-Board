// Example data written for the sample, not recorded from a source — no public source carries a terminal's bays and
// seats this way. Keep it consistent: it is 17:40 on a Sunday, the evening rush back after the weekend. The routes
// south along the Gyeongbu line fill first and two of them are sold out; the Honam departures run late behind an
// accident on the expressway; the Gangwon routes are quiet. The day's counts on the left are summed from the bays.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-18T08:40:00Z';

type State = 'boarding' | 'ontime' | 'late' | 'full';
type Departure = [time: string, to: string, seats: number, state: State, note: string];

/** The routes' families, each with the colour the wall gives its bays. */
const LINES = {
  gyeongbu: { line: '경부선', colour: '#4aa3ff' },
  honam: { line: '호남선', colour: '#3dff6a' },
  yeongdong: { line: '영동선', colour: '#ff8a3d' },
};

const PLAN: Array<[bay: string, family: keyof typeof LINES, departures: Departure[]]> = [
  ['1', 'gyeongbu', [['17:40', '부산', 3, 'boarding', '탑승 중'], ['18:00', '부산', 0, 'full', '다음 차 이용'], ['18:20', '부산', 11, 'ontime', '정시'], ['18:40', '부산', 27, 'ontime', '정시']]],
  ['2', 'gyeongbu', [['17:45', '대구', 0, 'full', '다음 차 이용'], ['18:05', '동대구', 6, 'ontime', '정시'], ['18:30', '대구', 14, 'ontime', '정시'], ['19:00', '동대구', 25, 'ontime', '정시']]],
  ['3', 'gyeongbu', [['17:50', '울산', 9, 'boarding', '탑승 중'], ['18:20', '포항', 12, 'ontime', '정시'], ['18:50', '울산', 20, 'ontime', '정시'], ['19:30', '경주', 24, 'ontime', '정시']]],
  ['4', 'gyeongbu', [['17:55', '대전', 15, 'ontime', '정시'], ['18:10', '천안', 21, 'ontime', '정시'], ['18:25', '대전', 8, 'ontime', '정시'], ['18:40', '청주', 18, 'ontime', '정시']]],
  ['5', 'honam', [['17:40', '광주', 2, 'late', '지연 15분'], ['18:00', '광주', 7, 'late', '지연 10분'], ['18:20', '광주', 19, 'ontime', '정시'], ['18:40', '광주', 26, 'ontime', '정시']]],
  ['6', 'honam', [['17:50', '전주', 0, 'full', '다음 차 이용'], ['18:10', '전주', 4, 'late', '지연 10분'], ['18:40', '익산', 17, 'ontime', '정시'], ['19:10', '전주', 23, 'ontime', '정시']]],
  ['7', 'honam', [['18:00', '목포', 10, 'late', '지연 20분'], ['18:30', '여수', 13, 'ontime', '정시'], ['19:00', '순천', 18, 'ontime', '정시'], ['19:40', '목포', 27, 'ontime', '정시']]],
  ['8', 'honam', [['17:45', '군산', 12, 'boarding', '탑승 중'], ['18:15', '정읍', 22, 'ontime', '정시'], ['18:45', '군산', 19, 'ontime', '정시'], ['19:20', '남원', 28, 'ontime', '정시']]],
  ['9', 'yeongdong', [['17:50', '강릉', 16, 'boarding', '탑승 중'], ['18:20', '강릉', 21, 'ontime', '정시'], ['18:50', '강릉', 25, 'ontime', '정시'], ['19:20', '강릉', 27, 'ontime', '정시']]],
  ['10', 'yeongdong', [['18:00', '속초', 18, 'ontime', '정시'], ['18:40', '양양', 24, 'ontime', '정시'], ['19:20', '속초', 26, 'ontime', '정시'], ['20:00', '속초', 28, 'ontime', '정시']]],
  ['11', 'yeongdong', [['18:05', '원주', 20, 'ontime', '정시'], ['18:35', '원주', 23, 'ontime', '정시'], ['19:05', '춘천', 25, 'ontime', '정시'], ['19:35', '원주', 27, 'ontime', '정시']]],
  ['12', 'yeongdong', [['18:10', '동해', 22, 'ontime', '정시'], ['18:50', '삼척', 25, 'ontime', '정시'], ['19:30', '동해', 26, 'ontime', '정시'], ['20:10', '태백', 28, 'ontime', '정시']]],
];

/** The bays, in the order the wall lays them out. */
export const BAYS = PLAN.map(([id]) => id);

const all = PLAN.flatMap(([, , d]) => d);
const late = all.filter(([, , , s]) => s === 'late').length;
const full = all.filter(([, , , s]) => s === 'full').length;

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-18T08:40:20.000Z',
  responses: {
    terminal: {
      '/terminal/now': {
        name: '한빛 고속버스터미널',
        english: 'EXPRESS BUS TERMINAL',
        time: '17:40',
        date: '10월 18일 일요일',
        today: [
          { label: '오늘 운행', value: '612회', red: false },
          { label: '남은 출발', value: `${all.length}회 표시 중`, red: false },
          { label: '지연', value: `${late}회`, red: late > 0 },
          { label: '매진', value: `${full}회`, red: full > 0 },
        ],
        updatedAt: at,
      },
      '/terminal/bays': {
        value: PLAN.map(([id, family, departures]) => ({
          id,
          ...LINES[family],
          departures: departures.map(([time, to, seats, state, note]) => ({ time, to, seats: seats === 0 ? '매진' : `잔여 ${seats}`, state, note })),
          updatedAt: at,
        })),
        updatedAt: at,
      },
      '/terminal/notices': {
        value: ['호남선 고속도로 사고로 광주·전주·목포행 10–20분 지연', '출발 5분 전 탑승을 마칩니다', '분실물은 1층 안내데스크에서 찾으세요'],
        updatedAt: at,
      },
    },
  },
};
