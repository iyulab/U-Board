// A cold-chain warehouse drawn as vaporwave: a pastel sunset over a magenta perspective grid, and in front of it the six
// temperature zones as frosted glass cards in a row — each zone's temperature in chrome, a thermometer from −80 to
// +25 ℃ with the zone's band and a marker where it is now, its load and door count — and its state in a mark, a word
// and the card's edge: ● steady (a mint edge), ❄ defrosting (cyan, the brief rise is expected), ▮ door held open
// (dashed yellow), ▲ out of band (hot pink). Below, the zone out of band over the last day against its limit, and the
// reefer trucks at the docks. The warehouse is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/coldchain-vapor.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#ff71ce"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>새벽별 콜드체인 센터</h1><p>{{n.date}} {{n.time}}</p><ul><li class=\"o\">● 정상</li><li class=\"d\">❄ 제상 중</li><li class=\"r\">▮ 문 열림</li><li class=\"a\">▲ 온도 이탈</li></ul></header>",
      "style": ".bn{height:100%;display:flex;align-items:center;gap:22px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff}\nh1{margin:0;white-space:nowrap;font:italic 900 40px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.02em;background:linear-gradient(180deg, #ffffff 0%, #c9d6ff 45%, #6b5bd6 52%, #f4c6ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(2px 2px 0 #ff71ce)}\np{margin:0;white-space:nowrap;font-size:16px;letter-spacing:.2em;color:#fffb96}\nul{margin:0 0 0 auto;padding:0;list-style:none;display:flex;gap:8px}\nli{white-space:nowrap;font-size:13px;font-weight:800;padding:2px 10px;border:2px solid;border-radius:999px}\n.o{color:#05ffa1}.d{color:#01cdfe}.r{color:#fffb96;border-style:dashed}.a{background:#ff71ce;border-color:#ff71ce;color:#1a0b2e}",
      "props": {
        "n": "object"
      }
    },
    "zone": {
      "template": "<article class=\"zc {{z.state}}\" style=\"--v: {{z.temp}}; --lo: {{z.lo}}; --hi: {{z.hi}}\"><p class=\"en\">{{z.en}}</p><h2>{{z.name}}</h2><p class=\"t\"><b>{{z.temp}}</b>℃</p><div class=\"th\"><div class=\"band\"></div><div class=\"mark\"></div></div><p class=\"set\">설정 {{z.lo}} ~ {{z.hi}}℃</p><dl><div><dt>적재</dt><dd>{{z.load}}</dd></div><div><dt>문 열림</dt><dd>{{z.doors}}</dd></div></dl><p class=\"word\"><i></i>{{z.word}}</p><p class=\"note\">{{z.note}}</p></article>",
      "style": ".zc{height:100%;box-sizing:border-box;padding:14px 16px;border:3px solid #05ffa1;border-radius:14px;background:rgba(26,11,46,.62);backdrop-filter:blur(6px);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff;display:grid;grid-template-rows:auto auto auto auto auto auto 1fr auto;gap:6px;box-shadow:0 0 18px rgba(5,255,161,.25)}\n.en{margin:0;font-size:11px;letter-spacing:.5em;color:#01cdfe}\nh2{margin:0;font-size:24px;font-weight:800}\n.t{margin:0;font-size:16px}\n.t b{font:italic 900 46px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:-1px;background:linear-gradient(180deg, #ffffff 0%, #c9d6ff 45%, #6b5bd6 52%, #f4c6ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}\n.th{position:relative;height:12px;border-radius:6px;background:linear-gradient(90deg, #01cdfe, #b967ff 60%, #ff71ce);opacity:.9}\n.band{position:absolute;top:-3px;bottom:-3px;left:calc((var(--lo) + 80) * 100% / 105);width:calc((var(--hi) - var(--lo)) * 100% / 105);min-width:6px;border:2px solid #fff;border-radius:4px}\n.mark{position:absolute;top:-8px;width:4px;height:28px;margin-left:-2px;left:calc((var(--v) + 80) * 100% / 105);background:#fff;box-shadow:0 0 0 2px #1a0b2e}\n.set{margin:0;font-size:12px;color:#d9c7f5}\ndl{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:4px}\ndl div{background:rgba(255,255,255,.08);border-radius:6px;padding:4px 8px}\ndt{font-size:11px;color:#d9c7f5}dd{margin:0;font-size:16px;font-weight:700}\n.word{margin:0;align-self:end;justify-self:start;display:flex;gap:6px;align-items:center;padding:2px 12px;border:2px solid #05ffa1;border-radius:999px;font-size:15px;font-weight:800;color:#05ffa1}\ni{font-style:normal}\n.note{margin:0;font-size:12px;line-height:1.4;color:#e8dcff}\n.ok i::before{content:\"●\"}\n.defrost{border-color:#01cdfe;box-shadow:0 0 18px rgba(1,205,254,.3)}.defrost .word{border-color:#01cdfe;color:#01cdfe}.defrost i::before{content:\"❄\"}\n.door{border-color:#fffb96;border-style:dashed;box-shadow:none}.door .word{border-color:#fffb96;border-style:dashed;color:#fffb96}.door i::before{content:\"▮\"}\n.alarm{border-color:#ff71ce;border-width:5px;box-shadow:0 0 26px rgba(255,113,206,.6)}.alarm .word{background:#ff71ce;border-color:#ff71ce;color:#1a0b2e}.alarm i::before{content:\"▲\"}.alarm .mark{background:#ff71ce;box-shadow:0 0 0 2px #fff}",
      "props": {
        "z": "object"
      }
    },
    "docks": {
      "template": "<section class=\"dk\"><h2>DOCKS · 도크 입출고</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{dock}}</b><span><strong>{{truck}}</strong><small>{{what}}</small></span><time>{{time}}</time><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".dk{height:100%;box-sizing:border-box;padding:4px 6px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#fff}\nh2{margin:0 0 12px;font:italic 900 22px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.1em;color:#b967ff}\nol{margin:0;padding:0;list-style:none;display:grid;gap:8px}\nli{display:grid;grid-template-columns:64px minmax(0,1fr) 56px 88px;gap:10px;align-items:center;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,.06)}\nb{font:italic 900 20px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#01cdfe}\nspan{display:grid;min-width:0}strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}small{font-size:12px;color:#d9c7f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\ntime{font-size:13px;color:#d9c7f5;font-variant-numeric:tabular-nums}\nem{font-style:normal;font-size:13px;font-weight:800;text-align:center;border:2px solid #fff;border-radius:999px;padding:1px 0}\n.loading em{border-color:#05ffa1;color:#05ffa1}\n.waiting em{border-color:#fffb96;border-style:dashed;color:#fffb96}\n.held em{background:#ff71ce;border-color:#ff71ce;color:#1a0b2e}\n.done{opacity:.55}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "warehouse",
      "path": "/warehouse/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "zones": {
      "from": "warehouse",
      "path": "/warehouse/zones",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "frzA": {
          "at": "/value/frzA"
        },
        "frzB": {
          "at": "/value/frzB"
        },
        "chl1": {
          "at": "/value/chl1"
        },
        "chl2": {
          "at": "/value/chl2"
        },
        "amb": {
          "at": "/value/amb"
        },
        "ult": {
          "at": "/value/ult"
        }
      }
    },
    "frzb": {
      "from": "warehouse",
      "path": "/warehouse/frzb",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "docks": {
      "from": "warehouse",
      "path": "/warehouse/docks",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "banner": {
      "as": "element",
      "element": "banner",
      "of": "now",
      "bind": {
        "n": "value"
      }
    },
    "zone-frzA": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "frzA"
      }
    },
    "zone-frzB": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "frzB"
      }
    },
    "zone-chl1": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "chl1"
      }
    },
    "zone-chl2": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "chl2"
      }
    },
    "zone-amb": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "amb"
      }
    },
    "zone-ult": {
      "as": "element",
      "element": "zone",
      "of": "zones",
      "bind": {
        "z": "ult"
      }
    },
    "frzb-trend": {
      "as": "chart.line",
      "of": "frzb",
      "title": "냉동 B — 지난 24시간 온도 (℃)",
      "x": "hour",
      "y": [
        "temp",
        "limit"
      ],
      "series": [
        {
          "label": "온도",
          "color": "#01cdfe"
        },
        {
          "label": "상한 -20℃",
          "color": "#ff71ce"
        }
      ],
      "echarts": {
        "yAxis": {
          "min": -26,
          "max": -16
        }
      }
    },
    "docks": {
      "as": "element",
      "element": "docks",
      "of": "docks",
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22sky%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%22480%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%231a0b2e%22%2F%3E%3Cstop%20offset%3D%22.45%22%20stop-color%3D%22%234a1c6b%22%2F%3E%3Cstop%20offset%3D%22.8%22%20stop-color%3D%22%23c2408f%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff9a8b%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22sun%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fffb96%22%2F%3E%3Cstop%20offset%3D%22.6%22%20stop-color%3D%22%23ffb26b%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23ff71ce%22%2F%3E%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22floor%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%232b0f45%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%231a0b2e%22%2F%3E%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%22480%22%20fill%3D%22url(%23sky)%22%2F%3E%0A%3Ccircle%20cx%3D%22800%22%20cy%3D%22470%22%20r%3D%22230%22%20fill%3D%22url(%23sun)%22%2F%3E%0A%3Crect%20x%3D%22560%22%20y%3D%22330%22%20width%3D%22480%22%20height%3D%223%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22352%22%20width%3D%22480%22%20height%3D%225%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22374%22%20width%3D%22480%22%20height%3D%227%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22396%22%20width%3D%22480%22%20height%3D%229%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22418%22%20width%3D%22480%22%20height%3D%2211%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22440%22%20width%3D%22480%22%20height%3D%2213%22%20fill%3D%22url(%23sky)%22%2F%3E%3Crect%20x%3D%22560%22%20y%3D%22462%22%20width%3D%22480%22%20height%3D%2215%22%20fill%3D%22url(%23sky)%22%2F%3E%0A%3Crect%20y%3D%22480%22%20width%3D%221600%22%20height%3D%22520%22%20fill%3D%22url(%23floor)%22%2F%3E%0A%3Cg%20stroke%3D%22%23ff71ce%22%20stroke-width%3D%221.6%22%20opacity%3D%22.55%22%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22480%22%20y2%3D%22480%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22482%22%20y2%3D%22482%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22488%22%20y2%3D%22488%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22501%22%20y2%3D%22501%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22519%22%20y2%3D%22519%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22544%22%20y2%3D%22544%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22575%22%20y2%3D%22575%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22613%22%20y2%3D%22613%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22659%22%20y2%3D%22659%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22712%22%20y2%3D%22712%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22772%22%20y2%3D%22772%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22840%22%20y2%3D%22840%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22916%22%20y2%3D%22916%22%2F%3E%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%221000%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-1600%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-1400%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-1200%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-1000%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-800%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-600%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-400%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22-200%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%220%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22200%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22400%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22600%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%22800%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%221000%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%221200%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%221400%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%221600%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%221800%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%222000%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%222200%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%222400%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%222600%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%222800%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%223000%22%20y2%3D%221000%22%2F%3E%3Cline%20x1%3D%22800%22%20y1%3D%22480%22%20x2%3D%223200%22%20y2%3D%221000%22%2F%3E%3C%2Fg%3E%0A%3Cline%20x1%3D%220%22%20x2%3D%221600%22%20y1%3D%22480%22%20y2%3D%22480%22%20stroke%3D%22%2301cdfe%22%20stroke-width%3D%222%22%20opacity%3D%22.8%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%22500%22%20width%3D%22780%22%20height%3D%22470%22%20rx%3D%2210%22%20fill%3D%22%231a0b2e%22%20fill-opacity%3D%22.82%22%20stroke%3D%22%2301cdfe%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%22850%22%20y%3D%22500%22%20width%3D%22700%22%20height%3D%22470%22%20rx%3D%2210%22%20fill%3D%22%231a0b2e%22%20fill-opacity%3D%22.82%22%20stroke%3D%22%23b967ff%22%20stroke-width%3D%222%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        28,
        1480,
        80
      ],
      "zone-frzA": [
        60,
        130,
        230,
        330
      ],
      "zone-frzB": [
        305,
        130,
        230,
        330
      ],
      "zone-chl1": [
        550,
        130,
        230,
        330
      ],
      "zone-chl2": [
        795,
        130,
        230,
        330
      ],
      "zone-amb": [
        1040,
        130,
        230,
        330
      ],
      "zone-ult": [
        1285,
        130,
        230,
        330
      ],
      "frzb-trend": [
        70,
        515,
        740,
        440
      ],
      "docks": [
        870,
        520,
        660,
        430
      ]
    }
  }
};

export const coldchainVapor: SamplePack = {
  id: "coldchain-vapor",
  title: {
    "ko": "콜드체인 물류센터 — 베이퍼웨이브",
    "en": "A cold-chain warehouse — vaporwave"
  },
  field: {
    "ko": "콜드체인·냉장 물류",
    "en": "Cold-chain logistics"
  },
  kind: {
    "ko": "온도 구역별 상태",
    "en": "Temperature zones"
  },
  domain: "logistics",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "콜드체인 물류센터를 베이퍼웨이브로 — 파스텔 노을과 자홍 원근 격자 앞에 온도 구역 여섯이 서리 유리 카드로 한 줄: 크롬 글씨의 온도, −80~+25 ℃ 온도계 위에 구역의 설정 띠와 지금 표지, 적재와 문 열림 횟수, 그리고 상태가 기호·낱말·카드 테로 — ● 정상(민트), ❄ 제상 중(청록 — 잠깐 오르는 것은 정상), ▮ 문 열림(노란 점선), ▲ 온도 이탈(핫핑크). 아래에 이탈한 구역의 지난 24시간 온도와 상한, 도크의 냉동 탑차. 물류센터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A cold-chain warehouse drawn as vaporwave — in front of a pastel sunset and a magenta perspective grid, the six temperature zones as frosted glass cards in a row: each zone’s temperature in chrome, a thermometer from −80 to +25 ℃ with the zone’s band and a marker where it is now, its load and door count, and its state in a mark, a word and the card’s edge — ● steady (mint), ❄ defrosting (cyan — the brief rise is expected), ▮ door held open (dashed yellow), ▲ out of band (hot pink). Below, the zone out of band over the last day against its limit, and the reefer trucks at the docks. The warehouse is made up. Example data."
  },
  connectors: [
    {
      "key": "warehouse",
      "name": "예시 콜드체인 물류센터 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 물류센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
