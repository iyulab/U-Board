import type { ElementDefinition } from '../view-document.js';

/**
 * A name for exactly this definition: the SHA-256 of its JSON with keys in order, in base64url. A script element's
 * frame is addressed by it — `<frames>/<board>/<element>/<hash>` — so the frame's server serves the definition the
 * page has, and only a page that has the definition can name it. The same text on either side: a database may give
 * an object's keys back in another order, which is why they are sorted.
 */
export async function elementDefinitionHash(definition: ElementDefinition): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(definition)));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** JSON with every object's keys sorted — one text for one value, whatever order its keys came in. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(item => canonicalJson(item ?? null)).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
