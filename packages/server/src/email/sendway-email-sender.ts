const DEFAULT_BASE_URL = 'https://sendway.u-platform.kr';

export interface SendwayConfig {
  apiKey: string;
  /** Override for a non-default Sendway deployment (e.g. a local/staging one). */
  baseUrl?: string;
}

function buildResetEmailBody(token: string): string {
  return (
    `Use this code to reset your U-Board password:\n\n${token}\n\n` +
    `This code expires in 1 hour and can only be used once. If you didn't request a password ` +
    `reset, you can ignore this email.`
  );
}

/** Builds a `sendPasswordResetEmail` compatible with `AppConfig` (see `../app.js`) that delivers
 *  the reset token through iyulab's shared Sendway notification service instead of the dev-mode
 *  log fallback. `fetchFn` defaults to the global `fetch` and is only overridden by tests. */
export function createSendwayPasswordResetEmailSender(
  config: SendwayConfig,
  fetchFn: typeof fetch = fetch
): (input: { email: string; token: string }) => Promise<void> {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;

  return async function sendPasswordResetEmail(input: { email: string; token: string }): Promise<void> {
    const response = await fetchFn(`${baseUrl}/messages/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.apiKey,
        // The reset token is already unique per request, so reusing it as the idempotency key
        // means a client retry replays the original send instead of emailing the user twice.
        'Idempotency-Key': input.token,
      },
      body: JSON.stringify({
        to: [input.email],
        subject: 'Reset your U-Board password',
        body: buildResetEmailBody(input.token),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Sendway email send failed with status ${response.status}: ${detail}`);
    }
  };
}
