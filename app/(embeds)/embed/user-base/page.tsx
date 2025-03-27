"use client";
import { useEffect, useMemo, useState,  useLayoutEffect } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { LandingURL, MasterURL } from "@/lib/urls";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import dynamic from "next/dynamic";

const LandingChart = dynamic(() => import("@/components/layout/LandingChart"), { ssr: false });


// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement",
//     description:
//       "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
//   };
// }

export default function Page() {
  const { AllChainsByKeys, AllChains } = useMaster();
  const searchParams = useSearchParams();
  const queryTheme = searchParams ? searchParams.get("theme") : null;
  const queryTimespan = searchParams ? searchParams.get("timespan") : null;
  const queryMetric = searchParams ? searchParams.get("metric") : null;
  const queryShowMainnet = searchParams ? searchParams.get("showMainnet") : null;
  const queryZoomed = searchParams ? searchParams.get("zoomed") : null;
  const queryStartTimestamp = searchParams ? searchParams.get("startTimestamp") : null;
  const queryEndTimestamp = searchParams ? searchParams.get("endTimestamp") : null;
  const queryFocusEnabled = searchParams ? searchParams.get("focusEnabled") : null;

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

  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<LandingPageMetricsResponse>(LandingURL);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState(queryMetric ?? "Total Ethereum Ecosystem");

  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.engagement[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);



  return (
    <>
      {data && landing && master && AllChainsByKeys ? (
        <LandingChart
          data={data}
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
          embed_start_timestamp={queryStartTimestamp ? parseInt(queryStartTimestamp) : undefined}
          embed_end_timestamp={queryEndTimestamp ? parseInt(queryEndTimestamp) : undefined}
          embed_focus_enabled={queryFocusEnabled === "true"}
        />
      ) : null}
    </>
  );
}
