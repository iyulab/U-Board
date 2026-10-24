// A nature park's camera traps painted as a chaekgado — the Joseon bookshelf screen: the shelf's staggered compartments
// in lacquered wood, two of them holding the still life such screens are known for (books, a vase, a brush pot), and
// every other one a camera's station — its place, the last animal it caught and when, today's shots, its battery and
// memory as ink bars — with the state as a seal and a word: 安 steady, 珍 a rare or protected animal caught (a vermilion
// seal), 電 battery low, 障 a fault (no shots), 滿 memory full. On the right, a hanging scroll with today's catches by
// species and the morning round. The park and its stations are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/wildlife-chaekgado.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c8442f"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>구름골 자연공원 무인 카메라</h1><p>{{n.date}} {{n.time}} · 카메라 {{n.count}}대</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:\"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;color:#2a2420}\nh1{margin:0;white-space:nowrap;font-size:34px;font-weight:800;letter-spacing:.08em}\np{margin:0;white-space:nowrap;font-size:15px;color:#6b5a48}",
      "props": {
        "n": "object"
      }
    },
    "camera": {
      "template": "<article class=\"cm {{c.state}}\" style=\"--b: {{c.battery}}; --m: {{c.memory}}\"><header><h2>{{c.no}}</h2><small>{{c.place}}</small><i class=\"seal\"></i></header><p class=\"last\"><span>마지막 포착</span><b>{{c.animal}}</b><time>{{c.time}}</time></p><p class=\"count\">오늘 촬영 {{c.shots}} · 동물 {{c.hits}}</p><div class=\"bars\"><p><span>전지</span><i class=\"bar b\"></i><em>{{c.battery}}%</em></p><p><span>저장</span><i class=\"bar m\"></i><em>{{c.memory}}%</em></p></div><p class=\"word\">{{c.word}} <small>{{c.note}}</small></p></article>",
      "style": ".cm{height:100%;box-sizing:border-box;padding:22px 18px 10px 26px;font-family:\"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;color:#2a2420;display:grid;gap:5px;align-content:start}\nheader{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:8px}\nh2{margin:0;font-size:22px;font-weight:800}\nheader small{font-size:13px;color:#6b5a48;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.seal{align-self:start;display:grid;place-items:center;width:38px;height:38px;font:normal 800 24px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;border:2.5px solid #2a2420;border-radius:4px}\n.ok .seal::before{content:\"安\"}\n.rare .seal{background:#c8442f;border-color:#c8442f;color:#fff4e6;transform:rotate(-4deg)}.rare .seal::before{content:\"珍\"}\n.battery .seal{color:#d9a63a;border-color:#d9a63a;border-style:dashed}.battery .seal::before{content:\"電\"}\n.fault .seal{color:#fff;background:#2a2420}.fault .seal::before{content:\"障\"}\n.full .seal{color:#2f4f7f;border-color:#2f4f7f;border-width:4px;border-style:double}.full .seal::before{content:\"滿\"}\n.last{margin:0;display:flex;align-items:baseline;gap:8px}\n.last span{font-size:12px;color:#6b5a48}\n.last b{font-size:26px}\n.last time{font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-size:13px;color:#6b5a48}\n.count{margin:0;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-size:13px}\n.bars{display:grid;gap:3px}\n.bars p{margin:0;display:grid;grid-template-columns:30px 1fr 40px;align-items:center;gap:6px;font-size:12px}\n.bar{display:block;height:9px;background:#dccba3;border-radius:5px;position:relative;overflow:hidden}\n.bar::after{content:\"\";position:absolute;inset:0 auto 0 0;background:#2a2420}\n.b::after{width:calc(var(--b) * 1%)}.m::after{width:calc(var(--m) * 1%)}\nem{font-style:normal;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-size:12px;text-align:right}\n.battery .b::after{background:#d9a63a}.full .m::after{background:#2f4f7f}\n.word{margin:2px 0 0;font-size:15px;font-weight:800;line-height:1.3}\n.word small{font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-size:12px;font-weight:400;color:#5a4a3a}\n.rare .word{color:#c8442f}.fault .last b{color:#8a7a6a}",
      "props": {
        "c": "object"
      }
    },
    "round": {
      "template": "<section class=\"rd\"><h2>아침 순회</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{no}}</b><span>{{what}}</span></li>{{/items}}</ol></section>",
      "style": ".rd{height:100%;box-sizing:border-box;padding:0 6px;font-family:\"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;color:#2a2420}\nh2{margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:.1em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:62px 1fr;gap:6px;font-size:14px;line-height:1.35;padding-bottom:5px;border-bottom:1px solid #d8c7a0}\nb{font-weight:800}\n.done{color:#9a8a76}.done span{text-decoration:line-through}\n.urgent b{color:#c8442f}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "park",
      "path": "/park/now",
      "time": "updatedAt",
      "fresh": 10800,
      "fields": {
        "value": {}
      }
    },
    "cameras": {
      "from": "park",
      "path": "/park/cameras",
      "time": "updatedAt",
      "fresh": 10800,
      "fields": {
        "c1": {
          "at": "/value/c1"
        },
        "c2": {
          "at": "/value/c2"
        },
        "c3": {
          "at": "/value/c3"
        },
        "c4": {
          "at": "/value/c4"
        },
        "c5": {
          "at": "/value/c5"
        },
        "c6": {
          "at": "/value/c6"
        },
        "c7": {
          "at": "/value/c7"
        }
      }
    },
    "species": {
      "from": "park",
      "path": "/park/species",
      "list": "/value",
      "fresh": 10800,
      "answerTime": "/updatedAt"
    },
    "round": {
      "from": "park",
      "path": "/park/round",
      "time": "updatedAt",
      "fresh": 10800,
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
    "camera-c1": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c1"
      }
    },
    "camera-c2": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c2"
      }
    },
    "camera-c3": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c3"
      }
    },
    "camera-c4": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c4"
      }
    },
    "camera-c5": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c5"
      }
    },
    "camera-c6": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c6"
      }
    },
    "camera-c7": {
      "as": "element",
      "element": "camera",
      "of": "cameras",
      "bind": {
        "c": "c7"
      }
    },
    "species": {
      "as": "chart.bar",
      "of": "species",
      "title": "오늘 종별 포착 (회)",
      "x": "species",
      "y": "hits",
      "series": [
        {
          "label": "포착",
          "color": "#4f8a63"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22wood%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%238d4a28%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%237a3f22%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cpattern%20id%3D%22silk%22%20width%3D%226%22%20height%3D%226%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%226%22%20height%3D%226%22%20fill%3D%22%23e9dcbc%22%2F%3E%3Cpath%20d%3D%22M0%203%20H6%20M3%200%20V6%22%20stroke%3D%22%23e0d1ad%22%20stroke-width%3D%22.8%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23silk)%22%2F%3E%0A%3Crect%20x%3D%2244%22%20y%3D%2296%22%20width%3D%221022%22%20height%3D%22868%22%20fill%3D%22url(%23wood)%22%20stroke%3D%22%234a2412%22%20stroke-width%3D%226%22%2F%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22120%22%20width%3D%22360%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M70%20120%20h360%20l-14%2014%20h-332%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22450%22%20y%3D%22120%22%20width%3D%22300%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M450%20120%20h300%20l-14%2014%20h-272%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22770%22%20y%3D%22120%22%20width%3D%22270%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M770%20120%20h270%20l-14%2014%20h-242%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%22400%22%20width%3D%22290%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M70%20400%20h290%20l-14%2014%20h-262%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22380%22%20y%3D%22400%22%20width%3D%22330%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M380%20400%20h330%20l-14%2014%20h-302%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22730%22%20y%3D%22400%22%20width%3D%22310%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M730%20400%20h310%20l-14%2014%20h-282%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%2270%22%20y%3D%22680%22%20width%3D%22330%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M70%20680%20h330%20l-14%2014%20h-302%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22420%22%20y%3D%22680%22%20width%3D%22270%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M420%20680%20h270%20l-14%2014%20h-242%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%3Crect%20x%3D%22710%22%20y%3D%22680%22%20width%3D%22330%22%20height%3D%22260%22%20fill%3D%22%23efe3c6%22%2F%3E%3Cpath%20d%3D%22M710%20680%20h330%20l-14%2014%20h-302%20v232%20l-14%2014%20z%22%20fill%3D%22%23d8c7a0%22%2F%3E%0A%3Crect%20x%3D%22810%22%20y%3D%22340%22%20width%3D%22150%22%20height%3D%2220%22%20fill%3D%22%232f4f7f%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22820%22%20x2%3D%22820%22%20y1%3D%22340%22%20y2%3D%22360%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22816%22%20y%3D%22318%22%20width%3D%22138%22%20height%3D%2220%22%20fill%3D%22%234f8a63%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22826%22%20x2%3D%22826%22%20y1%3D%22318%22%20y2%3D%22338%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22822%22%20y%3D%22296%22%20width%3D%22126%22%20height%3D%2220%22%20fill%3D%22%23d9a63a%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22832%22%20x2%3D%22832%22%20y1%3D%22296%22%20y2%3D%22316%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22828%22%20y%3D%22274%22%20width%3D%22114%22%20height%3D%2220%22%20fill%3D%22%23c8442f%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22838%22%20x2%3D%22838%22%20y1%3D%22274%22%20y2%3D%22294%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M980%20358%20c%20-30%200%2C%20-40%20-60%2C%20-18%20-90%20c%206%20-10%2C%204%20-24%2C%20-4%20-30%20h%2044%20c%20-8%206%2C%20-10%2020%2C%20-4%2030%20c%2022%2030%2C%2012%2090%2C%20-18%2090%20z%22%20fill%3D%22%23f6f2e8%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M954%20298%20c%2010%206%2C%2042%206%2C%2052%200%22%20fill%3D%22none%22%20stroke%3D%22%232f4f7f%22%20stroke-width%3D%225%22%2F%3E%3Cpath%20d%3D%22M978%20238%20c%20-4%20-30%2C%20-30%20-50%2C%20-40%20-70%20M982%20238%20c%2010%20-30%2C%2030%20-40%2C%2044%20-60%22%20fill%3D%22none%22%20stroke%3D%22%234f8a63%22%20stroke-width%3D%224%22%2F%3E%3Ccircle%20cx%3D%22940%22%20cy%3D%22168%22%20r%3D%228%22%20fill%3D%22%23c8442f%22%2F%3E%3Ccircle%20cx%3D%221026%22%20cy%3D%22178%22%20r%3D%228%22%20fill%3D%22%23c8442f%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22900%22%20width%3D%22150%22%20height%3D%2220%22%20fill%3D%22%232f4f7f%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22460%22%20x2%3D%22460%22%20y1%3D%22900%22%20y2%3D%22920%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22456%22%20y%3D%22878%22%20width%3D%22138%22%20height%3D%2220%22%20fill%3D%22%234f8a63%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22466%22%20x2%3D%22466%22%20y1%3D%22878%22%20y2%3D%22898%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22462%22%20y%3D%22856%22%20width%3D%22126%22%20height%3D%2220%22%20fill%3D%22%23d9a63a%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22472%22%20x2%3D%22472%22%20y1%3D%22856%22%20y2%3D%22876%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22468%22%20y%3D%22834%22%20width%3D%22114%22%20height%3D%2220%22%20fill%3D%22%23c8442f%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22478%22%20x2%3D%22478%22%20y1%3D%22834%22%20y2%3D%22854%22%20stroke%3D%22%23f3ead2%22%20stroke-width%3D%222%22%2F%3E%3Crect%20x%3D%22610%22%20y%3D%22848%22%20width%3D%2260%22%20height%3D%2270%22%20rx%3D%226%22%20fill%3D%22%234f8a63%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%222%22%2F%3E%3Cline%20x1%3D%22618%22%20y1%3D%22848%22%20x2%3D%22606%22%20y2%3D%22768%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22630%22%20y1%3D%22848%22%20x2%3D%22626%22%20y2%3D%22768%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22642%22%20y1%3D%22848%22%20x2%3D%22646%22%20y2%3D%22768%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22654%22%20y1%3D%22848%22%20x2%3D%22666%22%20y2%3D%22768%22%20stroke%3D%22%232a2420%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%221110%22%20y%3D%2260%22%20width%3D%22440%22%20height%3D%2220%22%20rx%3D%224%22%20fill%3D%22%234a2412%22%2F%3E%0A%3Crect%20x%3D%221124%22%20y%3D%2280%22%20width%3D%22412%22%20height%3D%22880%22%20fill%3D%22%23f4ecd8%22%20stroke%3D%22%23c9b48a%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%221124%22%20y%3D%2280%22%20width%3D%22412%22%20height%3D%2240%22%20fill%3D%22%232f4f7f%22%2F%3E%0A%3Crect%20x%3D%221124%22%20y%3D%22920%22%20width%3D%22412%22%20height%3D%2240%22%20fill%3D%22%232f4f7f%22%2F%3E%0A%3Crect%20x%3D%221100%22%20y%3D%22960%22%20width%3D%22460%22%20height%3D%2222%22%20rx%3D%2211%22%20fill%3D%22%234a2412%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        24,
        1000,
        64
      ],
      "camera-c1": [
        70,
        120,
        360,
        260
      ],
      "camera-c2": [
        450,
        120,
        300,
        260
      ],
      "camera-c3": [
        70,
        400,
        290,
        260
      ],
      "camera-c4": [
        380,
        400,
        330,
        260
      ],
      "camera-c5": [
        730,
        400,
        310,
        260
      ],
      "camera-c6": [
        70,
        680,
        330,
        260
      ],
      "camera-c7": [
        710,
        680,
        330,
        260
      ],
      "species": [
        1140,
        130,
        380,
        420
      ],
      "round": [
        1140,
        570,
        380,
        330
      ]
    }
  }
};

export const wildlifeChaekgado: SamplePack = {
  id: "wildlife-chaekgado",
  title: {
    "ko": "자연공원 무인 센서 카메라 — 책가도",
    "en": "A nature park’s camera traps — a chaekgado bookshelf screen"
  },
  field: {
    "ko": "야생동물 조사·자연공원",
    "en": "Wildlife monitoring"
  },
  kind: {
    "ko": "카메라 지점별 포착과 상태",
    "en": "Catches and state by camera"
  },
  domain: "environment",
  styles: [
    "korean"
  ],
  summary: {
    "ko": "자연공원의 무인 센서 카메라를 책가도로 — 칠한 나무 책장의 엇갈린 칸들, 그중 둘은 책가도의 정물(책 더미·꽃병·필통)이고 나머지 칸마다 카메라 지점 하나: 자리, 마지막으로 찍힌 동물과 시각, 오늘 촬영 수, 전지와 저장 공간을 먹 막대로, 그리고 상태가 낙관(도장)과 낱말로 — 安 정상, 珍 희귀·보호종 포착(주홍 도장), 電 전지 부족, 障 고장(촬영 없음), 滿 저장 공간 가득. 오른쪽 족자에 오늘 종별 포착과 아침 순회. 공원과 지점은 지어낸 것이라 예시 데이터입니다.",
    "en": "A nature park’s camera traps painted as a chaekgado, the Joseon bookshelf screen — the staggered compartments of a lacquered shelf, two of them holding the screen’s still life (stacked books, a vase, a brush pot) and every other one a camera’s station: its place, the last animal it caught and when, today’s shots, its battery and memory as ink bars, and the state as a seal and a word — 安 steady, 珍 a rare or protected animal caught (a vermilion seal), 電 battery low, 障 a fault (no shots), 滿 memory full. On the right a hanging scroll with today’s catches by species and the morning round. The park and its stations are made up. Example data."
  },
  connectors: [
    {
      "key": "park",
      "name": "예시 자연공원 무인 센서 카메라 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 공원·카메라가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
