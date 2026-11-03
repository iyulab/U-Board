// The origin of an `https://` address, read without the `URL` class. `URL` is a web platform API, not part of the language: an
// engine a host embeds (see `scripts/build-check-bundle.mjs`) has no such global, and the check must answer there as it does
// anywhere. So an address is read by its shape — a scheme, a host, an optional port, then a path, query or fragment — and one
// that is not plainly of that shape (a user name in front of the host, a bracketed or non-ASCII host, a numeric host that is not a
// dotted decimal address, a trailing dot, a port out of range) has no origin: the check refuses what it cannot read the same way
// everywhere, where `URL` would have normalised it.

const ADDRESS = /^https:\/\/([^/?#\\]*)/i;
const LABEL = '[a-z0-9](?:[a-z0-9-]*[a-z0-9])?';
const HOST_AND_PORT = new RegExp(`^(${LABEL}(?:\\.${LABEL})*)(?::([0-9]{1,5}))?$`, 'i');
const OCTET = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])';
const DOTTED_ADDRESS = new RegExp(`^${OCTET}(?:\\.${OCTET}){3}$`);

/** The origin of an `https://` address — `https://example.com`, `https://example.com:8443` — or `undefined` when it is not one. */
export function httpsOrigin(address: string): string | undefined {
  const authority = ADDRESS.exec(address)?.[1];
  if (authority === undefined) return undefined;
  const parts = HOST_AND_PORT.exec(authority);
  if (parts === null) return undefined;
  const host = parts[1]!.toLowerCase();
  // A host whose last label is a number (or `0x…`) is read by `URL` as an address in some base — only the dotted decimal one is read here.
  const lastLabel = host.slice(host.lastIndexOf('.') + 1);
  if ((/^[0-9]+$/.test(lastLabel) || lastLabel.startsWith('0x')) && !DOTTED_ADDRESS.test(host)) return undefined;
  const port = parts[2] === undefined ? undefined : Number(parts[2]);
  if (port !== undefined && port > 65535) return undefined;
  return `https://${host}${port === undefined || port === 443 ? '' : `:${port}`}`;
}
