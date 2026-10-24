// A craft brewery's brewhouse and cellar on the operator's panel, drawn the old way a SCADA screen was: brushed steel,
// vessels shaded as metal cylinders, pipes with flanges, a screwed nameplate under each vessel with its reading on a
// backlit display and its level in a sight glass, round gauges with a bezel and a needle, and an annunciator panel of
// lamps. The process runs left to right — mash tun, lauter tun, kettle, wort cooler, three fermenters, the bright
// beer tank — and the fermentation curve of the batch in tank 2 sits beside the gauges. Skeuomorphic: every part looks
// like the thing it stands for. No public source carries a brewery's process this way, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/brewery-scada.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c3cad1"
  },
  "elements": {
    "nameplate": {
      "template": "<header class=\"np\"><h1>{{name}}</h1><p>{{batch}}</p><time>{{time}}</time></header>",
      "style": ".np{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:28px;padding:0 24px;font-family:var(--u-widget-font-family);color:#2f3a44}\nh1{margin:0;font-size:26px;font-weight:800;letter-spacing:.08em;color:#36414b;text-shadow:0 1px 0 #fff,0 -1px 0 rgba(0,0,0,.25)}\np{margin:0;font-size:15px;color:#4b5560;text-shadow:0 1px 0 #fff}\ntime{margin-left:auto;padding:4px 14px;border-radius:4px;background:#1b2a1f;box-shadow:inset 0 2px 4px rgba(0,0,0,.7),0 1px 0 #fff;font:700 22px/1.2 ui-monospace,Consolas,monospace;color:#7dffa0;text-shadow:0 0 6px rgba(125,255,160,.6)}",
      "props": {
        "name": "string",
        "batch": "string",
        "time": "string"
      }
    },
    "faceplate": {
      "template": "<section class=\"fp {{state}}\"><div class=\"glass\" style=\"--l: {{level}}\"><i></i></div><div class=\"read\"><p class=\"lcd\">{{temp | fixed:1}}<small>°C</small></p><p class=\"step\"><span class=\"lamp\"></span>{{step}}</p></div></section>",
      "style": ".fp{--c:#3ccf64;height:100%;box-sizing:border-box;display:grid;grid-template-columns:30px 1fr;gap:10px;padding:16px 14px 14px;font-family:var(--u-widget-font-family);color:#2f3a44}\n.idle{--c:#9aa4ad}.cip{--c:#3aa0ff}.alarm{--c:#ff4d3d}\n.glass{position:relative;border-radius:15px;background:linear-gradient(90deg,#55606a,#e8edf0 40%,#9aa4ad);box-shadow:inset 0 0 0 3px #6b757e;overflow:hidden}\n.glass i{position:absolute;inset:auto 5px 5px 5px;height:calc(var(--l) * 0.82%);border-radius:10px;background:linear-gradient(90deg,#b8742a,#f4c055 45%,#c98a33);box-shadow:inset 0 2px 2px rgba(255,255,255,.5)}\n.read{display:grid;align-content:center;gap:8px}\n.lcd{margin:0;padding:6px 8px;border-radius:4px;background:#1b2a1f;box-shadow:inset 0 2px 5px rgba(0,0,0,.75),0 1px 0 #fff;text-align:right;white-space:nowrap;font:700 21px/1 ui-monospace,Consolas,monospace;color:#7dffa0;text-shadow:0 0 6px rgba(125,255,160,.6)}\n.lcd small{font-size:13px;margin-left:2px}\n.step{margin:0;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;line-height:1.25}\n.lamp{flex:none;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,var(--c) 45%,color-mix(in srgb,var(--c) 60%,#000));box-shadow:0 0 8px var(--c),0 0 0 2px #6b757e}\n.alarm .lamp{animation:blink 1s steps(2) infinite}\n@keyframes blink{50%{opacity:.25}}\n@media (prefers-reduced-motion: reduce){.alarm .lamp{animation:none}}",
      "props": {
        "temp": "number",
        "level": "number",
        "state": "string",
        "step": "string"
      }
    },
    "dial": {
      "template": "<figure class=\"dial\" style=\"--v: {{value}}; --min: {{min}}; --max: {{max}}; --hi: {{high}}\"><div class=\"face\"><svg viewBox=\"0 0 100 100\"><path class=\"band\" d=\"M 21 79 A 40 40 0 1 1 79 79\"/><path class=\"red\" d=\"M 21 79 A 40 40 0 1 1 79 79\" pathLength=\"100\"/><g class=\"ticks\"><path d=\"M 50 13 V 19\" transform=\"rotate(-135 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(-108 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(-81 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(-54 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(-27 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(0 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(27 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(54 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(81 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(108 50 50)\"/><path d=\"M 50 13 V 19\" transform=\"rotate(135 50 50)\"/></g></svg><i class=\"needle\"></i><i class=\"hub\"></i><span class=\"min\">{{min}}</span><span class=\"max\">{{max}}</span></div><figcaption><b>{{value | fixed:1}}</b> {{unit}}<small>{{label}}</small></figcaption></figure>",
      "style": ".dial{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto;align-content:center;justify-items:center;gap:16px;font-family:var(--u-widget-font-family);color:#2f3a44}\n.face{position:relative;width:132px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 45%,#fdfdfb 55%,#e4e6e1);box-shadow:0 0 0 7px #d9dee3,0 0 0 9px #7b858e,0 0 0 11px #eef2f5,0 4px 10px 9px rgba(0,0,0,.25),inset 0 2px 6px rgba(0,0,0,.25)}\nsvg{position:absolute;inset:0;width:100%;height:100%}\n.band{fill:none;stroke:#cfd5da;stroke-width:4}\n.red{fill:none;stroke:#e5484d;stroke-width:4;stroke-dasharray:0 calc((var(--hi) - var(--min)) / (var(--max) - var(--min)) * 100) 100}\n.ticks path{stroke:#2f3a44;stroke-width:1.6}\n.needle{position:absolute;left:calc(50% - 2px);top:14%;width:4px;height:36%;border-radius:2px;background:linear-gradient(90deg,#b91c1c,#ef4444);transform-origin:50% 100%;transform:rotate(calc((clamp(var(--min), var(--v), var(--max)) - var(--min)) / (var(--max) - var(--min)) * 270deg - 135deg));box-shadow:1px 1px 2px rgba(0,0,0,.4)}\n.hub{position:absolute;left:calc(50% - 7px);top:calc(50% - 7px);width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#4b5560)}\n.min,.max{position:absolute;bottom:14%;font-size:10px;color:#4b5560}.min{left:22%}.max{right:22%}\nfigcaption{display:grid;justify-items:center;font-size:13px}\nfigcaption b{font:700 18px/1.1 ui-monospace,Consolas,monospace}\nfigcaption small{font-size:12px;color:#4b5560}",
      "props": {
        "label": "string",
        "value": "number",
        "min": "number",
        "max": "number",
        "unit": "string",
        "high": "number"
      }
    },
    "annunciator": {
      "template": "<ul class=\"ann\">{{#lamps}}<li class=\"{{level}}\">{{text}}</li>{{/lamps}}</ul>",
      "style": ".ann{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:8px;font-family:var(--u-widget-font-family)}\nli{display:grid;place-items:center;padding:4px;border-radius:3px;text-align:center;font-size:12px;font-weight:700;line-height:1.2;color:#59636c;background:linear-gradient(#e8ebe6,#c9cdc6);box-shadow:inset 0 0 0 2px #6b757e,inset 0 3px 4px rgba(0,0,0,.25)}\n.info{color:#0b2a12;background:radial-gradient(circle,#c8ffd5,#3ccf64);box-shadow:inset 0 0 0 2px #2f7a43,0 0 12px rgba(60,207,100,.6)}\n.warn{color:#3a2700;background:radial-gradient(circle,#fff1c2,#f5b52e);box-shadow:inset 0 0 0 2px #9a6a00,0 0 12px rgba(245,181,46,.6)}\n.alarm{color:#3a0500;background:radial-gradient(circle,#ffd1cc,#ff4d3d);box-shadow:inset 0 0 0 2px #a1170b,0 0 14px rgba(255,77,61,.7);animation:blink 1s steps(2) infinite}\n@keyframes blink{50%{filter:brightness(.6)}}\n@media (prefers-reduced-motion: reduce){.alarm{animation:none}}",
      "props": {
        "lamps": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "brewery",
      "path": "/brewery/now",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "name": {},
        "batch": {},
        "time": {}
      }
    },
    "vessels": {
      "from": "brewery",
      "path": "/brewery/vessels",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "temp": {},
        "level": {},
        "state": {},
        "step": {}
      }
    },
    "gauges": {
      "from": "brewery",
      "path": "/brewery/gauges",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "steam": {},
        "glycol": {},
        "co2": {}
      }
    },
    "annunciator": {
      "from": "brewery",
      "path": "/brewery/annunciator",
      "time": "updatedAt",
      "fresh": 60,
      "fields": {
        "value": {}
      }
    },
    "fermentation": {
      "from": "brewery",
      "path": "/brewery/fermentation",
      "list": "/value",
      "fresh": 60,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "nameplate": {
      "as": "element",
      "element": "nameplate",
      "of": "now",
      "bind": {
        "name": "name",
        "batch": "batch",
        "time": "time"
      }
    },
    "face-mash": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[mash]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-lauter": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[lauter]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-kettle": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[kettle]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-cooler": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[cooler]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-fv1": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[fv1]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-fv2": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[fv2]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-fv3": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[fv3]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "face-bbt": {
      "as": "element",
      "element": "faceplate",
      "of": "vessels[bbt]",
      "bind": {
        "temp": "temp",
        "level": "level",
        "state": "state",
        "step": "step"
      }
    },
    "dial-steam": {
      "as": "element",
      "element": "dial",
      "of": "gauges",
      "props": {
        "label": "끓임솥 증기압",
        "min": 0,
        "max": 4,
        "unit": "bar",
        "high": 3.2
      },
      "bind": {
        "value": "steam"
      }
    },
    "dial-glycol": {
      "as": "element",
      "element": "dial",
      "of": "gauges",
      "props": {
        "label": "냉매(글리콜) 온도",
        "min": -10,
        "max": 10,
        "unit": "°C",
        "high": 2
      },
      "bind": {
        "value": "glycol"
      }
    },
    "dial-co2": {
      "as": "element",
      "element": "dial",
      "of": "gauges",
      "props": {
        "label": "숙성 탱크 CO₂ 압력",
        "min": 0,
        "max": 2,
        "unit": "bar",
        "high": 1.6
      },
      "bind": {
        "value": "co2"
      }
    },
    "annunciator": {
      "as": "element",
      "element": "annunciator",
      "of": "annunciator",
      "bind": {
        "lamps": "value"
      }
    },
    "curve": {
      "as": "chart.line",
      "of": "fermentation",
      "title": "발효조 2 — 발효 곡선(일)",
      "x": "day",
      "y": [
        "gravity",
        "temp"
      ],
      "smooth": true,
      "valueAxisZero": false,
      "series": [
        {
          "label": "비중(°P)",
          "color": "#b8742a"
        },
        {
          "label": "온도(°C)",
          "color": "#2f6fb3"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      900
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%22900%22%20viewBox%3D%220%200%201600%20900%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22panel%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23d9dee3%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23aeb6be%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22steel%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%220%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%237b858e%22%2F%3E%3Cstop%20offset%3D%22.35%22%20stop-color%3D%22%23eef2f5%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%23c9d0d6%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%236b757e%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22pipe%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%236b757e%22%2F%3E%3Cstop%20offset%3D%22.4%22%20stop-color%3D%22%23f1f4f6%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2359636c%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22plate%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23e9edf0%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23b9c1c8%22%2F%3E%3C%2FlinearGradient%3E%0A%3CradialGradient%20id%3D%22screw%22%20cx%3D%22.35%22%20cy%3D%22.35%22%20r%3D%22.8%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%238b959e%22%2F%3E%3C%2FradialGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22900%22%20fill%3D%22url(%23panel)%22%2F%3E%0A%3Cpath%20d%3D%22M%200%203%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%2013%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2023%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2033%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%2043%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2053%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2063%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%2073%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2083%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%2093%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20103%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20113%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20123%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20133%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20143%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20153%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20163%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20173%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20183%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20193%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20203%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20213%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20223%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20233%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20243%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20253%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20263%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20273%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20283%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20293%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20303%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20313%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20323%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20333%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20343%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20353%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20363%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20373%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20383%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20393%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20403%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20413%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20423%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20433%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20443%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20453%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20463%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20473%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20483%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20493%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20503%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20513%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20523%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20533%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20543%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20553%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20563%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20573%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20583%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20593%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20603%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20613%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20623%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20633%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20643%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20653%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20663%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20673%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20683%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20693%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20703%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20713%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20723%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20733%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20743%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20753%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20763%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20773%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20783%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20793%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20803%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20813%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20823%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20833%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20843%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20853%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20863%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20873%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%200%20883%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%3Cpath%20d%3D%22M%200%20893%20H%201600%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%220.08%22%2F%3E%0A%3Crect%20x%3D%2233%22%20y%3D%2218%22%20width%3D%221540%22%20height%3D%2270%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%2214%22%20width%3D%221540%22%20height%3D%2270%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%2240%22%20cy%3D%2224%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2037.5%2021.5%20L%2042.5%2026.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221560%22%20cy%3D%2224%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201557.5%2021.5%20L%201562.5%2026.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2240%22%20cy%3D%2274%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2037.5%2071.5%20L%2042.5%2076.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221560%22%20cy%3D%2274%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201557.5%2071.5%20L%201562.5%2076.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22200%22%20y%3D%22313%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%22198%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%22257%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%20224%20315%20L%20236%20320%20L%20224%20325%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%22390%22%20y%3D%22313%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%22388%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%22447%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%20414%20315%20L%20426%20320%20L%20414%20325%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%22580%22%20y%3D%22313%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%22578%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%22637%22%20y%3D%22309%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%20604%20315%20L%20616%20320%20L%20604%20325%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%22770%22%20y%3D%22293%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%22768%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%22827%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%20794%20295%20L%20806%20300%20L%20794%20305%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%22960%22%20y%3D%22293%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%22958%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%221017%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%20984%20295%20L%20996%20300%20L%20984%20305%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%221150%22%20y%3D%22293%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%221148%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%221207%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%201174%20295%20L%201186%20300%20L%201174%20305%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Crect%20x%3D%221340%22%20y%3D%22293%22%20width%3D%2260%22%20height%3D%2214%22%20fill%3D%22url(%23pipe)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%221338%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%3Crect%20x%3D%221397%22%20y%3D%22289%22%20width%3D%225%22%20height%3D%2222%22%20fill%3D%22%237b858e%22%2F%3E%0A%3Cpath%20d%3D%22M%201364%20295%20L%201376%20300%20L%201364%20305%20Z%22%20fill%3D%22%232f3a44%22%2F%3E%0A%3Ctext%20x%3D%22135%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%8B%B9%ED%99%94%EC%A1%B0%3C%2Ftext%3E%3Cpath%20d%3D%22M%2070%20154%20Q%20135%20116%20200%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22186%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%2070%20340%20Q%20135%20366%20200%20340%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%2078%20340%20V%20366%20M%20192%20340%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%22135%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%22135%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%2070%20250%20H%20200%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%2070%20280%20H%20200%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%2070%20310%20H%20200%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%22325%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%97%AC%EA%B3%BC%EC%A1%B0%3C%2Ftext%3E%3Cpath%20d%3D%22M%20260%20154%20Q%20325%20116%20390%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%22260%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22186%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20260%20340%20Q%20325%20366%20390%20340%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20268%20340%20V%20366%20M%20382%20340%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%22325%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%22325%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%20260%20250%20H%20390%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20260%20280%20H%20390%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20260%20310%20H%20390%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%22515%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%81%93%EC%9E%84%EC%86%A5%3C%2Ftext%3E%3Cpath%20d%3D%22M%20450%20154%20Q%20515%20116%20580%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22186%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20450%20340%20Q%20515%20366%20580%20340%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20458%20340%20V%20366%20M%20572%20340%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%22515%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%22515%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%20450%20250%20H%20580%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20450%20280%20H%20580%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20450%20310%20H%20580%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%22705%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%A7%A5%EC%A6%99%20%EB%83%89%EA%B0%81%EA%B8%B0%3C%2Ftext%3E%3Crect%20x%3D%22660%22%20y%3D%22190%22%20width%3D%2290%22%20height%3D%22170%22%20rx%3D%226%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20668%20204%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20221%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20238%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20255%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20272%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20289%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20306%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20323%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20668%20340%20H%20742%22%20stroke%3D%22%237b858e%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%22654%22%20y%3D%22180%22%20width%3D%22102%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%22654%22%20y%3D%22356%22%20width%3D%22102%22%20height%3D%2214%22%20rx%3D%223%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Ctext%20x%3D%22895%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%B0%9C%ED%9A%A8%EC%A1%B0%201%3C%2Ftext%3E%3Cpath%20d%3D%22M%20830%20154%20Q%20895%20116%20960%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%22830%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22126%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20830%20280%20L%20883%20350%20H%20907%20L%20960%20280%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%20838%20280%20V%20366%20M%20952%20280%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%22895%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%22895%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%20830%20250%20H%20960%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20830%20280%20H%20960%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%20830%20310%20H%20960%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%221085%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%B0%9C%ED%9A%A8%EC%A1%B0%202%3C%2Ftext%3E%3Cpath%20d%3D%22M%201020%20154%20Q%201085%20116%201150%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%221020%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22126%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201020%20280%20L%201073%20350%20H%201097%20L%201150%20280%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201028%20280%20V%20366%20M%201142%20280%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%221085%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%221085%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%201020%20250%20H%201150%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201020%20280%20H%201150%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201020%20310%20H%201150%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%221275%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EB%B0%9C%ED%9A%A8%EC%A1%B0%203%3C%2Ftext%3E%3Cpath%20d%3D%22M%201210%20154%20Q%201275%20116%201340%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%221210%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22126%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201210%20280%20L%201263%20350%20H%201287%20L%201340%20280%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201218%20280%20V%20366%20M%201332%20280%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%221275%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%221275%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%201210%20250%20H%201340%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201210%20280%20H%201340%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201210%20310%20H%201340%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Ctext%20x%3D%221465%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2933%22%20font-size%3D%2215%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%88%99%EC%84%B1%20%ED%83%B1%ED%81%AC%3C%2Ftext%3E%3Cpath%20d%3D%22M%201400%20154%20Q%201465%20116%201530%20154%20Z%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Crect%20x%3D%221400%22%20y%3D%22154%22%20width%3D%22130%22%20height%3D%22186%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201400%20340%20Q%201465%20366%201530%20340%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%2F%3E%0A%3Cpath%20d%3D%22M%201408%20340%20V%20366%20M%201522%20340%20V%20366%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%225%22%2F%3E%0A%3Cellipse%20cx%3D%221465%22%20cy%3D%22200%22%20rx%3D%2218%22%20ry%3D%2222%22%20fill%3D%22url(%23steel)%22%20stroke%3D%22%235f6b75%22%20stroke-width%3D%222%22%2F%3E%0A%3Cellipse%20cx%3D%221465%22%20cy%3D%22200%22%20rx%3D%2212%22%20ry%3D%2215%22%20fill%3D%22%238b959e%22%20opacity%3D%22.5%22%2F%3E%0A%3Cpath%20d%3D%22M%201400%20250%20H%201530%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201400%20280%20H%201530%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%3Cpath%20d%3D%22M%201400%20310%20H%201530%22%20stroke%3D%22%23ffffff%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Crect%20x%3D%2253%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%2260%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2057.5%20411.5%20L%2062.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22210%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20207.5%20411.5%20L%20212.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2057.5%20523.5%20L%2062.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22210%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20207.5%20523.5%20L%20212.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22243%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22240%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%22250%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20247.5%20411.5%20L%20252.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20397.5%20411.5%20L%20402.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22250%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20247.5%20523.5%20L%20252.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22400%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20397.5%20523.5%20L%20402.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22433%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22430%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%22440%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20437.5%20411.5%20L%20442.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22590%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20587.5%20411.5%20L%20592.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22440%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20437.5%20523.5%20L%20442.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22590%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20587.5%20523.5%20L%20592.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22623%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22620%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%22630%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20627.5%20411.5%20L%20632.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20777.5%20411.5%20L%20782.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22630%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20627.5%20523.5%20L%20632.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20777.5%20523.5%20L%20782.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22813%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22810%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%22820%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20817.5%20411.5%20L%20822.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22970%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20967.5%20411.5%20L%20972.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20817.5%20523.5%20L%20822.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22970%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20967.5%20523.5%20L%20972.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221003%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%221000%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%221010%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201007.5%20411.5%20L%201012.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221160%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201157.5%20411.5%20L%201162.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221010%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201007.5%20523.5%20L%201012.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221160%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201157.5%20523.5%20L%201162.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221193%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%221190%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%221200%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201197.5%20411.5%20L%201202.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221350%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201347.5%20411.5%20L%201352.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221200%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201197.5%20523.5%20L%201202.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221350%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201347.5%20523.5%20L%201352.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221383%22%20y%3D%22408%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%221380%22%20y%3D%22404%22%20width%3D%22170%22%20height%3D%22132%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%221390%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201387.5%20411.5%20L%201392.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%22414%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201537.5%20411.5%20L%201542.5%20416.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221390%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201387.5%20523.5%20L%201392.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%22526%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201537.5%20523.5%20L%201542.5%20528.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2253%22%20y%3D%22590%22%20width%3D%22560%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%22586%22%20width%3D%22560%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%2260%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2057.5%20593.5%20L%2062.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20597.5%20593.5%20L%20602.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%2057.5%20863.5%20L%2062.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20597.5%20863.5%20L%20602.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%22643%22%20y%3D%22590%22%20width%3D%22360%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%22640%22%20y%3D%22586%22%20width%3D%22360%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%22650%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20647.5%20593.5%20L%20652.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22990%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20987.5%20593.5%20L%20992.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22650%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20647.5%20863.5%20L%20652.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%22990%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%20987.5%20863.5%20L%20992.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221033%22%20y%3D%22590%22%20width%3D%22520%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22%23000%22%20opacity%3D%22.25%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22586%22%20width%3D%22520%22%20height%3D%22290%22%20rx%3D%228%22%20fill%3D%22url(%23plate)%22%20stroke%3D%22%236b757e%22%2F%3E%0A%3Ccircle%20cx%3D%221040%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201037.5%20593.5%20L%201042.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%22596%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201537.5%20593.5%20L%201542.5%20598.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221040%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201037.5%20863.5%20L%201042.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%22866%22%20r%3D%224%22%20fill%3D%22url(%23screw)%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%22.6%22%2F%3E%3Cpath%20d%3D%22M%201537.5%20863.5%20L%201542.5%20868.5%22%20stroke%3D%22%234b5560%22%20stroke-width%3D%221%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "nameplate": [
        50,
        19,
        1500,
        60
      ],
      "face-mash": [
        60,
        416,
        150,
        112
      ],
      "face-lauter": [
        250,
        416,
        150,
        112
      ],
      "face-kettle": [
        440,
        416,
        150,
        112
      ],
      "face-cooler": [
        630,
        416,
        150,
        112
      ],
      "face-fv1": [
        820,
        416,
        150,
        112
      ],
      "face-fv2": [
        1010,
        416,
        150,
        112
      ],
      "face-fv3": [
        1200,
        416,
        150,
        112
      ],
      "face-bbt": [
        1390,
        416,
        150,
        112
      ],
      "dial-steam": [
        74,
        620,
        160,
        228
      ],
      "dial-glycol": [
        254,
        620,
        160,
        228
      ],
      "dial-co2": [
        434,
        620,
        160,
        228
      ],
      "annunciator": [
        660,
        616,
        320,
        240
      ],
      "curve": [
        1052,
        608,
        476,
        250
      ]
    }
  }
};

export const breweryScada: SamplePack = {
  id: "brewery-scada",
  title: {
    "ko": "양조장 공정 — 스큐어모픽 SCADA",
    "en": "A brewery’s process — skeuomorphic SCADA"
  },
  field: {
    "ko": "식음료 제조",
    "en": "Food & beverage"
  },
  kind: {
    "ko": "공정 그림(금속 패널)",
    "en": "Process picture (a steel panel)"
  },
  domain: "manufacturing",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "수제 맥주 양조장의 운전 화면을 옛 SCADA처럼 — 헤어라인 금속 패널, 금속 원통으로 그린 용기와 플랜지 배관, 용기마다 나사로 박은 명판(백라이트 온도 표시창·사이트글라스 액위·램프), 베젤 달린 아날로그 계기, 램프 경보 표시반, 발효조 2의 발효 곡선. 당화조에서 숙성 탱크까지 왼쪽에서 오른쪽으로. 예시 데이터입니다.",
    "en": "A craft brewery’s operator screen drawn as an old SCADA panel — brushed steel, vessels shaded as metal cylinders with flanged pipes, a screwed nameplate under each vessel (a backlit temperature display, the level in a sight glass, a lamp), round gauges with a bezel, an annunciator of lamps, and the fermentation curve of tank 2. Mash tun to bright beer tank, left to right. Example data."
  },
  connectors: [
    {
      "key": "brewery",
      "name": "예시 양조 공정 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 양조장이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
