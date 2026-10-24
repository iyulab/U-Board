// A subway extension's tunnel boring machine on the site office's wall, drawn as the long section an engineer reads:
// the ground in its layers, the buildings and the stream on top, the tunnel already lined behind the machine and the
// dashed line still to bore ahead of it, the shafts it started from and will break through into. Over the ground the
// surface settlement points, each a mark on the surface with its reading in a card above; under the section the rings
// built so far, the rings a day, the machine's own readings and the air in the tunnel. Amber on black, one colour,
// the way an old monochrome terminal drew — a reading past its limit is the only thing shown in reverse. No public
// source carries a TBM's data this way, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/tunnel-tbm.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ffb000"
  },
  "elements": {
    "head": {
      "template": "<header class=\"box hd\"><h1>{{project}}</h1><span>{{machine}}</span><span class=\"st\">● {{state}}</span><span>{{shift}}</span><time>{{time}}</time></header>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.hd{display:flex;align-items:center;gap:28px;padding:0 22px}\nh1{margin:0;font-size:22px;font-weight:700;letter-spacing:.06em;text-shadow:0 0 8px rgba(255,176,0,.45)}\nspan{font-size:14px;color:#a87400;letter-spacing:.06em}\n.st{color:#ffb000}\ntime{margin-left:auto;font:700 26px ui-monospace, \"Cascadia Mono\", Consolas, monospace;letter-spacing:.06em;font-variant-numeric:tabular-nums;text-shadow:0 0 8px rgba(255,176,0,.45)}",
      "props": {
        "project": "string",
        "machine": "string",
        "shift": "string",
        "time": "string",
        "state": "string"
      }
    },
    "events": {
      "template": "<section class=\"box ev\"><h2>EVENTS · 최근 기록</h2><ol>{{#items}}<li class=\"{{level}}\"><time>{{time}}</time><span>{{text}}</span></li>{{/items}}</ol></section>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.ev{display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 16px}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:4px}\nli{display:flex;gap:14px;padding:2px 6px;font-size:14px;line-height:1.35;white-space:nowrap;overflow:hidden}\nli span{overflow:hidden;text-overflow:ellipsis}\ntime{font:13px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#a87400;font-variant-numeric:tabular-nums}\n.watch{outline:1px solid #ffb000}\n.alarm{background:#ffb000;color:#0b0803;font-weight:700}\n.alarm time{color:#0b0803}",
      "props": {
        "items": "list"
      }
    },
    "mark": {
      "template": "<span class=\"mk {{band}}\" role=\"img\" aria-label=\"{{name}}\"></span>",
      "style": ":host{display:grid;place-items:center}\n.mk{box-sizing:border-box;width:12px;height:12px;border:2px solid #ffb000;background:#0b0803}\n.watch{outline:2px solid #ffb000;outline-offset:2px}\n.alarm{background:#ffb000;box-shadow:0 0 10px #ffb000}",
      "props": {
        "band": "string",
        "name": "string"
      }
    },
    "point": {
      "template": "<section class=\"box pt {{band}}\"><h2>{{name}}</h2><p><b>{{mm | fixed:1}}</b> mm</p></section>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.pt{display:grid;align-content:center;gap:4px;padding:6px 10px;font:12px ui-monospace, \"Cascadia Mono\", Consolas, monospace;white-space:nowrap}\n.pt b{font-size:20px;font-variant-numeric:tabular-nums}\n.watch{border-color:#ffb000}\n.alarm{background:#ffb000;color:#0b0803}\n.alarm h2{color:#0b0803}",
      "props": {
        "name": "string",
        "mm": "number",
        "band": "string"
      }
    },
    "face": {
      "template": "<span class=\"fc\" role=\"img\" aria-label=\"TBM 막장\"></span>",
      "style": ":host{display:grid;place-items:center}\n.fc{width:10px;height:10px;border-radius:50%;background:#ffb000;box-shadow:0 0 0 4px rgba(255,176,0,.25)}"
    },
    "progress": {
      "template": "<section class=\"box pg\"><h2>PROGRESS · 굴진 진척</h2><p class=\"big\"><b>{{ring}}</b><span>/ {{total}} 링</span></p><div class=\"bar\" style=\"--p: {{pct}}\"><i></i><em>{{pct | fixed:1}}%</em></div>\n<dl><div><dt>오늘</dt><dd>{{today}} 링</dd></div><div><dt>일 평균</dt><dd>{{perDay | fixed:1}} 링</dd></div><div><dt>하천 하부까지</dt><dd>{{toRiver}} m</dd></div><div><dt>관통 예정</dt><dd>{{breakthrough}}</dd></div></dl></section>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.pg{display:grid;align-content:start;gap:10px;padding:14px 18px}\n.big{display:flex;align-items:baseline;gap:10px}\n.big b{font:700 52px/1 ui-monospace, \"Cascadia Mono\", Consolas, monospace;letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(255,176,0,.45)}\n.big span{font-size:16px;color:#a87400}\n.bar{position:relative;height:16px;border:1px solid #a87400}\n.bar i{position:absolute;inset:2px auto 2px 2px;width:calc((100% - 4px) * var(--p) / 100);background:repeating-linear-gradient(90deg,#ffb000 0 6px,transparent 6px 8px)}\n.bar em{position:absolute;right:6px;top:-1px;font:700 12px/16px ui-monospace, \"Cascadia Mono\", Consolas, monospace;font-style:normal;color:#ffb000;background:#0b0803;padding:0 4px}\ndl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}\ndt{font-size:12px;color:#a87400}\ndd{margin:0;font-size:15px;font-variant-numeric:tabular-nums}",
      "props": {
        "ring": "number",
        "total": "number",
        "pct": "number",
        "today": "number",
        "perDay": "number",
        "toRiver": "number",
        "breakthrough": "string"
      }
    },
    "machine": {
      "template": "<section class=\"box mc\"><h2>{{title}}</h2><ul>{{#items}}<li class=\"{{state}}\"><span>{{label}}</span><b>{{value}}</b><small>{{unit}}</small><i style=\"--p: {{pct}}\"></i></li>{{/items}}</ul></section>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.mc{display:grid;grid-template-rows:auto 1fr;gap:8px;padding:14px 16px}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:space-between}\nli{display:grid;grid-template-columns:1fr auto 52px;align-items:baseline;column-gap:8px;padding:2px 6px}\nli span{font-size:13px;color:#a87400}\nli b{font:700 17px ui-monospace, \"Cascadia Mono\", Consolas, monospace;font-variant-numeric:tabular-nums}\nli small{font:11px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#a87400}\nli i{grid-column:1 / -1;height:3px;margin-top:3px;background:linear-gradient(90deg,#ffb000 calc(var(--p) * 1%),#4a3300 0)}\n.watch{outline:1px solid #ffb000}\n.alarm{background:#ffb000;color:#0b0803}\n.alarm span,.alarm small{color:#0b0803}",
      "props": {
        "title": "string",
        "items": "list"
      }
    },
    "air": {
      "template": "<section class=\"box ar\"><h2>AIR · 갱내 환경</h2><ul>{{#items}}<li class=\"{{state}}\"><span>{{label}}</span><b>{{value}}</b><small>{{unit}}</small></li>{{/items}}</ul></section>",
      "style": ".box{position:relative;height:100%;box-sizing:border-box;border:1px solid #4a3300;background:rgba(255,176,0,.03);color:#ffb000;font-family:var(--u-widget-font-family)}\n.box::before,.box::after{content:'';position:absolute;width:12px;height:12px;border:2px solid #ffb000}\n.box::before{top:-1px;left:-1px;border-right:0;border-bottom:0}\n.box::after{bottom:-1px;right:-1px;border-left:0;border-top:0}\nh2{margin:0;font:600 13px/1 var(--u-widget-font-family);letter-spacing:.12em;color:#a87400}\np{margin:0}\n.ar{display:grid;grid-template-rows:auto 1fr;gap:10px;padding:14px 16px}\nul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:6px}\nli{display:grid;align-content:center;gap:2px;padding:4px 8px;border:1px solid #4a3300}\nli span{font-size:12px;color:#a87400}\nli b{font:700 20px ui-monospace, \"Cascadia Mono\", Consolas, monospace;font-variant-numeric:tabular-nums}\nli small{font:11px ui-monospace, \"Cascadia Mono\", Consolas, monospace;color:#a87400}\n.watch{border-color:#ffb000}\n.alarm{background:#ffb000;color:#0b0803}\n.alarm span,.alarm small{color:#0b0803}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "tbm",
      "path": "/tbm/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "project": {},
        "machine": {},
        "shift": {},
        "time": {},
        "state": {}
      }
    },
    "events": {
      "from": "tbm",
      "path": "/tbm/events",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "settlement": {
      "from": "tbm",
      "path": "/tbm/settlement",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "mm": {
          "state": [
            "ok",
            8,
            "watch",
            12,
            "alarm"
          ]
        }
      }
    },
    "progress": {
      "from": "tbm",
      "path": "/tbm/progress",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "ring": {},
        "total": {},
        "pct": {},
        "today": {},
        "perDay": {},
        "toRiver": {},
        "breakthrough": {}
      }
    },
    "daily": {
      "from": "tbm",
      "path": "/tbm/daily",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "machine": {
      "from": "tbm",
      "path": "/tbm/machine",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "title": {},
        "value": {}
      }
    },
    "air": {
      "from": "tbm",
      "path": "/tbm/air",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "head": {
      "as": "element",
      "element": "head",
      "of": "now",
      "bind": {
        "project": "project",
        "machine": "machine",
        "shift": "shift",
        "time": "time",
        "state": "state"
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
    "mark-SP-01": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-01]",
      "props": {
        "name": "SP-01"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-01": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-01]",
      "props": {
        "name": "SP-01"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "mark-SP-02": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-02]",
      "props": {
        "name": "SP-02"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-02": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-02]",
      "props": {
        "name": "SP-02"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "mark-SP-03": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-03]",
      "props": {
        "name": "SP-03"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-03": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-03]",
      "props": {
        "name": "SP-03"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "mark-SP-04": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-04]",
      "props": {
        "name": "SP-04"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-04": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-04]",
      "props": {
        "name": "SP-04"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "mark-SP-05": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-05]",
      "props": {
        "name": "SP-05"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-05": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-05]",
      "props": {
        "name": "SP-05"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "mark-SP-06": {
      "as": "element",
      "element": "mark",
      "of": "settlement[SP-06]",
      "props": {
        "name": "SP-06"
      },
      "bind": {
        "band": "mm.tone"
      }
    },
    "card-SP-06": {
      "as": "element",
      "element": "point",
      "of": "settlement[SP-06]",
      "props": {
        "name": "SP-06"
      },
      "bind": {
        "mm": "mm",
        "band": "mm.tone"
      }
    },
    "face": {
      "as": "element",
      "element": "face"
    },
    "progress": {
      "as": "element",
      "element": "progress",
      "of": "progress",
      "bind": {
        "ring": "ring",
        "total": "total",
        "pct": "pct",
        "today": "today",
        "perDay": "perDay",
        "toRiver": "toRiver",
        "breakthrough": "breakthrough"
      }
    },
    "daily": {
      "as": "chart.bar",
      "of": "daily",
      "title": "일 굴진(링) — 최근 7일",
      "x": "day",
      "y": "rings",
      "series": [
        {
          "label": "링",
          "color": "#ffb000"
        }
      ]
    },
    "machine": {
      "as": "element",
      "element": "machine",
      "of": "machine",
      "bind": {
        "title": "title",
        "items": "value"
      }
    },
    "air": {
      "as": "element",
      "element": "air",
      "of": "air",
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22hatch%22%20width%3D%2210%22%20height%3D%2210%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Cpath%20d%3D%22M%200%200%20L%200%2010%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22dots%22%20width%3D%2212%22%20height%3D%2212%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%221%22%20fill%3D%22%234a3300%22%2F%3E%3C%2Fpattern%3E%0A%3Cpattern%20id%3D%22scan%22%20width%3D%224%22%20height%3D%224%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%224%22%20height%3D%221%22%20fill%3D%22%23ffb000%22%20opacity%3D%22.035%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22%230b0803%22%2F%3E%0A%3Crect%20x%3D%2260%22%20y%3D%22214%22%20width%3D%221480%22%20height%3D%22326%22%20fill%3D%22url(%23dots)%22%2F%3E%0A%3Cpath%20d%3D%22M%2060%20540%20L%2060%20352%20L%2060%20352.6%20L%20134%20341.4%20L%20208%20338.2%20L%20282%20345.5%20L%20356%20357.7%20L%20430%20365.6%20L%20504%20363.2%20L%20578%20352.3%20L%20652%20341.3%20L%20726%20338.3%20L%20800%20345.7%20L%20874%20357.9%20L%20948%20365.6%20L%201022%20363.0%20L%201096%20352.1%20L%201170%20341.1%20L%201244%20338.3%20L%201318%20345.9%20L%201392%20358.1%20L%201466%20365.7%20L%201540%20362.9%20L%201540%20540%20Z%22%20fill%3D%22url(%23hatch)%22%2F%3E%0A%3Cpath%20d%3D%22M%2060%20236.0%20L%20134%20238.3%20L%20208%20238.9%20L%20282%20237.3%20L%20356%20234.7%20L%20430%20233.1%20L%20504%20233.7%20L%20578%20236.1%20L%20652%20238.4%20L%20726%20238.9%20L%20800%20237.2%20L%20874%20234.6%20L%20948%20233.1%20L%201022%20233.7%20L%201096%20236.1%20L%201170%20238.4%20L%201244%20238.9%20L%201318%20237.2%20L%201392%20234.6%20L%201466%20233.0%20L%201540%20233.7%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%226%204%22%2F%3E%3Cpath%20d%3D%22M%2060%20301.9%20L%20134%20297.2%20L%20208%20288.5%20L%20282%20282.5%20L%20356%20283.7%20L%20430%20291.2%20L%20504%20299.3%20L%20578%20301.9%20L%20652%20297.0%20L%20726%20288.3%20L%20800%20282.4%20L%20874%20283.8%20L%20948%20291.3%20L%201022%20299.4%20L%201096%20301.9%20L%201170%20296.9%20L%201244%20288.2%20L%201318%20282.4%20L%201392%20283.9%20L%201466%20291.5%20L%201540%20299.5%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%226%204%22%2F%3E%3Cpath%20d%3D%22M%2060%20352.6%20L%20134%20341.4%20L%20208%20338.2%20L%20282%20345.5%20L%20356%20357.7%20L%20430%20365.6%20L%20504%20363.2%20L%20578%20352.3%20L%20652%20341.3%20L%20726%20338.3%20L%20800%20345.7%20L%20874%20357.9%20L%20948%20365.6%20L%201022%20363.0%20L%201096%20352.1%20L%201170%20341.1%20L%201244%20338.3%20L%201318%20345.9%20L%201392%20358.1%20L%201466%20365.7%20L%201540%20362.9%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%226%204%22%2F%3E%0A%3Ctext%20x%3D%22110%22%20y%3D%22230%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3E%EB%A7%A4%EB%A6%BD%ED%86%A0%3C%2Ftext%3E%3Ctext%20x%3D%22110%22%20y%3D%22272%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3E%ED%92%8D%ED%99%94%ED%86%A0%3C%2Ftext%3E%3Ctext%20x%3D%22110%22%20y%3D%22334%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3E%ED%92%8D%ED%99%94%EC%95%94%3C%2Ftext%3E%3Ctext%20x%3D%22110%22%20y%3D%22520%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22start%22%20letter-spacing%3D%221%22%3E%EC%97%B0%EC%95%94%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2060%20214%20L%201540%20214%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%22130%22%20y%3D%22168%22%20width%3D%2260%22%20height%3D%2246%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22214%22%20y%3D%22140%22%20width%3D%2240%22%20height%3D%2274%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22300%22%20y%3D%22184%22%20width%3D%2284%22%20height%3D%2230%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22430%22%20y%3D%22118%22%20width%3D%2254%22%20height%3D%2296%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22520%22%20y%3D%22156%22%20width%3D%2238%22%20height%3D%2258%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22600%22%20y%3D%22174%22%20width%3D%2272%22%20height%3D%2240%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22700%22%20y%3D%22148%22%20width%3D%2250%22%20height%3D%2266%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22880%22%20y%3D%22180%22%20width%3D%2244%22%20height%3D%2234%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%22960%22%20y%3D%22162%22%20width%3D%2260%22%20height%3D%2252%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%221340%22%20y%3D%22152%22%20width%3D%2252%22%20height%3D%2262%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%3Crect%20x%3D%221420%22%20y%3D%22176%22%20width%3D%2270%22%20height%3D%2238%22%20fill%3D%22none%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221.2%22%2F%3E%0A%3Cpath%20d%3D%22M%201151.6279069767443%20214%20L%201161.6279069767443%20234%20L%201275.5813953488373%20234%20L%201285.5813953488373%20214%20Z%22%20fill%3D%22%231c1400%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%0A%3Cpath%20d%3D%22M%201167.6279069767443%20219%20q%208%20-3%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201167.6279069767443%20224%20q%208%20-3%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201167.6279069767443%20229%20q%208%20-3%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%20t%2016%200%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%0A%3Ctext%20x%3D%221218.6046511627908%22%20y%3D%22206%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2212%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E%ED%95%98%EC%B2%9C%20%ED%95%98%EB%B6%80%20%ED%86%B5%EA%B3%BC%20%EA%B5%AC%EA%B0%84%3C%2Ftext%3E%0A%3Crect%20x%3D%2280%22%20y%3D%22398%22%20width%3D%22948.5767441860467%22%20height%3D%2244%22%20fill%3D%22%231a1200%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Crect%20x%3D%221072.5767441860467%22%20y%3D%22398%22%20width%3D%22447.42325581395335%22%20height%3D%2244%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221.2%22%20stroke-dasharray%3D%228%206%22%2F%3E%0A%3Cpath%20d%3D%22M%20180.46511627906978%20398%20L%20180.46511627906978%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20280.93023255813955%20398%20L%20280.93023255813955%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22280.93023255813955%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER200%3C%2Ftext%3E%3Cpath%20d%3D%22M%20381.3953488372093%20398%20L%20381.3953488372093%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20481.86046511627904%20398%20L%20481.86046511627904%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22481.86046511627904%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER400%3C%2Ftext%3E%3Cpath%20d%3D%22M%20582.3255813953489%20398%20L%20582.3255813953489%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20682.7906976744187%20398%20L%20682.7906976744187%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22682.7906976744187%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER600%3C%2Ftext%3E%3Cpath%20d%3D%22M%20783.2558139534883%20398%20L%20783.2558139534883%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%20883.7209302325581%20398%20L%20883.7209302325581%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22883.7209302325581%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER800%3C%2Ftext%3E%3Cpath%20d%3D%22M%20984.1860465116279%20398%20L%20984.1860465116279%20442%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201084.6511627906978%20398%20L%201084.6511627906978%20442%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221084.6511627906978%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%234a3300%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER1000%3C%2Ftext%3E%3Cpath%20d%3D%22M%201185.1162790697674%20398%20L%201185.1162790697674%20442%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201285.5813953488373%20398%20L%201285.5813953488373%20442%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221285.5813953488373%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%234a3300%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER1200%3C%2Ftext%3E%3Cpath%20d%3D%22M%201386.046511627907%20398%20L%201386.046511627907%20442%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%201486.5116279069766%20398%20L%201486.5116279069766%20442%22%20stroke%3D%22%234a3300%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221486.5116279069766%22%20y%3D%22392%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2210%22%20fill%3D%22%234a3300%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ER1400%3C%2Ftext%3E%0A%3Crect%20x%3D%2260%22%20y%3D%22214%22%20width%3D%2240%22%20height%3D%22246%22%20fill%3D%22%230b0803%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%221.5%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%22484%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2212%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E%EB%B0%9C%EC%A7%84%20%EC%88%98%EC%A7%81%EA%B5%AC%3C%2Ftext%3E%3Crect%20x%3D%22769.2558139534883%22%20y%3D%22214%22%20width%3D%2228%22%20height%3D%22246%22%20fill%3D%22%230b0803%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%221.5%22%2F%3E%3Ctext%20x%3D%22783.2558139534883%22%20y%3D%22484%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2212%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E%ED%99%98%EA%B8%B0%EA%B5%AC%3C%2Ftext%3E%3Crect%20x%3D%221500%22%20y%3D%22214%22%20width%3D%2240%22%20height%3D%22246%22%20fill%3D%22%230b0803%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%221.5%22%2F%3E%3Ctext%20x%3D%221520%22%20y%3D%22484%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2212%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E%EB%8F%84%EB%8B%AC%20%EC%88%98%EC%A7%81%EA%B5%AC%3C%2Ftext%3E%0A%3Crect%20x%3D%221028.5767441860467%22%20y%3D%22394%22%20width%3D%2240%22%20height%3D%2252%22%20fill%3D%22%233a2800%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M%201071.5767441860467%20394%20L%201071.5767441860467%20446%22%20stroke%3D%22%23ffb000%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22932.5767441860467%22%20y%3D%22407%22%20width%3D%2215%22%20height%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%22951.5767441860467%22%20y%3D%22407%22%20width%3D%2215%22%20height%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%22970.5767441860467%22%20y%3D%22407%22%20width%3D%2215%22%20height%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%22989.5767441860467%22%20y%3D%22407%22%20width%3D%2215%22%20height%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Crect%20x%3D%221008.5767441860467%22%20y%3D%22407%22%20width%3D%2215%22%20height%3D%2226%22%20fill%3D%22none%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%0A%3Ctext%20x%3D%221048.5767441860467%22%20y%3D%22464%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2212%22%20fill%3D%22%23ffb000%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3ETBM-1%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%2080%20556%20L%201520%20556%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M%2080%20552%20L%2080%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E0%2B000%3C%2Ftext%3E%3Cpath%20d%3D%22M%20247.44186046511626%20552%20L%20247.44186046511626%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22247.44186046511626%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E0%2B250%3C%2Ftext%3E%3Cpath%20d%3D%22M%20414.8837209302325%20552%20L%20414.8837209302325%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22414.8837209302325%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E0%2B500%3C%2Ftext%3E%3Cpath%20d%3D%22M%20582.3255813953489%20552%20L%20582.3255813953489%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22582.3255813953489%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E0%2B750%3C%2Ftext%3E%3Cpath%20d%3D%22M%20749.767441860465%20552%20L%20749.767441860465%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22749.767441860465%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E1%2B000%3C%2Ftext%3E%3Cpath%20d%3D%22M%20917.2093023255815%20552%20L%20917.2093023255815%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%22917.2093023255815%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E1%2B250%3C%2Ftext%3E%3Cpath%20d%3D%22M%201084.6511627906978%20552%20L%201084.6511627906978%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221084.6511627906978%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E1%2B500%3C%2Ftext%3E%3Cpath%20d%3D%22M%201252.093023255814%20552%20L%201252.093023255814%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221252.093023255814%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E1%2B750%3C%2Ftext%3E%3Cpath%20d%3D%22M%201419.53488372093%20552%20L%201419.53488372093%20560%22%20stroke%3D%22%23a87400%22%20stroke-width%3D%221%22%2F%3E%3Ctext%20x%3D%221419.53488372093%22%20y%3D%22576%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22middle%22%20letter-spacing%3D%221%22%3E2%2B000%3C%2Ftext%3E%0A%3Ctext%20x%3D%221540%22%20y%3D%22598%22%20font-family%3D'ui-monospace%2C%20%22Cascadia%20Mono%22%2C%20Consolas%2C%20monospace'%20font-size%3D%2211%22%20fill%3D%22%23a87400%22%20text-anchor%3D%22end%22%20letter-spacing%3D%221%22%3E%EC%A2%85%EB%8B%A8%EB%A9%B4%20%C2%B7%20%EC%88%98%EC%A7%81%20%EC%B6%95%EC%B2%99%205%EB%B0%B0%20%EA%B3%BC%EC%9E%A5%20%C2%B7%20%EA%B1%B0%EB%A6%AC%20m%3C%2Ftext%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23scan)%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "head": [
        60,
        18,
        1480,
        56
      ],
      "events": [
        60,
        92,
        680,
        108
      ],
      "mark-SP-01": [
        842.2325581395348,
        206,
        16,
        16
      ],
      "card-SP-01": [
        760,
        100,
        92,
        62
      ],
      "mark-SP-02": [
        929.3023255813953,
        206,
        16,
        16
      ],
      "card-SP-02": [
        862,
        100,
        92,
        62
      ],
      "mark-SP-03": [
        996.2790697674418,
        206,
        16,
        16
      ],
      "card-SP-03": [
        964,
        100,
        92,
        62
      ],
      "mark-SP-04": [
        1049.860465116279,
        206,
        16,
        16
      ],
      "card-SP-04": [
        1066,
        100,
        92,
        62
      ],
      "mark-SP-05": [
        1116.8372093023256,
        206,
        16,
        16
      ],
      "card-SP-05": [
        1168,
        100,
        92,
        62
      ],
      "mark-SP-06": [
        1210.6046511627906,
        206,
        16,
        16
      ],
      "card-SP-06": [
        1270,
        100,
        92,
        62
      ],
      "face": [
        1061.5767441860467,
        413,
        14,
        14
      ],
      "progress": [
        60,
        612,
        360,
        268
      ],
      "daily": [
        440,
        612,
        420,
        268
      ],
      "machine": [
        880,
        612,
        360,
        268
      ],
      "air": [
        1260,
        612,
        280,
        268
      ]
    },
    "links": {
      "lead-SP-01": {
        "from": "mark-SP-01",
        "to": "card-SP-01",
        "tone": "warn",
        "width": 1
      },
      "lead-SP-02": {
        "from": "mark-SP-02",
        "to": "card-SP-02",
        "tone": "warn",
        "width": 1
      },
      "lead-SP-03": {
        "from": "mark-SP-03",
        "to": "card-SP-03",
        "tone": "warn",
        "width": 1
      },
      "lead-SP-04": {
        "from": "mark-SP-04",
        "to": "card-SP-04",
        "tone": "warn",
        "width": 1
      },
      "lead-SP-05": {
        "from": "mark-SP-05",
        "to": "card-SP-05",
        "tone": "warn",
        "width": 1
      },
      "lead-SP-06": {
        "from": "mark-SP-06",
        "to": "card-SP-06",
        "tone": "warn",
        "width": 1
      },
      "lead-face": {
        "from": "face",
        "to": "machine",
        "tone": "warn",
        "width": 1
      }
    }
  }
};

export const tunnelTbm: SamplePack = {
  id: "tunnel-tbm",
  title: {
    "ko": "지하철 터널 굴진 — 앰버 단색 터미널",
    "en": "A subway tunnel’s boring — an amber monochrome terminal"
  },
  field: {
    "ko": "건설·토목",
    "en": "Construction & civil works"
  },
  kind: {
    "ko": "종단면도(지층·터널)",
    "en": "A long section (the ground and the tunnel)"
  },
  domain: "construction",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "지하철 연장 공사의 TBM 굴진을 현장 사무실 벽면에 — 지층과 건물·하천이 그려진 종단면 위에 이미 라이닝을 친 구간과 앞으로 팔 점선, 발진·도달 수직구와 환기구, 지표 침하 측정점마다 지시선과 값 카드. 아래로 굴진 링 진척, 일 굴진, TBM 기계 값(토크·추력·막장압·속도·방향 편차), 갱내 공기. 검은 바탕에 앰버 한 색, 관리 기준을 넘은 값만 반전. 예시 데이터입니다.",
    "en": "A subway extension’s tunnel boring machine on the site office wall — the long section with its ground layers, the buildings and the stream above, the lined tunnel behind the machine and the dashed bore ahead, the shafts, and each surface settlement point with a leader to its reading. Under it the rings built, the rings a day, the machine’s torque, thrust, face pressure, speed and steering, and the air at the face. Amber on black in one colour; only a reading past its limit is shown in reverse. Example data."
  },
  connectors: [
    {
      "key": "tbm",
      "name": "예시 TBM 굴진 관리 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 공사 현장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
