// An airport's departures board, the sign hung over a terminal hall and read from across it: black, amber, the
// time, flight and gate on split-flap tiles, the destination in Korean and English, and what each flight is doing
// now — boarding, delayed to a new time, gate closed, cancelled. Beside it the clock and the weather, the hour's
// departures planned against flown, the morning's punctuality, and the wait at each security checkpoint. Signage:
// few things, very large. No public source carries a terminal's board this way without registering for it, so the
// values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/airport-departures.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#fbbf24"
  },
  "elements": {
    "departures": {
      "template": "<section class=\"board\">\n  <header><b>출발 <span>DEPARTURES</span></b></header>\n  <div class=\"rows\"><table>\n    <thead><tr><th>시각<i>TIME</i></th><th>편명<i>FLIGHT</i></th><th>목적지<i>DESTINATION</i></th><th>게이트<i>GATE</i></th><th>현황<i>REMARKS</i></th></tr></thead>\n    <tbody>{{#flights}}<tr class=\"{{status}}\">\n      <td><span class=\"flap\">{{time}}</span></td>\n      <td><span class=\"flap\">{{flight}}</span><small>{{airline}}</small></td>\n      <td class=\"dest\">{{dest}}<small>{{destEn}}</small></td>\n      <td><span class=\"flap\">{{gate}}</span></td>\n      <td class=\"remark\">{{remark}}<small>{{remarkEn}}</small></td>\n    </tr>{{/flights}}</tbody>\n  </table></div>\n</section>",
      "style": ".board{container-type:inline-size;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:16px 20px;border-radius:6px;background:#0a0a0a;color:#fbbf24;font-family:var(--u-widget-font-family)}\nheader b{font-size:26px;letter-spacing:.04em;color:#fff}\nheader span{font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:15px;color:#fbbf24;letter-spacing:.2em;margin-left:8px}\ntable{width:100%;border-collapse:collapse}\nth{text-align:left;font-size:13px;font-weight:600;color:#a3a3a3;padding:0 8px 8px;border-bottom:1px solid #262626}\nth i{display:block;font-style:normal;font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:10px;letter-spacing:.12em;color:#737373}\ntd{padding:6px 8px;border-bottom:1px solid #1a1a1a;vertical-align:middle;font-size:17px;white-space:nowrap}\ntd small{display:block;font-size:11px;color:#a3a3a3;margin-top:2px}\n.flap{font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:0;color:#fbbf24;background:linear-gradient(180deg,transparent 0 48%,#000 48% 52%,transparent 52%),repeating-linear-gradient(90deg,#1f1f1f 0 calc(1ch - 2px),transparent calc(1ch - 2px) 1ch);padding:0 2px;border-radius:2px}\n.dest{color:#fafafa;font-weight:600}\n.remark{font-weight:700}\n.boarding .remark{color:#4ade80}\n.closed .remark{color:#a3a3a3}\n.delayed .remark{color:#fb923c}\n.cancelled .remark{color:#f87171}\n.cancelled .dest,.cancelled .flap{text-decoration:line-through;text-decoration-color:#f87171}\n.departed{opacity:.45}\n.rows{min-width:0;overflow-x:auto;scrollbar-color:#404040 transparent}\nth{white-space:nowrap}\n/* On a phone: smaller tiles, the English lines and the airline left out — and what still does not fit scrolls across. */\n@container (max-width: 640px){.board{padding:12px}td{padding:5px 4px;font-size:14px}th{padding:0 4px 6px}.flap{font-size:15px}td small,th i{display:none}}\n@container (max-width: 360px){td{padding:4px 3px;font-size:13px}th{padding:0 3px 6px;font-size:12px}.flap{font-size:13px}header b{font-size:22px}.board{padding:10px 8px}.dest{white-space:normal;word-break:keep-all}}",
      "props": {
        "flights": "list"
      }
    },
    "clock": {
      "template": "<div class=\"clock\"><b class=\"flap\">{{time}}</b><span>{{date}}</span><em>{{sky}} · {{temp | fixed:0}}°C</em></div>",
      "style": ".clock{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:6px;border-radius:6px;background:#0a0a0a;color:#e5e5e5;font-family:var(--u-widget-font-family)}\n.flap{font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:54px;line-height:1.1;color:#fbbf24;background:linear-gradient(180deg,transparent 0 48%,#000 48% 52%,transparent 52%),repeating-linear-gradient(90deg,#1f1f1f 0 calc(1ch - 2px),transparent calc(1ch - 2px) 1ch);padding:0 2px;border-radius:2px}\nspan{font-size:14px;color:#a3a3a3}\nem{font-style:normal;font-size:15px}",
      "props": {
        "time": "string",
        "date": "string",
        "temp": "number",
        "sky": "string"
      }
    },
    "queues": {
      "template": "<section class=\"queues\"><header>보안검색 대기 <span>SECURITY</span></header>\n  <ul>{{#checkpoints}}<li class=\"{{level}}\" style=\"--s: {{share}}\"><span>{{name}}</span><i><u></u></i><b>{{minutes}}분</b></li>{{/checkpoints}}</ul>\n</section>",
      "style": ".queues{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:14px 16px;border-radius:6px;background:#0a0a0a;color:#e5e5e5;font-family:var(--u-widget-font-family)}\nheader{font-size:15px;font-weight:700}\nheader span{font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;font-size:11px;letter-spacing:.14em;color:#737373;margin-left:6px}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:space-around;gap:6px}\nli{display:grid;grid-template-columns:64px 1fr 44px;align-items:center;gap:10px;font-size:14px}\ni{height:10px;border-radius:2px;background:#262626;overflow:hidden}\nu{display:block;height:100%;width:calc(var(--s) * 1%);background:#4ade80}\n.long u{background:#fb923c}\nb{text-align:right;font-family:ui-monospace,'Cascadia Mono',Consolas,monospace;color:#fbbf24}",
      "props": {
        "checkpoints": "list"
      }
    }
  },
  "data": {
    "departures": {
      "from": "fids",
      "path": "/fids/departures",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "fids",
      "path": "/fids/now",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "time": {},
        "date": {},
        "temp": {},
        "sky": {},
        "punctuality": {
          "label": "오전 정시 출발률",
          "unit": "%",
          "state": [
            "warn",
            85,
            "ok"
          ]
        },
        "punctualityByHour": {}
      }
    },
    "hourly": {
      "from": "fids",
      "path": "/fids/hourly",
      "list": "/value",
      "fresh": 180,
      "answerTime": "/updatedAt"
    },
    "security": {
      "from": "fids",
      "path": "/fids/security",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "departures": {
      "as": "element",
      "element": "departures",
      "of": "departures",
      "bind": {
        "flights": "value"
      }
    },
    "clock": {
      "as": "element",
      "element": "clock",
      "of": "now",
      "bind": {
        "time": "time",
        "date": "date",
        "temp": "temp",
        "sky": "sky"
      }
    },
    "punctuality": {
      "as": "stat",
      "of": "now",
      "show": "punctuality",
      "trend": "punctualityByHour"
    },
    "hourly": {
      "as": "chart.bar",
      "of": "hourly",
      "title": "시간대별 출발 — 계획과 실제",
      "x": "hour",
      "y": [
        "planned",
        "flown"
      ],
      "series": [
        {
          "label": "계획",
          "color": "#525252"
        },
        {
          "label": "실제",
          "color": "#fbbf24"
        }
      ]
    },
    "queues": {
      "as": "element",
      "element": "queues",
      "of": "security",
      "bind": {
        "checkpoints": "value"
      }
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "departures",
        9
      ],
      {
        "grid": [
          {
            "id": "clock",
            "span": 12,
            "height": 150
          },
          {
            "id": "punctuality",
            "span": 12,
            "height": 130
          },
          {
            "id": "hourly",
            "span": 12,
            "height": 222
          },
          {
            "id": "queues",
            "span": 12,
            "height": 166
          }
        ],
        "span": 3
      }
    ]
  }
};

export const airportDepartures: SamplePack = {
  id: "airport-departures",
  title: {
    "ko": "공항 출발 안내판",
    "en": "Airport departures board"
  },
  field: {
    "ko": "항공·공항",
    "en": "Aviation & airports"
  },
  kind: {
    "ko": "없음 — 사이니지(그리드, 다크)",
    "en": "None — signage (grid, dark)"
  },
  domain: "transport",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "터미널 홀 건너편에서 읽는 출발 안내판 — 스플릿 플랩 칸의 시각·편명·게이트, 한·영 목적지, 탑승 중·지연·마감·결항 현황. 옆에 시계와 날씨, 오전 정시 출발률, 시간대별 계획과 실제 출발, 보안검색 대기. 큰 글자 몇 가지로 읽는 화면. 예시 데이터입니다.",
    "en": "A departures board read from across the terminal hall — time, flight and gate on split-flap tiles, the destination in Korean and English, and each flight boarding, delayed, closed or cancelled; beside it the clock and the weather, the morning’s punctuality, the hour’s departures planned against flown, and the security wait. A few things, very large. Example data."
  },
  connectors: [
    {
      "key": "fids",
      "name": "예시 운항 정보 시스템(FIDS)",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 항공편이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
