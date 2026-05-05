// lib/quick-bites/seo_helper.ts

// FAQ helper functions and types
export type FaqItem = { q: string; a: string };

type RenderFaqOptions = {
  title?: string;
  description?: string;
  layout?: 'accordion' | 'list';
  className?: string;
  showInMenu?: boolean;
};

export const renderFaqMarkdown = (
  items: FaqItem[],
  options: RenderFaqOptions = {}
) => {
  const {
    title = 'FAQ',
    description,
    layout,
    className,
    showInMenu,
  } = options;

  return [
    '```faq',
    JSON.stringify({
      title,
      description,
      layout,
      className,
      showInMenu,
      items: items.map(({ q, a }) => ({ question: q, answer: a })),
    }),
    '```',
  ];
};

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
import { QuickBiteData, JsonLdThing } from "@/lib/types/quickBites";
import {
  lookupTopic,
  lookupEntity,
  detectEntitiesInText,
} from "./registries";

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

export type JsonLdImageObject = {
  ["@type"]: "ImageObject";
  url: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type JsonLdAuthor = {
  ["@type"]: "Person";
  name: string;
  sameAs?: string[];
  worksFor?: { ["@id"]: string };
};

export type JsonLdAboutThing = {
  ["@type"]: "Thing";
  name: string;
  sameAs?: string[];
};

export type JsonLdSpeakable = {
  ["@type"]: "SpeakableSpecification";
  cssSelector: string[];
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
    ["@id"]?: string;
    name: string;
    url: string;
    logo?: { ["@type"]: "ImageObject"; url: string };
  };
  image?: (string | JsonLdImageObject)[];
  mainEntityOfPage?: { ["@type"]: "WebPage"; ["@id"]: string };
  keywords?: string[] | string;
  about?: JsonLdAboutThing[];
  speakable?: JsonLdSpeakable;
  articleBody?: string;
  wordCount?: number;
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
  articleBody?: string; // optional pre-extracted plain-text body for AI/SEO consumers
  wordCount?: number; // optional pre-computed word count
  speakableSelectors?: string[]; // CSS selectors for SpeakableSpecification
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

const buildSameAs = (...urls: (string | undefined | null)[]): string[] | undefined => {
  const cleaned = urls
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean);
  if (cleaned.length === 0) return undefined;
  return Array.from(new Set(cleaned));
};

// Strip markdown / fenced data blocks so AI consumers (and our own entity
// detection) see only prose. Exported so server pages can reuse it.
const ARTICLE_BODY_MAX_CHARS = 5000;
export const extractPlainText = (content: string[] | string): string => {
  const joined = Array.isArray(content) ? content.join("\n\n") : content;
  return joined
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// Returns ordered semantic chunks suitable for emitting as static HTML so AI
// crawlers see article structure (h1/h2/h3, paragraphs, list items) before
// React hydrates the interactive UI. Fenced code blocks (```chart, ```table,
// ```faq, ```container, etc.) are skipped — they're rendered interactively by
// the client app, and their captions/JSON aren't useful prose.
export type ProseChunk = { tag: "h2" | "h3" | "h4" | "p" | "li"; text: string };

export const extractStructuredProse = (content: string[] | string): ProseChunk[] => {
  const blocks = Array.isArray(content) ? content : [content];
  const chunks: ProseChunk[] = [];

  let inFence = false;
  for (const block of blocks) {
    if (typeof block !== "string") continue;
    const lines = block.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();

      if (line.startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (!line) continue;

      const stripInline = (s: string) =>
        s
          .replace(/`([^`]+)`/g, "$1")
          .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[*_~]+/g, "")
          .trim();

      const heading = line.match(/^(#{2,4})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        const tag = (level === 2 ? "h2" : level === 3 ? "h3" : "h4") as ProseChunk["tag"];
        const text = stripInline(heading[2]);
        if (text) chunks.push({ tag, text });
        continue;
      }
      if (/^#{1}\s+/.test(line)) {
        // Skip H1 — the article title is rendered separately.
        continue;
      }

      const list = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
      if (list) {
        const text = stripInline(list[1]);
        if (text) chunks.push({ tag: "li", text });
        continue;
      }

      // Skip horizontal rules and table separators.
      if (/^[-=]{3,}$/.test(line)) continue;
      if (/^\|/.test(line)) continue;

      const text = stripInline(line);
      if (text) chunks.push({ tag: "p", text });
    }
  }

  return chunks;
};

export const computeArticleStats = (content: string[] | string) => {
  const plain = extractPlainText(content);
  if (!plain) return { articleBody: undefined, wordCount: undefined } as const;
  return {
    articleBody: plain.slice(0, ARTICLE_BODY_MAX_CHARS),
    wordCount: plain.split(/\s+/).filter(Boolean).length,
  } as const;
};

// All terms used to seed keyword/entity detection: title + subtitle + topics +
// declared entities + (optionally) extracted body text.
const buildSearchCorpus = (data: QuickBiteData, body?: string): string => {
  const parts: string[] = [];
  if (data.title) parts.push(data.title);
  if (data.subtitle) parts.push(data.subtitle);
  if ((data as any).summary) parts.push(String((data as any).summary));
  for (const t of data.topics ?? []) if ((t as any)?.name) parts.push((t as any).name);
  for (const e of data.entities ?? []) if ((e as any)?.name) parts.push((e as any).name);
  if (body) parts.push(body);
  return parts.join(" \n ");
};

const toKeywords = (data: QuickBiteData, body?: string) => {
  const topicNames = (data.topics || []).map((t: any) => t.name).filter(Boolean);
  const entityNames = (data.entities || []).map((e: any) => e?.name).filter(Boolean);
  // Auto-detected entities from title+subtitle+body broaden keyword coverage.
  const corpus = buildSearchCorpus(data, body);
  const detected = detectEntitiesInText(corpus).map((e) => e.name);
  return Array.from(new Set([...topicNames, ...entityNames, ...detected]));
};

const toAboutThings = (data: QuickBiteData, body?: string): JsonLdAboutThing[] => {
  const items: JsonLdAboutThing[] = [];

  // Topics: enrich from registry if no explicit wikipedia/wikidata supplied.
  for (const t of data.topics ?? []) {
    const name = (t as any)?.name ? String((t as any).name) : "";
    if (!name) continue;
    const reg = lookupTopic(name);
    const sameAs = buildSameAs(
      (t as any)?.wikipedia ?? reg?.wikipedia,
      (t as any)?.wikidata ?? reg?.wikidata,
    );
    items.push(sameAs ? { "@type": "Thing", name, sameAs } : { "@type": "Thing", name });
  }

  // Explicit entities: enrich from registry if no sameAs supplied.
  for (const e of data.entities ?? []) {
    const name = (e as any)?.name ? String((e as any).name) : "";
    if (!name) continue;
    const explicit = Array.isArray((e as any)?.sameAs) ? (e as any).sameAs : [];
    let sameAs = buildSameAs(...explicit);
    if (!sameAs) {
      const reg = lookupEntity(name);
      sameAs = buildSameAs(reg?.wikipedia, reg?.wikidata);
    }
    items.push(sameAs ? { "@type": "Thing", name, sameAs } : { "@type": "Thing", name });
  }

  // Auto-detected from title/subtitle/body.
  const corpus = buildSearchCorpus(data, body);
  for (const det of detectEntitiesInText(corpus)) {
    const sameAs = det.sameAs && det.sameAs.length ? det.sameAs : undefined;
    items.push(sameAs ? { "@type": "Thing", name: det.name, sameAs } : { "@type": "Thing", name: det.name });
  }

  // Dedup by name (case-insensitive); prefer the entry with sameAs.
  const byName = new Map<string, JsonLdAboutThing>();
  for (const it of items) {
    const key = it.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, it);
    } else if (!existing.sameAs && it.sameAs) {
      byName.set(key, it);
    }
  }
  return Array.from(byName.values());
};

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
  const publisherId = `${siteUrl.replace(/\/$/, "")}/#organization`;

  // 🆕 normalize dates
  const datePublishedIso = toIsoWithTZ((data as any).date || (data as any).publishedAt);
  const dateModifiedIso = toIsoWithTZ(
    opts.dateModified ?? (data as any).updatedAt ?? (data as any).date
  );

  const authors = toAuthors(data).map((a) => ({
    ...a,
    worksFor: { "@id": publisherId },
  }));

  const imageObject: JsonLdImageObject | undefined = image
    ? {
        "@type": "ImageObject",
        url: image,
        caption: data.subtitle || data.title,
      }
    : undefined;

  const speakableSelectors =
    opts.speakableSelectors ?? [
      ".quickbite-deck",
      ".quickbite-prose h2",
      ".quickbite-prose h3",
      ".quickbite-prose p",
    ];

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
    author: authors,
    publisher: {
      "@type": "Organization",
      "@id": publisherId,
      name: publisherName,
      url: siteUrl,
      logo: { "@type": "ImageObject", url: publisherLogoUrl },
    },
    image: imageObject ? [imageObject] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: toKeywords(data, opts.articleBody),
    about: toAboutThings(data, opts.articleBody),
    speakable: { "@type": "SpeakableSpecification", cssSelector: speakableSelectors },
    ...(opts.articleBody ? { articleBody: opts.articleBody } : {}),
    ...(typeof opts.wordCount === "number" && opts.wordCount > 0
      ? { wordCount: opts.wordCount }
      : {}),
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

// ---------------------------------------------------------------------------
// Auto-derived Dataset schema
// ---------------------------------------------------------------------------
// Scans the markdown content for fenced data blocks (chart, chart-toggle,
// table, kpi-cards, line, area) and extracts every api.growthepie.com URL
// they reference. Returns one Dataset with one DataDownload per unique URL,
// or undefined if the article has no API-driven content (e.g. narrative
// pieces) — in which case Dataset schema would be misleading.

const API_HOST = "api.growthepie.com";

const collectApiUrls = (content: string[] | string): string[] => {
  const blocks = Array.isArray(content) ? content : [content];
  const urls = new Set<string>();
  // Match any `"url": "https://api.growthepie.com/..."` or contentUrl variant
  // inside content strings — works whether the JSON spans one block or several
  // since markdown fences are flattened across the array.
  const re = /"(?:url|contentUrl)"\s*:\s*"(https:\/\/[^"]+)"/g;
  for (const b of blocks) {
    if (typeof b !== "string") continue;
    if (!b.includes(API_HOST)) continue;
    let m: RegExpExecArray | null;
    while ((m = re.exec(b)) !== null) {
      const u = m[1];
      if (u && u.includes(API_HOST)) urls.add(u);
    }
  }
  return Array.from(urls);
};

const filenameFromUrl = (u: string): string => {
  try {
    const path = new URL(u).pathname;
    const last = path.split("/").pop() || path;
    return last.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || u;
  } catch {
    return u;
  }
};

export function generateJsonLdDatasetFromContent(
  slug: string,
  data: QuickBiteData,
  content: string[] | string,
  opts: GenerateSeoOptions = {}
): JsonLdThing | undefined {
  const urls = collectApiUrls(content);
  if (urls.length === 0) return undefined;

  const siteUrl = opts.siteUrl ?? "https://www.growthepie.com";
  const section = opts.section ?? "quick-bites";
  const base = siteUrl.replace(/\/$/, "");
  const canonical = `${base}/${section}/${slug}`;
  const orgId = `${base}/#organization`;

  const datePublishedIso = toIsoWithTZ((data as any).date);
  const dateModifiedIso = toIsoWithTZ(opts.dateModified ?? (data as any).updatedAt ?? (data as any).date);

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${data.title} — Source Data`,
    description:
      (data as any).summary ||
      data.subtitle ||
      `Source data backing the "${data.title}" analysis on growthepie.`,
    url: canonical,
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    isAccessibleForFree: true,
    creator: { "@id": orgId },
    publisher: { "@id": orgId },
    ...(datePublishedIso ? { datePublished: datePublishedIso } : {}),
    ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
    distribution: urls.map((u) => ({
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: u,
      name: filenameFromUrl(u),
    })),
  };
}
