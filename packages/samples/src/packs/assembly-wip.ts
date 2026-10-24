// An assembly line read through the buffers between its stations: each station's state and cycle time against the
// takt, and on the line from one station to the next how many bodies wait in that buffer out of what it holds. A
// full buffer blocks the station before it, an empty one starves the station after it — those two are the only
// lines in colour, and the station holding the line back is marked as its bottleneck. The line's output against
// plan above, every buffer against its size below. No public source carries a line's buffers, so the values are
// example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/assembly-wip.js';

const board: Board = {
  "elements": {
    "station": {
      "template": "<div class=\"st {{state}}\" role=\"img\" aria-label=\"{{name}} {{stateText}}, 사이클 {{cycleTime}}초{{#bottleneck}}, 병목{{/bottleneck}}\">\n  <b>{{name}}</b>{{#bottleneck}}<span class=\"tag\">병목</span>{{/bottleneck}}\n  <span class=\"state\"><i></i>{{stateText}}</span>\n  <span class=\"ct\">{{cycleTime | fixed:0}}<small> 초 / 택트 60</small></span>\n</div>",
      "style": ".st{box-sizing:border-box;height:100%;display:grid;grid-template-columns:1fr auto;grid-template-rows:auto 1fr auto;row-gap:4px;padding:10px 14px;\nborder:1px solid var(--u-widget-border);border-top:4px solid var(--c);border-radius:8px;background:var(--u-widget-surface);\nfont-family:var(--u-widget-font-family);color:var(--u-widget-text);--c:#8a96a0}\nb{font-size:15px;font-weight:600}\n.tag{align-self:start;font-size:11px;font-weight:700;padding:1px 7px;border-radius:9px;border:1.5px solid var(--u-widget-text);color:var(--u-widget-text)}\n.state{grid-column:1/3;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--u-widget-text-secondary)}\ni{width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}\n.ct{grid-column:1/3;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}\n.ct small{font-size:12px;font-weight:500;color:var(--u-widget-text-secondary)}\n.blocked,.starved{--c:var(--u-widget-warning)}\n.blocked .state,.starved .state{color:var(--u-widget-text);font-weight:600}\n.stopped{--c:var(--u-widget-negative)}\n.stopped .state{color:var(--u-widget-negative);font-weight:600}",
      "props": {
        "name": "string",
        "state": "string",
        "stateText": "string",
        "cycleTime": "number",
        "bottleneck": "boolean"
      }
    }
  },
  "data": {
    "summary": {
      "from": "mes",
      "path": "/line/summary",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "unitsPerHour": {
          "label": "시간당 생산 (목표 60)",
          "unit": "대"
        },
        "unitsToday": {
          "label": "오늘 생산 (계획 480)",
          "unit": "대"
        },
        "wip": {
          "label": "라인 재공",
          "unit": "대"
        },
        "bottleneckName": {
          "label": "병목 공정"
        },
        "lostMinutes": {
          "label": "막힘·대기 손실 (오늘)",
          "unit": "분"
        }
      }
    },
    "stations": {
      "from": "mes",
      "path": "/line/stations",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "state": {},
        "state-2": {
          "names": {
            "running": "가동",
            "blocked": "막힘 — 다음 버퍼 가득",
            "starved": "대기 — 앞 버퍼 빔",
            "stopped": "정지",
            "*": "알 수 없음"
          },
          "at": "/state"
        },
        "cycleTime": {},
        "bottleneck": {}
      }
    },
    "buffers": {
      "from": "mes",
      "path": "/line/buffers",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "wip": {},
        "state": {
          "state": {
            "full": "warn",
            "empty": "warn",
            "*": "idle"
          }
        }
      }
    }
  },
  "parts": {
    "uph": {
      "as": "stat",
      "of": "summary",
      "show": "unitsPerHour"
    },
    "today": {
      "as": "stat",
      "of": "summary",
      "show": "unitsToday"
    },
    "wip": {
      "as": "stat",
      "of": "summary",
      "show": "wip"
    },
    "bottleneck": {
      "as": "stat",
      "of": "summary",
      "show": "bottleneckName"
    },
    "lost": {
      "as": "stat",
      "of": "summary",
      "show": "lostMinutes"
    },
    "body-in": {
      "as": "element",
      "element": "station",
      "of": "stations[body-in]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "welding": {
      "as": "element",
      "element": "station",
      "of": "stations[welding]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "paint": {
      "as": "element",
      "element": "station",
      "of": "stations[paint]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "trim-1": {
      "as": "element",
      "element": "station",
      "of": "stations[trim-1]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "trim-2": {
      "as": "element",
      "element": "station",
      "of": "stations[trim-2]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "final": {
      "as": "element",
      "element": "station",
      "of": "stations[final]",
      "bind": {
        "name": "name",
        "state": "state",
        "stateText": "state-2",
        "cycleTime": "cycleTime",
        "bottleneck": "bottleneck"
      }
    },
    "buffers": {
      "as": "chart.bar",
      "of": "buffers",
      "title": "버퍼별 재공 — 지금과 크기 (대)",
      "x": "name",
      "y": [
        "wip",
        "capacity"
      ],
      "series": [
        {
          "label": "재공",
          "color": "#4a555b"
        },
        {
          "label": "버퍼 크기",
          "type": "line",
          "lineStyle": "dashed",
          "symbol": "none",
          "color": "#8a96a0"
        }
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1236,
      770
    ],
    "place": {
      "uph": [
        40,
        78,
        220,
        66
      ],
      "today": [
        284,
        78,
        220,
        66
      ],
      "wip": [
        528,
        78,
        220,
        66
      ],
      "bottleneck": [
        772,
        78,
        220,
        66
      ],
      "lost": [
        1016,
        78,
        220,
        66
      ],
      "body-in": [
        60,
        196,
        220,
        112
      ],
      "welding": [
        520,
        196,
        220,
        112
      ],
      "paint": [
        980,
        196,
        220,
        112
      ],
      "trim-1": [
        980,
        430,
        220,
        112
      ],
      "trim-2": [
        520,
        430,
        220,
        112
      ],
      "final": [
        60,
        430,
        220,
        112
      ],
      "buffers": [
        40,
        600,
        1180,
        170
      ]
    },
    "shapes": {
      "title": {
        "text": "조립 라인 흐름과 재공",
        "at": [
          40,
          20
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "공정 사이 선 = 버퍼, 라벨은 기다리는 차체 수 · 가득 차거나 빈 버퍼만 색 · 택트 60초 · 예시 데이터",
        "at": [
          40,
          52
        ],
        "size": 13,
        "tone": "past"
      }
    },
    "links": {
      "body-in--welding": {
        "from": "body-in",
        "to": "welding",
        "label": "{{wip}} / 8대",
        "show": "state",
        "weight": {
          "field": "wip",
          "bands": [
            1.5,
            1,
            2.5,
            3,
            4,
            6,
            6
          ]
        },
        "of": "buffers[body-in--welding]",
        "width": 2,
        "arrow": "end"
      },
      "welding--paint": {
        "from": "welding",
        "to": "paint",
        "label": "{{wip}} / 8대",
        "show": "state",
        "weight": {
          "field": "wip",
          "bands": [
            1.5,
            1,
            2.5,
            3,
            4,
            6,
            6
          ]
        },
        "of": "buffers[welding--paint]",
        "width": 2,
        "arrow": "end"
      },
      "paint--trim-1": {
        "from": "paint",
        "to": "trim-1",
        "label": "{{wip}} / 10대",
        "show": "state",
        "weight": {
          "field": "wip",
          "bands": [
            1.5,
            1,
            2.5,
            3,
            4,
            6,
            6
          ]
        },
        "of": "buffers[paint--trim-1]",
        "width": 2,
        "arrow": "end"
      },
      "trim-1--trim-2": {
        "from": "trim-1",
        "to": "trim-2",
        "label": "{{wip}} / 6대",
        "show": "state",
        "weight": {
          "field": "wip",
          "bands": [
            1.5,
            1,
            2.5,
            3,
            4,
            6,
            6
          ]
        },
        "of": "buffers[trim-1--trim-2]",
        "width": 2,
        "arrow": "end"
      },
      "trim-2--final": {
        "from": "trim-2",
        "to": "final",
        "label": "{{wip}} / 6대",
        "show": "state",
        "weight": {
          "field": "wip",
          "bands": [
            1.5,
            1,
            2.5,
            3,
            4,
            6,
            6
          ]
        },
        "of": "buffers[trim-2--final]",
        "width": 2,
        "arrow": "end"
      }
    }
  }
};

export const assemblyWip: SamplePack = {
  id: "assembly-wip",
  title: {
    "ko": "조립 라인 흐름과 재공",
    "en": "Assembly line flow and WIP"
  },
  field: {
    "ko": "제조·생산",
    "en": "Manufacturing & production"
  },
  kind: {
    "ko": "없음 — 흐름도",
    "en": "None — flow diagram"
  },
  domain: "manufacturing",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "차체가 흐르는 순서대로 놓은 공정마다 상태와 택트 대비 사이클 시간을, 공정 사이 선에는 그 버퍼에서 기다리는 차체 수를 라벨로·굵기로. 가득 차 앞 공정을 막거나 비어 뒤 공정을 굶기는 버퍼만 색으로, 라인을 잡고 있는 공정에는 «병목». 위에는 생산 실적, 아래에는 버퍼별 재공. 예시 데이터입니다.",
    "en": "Each station’s state and cycle time against the takt, in the order bodies flow, and on the line between two stations how many bodies wait in that buffer — as its label and its width. Only a buffer that is full (blocking the station before it) or empty (starving the one after) takes colour, and the station holding the line back is marked as its bottleneck. Output against plan above, every buffer against its size below. Example data."
  },
  connectors: [
    {
      "key": "mes",
      "name": "예시 MES API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 라인이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
