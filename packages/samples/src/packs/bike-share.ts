// A city's bike-share stations drawn in the Isotype manner of the 1930s picture statistics: flat colour on cream,
// a plain map of the river, the parks and the main roads, and quantities shown by counting one pictogram. Each station
// is a card with a bike for every bike in its rack and an empty outline for every free dock — so a full rack and an
// empty one are seen at a glance before any number is read; a red tag and red bikes where riders will find none, a blue
// tag where they cannot return one, grey where docks are out for repair. Two trucks moving bikes from full racks to
// empty ones follow dashed lines. On the right the rentals by the hour, one bike for twenty, the last one cut where
// the count falls short, and the trucks' jobs. The city is made up, so the values are example data.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/bike-share.js';

const board: Board = {
  "board": {
    "theme": "light",
    "accent": "#d23c2a"
  },
  "elements": {
    "station": {
      "template": "<section class=\"st {{s.state}}\"><header><b>{{s.name}}</b><span>{{s.word}}</span></header><p><i class=\"bk\" style=\"--n: {{s.bikes}}\"></i><i class=\"em\" style=\"--n: {{s.empty}}\"></i></p><small><b>{{s.bikes}}</b>대 · 빈 거치대 {{s.empty}}</small></section>",
      "style": ".st{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr auto;gap:4px;padding:8px 12px;background:#f3eee2;border-top:6px solid #1c1b19;font-family:\"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19}\nheader{display:flex;justify-content:space-between;align-items:center;gap:6px}\nb{font-size:16px;font-weight:700}\nspan{font-size:12px;font-weight:600;padding:1px 8px;color:#f3eee2;background:#1c1b19}\np{margin:0;display:flex;align-items:center}\ni{display:block;height:16px;width:calc(var(--n) * 20px);background-repeat:repeat-x;background-size:20px 16px}\n.bk{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22%231c1b19%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%220%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-opacity%3D%221%22%2F%3E%0A%3C%2Fsvg%3E\")}\n.em{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%23b5afa3%22%20stroke-width%3D%221.4%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%223.6%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%223.6%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%23b5afa3%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20%2F%3E%0A%3C%2Fsvg%3E\")}\nsmall{font-size:12px}\nsmall b{font-size:14px}\n.low{border-top-color:#d23c2a}\n.low span{background:#d23c2a}\n.low .bk{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22%23d23c2a%22%20stroke%3D%22%23d23c2a%22%20stroke-width%3D%220%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%23d23c2a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-opacity%3D%221%22%2F%3E%0A%3C%2Fsvg%3E\")}\n.full{border-top-color:#2a5aa8}\n.full span{background:#2a5aa8}\n.off{border-top-color:#b5afa3;background:repeating-linear-gradient(45deg,#f3eee2 0 8px,#e2dccd 8px 10px)}\n.off span{background:#b5afa3;color:#1c1b19}",
      "props": {
        "s": "object"
      }
    },
    "legend": {
      "template": "<ul class=\"lg\"><li><i class=\"bk\"></i>자전거 1대</li><li><i class=\"em\"></i>빈 거치대</li><li><u class=\"r\"></u>대여 어려움</li><li><u class=\"b\"></u>반납 어려움</li></ul>",
      "style": ".lg{height:100%;box-sizing:border-box;margin:0;padding:0 10px;list-style:none;display:flex;align-items:center;gap:16px;font:600 13px \"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19;background:#f3eee2}\nli{display:flex;align-items:center;gap:6px}\ni{width:20px;height:16px;background-size:20px 16px}\n.bk{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22%231c1b19%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%220%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-opacity%3D%221%22%2F%3E%0A%3C%2Fsvg%3E\")}\n.em{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22none%22%20stroke%3D%22%23b5afa3%22%20stroke-width%3D%221.4%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%223.6%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%223.6%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%23b5afa3%22%20stroke-width%3D%221.4%22%20stroke-linecap%3D%22round%22%20%2F%3E%0A%3C%2Fsvg%3E\")}\nu{width:18px;height:12px}\n.r{background:#d23c2a}\n.b{background:#2a5aa8}"
    },
    "title": {
      "template": "<header class=\"tt\"><h1>{{name}}</h1><p>{{sub}}</p><div><span>{{date}}</span><b>{{time}}</b></div></header>",
      "style": ".tt{height:100%;box-sizing:border-box;display:grid;align-content:center;gap:6px;font-family:\"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19}\nh1{margin:0;font-size:32px;font-weight:700;letter-spacing:.02em}\np{margin:0;font-size:15px}\ndiv{display:flex;align-items:center;gap:12px;padding-top:8px;border-top:4px solid #1c1b19}\nspan{font-size:16px}\nb{margin-left:auto;padding:0 10px;font-size:34px;font-weight:700;color:#f3eee2;background:#d23c2a}",
      "props": {
        "name": "string",
        "sub": "string",
        "date": "string",
        "time": "string"
      }
    },
    "figures": {
      "template": "<dl class=\"fg\">{{#items}}<div><dt>{{label}}</dt><dd>{{value}}</dd><small>{{note}}</small></div>{{/items}}</dl>",
      "style": ".fg{margin:0;height:100%;box-sizing:border-box;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-family:\"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19}\ndiv{display:grid;align-content:center;padding:6px 10px;border-left:6px solid #1c1b19;background:#ebe4d3}\ndt{font-size:12px;font-weight:600}\ndd{margin:0;font-size:30px;font-weight:700}\nsmall{font-size:11px}",
      "props": {
        "items": "list"
      }
    },
    "hours": {
      "template": "<section class=\"hr\"><h3>시간대별 대여 <small>기호 하나 = 20건</small></h3><ol>{{#items}}<li><b>{{hour}}</b><span><i style=\"--n: {{n}}\"></i><small>{{count}}</small></span></li>{{/items}}</ol></section>",
      "style": ".hr{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:10px;font-family:\"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19}\nh3{margin:0;font-size:18px;font-weight:700;border-bottom:4px solid #1c1b19;padding-bottom:6px}\nh3 small{font-size:13px;font-weight:500;margin-left:8px}\nol{margin:0;padding:0;list-style:none;display:grid;align-content:space-evenly}\nli{display:grid;grid-template-columns:52px 1fr;align-items:center;gap:8px}\nb{font-size:16px}\nspan{display:grid;gap:2px}\ni{display:block;height:16px;width:calc(var(--n) * 22px);background:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2216%22%20viewBox%3D%220%200%2020%2016%22%3E%0A%3Cg%20fill%3D%22%231c1b19%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%220%22%3E%0A%3Ccircle%20cx%3D%224.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%3Ccircle%20cx%3D%2215.5%22%20cy%3D%2211%22%20r%3D%224.2%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M%204.5%2011%20L%208%204.5%20L%2014%204.5%20L%2015.5%2011%20M%208%204.5%20L%2010%2011%20L%2014%204.5%20M%206.5%203%20H%209.5%20M%2013%202.5%20H%2015.5%22%20fill%3D%22none%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-opacity%3D%221%22%2F%3E%0A%3C%2Fsvg%3E\") repeat-x 0 0/22px 16px}\nspan small{font-size:12px}",
      "props": {
        "items": "list"
      }
    },
    "jobs": {
      "template": "<section class=\"jb\"><h3>재배치</h3><ul>{{#items}}<li><b>{{truck}}</b><span><em class=\"f\">{{from}}</em> → <em class=\"t\">{{to}}</em></span><small>{{bikes}} · {{eta}}</small></li>{{/items}}</ul></section>",
      "style": ".jb{height:100%;box-sizing:border-box;display:grid;grid-template-rows:auto 1fr;gap:8px;font-family:\"Jost\", \"Futura\", \"Century Gothic\", \"Noto Sans KR\", \"Malgun Gothic\", sans-serif;color:#1c1b19}\nh3{margin:0;font-size:18px;font-weight:700;border-bottom:4px solid #1c1b19;padding-bottom:6px}\nul{margin:0;padding:0;list-style:none;display:grid;align-content:start;gap:8px}\nli{display:grid;grid-template-columns:64px 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center}\nb{grid-row:span 2;font-size:15px;padding:6px 0;text-align:center;color:#f3eee2;background:#1c1b19}\nem{font-style:normal;font-weight:700;padding:0 6px}\n.f{color:#f3eee2;background:#2a5aa8}\n.t{color:#f3eee2;background:#d23c2a}\nsmall{font-size:12px}",
      "props": {
        "items": "list"
      }
    }
  },
  "data": {
    "stations": {
      "from": "bikes",
      "path": "/bikes/stations",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
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
        "s7": {
          "at": "/value/s7"
        },
        "s8": {
          "at": "/value/s8"
        },
        "s9": {
          "at": "/value/s9"
        },
        "s10": {
          "at": "/value/s10"
        }
      }
    },
    "now": {
      "from": "bikes",
      "path": "/bikes/now",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "name": {},
        "sub": {},
        "date": {},
        "time": {}
      }
    },
    "figures": {
      "from": "bikes",
      "path": "/bikes/figures",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "hours": {
      "from": "bikes",
      "path": "/bikes/hours",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "jobs": {
      "from": "bikes",
      "path": "/bikes/jobs",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "value": {}
      }
    },
    "trucks": {
      "from": "bikes",
      "path": "/bikes/trucks",
      "time": "updatedAt",
      "fresh": 300,
      "fields": {
        "t1": {
          "at": "/value/t1"
        },
        "t2": {
          "at": "/value/t2"
        }
      }
    }
  },
  "parts": {
    "station-s1": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s1"
      }
    },
    "station-s2": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s2"
      }
    },
    "station-s3": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s3"
      }
    },
    "station-s4": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s4"
      }
    },
    "station-s5": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s5"
      }
    },
    "station-s6": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s6"
      }
    },
    "station-s7": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s7"
      }
    },
    "station-s8": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s8"
      }
    },
    "station-s9": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s9"
      }
    },
    "station-s10": {
      "as": "element",
      "element": "station",
      "of": "stations",
      "bind": {
        "s": "s10"
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
    "figures": {
      "as": "element",
      "element": "figures",
      "of": "figures",
      "bind": {
        "items": "value"
      }
    },
    "hours": {
      "as": "element",
      "element": "hours",
      "of": "hours",
      "bind": {
        "items": "value"
      }
    },
    "jobs": {
      "as": "element",
      "element": "jobs",
      "of": "jobs",
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
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221600%22%20height%3D%221000%22%20viewBox%3D%220%200%201600%201000%22%3E%0A%3Crect%20width%3D%221600%22%20height%3D%221000%22%20fill%3D%22%23f3eee2%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%2240%22%20width%3D%221040%22%20height%3D%22920%22%20fill%3D%22%23ebe4d3%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22250%22%20width%3D%22300%22%20height%3D%22100%22%20fill%3D%22%23e3a72f%22%20fill-opacity%3D%22.45%22%2F%3E%0A%3Crect%20x%3D%2240%22%20y%3D%22840%22%20width%3D%22360%22%20height%3D%22120%22%20fill%3D%22%23e3a72f%22%20fill-opacity%3D%22.45%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20560%20C%20300%20600%2C%20600%20540%2C%201080%20600%20L%201080%20660%20C%20600%20600%2C%20300%20660%2C%2040%20625%20Z%22%20fill%3D%22%232a5aa8%22%20fill-opacity%3D%22.85%22%2F%3E%0A%3Cpath%20d%3D%22M%2040%20300%20H%201080%20M%2040%20520%20H%201080%20M%20360%2040%20V%20960%20M%20720%2040%20V%20960%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%226%22%20stroke-opacity%3D%22.18%22%2F%3E%0A%3Crect%20x%3D%22348%22%20y%3D%22560%22%20width%3D%2224%22%20height%3D%2296%22%20fill%3D%22%231c1b19%22%2F%3E%3Crect%20x%3D%22708%22%20y%3D%22560%22%20width%3D%2224%22%20height%3D%2296%22%20fill%3D%22%231c1b19%22%2F%3E%0A%3Ctext%20x%3D%221060%22%20y%3D%22640%22%20text-anchor%3D%22end%22%20fill%3D%22%23f3eee2%22%20font-size%3D%2218%22%20font-family%3D'%22Jost%22%2C%20%22Futura%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20font-weight%3D%22600%22%20letter-spacing%3D%22.2em%22%3E%EA%B0%80%EB%9E%8C%EC%B2%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22335%22%20fill%3D%22%231c1b19%22%20font-size%3D%2215%22%20font-family%3D'%22Jost%22%2C%20%22Futura%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.15em%22%3E%EA%B0%95%EB%B3%80%EA%B3%B5%EC%9B%90%3C%2Ftext%3E%0A%3Ctext%20x%3D%2256%22%20y%3D%22945%22%20fill%3D%22%231c1b19%22%20font-size%3D%2215%22%20font-family%3D'%22Jost%22%2C%20%22Futura%22%2C%20%22Century%20Gothic%22%2C%20%22Noto%20Sans%20KR%22%2C%20%22Malgun%20Gothic%22%2C%20sans-serif'%20letter-spacing%3D%22.15em%22%3E%EC%B2%B4%EC%9C%A1%EA%B3%B5%EC%9B%90%3C%2Ftext%3E%0A%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%221080%22%20height%3D%22960%22%20fill%3D%22none%22%20stroke%3D%22%231c1b19%22%20stroke-width%3D%223%22%2F%3E%0A%3C%2Fsvg%3E",
    "place": {
      "station-s1": [
        70,
        110,
        224,
        104
      ],
      "station-s2": [
        320,
        80,
        224,
        104
      ],
      "station-s3": [
        580,
        110,
        224,
        104
      ],
      "station-s4": [
        830,
        150,
        224,
        104
      ],
      "station-s5": [
        100,
        380,
        224,
        104
      ],
      "station-s6": [
        420,
        350,
        224,
        104
      ],
      "station-s7": [
        780,
        400,
        224,
        104
      ],
      "station-s8": [
        80,
        700,
        224,
        104
      ],
      "station-s9": [
        420,
        690,
        224,
        104
      ],
      "station-s10": [
        790,
        730,
        224,
        104
      ],
      "legend": [
        560,
        900,
        470,
        34
      ],
      "title": [
        1120,
        30,
        460,
        160
      ],
      "figures": [
        1120,
        210,
        460,
        96
      ],
      "hours": [
        1120,
        330,
        460,
        290
      ],
      "jobs": [
        1120,
        650,
        460,
        150
      ]
    },
    "links": {
      "truck-t1": {
        "from": "station-s5",
        "to": "station-s3",
        "label": "{{t1}}",
        "tone": "next",
        "of": "trucks",
        "width": 4,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      },
      "truck-t2": {
        "from": "station-s10",
        "to": "station-s7",
        "label": "{{t2}}",
        "tone": "next",
        "of": "trucks",
        "width": 4,
        "dash": true,
        "arrow": "end",
        "route": "curved"
      }
    }
  }
};

export const bikeShare: SamplePack = {
  id: "bike-share",
  title: {
    "ko": "공공자전거 대여소 — 아이소타입",
    "en": "A city’s bike-share stations — Isotype"
  },
  field: {
    "ko": "공공자전거·도시 교통",
    "en": "Bike share & city transport"
  },
  kind: {
    "ko": "대여소별 자전거와 빈 거치대",
    "en": "Bikes and free docks at each station"
  },
  domain: "transport",
  styles: [
    "print"
  ],
  summary: {
    "ko": "도시 공공자전거 대여소 현황을 1930년대 아이소타입 그림 통계로 — 크림 바탕의 평평한 색, 강·공원·큰길만 남긴 지도, 양은 같은 기호를 세어서. 대여소마다 거치된 자전거 한 대에 자전거 기호 하나, 빈 거치대마다 빈 윤곽 하나라 숫자를 읽기 전에 꽉 찬 곳과 빈 곳이 보입니다 — 빌릴 자전거가 없으면 빨간 꼬리표와 빨간 자전거, 반납할 칸이 없으면 파란 꼬리표, 거치대 점검은 회색. 꽉 찬 곳에서 빈 곳으로 자전거를 옮기는 트럭 둘은 점선으로. 오른쪽에 지금 달리는 자전거·오늘 대여·재배치, 시간대별 대여(기호 하나 = 20건, 모자란 끝은 기호를 잘라), 트럭 작업. 도시는 지어낸 것이라 예시 데이터입니다.",
    "en": "A city’s bike-share stations as 1930s Isotype picture statistics — flat colour on cream, a map kept to the river, the parks and the main roads, and quantities shown by counting one symbol. Each station shows a bike for every bike in its rack and an empty outline for every free dock, so full racks and empty ones are seen before any number is read: a red tag and red bikes where there is none to rent, a blue tag where there is no dock to return to, grey where docks are out for repair. Two trucks moving bikes from full racks to empty ones follow dashed lines. On the right the bikes out now, the day’s rentals and the trucks running, the rentals by the hour (one bike for twenty, the last one cut where the count falls short) and the trucks’ jobs. The city is made up. Example data."
  },
  connectors: [
    {
      "key": "bikes",
      "name": "예시 공공자전거 API",
      "example": true,
      "attribution": {
        "text": "예시 데이터 — 실제 도시가 아닙니다"
      }
    }
  ],
  board,
  snapshot,
};
