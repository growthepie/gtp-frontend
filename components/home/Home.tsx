"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { LandingURL, MasterURL } from "@/lib/urls";
import { useMaster } from "@/contexts/MasterContext";
import ShowLoading from "@/components/layout/ShowLoading";

export default function Home() {
  const { AllChains, AllChainsByKeys } = useMaster();

  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<LandingPageMetricsResponse>(LandingURL);

  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState("Total Users");

  useEffect(() => {
    if (landing) {

      setData(landing.data.metrics.engagement[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);

  useEffect(() => {
    if (!data || !landing) return;


    setSelectedChains(
      Object.keys(landing.data.metrics.table_visual)
        .filter((chainKey) => AllChainsByKeys.hasOwnProperty(chainKey))
        .map((chain) => chain),
    );
  }, [AllChainsByKeys, data, landing, selectedMetric, selectedTimeInterval]);



  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key),
  );

  return (
    <>
      <ShowLoading
        dataLoading={[landingLoading]}
        dataValidating={[landingValidating]}
        fullScreen={true}
      />

    </>
  );
}
