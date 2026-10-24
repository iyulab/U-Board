// A weekend farmers' market drawn as a risograph print: two inks only — fluorescent pink and blue — on off-white
// stock, a speckled grain, tints as halftone, the blue drum printed a hair out of register with the pink, and purple
// wherever the two overprint. The park is a plan of its paths, trees and fountain; the stalls stand in two rows along the
// avenue and the food trucks by the lawn, each a card saying what it sells and whether it still has it — blue on sale,
// a pink halftone when a few are left, solid pink and struck through once sold out. On the right the morning's figures,
// what is on at noon and the visitors by the half hour. The market is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/farmers-market.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#ff48b0"
  },
  "elements": {
    "stall": {
      "template": "<section class=\"sl {{s.state}}\"><span>{{s.word}}</span><b>{{s.name}}</b><strong>{{s.item}}</strong>{{#s.note}}<small>{{s.note}}</small>{{/s.note}}</section>",
      "style": ".sl{position:relative;height:100%;box-sizing:border-box;display:grid;align-content:end;gap:1px;padding:8px 10px;background:#f4efe3;border:3px solid #0078bf;font-family:\"Space Grotesk\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#5a3f9e}\nspan{position:absolute;top:-12px;right:8px;padding:2px 8px;font:13px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#f4efe3;background:#0078bf}\nb{font:14px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0078bf}\nstrong{font-size:18px;font-weight:800;line-height:1.15}\nsmall{font-size:12px}\n.few{border-color:#ff48b0;background:radial-gradient(rgba(255,72,176,.4) 40%,transparent 43%) 0 0/6px 6px,#f4efe3}\n.few span{background:#f4efe3;color:#ff48b0;outline:2px solid #ff48b0}\n.sold{background:#ff48b0;border-color:#ff48b0;color:#f4efe3}\n.sold span{background:#5a3f9e}\n.sold b{color:#f4efe3}\n.sold strong{text-decoration:line-through;text-decoration-thickness:3px}",
      "props": {
        "s": "object"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"o\"></i>판매 중</li><li><i class=\"f\"></i>몇 개 남음</li><li><i class=\"s\"></i>완판</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:18px;font:14px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#5a3f9e}\nli{display:flex;align-items:center;gap:6px}\ni{width:22px;height:16px;border:3px solid #0078bf;background:#f4efe3}\n.f{border-color:#ff48b0;background:radial-gradient(#ff48b0 45%,transparent 47%) 0 0/5px 5px,#f4efe3}\n.s{border-color:#ff48b0;background:#ff48b0}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}<br/>{{date}} <b>{{time}}</b></p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:8px;font-family:\"Space Grotesk\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#5a3f9e}\nh1{margin:0;font:42px/1.08 \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#ff48b0;text-shadow:4px 3px 0 rgba(0,120,191,.75)}\np{margin:0;font-size:17px;font-weight:600;line-height:1.5}\nb{font:22px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0078bf}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Space Grotesk\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#5a3f9e}\ndiv{display:grid;align-content:center;padding:8px 10px;background:radial-gradient(rgba(0,120,191,.35) 40%,transparent 42%) 0 0/6px 6px}\ndt{font-size:13px;font-weight:700}\ndd{margin:2px 0;font:30px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0078bf}\nsmall{font-size:11px}",
      "props": {
        "items": "list"
      }
    },
    "events": {
      "template": "<section class=\"ev\"><h3>오늘의 행사</h3><ol>{{#items}}<li><b>{{time}}</b><span><strong>{{name}}</strong><small>{{place}}</small></span></li>{{/items}}</ol></section>",
      "style": ".ev{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Space Grotesk\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#5a3f9e}\nh3{margin:0;justify-self:start;padding:2px 10px;font:17px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#f4efe3;background:#ff48b0;transform:rotate(-2deg)}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:6px}\nli{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:10px;padding:4px 0;border-bottom:3px dotted #0078bf}\nb{font:22px \"Archivo Black\", \"Arial Black\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#ff48b0}\nspan{display:grid}\nstrong{font-size:16px}\nsmall{font-size:13px}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "stalls": {
      "from": "market",
      "path": "/market/stalls",
      "time": "updatedAt",
      "fresh": 900,
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
        "a6": {
          "at": "/value/a6"
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
        },
        "b6": {
          "at": "/value/b6"
        },
        "t1": {
          "at": "/value/t1"
        },
        "t2": {
          "at": "/value/t2"
        },
        "t3": {
          "at": "/value/t3"
        }
      }
    },
    "now": {
      "from": "market",
      "path": "/market/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "market",
      "path": "/market/figures",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "events": {
      "from": "market",
      "path": "/market/events",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "visitors": {
      "from": "market",
      "path": "/market/visitors",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "stall-a1": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a1"
      }
    },
    "stall-a2": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a2"
      }
    },
    "stall-a3": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a3"
      }
    },
    "stall-a4": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a4"
      }
    },
    "stall-a5": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a5"
      }
    },
    "stall-a6": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "a6"
      }
    },
    "stall-b1": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b1"
      }
    },
    "stall-b2": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b2"
      }
    },
    "stall-b3": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b3"
      }
    },
    "stall-b4": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b4"
      }
    },
    "stall-b5": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b5"
      }
    },
    "stall-b6": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "b6"
      }
    },
    "stall-t1": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "t1"
      }
    },
    "stall-t2": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "t2"
      }
    },
    "stall-t3": {
      "as": "element",
      "element": "stall",
      "of": "stalls",
      "bind": {
        "s": "t3"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
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
    "events": {
      "as": "element",
      "element": "events",
      "of": "events",
      "bind": {
        "items": "value"
      }
    },
    "visitors": {
      "as": "chart.bar",
      "of": "visitors",
      "title": "30분마다 들어온 방문객(명)",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "방문객",
          "color": "#ff48b0"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22dotsBlue%22%20width%3D%227%22%20height%3D%227%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%223.5%22%20cy%3D%223.5%22%20r%3D%222%22%20fill%3D%22%230078bf%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22dotsPink%22%20width%3D%228%22%20height%3D%228%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(30)%22%3E%3Ccircle%20cx%3D%224%22%20cy%3D%224%22%20r%3D%222.2%22%20fill%3D%22%23ff48b0%22%2F%3E%3C%2Fpattern%3E%0A%3Cfilter%20id%3D%22grain%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%221.4%22%20numOctaves%3D%221%22%20seed%3D%225%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%20.2%20%200%200%200%200%20.2%20%200%200%200%200%20.3%20%200%200%200%20-2.2%201.25%22%2F%3E%3C%2Ffilter%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f4efe3%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22110%22%20width%3D%221030%22%20height%3D%22650%22%20rx%3D%2240%22%20fill%3D%22url(%23dotsPink)%22%20opacity%3D%22.16%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20380%20H%201070%20M%2040%20440%20H%201070%22%20stroke%3D%22%23ff48b0%22%20stroke-width%3D%226%22%2F%3E%0A%3Cg%20transform%3D%22translate(4%203)%22%20style%3D%22mix-blend-mode%3Amultiply%22%3E%3Cpath%20d%3D%22M%2040%20410%20H%201070%22%20stroke%3D%22%230078bf%22%20stroke-width%3D%2258%22%20stroke-opacity%3D%22.22%22%2F%3E%0A%3Ccircle%20cx%3D%22555%22%20cy%3D%22410%22%20r%3D%2262%22%20fill%3D%22%230078bf%22%20fill-opacity%3D%22.85%22%2F%3E%0A%3Ccircle%20cx%3D%2280%22%20cy%3D%22140%22%20r%3D%2234%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%3Ccircle%20cx%3D%221030%22%20cy%3D%22150%22%20r%3D%2240%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22470%22%20r%3D%2226%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22470%22%20r%3D%2230%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%3Ccircle%20cx%3D%22470%22%20cy%3D%22740%22%20r%3D%2236%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22730%22%20r%3D%2230%22%20fill%3D%22url(%23dotsBlue)%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22760%22%20width%3D%221030%22%20height%3D%22200%22%20fill%3D%22%230078bf%22%20fill-opacity%3D%22.14%22%2F%3E%3C%2Fg%3E%0A%3Ccircle%20cx%3D%22555%22%20cy%3D%22410%22%20r%3D%2240%22%20fill%3D%22none%22%20stroke%3D%22%23ff48b0%22%20stroke-width%3D%228%22%2F%3E%0A%3Ctext%20x%3D%22555%22%20y%3D%22417%22%20text-anchor%3D%22middle%22%20fill%3D%22%23f4efe3%22%20font-size%3D%2216%22%20font-family%3D'%22Archivo%20Black%22%2C%20%22Arial%20Black%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%B6%84%EC%88%98%20%EB%AC%B4%EB%8C%80%3C%2Ftext%3E%0A%3Ctext%20x%3D%2248%22%20y%3D%22402%22%20fill%3D%22%235a3f9e%22%20font-size%3D%2218%22%20font-family%3D'%22Archivo%20Black%22%2C%20%22Arial%20Black%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EB%8A%90%ED%8B%B0%EB%82%98%EB%AC%B4%20%EA%B8%B8%20%E2%86%92%3C%2Ftext%3E%0A%3Ctext%20x%3D%221000%22%20y%3D%22985%22%20text-anchor%3D%22end%22%20fill%3D%22%235a3f9e%22%20font-size%3D%2218%22%20font-family%3D'%22Archivo%20Black%22%2C%20%22Arial%20Black%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EC%9E%94%EB%94%94%20%EA%B4%91%EC%9E%A5%20%C2%B7%20%ED%91%B8%EB%93%9C%ED%8A%B8%EB%9F%AD%3C%2Ftext%3E%0A%3Ctext%20x%3D%2248%22%20y%3D%22985%22%20fill%3D%22%235a3f9e%22%20font-size%3D%2218%22%20font-family%3D'%22Archivo%20Black%22%2C%20%22Arial%20Black%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%E2%86%93%20%EC%A0%95%EB%AC%B8%20%C2%B7%20%EC%95%88%EB%82%B4%EC%86%8C%3C%2Ftext%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20filter%3D%22url(%23grain)%22%20opacity%3D%22.22%22%2F%3E%0A%3Cpath%20d%3D%22M%201090%2040%20V%20960%22%20stroke%3D%22%23ff48b0%22%20stroke-width%3D%225%22%20stroke-dasharray%3D%222%2010%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "stall-a1": [
        60,
        180,
        150,
        92
      ],
      "stall-a2": [
        225,
        180,
        150,
        92
      ],
      "stall-a3": [
        390,
        180,
        150,
        92
      ],
      "stall-a4": [
        555,
        180,
        150,
        92
      ],
      "stall-a5": [
        720,
        180,
        150,
        92
      ],
      "stall-a6": [
        885,
        180,
        150,
        92
      ],
      "stall-b1": [
        60,
        520,
        150,
        92
      ],
      "stall-b2": [
        225,
        520,
        150,
        92
      ],
      "stall-b3": [
        390,
        520,
        150,
        92
      ],
      "stall-b4": [
        555,
        520,
        150,
        92
      ],
      "stall-b5": [
        720,
        520,
        150,
        92
      ],
      "stall-b6": [
        885,
        520,
        150,
        92
      ],
      "stall-t1": [
        130,
        790,
        200,
        92
      ],
      "stall-t2": [
        430,
        790,
        200,
        92
      ],
      "stall-t3": [
        730,
        790,
        200,
        92
      ],
      "legend": [
        690,
        50,
        380,
        30
      ],
      "title": [
        1120,
        30,
        460,
        170
      ],
      "figures": [
        1120,
        220,
        460,
        110
      ],
      "events": [
        1120,
        350,
        460,
        210
      ],
      "visitors": [
        1120,
        590,
        460,
        370
      ]
    }
  }
};

export const farmersMarket: SamplePack = {
  id: "farmers-market",
  title: {
    "ko": "주말 파머스마켓 — 리소그래프",
    "en": "A weekend farmers’ market — a risograph print"
  },
  field: {
    "ko": "지역 장터·소상공",
    "en": "Local markets & small traders"
  },
  kind: {
    "ko": "공원 장터의 매대 지도",
    "en": "A map of a market’s stalls in a park"
  },
  domain: "services",
  styles: [
    "print"
  ],
  summary: {
    "ko": "공원 주말 장터의 안내판을 리소그래프 인쇄물로 — 형광 분홍과 청색 두 잉크만, 미색 종이, 점점이 박힌 결, 망점 틴트, 분홍과 반 칸 어긋난 청색 판, 두 잉크가 겹친 곳의 보라. 공원 평면(길·나무·분수 무대) 위 느티나무 길 양쪽 매대 열둘과 잔디 광장 푸드트럭 셋 — 카드마다 무엇을 파는지와 아직 있는지: 청색 판매 중, 분홍 망점 몇 개 남음, 분홍 단색에 줄 그은 완판. 오른쪽에 방문객·장바구니 대여·다회용기, 오늘의 행사, 30분마다 방문객. 장터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A park’s weekend-market board as a risograph print — two inks only, fluorescent pink and blue, on off-white stock, a speckled grain, halftone tints, the blue drum a hair out of register with the pink and purple where they overprint. On the park’s plan (paths, trees, the fountain stage) twelve stalls along the avenue and three food trucks by the lawn, each card saying what it sells and whether it still has it: blue on sale, a pink halftone when a few are left, solid pink and struck through once sold out. On the right the visitors, the shopping baskets lent and reusable containers, what is on later and the visitors by the half hour. The market is made up. Example data."
  },
  connectors: [
    {
      "key": "market",
      "name": "예시 장터 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 장터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
