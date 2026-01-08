"use client";
import { use, useLayoutEffect, useMemo, useState } from "react";
import Error from "next/error";
import { ChainData } from "@/types/api/MetricsResponse";
import useSWR from "swr";
import { navigationItems } from "@/lib/navigation";
import ComparisonChart from "@/components/layout/ComparisonChart";
import MetricsTable from "@/components/layout/MetricsTable";
import { intersection } from "lodash";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MasterURL } from "@/lib/urls";
import { useMaster } from "@/contexts/MasterContext";
import { useChainMetrics } from "@/hooks/useChainMetrics";

const Chain = (props: { params: Promise<any> }) => {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const queryTheme = searchParams ? searchParams.get("theme") : null;
  const queryTimespan = searchParams ? searchParams.get("timespan") : null;
  const queryStartTimestamp = searchParams
    ? searchParams.get("startTimestamp")
    : null;
  const queryEndTimestamp = searchParams
    ? searchParams.get("endTimestamp")
    : null;
  const queryScale = searchParams ? searchParams.get("scale") : null;
  const queryZoomed = searchParams ? searchParams.get("zoomed") : null;
  const queryInterval = searchParams ? searchParams.get("interval") : null;
  const queryFocusEnabled = searchParams ? searchParams.get("focusEnabled") : null;
  const queryShowMainnet = searchParams
    ? searchParams.get("showMainnet")
    : null;
  // chains query is an array of chains to display
  const queryChains = searchParams ? searchParams.get("chains") : null;

  const { setTheme } = useTheme();
  useLayoutEffect(() => {
    if (queryTheme === "light") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }, [queryTheme, setTheme]);

  const [showUsd, setShowUsd] = useState(true);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const { AllChains, SupportedChainKeys } = useMaster();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  // Determine which chains to fetch (same as normal page)
  const chainsToFetch = useMemo(() => {
    return AllChains.filter((chain) =>
      SupportedChainKeys.includes(chain.key),
    ).map((chain) => chain.key);
  }, [AllChains, SupportedChainKeys]);

  // Fetch metric data using the same hook as the normal page
  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
  } = useChainMetrics(params.metric, chainsToFetch, master!);

  const chainKeys = useMemo(() => {
    if (!metricData)
      return AllChains.filter(
        (chain) =>
          chain.ecosystem.includes("all-chains") || chain.key === "ethereum",
      ).map((chain) => chain.key);

    return AllChains.filter(
      (chain) =>
        (Object.keys(metricData.chains).includes(chain.key) &&
          chain.ecosystem.includes("all-chains")) ||
        chain.key === "ethereum",
    ).map((chain) => chain.key);
  }, [metricData]);

  const pageData = navigationItems[1]?.options.find(
    (item) => item.urlKey === params.metric,
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  // const selectedChains = AllChains.filter(
  //   (chain) =>
  //     (chain.ecosystem.includes("all-chains") &&
  //       ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(
  //         chain.key,
  //       )) ||
  //     chain.key === "ethereum",
  // ).map((chain) => chain.key);

  const selectedChains = useMemo(() => {
    if (!queryChains) {
      return AllChains.filter(
        (chain) =>
          (chain.ecosystem.includes("all-chains") &&
            ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(
              chain.key,
            )) ||
          chain.key === "ethereum",
      ).map((chain) => chain.key);
    }

    return queryChains;
  }, [queryChains]);

  const [selectedScale, setSelectedScale] = useState(
    queryScale
      ? queryScale
      : params.metric != "transaction-costs"
        ? "stacked"
        : "absolute",
  );

  const [selectedTimespan, setSelectedTimespan] = useState(
    queryTimespan ?? "365d",
  );

  const [selectedTimeInterval, setSelectedTimeInterval] = useState(
    queryInterval ?? "daily",
  );

  const [focusEnabled, setFocusEnabled] = useState(queryFocusEnabled === "true");

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(
    queryShowMainnet === "true",
  );

  const timeIntervalKey = useMemo(() => {
    if (
      metricData?.avg === true &&
      ["365d", "max"].includes(selectedTimespan)
    ) {
      return "daily_7d_rolling";
    }

    if (selectedTimeInterval === "weekly") {
      return "weekly";
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
    // <Link href={`https://www.growthepie.com/fundamentals/${params.metric}`} referrerPolicy="origin" target="_blank" rel="noopener noreferrer" aria-label="growthepie.com">
    <>
      {metricData && (
        <ComparisonChart
          data={Object.keys(metricData.chains)
            .filter((chain) => selectedChains.includes(chain))
            .map((chain) => {
              return {
                name: chain,
                // type: 'spline',
                types: metricData.chains[chain][timeIntervalKey]?.types || [],
                data: metricData.chains[chain][timeIntervalKey]?.data || [],
              };
            })}
          metric_id={metricData.metric_id}
          minDailyUnix={
            Object.values(metricData.chains).reduce(
              (acc: number, chain: ChainData) => {
                const intervalData = chain[timeIntervalKey] || chain["daily"];
                if (!intervalData?.data?.[0]?.[0]) return acc;
                return Math.min(
                  acc,
                  intervalData.data[0][0],
                );
              }
              , Infinity) as number
          }
          maxDailyUnix={
            Object.values(metricData.chains).reduce(
              (acc: number, chain: ChainData) => {
                const intervalData = chain[timeIntervalKey] || chain["daily"];
                if (!intervalData?.data?.length) return acc;
                return Math.max(
                  acc,
                  intervalData.data[intervalData.data.length - 1][0],
                );
              }
              , 0) as number
          }
          timeIntervals={intersection(
            Object.keys(metricData.chains.arbitrum || metricData.chains[Object.keys(metricData.chains)[0]] || {}),
            ["daily", "weekly", "monthly"],
          )}
          // onTimeIntervalChange={(timeInterval) =>
          //   setSelectedTimeInterval(timeInterval)
          // }
          selectedTimeInterval={selectedTimeInterval}
          setSelectedTimeInterval={setSelectedTimeInterval}
          showTimeIntervals={true}
          sources={metricData.source}
          avg={metricData.avg}
          focusEnabled={focusEnabled}
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          selectedScale={selectedScale}
          setSelectedScale={setSelectedScale}
          monthly_agg={metricData.monthly_agg}
          is_embed={true}
          embed_start_timestamp={
            queryStartTimestamp ? parseInt(queryStartTimestamp) : undefined
          }
          embed_end_timestamp={
            queryEndTimestamp ? parseInt(queryEndTimestamp) : undefined
          }
          embed_zoomed={queryZoomed === "true"}
        >
          <MetricsTable
            data={metricData.chains}
            master={master}
            selectedChains={selectedChains}
            setSelectedChains={() => { }}
            chainKeys={chainKeys}
            metric_id={metricData.metric_id}
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            timeIntervalKey={timeIntervalKey}
          />
        </ComparisonChart>
      )}
      {/* </Link > */}
    </>
  );
};

export default Chain;
