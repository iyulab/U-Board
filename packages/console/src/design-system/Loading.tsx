/** The one loading indicator the console shows while a page or session is being fetched,
 * announced as a status so a screen reader user hears that something is on its way. */
export function Loading() {
  return <p role="status">불러오는 중...</p>;
}
