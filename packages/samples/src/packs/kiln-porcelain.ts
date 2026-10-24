// A pottery studio's kilns drawn as blue-and-white porcelain: every kiln a plate painted in cobalt — a band of waves on
// the rim, the kiln's name and kind, its temperature large in the well — with a ring round the well filled as far as the
// firing has gone and a motif in the centre for its stage: flames heating up, a cloud holding at the top, waves cooling,
// a plain well when it waits. On the right the wood kiln's firing curve, planned against measured, and the glaze batches
// of the day on a strip of hanji. The studio and its kilns are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/kiln-porcelain.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#1f3f8f"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>물빛 도예 공방</h1><p>가마 넷 · {{n.date}} {{n.time}}</p></header>",
      "style": ".bn{height:100%;display:flex;align-items:baseline;gap:22px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f3f8f}\nh1{margin:0;font:700 46px \"Nanum Brush Script\", \"Nanum Pen Script\", \"Gungsuh\", serif}\np{margin:0;font-size:16px;letter-spacing:.08em;color:#6f8ccc}",
      "props": {
        "n": "object"
      }
    },
    "plate": {
      "template": "<article class=\"pl {{k.stage}}\" style=\"--p: {{k.progress}}\"><div class=\"rim\"></div><div class=\"ring\"></div><div class=\"well\"><p class=\"kind\">{{k.kind}}</p><h2>{{k.name}}</h2><p class=\"t\"><b>{{k.temp}}</b>℃</p><p class=\"goal\">목표 {{k.target}}℃ · {{k.eta}}</p><p class=\"word\"><i></i>{{k.word}}</p></div></article>",
      "style": ".pl{position:relative;height:100%;box-sizing:border-box;border-radius:50%;background:#f6f8fb;box-shadow:inset 0 0 0 3px #1f3f8f,inset 0 0 0 7px #f6f8fb,inset 0 0 0 9px #1f3f8f;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f3f8f}\n.rim{position:absolute;inset:12px;border-radius:50%;background:repeating-conic-gradient(#1f3f8f 0 4deg, #f6f8fb 4deg 9deg, #6f8ccc 9deg 12deg, #f6f8fb 12deg 15deg);-webkit-mask:radial-gradient(closest-side, transparent 86%, #000 86.5% 95%, transparent 95.5%);mask:radial-gradient(closest-side, transparent 86%, #000 86.5% 95%, transparent 95.5%)}\n.ring{position:absolute;inset:60px;border-radius:50%;background:conic-gradient(#1f3f8f calc(var(--p) * 1%), #dfe7f5 0);-webkit-mask:radial-gradient(closest-side, transparent 84%, #000 84.5% 99%, transparent 99.5%);mask:radial-gradient(closest-side, transparent 84%, #000 84.5% 99%, transparent 99.5%)}\n.well{position:absolute;inset:86px;border-radius:50%;display:grid;align-content:center;justify-items:center;text-align:center;background:radial-gradient(circle, #f6f8fb 60%, #dfe7f5)}\n.kind{margin:0;font-size:13px;letter-spacing:.2em;color:#6f8ccc}\nh2{margin:2px 0 0;font:700 34px \"Nanum Brush Script\", \"Nanum Pen Script\", \"Gungsuh\", serif;color:#1f3f8f}\n.t{margin:0;font-size:18px}\n.t b{font:800 48px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:-1px}\n.goal{margin:0;font-size:12px;color:#6f8ccc}\n.word{margin:8px 0 0;display:flex;align-items:center;gap:6px;padding:2px 12px;border:2px solid #1f3f8f;border-radius:999px;font-size:14px;font-weight:800}\ni{font-style:normal;font-size:16px}\n.heat i::before{content:\"火\"}.soak i::before{content:\"雲\"}.cool i::before{content:\"水\"}.idle i::before{content:\"空\"}\n.heat .word{background:#1f3f8f;color:#f6f8fb}\n.soak .word{border-style:double;border-width:4px}\n.cool .word{border-style:dashed}\n.idle{opacity:.75}.idle .word{border-color:#6f8ccc;color:#6f8ccc}",
      "props": {
        "k": "object"
      }
    },
    "batches": {
      "template": "<section class=\"bt\"><h2>오늘 굽는 것</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{kiln}}</b><span>{{what}}</span><small>{{glaze}}</small><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".bt{height:100%;box-sizing:border-box;padding:14px 20px;background:#fbf7ee;border-top:3px solid #1f3f8f;border-bottom:3px solid #1f3f8f;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#1f3f8f}\nh2{margin:0 0 8px;font:700 24px \"Nanum Brush Script\", \"Nanum Pen Script\", \"Gungsuh\", serif}\nol{margin:0;padding:0;list-style:none;display:grid;gap:4px}\nli{display:grid;grid-template-columns:70px 1fr 110px 74px;gap:8px;align-items:baseline;font-size:13px;line-height:28px;border-bottom:1px dashed #6f8ccc}\nsmall{color:#6f8ccc}\nem{font-style:normal;font-weight:800;text-align:center;border:1.5px solid currentColor;border-radius:4px;line-height:20px}\n.done em{color:#6f8ccc}.firing em{background:#1f3f8f;color:#f6f8fb;border-color:#1f3f8f}.loading em{border-style:dashed}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "studio",
      "path": "/studio/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "kilns": {
      "from": "studio",
      "path": "/studio/kilns",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "gas": {
          "at": "/value/gas"
        },
        "electric1": {
          "at": "/value/electric1"
        },
        "electric2": {
          "at": "/value/electric2"
        },
        "wood": {
          "at": "/value/wood"
        }
      }
    },
    "curve": {
      "from": "studio",
      "path": "/studio/curve",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "batches": {
      "from": "studio",
      "path": "/studio/batches",
      "time": "updatedAt",
      "fresh": 600,
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
    "kiln-gas": {
      "as": "element",
      "element": "plate",
      "of": "kilns",
      "bind": {
        "k": "gas"
      }
    },
    "kiln-electric1": {
      "as": "element",
      "element": "plate",
      "of": "kilns",
      "bind": {
        "k": "electric1"
      }
    },
    "kiln-electric2": {
      "as": "element",
      "element": "plate",
      "of": "kilns",
      "bind": {
        "k": "electric2"
      }
    },
    "kiln-wood": {
      "as": "element",
      "element": "plate",
      "of": "kilns",
      "bind": {
        "k": "wood"
      }
    },
    "curve": {
      "as": "chart.line",
      "of": "curve",
      "title": "장작가마 소성 곡선 (℃)",
      "x": "hour",
      "y": [
        "plan",
        "measured"
      ],
      "series": [
        {
          "label": "계획",
          "color": "#6f8ccc"
        },
        {
          "label": "실측",
          "color": "#1f3f8f"
        }
      ]
    },
    "batches": {
      "as": "element",
      "element": "batches",
      "of": "batches",
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22cloth%22%20width%3D%2240%22%20height%3D%2240%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%2240%22%20height%3D%2240%22%20fill%3D%22%23e9efe6%22%2F%3E%3Cpath%20d%3D%22M0%2020%20H40%20M20%200%20V40%22%20stroke%3D%22%23dde5d9%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23cloth)%22%2F%3E%0A%3Cg%20transform%3D%22translate(980%20980)%20scale(1.6)%22%20stroke%3D%22%236f8ccc%22%20fill%3D%22none%22%20opacity%3D%22.35%22%3E%3Cpath%20d%3D%22M0%200%20C%2040%20-20%2C%2070%20-60%2C%20120%20-70%20M60%20-40%20C%2080%20-70%2C%2090%20-90%2C%20110%20-120%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%22118%22%20cy%3D%22-72%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%22-122%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%2270%22%20cy%3D%22-50%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%22-18%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(40%201000)%20scale(1.2)%22%20stroke%3D%22%236f8ccc%22%20fill%3D%22none%22%20opacity%3D%22.35%22%3E%3Cpath%20d%3D%22M0%200%20C%2040%20-20%2C%2070%20-60%2C%20120%20-70%20M60%20-40%20C%2080%20-70%2C%2090%20-90%2C%20110%20-120%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%22118%22%20cy%3D%22-72%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%22-122%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%2270%22%20cy%3D%22-50%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%22-18%22%20r%3D%229%22%20fill%3D%22%23dfe7f5%22%20stroke-width%3D%222%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%221010%22%20y%3D%2236%22%20width%3D%22560%22%20height%3D%22928%22%20rx%3D%226%22%20fill%3D%22%23f6f8fb%22%20stroke%3D%22%231f3f8f%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%221022%22%20y%3D%2248%22%20width%3D%22536%22%20height%3D%22904%22%20rx%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%231f3f8f%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        24,
        900,
        80
      ],
      "kiln-gas": [
        60,
        120,
        400,
        400
      ],
      "kiln-electric1": [
        520,
        120,
        400,
        400
      ],
      "kiln-electric2": [
        60,
        560,
        400,
        400
      ],
      "kiln-wood": [
        520,
        560,
        400,
        400
      ],
      "curve": [
        1040,
        64,
        500,
        520
      ],
      "batches": [
        1030,
        620,
        520,
        300
      ]
    }
  }
};

export const kilnPorcelain: SamplePack = {
  id: "kiln-porcelain",
  title: {
    "ko": "도예 공방 가마 — 청화백자",
    "en": "A pottery studio’s kilns — blue-and-white porcelain"
  },
  field: {
    "ko": "공예·도예 공방",
    "en": "Crafts and pottery"
  },
  kind: {
    "ko": "가마별 소성 진행",
    "en": "Firings by kiln"
  },
  domain: "services",
  styles: [
    "korean",
    "craft"
  ],
  summary: {
    "ko": "도예 공방의 가마 넷을 청화백자로 — 가마마다 코발트로 그린 접시 하나: 전에 물결 띠, 가마 이름과 종류, 굽 안에 큰 온도, 굽을 두른 고리가 소성이 나아간 만큼 차고, 가운데 단계가 낱말과 글자 문양으로 — 오르는 중 火(채운 띠), 머무는 중 雲(겹선), 식는 중 水(점선), 쉬는 중 空(흐리게). 오른쪽에 장작가마의 계획 대 실측 소성 곡선, 한지 띠 위에 오늘 굽는 것. 공방과 가마는 지어낸 것이라 예시 데이터입니다.",
    "en": "A pottery studio’s four kilns drawn as blue-and-white porcelain — a plate painted in cobalt for every kiln: a band of waves on the rim, the kiln’s name and kind, its temperature large in the well, a ring round the well filled as far as the firing has gone, and the stage in a word and a character — 火 heating up (a filled band), 雲 holding at the top (a double line), 水 cooling (dashed), 空 waiting (faded). On the right the wood kiln’s firing curve, planned against measured, and the day’s glaze batches on a strip of hanji. The studio and its kilns are made up. Example data."
  },
  connectors: [
    {
      "key": "studio",
      "name": "예시 공방 가마 제어 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 공방·가마가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
