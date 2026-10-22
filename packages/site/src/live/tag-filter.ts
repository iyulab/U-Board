// The filter's rules, apart from the page so they can be tested: which tags an address picks, the address for a pick,
// and whether a board's tags match it.

/** The tags `?tag=a,b` picks — those the gallery knows; anything else in the address is ignored. */
export function pickedFromQuery(params: URLSearchParams, known: ReadonlySet<string>): Set<string> {
  const raw = params.get('tag') ?? '';
  return new Set(raw.split(',').filter(tag => known.has(tag)));
}

/** The query for a pick, keeping any other parameter the address had. */
export function queryFor(picked: ReadonlySet<string>, params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  if (picked.size === 0) next.delete('tag');
  else next.set('tag', [...picked].join(','));
  const text = next.toString().replace(/%2C/g, ',');
  return text ? `?${text}` : '';
}

/** A board matches when it has every tag picked (none picked: every board). */
export function matches(tags: readonly string[], picked: ReadonlySet<string>): boolean {
  for (const tag of picked) if (!tags.includes(tag)) return false;
  return true;
}
