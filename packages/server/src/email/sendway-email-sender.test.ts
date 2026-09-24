import { describe, it, expect, vi } from 'vitest';
import { createSendwayPasswordResetEmailSender, sendwayConfigFromEnv } from './sendway-email-sender.js';

function fakeFetch(response: { ok: boolean; status: number; text?: () => Promise<string> }) {
  return vi.fn().mockResolvedValue(response as unknown as Response);
}

const BASE_URL = 'https://sendway.example.com';

describe('sendwayConfigFromEnv', () => {
  it('returns undefined when no API key is set (the log-the-token fallback applies)', () => {
    expect(sendwayConfigFromEnv({})).toBeUndefined();
  });

  it('reads the API key and base URL', () => {
    expect(sendwayConfigFromEnv({ SENDWAY_API_KEY: 'k', SENDWAY_BASE_URL: BASE_URL })).toEqual({
      apiKey: 'k',
      baseUrl: BASE_URL,
    });
  });

  it('rejects an API key without a base URL instead of guessing a deployment', () => {
    expect(() => sendwayConfigFromEnv({ SENDWAY_API_KEY: 'k' })).toThrow(/SENDWAY_BASE_URL/);
  });
});

describe('createSendwayPasswordResetEmailSender', () => {
  it('does not double the slash when the base URL ends with one', async () => {
    const fetchFn = fakeFetch({ ok: true, status: 200 });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: `${BASE_URL}/` }, fetchFn);

    await send({ email: 'user@example.com', token: 't' });

    expect(fetchFn.mock.calls[0][0]).toBe('https://sendway.example.com/messages/email');
  });

  it('POSTs to /messages/email on the configured Sendway deployment with the tenant key and recipient', async () => {
    const fetchFn = fakeFetch({ ok: true, status: 200 });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: BASE_URL }, fetchFn);

    await send({ email: 'user@example.com', token: 'the-reset-token' });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://sendway.example.com/messages/email');
    expect(init.method).toBe('POST');
    expect(init.headers['X-Api-Key']).toBe('sw_test_key');
    expect(init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(['user@example.com']);
    expect(typeof body.subject).toBe('string');
    expect(body.body).toContain('the-reset-token');
  });

  it('sends the reset token as the Idempotency-Key so a retried request replays instead of double-sending', async () => {
    const fetchFn = fakeFetch({ ok: true, status: 200 });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: BASE_URL }, fetchFn);

    await send({ email: 'user@example.com', token: 'the-reset-token' });

    const [, init] = fetchFn.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toBe('the-reset-token');
  });

  it('throws when Sendway responds with a non-ok status, so the caller logs it as a failed send', async () => {
    const fetchFn = fakeFetch({ ok: false, status: 502, text: () => Promise.resolve('upstream SMTP unreachable') });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: BASE_URL }, fetchFn);

    await expect(send({ email: 'user@example.com', token: 'tok' })).rejects.toThrow(/502/);
  });

  it('sets an AbortSignal timeout on the request so a hung Sendway connection cannot block the caller indefinitely', async () => {
    const fetchFn = fakeFetch({ ok: true, status: 200 });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: BASE_URL }, fetchFn);

    await send({ email: 'user@example.com', token: 'tok' });

    const [, init] = fetchFn.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('honors a configured timeoutMs override — the signal aborts once that duration elapses (default is 10s)', async () => {
    const fetchFn = fakeFetch({ ok: true, status: 200 });
    const send = createSendwayPasswordResetEmailSender({ apiKey: 'sw_test_key', baseUrl: BASE_URL, timeoutMs: 5 }, fetchFn);

    await send({ email: 'user@example.com', token: 'tok' });

    const [, init] = fetchFn.mock.calls[0];
    expect(init.signal.aborted).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(init.signal.aborted).toBe(true);
  });
});
