// A railway station's lost-and-found office as a desk of typed case files: manila folders with a tab for the case
// number, an index card typed on a typewriter in each — what was found, where, when, what marks it — and a rubber stamp
// across the card for where the case stands: kept, owner contacted, handed back, or due for disposal. On the right a
// label-maker title, the day's figures on a typed memo, what is kept by kind on a sheet of graph paper, and the claims
// waiting at the counter. The station and its office are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/lost-found-dossier.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c2362f"
  },
  "elements": {
    "tape": {
      "template": "<header class=\"tp\"><span>한빛역 분실물 센터</span><span class=\"en\">LOST &amp; FOUND</span></header>",
      "style": ".tp{height:100%;display:flex;align-items:center;gap:14px}\nspan{padding:6px 16px;background:#1d1d1f;color:#f2f2f2;font:800 26px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:.16em;border-radius:3px;box-shadow:inset 0 -3px 0 rgba(255,255,255,.08);transform:rotate(-1deg)}\n.en{background:#c2362f;font:800 20px \"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace;letter-spacing:.3em;transform:rotate(1.5deg)}"
    },
    "folder": {
      "template": "<article class=\"fd {{f.state}}\"><div class=\"tab\">{{f.no}}</div><div class=\"card\"><dl><div><dt>품목</dt><dd>{{f.item}}</dd></div><div><dt>습득</dt><dd>{{f.where}}</dd></div><div><dt>일시</dt><dd>{{f.when}}</dd></div><div><dt>특징</dt><dd>{{f.note}}</dd></div></dl><p class=\"st\"><b>{{f.stamp}}</b><small>{{f.since}}</small></p></div></article>",
      "style": ".fd{position:relative;height:100%;box-sizing:border-box;padding-top:30px;font-family:\"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace;color:#26262b}\n.tab{position:absolute;top:0;left:14px;width:142px;white-space:nowrap;height:34px;box-sizing:border-box;padding:7px 10px 0;background:#e6c88c;border:1.5px solid #b8975a;border-bottom:0;border-radius:8px 8px 0 0;font:700 14px \"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace;letter-spacing:.06em}\n.card{position:relative;height:100%;box-sizing:border-box;padding:14px 12px 10px 30px;background:#e6c88c;border:1.5px solid #b8975a;border-radius:0 6px 6px 6px;border-left:8px solid #b8975a}\ndl{margin:0;height:200px;box-sizing:border-box;padding:6px 8px 0 26px;background:#fbf8ef repeating-linear-gradient(#fbf8ef 0 23px, #a9c3dc 23px 24px);border-left:2px solid #d9837a;display:grid;align-content:start;gap:0}\ndl div{display:grid;grid-template-columns:40px 1fr;line-height:24px;font-size:13px}\ndt{color:#6b6f78}\ndd{margin:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.st{position:absolute;right:14px;bottom:14px;margin:0;display:grid;justify-items:center;padding:4px 10px;border:3px double currentColor;border-radius:6px;transform:rotate(-8deg);font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;opacity:.9}\n.st b{font-size:18px;letter-spacing:.12em}\n.st small{font:11px \"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace}\n.kept .card{border-left-color:#2b4f8c}.kept .st{color:#2b4f8c}\n.contacted .card{border-left-color:#b86e0e}.contacted .st{color:#b86e0e;border-style:dashed;border-width:3px}\n.returned .card{border-left-color:#2f7a4a}.returned .st{color:#2f7a4a;border-radius:50%;padding:10px 12px}\n.returned dl{opacity:.6}\n.disposal .card{border-left-color:#c2362f}.disposal .st{color:#c2362f;border-width:4px;border-style:solid;transform:rotate(6deg)}",
      "props": {
        "f": "object"
      }
    },
    "queue": {
      "template": "<section class=\"qu\"><h2>창구 인계 대기</h2><ol>{{#items}}<li class=\"{{state}}\"><time>{{time}}</time><span>{{who}}</span><span>{{item}}</span><b>{{word}}</b></li>{{/items}}</ol></section>",
      "style": ".qu{height:100%;box-sizing:border-box;padding:12px 20px;background:#fbf8ef;border:1.5px solid #c9c2ae;font-family:\"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace;color:#26262b;display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:start}\nh2{margin:4px 0 0;font:800 18px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;border-right:2px solid #d9837a;height:100%}\nol{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;column-gap:24px;row-gap:2px}\nli{display:grid;grid-template-columns:52px 70px 1fr auto;gap:8px;align-items:baseline;font-size:13px;line-height:26px;border-bottom:1px solid #a9c3dc}\ntime{color:#6b6f78}\nb{font:700 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;padding:0 8px;border-radius:3px;border:1.5px solid currentColor;line-height:20px}\n.waiting b{color:#b86e0e}\n.checking b{color:#2b4f8c}\n.ready b{color:#2f7a4a}",
      "props": {
        "items": "list"
      }
    },
    "memo": {
      "template": "<section class=\"mm\"><header><b>일일 현황</b><span>{{m.date}} · {{m.time}} 현재</span></header><dl><div><dt>오늘 접수</dt><dd>{{m.received}}</dd></div><div><dt>오늘 인계</dt><dd>{{m.returned}}</dd></div><div><dt>보관 중</dt><dd>{{m.kept}}</dd></div><div><dt>이번 주 폐기 예정</dt><dd>{{m.disposal}}</dd></div></dl><p>{{m.note}}</p></section>",
      "style": ".mm{height:100%;box-sizing:border-box;padding:18px 22px;background:#fffdf5;border-top:22px solid #f0d9d5;font-family:\"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace;color:#26262b;box-shadow:0 6px 0 -2px #e9e2cf}\nheader{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px dashed #999;padding-bottom:8px}\nb{font:800 22px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif}\nspan{font-size:13px}\ndl{margin:12px 0 0;display:grid;gap:4px}\ndl div{display:flex;justify-content:space-between;align-items:baseline;font-size:16px;border-bottom:1px dotted #bbb;padding:3px 0}\ndd{margin:0;font:800 24px \"Courier New\", \"Nanum Gothic Coding\", \"D2Coding\", monospace}\np{margin:10px 0 0;font-size:13px;color:#555}",
      "props": {
        "m": "object"
      }
    },
    "legend": {
      "template": "<section class=\"lg\"><h2>도장</h2><ul><li class=\"kept\"><b>보관</b>등록해 보관함에 둠</li><li class=\"contacted\"><b>연락</b>주인에게 연락함 — 점선</li><li class=\"returned\"><b>인계</b>주인에게 돌려줌 — 둥근 도장</li><li class=\"disposal\"><b>폐기</b>보관 기한이 다가옴 — 굵은 도장</li></ul></section>",
      "style": ".lg{height:100%;box-sizing:border-box;padding:14px 20px;background:#fffdf5;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#26262b}\nh2{margin:0 0 8px;font-size:16px}\nul{margin:0;padding:0;list-style:none;display:grid;gap:8px}\nli{display:flex;align-items:center;gap:12px;font-size:13px}\nb{display:inline-block;min-width:44px;text-align:center;padding:2px 6px;border:3px double currentColor;border-radius:5px;font-size:13px;letter-spacing:.1em;transform:rotate(-6deg)}\n.kept b{color:#2b4f8c}.contacted b{color:#b86e0e;border-style:dashed}.returned b{color:#2f7a4a;border-radius:50%}.disposal b{color:#c2362f;border:4px solid}"
    }
  },
  "data": {
    "cases": {
      "from": "desk",
      "path": "/desk/cases",
      "time": "updatedAt",
      "fresh": 900,
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
        },
        "e": {
          "at": "/value/e"
        },
        "f": {
          "at": "/value/f"
        },
        "g": {
          "at": "/value/g"
        },
        "h": {
          "at": "/value/h"
        }
      }
    },
    "queue": {
      "from": "desk",
      "path": "/desk/queue",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "today": {
      "from": "desk",
      "path": "/desk/today",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "kinds": {
      "from": "desk",
      "path": "/desk/kinds",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "tape": {
      "as": "element",
      "element": "tape"
    },
    "case-a": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "a"
      }
    },
    "case-b": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "b"
      }
    },
    "case-c": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "c"
      }
    },
    "case-d": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "d"
      }
    },
    "case-e": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "e"
      }
    },
    "case-f": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "f"
      }
    },
    "case-g": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "g"
      }
    },
    "case-h": {
      "as": "element",
      "element": "folder",
      "of": "cases",
      "bind": {
        "f": "h"
      }
    },
    "queue": {
      "as": "element",
      "element": "queue",
      "of": "queue",
      "bind": {
        "items": "value"
      }
    },
    "memo": {
      "as": "element",
      "element": "memo",
      "of": "today",
      "bind": {
        "m": "value"
      }
    },
    "kept": {
      "as": "chart.bar",
      "of": "kinds",
      "title": "보관 중 — 종류별 (건)",
      "x": "kind",
      "y": "count",
      "series": [
        {
          "label": "보관 중",
          "color": "#2b4f8c"
        }
      ]
    },
    "legend": {
      "as": "element",
      "element": "legend"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%234a3a2f%22%2F%3E%0A%3Cpath%20d%3D%22M0%2018%20C%20400%2012%2C%20800%2026%2C%201200%2016%20S%201500%2022%2C%201600%2018%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2044%20C%20400%2038%2C%20800%2052%2C%201200%2042%20S%201500%2048%2C%201600%2044%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2070%20C%20400%2064%2C%20800%2078%2C%201200%2068%20S%201500%2074%2C%201600%2070%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%2096%20C%20400%2090%2C%20800%20104%2C%201200%2094%20S%201500%20100%2C%201600%2096%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20122%20C%20400%20116%2C%20800%20130%2C%201200%20120%20S%201500%20126%2C%201600%20122%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20148%20C%20400%20142%2C%20800%20156%2C%201200%20146%20S%201500%20152%2C%201600%20148%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20174%20C%20400%20168%2C%20800%20182%2C%201200%20172%20S%201500%20178%2C%201600%20174%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20200%20C%20400%20194%2C%20800%20208%2C%201200%20198%20S%201500%20204%2C%201600%20200%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20226%20C%20400%20220%2C%20800%20234%2C%201200%20224%20S%201500%20230%2C%201600%20226%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20252%20C%20400%20246%2C%20800%20260%2C%201200%20250%20S%201500%20256%2C%201600%20252%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20278%20C%20400%20272%2C%20800%20286%2C%201200%20276%20S%201500%20282%2C%201600%20278%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20304%20C%20400%20298%2C%20800%20312%2C%201200%20302%20S%201500%20308%2C%201600%20304%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20330%20C%20400%20324%2C%20800%20338%2C%201200%20328%20S%201500%20334%2C%201600%20330%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20356%20C%20400%20350%2C%20800%20364%2C%201200%20354%20S%201500%20360%2C%201600%20356%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20382%20C%20400%20376%2C%20800%20390%2C%201200%20380%20S%201500%20386%2C%201600%20382%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20408%20C%20400%20402%2C%20800%20416%2C%201200%20406%20S%201500%20412%2C%201600%20408%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20434%20C%20400%20428%2C%20800%20442%2C%201200%20432%20S%201500%20438%2C%201600%20434%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20460%20C%20400%20454%2C%20800%20468%2C%201200%20458%20S%201500%20464%2C%201600%20460%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20486%20C%20400%20480%2C%20800%20494%2C%201200%20484%20S%201500%20490%2C%201600%20486%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20512%20C%20400%20506%2C%20800%20520%2C%201200%20510%20S%201500%20516%2C%201600%20512%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20538%20C%20400%20532%2C%20800%20546%2C%201200%20536%20S%201500%20542%2C%201600%20538%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20564%20C%20400%20558%2C%20800%20572%2C%201200%20562%20S%201500%20568%2C%201600%20564%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20590%20C%20400%20584%2C%20800%20598%2C%201200%20588%20S%201500%20594%2C%201600%20590%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20616%20C%20400%20610%2C%20800%20624%2C%201200%20614%20S%201500%20620%2C%201600%20616%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20642%20C%20400%20636%2C%20800%20650%2C%201200%20640%20S%201500%20646%2C%201600%20642%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20668%20C%20400%20662%2C%20800%20676%2C%201200%20666%20S%201500%20672%2C%201600%20668%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20694%20C%20400%20688%2C%20800%20702%2C%201200%20692%20S%201500%20698%2C%201600%20694%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20720%20C%20400%20714%2C%20800%20728%2C%201200%20718%20S%201500%20724%2C%201600%20720%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20746%20C%20400%20740%2C%20800%20754%2C%201200%20744%20S%201500%20750%2C%201600%20746%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20772%20C%20400%20766%2C%20800%20780%2C%201200%20770%20S%201500%20776%2C%201600%20772%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20798%20C%20400%20792%2C%20800%20806%2C%201200%20796%20S%201500%20802%2C%201600%20798%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20824%20C%20400%20818%2C%20800%20832%2C%201200%20822%20S%201500%20828%2C%201600%20824%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20850%20C%20400%20844%2C%20800%20858%2C%201200%20848%20S%201500%20854%2C%201600%20850%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20876%20C%20400%20870%2C%20800%20884%2C%201200%20874%20S%201500%20880%2C%201600%20876%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20902%20C%20400%20896%2C%20800%20910%2C%201200%20900%20S%201500%20906%2C%201600%20902%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20928%20C%20400%20922%2C%20800%20936%2C%201200%20926%20S%201500%20932%2C%201600%20928%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20954%20C%20400%20948%2C%20800%20962%2C%201200%20952%20S%201500%20958%2C%201600%20954%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M0%20980%20C%20400%20974%2C%20800%20988%2C%201200%20978%20S%201500%20984%2C%201600%20980%22%20stroke%3D%22%2356443a%22%20stroke-width%3D%223%22%20fill%3D%22none%22%2F%3E%0A%3Crect%20x%3D%2246%22%20y%3D%22132%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22302%22%20y%3D%22132%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22558%22%20y%3D%22132%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22814%22%20y%3D%22132%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%2246%22%20y%3D%22472%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22302%22%20y%3D%22472%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22558%22%20y%3D%22472%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%3Crect%20x%3D%22814%22%20y%3D%22472%22%20width%3D%22240%22%20height%3D%22320%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%0A%3Crect%20x%3D%221096%22%20y%3D%22368%22%20width%3D%22470%22%20height%3D%22296%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%0A%3Crect%20x%3D%221090%22%20y%3D%22360%22%20width%3D%22470%22%20height%3D%22296%22%20fill%3D%22%23f4f8f2%22%2F%3E%0A%3Cpath%20d%3D%22M1094%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1108%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1122%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1136%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1150%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1164%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1178%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1192%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1206%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1220%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1234%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1248%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1262%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1276%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1290%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1304%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1318%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1332%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1346%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1360%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1374%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1388%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1402%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1416%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1430%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1444%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1458%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1472%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1486%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1500%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1514%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1528%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1542%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1556%20372%20V%20650%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20372%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20386%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20400%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20414%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20428%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20442%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20456%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20470%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20484%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20498%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20512%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20526%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20540%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20554%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20568%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20582%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20596%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20610%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20624%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%3Cpath%20d%3D%22M1094%20638%20H%201556%22%20stroke%3D%22%23cfe3d6%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%221090%22%20y%3D%22360%22%20width%3D%22470%22%20height%3D%22296%22%20fill%3D%22none%22%20stroke%3D%22%239fbfab%22%20stroke-width%3D%222%22%2F%3E%0A%3Cg%20transform%3D%22translate(1520%20352)%20rotate(18)%22%3E%3Crect%20x%3D%22-6%22%20y%3D%22-22%22%20width%3D%2212%22%20height%3D%2244%22%20rx%3D%226%22%20fill%3D%22none%22%20stroke%3D%22%23c9cdd2%22%20stroke-width%3D%223%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%2246%22%20y%3D%22820%22%20width%3D%221008%22%20height%3D%22158%22%20rx%3D%224%22%20fill%3D%22%23000%22%20opacity%3D%22.28%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "tape": [
        40,
        34,
        1008,
        64
      ],
      "case-a": [
        40,
        124,
        240,
        320
      ],
      "case-b": [
        296,
        124,
        240,
        320
      ],
      "case-c": [
        552,
        124,
        240,
        320
      ],
      "case-d": [
        808,
        124,
        240,
        320
      ],
      "case-e": [
        40,
        464,
        240,
        320
      ],
      "case-f": [
        296,
        464,
        240,
        320
      ],
      "case-g": [
        552,
        464,
        240,
        320
      ],
      "case-h": [
        808,
        464,
        240,
        320
      ],
      "queue": [
        40,
        812,
        1008,
        158
      ],
      "memo": [
        1090,
        40,
        470,
        300
      ],
      "kept": [
        1100,
        372,
        450,
        274
      ],
      "legend": [
        1090,
        670,
        470,
        300
      ]
    }
  }
};

export const lostFoundDossier: SamplePack = {
  id: "lost-found-dossier",
  title: {
    "ko": "역 분실물 센터 — 타자기 사건 서류철",
    "en": "A station’s lost and found — typed case files"
  },
  field: {
    "ko": "대중교통·분실물",
    "en": "Transit lost and found"
  },
  kind: {
    "ko": "사건 서류철·창구 대기",
    "en": "Case files and the counter"
  },
  domain: "transport",
  styles: [
    "print"
  ],
  summary: {
    "ko": "철도역 분실물 센터를 책상 위 타자기 서류철로 — 마닐라 폴더마다 탭에 사건 번호, 안에 타자로 친 색인 카드(품목·습득 장소·일시·특징), 그리고 카드에 찍힌 고무도장: 보관(파란 겹선), 연락(주황 점선), 인계(초록 둥근 도장, 카드는 흐리게), 폐기 예정(빨간 굵은 도장) — 도장 글자와 모양, 폴더 가장자리 색이 함께 말한다. 오른쪽에 라벨 테이프 제목, 타자 메모의 오늘 수치, 모눈종이 위 종류별 보관 건수, 아래에 창구 인계 대기 명부. 역과 센터는 지어낸 것이라 예시 데이터입니다.",
    "en": "A railway station’s lost-and-found office as a desk of typed case files — a manila folder for each case with its number on the tab, an index card typed on a typewriter inside (what was found, where, when, what marks it), and a rubber stamp across the card: kept (a blue double ring), owner contacted (an orange dashed one), handed back (a round green stamp, the card faded), due for disposal (a heavy red one) — the stamp’s word and shape and the folder’s edge say it together. On the right a label-maker title, the day’s figures on a typed memo and what is kept by kind on graph paper; below, the claims waiting at the counter. The station and its office are made up. Example data."
  },
  connectors: [
    {
      "key": "desk",
      "name": "예시 분실물 관리 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 역·분실물 센터가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
