import { isValidElement, type ReactElement, type ReactNode } from "react";
import { metricItems, type MetricItem } from "@/lib/metrics";
import { MetricsURLs } from "@/lib/urls";

const CANONICAL_BASE = "https://www.growthepie.com/fundamentals";

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
  const { children } = element.props ?? {};
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
  options?: { description?: string }
) => {
  const dataUrl = MetricsURLs[metric];
  if (!dataUrl) return null;

  const title = pageData?.title || metric;
  const description =
    options?.description ||
    nodeToString(pageData?.description) ||
    `${title} across the Ethereum ecosystem.`;

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
