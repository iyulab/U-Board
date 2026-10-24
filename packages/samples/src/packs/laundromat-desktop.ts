// A coin laundry watched on a nineties desktop: a teal desktop with its icons, grey bevelled windows with navy title bars,
// sunken panels, block progress bars and a taskbar along the bottom. One window holds the washers, one the dryers, each
// machine a raised tile with its door, its state and the minutes left as a segmented bar; beside them a properties
// window with the shop's figures, a window with the uses by the hour, and a message box about the broken dryer. A
// machine's state is told by an icon as well as a colour — a play mark running, a tick done and waiting to be emptied,
// an empty door free, a cross out of order. The shop is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/laundromat-desktop.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#000080"
  },
  "elements": {
    "machines": {
      "template": "<section class=\"w\"><div class=\"bar\"><span>{{title}}</span><s></s><u></u></div><ol class=\"ms\" style=\"--c: {{columns}}\">{{#items}}<li class=\"{{state}}\" style=\"--p: {{p}}\"><header><b>{{no}}</b><i></i></header><em></em><p>{{word}}</p><div class=\"pg\"><span></span></div><small>{{left}}</small></li>{{/items}}</ol></section>",
      "style": ".w{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;padding:3px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font-family:\"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;color:#000000}\n.bar{display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#ffffff;font-size:15px;font-weight:700}\n.bar span{flex:1}\n.bar u{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;color:#000000;display:grid;place-items:center;font-size:12px;font-weight:900}\n.bar u::after{content:\"✕\"}\n.bar s{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;display:grid;place-items:end center;color:#000000;font-size:11px;font-weight:900;line-height:12px}\n.bar s::after{content:\"_\"}\n.ms{margin:6px 0 0;padding:12px;list-style:none;display:grid;grid-template-columns:repeat(var(--c),1fr);gap:12px;background:#c0c0c0;box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf;overflow:hidden}\nli{display:grid;grid-template-rows:auto 1fr auto auto auto;justify-items:center;gap:4px;padding:8px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf}\nheader{justify-self:stretch;display:flex;align-items:center;justify-content:space-between}\nb{font-size:17px}\ni{width:20px;height:20px;display:grid;place-items:center;font:900 14px \"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;font-style:normal;color:#ffffff}\nem{width:62px;height:62px;border-radius:50%;background:#d8e8f0;box-shadow:inset 0 0 0 5px #808080,inset 0 0 0 7px #000000;align-self:center}\np{margin:0;font-size:15px;font-weight:700}\n.pg{justify-self:stretch;height:16px;padding:2px;background:#ffffff;box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf}\n.pg span{display:block;height:100%;width:calc(var(--p) * 1%);background:repeating-linear-gradient(90deg,#000080 0 9px,transparent 9px 11px)}\nsmall{font-size:13px}\n.run i{background:#000080}\n.run i::after{content:\"▶\"}\n.run em{background:radial-gradient(circle,#7fb8e0 0 40%,#4a8fc4 41% 60%,#d8e8f0 61%)}\n.done i{background:#008000}\n.done i::after{content:\"✓\"}\n.done p{color:#008000}\n.done em{background:radial-gradient(circle,#e8e2d0 0 55%,#d8e8f0 56%)}\n.free i{background:#ffffff;box-shadow:inset 0 0 0 2px #808080}\n.free p{color:#808080}\n.out{background:repeating-linear-gradient(45deg,#c0c0c0 0 8px,#b0b0b0 8px 10px)}\n.out i{background:#c00000}\n.out i::after{content:\"✕\"}\n.out p{color:#c00000}\n.out em{opacity:.45}",
      "props": {
        "title": "string",
        "columns": "number",
        "items": "list"
      }
    },
    "shop": {
      "template": "<section class=\"w\"><div class=\"bar\"><span>매장 정보</span><s></s><u></u></div><div class=\"bd\"><h1>{{s.name}}</h1><p>{{s.date}} · {{s.hours}}</p><div class=\"fs\"><b>지금</b><dl>{{#items}}<dt>{{label}}</dt><dd>{{value}}</dd>{{/items}}</dl></div></div></section>",
      "style": ".w{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;padding:3px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font-family:\"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;color:#000000}\n.bar{display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#ffffff;font-size:15px;font-weight:700}\n.bar span{flex:1}\n.bar u{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;color:#000000;display:grid;place-items:center;font-size:12px;font-weight:900}\n.bar u::after{content:\"✕\"}\n.bar s{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;display:grid;place-items:end center;color:#000000;font-size:11px;font-weight:900;line-height:12px}\n.bar s::after{content:\"_\"}\n.bd{display:grid;align-content:start;gap:6px;padding:12px 16px}\nh1{margin:0;font-size:28px;font-weight:700}\np{margin:0;font-size:15px}\n.fs{position:relative;margin:10px 0 0;border:none;box-shadow:inset 1px 1px 0 #808080,inset -1px -1px 0 #ffffff,inset 2px 2px 0 #ffffff,inset -2px -2px 0 #808080;padding:10px 14px}\n.fs b{position:absolute;top:-9px;left:10px;padding:0 4px;background:#c0c0c0;font-size:14px;font-weight:400}\ndl{margin:0;display:grid;grid-template-columns:1fr auto;row-gap:6px;font-size:16px}\ndd{margin:0;font-weight:700;padding:1px 8px;background:#ffffff;box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf;text-align:right;min-width:90px}",
      "props": {
        "s": "object",
        "items": "list"
      }
    },
    "uses": {
      "template": "<section class=\"w\"><div class=\"bar\"><span>{{title}}</span><s></s><u></u></div><ol class=\"well\" style=\"--max: {{max}}\">{{#items}}<li style=\"--v: {{uses}}\"><div><i></i><b>{{uses}}</b></div><small>{{hour}}</small></li>{{/items}}</ol></section>",
      "style": ".w{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;padding:3px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font-family:\"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;color:#000000}\n.bar{display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#ffffff;font-size:15px;font-weight:700}\n.bar span{flex:1}\n.bar u{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;color:#000000;display:grid;place-items:center;font-size:12px;font-weight:900}\n.bar u::after{content:\"✕\"}\n.bar s{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;display:grid;place-items:end center;color:#000000;font-size:11px;font-weight:900;line-height:12px}\n.bar s::after{content:\"_\"}\n.well{margin:6px 0 0;padding:14px 12px 8px;list-style:none;background:#ffffff;box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;column-gap:4px}\nli{display:grid;grid-template-rows:1fr auto}\ndiv{position:relative;background:repeating-linear-gradient(to top,#d8d8d8 0 1px,transparent 1px 20%)}\ni{position:absolute;bottom:0;left:16%;right:16%;height:calc(var(--v) / var(--max) * 100%);background:repeating-linear-gradient(to top,#000080 0 9px,#3434b0 9px 11px)}\nb{position:absolute;left:0;right:0;bottom:calc(var(--v) / var(--max) * 100% + 2px);text-align:center;font-size:13px}\nsmall{padding-top:4px;text-align:center;font-size:12px}",
      "props": {
        "title": "string",
        "max": "number",
        "items": "list"
      }
    },
    "message": {
      "template": "<section class=\"w\"><div class=\"bar\"><span>{{m.title}}</span><u></u></div><div class=\"bd\"><i>!</i><p>{{m.text}}</p><span class=\"ok\">확인</span></div></section>",
      "style": ".w{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;padding:3px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font-family:\"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;color:#000000}\n.bar{display:flex;align-items:center;gap:6px;height:26px;padding:0 4px 0 6px;background:linear-gradient(90deg,#000080,#1084d0);color:#ffffff;font-size:15px;font-weight:700}\n.bar span{flex:1}\n.bar u{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;color:#000000;display:grid;place-items:center;font-size:12px;font-weight:900}\n.bar u::after{content:\"✕\"}\n.bar s{width:20px;height:18px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;text-decoration:none;display:grid;place-items:end center;color:#000000;font-size:11px;font-weight:900;line-height:12px}\n.bar s::after{content:\"_\"}\n.bd{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:0 16px}\ni{width:36px;height:36px;display:grid;place-items:center;background:#ffcc00;clip-path:polygon(50% 0,100% 100%,0 100%);font:900 20px \"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;font-style:normal;padding-top:8px;box-sizing:border-box}\np{margin:0;font-size:16px;line-height:1.4}\n.ok{font:15px \"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;padding:4px 22px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;outline:1px dotted #000000;outline-offset:-5px}",
      "props": {
        "m": "object"
      }
    },
    "taskbar": {
      "template": "<footer class=\"tb\"><b>⊞ 시작</b><span>세탁기</span><span>건조기</span><span>매장 정보</span><span>시간대별 이용</span><time>{{time}}</time></footer>",
      "style": ".tb{height:100%;box-sizing:border-box;display:flex;align-items:center;gap:6px;padding:4px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font:14px \"Tahoma\", \"Dotum\", \"Gulim\", \"Malgun Gothic\", sans-serif;color:#000000}\nb{padding:4px 12px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf;font-weight:700}\nspan{padding:4px 14px;width:150px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #000000,inset 1px 1px 0 #ffffff,inset -2px -2px 0 #808080,inset 2px 2px 0 #dfdfdf}\nspan:first-of-type{box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf;background:repeating-conic-gradient(#c0c0c0 0 25%,#dcdcdc 0 50%) 0 0/2px 2px}\ntime{margin-left:auto;padding:4px 14px;box-shadow:inset 1px 1px 0 #808080,inset 2px 2px 0 #000000,inset -1px -1px 0 #ffffff,inset -2px -2px 0 #dfdfdf}",
      "props": {
        "time": "string"
      }
    }
  },
  "data": {
    "washers": {
      "from": "shop",
      "path": "/shop/washers",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "dryers": {
      "from": "shop",
      "path": "/shop/dryers",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "shop",
      "path": "/shop/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "shop": {},
        "value": {}
      }
    },
    "hours": {
      "from": "shop",
      "path": "/shop/hours",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "message": {
      "from": "shop",
      "path": "/shop/message",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "now": {
      "from": "shop",
      "path": "/shop/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "time": {}
      }
    }
  },
  "parts": {
    "washers": {
      "as": "element",
      "element": "machines",
      "of": "washers",
      "props": {
        "title": "세탁기 — 8대",
        "columns": 4
      },
      "bind": {
        "items": "value"
      }
    },
    "dryers": {
      "as": "element",
      "element": "machines",
      "of": "dryers",
      "props": {
        "title": "건조기 — 6대",
        "columns": 3
      },
      "bind": {
        "items": "value"
      }
    },
    "shop": {
      "as": "element",
      "element": "shop",
      "of": "figures",
      "bind": {
        "s": "shop",
        "items": "value"
      }
    },
    "uses": {
      "as": "element",
      "element": "uses",
      "of": "hours",
      "props": {
        "title": "시간대별 이용(회) — 19시는 40분까지",
        "max": 10
      },
      "bind": {
        "items": "value"
      }
    },
    "message": {
      "as": "element",
      "element": "message",
      "of": "message",
      "bind": {
        "m": "value"
      }
    },
    "taskbar": {
      "as": "element",
      "element": "taskbar",
      "of": "now",
      "bind": {
        "time": "time"
      }
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1600,
      1000
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23008080%22%2F%3E%0A%3Cg%20transform%3D%22translate(22%2030)%22%3E%3Crect%20x%3D%228%22%20y%3D%224%22%20width%3D%2240%22%20height%3D%2244%22%20fill%3D%22%23c0c0c0%22%20stroke%3D%22%23000000%22%2F%3E%3Ccircle%20cx%3D%2228%22%20cy%3D%2230%22%20r%3D%2212%22%20fill%3D%22%239fd3f0%22%20stroke%3D%22%23000000%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%228%22%20width%3D%2214%22%20height%3D%225%22%20fill%3D%22%23808080%22%2F%3E%3Ctext%20x%3D%2228%22%20y%3D%2266%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-size%3D%2213%22%20font-family%3D'%22Tahoma%22%2C%20%22Dotum%22%2C%20%22Gulim%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EC%84%B8%ED%83%81%EC%8B%A4%3C%2Ftext%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(22%20120)%22%3E%3Cpath%20d%3D%22M6%2014%20h18%20l4%205%20h22%20v28%20h-44%20z%22%20fill%3D%22%23f4d35e%22%20stroke%3D%22%23000000%22%2F%3E%3Ctext%20x%3D%2228%22%20y%3D%2266%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-size%3D%2213%22%20font-family%3D'%22Tahoma%22%2C%20%22Dotum%22%2C%20%22Gulim%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%EC%98%81%EC%88%98%EC%A6%9D%3C%2Ftext%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(22%20210)%22%3E%3Cpath%20d%3D%22M14%2012%20h28%20l-3%2036%20h-22%20z%22%20fill%3D%22%23c0c0c0%22%20stroke%3D%22%23000000%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%227%22%20width%3D%2234%22%20height%3D%225%22%20fill%3D%22%23808080%22%20stroke%3D%22%23000000%22%2F%3E%3Ctext%20x%3D%2228%22%20y%3D%2266%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-size%3D%2213%22%20font-family%3D'%22Tahoma%22%2C%20%22Dotum%22%2C%20%22Gulim%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%3E%ED%9C%B4%EC%A7%80%ED%86%B5%3C%2Ftext%3E%3C%2Fg%3E%0A%3C%2Fsvg%3E",
    "place": {
      "washers": [
        110,
        24,
        860,
        448
      ],
      "dryers": [
        110,
        490,
        860,
        448
      ],
      "shop": [
        1000,
        24,
        560,
        250
      ],
      "uses": [
        1000,
        290,
        560,
        500
      ],
      "message": [
        1000,
        808,
        560,
        130
      ],
      "taskbar": [
        0,
        960,
        1600,
        40
      ]
    }
  }
};

export const laundromatDesktop: SamplePack = {
  id: "laundromat-desktop",
  title: {
    "ko": "코인빨래방 저녁 — 90년대 데스크톱",
    "en": "A coin laundry’s evening — a nineties desktop"
  },
  field: {
    "ko": "생활 서비스·무인 매장",
    "en": "Self-service shops"
  },
  kind: {
    "ko": "세탁기·건조기 상태와 남은 시간",
    "en": "Washers and dryers, their states and minutes left"
  },
  domain: "services",
  styles: [
    "retro"
  ],
  summary: {
    "ko": "코인빨래방을 90년대 데스크톱 화면으로 — 청록 바탕화면과 아이콘, 남색 제목 표시줄의 회색 입체 창, 움푹한 칸, 블록 진행 막대, 아래 작업 표시줄. 한 창에 세탁기, 한 창에 건조기 — 기계마다 문과 상태, 남은 시간을 칸칸이 차는 막대로. 옆에는 매장 정보 창, 시간대별 이용 창, 고장 난 건조기를 알리는 메시지 상자. 상태는 색과 함께 아이콘으로: ▶ 작동 중, ✓ 끝남(꺼내 주세요), 빈 칸 사용 가능, ✕ 고장 — 고장 난 기계는 빗금. 빨래방은 지어낸 것이라 예시 데이터입니다.",
    "en": "A coin laundry watched on a nineties desktop — a teal desktop with its icons, grey bevelled windows under navy title bars, sunken wells, block progress bars and a taskbar along the bottom. One window holds the washers and one the dryers, each machine with its door, its state and the minutes left as a segmented bar; beside them the shop’s properties, the uses by the hour, and a message box about the broken dryer. A machine tells its state with an icon as well as a colour — ▶ running, ✓ done and waiting to be emptied, an empty box free, ✕ out of order, hatched. The shop is made up. Example data."
  },
  connectors: [
    {
      "key": "shop",
      "name": "예시 빨래방 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 빨래방이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
