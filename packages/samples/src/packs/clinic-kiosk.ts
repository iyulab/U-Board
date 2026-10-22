import type { Binding, CanvasView, ElementDefinition, Node, Widget } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { svgDataUrl } from '../frame.js';
import { snapshot } from '../snapshots/clinic-kiosk.js';

// The upright screen in a hospital's outpatient hall, read standing a few steps away by people who are unwell, old,
// or there for someone else: which number each clinic is calling now and who is next, how long the wait is, the
// prescriptions ready at the pharmacy, the queue at the blood and imaging rooms, the car park, and the hours
// the hall is usually busiest. A portrait kiosk:
// one column, very large numbers, plain words, high contrast, each clinic in its own colour that also marks its
// corridor. No public source carries a hospital's queues this way, so the values are example data written for it.

export const CLINIC: ExampleSampleConnector = {
  key: 'clinic',
  name: '예시 외래 대기 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 병원이 아닙니다' },
};

/** Queues move by the minute; three minutes without an answer is a source that has stopped. */
const MAX_AGE_SECONDS = 3 * 60;

const bind = (path: string, valuePath: string): Binding => ({
  adapter: CLINIC.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
});

const WIDTH = 1080;
const HEIGHT = 1920;
const INK = '#0f172a';
const SOFT = '#475569';
const PAPER = '#f8fafc';
const FONT = 'var(--u-widget-font-family)';

/** Each clinic's colour — the same one painted along its corridor, so the screen points the way. */
const CLINICS = [
  { id: 'internal', name: '내과', room: '2층 · A 구역', colour: '#2563eb' },
  { id: 'ortho', name: '정형외과', room: '2층 · B 구역', colour: '#059669' },
  { id: 'paediatric', name: '소아청소년과', room: '1층 · C 구역', colour: '#d97706' },
  { id: 'eye', name: '안과', room: '3층 · D 구역', colour: '#7c3aed' },
];

const PAD = 48;
const INNER = WIDTH - PAD * 2;
const ROWS = {
  head: { y: 40, height: 150 },
  clinics: { y: 220, height: 860 },
  wait: { y: 1110, height: 300 },
  pharmacy: { y: 1440, height: 210 },
  footer: { y: 1680, height: 200 },
};
const CARD = { width: (INNER - 24) / 2, height: (ROWS.clinics.height - 24) / 2 };
const cardAt = (i: number) => ({ x: PAD + (i % 2) * (CARD.width + 24), y: ROWS.clinics.y + Math.floor(i / 2) * (CARD.height + 24) });
const HALF = (INNER - 24) / 2;

// ── The drawing ─────────────────────────────────────────────────────────────────────────────────────────────────

function drawing(): string {
  const card = (x: number, y: number, width: number, height: number, stripe?: string) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="#fff" stroke="#cbd5e1" stroke-width="2"/>${
      stripe ? `<path d="M ${x + 28} ${y} H ${x + width - 28} A 28 28 0 0 1 ${x + width} ${y + 28} V ${y + 18} H ${x} V ${y + 28} A 28 28 0 0 1 ${x + 28} ${y} Z" fill="${stripe}"/>` : ''
    }`;
  const title = (x: number, y: number, text: string) => `<text x="${x}" y="${y}" fill="${INK}" font-size="34" font-weight="800" font-family="sans-serif">${text}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
<rect width="${WIDTH}" height="${ROWS.head.y + ROWS.head.height + 4}" fill="#0f766e"/>
${CLINICS.map((c, i) => {
  const { x, y } = cardAt(i);
  return card(x, y, CARD.width, CARD.height, c.colour);
}).join('\n')}
${card(PAD, ROWS.wait.y, INNER, ROWS.wait.height)}
${title(PAD + 32, ROWS.wait.y + 56, '검사실 대기')}
${card(PAD, ROWS.pharmacy.y, INNER, ROWS.pharmacy.height)}
${title(PAD + 32, ROWS.pharmacy.y + 56, '약 받으실 번호')}
${card(PAD, ROWS.footer.y, HALF, ROWS.footer.height)}
${title(PAD + 32, ROWS.footer.y + 56, '주차장 빈자리')}
${card(PAD + HALF + 24, ROWS.footer.y, HALF, ROWS.footer.height)}
${title(PAD + HALF + 56, ROWS.footer.y + 56, '평소 붐비는 시간')}
</svg>`;
  return svgDataUrl(svg);
}

// ── Elements ────────────────────────────────────────────────────────────────────────────────────────────────────

/** The hospital, the day and the hour, and where to ask for help. */
const masthead: ElementDefinition = {
  render: 'template',
  props: { type: 'object', required: ['name', 'date', 'time'], properties: { name: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' }, help: { type: 'string' } } },
  template: `<header class="mast"><div><h1>{{name}}</h1><p>{{date}} · {{help}}</p></div><time>{{time}}</time></header>`,
  style: `.mast{height:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;font-family:${FONT};color:#fff}
h1{margin:0;font-size:44px;font-weight:800}
p{margin:6px 0 0;font-size:24px;color:#ccfbf1}
time{font-size:72px;font-weight:700;font-variant-numeric:tabular-nums}`,
  size: { width: 984, height: 130 },
};

/** A clinic: the number it is calling now, very large, the next few, and the wait. */
const clinic: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'calling', 'next', 'waiting', 'minutes'],
    properties: {
      name: { type: 'string' },
      room: { type: 'string' },
      colour: { type: 'string' },
      calling: { type: 'number' },
      desk: { type: 'string' },
      next: { type: 'array', items: { type: 'number' } },
      waiting: { type: 'number' },
      minutes: { type: 'number' },
    },
  },
  template: `<section class="clinic" style="--c: {{colour}}"><header><h2>{{name}}</h2><small>{{room}}</small></header><p class="now"><span>지금 호출</span><b>{{calling}}</b><em>{{desk}}</em></p><p class="next"><span>다음</span>{{#next}}<i>{{.}}</i>{{/next}}</p><footer><span>대기 <b>{{waiting}}</b>명</span><span>약 <b>{{minutes}}</b>분</span></footer></section>`,
  style: `.clinic{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:10px;font-family:${FONT};color:${INK}}
header{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
h2{margin:0;font-size:38px;font-weight:800;color:var(--c)}
small{font-size:20px;color:${SOFT}}
.now{margin:0;display:grid;justify-items:center;align-content:center;border-radius:20px;background:color-mix(in srgb,var(--c) 9%,white);border:3px solid var(--c)}
.now span{font-size:22px;font-weight:700;color:var(--c)}
.now b{font-size:100px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.now em{font-style:normal;font-size:24px;font-weight:700;color:${SOFT}}
.next{margin:0;display:flex;align-items:center;gap:10px;font-size:20px;color:${SOFT}}
.next i{font-style:normal;padding:4px 14px;border-radius:999px;background:#f1f5f9;border:2px solid #cbd5e1;font-size:26px;font-weight:700;color:${INK};font-variant-numeric:tabular-nums}
footer{display:flex;justify-content:space-between;font-size:22px;color:${SOFT}}
footer b{font-size:34px;color:${INK};font-variant-numeric:tabular-nums}`,
  size: { width: 440, height: 360 },
};

/** The blood, X-ray and scan rooms: how many wait and for how long, longest first. */
const tests: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['rooms'],
    properties: {
      rooms: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, place: { type: 'string' }, waiting: { type: 'number' }, minutes: { type: 'number' }, share: { type: 'number' }, level: { enum: ['short', 'usual', 'long'] } } },
      },
    },
  },
  template: `<ul class="tests">{{#rooms}}<li class="{{level}}" style="--s: {{share}}"><b>{{name}}</b><small>{{place}}</small><span><i></i></span><em><strong>{{minutes}}</strong>분 · {{waiting}}명</em></li>{{/rooms}}</ul>`,
  style: `.tests{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:18px;font-family:${FONT};color:${INK}}
li{--c:#059669;display:grid;grid-template-columns:150px 150px 1fr 190px;align-items:center;gap:16px}
.usual{--c:#d97706}.long{--c:#dc2626}
b{font-size:28px}
small{font-size:20px;color:${SOFT}}
span{height:18px;border-radius:9px;background:#e2e8f0;overflow:hidden}
span i{display:block;height:100%;width:calc(var(--s) * 1%);border-radius:9px;background:var(--c)}
em{font-style:normal;font-size:22px;text-align:right;color:${SOFT};font-variant-numeric:tabular-nums}
strong{font-size:34px;color:var(--c)}`,
  size: { width: 920, height: 210 },
};

/** The prescriptions ready to collect: each number on a tile, the newest marked. */
const pharmacy: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['ready'],
    properties: { ready: { type: 'array', items: { type: 'object', properties: { no: { type: 'number' }, fresh: { type: 'boolean' } } } }, counter: { type: 'string' } },
  },
  template: `<section class="rx"><ol>{{#ready}}<li class="{{#fresh}}fresh{{/fresh}}">{{no}}</li>{{/ready}}</ol><p>{{counter}}</p></section>`,
  style: `.rx{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:10px;font-family:${FONT};color:${INK}}
ol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(6,1fr);gap:12px;align-content:center}
li{display:grid;place-items:center;height:56px;border-radius:14px;background:#f1f5f9;border:2px solid #cbd5e1;font-size:32px;font-weight:800;font-variant-numeric:tabular-nums}
.fresh{background:#0f766e;border-color:#0f766e;color:#fff}
p{margin:0;font-size:20px;color:${SOFT}}`,
  size: { width: 920, height: 120 },
};

/** The car park, level by level: free spaces, red when nearly full. */
const parking: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['levels'],
    properties: { levels: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, free: { type: 'number' }, level: { enum: ['free', 'few', 'full'] } } } } },
  },
  template: `<ul class="park">{{#levels}}<li class="{{level}}"><span>{{name}}</span><b>{{free}}</b></li>{{/levels}}</ul>`,
  style: `.park{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-content:center;font-family:${FONT};color:${INK}}
li{--c:#059669;display:grid;justify-items:center;padding:8px 0;border-radius:14px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 8%,white)}
.few{--c:#d97706}.full{--c:#dc2626}
span{font-size:20px;color:${SOFT}}
b{font-size:40px;line-height:1.1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}`,
  size: { width: 420, height: 110 },
};

// ── The board ───────────────────────────────────────────────────────────────────────────────────────────────────

const node = (id: string, x: number, y: number, width: number, height: number, widget: Widget): Node => ({ id, x, y, width, height, anchored: false, widget });

const clinicNode = ({ id, name, room, colour }: (typeof CLINICS)[number], i: number): Node => {
  const { x, y } = cardAt(i);
  const at = (field: string) => bind('/clinic/queues', `/${id}/${field}`);
  return node(`clinic-${id}`, x + 24, y + 40, CARD.width - 48, CARD.height - 64, {
    type: 'element:clinic',
    props: { name, room, colour, calling: 0, desk: '', next: [], waiting: 0, minutes: 0 },
    bindings: { calling: at('calling'), desk: at('desk'), next: at('next'), waiting: at('waiting'), minutes: at('minutes') },
  });
};

const nodes: Node[] = [
  node('masthead', PAD, ROWS.head.y + 10, INNER, 130, {
    type: 'element:masthead',
    props: { name: '', date: '', time: '', help: '' },
    bindings: { name: bind('/clinic/now', '/name'), date: bind('/clinic/now', '/date'), time: bind('/clinic/now', '/time'), help: bind('/clinic/now', '/help') },
  }),
  ...CLINICS.map(clinicNode),
  node('tests', PAD + 32, ROWS.wait.y + 76, INNER - 64, ROWS.wait.height - 96, { type: 'element:tests', props: { rooms: [] }, bindings: { rooms: bind('/clinic/tests', '/value') } }),
  node('pharmacy', PAD + 32, ROWS.pharmacy.y + 76, INNER - 64, ROWS.pharmacy.height - 92, {
    type: 'element:pharmacy',
    props: { ready: [], counter: '' },
    bindings: { ready: bind('/clinic/pharmacy', '/ready'), counter: bind('/clinic/pharmacy', '/counter') },
  }),
  node('parking', PAD + 24, ROWS.footer.y + 76, HALF - 48, ROWS.footer.height - 92, { type: 'element:parking', props: { levels: [] }, bindings: { levels: bind('/clinic/parking', '/value') } }),
  node('visits', PAD + HALF + 40, ROWS.footer.y + 70, HALF - 56, ROWS.footer.height - 82, {
    type: 'chart.bar',
    props: { data: [], mapping: { x: 'hour', y: 'visits' }, options: { series: [{ label: '화요일 평균 내원', color: '#0f766e' }] } },
    bindings: { data: bind('/clinic/visits', '/value') },
  }),
];

const document: CanvasView = {
  kind: 'canvas',
  appearance: 'light',
  accent: '#0f766e',
  background: { image: { src: drawing(), width: WIDTH, height: HEIGHT } },
  nodes,
  connectors: [],
  elements: { masthead, clinic, tests, pharmacy, parking },
};

export const clinicKiosk: SamplePack = {
  id: 'clinic-kiosk',
  title: { ko: '외래 대기 안내 — 세로 키오스크', en: 'Outpatient waiting — a portrait kiosk' },
  field: { ko: '의료', en: 'Healthcare' },
  kind: { ko: '세로 화면(9:16 키오스크)', en: 'Portrait screen (a 9:16 kiosk)' },
  domain: 'health',
  styles: ['signage'],
  summary: {
    ko: '병원 외래 로비에 세워 두는 세로 화면 — 몸이 불편한 사람도 몇 걸음 떨어져 읽도록 한 단, 아주 큰 숫자, 쉬운 말, 높은 대비. 진료과마다 지금 호출 번호와 다음 순서·대기 인원·예상 시간(복도 색과 같은 색), 검사실 대기, 약 받을 번호, 주차장 층별 빈자리, 평소 붐비는 시간. 예시 데이터입니다.',
    en: 'The upright screen in a hospital’s outpatient hall — one column read from a few steps away by people who are unwell: very large numbers, plain words, high contrast. Each clinic’s number being called now, who is next, how many wait and for how long, in the colour of its corridor; the queue at the test rooms, prescriptions ready to collect, free spaces in the car park, and the hours it is usually busiest. Example data.',
  },
  connectors: [CLINIC],
  document,
  snapshot,
};
