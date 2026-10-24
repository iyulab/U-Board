// An online shop's live sales room, the kind put on a big screen on a sale day: bright, in the brand's colour, the
// day's revenue against its target on a ring, the four figures that move it with how they compare with yesterday,
// where shoppers drop out on the way to an order, what sells by category and by channel, today's hours against
// yesterday's, when in the week orders come, and the orders arriving now. A grid only — the opposite of a control
// room's plan — laid out in order, every widget a different way of showing a number. No public source carries a
// shop's sales, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/commerce-live.js';

const board: Board = {
  "board": {
    "accent": "#7c3aed"
  },
  "elements": {
    "hero": {
      "template": "<section class=\"hero\" style=\"--p: {{progress}}\">\n  <header><span class=\"dot\"></span>LIVE · 오늘 매출</header>\n  <div class=\"ring\" role=\"img\" aria-label=\"목표의 {{progress}}%\">\n    <div class=\"inner\"><b>{{revenue | fixed:1}}</b><span>백만 원</span></div>\n  </div>\n  <footer><span>목표 {{target | grouped:0}}백만</span><b>{{progress}}%</b></footer>\n</section>",
      "style": ".hero{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:10px;padding:18px;border-radius:16px;color:#fff;background:linear-gradient(135deg,var(--u-widget-primary),color-mix(in srgb,var(--u-widget-primary) 55%,#f43f5e));box-shadow:0 12px 32px color-mix(in srgb,var(--u-widget-primary) 35%,transparent);font-family:var(--u-widget-font-family)}\nheader{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.04em;opacity:.92}\n.dot{width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgb(255 255 255 / 25%)}\n.ring{place-self:center;width:min(100%,190px);aspect-ratio:1;border-radius:50%;background:conic-gradient(#fff calc(var(--p) * 1%),rgb(255 255 255 / 22%) 0);display:grid;place-items:center}\n.inner{width:78%;aspect-ratio:1;border-radius:50%;display:grid;place-content:center;text-align:center;background:color-mix(in srgb,var(--u-widget-primary) 82%,#1e1b4b)}\n.inner b{font-size:34px;line-height:1;font-variant-numeric:tabular-nums}\n.inner span{font-size:12px;opacity:.8}\nfooter{display:flex;justify-content:space-between;font-size:13px;opacity:.95}\nfooter b{font-size:15px}",
      "props": {
        "revenue": "number",
        "target": "number",
        "progress": "number"
      }
    },
    "pulse": {
      "template": "<div class=\"pulse {{direction}}\">\n  <span class=\"label\">{{label}}</span>\n  <b class=\"value\">{{prefix}}{{#decimal}}{{value | grouped:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>\n  <span class=\"delta\"><i></i>{{delta | fixed:1}}% <em>어제 같은 시각 대비</em></span>\n</div>",
      "style": ".pulse{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 16px;border-radius:14px;background:var(--u-widget-bg);border:1px solid var(--u-widget-border);border-left:4px solid var(--u-widget-primary);font-family:var(--u-widget-font-family)}\n.label{font-size:13px;color:var(--u-widget-text-secondary)}\n.value{font-size:30px;line-height:1.15;color:var(--u-widget-text);font-variant-numeric:tabular-nums}\n.value small{font-size:14px;margin-left:3px;color:var(--u-widget-text-secondary)}\n.delta{display:inline-flex;align-items:center;gap:4px;width:max-content;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}\n.delta em{font-style:normal;font-weight:400;color:var(--u-widget-text-secondary)}\n.delta i{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent}\n.up .delta{color:#15803d;background:#dcfce7}\n.up .delta i{border-bottom:6px solid currentColor}\n.down .delta{color:#b91c1c;background:#fee2e2}\n.down .delta i{border-top:6px solid currentColor}",
      "props": {
        "label": "string",
        "value": "number",
        "unit": "string",
        "prefix": "string",
        "decimal": "boolean",
        "delta": "number",
        "direction": "string"
      }
    }
  },
  "data": {
    "today": {
      "from": "shop",
      "path": "/sales/today",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "revenue": {},
        "target": {},
        "progress": {},
        "orders": {},
        "ordersDelta": {},
        "ordersDelta-2": {
          "names": [
            "down",
            0,
            "up"
          ],
          "at": "/ordersDelta"
        },
        "aov": {},
        "aovDelta": {},
        "aovDelta-2": {
          "names": [
            "down",
            0,
            "up"
          ],
          "at": "/aovDelta"
        },
        "conversion": {},
        "conversionDelta": {},
        "conversionDelta-2": {
          "names": [
            "down",
            0,
            "up"
          ],
          "at": "/conversionDelta"
        },
        "visitors": {},
        "visitorsDelta": {},
        "visitorsDelta-2": {
          "names": [
            "down",
            0,
            "up"
          ],
          "at": "/visitorsDelta"
        }
      }
    },
    "funnel": {
      "from": "shop",
      "path": "/sales/funnel",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "categories": {
      "from": "shop",
      "path": "/sales/categories",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "channels": {
      "from": "shop",
      "path": "/sales/channels",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "hourly": {
      "from": "shop",
      "path": "/sales/hourly",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "heat": {
      "from": "shop",
      "path": "/sales/heat",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "orders": {
      "from": "shop",
      "path": "/sales/orders",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "item": {},
        "who": {},
        "amount": {},
        "badge": {}
      }
    }
  },
  "parts": {
    "hero": {
      "as": "element",
      "element": "hero",
      "of": "today",
      "bind": {
        "revenue": "revenue",
        "target": "target",
        "progress": "progress"
      }
    },
    "orders": {
      "as": "element",
      "element": "pulse",
      "of": "today",
      "props": {
        "label": "주문",
        "unit": "건"
      },
      "bind": {
        "value": "orders",
        "delta": "ordersDelta",
        "direction": "ordersDelta-2"
      }
    },
    "aov": {
      "as": "element",
      "element": "pulse",
      "of": "today",
      "props": {
        "label": "객단가",
        "unit": "",
        "prefix": "₩"
      },
      "bind": {
        "value": "aov",
        "delta": "aovDelta",
        "direction": "aovDelta-2"
      }
    },
    "conversion": {
      "as": "element",
      "element": "pulse",
      "of": "today",
      "props": {
        "label": "구매 전환율",
        "unit": "%",
        "decimal": true
      },
      "bind": {
        "value": "conversion",
        "delta": "conversionDelta",
        "direction": "conversionDelta-2"
      }
    },
    "visitors": {
      "as": "element",
      "element": "pulse",
      "of": "today",
      "props": {
        "label": "방문자",
        "unit": "명"
      },
      "bind": {
        "value": "visitors",
        "delta": "visitorsDelta",
        "direction": "visitorsDelta-2"
      }
    },
    "funnel": {
      "as": "chart.funnel",
      "of": "funnel",
      "title": "구매 깔때기",
      "label": "stage",
      "value": "count",
      "legend": false
    },
    "categories": {
      "as": "chart.treemap",
      "of": "categories",
      "title": "카테고리별 매출(백만 원)"
    },
    "channels": {
      "as": "chart.pie",
      "of": "channels",
      "title": "채널",
      "label": "channel",
      "value": "revenue",
      "donut": true,
      "showLabel": true,
      "legend": true
    },
    "hourly": {
      "as": "chart.line",
      "of": "hourly",
      "title": "시간대별 주문 — 오늘과 어제",
      "x": "hour",
      "y": [
        "today",
        "yesterday"
      ],
      "smooth": true,
      "series": [
        {
          "label": "오늘"
        },
        {
          "label": "어제",
          "lineStyle": "dashed",
          "symbol": "none",
          "color": "#94a3b8"
        }
      ]
    },
    "heat": {
      "as": "chart.heatmap",
      "of": "heat",
      "title": "요일 × 시간대 주문 (지난 4주 평균)",
      "x": "slot",
      "y": "day",
      "value": "orders",
      "colorRange": [
        "#f5f3ff",
        "#6d28d9"
      ]
    },
    "live-orders": {
      "as": "list",
      "of": "orders",
      "show": "item",
      "secondary": "who",
      "trailing": "amount",
      "badge": "badge",
      "title": "방금 들어온 주문"
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "hero",
        4
      ],
      {
        "grid": [
          [
            "orders",
            6
          ],
          [
            "aov",
            6
          ],
          [
            "conversion",
            6
          ],
          [
            "visitors",
            6
          ]
        ],
        "span": 8
      },
      [
        "funnel",
        4
      ],
      [
        "categories",
        5
      ],
      [
        "channels",
        3
      ],
      {
        "grid": [
          [
            "hourly",
            12
          ],
          [
            "heat",
            12
          ]
        ],
        "span": 8
      },
      [
        "live-orders",
        4
      ]
    ]
  }
};

export const commerceLive: SamplePack = {
  id: "commerce-live",
  title: {
    "ko": "쇼핑몰 라이브 매출 워룸",
    "en": "Online shop live sales room"
  },
  field: {
    "ko": "유통·이커머스",
    "en": "Retail & e-commerce"
  },
  kind: {
    "ko": "없음 — 그리드(브랜드 컬러)",
    "en": "None — grid (brand colour)"
  },
  domain: "logistics",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "세일 날 큰 화면에 띄우는 밝은 워룸 — 목표 대비 오늘 매출 링, 어제와 견준 주문·객단가·전환율·방문자, 구매 깔때기, 카테고리 트리맵, 채널 도넛, 오늘과 어제의 시간대 곡선, 요일×시간 히트맵, 방금 들어온 주문. 예시 데이터입니다.",
    "en": "A bright war room for the big screen on a sale day — today’s revenue on a ring against its target; orders, basket size, conversion and visitors against yesterday; the purchase funnel; categories as a treemap; channels as a donut; today’s hours over yesterday’s; a weekday × hour heatmap; the orders arriving now. Example data."
  },
  connectors: [
    {
      "key": "shop",
      "name": "예시 쇼핑몰 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 쇼핑몰이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
