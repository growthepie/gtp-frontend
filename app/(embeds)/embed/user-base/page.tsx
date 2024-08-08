"use client";
import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { LandingURL, MasterURL } from "@/lib/urls";
import LandingChart from "@/components/layout/LandingChart";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";

export default function Page() {
  const searchParams = useSearchParams();
  const queryTheme = searchParams ? searchParams.get("theme") : null;
  const queryTimespan = searchParams ? searchParams.get("timespan") : null;
  const queryMetric = searchParams ? searchParams.get("metric") : null;
  const queryShowMainnet = searchParams
    ? searchParams.get("showMainnet")
    : null;
  const queryZoomed = searchParams ? searchParams.get("zoomed") : null;
  const queryStartTimestamp = searchParams
    ? searchParams.get("startTimestamp")
    : null;
  const queryEndTimestamp = searchParams
    ? searchParams.get("endTimestamp")
    : null;

  const { theme, setTheme } = useTheme();
  useLayoutEffect(() => {
    setTimeout(() => {
      if (queryTheme == "light") {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }, 1000);
  }, []);

  // const isLargeScreen = useMediaQuery("(min-width: 1280px)");

  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // useEffect(() => {
  //   setIsSidebarOpen(isLargeScreen);
  // }, [isLargeScreen]);

  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<LandingPageMetricsResponse>(LandingURL);
  // } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState(
    queryMetric ?? "Total Users",
  );

  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.user_base[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);

  useEffect(() => {
    if (!data) return;

    setSelectedChains(
      Object.keys(data.chains)
        .filter((chainKey) => AllChainsByKeys.hasOwnProperty(chainKey))
        .map((chain) => chain),
    );
  }, [data, landing, selectedMetric, selectedTimeInterval]);

  const chains = useMemo(() => {
    if (!data) return [];

    return AllChains.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key) && chain.key != "ethereum",
    );
  }, [data]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key),
  );
  return (
    <>
      {data && landing && master ? (
        <LandingChart
          data={Object.keys(data.chains)
            .filter((chain) => selectedChains.includes(chain))
            .map((chain) => {
              return {
                name: chain,
                // type: 'spline',
                types: data.chains[chain].data.types,
                data: data.chains[chain].data.data,
              };
            })}
          master={master}
          sources={landing.data.metrics.user_base.source}
          cross_chain_users={data.cross_chain_users}
          cross_chain_users_comparison={data.cross_chain_users_comparison}
          latest_total={data.latest_total}
          latest_total_comparison={data.latest_total_comparison}
          l2_dominance={data.l2_dominance}
          l2_dominance_comparison={data.l2_dominance_comparison}
          selectedMetric={selectedMetric}
          metric={selectedTimeInterval}
          setSelectedMetric={setSelectedMetric}
          is_embed={true}
          embed_timespan={queryTimespan ?? "365d"}
          embed_show_mainnet={queryShowMainnet === "true"}
          embed_zoomed={queryZoomed === "true"}
          embed_start_timestamp={
            queryStartTimestamp ? parseInt(queryStartTimestamp) : undefined
          }
          embed_end_timestamp={
            queryEndTimestamp ? parseInt(queryEndTimestamp) : undefined
          }
        />
      ) : null}
    </>
  );
}
