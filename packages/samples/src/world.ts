import type { AreaFrame } from './frame.js';

/**
 * The land, one bit to a 3° cell, 120 cells from 25°W eastward round to 25°W again (split in the Atlantic, so Europe
 * sits at the left, the Americas at the right and the Pacific between Asia and America) and 45 rows from 78°N to 57°S.
 * Rasterised from Natural Earth's 1:110m land (public domain). Longitudes past 180 continue eastward — the Americas.
 */
export const LAND: readonly string[] = [
  '80000002003c000000000081dc7fff',
  '800000201fff6100000001c1dc03ff',
  '8000e001fffffffc001c003cdf83ff',
  '0007fdfffffffffffc3ffffff8e3f8',
  '600ef7fffffffffff25fffffeac1e0',
  '003dfffffffffffdc07fffff8300c0',
  '002cfffffffffe0400083fff83e000',
  '0319fffffffffc0c00200ffff3f000',
  '05bffffffffffe08000003fffbfc00',
  '00fffffffffffe00000003ffffd400',
  '00fff7fffffffc00000001ffffe000',
  '02ebc3fffffff980000001ffff8000',
  '07953fffffffe100000001ffff0000',
  '07017fffffffa200000001fffe0000',
  '03f00fffffff2c00000000fffe0000',
  '07fdafffffff80000000007ff80000',
  '07ffff7fffff80000000003f000000',
  '1ffff7cfffff00000000000f040000',
  '1ffff7f0fffe8000000000070c0000',
  '1ffffbf078f0000000080007208000',
  '1ffff9c070f0800000000001e00000',
  '1ffffd006078400000000000300000',
  '1fffff802010000000000000094000',
  '0fffff80104020000000000007f800',
  '003fff0000a300000000000001fe00',
  '001ffe00004700000000000003ff00',
  '001ffc00002688000000000007ff80',
  '000ff800001003800000000007fff0',
  '0007f800000c03800000000003fff8',
  '0007fc00000000200000000003fff0',
  '0007fc0000000c000000000001ffe0',
  '000ffd8000003d800000000000ffe0',
  '0007f18000007f8000000000007fe0',
  '0007f1000003ffc000000000007fc0',
  '0007e1000003ffe000000000007f00',
  '0003e0000001fff000000000007f00',
  '0003c0000001ffe00000000000fe00',
  '00000000000107e00000000000fc00',
  '00000000000001c00000000000f800',
  '00000000000000000000000000f000',
  '00000000000000004000000000e000',
  '00000000000000008000000001c000',
  '00000001000000000000000001c000',
  '000000000000000000000000008000',
  '000000000000000000000000004000',
];

/** The world drawn with each cell `cell` units square, its top-left corner at `x`, `y` — and the longitudes and latitudes
 *  its edges stand for, so a place is placed on it with `project`. */
export function worldFrame(x: number, y: number, cell: number): AreaFrame {
  return { x, y, width: 120 * cell, height: 45 * cell, north: 78, south: -57, west: -25, east: 335 };
}

/** The land as dots, one to a cell, for an SVG drawing: a group of circles filled `fill`. */
export function landDots(frame: AreaFrame, fill: string, radius: number): string {
  const cell = frame.width / 120;
  const dots: string[] = [];
  LAND.forEach((row, r) => {
    const bits = [...row].map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    [...bits].forEach((bit, c) => {
      if (bit === '1') dots.push(`<circle cx="${frame.x + c * cell + cell / 2}" cy="${frame.y + r * cell + cell / 2}" r="${radius}"/>`);
    });
  });
  return `<g fill="${fill}">${dots.join('')}</g>`;
}
