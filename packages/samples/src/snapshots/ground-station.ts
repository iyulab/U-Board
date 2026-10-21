// Example data written for the sample, not recorded from a source — no public source carries a satellite's telemetry.
// Keep it consistent: it is 14:58 KST and the satellite is over the Yellow Sea, coming down toward Daejeon six minutes
// into its pass. Its
// orbit is 95 minutes round, so it was in the earth's shadow for 35 minutes half an orbit ago and one orbit before that:
// the battery is drawn from those windows (falling in shadow, charging in sun, the downlink drawing a little now) and
// the payload cools in each. The passes follow the track: South Africa and Sweden on the next orbit, Hawaii and Chile
// after.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-21T05:58:00Z';

/** Minutes before now when the satellite was in the earth's shadow. */
const ECLIPSES: Array<[number, number]> = [
  [-160, -125],
  [-65, -30],
];
const inShadow = (t: number) => ECLIPSES.some(([from, to]) => t >= from && t < to);

/** The last two orbits, minute by minute, kept every five minutes. */
const TELEMETRY = (() => {
  const rows: Array<{ t: string; soc: number; payload: number }> = [];
  let soc = 78.4;
  let payload = 19.5;
  for (let t = -190; t <= 0; t++) {
    const shade = inShadow(t);
    // Downlinking since the pass began draws the battery a little in sun too.
    soc += shade ? -0.42 : t >= -6 ? -0.05 : 0.2;
    soc = Math.min(soc, 92);
    payload += shade ? -0.16 : 0.12;
    payload = Math.min(Math.max(payload, 9), 24);
    if (t % 5 === 0) {
      const minutes = 14 * 60 + 58 + t;
      const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      rows.push({ t: hhmm, soc: Math.round(soc * 10) / 10, payload: Math.round(payload * 10) / 10 });
    }
  }
  return rows;
})();

const last = TELEMETRY[TELEMETRY.length - 1]!;

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-21T05:58:30.000Z',
  responses: {
    mission: {
      '/mission/now': { mission: '예시위성 3호 — 지구관측', orbit: '18,204', mode: '정상 운용 · 다운링크 중', utc: '05:58', local: '14:58', updatedAt: at },
      '/mission/stations': {
        value: [
          { id: 'daejeon', state: 'contact', updatedAt: at },
          { id: 'kiruna', state: 'idle', updatedAt: at },
          { id: 'hartebeesthoek', state: 'next', updatedAt: at },
          { id: 'hawaii', state: 'idle', updatedAt: at },
          { id: 'santiago', state: 'maintenance', updatedAt: at },
        ],
      },
      '/mission/passes': {
        value: [
          { station: '대전', aos: '14:52', los: '15:03', elevation: 62, state: 'contact' },
          { station: '하르트비스후크', aos: '15:41', los: '15:50', elevation: 38, state: 'next' },
          { station: '키루나', aos: '16:19', los: '16:31', elevation: 71, state: 'later' },
          { station: '하와이', aos: '17:05', los: '17:13', elevation: 24, state: 'later' },
          { station: '대전', aos: '18:24', los: '18:33', elevation: 29, state: 'later' },
        ],
        updatedAt: at,
      },
      '/mission/state': {
        value: [
          { label: '배터리 SOC', value: last.soc.toFixed(1), unit: '%', state: 'nominal' },
          { label: '태양전지 전력', value: '412', unit: 'W', state: 'nominal' },
          { label: '탑재체 온도', value: last.payload.toFixed(1), unit: '°C', state: 'nominal' },
          { label: '다운링크', value: '22', unit: '% · 38.4 GB 중', state: 'nominal' },
          { label: '링크 SNR', value: '14.2', unit: 'dB', state: 'nominal' },
          { label: '산티아고', value: '정비', unit: '안테나 구동부', state: 'caution' },
        ],
        updatedAt: at,
      },
      '/mission/telemetry': { value: TELEMETRY, updatedAt: at },
      '/mission/log': {
        value: [
          { time: '14:52:08', text: 'AOS 대전 — 반송파 잡음', kind: 'event' },
          { time: '14:52:41', text: '링크 확보 · SNR 13.8 dB', kind: 'event' },
          { time: '14:53:02', text: 'TC 촬영 계획 업로드 — 장면 12개(내일 오전)', kind: 'command' },
          { time: '14:53:30', text: 'TC 계획 검증 통과(CRC 일치)', kind: 'event' },
          { time: '14:54:15', text: 'TC 저장 데이터 다운링크 시작 — 38.4 GB', kind: 'command' },
          { time: '14:56:50', text: '산티아고 지상국 안테나 구동부 정비 — 17:48 통과 제외', kind: 'caution' },
          { time: '14:58:00', text: '다운링크 22% · 남은 통과 5분', kind: 'event' },
        ],
        updatedAt: at,
      },
    },
  },
};
