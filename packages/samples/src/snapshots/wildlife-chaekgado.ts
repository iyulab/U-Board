// Example data written for the sample — the park and its stations are made up. Keep it consistent: it is 07:50 on a
// Thursday in late October, before the morning round. The species bars sum to the stations' animals today (45); the
// round visits the stations whose state asks for it (battery, memory, fault) and logs the otter for the survey.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T22:49:00Z';

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T22:50:00.000Z',
  responses: {
    park: {
      '/park/now': { value: { date: '10월 22일 목요일', time: '07:50', count: '7' }, updatedAt: at },
      '/park/cameras': {
        value: {
          c1: { no: '제1지점', place: '능선 길목', animal: '멧돼지', time: '05:12', shots: '38', hits: '6', battery: '78', memory: '41', state: 'ok', word: '정상', note: '새끼 셋 동반' },
          c2: { no: '제2지점', place: '계곡 물가', animal: '수달', time: '04:47', shots: '22', hits: '5', battery: '66', memory: '30', state: 'rare', word: '보호종 포착', note: '천연기념물 — 조사 기록' },
          c3: { no: '제3지점', place: '참나무 숲', animal: '노루', time: '06:30', shots: '51', hits: '12', battery: '18', memory: '64', state: 'battery', word: '전지 부족', note: '오늘 교체' },
          c4: { no: '제4지점', place: '바위 굴 앞', animal: '오소리', time: '03:58', shots: '9', hits: '2', battery: '55', memory: '22', state: 'ok', word: '정상', note: '굴 드나듦 2회' },
          c5: { no: '제5지점', place: '옛 화전터', animal: '—', time: '어제 18:40', shots: '0', hits: '0', battery: '72', memory: '12', state: 'fault', word: '촬영 없음', note: '렌즈 김서림 의심' },
          c6: { no: '제6지점', place: '샘터', animal: '너구리', time: '02:15', shots: '27', hits: '7', battery: '90', memory: '96', state: 'full', word: '저장 가득', note: '메모리 회수' },
          c7: { no: '제7지점', place: '정상부 숲길', animal: '다람쥐', time: '07:31', shots: '64', hits: '13', battery: '83', memory: '48', state: 'ok', word: '정상', note: '바람에 흔들린 오촬영 다수' },
        },
        updatedAt: at,
      },
      '/park/species': {
        value: [
          { species: '다람쥐', hits: 13 },
          { species: '노루', hits: 12 },
          { species: '너구리', hits: 7 },
          { species: '멧돼지', hits: 6 },
          { species: '수달', hits: 5 },
          { species: '오소리', hits: 2 },
        ],
        updatedAt: at,
      },
      '/park/round': {
        value: [
          { no: '제5지점', what: '렌즈 닦기 · 시험 촬영 — 어제 저녁부터 한 장도 없음', state: 'urgent' },
          { no: '제3지점', what: '전지 교체 (18%)', state: 'todo' },
          { no: '제6지점', what: '메모리 카드 회수·교체 (96%)', state: 'todo' },
          { no: '제2지점', what: '수달 사진 조사 기록부에 옮기기', state: 'todo' },
          { no: '제1지점', what: '어제 각도 조정 확인', state: 'done' },
        ],
        updatedAt: at,
      },
    },
  },
};
