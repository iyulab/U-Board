// A gaming café's floor drawn in the Y2K chrome look of the turn of the millennium: a deep space-blue room with a
// glowing perspective grid, liquid-chrome blobs and sparkles, brushed-metal panels with bevelled edges, and glossy gel
// pills for the seats. Each zone is a chrome panel holding its seats; a seat in use is a lit aqua pill, one whose time
// ends within ten minutes a lime pill, a free seat a dark empty socket, one being wiped down a lilac pill and a broken
// one a red pill with a cross — each with its own glyph so the state does not rest on the glow alone. On the right the
// seats in use, the average session and the guests waiting, the games being played by genre and the seats in use by
// the hour. The café is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/pc-cafe.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#22d3ff"
  },
  "elements": {
    "zone": {
      "template": "<section class=\"zn\"><header><b>{{z.name}}</b><span>{{z.note}}</span></header><ol>{{#z.seats}}<li class=\"{{st}}\"><i></i><small>{{n}}</small></li>{{/z.seats}}</ol></section>",
      "style": ".zn{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:12px 16px 14px;border-radius:22px;background:linear-gradient(180deg,#fdfdff 0%,#c9d1db 22%,#7d8794 48%,#dfe5ec 62%,#a5aeb9 100%);box-shadow:inset 0 2px 0 #fff,inset 0 -3px 0 rgba(0,0,0,.25),0 8px 24px rgba(0,0,0,.45);font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0d1330}\nheader{display:flex;justify-content:space-between;align-items:center}\nb{font:700 18px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.06em}\nspan{font-size:13px;font-weight:700;padding:2px 12px;border-radius:999px;background:rgba(10,15,46,.82);color:#22d3ff}\nol{margin:0;padding:10px;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(36px,1fr));gap:6px;border-radius:14px;background:rgba(10,15,46,.88);box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}\nli{display:grid;justify-items:center;align-content:center;gap:3px;border-radius:12px;padding:6px 0}\ni{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font:700 15px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;font-style:normal;color:#0a0f2e}\ni::after{content:\"\"}\nsmall{font:600 11px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#c9d3e0}\n.on i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,#22d3ff 45%,#0a7fa8 100%);box-shadow:0 0 10px #22d3ff}\n.on i::after{content:\"●\"}\n.end i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,#b6ff3b 45%,#5a8a10 100%);box-shadow:0 0 10px #b6ff3b}\n.end i::after{content:\"◔\"}\n.free i{background:#121a44;border:2px solid #4b5a8f}\n.free i::after{content:\"○\";color:#8fa0d6}\n.clean i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,#c9a7ff 45%,#6a4fb0 100%)}\n.clean i::after{content:\"~\"}\n.out i{background:radial-gradient(circle at 35% 30%,#fff 0 18%,#ff4d5e 45%,#8a1020 100%)}\n.out i::after{content:\"✕\";color:#fff}",
      "props": {
        "z": "object"
      }
    },
    "orders": {
      "template": "<section class=\"od\"><h3>주문</h3><p><span>조리 중</span><b>{{o.cooking}}</b></p><p class=\"r\"><span>픽업 대기</span><b>{{o.ready}}</b></p><small>{{o.note}}</small></section>",
      "style": ".od{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr 1fr;grid-template-rows:1fr auto;align-items:center;column-gap:14px;padding:12px 18px;border-radius:22px;background:linear-gradient(180deg,#fdfdff 0%,#c9d1db 22%,#7d8794 48%,#dfe5ec 62%,#a5aeb9 100%);box-shadow:inset 0 2px 0 #fff,0 8px 24px rgba(0,0,0,.45);font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0d1330}\nh3{grid-row:span 2;margin:0;font:700 18px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;writing-mode:vertical-rl;letter-spacing:.2em}\np{margin:0;display:grid}\nspan{font-size:12px;font-weight:700}\nb{font:700 34px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\n.r b{color:#7a0f6a}\nsmall{grid-column:2 / span 2;font-size:12px}",
      "props": {
        "o": "object"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li class=\"on\"><i></i>사용 중</li><li class=\"end\"><i></i>10분 안에 끝남</li><li class=\"free\"><i></i>빈자리</li><li class=\"clean\"><i></i>청소 중</li><li class=\"out\"><i></i>고장</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 14px;list-style:none;display:flex;align-items:center;gap:14px;border-radius:999px;background:rgba(10,15,46,.85);border:1.5px solid rgba(34,211,255,.5);font:600 13px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#e8eef6}\nli{display:flex;align-items:center;gap:6px}\ni{width:20px;height:20px;border-radius:999px;display:grid;place-items:center;font:700 11px \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;font-style:normal;color:#0a0f2e}\n.on i{background:#22d3ff}\n.on i::after{content:\"●\"}\n.end i{background:#b6ff3b}\n.end i::after{content:\"◔\"}\n.free i{background:#121a44;border:2px solid #4b5a8f;box-sizing:border-box}\n.free i::after{content:\"○\";color:#8fa0d6}\n.clean i{background:#c9a7ff}\n.clean i::after{content:\"~\"}\n.out i{background:#ff4d5e;color:#fff}\n.out i::after{content:\"✕\"}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#e8eef6}\nh1{margin:0;font:800 42px/1.05 \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.03em;background:linear-gradient(180deg,#fdfdff 0%,#c9d1db 22%,#7d8794 48%,#dfe5ec 62%,#a5aeb9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(255,95,210,.7))}\np{margin:0;font-size:15px;color:#c9a7ff}\ndiv{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:2px solid rgba(34,211,255,.5)}\nspan{font-size:16px}\nb{margin-left:auto;font:700 38px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#22d3ff;text-shadow:0 0 12px #22d3ff}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#0d1330}\ndiv{display:grid;align-content:center;padding:8px 14px;border-radius:18px;background:linear-gradient(180deg,#fdfdff 0%,#c9d1db 22%,#7d8794 48%,#dfe5ec 62%,#a5aeb9 100%);box-shadow:inset 0 2px 0 #fff,0 6px 16px rgba(0,0,0,.4)}\ndt{font-size:12px;font-weight:700}\ndd{margin:0;font:700 26px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif}\nsmall{font-size:11px}",
      "props": {
        "items": "list"
      }
    },
    "games": {
      "template": "<section class=\"gm\"><h3>지금 하는 게임</h3><ol>{{#items}}<li><b>{{name}}</b><i style=\"--s: {{share}}\"></i><span>{{seats}}</span></li>{{/items}}</ol></section>",
      "style": ".gm{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:\"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#e8eef6}\nh3{margin:0;font:700 17px \"Orbitron\", \"Michroma\", \"Eurostile\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;letter-spacing:.08em;color:#22d3ff}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}\nli{display:grid;grid-template-columns:84px 1fr 52px;align-items:center;gap:10px}\nb{font-size:15px}\ni{display:block;height:18px;width:calc(var(--s) * 1%);min-width:18px;border-radius:999px;background:linear-gradient(90deg,#ff5fd2,#22d3ff,#c9a7ff);box-shadow:inset 0 2px 0 rgba(255,255,255,.7),0 0 10px rgba(34,211,255,.5)}\nspan{justify-self:end;font-size:14px;font-weight:700}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "zones": {
      "from": "cafe",
      "path": "/cafe/zones",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "a": {
          "at": "/value/a"
        },
        "b": {
          "at": "/value/b"
        },
        "p": {
          "at": "/value/p"
        },
        "d": {
          "at": "/value/d"
        }
      }
    },
    "orders": {
      "from": "cafe",
      "path": "/cafe/orders",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "cafe",
      "path": "/cafe/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "cafe",
      "path": "/cafe/figures",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "games": {
      "from": "cafe",
      "path": "/cafe/games",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "cafe",
      "path": "/cafe/hours",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "zone-a": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "a"
      }
    },
    "zone-b": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "b"
      }
    },
    "zone-p": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "p"
      }
    },
    "zone-d": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "d"
      }
    },
    "orders": {
      "as": "element",
      "element": "orders",
      "of": "orders",
      "bind": {
        "o": "value"
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
    "games": {
      "as": "element",
      "element": "games",
      "of": "games",
      "bind": {
        "items": "value"
      }
    },
    "hours": {
      "as": "chart.area",
      "of": "hours",
      "title": "시간대별 사용 좌석",
      "x": "hour",
      "y": "seats",
      "smooth": true,
      "series": [
        {
          "label": "좌석",
          "color": "#22d3ff"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3CradialGradient%20id%3D%22glow%22%20cx%3D%22.5%22%20cy%3D%22.3%22%20r%3D%22.8%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%2328307a%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%230a0f2e%22%2F%3E%3C%2FradialGradient%3E%0A%3ClinearGradient%20id%3D%22chrome%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ffffff%22%2F%3E%3Cstop%20offset%3D%22.25%22%20stop-color%3D%22%23c3ccd8%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%236c7684%22%2F%3E%3Cstop%20offset%3D%22.62%22%20stop-color%3D%22%23e6ebf1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%239aa3af%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22holo%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23ff5fd2%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%2322d3ff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23c9a7ff%22%2F%3E%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23glow)%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20rx%3D%2228%22%20fill%3D%22none%22%20stroke%3D%22url(%23holo)%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20430%20600%20L%2040%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20444.5%20600%20L%2098%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20459%20600%20L%20156%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20473.5%20600%20L%20214%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20488%20600%20L%20272%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20502.5%20600%20L%20330%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20517%20600%20L%20388%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20531.5%20600%20L%20446%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20546%20600%20L%20504%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20560.5%20600%20L%20562%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20575%20600%20L%20620%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20589.5%20600%20L%20678%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20604%20600%20L%20736%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20618.5%20600%20L%20794%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20633%20600%20L%20852%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20647.5%20600%20L%20910%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20662%20600%20L%20968%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20676.5%20600%20L%201026%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%20691%20600%20L%201084%20960%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.35%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20612%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20630%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20656%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20690%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20735%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20792%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20864%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%3Cpath%20d%3D%22M%2040%20952%20H%201080%22%20stroke%3D%22%2322d3ff%22%20stroke-opacity%3D%22.3%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Cpath%20d%3D%22M%20960%20620%20C%201030%20600%2C%201050%20680%2C%201010%20710%20C%20980%20735%2C%20940%20700%2C%20935%20670%20C%20930%20645%2C%20935%20630%2C%20960%20620%20Z%22%20fill%3D%22url(%23chrome)%22%2F%3E%0A%3Cpath%20d%3D%22M%20120%20650%20C%20100%20610%2C%20150%20580%2C%20180%20600%20C%20210%20620%2C%20200%20670%2C%20170%20680%20C%20145%20688%2C%20130%20675%2C%20120%20650%20Z%22%20fill%3D%22url(%23chrome)%22%2F%3E%0A%3Cellipse%20cx%3D%221040%22%20cy%3D%22900%22%20rx%3D%2226%22%20ry%3D%2218%22%20fill%3D%22url(%23holo)%22%20fill-opacity%3D%22.85%22%2F%3E%0A%3Cpath%20d%3D%22M%201050%2068%20Q%201050%2080%201062%2080%20Q%201050%2080%201050%2092%20Q%201050%2080%201038%2080%20Q%201050%2080%201050%2068%20Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.9%22%2F%3E%3Cpath%20d%3D%22M%201060%20592%20Q%201060%20600%201068%20600%20Q%201060%20600%201060%20608%20Q%201060%20600%201052%20600%20Q%201060%20600%201060%20592%20Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.9%22%2F%3E%3Cpath%20d%3D%22M%20210%20590%20Q%20210%20600%20220%20600%20Q%20210%20600%20210%20610%20Q%20210%20600%20200%20600%20Q%20210%20600%20210%20590%20Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.9%22%2F%3E%3Cpath%20d%3D%22M%20560%20373%20Q%20560%20380%20567%20380%20Q%20560%20380%20560%20387%20Q%20560%20380%20553%20380%20Q%20560%20380%20560%20373%20Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.9%22%2F%3E%3Cpath%20d%3D%22M%201040%20631%20Q%201040%20640%201049%20640%20Q%201040%20640%201040%20649%20Q%201040%20640%201031%20640%20Q%201040%20640%201040%20631%20Z%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%22.9%22%2F%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%2296%22%20fill%3D%22%23e8eef6%22%20font-size%3D%2218%22%20font-family%3D'%22Orbitron%22%2C%20%22Michroma%22%2C%20%22Eurostile%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.25em%22%3EFLOOR%202F%3C%2Ftext%3E%0A%3Ctext%20x%3D%221050%22%20y%3D%22940%22%20text-anchor%3D%22end%22%20fill%3D%22%2322d3ff%22%20font-size%3D%2215%22%20font-family%3D'%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.2em%22%3E%EC%9E%85%EA%B5%AC%20%C2%B7%20%EC%B9%B4%EC%9A%B4%ED%84%B0%20%E2%86%92%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "zone-a": [
        70,
        120,
        470,
        250
      ],
      "zone-b": [
        580,
        120,
        470,
        250
      ],
      "zone-p": [
        70,
        400,
        470,
        180
      ],
      "zone-d": [
        580,
        400,
        470,
        180
      ],
      "orders": [
        70,
        820,
        330,
        120
      ],
      "legend": [
        460,
        840,
        560,
        40
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
        100
      ],
      "games": [
        1120,
        340,
        460,
        230
      ],
      "hours": [
        1120,
        600,
        460,
        360
      ]
    }
  }
};

export const pcCafe: SamplePack = {
  id: "pc-cafe",
  title: {
    "ko": "PC방 좌석 현황 — Y2K 크롬",
    "en": "A gaming café’s seats — Y2K chrome"
  },
  field: {
    "ko": "여가·PC방",
    "en": "Leisure & gaming cafés"
  },
  kind: {
    "ko": "구역별 좌석과 주문",
    "en": "Seats by zone and kitchen orders"
  },
  domain: "leisure",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "PC방 객장 현황을 2000년 무렵의 Y2K 크롬으로 — 깊은 우주색 방에 빛나는 원근 격자, 액체 크롬 덩어리와 반짝이, 모서리가 둥글고 빛이 도는 금속 판, 광택 젤 알약. 구역마다 크롬 판 안에 좌석을 알약으로: 사용 중은 켜진 하늘색, 10분 안에 끝나는 자리는 라임, 빈자리는 어두운 빈 홈, 청소 중은 라일락, 고장은 빨강에 ✕ — 빛만으로 읽지 않게 알약마다 기호(● ◔ ○ ~ ✕). 아래에 주방 주문(조리 중·픽업 대기), 오른쪽에 사용 좌석·평균 이용·대기 손님, 장르별 지금 하는 게임(홀로그램 막대), 시간대별 사용 좌석. 매장은 지어낸 것이라 예시 데이터입니다.",
    "en": "A gaming café’s floor in the Y2K chrome look of the turn of the millennium — a deep space-blue room with a glowing perspective grid, liquid-chrome blobs and sparkles, rounded brushed-metal panels and glossy gel pills. In each zone’s chrome panel every seat is a pill: lit aqua in use, lime when its time ends within ten minutes, a dark empty socket when free, lilac while being wiped down, red with a cross when broken — each with its own glyph (● ◔ ○ ~ ✕) so the state does not rest on the glow alone. Below, the kitchen’s orders on the stove and waiting; on the right the seats in use, the average session and the guests waiting, the games played by genre as holographic bars and the seats in use by the hour. The café is made up. Example data."
  },
  connectors: [
    {
      "key": "cafe",
      "name": "예시 PC방 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 PC방이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
