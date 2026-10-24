// A high-speed rail network's operations board, drawn as a transit map: the country's lines as coloured strokes from
// station to station, each section as thick as the trains on it and dashed where they run late, with the delay on
// it; the stations a dot each, ringed red where trains wait. Beside the map, the day's figures, punctuality by line
// against its target and the trains running late. A wide area on one canvas — a schematic, not a survey: stations
// sit where a rider reads them. No public source carries a network's running this way, so the values are example
// data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/rail-network.js';

const board: Board = {
  "board": {
    "accent": "#2563eb"
  },
  "statuses": {
    "late": {
      "tone": "info",
      "emphasis": "hatch"
    },
    "late-ok": {
      "tone": "ok",
      "emphasis": "hatch"
    },
    "late-warn": {
      "tone": "warn",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "station": {
      "template": "<span class=\"dot {{state}}{{#hub}} hub{{/hub}}\" role=\"img\" aria-label=\"{{name}}\"></span>",
      "style": ".dot{display:block;box-sizing:border-box;width:100%;height:100%;border-radius:50%;background:#fff;border:3px solid #0f172a}\n.hub{border-width:4px}\n.held{border-color:#dc2626;box-shadow:0 0 0 4px rgb(220 38 38 / 25%)}",
      "props": {
        "name": "string",
        "state": "string",
        "hub": "boolean"
      }
    },
    "masthead": {
      "template": "<header class=\"mast\"><span>고속철도 운행 관제</span><b>전국 노선도</b><em>{{asOf}} 기준</em></header>",
      "style": ".mast{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;color:#0f172a;font-family:var(--u-widget-font-family)}\nspan{font-size:12px;font-weight:700;letter-spacing:.08em;color:#2563eb}\nb{font-size:26px;letter-spacing:-.01em}\nem{font-style:normal;font-size:12px;color:#64748b}",
      "props": {
        "asOf": "string"
      }
    },
    "figure": {
      "template": "<div class=\"fig {{tone}}\"><span>{{label}}</span><b>{{#decimal}}{{value | fixed:1}}{{/decimal}}{{^decimal}}{{value | grouped:0}}{{/decimal}}<small>{{unit}}</small></b>{{#note}}<em>{{note}}</em>{{/note}}</div>",
      "style": ".fig{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:10px 14px;border-radius:10px;background:#fff;border:1px solid #e2e8f0;color:#0f172a;font-family:var(--u-widget-font-family)}\nspan{font-size:12px;color:#64748b}\nb{font-size:24px;line-height:1.1;white-space:nowrap;font-variant-numeric:tabular-nums}\nsmall{font-size:13px;font-weight:500;margin-left:2px;color:#64748b}\nem{font-style:normal;font-size:11px;color:#64748b}\n.warn b{color:#dc2626}",
      "props": {
        "label": "string",
        "value": "number",
        "unit": "string",
        "note": "string",
        "decimal": "boolean",
        "tone": "string"
      }
    }
  },
  "data": {
    "stations": {
      "from": "ops",
      "path": "/rail/stations",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "state": {}
      }
    },
    "summary": {
      "from": "ops",
      "path": "/rail/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "asOf": {},
        "running": {},
        "punctuality": {},
        "late": {},
        "late-2": {
          "names": [
            "normal",
            5,
            "warn"
          ],
          "at": "/late"
        },
        "riders": {}
      }
    },
    "lines": {
      "from": "ops",
      "path": "/rail/lines",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "lateTrains": {
      "from": "ops",
      "path": "/rail/lateTrains",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "train": {
          "label": "열차"
        },
        "route": {
          "label": "구간"
        },
        "delay": {
          "label": "지연"
        }
      }
    },
    "sections": {
      "from": "ops",
      "path": "/rail/sections",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "delayText": {},
        "state": {
          "state": {
            "late": "late",
            "*": "info"
          }
        },
        "trains": {},
        "state-2": {
          "at": "/state",
          "state": {
            "late": "late-ok",
            "*": "ok"
          }
        },
        "state-3": {
          "at": "/state",
          "state": {
            "late": "late-warn",
            "*": "warn"
          }
        }
      }
    }
  },
  "parts": {
    "seoul": {
      "as": "element",
      "element": "station",
      "of": "stations[seoul]",
      "props": {
        "name": "서울",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "cheongnyangni": {
      "as": "element",
      "element": "station",
      "of": "stations[cheongnyangni]",
      "props": {
        "name": "청량리"
      },
      "bind": {
        "state": "state"
      }
    },
    "suseo": {
      "as": "element",
      "element": "station",
      "of": "stations[suseo]",
      "props": {
        "name": "수서"
      },
      "bind": {
        "state": "state"
      }
    },
    "gwangmyeong": {
      "as": "element",
      "element": "station",
      "of": "stations[gwangmyeong]",
      "props": {
        "name": "광명"
      },
      "bind": {
        "state": "state"
      }
    },
    "dongtan": {
      "as": "element",
      "element": "station",
      "of": "stations[dongtan]",
      "props": {
        "name": "동탄"
      },
      "bind": {
        "state": "state"
      }
    },
    "pyeongtaek": {
      "as": "element",
      "element": "station",
      "of": "stations[pyeongtaek]",
      "props": {
        "name": "평택지제"
      },
      "bind": {
        "state": "state"
      }
    },
    "cheonan": {
      "as": "element",
      "element": "station",
      "of": "stations[cheonan]",
      "props": {
        "name": "천안아산"
      },
      "bind": {
        "state": "state"
      }
    },
    "osong": {
      "as": "element",
      "element": "station",
      "of": "stations[osong]",
      "props": {
        "name": "오송",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "daejeon": {
      "as": "element",
      "element": "station",
      "of": "stations[daejeon]",
      "props": {
        "name": "대전",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "gimcheon": {
      "as": "element",
      "element": "station",
      "of": "stations[gimcheon]",
      "props": {
        "name": "김천구미"
      },
      "bind": {
        "state": "state"
      }
    },
    "dongdaegu": {
      "as": "element",
      "element": "station",
      "of": "stations[dongdaegu]",
      "props": {
        "name": "동대구",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "singyeongju": {
      "as": "element",
      "element": "station",
      "of": "stations[singyeongju]",
      "props": {
        "name": "신경주"
      },
      "bind": {
        "state": "state"
      }
    },
    "ulsan": {
      "as": "element",
      "element": "station",
      "of": "stations[ulsan]",
      "props": {
        "name": "울산"
      },
      "bind": {
        "state": "state"
      }
    },
    "busan": {
      "as": "element",
      "element": "station",
      "of": "stations[busan]",
      "props": {
        "name": "부산",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "gongju": {
      "as": "element",
      "element": "station",
      "of": "stations[gongju]",
      "props": {
        "name": "공주"
      },
      "bind": {
        "state": "state"
      }
    },
    "iksan": {
      "as": "element",
      "element": "station",
      "of": "stations[iksan]",
      "props": {
        "name": "익산"
      },
      "bind": {
        "state": "state"
      }
    },
    "jeongeup": {
      "as": "element",
      "element": "station",
      "of": "stations[jeongeup]",
      "props": {
        "name": "정읍"
      },
      "bind": {
        "state": "state"
      }
    },
    "gwangju": {
      "as": "element",
      "element": "station",
      "of": "stations[gwangju]",
      "props": {
        "name": "광주송정",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "mokpo": {
      "as": "element",
      "element": "station",
      "of": "stations[mokpo]",
      "props": {
        "name": "목포"
      },
      "bind": {
        "state": "state"
      }
    },
    "manjong": {
      "as": "element",
      "element": "station",
      "of": "stations[manjong]",
      "props": {
        "name": "만종"
      },
      "bind": {
        "state": "state"
      }
    },
    "jinbu": {
      "as": "element",
      "element": "station",
      "of": "stations[jinbu]",
      "props": {
        "name": "진부"
      },
      "bind": {
        "state": "state"
      }
    },
    "gangneung": {
      "as": "element",
      "element": "station",
      "of": "stations[gangneung]",
      "props": {
        "name": "강릉",
        "hub": true
      },
      "bind": {
        "state": "state"
      }
    },
    "masthead": {
      "as": "element",
      "element": "masthead",
      "of": "summary",
      "bind": {
        "asOf": "asOf"
      }
    },
    "running": {
      "as": "element",
      "element": "figure",
      "of": "summary",
      "props": {
        "label": "운행 중 열차",
        "unit": "편",
        "tone": "normal"
      },
      "bind": {
        "value": "running"
      }
    },
    "punctuality": {
      "as": "element",
      "element": "figure",
      "of": "summary",
      "props": {
        "label": "정시율",
        "unit": "%",
        "note": "목표 95%",
        "decimal": true,
        "tone": "normal"
      },
      "bind": {
        "value": "punctuality"
      }
    },
    "late": {
      "as": "element",
      "element": "figure",
      "of": "summary",
      "props": {
        "label": "지연 열차",
        "unit": "편"
      },
      "bind": {
        "value": "late",
        "tone": "late-2"
      }
    },
    "riders": {
      "as": "element",
      "element": "figure",
      "of": "summary",
      "props": {
        "label": "오늘 이용객",
        "unit": "명",
        "tone": "normal"
      },
      "bind": {
        "value": "riders"
      }
    },
    "by-line": {
      "as": "chart.bar",
      "of": "lines",
      "title": "노선별 정시율 (%)",
      "x": "line",
      "y": "punctuality",
      "horizontal": true,
      "valueAxisZero": false,
      "referenceLines": [
        {
          "axis": "x",
          "value": 95,
          "label": "목표",
          "style": "dashed"
        }
      ],
      "series": [
        {
          "label": "정시율",
          "color": "#2563eb"
        }
      ]
    },
    "late-trains": {
      "as": "table",
      "of": "lateTrains",
      "show": [
        "train",
        "route",
        "delay"
      ],
      "title": "지연 열차"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1200,
      820
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22820%22%20viewBox%3D%220%200%201200%20820%22%3E%0A%3Crect%20width%3D%221200%22%20height%3D%22820%22%20fill%3D%22%23f1f5f9%22%2F%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22830%22%20height%3D%22780%22%20rx%3D%2218%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23e2e8f0%22%2F%3E%0A%3Crect%20x%3D%22868%22%20y%3D%2220%22%20width%3D%22312%22%20height%3D%22780%22%20rx%3D%2218%22%20fill%3D%22%23f8fafc%22%20stroke%3D%22%23e2e8f0%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "seoul": [
        241,
        131,
        18,
        18
      ],
      "cheongnyangni": [
        311,
        91,
        18,
        18
      ],
      "suseo": [
        341,
        166,
        18,
        18
      ],
      "gwangmyeong": [
        241,
        201,
        18,
        18
      ],
      "dongtan": [
        341,
        226,
        18,
        18
      ],
      "pyeongtaek": [
        321,
        286,
        18,
        18
      ],
      "cheonan": [
        241,
        291,
        18,
        18
      ],
      "osong": [
        281,
        361,
        18,
        18
      ],
      "daejeon": [
        331,
        431,
        18,
        18
      ],
      "gimcheon": [
        431,
        506,
        18,
        18
      ],
      "dongdaegu": [
        541,
        551,
        18,
        18
      ],
      "singyeongju": [
        641,
        601,
        18,
        18
      ],
      "ulsan": [
        701,
        661,
        18,
        18
      ],
      "busan": [
        681,
        751,
        18,
        18
      ],
      "gongju": [
        221,
        436,
        18,
        18
      ],
      "iksan": [
        181,
        516,
        18,
        18
      ],
      "jeongeup": [
        161,
        596,
        18,
        18
      ],
      "gwangju": [
        141,
        676,
        18,
        18
      ],
      "mokpo": [
        81,
        756,
        18,
        18
      ],
      "manjong": [
        461,
        106,
        18,
        18
      ],
      "jinbu": [
        611,
        86,
        18,
        18
      ],
      "gangneung": [
        751,
        76,
        18,
        18
      ],
      "masthead": [
        880,
        30,
        280,
        80
      ],
      "running": [
        880,
        124,
        134,
        84
      ],
      "punctuality": [
        1026,
        124,
        134,
        84
      ],
      "late": [
        880,
        220,
        134,
        84
      ],
      "riders": [
        1026,
        220,
        134,
        84
      ],
      "by-line": [
        880,
        318,
        280,
        190
      ],
      "late-trains": [
        880,
        520,
        280,
        270
      ]
    },
    "shapes": {
      "name-seoul": {
        "text": "서울",
        "at": [
          236,
          140
        ],
        "size": 15,
        "tone": "next"
      },
      "name-cheongnyangni": {
        "text": "청량리",
        "at": [
          320,
          86
        ],
        "size": 13,
        "tone": "next"
      },
      "name-suseo": {
        "text": "수서",
        "at": [
          364,
          175
        ],
        "size": 13,
        "tone": "next"
      },
      "name-gwangmyeong": {
        "text": "광명",
        "at": [
          236,
          210
        ],
        "size": 13,
        "tone": "next"
      },
      "name-dongtan": {
        "text": "동탄",
        "at": [
          364,
          235
        ],
        "size": 13,
        "tone": "next"
      },
      "name-pyeongtaek": {
        "text": "평택지제",
        "at": [
          344,
          295
        ],
        "size": 13,
        "tone": "next"
      },
      "name-cheonan": {
        "text": "천안아산",
        "at": [
          236,
          300
        ],
        "size": 13,
        "tone": "next"
      },
      "name-osong": {
        "text": "오송",
        "at": [
          304,
          370
        ],
        "size": 15,
        "tone": "next"
      },
      "name-daejeon": {
        "text": "대전",
        "at": [
          354,
          440
        ],
        "size": 15,
        "tone": "next"
      },
      "name-gimcheon": {
        "text": "김천구미",
        "at": [
          449,
          506
        ],
        "size": 13,
        "tone": "next"
      },
      "name-dongdaegu": {
        "text": "동대구",
        "at": [
          559,
          551
        ],
        "size": 15,
        "tone": "next"
      },
      "name-singyeongju": {
        "text": "신경주",
        "at": [
          659,
          601
        ],
        "size": 13,
        "tone": "next"
      },
      "name-ulsan": {
        "text": "울산",
        "at": [
          724,
          670
        ],
        "size": 13,
        "tone": "next"
      },
      "name-busan": {
        "text": "부산",
        "at": [
          704,
          760
        ],
        "size": 15,
        "tone": "next"
      },
      "name-gongju": {
        "text": "공주",
        "at": [
          216,
          445
        ],
        "size": 13,
        "tone": "next"
      },
      "name-iksan": {
        "text": "익산",
        "at": [
          176,
          525
        ],
        "size": 13,
        "tone": "next"
      },
      "name-jeongeup": {
        "text": "정읍",
        "at": [
          156,
          605
        ],
        "size": 13,
        "tone": "next"
      },
      "name-gwangju": {
        "text": "광주송정",
        "at": [
          136,
          685
        ],
        "size": 15,
        "tone": "next"
      },
      "name-mokpo": {
        "text": "목포",
        "at": [
          76,
          765
        ],
        "size": 13,
        "tone": "next"
      },
      "name-manjong": {
        "text": "만종",
        "at": [
          470,
          129
        ],
        "size": 13,
        "tone": "next"
      },
      "name-jinbu": {
        "text": "진부",
        "at": [
          620,
          81
        ],
        "size": 13,
        "tone": "next"
      },
      "name-gangneung": {
        "text": "강릉",
        "at": [
          774,
          85
        ],
        "size": 15,
        "tone": "next"
      },
      "key-gyeongbu": {
        "box": [
          520,
          262,
          26,
          6
        ]
      },
      "key-gyeongbu-name": {
        "text": "경부선",
        "at": [
          556,
          265
        ],
        "size": 13,
        "tone": "next"
      },
      "key-srt": {
        "box": [
          520,
          288,
          26,
          6
        ]
      },
      "key-srt-name": {
        "text": "SRT",
        "at": [
          556,
          291
        ],
        "size": 13,
        "tone": "next"
      },
      "key-honam": {
        "box": [
          520,
          314,
          26,
          6
        ]
      },
      "key-honam-name": {
        "text": "호남선",
        "at": [
          556,
          317
        ],
        "size": 13,
        "tone": "next"
      },
      "key-gangneung": {
        "box": [
          520,
          340,
          26,
          6
        ]
      },
      "key-gangneung-name": {
        "text": "강릉선",
        "at": [
          556,
          343
        ],
        "size": 13,
        "tone": "next"
      },
      "key-late": {
        "text": "점선 = 지연 구간 · 굵기 = 시간당 운행 편수",
        "at": [
          520,
          372
        ],
        "size": 12
      }
    },
    "links": {
      "seoul-gwangmyeong": {
        "from": "seoul",
        "to": "gwangmyeong",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[seoul-gwangmyeong]",
        "width": 6
      },
      "gwangmyeong-cheonan": {
        "from": "gwangmyeong",
        "to": "cheonan",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[gwangmyeong-cheonan]",
        "width": 6
      },
      "cheonan-osong": {
        "from": "cheonan",
        "to": "osong",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[cheonan-osong]",
        "width": 6
      },
      "osong-daejeon": {
        "from": "osong",
        "to": "daejeon",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[osong-daejeon]",
        "width": 6
      },
      "daejeon-gimcheon": {
        "from": "daejeon",
        "to": "gimcheon",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[daejeon-gimcheon]",
        "width": 6
      },
      "gimcheon-dongdaegu": {
        "from": "gimcheon",
        "to": "dongdaegu",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[gimcheon-dongdaegu]",
        "width": 6
      },
      "dongdaegu-singyeongju": {
        "from": "dongdaegu",
        "to": "singyeongju",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[dongdaegu-singyeongju]",
        "width": 6
      },
      "singyeongju-ulsan": {
        "from": "singyeongju",
        "to": "ulsan",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[singyeongju-ulsan]",
        "width": 6
      },
      "ulsan-busan": {
        "from": "ulsan",
        "to": "busan",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[ulsan-busan]",
        "width": 6
      },
      "suseo-dongtan": {
        "from": "suseo",
        "to": "dongtan",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[suseo-dongtan]",
        "width": 6
      },
      "dongtan-pyeongtaek": {
        "from": "dongtan",
        "to": "pyeongtaek",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[dongtan-pyeongtaek]",
        "width": 6
      },
      "pyeongtaek-osong": {
        "from": "pyeongtaek",
        "to": "osong",
        "label": "{{delayText}}",
        "show": "state",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[pyeongtaek-osong]",
        "width": 6
      },
      "osong-gongju": {
        "from": "osong",
        "to": "gongju",
        "label": "{{delayText}}",
        "show": "state-2",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[osong-gongju]",
        "width": 6
      },
      "gongju-iksan": {
        "from": "gongju",
        "to": "iksan",
        "label": "{{delayText}}",
        "show": "state-2",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[gongju-iksan]",
        "width": 6
      },
      "iksan-jeongeup": {
        "from": "iksan",
        "to": "jeongeup",
        "label": "{{delayText}}",
        "show": "state-2",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[iksan-jeongeup]",
        "width": 6
      },
      "jeongeup-gwangju": {
        "from": "jeongeup",
        "to": "gwangju",
        "label": "{{delayText}}",
        "show": "state-2",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[jeongeup-gwangju]",
        "width": 6
      },
      "gwangju-mokpo": {
        "from": "gwangju",
        "to": "mokpo",
        "label": "{{delayText}}",
        "show": "state-2",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[gwangju-mokpo]",
        "width": 6
      },
      "seoul-cheongnyangni": {
        "from": "seoul",
        "to": "cheongnyangni",
        "label": "{{delayText}}",
        "show": "state-3",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[seoul-cheongnyangni]",
        "width": 6
      },
      "cheongnyangni-manjong": {
        "from": "cheongnyangni",
        "to": "manjong",
        "label": "{{delayText}}",
        "show": "state-3",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[cheongnyangni-manjong]",
        "width": 6
      },
      "manjong-jinbu": {
        "from": "manjong",
        "to": "jinbu",
        "label": "{{delayText}}",
        "show": "state-3",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[manjong-jinbu]",
        "width": 6
      },
      "jinbu-gangneung": {
        "from": "jinbu",
        "to": "gangneung",
        "label": "{{delayText}}",
        "show": "state-3",
        "weight": {
          "field": "trains",
          "bands": [
            4,
            6,
            6,
            12,
            9
          ]
        },
        "of": "sections[jinbu-gangneung]",
        "width": 6
      }
    }
  }
};

export const railNetwork: SamplePack = {
  id: "rail-network",
  title: {
    "ko": "고속철도 운행 관제 — 전국 노선도",
    "en": "High-speed rail operations — the network map"
  },
  field: {
    "ko": "교통·철도",
    "en": "Transport & rail"
  },
  kind: {
    "ko": "노선도(도식 지도, 광역)",
    "en": "Network map (schematic, nationwide)"
  },
  domain: "transport",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "전국 고속철도를 노선도로 — 노선 색으로 이은 역과 역, 구간마다 시간당 운행 편수만큼의 굵기, 늦는 구간은 점선과 지연 분, 열차가 묶인 역은 붉은 고리. 옆에 오늘의 숫자, 목표와 견준 노선별 정시율, 지연 열차. 예시 데이터입니다.",
    "en": "The country’s high-speed rail as a transit map — stations joined in their line’s colour, each section as thick as the trains on it in the hour, dashed with its delay where late, a red ring where trains are held; beside it the day’s figures, punctuality by line against its target and the trains running late. Example data."
  },
  connectors: [
    {
      "key": "ops",
      "name": "예시 열차 운행 관리 시스템",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 열차 운행 정보가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
