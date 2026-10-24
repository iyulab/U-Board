// An animal hospital's afternoon drawn as a comic book page: newsprint dotted with halftone, every room a panel with a
// heavy black border, a yellow caption box naming it and the room's line in a balloon. A room's state is told the way a
// comic tells a scene, as well as by a colour — the balloon's shape: a speech balloon while a patient is seen, a dotted
// thought balloon when the room stands empty, a jagged burst in red for an emergency, a cloud while it is being cleaned —
// and a sound effect in the panel's corner. The two wards are panels of kennels, each a box with its patient, hatched
// when it is watched closely and dashed when free. Below, the waiting room's queue; on the right the masthead, the
// figures in starbursts, the key and the patients registered by the hour. The hospital is made up, so the values are
// example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/vet-comic.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#e23b2e"
  },
  "elements": {
    "room": {
      "template": "<article class=\"pn {{r.state}}\"><header><b>{{r.room}}</b><i></i></header><div class=\"bb\"><p>{{r.line}}</p></div><dl><dt>환자</dt><dd>{{r.patient}}</dd><dt>담당</dt><dd>{{r.vet}}</dd><dt>경과</dt><dd>{{r.elapsed}}</dd></dl></article>",
      "style": ".pn{height:100%;box-sizing:border-box;border:5px solid #141414;box-shadow:5px 5px 0 #141414;background:radial-gradient(circle,#cfe6f2 1.3px,transparent 1.6px) 0 0/7px 7px,#fff8ea;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:12px 14px 12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;overflow:hidden}\nheader{display:flex;justify-content:space-between;align-items:flex-start}\nheader b{display:inline-block;padding:3px 10px;background:#ffd23f;border:3px solid #141414;font:900 17px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;transform:rotate(-2deg)}\ni{font:900 24px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-style:normal;color:#141414;transform:rotate(6deg);-webkit-text-stroke:1px #141414}\n.bb{position:relative;display:grid;place-items:center;margin:2px 14px 12px;padding:10px 14px;background:#ffffff;border:3px solid #141414;border-radius:50% / 46%}\n.bb::after{content:\"\";position:absolute;bottom:-17px;left:30%;width:22px;height:17px;background:#141414;clip-path:polygon(0 0,100% 0,10% 100%)}\np{margin:0;font:800 17px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;text-align:center;line-height:1.3}\ndl{margin:0;display:grid;grid-template-columns:auto 1fr;column-gap:10px;row-gap:1px;font-size:14px;background:#ffffff;border:2px solid #141414;padding:5px 9px}\ndt{font-weight:700}\ndd{margin:0;text-align:right}\n.busy i::before{content:\"끄덕끄덕\"}\n.free .bb{border-style:dashed;border-radius:46%}\n.free .bb::after{width:18px;height:13px;bottom:-22px;left:26%;border-radius:50%;clip-path:none;background:#ffffff;border:2px solid #141414}\n.free .bb::before{content:\"\";position:absolute;width:9px;height:7px;bottom:-34px;left:22%;border-radius:50%;background:#ffffff;border:2px solid #141414}\n.free p{font-weight:600;color:#555}\n.free i::before{content:\"쉿…\";color:#777}\n.urgent{background:radial-gradient(circle,#f7b9a8 1.3px,transparent 1.6px) 0 0/7px 7px,#fff8ea}\n.urgent .bb{border:none;border-radius:0;background:#141414;clip-path:polygon(50% 0,61% 22%,85% 8%,78% 33%,100% 38%,80% 54%,96% 76%,70% 72%,64% 100%,50% 79%,36% 100%,30% 72%,4% 76%,20% 54%,0 38%,22% 33%,15% 8%,39% 22%);padding:30px 40px;margin:0}\n.urgent .bb::before{content:\"\";position:absolute;inset:4px;background:#e23b2e;clip-path:polygon(50% 0,61% 22%,85% 8%,78% 33%,100% 38%,80% 54%,96% 76%,70% 72%,64% 100%,50% 79%,36% 100%,30% 72%,4% 76%,20% 54%,0 38%,22% 33%,15% 8%,39% 22%)}\n.urgent .bb::after{display:none}\n.urgent p{position:relative;color:#ffffff;font:900 17px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\n.urgent i::before{content:\"삐뽀!\";color:#ffd23f;-webkit-text-stroke:1.5px #141414;font-size:30px}\n.clean .bb{border-radius:40% 44% 38% 46% / 52% 48% 56% 44%;border-color:#3fb0e0;border-width:4px;box-shadow:0 0 0 3px #ffffff,0 0 0 5px #141414}\n.clean .bb::after{display:none}\n.clean i::before{content:\"치익—\";color:#3fb0e0;-webkit-text-stroke:1px #141414}",
      "props": {
        "r": "object"
      }
    },
    "ward": {
      "template": "<article class=\"wd\"><header><b>{{w.room}}</b><span><strong>{{w.used}}</strong> / {{w.of}}</span></header><ol>{{#w.kennels}}<li class=\"{{state}}\"><b>{{name}}</b><small>{{note}}</small></li>{{/w.kennels}}</ol><p>{{w.note}}</p></article>",
      "style": ".wd{height:100%;box-sizing:border-box;border:5px solid #141414;box-shadow:5px 5px 0 #141414;background:radial-gradient(circle,#cfe6f2 1.3px,transparent 1.6px) 0 0/7px 7px,#fff8ea;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:12px 14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;overflow:hidden}\nheader{display:flex;justify-content:space-between;align-items:center}\nheader b{display:inline-block;padding:3px 10px;background:#ffd23f;border:3px solid #141414;font:900 17px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;transform:rotate(-2deg)}\nspan{font:900 18px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nstrong{font-size:30px}\nol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:8px}\nli{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;background:#ffffff;border:3px solid #141414;padding:2px;overflow:hidden}\nli b{font:900 16px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nli small{font-size:11px;line-height:1.2}\n.watch{background:repeating-linear-gradient(-45deg,#ffffff 0 5px,#ffd9d2 5px 10px)}\n.watch b::after{content:\" !\";color:#e23b2e}\n.watch small{color:#e23b2e;font-weight:700}\n.empty{border-style:dashed;background:transparent;color:#777}\n.empty b{font:600 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\np{margin:0;font-size:13px;background:#ffffff;border:2px solid #141414;padding:4px 8px}",
      "props": {
        "w": "object"
      }
    },
    "queue": {
      "template": "<section class=\"qu\"><header><b>대기실</b><span>접수 순서 — 응급은 먼저</span></header><ol>{{#items}}<li class=\"{{state}}\"><b>{{no}}</b><strong>{{name}}</strong><span>{{kind}}</span><em>{{why}}</em><small>{{wait}}</small><i>{{word}}</i></li>{{/items}}</ol></section>",
      "style": ".qu{height:100%;box-sizing:border-box;border:5px solid #141414;box-shadow:5px 5px 0 #141414;background:radial-gradient(circle,#cfe6f2 1.3px,transparent 1.6px) 0 0/7px 7px,#fff8ea;background:radial-gradient(circle,#f3e2a6 1.3px,transparent 1.6px) 0 0/7px 7px,#fff8ea;padding:12px 18px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;overflow:hidden}\nheader{display:flex;align-items:center;gap:14px;margin-bottom:8px}\nheader b{display:inline-block;padding:3px 10px;background:#ffd23f;border:3px solid #141414;font:900 17px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414;transform:rotate(-2deg)}\nheader span{font-size:14px;font-style:italic}\nol{margin:0;padding:0;list-style:none;display:grid;gap:3px}\nli{display:grid;grid-template-columns:52px 110px 130px 1fr 70px 96px;align-items:center;gap:10px;font-size:14px;background:#ffffff;border:2px solid #141414;padding:1px 10px}\nli b{font:900 15px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nstrong{font:900 16px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nem{font-style:normal}\nsmall{text-align:right;font-weight:700}\ni{font-style:normal;font-weight:800;text-align:center;border-radius:999px;border:2px solid #141414;padding:1px 0}\n.wait i::before{content:\"○ \"}\n.called i{background:#ffd23f}\n.called i::before{content:\"▶ \"}\n.urgent{background:#e23b2e;color:#ffffff}\n.urgent i{background:#141414;color:#ffd23f;border-color:#141414}\n.urgent i::before{content:\"✱ \"}",
      "props": {
        "items": "list"
      }
    },
    "masthead": {
      "template": "<header class=\"mh\"><small>{{m.series}}</small><h1>{{m.name}}</h1><div><span>{{m.date}}</span><b>{{m.time}}</b></div></header>",
      "style": ".mh{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:12px 22px;border:5px solid #141414;box-shadow:5px 5px 0 #141414;background:radial-gradient(circle,#f28a6a 1.3px,transparent 1.6px) 0 0/9px 9px,#ffd23f;color:#141414}\nsmall{justify-self:start;padding:2px 10px;background:#141414;color:#ffd23f;font:900 14px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.08em;transform:rotate(-2deg)}\nh1{margin:0;font:900 52px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#ffffff;-webkit-text-stroke:3px #141414;paint-order:stroke fill;text-shadow:4px 4px 0 #e23b2e;letter-spacing:.02em}\ndiv{display:flex;justify-content:space-between;align-items:baseline;font:700 17px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nb{font:900 30px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;background:#ffffff;border:3px solid #141414;padding:0 10px}",
      "props": {
        "m": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414}\ndiv{position:relative;display:grid;align-content:center;justify-items:center;text-align:center;padding:0 22px}\ndiv::before{content:\"\";position:absolute;inset:0;background:#141414;clip-path:polygon(50.0% 0.0%,58.0% 9.8%,69.1% 3.8%,72.8% 15.9%,85.4% 14.6%,84.1% 27.2%,96.2% 30.9%,90.2% 42.0%,100.0% 50.0%,90.2% 58.0%,96.2% 69.1%,84.1% 72.8%,85.4% 85.4%,72.8% 84.1%,69.1% 96.2%,58.0% 90.2%,50.0% 100.0%,42.0% 90.2%,30.9% 96.2%,27.2% 84.1%,14.6% 85.4%,15.9% 72.8%,3.8% 69.1%,9.8% 58.0%,0.0% 50.0%,9.8% 42.0%,3.8% 30.9%,15.9% 27.2%,14.6% 14.6%,27.2% 15.9%,30.9% 3.8%,42.0% 9.8%)}\ndiv::after{content:\"\";position:absolute;inset:5px;background:#ffffff;clip-path:polygon(50.0% 0.0%,58.0% 9.8%,69.1% 3.8%,72.8% 15.9%,85.4% 14.6%,84.1% 27.2%,96.2% 30.9%,90.2% 42.0%,100.0% 50.0%,90.2% 58.0%,96.2% 69.1%,84.1% 72.8%,85.4% 85.4%,72.8% 84.1%,69.1% 96.2%,58.0% 90.2%,50.0% 100.0%,42.0% 90.2%,30.9% 96.2%,27.2% 84.1%,14.6% 85.4%,15.9% 72.8%,3.8% 69.1%,9.8% 58.0%,0.0% 50.0%,9.8% 42.0%,3.8% 30.9%,15.9% 27.2%,14.6% 14.6%,27.2% 15.9%,30.9% 3.8%,42.0% 9.8%)}\ndt,dd,small{position:relative;z-index:1}\ndt{font:800 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\ndd{margin:0;font:900 30px \"Black Han Sans\", \"Jua\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#e23b2e;-webkit-text-stroke:1px #141414}\nsmall{font-size:11px;font-weight:700}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"busy\"></i>말풍선 — 진료 중</li><li><i class=\"free\"></i>생각 풍선 — 빔</li><li><i class=\"urgent\"></i>터짐 — 응급</li><li><i class=\"clean\"></i>구름 — 소독</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;justify-content:space-between;border:4px solid #141414;background:#ffffff;font:700 13px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#141414}\nli{display:flex;align-items:center;gap:6px}\ni{width:26px;height:18px;box-sizing:border-box;display:block}\n.busy{border:2px solid #141414;border-radius:50%}\n.free{border:2px dashed #141414;border-radius:46%}\n.urgent{background:#e23b2e;clip-path:polygon(50% 0,61% 22%,85% 8%,78% 33%,100% 38%,80% 54%,96% 76%,70% 72%,64% 100%,50% 79%,36% 100%,30% 72%,4% 76%,20% 54%,0 38%,22% 33%,15% 8%,39% 22%);width:24px;height:24px}\n.clean{border:3px solid #3fb0e0;border-radius:40% 44% 38% 46% / 52% 48% 56% 44%}"
    }
  },
  "data": {
    "rooms": {
      "from": "clinic",
      "path": "/clinic/rooms",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "exam1": {
          "at": "/value/exam1"
        },
        "exam2": {
          "at": "/value/exam2"
        },
        "surgery": {
          "at": "/value/surgery"
        },
        "treatment": {
          "at": "/value/treatment"
        }
      }
    },
    "wards": {
      "from": "clinic",
      "path": "/clinic/wards",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "dogs": {
          "at": "/value/dogs"
        },
        "cats": {
          "at": "/value/cats"
        }
      }
    },
    "queue": {
      "from": "clinic",
      "path": "/clinic/queue",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "clinic",
      "path": "/clinic/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "clinic",
      "path": "/clinic/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "registered": {
      "from": "clinic",
      "path": "/clinic/registered",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "room-exam1": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "exam1"
      }
    },
    "room-exam2": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "exam2"
      }
    },
    "room-surgery": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "surgery"
      }
    },
    "room-treatment": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "treatment"
      }
    },
    "ward-dogs": {
      "as": "element",
      "element": "ward",
      "of": "wards",
      "bind": {
        "w": "dogs"
      }
    },
    "ward-cats": {
      "as": "element",
      "element": "ward",
      "of": "wards",
      "bind": {
        "w": "cats"
      }
    },
    "queue": {
      "as": "element",
      "element": "queue",
      "of": "queue",
      "bind": {
        "items": "value"
      }
    },
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "m": "value"
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
    "registered": {
      "as": "chart.bar",
      "of": "registered",
      "title": "시간별 접수(마리) — 15시는 20분까지",
      "x": "hour",
      "y": "patients",
      "series": [
        {
          "label": "접수",
          "color": "#3fb0e0"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22d%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%221.4%22%20fill%3D%22%23f1d9c2%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fff8ea%22%2F%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23d)%22%2F%3E%0A%3Crect%20x%3D%2212%22%20y%3D%2212%22%20width%3D%221576%22%20height%3D%22976%22%20fill%3D%22none%22%20stroke%3D%22%23141414%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%221035%22%20y%3D%22481%22%20width%3D%22540%22%20height%3D%22480%22%20fill%3D%22%23141414%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22476%22%20width%3D%22540%22%20height%3D%22480%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23141414%22%20stroke-width%3D%225%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "room-exam1": [
        40,
        40,
        310,
        290
      ],
      "room-exam2": [
        365,
        40,
        310,
        290
      ],
      "room-surgery": [
        690,
        40,
        310,
        290
      ],
      "room-treatment": [
        40,
        345,
        310,
        290
      ],
      "ward-dogs": [
        365,
        345,
        310,
        290
      ],
      "ward-cats": [
        690,
        345,
        310,
        290
      ],
      "queue": [
        40,
        652,
        960,
        318
      ],
      "masthead": [
        1030,
        40,
        540,
        170
      ],
      "figures": [
        1030,
        228,
        540,
        150
      ],
      "legend": [
        1030,
        396,
        540,
        56
      ],
      "registered": [
        1050,
        496,
        500,
        440
      ]
    }
  }
};

export const vetComic: SamplePack = {
  id: "vet-comic",
  title: {
    "ko": "동물병원의 오후 — 만화책 지면",
    "en": "An animal hospital’s afternoon — a comic book page"
  },
  field: {
    "ko": "동물병원·반려동물",
    "en": "Veterinary care & pets"
  },
  kind: {
    "ko": "진료실·입원장·대기실·접수",
    "en": "Rooms, kennels, the waiting room and registrations"
  },
  domain: "health",
  styles: [
    "print"
  ],
  summary: {
    "ko": "동물병원의 오후를 만화책 한 쪽처럼 — 망점이 찍힌 신문 종이에 진료실·수술실·처치실이 굵은 검은 테의 칸으로, 노란 해설 상자가 방 이름을, 말풍선이 그 방의 한마디를 싣습니다. 방의 상태는 색과 함께 만화가 장면을 말하는 방식으로: 진료 중이면 말풍선, 비어 있으면 점선 생각 풍선, 응급이면 붉게 터지는 풍선, 소독 중이면 구름 — 칸 모서리에는 의성어. 입원실 두 칸은 입원장마다 상자 하나로, 집중 관찰은 빗금, 빈 장은 점선. 아래에는 대기실 순서, 오른쪽에 제호, 별 모양 수치, 범례, 시간별 접수. 동물병원은 지어낸 것이라 예시 데이터입니다.",
    "en": "An animal hospital’s afternoon drawn as a comic book page — newsprint dotted with halftone, the consulting, surgery and treatment rooms as panels with heavy black borders, a yellow caption box naming each and the room’s line in a balloon. A room tells its state the way a comic tells a scene, as well as by colour: a speech balloon while a patient is seen, a dotted thought balloon when it stands empty, a red burst for an emergency, a cloud while it is cleaned — and a sound effect in the corner. The two wards are panels of kennels, hatched when a patient is watched closely and dashed when free. Below, the waiting room’s queue; on the right the masthead, the figures in starbursts, the key and the patients registered by the hour. The hospital is made up. Example data."
  },
  connectors: [
    {
      "key": "clinic",
      "name": "예시 동물병원 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 동물병원이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
