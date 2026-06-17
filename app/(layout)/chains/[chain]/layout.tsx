
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";
import { getChainsByUrlKey } from "@/lib/chainSeo";

type Props = {
  params: Promise<{ chain: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;

  const chainsByUrlKey = await getChainsByUrlKey();
  if (!chainsByUrlKey) {
    // Master fetch failed — fall back to generic site metadata.
    return {
      title: "growthepie",
      description: "Layer 2 analytics",
    };
  }

  const chainInfo = chainsByUrlKey[params.chain];
  if (!chainInfo) {
    return {
      title: "Chain not found",
      description: "Chain not found",
    };
  }

  const urlKey = chainInfo.url_key;

  // Fetch metadata template (Airtable-backed) with the chain name for
  // placeholder replacement like {{chainName}}.
  const metadata = await getPageMetadata("/chains/[slug]", {
    chainName: chainInfo.name,
  });
  const canonical = `https://www.growthepie.com/chains/${urlKey}`;
  const robots = metadata.noIndex ? { index: false, follow: false } : undefined;

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

// Passthrough layout. Per-route JSON-LD (WebPage + BreadcrumbList + Dataset)
// now lives in ChainsRouteSchemas, mounted in the root layout outside the
// <Providers> client boundary so it lands in parse-time HTML. Emitting it here
// left it trapped in the RSC stream, invisible to raw-HTML schema parsers.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
