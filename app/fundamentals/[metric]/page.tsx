"use client";
import { useEffect, useMemo, useState } from "react";
import Error from "next/error";
// import { useMetricsData } from "@/context/MetricsProvider";
import { TVLMetricsResponse } from "@/types/api/TVLMetricsResponse";
import { TxCountMetricsResponse } from "@/types/api/TxCountMetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import MainChart from "@/components/home/MainChart";
import ComparisonChart from "@/components/layout/ComparisonChart";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/solid";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import _ from "lodash";

const Chain = ({ params }: { params: any }) => {
  const [showUsd, setShowUsd] = useSessionStorage("showUsd", true);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const { data: metricData, error: metricError } = useSWR<
    TVLMetricsResponse | TxCountMetricsResponse
  >(MetricsURLs[params.metric]);

  const data = useMemo(() => {
    if (!metricData) return null;
    return _.omit(metricData.data.chains, "ethereum");
  }, [metricData]);

  const chains = useMemo(() => {
    if (!data) return AllChains;

    return AllChains.filter((chain) => Object.keys(data).includes(chain.key));
  }, [data]);

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
      {data && (
        <div className="flex flex-col space-y-4 mt-8 pl-6">
          <Heading>{metricData.data.metric_name}</Heading>
          <Subheading>{metricData.data.description}</Subheading>

          <div className="flex space-x-8">
            <div className="flex flex-col">
              <MetricsTable
                data={data}
                selectedChains={selectedChains}
                setSelectedChains={setSelectedChains}
                chains={chains}
                metric={metricData.data.metric_id}
              />
            </div>
            <div className="flex-1">
              <ComparisonChart
                data={Object.keys(data)
                  .filter((chain) => selectedChains.includes(chain))
                  .map((chain) => {
                    return {
                      name: chain,
                      // type: 'spline',
                      types: data[chain][selectedTimeInterval].types,
                      data: data[chain][selectedTimeInterval].data,
                    };
                  })}
                timeIntervals={_.intersection(Object.keys(data.arbitrum), [
                  "daily",
                  "weekly",
                  "monthly",
                ])}
                onTimeIntervalChange={(timeInterval) =>
                  setSelectedTimeInterval(timeInterval)
                }
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
