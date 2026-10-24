// An apiary's autumn worked as cross-stitch: cream Aida cloth with its weave showing, every hive an embroidery hoop — a
// wooden ring, the hive's number and its weight stitched inside. A hive's state is told by the honeycomb stitched at the
// top of its hoop, as well as by a colour: a comb filled with cross stitches when the colony is sound, half filled when it
// is short of food or its mites are rising, an empty comb crossed out in red when its queen is missing. Below, a sampler
// of the year's harvests and the work left before winter, and the flowers the bees can still reach; on the right the
// apiary's name stitched in a border, the figures now, the key and the average hive weight through the week. The apiary
// is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/apiary-stitch.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d99a1e"
  },
  "elements": {
    "hoop": {
      "template": "<article class=\"hp {{h.state}}\"><i></i><small>{{h.no}}</small><b>{{h.weight}}</b><span>{{h.frames}} · {{h.queen}}</span><em>{{h.note}}</em></article>",
      "style": ".hp{position:relative;height:100%;box-sizing:border-box;border-radius:50%;border:11px solid #b98a52;box-shadow:inset 0 0 0 2px #8a6233,inset 0 3px 8px rgba(0,0,0,.18),0 0 0 2px #8a6233,3px 5px 0 rgba(80,50,20,.25);background:#fbf6e8;display:grid;align-content:center;justify-items:center;text-align:center;gap:1px;padding:0 26px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b3226;overflow:hidden}\n.hp::before{content:\"\";position:absolute;inset:6px;border-radius:50%;border:2px dashed #5f7d3a}\ni{width:40px;height:34px;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);background:#3b3226;position:relative;margin-bottom:2px}\ni::after{content:\"\";position:absolute;inset:2.5px;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);background:repeating-linear-gradient(45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),#fbf6e8}\nsmall{font:700 13px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;letter-spacing:.12em}\nb{font:700 26px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nspan{font-size:12px}\nem{font-style:normal;font-size:12px;font-weight:700;margin-top:2px}\n.watch i::after{background:linear-gradient(to bottom,#fbf6e8 0 48%,transparent 48%),repeating-linear-gradient(45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),#fbf6e8}\n.watch em{color:#8a5a00;border-bottom:2px dashed #d99a1e}\n.alarm i{background:#b8322a}\n.alarm i::after{background:#fbf6e8}\n.alarm i::before{content:\"✕\";position:absolute;inset:0;z-index:1;display:grid;place-items:center;color:#b8322a;font:700 24px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\n.alarm::before{border-color:#b8322a}\n.alarm em{color:#b8322a}",
      "props": {
        "h": "object"
      }
    },
    "harvest": {
      "template": "<section class=\"sm\"><h2>올해 채밀과 남은 일</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{when}}</b><span>{{what}}</span><strong>{{amount}}</strong><small>{{word}}</small></li>{{/items}}</ol></section>",
      "style": ".sm{height:100%;box-sizing:border-box;padding:18px 26px;background:#fbf6e8;border:2px solid #3b3226;box-shadow:inset 0 0 0 7px #fbf6e8,inset 0 0 0 9px #d99a1e;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b3226}\nh2{margin:0 0 8px;font:700 21px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;text-align:center;border-bottom:2px dashed #5f7d3a;padding-bottom:6px}\nol{margin:0;padding:0;list-style:none;display:grid;gap:3px}\nli{display:grid;grid-template-columns:64px 1fr 90px 100px;align-items:center;gap:12px;font-size:17px;padding:8px 6px;border-bottom:1px dotted #e3d7b9}\nb{font:700 15px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nstrong{text-align:right;font:700 17px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nsmall{text-align:right;font-size:14px;font-weight:700}\n.done small{color:#5f7d3a}\n.done small::before{content:\"✕ \"}\n.next{background:repeating-linear-gradient(45deg,transparent 0 2px,#f1d48c 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,#f1d48c 2px 3.6px,transparent 3.6px 6px),#fbf6e8}\n.next small{color:#8a5a00}\n.next small::before{content:\"▸ \"}\n.plan small{color:#7a6e5c;font-weight:400}\n.plan small::before{content:\"○ \"}",
      "props": {
        "items": "list"
      }
    },
    "flowers": {
      "template": "<section class=\"fl\"><h2>꿀이 나는 꽃</h2><ul>{{#items}}<li class=\"{{state}}\"><i>✿</i><b>{{name}}</b><span>{{word}}</span><small>{{distance}}</small></li>{{/items}}</ul></section>",
      "style": ".fl{height:100%;box-sizing:border-box;padding:18px 20px;background:#fbf6e8;border:2px solid #3b3226;box-shadow:inset 0 0 0 7px #fbf6e8,inset 0 0 0 9px #5f7d3a;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b3226}\nh2{margin:0 0 10px;font:700 21px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;text-align:center;border-bottom:2px dashed #d99a1e;padding-bottom:6px}\nul{margin:0;padding:0;list-style:none;display:grid;gap:10px}\nli{display:grid;grid-template-columns:34px 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center}\ni{grid-row:span 2;font-style:normal;font-size:30px;line-height:1;text-align:center}\nb{font:700 17px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nspan{grid-column:3;grid-row:1;font-size:13px;font-weight:700}\nsmall{grid-column:2 / span 2;font-size:12px}\n.bloom i{color:#d99a1e;text-shadow:0 0 0 #3b3226}\n.bloom span{color:#5f7d3a}\n.fade i{color:transparent;-webkit-text-stroke:1px #8f8270}\n.fade span{color:#8f8270}\n.bud i{color:#5f7d3a;font-size:14px}\n.bud span{color:#8f8270;font-weight:400}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:14px;background:#fbf6e8;border:2px solid #3b3226;box-shadow:inset 0 0 0 6px #fbf6e8,inset 0 0 0 9px #d99a1e,inset 0 0 0 13px #fbf6e8,inset 0 0 0 15px #5f7d3a;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#3b3226;text-align:center}\nsmall{font-size:14px;letter-spacing:.3em}\nh1{margin:0;font-size:44px;font-weight:700;letter-spacing:.14em;color:#7a4e0c}\ndiv{display:flex;gap:18px;align-items:baseline}\nspan{font-size:16px}\nb{font-size:28px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b3226}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;background:#fbf6e8;border:2px dashed #3b3226;outline:4px solid #fbf6e8;box-shadow:0 0 0 6px #d99a1e}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:700 30px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#7a4e0c}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"ok\"></i>꽉 찬 벌집 — 양호</li><li><i class=\"watch\"></i>반 찬 벌집 — 주의</li><li><i class=\"alarm\">✕</i>빈 벌집 ✕ — 여왕 없음</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:#fbf6e8;border:2px dashed #3b3226;font:700 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#3b3226}\nli{display:flex;align-items:center;gap:8px}\ni{width:24px;height:21px;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);display:grid;place-items:center;font-style:normal;font-size:14px}\n.ok{background:repeating-linear-gradient(45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),#3b3226}\n.watch{background:linear-gradient(to bottom,#fbf6e8 0 48%,transparent 48%),repeating-linear-gradient(45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),repeating-linear-gradient(-45deg,transparent 0 2px,#d99a1e 2px 3.6px,transparent 3.6px 6px),#fbf6e8;box-shadow:inset 0 0 0 2px #3b3226}\n.alarm{background:#f7dcd8;color:#b8322a}"
    }
  },
  "data": {
    "hives": {
      "from": "apiary",
      "path": "/apiary/hives",
      "time": "updatedAt",
      "fresh": 7200,
      "fields": {
        "h1": {
          "at": "/value/h1"
        },
        "h2": {
          "at": "/value/h2"
        },
        "h3": {
          "at": "/value/h3"
        },
        "h4": {
          "at": "/value/h4"
        },
        "h5": {
          "at": "/value/h5"
        },
        "h6": {
          "at": "/value/h6"
        },
        "h7": {
          "at": "/value/h7"
        },
        "h8": {
          "at": "/value/h8"
        }
      }
    },
    "harvest": {
      "from": "apiary",
      "path": "/apiary/harvest",
      "time": "updatedAt",
      "fresh": 7200,
      "fields": {
        "value": {}
      }
    },
    "flowers": {
      "from": "apiary",
      "path": "/apiary/flowers",
      "time": "updatedAt",
      "fresh": 7200,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "apiary",
      "path": "/apiary/now",
      "time": "updatedAt",
      "fresh": 7200,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "apiary",
      "path": "/apiary/figures",
      "time": "updatedAt",
      "fresh": 7200,
      "fields": {
        "value": {}
      }
    },
    "weight": {
      "from": "apiary",
      "path": "/apiary/weight",
      "list": "/value",
      "fresh": 7200,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "hive-h1": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h1"
      }
    },
    "hive-h2": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h2"
      }
    },
    "hive-h3": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h3"
      }
    },
    "hive-h4": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h4"
      }
    },
    "hive-h5": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h5"
      }
    },
    "hive-h6": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h6"
      }
    },
    "hive-h7": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h7"
      }
    },
    "hive-h8": {
      "as": "element",
      "element": "hoop",
      "of": "hives",
      "bind": {
        "h": "h8"
      }
    },
    "harvest": {
      "as": "element",
      "element": "harvest",
      "of": "harvest",
      "bind": {
        "items": "value"
      }
    },
    "flowers": {
      "as": "element",
      "element": "flowers",
      "of": "flowers",
      "bind": {
        "items": "value"
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
    "weight": {
      "as": "chart.line",
      "of": "weight",
      "title": "벌통 평균 무게(kg) — 이번 주, 21일부터 먹이",
      "x": "day",
      "y": "kg",
      "valueAxisZero": false,
      "series": [
        {
          "label": "평균 무게",
          "color": "#d99a1e"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22w%22%20width%3D%228%22%20height%3D%228%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23f4ecd8%22%2F%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%226%22%20height%3D%226%22%20fill%3D%22%23efe5cc%22%2F%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%220.9%22%20fill%3D%22%23e3d7b9%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23w)%22%2F%3E%0A%3Crect%20x%3D%2218%22%20y%3D%2218%22%20width%3D%221564%22%20height%3D%22964%22%20fill%3D%22none%22%20stroke%3D%22%23d99a1e%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%229%206%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%221544%22%20height%3D%22944%22%20fill%3D%22none%22%20stroke%3D%22%235f7d3a%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%205%22%2F%3E%0A%3Crect%20x%3D%221020%22%20y%3D%22470%22%20width%3D%22545%22%20height%3D%22490%22%20fill%3D%22%23fbf8ef%22%20stroke%3D%22%233b3226%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%221028%22%20y%3D%22478%22%20width%3D%22529%22%20height%3D%22474%22%20fill%3D%22none%22%20stroke%3D%22%23d99a1e%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%226%205%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "hive-h1": [
        60,
        52,
        220,
        220
      ],
      "hive-h2": [
        300,
        52,
        220,
        220
      ],
      "hive-h3": [
        540,
        52,
        220,
        220
      ],
      "hive-h4": [
        780,
        52,
        220,
        220
      ],
      "hive-h5": [
        60,
        298,
        220,
        220
      ],
      "hive-h6": [
        300,
        298,
        220,
        220
      ],
      "hive-h7": [
        540,
        298,
        220,
        220
      ],
      "hive-h8": [
        780,
        298,
        220,
        220
      ],
      "harvest": [
        44,
        560,
        600,
        400
      ],
      "flowers": [
        664,
        560,
        330,
        400
      ],
      "title": [
        1020,
        44,
        545,
        180
      ],
      "figures": [
        1020,
        246,
        545,
        130
      ],
      "legend": [
        1020,
        394,
        545,
        56
      ],
      "weight": [
        1040,
        490,
        505,
        450
      ]
    }
  }
};

export const apiaryStitch: SamplePack = {
  id: "apiary-stitch",
  title: {
    "ko": "양봉장의 가을 — 십자수",
    "en": "An apiary’s autumn — cross-stitch"
  },
  field: {
    "ko": "양봉·농촌",
    "en": "Beekeeping & farming"
  },
  kind: {
    "ko": "벌통 상태·채밀·밀원·무게",
    "en": "Hives, harvests, forage and weight"
  },
  domain: "agrifood",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "양봉장의 가을을 십자수로 — 올이 보이는 크림색 아이다 천에 벌통마다 나무 수틀 하나, 그 안에 번호와 무게가 수놓입니다. 벌통 상태는 색과 함께 수틀 위에 놓은 벌집 한 칸으로: 군세가 좋으면 십자 땀으로 꽉 찬 벌집, 먹이가 모자라거나 응애가 늘면 반만 찬 벌집, 여왕이 없으면 빈 벌집에 붉은 ✕. 아래에는 올해 채밀과 겨울 전 남은 일을 자수 견본처럼, 그 옆에 벌이 닿는 꽃, 오른쪽에 수놓은 테두리 속 양봉장 이름, 지금 수치, 범례, 이번 주 벌통 평균 무게. 양봉장은 지어낸 것이라 예시 데이터입니다.",
    "en": "An apiary’s autumn worked in cross-stitch — cream Aida cloth with its weave showing, every hive an embroidery hoop with its number and weight stitched inside. A hive tells its state by the honeycomb stitched at the top of its hoop, as well as by colour: a comb filled with cross stitches when the colony is sound, half filled when it is short of food or its mites are rising, an empty comb crossed in red when its queen is missing. Below, a sampler of the year’s harvests and the work left before winter, and the flowers the bees can still reach; on the right the apiary’s name in a stitched border, the figures now, the key and the average hive weight through the week. The apiary is made up. Example data."
  },
  connectors: [
    {
      "key": "apiary",
      "name": "예시 양봉장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 양봉장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
