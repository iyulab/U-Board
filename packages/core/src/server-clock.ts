/** What `ServerClock.observe` reads from a response — a fetch `Response` fits as is. */
export interface ResponseWithHeaders {
  headers: { get(name: string): string | null };
}

/**
 * The current time on a server's clock, estimated from the `Date` header of its responses
 * (RFC 9110 §6.6.1 — the origin's clock when it answered). For a view whose `observedAt` times are
 * stamped by that server, so "N minutes ago" stays right on a machine whose own clock has drifted —
 * an unattended screen left running for months, say.
 */
export interface ServerClock {
  /** The server's current time in epoch milliseconds; this machine's until a response has carried a
   * `Date`. A plain function — it can be passed on as a `clock` as it is. */
  now: () => number;
  /** Takes the `Date` a response carried. `sentAt` is when the request was made (`Date.now()`), so
   * the server's moment can be matched to the middle of the round trip. A response without a
   * readable `Date` (a cross-origin one that does not expose it, say) changes nothing. */
  observe: (response: ResponseWithHeaders, sentAt: number) => void;
}

/** How far a new reading must move the estimate before it is taken. `Date` carries whole seconds, so
 * readings of an unchanged clock already scatter by about one; following them would make an age
 * shown to the second step back and forth. */
const SETTLE_MS = 2000;

export function serverClock(): ServerClock {
  let offset: number | undefined;
  return {
    now: () => Date.now() + (offset ?? 0),
    observe: (response, sentAt) => {
      const date = Date.parse(response.headers.get('Date') ?? '');
      if (Number.isNaN(date)) return;
      // The header drops the milliseconds, so the server's moment is anywhere in that second: take its middle.
      const reading = date + 500 - (sentAt + Date.now()) / 2;
      if (offset === undefined || Math.abs(reading - offset) > SETTLE_MS) offset = reading;
    },
  };
}
