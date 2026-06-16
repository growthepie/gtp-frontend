// Server-only helpers that build parse-time JSON-LD for /chains/[chain].
//
// The graphs returned here are emitted by ChainsRouteSchemas, which is mounted
// in the root layout *outside* the <Providers> client boundary — so they land
// in parse-time HTML for non-JS AI crawlers and schema validators. The previous
// implementation emitted these scripts from chains/[chain]/layout.tsx, which
// sits inside <Providers>; that left them escaped in the RSC stream and only
// materialising after client hydration (invisible to raw-HTML schema parsers).

import { cache } from "react";
import { MasterURL } from "@/lib/urls";
import { getPageMetadata } from "@/lib/metadata";
import type { ChainInfo, MasterResponse } from "@/types/api/MasterResponse";

const SITE_URL = "https://www.growthepie.com";
const ORG_ID = `${SITE_URL}/#organization`;

export type ChainWithKey = ChainInfo & { key: string };

// React-cached so the master.json fetch is deduped across every consumer in a
// single request (generateMetadata and ChainsRouteSchemas share one network
// call). Returns null on fetch failure so callers can apply their own fallback.
export const getChainsByUrlKey = cache(
  async (): Promise<Record<string, ChainWithKey> | null> => {
    let res: MasterResponse;
    try {
      const response = await fetch(MasterURL, { cache: "no-store" });
      if (!response.ok) return null;
      res = await response.json();
    } catch {
      return null;
    }
    return Object.keys(res.chains)
      .filter((key) => !["multiple", "all_l2s"].includes(key))
      .reduce((acc, key) => {
        acc[res.chains[key].url_key] = { ...res.chains[key], key };
        return acc;
      }, {} as Record<string, ChainWithKey>);
  },
);

// Build the JSON-LD graphs (WebPage + BreadcrumbList + Dataset) for a single
// chain page. Returns null when the chain can't be resolved (unknown slug or
// master fetch failure) or when the page is marked noindex — so we never
// advertise structured data for a page engines are told to skip.
export async function buildChainGraphs(
  urlKey: string,
): Promise<Record<string, unknown>[] | null> {
  const chainsByUrlKey = await getChainsByUrlKey();
  const chainInfo = chainsByUrlKey?.[urlKey];
  if (!chainInfo) return null;

  const metadata = await getPageMetadata("/chains/[slug]", {
    chainName: chainInfo.name,
  });
  if (metadata.noIndex) return null;

  const canonical = `${SITE_URL}/chains/${chainInfo.url_key}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonical,
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: [{ "@type": "Thing", name: chainInfo.name }],
    inLanguage: "en",
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chains",
        item: `${SITE_URL}/chains`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: chainInfo.name,
        item: canonical,
      },
    ],
  };

  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${chainInfo.name} — Ethereum ecosystem metrics`,
    description: metadata.description,
    url: canonical,
    license: "https://creativecommons.org/licenses/by-nc/4.0/",
    isAccessibleForFree: true,
    creator: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    about: [{ "@type": "Thing", name: chainInfo.name }],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: `${chainInfo.name} overview`,
        contentUrl: `https://api.growthepie.com/v1/chains/${chainInfo.key}/overview.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: `${chainInfo.name} blockspace`,
        contentUrl: `https://api.growthepie.com/v1/chains/blockspace/${chainInfo.key}.json`,
      },
    ],
  };

  return [webPage, breadcrumbs, dataset];
}
