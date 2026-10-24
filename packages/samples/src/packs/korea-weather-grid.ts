// The weather now in fourteen towns across Korea, from the national weather service's hourly observations on its
// forecast grid — drawn on that grid itself, the way a plotter draws: a lattice of points five kilometres apart,
// the grid numbers along the edges, and every town a dot at its own grid point with a card on a leader line. The
// source is asked for the data of a given hour (`base_date`, `base_time`), which it has out a few minutes after
// the hour; it issues each user a key, and says in its answer whether it served the request.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/korea-weather-grid.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#b8432f"
  },
  "elements": {
    "town": {
      "template": "<article class=\"tw p{{falling}}\"><header><b>{{name}}</b><i><em>{{rain}} mm</em></i></header><strong>{{temp | fixed:1}}<sup>℃</sup></strong><p><span>습도 {{humidity}}%</span><span>바람 {{wind | fixed:1}}m/s</span></p></article>",
      "style": ".tw{height:100%;box-sizing:border-box;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr;column-gap:10px;padding:6px 10px 6px 9px;background:#fffdf7;border:1.5px solid #23303a;border-left-width:6px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#23303a}\nheader{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;gap:6px}\nb{font-size:15px;white-space:nowrap}\nstrong{align-self:center;white-space:nowrap;font:700 26px/1 \"D2Coding\", \"Consolas\", \"Menlo\", monospace;letter-spacing:-1px}\nsup{font-size:12px;margin-left:1px;letter-spacing:0}\np{align-self:center;justify-self:end;margin:0;display:grid;gap:2px;text-align:right;font:11px \"D2Coding\", \"Consolas\", \"Menlo\", monospace;color:#4b5862;white-space:nowrap}\ni{font-style:normal;font:700 12px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;white-space:nowrap}\nem{display:none;margin-left:4px;font-style:normal;font:11px \"D2Coding\", \"Consolas\", \"Menlo\", monospace}\ni::before{content:'맑음·흐림';color:#8d846c;font-weight:400}\n.p1,.p5{border-left-color:#2f6fb5}.p1 i::before{content:'비';color:#2f6fb5}.p5 i::before{content:'빗방울';color:#2f6fb5}\n.p2,.p6{border-left-color:#6a5fb0}.p2 i::before{content:'비·눈';color:#6a5fb0}.p6 i::before{content:'빗방울·눈날림';color:#6a5fb0}\n.p3,.p7{border-left-color:#8fa8c0}.p3 i::before{content:'눈';color:#5d7f9e}.p7 i::before{content:'눈날림';color:#5d7f9e}\n.p1 em,.p2 em,.p3 em,.p5 em,.p6 em,.p7 em{display:inline}",
      "props": {
        "name": "string",
        "temp": "string",
        "humidity": "string",
        "wind": "string",
        "rain": "string",
        "falling": "string"
      }
    },
    "title": {
      "template": "<header class=\"tb\"><small>KMA · ULTRA-SHORT OBSERVATION</small><h1>지금, 전국 열네 곳</h1><p>기상청 초단기실황 — 정시 관측을 몇 분 뒤에 냅니다(15분 뒤에 묻습니다). 동네예보 격자(5 km) 위에 도시마다 시청이 든 격자점.</p></header>",
      "style": ".tb{height:100%;box-sizing:border-box;padding:16px 18px;background:#23303a;color:#f3efe4;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;display:grid;align-content:center;gap:6px}\nsmall{font:11px \"D2Coding\", \"Consolas\", \"Menlo\", monospace;letter-spacing:2px;color:#c9c2ae}\nh1{margin:0;font-size:26px}\np{margin:0;font-size:12.5px;line-height:1.5;color:#e4dfd0}"
    },
    "legend": {
      "template": "<section class=\"lg\"><h2>읽는 법</h2><dl><div><dt class=\"c0\"></dt><dd>내리는 것 없음</dd></div><div><dt class=\"c1\"></dt><dd>비 · 빗방울</dd></div><div><dt class=\"c2\"></dt><dd>비·눈 · 빗방울·눈날림</dd></div><div><dt class=\"c3\"></dt><dd>눈 · 눈날림</dd></div></dl><p>큰 숫자는 기온, 옆은 습도와 풍속. 비나 눈이 오면 낱말 옆에 지난 한 시간 강수량(mm)이 붙습니다. 점 옆의 숫자는 격자 번호(nx,ny).</p></section>",
      "style": ".lg{height:100%;box-sizing:border-box;padding:14px 18px;background:#fffdf7;border:1.5px solid #23303a;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#23303a}\nh2{margin:0 0 8px;font-size:15px}\ndl{margin:0;display:grid;gap:6px}\ndl div{display:flex;align-items:center;gap:10px;font-size:13px}\ndt{width:22px;height:14px;border:1.5px solid #23303a;border-left-width:6px;background:#fffdf7}\ndd{margin:0}\n.c1{border-left-color:#2f6fb5}.c2{border-left-color:#6a5fb0}.c3{border-left-color:#8fa8c0}\np{margin:10px 0 0;font-size:12px;line-height:1.5;color:#4b5862}"
    }
  },
  "data": {
    "getUltraSrtNcst": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=20&ny=135",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-2": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=60&ny=127",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-3": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=55&ny=124",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-4": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=73&ny=134",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-5": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=92&ny=132",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-6": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=127&ny=127",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-7": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=69&ny=107",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-8": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=67&ny=100",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-9": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=91&ny=106",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-10": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=63&ny=89",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-11": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=89&ny=91",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-12": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=58&ny=74",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-13": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=98&ny=76",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    },
    "getUltraSrtNcst-14": {
      "from": "kma-now",
      "path": "/getUltraSrtNcst?pageNo=1&numOfRows=10&dataType=JSON&base_date={{now:yyyyMMdd}}&base_time={{now:HHmm}}&nx=53&ny=38",
      "list": "/response/body/items/item",
      "pivot": {
        "key": "category",
        "value": "obsrValue"
      },
      "zone": "Asia/Seoul",
      "fresh": 5400,
      "now": {
        "delay": 900,
        "step": 3600
      },
      "fields": {
        "T1H": {},
        "REH": {},
        "WSD": {},
        "RN1": {},
        "PTY": {}
      }
    }
  },
  "parts": {
    "town-baengnyeong": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst",
      "props": {
        "name": "백령도"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-seoul": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-2",
      "props": {
        "name": "서울"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-incheon": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-3",
      "props": {
        "name": "인천"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-chuncheon": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-4",
      "props": {
        "name": "춘천"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-gangneung": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-5",
      "props": {
        "name": "강릉"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-ulleung": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-6",
      "props": {
        "name": "울릉도"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-cheongju": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-7",
      "props": {
        "name": "청주"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-daejeon": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-8",
      "props": {
        "name": "대전"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-andong": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-9",
      "props": {
        "name": "안동"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-jeonju": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-10",
      "props": {
        "name": "전주"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-daegu": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-11",
      "props": {
        "name": "대구"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-gwangju": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-12",
      "props": {
        "name": "광주"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-busan": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-13",
      "props": {
        "name": "부산"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "town-jeju": {
      "as": "element",
      "element": "town",
      "of": "getUltraSrtNcst-14",
      "props": {
        "name": "제주"
      },
      "bind": {
        "temp": "T1H",
        "humidity": "REH",
        "wind": "WSD",
        "rain": "RN1",
        "falling": "PTY"
      }
    },
    "title": {
      "as": "element",
      "element": "title"
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
      1010
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221010%22%20viewBox%3D%220%200%201600%201010%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221010%22%20fill%3D%22%23f3efe4%22%2F%3E%0A%3Crect%20x%3D%2250%22%20y%3D%2250%22%20width%3D%221100%22%20height%3D%22910%22%20fill%3D%22none%22%20stroke%3D%22%238d846c%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Ccircle%20cx%3D%2260%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22852%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22627%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22402%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22177%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22150%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22195%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22240%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22285%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22330%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22852%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22627%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22402%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22177%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22375%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22510%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22555%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22852%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22627%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22402%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22177%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22600%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22645%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22690%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22735%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22780%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22852%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22627%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22402%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22177%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22825%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22870%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22915%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%22960%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221005%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22852%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22627%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22402%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22177%22%20r%3D%222%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221050%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22987%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22942%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22897%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22852%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22807%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22762%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22717%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22672%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22627%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22582%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22537%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22492%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22447%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22402%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22357%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22312%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22267%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22222%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22177%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%22132%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%3Ccircle%20cx%3D%221095%22%20cy%3D%2287%22%20r%3D%221%22%20fill%3D%22%23c9c2ae%22%2F%3E%0A%3Cpath%20d%3D%22M150%2040%20v%2010%20M150%20960%20v%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%22150%22%20y%3D%2234%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22middle%22%3Enx%2025%3C%2Ftext%3E%3Cpath%20d%3D%22M375%2040%20v%2010%20M375%20960%20v%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%22375%22%20y%3D%2234%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22middle%22%3Enx%2050%3C%2Ftext%3E%3Cpath%20d%3D%22M600%2040%20v%2010%20M600%20960%20v%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%22600%22%20y%3D%2234%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22middle%22%3Enx%2075%3C%2Ftext%3E%3Cpath%20d%3D%22M825%2040%20v%2010%20M825%20960%20v%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%22825%22%20y%3D%2234%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22middle%22%3Enx%20100%3C%2Ftext%3E%3Cpath%20d%3D%22M1050%2040%20v%2010%20M1050%20960%20v%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%221050%22%20y%3D%2234%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22middle%22%3Enx%20125%3C%2Ftext%3E%3Cpath%20d%3D%22M40%20852%20h%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%2236%22%20y%3D%22856%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E50%3C%2Ftext%3E%3Cpath%20d%3D%22M40%20627%20h%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%2236%22%20y%3D%22631%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E75%3C%2Ftext%3E%3Cpath%20d%3D%22M40%20402%20h%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%2236%22%20y%3D%22406%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E100%3C%2Ftext%3E%3Cpath%20d%3D%22M40%20177%20h%2010%22%20stroke%3D%22%238d846c%22%2F%3E%3Ctext%20x%3D%2236%22%20y%3D%22181%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E125%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M105%2087%20L%20125%2087%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22105%22%20cy%3D%2287%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22105%22%20cy%3D%2287%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%2297%22%20y%3D%2278%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E20%2C135%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M465%20159%20L%20460%20159%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22465%22%20cy%3D%22159%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22465%22%20cy%3D%22159%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22473%22%20y%3D%22176%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E60%2C127%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M420%20186%20L%20400%20192%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22420%22%20cy%3D%22186%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22420%22%20cy%3D%22186%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22428%22%20y%3D%22177%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E55%2C124%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M582%2096%20L%20604%2096%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22582%22%20cy%3D%2296%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22582%22%20cy%3D%2296%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22574%22%20y%3D%22113%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E73%2C134%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M753%20114%20L%20784%20122%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22753%22%20cy%3D%22114%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22753%22%20cy%3D%22114%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22745%22%20y%3D%22105%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E92%2C132%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M1068%20159%20L%201068%20196%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%221068%22%20cy%3D%22159%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%221068%22%20cy%3D%22159%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%221076%22%20y%3D%22150%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E127%2C127%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M546%20339%20L%20572%20326%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22546%22%20cy%3D%22339%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22546%22%20cy%3D%22339%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22538%22%20y%3D%22356%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E69%2C107%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M528%20402%20L%20490%20402%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22528%22%20cy%3D%22402%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22528%22%20cy%3D%22402%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22536%22%20y%3D%22393%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E67%2C100%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M744%20348%20L%20776%20348%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22744%22%20cy%3D%22348%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22744%22%20cy%3D%22348%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22736%22%20y%3D%22365%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E91%2C106%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M492%20501%20L%20460%20501%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22492%22%20cy%3D%22501%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22492%22%20cy%3D%22501%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22500%22%20y%3D%22492%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E63%2C89%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M726%20483%20L%20764%20483%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22726%22%20cy%3D%22483%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22726%22%20cy%3D%22483%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22718%22%20y%3D%22500%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E89%2C91%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M447%20636%20L%20410%20636%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22447%22%20cy%3D%22636%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22447%22%20cy%3D%22636%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22455%22%20y%3D%22627%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22start%22%3E58%2C74%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M807%20618%20L%20842%20618%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22807%22%20cy%3D%22618%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22807%22%20cy%3D%22618%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22799%22%20y%3D%22609%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E98%2C76%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M402%20960%20L%20440%20960%22%20stroke%3D%22%2323303a%22%20stroke-width%3D%221%22%20stroke-dasharray%3D%222%203%22%2F%3E%0A%3Ccircle%20cx%3D%22402%22%20cy%3D%22960%22%20r%3D%225%22%20fill%3D%22%23f3efe4%22%20stroke%3D%22%23b8432f%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%22402%22%20cy%3D%22960%22%20r%3D%221.6%22%20fill%3D%22%23b8432f%22%2F%3E%0A%3Ctext%20x%3D%22394%22%20y%3D%22977%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2210%22%20fill%3D%22%238d846c%22%20text-anchor%3D%22end%22%3E53%2C38%3C%2Ftext%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%22990%22%20font-family%3D%22D2Coding%2C%20Consolas%2C%20Menlo%2C%20monospace%22%20font-size%3D%2212%22%20fill%3D%22%238d846c%22%3E%EA%B8%B0%EC%83%81%EC%B2%AD%20%EB%8F%99%EB%84%A4%EC%98%88%EB%B3%B4%20%EA%B2%A9%EC%9E%90%20%E2%80%94%20%EC%A0%90%20%ED%95%98%EB%82%98%EA%B0%80%205%20km%2C%20%EA%B5%B5%EC%9D%80%20%EC%A0%90%EC%9D%80%2025%EC%B9%B8%EB%A7%88%EB%8B%A4%20%C2%B7%20%ED%95%B4%EC%95%88%EC%84%A0%EC%9D%80%20%EA%B7%B8%EB%A6%AC%EC%A7%80%20%EC%95%8A%EC%9D%8C%20%C2%B7%20%EC%9C%84%EA%B0%80%20%EB%B6%81%EC%AA%BD%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "town-baengnyeong": [
        125,
        60,
        160,
        76
      ],
      "town-seoul": [
        300,
        92,
        160,
        76
      ],
      "town-incheon": [
        240,
        192,
        160,
        76
      ],
      "town-chuncheon": [
        604,
        24,
        160,
        76
      ],
      "town-gangneung": [
        784,
        122,
        160,
        76
      ],
      "town-ulleung": [
        980,
        196,
        160,
        76
      ],
      "town-cheongju": [
        572,
        250,
        160,
        76
      ],
      "town-daejeon": [
        330,
        380,
        160,
        76
      ],
      "town-andong": [
        776,
        300,
        160,
        76
      ],
      "town-jeonju": [
        300,
        490,
        160,
        76
      ],
      "town-daegu": [
        764,
        430,
        160,
        76
      ],
      "town-gwangju": [
        250,
        620,
        160,
        76
      ],
      "town-busan": [
        842,
        600,
        160,
        76
      ],
      "town-jeju": [
        440,
        900,
        160,
        76
      ],
      "title": [
        1230,
        50,
        330,
        170
      ],
      "legend": [
        1230,
        240,
        330,
        230
      ]
    }
  }
};

export const koreaWeatherGrid: SamplePack = {
  id: "korea-weather-grid",
  title: {
    "ko": "전국 열네 곳 지금 날씨 — 예보 격자 도면",
    "en": "The weather now in fourteen towns — on the forecast grid"
  },
  field: {
    "ko": "기상",
    "en": "Weather"
  },
  kind: {
    "ko": "격자 도면",
    "en": "Grid plot"
  },
  domain: "environment",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "기상청 초단기실황으로 전국 열네 곳의 지금 기온·습도·풍속과 내리는 것(비·눈)을, 기상청 동네예보 격자 자체 위에 — 5 km마다 찍은 점, 가장자리의 격자 번호, 도시마다 시청이 든 격자점에 점과 지시선으로 이은 카드. 원천은 «몇 시의 자료»로 묻는 API라 요청 경로에 시각 자리(`{{now:yyyyMMdd}}`)를 쓰고, 정시 관측이 몇 분 뒤에 나오므로 15분이 지난 뒤에 그 정시를 묻습니다. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.",
    "en": "The temperature, humidity, wind and anything falling in fourteen Korean towns now, from the weather service’s hourly observations — drawn on its forecast grid itself: a point every 5 km, the grid numbers along the edges, and every town a dot at the grid point of its city hall with a card on a leader line. The source is asked for the data of a given hour, so the request path carries time places (`{{now:yyyyMMdd}}`), and since an hour is out a few minutes after it, it asks for an hour a quarter of an hour on. The source issues each user a key, so creating it in an installation needs one."
  },
  connectors: [
    {
      "key": "kma-now",
      "name": "기상청 단기예보 조회서비스",
      "baseUrl": "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0",
      "authType": "query",
      "authParamName": "serviceKey",
      "ownKey": {
        "signUpUrl": "https://www.data.go.kr/data/15084084/openapi.do",
        "env": "DATA_GO_KR_KEY",
        "hint": "공공데이터포털에서 «기상청_단기예보 조회서비스»를 활용신청하고, 일반 인증키(Decoding)를 넣습니다."
      },
      "sourceError": {
        "path": "/response/header/resultCode",
        "ok": [
          "00"
        ],
        "messagePath": "/response/header/resultMsg"
      },
      "attribution": {
        "text": "기상청 초단기실황 (공공데이터포털)",
        "url": "https://www.kma.go.kr"
      }
    }
  ],
  board,
  snapshot,
};
