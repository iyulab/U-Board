// An observatory's night set in stained glass: lead lines on a dark wall, every dome a tall lancet window of coloured
// glass with the dome's telescope and its target leaded into it. A dome's state is told by the roundel at the top of its
// window, as well as by the colour of its glass: a gold star when the dome is open and observing, a half-lit disc when it
// waits for its next target, a dark disc when it is closed, a red cross when it is out for service. Below, the sky's
// readings in a rose window and the night's programme; on the right the observatory's name under an arch, the figures
// now, the key and the cloud cover through the night on a dark pane. The observatory is made up, so the values are
// example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/observatory-glass.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#f0c04a"
  },
  "elements": {
    "dome": {
      "template": "<article class=\"lc {{d.state}}\"><i></i><div><b>{{d.name}}</b><small>{{d.scope}}</small><p>{{d.target}}</p><em>{{d.word}}</em><dl><dt>노출</dt><dd>{{d.frames}}</dd><dt>돔</dt><dd>{{d.slit}}</dd></dl></div></article>",
      "style": ".lc{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;justify-items:center;gap:10px;padding:22px 14px 14px;border:8px solid #0b0a10;border-radius:112px 112px 6px 6px / 120px 120px 6px 6px;background:linear-gradient(115deg,transparent 0 31%,#0b0a10 31% 32%,transparent 32% 64%,#0b0a10 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,#0b0a10 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),#2b4f9e;box-shadow:0 0 0 2px #2c2a3a;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\ni{width:66px;height:66px;border-radius:50%;border:6px solid #0b0a10;box-sizing:border-box;display:grid;place-items:center;font-style:normal;font-size:30px;line-height:1;background:radial-gradient(circle,#2a2838,#14131b);color:#5a5870}\ndiv{width:100%;box-sizing:border-box;background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;display:grid;grid-template-rows:auto auto auto auto 1fr;gap:3px;padding:12px 12px;border-radius:4px}\nb{font:700 21px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nsmall{font-size:13px}\np{margin:4px 0 0;font:700 16px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;min-height:42px}\nem{font-style:normal;font-size:15px;font-weight:800;padding:3px 8px;justify-self:start;border:2px solid #0b0a10}\ndl{margin:6px 0 0;align-self:end;display:grid;grid-template-columns:auto 1fr;column-gap:8px;font-size:14px;border-top:2px solid #0b0a10;padding-top:6px}\ndt{font-weight:700}\ndd{margin:0;text-align:right}\n.open{background:linear-gradient(115deg,transparent 0 31%,#0b0a10 31% 32%,transparent 32% 64%,#0b0a10 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,#0b0a10 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),#2f8a5f}\n.open i{background:radial-gradient(circle,#fff3c0,#f0c04a 60%,#a77a12);color:#1d1a24}\n.open i::before{content:\"✦\"}\n.open em{background:#f0c04a}\n.standby{background:linear-gradient(115deg,transparent 0 31%,#0b0a10 31% 32%,transparent 32% 64%,#0b0a10 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,#0b0a10 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),#2b4f9e}\n.standby i{background:linear-gradient(90deg,#f0c04a 50%,#2a2838 50%);color:#1d1a24}\n.standby i::before{content:\"◐\";color:transparent}\n.standby em{background:#dfe6f6}\n.closed{background:linear-gradient(115deg,transparent 0 31%,#0b0a10 31% 32%,transparent 32% 64%,#0b0a10 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,#0b0a10 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),#6b3f99}\n.closed i::before{content:\"○\"}\n.closed em{background:#e5dcef}\n.service{background:linear-gradient(115deg,transparent 0 31%,#0b0a10 31% 32%,transparent 32% 64%,#0b0a10 64% 65%,transparent 65%),linear-gradient(25deg,transparent 0 45%,#0b0a10 45% 46%,transparent 46%),radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%),#c0392b}\n.service i{background:radial-gradient(circle,#ffd7cf,#c0392b 65%);color:#ffffff}\n.service i::before{content:\"✕\"}\n.service em{background:#c0392b;color:#ffffff}",
      "props": {
        "d": "object"
      }
    },
    "sky": {
      "template": "<section class=\"rw {{s.state}}\"><ol>{{#s.readings}}<li><small>{{label}}</small><b>{{value}}</b></li>{{/s.readings}}</ol><div><small>하늘</small><b>{{s.word}}</b><span>{{s.note}}</span></div></section>",
      "style": ".rw{position:relative;height:100%;aspect-ratio:1;margin:0 auto;box-sizing:border-box;border-radius:50%;border:10px solid #0b0a10;background:repeating-conic-gradient(from 22.5deg,#2b4f9e 0 40deg,#0b0a10 40deg 45deg,#6b3f99 45deg 85deg,#0b0a10 85deg 90deg);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;overflow:hidden}\nol{position:absolute;inset:0;margin:0;padding:0;list-style:none}\nli{position:absolute;width:118px;height:70px;margin:-35px -59px;box-sizing:border-box;background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;border-radius:10px;display:grid;align-content:center;justify-items:center;text-align:center}\nli:nth-child(1){left:50%;top:17%}\nli:nth-child(2){left:83%;top:50%}\nli:nth-child(3){left:50%;top:83%}\nli:nth-child(4){left:17%;top:50%}\nli small{font-size:12px;font-weight:700}\nli b{font:700 21px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\ndiv{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px;box-sizing:border-box;border-radius:50%;border:8px solid #0b0a10;display:grid;align-content:center;justify-items:center;text-align:center;background:radial-gradient(circle,#fff3c0,#f0c04a 70%);color:#1d1a24}\ndiv small{font-size:12px;font-weight:700}\ndiv b{font:700 26px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\ndiv span{font-size:11px;padding:0 10px}\n.poor div{background:radial-gradient(circle,#e8e2ef,#8d86a3 70%)}",
      "props": {
        "s": "object"
      }
    },
    "programme": {
      "template": "<section class=\"pg\"><h2>오늘 밤 관측 계획</h2><ol>{{#items}}<li class=\"{{state}}\"><b>{{time}}</b><span>{{dome}}</span><em>{{what}}</em><small>{{word}}</small></li>{{/items}}</ol></section>",
      "style": ".pg{height:100%;box-sizing:border-box;background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;border-width:8px;border-radius:8px;padding:16px 20px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;box-shadow:inset 0 0 0 4px #f0c04a}\nh2{margin:0 0 10px;font:700 21px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;border-bottom:3px solid #0b0a10;padding-bottom:6px}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:56px 48px 1fr 82px;align-items:center;gap:8px;padding:13px 8px;border-bottom:1px solid rgba(11,10,16,.25);font-size:15px}\nb{font:700 15px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nspan{font-weight:800}\nem{font-style:normal}\nsmall{text-align:right;font-weight:800;font-size:13px}\n.done{opacity:.6}\n.done small::before{content:\"✓ \"}\n.now{background:rgba(240,192,74,.35)}\n.now small::before{content:\"✦ \"}\n.next small::before{content:\"○ \"}\n.alarm{background:#c0392b;color:#ffffff}\n.alarm small::before{content:\"✕ \"}",
      "props": {
        "items": "list"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><small>{{t.series}}</small><h1>{{t.name}}</h1><div><span>{{t.date}}</span><b>{{t.time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:26px 20px 12px;border:8px solid #0b0a10;border-radius:270px 270px 8px 8px / 90px 90px 8px 8px;background:radial-gradient(circle at 50% 20%,rgba(255,255,255,.3),transparent 60%),#6b3f99;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;text-align:center}\nsmall,div{background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;border-width:3px;padding:2px 14px}\nsmall{font-size:13px;letter-spacing:.25em}\nh1{margin:0;font-size:46px;font-weight:700;letter-spacing:.12em;color:#fff7dc;text-shadow:0 2px 0 #0b0a10,0 0 12px rgba(240,192,74,.6)}\ndiv{display:flex;gap:16px;align-items:baseline}\nspan{font-size:15px}\nb{font-size:24px}",
      "props": {
        "t": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\ndiv{background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;border-width:6px;border-radius:8px;box-shadow:inset 0 0 0 3px #f0c04a;display:grid;align-content:center;justify-items:center;text-align:center}\ndt{font-size:13px;font-weight:700}\ndd{margin:0;font:700 30px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"ky\"><li><i class=\"open\">✦</i>관측 중</li><li><i class=\"standby\"></i>대기</li><li><i class=\"closed\">○</i>닫힘</li><li><i class=\"service\">✕</i>정비</li></ul>",
      "style": ".ky{height:100%;box-sizing:border-box;margin:0;padding:0 18px;list-style:none;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(160deg,#fbf3da,#f1e6c8);border:4px solid #0b0a10;color:#1d1a24;border-radius:8px;font:800 14px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nli{display:flex;align-items:center;gap:8px}\ni{width:26px;height:26px;box-sizing:border-box;border-radius:50%;border:3px solid #0b0a10;display:grid;place-items:center;font-style:normal;font-size:13px;background:#2a2838;color:#9a98b0}\n.open{background:#f0c04a;color:#1d1a24}\n.standby{background:linear-gradient(90deg,#f0c04a 50%,#2a2838 50%)}\n.service{background:#c0392b;color:#ffffff}"
    }
  },
  "data": {
    "domes": {
      "from": "observatory",
      "path": "/observatory/domes",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "a": {
          "at": "/value/a"
        },
        "b": {
          "at": "/value/b"
        },
        "c": {
          "at": "/value/c"
        },
        "d": {
          "at": "/value/d"
        }
      }
    },
    "sky": {
      "from": "observatory",
      "path": "/observatory/sky",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "programme": {
      "from": "observatory",
      "path": "/observatory/programme",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "observatory",
      "path": "/observatory/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "observatory",
      "path": "/observatory/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "cloud": {
      "from": "observatory",
      "path": "/observatory/cloud",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "dome-a": {
      "as": "element",
      "element": "dome",
      "of": "domes",
      "bind": {
        "d": "a"
      }
    },
    "dome-b": {
      "as": "element",
      "element": "dome",
      "of": "domes",
      "bind": {
        "d": "b"
      }
    },
    "dome-c": {
      "as": "element",
      "element": "dome",
      "of": "domes",
      "bind": {
        "d": "c"
      }
    },
    "dome-d": {
      "as": "element",
      "element": "dome",
      "of": "domes",
      "bind": {
        "d": "d"
      }
    },
    "sky": {
      "as": "element",
      "element": "sky",
      "of": "sky",
      "bind": {
        "s": "value"
      }
    },
    "programme": {
      "as": "element",
      "element": "programme",
      "of": "programme",
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
    "cloud": {
      "as": "chart.line",
      "of": "cloud",
      "title": "구름량(%) — 해 진 뒤 시간마다",
      "x": "hour",
      "y": "cloud",
      "series": [
        {
          "label": "구름량",
          "color": "#f0c04a"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%2314131b%22%2F%3E%0A%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22263%22%20cy%3D%22151%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22526%22%20cy%3D%22302%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22789%22%20cy%3D%22453%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221052%22%20cy%3D%22604%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221315%22%20cy%3D%22755%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221578%22%20cy%3D%22906%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22241%22%20cy%3D%2257%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22504%22%20cy%3D%22208%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22767%22%20cy%3D%22359%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221030%22%20cy%3D%22510%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221293%22%20cy%3D%22661%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221556%22%20cy%3D%22812%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22219%22%20cy%3D%22963%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22482%22%20cy%3D%22114%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22745%22%20cy%3D%22265%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221008%22%20cy%3D%22416%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221271%22%20cy%3D%22567%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221534%22%20cy%3D%22718%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22197%22%20cy%3D%22869%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22460%22%20cy%3D%2220%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22723%22%20cy%3D%22171%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22986%22%20cy%3D%22322%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221249%22%20cy%3D%22473%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221512%22%20cy%3D%22624%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22775%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22438%22%20cy%3D%22926%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22701%22%20cy%3D%2277%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22964%22%20cy%3D%22228%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221227%22%20cy%3D%22379%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221490%22%20cy%3D%22530%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22153%22%20cy%3D%22681%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22416%22%20cy%3D%22832%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22679%22%20cy%3D%22983%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22942%22%20cy%3D%22134%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221205%22%20cy%3D%22285%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221468%22%20cy%3D%22436%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22131%22%20cy%3D%22587%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22394%22%20cy%3D%22738%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22657%22%20cy%3D%22889%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22920%22%20cy%3D%2240%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221183%22%20cy%3D%22191%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221446%22%20cy%3D%22342%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22109%22%20cy%3D%22493%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22372%22%20cy%3D%22644%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22635%22%20cy%3D%22795%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22898%22%20cy%3D%22946%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221161%22%20cy%3D%2297%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221424%22%20cy%3D%22248%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%2287%22%20cy%3D%22399%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22350%22%20cy%3D%22550%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22613%22%20cy%3D%22701%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22876%22%20cy%3D%22852%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221139%22%20cy%3D%223%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221402%22%20cy%3D%22154%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%2265%22%20cy%3D%22305%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22328%22%20cy%3D%22456%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22591%22%20cy%3D%22607%22%20r%3D%220.6%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%22854%22%20cy%3D%22758%22%20r%3D%221.1%22%20fill%3D%22%233a3852%22%2F%3E%3Ccircle%20cx%3D%221117%22%20cy%3D%22909%22%20r%3D%221.6%22%20fill%3D%22%233a3852%22%2F%3E%0A%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%221580%22%20height%3D%22980%22%20fill%3D%22none%22%20stroke%3D%22%232c2a3a%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%221030%22%20y%3D%22450%22%20width%3D%22540%22%20height%3D%22510%22%20rx%3D%228%22%20fill%3D%22%230f0e15%22%20stroke%3D%22%230b0a10%22%20stroke-width%3D%228%22%2F%3E%0A%3Crect%20x%3D%221036%22%20y%3D%22456%22%20width%3D%22528%22%20height%3D%22498%22%20rx%3D%225%22%20fill%3D%22none%22%20stroke%3D%22%236b3f99%22%20stroke-width%3D%223%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "dome-a": [
        40,
        36,
        225,
        420
      ],
      "dome-b": [
        285,
        36,
        225,
        420
      ],
      "dome-c": [
        530,
        36,
        225,
        420
      ],
      "dome-d": [
        775,
        36,
        225,
        420
      ],
      "sky": [
        30,
        496,
        460,
        460
      ],
      "programme": [
        505,
        496,
        500,
        460
      ],
      "title": [
        1030,
        36,
        540,
        170
      ],
      "figures": [
        1030,
        222,
        540,
        130
      ],
      "legend": [
        1030,
        372,
        540,
        56
      ],
      "cloud": [
        1050,
        472,
        500,
        466
      ]
    }
  }
};

export const observatoryGlass: SamplePack = {
  id: "observatory-glass",
  title: {
    "ko": "천문대의 밤 — 스테인드글라스",
    "en": "An observatory’s night — stained glass"
  },
  field: {
    "ko": "천문대·과학 관측",
    "en": "Observatories & science"
  },
  kind: {
    "ko": "돔·망원경·하늘 상태·관측 계획",
    "en": "Domes, telescopes, the sky and the night’s programme"
  },
  domain: "environment",
  styles: [
    "craft"
  ],
  summary: {
    "ko": "천문대의 밤을 스테인드글라스로 — 어두운 벽에 납선, 돔마다 색유리 긴 아치 창 하나, 그 안에 망원경과 관측 대상이 납땜된 판으로. 돔 상태는 유리 색과 함께 창 꼭대기의 둥근 장식으로: 돔을 열고 관측 중이면 금빛 별, 다음 대상을 기다리면 반만 밝은 원, 닫혔으면 어두운 원, 정비 중이면 붉은 ✕. 아래에는 하늘 상태를 장미창에, 오늘 밤 관측 계획을, 오른쪽에 아치 아래 천문대 이름, 지금 수치, 범례, 어두운 유리 위 밤새 구름량. 천문대는 지어낸 것이라 예시 데이터입니다.",
    "en": "An observatory’s night set in stained glass — lead lines on a dark wall, every dome a tall lancet window of coloured glass with its telescope and target leaded in. A dome tells its state by the roundel at the top of its window, as well as by its glass’s colour: a gold star when it is open and observing, a half-lit disc when it waits for its next target, a dark disc when it is closed, a red cross when it is out for service. Below, the sky’s readings in a rose window and the night’s programme; on the right the observatory’s name under an arch, the figures now, the key and the cloud cover through the night on a dark pane. The observatory is made up. Example data."
  },
  connectors: [
    {
      "key": "observatory",
      "name": "예시 천문대 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 천문대가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
