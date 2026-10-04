const DEFAULT_TIMEOUT_MS = 10_000;

export interface SendwayConfig {
  apiKey: string;
  /** Origin of the Sendway deployment to send through, e.g. `https://sendway.example.com`. */
  baseUrl: string;
  /** Aborts the request if Sendway hasn't responded within this long. Defaults to 10s — a hung
   *  connection here would otherwise block the awaiting `/request-password-reset` handler
   *  indefinitely, since that route always responds 202 regardless of account existence and has
   *  nothing else gating its response. */
  timeoutMs?: number;
}

function buildResetEmailBody(token: string): string {
  return (
    `Use this code to reset your U-Board password:\n\n${token}\n\n` +
    `This code expires in 1 hour and can only be used once. If you didn't request a password ` +
    `reset, you can ignore this email.`
  );
}

/** What an invitation email says — everything but the recipient's own address comes from the
 *  inviting workspace, so it is plain text only (no markup a workspace name could inject into). */
export interface InvitationEmail {
  email: string;
  invitationId: string;
  workspaceName: string;
  inviterName: string;
  role: 'owner' | 'member';
  /** The link that opens the invitation in the console. */
  link: string;
  expiresAt: string;
}

function buildInvitationEmailBody(input: InvitationEmail): string {
  return (
    `${input.inviterName} invited you to the "${input.workspaceName}" workspace on U-Board as ${input.role}.\n\n` +
    `Accept the invitation:\n${input.link}\n\n` +
    `The invitation expires on ${input.expiresAt.slice(0, 10)} (UTC) and works once, for this email address. ` +
    `If you weren't expecting it, you can ignore this email.`
  );
}

/** One `POST /messages/email` to a Sendway deployment. `idempotencyKey` makes a retried call
 *  replay the original send instead of emailing twice. */
function createSendwayEmailPoster(config: SendwayConfig, fetchFn: typeof fetch) {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async function postEmail(message: { to: string; subject: string; body: string; idempotencyKey: string }): Promise<void> {
    const response = await fetchFn(`${baseUrl}/messages/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.apiKey,
        'Idempotency-Key': message.idempotencyKey,
      },
      body: JSON.stringify({ to: [message.to], subject: message.subject, body: message.body }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Sendway email send failed with status ${response.status}: ${detail}`);
    }
  };
}

/** Builds a `sendPasswordResetEmail` compatible with `AppConfig` (see `../app.js`) that delivers
 *  the reset token through a Sendway notification service instead of the dev-mode
 *  log fallback. `fetchFn` defaults to the global `fetch` and is only overridden by tests. */
export function createSendwayPasswordResetEmailSender(
  config: SendwayConfig,
  fetchFn: typeof fetch = fetch
): (input: { email: string; token: string }) => Promise<void> {
  const postEmail = createSendwayEmailPoster(config, fetchFn);
  return async function sendPasswordResetEmail(input: { email: string; token: string }): Promise<void> {
    await postEmail({
      to: input.email,
      subject: 'Reset your U-Board password',
      body: buildResetEmailBody(input.token),
      // The reset token is already unique per request, so it doubles as the idempotency key.
      idempotencyKey: input.token,
    });
  };
}

/** Builds a `sendInvitationEmail` compatible with `AppConfig`. */
export function createSendwayInvitationEmailSender(
  config: SendwayConfig,
  fetchFn: typeof fetch = fetch
): (input: InvitationEmail) => Promise<void> {
  const postEmail = createSendwayEmailPoster(config, fetchFn);
  return async function sendInvitationEmail(input: InvitationEmail): Promise<void> {
    await postEmail({
      to: input.email,
      subject: "You're invited to a U-Board workspace",
      body: buildInvitationEmailBody(input),
      idempotencyKey: `invitation-${input.invitationId}`,
    });
  };
}

/** Reads the Sendway settings from the environment. No API key means no Sendway at all — the
 *  server keeps its log-the-token fallback. An API key without a base URL is a misconfiguration
 *  and fails startup, rather than sending a tenant key to a deployment nobody chose. */
export function sendwayConfigFromEnv(env: Record<string, string | undefined>): SendwayConfig | undefined {
  const apiKey = env.SENDWAY_API_KEY;
  if (!apiKey) return undefined;
  const baseUrl = env.SENDWAY_BASE_URL;
  if (!baseUrl) {
    throw new Error('SENDWAY_BASE_URL must be set when SENDWAY_API_KEY is set');
  }
  return { apiKey, baseUrl };
}
