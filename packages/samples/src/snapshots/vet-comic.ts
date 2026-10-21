// Example data written for the sample — the hospital, its patients and its numbers are made up. Keep it consistent: it
// is 15:20 on a Thursday. Consulting room 1 is seeing a patient, room 2 stands empty for the next one called, surgery
// has an emergency (a dog that swallowed a toy), the treatment room is being cleaned. The wards hold nine of twelve
// kennels (dogs five of six, cats four of six), one dog watched closely after surgery. Seven wait, the emergency one
// first; one has been called to room 2. Today's registrations are the sum of the hourly bars.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-22T06:20:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-22T06:20:20.000Z',
  responses: {
    clinic: {
      '/clinic/now': { value: { series: '오늘의 진료 · 오후 편', name: '누리 동물병원', date: '10월 22일 목요일', time: '15:20' }, updatedAt: at },
      '/clinic/rooms': {
        value: {
          exam1: { room: '진료실 1', state: 'busy', line: '귀 안쪽이 빨갛네요 — 약 넣어 볼게요', patient: '콩이 · 말티즈 5살', vet: '한 원장', elapsed: '12분' },
          exam2: { room: '진료실 2', state: 'free', line: '다음 환자를 불렀어요…', patient: '— 호출: 보리', vet: '서 수의사', elapsed: '—' },
          surgery: { room: '수술실', state: 'urgent', line: '응급! 장난감 삼킴 — 내시경 중', patient: '두부 · 비글 2살', vet: '한 원장 외 2', elapsed: '24분' },
          treatment: { room: '처치실', state: 'clean', line: '소독 중 — 15:30에 다시 열어요', patient: '—', vet: '테크니션 1', elapsed: '6분' },
        },
        updatedAt: at,
      },
      '/clinic/wards': {
        value: {
          dogs: {
            room: '입원실 · 강아지',
            used: '5',
            of: '6',
            kennels: [
              { name: '초코', state: 'in', note: '수액 2일째' },
              { name: '해피', state: 'watch', note: '수술 뒤 관찰' },
              { name: '몽이', state: 'in', note: '내일 퇴원' },
              { name: '루비', state: 'in', note: '피부 치료' },
              { name: '탄이', state: 'in', note: '수액 1일째' },
              { name: '빈 장', state: 'empty', note: '—' },
            ],
            note: '다음 투약 16:00 — 5마리',
          },
          cats: {
            room: '입원실 · 고양이',
            used: '4',
            of: '6',
            kennels: [
              { name: '나비', state: 'in', note: '신장 수액' },
              { name: '치즈', state: 'in', note: '중성화 회복' },
              { name: '빈 장', state: 'empty', note: '—' },
              { name: '까미', state: 'in', note: '내일 퇴원' },
              { name: '모모', state: 'in', note: '식욕 관찰' },
              { name: '빈 장', state: 'empty', note: '—' },
            ],
            note: '조용한 방 — 문 닫아 주세요',
          },
        },
        updatedAt: at,
      },
      '/clinic/queue': {
        value: [
          { no: 'A-41', name: '별이', kind: '푸들 · 7살', why: '갑자기 절뚝거림', wait: '3분', state: 'urgent', word: '응급 먼저' },
          { no: 'A-36', name: '보리', kind: '코리안숏헤어', why: '예방접종', wait: '22분', state: 'called', word: '진료실 2' },
          { no: 'A-37', name: '꼬미', kind: '포메라니안', why: '정기 검진', wait: '18분', state: 'wait', word: '대기' },
          { no: 'A-38', name: '레오', kind: '골든 리트리버', why: '귀 긁음', wait: '15분', state: 'wait', word: '대기' },
          { no: 'A-39', name: '하루', kind: '러시안블루', why: '구토 2회', wait: '11분', state: 'wait', word: '대기' },
          { no: 'A-40', name: '밤톨', kind: '시바견', why: '발톱 · 목욕', wait: '7분', state: 'wait', word: '대기' },
          { no: 'A-42', name: '쿠키', kind: '햄스터', why: '앞니 손질', wait: '1분', state: 'wait', word: '대기' },
        ],
        updatedAt: at,
      },
      '/clinic/figures': {
        value: [
          { label: '오늘 접수', value: '42', note: '마리 — 9시부터' },
          { label: '지금 대기', value: '7', note: '응급 1 · 호출 1' },
          { label: '입원', value: '9/12', note: '강아지 5 · 고양이 4' },
        ],
        updatedAt: at,
      },
      '/clinic/registered': {
        value: [
          { hour: '9시', patients: 6 },
          { hour: '10시', patients: 8 },
          { hour: '11시', patients: 7 },
          { hour: '12시', patients: 4 },
          { hour: '13시', patients: 5 },
          { hour: '14시', patients: 8 },
          { hour: '15시', patients: 4 },
        ],
        updatedAt: at,
      },
    },
  },
};
