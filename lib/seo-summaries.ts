import { cache } from "react";

const SEO_SUMMARY_BASE_URL = "https://api.growthepie.xyz/v1/seo";

export type SeoSummaryEntry = {
  slug: string;
  name: string;
  canonical_url?: string;
  title?: string;
  summary?: string;
  facts?: string[];
  methodology?: string;
  source_urls?: string[];
  last_updated_utc?: string;
  [key: string]: unknown;
};

type SeoSummaryResponse = {
  version?: number;
  last_updated_utc?: string;
  data?: Record<string, SeoSummaryEntry | undefined>;
};

type SeoSummaryFamily = "chains" | "fundamentals" | "apps";

const isValidSummaryEntry = (
  entry: SeoSummaryEntry | undefined,
): entry is SeoSummaryEntry => {
  return Boolean(
    entry &&
      typeof entry.slug === "string" &&
      typeof entry.name === "string" &&
      (typeof entry.summary === "string" || typeof entry.title === "string"),
  );
};

export const fetchSeoSummaryFile = cache(
  async (family: SeoSummaryFamily): Promise<SeoSummaryResponse | null> => {
    try {
      const response = await fetch(`${SEO_SUMMARY_BASE_URL}/${family}.json`, {
        next: { revalidate: 60 * 60 },
      });

      if (!response.ok) {
        console.warn(
          `Failed to fetch SEO summary file for ${family}: ${response.status}`,
        );
        return null;
      }

      return response.json();
    } catch (error) {
      console.warn(`Failed to fetch SEO summary file for ${family}`, error);
      return null;
    }
  },
);

export const getSeoSummaryEntry = cache(
  async (
    family: SeoSummaryFamily,
    slug: string,
  ): Promise<(SeoSummaryEntry & { last_updated_utc?: string }) | null> => {
    const normalizedSlug = decodeURIComponent(slug).toLowerCase();
    const file = await fetchSeoSummaryFile(family);
    const entry = file?.data?.[normalizedSlug];

    if (!isValidSummaryEntry(entry)) {
      return null;
    }

    return {
      ...entry,
      last_updated_utc: entry.last_updated_utc || file?.last_updated_utc,
    };
  },
);
