// A district heating network on a 1960s control-room console: the plant, two booster stations and four districts as
// bezel modules on a mimic panel, each with its supply and return temperatures glowing in Nixie tubes and a row of four
// engraved lamps — 정상 · 주의 · 경보 · 정비 — of which the lit one is the state, so it reads by place as well as
// colour. The pipes between them carry the flow (t/h) on their label, drawn wider the more water moves, dashed red where
// a leak is suspected and dashed grey where a district is bypassed. On the right the heat sent out over the day and an
// annunciator — engraved windows that light up for the conditions active now. The network is made up, so the values are
// example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/heating-nixie.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ff9a3c"
  },
  "statuses": {
    "leak": {
      "tone": "alarm",
      "emphasis": "hatch"
    },
    "bypass": {
      "tone": "off",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>누리 지역난방 · 열수송관망 감시반</h1><p>{{n.date}} <span>{{n.time}}</span> · 외기 {{n.outside}}℃</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:center;gap:18px;padding:0 16px;box-sizing:border-box;background:linear-gradient(180deg, #e6e0cb, #d8d2bd);border:3px solid #8f8a76;border-radius:6px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a24}\nh1{margin:0;white-space:nowrap;font-size:26px;font-weight:800;letter-spacing:.06em}\np{margin:0;white-space:nowrap;font-size:15px}\nspan{font:500 22px \"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#ff9a3c;text-shadow:0 0 6px #ff4500;background:#160c06;padding:0 8px;border-radius:6px}",
      "props": {
        "n": "object"
      }
    },
    "station": {
      "template": "<article class=\"md {{s.state}}\"><header><b>{{s.name}}</b><small>{{s.code}}</small></header><div class=\"tubes\"><p><span class=\"nx\">{{s.supply}}</span><small>공급 ℃</small></p><p><span class=\"nx\">{{s.ret}}</span><small>회수 ℃</small></p></div><p class=\"extra\">{{s.extraLabel}} <b>{{s.extra}}</b></p><ul class=\"lamps\"><li class=\"l-ok\">정상</li><li class=\"l-warn\">주의</li><li class=\"l-alarm\">경보</li><li class=\"l-maint\">정비</li></ul><p class=\"note\">{{s.note}}</p></article>",
      "style": ".md{height:100%;box-sizing:border-box;padding:7px 10px;background:linear-gradient(180deg, #e6e0cb, #d8d2bd);border:4px solid #8f8a76;border-radius:6px;box-shadow:inset 0 0 0 2px #f4efdc, 0 4px 0 #151912;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2b2a24;display:grid;gap:4px;align-content:start}\nheader{display:flex;justify-content:space-between;align-items:baseline;padding:2px 6px;background:#2b2a24;color:#f1ecd8;border-radius:3px}\nb{font-size:15px}small{font-size:11px}\nheader small{font-family:\"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#bdb7a2}\n.tubes{display:grid;grid-template-columns:1fr 1fr;gap:6px}\n.tubes p{margin:0;display:grid;justify-items:center}\n.nx{display:block;width:100%;box-sizing:border-box;text-align:center;padding:1px 0;font:500 28px \"D2Coding\", \"Consolas\", \"Menlo\", monospace;letter-spacing:2px;color:#ff9a3c;text-shadow:0 0 3px #ff6a00, 0 0 10px #ff4500;background:radial-gradient(circle, rgba(255,140,60,.08) 1px, transparent 1.5px) 0 0 / 5px 5px, #160c06;border:2px solid #4a3a2c;border-radius:12px 12px 6px 6px}\n.extra{margin:0;font-size:12px}.extra b{font-family:\"D2Coding\", \"Consolas\", \"Menlo\", monospace;font-size:13px}\n.lamps{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center}\n.lamps li{font-size:10px;font-weight:700;color:#5b584c}\n.lamps li::before{content:\"\";display:block;width:14px;height:14px;margin:0 auto 1px;border-radius:50%;background:#3a3832;box-shadow:inset 0 2px 3px rgba(0,0,0,.6);border:2px solid #77725f}\n.ok .l-ok::before{background:radial-gradient(circle at 35% 35%, #b9ffb0, #2fbf3a);box-shadow:0 0 8px #3dff52}\n.warn .l-warn::before{background:radial-gradient(circle at 35% 35%, #fff2a8, #e2a312);box-shadow:0 0 8px #ffc21a}\n.alarm .l-alarm::before{background:radial-gradient(circle at 35% 35%, #ffc2b5, #d92b1c);box-shadow:0 0 10px #ff3b24}\n.maint .l-maint::before{background:radial-gradient(circle at 35% 35%, #ffffff, #8fb4d9);box-shadow:0 0 8px #bcd8ff}\n.ok .l-ok,.warn .l-warn,.alarm .l-alarm,.maint .l-maint{color:#2b2a24}\n.note{margin:0;font-size:11px;line-height:1.3;color:#4a473d}\n.maint .nx{color:#6b5a4a;text-shadow:none}\n.alarm{border-color:#e0402f}",
      "props": {
        "s": "object"
      }
    },
    "annunciator": {
      "template": "<section class=\"an\"><h2>경보 표시반</h2><ul>{{#items}}<li class=\"{{state}}\">{{label}}</li>{{/items}}</ul></section>",
      "style": ".an{height:100%;box-sizing:border-box;padding:4px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nh2{margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:.1em;color:#e9e4cf}\nul{margin:0;padding:8px;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:#1c201b;border-radius:4px}\nli{display:grid;place-items:center;height:52px;padding:0 4px;text-align:center;font-size:13px;font-weight:700;color:#77806f;background:#30362e;border:2px solid #121510;border-radius:3px}\n.warn{background:#ffd34d;color:#3a2a00;box-shadow:0 0 10px #ffc21a}\n.alarm{background:#ff5a45;color:#fff;box-shadow:0 0 12px #ff3b24;border-style:double;border-width:4px}\n.maint{background:#bcd8ff;color:#1d2f45}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "plant",
      "path": "/net/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "stations": {
      "from": "plant",
      "path": "/net/stations",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "plant": {
          "at": "/value/plant"
        },
        "boosterA": {
          "at": "/value/boosterA"
        },
        "boosterB": {
          "at": "/value/boosterB"
        },
        "z1": {
          "at": "/value/z1"
        },
        "z2": {
          "at": "/value/z2"
        },
        "z3": {
          "at": "/value/z3"
        },
        "z4": {
          "at": "/value/z4"
        }
      }
    },
    "heat": {
      "from": "plant",
      "path": "/net/heat",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "annunciator": {
      "from": "plant",
      "path": "/net/annunciator",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "pipes": {
      "from": "plant",
      "path": "/net/pipes",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "flow": {
          "at": "/value/plant-boosterA/flow",
          "format": "number:0"
        },
        "state": {
          "at": "/value/plant-boosterA/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        },
        "flow-2": {
          "at": "/value/plant-boosterB/flow",
          "format": "number:0"
        },
        "state-2": {
          "at": "/value/plant-boosterB/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        },
        "flow-3": {
          "at": "/value/boosterA-z1/flow",
          "format": "number:0"
        },
        "state-3": {
          "at": "/value/boosterA-z1/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        },
        "flow-4": {
          "at": "/value/boosterA-z2/flow",
          "format": "number:0"
        },
        "state-4": {
          "at": "/value/boosterA-z2/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        },
        "flow-5": {
          "at": "/value/boosterB-z3/flow",
          "format": "number:0"
        },
        "state-5": {
          "at": "/value/boosterB-z3/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        },
        "flow-6": {
          "at": "/value/boosterB-z4/flow",
          "format": "number:0"
        },
        "state-6": {
          "at": "/value/boosterB-z4/state",
          "state": {
            "leak": "leak",
            "bypass": "bypass",
            "*": "alarm"
          }
        }
      }
    }
  },
  "parts": {
    "banner": {
      "as": "element",
      "element": "banner",
      "of": "now",
      "bind": {
        "n": "value"
      }
    },
    "plant": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "plant"
      }
    },
    "boosterA": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "boosterA"
      }
    },
    "boosterB": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "boosterB"
      }
    },
    "z1": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "z1"
      }
    },
    "z2": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "z2"
      }
    },
    "z3": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "z3"
      }
    },
    "z4": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "z4"
      }
    },
    "heat": {
      "as": "chart.line",
      "of": "heat",
      "title": "열 공급량 — 지난 24시간 (Gcal/h)",
      "x": "hour",
      "y": "heat",
      "series": [
        {
          "label": "공급량",
          "color": "#ff9a3c"
        }
      ],
      "echarts": {
        "yAxis": {
          "min": 150,
          "max": 400
        }
      }
    },
    "annunciator": {
      "as": "element",
      "element": "annunciator",
      "of": "annunciator",
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22hammer%22%20width%3D%228%22%20height%3D%228%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%235f6b5f%22%2F%3E%3Ccircle%20cx%3D%222%22%20cy%3D%223%22%20r%3D%221.4%22%20fill%3D%22%23677366%22%2F%3E%3Ccircle%20cx%3D%226%22%20cy%3D%226%22%20r%3D%221.1%22%20fill%3D%22%2356614f%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23hammer)%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%2290%22%20width%3D%221030%22%20height%3D%22880%22%20rx%3D%228%22%20fill%3D%22%2322281f%22%20stroke%3D%22%23151912%22%20stroke-width%3D%226%22%2F%3E%0A%3Ccircle%20cx%3D%2264%22%20cy%3D%22104%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%221066%22%20cy%3D%22104%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%22956%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%221066%22%20cy%3D%22956%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%221100%22%20y%3D%2290%22%20width%3D%22460%22%20height%3D%22880%22%20rx%3D%228%22%20fill%3D%22%234d574c%22%20stroke%3D%22%232c332b%22%20stroke-width%3D%224%22%2F%3E%0A%3Ccircle%20cx%3D%221114%22%20cy%3D%22104%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%221546%22%20cy%3D%22104%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%221114%22%20cy%3D%22956%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%3Ccircle%20cx%3D%221546%22%20cy%3D%22956%22%20r%3D%225%22%20fill%3D%22%238a948a%22%20stroke%3D%22%233c443c%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22930%22%20width%3D%22300%22%20height%3D%2226%22%20rx%3D%223%22%20fill%3D%22%23d8d2bd%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%22949%22%20font-family%3D%22Consolas%2C%20monospace%22%20font-size%3D%2214%22%20fill%3D%22%232b2a24%22%3EMIMIC%20%C2%B7%20%EA%B3%B5%EA%B8%89%EA%B4%80%20%EA%B8%B0%EC%A4%80%20%EC%9C%A0%EB%9F%89%20t%2Fh%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        50,
        16,
        1030,
        64
      ],
      "plant": [
        90,
        425,
        230,
        200
      ],
      "boosterA": [
        440,
        215,
        230,
        200
      ],
      "boosterB": [
        440,
        635,
        230,
        200
      ],
      "z1": [
        800,
        110,
        230,
        200
      ],
      "z2": [
        800,
        320,
        230,
        200
      ],
      "z3": [
        800,
        530,
        230,
        200
      ],
      "z4": [
        800,
        740,
        230,
        200
      ],
      "heat": [
        1120,
        110,
        420,
        520
      ],
      "annunciator": [
        1120,
        660,
        420,
        290
      ]
    },
    "links": {
      "pipe-plant-boosterA": {
        "from": "plant",
        "to": "boosterA",
        "label": "{{flow}} t/h",
        "show": "state",
        "weight": {
          "field": "flow",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      },
      "pipe-plant-boosterB": {
        "from": "plant",
        "to": "boosterB",
        "label": "{{flow-2}} t/h",
        "show": "state-2",
        "weight": {
          "field": "flow-2",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      },
      "pipe-boosterA-z1": {
        "from": "boosterA",
        "to": "z1",
        "label": "{{flow-3}} t/h",
        "show": "state-3",
        "weight": {
          "field": "flow-3",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      },
      "pipe-boosterA-z2": {
        "from": "boosterA",
        "to": "z2",
        "label": "{{flow-4}} t/h",
        "show": "state-4",
        "weight": {
          "field": "flow-4",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      },
      "pipe-boosterB-z3": {
        "from": "boosterB",
        "to": "z3",
        "label": "{{flow-5}} t/h",
        "show": "state-5",
        "weight": {
          "field": "flow-5",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      },
      "pipe-boosterB-z4": {
        "from": "boosterB",
        "to": "z4",
        "label": "{{flow-6}} t/h",
        "show": "state-6",
        "weight": {
          "field": "flow-6",
          "bands": [
            2.5,
            100,
            4,
            300,
            6,
            600,
            9
          ]
        },
        "of": "pipes",
        "width": 4,
        "arrow": "end",
        "route": "orthogonal"
      }
    }
  }
};

export const heatingNixie: SamplePack = {
  id: "heating-nixie",
  title: {
    "ko": "지역난방 열수송관망 — 1960년대 관제반",
    "en": "A district heating network — a 1960s control console"
  },
  field: {
    "ko": "지역난방·열 공급",
    "en": "District heating"
  },
  kind: {
    "ko": "관망 계통과 지점별 상태",
    "en": "Network and stations"
  },
  domain: "energy",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "지역난방 열수송관망을 1960년대 관제반으로 — 열원·가압장 둘·지구 넷이 계통판 위 베젤 모듈: 공급·회수 온도가 닉시관에 빛나고, 정상·주의·경보·정비 네 개의 새긴 램프 가운데 켜진 하나가 상태(색과 자리로 읽힘). 모듈 사이 관로는 유량(t/h)을 라벨에 싣고 물이 많을수록 굵게, 누수 의심은 빨간 점선, 우회는 회색 점선. 오른쪽에 하루 열 공급량과 지금 켜진 조건만 불 들어오는 경보 표시반. 관망은 지어낸 것이라 예시 데이터입니다.",
    "en": "A district heating network on a 1960s control console — the plant, two booster stations and four districts as bezel modules on a mimic panel: supply and return temperatures glowing in Nixie tubes, and of four engraved lamps — steady, watch, alarm, maintenance — the lit one is the state, read by place as well as colour. The pipes carry the flow (t/h) on their label, wider the more water moves, dashed red where a leak is suspected and dashed grey where a district is bypassed. On the right the heat sent out over the day and an annunciator whose windows light up for the conditions active now. The network is made up. Example data."
  },
  connectors: [
    {
      "key": "plant",
      "name": "예시 지역난방 관망 감시 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 지역난방 관망이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
