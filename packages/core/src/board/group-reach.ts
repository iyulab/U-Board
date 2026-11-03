// How large a group's canvas is when the group does not say: as far right and down as the boxes its parts are placed with go.

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isBox = (v: unknown): v is [number, number, number, number] =>
  Array.isArray(v) && v.length === 4 && v.every(n => typeof n === 'number' && Number.isFinite(n)) && (v[2] as number) > 0 && (v[3] as number) > 0;

/**
 * The size a group's canvas reaches: the largest `x + width` and `y + height` of the boxes (`[x, y, width, height]`) its parts are
 * placed with — a part per item of a list counts each of its items' boxes. `undefined` when a part is placed with no box (a
 * point, or by the fields of its items), or there is none: the size is then the group's to say.
 */
export function groupReach(group: { place?: unknown }): [number, number] | undefined {
  if (!isObj(group.place)) return undefined;
  const boxes: [number, number, number, number][] = [];
  for (const place of Object.values(group.place)) {
    if (isBox(place)) boxes.push(place);
    else if (isObj(place) && !Array.isArray(place.at)) {
      for (const one of Object.values(place)) {
        if (!isBox(one)) return undefined;
        boxes.push(one);
      }
    } else return undefined;
  }
  if (boxes.length === 0) return undefined;
  const width = Math.max(...boxes.map(b => b[0] + b[2]));
  const height = Math.max(...boxes.map(b => b[1] + b[3]));
  return width > 0 && height > 0 ? [width, height] : undefined;
}
