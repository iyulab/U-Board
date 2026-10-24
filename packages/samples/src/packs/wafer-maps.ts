// A fab's probe results for two lots, laid out as a figure in a paper is: every wafer the same small map, side by side
// in the order the lot ran — each die a cell coloured by the bin the tester put it in, good dice a quiet grey and each
// failing bin a colour of its own from a palette colour-blind readers can tell apart — with the wafer's yield and the
// pattern its failures make under it. Beside the figure the bins' legend, the lots' yields and what the engineer
// noted; under it the failures by bin and the yield of the last twelve lots. Scientific: white, hairlines, small type,
// one figure caption. The wafer map is a component, drawn once and placed for each wafer. No public source carries a
// fab's probe results, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/wafer-maps.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#0072B2"
  },
  "presets": {
    "wafer": {
      "as": "group",
      "size": [
        156,
        190
      ],
      "parts": {
        "map": {
          "as": "element",
          "element": "wafer",
          "bind": {
            "yield": "yield",
            "pattern": "pattern",
            "flag": "flag",
            "dice": "dice",
            "name": "id"
          }
        }
      },
      "place": {
        "map": [
          0,
          0,
          156,
          190
        ]
      }
    }
  },
  "elements": {
    "caption": {
      "template": "<header class=\"cp\"><h1>{{title}}</h1><p>{{text}}</p><span>{{stamp}}</span></header>",
      "style": ".cp{height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr auto;align-content:end;column-gap:24px;row-gap:4px;border-bottom:1px solid #111111;padding-bottom:10px;font-family:var(--u-widget-font-family);color:#111111}\nh1{margin:0;font-size:24px;font-weight:600;letter-spacing:-.01em}\np{margin:0;grid-column:1;font-size:14px;color:#666666;line-height:1.45}\nspan{grid-row:1 / 3;grid-column:2;align-self:end;font:12px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#666666}",
      "props": {
        "title": "string",
        "text": "string",
        "stamp": "string"
      }
    },
    "row-label": {
      "template": "<p class=\"rl\"><b>{{text}}</b> {{sub}}</p>",
      "style": ".rl{margin:0;height:100%;display:flex;align-items:end;gap:8px;font-family:var(--u-widget-font-family);font-size:13px;color:#666666}\nb{font:600 13px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#111111}",
      "props": {
        "text": "string",
        "sub": "string"
      }
    },
    "legend": {
      "template": "<dl class=\"lg\"><div><dt class=\"b1\"></dt><dd>빈 1 — 양품</dd></div><div><dt class=\"b3\"></dt><dd>빈 3 — 누설 전류 초과</dd></div><div><dt class=\"b4\"></dt><dd>빈 4 — 문턱 전압 이탈</dd></div><div><dt class=\"b5\"></dt><dd>빈 5 — 기능 불량(연속 불량)</dd></div><div><dt class=\"b6\"></dt><dd>빈 6 — 접촉 불량(재검사 대상)</dd></div></dl>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:start;gap:6px;font-family:var(--u-widget-font-family);font-size:13px;color:#111111}\n.lg div{display:flex;align-items:center;gap:10px}\ndt{width:14px;height:14px;flex:none}\ndd{margin:0}\n.b1{background:#dcdcdc}\n.b3{background:#E69F00}\n.b4{background:#D55E00}\n.b5{background:#0072B2}\n.b6{background:#CC79A7}"
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{height:100%;box-sizing:border-box;margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;font-family:var(--u-widget-font-family);color:#111111}\n.fg div{border-top:1px solid #111111;padding-top:8px;display:grid;align-content:start;gap:2px}\ndt{font-size:12px;color:#666666}\ndd{margin:0;font:600 28px ui-monospace, \"Cascadia Mono\", Consolas, monospace;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;color:#666666;line-height:1.35}",
      "props": {
        "items": "list"
      }
    },
    "notes": {
      "template": "<section class=\"nt\"><h2>{{title}}</h2><ol>{{#items}}<li>{{text}}</li>{{/items}}</ol></section>",
      "style": ".nt{height:100%;box-sizing:border-box;font-family:var(--u-widget-font-family);color:#111111;border-top:1px solid #111111;padding-top:8px}\nh2{margin:0 0 6px;font-size:13px;font-weight:600}\nol{margin:0;padding-left:18px;display:grid;gap:6px;font-size:13px;line-height:1.5;word-break:keep-all}",
      "props": {
        "title": "string",
        "items": "list"
      }
    },
    "wafer": {
      "template": "<figure class=\"wf {{flag}}\"><div class=\"disc\"><div class=\"grid\">{{#dice}}<i class=\"b{{b}}\"></i>{{/dice}}</div><span class=\"notch\"></span></div><figcaption><b>{{name}}</b><span>{{yield | fixed:1}}%</span><em>{{pattern}}</em></figcaption></figure>",
      "style": ".wf{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:6px;font-family:var(--u-widget-font-family);color:#111111}\n.disc{position:relative;justify-self:center;aspect-ratio:1;height:100%;max-width:100%;box-sizing:border-box;border:1px solid #111111;border-radius:50%;display:grid;place-items:center;background:#fff}\n.grid{width:86%;aspect-ratio:1;display:grid;grid-template-columns:repeat(15,1fr);gap:1px}\n.notch{position:absolute;bottom:-1px;left:calc(50% - 6px);width:12px;height:5px;background:#fff;border:1px solid #111111;border-bottom:0;border-radius:6px 6px 0 0}\ni{display:block;aspect-ratio:1}\n.b1{background:#dcdcdc}\n.b3{background:#E69F00}\n.b4{background:#D55E00}\n.b5{background:#0072B2}\n.b6{background:#CC79A7}\nfigcaption{display:grid;grid-template-columns:1fr auto;column-gap:6px;font-size:12px;line-height:1.35;white-space:nowrap}\nfigcaption b{font:600 11px ui-monospace, \"Cascadia Mono\", Consolas, monospace;overflow:hidden;text-overflow:ellipsis}\nfigcaption span{font:11px ui-monospace, \"Cascadia Mono\", Consolas, monospace;font-variant-numeric:tabular-nums}\nfigcaption em{grid-column:1 / -1;font-style:normal;color:#666666}\n.flagged figcaption em{color:#D55E00;font-weight:600}",
      "props": {
        "name": "string",
        "yield": "number",
        "pattern": "string",
        "flag": "string",
        "dice": "list"
      }
    }
  },
  "data": {
    "figure": {
      "from": "fab",
      "path": "/fab/figure",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "title": {},
        "text": {},
        "stamp": {}
      }
    },
    "figures": {
      "from": "fab",
      "path": "/fab/figures",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "notes": {
      "from": "fab",
      "path": "/fab/notes",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "bins": {
      "from": "fab",
      "path": "/fab/bins",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt"
    },
    "trend": {
      "from": "fab",
      "path": "/fab/trend",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt"
    },
    "method": {
      "from": "fab",
      "path": "/fab/method",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "wafers": {
      "from": "fab",
      "path": "/fab/wafers",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "yield": {},
        "pattern": {},
        "flag": {},
        "dice": {},
        "id": {}
      }
    }
  },
  "parts": {
    "caption": {
      "as": "element",
      "element": "caption",
      "of": "figure",
      "bind": {
        "title": "title",
        "text": "text",
        "stamp": "stamp"
      }
    },
    "lot-A2381": {
      "as": "element",
      "element": "row-label",
      "props": {
        "text": "A2381",
        "sub": "· 10/19 투입 · 식각 챔버 A·B"
      }
    },
    "lot-B2390": {
      "as": "element",
      "element": "row-label",
      "props": {
        "text": "B2390",
        "sub": "· 10/20 투입 · 식각 챔버 C(01·02·04·05)"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "notes": {
      "as": "element",
      "element": "notes",
      "of": "notes",
      "props": {
        "title": "판독"
      },
      "bind": {
        "items": "value"
      }
    },
    "pareto": {
      "as": "chart.bar",
      "of": "bins",
      "title": "불량 다이 — 빈별(두 로트, 12장)",
      "x": "bin",
      "y": [
        "lotA",
        "lotB"
      ],
      "stack": true,
      "series": [
        {
          "label": "A2381",
          "color": "#9e9e9e"
        },
        {
          "label": "B2390",
          "color": "#D55E00"
        }
      ]
    },
    "trend": {
      "as": "chart.line",
      "of": "trend",
      "title": "로트 수율(%) — 최근 12로트",
      "x": "lot",
      "y": [
        "yield",
        "target"
      ],
      "valueAxisZero": false,
      "series": [
        {
          "label": "수율",
          "color": "#111111"
        },
        {
          "label": "목표 92%",
          "color": "#666666",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ]
    },
    "method": {
      "as": "element",
      "element": "notes",
      "of": "method",
      "props": {
        "title": "방법"
      },
      "bind": {
        "items": "value"
      }
    },
    "A2381-01": {
      "use": "wafer",
      "of": "wafers[A2381-01]"
    },
    "A2381-02": {
      "use": "wafer",
      "of": "wafers[A2381-02]"
    },
    "A2381-03": {
      "use": "wafer",
      "of": "wafers[A2381-03]"
    },
    "A2381-04": {
      "use": "wafer",
      "of": "wafers[A2381-04]"
    },
    "A2381-05": {
      "use": "wafer",
      "of": "wafers[A2381-05]"
    },
    "A2381-06": {
      "use": "wafer",
      "of": "wafers[A2381-06]"
    },
    "B2390-01": {
      "use": "wafer",
      "of": "wafers[B2390-01]"
    },
    "B2390-02": {
      "use": "wafer",
      "of": "wafers[B2390-02]"
    },
    "B2390-03": {
      "use": "wafer",
      "of": "wafers[B2390-03]"
    },
    "B2390-04": {
      "use": "wafer",
      "of": "wafers[B2390-04]"
    },
    "B2390-05": {
      "use": "wafer",
      "of": "wafers[B2390-05]"
    },
    "B2390-06": {
      "use": "wafer",
      "of": "wafers[B2390-06]"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1560,
      880
    ],
    "place": {
      "caption": [
        40,
        20,
        1520,
        84
      ],
      "lot-A2381": [
        40,
        120,
        980,
        22
      ],
      "lot-B2390": [
        40,
        350,
        980,
        22
      ],
      "legend": [
        1080,
        120,
        480,
        130
      ],
      "figures": [
        1080,
        262,
        480,
        120
      ],
      "notes": [
        1080,
        400,
        480,
        200
      ],
      "pareto": [
        34,
        620,
        500,
        260
      ],
      "trend": [
        560,
        620,
        500,
        260
      ],
      "method": [
        1080,
        640,
        480,
        230
      ],
      "A2381-01": [
        40,
        150,
        156,
        190
      ],
      "A2381-02": [
        206,
        150,
        156,
        190
      ],
      "A2381-03": [
        372,
        150,
        156,
        190
      ],
      "A2381-04": [
        538,
        150,
        156,
        190
      ],
      "A2381-05": [
        704,
        150,
        156,
        190
      ],
      "A2381-06": [
        870,
        150,
        156,
        190
      ],
      "B2390-01": [
        40,
        380,
        156,
        190
      ],
      "B2390-02": [
        206,
        380,
        156,
        190
      ],
      "B2390-03": [
        372,
        380,
        156,
        190
      ],
      "B2390-04": [
        538,
        380,
        156,
        190
      ],
      "B2390-05": [
        704,
        380,
        156,
        190
      ],
      "B2390-06": [
        870,
        380,
        156,
        190
      ]
    }
  }
};

export const waferMaps: SamplePack = {
  id: "wafer-maps",
  title: {
    "ko": "웨이퍼 빈 맵 — 논문 그림처럼",
    "en": "Wafer bin maps — set as a paper’s figure"
  },
  field: {
    "ko": "반도체 제조",
    "en": "Semiconductor manufacturing"
  },
  kind: {
    "ko": "없음 — 작은 여러 개(같은 컴포넌트)",
    "en": "None — small multiples of one component"
  },
  domain: "manufacturing",
  styles: [
    "print"
  ],
  summary: {
    "ko": "두 로트의 웨이퍼 검사 결과를 논문 그림처럼 — 웨이퍼마다 같은 작은 지도를 로트가 흐른 순서대로 나란히, 다이마다 검사기가 매긴 빈의 색(양품은 옅은 회색, 불량 빈은 색각 이상도 가려 보는 팔레트), 아래에 수율과 불량이 그리는 무늬. 옆에 빈 범례·로트 수율·판독 메모, 아래에 빈별 불량과 최근 12로트 수율. 흰 바탕, 가는 선, 작은 글자. 웨이퍼 지도는 한 번 그린 컴포넌트를 웨이퍼마다 놓은 것입니다. 예시 데이터입니다.",
    "en": "Two lots’ probe results set as a paper’s figure — every wafer the same small map, side by side in the order the lot ran, each die the colour of its bin (good dice a light grey, failing bins a palette colour-blind readers can tell apart), with its yield and the pattern its failures make. Beside it the bins’ legend, the lots’ yields and the engineer’s notes; under it the failures by bin and the last twelve lots’ yield. White, hairlines, small type. The wafer map is one component placed for each wafer. Example data."
  },
  connectors: [
    {
      "key": "fab",
      "name": "예시 웨이퍼 검사 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 팹이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
