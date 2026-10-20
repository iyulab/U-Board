// Example data written for the sample, not recorded from a source — no public source carries a shop's sales.
// Keep it consistent: revenue is orders × average order value (2,184 × ₩58,300 ≈ ₩127.3M), conversion is orders ÷
// visitors (2,184 ÷ 61,700 ≈ 3.5 %), the funnel ends at the day's orders, the categories and the channels add up to
// the revenue, and the hour now (15:00) is where today's line stops.
import type { SampleSnapshot } from '../sample-pack.js';

const at = '2026-10-20T05:59:00Z';

const hours = Array.from({ length: 24 }, (_, h) => h);
const yesterday = [42, 28, 17, 11, 9, 14, 31, 58, 92, 118, 131, 142, 166, 158, 149, 152, 171, 188, 214, 246, 268, 241, 176, 98];
const today = [45, 31, 19, 12, 10, 15, 34, 63, 101, 129, 142, 158, 181, 174, 166];

export const snapshot: SampleSnapshot = {
  capturedAt: '2026-10-20T06:00:00.000Z',
  responses: {
    shop: {
      '/sales/today': {
        revenue: 127.3,
        target: 180,
        progress: 71,
        orders: 2184,
        ordersDelta: 8.4,
        aov: 58300,
        aovDelta: -2.1,
        conversion: 3.5,
        conversionDelta: 0.4,
        visitors: 61700,
        visitorsDelta: 5.9,
        updatedAt: at,
      },
      '/sales/funnel': {
        value: [
          { stage: '방문', count: 61700 },
          { stage: '상품 조회', count: 32400 },
          { stage: '장바구니', count: 8900 },
          { stage: '결제 시작', count: 3150 },
          { stage: '주문 완료', count: 2184 },
        ],
        updatedAt: at,
      },
      '/sales/categories': {
        value: [
          { name: '패션', value: 38.2, children: [{ name: '아우터', value: 17.9 }, { name: '니트', value: 11.4 }, { name: '신발', value: 8.9 }] },
          { name: '뷰티', value: 26.1, children: [{ name: '스킨케어', value: 14.8 }, { name: '메이크업', value: 11.3 }] },
          { name: '리빙', value: 24.5, children: [{ name: '침구', value: 13.2 }, { name: '주방', value: 11.3 }] },
          { name: '디지털', value: 21.4, children: [{ name: '음향', value: 12.6 }, { name: '액세서리', value: 8.8 }] },
          { name: '식품', value: 17.1, children: [{ name: '간편식', value: 10.4 }, { name: '음료', value: 6.7 }] },
        ],
        updatedAt: at,
      },
      '/sales/channels': {
        value: [
          { channel: '앱', revenue: 71.9 },
          { channel: '모바일 웹', revenue: 31.8 },
          { channel: 'PC', revenue: 15.3 },
          { channel: '라이브 커머스', revenue: 8.3 },
        ],
        updatedAt: at,
      },
      '/sales/hourly': {
        value: hours.map(h => ({ hour: `${String(h).padStart(2, '0')}시`, yesterday: yesterday[h], ...(h < today.length ? { today: today[h] } : {}) })),
        updatedAt: at,
      },
      '/sales/heat': {
        value: ['월', '화', '수', '목', '금', '토', '일'].flatMap((day, d) =>
          ['00', '04', '08', '12', '16', '20'].map((slot, s) => ({
            day,
            slot: `${slot}시`,
            orders: Math.round([0.25, 0.12, 0.55, 0.85, 0.9, 1][s] * [0.82, 0.78, 0.8, 0.86, 1, 1.18, 1.1][d] * 900),
          }))
        ),
        updatedAt: at,
      },
      '/sales/orders': {
        value: [
          { who: '김*진 · 서울 마포', item: '울 블렌드 롱코트', amount: '₩289,000', badge: 'VIP' },
          { who: '이*수 · 부산 해운대', item: '수분 크림 2개 세트', amount: '₩46,800', badge: '' },
          { who: '박*영 · 경기 성남', item: '노이즈캔슬링 이어폰', amount: '₩219,000', badge: '첫 구매' },
          { who: '최*아 · 대구 수성', item: '구스 이불 Q', amount: '₩159,000', badge: '' },
          { who: '정*호 · 인천 연수', item: '그릭요거트 12입', amount: '₩23,900', badge: '정기' },
          { who: '한*림 · 광주 서구', item: '캐시미어 니트', amount: '₩98,000', badge: '' },
        ],
        updatedAt: at,
      },
    },
  },
};
