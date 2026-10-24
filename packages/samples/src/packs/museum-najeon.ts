// A craft museum's storage rooms drawn as lacquerware inlaid with mother-of-pearl (najeon): every room a black lacquer
// box framed in pearl — its collection, temperature and relative humidity large, a pearl gauge with the room's allowed
// humidity band and a marker where the air is now — and its state in a character, a word and the frame: 安 steady
// (a solid pearl frame), 注 watch (dashed), 離 out of band (vermilion lacquer, the traditional red), 檢 being checked
// (dotted, dimmed). On the right the painting store's humidity over the last day against its band, and the day's log.
// The museum and its rooms are made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/museum-najeon.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#d9c9a3"
  },
  "elements": {
    "banner": {
      "template": "<header class=\"bn\"><h1>달빛 공예박물관 수장고</h1><p>보존 환경 · {{n.date}} {{n.time}}</p><ul><li>安 안정</li><li class=\"w\">注 주의</li><li class=\"a\">離 이탈</li><li class=\"c\">檢 점검</li></ul></header>",
      "style": ".bn{height:100%;display:flex;align-items:baseline;gap:20px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#efe7d6}\nh1{margin:0;white-space:nowrap;font:700 32px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;letter-spacing:.04em;background:linear-gradient(135deg, #e9d2f4, #bfe8dc 26%, #f4c9da 50%, #c4d8f6 74%, #efe3c4);-webkit-background-clip:text;background-clip:text;color:transparent}\np{margin:0;white-space:nowrap;font-size:14px;color:#a99f8c}\nul{margin:0 0 0 auto;padding:0;list-style:none;display:flex;gap:8px}\nli{white-space:nowrap;font-size:13px;font-weight:700;padding:1px 8px;border:1.5px solid #efe7d6;border-radius:3px}\n.w{border-style:dashed}.a{background:#b8352a;border-color:#b8352a;color:#fff}.c{border-style:dotted;color:#a99f8c}",
      "props": {
        "n": "object"
      }
    },
    "room": {
      "template": "<article class=\"bx {{r.state}}\"><header><h2>{{r.name}}</h2><small>{{r.items}}</small></header><div class=\"vals\"><p><b>{{r.temp}}</b><span>℃</span></p><p><b>{{r.rh}}</b><span>%RH</span></p></div><div class=\"gauge\" style=\"--v: {{r.rh}}; --lo: {{r.lo}}; --hi: {{r.hi}}\"><div class=\"band\"></div><div class=\"mark\"></div></div><p class=\"std\">기준 {{r.tband}}℃ · {{r.rhband}}%</p><p class=\"word\"><i></i>{{r.word}}</p><p class=\"note\">{{r.note}}</p></article>",
      "style": ".bx{position:relative;height:100%;box-sizing:border-box;padding:18px 18px 14px;border:6px solid transparent;border-radius:6px;background:linear-gradient(160deg, #1f1714, #120d0b) padding-box, linear-gradient(135deg, #e9d2f4, #bfe8dc 26%, #f4c9da 50%, #c4d8f6 74%, #efe3c4) border-box;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#efe7d6;display:grid;grid-template-rows:auto auto auto auto 1fr auto;gap:8px}\nheader{border-bottom:1px solid #a99f8c;padding-bottom:6px}\nh2{margin:0;font:700 28px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;letter-spacing:.06em}\nsmall{font-size:12px;color:#a99f8c}\n.vals{display:flex;justify-content:space-between;align-items:baseline}\n.vals p{margin:0}\n.vals b{font:800 50px \"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;letter-spacing:-1px}\n.vals span{font-size:13px;color:#a99f8c;margin-left:2px}\n.gauge{position:relative;margin-top:6px;height:16px;border-radius:8px;background:#2b211d;box-shadow:inset 0 0 0 1px #3a2e28}\n.band{position:absolute;top:0;bottom:0;min-width:10px;left:calc((var(--lo) - 20) * 100% / 60);width:calc((var(--hi) - var(--lo)) * 100% / 60);border-radius:7px;background:linear-gradient(135deg, #e9d2f4, #bfe8dc 26%, #f4c9da 50%, #c4d8f6 74%, #efe3c4);opacity:.85}\n.mark{position:absolute;top:-5px;width:4px;height:24px;margin-left:-2px;left:calc((var(--v) - 20) * 100% / 60);background:#efe7d6;box-shadow:0 0 0 2px #120d0b}\n.std{margin:0;font-size:12px;color:#a99f8c}\n.word{margin:0;align-self:end;justify-self:start;display:flex;align-items:center;gap:8px;padding:3px 14px;border:2px solid #efe7d6;border-radius:3px;font-size:16px;font-weight:800}\ni{font:700 20px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;font-style:normal}\n.note{margin:0;font-size:12px;line-height:1.45;color:#a99f8c}\n.ok i::before{content:\"安\"}.warn i::before{content:\"注\"}.alarm i::before{content:\"離\"}.check i::before{content:\"檢\"}\n.warn .word{border-style:dashed}\n.alarm{background:linear-gradient(160deg, #1f1714, #120d0b) padding-box, linear-gradient(135deg, #b8352a, #e0705f 50%, #b8352a) border-box}\n.alarm .word{background:#b8352a;border-color:#b8352a;color:#fff}\n.alarm .mark{background:#b8352a;box-shadow:0 0 0 2px #efe7d6}\n.check .word{border-style:dotted}.check .vals,.check .gauge{opacity:.6}",
      "props": {
        "r": "object"
      }
    },
    "log": {
      "template": "<section class=\"lg\"><h2>오늘의 수장고 일지</h2><ol>{{#items}}<li class=\"{{state}}\"><time>{{time}}</time><b>{{room}}</b><span>{{what}}</span><em>{{word}}</em></li>{{/items}}</ol></section>",
      "style": ".lg{height:100%;box-sizing:border-box;padding:6px 10px;font-family:\"Pretendard\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;color:#efe7d6}\nh2{margin:0 0 12px;font:700 24px \"Nanum Myeongjo\", \"Batang\", \"AppleMyungjo\", serif;letter-spacing:.06em}\nol{margin:0;padding:0;list-style:none;display:grid;gap:6px}\nli{display:grid;grid-template-columns:48px 52px 1fr 70px;gap:8px;align-items:baseline;font-size:13px;line-height:34px;border-bottom:1px solid #3a2e28}\ntime{color:#a99f8c;font-variant-numeric:tabular-nums}\nem{font-style:normal;font-weight:800;text-align:center;border:1.5px solid #efe7d6;border-radius:3px;line-height:22px}\nli.alarm em{background:#b8352a;border-color:#b8352a;color:#fff}\nli.doing em{border-style:dashed}\nli.done{color:#a99f8c}li.done em{border-color:#a99f8c}\nli.todo em{border-style:dotted}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "now": {
      "from": "museum",
      "path": "/museum/now",
      "time": "updatedAt",
      "fresh": 1200,
      "fields": {
        "value": {}
      }
    },
    "rooms": {
      "from": "museum",
      "path": "/museum/rooms",
      "time": "updatedAt",
      "fresh": 1200,
      "fields": {
        "seohwa": {
          "at": "/value/seohwa"
        },
        "jikmul": {
          "at": "/value/jikmul"
        },
        "mokchil": {
          "at": "/value/mokchil"
        },
        "dojagi": {
          "at": "/value/dojagi"
        },
        "geumsok": {
          "at": "/value/geumsok"
        },
        "gogo": {
          "at": "/value/gogo"
        }
      }
    },
    "humidity": {
      "from": "museum",
      "path": "/museum/humidity",
      "list": "/value",
      "fresh": 1200,
      "answerTime": "/updatedAt"
    },
    "log": {
      "from": "museum",
      "path": "/museum/log",
      "time": "updatedAt",
      "fresh": 1200,
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
    "room-seohwa": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "seohwa"
      }
    },
    "room-jikmul": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "jikmul"
      }
    },
    "room-mokchil": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "mokchil"
      }
    },
    "room-dojagi": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "dojagi"
      }
    },
    "room-geumsok": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "geumsok"
      }
    },
    "room-gogo": {
      "as": "element",
      "element": "room",
      "of": "rooms",
      "bind": {
        "r": "gogo"
      }
    },
    "humidity": {
      "as": "chart.line",
      "of": "humidity",
      "title": "서화 수장고 상대습도 — 지난 24시간 (%)",
      "x": "hour",
      "y": [
        "rh",
        "high",
        "low"
      ],
      "series": [
        {
          "label": "습도",
          "color": "#e9dfc6"
        },
        {
          "label": "상한",
          "color": "#b8352a"
        },
        {
          "label": "하한",
          "color": "#7fa59f"
        }
      ],
      "echarts": {
        "yAxis": {
          "min": 40,
          "max": 65
        }
      }
    },
    "log": {
      "as": "element",
      "element": "log",
      "of": "log",
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22shell%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23e9d2f4%22%2F%3E%3Cstop%20offset%3D%22.3%22%20stop-color%3D%22%23bfe8dc%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%23f4c9da%22%2F%3E%3Cstop%20offset%3D%22.8%22%20stop-color%3D%22%23c4d8f6%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23efe3c4%22%2F%3E%3C%2FlinearGradient%3E%0A%3CradialGradient%20id%3D%22sheen%22%20cx%3D%22.35%22%20cy%3D%22.25%22%20r%3D%22.9%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%231f1714%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23120d0b%22%2F%3E%3C%2FradialGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23sheen)%22%2F%3E%0A%3Cg%20transform%3D%22translate(40%20985)%20scale(1%201)%22%20fill%3D%22none%22%20stroke%3D%22url(%23shell)%22%20stroke-width%3D%223%22%20opacity%3D%22.8%22%3E%3Cpath%20d%3D%22M0%200%20C%2060%20-40%2C%20120%2040%2C%20180%200%20S%20300%20-40%2C%20360%200%20S%20480%2040%2C%20540%200%22%2F%3E%3Cpath%20d%3D%22M90%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M270%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M450%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(1000%20985)%20scale(-1%201)%22%20fill%3D%22none%22%20stroke%3D%22url(%23shell)%22%20stroke-width%3D%223%22%20opacity%3D%22.8%22%3E%3Cpath%20d%3D%22M0%200%20C%2060%20-40%2C%20120%2040%2C%20180%200%20S%20300%20-40%2C%20360%200%20S%20480%2040%2C%20540%200%22%2F%3E%3Cpath%20d%3D%22M90%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M270%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3Cpath%20d%3D%22M450%20-14%20c%2010%20-22%2C%2034%20-22%2C%2030%20-2%20c%20-6%2014%2C%20-24%2012%2C%20-30%202%22%20fill%3D%22url(%23shell)%22%20stroke%3D%22none%22%2F%3E%3C%2Fg%3E%0A%3Cg%20transform%3D%22translate(30%20520)%22%20fill%3D%22url(%23shell)%22%20opacity%3D%22.75%22%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(0)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(30)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(60)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(90)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(120)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(150)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(180)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(210)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(240)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(270)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(300)%22%2F%3E%3Cellipse%20rx%3D%223.96%22%20ry%3D%229%22%20cy%3D%22-9.9%22%20transform%3D%22rotate(330)%22%2F%3E%3Ccircle%20r%3D%223.2399999999999998%22%20fill%3D%22%23120d0b%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(985%20945)%22%20fill%3D%22url(%23shell)%22%20opacity%3D%22.75%22%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(0)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(30)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(60)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(90)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(120)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(150)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(180)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(210)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(240)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(270)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(300)%22%2F%3E%3Cellipse%20rx%3D%223.08%22%20ry%3D%227%22%20cy%3D%22-7.700000000000001%22%20transform%3D%22rotate(330)%22%2F%3E%3Ccircle%20r%3D%222.52%22%20fill%3D%22%23120d0b%22%2F%3E%3C%2Fg%3E%0A%3Crect%20x%3D%221010%22%20y%3D%2230%22%20width%3D%22560%22%20height%3D%22940%22%20rx%3D%224%22%20fill%3D%22%231f1714%22%20stroke%3D%22url(%23shell)%22%20stroke-width%3D%223%22%2F%3E%0A%3Crect%20x%3D%221022%22%20y%3D%2242%22%20width%3D%22536%22%20height%3D%22916%22%20rx%3D%222%22%20fill%3D%22none%22%20stroke%3D%22url(%23shell)%22%20stroke-width%3D%221%22%20opacity%3D%22.7%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "banner": [
        60,
        24,
        900,
        80
      ],
      "room-seohwa": [
        60,
        120,
        280,
        380
      ],
      "room-jikmul": [
        370,
        120,
        280,
        380
      ],
      "room-mokchil": [
        680,
        120,
        280,
        380
      ],
      "room-dojagi": [
        60,
        530,
        280,
        380
      ],
      "room-geumsok": [
        370,
        530,
        280,
        380
      ],
      "room-gogo": [
        680,
        530,
        280,
        380
      ],
      "humidity": [
        1040,
        56,
        500,
        440
      ],
      "log": [
        1030,
        540,
        520,
        400
      ]
    }
  }
};

export const museumNajeon: SamplePack = {
  id: "museum-najeon",
  title: {
    "ko": "박물관 수장고 보존 환경 — 나전칠기",
    "en": "A museum’s storage rooms — lacquer inlaid with mother-of-pearl"
  },
  field: {
    "ko": "문화재 보존·수장고",
    "en": "Collections care and storage"
  },
  kind: {
    "ko": "수장고별 온습도",
    "en": "Temperature and humidity by room"
  },
  domain: "leisure",
  styles: [
    "korean",
    "craft"
  ],
  summary: {
    "ko": "공예박물관의 수장고 여섯을 나전칠기로 — 방마다 자개 테를 두른 검은 옻칠 함 하나: 소장품, 큰 온도와 상대습도, 자개 눈금자 위에 그 방이 허용하는 습도 띠와 지금 공기의 자리, 그리고 상태가 글자·낱말·테로 — 安 안정(자개 실선), 注 주의(점선), 離 이탈(주칠 빨강), 檢 점검(점점선·흐리게). 오른쪽에 서화 수장고의 지난 24시간 습도와 기준 띠, 오늘의 수장고 일지. 박물관과 수장고는 지어낸 것이라 예시 데이터입니다.",
    "en": "A craft museum’s six storage rooms drawn as lacquerware inlaid with mother-of-pearl — a black lacquer box framed in shell for every room: its collection, temperature and relative humidity large, a pearl gauge with the humidity band the room allows and a marker where the air is now, and its state in a character, a word and the frame — 安 steady (a solid pearl frame), 注 watch (dashed), 離 out of band (vermilion lacquer), 檢 being checked (dotted, dimmed). On the right the painting store’s humidity over the last day against its band, and the day’s log of movements and checks. The museum and its rooms are made up. Example data."
  },
  connectors: [
    {
      "key": "museum",
      "name": "예시 박물관 수장고 환경 감시 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 박물관·수장고가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
