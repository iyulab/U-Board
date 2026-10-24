// A coast's lighthouses kept as a stamp collection — a stock book's dark page with its glassine strips, and on it a
// stamp for every light: perforated edges, the lighthouse drawn in its frame with its beam, its name, how far its light
// reaches as the face value, its light character and when it was last checked. The state is the postmark struck over
// it: none when the light is steady, a machine cancel's lines when its fog signal is sounding, a square cancel when it is being
// serviced, a red round postmark — and the stamp faded — when the light is out. On the right, an envelope with the
// morning's round and the visibility over the night. The coast and its lights are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/lighthouse-stamps.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#2f6f9f"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>남녘바다 항로표지</h1><p>{{n.date}} {{n.time}} · 등대 {{n.count}}기 · {{n.summary}}</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:\"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;color:#f3ead6}\nh1{margin:0;white-space:nowrap;font-size:34px;font-weight:800;letter-spacing:.06em}\np{margin:0;white-space:nowrap;font:15px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#c9d3df}",
      "props": {
        "n": "object"
      }
    },
    "stamp": {
      "template": "<article class=\"st {{s.state}}\"><div class=\"face\"><p class=\"value\">{{s.range}}<small>해리</small></p><div class=\"art\"><i class=\"beam\"></i><i class=\"tower\"></i><i class=\"rock\"></i></div><h2>{{s.name}}</h2><p class=\"char\">{{s.character}}</p><p class=\"word\">{{s.word}}</p><p class=\"note\">{{s.note}} · {{s.time}}</p><span class=\"mark\" aria-hidden=\"true\"><b>{{s.mark}}</b></span></div></article>",
      "style": ".st{height:100%;box-sizing:border-box;padding:11px;background:#fbf6ea;\n-webkit-mask:radial-gradient(circle 5px,#0000 96%,#000) -10px -10px/20px 20px round,linear-gradient(#000 0 0) content-box;\nmask:radial-gradient(circle 5px,#0000 96%,#000) -10px -10px/20px 20px round,linear-gradient(#000 0 0) content-box;\nfont-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#26313f}\n.face{position:relative;height:100%;box-sizing:border-box;border:2px solid #2f6f9f;padding:8px 10px;display:grid;grid-template-rows:auto 1fr auto auto auto auto;gap:2px;background:#fffdf7;overflow:hidden}\n.value{margin:0;font:800 30px/1 \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;color:#2f6f9f}.value small{font:600 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;margin-left:3px}\n.art{position:relative;min-height:0;background:linear-gradient(#cfe3ef,#eaf3f8 60%,#2f6f9f 60%)}\n.tower{position:absolute;left:50%;bottom:18%;width:30px;height:62%;transform:translateX(-50%);background:repeating-linear-gradient(#fff 0 12px,#c0392b 12px 24px);clip-path:polygon(28% 0,72% 0,100% 100%,0 100%)}\n.tower::before{content:\"\";position:absolute;left:30%;right:30%;top:0;height:10px;background:#fff6c2}\n.rock{position:absolute;left:30%;right:30%;bottom:8%;height:14%;background:#5d5348;border-radius:40% 40% 0 0}\n.beam{position:absolute;left:50%;top:24%;width:100%;height:18px;transform:translate(-50%,-50%);background:linear-gradient(90deg,#0000,#ffe98a 30% 70%,#0000)}\nh2{margin:4px 0 0;font:800 20px/1.2 \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;white-space:nowrap}\n.char{margin:0;font:600 12px ui-monospace,Consolas,monospace;color:#56606c}\n.word{margin:0;font-size:15px;font-weight:800}\n.note{margin:0;font-size:11px;color:#56606c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.mark{position:absolute;pointer-events:none}\n.ok .mark{display:none}\n.fog .mark{right:2px;top:44%;width:118px;height:60px;background:repeating-linear-gradient(180deg,#0000 0 9px,#2a3a52cc 9px 12px);transform:rotate(-8deg)}\n.fog .mark b{display:none}\n.fog .beam{background:linear-gradient(90deg,#0000,#d9dde2 30% 70%,#0000)}\n.fog .word{color:#2a3a52}\n.service .mark{right:14px;top:40%;display:grid;place-items:center;width:74px;height:46px;border:3px solid #2a3a52;color:#2a3a52;transform:rotate(-6deg);font:800 15px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;background:#ffffff99}\n.service .word{color:#2a3a52}\n.out .mark{right:10px;top:36%;display:grid;place-items:center;width:86px;height:86px;border:4px double #c0392b;border-radius:50%;color:#c0392b;transform:rotate(-12deg);font:800 17px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;background:#fff3}\n.out .art{filter:grayscale(1) brightness(.85)}.out .beam{display:none}.out .value{color:#8a8f96}\n.out .word{color:#c0392b}",
      "props": {
        "s": "object"
      }
    },
    "round": {
      "template": "<section class=\"rd\"><h2>오늘 아침 순회</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{at}}</b><span>{{what}}</span></li>{{/items}}</ol></section>",
      "style": ".rd{height:100%;box-sizing:border-box;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#26313f}\nh2{margin:0 0 8px;font:800 20px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif}\nol{margin:0;padding:0;list-style:none;display:grid;gap:8px}\nli{display:grid;grid-template-columns:68px 1fr;gap:8px;font-size:14px;line-height:1.35;padding-bottom:6px;border-bottom:1px dashed #b9ab8a}\nb{font-weight:800}\n.done{color:#8a8576}.done span{text-decoration:line-through}\n.now b{color:#c0392b}.now b::after{content:\" ▶\"}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "lights",
      "path": "/lights/now",
      "time": "updatedAt",
      "fresh": 1200,
      "fields": {
        "value": {}
      }
    },
    "stations": {
      "from": "lights",
      "path": "/lights/stations",
      "time": "updatedAt",
      "fresh": 1200,
      "fields": {
        "s1": {
          "at": "/value/s1"
        },
        "s2": {
          "at": "/value/s2"
        },
        "s3": {
          "at": "/value/s3"
        },
        "s4": {
          "at": "/value/s4"
        },
        "s5": {
          "at": "/value/s5"
        },
        "s6": {
          "at": "/value/s6"
        },
        "s7": {
          "at": "/value/s7"
        },
        "s8": {
          "at": "/value/s8"
        }
      }
    },
    "visibility": {
      "from": "lights",
      "path": "/lights/visibility",
      "list": "/value",
      "fresh": 1200,
      "answerTime": "/updatedAt"
    },
    "round": {
      "from": "lights",
      "path": "/lights/round",
      "time": "updatedAt",
      "fresh": 1200,
      "fields": {
        "value": {}
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
    "stamp-s1": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s1"
      }
    },
    "stamp-s2": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s2"
      }
    },
    "stamp-s3": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s3"
      }
    },
    "stamp-s4": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s4"
      }
    },
    "stamp-s5": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s5"
      }
    },
    "stamp-s6": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s6"
      }
    },
    "stamp-s7": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s7"
      }
    },
    "stamp-s8": {
      "as": "element",
      "element": "stamp",
      "of": "stations",
      "bind": {
        "s": "s8"
      }
    },
    "visibility": {
      "as": "chart.line",
      "of": "visibility",
      "title": "밤사이 해상 시정 (km)",
      "x": "hour",
      "y": "km",
      "series": [
        {
          "label": "시정",
          "color": "#2f6f9f"
        }
      ]
    },
    "round": {
      "as": "element",
      "element": "round",
      "of": "round",
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22glassine%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%22.18%22%2F%3E%3Cstop%20offset%3D%22.25%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%22.05%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ffffff%22%20stop-opacity%3D%22.02%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cpattern%20id%3D%22linen%22%20width%3D%224%22%20height%3D%224%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%224%22%20height%3D%224%22%20fill%3D%22%231f2733%22%2F%3E%3Cpath%20d%3D%22M0%202%20H4%20M2%200%20V4%22%20stroke%3D%22%23232c39%22%20stroke-width%3D%22.6%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23linen)%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%2230%22%20width%3D%221100%22%20height%3D%22940%22%20rx%3D%226%22%20fill%3D%22none%22%20stroke%3D%22%233a4657%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%2244%22%20y%3D%22330%22%20width%3D%221072%22%20height%3D%22150%22%20fill%3D%22%232b3544%22%2F%3E%3Crect%20x%3D%2244%22%20y%3D%22330%22%20width%3D%221072%22%20height%3D%22150%22%20fill%3D%22url(%23glassine)%22%2F%3E%3Cline%20x1%3D%2244%22%20x2%3D%221116%22%20y1%3D%22330%22%20y2%3D%22330%22%20stroke%3D%22%237d8ba0%22%20stroke-width%3D%221.5%22%2F%3E%3Crect%20x%3D%2244%22%20y%3D%22720%22%20width%3D%221072%22%20height%3D%22150%22%20fill%3D%22%232b3544%22%2F%3E%3Crect%20x%3D%2244%22%20y%3D%22720%22%20width%3D%221072%22%20height%3D%22150%22%20fill%3D%22url(%23glassine)%22%2F%3E%3Cline%20x1%3D%2244%22%20x2%3D%221116%22%20y1%3D%22720%22%20y2%3D%22720%22%20stroke%3D%22%237d8ba0%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Cg%20transform%3D%22translate(1160%20120)%20rotate(-2)%22%3E%0A%3Crect%20width%3D%22400%22%20height%3D%22820%22%20fill%3D%22%23f3ead6%22%20stroke%3D%22%23cbbd9c%22%2F%3E%0A%3Cpath%20d%3D%22M0%200%20L200%20150%20L400%200%22%20fill%3D%22none%22%20stroke%3D%22%23cbbd9c%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%2260%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%2280%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22100%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22120%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22140%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22160%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22180%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22200%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22220%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22240%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22260%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22280%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22300%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22320%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%3Crect%20x%3D%22340%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22360%22%20y%3D%220%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%232f6f9f%22%2F%3E%3Crect%20x%3D%22380%22%20y%3D%22810%22%20width%3D%2220%22%20height%3D%2210%22%20fill%3D%22%23c0392b%22%2F%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        56,
        1060,
        64
      ],
      "stamp-s1": [
        70,
        150,
        240,
        330
      ],
      "stamp-s2": [
        340,
        150,
        240,
        330
      ],
      "stamp-s3": [
        610,
        150,
        240,
        330
      ],
      "stamp-s4": [
        880,
        150,
        240,
        330
      ],
      "stamp-s5": [
        70,
        540,
        240,
        330
      ],
      "stamp-s6": [
        340,
        540,
        240,
        330
      ],
      "stamp-s7": [
        610,
        540,
        240,
        330
      ],
      "stamp-s8": [
        880,
        540,
        240,
        330
      ],
      "visibility": [
        1200,
        300,
        330,
        300
      ],
      "round": [
        1200,
        620,
        330,
        300
      ]
    }
  }
};

export const lighthouseStamps: SamplePack = {
  id: "lighthouse-stamps",
  title: {
    "ko": "등대와 항로표지 — 우표 수집첩",
    "en": "A coast’s lighthouses — a stamp stock book"
  },
  field: {
    "ko": "해양·항로표지",
    "en": "Lighthouses & aids to navigation"
  },
  kind: {
    "ko": "등대별 점등 상태와 순회",
    "en": "Each light’s state and the round"
  },
  domain: "transport",
  styles: [
    "print",
    "craft"
  ],
  summary: {
    "ko": "한 바닷가의 등대를 우표 수집첩으로 — 어두운 수집첩 종이와 글라신 띠 위에 등대마다 우표 한 장: 톱니 가장자리, 테 안에 그린 등대와 빛줄기, 등대 이름, 빛이 닿는 거리를 액면가로, 등질과 마지막 점검. 상태는 우표 위에 찍힌 소인으로 — 정상 점등이면 소인 없음, 안개 신호가 울리면 기계 소인의 줄, 정비 중이면 네모 소인, 소등이면 붉은 둥근 소인과 바랜 우표. 오른쪽 봉투에 밤사이 해상 시정과 오늘 아침 순회. 바닷가와 등대는 지어낸 것이라 예시 데이터입니다.",
    "en": "A coast’s lighthouses kept as a stamp collection — a stock book’s dark page with its glassine strips and a stamp for every light: perforated edges, the lighthouse drawn in its frame with its beam, its name, how far its light reaches as the face value, its light character and last check. The state is the postmark over it: none when the light is steady, a machine cancel’s lines when its fog signal sounds, a square cancel while it is serviced, a red round postmark on a faded stamp when it is out. On the right, an envelope with the night’s visibility at sea and the morning round. The coast and its lights are made up. Example data."
  },
  connectors: [
    {
      "key": "lights",
      "name": "예시 항로표지 관리 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 등대·항로표지가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
