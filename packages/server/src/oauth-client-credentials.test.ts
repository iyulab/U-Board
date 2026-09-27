import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientCredentialsTokens, type ClientCredentials } from './oauth-client-credentials.js';

const CREDENTIALS: ClientCredentials = {
  cacheKey: 'c1',
  tokenUrl: 'https://auth.example.com/oauth/token',
  clientId: 'board-reader',
  clientSecret: 's3cret',
  clientAuth: 'basic',
};

function tokenResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

let now: number;
let tokens: ClientCredentialsTokens;
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  now = 1_000_000;
  tokens = new ClientCredentialsTokens(() => now);
});

describe('ClientCredentialsTokens', () => {
  it('requests a token with the client_credentials grant, authenticating the client with HTTP Basic', async () => {
    (fetch as any).mockResolvedValueOnce(tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }));
    expect(await tokens.get(CREDENTIALS)).toBe('tok-1');

    const [url, options] = (fetch as any).mock.calls[0];
    expect(url).toBe('https://auth.example.com/oauth/token');
    expect(options.method).toBe('POST');
    expect(options.redirect).toBe('manual');
    expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('board-reader:s3cret').toString('base64')}`);
    expect(new URLSearchParams(options.body).get('grant_type')).toBe('client_credentials');
    // Basic authentication must not also leak the secret into the body.
    expect(new URLSearchParams(options.body).has('client_secret')).toBe(false);
  });

  it('form-encodes the client id and secret before Basic-encoding them (RFC 6749 §2.3.1)', async () => {
    (fetch as any).mockResolvedValueOnce(tokenResponse({ access_token: 'tok', token_type: 'bearer' }));
    await tokens.get({ ...CREDENTIALS, clientId: 'a b:c', clientSecret: 'p&q=r' });
    const [, options] = (fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('a+b%3Ac:p%26q%3Dr').toString('base64')}`);
  });

  it('sends the client credentials in the request body when configured to', async () => {
    (fetch as any).mockResolvedValueOnce(tokenResponse({ access_token: 'tok', token_type: 'Bearer' }));
    await tokens.get({ ...CREDENTIALS, clientAuth: 'body', scope: 'asset.read' });
    const [, options] = (fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
    const params = new URLSearchParams(options.body);
    expect(params.get('client_id')).toBe('board-reader');
    expect(params.get('client_secret')).toBe('s3cret');
    expect(params.get('scope')).toBe('asset.read');
  });

  it('reuses a cached token until shortly before it expires, then requests a new one', async () => {
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }))
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-2', token_type: 'Bearer', expires_in: 3600 }));
    expect(await tokens.get(CREDENTIALS)).toBe('tok-1');
    now += 3500 * 1000;
    expect(await tokens.get(CREDENTIALS)).toBe('tok-1');
    now += 90 * 1000; // inside the refresh margin before the 3600s expiry
    expect(await tokens.get(CREDENTIALS)).toBe('tok-2');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight token request between concurrent callers', async () => {
    let release!: (value: unknown) => void;
    (fetch as any).mockReturnValueOnce(new Promise(resolve => { release = resolve; }));
    const both = Promise.all([tokens.get(CREDENTIALS), tokens.get(CREDENTIALS)]);
    release(tokenResponse({ access_token: 'tok', token_type: 'Bearer', expires_in: 60 }));
    expect(await both).toEqual(['tok', 'tok']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('requests a fresh token after invalidate, even before expiry', async () => {
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-1', token_type: 'Bearer', expires_in: 3600 }))
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-2', token_type: 'Bearer', expires_in: 3600 }));
    await tokens.get(CREDENTIALS);
    tokens.invalidate(CREDENTIALS.cacheKey);
    expect(await tokens.get(CREDENTIALS)).toBe('tok-2');
  });

  it('does not reuse a token issued for different credentials under the same key', async () => {
    (fetch as any)
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-old', token_type: 'Bearer', expires_in: 3600 }))
      .mockResolvedValueOnce(tokenResponse({ access_token: 'tok-new', token_type: 'Bearer', expires_in: 3600 }));
    await tokens.get(CREDENTIALS);
    expect(await tokens.get({ ...CREDENTIALS, clientSecret: 'rotated' })).toBe('tok-new');
  });

  it('keeps a token without expires_in until it is invalidated', async () => {
    (fetch as any).mockResolvedValueOnce(tokenResponse({ access_token: 'tok', token_type: 'Bearer' }));
    await tokens.get(CREDENTIALS);
    now += 24 * 3600 * 1000;
    expect(await tokens.get(CREDENTIALS)).toBe('tok');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a non-2xx token response', tokenResponse({ error: 'invalid_client' }, 401)],
    ['a response without access_token', tokenResponse({ token_type: 'Bearer' })],
    ['a non-Bearer token type', tokenResponse({ access_token: 'tok', token_type: 'mac' })],
  ])('rejects on %s and caches nothing', async (_label, response) => {
    (fetch as any).mockResolvedValueOnce(response);
    await expect(tokens.get(CREDENTIALS)).rejects.toThrow();
    (fetch as any).mockResolvedValueOnce(tokenResponse({ access_token: 'tok', token_type: 'Bearer' }));
    expect(await tokens.get(CREDENTIALS)).toBe('tok');
  });
});
