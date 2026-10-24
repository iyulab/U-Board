// A car body's gap and flush, measured where its panels meet: each measuring point is a ring on the body's outline,
// led by a line to a card with what was measured there and how much of the tolerance it uses — quiet below 75 %,
// amber up to the tolerance, red past it, as quality boards colour a part's measurements. The latest body measured,
// how many of its points are out, and every point's share of its tolerance beside it. No public source carries a
// line's measurements, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/body-gap.js';

const board: Board = {
  "elements": {
    "ring": {
      "template": "<span class=\"ring {{band}}\" role=\"img\" aria-label=\"{{name}}\"></span>",
      "style": ":host{display:grid;place-items:center}\n.ring{box-sizing:border-box;width:18px;height:18px;border-radius:50%;border:4px solid var(--c);background:var(--u-widget-surface);--c:var(--u-widget-text-secondary)}\n.watch{--c:var(--u-widget-warning)}\n.out{--c:var(--u-widget-negative);width:22px;height:22px;border-width:5px}",
      "props": {
        "band": "string",
        "name": "string"
      }
    },
    "card": {
      "template": "<div class=\"card {{band}}\">\n  <b>{{name}}</b>\n  <dl><dt>간극</dt><dd>{{gap | fixed:2}} mm</dd><dt>단차</dt><dd>{{flush | fixed:2}} mm</dd></dl>\n  <span class=\"usage\">공차 {{usage}}%</span>\n</div>",
      "style": ".card{box-sizing:border-box;height:100%;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px;border:1px solid var(--u-widget-border);\nborder-left:5px solid var(--c);border-radius:6px;background:var(--u-widget-surface);font-family:var(--u-widget-font-family);color:var(--u-widget-text);\n--c:var(--u-widget-text-secondary)}\nb{font-size:13px;font-weight:600}\ndl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:8px;font-size:12px;align-content:center}\ndt{color:var(--u-widget-text-secondary)}\ndd{margin:0;font-variant-numeric:tabular-nums}\n.usage{font-size:12px;font-weight:600;color:var(--u-widget-text-secondary)}\n.watch{--c:var(--u-widget-warning)}\n.out{--c:var(--u-widget-negative)}\n.watch .usage,.out .usage{color:var(--c)}",
      "props": {
        "name": "string",
        "gap": "number",
        "flush": "number",
        "usage": "number",
        "band": "string"
      }
    }
  },
  "data": {
    "latest": {
      "from": "qms",
      "path": "/body/latest",
      "list": "/points",
      "key": "id",
      "time": "measuredAt",
      "fresh": 1800,
      "fields": {
        "usagePct": {
          "names": [
            "ok",
            75,
            "watch",
            100,
            "out"
          ]
        },
        "gapMm": {},
        "flushMm": {},
        "usagePct-2": {
          "at": "/usagePct"
        }
      },
      "answerTime": "/measuredAt"
    },
    "latest-2": {
      "from": "qms",
      "path": "/body/latest",
      "time": "measuredAt",
      "fresh": 1800,
      "fields": {
        "bodyNo": {
          "label": "마지막 측정 차체"
        },
        "pointsOut": {
          "label": "공차를 넘은 측정점",
          "unit": "곳"
        }
      }
    }
  },
  "parts": {
    "point-P1": {
      "as": "element",
      "element": "ring",
      "of": "latest[P1]",
      "props": {
        "name": "후드 – 펜더"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P1": {
      "as": "element",
      "element": "card",
      "of": "latest[P1]",
      "props": {
        "name": "후드 – 펜더"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "point-P3": {
      "as": "element",
      "element": "ring",
      "of": "latest[P3]",
      "props": {
        "name": "앞문 – 뒷문"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P3": {
      "as": "element",
      "element": "card",
      "of": "latest[P3]",
      "props": {
        "name": "앞문 – 뒷문"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "point-P5": {
      "as": "element",
      "element": "ring",
      "of": "latest[P5]",
      "props": {
        "name": "트렁크 – 쿼터"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P5": {
      "as": "element",
      "element": "card",
      "of": "latest[P5]",
      "props": {
        "name": "트렁크 – 쿼터"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "point-P6": {
      "as": "element",
      "element": "ring",
      "of": "latest[P6]",
      "props": {
        "name": "범퍼 – 펜더"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P6": {
      "as": "element",
      "element": "card",
      "of": "latest[P6]",
      "props": {
        "name": "범퍼 – 펜더"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "point-P2": {
      "as": "element",
      "element": "ring",
      "of": "latest[P2]",
      "props": {
        "name": "앞문 – 펜더"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P2": {
      "as": "element",
      "element": "card",
      "of": "latest[P2]",
      "props": {
        "name": "앞문 – 펜더"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "point-P4": {
      "as": "element",
      "element": "ring",
      "of": "latest[P4]",
      "props": {
        "name": "뒷문 – 쿼터"
      },
      "bind": {
        "band": "usagePct"
      }
    },
    "card-P4": {
      "as": "element",
      "element": "card",
      "of": "latest[P4]",
      "props": {
        "name": "뒷문 – 쿼터"
      },
      "bind": {
        "gap": "gapMm",
        "flush": "flushMm",
        "usage": "usagePct-2",
        "band": "usagePct"
      }
    },
    "body-no": {
      "as": "stat",
      "of": "latest-2",
      "show": "bodyNo"
    },
    "out-of-tolerance": {
      "as": "stat",
      "of": "latest-2",
      "show": "pointsOut"
    },
    "usage-by-point": {
      "as": "chart.bar",
      "of": "latest",
      "title": "측정점별 공차 사용률(%)",
      "x": "name",
      "y": "usagePct",
      "horizontal": true,
      "series": [
        {
          "label": "공차 사용률"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      800
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22800%22%20viewBox%3D%220%200%201280%20800%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22800%22%20fill%3D%22%23f4f6f7%22%2F%3E%0A%3Cpath%20d%3D%22M%2096%20522%20L%2092%20476%20Q%2096%20446%20132%20438%20L%20300%20412%20L%20336%20404%20Q%20380%20330%20432%20300%20L%20640%20294%20Q%20700%20300%20760%20380%20L%20860%20394%20Q%20900%20400%20906%20430%20L%20908%20500%20Q%20904%20522%20880%20524%20L%20806%20524%20A%2058%2058%200%200%200%20690%20524%20L%20336%20524%20A%2058%2058%200%200%200%20220%20524%20Z%22%20fill%3D%22%23e6ebee%22%20stroke%3D%22%237f939e%22%20stroke-width%3D%223%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20360%20400%20Q%20400%20336%20444%20314%20L%20548%20310%20L%20548%20404%20Z%22%20fill%3D%22%23d3dde3%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%20562%20310%20L%20632%20310%20Q%20680%20318%20720%20392%20L%20562%20404%20Z%22%20fill%3D%22%23d3dde3%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%2F%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%239aa9b2%22%20stroke-width%3D%222%22%3E%0A%20%20%3Cpath%20d%3D%22M%20300%20412%20L%20304%20524%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20404%20404%20L%20404%20524%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20556%20404%20L%20556%20524%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20700%20396%20L%20700%20524%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20760%20380%20L%20846%20404%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M%20152%20440%20L%20152%20522%22%2F%3E%0A%3C%2Fg%3E%0A%3Ccircle%20cx%3D%22278%22%20cy%3D%22526%22%20r%3D%2246%22%20fill%3D%22%235f6e76%22%2F%3E%3Ccircle%20cx%3D%22278%22%20cy%3D%22526%22%20r%3D%2220%22%20fill%3D%22%23c3ced4%22%2F%3E%0A%3Ccircle%20cx%3D%22748%22%20cy%3D%22526%22%20r%3D%2246%22%20fill%3D%22%235f6e76%22%2F%3E%3Ccircle%20cx%3D%22748%22%20cy%3D%22526%22%20r%3D%2220%22%20fill%3D%22%23c3ced4%22%2F%3E%0A%3Cpath%20d%3D%22M%2060%20576%20H%20940%22%20stroke%3D%22%23c3ced4%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22964%22%20y%3D%2260%22%20width%3D%22300%22%20height%3D%22720%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Ctext%20x%3D%2240%22%20y%3D%22788%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%B8%A1%EB%A9%B4%20%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%98%88%EC%8B%9C%20%EC%B0%A8%EC%B2%B4%2C%20%EC%8B%A4%EC%A0%9C%20%ED%98%95%EC%83%81%EA%B3%BC%20%EB%8B%A4%EB%A6%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "point-P1": [
        288,
        406,
        24,
        24
      ],
      "card-P1": [
        170,
        130,
        170,
        92
      ],
      "point-P3": [
        544,
        440,
        24,
        24
      ],
      "card-P3": [
        470,
        130,
        170,
        92
      ],
      "point-P5": [
        834,
        392,
        24,
        24
      ],
      "card-P5": [
        770,
        130,
        170,
        92
      ],
      "point-P6": [
        140,
        456,
        24,
        24
      ],
      "card-P6": [
        50,
        640,
        170,
        92
      ],
      "point-P2": [
        392,
        450,
        24,
        24
      ],
      "card-P2": [
        330,
        640,
        170,
        92
      ],
      "point-P4": [
        688,
        440,
        24,
        24
      ],
      "card-P4": [
        640,
        640,
        170,
        92
      ],
      "body-no": [
        980,
        100,
        270,
        76
      ],
      "out-of-tolerance": [
        980,
        190,
        270,
        76
      ],
      "usage-by-point": [
        980,
        290,
        270,
        300
      ]
    },
    "shapes": {
      "title": {
        "text": "차체 간극·단차 품질 맵",
        "at": [
          24,
          22
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "측정점마다 간극과 단차, 공차를 얼마나 쓰는지 · 예시 데이터",
        "at": [
          24,
          56
        ],
        "size": 13,
        "tone": "past"
      },
      "side-title": {
        "text": "이번 차체",
        "at": [
          980,
          72
        ],
        "size": 15,
        "tone": "next"
      },
      "legend": {
        "text": "공차 사용률: 75 % 미만 회색",
        "at": [
          980,
          612
        ],
        "size": 12,
        "tone": "past"
      },
      "legend-2": {
        "text": "75~100 % 주황 · 100 % 초과 빨강",
        "at": [
          980,
          632
        ],
        "size": 12,
        "tone": "past"
      }
    },
    "links": {
      "lead-P1": {
        "from": "point-P1",
        "to": "card-P1",
        "tone": "past",
        "width": 1.5
      },
      "lead-P3": {
        "from": "point-P3",
        "to": "card-P3",
        "tone": "past",
        "width": 1.5
      },
      "lead-P5": {
        "from": "point-P5",
        "to": "card-P5",
        "tone": "past",
        "width": 1.5
      },
      "lead-P6": {
        "from": "point-P6",
        "to": "card-P6",
        "tone": "past",
        "width": 1.5
      },
      "lead-P2": {
        "from": "point-P2",
        "to": "card-P2",
        "tone": "past",
        "width": 1.5
      },
      "lead-P4": {
        "from": "point-P4",
        "to": "card-P4",
        "tone": "past",
        "width": 1.5
      }
    }
  }
};

export const bodyGap: SamplePack = {
  id: "body-gap",
  title: {
    "ko": "차체 간극·단차 품질 맵",
    "en": "Car body gap & flush"
  },
  field: {
    "ko": "제조·품질",
    "en": "Manufacturing & quality"
  },
  kind: {
    "ko": "부품 실루엣",
    "en": "Part silhouette"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "차체 측면 실루엣의 측정점마다 공차 사용률 색의 고리와, 지시선으로 이은 간극·단차 카드. 옆에는 마지막 측정 차체, 공차를 넘은 측정점 수, 측정점별 공차 사용률. 예시 데이터입니다.",
    "en": "Each measuring point on a car body’s side outline as a ring in the colour of its tolerance use, led by a line to a card with its gap and flush; the latest body, how many points are out and each point’s tolerance use beside it. Example data."
  },
  connectors: [
    {
      "key": "qms",
      "name": "예시 품질 측정 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 측정값이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
