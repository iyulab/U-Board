/** Reads `UBOARD_PUBLIC_URL`: the origin people open the console at, e.g.
 *  `https://board.example.com`. Unset or empty means "not configured". Anything but a bare http(s)
 *  origin fails startup — a link built on a mistyped value would reach inboxes broken. */
export function publicUrlFromEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`UBOARD_PUBLIC_URL must be an http(s) origin such as https://board.example.com (got "${value}")`);
  }
  const bare = url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !bare) {
    throw new Error(`UBOARD_PUBLIC_URL must be an http(s) origin such as https://board.example.com (got "${value}")`);
  }
  return url.origin;
}
