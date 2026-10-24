// A by-election's counting hall drawn as a brutalist web page: raw grey floor, thick black rules, a monospace face, one
// highlighter yellow for what is moving and red for what has stopped. The hall's plan shows where a ballot box goes —
// received at the desk, opened at a sorter, checked at a review table, published by the commission — with every station
// a box saying how many ballot boxes it has done and the flow between them as arrows; the arrow out of a stopped sorter
// turns red. Beside it the count's stages, each district's progress as a bar of blocks, and the count over the evening.
// It carries no candidate's or party's figures — only how far the count has come. The city and its election are made
// up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/count-hall.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#000000"
  },
  "statuses": {
    "stop": {
      "tone": "alarm",
      "emphasis": "hatch"
    },
    "idle-blink": {
      "tone": "next",
      "emphasis": "blink"
    }
  },
  "elements": {
    "station": {
      "template": "<section class=\"st {{s.state}}\"><header><b>{{s.name}}</b><span>{{s.word}}</span></header><strong>{{s.count}}</strong><small>{{s.sub}}</small></section>",
      "style": ".st{height:100%;box-sizing:border-box;display:grid;align-content:space-between;padding:6px 8px;background:#fff;border:3px solid #000000;font-family:\"IBM Plex Mono\", \"D2Coding\", \"JetBrains Mono\", Consolas, \"Courier New\", monospace;color:#000000}\nheader{display:flex;justify-content:space-between;align-items:baseline;gap:6px}\nb{font-size:15px;font-weight:700;text-decoration:underline}\nspan{font-size:13px;font-weight:700;padding:0 4px;border:2px solid #000000}\n.run span{background:#ffe500}\n.done span{background:#000000;color:#fff}\n.stop{border-color:#e5141b;outline:3px solid #e5141b}\n.stop span{background:#e5141b;color:#fff;border-color:#e5141b}\nstrong{font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}\nsmall{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "props": {
        "s": "object"
      }
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p class=\"r\">개표율 <mark>{{rate}}</mark></p><p>{{date}} {{time}} 기준 · 후보별 득표는 싣지 않음</p></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:\"IBM Plex Mono\", \"D2Coding\", \"JetBrains Mono\", Consolas, \"Courier New\", monospace;color:#000000}\nh1{margin:0;font-size:24px;font-weight:700;text-decoration:underline;text-underline-offset:4px}\n.r{margin:0;font-size:22px;font-weight:700}\nmark{background:#ffe500;color:#000000;font-size:52px;padding:0 6px}\np{margin:0;font-size:14px}",
      "props": {
        "name": "string",
        "rate": "string",
        "date": "string",
        "time": "string"
      }
    },
    "bars": {
      "template": "<section class=\"br\"><h3>{{heading}}</h3><table>{{#items}}<tr><th>{{label}}</th><td><i class=\"b{{tenth}}\"></i></td><td class=\"v\">{{value}}</td></tr>{{/items}}</table></section>",
      "style": ".br{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:6px;font-family:\"IBM Plex Mono\", \"D2Coding\", \"JetBrains Mono\", Consolas, \"Courier New\", monospace;color:#000000}\nh3{margin:0;font-size:16px;font-weight:700;padding:2px 6px;background:#000000;color:#fff;justify-self:start}\ntable{width:100%;border-collapse:collapse;align-self:start}\nth{text-align:left;font-size:14px;width:56px;padding:3px 0}\ntd{padding:3px 0;border-bottom:1px solid #000000}\ntd.v{text-align:right;font-size:14px;font-weight:700;width:100px;font-variant-numeric:tabular-nums}\ni{display:block;height:14px;border:2px solid #000000;background:repeating-linear-gradient(90deg,#000000 0 9px,transparent 9px 12px) 0 0/var(--w,0%) 100% no-repeat}\n.b0{--w:0%}.b1{--w:10%}.b2{--w:20%}.b3{--w:30%}.b4{--w:40%}.b5{--w:50%}.b6{--w:60%}.b7{--w:70%}.b8{--w:80%}.b9{--w:90%}.b10{--w:100%}",
      "props": {
        "heading": "string",
        "items": "list"
      }
    }
  },
  "data": {
    "stations": {
      "from": "count",
      "path": "/count/stations",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "desk": {
          "at": "/value/desk"
        },
        "s1": {
          "at": "/value/s1"
        },
        "s2": {
          "at": "/value/s2"
        },
        "s3": {
          "at": "/value/s3"
        },
        "s4": {
          "at": "/value/s4"
        },
        "s5": {
          "at": "/value/s5"
        },
        "s6": {
          "at": "/value/s6"
        },
        "t1": {
          "at": "/value/t1"
        },
        "t2": {
          "at": "/value/t2"
        },
        "t3": {
          "at": "/value/t3"
        },
        "t4": {
          "at": "/value/t4"
        },
        "t5": {
          "at": "/value/t5"
        },
        "t6": {
          "at": "/value/t6"
        },
        "board": {
          "at": "/value/board"
        },
        "state": {
          "at": "/value/s1/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        },
        "state-2": {
          "at": "/value/s2/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        },
        "state-3": {
          "at": "/value/s3/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        },
        "state-4": {
          "at": "/value/s4/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        },
        "state-5": {
          "at": "/value/s5/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        },
        "state-6": {
          "at": "/value/s6/state",
          "state": {
            "stop": "stop",
            "idle": "idle-blink",
            "*": "next"
          }
        }
      }
    },
    "now": {
      "from": "count",
      "path": "/count/now",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "name": {},
        "rate": {},
        "date": {},
        "time": {}
      }
    },
    "stages": {
      "from": "count",
      "path": "/count/stages",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "districts": {
      "from": "count",
      "path": "/count/districts",
      "time": "updatedAt",
      "fresh": 900,
      "fields": {
        "value": {}
      }
    },
    "progress": {
      "from": "count",
      "path": "/count/progress",
      "list": "/value",
      "fresh": 900,
      "answerTime": "/updatedAt"
    }
  },
  "parts": {
    "desk": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "desk"
      }
    },
    "s1": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s1"
      }
    },
    "s2": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s2"
      }
    },
    "s3": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s3"
      }
    },
    "s4": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s4"
      }
    },
    "s5": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s5"
      }
    },
    "s6": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s6"
      }
    },
    "t1": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t1"
      }
    },
    "t2": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t2"
      }
    },
    "t3": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t3"
      }
    },
    "t4": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t4"
      }
    },
    "t5": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t5"
      }
    },
    "t6": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "t6"
      }
    },
    "board": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "board"
      }
    },
    "title": {
      "as": "element",
      "element": "title",
      "of": "now",
      "bind": {
        "name": "name",
        "rate": "rate",
        "date": "date",
        "time": "time"
      }
    },
    "stages": {
      "as": "element",
      "element": "bars",
      "of": "stages",
      "props": {
        "heading": "단계별 투표함"
      },
      "bind": {
        "items": "value"
      }
    },
    "districts": {
      "as": "element",
      "element": "bars",
      "of": "districts",
      "props": {
        "heading": "동별 개표율"
      },
      "bind": {
        "items": "value"
      }
    },
    "progress": {
      "as": "chart.line",
      "of": "progress",
      "title": "개표율(%) — 20분마다",
      "x": "time",
      "y": "rate",
      "series": [
        {
          "label": "개표율",
          "color": "#000000"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Cdefs%3E%0A%3Cpattern%20id%3D%22tiles%22%20width%3D%2240%22%20height%3D%2240%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2040%200%20H%200%20V%2040%22%20fill%3D%22none%22%20stroke%3D%22%23c4c4c0%22%20stroke-width%3D%221%22%2F%3E%3C%2Fpattern%3E%0A%3Cmarker%20id%3D%22head%22%20viewBox%3D%220%200%2010%2010%22%20refX%3D%229%22%20refY%3D%225%22%20markerWidth%3D%225%22%20markerHeight%3D%225%22%20orient%3D%22auto%22%3E%3Cpath%20d%3D%22M%200%200%20L%2010%205%20L%200%2010%20Z%22%20fill%3D%22%23000000%22%2F%3E%3C%2Fmarker%3E%0A%3Cpattern%20id%3D%22hatch%22%20width%3D%2212%22%20height%3D%2212%22%20patternUnits%3D%22userSpaceOnUse%22%20patternTransform%3D%22rotate(45)%22%3E%3Crect%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%23fff%22%2F%3E%3Cline%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%2212%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%2F%3E%3C%2Fpattern%3E%0A%3C%2Fdefs%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fff%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221030%22%20height%3D%22920%22%20fill%3D%22%23d9d9d6%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221030%22%20height%3D%22920%22%20fill%3D%22url(%23tiles)%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%2040%20H%201070%20V%20960%20H%20640%20M%20470%20960%20H%2040%20Z%22%20fill%3D%22none%22%20stroke%3D%22%23000000%22%20stroke-width%3D%228%22%2F%3E%0A%3Ctext%20x%3D%22478%22%20y%3D%22950%22%20fill%3D%22%23000000%22%20font-size%3D%2217%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%EC%B6%9C%EC%9E%85%20%C2%B7%20%ED%88%AC%ED%91%9C%ED%95%A8%20%EB%B0%98%EC%9E%85%20%E2%86%91%3C%2Ftext%3E%0A%3Crect%20x%3D%2260%22%20y%3D%22760%22%20width%3D%22300%22%20height%3D%22160%22%20fill%3D%22url(%23hatch)%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%2272%22%20y%3D%22790%22%20fill%3D%22%23000000%22%20font-size%3D%2218%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%5B%EC%B0%B8%EA%B4%80%EC%9D%B8%EC%84%9D%5D%3C%2Ftext%3E%3Crect%20x%3D%22750%22%20y%3D%22760%22%20width%3D%22300%22%20height%3D%22160%22%20fill%3D%22url(%23hatch)%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%2F%3E%3Ctext%20x%3D%22762%22%20y%3D%22790%22%20fill%3D%22%23000000%22%20font-size%3D%2218%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%5B%EC%B0%B8%EA%B4%80%EC%9D%B8%EC%84%9D%5D%3C%2Ftext%3E%0A%3Cpath%20d%3D%22M%20555%20720%20V%20650%20M%20145%20650%20H%20970%20M%20145%20650%20V%20574%20M%20310%20650%20V%20574%20M%20475%20650%20V%20574%20M%20640%20650%20V%20574%20M%20805%20650%20V%20574%20M%20970%20650%20V%20574%22%20fill%3D%22none%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20145%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%3Cpath%20d%3D%22M%20310%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%3Cpath%20d%3D%22M%20475%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%3Cpath%20d%3D%22M%20640%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%3Cpath%20d%3D%22M%20805%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%3Cpath%20d%3D%22M%20970%20620%20V%20574%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%0A%3Cpath%20d%3D%22M%20145%20270%20V%20225%20M%20310%20270%20V%20225%20M%20475%20270%20V%20225%20M%20640%20270%20V%20225%20M%20805%20270%20V%20225%20M%20970%20270%20V%20225%20M%20145%20225%20H%20970%20M%20555%20225%20V%20184%22%20fill%3D%22none%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%2F%3E%0A%3Cpath%20d%3D%22M%20555%20225%20V%20184%22%20stroke%3D%22%23000000%22%20stroke-width%3D%223%22%20marker-end%3D%22url(%23head)%22%2F%3E%0A%3Ctext%20x%3D%22820%22%20y%3D%22674%22%20fill%3D%22%23000000%22%20font-size%3D%2214%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%ED%88%AC%ED%91%9C%ED%95%A8%20%EC%9D%B4%EC%86%A1%20%E2%86%92%3C%2Ftext%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%22250%22%20fill%3D%22%23000000%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%23%23%20%EC%8B%AC%EC%82%AC%20%C2%B7%20%EC%A7%91%EA%B3%84%3C%2Ftext%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%22450%22%20fill%3D%22%23000000%22%20font-size%3D%2216%22%20font-weight%3D%22700%22%20font-family%3D'%22IBM%20Plex%20Mono%22%2C%20%22D2Coding%22%2C%20%22JetBrains%20Mono%22%2C%20Consolas%2C%20%22Courier%20New%22%2C%20monospace'%3E%23%23%20%ED%88%AC%ED%91%9C%EC%A7%80%20%EB%B6%84%EB%A5%98%3C%2Ftext%3E%0A%3Crect%20x%3D%221090%22%20y%3D%220%22%20width%3D%22510%22%20height%3D%221000%22%20fill%3D%22%23fff%22%2F%3E%0A%3Cpath%20d%3D%22M%201090%200%20V%201000%22%20stroke%3D%22%23000000%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "desk": [
        395,
        720,
        320,
        100
      ],
      "s1": [
        70,
        470,
        150,
        100
      ],
      "s2": [
        235,
        470,
        150,
        100
      ],
      "s3": [
        400,
        470,
        150,
        100
      ],
      "s4": [
        565,
        470,
        150,
        100
      ],
      "s5": [
        730,
        470,
        150,
        100
      ],
      "s6": [
        895,
        470,
        150,
        100
      ],
      "t1": [
        70,
        270,
        150,
        100
      ],
      "t2": [
        235,
        270,
        150,
        100
      ],
      "t3": [
        400,
        270,
        150,
        100
      ],
      "t4": [
        565,
        270,
        150,
        100
      ],
      "t5": [
        730,
        270,
        150,
        100
      ],
      "t6": [
        895,
        270,
        150,
        100
      ],
      "board": [
        395,
        80,
        320,
        100
      ],
      "title": [
        1110,
        24,
        470,
        160
      ],
      "stages": [
        1110,
        204,
        470,
        160
      ],
      "districts": [
        1110,
        384,
        470,
        300
      ],
      "progress": [
        1110,
        704,
        470,
        270
      ]
    },
    "links": {
      "flow-s1-t1": {
        "from": "s1",
        "to": "t1",
        "show": "state",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      },
      "flow-s2-t2": {
        "from": "s2",
        "to": "t2",
        "show": "state-2",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      },
      "flow-s3-t3": {
        "from": "s3",
        "to": "t3",
        "show": "state-3",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      },
      "flow-s4-t4": {
        "from": "s4",
        "to": "t4",
        "show": "state-4",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      },
      "flow-s5-t5": {
        "from": "s5",
        "to": "t5",
        "show": "state-5",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      },
      "flow-s6-t6": {
        "from": "s6",
        "to": "t6",
        "show": "state-6",
        "of": "stations",
        "width": 3,
        "arrow": "end"
      }
    }
  }
};

export const countHall: SamplePack = {
  id: "count-hall",
  title: {
    "ko": "개표소 진행 — 웹 브루탈리즘",
    "en": "A counting hall — in web brutalism"
  },
  field: {
    "ko": "선거·행정",
    "en": "Elections & public administration"
  },
  kind: {
    "ko": "투표함이 흐르는 개표소 평면",
    "en": "A counting hall’s plan, with the ballot boxes’ way through it"
  },
  domain: "public",
  styles: [
    "art"
  ],
  summary: {
    "ko": "보궐선거 개표소의 진행판을 웹 브루탈리즘으로 — 날 회색 바닥, 굵은 검은 선, 고정폭 글꼴, 움직이는 것엔 형광 노랑 하나와 멈춘 것엔 빨강. 개표소 평면 위에 투표함의 길(접수대 → 분류기 여섯 → 심사석 여섯 → 위원 검열·공표)을 화살표로, 자리마다 처리한 투표함 수와 상태를 날것의 상자로 — 멈춘 분류기에서 나가는 화살표는 빨간 점선. 오른쪽에 개표율, 단계별 투표함, 동별 개표율(블록 막대), 저녁 동안의 개표율. 후보·정당의 득표는 싣지 않고 개표의 진행만. 도시와 선거는 지어낸 것이라 예시 데이터입니다.",
    "en": "A by-election’s counting-hall board as a brutalist web page — a raw grey floor, thick black rules, a monospace face, one highlighter yellow for what is moving and red for what has stopped. On the hall’s plan the ballot boxes’ way as arrows (the receiving desk → six sorters → six review tables → the commission, which publishes), each station a raw box with the boxes it has done and its state — the arrow out of a stopped sorter turns red and dashed. On the right the count’s rate, the boxes through each stage, each district’s progress as a bar of blocks and the rate over the evening. No candidate’s or party’s figures — only how far the count has come. The city and its election are made up. Example data."
  },
  connectors: [
    {
      "key": "count",
      "name": "예시 개표 진행 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 선거가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
