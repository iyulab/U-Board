// Gwanghwamun and Deoksugung as Seoul's real-time city data describes them every few minutes — a mixed board,
// the way a city's situation room lays one out: how crowded the area is and the traffic across the top, the area's
// plan in a wide cell with the public bikes docked at each station and the cars in the public car park where they
// stand, the crowd forecast beside it, the weather below. The plan is a canvas in a grid cell; the figures around it
// are the grid's cards, laid out to the screen's width. The sample key the source publishes reads this one place,
// which is enough for the board to be real.

import type { Board } from '@iyulab/u-board/domain';
import type { SamplePack } from '../sample-pack.js';
import { snapshot } from '../snapshots/gwanghwamun.js';

const board: Board = {
  "data": {
    "bikes": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "list": "/CITYDATA/SBIKE_STTS",
      "key": "SBIKE_SPOT_ID",
      "fields": {
        "SBIKE_PARKING_CNT": {
          "label": "303. 광화문역 1번출구 앞",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        },
        "SBIKE_PARKING_CNT-2": {
          "label": "458. 광화문역 5번출구",
          "at": "/SBIKE_PARKING_CNT",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        },
        "SBIKE_PARKING_CNT-3": {
          "label": "305. 종로구청 옆",
          "at": "/SBIKE_PARKING_CNT",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        },
        "SBIKE_PARKING_CNT-4": {
          "label": "391. 시립미술관",
          "at": "/SBIKE_PARKING_CNT",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        },
        "SBIKE_PARKING_CNT-5": {
          "label": "6058. 시청역 2번출구",
          "at": "/SBIKE_PARKING_CNT",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        },
        "SBIKE_PARKING_CNT-6": {
          "label": "4719. 종로문화원 건너편",
          "at": "/SBIKE_PARKING_CNT",
          "state": [
            "alarm",
            1,
            "warn",
            3,
            "ok"
          ]
        }
      }
    },
    "parking": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "list": "/CITYDATA/PRK_STTS",
      "key": "CUR_PRK_YN",
      "where": {
        "PRK_CD": "171721"
      },
      "fields": {
        "CUR_PRK_CNT": {
          "unit": "대"
        },
        "CPCTY": {},
        "PRK_NM": {}
      }
    },
    "crowd": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "fields": {
        "PPLTN_TIME": {
          "at": "/CITYDATA/LIVE_PPLTN_STTS/0/PPLTN_TIME"
        },
        "AREA_CONGEST_LVL": {
          "at": "/CITYDATA/LIVE_PPLTN_STTS/0/AREA_CONGEST_LVL",
          "label": "지금 혼잡도",
          "state": {
            "여유": "ok",
            "보통": "idle",
            "약간 붐빔": "warn",
            "붐빔": "alarm",
            "*": "idle"
          }
        },
        "AREA_PPLTN_MAX": {
          "at": "/CITYDATA/LIVE_PPLTN_STTS/0/AREA_PPLTN_MAX",
          "label": "추정 인구(최대)",
          "unit": "명"
        }
      },
      "time": "PPLTN_TIME",
      "zone": "Asia/Seoul",
      "fresh": 3600
    },
    "traffic": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "fields": {
        "ROAD_TRAFFIC_TIME": {
          "at": "/CITYDATA/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_TIME"
        },
        "ROAD_TRAFFIC_IDX": {
          "at": "/CITYDATA/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_IDX",
          "label": "도로 소통",
          "state": {
            "원활": "ok",
            "서행": "warn",
            "정체": "alarm",
            "*": "idle"
          }
        },
        "ROAD_TRAFFIC_SPD": {
          "at": "/CITYDATA/ROAD_TRAFFIC_STTS/AVG_ROAD_DATA/ROAD_TRAFFIC_SPD",
          "label": "평균 속도",
          "unit": "km/h"
        }
      },
      "time": "ROAD_TRAFFIC_TIME",
      "zone": "Asia/Seoul",
      "fresh": 1200
    },
    "crowd-forecast": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "list": "/CITYDATA/LIVE_PPLTN_STTS/0/FCST_PPLTN",
      "zone": "Asia/Seoul",
      "fresh": 3600,
      "answerTime": "/CITYDATA/LIVE_PPLTN_STTS/0/PPLTN_TIME"
    },
    "weather": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "fields": {
        "WEATHER_TIME": {
          "at": "/CITYDATA/WEATHER_STTS/0/WEATHER_TIME"
        },
        "TEMP": {
          "at": "/CITYDATA/WEATHER_STTS/0/TEMP",
          "label": "기온",
          "unit": "°C"
        },
        "HUMIDITY": {
          "at": "/CITYDATA/WEATHER_STTS/0/HUMIDITY",
          "label": "습도",
          "unit": "%"
        },
        "PM10_INDEX": {
          "at": "/CITYDATA/WEATHER_STTS/0/PM10_INDEX",
          "label": "미세먼지",
          "state": {
            "좋음": "info",
            "보통": "ok",
            "나쁨": "warn",
            "매우나쁨": "alarm",
            "*": "idle"
          }
        }
      },
      "time": "WEATHER_TIME",
      "zone": "Asia/Seoul",
      "fresh": 1800
    },
    "weather-forecast": {
      "from": "seoul-city-data",
      "path": "/json/citydata/1/5/%EA%B4%91%ED%99%94%EB%AC%B8%C2%B7%EB%8D%95%EC%88%98%EA%B6%81",
      "list": "/CITYDATA/WEATHER_STTS/0/FCST24HOURS",
      "zone": "Asia/Seoul",
      "fresh": 1800,
      "answerTime": "/CITYDATA/WEATHER_STTS/0/WEATHER_TIME"
    }
  },
  "parts": {
    "bike-ST-119": {
      "as": "stat-list",
      "of": "bikes[ST-119]",
      "show": [
        "SBIKE_PARKING_CNT"
      ]
    },
    "bike-ST-1611": {
      "as": "stat-list",
      "of": "bikes[ST-1611]",
      "show": [
        "SBIKE_PARKING_CNT-2"
      ]
    },
    "bike-ST-121": {
      "as": "stat-list",
      "of": "bikes[ST-121]",
      "show": [
        "SBIKE_PARKING_CNT-3"
      ]
    },
    "bike-ST-977": {
      "as": "stat-list",
      "of": "bikes[ST-977]",
      "show": [
        "SBIKE_PARKING_CNT-4"
      ]
    },
    "bike-ST-3297": {
      "as": "stat-list",
      "of": "bikes[ST-3297]",
      "show": [
        "SBIKE_PARKING_CNT-5"
      ]
    },
    "bike-ST-3090": {
      "as": "stat-list",
      "of": "bikes[ST-3090]",
      "show": [
        "SBIKE_PARKING_CNT-6"
      ]
    },
    "car-park": {
      "as": "gauge",
      "of": "parking[Y]",
      "show": "CUR_PRK_CNT",
      "subtitle": "세종로 공영주차장",
      "max": 1260,
      "title": "{{PRK_NM}}"
    },
    "crowd": {
      "as": "stat-list",
      "of": "crowd",
      "show": [
        "AREA_CONGEST_LVL"
      ]
    },
    "people": {
      "as": "stat",
      "of": "crowd",
      "show": "AREA_PPLTN_MAX"
    },
    "traffic": {
      "as": "stat-list",
      "of": "traffic",
      "show": [
        "ROAD_TRAFFIC_IDX"
      ]
    },
    "speed": {
      "as": "stat",
      "of": "traffic",
      "show": "ROAD_TRAFFIC_SPD"
    },
    "forecast": {
      "as": "chart.line",
      "of": "crowd-forecast",
      "title": "향후 12시간 인구 예측(최대)",
      "x": "FCST_TIME",
      "y": "FCST_PPLTN_MAX",
      "xFormat": "time"
    },
    "temperature": {
      "as": "stat",
      "of": "weather",
      "show": "TEMP"
    },
    "humidity": {
      "as": "stat",
      "of": "weather",
      "show": "HUMIDITY"
    },
    "fine-dust": {
      "as": "stat-list",
      "of": "weather",
      "show": [
        "PM10_INDEX"
      ]
    },
    "temperature-forecast": {
      "as": "chart.line",
      "of": "weather-forecast",
      "title": "24시간 기온 예보(°C)",
      "x": "FCST_DT",
      "y": "TEMP",
      "xFormat": "time"
    }
  },
  "layout": {
    "kind": "grid",
    "items": [
      {
        "canvas": {
          "size": [
            680,
            820
          ],
          "background": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22680%22%20height%3D%22820%22%20viewBox%3D%220%200%20680%20820%22%3E%0A%3Crect%20width%3D%22680%22%20height%3D%22820%22%20fill%3D%22%23eef2f0%22%2F%3E%0A%3Crect%20x%3D%22214.7%22%20y%3D%220.0%22%20width%3D%22268.4%22%20height%3D%2267.9%22%20fill%3D%22%23e3e8d8%22%2F%3E%0A%3Crect%20x%3D%22178.9%22%20y%3D%22605.1%22%20width%3D%22125.3%22%20height%3D%22113.1%22%20rx%3D%224%22%20fill%3D%22%23e3e8d8%22%2F%3E%0A%3Crect%20x%3D%22317.6%22%20y%3D%22113.1%22%20width%3D%2240.3%22%20height%3D%22226.2%22%20rx%3D%223%22%20fill%3D%22%23cfe3c7%22%2F%3E%0A%3Cellipse%20cx%3D%22398.2%22%20cy%3D%22678.6%22%20rx%3D%2220%22%20ry%3D%2216%22%20fill%3D%22%23cfe3c7%22%2F%3E%0A%3Cpolyline%20points%3D%220.0%2C84.8%20680.0%2C84.8%22%20fill%3D%22none%22%20stroke%3D%22%23c9d2cf%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolyline%20points%3D%220.0%2C84.8%20680.0%2C84.8%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%22340.0%2C84.8%20362.4%2C622.1%20290.8%2C820.0%22%20fill%3D%22none%22%20stroke%3D%22%23c9d2cf%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolyline%20points%3D%22340.0%2C84.8%20362.4%2C622.1%20290.8%2C820.0%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%220.0%2C401.5%20340.0%2C401.5%22%20fill%3D%22none%22%20stroke%3D%22%23c9d2cf%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolyline%20points%3D%220.0%2C401.5%20340.0%2C401.5%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%22357.9%2C407.2%20680.0%2C407.2%22%20fill%3D%22none%22%20stroke%3D%22%23c9d2cf%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolyline%20points%3D%22357.9%2C407.2%20680.0%2C407.2%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%22384.7%2C644.7%20680.0%2C644.7%22%20fill%3D%22none%22%20stroke%3D%22%23c9d2cf%22%20stroke-width%3D%2216%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpolyline%20points%3D%22384.7%2C644.7%20680.0%2C644.7%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%2212%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%3Cpolyline%20points%3D%22389.2%2C463.7%20527.9%2C475.0%20680.0%2C480.7%22%20fill%3D%22none%22%20stroke%3D%22%239ccbe8%22%20stroke-width%3D%226%22%20stroke-linecap%3D%22round%22%2F%3E%0A%3Ctext%20x%3D%22348.9%22%20y%3D%2233.9%22%20font-size%3D%2214%22%20fill%3D%22%234b5a3f%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B2%BD%EB%B3%B5%EA%B6%81%3C%2Ftext%3E%0A%3Ctext%20x%3D%22380.3%22%20y%3D%2267.9%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B4%91%ED%99%94%EB%AC%B8%3C%2Ftext%3E%0A%3Ctext%20x%3D%22389.2%22%20y%3D%22214.9%22%20font-size%3D%2212%22%20fill%3D%22%234b6b3f%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B4%91%ED%99%94%EB%AC%B8%EA%B4%91%EC%9E%A5%3C%2Ftext%3E%0A%3Ctext%20x%3D%22268.4%22%20y%3D%22277.1%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%84%B8%EC%A2%85%EB%AC%B8%ED%99%94%ED%9A%8C%EA%B4%80%3C%2Ftext%3E%0A%3Ctext%20x%3D%22438.4%22%20y%3D%22361.9%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EA%B5%90%EB%B3%B4%EB%B9%8C%EB%94%A9%3C%2Ftext%3E%0A%3Ctext%20x%3D%22505.5%22%20y%3D%22441.1%22%20font-size%3D%2212%22%20fill%3D%22%232f7fa8%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%B2%AD%EA%B3%84%EC%B2%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%22433.9%22%20y%3D%22605.1%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%84%9C%EC%9A%B8%EC%8B%9C%EC%B2%AD%3C%2Ftext%3E%0A%3Ctext%20x%3D%22241.6%22%20y%3D%22667.3%22%20font-size%3D%2214%22%20fill%3D%22%234b5a3f%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EB%8D%95%EC%88%98%EA%B6%81%3C%2Ftext%3E%0A%3Ctext%20x%3D%22447.4%22%20y%3D%22226.2%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%A2%85%EB%A1%9C%EA%B5%AC%EC%B2%AD%3C%2Ftext%3E%0A%3Ctext%20x%3D%22102.9%22%20y%3D%2267.9%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%82%AC%EC%A7%81%EB%A1%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%2298.4%22%20y%3D%22378.9%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%83%88%EB%AC%B8%EC%95%88%EB%A1%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%22608.4%22%20y%3D%22384.6%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%A2%85%EB%A1%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%22608.4%22%20y%3D%22622.1%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%9D%84%EC%A7%80%EB%A1%9C%3C%2Ftext%3E%0A%3Ctext%20x%3D%22322.1%22%20y%3D%22520.3%22%20font-size%3D%2212%22%20fill%3D%22%235b6b70%22%20text-anchor%3D%22middle%22%20font-family%3D%22sans-serif%22%3E%EC%84%B8%EC%A2%85%EB%8C%80%EB%A1%9C%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22357.9%22%20cy%3D%22339.3%22%20r%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%232f6f9f%22%20stroke-width%3D%222.5%22%2F%3E%3Ctext%20x%3D%22367.9%22%20y%3D%22343.3%22%20font-size%3D%2211%22%20fill%3D%22%232f6f9f%22%20font-family%3D%22sans-serif%22%3E%EA%B4%91%ED%99%94%EB%AC%B8%EC%97%AD%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22353.4%22%20cy%3D%22667.3%22%20r%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%232f6f9f%22%20stroke-width%3D%222.5%22%2F%3E%3Ctext%20x%3D%22363.4%22%20y%3D%22671.3%22%20font-size%3D%2211%22%20fill%3D%22%232f6f9f%22%20font-family%3D%22sans-serif%22%3E%EC%8B%9C%EC%B2%AD%EC%97%AD%3C%2Ftext%3E%0A%3Ccircle%20cx%3D%22192.4%22%20cy%3D%2296.1%22%20r%3D%226%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%232f6f9f%22%20stroke-width%3D%222.5%22%2F%3E%3Ctext%20x%3D%22202.4%22%20y%3D%22100.1%22%20font-size%3D%2211%22%20fill%3D%22%232f6f9f%22%20font-family%3D%22sans-serif%22%3E%EA%B2%BD%EB%B3%B5%EA%B6%81%EC%97%AD%3C%2Ftext%3E%0A%3Cg%20font-family%3D%22sans-serif%22%20font-size%3D%2211%22%20fill%3D%22%235b6b70%22%3E%0A%3Cline%20x1%3D%2220%22%20y1%3D%22800%22%20x2%3D%22121.9%22%20y2%3D%22800%22%20stroke%3D%22%235b6b70%22%20stroke-width%3D%222%22%2F%3E%0A%3Ctext%20x%3D%2220%22%20y%3D%22792%22%3E200%20m%3C%2Ftext%3E%0A%3Ctext%20x%3D%22660%22%20y%3D%22804%22%20text-anchor%3D%22end%22%3E%EC%95%BD%EB%8F%84%20%E2%80%94%20%EC%8B%A4%EC%A0%9C%20%EC%A7%80%EB%8F%84%EA%B0%80%20%EC%95%84%EB%8B%98%20%C2%B7%20%EC%9C%84%EA%B0%80%20%EB%B6%81%EC%AA%BD%3C%2Ftext%3E%0A%3C%2Fg%3E%0A%3C%2Fsvg%3E",
          "place": {
            "bike-ST-119": [
              164,
              298,
              160,
              52
            ],
            "bike-ST-1611": [
              294,
              404,
              160,
              52
            ],
            "bike-ST-121": [
              329,
              253,
              160,
              52
            ],
            "bike-ST-977": [
              108,
              678,
              160,
              52
            ],
            "bike-ST-3297": [
              270,
              648,
              160,
              52
            ],
            "bike-ST-3090": [
              426,
              75,
              160,
              52
            ],
            "car-park": [
              129,
              172,
              150,
              120
            ]
          }
        },
        "span": 8
      },
      {
        "grid": [
          [
            "crowd",
            12
          ],
          [
            "people",
            12
          ],
          [
            "traffic",
            12
          ],
          [
            "speed",
            12
          ],
          [
            "forecast",
            12
          ]
        ],
        "span": 4
      },
      [
        "temperature",
        4
      ],
      [
        "humidity",
        4
      ],
      [
        "fine-dust",
        4
      ],
      [
        "temperature-forecast",
        12
      ]
    ]
  }
};

export const gwanghwamun: SamplePack = {
  id: "gwanghwamun",
  title: {
    "ko": "광화문·덕수궁 실시간",
    "en": "Gwanghwamun, live"
  },
  field: {
    "ko": "도시·인파",
    "en": "City & crowds"
  },
  kind: {
    "ko": "지역 약도 + 카드(혼합)",
    "en": "Area plan among cards (mixed)"
  },
  domain: "public",
  styles: [
    "operations"
  ],
  summary: {
    "ko": "도시 상황판처럼 — 지역 약도에 대여소마다 남은 따릉이와 공영주차장의 주차 대수를 서 있는 자리에, 옆 열에 혼잡도·인구·도로 소통과 인구 예측, 아래 날씨. 약도는 여러 줄에 걸친 그리드 칸 안의 캔버스입니다.",
    "en": "Laid out like a city’s situation room — the area’s plan with the bikes left at each station and the cars in the public car park where they stand; beside it a column of the crowd, the roads and the crowd forecast; the weather below. The plan is a canvas in a grid cell spanning the column’s rows."
  },
  connectors: [
    {
      "key": "seoul-city-data",
      "name": "서울 실시간 도시데이터",
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
