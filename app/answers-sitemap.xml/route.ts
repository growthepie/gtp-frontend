// Sitemap for the /answers section. Mirrors the chains/fundamentals/
// quick-bites sitemap pattern so Google, Bing, and AI crawlers (GPTBot,
// ClaudeBot, PerplexityBot) can discover every QAPage in one fetch.
//
// The hub page itself (/answers) is included as the first entry with a
// higher priority than the individual answers — it's the canonical entry
// point AI search engines use to discover topic clusters.

import { NextResponse } from 'next/server';
import { getAllAnswers } from '@/lib/answers';

export const revalidate = 3600; // 1 hour

const getLastMod = (date?: string): string => {
  if (!date) return new Date().toISOString();
  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf())
    ? new Date().toISOString()
    : parsed.toISOString();
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? requestUrl.origin;

  try {
    const answers = getAllAnswers();
    const today = new Date().toISOString();

    const hubEntry = `
  <url>
    <loc>${origin}/answers</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    const answerEntries = answers
      .map(
        (a) => `
  <url>
    <loc>${origin}/answers/${a.slug}</loc>
    <lastmod>${getLastMod(a.date)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`,
      )
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${hubEntry}${answerEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${60 * 5}`,
      },
    });
  } catch (error) {
    console.error('answers-sitemap.xml error:', error);

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  }
}
