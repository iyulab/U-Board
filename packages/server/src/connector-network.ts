import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

/**
 * Which addresses requests made for connectors — reading a data source, obtaining an OAuth token,
 * testing a connection — may reach. Connector addresses are set by workspace owners, who on an
 * installation run for others are not trusted with the network the server runs in.
 * - `public`: public addresses only.
 * - `private` (default): also the private ranges (RFC 1918, carrier-grade NAT, IPv6 unique local),
 *   where an installation's own data sources usually live. Never the server's own loopback, link-local
 *   addresses, the cloud host services a server can reach (instance metadata, Azure's host endpoint),
 *   or unspecified/multicast addresses.
 * - `any`: no restriction — for development, or a data source running on the server's own host.
 */
export type ConnectorAddresses = 'public' | 'private' | 'any';

/** Reads `UBOARD_CONNECTOR_ADDRESSES`. Unset or empty means `private`; anything else fails startup. */
export function connectorAddressesFromEnv(value: string | undefined): ConnectorAddresses {
  if (!value) return 'private';
  if (value === 'public' || value === 'private' || value === 'any') return value;
  throw new Error(`UBOARD_CONNECTOR_ADDRESSES must be "public", "private" or "any" (got "${value}")`);
}

/** Never reachable unless `any`: the host itself and addresses no data source has. */
const LOCAL = new BlockList();
LOCAL.addSubnet('0.0.0.0', 8, 'ipv4'); // "this network", including the unspecified address
LOCAL.addSubnet('127.0.0.0', 8, 'ipv4'); // loopback
LOCAL.addSubnet('169.254.0.0', 16, 'ipv4'); // link-local — cloud metadata services
LOCAL.addSubnet('224.0.0.0', 4, 'ipv4'); // multicast
LOCAL.addSubnet('240.0.0.0', 4, 'ipv4'); // reserved, and the broadcast address
LOCAL.addSubnet('192.0.0.0', 24, 'ipv4'); // IETF protocol assignments — Oracle Cloud's legacy metadata (192.0.0.192)
// Cloud host services outside the link-local range, each inside a range otherwise allowed under
// `private` or `public`: Alibaba Cloud's metadata (in carrier-grade NAT space), Azure's host endpoint
// (WireServer, a public address), AWS's IPv6 metadata (in unique-local space).
LOCAL.addAddress('100.100.100.200', 'ipv4');
LOCAL.addAddress('168.63.129.16', 'ipv4');
LOCAL.addAddress('fd00:ec2::254', 'ipv6');
LOCAL.addAddress('::', 'ipv6'); // unspecified
LOCAL.addAddress('::1', 'ipv6'); // loopback
LOCAL.addSubnet('fe80::', 10, 'ipv6'); // link-local
LOCAL.addSubnet('ff00::', 8, 'ipv6'); // multicast

/** Reachable under `private` and `any`. */
const PRIVATE = new BlockList();
PRIVATE.addSubnet('10.0.0.0', 8, 'ipv4');
PRIVATE.addSubnet('172.16.0.0', 12, 'ipv4');
PRIVATE.addSubnet('192.168.0.0', 16, 'ipv4');
PRIVATE.addSubnet('100.64.0.0', 10, 'ipv4'); // carrier-grade NAT
PRIVATE.addSubnet('198.18.0.0', 15, 'ipv4'); // benchmarking
PRIVATE.addSubnet('fc00::', 7, 'ipv6'); // unique local

/** `::ffff:127.0.0.1` / `::ffff:7f00:1` — an IPv4 address written as IPv6 is judged as the IPv4 one. */
function unmapped(address: string, family: number): { address: string; family: 4 | 6 } {
  if (family !== 6) return { address, family: 4 };
  const lower = address.toLowerCase();
  if (!lower.startsWith('::ffff:')) return { address: lower, family: 6 };
  const rest = lower.slice('::ffff:'.length);
  if (isIP(rest) === 4) return { address: rest, family: 4 };
  const groups = rest.split(':');
  if (groups.length !== 2 || !groups.every(g => /^[0-9a-f]{1,4}$/.test(g))) return { address: lower, family: 6 };
  const [high, low] = groups.map(g => parseInt(g, 16));
  return { address: [high >> 8, high & 255, low >> 8, low & 255].join('.'), family: 4 };
}

/** Whether `policy` lets a connector request reach `address`. */
export function connectorAddressAllowed(address: string, family: number, policy: ConnectorAddresses): boolean {
  if (policy === 'any') return true;
  const ip = unmapped(address, family);
  const type = ip.family === 4 ? 'ipv4' : 'ipv6';
  if (LOCAL.check(ip.address, type)) return false;
  if (PRIVATE.check(ip.address, type)) return policy === 'private';
  return true;
}

/** The `code` of the error a refused address fails a request with. */
export const CONNECTOR_ADDRESS_REFUSED = 'ECONNECTORADDRESS';

function refused(host: string): Error {
  return Object.assign(new Error(`${host} is not an address connectors may reach`), { code: CONNECTOR_ADDRESS_REFUSED });
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** A `lookup` for outgoing connections that refuses a name resolving to any address the policy does
 *  not allow. Checked on the addresses the connection is actually made to — so a name that resolves
 *  differently from one lookup to the next (DNS rebinding) cannot slip past a check made earlier. */
function guardedLookup(policy: ConnectorAddresses) {
  return (hostname: string, options: { all?: boolean } & Record<string, unknown>, callback: LookupCallback) => {
    dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, []);
      if (addresses.some(a => !connectorAddressAllowed(a.address, a.family, policy))) return callback(refused(hostname), []);
      if (options.all) return callback(null, addresses);
      callback(null, addresses[0].address, addresses[0].family);
    });
  };
}

/**
 * The `fetch` connector requests go through. Under `any` it is the global one. Otherwise requests
 * go through a connection pool of their own whose connections are checked against the policy: an
 * address written into the URL before anything is sent, a host name as it resolves. A refused
 * address fails the request like an unreachable one — a `TypeError('fetch failed')` whose `cause`
 * has the code `CONNECTOR_ADDRESS_REFUSED`.
 */
export function createConnectorFetch(policy: ConnectorAddresses): typeof fetch {
  if (policy === 'any') return (input, init) => fetch(input, init);
  const dispatcher = new Agent({ connect: { lookup: guardedLookup(policy) as never } });
  return async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const family = isIP(host);
    if (family !== 0 && !connectorAddressAllowed(host, family, policy)) {
      throw new TypeError('fetch failed', { cause: refused(host) });
    }
    return (await undiciFetch(url, { ...(init as object), dispatcher } as never)) as unknown as Response;
  };
}
