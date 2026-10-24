// A dam's floodgates run from a steampunk engine room: an iron plate riveted in brass, copper pipes carrying the water's
// pressure from gauge to gauge. Every spillway gate is a pressure dial — a brass bezel, a cream face with its ticks, the
// needle at the gate's opening — with a signal lamp and an engraved plate below. A gate's state is told by its lamp and
// plate, as well as by a colour: a lit amber lamp while it discharges, a dark glass lamp when it is shut, a red lamp over
// hazard stripes when it is out for repair. In the middle the reservoir in a sight glass, its level against the marks;
// below, the operator's log on telegraph tape; on the right the dam's plaque, the flows now, the key and the discharge by
// the hour on a cream card. The dam is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/dam-steampunk.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ffb52e"
  },
  "elements": {
    "gate": {
      "template": "<article class=\"gt {{g.state}}\"><div class=\"dl\" style=\"--v: {{g.open}}\"><i></i><span>{{g.open}} %</span></div><footer><u></u><b>{{g.name}}</b><em>{{g.word}}</em><small>{{g.flow}}</small></footer></article>",
      "style": ".gt{height:100%;box-sizing:border-box;display:grid;grid-template-rows:1fr auto;justify-items:center;gap:6px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#2a1f14}\n.dl{position:relative;width:166px;height:166px;border-radius:50%;box-sizing:border-box;border:12px solid transparent;background:radial-gradient(circle,#efe3c2 0 60%,transparent 60.5%) padding-box,conic-gradient(from -135deg,transparent 0 270.5deg,#efe3c2 270.5deg) padding-box,repeating-conic-gradient(from -135deg,#2a1f14 0 1.4deg,transparent 1.4deg 27deg) padding-box,radial-gradient(circle,transparent 0 64%,#2a1f14 64.5% 66%,transparent 66.5%) padding-box,linear-gradient(#efe3c2,#efe3c2) padding-box,linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064) border-box;box-shadow:0 0 0 2px #5c4418,0 5px 0 #120d0a}\n.dl::after{content:\"\";position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px;border-radius:50%;background:linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:0 0 0 2px #5c4418}\ni{position:absolute;left:50%;top:50%;width:4px;height:60px;margin-left:-2px;margin-top:-56px;background:#d23a26;transform-origin:50% 56px;transform:rotate(calc(var(--v) * 2.7deg - 135deg));clip-path:polygon(50% 0,100% 85%,100% 100%,0 100%,0 85%)}\nspan{position:absolute;left:0;right:0;bottom:30px;text-align:center;font:700 16px \"Courier New\", \"Nanum Gothic Coding\", monospace}\nfooter{width:100%;box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center;padding:6px 14px}\nu{grid-row:span 2;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#6d6a64,#1c1a18);box-shadow:0 0 0 2px #5c4418}\nb{font-size:17px;font-weight:700}\nem{font-style:normal;font:700 14px \"Courier New\", \"Nanum Gothic Coding\", monospace;text-align:right}\nsmall{grid-column:2 / span 2;font:13px \"Courier New\", \"Nanum Gothic Coding\", monospace}\n.open u{background:radial-gradient(circle at 35% 35%,#fff3c4,#ffb52e 55%,#a86a00);box-shadow:0 0 0 2px #5c4418,0 0 12px 3px rgba(255,181,46,.7)}\n.open em::before{content:\"● \"}\n.shut em::before{content:\"○ \"}\n.shut .dl{filter:saturate(.6)}\n.fault u{background:radial-gradient(circle at 35% 35%,#ffc2b8,#d23a26 55%,#6e1208);box-shadow:0 0 0 2px #5c4418,0 0 12px 3px rgba(210,58,38,.6)}\n.fault footer{background:repeating-linear-gradient(-45deg,#e8c23a 0 10px,#2a1f14 10px 20px);color:#ffffff}\n.fault footer b,.fault footer em,.fault footer small{background:#2a1f14;padding:0 4px}\n.fault em::before{content:\"✕ \"}\n.fault i{background:#8b8178}",
      "props": {
        "g": "object"
      }
    },
    "sight": {
      "template": "<section class=\"sg\"><h2>저수위</h2><div class=\"tb\" style=\"--l: {{r.level}}\"><s></s><ol>{{#r.marks}}<li class=\"{{kind}}\" style=\"--at: {{at}}\"><span>{{label}}</span></li>{{/r.marks}}</ol></div><p><b>{{r.el}}</b><small>{{r.note}}</small></p></section>",
      "style": ".sg{height:100%;box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;display:grid;grid-template-rows:auto 1fr auto;justify-items:center;gap:8px;padding:16px 14px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nh2{margin:0;font-size:19px;font-weight:700;letter-spacing:.2em}\n.tb{position:relative;justify-self:start;margin-left:18px;width:56px;border-radius:32px;box-sizing:border-box;border:6px solid #8c6a28;background:linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.05) 40%,rgba(0,0,0,.15)),#cfd8d2;overflow:visible}\ns{position:absolute;left:0;right:0;bottom:0;height:calc(var(--l) * 1%);border-radius:0 0 26px 26px;background:linear-gradient(90deg,#5fa2b8,#2c6f88 60%,#1f5266);text-decoration:none}\nol{position:absolute;inset:0;margin:0;padding:0;list-style:none}\nli{position:absolute;left:-14px;right:-14px;bottom:calc(var(--at) * 1%);border-top:2px solid #2a1f14}\nli span{position:absolute;left:100%;top:-9px;white-space:nowrap;padding-left:4px;font:700 11px \"Courier New\", \"Nanum Gothic Coding\", monospace}\n.flood{border-top:3px solid #d23a26}\n.flood span{color:#7e1a0e}\np{margin:0;display:grid;justify-items:center}\nb{font:700 22px \"Courier New\", \"Nanum Gothic Coding\", monospace}\nsmall{font-size:12px}",
      "props": {
        "r": "object"
      }
    },
    "log": {
      "template": "<section class=\"lg\"><h2>운영 일지 — 오늘</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{text}}</span><i></i></li>{{/items}}</ol></section>",
      "style": ".lg{height:100%;box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;padding:16px 24px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nh2{margin:0 0 8px;font-size:19px;font-weight:700;letter-spacing:.1em}\nol{margin:0;padding:6px 0;list-style:none;display:grid;gap:4px;background:#efe3c2;border-radius:3px;box-shadow:inset 0 0 0 2px #8c6a28;background-image:radial-gradient(circle,#c9b98d 2px,transparent 2.5px);background-size:14px 14px;background-position:0 50%;background-repeat:repeat-y}\nli{display:grid;grid-template-columns:66px 1fr 30px;align-items:center;gap:12px;padding:8px 16px 8px 22px;font:16px \"Courier New\", \"Nanum Gothic Coding\", monospace;border-bottom:1px dashed #b9a77a}\nli b{font:700 15px \"Courier New\", \"Nanum Gothic Coding\", monospace}\ni{font-style:normal;text-align:center;font-weight:700}\n.info i::before{content:\"·\"}\n.warn{background:rgba(255,181,46,.22)}\n.warn i::before{content:\"!\";color:#8a5200}\n.alarm{background:#d23a26;color:#ffffff}\n.alarm i::before{content:\"✕\"}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;display:grid;align-content:center;justify-items:center;gap:4px;padding:14px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;text-align:center}\nsmall{font-size:14px;letter-spacing:.3em}\nh1{margin:0;font-size:44px;font-weight:700;letter-spacing:.16em;text-shadow:0 1px 0 #f3dc9a,0 -1px 0 #5c4418}\ndiv{display:flex;gap:18px;align-items:baseline}\nspan{font-size:16px}\nb{font:700 28px \"Courier New\", \"Nanum Gothic Coding\", monospace}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\ndiv{box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;display:grid;align-content:center;justify-items:center;text-align:center}\ndt{font-size:14px;font-weight:700}\ndd{margin:0;font:700 30px \"Courier New\", \"Nanum Gothic Coding\", monospace}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><u class=\"open\"></u>● 방류 — 등 켜짐</li><li><u></u>○ 닫힘 — 등 꺼짐</li><li><u class=\"fault\"></u>✕ 점검 — 붉은 등·줄무늬</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;border-radius:6px;background:radial-gradient(circle at 10px 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) 10px,#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at 10px calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),radial-gradient(circle at calc(100% - 10px) calc(100% - 10px),#e9d08c 2.5px,#5c4418 3.5px,transparent 4px),linear-gradient(160deg,#e6c77a,#c29a4a 40%,#8c6a28 70%,#d4b064);box-shadow:inset 0 0 0 2px #6e5220,inset 0 0 0 4px #e9d08c,0 4px 0 #120d0a;color:#2a1f14;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;font:700 14px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nli{display:flex;align-items:center;gap:8px}\nu{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#6d6a64,#1c1a18);box-shadow:0 0 0 2px #5c4418}\n.open{background:radial-gradient(circle at 35% 35%,#fff3c4,#ffb52e 55%,#a86a00)}\n.fault{background:radial-gradient(circle at 35% 35%,#ffc2b8,#d23a26 55%,#6e1208)}"
    }
  },
  "data": {
    "gates": {
      "from": "dam",
      "path": "/dam/gates",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "g1": {
          "at": "/value/g1"
        },
        "g2": {
          "at": "/value/g2"
        },
        "g3": {
          "at": "/value/g3"
        },
        "g4": {
          "at": "/value/g4"
        },
        "g5": {
          "at": "/value/g5"
        },
        "g6": {
          "at": "/value/g6"
        }
      }
    },
    "reservoir": {
      "from": "dam",
      "path": "/dam/reservoir",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "log": {
      "from": "dam",
      "path": "/dam/log",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "dam",
      "path": "/dam/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "dam",
      "path": "/dam/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "discharge": {
      "from": "dam",
      "path": "/dam/discharge",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "gate-g1": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g1"
      }
    },
    "gate-g2": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g2"
      }
    },
    "gate-g3": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g3"
      }
    },
    "gate-g4": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g4"
      }
    },
    "gate-g5": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g5"
      }
    },
    "gate-g6": {
      "as": "element",
      "element": "gate",
      "of": "gates",
      "bind": {
        "g": "g6"
      }
    },
    "reservoir": {
      "as": "element",
      "element": "sight",
      "of": "reservoir",
      "bind": {
        "r": "value"
      }
    },
    "log": {
      "as": "element",
      "element": "log",
      "of": "log",
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
    "discharge": {
      "as": "chart.bar",
      "of": "discharge",
      "title": "시간별 총 방류(m³/s) — 수문 + 발전",
      "x": "hour",
      "y": "discharge",
      "series": [
        {
          "label": "총 방류",
          "color": "#a85a32"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%3Cpattern%20id%3D%22p%22%20width%3D%226%22%20height%3D%226%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Crect%20width%3D%226%22%20height%3D%226%22%20fill%3D%22%2326201c%22%2F%3E%3Cpath%20d%3D%22M0%206%20L6%200%22%20stroke%3D%22%232f2823%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23p)%22%2F%3E%0A%3Crect%20x%3D%226%22%20y%3D%226%22%20width%3D%221588%22%20height%3D%22988%22%20fill%3D%22none%22%20stroke%3D%22%23c29a4a%22%20stroke-width%3D%226%22%2F%3E%0A%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22180%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22260%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22340%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22380%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22460%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22500%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22540%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22580%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22620%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22660%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22700%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22740%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22860%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22900%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22940%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22980%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221020%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221060%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221100%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221140%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221180%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221260%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221300%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221340%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221380%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221420%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221460%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221500%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221580%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22100%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22140%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22180%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22220%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22260%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22340%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22380%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22460%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22500%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22540%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22580%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22620%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22660%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22700%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22740%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22820%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22860%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22900%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22940%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%22980%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221020%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221060%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221100%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221140%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221180%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221220%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221260%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221300%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221340%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221380%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221420%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221460%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221500%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221540%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%3Ccircle%20cx%3D%221580%22%20cy%3D%22980%22%20r%3D%223%22%20fill%3D%22%238c6a28%22%2F%3E%0A%3Cpath%20d%3D%22M%20155%20288%20H%20905%20V%2040%22%20fill%3D%22none%22%20stroke%3D%22%235a2f17%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20288%20H%20905%20V%2040%22%20fill%3D%22none%22%20stroke%3D%22%23a85a32%22%20stroke-width%3D%2211%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20288%20H%20905%20V%2040%22%20fill%3D%22none%22%20stroke%3D%22%23d58a5c%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20opacity%3D%22.7%22%2F%3E%0A%3Cpath%20d%3D%22M%20155%20558%20H%20785%22%20fill%3D%22none%22%20stroke%3D%22%235a2f17%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20558%20H%20785%22%20fill%3D%22none%22%20stroke%3D%22%23a85a32%22%20stroke-width%3D%2211%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20558%20H%20785%22%20fill%3D%22none%22%20stroke%3D%22%23d58a5c%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20opacity%3D%22.7%22%2F%3E%0A%3Cpath%20d%3D%22M%20155%20288%20V%20558%20M%20405%20288%20V%20558%20M%20655%20288%20V%20558%22%20fill%3D%22none%22%20stroke%3D%22%235a2f17%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20288%20V%20558%20M%20405%20288%20V%20558%20M%20655%20288%20V%20558%22%20fill%3D%22none%22%20stroke%3D%22%23a85a32%22%20stroke-width%3D%2211%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20155%20288%20V%20558%20M%20405%20288%20V%20558%20M%20655%20288%20V%20558%22%20fill%3D%22none%22%20stroke%3D%22%23d58a5c%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20opacity%3D%22.7%22%2F%3E%0A%3Crect%20x%3D%221035%22%20y%3D%22451%22%20width%3D%22540%22%20height%3D%22514%22%20rx%3D%226%22%20fill%3D%22%23120d0a%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22446%22%20width%3D%22540%22%20height%3D%22514%22%20rx%3D%226%22%20fill%3D%22%2316110e%22%20stroke%3D%22%23c29a4a%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "gate-g1": [
        40,
        40,
        230,
        250
      ],
      "gate-g2": [
        290,
        40,
        230,
        250
      ],
      "gate-g3": [
        540,
        40,
        230,
        250
      ],
      "gate-g4": [
        40,
        310,
        230,
        250
      ],
      "gate-g5": [
        290,
        310,
        230,
        250
      ],
      "gate-g6": [
        540,
        310,
        230,
        250
      ],
      "reservoir": [
        805,
        60,
        200,
        520
      ],
      "log": [
        40,
        596,
        965,
        370
      ],
      "title": [
        1030,
        40,
        540,
        160
      ],
      "figures": [
        1030,
        218,
        540,
        130
      ],
      "legend": [
        1030,
        366,
        540,
        56
      ],
      "discharge": [
        1050,
        466,
        500,
        474
      ]
    }
  }
};

export const damSteampunk: SamplePack = {
  id: "dam-steampunk",
  title: {
    "ko": "댐 수문 방류 — 스팀펑크 기관실",
    "en": "A dam’s floodgates — a steampunk engine room"
  },
  field: {
    "ko": "댐·수자원",
    "en": "Dams & water resources"
  },
  kind: {
    "ko": "수문 개도·저수위·방류·운영 일지",
    "en": "Gate openings, reservoir level, discharge and the log"
  },
  domain: "energy",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "댐의 수문 방류를 스팀펑크 기관실처럼 — 놋쇠 리벳을 박은 쇠판 위로 구리 관이 계기에서 계기로 이어집니다. 수문마다 압력계 하나: 놋쇠 테, 눈금이 새겨진 크림색 판, 바늘이 가리키는 개도, 그 아래 신호등과 새긴 명판. 수문 상태는 색과 함께 등과 명판으로: 방류 중이면 호박색 등이 켜지고, 닫히면 등이 꺼진 유리, 점검 중이면 붉은 등과 경고 줄무늬. 가운데에는 저수지를 수위 유리관으로 표시선과 함께, 아래에는 전신 테이프 같은 운영 일지, 오른쪽에 댐 명판, 지금 유량, 범례, 크림색 카드 위 시간별 방류. 댐은 지어낸 것이라 예시 데이터입니다.",
    "en": "A dam’s floodgates run from a steampunk engine room — an iron plate riveted in brass, copper pipes running from gauge to gauge. Every spillway gate is a pressure dial: a brass bezel, a cream face with its ticks, the needle at the gate’s opening, a signal lamp and an engraved plate below. A gate tells its state by its lamp and plate, as well as by colour: an amber lamp lit while it discharges, dark glass when it is shut, a red lamp over hazard stripes when it is out for repair. In the middle the reservoir in a sight glass against its marks; below, the operator’s log on telegraph tape; on the right the dam’s plaque, the flows now, the key and the discharge by the hour on a cream card. The dam is made up. Example data."
  },
  connectors: [
    {
      "key": "dam",
      "name": "예시 댐 운영 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 댐이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
