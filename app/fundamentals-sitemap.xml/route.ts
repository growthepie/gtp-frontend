import { NextResponse } from "next/server";
import { metricItems, metricCategories } from "@/lib/metrics";
import { MasterURL } from "@/lib/urls";
import type { MasterResponse } from "@/types/api/MasterResponse";

const FUNDAMENTALS_GROUP = "fundamentals";
const DEFAULT_CHANGE_FREQ = "weekly";

export const revalidate = 3600; // 1 hour

type MetricItem = (typeof metricItems)[number] & {
  excludeFromSitemap?: boolean;
};

const isFundamentalsMetric = (metric: MetricItem): boolean => {
  if (!metric.urlKey || metric.excludeFromSitemap) return false;

  const categoryKey = metric.category;
  if (!categoryKey) return false;

  const category = metricCategories[categoryKey as keyof typeof metricCategories];
  return category?.group === FUNDAMENTALS_GROUP;
};

const toXmlEntry = (origin: string, urlKey: string, lastMod: string) => `
  <url>
    <loc>${origin}/fundamentals/${urlKey}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${DEFAULT_CHANGE_FREQ}</changefreq>
    <priority>0.6</priority>
  </url>`;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? requestUrl.origin;

  try {
    const response = await fetch(MasterURL, {
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch master data: ${response.status} ${response.statusText}`,
      );
    }

    const master: MasterResponse = await response.json();
    const lastMod =
      master.last_updated_utc && !Number.isNaN(Date.parse(master.last_updated_utc))
        ? new Date(master.last_updated_utc).toISOString()
        : new Date().toISOString();

    const xmlEntries = metricItems
      .filter(isFundamentalsMetric)
      .map((metric) => toXmlEntry(origin, metric.urlKey, lastMod))
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, max-age=${60 * 5}`,
      },
    });
  } catch (error) {
    console.error("fundamentals-sitemap.xml error:", error);

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

