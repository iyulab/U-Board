// A home's energy on an e-ink frame by the kitchen door, read in passing on the way out: the electricity used today in
// one very large number against yesterday at this hour, what the roof's panels made, the gas, the month's bill so far,
// the day's use hour by hour, the weather, and one line of advice. The minimal style: grey on paper, no colour, thin
// rules, a great deal of white, the largest number read first — what a screen that redraws a few times an hour shows.
// No public source carries one home's meters this way, so the values are example data written for the frame.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/home-eink.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#5f5e59"
  },
  "elements": {
    "clock": {
      "template": "<header class=\"clk\"><span>{{home}}</span><span>{{date}}</span><time>{{time}}</time></header>",
      "style": ".clk{height:100%;box-sizing:border-box;display:flex;align-items:baseline;gap:28px;font-family:var(--u-widget-font-family);color:#6b6b66;font-size:18px;letter-spacing:.04em}\ntime{margin-left:auto;font-size:30px;font-weight:300;color:#1c1c1a;font-variant-numeric:tabular-nums}",
      "props": {
        "date": "string",
        "time": "string",
        "home": "string"
      }
    },
    "hero": {
      "template": "<section class=\"hero\"><p class=\"lbl\">오늘 쓴 전기</p><p class=\"big\"><b>{{used | fixed:1}}</b><span>kWh</span></p><p class=\"cmp\">어제 이 시간 {{yesterday | fixed:1}} kWh · {{change}}</p></section>",
      "style": ".hero{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:var(--u-widget-font-family);color:#1c1c1a}\np{margin:0}\n.lbl{font-size:20px;color:#6b6b66;letter-spacing:.06em}\n.big{display:flex;align-items:baseline;gap:14px}\n.big b{font-size:168px;line-height:.95;font-weight:200;letter-spacing:-.04em;font-variant-numeric:tabular-nums}\n.big span{font-size:30px;font-weight:300;color:#6b6b66}\n.cmp{font-size:19px;color:#6b6b66}",
      "props": {
        "used": "number",
        "yesterday": "number",
        "change": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"figs\">{{#items}}<div><dt>{{label}}</dt><dd><b>{{value}}</b> {{unit}}</dd></div>{{/items}}</dl>",
      "style": ".figs{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:center;gap:14px;font-family:var(--u-widget-font-family);color:#1c1c1a}\ndt{font-size:16px;color:#6b6b66;letter-spacing:.04em}\ndd{margin:2px 0 0;font-size:18px;color:#6b6b66}\ndd b{font-size:36px;font-weight:300;color:#1c1c1a;font-variant-numeric:tabular-nums}",
      "props": {
        "items": "list"
      }
    },
    "weather": {
      "template": "<ul class=\"wx\">{{#days}}<li><span>{{day}}</span><b>{{sky}}</b><em>{{low}}° / {{high}}°</em></li>{{/days}}</ul>",
      "style": ".wx{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);align-content:center;font-family:var(--u-widget-font-family);color:#1c1c1a}\nli{display:grid;gap:4px;padding-left:18px;border-left:1px solid #b9b8b2}\nli:first-child{padding-left:0;border-left:0}\nspan{font-size:15px;color:#6b6b66;letter-spacing:.06em}\nb{font-size:24px;font-weight:400}\nem{font-style:normal;font-size:18px;color:#6b6b66;font-variant-numeric:tabular-nums}",
      "props": {
        "days": "list"
      }
    },
    "note": {
      "template": "<p class=\"note\">{{text}}</p>",
      "style": ".note{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;font-family:var(--u-widget-font-family);font-size:21px;line-height:1.5;color:#1c1c1a;word-break:keep-all}",
      "props": {
        "text": "string"
      }
    }
  },
  "data": {
    "now": {
      "from": "home",
      "path": "/home/now",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "date": {},
        "time": {},
        "home": {}
      }
    },
    "today": {
      "from": "home",
      "path": "/home/today",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "used": {},
        "yesterday": {},
        "change": {},
        "advice": {}
      }
    },
    "figures": {
      "from": "home",
      "path": "/home/figures",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "home",
      "path": "/home/hours",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    },
    "weather": {
      "from": "home",
      "path": "/home/weather",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "clock": {
      "as": "element",
      "element": "clock",
      "of": "now",
      "bind": {
        "date": "date",
        "time": "time",
        "home": "home"
      }
    },
    "hero": {
      "as": "element",
      "element": "hero",
      "of": "today",
      "bind": {
        "used": "used",
        "yesterday": "yesterday",
        "change": "change"
      }
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "hours": {
      "as": "chart.bar",
      "of": "hours",
      "title": "시간대별 전기 사용(kWh)",
      "x": "hour",
      "y": "kwh",
      "series": [
        {
          "label": "사용",
          "color": "#8a8984"
        }
      ]
    },
    "weather": {
      "as": "element",
      "element": "weather",
      "of": "weather",
      "bind": {
        "days": "value"
      }
    },
    "note": {
      "as": "element",
      "element": "note",
      "of": "today",
      "bind": {
        "text": "advice"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1200,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22900%22%20viewBox%3D%220%200%201200%20900%22%3E%0A%3Crect%20width%3D%221200%22%20height%3D%22900%22%20fill%3D%22%23f3f2ee%22%2F%3E%0A%3Cpath%20d%3D%22M%2072%20130%20L%201128%20130%22%20stroke%3D%22%23b9b8b2%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%20760%20160%20L%20760%20430%22%20stroke%3D%22%23b9b8b2%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%2072%20450%20L%201128%20450%22%20stroke%3D%22%23b9b8b2%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%2072%20700%20L%201128%20700%22%20stroke%3D%22%23b9b8b2%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "clock": [
        72,
        72,
        1056,
        44
      ],
      "hero": [
        72,
        160,
        648,
        280
      ],
      "figures": [
        810,
        160,
        318,
        280
      ],
      "hours": [
        64,
        470,
        1072,
        220
      ],
      "weather": [
        72,
        720,
        600,
        110
      ],
      "note": [
        708,
        720,
        420,
        110
      ]
    }
  }
};

export const homeEink: SamplePack = {
  id: "home-eink",
  title: {
    "ko": "우리 집 에너지 — 미니멀 e-ink 액자",
    "en": "A home’s energy — a minimal e-ink frame"
  },
  field: {
    "ko": "가정·생활",
    "en": "Home & daily life"
  },
  kind: {
    "ko": "액자 화면(4:3 e-ink)",
    "en": "A frame screen (4:3 e-ink)"
  },
  domain: "energy",
  styles: [
    "minimal"
  ],
  summary: {
    "ko": "부엌 문 옆 e-ink 액자 — 나가는 길에 한눈에. 오늘 쓴 전기를 아주 크고 가는 숫자 하나로(어제 이 시간과 견주어), 옆에 태양광·가스·이달 예상 요금, 시간대별 사용, 사흘 날씨, 오늘의 한 줄 조언. 색 없이 종이 위 회색, 가는 괘선과 넉넉한 여백. 예시 데이터입니다.",
    "en": "An e-ink frame by the kitchen door, read in passing on the way out — today’s electricity in one very large, thin number against yesterday at this hour; beside it the solar panels, the gas and the month’s bill so far; the day’s use by the hour, three days of weather and one line of advice. No colour: grey on paper, thin rules and plenty of white. Example data."
  },
  connectors: [
    {
      "key": "home",
      "name": "예시 가정 에너지 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 가정이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
