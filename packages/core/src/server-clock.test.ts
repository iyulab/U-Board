import { describe, it, expect, vi, afterEach } from 'vitest';
import { serverClock } from './server-clock';

const answered = (date: string | null) => ({ headers: { get: (name: string) => (name.toLowerCase() === 'date' ? date : null) } });

afterEach(() => {
  vi.useRealTimers();
});

describe('serverClock', () => {
  it('reads the machine clock until a server has answered', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    expect(serverClock().now()).toBe(Date.parse('2026-10-07T05:10:00Z'));
  });

  it('runs on the server clock once a response carried its Date', () => {
    // This machine is 8 minutes ahead of the server.
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    const clock = serverClock();
    const sentAt = Date.now();
    vi.advanceTimersByTime(200);
    clock.observe(answered('Wed, 07 Oct 2026 05:02:00 GMT'), sentAt);
    // The header's second is truncated, so the server's time is taken as the middle of that second,
    // matched to the middle of the round trip.
    expect(clock.now()).toBe(Date.parse('2026-10-07T05:02:00.500Z') + 100);
    vi.advanceTimersByTime(60_000);
    expect(clock.now()).toBe(Date.parse('2026-10-07T05:03:00.600Z'));
  });

  it('keeps its estimate while the server agrees within a couple of seconds, so ages do not flicker', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    const clock = serverClock();
    clock.observe(answered('Wed, 07 Oct 2026 05:02:00 GMT'), Date.now());
    const before = clock.now();
    clock.observe(answered('Wed, 07 Oct 2026 05:01:59 GMT'), Date.now());
    expect(clock.now()).toBe(before);
  });

  it('follows the server when the gap moves by more than that — a clock set right, say', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    const clock = serverClock();
    clock.observe(answered('Wed, 07 Oct 2026 05:02:00 GMT'), Date.now());
    clock.observe(answered('Wed, 07 Oct 2026 05:10:00 GMT'), Date.now());
    expect(clock.now()).toBe(Date.parse('2026-10-07T05:10:00.500Z'));
  });

  it('ignores a response without a readable Date', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    const clock = serverClock();
    clock.observe(answered(null), Date.now());
    clock.observe(answered('not a date'), Date.now());
    expect(clock.now()).toBe(Date.parse('2026-10-07T05:10:00Z'));
  });

  it('can be handed on as a plain function', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-07T05:10:00Z') });
    const { now } = serverClock();
    expect(now()).toBe(Date.parse('2026-10-07T05:10:00Z'));
  });
});
