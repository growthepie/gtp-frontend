import { NextResponse } from "next/server";
import { getAllQuickBites } from "@/lib/quick-bites/quickBites";
import { getQuickBitesForTopic, getQuickBiteTopicUrl, QUICK_BITE_TOPICS } from "@/lib/quick-bites/themes";

export const revalidate = 3600; // 1 hour

const getLastMod = (date?: string): string => {
  if (!date) {
    return new Date().toISOString();
  }

  const parsed = new Date(date);
  return Number.isNaN(parsed.valueOf())
    ? new Date().toISOString()
    : parsed.toISOString();
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? requestUrl.origin;

  try {
    const quickBites = getAllQuickBites();

    if (!quickBites.length) {
      throw new Error("No quick bites available for sitemap generation.");
    }

    const sitemapEntries = quickBites
      .map((quickBite) => {
        const lastMod = getLastMod(quickBite.date);

        return `
  <url>
    <loc>${origin}/quick-bites/${quickBite.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
      .join("");

    // Topic pages (/quick-bites/topic/<key>), last modified with their newest Quick Bite.
    const topicEntries = QUICK_BITE_TOPICS.map((topic) => {
      const newest = getQuickBitesForTopic(topic.key)[0];
      return `
  <url>
    <loc>${origin}${getQuickBiteTopicUrl(topic.key)}</loc>
    <lastmod>${getLastMod(newest?.date)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}${topicEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, max-age=${60 * 5}`,
      },
    });
  } catch (error) {
    console.error("quick-bites-sitemap.xml error:", error);

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  }
}

