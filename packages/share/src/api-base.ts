/** The server origin fetches are issued against, with any trailing slash stripped so callers can
 * safely concatenate a leading-slash path without producing a double slash. */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
}
