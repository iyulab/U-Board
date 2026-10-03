/** A non-2xx answer from an upstream server, keeping the status so a caller can tell *why* the
 * request failed (refused credentials, unknown address, rate limiting) and not only that it did. */
export class HttpStatusError extends Error {
  /** `body` is the parsed error body when the caller read one (JSON only), for a finer diagnosis
   * than the status alone allows. */
  constructor(readonly status: number, message: string, readonly body?: unknown) {
    super(message);
    this.name = 'HttpStatusError';
  }
}
