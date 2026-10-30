// The widget library's own text in Korean (a table's pagination, a region's name): with `locale` below,
// the widgets on a Korean board speak Korean too.
import '@iyulab/u-widgets/locales/ko';
import { timeText, type UBoardLabels } from './labels.js';
import { ageText } from './quality-text.js';

/** Every label in Korean — what `BoardView` and `ViewerPage` show when given `labels: KO_LABELS`,
 *  with times of day and ages in Korean too (`timeText('ko')`, `ageText('ko')`), and the widgets'
 *  own text and names in Korean. */
export const KO_LABELS: UBoardLabels = {
  locale: 'ko-KR',
  canvasCell: '캔버스',
  wheelZoomHint: 'Ctrl (⌘) + 스크롤로 확대·축소',

  zoomIn: '확대',
  zoomOut: '축소',
  fitToView: '화면에 맞추기',
  boardRegion: '보드',
  dataSources: '데이터 출처',
  exampleData: '예시 데이터',
  resolving: '불러오는 중…',
  backgroundBlocked: '배경 그림을 표시하지 않음 — 허용된 출처가 아님',
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
      format: '원천의 응답 형식을 읽을 수 없음',
      source: '원천이 응답에 오류를 알림',
      throttled: '요청 한도 초과',
      lagging: '원천이 기대만큼 갱신하지 않음',
      pending: '원천 응답이 느려 아직 읽는 중',
    },
    age: ageText('ko'),
    brief: {
      quality: { stale: '지난 값', disconnected: '값 없음' },
      reason: {
        transport: '원천 응답 없음',
        auth: '인증 거부',
        address: '값을 찾지 못함',
        format: '읽을 수 없는 응답',
        source: '원천 오류',
        throttled: '요청 한도',
        lagging: '원천 갱신 늦음',
        pending: '읽는 중',
      },
    },
  },
};
