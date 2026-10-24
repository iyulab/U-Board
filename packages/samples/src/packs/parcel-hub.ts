// A parcel hub's night sort modelled in soft clay: a warm pastel floor, every part a rounded lump of matte clay with a
// light top edge and a soft shadow under it, chunky rounded type. The dock doors stand along the top, each with its
// truck's state; the four sorting lines run across the floor as long clay belts saying how many parcels an hour they
// move; the rework table sits beside them; and along the bottom every region's outbound cart fills like a jar. The state
// of a line or a dock is told by a sign as well as a colour — a play mark running, a double bang jammed, a square
// stopped; a down arrow unloading, three dots waiting, an empty ring free — and the carts that are nearly full get a
// coral rim. On the right the night's count, the rate now and the parcels in rework, and the parcels by the hour. The
// hub is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/parcel-hub.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#f4a98a"
  },
  "elements": {
    "dock": {
      "template": "<section class=\"dk {{d.state}}\"><b>{{d.name}}</b><p><i></i>{{d.word}}</p><small>{{d.note}}</small></section>",
      "style": ".dk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:10px 14px;background:#fff8f2;border-radius:26px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18);font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\nb{font-size:15px;font-weight:900}\np{margin:0;display:flex;align-items:center;gap:6px;font-size:17px;font-weight:800}\nsmall{font-size:12px;font-weight:600}\ni{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:900 14px \"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;font-style:normal;color:#4a3f45}\n.unload i{background:#f4a98a}\n.unload i::after{content:\"↓\"}\n.wait i{background:#f6d67a}\n.wait i::after{content:\"…\"}\n.empty i{border:3px solid #cfc5c0;box-sizing:border-box}\n.empty{color:#8b7f84}",
      "props": {
        "d": "object"
      }
    },
    "line": {
      "template": "<section class=\"ln {{l.state}}\"><i></i><div><b>{{l.name}}</b><small>{{l.note}}</small></div><strong>{{l.rate}}</strong><span>{{l.word}}</span></section>",
      "style": ".ln{height:100%;box-sizing:border-box;display:grid;grid-template-columns:44px 1fr auto auto;align-items:center;gap:14px;padding:0 18px;background:#8fd3b8;border-radius:46px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18);font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\ni{width:40px;height:40px;border-radius:50%;background:#fff8f2;display:grid;place-items:center;font:900 18px \"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;font-style:normal;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}\ndiv{display:grid}\nb{font-size:19px;font-weight:900}\nsmall{font-size:13px;font-weight:600}\nstrong{font-size:20px;font-weight:900}\nspan{padding:3px 12px;border-radius:999px;background:#fff8f2;font-size:14px;font-weight:900}\n.run i::after{content:\"▶\"}\n.jam{background:#ef6b5b;color:#fff}\n.jam i{color:#ef6b5b}\n.jam i::after{content:\"‼\"}\n.jam span{color:#ef6b5b}\n.stop{background:#cfc5c0}\n.stop i::after{content:\"■\"}",
      "props": {
        "l": "object"
      }
    },
    "rework": {
      "template": "<section class=\"rw\"><span>재작업대</span><b>{{r.count}}</b><small>{{r.note}}</small></section>",
      "style": ".rw{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:4px;background:#c3b5f0;border-radius:40px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18);font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45;text-align:center}\nspan{font-size:16px;font-weight:900}\nb{font-size:52px;font-weight:900;line-height:1}\nsmall{font-size:13px;font-weight:700}",
      "props": {
        "r": "object"
      }
    },
    "chutes": {
      "template": "<ol class=\"ch\">{{#items}}<li class=\"{{state}}\" style=\"--p: {{fill}}\"><i><u></u></i><b>{{fill}}%</b><span>{{region}}</span></li>{{/items}}</ol>",
      "style": ".ch{margin:0;padding:0;height:100%;box-sizing:border-box;list-style:none;display:grid;grid-template-columns:repeat(8,1fr);gap:14px;font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\nli{display:grid;grid-template-rows:1fr auto auto;justify-items:center;gap:4px}\ni{position:relative;width:70%;border-radius:22px 22px 28px 28px;background:#fff8f2;box-shadow:inset 0 4px 0 rgba(255,255,255,.6),0 8px 14px rgba(74,63,69,.15);overflow:hidden;border:4px solid #fff8f2;box-sizing:border-box}\nu{position:absolute;left:0;right:0;bottom:0;height:calc(var(--p) * 1%);background:#9cc8f0;border-radius:16px 16px 22px 22px}\n.near i{border-color:#ef6b5b}\n.near b{color:#ef6b5b}\nb{font-size:18px;font-weight:900}\nspan{font-size:13px;font-weight:800}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;padding:16px 22px;background:#f6d67a;border-radius:36px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18);font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\nh1{margin:0;font-size:34px;font-weight:900}\np{margin:0;font-size:15px;font-weight:700}\ndiv{display:flex;align-items:center;gap:12px}\nspan{font-size:16px;font-weight:700}\nb{margin-left:auto;padding:2px 16px;border-radius:999px;background:#fff8f2;font-size:34px;font-weight:900}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;padding:8px;background:#fff8f2;border-radius:30px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18)}\ndiv:nth-child(3){background:#c3b5f0}\ndt{font-size:13px;font-weight:800}\ndd{margin:0;font-size:28px;font-weight:900}\nsmall{font-size:11px;font-weight:700}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"run\">▶</i>가동</li><li><i class=\"jam\">‼</i>정체</li><li><i class=\"stop\">■</i>정지</li><li><i class=\"un\">↓</i>하차 중</li><li><i class=\"wt\">…</i>대기</li><li><i class=\"em\"></i>비어 있음</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fff8f2;border-radius:999px;box-shadow:inset 0 6px 0 rgba(255,255,255,.45),inset 0 -8px 0 rgba(0,0,0,.08),0 10px 18px rgba(74,63,69,.18);font:800 13px \"Nunito\", \"Jua\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#4a3f45}\nli{display:flex;align-items:center;gap:5px}\ni{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;box-sizing:border-box}\n.run{background:#8fd3b8}\n.jam{background:#ef6b5b;color:#fff}\n.stop{background:#cfc5c0}\n.un{background:#f4a98a}\n.wt{background:#f6d67a}\n.em{border:3px solid #cfc5c0}"
    }
  },
  "data": {
    "docks": {
      "from": "hub",
      "path": "/hub/docks",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "d1": {
          "at": "/value/d1"
        },
        "d2": {
          "at": "/value/d2"
        },
        "d3": {
          "at": "/value/d3"
        },
        "d4": {
          "at": "/value/d4"
        },
        "d5": {
          "at": "/value/d5"
        },
        "d6": {
          "at": "/value/d6"
        }
      }
    },
    "lines": {
      "from": "hub",
      "path": "/hub/lines",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "l1": {
          "at": "/value/l1"
        },
        "l2": {
          "at": "/value/l2"
        },
        "l3": {
          "at": "/value/l3"
        },
        "l4": {
          "at": "/value/l4"
        }
      }
    },
    "rework": {
      "from": "hub",
      "path": "/hub/rework",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "chutes": {
      "from": "hub",
      "path": "/hub/chutes",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "hub",
      "path": "/hub/now",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "hub",
      "path": "/hub/figures",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "hub",
      "path": "/hub/hours",
      "list": "/value",
      "fresh": 180,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "dock-d1": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d1"
      }
    },
    "dock-d2": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d2"
      }
    },
    "dock-d3": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d3"
      }
    },
    "dock-d4": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d4"
      }
    },
    "dock-d5": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d5"
      }
    },
    "dock-d6": {
      "as": "element",
      "element": "dock",
      "of": "docks",
      "bind": {
        "d": "d6"
      }
    },
    "line-l1": {
      "as": "element",
      "element": "line",
      "of": "lines",
      "bind": {
        "l": "l1"
      }
    },
    "line-l2": {
      "as": "element",
      "element": "line",
      "of": "lines",
      "bind": {
        "l": "l2"
      }
    },
    "line-l3": {
      "as": "element",
      "element": "line",
      "of": "lines",
      "bind": {
        "l": "l3"
      }
    },
    "line-l4": {
      "as": "element",
      "element": "line",
      "of": "lines",
      "bind": {
        "l": "l4"
      }
    },
    "rework": {
      "as": "element",
      "element": "rework",
      "of": "rework",
      "bind": {
        "r": "value"
      }
    },
    "chutes": {
      "as": "element",
      "element": "chutes",
      "of": "chutes",
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
        "sub": "sub",
        "date": "date",
        "time": "time"
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
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "hours": {
      "as": "chart.bar",
      "of": "hours",
      "title": "시간대별 처리(개) — 23시는 40분까지",
      "x": "hour",
      "y": "parcels",
      "series": [
        {
          "label": "처리",
          "color": "#9cc8f0"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f3e7df%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20rx%3D%2248%22%20fill%3D%22%23eedfd5%22%2F%3E%0A%3Crect%20x%3D%2256%22%20y%3D%22232%22%20width%3D%221008%22%20height%3D%22460%22%20rx%3D%2240%22%20fill%3D%22%23e8d6cb%22%2F%3E%0A%3Cellipse%20cx%3D%221010%22%20cy%3D%22210%22%20rx%3D%2226%22%20ry%3D%2214%22%20fill%3D%22%23c3b5f0%22%2F%3E%3Cellipse%20cx%3D%221002.2%22%20cy%3D%22205.1%22%20rx%3D%229.1%22%20ry%3D%223.08%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.45%22%2F%3E%3Cellipse%20cx%3D%2290%22%20cy%3D%22712%22%20rx%3D%2230%22%20ry%3D%2216%22%20fill%3D%22%239cc8f0%22%2F%3E%3Cellipse%20cx%3D%2281%22%20cy%3D%22706.4%22%20rx%3D%2210.5%22%20ry%3D%223.52%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.45%22%2F%3E%3Cellipse%20cx%3D%221030%22%20cy%3D%22714%22%20rx%3D%2222%22%20ry%3D%2212%22%20fill%3D%22%23f6d67a%22%2F%3E%3Cellipse%20cx%3D%221023.4%22%20cy%3D%22709.8%22%20rx%3D%227.699999999999999%22%20ry%3D%222.64%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.45%22%2F%3E%0A%3Ctext%20x%3D%2276%22%20y%3D%22270%22%20fill%3D%22%234a3f45%22%20font-size%3D%2216%22%20font-family%3D'%22Nunito%22%2C%20%22Jua%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20font-weight%3D%22800%22%20letter-spacing%3D%22.1em%22%3E%EB%B6%84%EB%A5%98%EC%9E%A5%3C%2Ftext%3E%0A%3Ctext%20x%3D%2276%22%20y%3D%22752%22%20fill%3D%22%234a3f45%22%20font-size%3D%2216%22%20font-family%3D'%22Nunito%22%2C%20%22Jua%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20font-weight%3D%22800%22%20letter-spacing%3D%22.1em%22%3E%EC%A7%80%EC%97%AD%EB%B3%84%20%EC%B6%9C%EA%B3%A0%20%EC%B9%B4%ED%8A%B8%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "dock-d1": [
        70,
        70,
        152,
        116
      ],
      "dock-d2": [
        238,
        70,
        152,
        116
      ],
      "dock-d3": [
        406,
        70,
        152,
        116
      ],
      "dock-d4": [
        574,
        70,
        152,
        116
      ],
      "dock-d5": [
        742,
        70,
        152,
        116
      ],
      "dock-d6": [
        910,
        70,
        152,
        116
      ],
      "line-l1": [
        76,
        290,
        760,
        86
      ],
      "line-l2": [
        76,
        388,
        760,
        86
      ],
      "line-l3": [
        76,
        486,
        760,
        86
      ],
      "line-l4": [
        76,
        584,
        760,
        86
      ],
      "rework": [
        856,
        360,
        200,
        220
      ],
      "chutes": [
        70,
        770,
        1000,
        170
      ],
      "title": [
        1120,
        40,
        460,
        170
      ],
      "figures": [
        1120,
        236,
        460,
        110
      ],
      "legend": [
        1120,
        372,
        460,
        44
      ],
      "hours": [
        1120,
        446,
        460,
        510
      ]
    }
  }
};

export const parcelHub: SamplePack = {
  id: "parcel-hub",
  title: {
    "ko": "소포 분류센터 야간 분류 — 클레이 3D",
    "en": "A parcel hub’s night sort — soft clay"
  },
  field: {
    "ko": "우편·택배 물류",
    "en": "Parcels & postal logistics"
  },
  kind: {
    "ko": "도크·분류 라인·지역별 출고 카트",
    "en": "Docks, sorting lines and outbound carts by region"
  },
  domain: "logistics",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "소포 분류센터의 야간 분류를 말랑한 클레이 3D로 — 따뜻한 파스텔 바닥, 위쪽이 밝고 아래에 부드러운 그림자가 지는 무광 점토 덩어리, 둥글고 굵은 글자. 위에는 도크마다 트럭 상태, 가운데는 길쭉한 점토 벨트 넷이 시간당 처리량을, 옆에는 재작업대, 아래에는 지역별 출고 카트가 병처럼 차오릅니다. 라인과 도크의 상태는 색과 함께 기호로: ▶ 가동, ‼ 정체, ■ 정지, ↓ 하차 중, … 대기, 빈 원 비어 있음 — 거의 찬 카트는 산호색 테. 오른쪽에 오늘 처리·지금 처리·재작업, 시간대별 처리. 센터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A parcel hub’s night sort modelled in soft clay — a warm pastel floor, matte clay lumps lit along the top with a soft shadow under them, chunky rounded type. Along the top each dock door with its truck’s state, across the floor four long clay belts with the parcels they move an hour, the rework table beside them, and along the bottom every region’s outbound cart filling like a jar. Lines and docks tell their state with a sign as well as a colour — ▶ running, ‼ jammed, ■ stopped, ↓ unloading, … waiting, an empty ring free — and the nearly full carts get a coral rim. On the right the night’s count, the rate now and the parcels in rework, and the parcels by the hour. The hub is made up. Example data."
  },
  connectors: [
    {
      "key": "hub",
      "name": "예시 분류센터 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 분류센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
