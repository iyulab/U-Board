// The upright screen in a hospital's outpatient hall, read standing a few steps away by people who are unwell, old,
// or there for someone else: which number each clinic is calling now and who is next, how long the wait is, the
// prescriptions ready at the pharmacy, the queue at the blood and imaging rooms, the car park, and the hours
// the hall is usually busiest. A portrait kiosk:
// one column, very large numbers, plain words, high contrast, each clinic in its own colour that also marks its
// corridor. No public source carries a hospital's queues this way, so the values are example data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/clinic-kiosk.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#0f766e"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><div><h1>{{name}}</h1><p>{{date}} · {{help}}</p></div><time>{{time}}</time></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;font-family:var(--u-widget-font-family);color:#fff}\nh1{margin:0;font-size:44px;font-weight:800}\np{margin:6px 0 0;font-size:24px;color:#ccfbf1}\ntime{font-size:72px;font-weight:700;font-variant-numeric:tabular-nums}",
      "props": {
        "name": "string",
        "date": "string",
        "time": "string",
        "help": "string"
      }
    },
    "clinic": {
      "template": "<section class=\"clinic\" style=\"--c: {{colour}}\"><header><h2>{{name}}</h2><small>{{room}}</small></header><p class=\"now\"><span>지금 호출</span><b>{{calling}}</b><em>{{desk}}</em></p><p class=\"next\"><span>다음</span>{{#next}}<i>{{.}}</i>{{/next}}</p><footer><span>대기 <b>{{waiting}}</b>명</span><span>약 <b>{{minutes}}</b>분</span></footer></section>",
      "style": ".clinic{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto auto;gap:10px;font-family:var(--u-widget-font-family);color:#0f172a}\nheader{display:flex;align-items:baseline;justify-content:space-between;gap:12px}\nh2{margin:0;font-size:38px;font-weight:800;color:var(--c)}\nsmall{font-size:20px;color:#475569}\n.now{margin:0;display:grid;justify-items:center;align-content:center;border-radius:20px;background:color-mix(in srgb,var(--c) 9%,white);border:3px solid var(--c)}\n.now span{font-size:22px;font-weight:700;color:var(--c)}\n.now b{font-size:100px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}\n.now em{font-style:normal;font-size:24px;font-weight:700;color:#475569}\n.next{margin:0;display:flex;align-items:center;gap:10px;font-size:20px;color:#475569}\n.next i{font-style:normal;padding:4px 14px;border-radius:999px;background:#f1f5f9;border:2px solid #cbd5e1;font-size:26px;font-weight:700;color:#0f172a;font-variant-numeric:tabular-nums}\nfooter{display:flex;justify-content:space-between;font-size:22px;color:#475569}\nfooter b{font-size:34px;color:#0f172a;font-variant-numeric:tabular-nums}",
      "props": {
        "name": "string",
        "room": "string",
        "colour": "string",
        "calling": "number",
        "desk": "string",
        "next": "list",
        "waiting": "number",
        "minutes": "number"
      }
    },
    "tests": {
      "template": "<ul class=\"tests\">{{#rooms}}<li class=\"{{level}}\" style=\"--s: {{share}}\"><b>{{name}}</b><small>{{place}}</small><span><i></i></span><em><strong>{{minutes}}</strong>분 · {{waiting}}명</em></li>{{/rooms}}</ul>",
      "style": ".tests{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:18px;font-family:var(--u-widget-font-family);color:#0f172a}\nli{--c:#059669;display:grid;grid-template-columns:150px 150px 1fr 190px;align-items:center;gap:16px}\n.usual{--c:#d97706}.long{--c:#dc2626}\nb{font-size:28px}\nsmall{font-size:20px;color:#475569}\nspan{height:18px;border-radius:9px;background:#e2e8f0;overflow:hidden}\nspan i{display:block;height:100%;width:calc(var(--s) * 1%);border-radius:9px;background:var(--c)}\nem{font-style:normal;font-size:22px;text-align:right;color:#475569;font-variant-numeric:tabular-nums}\nstrong{font-size:34px;color:var(--c)}",
      "props": {
        "rooms": "list"
      }
    },
    "pharmacy": {
      "template": "<section class=\"rx\"><ol>{{#ready}}<li class=\"{{#fresh}}fresh{{/fresh}}\">{{no}}</li>{{/ready}}</ol><p>{{counter}}</p></section>",
      "style": ".rx{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;gap:10px;font-family:var(--u-widget-font-family);color:#0f172a}\nol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(6,1fr);gap:12px;align-content:center}\nli{display:grid;place-items:center;height:56px;border-radius:14px;background:#f1f5f9;border:2px solid #cbd5e1;font-size:32px;font-weight:800;font-variant-numeric:tabular-nums}\n.fresh{background:#0f766e;border-color:#0f766e;color:#fff}\np{margin:0;font-size:20px;color:#475569}",
      "props": {
        "ready": "list",
        "counter": "string"
      }
    },
    "parking": {
      "template": "<ul class=\"park\">{{#levels}}<li class=\"{{level}}\"><span>{{name}}</span><b>{{free}}</b></li>{{/levels}}</ul>",
      "style": ".park{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-content:center;font-family:var(--u-widget-font-family);color:#0f172a}\nli{--c:#059669;display:grid;justify-items:center;padding:8px 0;border-radius:14px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 8%,white)}\n.few{--c:#d97706}.full{--c:#dc2626}\nspan{font-size:20px;color:#475569}\nb{font-size:40px;line-height:1.1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}",
      "props": {
        "levels": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "clinic",
      "path": "/clinic/now",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "name": {},
        "date": {},
        "time": {},
        "help": {}
      }
    },
    "queues": {
      "from": "clinic",
      "path": "/clinic/queues",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "calling": {
          "at": "/internal/calling"
        },
        "desk": {
          "at": "/internal/desk"
        },
        "next": {
          "at": "/internal/next"
        },
        "waiting": {
          "at": "/internal/waiting"
        },
        "minutes": {
          "at": "/internal/minutes"
        },
        "calling-2": {
          "at": "/ortho/calling"
        },
        "desk-2": {
          "at": "/ortho/desk"
        },
        "next-2": {
          "at": "/ortho/next"
        },
        "waiting-2": {
          "at": "/ortho/waiting"
        },
        "minutes-2": {
          "at": "/ortho/minutes"
        },
        "calling-3": {
          "at": "/paediatric/calling"
        },
        "desk-3": {
          "at": "/paediatric/desk"
        },
        "next-3": {
          "at": "/paediatric/next"
        },
        "waiting-3": {
          "at": "/paediatric/waiting"
        },
        "minutes-3": {
          "at": "/paediatric/minutes"
        },
        "calling-4": {
          "at": "/eye/calling"
        },
        "desk-4": {
          "at": "/eye/desk"
        },
        "next-4": {
          "at": "/eye/next"
        },
        "waiting-4": {
          "at": "/eye/waiting"
        },
        "minutes-4": {
          "at": "/eye/minutes"
        }
      }
    },
    "tests": {
      "from": "clinic",
      "path": "/clinic/tests",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "pharmacy": {
      "from": "clinic",
      "path": "/clinic/pharmacy",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "ready": {},
        "counter": {}
      }
    },
    "parking": {
      "from": "clinic",
      "path": "/clinic/parking",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "visits": {
      "from": "clinic",
      "path": "/clinic/visits",
      "list": "/value",
      "fresh": 180,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "name": "name",
        "date": "date",
        "time": "time",
        "help": "help"
      }
    },
    "clinic-internal": {
      "as": "element",
      "element": "clinic",
      "of": "queues",
      "props": {
        "name": "내과",
        "room": "2층 · A 구역",
        "colour": "#2563eb"
      },
      "bind": {
        "calling": "calling",
        "desk": "desk",
        "next": "next",
        "waiting": "waiting",
        "minutes": "minutes"
      }
    },
    "clinic-ortho": {
      "as": "element",
      "element": "clinic",
      "of": "queues",
      "props": {
        "name": "정형외과",
        "room": "2층 · B 구역",
        "colour": "#059669"
      },
      "bind": {
        "calling": "calling-2",
        "desk": "desk-2",
        "next": "next-2",
        "waiting": "waiting-2",
        "minutes": "minutes-2"
      }
    },
    "clinic-paediatric": {
      "as": "element",
      "element": "clinic",
      "of": "queues",
      "props": {
        "name": "소아청소년과",
        "room": "1층 · C 구역",
        "colour": "#d97706"
      },
      "bind": {
        "calling": "calling-3",
        "desk": "desk-3",
        "next": "next-3",
        "waiting": "waiting-3",
        "minutes": "minutes-3"
      }
    },
    "clinic-eye": {
      "as": "element",
      "element": "clinic",
      "of": "queues",
      "props": {
        "name": "안과",
        "room": "3층 · D 구역",
        "colour": "#7c3aed"
      },
      "bind": {
        "calling": "calling-4",
        "desk": "desk-4",
        "next": "next-4",
        "waiting": "waiting-4",
        "minutes": "minutes-4"
      }
    },
    "tests": {
      "as": "element",
      "element": "tests",
      "of": "tests",
      "bind": {
        "rooms": "value"
      }
    },
    "pharmacy": {
      "as": "element",
      "element": "pharmacy",
      "of": "pharmacy",
      "bind": {
        "ready": "ready",
        "counter": "counter"
      }
    },
    "parking": {
      "as": "element",
      "element": "parking",
      "of": "parking",
      "bind": {
        "levels": "value"
      }
    },
    "visits": {
      "as": "chart.bar",
      "of": "visits",
      "x": "hour",
      "y": "visits",
      "series": [
        {
          "label": "화요일 평균 내원",
          "color": "#0f766e"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1080,
      1920
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221080%22%20height%3D%221920%22%20viewBox%3D%220%200%201080%201920%22%3E%0A%3Crect%20width%3D%221080%22%20height%3D%221920%22%20fill%3D%22%23f8fafc%22%2F%3E%0A%3Crect%20width%3D%221080%22%20height%3D%22194%22%20fill%3D%22%230f766e%22%2F%3E%0A%3Crect%20x%3D%2248%22%20y%3D%22220%22%20width%3D%22480%22%20height%3D%22418%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2076%20220%20H%20500%20A%2028%2028%200%200%201%20528%20248%20V%20238%20H%2048%20V%20248%20A%2028%2028%200%200%201%2076%20220%20Z%22%20fill%3D%22%232563eb%22%2F%3E%0A%3Crect%20x%3D%22552%22%20y%3D%22220%22%20width%3D%22480%22%20height%3D%22418%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%20580%20220%20H%201004%20A%2028%2028%200%200%201%201032%20248%20V%20238%20H%20552%20V%20248%20A%2028%2028%200%200%201%20580%20220%20Z%22%20fill%3D%22%23059669%22%2F%3E%0A%3Crect%20x%3D%2248%22%20y%3D%22662%22%20width%3D%22480%22%20height%3D%22418%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2076%20662%20H%20500%20A%2028%2028%200%200%201%20528%20690%20V%20680%20H%2048%20V%20690%20A%2028%2028%200%200%201%2076%20662%20Z%22%20fill%3D%22%23d97706%22%2F%3E%0A%3Crect%20x%3D%22552%22%20y%3D%22662%22%20width%3D%22480%22%20height%3D%22418%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%20580%20662%20H%201004%20A%2028%2028%200%200%201%201032%20690%20V%20680%20H%20552%20V%20690%20A%2028%2028%200%200%201%20580%20662%20Z%22%20fill%3D%22%237c3aed%22%2F%3E%0A%3Crect%20x%3D%2248%22%20y%3D%221110%22%20width%3D%22984%22%20height%3D%22300%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2280%22%20y%3D%221166%22%20fill%3D%22%230f172a%22%20font-size%3D%2234%22%20font-weight%3D%22800%22%20font-family%3D%22sans-serif%22%3E%EA%B2%80%EC%82%AC%EC%8B%A4%20%EB%8C%80%EA%B8%B0%3C%2Ftext%3E%0A%3Crect%20x%3D%2248%22%20y%3D%221440%22%20width%3D%22984%22%20height%3D%22210%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2280%22%20y%3D%221496%22%20fill%3D%22%230f172a%22%20font-size%3D%2234%22%20font-weight%3D%22800%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%20%EB%B0%9B%EC%9C%BC%EC%8B%A4%20%EB%B2%88%ED%98%B8%3C%2Ftext%3E%0A%3Crect%20x%3D%2248%22%20y%3D%221680%22%20width%3D%22480%22%20height%3D%22200%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2280%22%20y%3D%221736%22%20fill%3D%22%230f172a%22%20font-size%3D%2234%22%20font-weight%3D%22800%22%20font-family%3D%22sans-serif%22%3E%EC%A3%BC%EC%B0%A8%EC%9E%A5%20%EB%B9%88%EC%9E%90%EB%A6%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22552%22%20y%3D%221680%22%20width%3D%22480%22%20height%3D%22200%22%20rx%3D%2228%22%20fill%3D%22%23fff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22584%22%20y%3D%221736%22%20fill%3D%22%230f172a%22%20font-size%3D%2234%22%20font-weight%3D%22800%22%20font-family%3D%22sans-serif%22%3E%ED%8F%89%EC%86%8C%20%EB%B6%90%EB%B9%84%EB%8A%94%20%EC%8B%9C%EA%B0%84%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        48,
        50,
        984,
        130
      ],
      "clinic-internal": [
        72,
        260,
        432,
        354
      ],
      "clinic-ortho": [
        576,
        260,
        432,
        354
      ],
      "clinic-paediatric": [
        72,
        702,
        432,
        354
      ],
      "clinic-eye": [
        576,
        702,
        432,
        354
      ],
      "tests": [
        80,
        1186,
        920,
        204
      ],
      "pharmacy": [
        80,
        1516,
        920,
        118
      ],
      "parking": [
        72,
        1756,
        432,
        108
      ],
      "visits": [
        568,
        1750,
        424,
        118
      ]
    }
  }
};

export const clinicKiosk: SamplePack = {
  id: "clinic-kiosk",
  title: {
    "ko": "외래 대기 안내 — 세로 키오스크",
    "en": "Outpatient waiting — a portrait kiosk"
  },
  field: {
    "ko": "의료",
    "en": "Healthcare"
  },
  kind: {
    "ko": "세로 화면(9:16 키오스크)",
    "en": "Portrait screen (a 9:16 kiosk)"
  },
  domain: "health",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "병원 외래 로비에 세워 두는 세로 화면 — 몸이 불편한 사람도 몇 걸음 떨어져 읽도록 한 단, 아주 큰 숫자, 쉬운 말, 높은 대비. 진료과마다 지금 호출 번호와 다음 순서·대기 인원·예상 시간(복도 색과 같은 색), 검사실 대기, 약 받을 번호, 주차장 층별 빈자리, 평소 붐비는 시간. 예시 데이터입니다.",
    "en": "The upright screen in a hospital’s outpatient hall — one column read from a few steps away by people who are unwell: very large numbers, plain words, high contrast. Each clinic’s number being called now, who is next, how many wait and for how long, in the colour of its corridor; the queue at the test rooms, prescriptions ready to collect, free spaces in the car park, and the hours it is usually busiest. Example data."
  },
  connectors: [
    {
      "key": "clinic",
      "name": "예시 외래 대기 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 병원이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
