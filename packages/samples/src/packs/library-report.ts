// A public library's month on one printed page, the sheet handed to the board of trustees and pinned by the front
// desk: what the month came to in a paragraph, four figures, loans through the year, the subjects borrowed most, who
// came by age, and the programmes held. The print style: an A4 page, a serif masthead over a thin double rule,
// numbered sections, black ink and one muted accent, a colophon at the foot — made to read the same on paper as on
// screen. No public source carries a library's month this way, so the values are example data written for the page.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/library-report.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#9a3412"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><p class=\"issuer\">{{issuer}}</p><h1>{{title}}</h1><p class=\"meta\"><span>{{period}}</span><span>{{issue}} · {{published}} 발행</span></p></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;align-content:end;gap:4px;color:#1c1917}\n.issuer{margin:0;font:600 12px/1.2 var(--u-widget-font-family);letter-spacing:.24em;color:#9a3412}\nh1{margin:0;font:700 34px/1.15 'Noto Serif KR','Nanum Myeongjo',Georgia,'Times New Roman',serif;letter-spacing:-.01em}\n.meta{margin:0;display:flex;justify-content:space-between;font:13px/1.4 var(--u-widget-font-family);color:#57534e}",
      "props": {
        "issuer": "string",
        "title": "string",
        "period": "string",
        "issue": "string",
        "published": "string"
      }
    },
    "lead": {
      "template": "<p class=\"lead\">9월 한 달 동안 <b>{{visits | grouped:0}}명</b>이 도서관을 찾았습니다. 지난달보다 {{visitsChange}}. 빌려 간 책은 <b>{{loans | grouped:0}}권</b>으로, {{topSubject}} 분야가 가장 많이 나갔습니다. {{note}}</p>",
      "style": ".lead{margin:0;height:100%;box-sizing:border-box;font:15px/1.75 'Noto Serif KR','Nanum Myeongjo',Georgia,'Times New Roman',serif;color:#1c1917;word-break:keep-all}\n.lead::first-letter{font-size:1.9em;font-weight:700;color:#9a3412}\nb{font-weight:700}",
      "props": {
        "visits": "number",
        "visitsChange": "string",
        "loans": "number",
        "topSubject": "string",
        "note": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"figs\">{{#items}}<div><dt>{{label}}</dt><dd><b>{{value | grouped:0}}</b><span>{{unit}}</span></dd><dd class=\"chg\">{{change}}</dd></div>{{/items}}</dl>",
      "style": ".figs{height:100%;box-sizing:border-box;margin:0;display:grid;grid-template-columns:repeat(4,1fr);align-content:center;color:#1c1917}\ndiv{padding:0 14px;border-left:1px solid rgba(28,25,23,.18)}\ndiv:first-child{border-left:0;padding-left:0}\ndt{font:12px/1.3 var(--u-widget-font-family);color:#57534e}\ndd{margin:2px 0 0}\nb{font:700 26px/1.1 'Noto Serif KR','Nanum Myeongjo',Georgia,'Times New Roman',serif;font-variant-numeric:tabular-nums}\nspan{margin-left:3px;font:13px var(--u-widget-font-family);color:#57534e}\n.chg{font:12px var(--u-widget-font-family);color:#9a3412;font-variant-numeric:tabular-nums}",
      "props": {
        "items": "list"
      }
    },
    "programmes": {
      "template": "<table class=\"prog\"><tbody>{{#items}}<tr><td class=\"name\">{{name}}</td><td>{{when}}</td><td class=\"num\">{{came}} / {{places}}명</td></tr>{{/items}}</tbody></table>",
      "style": ".prog{width:100%;border-collapse:collapse;font:13px/1.5 var(--u-widget-font-family);color:#1c1917}\ntd{padding:5px 0;border-bottom:1px dotted rgba(28,25,23,.3)}\n.name{font-family:'Noto Serif KR','Nanum Myeongjo',Georgia,'Times New Roman',serif;font-size:14px}\ntd+td{color:#57534e;padding-left:12px}\n.num{text-align:right;font-variant-numeric:tabular-nums;color:#1c1917}",
      "props": {
        "items": "list"
      }
    },
    "colophon": {
      "template": "<footer class=\"foot\"><span>{{source}}</span><span>{{page}}</span></footer>",
      "style": ".foot{height:100%;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;font:11px var(--u-widget-font-family);color:#57534e}",
      "props": {
        "source": "string",
        "page": "string"
      }
    }
  },
  "data": {
    "report": {
      "from": "library",
      "path": "/library/report",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "issuer": {},
        "title": {},
        "period": {},
        "issue": {},
        "published": {},
        "visits": {},
        "visitsChange": {},
        "loans": {},
        "topSubject": {},
        "note": {},
        "source": {},
        "page": {}
      }
    },
    "figures": {
      "from": "library",
      "path": "/library/figures",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "loans": {
      "from": "library",
      "path": "/library/loans",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt"
    },
    "subjects": {
      "from": "library",
      "path": "/library/subjects",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt",
      "fields": {
        "rank": {
          "label": "순위"
        },
        "subject": {
          "label": "분야"
        },
        "loans": {
          "label": "대출",
          "format": "number"
        },
        "share": {
          "label": "비중"
        }
      }
    },
    "ages": {
      "from": "library",
      "path": "/library/ages",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt"
    },
    "programmes": {
      "from": "library",
      "path": "/library/programmes",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "report",
      "bind": {
        "issuer": "issuer",
        "title": "title",
        "period": "period",
        "issue": "issue",
        "published": "published"
      }
    },
    "lead": {
      "as": "element",
      "element": "lead",
      "of": "report",
      "bind": {
        "visits": "visits",
        "visitsChange": "visitsChange",
        "loans": "loans",
        "topSubject": "topSubject",
        "note": "note"
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
    "loans": {
      "as": "chart.line",
      "of": "loans",
      "x": "month",
      "y": [
        "thisYear",
        "lastYear"
      ],
      "valueAxisZero": false,
      "series": [
        {
          "label": "올해",
          "color": "#9a3412"
        },
        {
          "label": "지난해",
          "color": "#a8a29e"
        }
      ]
    },
    "subjects": {
      "as": "table",
      "of": "subjects",
      "show": [
        "rank",
        "subject",
        "loans",
        "share"
      ]
    },
    "ages": {
      "as": "chart.bar",
      "of": "ages",
      "x": "age",
      "y": "people",
      "horizontal": true,
      "series": [
        {
          "label": "이용자",
          "color": "#57534e"
        }
      ]
    },
    "programmes": {
      "as": "element",
      "element": "programmes",
      "of": "programmes",
      "bind": {
        "items": "value"
      }
    },
    "colophon": {
      "as": "element",
      "element": "colophon",
      "of": "report",
      "bind": {
        "source": "source",
        "page": "page"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      794,
      1123
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22794%22%20height%3D%221123%22%20viewBox%3D%220%200%20794%201123%22%3E%0A%3Crect%20width%3D%22794%22%20height%3D%221123%22%20fill%3D%22%23fffdf8%22%2F%3E%0A%3Cpath%20d%3D%22M%2056%20150%20H%20738%20M%2056%20154%20H%20738%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2256%22%20y%3D%22270%22%20width%3D%22682%22%20height%3D%2296%22%20fill%3D%22%239a3412%22%20fill-opacity%3D%22.05%22%2F%3E%0A%3Cpath%20d%3D%22M%2056%20270%20H%20738%20M%2056%20366%20H%20738%22%20stroke%3D%22%239a3412%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22410%22%20fill%3D%22%231c1917%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22Georgia%2C%20serif%22%3E1.%20%EC%9B%94%EB%B3%84%20%EB%8C%80%EC%B6%9C%20%EA%B6%8C%EC%88%98%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2056%20420%20H%20738%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22668%22%20fill%3D%22%231c1917%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22Georgia%2C%20serif%22%3E2.%20%EB%A7%8E%EC%9D%B4%20%EB%B9%8C%EB%A6%B0%20%EB%B6%84%EC%95%BC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2056%20678%20H%20381%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Ctext%20x%3D%22413%22%20y%3D%22668%22%20fill%3D%22%231c1917%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22Georgia%2C%20serif%22%3E3.%20%EC%97%B0%EB%A0%B9%EB%8C%80%EB%B3%84%20%EC%9D%B4%EC%9A%A9%EC%9E%90%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20413%20678%20H%20738%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Cpath%20d%3D%22M%20397%20650%20V%20900%22%20stroke%3D%22%2357534e%22%20stroke-width%3D%22.5%22%2F%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22938%22%20fill%3D%22%231c1917%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22Georgia%2C%20serif%22%3E4.%20%EC%A3%BC%EC%9A%94%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2056%20948%20H%20738%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Cpath%20d%3D%22M%2056%201057%20H%20738%22%20stroke%3D%22%231c1917%22%20stroke-width%3D%22.6%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        56,
        40,
        682,
        100
      ],
      "lead": [
        56,
        168,
        682,
        96
      ],
      "figures": [
        70,
        278,
        654,
        80
      ],
      "loans": [
        56,
        430,
        682,
        196
      ],
      "subjects": [
        56,
        688,
        325,
        208
      ],
      "ages": [
        413,
        688,
        325,
        208
      ],
      "programmes": [
        56,
        958,
        682,
        88
      ],
      "colophon": [
        56,
        1063,
        682,
        28
      ]
    }
  }
};

export const libraryReport: SamplePack = {
  id: "library-report",
  title: {
    "ko": "도서관 월간 이용 리포트 — 인쇄 한 장",
    "en": "A library’s monthly report — one printed page"
  },
  field: {
    "ko": "문화·공공 서비스",
    "en": "Culture & public services"
  },
  kind: {
    "ko": "인쇄 지면(A4 한 장)",
    "en": "A printed page (one A4 sheet)"
  },
  domain: "public",
  styles: [
    "print"
  ],
  summary: {
    "ko": "운영위원회에 내고 안내데스크 옆에 붙이는 공공도서관의 한 달 — 명조 제호와 이중 괘선, 번호 붙은 절, 검은 잉크에 차분한 강조색 하나, 아래에 출처. 한 문단 요약(수치가 문장 안에), 네 가지 지표, 올해와 지난해 월별 대출, 많이 빌린 분야 표, 연령대별 이용자, 이달의 프로그램. 화면과 종이에서 같게 읽히는 지면. 예시 데이터입니다.",
    "en": "A public library’s month on one printed page, for the trustees and the notice board by the desk — a serif masthead over a double rule, numbered sections, black ink and one muted accent, the source at the foot. The month in a paragraph with its figures in the sentences, four figures, loans this year against last, the subjects borrowed most, visitors by age, and the month’s programmes. A page that reads the same on paper as on screen. Example data."
  },
  connectors: [
    {
      "key": "library",
      "name": "예시 도서관 통계 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 도서관이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
