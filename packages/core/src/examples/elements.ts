import type { GridView } from '../view-document';

/**
 * Elements drawn by templates alone — no script: what a board draws when no prepared widget does. Each is defined
 * once and placed by name; the numbers reach the drawing as CSS custom properties (`style="--level: {{level}}"`) and
 * `calc()` turns them into a height, an angle, a share of a ring.
 */
export const elementsDemo: GridView = {
  kind: 'grid',
  elements: {
    pump: {
      render: 'template',
      props: {
        type: 'object',
        required: ['state'],
        properties: {
          name: { type: 'string', description: 'Shown under the symbol.' },
          state: { enum: ['run', 'stop', 'fault'] },
          rpm: { type: 'number', minimum: 0 },
        },
      },
      template: `<figure class="pump {{state}}">
  <svg viewBox="0 0 64 64" role="img" aria-label="{{name}}: {{state}}">
    <circle class="casing" cx="32" cy="32" r="26"/>
    <g class="impeller"><path d="M32 32 L32 12 A20 20 0 0 1 49 42 Z"/><path d="M32 32 L15 42 A20 20 0 0 1 32 12 Z" opacity=".6"/></g>
    <circle cx="32" cy="32" r="4" class="hub"/>
  </svg>
  <figcaption>{{name}}{{#rpm}} · {{rpm}} rpm{{/rpm}}</figcaption>
</figure>`,
      style: `.pump{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;place-items:center;gap:4px}
svg{height:100%;max-height:120px}
.casing{fill:var(--u-widget-surface);stroke:var(--state);stroke-width:4}
.impeller path,.hub{fill:var(--state)}
.run{--state:var(--u-widget-positive)} .stop{--state:var(--u-widget-text-secondary)} .fault{--state:var(--u-widget-negative)}
.run .impeller{transform-origin:32px 32px;animation:spin 1.2s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
figcaption{font-size:13px;color:var(--u-widget-text-secondary)}`,
      size: { width: 140, height: 160 },
    },
    tank: {
      render: 'template',
      props: {
        type: 'object',
        required: ['level'],
        properties: { name: { type: 'string' }, level: { type: 'number', minimum: 0, maximum: 100, description: 'Percent full.' } },
      },
      template: `<div class="tank" style="--level: {{level}}">
  <div class="fill"></div><span class="value">{{level}}%</span>
</div><p>{{name}}</p>`,
      style: `:host{display:grid;grid-template-rows:1fr auto;gap:4px}
.tank{position:relative;border:2px solid var(--u-widget-border);border-radius:8px;overflow:hidden;background:var(--u-widget-surface)}
.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--u-widget-primary);opacity:.75}
.value{position:absolute;inset:0;display:grid;place-items:center;font:600 20px var(--u-widget-font-family)}
p{margin:0;text-align:center;font-size:13px;color:var(--u-widget-text-secondary)}`,
      size: { width: 140, height: 160 },
    },
    ring: {
      render: 'template',
      props: { type: 'object', required: ['value'], properties: { label: { type: 'string' }, value: { type: 'number', minimum: 0, maximum: 100 } } },
      template: '<div class="ring" style="--v: {{value}}"><b>{{value}}%</b></div><p>{{label}}</p>',
      style: `:host{display:grid;grid-template-rows:1fr auto;place-items:center;gap:4px}
.ring{height:100%;aspect-ratio:1;max-height:120px;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(closest-side,var(--u-widget-bg) 76%,transparent 77%),conic-gradient(var(--u-widget-primary) calc(var(--v) * 1%),var(--u-widget-surface) 0)}
b{font:600 18px var(--u-widget-font-family)}
p{margin:0;font-size:13px;color:var(--u-widget-text-secondary)}`,
      size: { width: 140, height: 160 },
    },
  },
  items: [
    { id: 'p-101', span: 3, widget: { type: 'element:pump', props: { name: 'P-101', state: 'run', rpm: 1450 } } },
    { id: 'p-102', span: 3, widget: { type: 'element:pump', props: { name: 'P-102', state: 'stop' } } },
    { id: 'p-103', span: 3, widget: { type: 'element:pump', props: { name: 'P-103', state: 'fault', rpm: 0 } } },
    { id: 'oee', span: 3, widget: { type: 'element:ring', props: { label: 'OEE', value: 72 } } },
    { id: 't-1', span: 4, widget: { type: 'element:tank', props: { name: 'Raw water', level: 64 } } },
    { id: 't-2', span: 4, widget: { type: 'element:tank', props: { name: 'Clear well', level: 18 } } },
    { id: 'avail', span: 4, widget: { type: 'element:ring', props: { label: 'Availability', value: 91 } } },
  ],
};
