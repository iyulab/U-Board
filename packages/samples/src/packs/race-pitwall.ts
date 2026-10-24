// A race team's pit wall during a grand prix, drawn the way a race broadcast draws its graphics: black, white
// condensed italic type, one red, panels cut on a slant. The timing tower down the left — position, interval, the
// tyre each car is on and how old it is, its last lap with its sectors coloured as timing screens colour them
// (purple the session's best, green the driver's own best, yellow neither). The circuit on the right with its three
// sectors and who holds the best time in each, the pit lane and the DRS zones; below it the team's two cars' tyre
// strategy and their lap times. The race and its drivers are made up, so the values are example data written for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/race-pitwall.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#e10600"
  },
  "elements": {
    "header": {
      "template": "<header class=\"rb\"><b class=\"red\">{{race}}</b><span>{{circuit}}</span><p class=\"lap\">LAP <strong>{{lap}}</strong> / {{laps}}</p><p class=\"flag {{flag}}\">{{flagText}}</p><p class=\"wx\">AIR {{air}} · TRACK {{track}}</p></header>",
      "style": ".rb{height:100%;box-sizing:border-box;display:flex;align-items:stretch;gap:0;font-family:\"Arial Narrow\", \"Roboto Condensed\", \"Helvetica Neue\", Arial, sans-serif;font-style:italic;color:#fff;text-transform:uppercase}\n.red{display:flex;align-items:center;padding:0 30px 0 24px;background:#e10600;font-size:34px;font-weight:800;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 100%,0 100%)}\nspan{display:flex;align-items:center;padding:0 24px;font-size:22px;color:#bdbdbd}\np{margin:0;display:flex;align-items:center;gap:10px;padding:0 26px;font-size:24px;font-weight:700;border-left:2px solid #2a2a2a}\n.lap strong{font-size:44px;font-weight:800}\n.lap{margin-left:auto}\n.flag{gap:12px}.flag::before{content:\"\";width:34px;height:24px;background:#27e36b;transform:skewX(-14deg)}\n.flag.yellow::before{background:#ffd500}.flag.sc::before{background:#ffd500;outline:3px solid #fff}\n.wx{font-size:18px;color:#bdbdbd}",
      "props": {
        "race": "string",
        "circuit": "string",
        "lap": "number",
        "laps": "number",
        "flag": "string",
        "flagText": "string",
        "air": "string",
        "track": "string"
      }
    },
    "tower": {
      "template": "<ol class=\"tw\">{{#cars}}<li class=\"{{#ours}}ours{{/ours}}\"><b>{{pos}}</b><i style=\"--t: {{colour}}\"></i><strong>{{code}}</strong>{{#pit}}<span class=\"pit\"><u>PIT</u></span>{{/pit}}{{^pit}}<span>{{gap}}</span>{{/pit}}<em class=\"t{{tyre}}\">{{tyre}}</em><small>{{age}}</small><s class=\"{{s1}}\"></s><s class=\"{{s2}}\"></s><s class=\"{{s3}}\"></s></li>{{/cars}}</ol>",
      "style": ".tw{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:grid;grid-template-rows:repeat(20,1fr);gap:3px;font-family:\"Arial Narrow\", \"Roboto Condensed\", \"Helvetica Neue\", Arial, sans-serif;font-style:italic;color:#fff}\nli{position:relative;display:grid;grid-template-columns:34px 6px 64px 1fr 30px 26px repeat(3,14px);align-items:center;gap:8px;padding:0 10px;background:#141418;clip-path:polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%);font-size:20px}\n.ours{background:#2a0a0a;box-shadow:inset 4px 0 0 #e10600}\nb{font-size:22px;font-weight:800;text-align:right}\ni{height:70%;background:var(--t)}\nstrong{font-size:22px;font-weight:800;letter-spacing:.04em}\nspan{text-align:right;color:#d0d0d0;font-variant-numeric:tabular-nums}\nem{font-style:normal;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;border:3px solid #fff;font-size:12px;font-weight:800}\n.tS{border-color:#e10600}.tM{border-color:#ffd500}.tH{border-color:#f2f2f2}.tI{border-color:#27e36b}\nsmall{font-size:14px;color:#9a9a9a;font-style:normal}\ns{display:block;height:10px;background:#ffd500;transform:skewX(-14deg)}\ns.p{background:#b44dff}s.g{background:#27e36b}\nu{text-decoration:none;padding:1px 10px;background:#fff;color:#000;font-size:15px;font-weight:800}",
      "props": {
        "cars": "list"
      }
    },
    "sector-best": {
      "template": "<p class=\"sb\" style=\"--c: {{colour}}\"><b>{{sector}}</b><span>{{time}}</span><small>{{who}}</small></p>",
      "style": ".sb{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:10px;align-content:center;padding:6px 14px 6px 0;background:#000;clip-path:polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%);font-family:\"Arial Narrow\", \"Roboto Condensed\", \"Helvetica Neue\", Arial, sans-serif;font-style:italic;color:#fff}\nb{grid-row:span 2;display:grid;place-items:center;padding:0 12px;background:var(--c);font-size:22px;font-weight:800;color:#000}\nspan{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums}\nsmall{font-size:14px;color:#bdbdbd}",
      "props": {
        "sector": "string",
        "colour": "string",
        "time": "string",
        "who": "string"
      }
    },
    "strategy": {
      "template": "<section class=\"st\" style=\"--now: {{lap}}; --all: {{laps}}\"><h3>TYRE STRATEGY <small>LAP {{lap}} / {{laps}}</small></h3>{{#cars}}<div class=\"row\"><b>{{code}}</b><p>{{#stints}}<i class=\"t{{tyre}} {{#planned}}plan{{/planned}}\" style=\"--n: {{laps}}\">{{tyre}}</i>{{/stints}}</p><small>{{note}}</small></div>{{/cars}}<span class=\"now\"></span></section>",
      "style": ".st{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr 1fr;gap:10px;padding:14px 18px;background:#141418;clip-path:polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%);font-family:\"Arial Narrow\", \"Roboto Condensed\", \"Helvetica Neue\", Arial, sans-serif;font-style:italic;color:#fff}\nh3{margin:0;font-size:20px;font-weight:800;letter-spacing:.06em;display:flex;justify-content:space-between}\nh3 small{font-size:16px;color:#9a9a9a}\n.row{display:grid;grid-template-columns:60px 1fr;grid-template-rows:auto auto;column-gap:12px;align-content:center}\nb{grid-row:span 2;font-size:24px;font-weight:800;align-self:center}\np{margin:0;display:flex;height:30px;gap:2px}\ni{flex:var(--n) 0 0;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:14px;color:#000;background:#f2f2f2}\n.tS{background:#e10600;color:#fff}.tM{background:#ffd500}.tH{background:#f2f2f2}.tI{background:#27e36b}\n.plan{opacity:.45;background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.35) 0 4px,transparent 4px 8px)}\n.row small{font-size:14px;color:#bdbdbd;margin-top:4px}\n.now{position:absolute;top:44px;bottom:14px;left:calc(18px + 72px + (100% - 108px) * var(--now) / var(--all));width:2px;background:#fff}",
      "props": {
        "lap": "number",
        "laps": "number",
        "cars": "list"
      }
    }
  },
  "data": {
    "race": {
      "from": "timing",
      "path": "/timing/race",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "name": {},
        "circuit": {},
        "lap": {},
        "laps": {},
        "flag": {},
        "flagText": {},
        "air": {},
        "track": {}
      }
    },
    "tower": {
      "from": "timing",
      "path": "/timing/tower",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {}
      }
    },
    "sectors": {
      "from": "timing",
      "path": "/timing/sectors",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "time": {
          "at": "/0/time"
        },
        "who": {
          "at": "/0/who"
        },
        "time-2": {
          "at": "/1/time"
        },
        "who-2": {
          "at": "/1/who"
        },
        "time-3": {
          "at": "/2/time"
        },
        "who-3": {
          "at": "/2/who"
        }
      }
    },
    "strategy": {
      "from": "timing",
      "path": "/timing/strategy",
      "time": "updatedAt",
      "fresh": 120,
      "fields": {
        "value": {},
        "lap": {},
        "laps": {}
      }
    },
    "laps": {
      "from": "timing",
      "path": "/timing/laps",
      "list": "/value",
      "fresh": 120,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "header": {
      "as": "element",
      "element": "header",
      "of": "race",
      "bind": {
        "race": "name",
        "circuit": "circuit",
        "lap": "lap",
        "laps": "laps",
        "flag": "flag",
        "flagText": "flagText",
        "air": "air",
        "track": "track"
      }
    },
    "tower": {
      "as": "element",
      "element": "tower",
      "of": "tower",
      "bind": {
        "cars": "value"
      }
    },
    "sector-1": {
      "as": "element",
      "element": "sector-best",
      "of": "sectors",
      "props": {
        "sector": "S1",
        "colour": "#b44dff"
      },
      "bind": {
        "time": "time",
        "who": "who"
      }
    },
    "sector-2": {
      "as": "element",
      "element": "sector-best",
      "of": "sectors",
      "props": {
        "sector": "S2",
        "colour": "#b44dff"
      },
      "bind": {
        "time": "time-2",
        "who": "who-2"
      }
    },
    "sector-3": {
      "as": "element",
      "element": "sector-best",
      "of": "sectors",
      "props": {
        "sector": "S3",
        "colour": "#b44dff"
      },
      "bind": {
        "time": "time-3",
        "who": "who-3"
      }
    },
    "strategy": {
      "as": "element",
      "element": "strategy",
      "of": "strategy",
      "bind": {
        "cars": "value",
        "lap": "lap",
        "laps": "laps"
      }
    },
    "laps": {
      "as": "chart.line",
      "of": "laps",
      "title": "LAP TIMES — 최근 12랩(초, 피트 랩 제외)",
      "x": "lap",
      "y": [
        "kim",
        "park"
      ],
      "valueAxisZero": false,
      "series": [
        {
          "label": "KIM",
          "color": "#e10600"
        },
        {
          "label": "PRK",
          "color": "#ffffff"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1920,
      1080
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221920%22%20height%3D%221080%22%20viewBox%3D%220%200%201920%201080%22%3E%0A%3Crect%20width%3D%221920%22%20height%3D%221080%22%20fill%3D%22%230b0b0d%22%2F%3E%0A%3Cpath%20d%3D%22M%20560%20110%20H%201890%20V%20696%20L%201866%20720%20H%20560%20Z%22%20fill%3D%22%23141418%22%2F%3E%0A%3Cpath%20d%3D%22M%201060%20640%20L%201420%20638%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2218%22%20stroke-opacity%3D%22.12%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%201200%20170%20L%201000%20236%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2218%22%20stroke-opacity%3D%22.12%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%201010%20640%20C%201066.7%20641.3%201168.3%20640.7%201240%20640%20C%201311.7%20639.3%201381.7%20640.7%201440%20636%20C%201498.3%20631.3%201546.7%20624.7%201590%20612%20C%201633.3%20599.3%201671.7%20582.0%201700%20560%20C%201728.3%20538.0%201748.3%20506.7%201760%20480%20C%201771.7%20453.3%201775.0%20425.0%201770%20400%20C%201765.0%20375.0%201750.0%20346.7%201730%20330%20C%201710.0%20313.3%201678.3%20301.7%201650%20300%20C%201621.7%20298.3%201585.0%20306.7%201560%20320%20C%201535.0%20333.3%201520.0%20363.3%201500%20380%20C%201480.0%20396.7%201463.3%20416.7%201440%20420%20C%201416.7%20423.3%201380.0%20415.0%201360%20400%20C%201340.0%20385.0%201323.3%20355.0%201320%20330%20C%201316.7%20305.0%201343.3%20273.3%201340%20250%20C%201336.7%20226.7%201323.3%20203.3%201300%20190%20C%201276.7%20176.7%201236.7%20170.0%201200%20170%20C%201163.3%20170.0%201115.0%20178.3%201080%20190%20C%201045.0%20201.7%201015.0%20221.7%20990%20240%20C%20965.0%20258.3%20951.7%20285.0%20930%20300%20C%20908.3%20315.0%20886.7%20325.0%20860%20330%20C%20833.3%20335.0%20796.7%20321.7%20770%20330%20C%20743.3%20338.3%20715.0%20358.3%20700%20380%20C%20685.0%20401.7%20676.7%20433.3%20680%20460%20C%20683.3%20486.7%20700.0%20516.7%20720%20540%20C%20740.0%20563.3%20770.0%20584.7%20800%20600%20C%20830.0%20615.3%20865.0%20625.3%20900%20632%20C%20935.0%20638.7%20953.3%20638.7%201010%20640%20Z%22%20fill%3D%22none%22%20stroke%3D%22%232c2c33%22%20stroke-width%3D%2222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%201010%20640%20C%201048.3%20640.0%201168.3%20640.7%201240%20640%20C%201311.7%20639.3%201381.7%20640.7%201440%20636%20C%201498.3%20631.3%201546.7%20624.7%201590%20612%20C%201633.3%20599.3%201671.7%20582.0%201700%20560%20C%201728.3%20538.0%201748.3%20506.7%201760%20480%20C%201771.7%20453.3%201775.0%20425.0%201770%20400%20C%201765.0%20375.0%201750.0%20346.7%201730%20330%20C%201710.0%20313.3%201678.3%20301.7%201650%20300%20C%201621.7%20298.3%201575.0%20316.7%201560%20320%22%20fill%3D%22none%22%20stroke%3D%22%23f2f2f2%22%20stroke-width%3D%227%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%221560%22%20cy%3D%22320%22%20r%3D%229%22%20fill%3D%22%230b0b0d%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%201560%20320%20C%201550.0%20330.0%201520.0%20363.3%201500%20380%20C%201480.0%20396.7%201463.3%20416.7%201440%20420%20C%201416.7%20423.3%201380.0%20415.0%201360%20400%20C%201340.0%20385.0%201323.3%20355.0%201320%20330%20C%201316.7%20305.0%201343.3%20273.3%201340%20250%20C%201336.7%20226.7%201323.3%20203.3%201300%20190%20C%201276.7%20176.7%201236.7%20170.0%201200%20170%20C%201163.3%20170.0%201115.0%20178.3%201080%20190%20C%201045.0%20201.7%201015.0%20221.7%20990%20240%20C%20965.0%20258.3%20940.0%20290.0%20930%20300%22%20fill%3D%22none%22%20stroke%3D%22%238c8c96%22%20stroke-width%3D%227%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%22930%22%20cy%3D%22300%22%20r%3D%229%22%20fill%3D%22%230b0b0d%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%223%22%2F%3E%3Cpath%20d%3D%22M%20930%20300%20C%20918.3%20305.0%20886.7%20325.0%20860%20330%20C%20833.3%20335.0%20796.7%20321.7%20770%20330%20C%20743.3%20338.3%20715.0%20358.3%20700%20380%20C%20685.0%20401.7%20676.7%20433.3%20680%20460%20C%20683.3%20486.7%20700.0%20516.7%20720%20540%20C%20740.0%20563.3%20770.0%20584.7%20800%20600%20C%20830.0%20615.3%20865.0%20625.3%20900%20632%20C%20935.0%20638.7%20991.7%20638.7%201010%20640%22%20fill%3D%22none%22%20stroke%3D%22%23f2f2f2%22%20stroke-width%3D%227%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20960%20668%20H%201300%22%20fill%3D%22none%22%20stroke%3D%22%236b6b6b%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%2210%208%22%2F%3E%0A%3Cpath%20d%3D%22M%201010%20622%20V%20658%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%225%22%2F%3E%0A%3Ctext%20x%3D%221018%22%20y%3D%22616%22%20fill%3D%22%23ffffff%22%20font-size%3D%2215%22%20font-style%3D%22italic%22%20font-weight%3D%22700%22%20font-family%3D'%22Arial%20Narrow%22%2C%20%22Roboto%20Condensed%22%2C%20%22Helvetica%20Neue%22%2C%20Arial%2C%20sans-serif'%3ESTART%20%2F%20FINISH%3C%2Ftext%3E%0A%3Ctext%20x%3D%221130%22%20y%3D%22690%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2214%22%20font-style%3D%22italic%22%20font-family%3D'%22Arial%20Narrow%22%2C%20%22Roboto%20Condensed%22%2C%20%22Helvetica%20Neue%22%2C%20Arial%2C%20sans-serif'%3EPIT%20LANE%3C%2Ftext%3E%0A%3Ctext%20x%3D%221240%22%20y%3D%22626%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-style%3D%22italic%22%20font-family%3D'%22Arial%20Narrow%22%2C%20%22Roboto%20Condensed%22%2C%20%22Helvetica%20Neue%22%2C%20Arial%2C%20sans-serif'%3EDRS%201%3C%2Ftext%3E%0A%3Ctext%20x%3D%221090%22%20y%3D%22168%22%20fill%3D%22%238a8a8a%22%20font-size%3D%2213%22%20font-style%3D%22italic%22%20font-family%3D'%22Arial%20Narrow%22%2C%20%22Roboto%20Condensed%22%2C%20%22Helvetica%20Neue%22%2C%20Arial%2C%20sans-serif'%3EDRS%202%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "header": [
        30,
        20,
        1860,
        70
      ],
      "tower": [
        30,
        110,
        500,
        940
      ],
      "sector-1": [
        1560,
        640,
        210,
        64
      ],
      "sector-2": [
        1110,
        214,
        210,
        64
      ],
      "sector-3": [
        590,
        380,
        210,
        64
      ],
      "strategy": [
        560,
        750,
        680,
        300
      ],
      "laps": [
        1260,
        750,
        630,
        300
      ]
    }
  }
};

export const racePitwall: SamplePack = {
  id: "race-pitwall",
  title: {
    "ko": "레이스 피트월 — 모터스포츠 중계 그래픽",
    "en": "A race team’s pit wall — in the style of race broadcast graphics"
  },
  field: {
    "ko": "모터스포츠",
    "en": "Motorsport"
  },
  kind: {
    "ko": "서킷 지도 + 타이밍 타워",
    "en": "A circuit map beside a timing tower"
  },
  domain: "leisure",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "그랑프리 중 팀 피트월 화면을 레이스 중계 그래픽처럼 — 검정 바탕, 흰 기울인 좁은 글자, 빨강 하나, 비스듬히 잘린 패널. 왼쪽 타이밍 타워(순위·간격·타이어와 사용 랩·지난 랩의 섹터 색 — 보라 세션 최고, 초록 개인 최고, 노랑 그 밖, 피트 중 표시, 우리 팀 두 대 강조), 오른쪽 서킷(세 섹터 색·피트 레인·DRS 구간)과 섹터마다 최고 기록 보유자, 아래 두 대의 타이어 전략(지난 스틴트·계획, 지금 랩 표시)과 랩 타임. 경기와 선수는 지어낸 것이라 예시 데이터입니다.",
    "en": "A race team’s pit-wall screen during a grand prix, drawn like race broadcast graphics — black, white condensed italic type, one red, panels cut on a slant. The timing tower on the left (position, interval, tyre and its age, last lap’s sectors coloured purple for the session’s best, green for a personal best, yellow otherwise, a pit flag, the team’s two cars marked); the circuit on the right (its three sectors in colour, the pit lane and the DRS zones) with who holds each sector’s best; below, the two cars’ tyre strategy (stints run and planned, the current lap marked) and their lap times. The race and drivers are made up. Example data."
  },
  connectors: [
    {
      "key": "timing",
      "name": "예시 레이스 타이밍 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 경기·선수가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
