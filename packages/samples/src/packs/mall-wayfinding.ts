// The directory kiosk standing by the escalators on a shopping centre's third floor, read by shoppers who stop for
// a few seconds: where they are, the floor's plan with what is happening on it now — which restroom has a free
// stall and the way there, how long each restaurant's queue is, where the lifts are, what is on in the atrium — and,
// below the plan, every floor's crowd and the car park. A portrait kiosk drawn the way directory screens are: the
// plan in soft greys taking most of the screen, live facts as small badges on it, one bold route from «you are
// here». No public source carries a shopping centre's queues and stalls, so the values are example data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/mall-wayfinding.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#0284c7"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><b class=\"fl\">{{floor}}</b><div><h1>{{name}}</h1><p>{{floorName}}</p></div><aside><time>{{time}}</time><small>{{date}} · {{hours}}</small></aside></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:28px;font-family:var(--u-widget-font-family);color:#fff}\n.fl{display:grid;place-items:center;width:132px;height:132px;border-radius:28px;background:#0284c7;font-size:68px;font-weight:800}\nh1{margin:0;font-size:42px;font-weight:800}\np{margin:6px 0 0;font-size:26px;color:#cbd5e1}\naside{display:grid;justify-items:end}\ntime{font-size:64px;font-weight:700;font-variant-numeric:tabular-nums}\nsmall{font-size:20px;color:#94a3b8}",
      "props": {
        "name": "string",
        "floor": "string",
        "floorName": "string",
        "date": "string",
        "time": "string",
        "hours": "string"
      }
    },
    "queue": {
      "template": "<p class=\"q {{state}}\"><b>{{minutes}}<small>분</small></b><span>대기 {{teams}}팀</span><em>{{note}}</em></p>",
      "style": ".q{--c:#059669;margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;align-items:center;column-gap:12px;padding:8px 14px;border-radius:14px;background:#fff;border:2px solid var(--c);font-family:var(--u-widget-font-family);color:#1e293b}\n.queue{--c:#d97706}.long{--c:#dc2626}.break{--c:#94a3b8}\nb{grid-row:span 2;font-size:40px;line-height:1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}\nb small{font-size:18px;margin-left:2px}\nspan{font-size:20px;font-weight:700;white-space:nowrap}\nem{font-style:normal;font-size:16px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "minutes": "number",
        "teams": "number",
        "state": "string",
        "note": "string"
      }
    },
    "event": {
      "template": "<section class=\"ev\"><small>{{where}}</small><h2>{{title}}</h2><p>{{hours}}</p><em>{{next}}</em></section>",
      "style": ".ev{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;text-align:center;font-family:var(--u-widget-font-family);color:#1e293b}\nsmall{font-size:18px;font-weight:700;color:#0369a1}\nh2{margin:0;font-size:34px;font-weight:800;word-break:keep-all}\np{margin:0;font-size:20px;color:#64748b}\nem{font-style:normal;margin-top:6px;padding:6px 16px;border-radius:999px;background:#0369a1;color:#fff;font-size:18px;font-weight:700}",
      "props": {
        "title": "string",
        "where": "string",
        "hours": "string",
        "next": "string"
      }
    },
    "here": {
      "template": "<p class=\"here\"><i></i><span><b>{{label}}</b><small>{{facing}}</small></span></p>",
      "style": ".here{margin:0;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:0 18px 0 14px;white-space:nowrap;border-radius:999px;background:#fff;border:3px solid #dc2626;font-family:var(--u-widget-font-family);color:#1e293b}\ni{flex:none;width:30px;height:30px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 8px rgba(220,38,38,.22)}\nspan{display:grid}\nb{font-size:24px;font-weight:800;color:#dc2626}\nsmall{font-size:16px;color:#64748b}",
      "props": {
        "label": "string",
        "facing": "string"
      }
    },
    "restroom": {
      "template": "<section class=\"wc {{level}}\"><small>빈 칸</small><p><span>여</span><b>{{women}}</b></p><p><span>남</span><b>{{men}}</b></p><small>장애인 칸 {{accessible}}</small></section>",
      "style": ".wc{--c:#059669;height:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;align-content:center;gap:0 8px;padding:6px 12px;white-space:nowrap;border-radius:16px;background:#fff;border:3px solid var(--c);font-family:var(--u-widget-font-family);color:#1e293b}\n.busy{--c:#d97706}.full{--c:#dc2626}\np{margin:0;display:flex;align-items:baseline;justify-content:center;gap:6px}\nspan{font-size:18px;color:#64748b}\nb{font-size:40px;line-height:1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}\nsmall{grid-column:1/-1;text-align:center;font-size:15px;color:#64748b}",
      "props": {
        "women": "number",
        "men": "number",
        "accessible": "string",
        "level": "string"
      }
    },
    "room": {
      "template": "<p class=\"rm {{#free}}free{{/free}}\"><b>{{state}}</b><small>{{note}}</small></p>",
      "style": ".rm{--c:#d97706;margin:0;height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:2px;border-radius:14px;background:#fff;border:2px solid var(--c);font-family:var(--u-widget-font-family);color:#1e293b}\n.free{--c:#059669}\nb{font-size:24px;font-weight:800;color:var(--c)}\nsmall{font-size:15px;color:#64748b}",
      "props": {
        "state": "string",
        "note": "string",
        "free": "boolean"
      }
    },
    "lifts": {
      "template": "<ul class=\"lifts\">{{#cars}}<li class=\"{{way}}\"><small>{{name}}</small><b>{{floor}}</b><i>{{arrow}}</i></li>{{/cars}}</ul>",
      "style": ".lifts{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;align-content:center;font-family:var(--u-widget-font-family);color:#1e293b}\nli{display:grid;justify-items:center;padding:4px 0;border-radius:12px;background:#fff;border:2px solid #a5b4fc}\nsmall{font-size:13px;color:#64748b}\nb{font-size:28px;line-height:1.1;font-weight:800;font-variant-numeric:tabular-nums}\ni{font-style:normal;font-size:14px;color:#4f46e5;white-space:nowrap}\n.idle i{color:#94a3b8}",
      "props": {
        "cars": "list"
      }
    },
    "heading": {
      "template": "<h3 class=\"hd\">{{text}}<small>{{note}}</small></h3>",
      "style": ".hd{margin:0;height:100%;display:flex;align-items:baseline;gap:12px;font:800 28px var(--u-widget-font-family);color:#1e293b}\nsmall{font-size:18px;font-weight:600;color:#64748b}",
      "props": {
        "text": "string",
        "note": "string"
      }
    },
    "floors": {
      "template": "<ol class=\"floors\">{{#floors}}<li class=\"{{crowd}} {{#here}}here{{/here}}\"><b>{{floor}}</b><span>{{name}}</span><em><i></i>{{word}}</em></li>{{/floors}}</ol>",
      "style": ".floors{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:space-between;font-family:var(--u-widget-font-family);color:#1e293b}\nli{--c:#059669;display:grid;grid-template-columns:72px 1fr 110px;align-items:center;gap:12px;padding:6px 12px;border-radius:12px}\n.busy{--c:#d97706}.packed{--c:#dc2626}\n.here{background:#e0f2fe;outline:3px solid #0284c7}\nb{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums}\n.here b{color:#0284c7}\nspan{font-size:20px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\nem{font-style:normal;display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:var(--c)}\ni{width:14px;height:14px;border-radius:50%;background:var(--c)}",
      "props": {
        "floors": "list"
      }
    },
    "parking": {
      "template": "<ul class=\"park\">{{#levels}}<li class=\"{{level}}\"><span>{{name}}</span><b>{{free}}</b></li>{{/levels}}</ul>",
      "style": ".park{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;align-content:center;font-family:var(--u-widget-font-family);color:#1e293b}\nli{--c:#059669;display:grid;justify-items:center;padding:6px 0;border-radius:12px;border:2px solid var(--c);background:color-mix(in srgb,var(--c) 8%,white)}\n.few{--c:#d97706}.full{--c:#dc2626}\nspan{font-size:16px;color:#64748b}\nb{font-size:30px;line-height:1.1;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums}",
      "props": {
        "levels": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "mall",
      "path": "/mall/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "floor": {},
        "floorName": {},
        "date": {},
        "time": {},
        "hours": {}
      }
    },
    "restaurants": {
      "from": "mall",
      "path": "/mall/restaurants",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "minutes": {
          "at": "/noodle/minutes"
        },
        "teams": {
          "at": "/noodle/teams"
        },
        "state": {
          "at": "/noodle/state"
        },
        "note": {
          "at": "/noodle/note"
        },
        "minutes-2": {
          "at": "/bibim/minutes"
        },
        "teams-2": {
          "at": "/bibim/teams"
        },
        "state-2": {
          "at": "/bibim/state"
        },
        "note-2": {
          "at": "/bibim/note"
        },
        "minutes-3": {
          "at": "/pasta/minutes"
        },
        "teams-3": {
          "at": "/pasta/teams"
        },
        "state-3": {
          "at": "/pasta/state"
        },
        "note-3": {
          "at": "/pasta/note"
        },
        "minutes-4": {
          "at": "/katsu/minutes"
        },
        "teams-4": {
          "at": "/katsu/teams"
        },
        "state-4": {
          "at": "/katsu/state"
        },
        "note-4": {
          "at": "/katsu/note"
        }
      }
    },
    "atrium": {
      "from": "mall",
      "path": "/mall/atrium",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "title": {},
        "where": {},
        "hours": {},
        "next": {}
      }
    },
    "restrooms": {
      "from": "mall",
      "path": "/mall/restrooms",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "women": {
          "at": "/west/women"
        },
        "men": {
          "at": "/west/men"
        },
        "accessible": {
          "at": "/west/accessible"
        },
        "level": {
          "at": "/west/level"
        },
        "women-2": {
          "at": "/east/women"
        },
        "men-2": {
          "at": "/east/men"
        },
        "accessible-2": {
          "at": "/east/accessible"
        },
        "level-2": {
          "at": "/east/level"
        }
      }
    },
    "nursing": {
      "from": "mall",
      "path": "/mall/nursing",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "state": {},
        "note": {},
        "free": {}
      }
    },
    "lifts": {
      "from": "mall",
      "path": "/mall/lifts",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "floors": {
      "from": "mall",
      "path": "/mall/floors",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "parking": {
      "from": "mall",
      "path": "/mall/parking",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "note": {},
        "value": {}
      }
    },
    "visitors": {
      "from": "mall",
      "path": "/mall/visitors",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "route": {
      "from": "mall",
      "path": "/mall/route",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "label": {}
      }
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "name": "name",
        "floor": "floor",
        "floorName": "floorName",
        "date": "date",
        "time": "time",
        "hours": "hours"
      }
    },
    "queue-noodle": {
      "as": "element",
      "element": "queue",
      "of": "restaurants",
      "bind": {
        "minutes": "minutes",
        "teams": "teams",
        "state": "state",
        "note": "note"
      }
    },
    "queue-bibim": {
      "as": "element",
      "element": "queue",
      "of": "restaurants",
      "bind": {
        "minutes": "minutes-2",
        "teams": "teams-2",
        "state": "state-2",
        "note": "note-2"
      }
    },
    "queue-pasta": {
      "as": "element",
      "element": "queue",
      "of": "restaurants",
      "bind": {
        "minutes": "minutes-3",
        "teams": "teams-3",
        "state": "state-3",
        "note": "note-3"
      }
    },
    "queue-katsu": {
      "as": "element",
      "element": "queue",
      "of": "restaurants",
      "bind": {
        "minutes": "minutes-4",
        "teams": "teams-4",
        "state": "state-4",
        "note": "note-4"
      }
    },
    "atrium": {
      "as": "element",
      "element": "event",
      "of": "atrium",
      "bind": {
        "title": "title",
        "where": "where",
        "hours": "hours",
        "next": "next"
      }
    },
    "here": {
      "as": "element",
      "element": "here",
      "props": {
        "label": "현재 위치",
        "facing": "에스컬레이터 앞"
      }
    },
    "wc-west": {
      "as": "element",
      "element": "restroom",
      "of": "restrooms",
      "bind": {
        "women": "women",
        "men": "men",
        "accessible": "accessible",
        "level": "level"
      }
    },
    "wc-east": {
      "as": "element",
      "element": "restroom",
      "of": "restrooms",
      "bind": {
        "women": "women-2",
        "men": "men-2",
        "accessible": "accessible-2",
        "level": "level-2"
      }
    },
    "nursing": {
      "as": "element",
      "element": "room",
      "of": "nursing",
      "bind": {
        "state": "state",
        "note": "note",
        "free": "free"
      }
    },
    "lifts": {
      "as": "element",
      "element": "lifts",
      "of": "lifts",
      "bind": {
        "cars": "value"
      }
    },
    "floors-head": {
      "as": "element",
      "element": "heading",
      "props": {
        "text": "층별 안내",
        "note": "지금 붐비는 정도"
      }
    },
    "floors": {
      "as": "element",
      "element": "floors",
      "of": "floors",
      "bind": {
        "floors": "value"
      }
    },
    "parking-head": {
      "as": "element",
      "element": "heading",
      "of": "parking",
      "props": {
        "text": "주차장 빈자리"
      },
      "bind": {
        "note": "note"
      }
    },
    "parking": {
      "as": "element",
      "element": "parking",
      "of": "parking",
      "bind": {
        "levels": "value"
      }
    },
    "visitors-head": {
      "as": "element",
      "element": "heading",
      "props": {
        "text": "오늘 시간대별 방문객",
        "note": ""
      }
    },
    "visitors": {
      "as": "chart.bar",
      "of": "visitors",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "입장(명)",
          "color": "#0284c7"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1080,
      1920
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221080%22%20height%3D%221920%22%20viewBox%3D%220%200%201080%201920%22%3E%0A%3Crect%20width%3D%221080%22%20height%3D%221920%22%20fill%3D%22%23f1f5f9%22%2F%3E%0A%3Crect%20width%3D%221080%22%20height%3D%22212%22%20fill%3D%22%230f172a%22%2F%3E%0A%3Crect%20x%3D%2248%22%20y%3D%22236%22%20width%3D%22984%22%20height%3D%221060%22%20rx%3D%2236%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%2268%22%20y%3D%22256%22%20width%3D%22227%22%20height%3D%22200%22%20rx%3D%2214%22%20fill%3D%22%23fde7d4%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%22290%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%A9%B4%EA%B0%80%20%EC%B9%BC%EA%B5%AD%EC%88%98%3C%2Ftext%3E%0A%3Crect%20x%3D%22305%22%20y%3D%22256%22%20width%3D%22227%22%20height%3D%22200%22%20rx%3D%2214%22%20fill%3D%22%23fde7d4%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22321%22%20y%3D%22290%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%B9%84%EB%B9%94%20%ED%95%9C%EC%83%81%3C%2Ftext%3E%0A%3Crect%20x%3D%22542%22%20y%3D%22256%22%20width%3D%22227%22%20height%3D%22200%22%20rx%3D%2214%22%20fill%3D%22%23fde7d4%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22558%22%20y%3D%22290%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%ED%8A%B8%EB%9D%BC%ED%86%A0%EB%A6%AC%EC%95%84%3C%2Ftext%3E%0A%3Crect%20x%3D%22779%22%20y%3D%22256%22%20width%3D%22227%22%20height%3D%22200%22%20rx%3D%2214%22%20fill%3D%22%23fde7d4%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22795%22%20y%3D%22290%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%8F%88%EA%B0%80%EC%8A%A4%20%EA%B3%B5%EB%B0%A9%3C%2Ftext%3E%0A%3Crect%20x%3D%2268%22%20y%3D%22476%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%22510%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%A6%AC%EB%B9%99%20%C2%B7%20%EC%A3%BC%EB%B0%A9%3C%2Ftext%3E%0A%3Crect%20x%3D%2268%22%20y%3D%22646%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%22680%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%B9%A8%EA%B5%AC%20%C2%B7%20%ED%8C%A8%EB%B8%8C%EB%A6%AD%3C%2Ftext%3E%0A%3Crect%20x%3D%2268%22%20y%3D%22816%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%22850%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%84%9C%EC%A0%90%20%C2%B7%20%EB%AC%B8%EA%B5%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22822%22%20y%3D%22476%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22838%22%20y%3D%22510%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%ED%82%A4%EC%A6%88%20%C2%B7%20%EC%99%84%EA%B5%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%22822%22%20y%3D%22646%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22838%22%20y%3D%22680%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B0%80%EC%A0%84%20%C2%B7%20%EB%94%94%EC%A7%80%ED%84%B8%3C%2Ftext%3E%0A%3Crect%20x%3D%22822%22%20y%3D%22816%22%20width%3D%22190%22%20height%3D%22160%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22838%22%20y%3D%22850%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%95%84%EC%9B%83%EB%8F%84%EC%96%B4%3C%2Ftext%3E%0A%3Cellipse%20cx%3D%22540%22%20cy%3D%22721%22%20rx%3D%22190%22%20ry%3D%22200%22%20fill%3D%22%23e0f2fe%22%20stroke%3D%22%237dd3fc%22%20stroke-width%3D%226%22%20stroke-dasharray%3D%222%2010%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22540%22%20y%3D%22587%22%20text-anchor%3D%22middle%22%20fill%3D%22%230369a1%22%20font-size%3D%2220%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%A4%91%EC%95%99%20%EC%95%84%ED%8A%B8%EB%A6%AC%EC%9B%80%20%C2%B7%20%EC%95%84%EB%9E%98%EB%A1%9C%201%EC%B8%B5%3C%2Ftext%3E%0A%3Crect%20x%3D%22304%22%20y%3D%22699%22%20width%3D%2292%22%20height%3D%2244%22%20rx%3D%226%22%20fill%3D%22%23cbd5e1%22%2F%3E%3Cline%20x1%3D%22314%22%20y1%3D%22705%22%20x2%3D%22314%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22326%22%20y1%3D%22705%22%20x2%3D%22326%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22338%22%20y1%3D%22705%22%20x2%3D%22338%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22350%22%20y1%3D%22705%22%20x2%3D%22350%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22362%22%20y1%3D%22705%22%20x2%3D%22362%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22374%22%20y1%3D%22705%22%20x2%3D%22374%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22386%22%20y1%3D%22705%22%20x2%3D%22386%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22684%22%20y%3D%22699%22%20width%3D%2292%22%20height%3D%2244%22%20rx%3D%226%22%20fill%3D%22%23cbd5e1%22%2F%3E%3Cline%20x1%3D%22694%22%20y1%3D%22705%22%20x2%3D%22694%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22706%22%20y1%3D%22705%22%20x2%3D%22706%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22718%22%20y1%3D%22705%22%20x2%3D%22718%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22730%22%20y1%3D%22705%22%20x2%3D%22730%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22742%22%20y1%3D%22705%22%20x2%3D%22742%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22754%22%20y1%3D%22705%22%20x2%3D%22754%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%22766%22%20y1%3D%22705%22%20x2%3D%22766%22%20y2%3D%22737%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%2268%22%20y%3D%221106%22%20width%3D%22180%22%20height%3D%22170%22%20rx%3D%2214%22%20fill%3D%22%23dbeafe%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2284%22%20y%3D%221140%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%ED%99%94%EC%9E%A5%EC%8B%A4%20%EC%84%9C%3C%2Ftext%3E%0A%3Crect%20x%3D%22258%22%20y%3D%221106%22%20width%3D%22170%22%20height%3D%22170%22%20rx%3D%2214%22%20fill%3D%22%23fce7f3%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22274%22%20y%3D%221140%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%88%98%EC%9C%A0%EC%8B%A4%3C%2Ftext%3E%0A%3Crect%20x%3D%22438%22%20y%3D%221106%22%20width%3D%22200%22%20height%3D%22170%22%20rx%3D%2214%22%20fill%3D%22%23e0e7ff%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22454%22%20y%3D%221140%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%97%98%EB%A6%AC%EB%B2%A0%EC%9D%B4%ED%84%B0%3C%2Ftext%3E%0A%3Crect%20x%3D%22648%22%20y%3D%221106%22%20width%3D%22174%22%20height%3D%22170%22%20rx%3D%2214%22%20fill%3D%22%23e2e8f0%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22664%22%20y%3D%221140%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B3%A0%EA%B0%9D%EC%84%BC%ED%84%B0%3C%2Ftext%3E%0A%3Crect%20x%3D%22832%22%20y%3D%221106%22%20width%3D%22180%22%20height%3D%22170%22%20rx%3D%2214%22%20fill%3D%22%23dbeafe%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22848%22%20y%3D%221140%22%20fill%3D%22%2364748b%22%20font-size%3D%2222%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%ED%99%94%EC%9E%A5%EC%8B%A4%20%EB%8F%99%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        48,
        30,
        984,
        150
      ],
      "queue-noodle": [
        80,
        352,
        203,
        84
      ],
      "queue-bibim": [
        317,
        352,
        203,
        84
      ],
      "queue-pasta": [
        554,
        352,
        203,
        84
      ],
      "queue-katsu": [
        791,
        352,
        203,
        84
      ],
      "atrium": [
        390,
        651,
        300,
        190
      ],
      "here": [
        284,
        1003,
        240,
        76
      ],
      "wc-west": [
        78,
        991,
        180,
        100
      ],
      "wc-east": [
        822,
        991,
        180,
        100
      ],
      "nursing": [
        268,
        1170,
        150,
        80
      ],
      "lifts": [
        443,
        1158,
        190,
        104
      ],
      "floors-head": [
        48,
        1330,
        560,
        40
      ],
      "floors": [
        48,
        1380,
        560,
        500
      ],
      "parking-head": [
        652,
        1330,
        380,
        40
      ],
      "parking": [
        652,
        1380,
        380,
        96
      ],
      "visitors-head": [
        652,
        1510,
        380,
        40
      ],
      "visitors": [
        652,
        1556,
        380,
        324
      ]
    },
    "links": {
      "route": {
        "from": "here",
        "to": "wc-east",
        "label": "{{label}}",
        "tone": "info",
        "of": "route",
        "width": 8,
        "arrow": "end",
        "route": "orthogonal"
      }
    }
  }
};

export const mallWayfinding: SamplePack = {
  id: "mall-wayfinding",
  title: {
    "ko": "쇼핑몰 층별 안내 — 세로 길찾기 키오스크",
    "en": "A shopping centre’s floor directory — a portrait wayfinding kiosk"
  },
  field: {
    "ko": "유통·리테일",
    "en": "Retail"
  },
  kind: {
    "ko": "세로 화면(9:16 키오스크) × 층 평면도",
    "en": "Portrait screen (a 9:16 kiosk) over a floor plan"
  },
  domain: "logistics",
  styles: [
    "signage"
  ],
  summary: {
    "ko": "쇼핑몰 3층 에스컬레이터 옆에 세워 둔 안내 키오스크 — 화면 대부분을 차지하는 층 평면도 위에 «현재 위치»와 지금의 일: 빈 칸이 있는 화장실까지 굵은 길(도보 시간), 식당가 가게마다 대기 시간·팀, 엘리베이터 세 대가 있는 층과 방향, 수유실 사용 여부, 아트리움 행사. 아래에 층마다 붐비는 정도(이 층 표시), 주차장 층별 빈자리, 시간대별 방문객. 예시 데이터입니다.",
    "en": "The directory kiosk by the escalators on a shopping centre’s third floor — the floor’s plan filling most of the screen, with «you are here» and what is happening now: a bold way to the restroom that has stalls free (and how long the walk is), each restaurant’s wait in minutes and parties, the floor and direction of the three lifts, whether the nursing room is in use, and the event in the atrium. Below, how crowded each floor is (this one marked), free spaces in the car park level by level, and visitors by the hour. Example data."
  },
  connectors: [
    {
      "key": "mall",
      "name": "예시 쇼핑몰 시설 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 쇼핑몰이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
