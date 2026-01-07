"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { useMemo, useState } from "react";
import { EconomicsURL } from "@/lib/urls";
import {
  EconomicsResponse,
  ChainBreakdownResponse,
  FeesBreakdown,
  l2_data,
} from "@/types/api/EconomicsResponse";
import EconHeadCharts from "@/components/layout/Economics/HeadCharts";
import ChainBreakdown from "@/components/layout/Economics/ChainBreakdown";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import { useMaster } from "@/contexts/MasterContext";
import MetricRelatedQuickBites from "@/components/MetricRelatedQuickBites";
import { PageContainer } from "@/components/layout/Container";

export default function Economics() {
  const { SupportedChainKeys } = useMaster();
  const {
    data: econData,
    error: econError,
    isLoading: econLoading,
    isValidating: econValidating,
  } = useSWR<EconomicsResponse>(EconomicsURL);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [isMonthly, setIsMonthly] = useState(false);


  const chainBreakdownData = useMemo(() => {
    if (!econData) return {};
    return Object.fromEntries(Object.entries(econData.data.chain_breakdown).filter(([chain]) => SupportedChainKeys.includes(chain)));
  }, [econData, SupportedChainKeys]);

  return (
    <>
      <ShowLoading
        dataLoading={[econLoading, masterLoading]}
        dataValidating={[econValidating, masterValidating]}
      />
      {/*Data Availability Fee Markets */}
      <div className={`flex flex-col transition-[gap] duration-300 ${selectedTimespan === "1d" ? "gap-y-[15px]" : "gap-y-[30px]"}`}>
        <div className={`flex flex-col gap-y-[15px]`}>
          {econData && <EconHeadCharts chart_data={econData.data.all_l2s} selectedTimespan={selectedTimespan} setSelectedTimespan={setSelectedTimespan} isMonthly={isMonthly} setIsMonthly={setIsMonthly} />}
        </div>
        {econData && master && <ChainBreakdown data={chainBreakdownData} master={master} selectedTimespan={selectedTimespan} setSelectedTimespan={setSelectedTimespan} isMonthly={isMonthly} setIsMonthly={setIsMonthly} totals={econData.data.chain_breakdown["totals"]} />}
      </div>
      
      {/* Add Related Quick Bites Section */}
      <PageContainer className="" paddingY="none">
        <MetricRelatedQuickBites metricKey="economics" metricType="economics" />
      </PageContainer>
    </>
  );
}
