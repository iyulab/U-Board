// Fine dust in five central districts of Seoul, from the city's hourly air measurements: each district's
// reading where the district lies, coloured by Korea's air quality index bands, and the five side by side.
// The sample key the source publishes reads five rows — these five.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/seoul-air.js';

const board: Board = {
  "data": {
    "5": {
      "from": "seoul-air",
      "path": "/json/RealtimeCityAir/1/5/",
      "list": "/RealtimeCityAir/row",
      "key": "MSRSTN_NM",
      "time": "MSRMT_DT",
      "zone": "Asia/Seoul",
      "fresh": 7200,
      "fields": {
        "PM": {
          "label": "은평구",
          "state": [
            "info",
            31,
            "ok",
            81,
            "warn",
            151,
            "alarm"
          ]
        },
        "PM-2": {
          "label": "서대문구",
          "at": "/PM",
          "state": [
            "info",
            31,
            "ok",
            81,
            "warn",
            151,
            "alarm"
          ]
        },
        "PM-3": {
          "label": "종로구",
          "at": "/PM",
          "state": [
            "info",
            31,
            "ok",
            81,
            "warn",
            151,
            "alarm"
          ]
        },
        "PM-4": {
          "label": "중구",
          "at": "/PM",
          "state": [
            "info",
            31,
            "ok",
            81,
            "warn",
            151,
            "alarm"
          ]
        },
        "PM-5": {
          "label": "용산구",
          "at": "/PM",
          "state": [
            "info",
            31,
            "ok",
            81,
            "warn",
            151,
            "alarm"
          ]
        },
        "OZON": {
          "label": "오존(중구)",
          "unit": "ppm"
        },
        "CAI_GRD": {
          "label": "대기지수(중구)",
          "state": {
            "좋음": "info",
            "보통": "ok",
            "나쁨": "warn",
            "매우나쁨": "alarm",
            "*": "idle"
          }
        }
      },
      "answerTime": "/RealtimeCityAir/row/0/MSRMT_DT"
    }
  },
  "parts": {
    "district-은평구": {
      "as": "stat-list",
      "of": "5[은평구]",
      "show": [
        "PM"
      ]
    },
    "district-서대문구": {
      "as": "stat-list",
      "of": "5[서대문구]",
      "show": [
        "PM-2"
      ]
    },
    "district-종로구": {
      "as": "stat-list",
      "of": "5[종로구]",
      "show": [
        "PM-3"
      ]
    },
    "district-중구": {
      "as": "stat-list",
      "of": "5[중구]",
      "show": [
        "PM-4"
      ]
    },
    "district-용산구": {
      "as": "stat-list",
      "of": "5[용산구]",
      "show": [
        "PM-5"
      ]
    },
    "districts-chart": {
      "as": "chart.bar",
      "of": "5",
      "title": "미세먼지·초미세먼지(㎍/㎥)",
      "x": "MSRSTN_NM",
      "y": [
        "PM",
        "FPM"
      ],
      "series": [
        {
          "label": "미세먼지(PM10)"
        },
        {
          "label": "초미세먼지(PM2.5)"
        }
      ]
    },
    "ozone": {
      "as": "stat",
      "of": "5[중구]",
      "show": "OZON"
    },
    "index-grade": {
      "as": "stat-list",
      "of": "5[중구]",
      "show": [
        "CAI_GRD"
      ]
    }
  },
  "layout": {
    "kind": "canvas",
    "size": [
      1000,
      640
    ],
    "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221000%22%20height%3D%22640%22%20viewBox%3D%220%200%201000%20640%22%3E%0A%3Crect%20width%3D%221000%22%20height%3D%22640%22%20fill%3D%22%23f6f8f7%22%2F%3E%0A%3Crect%20x%3D%22624%22%20y%3D%2260%22%20width%3D%22360%22%20height%3D%22560%22%20rx%3D%228%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23d6dedb%22%2F%3E%0A%3Cpolygon%20points%3D%2270%2C90%20250%2C62%20300%2C190%20210%2C270%2080%2C240%22%20fill%3D%22%23eef2f0%22%20stroke%3D%22%23b8c4c0%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%2280%2C240%20210%2C270%20300%2C190%20340%2C310%20270%2C392%20130%2C372%22%20fill%3D%22%23eef2f0%22%20stroke%3D%22%23b8c4c0%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22300%2C190%20250%2C62%20470%2C96%20572%2C206%20480%2C288%20340%2C310%22%20fill%3D%22%23eef2f0%22%20stroke%3D%22%23b8c4c0%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22340%2C310%20480%2C288%20572%2C206%20590%2C312%20530%2C392%20370%2C402%20270%2C392%22%20fill%3D%22%23eef2f0%22%20stroke%3D%22%23b8c4c0%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolygon%20points%3D%22270%2C392%20370%2C402%20530%2C392%20560%2C512%20410%2C580%20280%2C512%22%20fill%3D%22%23eef2f0%22%20stroke%3D%22%23b8c4c0%22%20stroke-width%3D%222%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpath%20d%3D%22M%20250%20560%20C%20330%20600%2C%20470%20610%2C%20600%20560%22%20fill%3D%22none%22%20stroke%3D%22%239ccbe8%22%20stroke-width%3D%2210%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22560%22%20y%3D%22600%22%20font-size%3D%2212%22%20fill%3D%22%232f7fa8%22%20font-family%3D%22sans-serif%22%3E%ED%95%9C%EA%B0%95%3C%2Ftext%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%22624%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%20font-family%3D%22sans-serif%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EA%B5%AC%20%EA%B2%BD%EA%B3%84%EB%8A%94%20%EC%8B%A4%EC%A0%9C%EC%99%80%20%EB%8B%A4%EB%A6%84%20%C2%B7%20%EC%9C%84%EA%B0%80%20%EB%B6%81%EC%AA%BD%3C%2Ftext%3E%0A%3C%2Fsvg%3E",
    "place": {
      "district-은평구": [
        100,
        137,
        150,
        56
      ],
      "district-서대문구": [
        140,
        284,
        150,
        56
      ],
      "district-종로구": [
        345,
        162,
        150,
        56
      ],
      "district-중구": [
        355,
        317,
        150,
        56
      ],
      "district-용산구": [
        340,
        452,
        150,
        56
      ],
      "districts-chart": [
        640,
        96,
        340,
        280
      ],
      "ozone": [
        640,
        396,
        160,
        80
      ],
      "index-grade": [
        820,
        404,
        160,
        60
      ]
    },
    "shapes": {
      "title": {
        "text": "서울 도심 5개 구 — 미세먼지",
        "at": [
          20,
          18
        ],
        "size": 24,
        "tone": "next"
      },
      "note": {
        "text": "구마다 PM10(㎍/㎥) · 색은 통합대기환경지수 단계",
        "at": [
          20,
          50
        ],
        "size": 13,
        "tone": "past"
      },
      "panel-title": {
        "text": "다섯 구 나란히",
        "at": [
          640,
          72
        ],
        "size": 15,
        "tone": "next"
      },
      "bands": {
        "text": "좋음 0–30 · 보통 31–80 · 나쁨 81–150 · 매우나쁨 151~",
        "at": [
          640,
          500
        ],
        "size": 12,
        "tone": "past"
      }
    }
  }
};

export const seoulAir: SamplePack = {
  id: "seoul-air",
  title: {
    "ko": "서울 도심 미세먼지",
    "en": "Fine dust in central Seoul"
  },
  field: {
    "ko": "환경·대기",
    "en": "Environment & air"
  },
  kind: {
    "ko": "구 약도",
    "en": "District map"
  },
  domain: "environment",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "도심 5개 구의 PM10을 구가 놓인 자리에, 통합대기환경지수 단계 색으로. 오른쪽은 다섯 구를 나란히.",
    "en": "Each district’s PM10 where the district lies, in the colours of Korea’s air quality index — and the five side by side."
  },
  connectors: [
    {
      "key": "seoul-air",
      "name": "서울시 실시간 대기환경",
      "baseUrl": "http://openapi.seoul.go.kr:8088/{key}",
      "authType": "path",
      "authValue": "sample",
      "sourceError": {
        "path": "/RESULT/CODE",
        "ok": [
          "INFO-000"
        ],
        "messagePath": "/RESULT/MESSAGE"
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
