// A building site's noise readings written as a score: each measuring point a staff, every ten-minute reading a note
// set as high as it is loud — the daytime limit (65 dB) a red line across the staff — so an afternoon reads as a tune
// that rises and falls, and a note over the line is red and marked with an accent. Beside each staff the point's level
// now and what it means; on the right the score's title page, the loudest reading, and the readings over the limit by
// point. The site and its readings are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/site-noise-score.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c4302b"
  },
  "elements": {
    "staff": {
      "template": "<section class=\"sf {{s.state}}\"><header><b>{{s.name}}</b><span>{{s.where}}</span><strong>{{s.now | fixed:1}}<small> dB</small></strong><em>{{s.word}}</em></header><div class=\"staff\"><i class=\"limit\"></i><ol>{{#s.notes}}<li class=\"{{state}}\" style=\"--v: {{db}}\"><b></b><time>{{t}}</time></li>{{/s.notes}}</ol></div></section>",
      "style": ".sf{height:100%;box-sizing:border-box;display:grid;grid-template-columns:190px 1fr;gap:18px;align-items:stretch;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f1d1a}\nheader{display:grid;align-content:center;gap:2px;padding-right:14px;border-right:3px double #1f1d1a;text-align:right}\nheader b{font:700 17px \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", Georgia, serif}\nheader span{font-size:12px;color:#8a8273}\nstrong{font:700 30px \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", Georgia, serif;letter-spacing:-.5px}\nstrong small{font-size:13px;font-weight:400}\nem{font-style:normal;font-size:12px;font-weight:700}\n.sf.over em{color:#c4302b}.sf.near em{color:#b9770e}.sf.ok em{color:#8a8273}\n.staff{position:relative;margin:14px 0 22px;background:repeating-linear-gradient(to bottom, #1f1d1a 0 1px, transparent 1px 22.5px);background-size:100% 91px;background-repeat:no-repeat;height:91px}\n.limit{position:absolute;left:0;right:0;bottom:calc((65 - 40) * 2%);height:0;border-top:2px solid #c4302b;opacity:.85}\nol{position:absolute;inset:0;margin:0;padding:0 8px;list-style:none;display:grid;grid-template-columns:repeat(12,1fr)}\nli{position:relative}\nli b{position:absolute;left:50%;bottom:calc((var(--v) - 40) * 2%);width:16px;height:11px;margin:0 0 -5px -8px;border-radius:50%;background:#1f1d1a;transform:rotate(-20deg)}\nli b::after{content:\"\";position:absolute;right:0;bottom:6px;width:1.6px;height:34px;background:inherit;transform:rotate(20deg);transform-origin:bottom}\nli.over b{background:#c4302b}\nli.over b::before{content:\">\";position:absolute;left:-2px;top:-30px;transform:rotate(20deg);font:900 15px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#c4302b}\nli.near b{background:#b9770e}\ntime{position:absolute;left:0;right:0;bottom:-20px;text-align:center;font-size:10px;color:#8a8273}",
      "props": {
        "s": "object"
      }
    },
    "title": {
      "template": "<section class=\"tp\"><p class=\"op\">Op. 1022 · 현장 소음 기록</p><h1>{{m.date}}</h1><p class=\"at\">{{m.time}} 까지</p><dl><div><dt>주간 기준</dt><dd>{{m.limit}}</dd></div><div><dt>가장 큰 소리</dt><dd>{{m.max}}</dd></div><div><dt>그때·그곳</dt><dd>{{m.maxAt}}</dd></div><div><dt>경계에서 넘은 횟수</dt><dd>{{m.overCount}}</dd></div></dl><p class=\"nt\">{{m.note}}</p></section>",
      "style": ".tp{height:100%;box-sizing:border-box;padding:20px 22px;font-family:\"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", Georgia, serif;color:#1f1d1a;border:1.5px solid #1f1d1a;outline:4px double #1f1d1a;outline-offset:-10px}\n.op{margin:0;font-size:13px;font-style:italic;color:#8a8273}\nh1{margin:6px 0 0;font-size:26px}\n.at{margin:0 0 12px;font-size:15px}\ndl{margin:0;display:grid;gap:6px}\ndl div{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px dotted #8a8273;padding-bottom:3px}\ndt{font:13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#8a8273}\ndd{margin:0;font-size:19px;font-weight:700}\n.nt{margin:12px 0 0;font:12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#8a8273;line-height:1.5}",
      "props": {
        "m": "object"
      }
    },
    "key": {
      "template": "<ul class=\"ky\"><li><b class=\"ok\"></b>기준 안</li><li><b class=\"near\"></b>기준 가까움(62 dB부터) — 황색</li><li><b class=\"over\"></b>기준 넘음 — 붉은 음표와 악센트 ></li><li><i></i>주간 기준 65 dB</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:12px 16px;list-style:none;display:grid;gap:8px;align-content:center;font:13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f1d1a;border-top:3px double #1f1d1a}\nli{display:flex;align-items:center;gap:12px}\nb{display:inline-block;width:16px;height:11px;border-radius:50%;background:#1f1d1a;transform:rotate(-20deg)}\n.near{background:#b9770e}.over{background:#c4302b}\ni{display:inline-block;width:22px;border-top:2px solid #c4302b}"
    }
  },
  "data": {
    "staves": {
      "from": "site",
      "path": "/site/staves",
      "time": "updatedAt",
      "fresh": 1500,
      "fields": {
        "a": {
          "at": "/value/a"
        },
        "b": {
          "at": "/value/b"
        },
        "c": {
          "at": "/value/c"
        },
        "d": {
          "at": "/value/d"
        },
        "e": {
          "at": "/value/e"
        },
        "f": {
          "at": "/value/f"
        }
      }
    },
    "summary": {
      "from": "site",
      "path": "/site/summary",
      "time": "updatedAt",
      "fresh": 1500,
      "fields": {
        "value": {}
      }
    },
    "over": {
      "from": "site",
      "path": "/site/over",
      "list": "/value",
      "fresh": 1500,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "point-a": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "a"
      }
    },
    "point-b": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "b"
      }
    },
    "point-c": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "c"
      }
    },
    "point-d": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "d"
      }
    },
    "point-e": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "e"
      }
    },
    "point-f": {
      "as": "element",
      "element": "staff",
      "of": "staves",
      "bind": {
        "s": "f"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "summary",
      "bind": {
        "m": "value"
      }
    },
    "over": {
      "as": "chart.bar",
      "of": "over",
      "title": "기준 넘은 측정 — 측정점별",
      "x": "point",
      "y": "over",
      "series": [
        {
          "label": "넘음(회)",
          "color": "#c4302b"
        }
      ]
    },
    "key": {
      "as": "element",
      "element": "key"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23d9d2c2%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2216%22%20width%3D%221220%22%20height%3D%22968%22%20fill%3D%22%23f7f2e6%22%2F%3E%0A%3Crect%20x%3D%221260%22%20y%3D%2216%22%20width%3D%22320%22%20height%3D%22968%22%20fill%3D%22%23f7f2e6%22%2F%3E%0A%3Cpath%20d%3D%22M1240%2016%20V%20984%22%20stroke%3D%22%23bfb6a3%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22630%22%20y%3D%2270%22%20font-family%3D%22Noto%20Serif%20KR%2C%20Nanum%20Myeongjo%2C%20Batang%2C%20serif%22%20font-size%3D%2234%22%20font-weight%3D%22700%22%20fill%3D%22%231f1d1a%22%20text-anchor%3D%22middle%22%3E%EC%98%A4%ED%9B%84%EC%9D%98%20%EC%86%8C%EC%9D%8C%20%E2%80%94%20%EC%97%AC%EC%84%AF%20%EC%84%B1%EB%B6%80%3C%2Ftext%3E%0A%3Ctext%20x%3D%22630%22%20y%3D%22102%22%20font-family%3D%22Noto%20Serif%20KR%2C%20Nanum%20Myeongjo%2C%20Batang%2C%20serif%22%20font-size%3D%2216%22%20font-style%3D%22italic%22%20fill%3D%22%238a8273%22%20text-anchor%3D%22middle%22%3E%ED%91%B8%EB%A5%B8%EB%A7%88%EC%9D%84%203%EB%8B%A8%EC%A7%80%20%EC%8B%A0%EC%B6%95%20%ED%98%84%EC%9E%A5%20%C2%B7%20%EA%B2%BD%EA%B3%84%20%EC%B8%A1%EC%A0%95%EC%A0%90%20%EB%8B%A4%EC%84%AF%EA%B3%BC%20%EC%B0%B8%EA%B3%A0%20%ED%95%98%EB%82%98%20%C2%B7%2010%EB%B6%84%EB%A7%88%EB%8B%A4%201%EB%B6%84%20%EB%93%B1%EA%B0%80%EC%86%8C%EC%9D%8C%EB%8F%84(Leq)%3C%2Ftext%3E%0A%3Ctext%20x%3D%221220%22%20y%3D%22134%22%20font-family%3D%22Noto%20Serif%20KR%2C%20Batang%2C%20serif%22%20font-size%3D%2213%22%20fill%3D%22%238a8273%22%20text-anchor%3D%22end%22%3E%ED%95%9C%20%EC%B9%B8%20%3D%2010%EB%B6%84%20%C2%B7%20%EC%9C%84%EB%A1%9C%20%EA%B0%88%EC%88%98%EB%A1%9D%20%EC%8B%9C%EB%81%84%EB%9F%AC%EC%9B%80(40%E2%80%9390%20dB)%20%C2%B7%20%EB%B6%89%EC%9D%80%20%EC%84%A0%20%3D%20%EC%A3%BC%EA%B0%84%20%EA%B8%B0%EC%A4%80%2065%20dB%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "point-a": [
        40,
        150,
        1180,
        128
      ],
      "point-b": [
        40,
        288,
        1180,
        128
      ],
      "point-c": [
        40,
        426,
        1180,
        128
      ],
      "point-d": [
        40,
        564,
        1180,
        128
      ],
      "point-e": [
        40,
        702,
        1180,
        128
      ],
      "point-f": [
        40,
        840,
        1180,
        128
      ],
      "title": [
        1280,
        40,
        280,
        380
      ],
      "over": [
        1280,
        440,
        280,
        330
      ],
      "key": [
        1280,
        800,
        280,
        150
      ]
    }
  }
};

export const siteNoiseScore: SamplePack = {
  id: "site-noise-score",
  title: {
    "ko": "공사장 소음 — 악보로 쓴 오후",
    "en": "A building site’s noise — an afternoon as a score"
  },
  field: {
    "ko": "건설·소음 관리",
    "en": "Construction noise"
  },
  kind: {
    "ko": "측정점별 시간 흐름",
    "en": "Readings over time by point"
  },
  domain: "construction",
  styles: [
    "print"
  ],
  summary: {
    "ko": "공사 현장의 소음 측정을 악보로 — 측정점마다 오선 하나, 10분마다 잰 소리가 그 크기만큼 높이 놓인 음표(아래 줄 40 dB, 위 줄 90 dB), 주간 기준 65 dB는 오선을 가로지르는 붉은 선. 오후가 오르내리는 선율로 읽히고, 기준을 넘은 음표는 붉고 악센트(>)가, 가까운 음표는 황색 — 표시와 색 둘. 오선 왼쪽에 측정점의 지금 크기와 뜻, 오른쪽에 악보의 속표지(기준·가장 큰 소리·넘은 횟수)와 측정점별 넘은 횟수, 읽는 법. 현장과 측정값은 지어낸 것이라 예시 데이터입니다.",
    "en": "A building site’s noise readings written as a score — a staff for every measuring point, every ten-minute reading a note set as high as it is loud (40 dB on the bottom line, 90 on the top), the daytime limit of 65 dB a red line across the staff. The afternoon reads as a tune that rises and falls; a note over the limit is red with an accent (>), one near it amber — a mark as well as a colour. Left of each staff the point’s level now and what it means; on the right the score’s title page (the limit, the loudest reading, the readings over it), the readings over the limit by point, and how to read a note. The site and its readings are made up. Example data."
  },
  connectors: [
    {
      "key": "site",
      "name": "예시 공사장 소음 측정 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 공사 현장·측정값이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
