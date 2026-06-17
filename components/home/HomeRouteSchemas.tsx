// Server Component that emits the homepage FAQPage as JSON-LD, outside the
// <Providers> client boundary so it lands in parse-time HTML. Replaces the
// inline schema.org microdata that previously annotated the FAQ in
// HomeStaticShell — JSON-LD is the format used across the rest of the site
// (answers, fundamentals) and is more reliably parsed by AI crawlers.

import { headers } from "next/headers";
import { HOME_FAQ } from "@/lib/home/homeFaq";
import { serializeJsonLd } from "@/utils/json-ld";

const SITE_URL = "https://www.growthepie.com";

export default async function HomeRouteSchemas() {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  if (pathname !== "/" && pathname !== "") return null;

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    url: `${SITE_URL}/`,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: HOME_FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPage) }}
    />
  );
}
