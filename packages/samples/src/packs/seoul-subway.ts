// The next train each way at five stations around Seoul City Hall, from the city's real-time subway arrivals,
// drawn on a diagram of the two lines that cross there. The source publishes no key to try with: each user
// registers for one, and an installation creating this sample asks for it.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/seoul-subway.js';

const board: Board = {
  "data": {
    "jonggak": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%A2%85%EA%B0%81",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1001"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "종로3가 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "시청 방면",
          "at": "/arvlMsg2"
        }
      }
    },
    "city-hall-line-1": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%8B%9C%EC%B2%AD",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1001"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "1호선 종각 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "1호선 서울역 방면",
          "at": "/arvlMsg2"
        }
      }
    },
    "city-hall-line-2": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%8B%9C%EC%B2%AD",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1002"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "2호선 을지로입구 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "2호선 충정로 방면",
          "at": "/arvlMsg2"
        }
      }
    },
    "chungjeongno": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%B6%A9%EC%A0%95%EB%A1%9C",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1002"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "시청 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "아현 방면",
          "at": "/arvlMsg2"
        }
      }
    },
    "euljiro-1ga": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%9D%84%EC%A7%80%EB%A1%9C%EC%9E%85%EA%B5%AC",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1002"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "을지로3가 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "시청 방면",
          "at": "/arvlMsg2"
        }
      }
    },
    "seoul-station": {
      "from": "seoul-subway",
      "path": "/json/realtimeStationArrival/0/30/%EC%84%9C%EC%9A%B8",
      "list": "/realtimeArrivalList",
      "key": "updnLine",
      "where": {
        "subwayId": "1001"
      },
      "time": "recptnDt",
      "zone": "Asia/Seoul",
      "fresh": 600,
      "fields": {
        "arvlMsg2": {
          "label": "시청 방면"
        },
        "arvlCd": {
          "state": {
            "0": "ok",
            "1": "ok",
            "2": "info",
            "3": "info",
            "4": "info",
            "5": "info",
            "*": "idle"
          }
        },
        "arvlMsg2-2": {
          "label": "남영 방면",
          "at": "/arvlMsg2"
        }
      }
    }
  },
  "parts": {
    "next-종각-1001-상행": {
      "as": "stat-list",
      "of": "jonggak[상행]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-종각-1001-하행": {
      "as": "stat-list",
      "of": "jonggak[하행]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    },
    "next-시청-1001-상행": {
      "as": "stat-list",
      "of": "city-hall-line-1[상행]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-시청-1001-하행": {
      "as": "stat-list",
      "of": "city-hall-line-1[하행]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    },
    "next-시청-1002-내선": {
      "as": "stat-list",
      "of": "city-hall-line-2[내선]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-시청-1002-외선": {
      "as": "stat-list",
      "of": "city-hall-line-2[외선]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    },
    "next-충정로-1002-내선": {
      "as": "stat-list",
      "of": "chungjeongno[내선]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-충정로-1002-외선": {
      "as": "stat-list",
      "of": "chungjeongno[외선]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    },
    "next-을지로입구-1002-내선": {
      "as": "stat-list",
      "of": "euljiro-1ga[내선]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-을지로입구-1002-외선": {
      "as": "stat-list",
      "of": "euljiro-1ga[외선]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    },
    "next-서울-1001-상행": {
      "as": "stat-list",
      "of": "seoul-station[상행]",
      "show": [
        "arvlMsg2"
      ],
      "state": "arvlCd"
    },
    "next-서울-1001-하행": {
      "as": "stat-list",
      "of": "seoul-station[하행]",
      "show": [
        "arvlMsg2-2"
      ],
      "state": "arvlCd"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1000,
      680
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221000%22%20height%3D%22680%22%20viewBox%3D%220%200%201000%20680%22%3E%0A%3Crect%20width%3D%221000%22%20height%3D%22680%22%20fill%3D%22%23f6f8f7%22%2F%3E%0A%3Cpolyline%20points%3D%2220%2C330%20150%2C330%20480%2C330%20800%2C330%20980%2C330%22%20fill%3D%22none%22%20stroke%3D%22%2300a84d%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%22480%2C76%20480%2C110%20480%2C330%20480%2C590%20480%2C668%22%20fill%3D%22none%22%20stroke%3D%22%230052a4%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Ccircle%20cx%3D%22480%22%20cy%3D%22110%22%20r%3D%2210%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2317252b%22%20stroke-width%3D%223%22%2F%3E%0A%3Ctext%20x%3D%22464%22%20y%3D%2294%22%20font-size%3D%2215%22%20font-weight%3D%22600%22%20fill%3D%22%2317252b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%A2%85%EA%B0%81%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22480%22%20cy%3D%22330%22%20r%3D%2213%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2317252b%22%20stroke-width%3D%224%22%2F%3E%0A%3Ctext%20x%3D%22464%22%20y%3D%22314%22%20font-size%3D%2215%22%20font-weight%3D%22600%22%20fill%3D%22%2317252b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%8B%9C%EC%B2%AD%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22150%22%20cy%3D%22330%22%20r%3D%2210%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2317252b%22%20stroke-width%3D%223%22%2F%3E%0A%3Ctext%20x%3D%22134%22%20y%3D%22314%22%20font-size%3D%2215%22%20font-weight%3D%22600%22%20fill%3D%22%2317252b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%B6%A9%EC%A0%95%EB%A1%9C%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22800%22%20cy%3D%22330%22%20r%3D%2210%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2317252b%22%20stroke-width%3D%223%22%2F%3E%0A%3Ctext%20x%3D%22784%22%20y%3D%22314%22%20font-size%3D%2215%22%20font-weight%3D%22600%22%20fill%3D%22%2317252b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%9D%84%EC%A7%80%EB%A1%9C%EC%9E%85%EA%B5%AC%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22480%22%20cy%3D%22590%22%20r%3D%2210%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%2317252b%22%20stroke-width%3D%223%22%2F%3E%0A%3Ctext%20x%3D%22464%22%20y%3D%22574%22%20font-size%3D%2215%22%20font-weight%3D%22600%22%20fill%3D%22%2317252b%22%20text-anchor%3D%22end%22%20font-family%3D%22sans-serif%22%3E%EC%84%9C%EC%9A%B8%EC%97%AD%3C%2Ftext%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%22664%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EB%85%B8%EC%84%A0%EB%8F%84%20%E2%80%94%20%EC%97%AD%20%EC%82%AC%EC%9D%B4%20%EA%B1%B0%EB%A6%AC%EB%8A%94%20%EC%8B%A4%EC%A0%9C%EC%99%80%20%EB%8B%A4%EB%A6%84%20%C2%B7%201%ED%98%B8%EC%84%A0%20%ED%8C%8C%EB%9E%91%2C%202%ED%98%B8%EC%84%A0%20%EC%B4%88%EB%A1%9D%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "next-종각-1001-상행": [
        500,
        82,
        230,
        52
      ],
      "next-종각-1001-하행": [
        500,
        140,
        230,
        52
      ],
      "next-시청-1001-상행": [
        200,
        200,
        260,
        52
      ],
      "next-시청-1001-하행": [
        200,
        258,
        260,
        52
      ],
      "next-시청-1002-내선": [
        500,
        360,
        260,
        52
      ],
      "next-시청-1002-외선": [
        500,
        418,
        260,
        52
      ],
      "next-충정로-1002-내선": [
        40,
        360,
        230,
        52
      ],
      "next-충정로-1002-외선": [
        40,
        418,
        230,
        52
      ],
      "next-을지로입구-1002-내선": [
        770,
        360,
        230,
        52
      ],
      "next-을지로입구-1002-외선": [
        770,
        418,
        230,
        52
      ],
      "next-서울-1001-상행": [
        500,
        548,
        230,
        52
      ],
      "next-서울-1001-하행": [
        500,
        606,
        230,
        52
      ]
    },
    "shapes": {
      "title": {
        "text": "시청 일대 지하철 — 다음 열차",
        "at": [
          20,
          18
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "역마다 노선·방향별로 다음 열차가 있는 곳 · 초록 = 진입·도착, 파랑 = 1~3역 전",
        "at": [
          20,
          50
        ],
        "size": 13,
        "tone": "past"
      }
    }
  }
};

export const seoulSubway: SamplePack = {
  id: "seoul-subway",
  title: {
    "ko": "시청 일대 지하철 실시간 도착",
    "en": "Subway arrivals around Seoul City Hall"
  },
  field: {
    "ko": "교통",
    "en": "Transport"
  },
  kind: {
    "ko": "노선도",
    "en": "Line diagram"
  },
  domain: "transport",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "1·2호선이 만나는 시청과 이웃한 네 역에서, 노선·방향마다 다음 열차가 있는 곳. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.",
    "en": "Where the next train is, each line and way, at City Hall — where lines 1 and 2 cross — and four stations beside it. The source issues each user a key, so creating it in an installation needs one."
  },
  connectors: [
    {
      "key": "seoul-subway",
      "name": "서울시 지하철 실시간 도착정보",
      "baseUrl": "http://swopenapi.seoul.go.kr/api/subway/{key}",
      "authType": "path",
      "ownKey": {
        "signUpUrl": "https://data.seoul.go.kr",
        "env": "SEOUL_SUBWAY_KEY"
      },
      "sourceError": {
        "path": "/code",
        "messagePath": "/message"
      },
      "attribution": {
        "text": "서울특별시 서울 열린데이터광장 (공공누리 제1유형)",
        "url": "https://data.seoul.go.kr"
      }
    }
  ],
  board,
  snapshot,
};
