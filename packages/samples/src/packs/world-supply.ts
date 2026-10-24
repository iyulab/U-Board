// An electronics maker's supply chain on one page, drawn the way a newspaper's data desk draws a story: a headline that
// says what changed this week, a world of grey dots, and the lanes as arcs — each from where its parts are made to the
// assembly plant, or from the plant to where the products are sold — its width the containers on it each week, its
// colour whether it is on time, slow or late. Beside the map the week's figures and the suppliers at risk; under it a
// note on what happened, the lead times of three lanes over twelve weeks, and the shipments at sea. Editorial: paper,
// a serif headline, thin rules, one colour that means late. No public source carries a company's lanes, so the values are
// example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/world-supply.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#b42318"
  },
  "elements": {
    "headline": {
      "template": "<header class=\"hl\"><p class=\"k\">{{kicker}}<span>{{date}}</span></p><h1>{{title}}</h1><p class=\"d\">{{dek}}</p></header>",
      "style": ".hl{height:100%;box-sizing:border-box;display:grid;align-content:end;gap:6px;color:#1d1d1b}\np{margin:0}\n.k{display:flex;gap:16px;font:700 14px var(--u-widget-font-family);letter-spacing:.12em;color:#b42318}\n.k span{margin-left:auto;font-weight:400;letter-spacing:.02em;color:#6b665e}\nh1{margin:0;font:700 38px/1.15 Georgia, \"Noto Serif KR\", \"Nanum Myeongjo\", serif;letter-spacing:-.01em;word-break:keep-all}\n.d{font:17px/1.45 var(--u-widget-font-family);color:#6b665e;word-break:keep-all}",
      "props": {
        "kicker": "string",
        "title": "string",
        "dek": "string",
        "date": "string"
      }
    },
    "site": {
      "template": "<span class=\"s {{role}} {{status}}\" role=\"img\" aria-label=\"{{name}}\"></span>",
      "style": ":host{display:grid;place-items:center}\n.s{box-sizing:border-box;width:10px;height:10px;border-radius:50%;background:#1f6f8b;border:2px solid #f6f3ec}\n.slow{background:#c98a0b}\n.late{background:#b42318;box-shadow:0 0 0 4px rgba(180,35,24,.18)}\n.market{background:#1d1d1b}\n.plant{width:16px;height:16px;background:#f6f3ec;border:4px solid #1d1d1b}",
      "props": {
        "role": "string",
        "status": "string",
        "name": "string"
      }
    },
    "tag": {
      "template": "<p class=\"t {{align}} {{status}}\"><b>{{name}}</b><span>{{part}} · {{days}}일</span></p>",
      "style": ".t{margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;font-family:var(--u-widget-font-family);color:#1d1d1b;line-height:1.2;white-space:nowrap}\n.right{text-align:right}\nb{font-size:14px}\nspan{font-size:12px;color:#6b665e}\n.slow span{color:#c98a0b;font-weight:700}\n.late span{color:#b42318;font-weight:700}",
      "props": {
        "name": "string",
        "part": "string",
        "days": "number",
        "status": "string",
        "align": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"f\">{{#items}}<div class=\"{{tone}}\"><dt>{{label}}</dt><dd><b>{{value}}</b><span>{{note}}</span></dd></div>{{/items}}</dl>",
      "style": ".f{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:space-between;font-family:var(--u-widget-font-family);color:#1d1d1b}\n.f div{border-top:1px solid #cfc8b8;padding-top:8px}\ndt{font-size:13px;color:#6b665e}\ndd{margin:2px 0 0;display:flex;align-items:baseline;gap:10px}\ndd b{font:700 30px/1.1 Georgia, \"Noto Serif KR\", \"Nanum Myeongjo\", serif;font-variant-numeric:tabular-nums}\ndd span{font-size:13px;color:#6b665e}\n.late b{color:#b42318}",
      "props": {
        "items": "list"
      }
    },
    "risks": {
      "template": "<section class=\"r\"><h2>위험 공급사</h2><ol>{{#items}}<li class=\"{{tone}}\"><b>{{name}}</b>{{text}}</li>{{/items}}</ol></section>",
      "style": ".r{height:100%;box-sizing:border-box;font-family:var(--u-widget-font-family);color:#1d1d1b;border-top:2px solid #1d1d1b;padding-top:8px}\nh2{margin:0 0 8px;font:700 15px var(--u-widget-font-family)}\nol{margin:0;padding:0 0 0 18px;display:grid;gap:6px;font-size:13px;line-height:1.4;word-break:keep-all}\nb{display:block;font-size:14px}\n.slow b{color:#c98a0b}\n.late b{color:#b42318}",
      "props": {
        "items": "list"
      }
    },
    "note": {
      "template": "<aside class=\"n\"><h2>{{title}}</h2><p>{{text}}</p></aside>",
      "style": ".n{height:100%;box-sizing:border-box;font-family:var(--u-widget-font-family);color:#1d1d1b}\nh2{margin:0 0 8px;font:700 22px/1.25 Georgia, \"Noto Serif KR\", \"Nanum Myeongjo\", serif;word-break:keep-all}\np{margin:0;font-size:15px;line-height:1.6;color:#3b3934;word-break:keep-all}",
      "props": {
        "title": "string",
        "text": "string"
      }
    },
    "shipments": {
      "template": "<section class=\"sh\"><h2>운송 중</h2><table><thead><tr><th>구간</th><th>선박</th><th>도착</th><th></th></tr></thead><tbody>{{#items}}<tr class=\"{{tone}}\"><td>{{lane}}</td><td>{{vessel}}</td><td>{{eta}}</td><td>{{delay}}</td></tr>{{/items}}</tbody></table></section>",
      "style": ".sh{height:100%;box-sizing:border-box;font-family:var(--u-widget-font-family);color:#1d1d1b}\nh2{margin:0 0 6px;font:700 15px var(--u-widget-font-family)}\ntable{width:100%;border-collapse:collapse;font-size:13px}\nth{text-align:left;font-weight:400;color:#6b665e;border-bottom:1px solid #1d1d1b;padding:4px 4px}\ntd{padding:5px 4px;border-bottom:1px solid #cfc8b8;white-space:nowrap}\ntd:last-child{text-align:right;font-weight:700}\n.slow td:last-child{color:#c98a0b}\n.late td:last-child{color:#b42318}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<dl class=\"lg\"><div><dt><i class=\"ok\"></i></dt><dd>평소 리드타임</dd></div><div><dt><i class=\"slow\"></i></dt><dd>평소보다 2일 이상 늦음</dd></div><div><dt><i class=\"late\"></i></dt><dd>평소보다 4일 이상 늦음</dd></div><div><dt><i class=\"w\"></i></dt><dd>굵기 = 주간 컨테이너(TEU)</dd></div><div><dt><i class=\"p\"></i></dt><dd>조립공장 · <i class=\"m\"></i> 판매 물류센터</dd></div></dl>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;display:grid;align-content:start;gap:8px;font-family:var(--u-widget-font-family);font-size:13px;color:#6b665e}\n.lg div{display:flex;align-items:center;gap:10px}\ndt{width:34px;display:flex;align-items:center}\ndd{margin:0}\ni{display:inline-block;width:34px;height:3px;border-radius:2px}\n.ok{background:#1f6f8b}\n.slow{background:#c98a0b}\n.late{background:#b42318}\n.w{height:7px;background:#6b665e}\n.p{width:12px;height:12px;border-radius:50%;border:3px solid #1d1d1b;box-sizing:border-box}\n.m{width:9px;height:9px;border-radius:50%;background:#1d1d1b;vertical-align:-1px}"
    }
  },
  "data": {
    "story": {
      "from": "supply",
      "path": "/supply/story",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "kicker": {},
        "title": {},
        "dek": {},
        "date": {}
      }
    },
    "lanes": {
      "from": "supply",
      "path": "/supply/lanes",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "status": {
          "state": {
            "ok": "past",
            "slow": "warn",
            "late": "alarm",
            "*": "off"
          }
        },
        "part": {},
        "days": {},
        "teu": {}
      }
    },
    "plant": {
      "from": "supply",
      "path": "/supply/plant",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "stockDays": {}
      }
    },
    "figures": {
      "from": "supply",
      "path": "/supply/figures",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "risks": {
      "from": "supply",
      "path": "/supply/risks",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    },
    "note": {
      "from": "supply",
      "path": "/supply/note",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "title": {},
        "text": {}
      }
    },
    "leadTimes": {
      "from": "supply",
      "path": "/supply/leadTimes",
      "list": "/value",
      "fresh": 86400,
      "answerTime": "/updatedAt"
    },
    "shipments": {
      "from": "supply",
      "path": "/supply/shipments",
      "time": "updatedAt",
      "fresh": 86400,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "headline": {
      "as": "element",
      "element": "headline",
      "of": "story",
      "bind": {
        "kicker": "kicker",
        "title": "title",
        "dek": "dek",
        "date": "date"
      }
    },
    "site-pyeongtaek": {
      "as": "element",
      "element": "site",
      "props": {
        "role": "plant",
        "status": "ok",
        "name": "평택 조립공장"
      }
    },
    "site-hsinchu": {
      "as": "element",
      "element": "site",
      "of": "lanes[hsinchu]",
      "props": {
        "role": "supplier",
        "name": "신주"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-osaka": {
      "as": "element",
      "element": "site",
      "of": "lanes[osaka]",
      "props": {
        "role": "supplier",
        "name": "오사카"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-shenzhen": {
      "as": "element",
      "element": "site",
      "of": "lanes[shenzhen]",
      "props": {
        "role": "supplier",
        "name": "선전"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-penang": {
      "as": "element",
      "element": "site",
      "of": "lanes[penang]",
      "props": {
        "role": "supplier",
        "name": "페낭"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-munich": {
      "as": "element",
      "element": "site",
      "of": "lanes[munich]",
      "props": {
        "role": "supplier",
        "name": "뮌헨"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-austin": {
      "as": "element",
      "element": "site",
      "of": "lanes[austin]",
      "props": {
        "role": "supplier",
        "name": "오스틴"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-rotterdam": {
      "as": "element",
      "element": "site",
      "of": "lanes[rotterdam]",
      "props": {
        "role": "market",
        "name": "로테르담"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-longbeach": {
      "as": "element",
      "element": "site",
      "of": "lanes[longbeach]",
      "props": {
        "role": "market",
        "name": "롱비치"
      },
      "bind": {
        "status": "status"
      }
    },
    "site-singapore": {
      "as": "element",
      "element": "site",
      "of": "lanes[singapore]",
      "props": {
        "role": "market",
        "name": "싱가포르"
      },
      "bind": {
        "status": "status"
      }
    },
    "tag-hsinchu": {
      "as": "element",
      "element": "tag",
      "of": "lanes[hsinchu]",
      "props": {
        "name": "신주",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-osaka": {
      "as": "element",
      "element": "tag",
      "of": "lanes[osaka]",
      "props": {
        "name": "오사카",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-shenzhen": {
      "as": "element",
      "element": "tag",
      "of": "lanes[shenzhen]",
      "props": {
        "name": "선전",
        "align": "right"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-penang": {
      "as": "element",
      "element": "tag",
      "of": "lanes[penang]",
      "props": {
        "name": "페낭",
        "align": "right"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-munich": {
      "as": "element",
      "element": "tag",
      "of": "lanes[munich]",
      "props": {
        "name": "뮌헨",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-austin": {
      "as": "element",
      "element": "tag",
      "of": "lanes[austin]",
      "props": {
        "name": "오스틴",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-rotterdam": {
      "as": "element",
      "element": "tag",
      "of": "lanes[rotterdam]",
      "props": {
        "name": "로테르담",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-longbeach": {
      "as": "element",
      "element": "tag",
      "of": "lanes[longbeach]",
      "props": {
        "name": "롱비치",
        "align": "right"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "tag-singapore": {
      "as": "element",
      "element": "tag",
      "of": "lanes[singapore]",
      "props": {
        "name": "싱가포르",
        "align": "left"
      },
      "bind": {
        "part": "part",
        "days": "days",
        "status": "status"
      }
    },
    "plant-tag": {
      "as": "element",
      "element": "tag",
      "of": "plant",
      "props": {
        "name": "평택 조립공장",
        "part": "부품 재고",
        "status": "ok",
        "align": "left"
      },
      "bind": {
        "days": "stockDays"
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
    "risks": {
      "as": "element",
      "element": "risks",
      "of": "risks",
      "bind": {
        "items": "value"
      }
    },
    "note": {
      "as": "element",
      "element": "note",
      "of": "note",
      "bind": {
        "title": "title",
        "text": "text"
      }
    },
    "lead-times": {
      "as": "chart.line",
      "of": "leadTimes",
      "title": "리드타임 12주(일)",
      "x": "week",
      "y": [
        "hsinchu",
        "penang",
        "shenzhen"
      ],
      "valueAxisZero": false,
      "series": [
        {
          "label": "신주 → 평택",
          "color": "#b42318"
        },
        {
          "label": "페낭 → 평택",
          "color": "#c98a0b"
        },
        {
          "label": "선전 → 평택",
          "color": "#1f6f8b"
        }
      ]
    },
    "shipments": {
      "as": "element",
      "element": "shipments",
      "of": "shipments",
      "bind": {
        "items": "value"
      }
    },
    "legend": {
      "as": "element",
      "element": "legend"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22%23f6f3ec%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20138%20L%201560%20138%22%20stroke%3D%22%231d1d1b%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%201250%20150%20L%201250%20600%20M%2040%20616%20L%201560%20616%22%20stroke%3D%22%23cfc8b8%22%20stroke-width%3D%221%22%2F%3E%0A%3Cg%20fill%3D%22%23d6cfbf%22%3E%3Ccircle%20cx%3D%2245%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221215%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221225%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221235%22%20cy%3D%22155%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2245%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221215%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221225%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221235%22%20cy%3D%22165%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2245%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22795%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22815%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221215%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221225%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221235%22%20cy%3D%22175%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22665%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22675%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22685%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22695%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22705%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22715%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22725%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22785%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22795%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22815%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22835%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22845%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22855%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22865%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22875%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22885%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22895%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22185%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2255%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2265%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22665%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22675%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22685%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22695%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22705%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22715%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22745%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22775%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22795%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22815%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22835%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22845%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22855%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22865%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22875%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22885%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22895%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22195%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22675%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22685%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22695%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22775%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22785%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22795%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22815%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22835%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22845%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22855%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22865%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22875%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22885%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22895%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22205%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22865%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22875%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22885%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22895%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22215%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22655%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22785%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22885%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22895%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22225%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22235%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22245%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22255%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22265%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22275%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22285%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22925%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22295%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22935%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22305%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22945%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22955%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22315%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22325%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22335%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22965%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22325%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22365%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22415%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22425%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22435%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22335%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22305%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22315%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22405%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22805%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22975%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22985%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22345%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22295%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22995%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22355%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221025%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22365%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22385%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221045%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22375%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2285%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%2295%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22115%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22135%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22395%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22385%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22145%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22445%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22395%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22265%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22455%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22405%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22155%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22415%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22475%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221055%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22425%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22485%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22495%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22435%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221065%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221195%22%20cy%3D%22445%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22455%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22165%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22245%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22255%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22465%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221185%22%20cy%3D%22475%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22235%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221165%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221175%22%20cy%3D%22485%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22275%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22505%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22495%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22225%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221155%22%20cy%3D%22505%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22185%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22205%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22215%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22525%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22535%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22545%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22565%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221145%22%20cy%3D%22515%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22515%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22575%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22585%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22625%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221135%22%20cy%3D%22525%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22595%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22605%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22615%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221125%22%20cy%3D%22535%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22545%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22545%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22545%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221115%22%20cy%3D%22545%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22695%22%20cy%3D%22555%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22555%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22555%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221105%22%20cy%3D%22555%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22685%22%20cy%3D%22565%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22565%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22565%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22565%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%22355%22%20cy%3D%22575%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221075%22%20cy%3D%22575%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22575%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22575%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22585%22%20r%3D%223.3%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22595%22%20r%3D%223.3%22%2F%3E%3C%2Fg%3E%0A%3C%2Fsvg%3E",
    "place": {
      "headline": [
        40,
        18,
        1520,
        112
      ],
      "site-pyeongtaek": [
        538,
        277.66666666666663,
        18,
        18
      ],
      "site-hsinchu": [
        517.6666666666667,
        318.33333333333337,
        18,
        18
      ],
      "site-osaka": [
        566,
        285.3333333333333,
        18,
        18
      ],
      "site-shenzhen": [
        494.6666666666667,
        326,
        18,
        18
      ],
      "site-penang": [
        448.6666666666667,
        383,
        18,
        18
      ],
      "site-munich": [
        153,
        240.66666666666666,
        18,
        18
      ],
      "site-austin": [
        988.6666666666667,
        300,
        18,
        18
      ],
      "site-rotterdam": [
        129.33333333333331,
        228,
        18,
        18
      ],
      "site-longbeach": [
        920.3333333333334,
        288.33333333333337,
        18,
        18
      ],
      "site-singapore": [
        462,
        402,
        18,
        18
      ],
      "tag-hsinchu": [
        538.6666666666667,
        308.33333333333337,
        120,
        34
      ],
      "tag-osaka": [
        587,
        273.3333333333333,
        120,
        34
      ],
      "tag-shenzhen": [
        371.6666666666667,
        312,
        120,
        34
      ],
      "tag-penang": [
        325.6666666666667,
        353,
        120,
        34
      ],
      "tag-munich": [
        172,
        240.66666666666663,
        120,
        34
      ],
      "tag-austin": [
        1009.6666666666667,
        286,
        120,
        34
      ],
      "tag-rotterdam": [
        114.33333333333331,
        176,
        120,
        34
      ],
      "tag-longbeach": [
        797.3333333333334,
        286.33333333333337,
        120,
        34
      ],
      "tag-singapore": [
        481.33333333333337,
        388.6666666666667,
        120,
        34
      ],
      "plant-tag": [
        561,
        234.66666666666663,
        130,
        34
      ],
      "figures": [
        1270,
        150,
        290,
        262
      ],
      "risks": [
        1270,
        428,
        290,
        172
      ],
      "note": [
        40,
        636,
        360,
        244
      ],
      "lead-times": [
        420,
        630,
        420,
        250
      ],
      "shipments": [
        860,
        636,
        380,
        244
      ],
      "legend": [
        1270,
        640,
        290,
        160
      ]
    },
    "links": {
      "lane-hsinchu": {
        "from": "site-hsinchu",
        "to": "site-pyeongtaek",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[hsinchu]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-osaka": {
        "from": "site-osaka",
        "to": "site-pyeongtaek",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[osaka]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-shenzhen": {
        "from": "site-shenzhen",
        "to": "site-pyeongtaek",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[shenzhen]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-penang": {
        "from": "site-penang",
        "to": "site-pyeongtaek",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[penang]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-munich": {
        "from": "site-munich",
        "to": "site-pyeongtaek",
        "label": "{{days}}일",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[munich]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-austin": {
        "from": "site-austin",
        "to": "site-pyeongtaek",
        "label": "{{days}}일",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[austin]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-rotterdam": {
        "from": "site-pyeongtaek",
        "to": "site-rotterdam",
        "label": "{{days}}일",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[rotterdam]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-longbeach": {
        "from": "site-pyeongtaek",
        "to": "site-longbeach",
        "label": "{{days}}일",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[longbeach]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      },
      "lane-singapore": {
        "from": "site-pyeongtaek",
        "to": "site-singapore",
        "show": "status",
        "weight": {
          "field": "teu",
          "bands": [
            2,
            8,
            3.5,
            15,
            5,
            25,
            7
          ]
        },
        "of": "lanes[singapore]",
        "width": 3,
        "arrow": "end",
        "route": "curved"
      }
    }
  }
};

export const worldSupply: SamplePack = {
  id: "world-supply",
  title: {
    "ko": "전자부품 공급망 — 신문 데이터 지면",
    "en": "An electronics supply chain — a newspaper’s data page"
  },
  field: {
    "ko": "제조·공급망",
    "en": "Manufacturing & supply chain"
  },
  kind: {
    "ko": "세계 지도(점 지도 · 흐름 호)",
    "en": "A world map (dots and flow arcs)"
  },
  domain: "manufacturing",
  styles: [
    "print"
  ],
  summary: {
    "ko": "전자제품 회사의 공급망을 신문 데이터 지면처럼 — 이번 주에 무엇이 바뀌었는지 말하는 제목, 회색 점으로 찍은 세계, 부품 공급사에서 조립공장으로, 공장에서 판매 물류센터로 가는 구간을 곡선 호로(굵기 = 주간 컨테이너, 색 = 제때·느림·늦음). 옆에 이번 주 수치와 위험 공급사, 아래에 무슨 일이 있었는지 한 단락, 세 구간의 12주 리드타임, 운송 중인 선적. 종이색 바탕, 세리프 제목, 늦음만 붉은색. 예시 데이터입니다.",
    "en": "An electronics maker’s supply chain drawn as a newspaper’s data page — a headline saying what changed this week, a world of grey dots, and the lanes as arcs from the parts suppliers to the assembly plant and from the plant to the sales centres (width = containers a week, colour = on time, slow or late). Beside it the week’s figures and the suppliers at risk; under it a paragraph on what happened, three lanes’ lead times over twelve weeks and the shipments at sea. Paper, a serif headline, red only for late. Example data."
  },
  connectors: [
    {
      "key": "supply",
      "name": "예시 공급망 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 기업이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
