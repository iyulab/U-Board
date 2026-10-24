// A city hotel's day at a glance, the screen behind the front desk and in the general manager's office: how full the
// house is and what a night sells for, every room's state floor by floor, who arrives and leaves through the day, the
// housekeeping crews' progress, what guests have asked for, and where the day's revenue comes from. The glass style:
// a dusk gradient with soft lights behind it, every panel a frosted pane that blurs what is behind it, white type.
// No public source carries a hotel's rooms this way, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/hotel-glass.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#f9a8d4"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><h1>{{name}}</h1><p>{{date}}</p><span class=\"wx\">{{weather}} <b>{{temp | fixed:0}}°</b></span><time>{{time}}</time></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:22px;padding:0 10px;font-family:var(--u-widget-font-family);color:#ffffff}\nh1{margin:0;font-size:28px;font-weight:800;letter-spacing:.02em}\np{margin:0;font-size:16px;color:rgba(255,255,255,.72)}\n.wx{margin-left:auto;padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);font-size:15px}\n.wx b{font-variant-numeric:tabular-nums}\ntime{font-size:34px;font-weight:300;font-variant-numeric:tabular-nums;letter-spacing:.04em}",
      "props": {
        "name": "string",
        "date": "string",
        "time": "string",
        "weather": "string",
        "temp": "number"
      }
    },
    "kpi": {
      "template": "<section class=\"kpi {{trend}}\"><h2>{{label}}</h2><p><b>{{value | grouped:0}}</b><span>{{unit}}</span><em>{{delta}}</em></p><small>{{note}}</small></section>",
      "style": ".kpi{--c:#6ee7b7;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:4px;font-family:var(--u-widget-font-family);color:#ffffff}\n.down{--c:#fda4af}.flat{--c:rgba(255,255,255,.72)}\nh2{margin:0;font-size:15px;font-weight:600;color:rgba(255,255,255,.72)}\np{margin:0;display:flex;align-items:baseline;gap:6px}\nb{font-size:44px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}\nspan{font-size:17px;color:rgba(255,255,255,.72)}\nem{margin-left:auto;padding:2px 10px;border-radius:999px;background:color-mix(in srgb,var(--c) 22%,transparent);color:var(--c);font-style:normal;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}\nsmall{font-size:13px;color:rgba(255,255,255,.72)}",
      "props": {
        "label": "string",
        "value": "number",
        "unit": "string",
        "delta": "string",
        "trend": "string",
        "note": "string"
      }
    },
    "rooms": {
      "template": "<section class=\"house\"><ul class=\"key\"><li class=\"occupied\">투숙 {{counts.occupied}}</li><li class=\"arriving\">도착 예정 {{counts.arriving}}</li><li class=\"departing\">퇴실 예정 {{counts.departing}}</li><li class=\"vacant\">빈 방 {{counts.vacant}}</li><li class=\"dirty\">정비 필요 {{counts.dirty}}</li><li class=\"blocked\">점검 {{counts.blocked}}</li></ul><ol class=\"rooms\">{{#rooms}}<li class=\"{{state}}\">{{no}}</li>{{/rooms}}</ol></section>",
      "style": ".house{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:12px;font-family:var(--u-widget-font-family);color:#ffffff}\n.key{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:rgba(255,255,255,.72);font-variant-numeric:tabular-nums}\n.key li::before{content:'';display:inline-block;width:10px;height:10px;margin-right:6px;border-radius:3px;background:var(--c);vertical-align:-1px}\nli{--c:rgba(255,255,255,.2)}\n.occupied{--c:#7dd3fc}.arriving{--c:#6ee7b7}.departing{--c:#fcd34d}.vacant{--c:rgba(255,255,255,.28)}.dirty{--c:#fda4af}.blocked{--c:#a8a29e}\n.rooms{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(16,1fr);grid-auto-rows:1fr;gap:4px}\n.rooms li{display:grid;place-items:center;border-radius:5px;background:color-mix(in srgb,var(--c) 55%,transparent);border:1px solid color-mix(in srgb,var(--c) 85%,white);font-size:10px;font-variant-numeric:tabular-nums;color:#fff}\n.rooms .vacant{background:rgba(255,255,255,.08);color:rgba(255,255,255,.72)}",
      "props": {
        "rooms": "list",
        "counts": "object"
      }
    },
    "crews": {
      "template": "<ul class=\"crews\">{{#crews}}<li style=\"--s: {{share}}\"><b>{{name}}</b><small>{{floors}}</small><span><i></i></span><em>{{done}}/{{total}}</em></li>{{/crews}}</ul>",
      "style": ".crews{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:10px;font-family:var(--u-widget-font-family);color:#ffffff}\nli{display:grid;grid-template-columns:64px 70px 1fr 54px;align-items:center;gap:10px}\nb{font-size:15px}\nsmall{font-size:13px;color:rgba(255,255,255,.72)}\nspan{height:8px;border-radius:4px;background:rgba(255,255,255,.18);overflow:hidden}\nspan i{display:block;height:100%;width:calc(var(--s) * 1%);border-radius:4px;background:linear-gradient(90deg,#7dd3fc,#6ee7b7)}\nem{font-style:normal;font-size:14px;text-align:right;font-variant-numeric:tabular-nums}",
      "props": {
        "crews": "list"
      }
    },
    "requests": {
      "template": "<ul class=\"asks\">{{#items}}<li class=\"{{level}}\"><time>{{time}}</time><b>{{room}}</b><span>{{ask}}</span><em>{{state}}</em></li>{{/items}}</ul>",
      "style": ".asks{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:center;gap:5px;font-family:var(--u-widget-font-family);color:#ffffff}\nli{--c:rgba(255,255,255,.72);display:grid;grid-template-columns:46px 48px 1fr auto;align-items:center;gap:10px;padding:4px 10px;border-radius:10px;background:rgba(255,255,255,.1)}\n.doing{--c:#fcd34d}.waiting{--c:#fda4af}.done{--c:#6ee7b7}\ntime{font-size:13px;color:rgba(255,255,255,.72);font-variant-numeric:tabular-nums}\nb{font-size:14px;font-variant-numeric:tabular-nums}\nspan{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nem{font-style:normal;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;color:var(--c);background:color-mix(in srgb,var(--c) 20%,transparent)}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "hotel",
      "path": "/hotel/now",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "name": {},
        "date": {},
        "time": {},
        "weather": {},
        "temp": {}
      }
    },
    "kpi": {
      "from": "hotel",
      "path": "/hotel/kpi",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {
          "at": "/occupancy/value"
        },
        "delta": {
          "at": "/occupancy/delta"
        },
        "trend": {
          "at": "/occupancy/trend"
        },
        "note": {
          "at": "/occupancy/note"
        },
        "value-2": {
          "at": "/adr/value"
        },
        "delta-2": {
          "at": "/adr/delta"
        },
        "trend-2": {
          "at": "/adr/trend"
        },
        "note-2": {
          "at": "/adr/note"
        },
        "value-3": {
          "at": "/revpar/value"
        },
        "delta-3": {
          "at": "/revpar/delta"
        },
        "trend-3": {
          "at": "/revpar/trend"
        },
        "note-3": {
          "at": "/revpar/note"
        },
        "value-4": {
          "at": "/nps/value"
        },
        "delta-4": {
          "at": "/nps/delta"
        },
        "trend-4": {
          "at": "/nps/trend"
        },
        "note-4": {
          "at": "/nps/note"
        }
      }
    },
    "rooms": {
      "from": "hotel",
      "path": "/hotel/rooms",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {},
        "counts": {}
      }
    },
    "arrivals": {
      "from": "hotel",
      "path": "/hotel/arrivals",
      "list": "/value",
      "fresh": 1800,
      "answerTime": "/updatedAt"
    },
    "housekeeping": {
      "from": "hotel",
      "path": "/hotel/housekeeping",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "requests": {
      "from": "hotel",
      "path": "/hotel/requests",
      "time": "updatedAt",
      "fresh": 1800,
      "fields": {
        "value": {}
      }
    },
    "revenue": {
      "from": "hotel",
      "path": "/hotel/revenue",
      "list": "/value",
      "fresh": 1800,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "name": "name",
        "date": "date",
        "time": "time",
        "weather": "weather",
        "temp": "temp"
      }
    },
    "kpi-occupancy": {
      "as": "element",
      "element": "kpi",
      "of": "kpi",
      "props": {
        "label": "객실 점유율",
        "unit": "%"
      },
      "bind": {
        "value": "value",
        "delta": "delta",
        "trend": "trend",
        "note": "note"
      }
    },
    "kpi-adr": {
      "as": "element",
      "element": "kpi",
      "of": "kpi",
      "props": {
        "label": "평균 객실 단가(ADR)",
        "unit": "원"
      },
      "bind": {
        "value": "value-2",
        "delta": "delta-2",
        "trend": "trend-2",
        "note": "note-2"
      }
    },
    "kpi-revpar": {
      "as": "element",
      "element": "kpi",
      "of": "kpi",
      "props": {
        "label": "판매 가능 객실당 매출(RevPAR)",
        "unit": "원"
      },
      "bind": {
        "value": "value-3",
        "delta": "delta-3",
        "trend": "trend-3",
        "note": "note-3"
      }
    },
    "kpi-nps": {
      "as": "element",
      "element": "kpi",
      "of": "kpi",
      "props": {
        "label": "고객 추천 지수(NPS)",
        "unit": "점"
      },
      "bind": {
        "value": "value-4",
        "delta": "delta-4",
        "trend": "trend-4",
        "note": "note-4"
      }
    },
    "rooms": {
      "as": "element",
      "element": "rooms",
      "of": "rooms",
      "bind": {
        "rooms": "value",
        "counts": "counts"
      }
    },
    "arrivals": {
      "as": "chart.area",
      "of": "arrivals",
      "x": "hour",
      "y": [
        "checkIn",
        "checkOut"
      ],
      "smooth": true,
      "series": [
        {
          "label": "체크인",
          "color": "#6ee7b7"
        },
        {
          "label": "체크아웃",
          "color": "#fcd34d"
        }
      ]
    },
    "crews": {
      "as": "element",
      "element": "crews",
      "of": "housekeeping",
      "bind": {
        "crews": "value"
      }
    },
    "requests": {
      "as": "element",
      "element": "requests",
      "of": "requests",
      "bind": {
        "items": "value"
      }
    },
    "revenue": {
      "as": "chart.pie",
      "of": "revenue",
      "label": "source",
      "value": "amount",
      "donut": true,
      "showLabel": false,
      "legend": true,
      "colors": [
        "#7dd3fc",
        "#f9a8d4",
        "#6ee7b7",
        "#fcd34d",
        "#c4b5fd"
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      960
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22960%22%20viewBox%3D%220%200%201600%20960%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22dusk%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23312e81%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%239d174d%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23c2410c%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22edge%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.7%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.15%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.45%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cfilter%20id%3D%22soft%22%20x%3D%22-50%25%22%20y%3D%22-50%25%22%20width%3D%22200%25%22%20height%3D%22200%25%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2270%22%2F%3E%3C%2Ffilter%3E%0A%3Cfilter%20id%3D%22frost%22%20x%3D%22-10%25%22%20y%3D%22-10%25%22%20width%3D%22120%25%22%20height%3D%22120%25%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2216%22%2F%3E%3C%2Ffilter%3E%0A%3CclipPath%20id%3D%22panes%22%3E%3Crect%20x%3D%2240%22%20y%3D%2228%22%20width%3D%221520%22%20height%3D%2280%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%22425%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%22810%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%221195%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22298%22%20width%3D%22750%22%20height%3D%22400%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%22810%22%20y%3D%22298%22%20width%3D%22750%22%20height%3D%22400%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%2240%22%20y%3D%22718%22%20width%3D%22500%22%20height%3D%22214%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22718%22%20width%3D%22500%22%20height%3D%22214%22%20rx%3D%2222%22%2F%3E%3Crect%20x%3D%221080%22%20y%3D%22718%22%20width%3D%22480%22%20height%3D%22214%22%20rx%3D%2222%22%2F%3E%3C%2FclipPath%3E%0A%3Cg%20id%3D%22behind%22%3E%3Crect%20width%3D%221600%22%20height%3D%22960%22%20fill%3D%22url(%23dusk)%22%2F%3E%3Cg%20filter%3D%22url(%23soft)%22%3E%3Ccircle%20cx%3D%22260%22%20cy%3D%22220%22%20r%3D%22260%22%20fill%3D%22%2360a5fa%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221320%22%20cy%3D%22180%22%20r%3D%22300%22%20fill%3D%22%23f472b6%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%22760%22%20r%3D%22320%22%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22120%22%20cy%3D%22860%22%20r%3D%22220%22%20fill%3D%22%23a78bfa%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221500%22%20cy%3D%22820%22%20r%3D%22240%22%20fill%3D%22%23fb7185%22%20fill-opacity%3D%22.55%22%2F%3E%3C%2Fg%3E%0A%3Ccircle%20cx%3D%22600%22%20cy%3D%22420%22%20r%3D%22140%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%223%22%2F%3E%3Ccircle%20cx%3D%221180%22%20cy%3D%22560%22%20r%3D%2290%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%223%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22700%22%20r%3D%2260%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%223%22%2F%3E%0A%3Ccircle%20cx%3D%220%22%20cy%3D%2280%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22389%22%20cy%3D%22313%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22778%22%20cy%3D%22546%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221167%22%20cy%3D%22779%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221556%22%20cy%3D%2252%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22345%22%20cy%3D%22285%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22734%22%20cy%3D%22518%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221123%22%20cy%3D%22751%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221512%22%20cy%3D%2224%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22301%22%20cy%3D%22257%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22490%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221079%22%20cy%3D%22723%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221468%22%20cy%3D%22956%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22257%22%20cy%3D%22229%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22646%22%20cy%3D%22462%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221035%22%20cy%3D%22695%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221424%22%20cy%3D%22928%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22213%22%20cy%3D%22201%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22602%22%20cy%3D%22434%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22991%22%20cy%3D%22667%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221380%22%20cy%3D%22900%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22169%22%20cy%3D%22173%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22558%22%20cy%3D%22406%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22947%22%20cy%3D%22639%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221336%22%20cy%3D%22872%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%22145%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22514%22%20cy%3D%22378%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22903%22%20cy%3D%22611%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221292%22%20cy%3D%22844%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%2281%22%20cy%3D%22117%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22470%22%20cy%3D%22350%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22859%22%20cy%3D%22583%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%221248%22%20cy%3D%22816%22%20r%3D%222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%2237%22%20cy%3D%2289%22%20r%3D%223%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22426%22%20cy%3D%22322%22%20r%3D%224%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3Ccircle%20cx%3D%22815%22%20cy%3D%22555%22%20r%3D%225%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.55%22%2F%3E%3C%2Fg%3E%0A%3C%2Fdefs%3E%0A%3Cuse%20href%3D%22%23behind%22%2F%3E%0A%3Cg%20clip-path%3D%22url(%23panes)%22%3E%3Cg%20filter%3D%22url(%23frost)%22%3E%3Cuse%20href%3D%22%23behind%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2228%22%20width%3D%221520%22%20height%3D%2280%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%0A%3Crect%20x%3D%2240%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%0A%3Crect%20x%3D%22425%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%0A%3Crect%20x%3D%22810%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%0A%3Crect%20x%3D%221195%22%20y%3D%22128%22%20width%3D%22365%22%20height%3D%22150%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%0A%3Crect%20x%3D%2240%22%20y%3D%22298%22%20width%3D%22750%22%20height%3D%22400%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22336%22%20fill%3D%22%23ffffff%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B0%9D%EC%8B%A4%20%ED%98%84%ED%99%A9%3C%2Ftext%3E%0A%3Crect%20x%3D%22810%22%20y%3D%22298%22%20width%3D%22750%22%20height%3D%22400%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%22836%22%20y%3D%22336%22%20fill%3D%22%23ffffff%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%8B%9C%EA%B0%84%EB%8C%80%EB%B3%84%20%EC%B2%B4%ED%81%AC%EC%9D%B8%20%C2%B7%20%EC%B2%B4%ED%81%AC%EC%95%84%EC%9B%83%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22718%22%20width%3D%22500%22%20height%3D%22214%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22756%22%20fill%3D%22%23ffffff%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B0%9D%EC%8B%A4%20%EC%A0%95%EB%B9%84%3C%2Ftext%3E%0A%3Crect%20x%3D%22560%22%20y%3D%22718%22%20width%3D%22500%22%20height%3D%22214%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%22586%22%20y%3D%22756%22%20fill%3D%22%23ffffff%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B3%A0%EA%B0%9D%20%EC%9A%94%EC%B2%AD%3C%2Ftext%3E%0A%3Crect%20x%3D%221080%22%20y%3D%22718%22%20width%3D%22480%22%20height%3D%22214%22%20rx%3D%2222%22%20fill%3D%22%23fff%22%20fill-opacity%3D%22.13%22%20stroke%3D%22url(%23edge)%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ctext%20x%3D%221106%22%20y%3D%22756%22%20fill%3D%22%23ffffff%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%98%A4%EB%8A%98%20%EB%A7%A4%EC%B6%9C%20%EA%B5%AC%EC%84%B1%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        60,
        36,
        1480,
        64
      ],
      "kpi-occupancy": [
        60,
        143,
        325,
        120
      ],
      "kpi-adr": [
        445,
        143,
        325,
        120
      ],
      "kpi-revpar": [
        830,
        143,
        325,
        120
      ],
      "kpi-nps": [
        1215,
        143,
        325,
        120
      ],
      "rooms": [
        64,
        352,
        702,
        330
      ],
      "arrivals": [
        834,
        352,
        702,
        330
      ],
      "crews": [
        64,
        772,
        452,
        144
      ],
      "requests": [
        584,
        772,
        452,
        144
      ],
      "revenue": [
        1104,
        772,
        432,
        144
      ]
    }
  }
};

export const hotelGlass: SamplePack = {
  id: "hotel-glass",
  title: {
    "ko": "호텔 오늘의 운영 — 글래스",
    "en": "A hotel’s day — glass"
  },
  field: {
    "ko": "숙박·관광",
    "en": "Hospitality"
  },
  kind: {
    "ko": "패널 배치(글래스 화면)",
    "en": "Panel layout (a glass screen)"
  },
  domain: "leisure",
  styles: [
    "minimal"
  ],
  summary: {
    "ko": "프런트 뒤와 총지배인실에 거는 도심 호텔의 하루 — 노을빛 그라데이션 위에 뒤를 흐리게 비치는 반투명 유리 패널. 점유율·객실 단가·RevPAR·추천 지수, 층마다 객실 160개의 상태 타일, 시간대별 체크인·체크아웃, 객실 정비 조별 진행, 고객 요청, 매출 구성. 예시 데이터입니다.",
    "en": "A city hotel’s day on the screen behind the front desk and in the general manager’s office — frosted glass panes over a dusk gradient, blurring the lights behind them. Occupancy, average rate, RevPAR and the guest score; a tile for each of 160 rooms by its state, floor by floor; check-ins and check-outs through the day; the housekeeping crews’ progress; guest requests; where the revenue comes from. Example data."
  },
  connectors: [
    {
      "key": "hotel",
      "name": "예시 호텔 운영 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 호텔이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
