import { cache } from "react";
import { getPageMetadata } from "@/lib/metadata";
import {
  buildAboutThings,
  buildDatasetJsonLd,
  buildDefinedTermSet,
  buildFaqJsonLd,
  buildKeywords,
  findMetricConfig,
} from "@/lib/fundamentals/seo";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { serializeJsonLd } from "@/utils/json-ld";

type Props = { params: { metric: string } };

const fetchMasterData = cache(async (): Promise<MasterResponse> => {
  const response = await fetch(MasterURL, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load master data for fundamentals: ${response.status}`);
  }

  return response.json();
});

export default async function Head({ params }: Props) {
  const metric = params.metric;
  const metricConfig = findMetricConfig(metric);
  if (!metricConfig) return null;

  const metadata = await getPageMetadata(`/fundamentals/${metric}`, {});

  let lastUpdated: string | undefined;
  try {
    const master = await fetchMasterData();
    lastUpdated = master.last_updated_utc
      ? new Date(master.last_updated_utc).toISOString()
      : new Date().toISOString();
  } catch {
    lastUpdated = undefined;
  }

  const keywords = buildKeywords(metricConfig);
  const aboutThings = buildAboutThings(metricConfig);

  const faqJsonLd = buildFaqJsonLd(metric, metricConfig.page);
  const datasetJsonLd = buildDatasetJsonLd(metric, metricConfig.page, {
    description: metadata.description,
    keywords,
    about: aboutThings,
    dateModified: lastUpdated,
  });
  const definedTermSetJsonLd = buildDefinedTermSet(metric, metricConfig.page);

  const graphs = [datasetJsonLd, faqJsonLd, definedTermSetJsonLd].filter(Boolean) as Record<
    string,
    unknown
  >[];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
        />
      ))}
    </>
  );
}
