import { ageText, timeText, type UBoardLabels } from '@iyulab/u-board/viewer';

/** 공유 뷰어(`ViewerPage`)가 보여 주는 U-Board 문구의 한국어 — 콘솔(`packages/console/src/u-board-labels.ts`)과 같은 말. */
export const KO_LABELS: Partial<UBoardLabels> = {
  zoomIn: '확대',
  zoomOut: '축소',
  fitToView: '화면에 맞추기',
  boardRegion: '보드',
  resolving: '불러오는 중…',
  lastUpdated: '갱신 {time}',
  notUpdating: '갱신이 멈춤 — 마지막 갱신 {time}',
  time: timeText('ko'),
  qualityText: {
    quality: {
      stale: '갱신 지연 — 마지막으로 받은 값을 표시 중',
      disconnected: '연결 끊김 — 값을 받지 못함',
    },
    reason: {
      transport: '데이터소스에 연결할 수 없음',
      auth: '자격 증명이 거부됨',
      address: '바인딩한 값이 원천에 없음',
      throttled: '요청 한도 초과',
    },
    age: ageText('ko'),
  },
};
