import { cache } from "react";
import { getPageMetadata } from "@/lib/metadata";
import { MasterURL } from "@/lib/urls";
import { MasterResponse, ChainInfo } from "@/types/api/MasterResponse";
import { serializeJsonLd } from "@/utils/json-ld";

type Props = {
  params: { chain: string };
};

const fetchMasterData = cache(async (): Promise<MasterResponse> => {
  const response = await fetch(MasterURL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load master data for chains: ${response.status}`);
  }

  return response.json();
});

export default async function Head({ params }: Props) {
  let master: MasterResponse;
  try {
    master = await fetchMasterData();
  } catch {
    return null;
  }

  const allChainsByUrlKey = Object.keys(master.chains)
    .filter((key) => !["multiple", "all_l2s"].includes(key))
    .reduce((acc, key) => {
      acc[master.chains[key].url_key] = { ...master.chains[key], key };
      return acc;
    }, {} as { [key: string]: ChainInfo & { key: string } });

  const chainInfo = allChainsByUrlKey[params.chain];
  if (!chainInfo) return null;

  const metadata = await getPageMetadata("/chains/[slug]", {
    chainName: chainInfo.name,
  });
  const canonical = `https://www.growthepie.com/chains/${chainInfo.url_key}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": "https://www.growthepie.com/#website",
    },
    about: [
      {
        "@type": "Thing",
        name: chainInfo.name,
      },
    ],
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
        name: chainInfo.name,
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
