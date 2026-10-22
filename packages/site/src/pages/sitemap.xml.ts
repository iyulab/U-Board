import type { APIRoute } from 'astro';
import { SAMPLE_PACKS } from '@iyulab/u-board-samples';
import { PATHS, SITE_URL } from '../copy';
import { boardPaths } from '../gallery';

// Both language versions, each naming the other (hreflang), as search engines read a sitemap — the site's pages and
// every board of the gallery.
const PAGES = [...Object.values(PATHS), ...SAMPLE_PACKS.map(pack => boardPaths(pack.id))];

export const GET: APIRoute = () => {
  const url = (path: string) => new URL(path, SITE_URL).href;
  const entries = PAGES.flatMap(page =>
    (['ko', 'en'] as const).map(
      locale => `  <url>
    <loc>${url(page[locale])}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="${url(page.ko)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${url(page.en)}"/>
  </url>`
    )
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
