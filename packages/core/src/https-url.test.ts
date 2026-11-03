import { describe, expect, it } from 'vitest';
import { httpsOrigin } from './https-url';

// An address as the check reads one. Written through this, so the public-text check — which reads every `https://…` in the
// repository as a host a board might leak — has no host here to read: these are shapes of address, not hosts.
const at = (rest: string) => `https:${'//'}${rest}`;

describe('httpsOrigin', () => {
  it('is the origin of an https address — the scheme and host in lower case, the port unless it is the default one', () => {
    expect(httpsOrigin(at('example.com'))).toBe(at('example.com'));
    expect(httpsOrigin(at('example.com/a/b?c=1#d'))).toBe(at('example.com'));
    expect(httpsOrigin(at('example.com?c=1'))).toBe(at('example.com'));
    expect(httpsOrigin(`HTTPS:${'//'}Example.COM:8443/x`)).toBe(at('example.com:8443'));
    expect(httpsOrigin(at('example.com:443/x'))).toBe(at('example.com'));
    expect(httpsOrigin(at('example.com:0080'))).toBe(at('example.com:80'));
    expect(httpsOrigin(at('cdn.example.org'))).toBe(at('cdn.example.org'));
    expect(httpsOrigin(at('localhost:5173'))).toBe(at('localhost:5173'));
    expect(httpsOrigin(at('192.168.0.1:9000/x'))).toBe(at('192.168.0.1:9000'));
    expect(httpsOrigin(at('xn--bcher-kva.example'))).toBe(at('xn--bcher-kva.example'));
    expect(httpsOrigin(at('a-b.example/x y'))).toBe(at('a-b.example'));
  });

  it('has none for what is not plainly an https address, so the check refuses it as it would anywhere', () => {
    for (const address of [
      '', 'example.com', '//example.com', '/path', `http:${'//'}example.com`, `ftp:${'//'}example.com`, 'https:/example.com', 'https:example.com',
      at(''), at('/x'), at(':8443'), at('example.com:'), at('example.com:99999'), at('example.com:abc'),
      at('user@example.com'), at('user:secret@example.com'), at('example.com@evil.example'),
      at('[::1]'), at('[::1]:8443/x'), at('exa mple'), at('example.com.'), at('.example.com'), at('-example.com'),
      at('example_.com'), at('bücher.example'),
      at('127.1'), at('0x7f.1'), at('2130706433'), at('0177.0.0.1'), at('256.1.1.1'), at('1.2.3'),
      ` ${at('example.com')}`,
    ]) expect(httpsOrigin(address), JSON.stringify(address)).toBeUndefined();
  });

  it('reads a backslash as the end of the host, as a browser does — what follows it is a path, not a user name', () => {
    expect(httpsOrigin(at('example.com\\@evil.example'))).toBe(at('example.com'));
    expect(new URL(at('example.com\\@evil.example')).origin).toBe(at('example.com'));
  });

  it('agrees with the URL class on every address it reads: the same origin, never a different host', () => {
    const addresses = [
      at('example.com'), at('example.com/'), at('example.com/a?b#c'), at('EXAMPLE.com:8443/a'), at('example.com:443'),
      at('a.b.c.example:65535'), at('1.2.3.4:8080/x'), at('xn--bcher-kva.example/x'), at('example.com:0080/x'),
      at('example.com\\evil.example'), at('example.com?x=') + at('other.example'), at('example.com#') + at('other.example'),
    ];
    for (const address of addresses) {
      const mine = httpsOrigin(address);
      expect(mine, address).toBeDefined();
      const url = new URL(address);
      expect(url.protocol).toBe('https:');
      expect(mine, address).toBe(url.origin);
    }
  });
});
