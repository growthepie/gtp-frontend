"use client";
import { useMemo, useState } from "react";
import Error from "next/error";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { MetricsURLs } from "@/lib/urls";
import {
  AllChains,
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { navigationItems } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";

const Fundamentals = ({ params }: { params: any }) => {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(MetricsURLs[params.metric]);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating, metricValidating]}
      />
      {master && metricData ? (
        <FundamentalsContent params={{ ...params, master, metricData }} />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

const FundamentalsContent = ({ params }: { params: any }) => {
  const master = params.master;
  const metricData = params.metricData;
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const chainKeys = useMemo(() => {
    if (!metricData)
      return AllChains.filter((chain) =>
        Get_SupportedChainKeys(master).includes(chain.key),
      ).map((chain) => chain.key);

    return AllChains.filter(
      (chain) =>
        Object.keys(metricData.data.chains).includes(chain.key) &&
        Get_SupportedChainKeys(master).includes(chain.key),
    ).map((chain) => chain.key);
  }, [master, metricData]);

  // const pageData = navigationItems[1]?.options.find(
  //   (item) => item.urlKey === params.metric,
  // )?.page ?? {
  //   title: "",
  //   description: "",
  //   icon: "",
  // };

  const [selectedChains, setSelectedChains] = useSessionStorage(
    "fundamentalsChains",
    [...Get_DefaultChainSelectionKeys(master), "ethereum"],
  );

  const [selectedScale, setSelectedScale] = useSessionStorage(
    "fundamentalsScale",
    "absolute",
  );

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "fundamentalsTimespan",
    "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    "fundamentalsTimeInterval",
    "daily",
  );

  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "fundamentalsShowEthereumMainnet",
    false,
  );

  const timeIntervalKey = useMemo(() => {
    if (
      metricData?.data.avg === true &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "monthly") {
      return "monthly";
    }

    return "daily";
  }, [metricData, selectedTimeInterval, selectedTimespan]);

  if (errorCode) {
    return <Error statusCode={errorCode} />;
  }

  return (
    <>
      <div className="flex flex-col-reverse xl:flex-row space-x-0 xl:space-x-2">
        <ComparisonChart
          data={Object.keys(metricData.data.chains)
            .filter((chain) => selectedChains.includes(chain))
            .map((chain) => {
              return {
                name: chain,
                // type: 'spline',
                types: metricData.data.chains[chain][timeIntervalKey].types,
                data: metricData.data.chains[chain][timeIntervalKey].data,
              };
            })}
          metric_id={metricData.data.metric_id}
          timeIntervals={intersection(
            Object.keys(metricData.data.chains.arbitrum),
            ["daily", "weekly", "monthly"],
          )}
          selectedTimeInterval={selectedTimeInterval}
          setSelectedTimeInterval={setSelectedTimeInterval}
          showTimeIntervals={true}
          sources={metricData.data.source}
          avg={metricData.data.avg}
          monthly_agg={metricData.data.monthly_agg}
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          selectedScale={
            params.metric === "transaction-costs" ? "absolute" : selectedScale
          }
          setSelectedScale={setSelectedScale}
        >
          <MetricsTable
            data={metricData.data.chains}
            selectedChains={selectedChains}
            setSelectedChains={setSelectedChains}
            chainKeys={chainKeys}
            metric_id={metricData.data.metric_id}
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            timeIntervalKey={timeIntervalKey}
          />
        </ComparisonChart>
      </div>
    </>
  );
};

export default Fundamentals;
