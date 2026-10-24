// A recycling centre's sorting lines kept as an instant-photo album: every line a photo on the black album page, held by
// paper corners — the photo shows the line's bale bay filled as far as it is, the white edge below carries the material,
// today's tonnage and purity in pen — and the line's state is what has been stuck on the photo as well as the word:
// nothing but a tick when it runs (정상), a strip of yellow tape when other material is getting in (혼입 주의), a red pin
// and a circled word when the bay is full and wants a truck (만재), crossed tape over a faded photo when it has stopped
// (정지). On the right, the day's intake by hour and the trucks out, on paper taped into the album. The centre is made
// up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/recycling-polaroid.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#4f6d5a"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>한빛 자원순환센터 · 선별장 앨범</h1><p>{{n.date}} {{n.time}} — 오늘 반입 {{n.intake}}</p></header>",
      "style": ".bn{height:100%;display:flex;flex-direction:column;justify-content:center;gap:4px;font-family:\"Nanum Pen Script\", \"Nanum Brush Script\", cursive;color:#e9e6dc}\nh1{margin:0;white-space:nowrap;font:40px/1 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive}\np{margin:0;white-space:nowrap;font:22px \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;opacity:.8}",
      "props": {
        "n": "object"
      }
    },
    "photo": {
      "template": "<figure class=\"ph {{p.state}}\" style=\"--f: {{p.fill}}; --tint: {{p.tint}}; --tilt: {{tilt}}deg\"><div class=\"pic\"><div class=\"bales\"></div><span class=\"bay\">베일장 {{p.fill}}%</span><i class=\"tape\"></i><i class=\"pin\"></i><i class=\"x\"></i></div><figcaption><b>{{p.name}}</b><span>오늘 {{p.today}} · 순도 {{p.purity}}</span><em>{{p.word}}</em><small>{{p.note}}</small></figcaption></figure>",
      "style": ".ph{position:absolute;inset:10px;margin:0;box-sizing:border-box;padding:12px 12px 0;background:#fbfaf5;transform:rotate(var(--tilt));box-shadow:0 6px 14px rgba(0,0,0,.55);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#2a2f3a;display:grid;grid-template-rows:160px 1fr;overflow:hidden}\n.pic{position:relative;overflow:hidden;background:linear-gradient(#cfd9df, #e8ecef 55%, #b9b4a8 56%, #a29d91)}\n.bales{position:absolute;left:10px;right:10px;bottom:0;height:calc(var(--f) * 0.9%);background:repeating-linear-gradient(90deg, transparent 0 40px, rgba(0,0,0,.28) 40px 43px), repeating-linear-gradient(0deg, var(--tint) 0 30px, rgba(0,0,0,.35) 30px 33px);border-top:2px solid rgba(0,0,0,.25)}\n.bay{position:absolute;left:8px;top:6px;padding:0 6px;font:22px \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;background:rgba(255,255,255,.75);color:#2a2f3a}\nfigcaption{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto auto;column-gap:6px;align-content:start;padding:6px 2px 0}\nb{font:28px/1.05 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;grid-column:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nspan{font:19px/1.15 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;grid-column:1 / span 2;margin-top:10px;color:#444b57;white-space:nowrap}\nem{grid-column:2;grid-row:1;align-self:center;white-space:nowrap;font:normal 27px/1 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;color:#2a2f3a;padding:0 6px}\nsmall{grid-column:1 / span 2;margin-top:6px;font:17px/1.15 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;color:#5b6270}\ni{position:absolute;display:none}\n.ok em::before{content:\"✓ \";color:#2d7a4b}\n.warn .tape{display:block;top:14px;right:-22px;width:120px;height:26px;background:rgba(244, 206, 82, .88);transform:rotate(32deg)}\n.warn .tape::after{content:\"!\";position:absolute;left:54px;top:-2px;font:800 22px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#6b4b00}\n.warn em{text-decoration:underline wavy #c48a00;text-underline-offset:4px}\n.full .pin{display:block;top:8px;left:80%;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #ff8a80, #d23a2f 60%);box-shadow:0 3px 4px rgba(0,0,0,.45)}\n.full em{border:2.5px solid #d23a2f;border-radius:50%;color:#d23a2f;padding:4px 10px}\n.stop .pic{filter:grayscale(1) contrast(.85) brightness(1.1)}\n.stop .x{display:block;inset:0;background:linear-gradient(35deg, transparent 46%, rgba(244, 206, 82, .88) 46% 56%, transparent 56%), linear-gradient(-35deg, transparent 46%, rgba(244, 206, 82, .88) 46% 56%, transparent 56%)}\n.stop em{border:2.5px solid #2a2f3a;padding:2px 8px}",
      "props": {
        "p": "object",
        "tilt": "string"
      }
    },
    "trucks": {
      "template": "<section class=\"tr\"><h2>오늘 나가는 트럭</h2><ol>{{#items}}<li class=\"{{state}}\"><time>{{time}}</time><b>{{what}}</b><span>{{to}}</span><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".tr{height:100%;box-sizing:border-box;padding:14px 18px 0 72px;font-family:\"Nanum Pen Script\", \"Nanum Brush Script\", cursive;color:#2a2f3a}\nh2{margin:0 0 10px;font:36px/1 \"Nanum Pen Script\", \"Nanum Brush Script\", cursive}\nol{margin:0;padding:0;list-style:none}\nli{display:grid;grid-template-columns:52px minmax(0,1fr) 124px 62px;gap:8px;align-items:baseline;height:34px;font:21px/34px \"Nanum Pen Script\", \"Nanum Brush Script\", cursive;white-space:nowrap}\nli>*{overflow:hidden;text-overflow:ellipsis}\ntime{font:14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;font-variant-numeric:tabular-nums;color:#5b6270}\nspan{color:#5b6270}\nem{font-style:normal;text-align:center}\n.done{color:#8a8f99}.done em{text-decoration:line-through}\n.loading em{border-bottom:2px solid #2a2f3a}\n.waiting em{color:#d23a2f}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "centre",
      "path": "/centre/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "lines": {
      "from": "centre",
      "path": "/centre/lines",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "pet": {
          "at": "/value/pet"
        },
        "can": {
          "at": "/value/can"
        },
        "glass": {
          "at": "/value/glass"
        },
        "carton": {
          "at": "/value/carton"
        },
        "plastic": {
          "at": "/value/plastic"
        },
        "vinyl": {
          "at": "/value/vinyl"
        }
      }
    },
    "intake": {
      "from": "centre",
      "path": "/centre/intake",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    },
    "trucks": {
      "from": "centre",
      "path": "/centre/trucks",
      "time": "updatedAt",
      "fresh": 900,
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
    "line-pet": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "-2"
      },
      "bind": {
        "p": "pet"
      }
    },
    "line-can": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "1.5"
      },
      "bind": {
        "p": "can"
      }
    },
    "line-glass": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "-1"
      },
      "bind": {
        "p": "glass"
      }
    },
    "line-carton": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "2"
      },
      "bind": {
        "p": "carton"
      }
    },
    "line-plastic": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "-1.5"
      },
      "bind": {
        "p": "plastic"
      }
    },
    "line-vinyl": {
      "as": "element",
      "element": "photo",
      "of": "lines",
      "props": {
        "tilt": "1"
      },
      "bind": {
        "p": "vinyl"
      }
    },
    "intake": {
      "as": "chart.bar",
      "of": "intake",
      "title": "시간대별 반입량 (t) — 15시는 10분까지",
      "x": "hour",
      "y": "tonnes",
      "series": [
        {
          "label": "반입",
          "color": "#4f6d5a"
        }
      ]
    },
    "trucks": {
      "as": "element",
      "element": "trucks",
      "of": "trucks",
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22grain%22%20width%3D%226%22%20height%3D%226%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%226%22%20height%3D%226%22%20fill%3D%22%231c1c1e%22%2F%3E%3Ccircle%20cx%3D%221%22%20cy%3D%222%22%20r%3D%22.6%22%20fill%3D%22%23242427%22%2F%3E%3Ccircle%20cx%3D%224%22%20cy%3D%225%22%20r%3D%22.5%22%20fill%3D%22%2318181a%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23grain)%22%2F%3E%0A%3Cpath%20d%3D%22M62%20122%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M328%20122%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M62%20448%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M328%20448%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M362%20122%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M628%20122%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M362%20448%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M628%20448%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M662%20122%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M928%20122%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M662%20448%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M928%20448%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M62%20492%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M328%20492%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M62%20818%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M328%20818%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M362%20492%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M628%20492%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M362%20818%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M628%20818%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M662%20492%20l30%200%20l-30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M928%20492%20l-30%200%20l30%2030%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M662%20818%20l30%200%20l-30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M928%20818%20l-30%200%20l30%20-30%20z%22%20fill%3D%22%230c0c0d%22%20stroke%3D%22%233b3b3f%22%20stroke-width%3D%221%22%2F%3E%0A%3Cg%20transform%3D%22rotate(-0.8%201290%20280)%22%3E%3Crect%20x%3D%221030%22%20y%3D%2252%22%20width%3D%22520%22%20height%3D%22456%22%20fill%3D%22%23f6f3ea%22%2F%3E%3Crect%20x%3D%221230%22%20y%3D%2238%22%20width%3D%22120%22%20height%3D%2230%22%20fill%3D%22rgba(244%2C%20206%2C%2082%2C%20.88)%22%20opacity%3D%22.8%22%20transform%3D%22rotate(-3%201290%2052)%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22rotate(0.6%201290%20750)%22%3E%3Crect%20x%3D%221030%22%20y%3D%22540%22%20width%3D%22520%22%20height%3D%22420%22%20fill%3D%22%23f6f3ea%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22618%22%20y2%3D%22618%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22652%22%20y2%3D%22652%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22686%22%20y2%3D%22686%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22720%22%20y2%3D%22720%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22754%22%20y2%3D%22754%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22788%22%20y2%3D%22788%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22822%22%20y2%3D%22822%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22856%22%20y2%3D%22856%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22890%22%20y2%3D%22890%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221046%22%20x2%3D%221534%22%20y1%3D%22924%22%20y2%3D%22924%22%20stroke%3D%22%23c9d6e6%22%20stroke-width%3D%221%22%2F%3E%3Cline%20x1%3D%221094%22%20x2%3D%221094%22%20y1%3D%22540%22%20y2%3D%22960%22%20stroke%3D%22%23e6a4a0%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%221230%22%20y%3D%22526%22%20width%3D%22120%22%20height%3D%2230%22%20fill%3D%22rgba(244%2C%20206%2C%2082%2C%20.88)%22%20opacity%3D%22.8%22%20transform%3D%22rotate(-3%201290%20540)%22%2F%3E%3C%2Fg%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        24,
        900,
        80
      ],
      "line-pet": [
        60,
        120,
        270,
        330
      ],
      "line-can": [
        360,
        120,
        270,
        330
      ],
      "line-glass": [
        660,
        120,
        270,
        330
      ],
      "line-carton": [
        60,
        490,
        270,
        330
      ],
      "line-plastic": [
        360,
        490,
        270,
        330
      ],
      "line-vinyl": [
        660,
        490,
        270,
        330
      ],
      "intake": [
        1050,
        76,
        480,
        410
      ],
      "trucks": [
        1030,
        548,
        520,
        400
      ]
    }
  }
};

export const recyclingPolaroid: SamplePack = {
  id: "recycling-polaroid",
  title: {
    "ko": "자원순환센터 선별장 — 즉석사진 앨범",
    "en": "A recycling centre’s sorting lines — an instant-photo album"
  },
  field: {
    "ko": "자원순환·재활용 선별",
    "en": "Recycling and sorting"
  },
  kind: {
    "ko": "선별 라인별 적재·순도",
    "en": "Bays and purity by sorting line"
  },
  domain: "environment",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "자원순환센터의 선별 라인 여섯을 즉석사진 앨범으로 — 라인마다 검은 앨범 종이에 모서리로 붙인 사진 한 장: 사진 속 베일장이 찬 만큼 쌓인 압축 베일, 아래 흰 여백에 펜으로 품목·오늘 처리량·순도, 그리고 상태가 낱말과 사진에 붙인 것으로 — 정상은 체크만, 혼입 주의는 노란 테이프, 만재는 빨간 압정과 동그라미 친 낱말, 정지는 빛바랜 사진에 엇갈린 테이프. 오른쪽에 테이프로 붙인 종이 위 시간대별 반입량과 오늘 나가는 트럭. 센터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A recycling centre’s six sorting lines kept as an instant-photo album — a photo held by paper corners on the black album page for every line: the line’s bale bay stacked as full as it is, the white edge below carrying the material, today’s tonnage and purity in pen, and the state in a word and in what is stuck on the photo — just a tick when it runs, a strip of yellow tape when other material is getting in, a red pin and a circled word when the bay is full and wants a truck, crossed tape over a faded photo when the line has stopped. On the right the day’s intake by hour and the trucks going out, on paper taped into the album. The centre is made up. Example data."
  },
  connectors: [
    {
      "key": "centre",
      "name": "예시 자원순환센터 선별장 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 자원순환센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
