// One way to show a point in time across the console: in the console's own language (Korean, like the
// rest of its text) rather than the browser's, and in the viewer's time zone rather than UTC. The
// server sends ISO 8601 timestamps; nothing on screen shows one raw. The Korean convention throughout,
// as the board viewer's own times (`KO_LABELS`) are written.

const DATE_TIME = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
const DATE = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });

function format(formatter: Intl.DateTimeFormat, iso: string): string {
  const time = Date.parse(iso);
  // A value that is not a time is shown as it came rather than as "Invalid Date" or a thrown error.
  return Number.isNaN(time) ? iso : formatter.format(time);
}

/** "2026. 10. 8. 오후 5:45" */
export function formatDateTime(iso: string): string {
  return format(DATE_TIME, iso);
}

/** "2026. 10. 8." */
export function formatDate(iso: string): string {
  return format(DATE, iso);
}

/** A time as a `<time>` element: readable text, with the exact value kept in `dateTime`. */
export function Timestamp({ value, dateOnly = false }: { value: string; dateOnly?: boolean }) {
  return <time dateTime={value}>{dateOnly ? formatDate(value) : formatDateTime(value)}</time>;
}
