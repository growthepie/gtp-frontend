import { Metadata, ResolvingMetadata } from "next";
import { navigationItems } from "@/lib/navigation";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import { MetricsURLs } from "@/lib/urls";
import { CompleteDataFeed, WithContext } from "schema-dts";

type Props = {
  params: { metric: string };
};

const unitsMap = {
  value: "",
  usd: "USD",
  eth: "ETH",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Fundamentals")
    ?.options.find((item) => item.urlKey === params.metric);

  if (option) {
    return {
      title: option.page?.title,
      description: option.page?.why,
    };
  }

  return {
    title: "Metric not found",
    description: "Metric not found",
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { metric: string };
}) {
  const url = MetricsURLs[params.metric];

  let jsonLd: null | WithContext<CompleteDataFeed> = null;

  if (url) {
    // fetch data from API
    const res: MetricsResponse = await fetch(MetricsURLs[params.metric], {
      cache: "no-store",
    }).then((r) => r.json());

    if (res && res.data && res.data.chains) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "CompleteDataFeed",
        name: res.data.metric_name,
        dateModified: new Date(
          res.data.chains[Object.keys(res.data.chains)[0]].daily.data[
            res.data.chains[Object.keys(res.data.chains)[0]].daily.data.length -
              1
          ][
            res.data.chains[
              Object.keys(res.data.chains)[0]
            ].daily.types.indexOf("unix")
          ],
        ).toISOString(),
        description: "growthepie",
        dataFeedElement: Object.keys(res.data.chains).map((chain) => ({
          "@type": "DataFeedItem",
          dateModified: new Date(
            res.data.chains[Object.keys(res.data.chains)[0]].daily.data[
              res.data.chains[Object.keys(res.data.chains)[0]].daily.data
                .length - 1
            ][
              res.data.chains[
                Object.keys(res.data.chains)[0]
              ].daily.types.indexOf("unix")
            ],
          ).toISOString(),
          item: {
            "@type": "PropertyValue",
            dateModified: new Date(
              res.data.chains[chain].daily.data[
                res.data.chains[chain].daily.data.length - 1
              ][res.data.chains[chain].daily.types.indexOf("unix")],
            ).toISOString(),
            name: res.data.chains[chain].chain_name,
            value: `${
              Math.round(
                res.data.chains[chain].daily.data[
                  res.data.chains[chain].daily.data.length - 1
                ][1] * 100,
              ) / 100
            } ${unitsMap[res.data.chains[chain].daily.types[1]]}`,
          },
        })),
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )}
      {children};
    </>
  );
}
