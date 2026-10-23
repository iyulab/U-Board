import type { Binding, CanvasView, Connector, ElementDefinition, Node, Shape } from '@iyulab/u-board/domain';
import type { ExampleSampleConnector, SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/it-topology.js';

// A web service's servers in the zones they run in — the internet edge, the service tier, the data tier — and the
// links between them. Each server shows its state and CPU; each link its traffic as its label, its load as its width,
// and its colour only when it is busy or down; the replica's link its replication lag. The service's figures above,
// the internet line's traffic below. Grey for what is normal (ISA-101), as on an operations wall. No public source
// carries a service's servers, so the values are example data written for the board.

export const NMS: ExampleSampleConnector = {
  key: 'nms',
  name: '예시 서버·네트워크 감시 API',
  example: true,
  attribution: { text: '예시 데이터 — 실제 서비스가 아닙니다' },
};

/** The agents report every 30 seconds; two minutes without one is an agent that has stopped. */
const MAX_AGE_SECONDS = 2 * 60;

const bindPath = (path: string, valuePath: string, map?: Binding['map']): Binding => ({
  adapter: NMS.key,
  ref: { path, valuePath, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const bindItem = (path: string, id: string, field: string, map?: Binding['map']): Binding => ({
  adapter: NMS.key,
  ref: { path, item: { list: '/value', where: { id } }, valuePath: `/${field}`, observedAtPath: '/updatedAt', maxAgeSeconds: MAX_AGE_SECONDS },
  ...(map ? { map } : {}),
});

const STATE_TEXT = { values: { up: '정상', degraded: '저하', down: '중단' }, otherwise: '알 수 없음' };
const STATE = { values: { up: 'up', degraded: 'degraded', down: 'down' }, otherwise: 'unknown' };

/** A server: its role and name, its state in words with a mark, its CPU as a number and a bar. Grey while it is up;
 *  amber when degraded, red when down — the mark and the words, so it reads without colour too. */
const server: ElementDefinition = {
  render: 'template',
  props: {
    type: 'object',
    required: ['name', 'role', 'state', 'stateText', 'cpu'],
    properties: {
      name: { type: 'string' },
      role: { type: 'string' },
      state: { enum: ['up', 'degraded', 'down', 'unknown'], default: 'unknown' },
      stateText: { type: 'string' },
      cpu: { type: 'number', minimum: 0, maximum: 100, description: 'CPU use, %.' },
    },
  },
  template: `<div class="srv {{state}}" style="--cpu: {{cpu}}" role="img" aria-label="{{name}} {{stateText}}, CPU {{cpu}}%">
  <span class="role">{{role}}</span>
  <b>{{name}}</b>
  <span class="st"><i></i>{{stateText}}</span>
  <span class="cpu">CPU {{cpu | fixed:0}}%</span>
  <span class="bar"><span></span></span>
</div>`,
  style: `.srv{box-sizing:border-box;height:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto auto 1fr auto;column-gap:8px;padding:7px 10px 8px;
border:1px solid var(--u-widget-border);border-left:4px solid var(--c);border-radius:6px;background:var(--u-widget-surface);
font-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:#8a96a0}
.role{grid-column:1/3;font-size:10px;letter-spacing:.06em;color:var(--u-widget-text-secondary)}
b{font-size:14px;font-weight:600}
.st{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--u-widget-text-secondary);justify-self:end}
i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.cpu{grid-column:1/3;align-self:end;font-size:12px;font-variant-numeric:tabular-nums}
.bar{grid-column:1/3;height:4px;border-radius:2px;background:var(--u-widget-border);overflow:hidden}
.bar span{display:block;height:100%;width:calc(var(--cpu) * 1%);background:var(--c)}
.degraded{--c:var(--u-widget-warning)}
.degraded .st{color:var(--u-widget-text);font-weight:600}
.down{--c:var(--u-widget-negative)}
.down .st{color:var(--u-widget-negative);font-weight:600}
.unknown .st{font-style:italic}`,
  size: { width: 180, height: 84 },
};

/** The zones, each a frame the servers in it sit inside. */
const ZONE_TOP = 168;
const ZONE_HEIGHT = 450;
const ZONES = [
  { id: 'edge', name: '인터넷 경계 (DMZ)', x: 32, width: 456 },
  { id: 'service', name: '서비스 계층', x: 508, width: 464 },
  { id: 'data', name: '데이터 계층', x: 996, width: 252 },
];

const SERVERS = [
  { id: 'fw', x: 290, y: 200 },
  { id: 'lb', x: 290, y: 353 },
  { id: 'web-01', x: 530, y: 236 },
  { id: 'web-02', x: 530, y: 470 },
  { id: 'was-01', x: 768, y: 236 },
  { id: 'was-02', x: 768, y: 470 },
  { id: 'db-primary', x: 1032, y: 236 },
  { id: 'db-replica', x: 1032, y: 392 },
  { id: 'cache', x: 1032, y: 516 },
];

const serverNode = ({ id, x, y }: (typeof SERVERS)[number]): Node => ({
  id,
  x,
  y,
  width: 180,
  height: 84,
  anchored: false,
  widget: {
    type: 'element:server',
    props: { name: id, role: '', state: 'unknown', stateText: '—', cpu: 0 },
    bindings: {
      name: bindItem('/nms/servers', id, 'name'),
      role: bindItem('/nms/servers', id, 'role'),
      state: bindItem('/nms/servers', id, 'state', STATE),
      stateText: bindItem('/nms/servers', id, 'state', STATE_TEXT),
      cpu: bindItem('/nms/servers', id, 'cpu'),
    },
  },
});

/** A link's colour: grey while it carries its traffic, amber when busy, red when down. */
const LINK_COLOUR = { values: { ok: '#8a96a0', busy: 'warning', down: 'negative' }, otherwise: '#8a96a0' };
/** A link's width by how much of its capacity it uses. */
const LINK_WIDTH = { ranges: [{ min: 85, value: 5 }, { min: 60, value: 3.5 }], otherwise: 2 };

const link = (id: string, from: string, to: string, label = '{{value | fixed:0}} Mbps', field = 'mbps', labelAt?: number, route: 'orthogonal' | 'straight' = 'orthogonal'): Connector => ({
  id,
  fromNodeId: from,
  toNodeId: to,
  label,
  ...(labelAt !== undefined && { labelAt }),
  style: { stroke: '#8a96a0', strokeWidth: 2, route },
  bindings: {
    label: bindItem('/nms/links', id, field),
    'style.stroke': bindItem('/nms/links', id, 'state', LINK_COLOUR),
    'style.strokeWidth': bindItem('/nms/links', id, 'utilization', LINK_WIDTH),
  },
});

const CONNECTORS: Connector[] = [
  link('isp-fw', 'isp', 'fw'),
  link('fw-lb', 'fw', 'lb'),
  link('lb-web-01', 'lb', 'web-01'),
  link('lb-web-02', 'lb', 'web-02'),
  link('web-01-was-01', 'web-01', 'was-01'),
  link('web-02-was-02', 'web-02', 'was-02'),
  link('was-01-db', 'was-01', 'db-primary'),
  // Across the rows, straight — a turn would run along the replica's line.
  link('was-02-db', 'was-02', 'db-primary', undefined, undefined, 0.35, 'straight'),
  link('was-02-cache', 'was-02', 'cache'),
  // The replica's line carries the replication, so its label is how far behind the primary it runs.
  link('db-repl', 'db-primary', 'db-replica', '복제 지연 {{value | fixed:1}}초', 'lagSeconds'),
];

const figure = (id: string, i: number, widget: Node['widget']): Node => ({ id, x: 32 + i * 246, y: 76, width: 220, height: 66, anchored: false, widget });
const metric = (label: string, valuePath: string, unit: string): Node['widget'] => ({
  type: 'metric',
  props: { data: { value: 0, label, unit } },
  bindings: { 'data.value': bindPath('/nms/summary', valuePath) },
});

const NODES: Node[] = [
  figure('service', 0, {
    type: 'status',
    props: { data: { label: '서비스', value: '—', tone: 'idle' } },
    bindings: {
      'data.value': bindPath('/nms/summary', '/state', STATE_TEXT),
      'data.tone': bindPath('/nms/summary', '/state', { values: { up: 'ok', degraded: 'warn', down: 'alarm' }, otherwise: 'idle' }),
    },
  }),
  figure('requests', 1, metric('요청', '/requestsPerSecond', '건/초')),
  figure('latency', 2, metric('응답 시간 p95', '/p95Ms', 'ms')),
  figure('errors', 3, metric('오류율', '/errorRate', '%')),
  figure('alerts', 4, metric('열린 경보', '/openAlerts', '건')),
  {
    id: 'isp',
    x: 52,
    // A line of text, level with the firewall's middle so the link leaves from it.
    y: 230,
    width: 150,
    height: 26,
    anchored: false,
    widget: {
      type: 'status',
      props: { data: { label: '인터넷 회선', value: '—', tone: 'idle' } },
      bindings: {
        'data.value': bindItem('/nms/links', 'isp-fw', 'state', { values: { ok: '정상', busy: '혼잡', down: '중단' }, otherwise: '알 수 없음' }),
        'data.tone': bindItem('/nms/links', 'isp-fw', 'state', { values: { ok: 'idle', busy: 'warn', down: 'alarm' }, otherwise: 'idle' }),
      },
    },
  },
  ...SERVERS.map(serverNode),
  {
    id: 'traffic',
    x: 32,
    y: 640,
    width: 940,
    height: 140,
    anchored: false,
    widget: {
      type: 'chart.line',
      props: {
        title: '인터넷 회선 트래픽 (Mbps, 최근 1시간)',
        data: [],
        mapping: { x: 't', y: 'mbps' },
        options: {
          xFormat: 'time',
          series: [{ label: '트래픽', symbol: 'none', color: '#4a555b' }],
          referenceLines: [{ axis: 'y', value: 1000, label: '회선 용량 1 Gbps', style: 'dashed', color: '#5b666c' }],
        },
      },
      bindings: { data: bindPath('/nms/traffic', '/value') },
    },
  },
  {
    id: 'replica-lag',
    x: 1000,
    y: 640,
    width: 248,
    height: 66,
    anchored: false,
    widget: { type: 'metric', props: { data: { value: 0, label: '복제 지연 (허용 5초)', unit: '초' } }, bindings: { 'data.value': bindItem('/nms/links', 'db-repl', 'lagSeconds') } },
  },
];

const DECORATIONS: Shape[] = [
  { id: 'title', type: 'text', x: 32, y: 18, text: '서비스 운영 토폴로지', fontSize: 24, fill: '#1f2a30' },
  { id: 'note', type: 'text', x: 32, y: 50, text: '영역마다 서버 · 링크 라벨은 트래픽, 굵기는 사용률, 색은 혼잡·중단일 때만 · 예시 데이터', fontSize: 13, fill: '#5b666c' },
  ...ZONES.map(
    (zone): Shape => ({ id: `zone-${zone.id}`, type: 'rect', x: zone.x, y: ZONE_TOP, width: zone.width, height: ZONE_HEIGHT, stroke: '#9aa6ae', strokeWidth: 1.5, dash: 'dashed', label: zone.name, labelSize: 14, labelFill: '#3d4a52' })
  ),
];

const document: CanvasView = {
  kind: 'canvas',
  background: {},
  nodes: NODES,
  connectors: CONNECTORS,
  decorations: DECORATIONS,
  elements: { server },
};

export const itTopology: SamplePack = {
  id: 'it-topology',
  title: { ko: '서비스 운영 토폴로지', en: 'Service operations topology' },
  field: { ko: 'IT 운영', en: 'IT operations' },
  kind: { ko: '없음 — 영역 구성도', en: 'None — zone diagram' },
  domain: 'it',
  styles: ['operations'],
  summary: {
    ko: '인터넷 경계·서비스 계층·데이터 계층의 영역 안에 서버마다 상태와 CPU를, 서버 사이 링크에는 트래픽을 라벨로·사용률을 굵기로, 혼잡하거나 끊긴 링크만 색으로. 복제 링크에는 복제 지연을. 위에는 서비스 지표, 아래에는 인터넷 회선 트래픽. 예시 데이터입니다.',
    en: 'Each server’s state and CPU inside its zone — the internet edge, the service tier, the data tier — and on the links between them the traffic as a label and the load as the width, with colour only for a busy or broken link; the replica’s link shows its replication lag. The service’s figures above, the internet line’s traffic below. Example data.',
  },
  connectors: [NMS],
  document,
  snapshot,
};
