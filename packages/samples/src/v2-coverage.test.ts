import { describe, it, expect } from 'vitest';
import { SAMPLE_PACKS } from './index.js';
import { v2Coverage } from './v2-coverage.js';

// The boards whose one-time conversion to the language's second version reads exactly what the first version read. A
// ratchet: a board here that stops reading the same fails, and a board that starts reading the same fails until it is
// added — so what the conversion reaches only grows, and every sample on this list is the acceptance test at the end.
const READ_THE_SAME = [
  'apiary-stitch', 'aquarium-labels', 'bakery-sketch', 'bank-branch', 'bike-share', 'blood-journey', 'body-gap',
  'bowling-googie', 'brewery-scada', 'building-floor', 'bus-terminal', 'callcenter-cork', 'campsite-papercut',
  'clinic-kiosk', 'clinic-vaccines', 'coldchain-vapor', 'count-hall', 'dam-steampunk', 'daycare-bricks',
  'delivery-boardgame', 'elevator-tui', 'factory-floor', 'farmers-market', 'festival-ops', 'fire-dispatch',
  'harbor-auction', 'harbor-radar', 'home-eink', 'hotel-glass', 'island-ferry', 'kiln-porcelain', 'library-report',
  'lighthouse-stamps', 'line-flow', 'lost-found-dossier', 'makerspace-shadowboard', 'mall-wayfinding', 'museum-najeon',
  'night-market-neon', 'observatory-glass', 'offshore-wind-chart', 'palace-visit', 'parcel-hub', 'park-trails',
  'parking-signs', 'pc-cafe', 'pool-mosaic', 'port-terminal', 'power-sld', 'produce-market', 'quake-helicorder',
  'recycling-polaroid', 'school-chalkboard', 'seoul-air', 'server-room', 'site-noise-score', 'ski-resort',
  'theatre-boxoffice', 'theme-park', 'tunnel-tbm', 'utility-regions', 'vet-comic', 'wafer-maps', 'ward-beds',
  'wildfire-topo', 'wildlife-chaekgado', 'winery-engraving',
];

describe('conversion of the samples to the second version', () => {
  // One pass over every sample, shared by the checks below — it resolves every widget twice.
  const outcomes = v2Coverage(SAMPLE_PACKS);

  it('leaves no board invalid and no fully converted board reading differently', { timeout: 120_000 }, async () => {
    const wrong = (await outcomes).filter(o => o.result === 'invalid' || o.result === 'differs');
    expect(wrong.map(o => `${o.id} (${o.result}): ${o.notes.slice(0, 3).join(' · ')}`)).toEqual([]);
  });

  it('reads the same for exactly the boards it reached, and only gains boards', { timeout: 120_000 }, async () => {
    const same = (await outcomes).filter(o => o.result === 'same').map(o => o.id).sort();
    const lost = READ_THE_SAME.filter(id => !same.includes(id));
    const gained = same.filter(id => !READ_THE_SAME.includes(id));
    expect(lost, 'boards that no longer read the same').toEqual([]);
    expect(gained, 'boards that now read the same — add them to READ_THE_SAME').toEqual([]);
  });
});
