// Example data written for the sample — the site, its measuring points and readings are made up. Keep it consistent:
// it is 15:00 on a Thursday in late October; every point reads a one-minute equivalent level (Leq) every ten minutes
// from 13:10. A reading above 65 dB is over the daytime limit, 62 dB and up is near it; the over-limit counts in the
// chart are the readings' own, the summary's count leaves out E (inside the site, for reference), and the loudest
// reading is the summary's.
import type { SampleSnapshot } from '../sample-pack.js';

export const snapshot: SampleSnapshot = {
  "capturedAt": "2026-10-22T06:00:00.000Z",
  "responses": {
    "site": {
      "/site/staves": {
        "value": {
          "a": {
            "name": "A 북측 경계",
            "where": "아파트 단지 쪽",
            "now": "57.4",
            "state": "ok",
            "word": "기준 안",
            "notes": [
              {
                "t": "13:10",
                "db": "58.5",
                "state": "ok"
              },
              {
                "t": "13:20",
                "db": "60.5",
                "state": "ok"
              },
              {
                "t": "13:30",
                "db": "60.9",
                "state": "ok"
              },
              {
                "t": "13:40",
                "db": "59.6",
                "state": "ok"
              },
              {
                "t": "13:50",
                "db": "57.4",
                "state": "ok"
              },
              {
                "t": "14:00",
                "db": "56.1",
                "state": "ok"
              },
              {
                "t": "14:10",
                "db": "66.4",
                "state": "over"
              },
              {
                "t": "14:20",
                "db": "67.2",
                "state": "over"
              },
              {
                "t": "14:30",
                "db": "60.5",
                "state": "ok"
              },
              {
                "t": "14:40",
                "db": "60.9",
                "state": "ok"
              },
              {
                "t": "14:50",
                "db": "59.5",
                "state": "ok"
              },
              {
                "t": "15:00",
                "db": "57.4",
                "state": "ok"
              }
            ]
          },
          "b": {
            "name": "B 동측 경계",
            "where": "초등학교 앞",
            "now": "52.1",
            "state": "ok",
            "word": "기준 안",
            "notes": [
              {
                "t": "13:10",
                "db": "57.9",
                "state": "ok"
              },
              {
                "t": "13:20",
                "db": "57.4",
                "state": "ok"
              },
              {
                "t": "13:30",
                "db": "55.1",
                "state": "ok"
              },
              {
                "t": "13:40",
                "db": "52.7",
                "state": "ok"
              },
              {
                "t": "13:50",
                "db": "52.1",
                "state": "ok"
              },
              {
                "t": "14:00",
                "db": "62.3",
                "state": "near"
              },
              {
                "t": "14:10",
                "db": "56.2",
                "state": "ok"
              },
              {
                "t": "14:20",
                "db": "57.9",
                "state": "ok"
              },
              {
                "t": "14:30",
                "db": "57.4",
                "state": "ok"
              },
              {
                "t": "14:40",
                "db": "55.1",
                "state": "ok"
              },
              {
                "t": "14:50",
                "db": "52.7",
                "state": "ok"
              },
              {
                "t": "15:00",
                "db": "52.1",
                "state": "ok"
              }
            ]
          },
          "c": {
            "name": "C 남측 경계",
            "where": "간선도로 쪽",
            "now": "58.2",
            "state": "ok",
            "word": "기준 안",
            "notes": [
              {
                "t": "13:10",
                "db": "61.7",
                "state": "ok"
              },
              {
                "t": "13:20",
                "db": "59.9",
                "state": "ok"
              },
              {
                "t": "13:30",
                "db": "57.8",
                "state": "ok"
              },
              {
                "t": "13:40",
                "db": "57.0",
                "state": "ok"
              },
              {
                "t": "13:50",
                "db": "58.1",
                "state": "ok"
              },
              {
                "t": "14:00",
                "db": "60.3",
                "state": "ok"
              },
              {
                "t": "14:10",
                "db": "61.8",
                "state": "ok"
              },
              {
                "t": "14:20",
                "db": "61.6",
                "state": "ok"
              },
              {
                "t": "14:30",
                "db": "63.5",
                "state": "near"
              },
              {
                "t": "14:40",
                "db": "57.8",
                "state": "ok"
              },
              {
                "t": "14:50",
                "db": "57.0",
                "state": "ok"
              },
              {
                "t": "15:00",
                "db": "58.2",
                "state": "ok"
              }
            ]
          },
          "d": {
            "name": "D 서측 경계",
            "where": "근린공원 쪽",
            "now": "49.7",
            "state": "ok",
            "word": "기준 안",
            "notes": [
              {
                "t": "13:10",
                "db": "53.6",
                "state": "ok"
              },
              {
                "t": "13:20",
                "db": "54.5",
                "state": "ok"
              },
              {
                "t": "13:30",
                "db": "53.5",
                "state": "ok"
              },
              {
                "t": "13:40",
                "db": "51.4",
                "state": "ok"
              },
              {
                "t": "13:50",
                "db": "49.7",
                "state": "ok"
              },
              {
                "t": "14:00",
                "db": "49.8",
                "state": "ok"
              },
              {
                "t": "14:10",
                "db": "51.5",
                "state": "ok"
              },
              {
                "t": "14:20",
                "db": "53.6",
                "state": "ok"
              },
              {
                "t": "14:30",
                "db": "54.5",
                "state": "ok"
              },
              {
                "t": "14:40",
                "db": "53.5",
                "state": "ok"
              },
              {
                "t": "14:50",
                "db": "51.3",
                "state": "ok"
              },
              {
                "t": "15:00",
                "db": "49.7",
                "state": "ok"
              }
            ]
          },
          "e": {
            "name": "E 타워크레인 아래",
            "where": "현장 안 — 참고",
            "now": "62.2",
            "state": "near",
            "word": "기준 가까움",
            "notes": [
              {
                "t": "13:10",
                "db": "67.9",
                "state": "over"
              },
              {
                "t": "13:20",
                "db": "70.8",
                "state": "over"
              },
              {
                "t": "13:30",
                "db": "70.0",
                "state": "over"
              },
              {
                "t": "13:40",
                "db": "66.2",
                "state": "over"
              },
              {
                "t": "13:50",
                "db": "62.2",
                "state": "near"
              },
              {
                "t": "14:00",
                "db": "61.1",
                "state": "ok"
              },
              {
                "t": "14:10",
                "db": "63.7",
                "state": "near"
              },
              {
                "t": "14:20",
                "db": "68.0",
                "state": "over"
              },
              {
                "t": "14:30",
                "db": "70.8",
                "state": "over"
              },
              {
                "t": "14:40",
                "db": "70.0",
                "state": "over"
              },
              {
                "t": "14:50",
                "db": "66.1",
                "state": "over"
              },
              {
                "t": "15:00",
                "db": "62.2",
                "state": "near"
              }
            ]
          },
          "f": {
            "name": "F 정문",
            "where": "차량 출입구",
            "now": "64.0",
            "state": "near",
            "word": "기준 가까움",
            "notes": [
              {
                "t": "13:10",
                "db": "60.8",
                "state": "ok"
              },
              {
                "t": "13:20",
                "db": "58.7",
                "state": "ok"
              },
              {
                "t": "13:30",
                "db": "57.5",
                "state": "ok"
              },
              {
                "t": "13:40",
                "db": "65.8",
                "state": "over"
              },
              {
                "t": "13:50",
                "db": "60.3",
                "state": "ok"
              },
              {
                "t": "14:00",
                "db": "62.1",
                "state": "near"
              },
              {
                "t": "14:10",
                "db": "62.4",
                "state": "near"
              },
              {
                "t": "14:20",
                "db": "60.8",
                "state": "ok"
              },
              {
                "t": "14:30",
                "db": "58.6",
                "state": "ok"
              },
              {
                "t": "14:40",
                "db": "57.5",
                "state": "ok"
              },
              {
                "t": "14:50",
                "db": "66.1",
                "state": "over"
              },
              {
                "t": "15:00",
                "db": "64.0",
                "state": "near"
              }
            ]
          }
        },
        "updatedAt": "2026-10-22T05:59:00Z"
      },
      "/site/summary": {
        "value": {
          "date": "10월 22일 목요일",
          "time": "15:00",
          "limit": "65 dB",
          "max": "70.8 dB",
          "maxAt": "E · 14:30",
          "overCount": "4",
          "note": "E 타워크레인 아래는 현장 안 — 기준 대신 참고(넘음 수에서 뺌)"
        },
        "updatedAt": "2026-10-22T05:59:00Z"
      },
      "/site/over": {
        "value": [
          {
            "point": "A",
            "over": 2
          },
          {
            "point": "B",
            "over": 0
          },
          {
            "point": "C",
            "over": 0
          },
          {
            "point": "D",
            "over": 0
          },
          {
            "point": "E",
            "over": 8
          },
          {
            "point": "F",
            "over": 2
          }
        ],
        "updatedAt": "2026-10-22T05:59:00Z"
      }
    }
  }
};
