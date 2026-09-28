/** A non-2xx answer from an upstream server, keeping the status so a caller can tell *why* the
 * request failed (refused credentials, unknown address, rate limiting) and not only that it did. */
export class HttpStatusError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'HttpStatusError';
  }
}
