"use client";
import { useMemo, useState } from "react";
import Error from "next/error";
import { TVLMetricsResponse } from "@/types/api/TVLMetricsResponse";
import { TxCountMetricsResponse } from "@/types/api/TxCountMetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import { intersection } from "lodash";
import { items as sidebarItems } from "@/components/layout/Sidebar";
import { Icon } from "@iconify/react";

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const { data: metricData, error: metricError } = useSWR<
    TVLMetricsResponse | TxCountMetricsResponse
  >(MetricsURLs[params.metric]);

  // const data = useMemo(() => {
  //   if (!metricData) return null;
  //   return _.omit(metricData.data.chains, "ethereum");
  // }, [metricData]);

  const chains = useMemo(() => {
    if (!metricData) return AllChains;

    return AllChains.filter(
      (chain) =>
        Object.keys(metricData.data.chains).includes(chain.key) &&
        chain.key != "ethereum"
    );
  }, [metricData]);

  const pageData = sidebarItems[1]?.options.find(
    (item) => item.urlKey === params.metric
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key)
  );

  const [selectedTimespan, setSelectedTimespan] = useState("30d");

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  return (
    <>
      {/* <h1>Metric: {params.metric}</h1> */}
      {metricData && (
        <div className="flex flex-col space-y-4 mt-8 pl-2 md:pl-6">
          <Heading>{pageData.title}</Heading>
          <Subheading className="flex items-center space-x-1.5">
            <Icon icon={pageData.icon} />
            <div>{pageData.description}</div>
          </Subheading>

          <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-8">
            <div className="flex flex-col xl:min-w-[600px]">
              <MetricsTable
                data={metricData.data.chains}
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                chains={chains}
                metric={metricData.data.metric_id}
              />
            </div>
            <div className="flex-1">
              <ComparisonChart
                data={Object.keys(metricData.data.chains)
                  .filter((chain) => selectedChains.includes(chain))
                  .map((chain) => {
                    return {
                      name: chain,
                      // type: 'spline',
                      types:
                        metricData.data.chains[chain][selectedTimeInterval]
                          .types,
                      data: metricData.data.chains[chain][selectedTimeInterval]
                        .data,
                    };
                  })}
                timeIntervals={intersection(
                  Object.keys(metricData.data.chains.arbitrum),
                  ["daily", "weekly", "monthly"]
                )}
                onTimeIntervalChange={(timeInterval) =>
                  setSelectedTimeInterval(timeInterval)
                }
                showTimeIntervals={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
    </>
  );
};

export default Chain;
