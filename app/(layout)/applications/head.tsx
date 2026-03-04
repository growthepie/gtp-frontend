import { getPageMetadata } from "@/lib/metadata";
import { serializeJsonLd } from "@/utils/json-ld";

export default async function Head() {
  const metadata = await getPageMetadata("/applications", {});
  const canonical = metadata.canonical ?? "https://www.growthepie.com/applications";

  const webPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": "https://www.growthepie.com/#website",
    },
    inLanguage: "en",
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.growthepie.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Applications",
        item: canonical,
      },
    ],
  };

  return (
    <>
      {[webPage, breadcrumbs].map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
    </>
  );
}
