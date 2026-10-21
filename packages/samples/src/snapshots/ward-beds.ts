// Example data written for the sample, not recorded from a source — no public source carries a ward's beds, and
// the patients are made up and masked as a real board masks them. Keep it consistent: it is 14:00 on a Wednesday on
// a surgical ward. Four go home today (two already gone, their beds being cleaned), two beds are kept for patients
// coming up from the emergency room, the isolation room holds a patient on contact precautions. The census is
// counted from the beds.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:00:00Z';

type State = 'in' | 'out-today' | 'cleaning' | 'free' | 'isolation' | 'coming';

/** Every bed, room by room, with what the board shows of it. */
const PLAN: Array<[string, State, string, string, string, boolean]> = [
  ['701-1', 'in', '김○○ 남 72', '재원 6일', '수술 후 4일', true],
  ['701-2', 'out-today', '이○○ 남 58', '재원 4일', '15시 퇴원', false],
  ['701-3', 'in', '박○○ 남 64', '재원 2일', '내일 수술', false],
  ['701-4', 'cleaning', '청소 중', '13:40 퇴원', '14:20 완료 예정', false],
  ['702-1', 'in', '최○○ 여 81', '재원 9일', '수술 후 7일', true],
  ['702-2', 'in', '정○○ 여 46', '재원 1일', '회복실', false],
  ['702-3', 'out-today', '강○○ 여 67', '재원 5일', '16시 · 요양병원', false],
  ['702-4', 'in', '조○○ 여 55', '재원 3일', '수술 후 1일', false],
  ['703-1', 'in', '윤○○ 남 49', '재원 2일', '수술 후 1일', false],
  ['703-2', 'coming', '입원 예정', '남 59 · 응급실', '14:30 입실', false],
  ['704-1', 'isolation', '장○○ 남 77', '재원 11일', '접촉 격리', true],
  ['705-1', 'in', '임○○ 여 62', '재원 4일', '수술 후 3일', false],
  ['706-1', 'in', '한○○ 남 70', '재원 7일', '수술 후 5일', true],
  ['706-2', 'in', '오○○ 남 53', '재원 2일', '내일 수술', false],
  ['706-3', 'free', '빈 병상', '남자 병실', '바로 입원 가능', false],
  ['706-4', 'in', '서○○ 남 61', '재원 3일', '수술 후 2일', false],
  ['707-1', 'in', '신○○ 여 74', '재원 8일', '수술 후 6일', true],
  ['707-2', 'cleaning', '청소 중', '12:50 퇴원', '14:10 완료 예정', false],
  ['707-3', 'in', '권○○ 여 39', '재원 1일', '수술 중', false],
  ['707-4', 'coming', '입원 예정', '여 44 · 응급실', '15:00 입실', false],
  ['708-1', 'in', '황○○ 남 68', '재원 5일', '수술 후 3일', false],
  ['708-2', 'in', '안○○ 남 57', '재원 3일', '수술 후 2일', false],
];

/** The beds, in the order the board lays them out. */
export const BEDS = PLAN.map(([id]) => id);

const count = (...states: State[]) => PLAN.filter(([, s]) => states.includes(s)).length;
const filled = count('in', 'out-today', 'isolation');

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:00:30.000Z',
  responses: {
    ward: {
      '/ward/now': { ward: '7병동', hospital: '온새미 종합병원 · 외과', date: '10월 21일 수요일', time: '14:00', updatedAt: at },
      '/ward/beds': { value: PLAN.map(([id, state, who, day, note, fall]) => ({ id, state, who, day, note, fall, updatedAt: at })), updatedAt: at },
      '/ward/census': {
        filled,
        total: PLAN.length,
        rate: Math.round((filled / PLAN.length) * 100),
        parts: [
          { label: '오늘 퇴원', value: count('out-today', 'cleaning'), red: true },
          { label: '입원 예정', value: count('coming'), red: false },
          { label: '빈 병상', value: count('free'), red: false },
        ],
        updatedAt: at,
      },
      '/ward/week': {
        value: [
          { day: '목', rate: 86 },
          { day: '금', rate: 91 },
          { day: '토', rate: 77 },
          { day: '일', rate: 73 },
          { day: '월', rate: 95 },
          { day: '화', rate: 100 },
          { day: '수', rate: Math.round((filled / PLAN.length) * 100) },
        ],
        updatedAt: at,
      },
      '/ward/coming': {
        note: '간호사 5명 · 환자 1:4',
        value: [
          { when: '14:30', from: '응급실', who: '남 59 · 충수염', bed: '703-2' },
          { when: '15:00', from: '응급실', who: '여 44 · 담낭염', bed: '707-4' },
          { when: '내일', from: '외래', who: '예정 입원 3명', bed: '대기' },
        ],
        updatedAt: at,
      },
    },
  },
};
