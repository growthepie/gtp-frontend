import { isValidElement, type ReactElement, type ReactNode } from "react";
import { metricCategories, metricItems, type MetricItem } from "@/lib/metrics";
import { MetricsURLs } from "@/lib/urls";

const CANONICAL_BASE = "https://www.growthepie.com/fundamentals";
const DEFAULT_LANGUAGE = "en";

export const findMetricConfig = (metric: string): MetricItem | undefined =>
  metricItems.find((item) => item.urlKey === metric);

export const canonicalUrlForMetric = (metric: string): string =>
  `${CANONICAL_BASE}/${metric}`;

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const nodeToString = (value?: ReactNode): string => {
  if (value === undefined || value === null) return "";

  if (typeof value === "string") return normalizeWhitespace(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return normalizeWhitespace(String(value));
  }

  if (Array.isArray(value)) {
    return normalizeWhitespace(value.map((entry) => nodeToString(entry)).join(" "));
  }

  if (isValidElement(value)) {
    return normalizeWhitespace(extractText(value));
  }

  return "";
};

const extractText = (element: ReactElement): string => {
  const { children } = (element.props ?? {}) as { children?: React.ReactNode };
  if (!children) return "";

  const parts = Array.isArray(children) ? children : [children];
  return parts.map((child) => {
    if (child === null || child === undefined) return "";
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (typeof child === "boolean") return "";
    if (Array.isArray(child)) {
      return child.map((nested) => nodeToString(nested)).join(" ");
    }
    if (isValidElement(child)) {
      return extractText(child);
    }
    return "";
  }).join(" ");
};

const toIsoString = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return undefined;
  return date.toISOString();
};

export const buildKeywords = (metricConfig: MetricItem): string[] => {
  const set = new Set<string>();

  const { page, label, category } = metricConfig;
  if (label) set.add(label);
  if (page?.title) set.add(page.title);
  if (category && metricCategories?.[category]?.label) {
    set.add(metricCategories[category].label);
  } else if (category) {
    set.add(category.replace(/-/g, " "));
  }

  (page?.tags ?? []).forEach((tag) => {
    const text = nodeToString(tag);
    if (text) set.add(text);
  });

  return Array.from(set).map((keyword) => keyword.trim()).filter(Boolean);
};

export const buildAboutThings = (metricConfig: MetricItem) =>
  buildKeywords(metricConfig).map((keyword) => ({
    "@type": "Thing" as const,
    name: keyword,
  }));

export const buildDefinedTermSet = (
  metric: string,
  pageData?: MetricItem["page"]
) => {
  if (!pageData?.title) return null;

  const terms = [
    pageData.description
      ? {
          "@type": "DefinedTerm" as const,
          name: pageData.title,
          description: nodeToString(pageData.description),
        }
      : null,
    pageData.calculation
      ? {
          "@type": "DefinedTerm" as const,
          name: `${pageData.title} calculation`,
          description: nodeToString(pageData.calculation),
        }
      : null,
    pageData.why
      ? {
          "@type": "DefinedTerm" as const,
          name: `${pageData.title} significance`,
          description: nodeToString(pageData.why),
        }
      : null,
    pageData.interpretation
      ? {
          "@type": "DefinedTerm" as const,
          name: `${pageData.title} interpretation`,
          description: nodeToString(pageData.interpretation),
        }
      : null,
  ].filter(Boolean);

  if (terms.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: `${pageData.title} definitions`,
    inLanguage: DEFAULT_LANGUAGE,
    url: canonicalUrlForMetric(metric),
    hasDefinedTerm: terms,
  };
};

type FaqEntry = { question: string; answer: string };

export const buildFaqEntries = (
  _metric: string,
  pageData?: MetricItem["page"]
): FaqEntry[] => {
  if (!pageData?.title) return [];

  const faqCandidates: Array<{ key: keyof NonNullable<MetricItem["page"]>; label: string }> = [
    { key: "why", label: `What does ${pageData.title} tell you?` },
    { key: "calculation", label: `How is ${pageData.title} calculated?` },
    { key: "how_gamed", label: `How can ${pageData.title} be gamed?` },
    { key: "interpretation", label: `How to interpret ${pageData.title}?` },
  ];

  return faqCandidates
    .map(({ key, label }) => {
      const answer = nodeToString(pageData[key]);
      if (!answer) return null;
      return { question: label, answer };
    })
    .filter(Boolean) as FaqEntry[];
};

export const buildFaqJsonLd = (
  metric: string,
  pageData?: MetricItem["page"]
) => {
  const entries = buildFaqEntries(metric, pageData);
  if (entries.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
};

export const buildDatasetJsonLd = (
  metric: string,
  pageData?: MetricItem["page"],
  options?: {
    description?: string;
    keywords?: string[];
    about?: Array<{ "@type": "Thing"; name: string }>;
    dateModified?: string;
  }
) => {
  const dataUrl = MetricsURLs[metric];
  if (!dataUrl) return null;

  const title = pageData?.title || metric;
  const description =
    options?.description ||
    nodeToString(pageData?.description) ||
    `${title} across the Ethereum ecosystem.`;
  const keywords = options?.keywords?.filter(Boolean);
  const about = options?.about?.filter(Boolean);
  const dateModified = toIsoString(options?.dateModified);

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${title} — growthepie fundamentals`,
    description,
    url: canonicalUrlForMetric(metric),
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    creator: {
      "@type": "Organization",
      name: "growthepie",
      url: "https://www.growthepie.com",
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: dataUrl,
        description: `${title} dataset as JSON download.`,
      },
    ],
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    ...(about && about.length > 0 ? { about } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: DEFAULT_LANGUAGE,
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "date",
        description: "Date for each metric observation.",
      },
      {
        "@type": "PropertyValue",
        name: title,
        description: `${title} values across tracked chains.`,
      },
    ],
  };
};
