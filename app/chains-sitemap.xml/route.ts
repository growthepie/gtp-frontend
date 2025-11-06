import { NextResponse } from "next/server";
import { MasterURL } from "@/lib/urls";
import type { MasterResponse, ChainInfo } from "@/types/api/MasterResponse";

const EXCLUDED_URL_KEYS = new Set(["multiple", "all_l2s", "all-l2s"]);

export const revalidate = 60 * 60; // 1 hour

type ExtendedChainInfo = ChainInfo & {
  last_updated?: string;
  updated_at?: string;
};

const getLastMod = (
  chain: ExtendedChainInfo,
  fallback: string,
): string => {
  const lastUpdated =
    chain.last_updated ??
    chain.updated_at ??
    fallback;

  const date = new Date(lastUpdated);
  return Number.isNaN(date.valueOf())
    ? new Date(fallback).toISOString()
    : date.toISOString();
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    requestUrl.origin;

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

    const sitemapEntries = Object.values(master.chains)
      .filter(
        (chain) =>
          chain.url_key &&
          !EXCLUDED_URL_KEYS.has(chain.url_key) &&
          chain.deployment === "PROD",
      )
      .map((chain) => {
        const lastMod = getLastMod(
          chain as ExtendedChainInfo,
          master.last_updated_utc,
        );

        return `
  <url>
    <loc>${origin}/chains/${chain.url_key}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": `public, max-age=${60 * 5}`,
      },
    });
  } catch (error) {
    console.error("chains-sitemap.xml error:", error);

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

