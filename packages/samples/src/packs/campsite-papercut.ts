// A campground's afternoon made in cut paper: hills of coloured card laid one over another with their shadows, a lake,
// pine trees snipped from green, and every pitch a card cut out and set on the meadow in layers. A pitch's state is told
// by the tent cut on its card, as well as by the card's colour: a solid tent when campers are in, a tent cut only as an
// outline with a dashed cutting line when they are on their way, an empty circle for a free pitch, a cross over hatched
// card when it is closed. Above, the facilities as paper chips; below, the day's arrivals and departures and the
// evening's weather with the campfire rule; on the right the campground's name cut from card, the figures now, the key
// and the pitches booked through the week. The campground is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/campsite-papercut.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d9774a"
  },
  "elements": {
    "facilities": {
      "template": "<ul class=\"fc\">{{#items}}<li class=\"{{state}}\"><b>{{name}}</b><span>{{word}}</span></li>{{/items}}</ul>",
      "style": ".fc{height:100%;box-sizing:border-box;margin:0;padding:0 12px 14px 0;list-style:none;display:grid;grid-template-columns:repeat(6,1fr);gap:16px;align-items:center;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25}\nli{display:grid;justify-items:center;gap:2px;padding:10px 6px;background:#fffaf0;border-radius:999px;box-shadow:5px 5px 0 #e3cfa9,10px 10px 0 #c5a875,12px 14px 14px rgba(60,40,20,.3);text-align:center}\nb{font-size:15px;font-weight:900}\nspan{font-size:12px;font-weight:700}\n.ok span::before{content:\"● \";color:#2f6b4f}\n.busy{box-shadow:5px 5px 0 #f2c98d,10px 10px 0 #d9774a,12px 14px 14px rgba(60,40,20,.3)}\n.busy span::before{content:\"▲ \";color:#d9774a}\n.closed{background:repeating-linear-gradient(-45deg,#fffaf0 0 6px,#eadfcd 6px 12px)}\n.closed span::before{content:\"✕ \";color:#8c3a1e}",
      "props": {
        "items": "list"
      }
    },
    "pitch": {
      "template": "<article class=\"pc {{p.state}}\"><header><b>{{p.no}}</b><i></i></header><small>{{p.kind}}</small><p>{{p.party}}</p><em>{{p.word}}</em><span>{{p.note}}</span></article>",
      "style": ".pc{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr auto auto;gap:2px;padding:12px 14px;background:#fffaf0;box-shadow:5px 5px 0 #7fa865,10px 10px 0 #2f6b4f,12px 14px 14px rgba(60,40,20,.3);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25;border-radius:4px}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font-size:24px;font-weight:900;letter-spacing:.02em}\ni{position:relative;width:40px;height:30px;background:#d9774a;clip-path:polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)}\nsmall{font-size:12px}\np{margin:4px 0 0;font-size:15px;font-weight:800}\nem{font-style:normal;font-size:14px;font-weight:800}\nspan{font-size:12px;border-top:1px solid rgba(44,42,37,.25);padding-top:3px}\n.arriving{box-shadow:5px 5px 0 #e8c78b,10px 10px 0 #c79a4f,12px 14px 14px rgba(60,40,20,.3)}\n.arriving i{background:#d9774a}\n.arriving i::after{content:\"\";position:absolute;inset:4px 6px 0;background:#fffaf0;clip-path:polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)}\n.arriving{outline:2px dashed #d9774a;outline-offset:-7px}\n.free i{width:28px;height:28px;clip-path:none;border-radius:50%;background:transparent;border:3px solid #2f6b4f;box-sizing:border-box}\n.free{box-shadow:5px 5px 0 #cfe0c0,10px 10px 0 #a7c08a,12px 14px 14px rgba(60,40,20,.3)}\n.free em{color:#2f6b4f}\n.closed{background:repeating-linear-gradient(-45deg,#fffaf0 0 7px,#eadfcd 7px 14px);box-shadow:5px 5px 0 #c8b9a2,10px 10px 0 #9e8f78,12px 14px 14px rgba(60,40,20,.3)}\n.closed i{clip-path:none;background:transparent;width:28px;height:28px}\n.closed i::before{content:\"✕\";font:900 26px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#8c3a1e;line-height:28px}\n.closed em{color:#8c3a1e}",
      "props": {
        "p": "object"
      }
    },
    "moves": {
      "template": "<section class=\"mv\"><h2>오늘 입실 · 퇴실</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{what}}</span><strong>{{pitch}}</strong><small>{{word}}</small></li>{{/items}}</ol></section>",
      "style": ".mv{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;padding:16px 22px;background:#fffaf0;border-radius:4px;box-shadow:5px 5px 0 #e3cfa9,10px 10px 0 #c5a875,12px 14px 14px rgba(60,40,20,.3);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25}\nh2{margin:0 0 10px;font-size:20px;font-weight:900}\nol{margin:0;padding:0;list-style:none;display:grid;gap:5px}\nli{display:grid;grid-template-columns:56px 1fr 56px 86px;align-items:center;gap:10px;padding:5px 8px;border-bottom:2px dotted #d8c7a6;font-size:15px}\nb{font-weight:800}\nstrong{font-weight:900;text-align:center}\nsmall{text-align:right;font-weight:800;font-size:13px}\n.done{opacity:.6}\n.done small::before{content:\"✓ \"}\n.now{background:#fbe6c4}\n.now small::before{content:\"▶ \"}\n.next small::before{content:\"○ \"}",
      "props": {
        "items": "list"
      }
    },
    "weather": {
      "template": "<section class=\"wt {{w.fire}}\"><h2>오늘 저녁</h2><dl><dt>지금 기온</dt><dd>{{w.now}}</dd><dt>밤 최저</dt><dd>{{w.low}}</dd><dt>바람</dt><dd>{{w.wind}}</dd><dt>해 지는 시각</dt><dd>{{w.sunset}}</dd></dl><p><b>모닥불</b><span>{{w.word}}</span></p></section>",
      "style": ".wt{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:8px;padding:16px 20px;background:#fffaf0;border-radius:4px;box-shadow:5px 5px 0 #cfe0c0,10px 10px 0 #a7c08a,12px 14px 14px rgba(60,40,20,.3);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25}\nh2{margin:0;font-size:20px;font-weight:900}\ndl{margin:0;display:grid;grid-template-columns:1fr auto;row-gap:6px;font-size:15px;align-content:start}\ndt{font-weight:700}\ndd{margin:0;font-weight:900}\np{margin:0;display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:999px;background:#f3b33d;font-weight:800}\n.allowed p span::before{content:\"▲ \"}\n.banned p{background:repeating-linear-gradient(-45deg,#f1d8c9 0 6px,#fffaf0 6px 12px);color:#8c3a1e}\n.banned p span::before{content:\"✕ \"}",
      "props": {
        "w": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;display:grid;align-content:center;gap:4px;padding:14px 24px;background:#2f6b4f;border-radius:6px;box-shadow:5px 5px 0 #7fa865,10px 10px 0 #c9b48e,12px 14px 14px rgba(60,40,20,.3);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fffaf0}\nsmall{font-size:14px;letter-spacing:.2em;font-weight:700;color:#d7e8c4}\nh1{margin:0;font-size:50px;font-weight:900;letter-spacing:.04em;text-shadow:3px 3px 0 #1d4733}\ndiv{display:flex;justify-content:space-between;align-items:baseline}\nspan{font-size:16px}\nb{font-size:30px;font-weight:900;background:#fffaf0;color:#2f6b4f;padding:0 12px;border-radius:4px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:calc(100% - 14px);box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding-right:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#fffaf0;border-radius:4px;box-shadow:5px 5px 0 #e8c78b,10px 10px 0 #d9774a,12px 14px 14px rgba(60,40,20,.3)}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font-size:32px;font-weight:900;color:#2f6b4f}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"in\"></i>입실</li><li><i class=\"arriving\"></i>오는 중 — 오린 윤곽</li><li><i class=\"free\"></i>빈 사이트</li><li><i class=\"closed\">✕</i>닫힘</li></ul>",
      "style": ".ky{width:calc(100% - 12px);height:calc(100% - 14px);box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fffaf0;border-radius:999px;box-shadow:5px 5px 0 #e3cfa9,10px 10px 0 #c5a875,12px 14px 14px rgba(60,40,20,.3);font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2c2a25}\nli{display:flex;align-items:center;gap:8px}\ni{position:relative;width:26px;height:20px;display:grid;place-items:center;font-style:normal}\n.in{background:#d9774a;clip-path:polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)}\n.arriving{background:#d9774a;clip-path:polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)}\n.arriving::after{content:\"\";position:absolute;inset:3px 4px 0;background:#fffaf0;clip-path:polygon(50% 0,100% 100%,62% 100%,50% 62%,38% 100%,0 100%)}\n.free{width:18px;height:18px;border-radius:50%;border:3px solid #2f6b4f;box-sizing:border-box}\n.closed{color:#8c3a1e;font-weight:900}"
    }
  },
  "data": {
    "facilities": {
      "from": "camp",
      "path": "/camp/facilities",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "pitches": {
      "from": "camp",
      "path": "/camp/pitches",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "a1": {
          "at": "/value/a1"
        },
        "a2": {
          "at": "/value/a2"
        },
        "a3": {
          "at": "/value/a3"
        },
        "a4": {
          "at": "/value/a4"
        },
        "a5": {
          "at": "/value/a5"
        },
        "b1": {
          "at": "/value/b1"
        },
        "b2": {
          "at": "/value/b2"
        },
        "b3": {
          "at": "/value/b3"
        },
        "b4": {
          "at": "/value/b4"
        },
        "b5": {
          "at": "/value/b5"
        }
      }
    },
    "moves": {
      "from": "camp",
      "path": "/camp/moves",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "weather": {
      "from": "camp",
      "path": "/camp/weather",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "camp",
      "path": "/camp/now",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "camp",
      "path": "/camp/figures",
      "time": "updatedAt",
      "fresh": 3600,
      "fields": {
        "value": {}
      }
    },
    "week": {
      "from": "camp",
      "path": "/camp/week",
      "list": "/value",
      "fresh": 3600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "facilities": {
      "as": "element",
      "element": "facilities",
      "of": "facilities",
      "bind": {
        "items": "value"
      }
    },
    "pitch-a1": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "a1"
      }
    },
    "pitch-a2": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "a2"
      }
    },
    "pitch-a3": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "a3"
      }
    },
    "pitch-a4": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "a4"
      }
    },
    "pitch-a5": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "a5"
      }
    },
    "pitch-b1": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "b1"
      }
    },
    "pitch-b2": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "b2"
      }
    },
    "pitch-b3": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "b3"
      }
    },
    "pitch-b4": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "b4"
      }
    },
    "pitch-b5": {
      "as": "element",
      "element": "pitch",
      "of": "pitches",
      "bind": {
        "p": "b5"
      }
    },
    "moves": {
      "as": "element",
      "element": "moves",
      "of": "moves",
      "bind": {
        "items": "value"
      }
    },
    "weather": {
      "as": "element",
      "element": "weather",
      "of": "weather",
      "bind": {
        "w": "value"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "t": "value"
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
    "week": {
      "as": "chart.bar",
      "of": "week",
      "title": "이번 주 예약한 사이트(10곳 중)",
      "x": "day",
      "y": "booked",
      "series": [
        {
          "label": "예약",
          "color": "#d9774a"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cfilter%20id%3D%22s%22%20x%3D%22-10%25%22%20y%3D%22-10%25%22%20width%3D%22130%25%22%20height%3D%22140%25%22%3E%3CfeDropShadow%20dx%3D%223%22%20dy%3D%225%22%20stdDeviation%3D%224%22%20flood-color%3D%22%235a3d22%22%20flood-opacity%3D%22.35%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f6ead8%22%2F%3E%0A%3Ccircle%20cx%3D%22860%22%20cy%3D%22150%22%20r%3D%2270%22%20fill%3D%22%23f3b33d%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20330%20C%20180%20210%20330%20250%20470%20300%20C%20620%20200%20780%20220%201010%20320%20L%201010%201000%20L%200%201000%20Z%22%20fill%3D%22%23c9b48e%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20420%20C%20200%20330%20360%20380%20520%20430%20C%20700%20340%20860%20360%201010%20430%20L%201010%201000%20L%200%201000%20Z%22%20fill%3D%22%23a7c08a%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20520%20C%20260%20450%20520%20500%201010%20470%20L%201010%201000%20L%200%201000%20Z%22%20fill%3D%22%237fa865%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%20380%20640%20C%20470%20610%20640%20612%20720%20640%20C%20650%20668%20470%20670%20380%20640%20Z%22%20fill%3D%22%237fb6c9%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%2070%20380%20L%20101.5%20429.5%20L%2086.2%20429.5%20L%20107.8%20470%20L%2032.2%20470%20L%2053.8%20429.5%20L%2038.5%20429.5%20Z%22%20fill%3D%22%232f6b4f%22%20filter%3D%22url(%23s)%22%2F%3E%3Cpath%20d%3D%22M%20130%20410%20L%20154.5%20448.5%20L%20142.6%20448.5%20L%20159.4%20480%20L%20100.6%20480%20L%20117.4%20448.5%20L%20105.5%20448.5%20Z%22%20fill%3D%22%232f6b4f%22%20filter%3D%22url(%23s)%22%2F%3E%3Cpath%20d%3D%22M%20940%20350%20L%20975%20405%20L%20958%20405%20L%20982%20450%20L%20898%20450%20L%20922%20405%20L%20905%20405%20Z%22%20fill%3D%22%232f6b4f%22%20filter%3D%22url(%23s)%22%2F%3E%3Cpath%20d%3D%22M%20985%20400%20L%201009.5%20438.5%20L%20997.6%20438.5%20L%201014.4%20470%20L%20955.6%20470%20L%20972.4%20438.5%20L%20960.5%20438.5%20Z%22%20fill%3D%22%232f6b4f%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%20640%20L%201010%20640%20L%201010%201000%20L%200%201000%20Z%22%20fill%3D%22%236a9452%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Cpath%20d%3D%22M%201020%200%20L%201600%200%20L%201600%201000%20L%201020%201000%20Z%22%20fill%3D%22%23efe1c8%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22450%22%20width%3D%22540%22%20height%3D%22510%22%20fill%3D%22%23fffaf0%22%20filter%3D%22url(%23s)%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "facilities": [
        40,
        40,
        950,
        120
      ],
      "pitch-a1": [
        40,
        196,
        178,
        200
      ],
      "pitch-a2": [
        233,
        196,
        178,
        200
      ],
      "pitch-a3": [
        426,
        196,
        178,
        200
      ],
      "pitch-a4": [
        619,
        196,
        178,
        200
      ],
      "pitch-a5": [
        812,
        196,
        178,
        200
      ],
      "pitch-b1": [
        40,
        418,
        178,
        200
      ],
      "pitch-b2": [
        233,
        418,
        178,
        200
      ],
      "pitch-b3": [
        426,
        418,
        178,
        200
      ],
      "pitch-b4": [
        619,
        418,
        178,
        200
      ],
      "pitch-b5": [
        812,
        418,
        178,
        200
      ],
      "moves": [
        40,
        650,
        600,
        300
      ],
      "weather": [
        660,
        650,
        330,
        300
      ],
      "title": [
        1030,
        36,
        540,
        170
      ],
      "figures": [
        1030,
        228,
        540,
        130
      ],
      "legend": [
        1030,
        380,
        540,
        56
      ],
      "week": [
        1050,
        470,
        500,
        470
      ]
    }
  }
};

export const campsitePapercut: SamplePack = {
  id: "campsite-papercut",
  title: {
    "ko": "캠핑장의 오후 — 종이 오리기",
    "en": "A campground’s afternoon — cut paper"
  },
  field: {
    "ko": "캠핑·야외 여가",
    "en": "Camping & the outdoors"
  },
  kind: {
    "ko": "사이트 입실·편의시설·입퇴실·날씨",
    "en": "Pitches, facilities, arrivals and the weather"
  },
  domain: "leisure",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "캠핑장의 오후를 종이 오리기로 — 겹겹이 놓은 색 판지 언덕과 그 그림자, 호수, 초록 종이를 오린 소나무, 그리고 풀밭 위에 층층이 오려 놓은 사이트 카드. 사이트 상태는 카드 색과 함께 카드에 오린 텐트로: 입실이면 꽉 찬 텐트, 오는 중이면 윤곽만 오린 텐트와 점선 오림선, 빈 사이트는 빈 원, 닫힌 곳은 빗금 판지에 ✕. 위에는 편의시설을 종이 칩으로, 아래에는 오늘 입실·퇴실과 저녁 날씨·모닥불 규칙, 오른쪽에 판지를 오린 캠핑장 이름, 지금 수치, 범례, 이번 주 예약. 캠핑장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A campground’s afternoon made in cut paper — hills of coloured card laid over one another with their shadows, a lake, pines snipped from green, and every pitch a card cut out and set on the meadow in layers. A pitch tells its state by the tent cut on its card, as well as by the card’s colour: a solid tent when campers are in, a tent cut only as an outline with a dashed cutting line when they are on their way, an empty circle for a free pitch, a cross over hatched card when it is closed. Above, the facilities as paper chips; below, the day’s arrivals and departures and the evening’s weather with the campfire rule; on the right the campground’s name cut from card, the figures now, the key and the pitches booked through the week. The campground is made up. Example data."
  },
  connectors: [
    {
      "key": "camp",
      "name": "예시 캠핑장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 캠핑장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
