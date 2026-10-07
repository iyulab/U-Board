// Every sentence the site states about the product, in both languages. Each one that makes a claim
// carries the id of its row in ../claims.tsv, which records the claim's status and where the
// repository backs it — test/claims.test.ts keeps the two in step.

export type Locale = 'ko' | 'en';

export const SITE_URL = 'https://board.u-platform.kr';
export const APP_URL = 'https://board-app.u-platform.kr/';
export const SOURCE_URL = 'https://github.com/iyulab/U-Board';
export const DOCS_URL = 'https://github.com/iyulab/U-Board/tree/main/docs';
export const SELF_HOSTING_URL = 'https://github.com/iyulab/U-Board/blob/main/docs/self-hosting.md';
export const NPM_URL = 'https://www.npmjs.com/package/@iyulab/u-board';
export const CONTACT_URL = 'https://u-platform.kr/contact';

export interface Section {
  claim: string;
  heading: string;
  body: string;
}

export interface Copy {
  title: string;
  description: string;
  headline: string;
  lede: { claim: string; text: string };
  tryIt: string;
  readSource: string;
  figure: {
    caption: string;
    plant: string;
    live: string;
    stale: string;
    disconnected: string;
    staleNote: string;
    nodes: { pump: string; running: string; temp: string; pressure: string; conveyor: string };
  };
  sections: Section[];
  delivery: { heading: string; items: Section[] };
  notHeading: string;
  not: Section[];
  license: Section;
  footer: { source: string; docs: string; selfHosting: string; npm: string; contact: string };
  otherLanguage: string;
}

export const COPY: Record<Locale, Copy> = {
  ko: {
    title: 'U-Board — 도면 위에 실시간 데이터를 잇는 공간형 대시보드',
    description:
      '배경 그림 위에 데이터를 연결한 화면을 만들고, 그 화면을 다른 웹 페이지에 넣어 보여 줍니다. 값마다 지금 상태와 그 이유를 함께 표시합니다.',
    headline: '도면 위에 실시간 데이터를 잇는 공간형 대시보드',
    lede: {
      claim: 'lede',
      text: '도면·네트워크도·지도 같은 배경 위에 값을 놓은 화면을 만들고, 그 화면을 운영 중인 다른 웹 페이지에 넣어 보여 줍니다. 값은 화면을 열어 둔 동안 그 값을 가진 시스템에서 계속 읽어 옵니다.',
    },
    tryIt: '데모 열기',
    readSource: '소스 보기',
    figure: {
      caption: '값마다 자기 상태를 표시합니다. 정상인 값에는 테두리가 없습니다.',
      plant: '2라인 펌프실',
      live: '정상',
      stale: '갱신 지연',
      disconnected: '연결 끊김',
      staleNote: '데이터소스에 연결할 수 없음, 5분 전',
      nodes: { pump: '펌프 A', running: '가동 중', temp: '온도', pressure: '압력', conveyor: '컨베이어' },
    },
    sections: [
      {
        claim: 'quality',
        heading: '값마다 자기 상태를 가집니다',
        body: '연결된 값은 하나하나 정상·갱신 지연·연결 끊김 중 하나로 표시되고, 정상이 아니면 그 이유(데이터소스 연결 불가, 자격 증명 거부, 원천에 값 없음, 요청 한도 초과)와 마지막 값을 받은 지 얼마나 됐는지를 함께 보여 줍니다. 원천 하나가 멈춰도 화면 전체가 오류가 되지 않습니다.',
      },
      {
        claim: 'connect',
        heading: 'HTTP로 말하는 시스템이면 연결합니다',
        body: '범용 HTTP 연결은 고정 토큰이나 헤더, OAuth 2.0 클라이언트 자격 증명으로 원천에 접속하고, JSON 응답에서 JSON Pointer로 값을 고릅니다. 자격 증명은 서버에만, 그 데이터베이스에 봉인된 채로 있고 브라우저로 가지 않습니다.',
      },
      {
        claim: 'embed',
        heading: '다른 화면에 넣어 씁니다',
        body: '공유 링크 하나로 보드를 로그인 없이 읽기 전용으로 엽니다. 다른 앱의 페이지에 iframe으로 넣을 수 있고, 링크마다 유효 기간을 정하거나 언제든 회수할 수 있습니다.',
      },
    ],
    delivery: {
      heading: '쓰는 방식',
      items: [
        {
          claim: 'delivery-container',
          heading: '컨테이너 하나로 사내에 설치',
          body: '서버·콘솔·공유 뷰어가 한 컨테이너 이미지에 들어 있고, 버전마다 이미지와 사내망 반입용 파일을 출처 증명과 함께 공개합니다. 인터넷이 닿지 않는 사내망에서도 돌아가고, PostgreSQL 하나(작은 설치는 내장 DB)만 있으면 됩니다.',
        },
        {
          claim: 'delivery-library',
          heading: '라이브러리로 자기 앱 안에',
          body: '저작 화면과 뷰어를 npm 패키지 @iyulab/u-board로 가져다 자기 웹 앱 안에 넣을 수 있습니다.',
        },
        {
          claim: 'delivery-demo',
          heading: '설치 전에 데모로',
          body: '이유랩이 운영하는 데모 인스턴스에서 설치 없이 먼저 써 볼 수 있습니다.',
        },
      ],
    },
    notHeading: '하지 않는 일',
    not: [
      {
        claim: 'not-hmi',
        heading: 'HMI·SCADA 패키지가 아닙니다',
        body: '심벌 라이브러리, 알람 처리, 제어 출력, 화면 이동은 없습니다. 상태를 보여 주는 화면을 그리고, 나머지는 그 화면을 품은 시스템이 맡습니다.',
      },
      {
        claim: 'not-data',
        heading: '데이터를 모아 두지 않습니다',
        body: '보드는 어떤 값을 어디서 읽을지만 기억합니다. 값은 그 값을 가진 시스템에 그대로 있습니다.',
      },
      {
        claim: 'not-bi',
        heading: 'BI 도구가 아닙니다',
        body: '데이터 웨어하우스 위의 차트와 피벗 표는 다루지 않습니다.',
      },
    ],
    license: {
      claim: 'license',
      heading: '열린 소스',
      body: '소스는 AGPL-3.0으로 공개되어 있습니다. AGPL 조건을 따르기 어려운 조직에는 상용 라이선스를 드립니다.',
    },
    footer: {
      source: '소스',
      docs: '문서',
      selfHosting: '직접 설치',
      npm: 'npm 패키지',
      contact: '문의',
    },
    otherLanguage: 'English',
  },
  en: {
    title: 'U-Board — spatial dashboards that bind live data onto floor plans',
    description:
      'Build a view by binding data onto a background drawing, then embed that view in any web page. Every value shows its current state, and why.',
    headline: 'Spatial dashboards that bind live data onto floor plans',
    lede: {
      claim: 'lede',
      text: 'Place values on a floor plan, a network diagram or a map, and embed the view in the web pages your operators already use. Each value is read from the system that owns it for as long as the view is open.',
    },
    tryIt: 'Try the demo',
    readSource: 'Read the source',
    figure: {
      caption: 'Every value shows its own state. A value that is live has no frame.',
      plant: 'Line 2 pump room',
      live: 'Live',
      stale: 'Stale',
      disconnected: 'Disconnected',
      staleNote: 'data source unreachable, 5 minutes ago',
      nodes: { pump: 'Pump A', running: 'Running', temp: 'Temperature', pressure: 'Pressure', conveyor: 'Conveyor' },
    },
    sections: [
      {
        claim: 'quality',
        heading: 'Every value carries its own state',
        body: 'Each bound value is live, stale or disconnected, and when it is not live the view says why — the source is unreachable, the credentials were refused, the value is not at the source, or requests are rate limited — and how long ago the last value arrived. One source going quiet does not turn the whole view into an error.',
      },
      {
        claim: 'connect',
        heading: 'Anything that speaks HTTP',
        body: 'The generic HTTP connector reaches a source with a static token or header, or OAuth 2.0 client credentials, and picks the value out of a JSON response with a JSON Pointer. Credentials stay on the server, sealed in its database, and never reach the browser.',
      },
      {
        claim: 'embed',
        heading: 'Put it in another screen',
        body: 'A share link opens a board read-only without signing in. Embed it in another application’s page with an iframe, give each link an expiry, or revoke it at any time.',
      },
    ],
    delivery: {
      heading: 'Ways to run it',
      items: [
        {
          claim: 'delivery-container',
          heading: 'One container, on your network',
          body: 'The server, console and share viewer ship in one container image, released by version with an archive to carry onto a closed network, both attested to their build. Run it on your own network — no internet access needed — with a PostgreSQL database, or the embedded one for a small installation.',
        },
        {
          claim: 'delivery-library',
          heading: 'A library inside your app',
          body: 'Bring the authoring view and the viewer into your own web application with the npm package @iyulab/u-board.',
        },
        {
          claim: 'delivery-demo',
          heading: 'A demo before you install',
          body: 'Try it first on the demo instance iyulab operates — nothing to install.',
        },
      ],
    },
    notHeading: 'What it does not do',
    not: [
      {
        claim: 'not-hmi',
        heading: 'Not an HMI/SCADA package',
        body: 'There is no symbol library, alarm handling, control output or screen navigation. U-Board draws status views; the system around them keeps those jobs.',
      },
      {
        claim: 'not-data',
        heading: 'It does not collect your data',
        body: 'A board remembers which value to read and where. The values stay in the systems that own them.',
      },
      {
        claim: 'not-bi',
        heading: 'Not a business-intelligence tool',
        body: 'Charts and pivot tables over a data warehouse are out of scope.',
      },
    ],
    license: {
      claim: 'license',
      heading: 'Open source',
      body: 'The source is published under AGPL-3.0. A commercial license is available for organizations that cannot adopt AGPL-3.0 terms.',
    },
    footer: {
      source: 'Source',
      docs: 'Documentation',
      selfHosting: 'Self-hosting',
      npm: 'npm package',
      contact: 'Contact',
    },
    otherLanguage: '한국어',
  },
};
