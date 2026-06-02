export const dataTermsLastUpdated = "June 2, 2026";
export const dataTermsLastUpdatedIso = "2026-06-02";

export type DataTermsSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const dataTermsSections: DataTermsSection[] = [
  {
    title: "Scope",
    paragraphs: [
      "These Data and API Terms apply to public growthepie data, chart exports, CSV downloads, public API outputs, and other datasets published by growthepie unless a more specific notice says otherwise.",
      "These terms do not replace any separate agreement we may have with you, and they do not grant rights in third-party material, trademarks, logos, brand assets, or data that is clearly governed by another source or license.",
    ],
  },
  {
    title: "Open Use With Attribution",
    paragraphs: [
      "Unless otherwise stated, growthepie data is copyright or database-right protected material of orbal GmbH / growthepie where protectable, and may be used, shared, and adapted under the Creative Commons Attribution 4.0 International license: https://creativecommons.org/licenses/by/4.0/.",
      "You may use the data for research, journalism, dashboards, applications, reports, models, and commercial or non-commercial products, provided that you give appropriate credit and do not imply that growthepie endorses you or your use.",
    ],
    bullets: [
      "Preferred attribution: Source: growthepie, https://www.growthepie.com.",
      "For chart screenshots or reports: include Source: growthepie near the chart or in the source notes.",
      "For API-backed products: include a source note in your documentation, data source list, footer, or another reasonable location.",
      "Where practical, link to the relevant growthepie page, chart, API endpoint, or https://www.growthepie.com.",
      "If you modify, transform, or combine the data, make that clear where it matters for interpretation.",
    ],
  },
  {
    title: "Third-Party and Upstream Sources",
    paragraphs: [
      "growthepie combines public blockchain data, own analysis, and selected third-party or upstream data sources. Some metrics, labels, or datasets may include source-specific terms, attribution requirements, or restrictions.",
      "If a chart, API response, documentation page, or source list names another provider, you are responsible for respecting that provider's applicable terms in addition to these terms.",
    ],
  },
  {
    title: "API Access and Fair Use",
    paragraphs: [
      "Public API access is provided to support open research, builders, ecosystem analysis, and community tools. We may apply rate limits, caching, access controls, or other technical measures to keep the service reliable.",
      "Do not use the API or website in a way that degrades availability, bypasses limits, probes security, overwhelms infrastructure, or misrepresents request origin. For high-volume, commercial, or production-critical use, contact us before relying on the service.",
    ],
  },
  {
    title: "No Warranty",
    paragraphs: [
      "Data is provided as-is and as-available. It may be incomplete, delayed, inaccurate, changed, reclassified, or removed. We do not guarantee uninterrupted API availability, exact historical continuity, or suitability for a specific purpose.",
      "growthepie is an analytics and educational platform. Nothing on the website, in chart exports, or in API data is financial, investment, legal, tax, or professional advice.",
    ],
  },
  {
    title: "No Endorsement",
    paragraphs: [
      "Attribution to growthepie does not mean that growthepie sponsors, approves, verifies, or endorses your work, product, analysis, conclusions, or organization.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update these Data and API Terms when our datasets, API, licensing approach, upstream sources, or legal requirements change. The date at the top shows when these terms were last updated.",
      "Questions about data reuse, attribution, high-volume API use, or commercial partnerships can be sent to matthias@orbal-analytics.com.",
    ],
  },
];
