// Fine dust in all twenty-five districts of Seoul, from the national air quality network's real-time readings: a
// tile for each district, set out roughly where it lies — north of the Han river above, south below — in the
// colour of the reading's grade. The source issues each user a key, and always says in its answer whether it
// served the request (`resultCode` "00").

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/seoul-districts-air.js';

const board: Board = {
  "statuses": {
    "very-bad": {
      "tone": "alarm",
      "emphasis": "blink"
    }
  },
  "data": {
    "getCtprvnRltmMesureDnsty": {
      "from": "air-korea",
      "path": "/getCtprvnRltmMesureDnsty?returnType=json&sidoName=%EC%84%9C%EC%9A%B8&numOfRows=100&pageNo=1&ver=1.0",
      "list": "/response/body/items",
      "key": "stationName",
      "time": "dataTime",
      "zone": "Asia/Seoul",
      "fresh": 7200,
      "fields": {
        "pm10Value": {
          "label": "은평구"
        },
        "pm10Grade": {
          "state": {
            "1": "info",
            "2": "ok",
            "3": "warn",
            "4": "very-bad",
            "*": "idle"
          }
        },
        "pm10Value-2": {
          "label": "종로구",
          "at": "/pm10Value"
        },
        "pm10Value-3": {
          "label": "강북구",
          "at": "/pm10Value"
        },
        "pm10Value-4": {
          "label": "도봉구",
          "at": "/pm10Value"
        },
        "pm10Value-5": {
          "label": "노원구",
          "at": "/pm10Value"
        },
        "pm10Value-6": {
          "label": "서대문구",
          "at": "/pm10Value"
        },
        "pm10Value-7": {
          "label": "중구",
          "at": "/pm10Value"
        },
        "pm10Value-8": {
          "label": "성북구",
          "at": "/pm10Value"
        },
        "pm10Value-9": {
          "label": "동대문구",
          "at": "/pm10Value"
        },
        "pm10Value-10": {
          "label": "중랑구",
          "at": "/pm10Value"
        },
        "pm10Value-11": {
          "label": "마포구",
          "at": "/pm10Value"
        },
        "pm10Value-12": {
          "label": "용산구",
          "at": "/pm10Value"
        },
        "pm10Value-13": {
          "label": "성동구",
          "at": "/pm10Value"
        },
        "pm10Value-14": {
          "label": "광진구",
          "at": "/pm10Value"
        },
        "pm10Value-15": {
          "label": "강서구",
          "at": "/pm10Value"
        },
        "pm10Value-16": {
          "label": "영등포구",
          "at": "/pm10Value"
        },
        "pm10Value-17": {
          "label": "동작구",
          "at": "/pm10Value"
        },
        "pm10Value-18": {
          "label": "서초구",
          "at": "/pm10Value"
        },
        "pm10Value-19": {
          "label": "강남구",
          "at": "/pm10Value"
        },
        "pm10Value-20": {
          "label": "송파구",
          "at": "/pm10Value"
        },
        "pm10Value-21": {
          "label": "강동구",
          "at": "/pm10Value"
        },
        "pm10Value-22": {
          "label": "양천구",
          "at": "/pm10Value"
        },
        "pm10Value-23": {
          "label": "구로구",
          "at": "/pm10Value"
        },
        "pm10Value-24": {
          "label": "금천구",
          "at": "/pm10Value"
        },
        "pm10Value-25": {
          "label": "관악구",
          "at": "/pm10Value"
        }
      }
    }
  },
  "parts": {
    "district-은평구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[은평구]",
      "show": [
        "pm10Value"
      ],
      "state": "pm10Grade"
    },
    "district-종로구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[종로구]",
      "show": [
        "pm10Value-2"
      ],
      "state": "pm10Grade"
    },
    "district-강북구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[강북구]",
      "show": [
        "pm10Value-3"
      ],
      "state": "pm10Grade"
    },
    "district-도봉구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[도봉구]",
      "show": [
        "pm10Value-4"
      ],
      "state": "pm10Grade"
    },
    "district-노원구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[노원구]",
      "show": [
        "pm10Value-5"
      ],
      "state": "pm10Grade"
    },
    "district-서대문구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[서대문구]",
      "show": [
        "pm10Value-6"
      ],
      "state": "pm10Grade"
    },
    "district-중구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[중구]",
      "show": [
        "pm10Value-7"
      ],
      "state": "pm10Grade"
    },
    "district-성북구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[성북구]",
      "show": [
        "pm10Value-8"
      ],
      "state": "pm10Grade"
    },
    "district-동대문구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[동대문구]",
      "show": [
        "pm10Value-9"
      ],
      "state": "pm10Grade"
    },
    "district-중랑구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[중랑구]",
      "show": [
        "pm10Value-10"
      ],
      "state": "pm10Grade"
    },
    "district-마포구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[마포구]",
      "show": [
        "pm10Value-11"
      ],
      "state": "pm10Grade"
    },
    "district-용산구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[용산구]",
      "show": [
        "pm10Value-12"
      ],
      "state": "pm10Grade"
    },
    "district-성동구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[성동구]",
      "show": [
        "pm10Value-13"
      ],
      "state": "pm10Grade"
    },
    "district-광진구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[광진구]",
      "show": [
        "pm10Value-14"
      ],
      "state": "pm10Grade"
    },
    "district-강서구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[강서구]",
      "show": [
        "pm10Value-15"
      ],
      "state": "pm10Grade"
    },
    "district-영등포구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[영등포구]",
      "show": [
        "pm10Value-16"
      ],
      "state": "pm10Grade"
    },
    "district-동작구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[동작구]",
      "show": [
        "pm10Value-17"
      ],
      "state": "pm10Grade"
    },
    "district-서초구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[서초구]",
      "show": [
        "pm10Value-18"
      ],
      "state": "pm10Grade"
    },
    "district-강남구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[강남구]",
      "show": [
        "pm10Value-19"
      ],
      "state": "pm10Grade"
    },
    "district-송파구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[송파구]",
      "show": [
        "pm10Value-20"
      ],
      "state": "pm10Grade"
    },
    "district-강동구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[강동구]",
      "show": [
        "pm10Value-21"
      ],
      "state": "pm10Grade"
    },
    "district-양천구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[양천구]",
      "show": [
        "pm10Value-22"
      ],
      "state": "pm10Grade"
    },
    "district-구로구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[구로구]",
      "show": [
        "pm10Value-23"
      ],
      "state": "pm10Grade"
    },
    "district-금천구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[금천구]",
      "show": [
        "pm10Value-24"
      ],
      "state": "pm10Grade"
    },
    "district-관악구": {
      "as": "stat-list",
      "of": "getCtprvnRltmMesureDnsty[관악구]",
      "show": [
        "pm10Value-25"
      ],
      "state": "pm10Grade"
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1040,
      600
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221040%22%20height%3D%22600%22%20viewBox%3D%220%200%201040%20600%22%3E%0A%3Crect%20width%3D%221040%22%20height%3D%22600%22%20fill%3D%22%23f6f8f7%22%2F%3E%0A%3Crect%20x%3D%22170%22%20y%3D%22100%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22310%22%20y%3D%22100%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22100%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22590%22%20y%3D%22100%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22730%22%20y%3D%22100%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22170%22%20y%3D%22180%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22310%22%20y%3D%22180%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22180%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22590%22%20y%3D%22180%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22730%22%20y%3D%22180%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22170%22%20y%3D%22260%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22310%22%20y%3D%22260%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22260%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22590%22%20y%3D%22260%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22170%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22310%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22590%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22730%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22870%22%20y%3D%22364%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%2230%22%20y%3D%22444%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22170%22%20y%3D%22444%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22310%22%20y%3D%22444%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Crect%20x%3D%22450%22%20y%3D%22444%22%20width%3D%22128%22%20height%3D%2260%22%20rx%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Cpath%20d%3D%22M%2020%20342%20C%20260%20326%2C%20520%20358%2C%20760%20338%20S%20980%20328%2C%201020%20340%22%20fill%3D%22none%22%20stroke%3D%22%239ccbe8%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22970%22%20y%3D%22326%22%20font-size%3D%2212%22%20fill%3D%22%232f7fa8%22%20font-family%3D%22sans-serif%22%3E%ED%95%9C%EA%B0%95%3C%2Ftext%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%22584%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%ED%83%80%EC%9D%BC%20%EC%A7%80%EB%8F%84%20%E2%80%94%20%EA%B5%AC%EC%9D%98%20%ED%81%AC%EA%B8%B0%C2%B7%EB%AA%A8%EC%96%91%EC%9D%80%20%EC%8B%A4%EC%A0%9C%EC%99%80%20%EB%8B%A4%EB%A6%84%2C%20%EC%9D%B4%EC%9B%83%ED%95%9C%20%EA%B5%AC%EB%A5%BC%20%EC%9D%B4%EC%9B%83%ED%95%9C%20%EC%B9%B8%EC%97%90%20%C2%B7%20%EC%9C%84%EA%B0%80%20%EB%B6%81%EC%AA%BD%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "district-은평구": [
        170,
        100,
        128,
        60
      ],
      "district-종로구": [
        310,
        100,
        128,
        60
      ],
      "district-강북구": [
        450,
        100,
        128,
        60
      ],
      "district-도봉구": [
        590,
        100,
        128,
        60
      ],
      "district-노원구": [
        730,
        100,
        128,
        60
      ],
      "district-서대문구": [
        170,
        180,
        128,
        60
      ],
      "district-중구": [
        310,
        180,
        128,
        60
      ],
      "district-성북구": [
        450,
        180,
        128,
        60
      ],
      "district-동대문구": [
        590,
        180,
        128,
        60
      ],
      "district-중랑구": [
        730,
        180,
        128,
        60
      ],
      "district-마포구": [
        170,
        260,
        128,
        60
      ],
      "district-용산구": [
        310,
        260,
        128,
        60
      ],
      "district-성동구": [
        450,
        260,
        128,
        60
      ],
      "district-광진구": [
        590,
        260,
        128,
        60
      ],
      "district-강서구": [
        30,
        364,
        128,
        60
      ],
      "district-영등포구": [
        170,
        364,
        128,
        60
      ],
      "district-동작구": [
        310,
        364,
        128,
        60
      ],
      "district-서초구": [
        450,
        364,
        128,
        60
      ],
      "district-강남구": [
        590,
        364,
        128,
        60
      ],
      "district-송파구": [
        730,
        364,
        128,
        60
      ],
      "district-강동구": [
        870,
        364,
        128,
        60
      ],
      "district-양천구": [
        30,
        444,
        128,
        60
      ],
      "district-구로구": [
        170,
        444,
        128,
        60
      ],
      "district-금천구": [
        310,
        444,
        128,
        60
      ],
      "district-관악구": [
        450,
        444,
        128,
        60
      ]
    },
    "shapes": {
      "title": {
        "text": "서울 25개 구 — 미세먼지",
        "at": [
          20,
          18
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "구마다 PM10(㎍/㎥) · 색은 에어코리아 등급(좋음·보통·나쁨·매우나쁨) · ‘-’는 점검 중",
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

export const seoulDistrictsAir: SamplePack = {
  id: "seoul-districts-air",
  title: {
    "ko": "서울 25개 구 미세먼지",
    "en": "Fine dust in Seoul’s 25 districts"
  },
  field: {
    "ko": "환경·대기",
    "en": "Environment & air"
  },
  kind: {
    "ko": "타일 지도",
    "en": "Tile map"
  },
  domain: "environment",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "25개 구마다 PM10과 에어코리아 등급 색을, 이웃한 구를 이웃한 칸에 놓은 타일 지도로. 원천이 이용자마다 키를 발급해, 설치본에서 만들 때 발급받은 키가 필요합니다.",
    "en": "Each of the 25 districts’ PM10 in the colour of its grade, on a tile map that keeps neighbouring districts side by side. The source issues each user a key, so creating it in an installation needs one."
  },
  connectors: [
    {
      "key": "air-korea",
      "name": "에어코리아 대기오염정보",
      "baseUrl": "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc",
      "authType": "query",
      "authParamName": "serviceKey",
      "ownKey": {
        "signUpUrl": "https://www.data.go.kr",
        "env": "DATA_GO_KR_KEY",
        "hint": "공공데이터포털이 주는 두 키 가운데 일반 인증키(Decoding)를 넣습니다."
      },
      "sourceError": {
        "path": "/response/header/resultCode",
        "ok": [
          "00"
        ],
        "messagePath": "/response/header/resultMsg"
      },
      "attribution": {
        "text": "한국환경공단 에어코리아 (공공데이터포털)",
        "url": "https://www.airkorea.or.kr"
      }
    }
  ],
  board,
  snapshot,
};
