// A smart farm seen from above at an angle, as a model on a table: four glasshouses with their rows of crops showing
// through the glass, the seedling house, the nutrient room with its tanks, and the packing house with its cold store.
// A tag stands over each building, pinned to its roof — the temperature inside, a second figure, and what the house is
// doing now (vents open, misting, irrigating) — and on the side the weather outside that the vents answer to, the
// day's harvest, each glasshouse's temperature through the day against the heat alarm, and the water and power used.
// Flat isometric: the drawing is the building plan raised into blocks. No public source carries a farm's houses, so
// the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/smart-farm.js';

const board: Board = {
  "board": {
    "accent": "#15803d"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><span class=\"kicker\">스마트팜 단지 · {{asOf}} 기준</span><h1>햇살농원 온실 네 동과 부속동</h1><p>동마다 안의 온도와 지금 하는 일 — 환기창·차광·관수는 바깥 날씨를 따라 자동으로 움직입니다</p></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;color:#1f2937;font-family:var(--u-widget-font-family)}\n.kicker{font-size:13px;font-weight:700;letter-spacing:.06em;color:#15803d}\nh1{margin:0;font-size:26px;line-height:1.15;letter-spacing:-.01em}\np{margin:0;font-size:13px;color:#4b5563}",
      "props": {
        "asOf": "string"
      }
    },
    "tag": {
      "template": "<div class=\"tag {{level}}\">\n  <header><b>{{name}}</b><span>{{what}}</span></header>\n  <p><strong>{{value | fixed:1}}<small>{{unit}}</small></strong><em>{{label2}} {{value2 | fixed:0}}{{unit2}}</em></p>\n  <footer><i></i>{{note}}</footer>\n</div>",
      "style": ".tag{--c:#16a34a;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:2px;padding:8px 12px 7px;border-radius:10px;background:#fff;border:1px solid #d1d5db;border-left:5px solid var(--c);box-shadow:0 4px 10px rgba(15,23,42,.10);color:#1f2937;font-family:var(--u-widget-font-family)}\n.warn{--c:#d97706}.alert{--c:#dc2626}\nheader{display:flex;align-items:baseline;gap:6px;white-space:nowrap;overflow:hidden}\nheader b{font-size:14px}\nheader span{font-size:12px;color:#6b7280;overflow:hidden;text-overflow:ellipsis}\np{margin:0;display:flex;align-items:baseline;justify-content:space-between;gap:8px;white-space:nowrap}\nstrong{font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums}\nsmall{font-size:13px;font-weight:600;color:#4b5563;margin-left:1px}\nem{font-style:normal;font-size:12px;color:#4b5563;font-variant-numeric:tabular-nums}\nfooter{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nfooter i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--c)}",
      "props": {
        "name": "string",
        "what": "string",
        "value": "number",
        "unit": "string",
        "label2": "string",
        "value2": "number",
        "unit2": "string",
        "level": "string",
        "note": "string"
      }
    },
    "weather": {
      "template": "<section class=\"wx\">\n  <header>바깥 날씨 <span>{{sky}}</span></header>\n  <dl>\n    <div><dt>기온</dt><dd>{{temp | fixed:1}}<small>°C</small></dd></div>\n    <div><dt>일사량</dt><dd>{{solar | grouped:0}}<small>W/㎡</small></dd></div>\n    <div><dt>풍속</dt><dd>{{wind | fixed:1}}<small>m/s</small></dd></div>\n  </dl>\n  <p>풍속 8m/s를 넘으면 환기창이 닫히고, 일사량 700W/㎡를 넘으면 차광막이 펼쳐집니다</p>\n</section>",
      "style": ".wx{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:6px;padding:12px 14px;border-radius:10px;background:#fff;border:1px solid #d1d5db;color:#1f2937;font-family:var(--u-widget-font-family)}\nheader{font-size:14px;font-weight:700}\nheader span{font-weight:400;color:#6b7280;margin-left:4px}\ndl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;align-items:center}\ndl div{display:grid;gap:1px}\ndt{font-size:11px;color:#6b7280}\ndd{margin:0;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}\ndd small{font-size:11px;font-weight:600;color:#6b7280;margin-left:1px}\np{margin:0;font-size:11px;line-height:1.4;color:#6b7280}",
      "props": {
        "temp": "number",
        "solar": "number",
        "wind": "number",
        "sky": "string"
      }
    }
  },
  "data": {
    "now": {
      "from": "farm",
      "path": "/farm/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "asOf": {},
        "harvest": {
          "label": "오늘 수확",
          "unit": "kg"
        },
        "harvestByHour": {},
        "water": {
          "label": "오늘 관수",
          "unit": "㎥"
        },
        "power": {
          "label": "오늘 전력",
          "unit": "kWh"
        }
      }
    },
    "houses": {
      "from": "farm",
      "path": "/farm/houses",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {},
        "value2": {},
        "level": {},
        "note": {}
      }
    },
    "weather": {
      "from": "farm",
      "path": "/farm/weather",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "temp": {},
        "solar": {},
        "wind": {},
        "sky": {}
      }
    },
    "temps": {
      "from": "farm",
      "path": "/farm/temps",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "asOf": "asOf"
      }
    },
    "tag-g1": {
      "as": "element",
      "element": "tag",
      "of": "houses[g1]",
      "props": {
        "name": "1동",
        "what": "방울토마토",
        "unit": "°C",
        "label2": "습도",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-g2": {
      "as": "element",
      "element": "tag",
      "of": "houses[g2]",
      "props": {
        "name": "2동",
        "what": "오이",
        "unit": "°C",
        "label2": "습도",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-g3": {
      "as": "element",
      "element": "tag",
      "of": "houses[g3]",
      "props": {
        "name": "3동",
        "what": "딸기",
        "unit": "°C",
        "label2": "습도",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-g4": {
      "as": "element",
      "element": "tag",
      "of": "houses[g4]",
      "props": {
        "name": "4동",
        "what": "파프리카",
        "unit": "°C",
        "label2": "습도",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-nursery": {
      "as": "element",
      "element": "tag",
      "of": "houses[nursery]",
      "props": {
        "name": "육묘장",
        "what": "모종",
        "unit": "°C",
        "label2": "습도",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-nutrient": {
      "as": "element",
      "element": "tag",
      "of": "houses[nutrient]",
      "props": {
        "name": "양액실",
        "what": "EC 농도",
        "unit": "dS/m",
        "label2": "탱크",
        "unit2": "%"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "tag-packing": {
      "as": "element",
      "element": "tag",
      "of": "houses[packing]",
      "props": {
        "name": "선별장",
        "what": "저온 저장고",
        "unit": "°C",
        "label2": "보관",
        "unit2": "상자"
      },
      "bind": {
        "value": "value",
        "value2": "value2",
        "level": "level",
        "note": "note"
      }
    },
    "weather": {
      "as": "element",
      "element": "weather",
      "of": "weather",
      "bind": {
        "temp": "temp",
        "solar": "solar",
        "wind": "wind",
        "sky": "sky"
      }
    },
    "harvest": {
      "as": "stat",
      "of": "now",
      "show": "harvest",
      "trend": "harvestByHour"
    },
    "temps": {
      "as": "chart.line",
      "of": "temps",
      "title": "동별 온도 — 오늘 (°C)",
      "x": "hour",
      "y": [
        "g1",
        "g2",
        "g3",
        "g4"
      ],
      "smooth": true,
      "valueAxisZero": false,
      "referenceLines": [
        {
          "axis": "y",
          "value": 30,
          "label": "고온 경보",
          "style": "dashed"
        }
      ],
      "series": [
        {
          "label": "1동",
          "color": "#65a30d"
        },
        {
          "label": "2동",
          "color": "#0891b2"
        },
        {
          "label": "3동",
          "color": "#dc2626"
        },
        {
          "label": "4동",
          "color": "#ca8a04"
        }
      ]
    },
    "water": {
      "as": "stat",
      "of": "now",
      "show": "water"
    },
    "power": {
      "as": "stat",
      "of": "now",
      "show": "power"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1280,
      680
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221280%22%20height%3D%22680%22%20viewBox%3D%220%200%201280%20680%22%3E%0A%3Crect%20width%3D%221280%22%20height%3D%22680%22%20fill%3D%22%23f6f8f3%22%2F%3E%0A%3Crect%20x%3D%22930%22%20y%3D%220%22%20width%3D%22350%22%20height%3D%22680%22%20fill%3D%22%23eef2e8%22%2F%3E%0A%3Cpolygon%20points%3D%22380.0%2C200.0%20860.0%2C440.0%20540.0%2C600.0%2060.0%2C360.0%22%20fill%3D%22%23e7efdc%22%20stroke%3D%22%23a3b18a%22%20stroke-width%3D%221%22%2F%3E%3Cpolygon%20points%3D%22294.0%2C243.0%20774.0%2C483.0%20766.0%2C487.0%20286.0%2C247.0%22%20fill%3D%22%23f5f0e6%22%2F%3E%3Cpolygon%20points%3D%22206.0%2C287.0%20686.0%2C527.0%20674.0%2C533.0%20194.0%2C293.0%22%20fill%3D%22%23f5f0e6%22%2F%3E%3Cpolygon%20points%3D%22612.0%2C316.0%20628.0%2C324.0%20308.0%2C484.0%20292.0%2C476.0%22%20fill%3D%22%23f5f0e6%22%2F%3E%0A%3Cellipse%20cx%3D%22216%22%20cy%3D%22296%22%20rx%3D%2211%22%20ry%3D%225%22%20fill%3D%22%23000%22%20fill-opacity%3D%22.12%22%2F%3E%3Cpath%20d%3D%22M%20212%20296%20V%20286%22%20stroke%3D%22%2378350f%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22212%22%20cy%3D%22278%22%20r%3D%2210%22%20fill%3D%22%234ade80%22%20stroke%3D%22%2315803d%22%20stroke-width%3D%22.8%22%2F%3E%3Cellipse%20cx%3D%22672%22%20cy%3D%22524%22%20rx%3D%2211%22%20ry%3D%225%22%20fill%3D%22%23000%22%20fill-opacity%3D%22.12%22%2F%3E%3Cpath%20d%3D%22M%20668%20524%20V%20514%22%20stroke%3D%22%2378350f%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22668%22%20cy%3D%22506%22%20r%3D%2210%22%20fill%3D%22%234ade80%22%20stroke%3D%22%2315803d%22%20stroke-width%3D%22.8%22%2F%3E%3Cellipse%20cx%3D%22220%22%20cy%3D%22422%22%20rx%3D%2211%22%20ry%3D%225%22%20fill%3D%22%23000%22%20fill-opacity%3D%22.12%22%2F%3E%3Cpath%20d%3D%22M%20216%20422%20V%20412%22%20stroke%3D%22%2378350f%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22216%22%20cy%3D%22404%22%20r%3D%2210%22%20fill%3D%22%234ade80%22%20stroke%3D%22%2315803d%22%20stroke-width%3D%22.8%22%2F%3E%3Cellipse%20cx%3D%22340%22%20cy%3D%22482%22%20rx%3D%2211%22%20ry%3D%225%22%20fill%3D%22%23000%22%20fill-opacity%3D%22.12%22%2F%3E%3Cpath%20d%3D%22M%20336%20482%20V%20472%22%20stroke%3D%22%2378350f%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%22336%22%20cy%3D%22464%22%20r%3D%2210%22%20fill%3D%22%234ade80%22%20stroke%3D%22%2315803d%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Cpolygon%20points%3D%22380.0%2C220.0%20580.0%2C320.0%20520.0%2C350.0%20320.0%2C250.0%22%20fill%3D%22%23d9e8cf%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22380.0%2C196.0%20580.0%2C296.0%20550.0%2C295.0%20350.0%2C195.0%22%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%22.7%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20378%20225%20L%20562%20317%22%20stroke%3D%22%2365a30d%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20363%20232.5%20L%20547%20324.5%22%20stroke%3D%22%2365a30d%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20348%20240%20L%20532%20332%22%20stroke%3D%22%2365a30d%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20333%20247.5%20L%20517%20339.5%22%20stroke%3D%22%2365a30d%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22320.0%2C250.0%20520.0%2C350.0%20520.0%2C326.0%20320.0%2C226.0%22%20fill%3D%22%23bae6fd%22%20fill-opacity%3D%22.45%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22580.0%2C320.0%20520.0%2C350.0%20520.0%2C326.0%20550.0%2C295.0%20580.0%2C296.0%22%20fill%3D%22%2393c5fd%22%20fill-opacity%3D%22.5%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22320.0%2C226.0%20520.0%2C326.0%20550.0%2C295.0%20350.0%2C195.0%22%20fill%3D%22%23f0f9ff%22%20fill-opacity%3D%22.55%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20340%20236%20L%20370%20205%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20360%20246%20L%20390%20215%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20380%20256%20L%20410%20225%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20400%20266%20L%20430%20235%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20420%20276%20L%20450%20245%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20440%20286%20L%20470%20255%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20460%20296%20L%20490%20265%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20480%20306%20L%20510%20275%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20500%20316%20L%20530%20285%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpolygon%20points%3D%22620.0%2C340.0%20820.0%2C440.0%20760.0%2C470.0%20560.0%2C370.0%22%20fill%3D%22%23d9e8cf%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22620.0%2C316.0%20820.0%2C416.0%20790.0%2C415.0%20590.0%2C315.0%22%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%22.7%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20618%20345%20L%20802%20437%22%20stroke%3D%22%23dc2626%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20603%20352.5%20L%20787%20444.5%22%20stroke%3D%22%23dc2626%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20588%20360%20L%20772%20452%22%20stroke%3D%22%23dc2626%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20573%20367.5%20L%20757%20459.5%22%20stroke%3D%22%23dc2626%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22560.0%2C370.0%20760.0%2C470.0%20760.0%2C446.0%20560.0%2C346.0%22%20fill%3D%22%23bae6fd%22%20fill-opacity%3D%22.45%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22820.0%2C440.0%20760.0%2C470.0%20760.0%2C446.0%20790.0%2C415.0%20820.0%2C416.0%22%20fill%3D%22%2393c5fd%22%20fill-opacity%3D%22.5%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22560.0%2C346.0%20760.0%2C446.0%20790.0%2C415.0%20590.0%2C315.0%22%20fill%3D%22%23f0f9ff%22%20fill-opacity%3D%22.55%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20580%20356%20L%20610%20325%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20600%20366%20L%20630%20335%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20620%20376%20L%20650%20345%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20640%20386%20L%20670%20355%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20660%20396%20L%20690%20365%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20680%20406%20L%20710%20375%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20700%20416%20L%20730%20385%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20720%20426%20L%20750%20395%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20740%20436%20L%20770%20405%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpolygon%20points%3D%22300.0%2C260.0%20500.0%2C360.0%20440.0%2C390.0%20240.0%2C290.0%22%20fill%3D%22%23d9e8cf%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22300.0%2C236.0%20500.0%2C336.0%20470.0%2C335.0%20270.0%2C235.0%22%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%22.7%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20298%20265%20L%20482%20357%22%20stroke%3D%22%2316a34a%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20283%20272.5%20L%20467%20364.5%22%20stroke%3D%22%2316a34a%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20268%20280%20L%20452%20372%22%20stroke%3D%22%2316a34a%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20253%20287.5%20L%20437%20379.5%22%20stroke%3D%22%2316a34a%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22240.0%2C290.0%20440.0%2C390.0%20440.0%2C366.0%20240.0%2C266.0%22%20fill%3D%22%23bae6fd%22%20fill-opacity%3D%22.45%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22500.0%2C360.0%20440.0%2C390.0%20440.0%2C366.0%20470.0%2C335.0%20500.0%2C336.0%22%20fill%3D%22%2393c5fd%22%20fill-opacity%3D%22.5%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22240.0%2C266.0%20440.0%2C366.0%20470.0%2C335.0%20270.0%2C235.0%22%20fill%3D%22%23f0f9ff%22%20fill-opacity%3D%22.55%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20260%20276%20L%20290%20245%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20280%20286%20L%20310%20255%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20300%20296%20L%20330%20265%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20320%20306%20L%20350%20275%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20340%20316%20L%20370%20285%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20360%20326%20L%20390%20295%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20380%20336%20L%20410%20305%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20400%20346%20L%20430%20315%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20420%20356%20L%20450%20325%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpolygon%20points%3D%22540.0%2C380.0%20740.0%2C480.0%20680.0%2C510.0%20480.0%2C410.0%22%20fill%3D%22%23d9e8cf%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22540.0%2C356.0%20740.0%2C456.0%20710.0%2C455.0%20510.0%2C355.0%22%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%22.7%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20538%20385%20L%20722%20477%22%20stroke%3D%22%23ca8a04%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20523%20392.5%20L%20707%20484.5%22%20stroke%3D%22%23ca8a04%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20508%20400%20L%20692%20492%22%20stroke%3D%22%23ca8a04%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20493%20407.5%20L%20677%20499.5%22%20stroke%3D%22%23ca8a04%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22480.0%2C410.0%20680.0%2C510.0%20680.0%2C486.0%20480.0%2C386.0%22%20fill%3D%22%23bae6fd%22%20fill-opacity%3D%22.45%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22740.0%2C480.0%20680.0%2C510.0%20680.0%2C486.0%20710.0%2C455.0%20740.0%2C456.0%22%20fill%3D%22%2393c5fd%22%20fill-opacity%3D%22.5%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22480.0%2C386.0%20680.0%2C486.0%20710.0%2C455.0%20510.0%2C355.0%22%20fill%3D%22%23f0f9ff%22%20fill-opacity%3D%22.55%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20500%20396%20L%20530%20365%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20520%20406%20L%20550%20375%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20540%20416%20L%20570%20385%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20560%20426%20L%20590%20395%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20580%20436%20L%20610%20405%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20600%20446%20L%20630%20415%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20620%20456%20L%20650%20425%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20640%20466%20L%20670%20435%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20660%20476%20L%20690%20445%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%0A%3Cpolygon%20points%3D%22200.0%2C310.0%20300.0%2C360.0%20220.0%2C400.0%20120.0%2C350.0%22%20fill%3D%22%23d9e8cf%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22200.0%2C286.0%20300.0%2C336.0%20260.0%2C340.0%20160.0%2C290.0%22%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%22.7%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20198%20315%20L%20282%20357%22%20stroke%3D%22%2386efac%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20183%20322.5%20L%20267%20364.5%22%20stroke%3D%22%2386efac%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20168%20330%20L%20252%20372%22%20stroke%3D%22%2386efac%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20153%20337.5%20L%20237%20379.5%22%20stroke%3D%22%2386efac%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20138%20345%20L%20222%20387%22%20stroke%3D%22%2386efac%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22120.0%2C350.0%20220.0%2C400.0%20220.0%2C376.0%20120.0%2C326.0%22%20fill%3D%22%23bae6fd%22%20fill-opacity%3D%22.45%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22300.0%2C360.0%20220.0%2C400.0%20220.0%2C376.0%20260.0%2C340.0%20300.0%2C336.0%22%20fill%3D%22%2393c5fd%22%20fill-opacity%3D%22.5%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22120.0%2C326.0%20220.0%2C376.0%20260.0%2C340.0%20160.0%2C290.0%22%20fill%3D%22%23f0f9ff%22%20fill-opacity%3D%22.55%22%20stroke%3D%22%23475569%22%20stroke-width%3D%22.7%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20140%20336%20L%20180%20300%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20160%20346%20L%20200%20310%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20180%20356%20L%20220%20320%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%3Cpath%20d%3D%22M%20200%20366%20L%20240%20330%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%22.5%22%2F%3E%0A%3Cpolygon%20points%3D%22260.0%2C420.0%20340.0%2C460.0%20340.0%2C438.0%20260.0%2C398.0%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22420.0%2C420.0%20340.0%2C460.0%20340.0%2C438.0%20420.0%2C398.0%22%20fill%3D%22%23cbd5e1%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22340.0%2C358.0%20420.0%2C398.0%20340.0%2C438.0%20260.0%2C398.0%22%20fill%3D%22%23f8fafc%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20326%20406%20V%20384%20A%2018%209%200%200%200%20362%20384%20V%20406%20A%2018%209%200%200%201%20326%20406%20Z%22%20fill%3D%22%2360a5fa%22%20stroke%3D%22%231e3a8a%22%20stroke-width%3D%22.6%22%2F%3E%3Cellipse%20cx%3D%22344%22%20cy%3D%22384%22%20rx%3D%2218%22%20ry%3D%229%22%20fill%3D%22%23bfdbfe%22%20stroke%3D%22%231e3a8a%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20334%20430%20V%20408%20A%2018%209%200%200%200%20370%20408%20V%20430%20A%2018%209%200%200%201%20334%20430%20Z%22%20fill%3D%22%233b82f6%22%20stroke%3D%22%231e3a8a%22%20stroke-width%3D%22.6%22%2F%3E%3Cellipse%20cx%3D%22352%22%20cy%3D%22408%22%20rx%3D%2218%22%20ry%3D%229%22%20fill%3D%22%23bfdbfe%22%20stroke%3D%22%231e3a8a%22%20stroke-width%3D%22.6%22%2F%3E%0A%3Cpolygon%20points%3D%22380.0%2C480.0%20540.0%2C560.0%20540.0%2C526.0%20380.0%2C446.0%22%20fill%3D%22%23cbd5e1%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22620.0%2C520.0%20540.0%2C560.0%20540.0%2C526.0%20620.0%2C486.0%22%20fill%3D%22%2394a3b8%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolygon%20points%3D%22460.0%2C406.0%20620.0%2C486.0%20540.0%2C526.0%20380.0%2C446.0%22%20fill%3D%22%23f1f5f9%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%22.6%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22596.0%2C532.0%20564.0%2C548.0%20564.0%2C526.0%20596.0%2C510.0%22%20fill%3D%22%23475569%22%2F%3E%0A%3Cpath%20d%3D%22M%20450%20245%20L%20450%20172%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22450%22%20cy%3D%22245%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20370%20285%20L%20228%20224%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22370%22%20cy%3D%22285%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20690%20365%20L%20690%20242%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22365%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20610%20405%20L%20776%20366%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22610%22%20cy%3D%22405%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20210%20325%20L%20204%20420%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22210%22%20cy%3D%22325%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20340%20398%20L%20340%20534%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22340%22%20cy%3D%22398%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20500%20466%20L%20616%20560%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%223%203%22%20stroke-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22500%22%20cy%3D%22466%22%20r%3D%224%22%20fill%3D%22%23fff%22%20stroke%3D%22%231f2937%22%20stroke-width%3D%221.5%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        40,
        18,
        580,
        74
      ],
      "tag-g1": [
        364,
        98,
        188,
        82
      ],
      "tag-g2": [
        56,
        150,
        188,
        82
      ],
      "tag-g3": [
        646,
        168,
        188,
        82
      ],
      "tag-g4": [
        760,
        292,
        188,
        82
      ],
      "tag-nursery": [
        32,
        420,
        188,
        82
      ],
      "tag-nutrient": [
        214,
        534,
        188,
        82
      ],
      "tag-packing": [
        600,
        560,
        188,
        82
      ],
      "weather": [
        950,
        24,
        290,
        140
      ],
      "harvest": [
        950,
        178,
        290,
        112
      ],
      "temps": [
        950,
        304,
        290,
        232
      ],
      "water": [
        950,
        550,
        140,
        104
      ],
      "power": [
        1100,
        550,
        140,
        104
      ]
    },
    "shapes": {
      "site-note": {
        "text": "단지 배치 · 태그는 각 동의 지붕에 핀으로 꽂혀 있습니다 · 예시 데이터",
        "at": [
          40,
          650
        ],
        "size": 12
      }
    }
  }
};

export const smartFarm: SamplePack = {
  id: "smart-farm",
  title: {
    "ko": "스마트팜 단지 — 아이소메트릭",
    "en": "A smart farm — isometric"
  },
  field: {
    "ko": "농업·스마트팜",
    "en": "Agriculture & smart farming"
  },
  kind: {
    "ko": "아이소메트릭 배치도",
    "en": "Isometric site plan"
  },
  domain: "agrifood",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "탁자 위 모형처럼 비스듬히 내려다본 농장 — 유리 너머로 작물 줄이 보이는 온실 네 동과 육묘장·양액실·선별장, 지붕마다 꽂힌 태그에 안의 온도와 습도, 지금 하는 일(환기창 열림·차광·관수). 옆에 환기창이 따르는 바깥 날씨, 오늘 수확량, 고온 경보와 견준 동별 온도, 관수와 전력. 예시 데이터입니다.",
    "en": "A farm seen from above at an angle, like a model on a table — four glasshouses with their crop rows showing through the glass, the seedling house, the nutrient room and the packing house, each with a tag pinned to its roof: the temperature and humidity inside and what it is doing now (vents open, shading, irrigating). Beside it the weather the vents answer to, the day’s harvest, each house’s temperature against the heat alarm, and the water and power used. Example data."
  },
  connectors: [
    {
      "key": "farm",
      "name": "예시 스마트팜 환경제어 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 농장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
