// A festival's operations wall, the kind hung in a city's situation room for the night of a riverside fireworks show:
// a winged title bar across the top, three columns of bracketed panels, and in the middle the venue itself — the
// river, the lawns, the stages and the food street — each area glowing with how crowded it is, people per square
// metre. On the left the crowd now and through the evening, and who came; on the right the shuttles, what the safety
// staff are dealing with, and the weather the show depends on; under the map, each gate's flow. The big-screen style
// of a city's situation room: deep blue, neon edges, few words, very large numbers. No public source carries a
// festival's floor this way, so the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/festival-ops.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#22d3ee"
  },
  "elements": {
    "masthead": {
      "template": "<header class=\"mast\"><h1>{{title}}</h1><p><span>{{phase}}</span><b>{{time}}</b></p></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;justify-items:center;align-content:center;gap:2px;font-family:var(--u-widget-font-family);color:#e0f2fe}\nh1{margin:0;font-size:34px;font-weight:800;letter-spacing:.14em;text-shadow:0 0 18px #22d3ee,0 0 4px #22d3ee}\np{margin:0;display:flex;gap:14px;font-size:14px;color:#7dd3fc;letter-spacing:.08em}\nb{color:#fbbf24;font-variant-numeric:tabular-nums}",
      "props": {
        "title": "string",
        "time": "string",
        "phase": "string"
      }
    },
    "crowd": {
      "template": "<section class=\"crowd\" style=\"--s: {{share}}\">\n  <div class=\"big\"><b>{{now | grouped:0}}</b><span>명</span></div>\n  <div class=\"bar\"><i></i></div>\n  <dl><div><dt>수용 한도</dt><dd>{{limit | grouped:0}}명 · {{share | fixed:0}}%</dd></div><div><dt>누적 입장</dt><dd>{{total | grouped:0}}명</dd></div><div><dt>최근 10분</dt><dd>{{trend}}</dd></div></dl>\n</section>",
      "style": ".crowd{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:12px;font-family:var(--u-widget-font-family);color:#e0f2fe}\n.big{display:flex;align-items:baseline;gap:8px}\n.big b{font-size:64px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums;color:#fff;text-shadow:0 0 22px #22d3ee}\n.big span{font-size:20px;color:#7dd3fc}\n.bar{height:10px;border-radius:5px;background:rgba(125,211,252,.15);overflow:hidden}\n.bar i{display:block;height:100%;width:calc(var(--s) * 1%);background:linear-gradient(90deg,#22d3ee,#fbbf24);box-shadow:0 0 12px #22d3ee}\ndl{margin:0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\ndt{font-size:12px;color:#7dd3fc}\ndd{margin:2px 0 0;font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}",
      "props": {
        "now": "number",
        "limit": "number",
        "share": "number",
        "total": "number",
        "trend": "string"
      }
    },
    "zone": {
      "template": "<div class=\"zone {{level}}\"><header><i></i>{{name}}</header><p><b>{{density | fixed:1}}</b><span>명/㎡</span><em>{{people | grouped:0}}명</em></p><small>{{note}}</small></div>",
      "style": ".zone{--c:#34d399;height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:8px 12px;border:1px solid var(--c);border-radius:4px;background:rgba(2,10,28,.78);box-shadow:0 0 18px color-mix(in srgb,var(--c) 45%,transparent),inset 0 0 12px color-mix(in srgb,var(--c) 18%,transparent);font-family:var(--u-widget-font-family);color:#e0f2fe}\n.busy{--c:#fbbf24}.packed{--c:#fb7185;animation:pulse 1.6s ease-in-out infinite}\n@keyframes pulse{50%{box-shadow:0 0 30px var(--c),inset 0 0 16px color-mix(in srgb,var(--c) 30%,transparent)}}\n@media (prefers-reduced-motion: reduce){.packed{animation:none}}\nheader{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700}\nheader i{width:8px;height:8px;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c)}\np{margin:0;display:flex;align-items:baseline;gap:5px}\nb{font-size:30px;line-height:1.05;color:var(--c);font-variant-numeric:tabular-nums;text-shadow:0 0 10px var(--c)}\nspan{font-size:12px;color:#7dd3fc}\nem{margin-left:auto;font-style:normal;font-size:14px;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;color:#7dd3fc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "name": "string",
        "density": "number",
        "people": "number",
        "level": "string",
        "note": "string"
      }
    },
    "gates": {
      "template": "<ul class=\"gates\">{{#gates}}<li class=\"{{level}}\" style=\"--l: {{load}}\"><b>{{name}}</b><span class=\"meter\"><i></i></span><em>{{load}}%</em><small>입장 {{inbound | grouped:0}} · 퇴장 {{outbound | grouped:0}}</small></li>{{/gates}}</ul>",
      "style": ".gates{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:10px 18px;align-content:center;font-family:var(--u-widget-font-family);color:#e0f2fe}\nli{--c:#34d399;display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center}\n.busy{--c:#fbbf24}.packed{--c:#fb7185}\nb{font-size:15px}\n.meter{height:8px;border-radius:4px;background:rgba(125,211,252,.15);overflow:hidden}\n.meter i{display:block;height:100%;width:calc(var(--l) * 1%);background:var(--c);box-shadow:0 0 10px var(--c)}\nem{font-style:normal;font-size:15px;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums}\nsmall{grid-column:1/-1;font-size:12px;color:#7dd3fc;font-variant-numeric:tabular-nums}",
      "props": {
        "gates": "list"
      }
    },
    "shuttles": {
      "template": "<table class=\"routes\"><thead><tr><th>노선</th><th>다음 차</th><th>대기</th><th>탑승률</th></tr></thead><tbody>{{#routes}}<tr class=\"{{level}}\"><td>{{name}}</td><td><b>{{next}}</b>분</td><td>{{queue | grouped:0}}명</td><td><span style=\"--l: {{load}}\"><i></i></span>{{load}}%</td></tr>{{/routes}}</tbody></table>",
      "style": ".routes{width:100%;height:100%;border-collapse:collapse;font-family:var(--u-widget-font-family);color:#e0f2fe;font-size:15px}\nth{text-align:left;font-size:12px;font-weight:600;color:#7dd3fc;padding:0 6px 8px;border-bottom:1px solid rgba(34,211,238,.25)}\ntd{padding:9px 6px;border-bottom:1px solid rgba(34,211,238,.1);font-variant-numeric:tabular-nums;white-space:nowrap}\ntr{--c:#34d399}.busy{--c:#fbbf24}.packed{--c:#fb7185}\nb{font-size:20px;color:var(--c);text-shadow:0 0 8px var(--c);margin-right:2px}\nspan{display:inline-block;width:70px;height:6px;margin-right:8px;border-radius:3px;background:rgba(125,211,252,.15);overflow:hidden;vertical-align:middle}\nspan i{display:block;height:100%;width:calc(var(--l) * 1%);background:var(--c)}",
      "props": {
        "routes": "list"
      }
    },
    "incidents": {
      "template": "<ul class=\"cases\">{{#items}}<li class=\"{{level}}\"><time>{{time}}</time><b>{{kind}}</b><span>{{place}}</span><em>{{state}}</em></li>{{/items}}</ul>",
      "style": ".cases{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px;font-family:var(--u-widget-font-family);color:#e0f2fe}\nli{--c:#22d3ee;display:grid;grid-template-columns:52px 1fr auto;grid-template-rows:auto auto;column-gap:10px;padding:8px 10px;border-left:3px solid var(--c);background:color-mix(in srgb,var(--c) 9%,transparent)}\n.warn{--c:#fbbf24}.alert{--c:#fb7185}\ntime{grid-row:span 2;font-size:15px;font-weight:700;color:var(--c);font-variant-numeric:tabular-nums}\nb{font-size:15px}\nspan{grid-column:2;font-size:12px;color:#7dd3fc}\nem{grid-row:1/3;grid-column:3;align-self:center;font-style:normal;font-size:13px;font-weight:700;color:var(--c)}",
      "props": {
        "items": "list"
      }
    },
    "weather": {
      "template": "<section class=\"wx\"><dl><div><dt>기온</dt><dd>{{temp | fixed:1}}<small>°C</small></dd></div><div><dt>풍속</dt><dd>{{wind | fixed:1}}<small>m/s</small></dd></div><div><dt>순간 최대</dt><dd>{{gust | fixed:1}}<small>m/s</small></dd></div><div><dt>습도</dt><dd>{{humidity}}<small>%</small></dd></div></dl><p><b>{{go}}</b><span>{{launch}}</span></p></section>",
      "style": ".wx{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:10px;font-family:var(--u-widget-font-family);color:#e0f2fe}\ndl{margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}\ndt{font-size:12px;color:#7dd3fc}\ndd{margin:2px 0 0;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;color:#7dd3fc;margin-left:1px}\np{margin:0;display:flex;align-items:center;gap:10px;font-size:13px;color:#7dd3fc}\nb{padding:3px 12px;border:1px solid #fbbf24;border-radius:3px;color:#fbbf24;font-size:14px;box-shadow:0 0 12px rgba(251,191,36,.35)}",
      "props": {
        "temp": "number",
        "wind": "number",
        "gust": "number",
        "humidity": "number",
        "go": "string",
        "launch": "string"
      }
    }
  },
  "data": {
    "now": {
      "from": "festival",
      "path": "/festival/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "title": {},
        "time": {},
        "phase": {},
        "crowd": {},
        "limit": {},
        "share": {},
        "total": {},
        "trend": {}
      }
    },
    "flow": {
      "from": "festival",
      "path": "/festival/flow",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "visitors": {
      "from": "festival",
      "path": "/festival/visitors",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "zones": {
      "from": "festival",
      "path": "/festival/zones",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "density": {},
        "people": {},
        "density-2": {
          "names": [
            "free",
            2,
            "busy",
            4,
            "packed"
          ],
          "at": "/density"
        },
        "note": {}
      }
    },
    "gates": {
      "from": "festival",
      "path": "/festival/gates",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "shuttles": {
      "from": "festival",
      "path": "/festival/shuttles",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "incidents": {
      "from": "festival",
      "path": "/festival/incidents",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "weather": {
      "from": "festival",
      "path": "/festival/weather",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "temp": {},
        "wind": {},
        "gust": {},
        "humidity": {},
        "go": {},
        "launch": {}
      }
    }
  },
  "parts": {
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "now",
      "bind": {
        "title": "title",
        "time": "time",
        "phase": "phase"
      }
    },
    "crowd": {
      "as": "element",
      "element": "crowd",
      "of": "now",
      "bind": {
        "now": "crowd",
        "limit": "limit",
        "share": "share",
        "total": "total",
        "trend": "trend"
      }
    },
    "flow": {
      "as": "chart.area",
      "of": "flow",
      "x": "time",
      "y": [
        "inbound",
        "outbound"
      ],
      "smooth": true,
      "series": [
        {
          "label": "입장",
          "color": "#22d3ee"
        },
        {
          "label": "퇴장",
          "color": "#e879f9"
        }
      ]
    },
    "ages": {
      "as": "chart.pie",
      "of": "visitors",
      "label": "group",
      "value": "share",
      "donut": true,
      "showLabel": false,
      "legend": true,
      "colors": [
        "#22d3ee",
        "#e879f9",
        "#fbbf24",
        "#34d399",
        "#818cf8"
      ]
    },
    "zone-stage": {
      "as": "element",
      "element": "zone",
      "of": "zones[stage]",
      "props": {
        "name": "메인 무대"
      },
      "bind": {
        "density": "density",
        "people": "people",
        "level": "density-2",
        "note": "note"
      }
    },
    "zone-food": {
      "as": "element",
      "element": "zone",
      "of": "zones[food]",
      "props": {
        "name": "먹거리 거리"
      },
      "bind": {
        "density": "density",
        "people": "people",
        "level": "density-2",
        "note": "note"
      }
    },
    "zone-lawn": {
      "as": "element",
      "element": "zone",
      "of": "zones[lawn]",
      "props": {
        "name": "강변 잔디광장"
      },
      "bind": {
        "density": "density",
        "people": "people",
        "level": "density-2",
        "note": "note"
      }
    },
    "zone-deck": {
      "as": "element",
      "element": "zone",
      "of": "zones[deck]",
      "props": {
        "name": "불꽃 관람석"
      },
      "bind": {
        "density": "density",
        "people": "people",
        "level": "density-2",
        "note": "note"
      }
    },
    "gates": {
      "as": "element",
      "element": "gates",
      "of": "gates",
      "bind": {
        "gates": "value"
      }
    },
    "shuttles": {
      "as": "element",
      "element": "shuttles",
      "of": "shuttles",
      "bind": {
        "routes": "value"
      }
    },
    "incidents": {
      "as": "element",
      "element": "incidents",
      "of": "incidents",
      "bind": {
        "items": "value"
      }
    },
    "weather": {
      "as": "element",
      "element": "weather",
      "of": "weather",
      "bind": {
        "temp": "temp",
        "wind": "wind",
        "gust": "gust",
        "humidity": "humidity",
        "go": "go",
        "launch": "launch"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1920,
      1080
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221920%22%20height%3D%221080%22%20viewBox%3D%220%200%201920%201080%22%3E%0A%3Cdefs%3E%0A%3CradialGradient%20id%3D%22bg%22%20cx%3D%2250%25%22%20cy%3D%2245%25%22%20r%3D%2275%25%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23062a5c%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23020a1c%22%2F%3E%3C%2FradialGradient%3E%0A%3ClinearGradient%20id%3D%22panel%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%230b3a7a%22%20stop-opacity%3D%22.45%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23041634%22%20stop-opacity%3D%22.25%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22map%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2305224d%22%20stop-opacity%3D%22.75%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23031226%22%20stop-opacity%3D%22.9%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22title%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%230e7490%22%20stop-opacity%3D%22.55%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230e7490%22%20stop-opacity%3D%22.05%22%2F%3E%3C%2FlinearGradient%3E%0A%3Cfilter%20id%3D%22glow%22%20x%3D%22-20%25%22%20y%3D%22-20%25%22%20width%3D%22140%25%22%20height%3D%22140%25%22%3E%3CfeGaussianBlur%20stdDeviation%3D%222.4%22%20result%3D%22b%22%2F%3E%3CfeMerge%3E%3CfeMergeNode%20in%3D%22b%22%2F%3E%3CfeMergeNode%20in%3D%22SourceGraphic%22%2F%3E%3C%2FfeMerge%3E%3C%2Ffilter%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22url(%23bg)%22%2F%3E%0A%3Cpath%20d%3D%22M%20560%200%20H%201360%20L%201320%2074%20H%20600%20Z%22%20fill%3D%22url(%23title)%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%2052%20H%20520%20L%20560%200%20M%201880%2052%20H%201400%20L%201360%200%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20600%2074%20H%201320%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20520%2052%20L%20540%2066%20M%201400%2052%20L%201380%2066%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.6%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22100%22%20width%3D%22480%22%20height%3D%22250%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20118%20V%20100%20H%2058%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20502%20100%20H%20520%20V%20118%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20520%20332%20V%20350%20H%20502%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%2058%20350%20H%2040%20V%20332%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%2054%20110%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%2322d3ee%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%2254%22%20y%3D%22114%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%2322d3ee%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22127%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%8B%A4%EC%8B%9C%EA%B0%84%20%EA%B4%80%EB%9E%8C%EA%B0%9D%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22370%22%20width%3D%22480%22%20height%3D%22330%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20388%20V%20370%20H%2058%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20502%20370%20H%20520%20V%20388%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20520%20682%20V%20700%20H%20502%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%2058%20700%20H%2040%20V%20682%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%2054%20380%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%2322d3ee%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%2254%22%20y%3D%22384%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%2322d3ee%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22397%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%8B%9C%EA%B0%84%EB%8C%80%EB%B3%84%20%EC%9E%85%EC%9E%A5%20%C2%B7%20%ED%87%B4%EC%9E%A5%3C%2Ftext%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22720%22%20width%3D%22480%22%20height%3D%22320%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%23e879f9%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20738%20V%20720%20H%2058%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20502%20720%20H%20520%20V%20738%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20520%201022%20V%201040%20H%20502%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%2058%201040%20H%2040%20V%201022%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%2054%20730%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%23e879f9%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%2254%22%20y%3D%22734%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%23e879f9%22%2F%3E%0A%3Ctext%20x%3D%2266%22%20y%3D%22747%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B4%80%EB%9E%8C%EA%B0%9D%20%EA%B5%AC%EC%84%B1%3C%2Ftext%3E%0A%3Crect%20x%3D%221400%22%20y%3D%22100%22%20width%3D%22480%22%20height%3D%22360%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%201400%20118%20V%20100%20H%201418%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201862%20100%20H%201880%20V%20118%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201880%20442%20V%20460%20H%201862%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201418%20460%20H%201400%20V%20442%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%201414%20110%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%2322d3ee%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%221414%22%20y%3D%22114%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%2322d3ee%22%2F%3E%0A%3Ctext%20x%3D%221426%22%20y%3D%22127%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%85%94%ED%8B%80%EB%B2%84%EC%8A%A4%20%EC%9A%B4%ED%96%89%3C%2Ftext%3E%0A%3Crect%20x%3D%221400%22%20y%3D%22480%22%20width%3D%22480%22%20height%3D%22340%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%23fb7185%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%201400%20498%20V%20480%20H%201418%22%20fill%3D%22none%22%20stroke%3D%22%23fb7185%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201862%20480%20H%201880%20V%20498%22%20fill%3D%22none%22%20stroke%3D%22%23fb7185%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201880%20802%20V%20820%20H%201862%22%20fill%3D%22none%22%20stroke%3D%22%23fb7185%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201418%20820%20H%201400%20V%20802%22%20fill%3D%22none%22%20stroke%3D%22%23fb7185%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%201414%20490%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%23fb7185%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%221414%22%20y%3D%22494%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%23fb7185%22%2F%3E%0A%3Ctext%20x%3D%221426%22%20y%3D%22507%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%95%88%EC%A0%84%20%EC%83%81%ED%99%A9%3C%2Ftext%3E%0A%3Crect%20x%3D%221400%22%20y%3D%22840%22%20width%3D%22480%22%20height%3D%22200%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%23fbbf24%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%201400%20858%20V%20840%20H%201418%22%20fill%3D%22none%22%20stroke%3D%22%23fbbf24%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201862%20840%20H%201880%20V%20858%22%20fill%3D%22none%22%20stroke%3D%22%23fbbf24%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201880%201022%20V%201040%20H%201862%22%20fill%3D%22none%22%20stroke%3D%22%23fbbf24%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201418%201040%20H%201400%20V%201022%22%20fill%3D%22none%22%20stroke%3D%22%23fbbf24%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%201414%20850%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%221414%22%20y%3D%22854%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%23fbbf24%22%2F%3E%0A%3Ctext%20x%3D%221426%22%20y%3D%22867%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EA%B8%B0%EC%83%81%20%C2%B7%20%EB%B0%9C%EC%82%AC%20%EC%A1%B0%EA%B1%B4%3C%2Ftext%3E%0A%3Crect%20x%3D%22560%22%20y%3D%22130%22%20width%3D%22800%22%20height%3D%22640%22%20fill%3D%22url(%23map)%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.35%22%2F%3E%0A%3Cg%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.07%22%3E%3Cpath%20d%3D%22M%20560%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20604%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20648%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20692%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20736%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20780%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20824%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20868%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20912%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20956%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201000%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201044%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201088%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201132%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201176%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201220%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201264%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201308%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%201352%20130%20V%20770%22%2F%3E%3Cpath%20d%3D%22M%20560%20130%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20174%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20218%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20262%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20306%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20350%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20394%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20438%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20482%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20526%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20570%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20614%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20658%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20702%20H%201360%22%2F%3E%3Cpath%20d%3D%22M%20560%20746%20H%201360%22%2F%3E%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%20560%20650%20C%20780%20600%201040%20730%201360%20670%20V%20770%20H%20560%20Z%22%20fill%3D%22%230c4a6e%22%20fill-opacity%3D%22.65%22%2F%3E%0A%3Cpath%20d%3D%22M%20560%20650%20C%20780%20600%201040%20730%201360%20670%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222%22%20stroke-opacity%3D%22.8%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Ctext%20x%3D%221160%22%20y%3D%22742%22%20fill%3D%22%237dd3fc%22%20fill-opacity%3D%22.6%22%20font-size%3D%2215%22%20font-family%3D%22sans-serif%22%20letter-spacing%3D%226%22%3E%EA%B0%95%20%C2%B7%20RIVER%3C%2Ftext%3E%0A%3Cpolygon%20points%3D%22600%2C190%20900%2C190%20900%2C390%20600%2C390%22%20fill%3D%22%23e879f9%22%20fill-opacity%3D%22.10%22%20stroke%3D%22%23e879f9%22%20stroke-opacity%3D%22.75%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpolygon%20points%3D%221020%2C190%201320%2C190%201320%2C390%201020%2C390%22%20fill%3D%22%23fbbf24%22%20fill-opacity%3D%22.10%22%20stroke%3D%22%23fbbf24%22%20stroke-opacity%3D%22.75%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpolygon%20points%3D%22600%2C460%20900%2C460%20900%2C600%20600%2C620%22%20fill%3D%22%2322d3ee%22%20fill-opacity%3D%22.10%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.75%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpolygon%20points%3D%221020%2C460%201120%2C460%201120%2C600%201020%2C610%22%20fill%3D%22%23fb7185%22%20fill-opacity%3D%22.10%22%20stroke%3D%22%23fb7185%22%20stroke-opacity%3D%22.75%22%20stroke-width%3D%221.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20620%20430%20H%201300%20M%20960%20170%20V%20600%22%20stroke%3D%22%23e0f2fe%22%20stroke-opacity%3D%22.18%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%20stroke-dasharray%3D%222%2010%22%2F%3E%0A%3Ccircle%20cx%3D%221200%22%20cy%3D%22600%22%20r%3D%2258%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-opacity%3D%22.5%22%20stroke-dasharray%3D%224%206%22%2F%3E%0A%3Ccircle%20cx%3D%221200%22%20cy%3D%22600%22%20r%3D%2230%22%20fill%3D%22none%22%20stroke%3D%22%23e879f9%22%20stroke-opacity%3D%22.7%22%2F%3E%0A%3Ctext%20x%3D%221200%22%20y%3D%22606%22%20text-anchor%3D%22middle%22%20fill%3D%22%23e879f9%22%20font-size%3D%2213%22%20font-family%3D%22sans-serif%22%3E%EB%B0%9C%EC%82%AC%20%EB%B0%94%EC%A7%80%EC%84%A0%3C%2Ftext%3E%0A%3Crect%20x%3D%22560%22%20y%3D%22800%22%20width%3D%22800%22%20height%3D%22240%22%20fill%3D%22url(%23panel)%22%20stroke%3D%22%2322d3ee%22%20stroke-opacity%3D%22.25%22%2F%3E%0A%3Cpath%20d%3D%22M%20560%20818%20V%20800%20H%20578%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201342%20800%20H%201360%20V%20818%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%201360%201022%20V%201040%20H%201342%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%3Cpath%20d%3D%22M%20578%201040%20H%20560%20V%201022%22%20fill%3D%22none%22%20stroke%3D%22%2322d3ee%22%20stroke-width%3D%222.5%22%20filter%3D%22url(%23glow)%22%2F%3E%0A%3Cpath%20d%3D%22M%20574%20810%20h%20200%20l%2014%2022%20h%20-214%20z%22%20fill%3D%22%2322d3ee%22%20fill-opacity%3D%22.14%22%2F%3E%0A%3Crect%20x%3D%22574%22%20y%3D%22814%22%20width%3D%224%22%20height%3D%2214%22%20fill%3D%22%2322d3ee%22%2F%3E%0A%3Ctext%20x%3D%22586%22%20y%3D%22827%22%20fill%3D%22%23e0f2fe%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D%22sans-serif%22%3E%EC%B6%9C%EC%9E%85%EA%B5%AC%EB%B3%84%20%ED%86%B5%ED%96%89%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "masthead": [
        600,
        2,
        720,
        70
      ],
      "crowd": [
        60,
        146,
        440,
        190
      ],
      "flow": [
        56,
        414,
        448,
        272
      ],
      "ages": [
        56,
        764,
        448,
        262
      ],
      "zone-stage": [
        630,
        240,
        230,
        96
      ],
      "zone-food": [
        1050,
        240,
        230,
        96
      ],
      "zone-lawn": [
        630,
        480,
        230,
        96
      ],
      "zone-deck": [
        960,
        490,
        230,
        96
      ],
      "gates": [
        580,
        850,
        760,
        170
      ],
      "shuttles": [
        1420,
        146,
        440,
        300
      ],
      "incidents": [
        1420,
        526,
        440,
        280
      ],
      "weather": [
        1420,
        888,
        440,
        130
      ]
    }
  }
};

export const festivalOps: SamplePack = {
  id: "festival-ops",
  title: {
    "ko": "축제 종합 상황판 — 대형 상황판",
    "en": "Festival operations wall — a situation room screen"
  },
  field: {
    "ko": "문화·관광 행사",
    "en": "Events & tourism"
  },
  kind: {
    "ko": "행사장 약도(16:9 대형 상황판)",
    "en": "Venue map (a 16:9 situation room wall)"
  },
  domain: "leisure",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "불꽃축제 밤 시청 상황실에 거는 대형 화면 — 날개 달린 제목 띠, 모서리 꺾쇠 패널 세 단, 가운데 행사장 약도의 구역마다 ㎡당 인원으로 빛나는 태그. 왼쪽은 지금 관람객과 수용 한도·시간대별 입장·퇴장·관람객 구성, 오른쪽은 셔틀버스·안전 상황·발사 조건, 약도 아래는 출입구별 통행. 예시 데이터입니다.",
    "en": "The big screen a city’s situation room hangs for a fireworks night — a winged title bar, three columns of bracketed panels, and in the middle the venue map with each area’s tag glowing by people per square metre. On the left the crowd now against the limit, the evening’s flow in and out and who came; on the right the shuttles, the safety desk and the launch conditions; under the map each gate’s flow. Example data."
  },
  connectors: [
    {
      "key": "festival",
      "name": "예시 행사 운영 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 행사가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
