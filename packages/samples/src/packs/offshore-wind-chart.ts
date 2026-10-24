// An offshore wind farm drawn as a nautical chart: pale sea with depth contours and scattered soundings, buff land with its
// coastline, a graduated border, a compass rose, black chart lettering in italic for the sea and upright for the land. The
// turbines stand in three strings, each a chart-style box with its output; the inter-array and export cables run in
// magenta, as charts draw submarine cables, and a faulted length turns red and dashed. The service vessels, the weather
// buoy and the shore substation sit where they are. A turbine's state is told by a sign as well as a colour — a full disc
// generating, a half disc curtailed, a diamond under maintenance, a cross faulted. On the right a cartouche with the
// farm's name, the figures now, the key and the output through the day. The farm is made up, so the values are example
// data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/offshore-wind-chart.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#c2187a"
  },
  "statuses": {
    "fault": {
      "tone": "alarm",
      "emphasis": "hatch"
    }
  },
  "elements": {
    "turbine": {
      "template": "<section class=\"wt {{t.state}}\"><i></i><b>{{t.name}}</b><strong>{{t.mw}}</strong><small>{{t.note}}</small></section>",
      "style": ".wt{height:100%;box-sizing:border-box;display:grid;grid-template-columns:22px 1fr;grid-template-rows:auto auto auto;column-gap:6px;align-items:center;padding:5px 7px;background:#fbf8ef;border:1.5px solid #1f2a33;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#1f2a33}\ni{grid-row:span 2;width:18px;height:18px;box-sizing:border-box;border:2px solid #1f2a33;border-radius:50%}\nb{font-size:15px;font-weight:700}\nstrong{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}\nsmall{grid-column:span 2;font-size:12px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.run i{background:#1f2a33}\n.limit i{background:linear-gradient(90deg,#1f2a33 50%,transparent 50%)}\n.service i{border-radius:0;transform:rotate(45deg) scale(.8);background:#7fb0cc}\n.fault{border-color:#d1342b;border-width:2.5px}\n.fault i{border:none;border-radius:0;background:none;position:relative}\n.fault i::before,.fault i::after{content:\"\";position:absolute;left:8px;top:-1px;width:3px;height:20px;background:#d1342b;transform:rotate(45deg)}\n.fault i::after{transform:rotate(-45deg)}\n.fault small{color:#d1342b}",
      "props": {
        "t": "object"
      }
    },
    "mark": {
      "template": "<section class=\"mk {{m.kind}}\"><b>{{m.name}}</b><span>{{m.text}}</span></section>",
      "style": ".mk{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:2px;padding:4px 10px;background:#fbf8ef;border:1.5px solid #1f2a33;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#1f2a33}\nb{font-size:15px;font-weight:700}\nspan{font-size:13px;font-style:italic}\n.station{border-width:3px;border-style:double}\n.vessel{border-radius:999px 999px 999px 4px;padding-left:16px}\n.buoy{border-color:#c2187a}\n.buoy b{color:#c2187a}",
      "props": {
        "m": "object"
      }
    },
    "cartouche": {
      "template": "<header class=\"ct\"><small>{{c.series}}</small><h1>{{c.name}}</h1><p>{{c.sub}}</p><div><span>{{c.date}}</span><b>{{c.time}}</b></div></header>",
      "style": ".ct{height:100%;box-sizing:border-box;display:grid;align-content:center;justify-items:center;gap:4px;padding:12px 20px;background:#fbf8ef;border:3px double #1f2a33;outline:1px solid #1f2a33;outline-offset:-10px;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#1f2a33;text-align:center}\nsmall{font-size:13px;letter-spacing:.3em}\nh1{margin:0;font-size:32px;font-weight:700;letter-spacing:.08em}\np{margin:0;font-size:15px;font-style:italic}\ndiv{display:flex;gap:16px;align-items:baseline}\nspan{font-size:15px}\nb{font-size:26px}",
      "props": {
        "c": "object"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);border:1.5px solid #1f2a33;background:#fbf8ef;font-family:\"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#1f2a33}\ndiv{display:grid;align-content:center;justify-items:center;text-align:center;padding:4px}\ndiv+div{border-left:1px solid #1f2a33}\ndt{font-size:14px;font-style:italic}\ndd{margin:0;font-size:28px;font-weight:700}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"run\"></i>발전</li><li><i class=\"limit\"></i>출력 제한</li><li><i class=\"service\"></i>정비</li><li><i class=\"fault\">✕</i>고장</li><li><u></u>해저 케이블</li><li><u class=\"cut\"></u>케이블 고장</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:8px 16px;list-style:none;display:grid;grid-template-columns:repeat(3,1fr);align-content:center;gap:8px 12px;border:1.5px solid #1f2a33;background:#fbf8ef;font:14px \"Noto Serif KR\", \"Batang\", \"Georgia\", serif;color:#1f2a33}\nli{display:flex;align-items:center;gap:8px;white-space:nowrap}\ni{width:16px;height:16px;box-sizing:border-box;border:2px solid #1f2a33;border-radius:50%;display:grid;place-items:center;font-style:normal}\n.run{background:#1f2a33}\n.limit{background:linear-gradient(90deg,#1f2a33 50%,transparent 50%)}\n.service{border-radius:0;transform:rotate(45deg) scale(.8);background:#7fb0cc}\n.fault{border:none;color:#d1342b;font-weight:900;font-size:16px}\nu{width:30px;height:0;border-top:3px solid #c2187a}\nu.cut{border-top:3px dashed #d1342b}"
    }
  },
  "data": {
    "turbines": {
      "from": "farm",
      "path": "/farm/turbines",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "a1": {
          "at": "/value/a1"
        },
        "a2": {
          "at": "/value/a2"
        },
        "a3": {
          "at": "/value/a3"
        },
        "a4": {
          "at": "/value/a4"
        },
        "b1": {
          "at": "/value/b1"
        },
        "b2": {
          "at": "/value/b2"
        },
        "b3": {
          "at": "/value/b3"
        },
        "b4": {
          "at": "/value/b4"
        },
        "c1": {
          "at": "/value/c1"
        },
        "c2": {
          "at": "/value/c2"
        },
        "c3": {
          "at": "/value/c3"
        },
        "c4": {
          "at": "/value/c4"
        }
      }
    },
    "marks": {
      "from": "farm",
      "path": "/farm/marks",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "oss": {
          "at": "/value/oss"
        },
        "shore": {
          "at": "/value/shore"
        },
        "ctv1": {
          "at": "/value/ctv1"
        },
        "ctv2": {
          "at": "/value/ctv2"
        },
        "buoy": {
          "at": "/value/buoy"
        }
      }
    },
    "now": {
      "from": "farm",
      "path": "/farm/now",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "figures": {
      "from": "farm",
      "path": "/farm/figures",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "farm",
      "path": "/farm/hours",
      "list": "/value",
      "fresh": 180,
      "answerTime": "/updatedAt"
    },
    "cables": {
      "from": "farm",
      "path": "/farm/cables",
      "time": "updatedAt",
      "fresh": 180,
      "fields": {
        "state": {
          "at": "/value/a0/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-2": {
          "at": "/value/a1/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-3": {
          "at": "/value/a2/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-4": {
          "at": "/value/a3/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-5": {
          "at": "/value/b0/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-6": {
          "at": "/value/b1/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-7": {
          "at": "/value/b2/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-8": {
          "at": "/value/b3/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-9": {
          "at": "/value/c0/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-10": {
          "at": "/value/c1/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-11": {
          "at": "/value/c2/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-12": {
          "at": "/value/c3/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        },
        "state-13": {
          "at": "/value/export/state",
          "state": {
            "ok": "alarm",
            "fault": "fault",
            "*": "alarm"
          }
        }
      }
    }
  },
  "parts": {
    "turbine-a1": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "a1"
      }
    },
    "turbine-a2": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "a2"
      }
    },
    "turbine-a3": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "a3"
      }
    },
    "turbine-a4": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "a4"
      }
    },
    "turbine-b1": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "b1"
      }
    },
    "turbine-b2": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "b2"
      }
    },
    "turbine-b3": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "b3"
      }
    },
    "turbine-b4": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "b4"
      }
    },
    "turbine-c1": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "c1"
      }
    },
    "turbine-c2": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "c2"
      }
    },
    "turbine-c3": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "c3"
      }
    },
    "turbine-c4": {
      "as": "element",
      "element": "turbine",
      "of": "turbines",
      "bind": {
        "t": "c4"
      }
    },
    "oss": {
      "as": "element",
      "element": "mark",
      "of": "marks",
      "bind": {
        "m": "oss"
      }
    },
    "shore": {
      "as": "element",
      "element": "mark",
      "of": "marks",
      "bind": {
        "m": "shore"
      }
    },
    "ctv1": {
      "as": "element",
      "element": "mark",
      "of": "marks",
      "bind": {
        "m": "ctv1"
      }
    },
    "ctv2": {
      "as": "element",
      "element": "mark",
      "of": "marks",
      "bind": {
        "m": "ctv2"
      }
    },
    "buoy": {
      "as": "element",
      "element": "mark",
      "of": "marks",
      "bind": {
        "m": "buoy"
      }
    },
    "cartouche": {
      "as": "element",
      "element": "cartouche",
      "of": "now",
      "bind": {
        "c": "value"
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
    "legend": {
      "as": "element",
      "element": "legend"
    },
    "output": {
      "as": "chart.area",
      "of": "hours",
      "title": "오늘 시간별 평균 출력(MW) — 설비 120 MW",
      "x": "hour",
      "y": "mw",
      "series": [
        {
          "label": "출력",
          "color": "#c2187a"
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23fbf8ef%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%221072%22%20height%3D%22944%22%20fill%3D%22%23eef6f9%22%2F%3E%0A%3Cpath%20d%3D%22M28%2028%20H560%20C520%2090%20470%20120%20420%20150%20C360%20190%20300%20210%20250%20260%20C200%20310%20140%20330%2028%20360%20Z%22%20fill%3D%22%23cfe6f1%22%2F%3E%0A%3Cpath%20d%3D%22M28%2028%20H500%20C470%2070%20420%20100%20370%20120%20C310%20145%20250%20160%20200%20200%20C150%20240%20100%20260%2028%20280%20Z%22%20fill%3D%22%23f1e3bd%22%20stroke%3D%22%231f2a33%22%20stroke-width%3D%221.5%22%2F%3E%0A%3Cpath%20d%3D%22M28%20450%20C200%20420%20330%20330%20480%20240%20C620%20160%20800%20120%201100%2090%22%20stroke%3D%22%237fb0cc%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%20stroke-dasharray%3D%2210%204%202%204%22%2F%3E%0A%3Cpath%20d%3D%22M28%20640%20C260%20600%20420%20520%20600%20420%20C780%20330%20940%20300%201100%20280%22%20stroke%3D%22%237fb0cc%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%20stroke-dasharray%3D%2210%204%202%204%202%204%22%2F%3E%0A%3Cpath%20d%3D%22M28%20860%20C300%20820%20520%20760%20720%20650%20C880%20570%20990%20540%201100%20520%22%20stroke%3D%22%237fb0cc%22%20stroke-width%3D%221.4%22%20fill%3D%22none%22%2F%3E%0A%3Ctext%20x%3D%22860%22%20y%3D%22124%22%20fill%3D%22%237fb0cc%22%20font-size%3D%2213%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E10%3C%2Ftext%3E%0A%3Ctext%20x%3D%22640%22%20y%3D%22440%22%20fill%3D%22%237fb0cc%22%20font-size%3D%2213%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E20%3C%2Ftext%3E%0A%3Ctext%20x%3D%22700%22%20y%3D%22680%22%20fill%3D%22%237fb0cc%22%20font-size%3D%2213%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E30%3C%2Ftext%3E%0A%3Ctext%20x%3D%22600%22%20y%3D%22120%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E8%3C%2Ftext%3E%3Ctext%20x%3D%22760%22%20y%3D%22160%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E11%3C%2Ftext%3E%3Ctext%20x%3D%22930%22%20y%3D%22110%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E12%3C%2Ftext%3E%3Ctext%20x%3D%221040%22%20y%3D%22220%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E15%3C%2Ftext%3E%3Ctext%20x%3D%22440%22%20y%3D%22420%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E13%3C%2Ftext%3E%3Ctext%20x%3D%22700%22%20y%3D%22430%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E17%3C%2Ftext%3E%3Ctext%20x%3D%221040%22%20y%3D%22420%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E19%3C%2Ftext%3E%3Ctext%20x%3D%22460%22%20y%3D%22600%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E18%3C%2Ftext%3E%3Ctext%20x%3D%22690%22%20y%3D%22610%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E21%3C%2Ftext%3E%3Ctext%20x%3D%221050%22%20y%3D%22600%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E23%3C%2Ftext%3E%3Ctext%20x%3D%22380%22%20y%3D%22760%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E20%3C%2Ftext%3E%3Ctext%20x%3D%22620%22%20y%3D%22800%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E24%3C%2Ftext%3E%3Ctext%20x%3D%22760%22%20y%3D%22900%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E27%3C%2Ftext%3E%3Ctext%20x%3D%221040%22%20y%3D%22880%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E29%3C%2Ftext%3E%3Ctext%20x%3D%22200%22%20y%3D%22640%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E14%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%22450%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E7%3C%2Ftext%3E%3Ctext%20x%3D%22300%22%20y%3D%22920%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.75%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E22%3C%2Ftext%3E%0A%3Ctext%20x%3D%2260%22%20y%3D%2280%22%20fill%3D%22%231f2a33%22%20font-size%3D%2224%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-weight%3D%22700%22%20letter-spacing%3D%22.3em%22%3E%EB%88%84%20%EB%A6%AC%20%EA%B3%B6%3C%2Ftext%3E%0A%3Ctext%20x%3D%22600%22%20y%3D%22960%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.7%22%20font-size%3D%2226%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%20letter-spacing%3D%22.6em%22%3E%EB%88%84%20%EB%A6%AC%20%ED%95%B4%3C%2Ftext%3E%0A%3Crect%20x%3D%22400%22%20y%3D%22250%22%20width%3D%22660%22%20height%3D%22510%22%20fill%3D%22none%22%20stroke%3D%22%23c2187a%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%2214%206%22%2F%3E%0A%3Ctext%20x%3D%22410%22%20y%3D%22244%22%20fill%3D%22%23c2187a%22%20font-size%3D%2214%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-style%3D%22italic%22%3E%ED%92%8D%EB%A0%A5%EB%B0%9C%EC%A0%84%EA%B5%AC%EC%97%AD%20%C2%B7%20%ED%95%AD%ED%96%89%20%EC%A0%9C%ED%95%9C%3C%2Ftext%3E%0A%3Cg%20transform%3D%22translate(170%20820)%22%20stroke%3D%22%231f2a33%22%20stroke-width%3D%221.2%22%20fill%3D%22none%22%3E%0A%3Ccircle%20r%3D%2270%22%2F%3E%3Ccircle%20r%3D%2262%22%2F%3E%3Ccircle%20r%3D%2240%22%20stroke-dasharray%3D%222%204%22%2F%3E%0A%3Cpath%20d%3D%22M0%20-70%20L8%200%20L0%2070%20L-8%200%20Z%20M-70%200%20L0%208%20L70%200%20L0%20-8%20Z%22%20fill%3D%22%231f2a33%22%20fill-opacity%3D%22.85%22%2F%3E%0A%3Cpath%20d%3D%22M0%20-70%20L8%200%20L-8%200%20Z%22%20fill%3D%22%23c2187a%22%20stroke%3D%22none%22%2F%3E%0A%3Ctext%20y%3D%22-78%22%20text-anchor%3D%22middle%22%20fill%3D%22%231f2a33%22%20stroke%3D%22none%22%20font-size%3D%2218%22%20font-family%3D'%22Noto%20Serif%20KR%22%2C%20%22Batang%22%2C%20%22Georgia%22%2C%20serif'%20font-weight%3D%22700%22%3EN%3C%2Ftext%3E%3C%2Fg%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221088%22%20height%3D%22960%22%20fill%3D%22none%22%20stroke%3D%22%231f2a33%22%20stroke-width%3D%222%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%221072%22%20height%3D%22944%22%20fill%3D%22none%22%20stroke%3D%22%231f2a33%22%20stroke-width%3D%221%22%2F%3E%0A%3Crect%20x%3D%2228%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2268%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22108%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22148%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22188%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22228%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22268%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22308%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22348%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22388%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22428%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22468%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22508%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22548%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22588%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22628%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22668%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22708%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22748%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22788%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22828%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22868%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22908%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22948%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22988%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221028%22%20y%3D%2220%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2228%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2268%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22108%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22148%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22188%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22228%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22268%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22308%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22348%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22388%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22428%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22468%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22508%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22548%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22588%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22628%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22668%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22708%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22748%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22788%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22828%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22868%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22908%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%22948%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%22988%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221028%22%20y%3D%22972%22%20width%3D%2240%22%20height%3D%228%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2228%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2268%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22108%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22148%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22188%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22228%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22268%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22308%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22348%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22388%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22428%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22468%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22508%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22548%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22588%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22628%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22668%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22708%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22748%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22788%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22828%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22868%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22908%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%2228%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%2268%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22108%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22148%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22188%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22228%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22268%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22308%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22348%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22388%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22428%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22468%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22508%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22548%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22588%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22628%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22668%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22708%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22748%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22788%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22828%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22868%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%23fbf8ef%22%2F%3E%3Crect%20x%3D%221100%22%20y%3D%22908%22%20width%3D%228%22%20height%3D%2240%22%20fill%3D%22%231f2a33%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "turbine-a1": [
        450,
        300,
        96,
        70
      ],
      "turbine-a2": [
        620,
        300,
        96,
        70
      ],
      "turbine-a3": [
        790,
        300,
        96,
        70
      ],
      "turbine-a4": [
        960,
        300,
        96,
        70
      ],
      "turbine-b1": [
        450,
        480,
        96,
        70
      ],
      "turbine-b2": [
        620,
        480,
        96,
        70
      ],
      "turbine-b3": [
        790,
        480,
        96,
        70
      ],
      "turbine-b4": [
        960,
        480,
        96,
        70
      ],
      "turbine-c1": [
        450,
        660,
        96,
        70
      ],
      "turbine-c2": [
        620,
        660,
        96,
        70
      ],
      "turbine-c3": [
        790,
        660,
        96,
        70
      ],
      "turbine-c4": [
        960,
        660,
        96,
        70
      ],
      "oss": [
        230,
        470,
        160,
        60
      ],
      "shore": [
        60,
        120,
        170,
        60
      ],
      "ctv1": [
        720,
        400,
        170,
        60
      ],
      "ctv2": [
        260,
        330,
        170,
        60
      ],
      "buoy": [
        860,
        830,
        200,
        60
      ],
      "cartouche": [
        1130,
        30,
        460,
        170
      ],
      "figures": [
        1130,
        220,
        460,
        110
      ],
      "legend": [
        1130,
        350,
        460,
        90
      ],
      "output": [
        1130,
        460,
        460,
        500
      ]
    },
    "links": {
      "cable-a0": {
        "from": "oss",
        "to": "turbine-a1",
        "show": "state",
        "of": "cables",
        "width": 3
      },
      "cable-a1": {
        "from": "turbine-a1",
        "to": "turbine-a2",
        "show": "state-2",
        "of": "cables",
        "width": 3
      },
      "cable-a2": {
        "from": "turbine-a2",
        "to": "turbine-a3",
        "show": "state-3",
        "of": "cables",
        "width": 3
      },
      "cable-a3": {
        "from": "turbine-a3",
        "to": "turbine-a4",
        "show": "state-4",
        "of": "cables",
        "width": 3
      },
      "cable-b0": {
        "from": "oss",
        "to": "turbine-b1",
        "show": "state-5",
        "of": "cables",
        "width": 3
      },
      "cable-b1": {
        "from": "turbine-b1",
        "to": "turbine-b2",
        "show": "state-6",
        "of": "cables",
        "width": 3
      },
      "cable-b2": {
        "from": "turbine-b2",
        "to": "turbine-b3",
        "show": "state-7",
        "of": "cables",
        "width": 3
      },
      "cable-b3": {
        "from": "turbine-b3",
        "to": "turbine-b4",
        "show": "state-8",
        "of": "cables",
        "width": 3
      },
      "cable-c0": {
        "from": "oss",
        "to": "turbine-c1",
        "show": "state-9",
        "of": "cables",
        "width": 3
      },
      "cable-c1": {
        "from": "turbine-c1",
        "to": "turbine-c2",
        "show": "state-10",
        "of": "cables",
        "width": 3
      },
      "cable-c2": {
        "from": "turbine-c2",
        "to": "turbine-c3",
        "show": "state-11",
        "of": "cables",
        "width": 3
      },
      "cable-c3": {
        "from": "turbine-c3",
        "to": "turbine-c4",
        "show": "state-12",
        "of": "cables",
        "width": 3
      },
      "cable-export": {
        "from": "oss",
        "to": "shore",
        "show": "state-13",
        "of": "cables",
        "width": 3,
        "route": "curved"
      }
    }
  }
};

export const offshoreWindChart: SamplePack = {
  id: "offshore-wind-chart",
  title: {
    "ko": "해상풍력단지 — 해도",
    "en": "An offshore wind farm — a nautical chart"
  },
  field: {
    "ko": "해상풍력·재생에너지",
    "en": "Offshore wind"
  },
  kind: {
    "ko": "발전기 상태·해저 케이블·정비선",
    "en": "Turbines, submarine cables and service vessels"
  },
  domain: "energy",
  styles: [
    "drawing"
  ],
  summary: {
    "ko": "해상풍력단지를 해도로 — 등심선과 흩어진 수심 숫자가 있는 옅은 바다, 해안선을 두른 담황색 육지, 눈금 테두리, 나침도, 바다는 기울인 글자·땅은 바른 글자. 발전기 열둘이 세 줄로 서고, 줄 사이 해저 케이블과 육지로 가는 송전 케이블은 해도가 해저 케이블을 그리듯 자홍색 — 고장 난 구간은 빨간 점선. 정비선 둘, 기상 부이, 해상·육상 변전소는 제자리에. 발전기 상태는 색과 함께 기호로: 꽉 찬 원 발전, 반원 출력 제한, 마름모 정비, ✕ 고장. 오른쪽에 단지 이름 표제, 지금 수치, 범례, 오늘 시간별 출력. 단지는 지어낸 것이라 예시 데이터입니다.",
    "en": "An offshore wind farm drawn as a nautical chart — pale sea with depth contours and scattered soundings, buff land inside its coastline, a graduated border, a compass rose, italic lettering on the sea and upright on the land. Twelve turbines stand in three strings; the inter-array cables and the export cable to shore run in magenta, as charts draw submarine cables, and a faulted length turns red and dashed. Two service vessels, a weather buoy and the substations sit where they are. A turbine tells its state with a sign as well as a colour — a full disc generating, a half disc curtailed, a diamond under maintenance, a cross faulted. On the right a cartouche with the farm’s name, the figures now, the key and the output through the day. The farm is made up. Example data."
  },
  connectors: [
    {
      "key": "farm",
      "name": "예시 풍력단지 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 풍력단지가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
