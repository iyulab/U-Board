import { Link } from 'react-router';

/** Any address the console has no page for — a mistyped or outdated link. The server answers every
 *  path outside `/api` and `/share/` with the console, so without this such a link opened a blank page. */
export function NotFoundPage() {
  return (
    <div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 잘못 입력되었을 수 있습니다.</p>
      <Link to="/">처음으로</Link>
    </div>
  );
}
