// A carrier's network operations centre, the wall the night shift watches: dark and dense, as much as reads at a
// glance. Six figures with the last hours under each, every region against every service in one matrix of cells,
// the backbone links filling up, the last 24 hours of traffic over last week's, the alarms by region and severity, and the
// alarms still open. A grid only — no map: density is the point. No public source carries a network's state, so
// the values are example data written for the board.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/telecom-noc.js';

const board: Board = {
  "board": {
    "theme": "dark",
    "accent": "#4ade80"
  },
  "elements": {
    "matrix": {
      "template": "<section class=\"matrix\">\n  <header><b>권역 × 서비스</b><span class=\"key\"><i class=\"ok\"></i>정상<i class=\"warn\"></i>저하<i class=\"down\"></i>장애</span></header>\n  <table>\n    <thead><tr><th></th>{{#services}}<th>{{.}}</th>{{/services}}</tr></thead>\n    <tbody>{{#regions}}<tr><th>{{name}}</th>{{#cells}}<td class=\"{{state}}\">{{availability | fixed:2}}</td>{{/cells}}</tr>{{/regions}}</tbody>\n  </table>\n</section>",
      "style": ".matrix{container-type:inline-size;height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 14px;border:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-bg);color:var(--u-widget-text);font-family:ui-monospace,'Cascadia Mono',Consolas,monospace}\nheader{display:flex;justify-content:space-between;align-items:center;font-size:13px}\n.key{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--u-widget-text-secondary)}\n.key i{width:9px;height:9px;border-radius:2px;margin-left:6px}\ntable{width:100%;height:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed}\nth{font-size:11px;font-weight:600;color:var(--u-widget-text-secondary);text-align:center;white-space:nowrap}\ntbody th{text-align:left}\ntd{font-size:12px;text-align:center;border-radius:3px;white-space:nowrap;font-variant-numeric:tabular-nums}\n.ok{background:#14532d;color:#bbf7d0}\n.warn{background:#713f12;color:#fde68a}\n.down{background:#7f1d1d;color:#fecaca;box-shadow:0 0 0 1px #ef4444 inset}\n.key .ok{background:#22c55e}.key .warn{background:#eab308}.key .down{background:#ef4444}\n/* On a phone the matrix is a few hundred px wide: the figures and the names shrink with it rather than wrap. */\n@container (max-width: 420px){td{font-size:min(12px,3.1cqi)}th{font-size:min(11px,2.9cqi);overflow:hidden;text-overflow:ellipsis}tbody th{font-size:min(11px,3.6cqi)}table{border-spacing:2px}.key{display:none}}",
      "props": {
        "services": "list",
        "regions": "list"
      }
    },
    "links": {
      "template": "<section class=\"links\">\n  <header><b>백본 회선 사용률</b><span>RTT</span></header>\n  <ul>{{#items}}<li class=\"{{level}}\" style=\"--u: {{load}}\"><span class=\"name\">{{name}}</span><span class=\"bar\"><i></i></span><span class=\"pct\">{{load}}%</span><span class=\"rtt\">{{rtt | fixed:1}}ms</span></li>{{/items}}</ul>\n</section>",
      "style": ".links{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 14px;border:1px solid var(--u-widget-border);border-radius:6px;background:var(--u-widget-bg);color:var(--u-widget-text);font-family:ui-monospace,'Cascadia Mono',Consolas,monospace}\nheader{display:flex;justify-content:space-between;font-size:13px}\nheader span{font-size:11px;color:var(--u-widget-text-secondary)}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:space-around;gap:6px}\nli{display:grid;grid-template-columns:76px 1fr 34px 52px;align-items:center;gap:8px;font-size:12px;font-variant-numeric:tabular-nums}\n.name{color:var(--u-widget-text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.bar{height:8px;border-radius:2px;background:color-mix(in srgb,var(--u-widget-text) 10%,transparent);overflow:hidden}\n.bar i{display:block;height:100%;width:calc(var(--u) * 1%);background:var(--u-widget-primary)}\n.high .bar i{background:#ef4444}\n.high .pct{color:#f87171}\n.pct,.rtt{text-align:right}\n.rtt{color:var(--u-widget-text-secondary)}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "kpis": {
      "from": "nms",
      "path": "/noc/kpis",
      "list": "/value",
      "key": "id",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {
          "label": "전체 트래픽",
          "unit": "Tbps"
        },
        "last6h": {},
        "value-2": {
          "label": "5G 동시 접속",
          "unit": "만",
          "at": "/value"
        },
        "value-3": {
          "label": "호 성공률",
          "unit": "%",
          "at": "/value",
          "state": [
            "alarm",
            99.5,
            "ok"
          ]
        },
        "value-4": {
          "label": "평균 지연",
          "unit": "ms",
          "at": "/value",
          "state": [
            "ok",
            15,
            "alarm"
          ]
        },
        "value-5": {
          "label": "활성 경보",
          "unit": "건",
          "at": "/value",
          "state": [
            "idle",
            30,
            "warn"
          ]
        },
        "value-6": {
          "label": "장애 영향 가입자",
          "unit": "명",
          "at": "/value",
          "state": [
            "idle",
            1000,
            "alarm"
          ]
        }
      }
    },
    "matrix": {
      "from": "nms",
      "path": "/noc/matrix",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "services": {},
        "regions": {}
      }
    },
    "traffic": {
      "from": "nms",
      "path": "/noc/traffic",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "alarmsByRegion": {
      "from": "nms",
      "path": "/noc/alarmsByRegion",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt"
    },
    "alarms": {
      "from": "nms",
      "path": "/noc/alarms",
      "list": "/value",
      "fresh": 300,
      "answerTime": "/updatedAt",
      "fields": {
        "time": {
          "label": "발생"
        },
        "severity": {
          "label": "등급"
        },
        "region": {
          "label": "권역"
        },
        "element": {
          "label": "장비"
        },
        "text": {
          "label": "내용"
        },
        "age": {
          "label": "경과"
        }
      }
    },
    "links": {
      "from": "nms",
      "path": "/noc/links",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    }
  },
  "parts": {
    "traffic": {
      "as": "stat",
      "of": "kpis[traffic]",
      "show": "value",
      "trend": "last6h"
    },
    "sessions": {
      "as": "stat",
      "of": "kpis[sessions]",
      "show": "value-2",
      "trend": "last6h"
    },
    "callSuccess": {
      "as": "stat",
      "of": "kpis[callSuccess]",
      "show": "value-3",
      "trend": "last6h"
    },
    "latency": {
      "as": "stat",
      "of": "kpis[latency]",
      "show": "value-4",
      "trend": "last6h"
    },
    "alarms": {
      "as": "stat",
      "of": "kpis[alarms]",
      "show": "value-5",
      "trend": "last6h"
    },
    "impacted": {
      "as": "stat",
      "of": "kpis[impacted]",
      "show": "value-6",
      "trend": "last6h"
    },
    "matrix": {
      "as": "element",
      "element": "matrix",
      "of": "matrix",
      "bind": {
        "services": "services",
        "regions": "regions"
      }
    },
    "traffic-day": {
      "as": "chart.line",
      "of": "traffic",
      "title": "최근 24시간 트래픽(Tbps) — 지난주 같은 시간과",
      "x": "time",
      "y": [
        "today",
        "lastWeek"
      ],
      "smooth": true,
      "series": [
        {
          "label": "최근 24시간",
          "symbol": "none"
        },
        {
          "label": "지난주",
          "color": "#64748b",
          "lineStyle": "dashed",
          "symbol": "none"
        }
      ]
    },
    "alarm-regions": {
      "as": "chart.bar",
      "of": "alarmsByRegion",
      "title": "권역별 활성 경보 — 심각 · 주요 · 경미",
      "x": "region",
      "y": [
        "critical",
        "major",
        "minor"
      ],
      "stack": true,
      "series": [
        {
          "label": "심각",
          "color": "#ef4444"
        },
        {
          "label": "주요",
          "color": "#f59e0b"
        },
        {
          "label": "경미",
          "color": "#64748b"
        }
      ],
      "echarts": {
        "xAxis": {
          "axisLabel": {
            "interval": 0,
            "fontSize": 10
          }
        }
      }
    },
    "alarm-list": {
      "as": "table",
      "of": "alarms",
      "show": [
        "time",
        "severity",
        "region",
        "element",
        "text",
        "age"
      ],
      "title": "미해결 경보"
    },
    "links": {
      "as": "element",
      "element": "links",
      "of": "links",
      "bind": {
        "items": "value"
      }
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "traffic",
        2
      ],
      [
        "sessions",
        2
      ],
      [
        "callSuccess",
        2
      ],
      [
        "latency",
        2
      ],
      [
        "alarms",
        2
      ],
      [
        "impacted",
        2
      ],
      [
        "matrix",
        7
      ],
      {
        "grid": [
          {
            "id": "traffic-day",
            "span": 12,
            "height": 162
          },
          {
            "id": "alarm-regions",
            "span": 12,
            "height": 162
          }
        ],
        "span": 5
      },
      {
        "id": "alarm-list",
        "span": 8,
        "height": 270
      },
      {
        "id": "links",
        "span": 4,
        "height": 270
      }
    ]
  }
};

export const telecomNoc: SamplePack = {
  id: "telecom-noc",
  title: {
    "ko": "전국 통신망 관제 NOC",
    "en": "Nationwide network operations centre"
  },
  field: {
    "ko": "통신·네트워크",
    "en": "Telecom & networks"
  },
  kind: {
    "ko": "없음 — 그리드(밀집, 다크)",
    "en": "None — grid (dense, dark)"
  },
  domain: "it",
  styles: [
    "control-room"
  ],
  summary: {
    "ko": "야간 근무자가 보는 밀집 다크 상황판 — 지난 6시간 추이선이 붙은 여섯 지표, 권역 × 서비스 가용률 격자, 지난주와 견준 최근 24시간 트래픽, 권역별·등급별 경보, 미해결 경보 목록, 백본 회선 사용률과 지연. 지도 없이 밀도로 읽는 화면. 예시 데이터입니다.",
    "en": "A dense dark wall for the night shift — six figures with the last six hours under each, a matrix of every region against every service, the last 24 hours of traffic over last week’s, alarms by region and severity, the alarms still open, and the backbone links’ load and round-trip time. No map: it reads by density. Example data."
  },
  connectors: [
    {
      "key": "nms",
      "name": "예시 망 관리 시스템(NMS)",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 통신망이 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
