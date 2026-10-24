// A middle school's day chalked on a blackboard: the slate-green board with its wooden ledge, the floor plan drawn in
// chalk lines, every room a chalk box, chalk-coloured headings in yellow, pink and blue. Each classroom says who is in it
// and what they are doing now; the special rooms say which class came to them, so a class that moved for science reads
// as an empty room at home and a full lab down the corridor. A room's state is told by a chalk sign as well as a colour —
// a full circle in lesson, an arrow moved out, a pencil a test, an empty ring free — and the room's outline is dashed when
// nobody is in it. Along the bottom the lunch rota and the day's notes; on the right the school's name, the period and
// the clock, today's attendance, the key, and the absences of the last two weeks. The school is made up, so the values
// are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/school-chalkboard.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#f2dc7a"
  },
  "elements": {
    "room": {
      "template": "<section class=\"rm {{r.state}}\"><header><b>{{r.name}}</b><i></i></header><p>{{r.word}}</p><small>{{r.note}}</small></section>",
      "style": ".rm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px;border:3px solid rgba(238,240,230,.85);border-radius:4px 10px 6px 12px;font-family:\"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6}\nheader{display:flex;align-items:center;justify-content:space-between}\nb{font-size:24px;font-weight:700}\ni{width:22px;height:22px;display:grid;place-items:center;font:700 18px \"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;font-style:normal}\np{margin:0;align-self:center;font-size:22px}\nsmall{font-size:16px;opacity:.85}\n.lesson i::after{content:\"\";width:14px;height:14px;border-radius:50%;background:#eef0e6}\n.moved{border-style:dashed}\n.moved i::after{content:\"→\";color:#a9d3ef}\n.moved p{color:#a9d3ef}\n.test i::after{content:\"✎\";color:#f2dc7a}\n.test p{color:#f2dc7a}\n.test{border-color:#f2dc7a}\n.free{border-style:dashed;border-color:rgba(238,240,230,.4)}\n.free i{border:2px solid rgba(238,240,230,.6);border-radius:50%;width:16px;height:16px;box-sizing:border-box}\n.free p,.free b{opacity:.6}\n.care i::after{content:\"+\";color:#f2a7b8}\n.care p{color:#f2a7b8}\n.care{border-color:#f2a7b8}",
      "props": {
        "r": "object"
      }
    },
    "lunch": {
      "template": "<ol class=\"lu\">{{#items}}<li><b>{{time}}</b><span>{{who}}</span><small>{{note}}</small></li>{{/items}}</ol>",
      "style": ".lu{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:start;gap:8px;font-family:\"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6}\nli{display:grid;grid-template-columns:80px 1fr;column-gap:12px}\nb{grid-row:span 2;font-size:26px;color:#f2dc7a}\nspan{font-size:23px}\nsmall{font-size:17px;opacity:.8}",
      "props": {
        "items": "list"
      }
    },
    "notes": {
      "template": "<ul class=\"nt\">{{#items}}<li class=\"{{kind}}\">{{text}}</li>{{/items}}</ul>",
      "style": ".nt{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;align-content:start;gap:10px;font:22px \"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6}\nli{padding-left:30px;position:relative}\nli::before{position:absolute;left:0;top:0;width:24px;text-align:center}\n.plan::before{content:\"☐\"}\n.done::before{content:\"☑\";color:#a9d3ef}\n.done{opacity:.7;text-decoration:line-through;text-decoration-color:rgba(238,240,230,.6)}\n.alert::before{content:\"!\";color:#f2a7b8;font-weight:700}\n.alert{color:#f2a7b8}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{date}}</p><div><span>{{period}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:\"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6}\nh1{margin:0;font-size:46px;font-weight:700;line-height:1.05}\np{margin:0;font-size:24px;color:#a9d3ef}\ndiv{display:flex;align-items:baseline;gap:16px}\nspan{font-size:30px;color:#f2dc7a}\nb{margin-left:auto;font-size:52px;font-weight:700;border-bottom:3px solid rgba(238,240,230,.8)}",
      "props": {
        "name": "string",
        "date": "string",
        "period": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;border:2px dashed rgba(238,240,230,.5);border-radius:10px 4px 12px 6px}\ndt{font-size:20px;color:#a9d3ef}\ndd{margin:0;font-size:40px;font-weight:700}\nsmall{font-size:16px;opacity:.8}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"ls\"></i>수업 중</li><li><i class=\"mv\">→</i>이동 수업</li><li><i class=\"ts\">✎</i>시험</li><li><i class=\"cr\">+</i>보건</li><li><i class=\"fr\"></i>비어 있음</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;justify-content:space-between;font:18px \"Gaegu\", \"Nanum Pen Script\", \"Comic Sans MS\", \"Noto Sans KR\", cursive;color:#eef0e6;white-space:nowrap}\nli{display:flex;align-items:center;gap:5px}\n.ls::after{content:\"\";width:12px;height:12px;border-radius:50%;background:#eef0e6}\ni{width:20px;height:20px;display:grid;place-items:center;font-style:normal;font-weight:700}\n.mv{color:#a9d3ef}\n.ts{color:#f2dc7a}\n.cr{color:#f2a7b8}\n.fr{border:2px solid rgba(238,240,230,.6);border-radius:50%;width:14px;height:14px}"
    }
  },
  "data": {
    "rooms": {
      "from": "school",
      "path": "/school/rooms",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "c1-1": {
          "at": "/value/c1-1"
        },
        "c1-2": {
          "at": "/value/c1-2"
        },
        "c1-3": {
          "at": "/value/c1-3"
        },
        "c1-4": {
          "at": "/value/c1-4"
        },
        "science": {
          "at": "/value/science"
        },
        "music": {
          "at": "/value/music"
        },
        "c2-1": {
          "at": "/value/c2-1"
        },
        "c2-2": {
          "at": "/value/c2-2"
        },
        "c2-3": {
          "at": "/value/c2-3"
        },
        "c2-4": {
          "at": "/value/c2-4"
        },
        "library": {
          "at": "/value/library"
        },
        "nurse": {
          "at": "/value/nurse"
        }
      }
    },
    "lunch": {
      "from": "school",
      "path": "/school/lunch",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "notes": {
      "from": "school",
      "path": "/school/notes",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "school",
      "path": "/school/now",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "name": {},
        "date": {},
        "period": {},
        "time": {}
      }
    },
    "attendance": {
      "from": "school",
      "path": "/school/attendance",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "absences": {
      "from": "school",
      "path": "/school/absences",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "room-c1-1": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c1-1"
      }
    },
    "room-c1-2": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c1-2"
      }
    },
    "room-c1-3": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c1-3"
      }
    },
    "room-c1-4": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c1-4"
      }
    },
    "room-science": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "science"
      }
    },
    "room-music": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "music"
      }
    },
    "room-c2-1": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c2-1"
      }
    },
    "room-c2-2": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c2-2"
      }
    },
    "room-c2-3": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c2-3"
      }
    },
    "room-c2-4": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "c2-4"
      }
    },
    "room-library": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "library"
      }
    },
    "room-nurse": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "nurse"
      }
    },
    "lunch": {
      "as": "element",
      "element": "lunch",
      "of": "lunch",
      "bind": {
        "items": "value"
      }
    },
    "notes": {
      "as": "element",
      "element": "notes",
      "of": "notes",
      "bind": {
        "items": "value"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "name": "name",
        "date": "date",
        "period": "period",
        "time": "time"
      }
    },
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "attendance",
      "bind": {
        "items": "value"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "absences": {
      "as": "chart.bar",
      "of": "absences",
      "title": "최근 2주 결석(명)",
      "x": "day",
      "y": "absent",
      "series": [
        {
          "label": "결석",
          "color": "#a9d3ef"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%238a5a34%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%221564%22%20height%3D%22940%22%20rx%3D%226%22%20fill%3D%22%232e4537%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%22958%22%20width%3D%221564%22%20height%3D%2224%22%20fill%3D%22%236e4526%22%2F%3E%0A%3Crect%20x%3D%22300%22%20y%3D%22950%22%20width%3D%2246%22%20height%3D%2210%22%20rx%3D%223%22%20fill%3D%22%23eef0e6%22%2F%3E%3Crect%20x%3D%22360%22%20y%3D%22950%22%20width%3D%2238%22%20height%3D%2210%22%20rx%3D%223%22%20fill%3D%22%23f2dc7a%22%2F%3E%3Crect%20x%3D%221220%22%20y%3D%22946%22%20width%3D%2290%22%20height%3D%2216%22%20rx%3D%224%22%20fill%3D%22%23555%22%2F%3E%0A%3Cellipse%20cx%3D%22400%22%20cy%3D%22120%22%20rx%3D%22260%22%20ry%3D%2240%22%20transform%3D%22rotate(-4%20400%20120)%22%20fill%3D%22%23eef0e6%22%20fill-opacity%3D%22.05%22%2F%3E%3Cellipse%20cx%3D%22900%22%20cy%3D%22820%22%20rx%3D%22300%22%20ry%3D%2250%22%20transform%3D%22rotate(3%20900%20820)%22%20fill%3D%22%23eef0e6%22%20fill-opacity%3D%22.05%22%2F%3E%3Cellipse%20cx%3D%221380%22%20cy%3D%22600%22%20rx%3D%22180%22%20ry%3D%2260%22%20transform%3D%22rotate(-8%201380%20600)%22%20fill%3D%22%23eef0e6%22%20fill-opacity%3D%22.05%22%2F%3E%0A%3Cpath%20d%3D%22M60%2096%20H1084%20M60%2096%20V584%20M1084%2096%20V584%20M60%20584%20H1084%22%20stroke%3D%22%23eef0e6%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M60%20324%20H1084%20M60%20356%20H1084%22%20stroke%3D%22%23eef0e6%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%20stroke-dasharray%3D%2214%2010%22%2F%3E%0A%3Ctext%20x%3D%2276%22%20y%3D%22347%22%20fill%3D%22%23eef0e6%22%20fill-opacity%3D%22.7%22%20font-size%3D%2218%22%20font-family%3D'%22Gaegu%22%2C%20%22Nanum%20Pen%20Script%22%2C%20%22Comic%20Sans%20MS%22%2C%20%22Noto%20Sans%20KR%22%2C%20cursive'%3E%EB%B3%B5%20%EB%8F%84%3C%2Ftext%3E%0A%3Ctext%20x%3D%221030%22%20y%3D%22347%22%20fill%3D%22%23eef0e6%22%20fill-opacity%3D%22.7%22%20font-size%3D%2218%22%20font-family%3D'%22Gaegu%22%2C%20%22Nanum%20Pen%20Script%22%2C%20%22Comic%20Sans%20MS%22%2C%20%22Noto%20Sans%20KR%22%2C%20cursive'%3E%EA%B3%84%EB%8B%A8%3C%2Ftext%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%2278%22%20fill%3D%22%23f2dc7a%22%20font-size%3D%2226%22%20font-family%3D'%22Gaegu%22%2C%20%22Nanum%20Pen%20Script%22%2C%20%22Comic%20Sans%20MS%22%2C%20%22Noto%20Sans%20KR%22%2C%20cursive'%20font-weight%3D%22700%22%3E2%EC%B8%B5%20%EA%B5%90%EC%8B%A4%20%EB%B0%B0%EC%B9%98%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M66%2084%20q120%206%20210%200%22%20stroke%3D%22%23f2dc7a%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22640%22%20fill%3D%22%23f2a7b8%22%20font-size%3D%2226%22%20font-family%3D'%22Gaegu%22%2C%20%22Nanum%20Pen%20Script%22%2C%20%22Comic%20Sans%20MS%22%2C%20%22Noto%20Sans%20KR%22%2C%20cursive'%20font-weight%3D%22700%22%3E%EC%A0%90%EC%8B%AC%20%C2%B7%20%EC%98%A4%EB%8A%98%20%EC%95%8C%EB%A6%BC%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M66%20646%20q120%206%20230%200%22%20stroke%3D%22%23f2a7b8%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Cline%20x1%3D%221120%22%20y1%3D%2270%22%20x2%3D%221120%22%20y2%3D%22920%22%20stroke%3D%22%23eef0e6%22%20stroke-opacity%3D%220.35%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "room-c1-1": [
        80,
        126,
        160,
        170
      ],
      "room-c1-2": [
        248,
        126,
        160,
        170
      ],
      "room-c1-3": [
        416,
        126,
        160,
        170
      ],
      "room-c1-4": [
        584,
        126,
        160,
        170
      ],
      "room-science": [
        752,
        126,
        160,
        170
      ],
      "room-music": [
        920,
        126,
        160,
        170
      ],
      "room-c2-1": [
        80,
        384,
        160,
        170
      ],
      "room-c2-2": [
        248,
        384,
        160,
        170
      ],
      "room-c2-3": [
        416,
        384,
        160,
        170
      ],
      "room-c2-4": [
        584,
        384,
        160,
        170
      ],
      "room-library": [
        752,
        384,
        160,
        170
      ],
      "room-nurse": [
        920,
        384,
        160,
        170
      ],
      "lunch": [
        80,
        674,
        470,
        230
      ],
      "notes": [
        580,
        674,
        500,
        230
      ],
      "title": [
        1146,
        50,
        430,
        180
      ],
      "figures": [
        1146,
        250,
        430,
        120
      ],
      "legend": [
        1146,
        392,
        430,
        40
      ],
      "absences": [
        1146,
        456,
        430,
        470
      ]
    }
  }
};

export const schoolChalkboard: SamplePack = {
  id: "school-chalkboard",
  title: {
    "ko": "중학교 하루 — 칠판과 분필",
    "en": "A middle school’s day — chalk on a blackboard"
  },
  field: {
    "ko": "교육·학교",
    "en": "Education & schools"
  },
  kind: {
    "ko": "교실 배치·출결·점심 순서",
    "en": "Classrooms, attendance and the lunch rota"
  },
  domain: "education",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "중학교의 하루를 칠판에 분필로 — 나무 받침이 달린 짙은 녹색 칠판, 분필 선으로 그린 2층 교실 배치, 노랑·분홍·하늘색 분필 제목. 교실마다 지금 누가 무엇을 하는지, 특별실은 어느 반이 와 있는지 적혀 있어, 과학 수업으로 옮긴 반은 제 교실이 비고 복도 끝 과학실이 찹니다. 상태는 색과 함께 분필 기호로: ● 수업 중, → 이동 수업, ✎ 시험, + 보건, 빈 원 비어 있음 — 아무도 없는 방은 테두리가 점선. 아래에는 점심 순서와 오늘 알림, 오른쪽에 교시와 시각, 오늘 출결, 최근 2주 결석. 학교는 지어낸 것이라 예시 데이터입니다.",
    "en": "A middle school’s day chalked on a blackboard — the slate-green board on its wooden ledge, the second floor’s rooms drawn in chalk lines, headings in yellow, pink and blue chalk. Each classroom says who is in it and what they are doing; each special room which class came to it, so a class that moved for science leaves its own room empty and fills the lab down the corridor. A room tells its state with a chalk sign as well as a colour — ● in lesson, → moved out, ✎ a test, + the nurse, an empty ring free — and a room nobody is in has a dashed outline. Along the bottom the lunch rota and the day’s notes; on the right the period and the clock, today’s attendance and the absences of the last two weeks. The school is made up. Example data."
  },
  connectors: [
    {
      "key": "school",
      "name": "예시 학사 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 학교가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
