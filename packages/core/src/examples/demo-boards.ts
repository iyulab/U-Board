// The development demo's boards: a floor plan of pumps (canvas), the same parts as a grid, a grid with the floor plan in
// a cell, and elements the board defines itself — read from the fixture adapter.

import type { Board } from '../board/types.js';

export const demoBoard: Board = {
  "data": {
    "state": {
      "from": "fixture",
      "ref": "pump-a.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump A"
        }
      }
    },
    "load": {
      "from": "fixture",
      "ref": "pump-a.load",
      "fields": {
        "value": {
          "at": "",
          "label": "Load %"
        }
      }
    },
    "state-2": {
      "from": "fixture",
      "ref": "pump-b.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump B"
        }
      }
    },
    "state-3": {
      "from": "fixture",
      "ref": "pump-c.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump C"
        }
      }
    },
    "trend": {
      "from": "fixture",
      "path": "/pump-a/load",
      "list": "/value",
      "fields": {
        "load": {
          "label": "Load %",
          "unit": "%"
        }
      }
    }
  },
  "parts": {
    "pump-a": {
      "as": "stat-list",
      "of": "state",
      "show": [
        "value"
      ]
    },
    "pump-a-load": {
      "as": "gauge",
      "of": "load",
      "show": "value",
      "title": "Load %",
      "max": 100
    },
    "pump-b": {
      "as": "stat-list",
      "of": "state-2",
      "show": [
        "value"
      ]
    },
    "pump-c": {
      "as": "stat-list",
      "of": "state-3",
      "show": [
        "value"
      ]
    },
    "pump-a-load-trend": {
      "as": "chart.line",
      "of": "trend",
      "title": "Pump A load",
      "x": "t",
      "y": [
        "load"
      ]
    },
    "small-gauge": {
      "as": "gauge",
      "of": "load",
      "show": "value"
    },
    "small-chart": {
      "as": "chart.line",
      "of": "trend",
      "x": "t",
      "y": [
        "load"
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      900,
      560
    ],
    "background": "data:image/svg+xml,%0A%20%20%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22900%22%20height%3D%22560%22%3E%0A%20%20%20%20%3Crect%20width%3D%22900%22%20height%3D%22560%22%20fill%3D%22%23f1f5f9%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22860%22%20height%3D%22520%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22450%22%20y%3D%22290%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20fill%3D%22%2394a3b8%22%0A%20%20%20%20%20%20%20%20%20%20text-anchor%3D%22middle%22%3Efloor%20plan%20(placeholder)%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E%0A",
    "place": {
      "pump-a": [
        120,
        120,
        180,
        90
      ],
      "pump-a-load": [
        340,
        120,
        160,
        130
      ],
      "pump-b": [
        120,
        300,
        180,
        90
      ],
      "pump-c": [
        340,
        300,
        180,
        90
      ],
      "pump-a-load-trend": [
        540,
        120,
        320,
        260
      ],
      "small-gauge": [
        540,
        400,
        160,
        140
      ],
      "small-chart": [
        720,
        400,
        160,
        140
      ]
    },
    "links": {
      "a-to-b": {
        "from": "pump-a",
        "to": "pump-b"
      }
    }
  },
  "triggers": [
    {
      "on": {
        "event": "click",
        "part": "pump-a"
      },
      "do": [
        {
          "action": "emit",
          "name": "pump-a-details"
        }
      ]
    }
  ]
};

export const demoGrid: Board = {
  "data": {
    "state": {
      "from": "fixture",
      "ref": "pump-a.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump A"
        }
      }
    },
    "load": {
      "from": "fixture",
      "ref": "pump-a.load",
      "fields": {
        "value": {
          "at": "",
          "label": "Load %"
        }
      }
    },
    "state-2": {
      "from": "fixture",
      "ref": "pump-b.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump B"
        }
      }
    },
    "state-3": {
      "from": "fixture",
      "ref": "pump-c.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump C"
        }
      }
    },
    "trend": {
      "from": "fixture",
      "path": "/pump-a/load",
      "list": "/value",
      "fields": {
        "load": {
          "label": "Load %",
          "unit": "%"
        }
      }
    }
  },
  "parts": {
    "pump-a": {
      "as": "stat-list",
      "of": "state",
      "show": [
        "value"
      ]
    },
    "pump-a-load": {
      "as": "gauge",
      "of": "load",
      "show": "value",
      "title": "Load %",
      "max": 100
    },
    "pump-b": {
      "as": "stat-list",
      "of": "state-2",
      "show": [
        "value"
      ]
    },
    "pump-c": {
      "as": "stat-list",
      "of": "state-3",
      "show": [
        "value"
      ]
    },
    "pump-a-load-trend": {
      "as": "chart.line",
      "of": "trend",
      "title": "Pump A load",
      "x": "t",
      "y": [
        "load"
      ]
    },
    "small-gauge": {
      "as": "gauge",
      "of": "load",
      "show": "value"
    },
    "small-chart": {
      "as": "chart.line",
      "of": "trend",
      "x": "t",
      "y": [
        "load"
      ]
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      [
        "pump-a",
        6
      ],
      [
        "pump-a-load",
        6
      ],
      [
        "pump-b",
        4
      ],
      [
        "pump-c",
        4
      ],
      [
        "pump-a-load-trend",
        4
      ],
      [
        "small-gauge",
        4
      ],
      [
        "small-chart",
        4
      ]
    ]
  }
};

export const demoMixed: Board = {
  "data": {
    "state": {
      "from": "fixture",
      "ref": "pump-a.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump A"
        }
      }
    },
    "load": {
      "from": "fixture",
      "ref": "pump-a.load",
      "fields": {
        "value": {
          "at": "",
          "label": "Load %"
        }
      }
    },
    "state-2": {
      "from": "fixture",
      "ref": "pump-b.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump B"
        }
      }
    },
    "state-3": {
      "from": "fixture",
      "ref": "pump-c.state",
      "fields": {
        "value": {
          "at": "",
          "label": "Pump C"
        }
      }
    },
    "trend": {
      "from": "fixture",
      "path": "/pump-a/load",
      "list": "/value",
      "fields": {
        "load": {
          "label": "Load %",
          "unit": "%"
        }
      }
    }
  },
  "parts": {
    "pump-a": {
      "as": "stat-list",
      "of": "state",
      "show": [
        "value"
      ]
    },
    "pump-a-load": {
      "as": "gauge",
      "of": "load",
      "show": "value",
      "title": "Load %",
      "max": 100
    },
    "pump-b": {
      "as": "stat-list",
      "of": "state-2",
      "show": [
        "value"
      ]
    },
    "pump-c": {
      "as": "stat-list",
      "of": "state-3",
      "show": [
        "value"
      ]
    },
    "pump-a-load-trend": {
      "as": "chart.line",
      "of": "trend",
      "title": "Pump A load",
      "x": "t",
      "y": [
        "load"
      ]
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      {
        "canvas": {
          "size": [
            900,
            560
          ],
          "background": "data:image/svg+xml,%0A%20%20%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22900%22%20height%3D%22560%22%3E%0A%20%20%20%20%3Crect%20width%3D%22900%22%20height%3D%22560%22%20fill%3D%22%23f1f5f9%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22860%22%20height%3D%22520%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22450%22%20y%3D%22290%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20fill%3D%22%2394a3b8%22%0A%20%20%20%20%20%20%20%20%20%20text-anchor%3D%22middle%22%3Efloor%20plan%20(placeholder)%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E%0A",
          "place": {
            "pump-a": [
              120,
              120,
              180,
              90
            ],
            "pump-a-load": [
              340,
              120,
              160,
              130
            ],
            "pump-b": [
              120,
              300,
              180,
              90
            ],
            "pump-c": [
              340,
              300,
              180,
              90
            ],
            "pump-a-load-trend": [
              540,
              120,
              320,
              260
            ]
          },
          "links": {
            "a-to-b": {
              "from": "pump-a",
              "to": "pump-b"
            }
          }
        },
        "span": 8
      }
    ]
  },
  "triggers": [
    {
      "on": {
        "event": "click",
        "part": "pump-a"
      },
      "do": [
        {
          "action": "emit",
          "name": "pump-a-details"
        }
      ]
    }
  ]
};

export const elementsDemo: Board = {
  "elements": {
    "pump": {
      "template": "<figure class=\"pump {{state}}\">\n  <svg viewBox=\"0 0 64 64\" role=\"img\" aria-label=\"{{name}}: {{state}}\">\n    <circle class=\"casing\" cx=\"32\" cy=\"32\" r=\"26\"/>\n    <g class=\"impeller\"><path d=\"M32 32 L32 12 A20 20 0 0 1 49 42 Z\"/><path d=\"M32 32 L15 42 A20 20 0 0 1 32 12 Z\" opacity=\".6\"/></g>\n    <circle cx=\"32\" cy=\"32\" r=\"4\" class=\"hub\"/>\n  </svg>\n  <figcaption>{{name}}{{#rpm}} · {{rpm}} rpm{{/rpm}}</figcaption>\n</figure>",
      "style": ".pump{margin:0;height:100%;display:grid;grid-template-rows:1fr auto;place-items:center;gap:4px}\nsvg{height:100%;max-height:120px}\n.casing{fill:var(--u-widget-surface);stroke:var(--state);stroke-width:4}\n.impeller path,.hub{fill:var(--state)}\n.run{--state:var(--u-widget-positive)} .stop{--state:var(--u-widget-text-secondary)} .fault{--state:var(--u-widget-negative)}\n.run .impeller{transform-origin:32px 32px;animation:spin 1.2s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\nfigcaption{font-size:13px;color:var(--u-widget-text-secondary)}",
      "props": {
        "name": "string",
        "state": "string",
        "rpm": "number"
      }
    },
    "ring": {
      "template": "<div class=\"ring\" style=\"--v: {{value}}\"><b>{{value}}%</b></div><p>{{label}}</p>",
      "style": ":host{display:grid;grid-template-rows:1fr auto;place-items:center;gap:4px}\n.ring{height:100%;aspect-ratio:1;max-height:120px;border-radius:50%;display:grid;place-items:center;\n  background:radial-gradient(closest-side,var(--u-widget-bg) 76%,transparent 77%),conic-gradient(var(--u-widget-primary) calc(var(--v) * 1%),var(--u-widget-surface) 0)}\nb{font:600 18px var(--u-widget-font-family)}\np{margin:0;font-size:13px;color:var(--u-widget-text-secondary)}",
      "props": {
        "label": "string",
        "value": "number"
      }
    },
    "tank": {
      "template": "<div class=\"tank\" style=\"--level: {{level}}\">\n  <div class=\"fill\"></div><span class=\"value\">{{level}}%</span>\n</div><p>{{name}}</p>",
      "style": ":host{display:grid;grid-template-rows:1fr auto;gap:4px}\n.tank{position:relative;border:2px solid var(--u-widget-border);border-radius:8px;overflow:hidden;background:var(--u-widget-surface)}\n.fill{position:absolute;inset:auto 0 0 0;height:calc(var(--level) * 1%);background:var(--u-widget-primary);opacity:.75}\n.value{position:absolute;inset:0;display:grid;place-items:center;font:600 20px var(--u-widget-font-family)}\np{margin:0;text-align:center;font-size:13px;color:var(--u-widget-text-secondary)}",
      "props": {
        "name": "string",
        "level": "number"
      }
    }
  },
  "parts": {
    "p-101": {
      "as": "element",
      "element": "pump",
      "props": {
        "name": "P-101",
        "state": "run",
        "rpm": 1450
      }
    },
    "p-102": {
      "as": "element",
      "element": "pump",
      "props": {
        "name": "P-102",
        "state": "stop"
      }
    },
    "p-103": {
      "as": "element",
      "element": "pump",
      "props": {
        "name": "P-103",
        "state": "fault",
        "rpm": 0
      }
    },
    "oee": {
      "as": "element",
      "element": "ring",
      "props": {
        "label": "OEE",
        "value": 72
      }
    },
    "t-1": {
      "as": "element",
      "element": "tank",
      "props": {
        "name": "Raw water",
        "level": 64
      }
    },
    "t-2": {
      "as": "element",
      "element": "tank",
      "props": {
        "name": "Clear well",
        "level": 18
      }
    },
    "avail": {
      "as": "element",
      "element": "ring",
      "props": {
        "label": "Availability",
        "value": 91
      }
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      { "id": "p-101", "span": 3, "height": 160 },
      { "id": "p-102", "span": 3, "height": 160 },
      { "id": "p-103", "span": 3, "height": 160 },
      { "id": "oee", "span": 3, "height": 160 },
      { "id": "t-1", "span": 4, "height": 160 },
      { "id": "t-2", "span": 4, "height": 160 },
      { "id": "avail", "span": 4, "height": 160 }
    ]
  }
};

/** Events placed by their own fields on an equirectangular world — each opens its own page when clicked. */
export const demoQuakes: Board = {
  board: { title: 'Earthquakes' },
  statuses: { big: { tone: 'alarm', label: 'Strong' }, mid: { tone: 'warn', label: 'Moderate' }, small: { tone: 'info', label: 'Light' } },
  data: {
    quakes: {
      from: 'fixture', path: '/quakes', list: '/features', key: 'id',
      fields: {
        lon: { at: '/geometry/coordinates/0' },
        lat: { at: '/geometry/coordinates/1' },
        mag: { at: '/properties/mag', state: ['small', 4, 'mid', 6, 'big'] },
      },
    },
  },
  parts: { quake: { as: 'marker', each: 'quakes', show: 'mag' } },
  layout: { kind: 'canvas', size: [720, 360], place: { quake: { at: ['lon', 'lat'], frame: [-180, 90, 180, -90], size: [16, 16] } } },
  triggers: [{ on: { event: 'click', part: 'quake' }, do: [{ action: 'open-link', url: '/events/{{key}}?mag={{mag}}' }] }],
};
