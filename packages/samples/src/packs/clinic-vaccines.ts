// A health centre's vaccination line drawn in Art Nouveau: ivory paper, olive, gold, burgundy and a sea green, whiplash
// curves and climbing stems, arched frames with a gold rule, a medallion at the centre and an engraved serif. The four
// stages a visitor walks through — reception, screening, vaccination and observation — stand as arched panels along an
// S-shaped path, and the curves between them carry how many are waiting. Inside each panel every room shows what it is
// doing, the state told by a sign as well as a colour: a filled dot working, a ring free, two bars paused. On the right
// the vaccines in stock, one leaf for each level — three plenty, two some, one running low — the day's figures and the
// vaccinations by the hour. The centre is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/clinic-vaccines.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#7a2a34"
  },
  "elements": {
    "stage": {
      "template": "<section class=\"sg\"><h3>{{s.name}}</h3><p>{{s.note}}</p><ul>{{#s.rooms}}<li class=\"{{st}}\"><i></i><b>{{n}}</b><span>{{who}}</span></li>{{/s.rooms}}</ul></section>",
      "style": ".sg{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto auto 1fr;justify-items:center;gap:4px;padding:26px 24px 16px;background:#fbf6ea;border:3px solid #b38b2d;border-radius:170px 170px 18px 18px;box-shadow:inset 0 0 0 6px #fbf6ea,inset 0 0 0 7.5px #b38b2d;font-family:\"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#2e2a22}\nh3{margin:0;font-size:34px;font-weight:700;color:#7a2a34;letter-spacing:.3em;padding-left:.3em}\np{margin:0;font-size:14px;font-style:italic;color:#5f6b34}\nul{margin:4px 0 0;padding:0;list-style:none;align-self:center;display:grid;gap:6px;width:100%}\nli{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;padding:4px 10px;border-bottom:1px solid rgba(179,139,45,.5);font-size:17px}\nb{font-weight:700}\nspan{font-size:15px}\ni{width:14px;height:14px;box-sizing:border-box;border-radius:50%}\n.on i{background:#3f6b5e}\n.free i{border:2px solid #3f6b5e}\n.free span{color:#3f6b5e}\n.pause i{border-radius:0;width:12px;border-left:4px solid #7a2a34;border-right:4px solid #7a2a34}\n.pause span{color:#7a2a34;font-style:italic}",
      "props": {
        "s": "object"
      }
    },
    "medallion": {
      "template": "<div class=\"md\"><small>지금 접종</small><b>{{now}}</b><span>다음 {{next}}번</span></div>",
      "style": ".md{height:100%;box-sizing:border-box;display:grid;place-content:center;justify-items:center;gap:2px;border-radius:50%;background:#7a2a34;color:#f4ecd8;border:4px double #b38b2d;font-family:\"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif}\nsmall{font-size:15px;font-style:italic;letter-spacing:.1em}\nb{font-size:56px;font-weight:700;line-height:1}\nspan{font-size:15px}",
      "props": {
        "now": "string",
        "next": "string"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li class=\"on\"><i></i>진행 중</li><li class=\"free\"><i></i>비어 있음</li><li class=\"pause\"><i></i>잠시 멈춤</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0;list-style:none;display:flex;justify-content:center;align-items:center;gap:22px;font:italic 15px \"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#2e2a22}\nli{display:flex;align-items:center;gap:6px}\ni{width:12px;height:12px;box-sizing:border-box;border-radius:50%}\n.on i{background:#3f6b5e}\n.free i{border:2px solid #3f6b5e}\n.pause i{border-radius:0;width:10px;border-left:3px solid #7a2a34;border-right:3px solid #7a2a34}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:6px;font-family:\"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#2e2a22;text-align:center}\nh1{margin:0;font-size:44px;font-weight:700;color:#7a2a34;letter-spacing:.12em}\np{margin:0;font-size:16px;font-style:italic;color:#5f6b34}\ndiv{display:flex;align-items:baseline;gap:18px;padding-top:8px;border-top:2px solid #b38b2d;width:80%;justify-content:center}\nspan{font-size:17px}\nb{font-size:36px;font-weight:700;color:#3f6b5e}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "stock": {
      "template": "<section class=\"sk\"><h3>백신 재고</h3><ul>{{#items}}<li class=\"{{level}}\"><b>{{name}}</b><i style=\"--n: {{leaves}}\"></i><span>{{word}}</span></li>{{/items}}</ul></section>",
      "style": ".sk{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:\"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#2e2a22}\nh3{margin:0;text-align:center;font-size:24px;font-weight:700;color:#7a2a34;letter-spacing:.2em;border-bottom:2px solid #b38b2d;padding-bottom:4px}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}\nli{display:grid;grid-template-columns:1fr 72px 120px;align-items:center;gap:8px;font-size:17px}\nb{font-weight:700}\ni{height:22px;width:calc(var(--n) * 22px);background:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2222%22%20height%3D%2222%22%20viewBox%3D%220%200%2022%2022%22%3E%3Cpath%20d%3D%22M%203%2019%20C%203%209%2C%2010%203%2C%2019%203%20C%2019%2012%2C%2013%2019%2C%203%2019%20Z%22%20fill%3D%22%235f6b34%22%2F%3E%3Cpath%20d%3D%22M%204%2018%20C%209%2013%2C%2013%209%2C%2017%205%22%20fill%3D%22none%22%20stroke%3D%22%23f4ecd8%22%20stroke-width%3D%221.2%22%2F%3E%3C%2Fsvg%3E\") repeat-x 0 0/22px 22px}\nspan{font-size:14px;text-align:right}\n.low span{color:#7a2a34;font-weight:700}\n.low b{color:#7a2a34}",
      "props": {
        "items": "list"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Cormorant Garamond\", \"Noto Serif KR\", \"Nanum Myeongjo\", \"Batang\", serif;color:#2e2a22}\ndiv{display:grid;justify-items:center;align-content:center;text-align:center;padding:12px 6px 8px;background:#fbf6ea;border:2px solid #b38b2d;border-radius:60px 60px 10px 10px}\ndt{font-size:14px;font-style:italic;color:#5f6b34}\ndd{margin:0;font-size:32px;font-weight:700;color:#3f6b5e}\nsmall{font-size:11px}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "stages": {
      "from": "clinic",
      "path": "/clinic/stages",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "reception": {
          "at": "/value/reception"
        },
        "screening": {
          "at": "/value/screening"
        },
        "injection": {
          "at": "/value/injection"
        },
        "observation": {
          "at": "/value/observation"
        }
      }
    },
    "serving": {
      "from": "clinic",
      "path": "/clinic/serving",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "now": {
          "at": "/value/now"
        },
        "next": {
          "at": "/value/next"
        }
      }
    },
    "now": {
      "from": "clinic",
      "path": "/clinic/now",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "stock": {
      "from": "clinic",
      "path": "/clinic/stock",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "clinic",
      "path": "/clinic/figures",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "clinic",
      "path": "/clinic/hours",
      "list": "/value",
      "fresh": 600,
      "answerTime": "/updatedAt"
    },
    "queues": {
      "from": "clinic",
      "path": "/clinic/queues",
      "time": "updatedAt",
      "fresh": 600,
      "fields": {
        "q1": {
          "at": "/value/q1"
        },
        "q2": {
          "at": "/value/q2"
        },
        "q3": {
          "at": "/value/q3"
        }
      }
    }
  },
  "parts": {
    "stage-reception": {
      "as": "element",
      "element": "stage",
      "of": "stages",
      "bind": {
        "s": "reception"
      }
    },
    "stage-screening": {
      "as": "element",
      "element": "stage",
      "of": "stages",
      "bind": {
        "s": "screening"
      }
    },
    "stage-injection": {
      "as": "element",
      "element": "stage",
      "of": "stages",
      "bind": {
        "s": "injection"
      }
    },
    "stage-observation": {
      "as": "element",
      "element": "stage",
      "of": "stages",
      "bind": {
        "s": "observation"
      }
    },
    "medallion": {
      "as": "element",
      "element": "medallion",
      "of": "serving",
      "bind": {
        "now": "now",
        "next": "next"
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
    "stock": {
      "as": "element",
      "element": "stock",
      "of": "stock",
      "bind": {
        "items": "value"
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
    "hours": {
      "as": "chart.bar",
      "of": "hours",
      "title": "시간대별 접종(명) — 14시는 20분까지",
      "x": "hour",
      "y": "people",
      "series": [
        {
          "label": "접종",
          "color": "#3f6b5e"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3CradialGradient%20id%3D%22glow%22%20cx%3D%22.5%22%20cy%3D%22.5%22%20r%3D%22.6%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%23fbf5e6%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23f4ecd8%22%2F%3E%3C%2FradialGradient%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22url(%23glow)%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20rx%3D%2240%22%20fill%3D%22none%22%20stroke%3D%22%23b38b2d%22%20stroke-width%3D%224%22%2F%3E%0A%3Crect%20x%3D%2252%22%20y%3D%2252%22%20width%3D%221016%22%20height%3D%22896%22%20rx%3D%2232%22%20fill%3D%22none%22%20stroke%3D%22%23b38b2d%22%20stroke-width%3D%221.2%22%2F%3E%0A%3Cpath%20d%3D%22M%2060%20940%20C%2072%20840%2C%2054%20760%2C%2064%20660%20S%2054%20480%2C%2064%20380%22%20fill%3D%22none%22%20stroke%3D%22%235f6b34%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%201062%2070%20C%201050%20160%2C%201072%20240%2C%201058%20340%20S%201070%20520%2C%201056%20620%22%20fill%3D%22none%22%20stroke%3D%22%235f6b34%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Cpath%20transform%3D%22translate(62%20760)%20rotate(-70)%22%20d%3D%22M%200%200%20C%206%20-14%2C%2022%20-16%2C%2030%20-10%20C%2022%20-2%2C%2010%202%2C%200%200%20Z%22%20fill%3D%22%235f6b34%22%20fill-opacity%3D%22.85%22%2F%3E%3Cpath%20transform%3D%22translate(60%20560)%20rotate(-110)%22%20d%3D%22M%200%200%20C%206%20-14%2C%2022%20-16%2C%2030%20-10%20C%2022%20-2%2C%2010%202%2C%200%200%20Z%22%20fill%3D%22%235f6b34%22%20fill-opacity%3D%22.85%22%2F%3E%3Cpath%20transform%3D%22translate(1062%20240)%20rotate(110)%22%20d%3D%22M%200%200%20C%206%20-14%2C%2022%20-16%2C%2030%20-10%20C%2022%20-2%2C%2010%202%2C%200%200%20Z%22%20fill%3D%22%235f6b34%22%20fill-opacity%3D%22.85%22%2F%3E%3Cpath%20transform%3D%22translate(1060%20450)%20rotate(70)%22%20d%3D%22M%200%200%20C%206%20-14%2C%2022%20-16%2C%2030%20-10%20C%2022%20-2%2C%2010%202%2C%200%200%20Z%22%20fill%3D%22%235f6b34%22%20fill-opacity%3D%22.85%22%2F%3E%0A%3Ccircle%20cx%3D%2264%22%20cy%3D%22380%22%20r%3D%2210%22%20fill%3D%22%237a2a34%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%22380%22%20r%3D%224.5%22%20fill%3D%22%23f4ecd8%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%221056%22%20cy%3D%22620%22%20r%3D%2210%22%20fill%3D%22%237a2a34%22%2F%3E%3Ccircle%20cx%3D%221056%22%20cy%3D%22620%22%20r%3D%224.5%22%20fill%3D%22%23f4ecd8%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%22662%22%20r%3D%227%22%20fill%3D%22%23b38b2d%22%2F%3E%3Ccircle%20cx%3D%2264%22%20cy%3D%22662%22%20r%3D%223.15%22%20fill%3D%22%23f4ecd8%22%20fill-opacity%3D%22.7%22%2F%3E%3Ccircle%20cx%3D%221058%22%20cy%3D%22338%22%20r%3D%227%22%20fill%3D%22%23b38b2d%22%2F%3E%3Ccircle%20cx%3D%221058%22%20cy%3D%22338%22%20r%3D%223.15%22%20fill%3D%22%23f4ecd8%22%20fill-opacity%3D%22.7%22%2F%3E%0A%3Cpath%20d%3D%22M%20560%20380%20C%20640%20380%2C%20680%20420%2C%20680%20500%20C%20680%20580%2C%20640%20620%2C%20560%20620%20C%20480%20620%2C%20440%20580%2C%20440%20500%20C%20440%20420%2C%20480%20380%2C%20560%20380%20Z%22%20fill%3D%22none%22%20stroke%3D%22%23b38b2d%22%20stroke-width%3D%222.5%22%2F%3E%0A%3Cpath%20d%3D%22M%20440%20500%20C%20380%20500%2C%20360%20450%2C%20320%20460%20M%20680%20500%20C%20740%20500%2C%20760%20550%2C%20800%20540%22%20fill%3D%22none%22%20stroke%3D%22%23b38b2d%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%22560%22%20y%3D%2278%22%20text-anchor%3D%22middle%22%20fill%3D%22%237a2a34%22%20font-size%3D%2220%22%20font-family%3D'%22Cormorant%20Garamond%22%2C%20%22Noto%20Serif%20KR%22%2C%20%22Nanum%20Myeongjo%22%2C%20%22Batang%22%2C%20serif'%20font-style%3D%22italic%22%20letter-spacing%3D%22.2em%22%3E%EC%A0%91%EC%88%98%20%C2%B7%20%EC%98%88%EC%A7%84%20%C2%B7%20%EC%A0%91%EC%A2%85%20%C2%B7%20%EA%B4%80%EC%B0%B0%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "stage-reception": [
        80,
        110,
        340,
        250
      ],
      "stage-screening": [
        700,
        110,
        340,
        250
      ],
      "stage-injection": [
        700,
        640,
        340,
        250
      ],
      "stage-observation": [
        80,
        640,
        340,
        250
      ],
      "medallion": [
        460,
        400,
        200,
        200
      ],
      "legend": [
        380,
        912,
        360,
        30
      ],
      "title": [
        1120,
        30,
        460,
        180
      ],
      "stock": [
        1120,
        230,
        460,
        190
      ],
      "figures": [
        1120,
        440,
        460,
        120
      ],
      "hours": [
        1120,
        590,
        460,
        370
      ]
    },
    "links": {
      "queue-q1": {
        "from": "stage-reception",
        "to": "stage-screening",
        "label": "{{q1}}",
        "tone": "warn",
        "of": "queues",
        "width": 4,
        "arrow": "end",
        "route": "curved"
      },
      "queue-q2": {
        "from": "stage-screening",
        "to": "stage-injection",
        "label": "{{q2}}",
        "tone": "warn",
        "of": "queues",
        "width": 4,
        "arrow": "end",
        "route": "curved"
      },
      "queue-q3": {
        "from": "stage-injection",
        "to": "stage-observation",
        "label": "{{q3}}",
        "tone": "warn",
        "of": "queues",
        "width": 4,
        "arrow": "end",
        "route": "curved"
      }
    }
  }
};

export const clinicVaccines: SamplePack = {
  id: "clinic-vaccines",
  title: {
    "ko": "보건소 예방접종 — 아르누보",
    "en": "A health centre’s vaccination line — Art Nouveau"
  },
  field: {
    "ko": "보건·예방접종",
    "en": "Public health & vaccination"
  },
  kind: {
    "ko": "접수부터 관찰까지의 흐름과 백신 재고",
    "en": "The line from reception to observation and the vaccines in stock"
  },
  domain: "health",
  styles: [
    "art"
  ],
  summary: {
    "ko": "보건소 예방접종 현황을 아르누보로 — 상아색 종이에 올리브·금·버건디·청록, 채찍처럼 휘는 곡선과 덩굴, 금줄을 두른 아치 액자, 가운데 원형 메달, 새긴 듯한 세리프. 방문객이 거치는 접수·예진·접종·관찰 네 단계가 S자 길을 따라 아치 판으로 서고, 그 사이 곡선이 대기 인원을 실어 나릅니다. 판 안의 방마다 무엇을 하는지 색과 함께 기호로: 채운 점 진행 중, 빈 원 비어 있음, 두 막대 잠시 멈춤. 가운데 메달은 지금 접종 번호와 다음 번호. 오른쪽에 백신 재고(잎 셋 충분 · 둘 보통 · 하나 부족), 오늘 접종·평균 소요·관찰 중, 시간대별 접종. 보건소는 지어낸 것이라 예시 데이터입니다.",
    "en": "A health centre’s vaccination line in Art Nouveau — ivory paper with olive, gold, burgundy and sea green, whiplash curves and climbing stems, arched frames with a gold rule, a medallion at the centre and an engraved serif. The four stages a visitor walks through — reception, screening, vaccination and observation — stand as arched panels along an S-shaped path, the curves between them carrying how many are waiting. In each panel every room says what it is doing with a sign as well as a colour: a filled dot working, a ring free, two bars paused. The medallion shows the number being vaccinated and the next. On the right the vaccines in stock (three leaves plenty, two some, one running low), the day’s vaccinations, the average visit and the people under observation, and the vaccinations by the hour. The centre is made up. Example data."
  },
  connectors: [
    {
      "key": "clinic",
      "name": "예시 보건소 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 보건소가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
