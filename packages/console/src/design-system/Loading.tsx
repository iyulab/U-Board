import '@uplatform/brand';
import './Loading.css';

/** The one loading indicator the console shows while a page or session is being fetched,
 * announced as a status so a screen reader user hears that something is on its way.
 *
 * `page` is for the wait before anything else is on screen — the session check every visit starts
 * with. A scale-to-zero server can take tens of seconds to answer it, so that wait gets the product
 * mark turning in the middle of the screen rather than a line of text in a corner. */
export function Loading({ page = false }: { page?: boolean }) {
  if (!page) return <p role="status">불러오는 중...</p>;
  return (
    <div className="ub-page-loading">
      <u-mark product="u-board" motion="chase" aria-hidden="true" />
      <p role="status">불러오는 중...</p>
    </div>
  );
}
