// lib/quick-bites/seo_helper.ts

// FAQ helper functions and types
export type FaqItem = { q: string; a: string };

export const renderFaqMarkdown = (items: FaqItem[]) =>
  [
    "# FAQ",
    ...items.flatMap(({ q, a }) => [`### ${q}`, `- ${a}`]),
  ];

export const generateJsonLdFaq = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
});

// General SEO helper functions and types
// lib/utils/seo.ts
import { QuickBiteData } from "@/lib/types/quickBites";

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  og: {
    image: string;
    title: string;
    description: string;
  };
  canonical: string;
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    image: string;
  };
}

export type JsonLdAuthor = {
  ["@type"]: "Person";
  name: string;
  sameAs?: string[];
};

export type JsonLdAboutThing = {
  ["@type"]: "Thing";
  name: string;
};

export interface JsonLdArticle {
  ["@context"]: "https://schema.org";
  ["@type"]: "TechArticle";
  headline: string;
  alternativeHeadline?: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  inLanguage?: string;
  author?: JsonLdAuthor[];
  publisher?: {
    ["@type"]: "Organization";
    name: string;
    url: string;
    logo?: { ["@type"]: "ImageObject"; url: string };
  };
  image?: string[];
  mainEntityOfPage?: { ["@type"]: "WebPage"; ["@id"]: string };
  keywords?: string[] | string;
  about?: JsonLdAboutThing[];
}

export interface JsonLdBreadcrumbs {
  ["@context"]: "https://schema.org";
  ["@type"]: "BreadcrumbList";
  itemListElement: Array<{
    ["@type"]: "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export interface GenerateSeoOptions {
  siteUrl?: string; // default: https://www.growthepie.com
  section?: string; // default: "quick-bites"
  publisherName?: string; // default: "growthepie"
  publisherLogoUrl?: string; // default: <siteUrl>/brand/logo-assets/growthepie_logo_round_BG_dark.png
  dateModified?: string; // override if you track commit time
  language?: string; // default: "en"
}

// helper: normalize to ISO-8601 WITH timezone
const toIsoWithTZ = (value?: string | Date): string | undefined => {
  if (!value) return undefined;

  // If it's already a Date
  if (value instanceof Date) return value.toISOString();

  const s = String(value).trim();
  if (!s) return undefined;

  // Already has time + explicit TZ? keep it
  if (
    /T/.test(s) &&
    (/[zZ]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s))
  ) {
    return s;
  }

  // Date only (YYYY-MM-DD) → midnight UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00Z`;
  }

  // Datetime without TZ (YYYY-MM-DDTHH:MM[:SS]) → append Z
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return `${s}Z`;
  }

  // Fallback: let Date parse it and serialize with TZ
  const d = new Date(s);
  if (!isNaN(d.valueOf())) return d.toISOString();

  // Couldn’t parse
  return undefined;
};


const pickSummary = (data: QuickBiteData) =>
  (data as any).summary ||
  data.subtitle ||
  "Explore data and insights from the Ethereum ecosystem.";

const pickImage = (data: QuickBiteData) => data.og_image || data.image || "";

const toKeywords = (data: QuickBiteData) => {
  const topicNames = (data.topics || []).map((t: any) => t.name).filter(Boolean);
  return Array.from(new Set(topicNames));
};

const toAboutThings = (data: QuickBiteData): JsonLdAboutThing[] =>
  (data.topics ?? [])
    .map((t: any) => {
      const name = t?.name ? String(t.name) : "";
      if (!name) return null;
      return { "@type": "Thing" as const, name };
    })
    .filter(Boolean) as JsonLdAboutThing[];

const toAuthors = (data: QuickBiteData): JsonLdAuthor[] =>
  (data.author ?? [])
    .map((a: any) => {
      const name = a?.name ? String(a.name) : "";
      if (!name) return null;
      const sameAs = a?.xUsername ? [`https://x.com/${String(a.xUsername)}`] : undefined;
      return { "@type": "Person" as const, name, sameAs };
    })
    .filter(Boolean) as JsonLdAuthor[];

export function generateSeo(
  slug: string,
  data: QuickBiteData,
  opts: GenerateSeoOptions = {}
): SEOData {
  const siteUrl = opts.siteUrl ?? "https://www.growthepie.com";
  const section = opts.section ?? "quick-bites";
  const canonical = `${siteUrl.replace(/\/$/, "")}/${section}/${slug}`;

  const summary = pickSummary(data);
  const image = pickImage(data);

  return {
    metaTitle: `${data.title} | growthepie`,
    metaDescription: summary,
    og: {
      image,
      title: data.title,
      description: summary,
    },
    canonical,
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.subtitle || summary,
      image,
    },
  };
}

export function generateJsonLdArticle(
  slug: string,
  data: QuickBiteData,
  opts: GenerateSeoOptions = {}
): JsonLdArticle {
  const siteUrl = opts.siteUrl ?? "https://www.growthepie.com";
  const section = opts.section ?? "quick-bites";
  const publisherName = opts.publisherName ?? "growthepie";
  const publisherLogoUrl =
    opts.publisherLogoUrl ??
    `${siteUrl.replace(/\/$/, "")}/brand/logo-assets/growthepie_logo_round_BG_dark.png`;

  const canonical = `${siteUrl.replace(/\/$/, "")}/${section}/${slug}`;
  const summary = pickSummary(data);
  const image = pickImage(data);

  // 🆕 normalize dates
  const datePublishedIso = toIsoWithTZ((data as any).date || (data as any).publishedAt);
  const dateModifiedIso = toIsoWithTZ(
    opts.dateModified ?? (data as any).updatedAt ?? (data as any).date
  );

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: data.title,
    alternativeHeadline: data.subtitle,
    description: summary,
    inLanguage: opts.language ?? "en",
    // only include if valid ISO with TZ
    ...(datePublishedIso ? { datePublished: datePublishedIso } : {}),
    ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
    author: toAuthors(data),
    publisher: {
      "@type": "Organization",
      name: publisherName,
      url: siteUrl,
      logo: { "@type": "ImageObject", url: publisherLogoUrl },
    },
    image: image ? [image] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: toKeywords(data),
    about: toAboutThings(data),
  };
}

export function generateJsonLdBreadcrumbs(
  slug: string,
  data: QuickBiteData,
  opts: GenerateSeoOptions = {}
): JsonLdBreadcrumbs {
  const siteUrl = opts.siteUrl ?? "https://www.growthepie.com";
  const section = opts.section ?? "quick-bites";
  const base = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Quick Bites", item: `${base}/${section}` },
      {
        "@type": "ListItem",
        position: 3,
        name: data.title,
        item: `${base}/${section}/${slug}`,
      },
    ],
  };
}
