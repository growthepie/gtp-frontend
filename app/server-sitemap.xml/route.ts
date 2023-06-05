// @ts-ignore
import { getServerSideSitemap } from "next-sitemap";
import { MetricsURLs, ChainURLs } from "@/lib/urls";

export async function GET(request: Request) {
  return getServerSideSitemap([
    ...Object.keys(MetricsURLs).map((metric) => ({
      loc: `https://www.growthepie.xyz/fundamentals/${metric}`,
      lastmod: new Date().toISOString(),
    })),
    ...Object.keys(ChainURLs).map((chain) => ({
      loc: `https://www.growthepie.xyz/chains/${chain}`,
      lastmod: new Date().toISOString(),
    })),
  ]);
}
