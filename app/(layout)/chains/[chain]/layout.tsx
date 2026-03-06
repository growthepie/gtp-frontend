
import { Metadata } from "next";
import { MasterURL } from "@/lib/urls";
import { ChainInfo, MasterResponse } from "@/types/api/MasterResponse";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { getPageMetadata } from "@/lib/metadata";
import { cache } from "react";
import { serializeJsonLd } from "@/utils/json-ld";

type Props = {
  params: Promise<{ chain: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  // fetch data from API
  let res: MasterResponse;
  try {
    res = await fetchMasterData();
  } catch (error) {
    console.error("Failed to fetch master data:", error);
    return {
      title: "growthepie",
      description: "Layer 2 analytics",
    };
  }

  // 1. Fetch data specific to this chain (e.g., its full name)
  const AllChainsByUrlKey = Object.keys(res.chains).filter((key) => !["multiple", "all_l2s"].includes(key)).reduce((acc, key) => {
    acc[res.chains[key].url_key] = { ...res.chains[key], key: key };
    return acc;
  }, {} as { [key: string]: ChainInfo & { key: string } });

  // Check if the chain exists before accessing its properties
  if (!AllChainsByUrlKey[params.chain]) {
    return {
      title: "Chain not found",
      description: "Chain not found",
    };
  }

  const key = AllChainsByUrlKey[params.chain].key;
  const urlKey = AllChainsByUrlKey[params.chain].url_key;

  // 2. Fetch metadata template from Airtable using the *template path*
  //    and provide the dynamic data for placeholder replacement.
  const metadata = await getPageMetadata(
    '/chains/[slug]', // The path key stored in Airtable
    { chainName: res.chains[key].name } // Data for placeholders like {{chainName}}
  );
  const canonical = `https://www.growthepie.com/chains/${urlKey}`;
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;

  if (res && key && res.chains[key]) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: {
        absolute: metadata.title,
      },
      description: metadata.description,
      alternates: {
        canonical,
      },
      openGraph: {
        url: canonical,
        type: "website",
        title: metadata.title,
        description: metadata.description,
        siteName: "growthepie",
        images: [
          {
            url: `https://api.growthepie.com/v1/og_images/chains/${urlKey}.png`,
            width: 1200,
            height: 627,
            alt: "growthepie.com",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: metadata.title,
        description: metadata.description,
        images: [`https://api.growthepie.com/v1/og_images/chains/${urlKey}.png`],
      },
      robots,
    };
  }

  return {
    title: "Chain not found",
    description: "Chain not found",
  };
}

const fetchMasterData = cache(async (): Promise<MasterResponse> => {
  const response = await fetch(MasterURL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Master API returned ${response.status}: ${response.statusText}`);
  }
  return response.json();
});

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ chain: string }> }) {
  const { chain } = await params;
  let res: MasterResponse;
  try {
    res = await fetchMasterData();
  } catch {
    return children;
  }

  const allChainsByUrlKey = Object.keys(res.chains)
    .filter((key) => !["multiple", "all_l2s"].includes(key))
    .reduce((acc, key) => {
      acc[res.chains[key].url_key] = { ...res.chains[key], key };
      return acc;
    }, {} as { [key: string]: ChainInfo & { key: string } });

  const chainInfo = allChainsByUrlKey[chain];
  if (!chainInfo) return children;

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
      {children}
    </>
  );
}
