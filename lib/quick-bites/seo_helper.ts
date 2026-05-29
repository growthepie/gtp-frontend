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
import { lookupAuthor } from "./authors";

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
  description?: string;
  jobTitle?: string;
  image?: string;
  url?: string;
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

export type JsonLdArticleType = "Article" | "BlogPosting" | "TechArticle";

export interface JsonLdArticle {
  ["@context"]: "https://schema.org";
  ["@type"]: JsonLdArticleType | JsonLdArticleType[];
  headline: string;
  alternativeHeadline?: string;
  description: string;
  articleSection?: string;
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
  url?: string;
  isAccessibleForFree?: boolean;
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
  // Human-readable label for the section breadcrumb. Defaults to "Quick Bites"
  // when section is "quick-bites" or omitted, otherwise a Title-cased section.
  breadcrumbLabel?: string;
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

// SERP snippet limit. Google truncates around 155–160 chars; we cap at 160 and
// trim at the last word boundary so meta description never ends mid-word.
const META_DESCRIPTION_MAX = 160;
const truncateAtWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).replace(
    /[\s.,;:—–-]+$/u,
    "",
  ) + "…";
};

// Meta description (SERP). Prefer the short subtitle; fall back to the long
// summary trimmed to SERP-safe length. og:description and JSON-LD keep the
// full long summary — only the <meta name="description"> tag is truncated.
const pickMetaDescription = (data: QuickBiteData): string => {
  const candidate = (data.subtitle || pickSummary(data) || "").trim();
  return truncateAtWord(candidate, META_DESCRIPTION_MAX);
};

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
const ANSWER_BODY_MAX_CHARS = 20000;
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
          .replace(/^>\s*/, "")
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
        // The static SEO shell already renders the article title as the
        // page's only H1, so we demote body-level H1s to H2 here. Skipping
        // them entirely would hide every major section heading from non-JS
        // AI crawlers (which is what consumes the static shell).
        const text = stripInline(line.replace(/^#\s+/, ""));
        if (text) chunks.push({ tag: "h2", text });
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

export const computeArticleStats = (
  content: string[] | string,
  maxChars: number = ARTICLE_BODY_MAX_CHARS,
) => {
  const plain = extractPlainText(content);
  if (!plain) return { articleBody: undefined, wordCount: undefined } as const;
  return {
    articleBody: plain.slice(0, maxChars),
    wordCount: plain.split(/\s+/).filter(Boolean).length,
  } as const;
};

// Pre-set ceiling for canonical answer pages (`/answers/[slug]`) — these are
// often longer-form than quick bites and shouldn't be silently truncated.
export const ANSWER_BODY_CEILING = ANSWER_BODY_MAX_CHARS;

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

const KEYWORDS_MAX = 15;
const toKeywords = (data: QuickBiteData, body?: string) => {
  const topicNames = (data.topics || []).map((t: any) => t.name).filter(Boolean);
  const entityNames = (data.entities || []).map((e: any) => e?.name).filter(Boolean);
  // Auto-detected entities from title+subtitle+body broaden keyword coverage.
  const corpus = buildSearchCorpus(data, body);
  const detected = detectEntitiesInText(corpus).map((e) => e.name);
  // Order matters: explicit topics outrank explicit entities outrank auto-
  // detected mentions. Cap so JSON-LD `keywords` doesn't dilute relevance —
  // schema.org best practice and Google's own guidance say <=15.
  const ordered = [...topicNames, ...entityNames, ...detected];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of ordered) {
    const key = String(k).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= KEYWORDS_MAX) break;
  }
  return out;
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
      const xUsername = a?.xUsername ? String(a.xUsername) : undefined;
      const profile = lookupAuthor({ xUsername, name });
      const xSameAs = xUsername ? [`https://x.com/${xUsername}`] : [];
      const sameAs = buildSameAs(...xSameAs, ...(profile?.sameAs ?? []));
      const node: JsonLdAuthor = { "@type": "Person", name };
      if (profile?.description) node.description = profile.description;
      if (profile?.jobTitle) node.jobTitle = profile.jobTitle;
      if (profile?.image) node.image = profile.image;
      if (profile?.url) node.url = profile.url;
      if (sameAs) node.sameAs = sameAs;
      return node;
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
    metaDescription: pickMetaDescription(data),
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
    "@type": ["Article", "BlogPosting", "TechArticle"],
    headline: data.title,
    alternativeHeadline: data.subtitle,
    description: summary,
    articleSection: "Quick Bites",
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
    url: canonical,
    isAccessibleForFree: true,
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
  const sectionLabel =
    opts.breadcrumbLabel ??
    (section === "quick-bites"
      ? "Quick Bites"
      : section
          .split(/[-_/]/)
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" "));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: sectionLabel, item: `${base}/${section}` },
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
// QAPage schema (for /answers/[slug])
// ---------------------------------------------------------------------------
// Canonical answer pages whose primary purpose is to answer ONE question are
// best modelled as schema.org QAPage with a mainEntity Question + Answer.
// AI search engines (Google AI Overviews, ChatGPT search, Perplexity) use
// this type explicitly to surface direct answers.

export interface JsonLdQAPage {
  ['@context']: 'https://schema.org';
  ['@type']: 'QAPage';
  datePublished?: string;
  dateModified?: string;
  mainEntity: {
    ['@type']: 'Question';
    name: string;
    text: string;
    answerCount: number;
    inLanguage?: string;
    author?: JsonLdAuthor[];
    dateCreated?: string;
    dateModified?: string;
    acceptedAnswer: {
      ['@type']: 'Answer';
      text: string;
      inLanguage?: string;
      author?: JsonLdAuthor[];
      url?: string;
      dateCreated?: string;
      dateModified?: string;
    };
  };
  about?: JsonLdAboutThing[];
  keywords?: string[] | string;
  isPartOf?: { ['@type']: 'WebSite'; ['@id']?: string; name: string; url: string };
  publisher?: {
    ['@type']: 'Organization';
    ['@id']?: string;
    name: string;
    url: string;
    logo?: { ['@type']: 'ImageObject'; url: string };
  };
  speakable?: JsonLdSpeakable;
  // References to other JSON-LD nodes on the same page (typically Datasets
  // backing the answer). Schema.org `mentions` is the right relation for
  // "this CreativeWork references that Thing" — AI knowledge-graph builders
  // use it to resolve QAPage and its source Datasets as one connected unit.
  mentions?: { ['@id']: string }[];
  url?: string;
}

export interface GenerateQAPageOptions extends GenerateSeoOptions {
  // Direct, AI-quotable accepted-answer text. If omitted the caller is
  // expected to derive one (e.g. first prose paragraph).
  acceptedAnswer: string;
  // ISO timestamp marking when the answer was first published. Optional;
  // omitted from JSON-LD when not provided.
  datePublished?: string;
  // Optional @id references to Datasets (or other nodes) defined elsewhere
  // on the same page. Emitted as `mentions` in the QAPage JSON-LD.
  mentions?: { ['@id']: string }[];
}

export function generateJsonLdQAPage(
  slug: string,
  data: QuickBiteData,
  opts: GenerateQAPageOptions,
): JsonLdQAPage {
  const siteUrl = opts.siteUrl ?? 'https://www.growthepie.com';
  const section = opts.section ?? 'answers';
  const publisherName = opts.publisherName ?? 'growthepie';
  const publisherLogoUrl =
    opts.publisherLogoUrl ??
    `${siteUrl.replace(/\/$/, '')}/brand/logo-assets/growthepie_logo_round_BG_dark.png`;
  const base = siteUrl.replace(/\/$/, '');
  const canonical = `${base}/${section}/${slug}`;
  const publisherId = `${base}/#organization`;
  const websiteId = `${base}/#website`;

  const authors = toAuthors(data).map((a) => ({
    ...a,
    worksFor: { '@id': publisherId },
  }));

  const speakableSelectors =
    opts.speakableSelectors ?? [
      '.quickbite-deck',
      '.quickbite-prose h2',
      '.quickbite-prose h3',
      '.quickbite-prose p',
    ];

  const datePublishedIso = toIsoWithTZ(opts.datePublished ?? (data as any).date);
  const dateModifiedIso = toIsoWithTZ(opts.dateModified);

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    ...(datePublishedIso ? { datePublished: datePublishedIso } : {}),
    ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
    mainEntity: {
      '@type': 'Question',
      name: data.title,
      text: data.title,
      answerCount: 1,
      inLanguage: opts.language ?? 'en',
      author: authors.length ? authors : undefined,
      ...(datePublishedIso ? { dateCreated: datePublishedIso } : {}),
      ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
      acceptedAnswer: {
        '@type': 'Answer',
        text: opts.acceptedAnswer,
        inLanguage: opts.language ?? 'en',
        author: authors.length ? authors : undefined,
        url: canonical,
        ...(datePublishedIso ? { dateCreated: datePublishedIso } : {}),
        ...(dateModifiedIso ? { dateModified: dateModifiedIso } : {}),
      },
    },
    about: toAboutThings(data, opts.articleBody),
    keywords: toKeywords(data, opts.articleBody),
    isPartOf: {
      '@type': 'WebSite',
      '@id': websiteId,
      name: publisherName,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      '@id': publisherId,
      name: publisherName,
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: publisherLogoUrl },
    },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: speakableSelectors },
    ...(opts.mentions && opts.mentions.length > 0 ? { mentions: opts.mentions } : {}),
    url: canonical,
  };
}

// Best-effort accepted-answer extraction: prefer an explicit `acceptedAnswer`
// field on the data, otherwise take the first non-empty prose paragraph from
// the article body. Used by /answers/[slug] when the editor didn't pin one.
export function deriveAcceptedAnswer(
  data: QuickBiteData,
  prose: ProseChunk[],
): string {
  const explicit = (data as any).acceptedAnswer;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const firstPara = prose.find((c) => c.tag === 'p' && c.text.trim().length > 0);
  return firstPara?.text.trim() || data.subtitle || '';
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
      if (!u || !u.includes(API_HOST)) continue;
      // Skip Mustache template strings — these are placeholders that get
      // expanded client-side and aren't valid `DataDownload.contentUrl` values.
      if (u.includes("{{") || u.includes("}}")) continue;
      urls.add(u);
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
