// Example data written for the sample, not recorded from a source — no public source carries a company's lanes.
// Keep it consistent: it is Wednesday of week 43. A typhoon closed Keelung for two days over the weekend, so the boards
// from Hsinchu now take 13 days against their usual 9 — four late, the first lane past the "late" mark in twelve weeks —
// and the plant holds nine days of boards against a ten-day floor. Penang's packaging waits three days at Port Klang
// (slow). The seven other lanes run within a day of usual. A lane's colour follows its days against its usual: two or
// more over is slow, four or more late, as the legend says.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:00:00Z';

const lane = (id: string, part: string, days: number, usual: number, teu: number) => ({
  id,
  part,
  days,
  usual,
  status: days - usual >= 4 ? 'late' : days - usual >= 2 ? 'slow' : 'ok',
  teu,
  updatedAt: at,
});

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T06:00:00.000Z',
  responses: {
    supply: {
      '/supply/story': {
        kicker: '공급망 · 43주차',
        title: '태풍에 막힌 대만 기판 — 리드타임 13일, 석 달 만에 가장 길다',
        dek: '아홉 구간 가운데 일곱은 제때 움직였다. 늦은 하나와 느린 하나는 모두 아시아에서 평택으로 들어오는 부품이다.',
        date: '2026년 10월 21일 수요일',
        updatedAt: at,
      },
      '/supply/lanes': {
        value: [
          lane('hsinchu', '기판', 13, 9, 18),
          lane('osaka', '수동부품', 3, 3, 9),
          lane('shenzhen', '전원·케이스', 6, 6, 26),
          lane('penang', '칩 패키징', 11, 8, 7),
          lane('munich', '센서', 24, 23, 3),
          lane('austin', 'MCU', 19, 18, 2),
          lane('rotterdam', '완제품', 34, 33, 22),
          lane('longbeach', '완제품', 16, 15, 30),
          lane('singapore', '완제품', 7, 7, 12),
        ],
      },
      '/supply/plant': { stockDays: 9, updatedAt: at },
      '/supply/figures': {
        value: [
          { label: '늦은 구간', value: '1', note: '신주 → 평택, 평소보다 4일', tone: 'late' },
          { label: '느린 구간', value: '1', note: '페낭 → 평택, 평소보다 3일', tone: 'plain' },
          { label: '기판 재고', value: '9일', note: '안전재고 10일 아래', tone: 'late' },
          { label: '주간 컨테이너', value: '129 TEU', note: '지난주 131', tone: 'plain' },
        ],
        updatedAt: at,
      },
      '/supply/risks': {
        value: [
          { name: '신주 · 기판', text: '지룽항이 태풍으로 이틀 닫혀 선적이 밀렸다. 다음 배는 금요일 — 항공 대체 견적을 받는 중.', tone: 'late' },
          { name: '페낭 · 칩 패키징', text: '포트클랑 환적 대기 사흘. 싱가포르를 거쳐 돌리는 안을 보고 있다.', tone: 'slow' },
        ],
        updatedAt: at,
      },
      '/supply/note': {
        title: '태풍 하나가 기판 재고를 열흘 아래로',
        text: '지난 주말 태풍으로 대만 지룽항이 이틀 닫히면서 신주에서 오는 기판 선적이 밀렸다. 평소 9일이던 리드타임이 13일로 늘었고, 평택의 기판 재고는 9일치로 안전재고 10일 아래로 내려갔다. 다음 배는 금요일에 뜬다.',
        updatedAt: at,
      },
      '/supply/leadTimes': {
        value: [
          { week: 'W32', hsinchu: 9, penang: 8, shenzhen: 6 },
          { week: 'W33', hsinchu: 9, penang: 8, shenzhen: 6 },
          { week: 'W34', hsinchu: 8, penang: 8, shenzhen: 7 },
          { week: 'W35', hsinchu: 9, penang: 9, shenzhen: 6 },
          { week: 'W36', hsinchu: 9, penang: 8, shenzhen: 6 },
          { week: 'W37', hsinchu: 10, penang: 8, shenzhen: 6 },
          { week: 'W38', hsinchu: 9, penang: 8, shenzhen: 6 },
          { week: 'W39', hsinchu: 9, penang: 9, shenzhen: 6 },
          { week: 'W40', hsinchu: 9, penang: 10, shenzhen: 7 },
          { week: 'W41', hsinchu: 10, penang: 10, shenzhen: 6 },
          { week: 'W42', hsinchu: 9, penang: 11, shenzhen: 6 },
          { week: 'W43', hsinchu: 13, penang: 11, shenzhen: 6 },
        ],
        updatedAt: at,
      },
      '/supply/shipments': {
        value: [
          { lane: '신주 → 평택', vessel: '지룽항 대기', eta: '11/2', delay: '+4일', tone: 'late' },
          { lane: '페낭 → 평택', vessel: '예시 머천트호', eta: '10/29', delay: '+3일', tone: 'slow' },
          { lane: '선전 → 평택', vessel: '예시 코스터호', eta: '10/24', delay: '정시', tone: 'ok' },
          { lane: '평택 → 롱비치', vessel: '예시 퍼시픽호', eta: '10/30', delay: '정시', tone: 'ok' },
          { lane: '평택 → 로테르담', vessel: '예시 오리온호', eta: '11/14', delay: '정시', tone: 'ok' },
        ],
        updatedAt: at,
      },
    },
  },
};
