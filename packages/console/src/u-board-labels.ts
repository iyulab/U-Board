import { ageText, type UBoardLabels } from '@iyulab/u-board';

/** U-Board 저작·뷰어 컴포넌트의 한국어 문구 — 콘솔 전체와 같은 말을 쓴다("연결 끊김" 등). */
export const KO_LABELS: UBoardLabels = {
  addNode: '노드 추가',
  addRectDecoration: '사각형 장식 추가',
  addTextDecoration: '텍스트 장식 추가',
  save: '저장',
  export: '내보내기',
  import: '가져오기',
  importFailed: '문서를 가져오지 못했습니다.',

  zoomIn: '확대',
  zoomOut: '축소',
  fitToView: '화면에 맞추기',

  editorHeading: '편집기',
  editorRegion: '편집기',
  previewHeading: '실시간 미리보기',
  previewRegion: '실시간 미리보기',
  boardRegion: '보드',
  resolving: '불러오는 중…',
  noDocument: '불러온 문서가 없습니다 — 가져오기로 여세요.',
  debugDocument: 'ViewDocument (디버그)',

  selectNode: '노드를 선택하세요.',
  multipleSelected: '{count}개 선택됨 — 하나를 선택하면 편집할 수 있습니다.',
  propertiesHeading: '속성',
  widgetType: '위젯 타입',
  staticProps: '정적 props (JSON)',
  invalidJson: '올바른 JSON이 아닙니다',
  bindingsHeading: '바인딩',
  noBindings: '바인딩 없음',
  editBinding: '수정',
  removeBinding: '제거',
  noDataSources: '연결된 데이터소스가 없습니다.',
  propPath: '프롭 경로',
  dataSource: '데이터소스',
  demoReference: '참조 키',
  path: '요청 경로',
  valuePath: '값 경로',
  explore: '탐색',
  exploreFailed: '탐색에 실패했습니다',
  previewBinding: '미리보기',
  previewFailed: '미리보기 호출에 실패했습니다',
  saveBinding: '바인딩 저장',
  previewValue: '값',

  decorationHeading: '장식',
  decorationText: '라벨',
  decorationHint: '캔버스에서 드래그/리사이즈로 위치와 크기를 조정하세요.',
  newTextDecoration: '라벨',

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
