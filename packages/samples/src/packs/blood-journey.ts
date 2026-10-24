// A day of the blood supply told as an infographic, the kind printed on a poster or put on a lobby screen: a
// headline and the stock in days with the national level it sets, then the five steps a donation goes through —
// given, tested, separated, stored, supplied — each a large number, an arrow to the next — and below them the stock
// by blood type against the five days the supply aims for, who gave today, and the last thirty days of stock. A
// canvas with no plan behind it: the story's order is its layout. No public source carries a supply's day this way,
// so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/blood-journey.js';

const board: Board = {
  "board": {
    "accent": "#b91c1c"
  },
  "symbols": {
    "drop": { "viewBox": "0 0 24 32", "path": "M12 1 C12 1 2 14 2 21 a10 10 0 0 0 20 0 C22 14 12 1 12 1 Z" },
    "person": { "viewBox": "0 0 24 32", "path": "M6 7 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z M1 32 v-8 a11 11 0 0 1 22 0 v8 Z" }
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\">\n  <span class=\"kicker\">오늘의 혈액 수급 · {{asOf}} 기준</span>\n  <h1>혈액 한 팩이 환자에게 닿기까지</h1>\n  <p><b>{{donors | grouped:0}}</b>명이 오늘 팔을 걷었습니다</p>\n</header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;color:#1c1917;font-family:var(--u-widget-font-family)}\n.kicker{font-size:13px;font-weight:700;letter-spacing:.08em;color:#b91c1c}\nh1{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.1;font-weight:700;letter-spacing:-.01em}\np{margin:0;font-size:17px;color:#57534e}\np b{font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#b91c1c;font-variant-numeric:tabular-nums;margin-right:2px}",
      "props": {
        "donors": "number",
        "asOf": "string"
      }
    },
    "stock": {
      "template": "<section class=\"stock {{level}}\" style=\"--d: {{days}}\">\n  <span class=\"label\">혈액 보유량</span>\n  <div class=\"row\"><b>{{days | fixed:1}}</b><span>일분</span><em>{{levelText}}</em></div>\n  <div class=\"scale\" role=\"img\" aria-label=\"보유 {{days}}일분, {{levelText}} 단계\">\n    <i class=\"s1\">심각</i><i class=\"s2\">경계</i><i class=\"s3\">주의</i><i class=\"s4\">관심</i><i class=\"s5\">적정</i>\n    <span class=\"mark\"></span>\n  </div>\n  <small>적정 보유량은 5일분 이상입니다</small>\n</section>",
      "style": ".stock{--c:#15803d;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;padding:16px 20px;border-radius:14px;background:#fff;border:1px solid #e7e5e4;color:#1c1917;font-family:var(--u-widget-font-family)}\n.watch{--c:#ca8a04}.caution{--c:#ea580c}.alert{--c:#dc2626}.critical{--c:#7f1d1d}\n.label{font-size:13px;font-weight:700;color:#78716c}\n.row{display:flex;align-items:baseline;gap:6px}\n.row b{font-family:Georgia,'Times New Roman',serif;font-size:44px;line-height:1;font-variant-numeric:tabular-nums}\n.row span{font-size:15px;color:#57534e}\n.row em{margin-left:auto;font-style:normal;font-size:14px;font-weight:700;color:#fff;background:var(--c);padding:3px 12px;border-radius:999px}\n.scale{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr 2fr 2fr;gap:2px;padding-top:12px}\n.scale i{font-style:normal;font-size:11px;text-align:center;padding:3px 0;color:#fff}\n.s1{background:#7f1d1d}.s2{background:#dc2626}.s3{background:#ea580c}.s4{background:#ca8a04}.s5{background:#15803d}\n.mark{position:absolute;top:0;left:calc(min(var(--d),7) / 7 * 100%);width:0;height:0;transform:translateX(-6px);border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #1c1917}\nsmall{font-size:12px;color:#78716c}",
      "props": {
        "days": "number",
        "level": "string",
        "levelText": "string"
      }
    },
    "step": {
      "template": "<article class=\"step\">\n  <span class=\"no\">{{no}}</span>\n  <h2>{{title}}</h2>\n  <p class=\"figure\"><b>{{value | grouped:0}}</b><span>{{unit}}</span></p>\n  <p class=\"caption\">{{caption}}</p>\n</article>",
      "style": ".step{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto auto 1fr;gap:4px;padding:16px 18px;border-radius:14px;background:#fff;border:1px solid #e7e5e4;border-top:4px solid #b91c1c;color:#1c1917;font-family:var(--u-widget-font-family)}\n.no{font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;color:#b91c1c}\nh2{margin:0;font-size:18px}\n.figure{margin:6px 0 0;display:flex;align-items:baseline;gap:4px;white-space:nowrap}\n.figure b{font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1;font-variant-numeric:tabular-nums}\n.figure span{font-size:14px;color:#57534e}\n.caption{margin:4px 0 0;font-size:13px;line-height:1.45;color:#57534e}",
      "props": {
        "no": "string",
        "title": "string",
        "value": "number",
        "unit": "string",
        "caption": "string"
      }
    },
    "fact": {
      "template": "<aside class=\"fact\">\n  <svg class=\"drop\" viewBox=\"0 0 24 32\" aria-hidden=\"true\"><use href=\"#drop\"/></svg>\n  <span class=\"eq\">=</span>\n  <div class=\"people\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 32\"><use href=\"#person\"/></svg><svg viewBox=\"0 0 24 32\"><use href=\"#person\"/></svg><svg viewBox=\"0 0 24 32\"><use href=\"#person\"/></svg></div>\n  <p>한 번의 헌혈은 적혈구·혈장·혈소판으로 나뉘어 <b>최대 세 명</b>의 환자에게 갑니다</p>\n</aside>",
      "style": ".fact{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto auto 1fr;align-items:center;column-gap:10px;padding:16px 18px;border-radius:14px;background:#b91c1c;color:#fff;font-family:var(--u-widget-font-family)}\n.drop{width:34px;height:46px;fill:#fff}\n.eq{font-family:Georgia,'Times New Roman',serif;font-size:30px;opacity:.85}\n.people{display:flex;gap:4px}\n.people svg{width:26px;height:36px;fill:#fecaca}\np{grid-column:1/-1;margin:10px 0 0;font-size:14px;line-height:1.5}\np b{font-weight:800}"
    }
  },
  "data": {
    "today": {
      "from": "blood",
      "path": "/blood/today",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "donors": {},
        "asOf": {},
        "stockDays": {},
        "stockDays-2": {
          "names": [
            "critical",
            1,
            "alert",
            2,
            "caution",
            3,
            "watch",
            5,
            "enough"
          ],
          "at": "/stockDays"
        },
        "stockDays-3": {
          "names": [
            "심각",
            1,
            "경계",
            2,
            "주의",
            3,
            "관심",
            5,
            "적정"
          ],
          "at": "/stockDays"
        },
        "donated": {},
        "passed": {},
        "units": {},
        "stockUnits": {},
        "supplied": {}
      }
    },
    "types": {
      "from": "blood",
      "path": "/blood/types",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "ages": {
      "from": "blood",
      "path": "/blood/ages",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "trend": {
      "from": "blood",
      "path": "/blood/trend",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "today",
      "bind": {
        "donors": "donors",
        "asOf": "asOf"
      }
    },
    "stock": {
      "as": "element",
      "element": "stock",
      "of": "today",
      "bind": {
        "days": "stockDays",
        "level": "stockDays-2",
        "levelText": "stockDays-3"
      }
    },
    "donate": {
      "as": "element",
      "element": "step",
      "of": "today",
      "props": {
        "no": "01",
        "title": "헌혈",
        "unit": "건",
        "caption": "헌혈의 집과 헌혈버스에서 오늘 받은 전혈·성분헌혈."
      },
      "bind": {
        "value": "donated"
      }
    },
    "test": {
      "as": "element",
      "element": "step",
      "of": "today",
      "props": {
        "no": "02",
        "title": "검사",
        "unit": "건 적격",
        "caption": "혈액형과 감염 표지자를 검사해 적격 혈액만 넘깁니다."
      },
      "bind": {
        "value": "passed"
      }
    },
    "separate": {
      "as": "element",
      "element": "step",
      "of": "today",
      "props": {
        "no": "03",
        "title": "제제",
        "unit": "단위",
        "caption": "적혈구·혈장·혈소판으로 나눠, 한 건이 두세 단위가 됩니다."
      },
      "bind": {
        "value": "units"
      }
    },
    "store": {
      "as": "element",
      "element": "step",
      "of": "today",
      "props": {
        "no": "04",
        "title": "보관",
        "unit": "단위",
        "caption": "혈액원에 있는 양. 적혈구는 35일, 혈소판은 5일까지."
      },
      "bind": {
        "value": "stockUnits"
      }
    },
    "supply": {
      "as": "element",
      "element": "step",
      "of": "today",
      "props": {
        "no": "05",
        "title": "공급",
        "unit": "단위",
        "caption": "오늘 병원으로 나간 양 — 응급·수술·항암 치료에."
      },
      "bind": {
        "value": "supplied"
      }
    },
    "by-type": {
      "as": "chart.bar",
      "of": "types",
      "title": "혈액형별 보유량 (일분)",
      "x": "type",
      "y": "days",
      "horizontal": true,
      "referenceLines": [
        {
          "axis": "x",
          "value": 5,
          "label": "적정 5일",
          "style": "dashed"
        }
      ],
      "series": [
        {
          "label": "보유량",
          "color": "#b91c1c"
        }
      ]
    },
    "donors": {
      "as": "chart.pie",
      "of": "ages",
      "title": "오늘 헌혈자 연령대",
      "label": "age",
      "value": "share",
      "donut": true,
      "showLabel": false,
      "legend": true
    },
    "fact": {
      "as": "element",
      "element": "fact"
    },
    "trend": {
      "as": "chart.area",
      "of": "trend",
      "title": "지난 30일 보유량 (일분)",
      "x": "date",
      "y": "days",
      "smooth": true,
      "valueAxisZero": false,
      "referenceLines": [
        {
          "axis": "y",
          "value": 5,
          "style": "dashed"
        }
      ],
      "series": [
        {
          "label": "보유량",
          "color": "#b91c1c"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1200,
      820
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22820%22%20viewBox%3D%220%200%201200%20820%22%3E%0A%3Crect%20width%3D%221200%22%20height%3D%22820%22%20fill%3D%22%23faf7f2%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20176%20H%201160%22%20stroke%3D%22%23d6d3d1%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%22196%22%20width%3D%221160%22%20height%3D%22224%22%20rx%3D%2220%22%20fill%3D%22%23fee2e2%22%20opacity%3D%22.55%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20424%20H%201160%22%20stroke%3D%22%23d6d3d1%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        40,
        30,
        640,
        130
      ],
      "stock": [
        760,
        24,
        400,
        170
      ],
      "donate": [
        40,
        210,
        184,
        196
      ],
      "test": [
        274,
        210,
        184,
        196
      ],
      "separate": [
        508,
        210,
        184,
        196
      ],
      "store": [
        742,
        210,
        184,
        196
      ],
      "supply": [
        976,
        210,
        184,
        196
      ],
      "by-type": [
        40,
        470,
        440,
        310
      ],
      "donors": [
        510,
        470,
        320,
        310
      ],
      "fact": [
        860,
        470,
        300,
        150
      ],
      "trend": [
        860,
        636,
        300,
        144
      ]
    },
    "shapes": {
      "journey-label": {
        "text": "한 팩의 여정",
        "at": [
          40,
          184
        ],
        "size": 13
      },
      "detail-label": {
        "text": "들여다보기",
        "at": [
          40,
          444
        ],
        "size": 13
      }
    },
    "links": {
      "flow-donate": {
        "from": "donate",
        "to": "test",
        "tone": "alarm",
        "width": 3,
        "arrow": "end"
      },
      "flow-test": {
        "from": "test",
        "to": "separate",
        "tone": "alarm",
        "width": 3,
        "arrow": "end"
      },
      "flow-separate": {
        "from": "separate",
        "to": "store",
        "tone": "alarm",
        "width": 3,
        "arrow": "end"
      },
      "flow-store": {
        "from": "store",
        "to": "supply",
        "tone": "alarm",
        "width": 3,
        "arrow": "end"
      }
    }
  }
};

export const bloodJourney: SamplePack = {
  id: "blood-journey",
  title: {
    "ko": "혈액 한 팩의 여정 — 인포그래픽",
    "en": "The journey of a blood bag — an infographic"
  },
  field: {
    "ko": "공공·보건의료",
    "en": "Public health"
  },
  kind: {
    "ko": "없음 — 인포그래픽(이야기 순서)",
    "en": "None — infographic (the story’s order)"
  },
  domain: "health",
  styles: [
    "print"
  ],
  summary: {
    "ko": "포스터처럼 읽는 하루의 혈액 수급 — 큰 제목과 오늘 헌혈자 수, 보유량 일수와 그것이 정하는 단계, 헌혈·검사·제제·보관·공급 다섯 단계를 화살표로 잇는 큰 숫자, 적정 5일과 견준 혈액형별 보유량, 헌혈자 연령대, 지난 30일 보유량. 예시 데이터입니다.",
    "en": "A day of the blood supply read like a poster — a headline with today’s donors, the stock in days and the level it sets, the five steps from donation to hospital as large numbers the arrows read in order, the stock by blood type against five days, who gave today, and the last thirty days of stock. Example data."
  },
  connectors: [
    {
      "key": "blood",
      "name": "예시 혈액 수급 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 혈액 수급 현황이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
