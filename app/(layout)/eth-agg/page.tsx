"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { useState } from "react";
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
import TopSelectArea from "@/components/layout/EthAgg/TopSelectArea";
import TopEthAggMetrics from "@/components/layout/EthAgg/MetricsTop";
import MetricsCharts from "@/components/layout/EthAgg/MetricsCharts";
export default function EthAgg() {
 
  const [selectedBreakdownGroup, setSelectedBreakdownGroup] = useState("Metrics");
  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [isMonthly, setIsMonthly] = useState(false);


  return (
    <>
     <TopSelectArea selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} />
     <div className="mt-[30px]">
        <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />
        <MetricsCharts selectedBreakdownGroup={selectedBreakdownGroup} />
     </div>
      {/* <ShowLoading
        dataLoading={[econLoading, masterLoading]}
        dataValidating={[econValidating, masterValidating]}
      /> */}
      {/*Data Availability Fee Markets */}
      {/* <div className={`flex flex-col transition-[gap] duration-300 ${selectedTimespan === "1d" ? "gap-y-[15px]" : "gap-y-[30px]"}`}>
        <div className={`flex flex-col gap-y-[15px]`}>
          {econData && <EconHeadCharts chart_data={econData.data.all_l2s} selectedTimespan={selectedTimespan} setSelectedTimespan={setSelectedTimespan} isMonthly={isMonthly} setIsMonthly={setIsMonthly} />}
        </div>
        {econData && master && <ChainBreakdown data={Object.fromEntries(Object.entries(econData.data.chain_breakdown).filter(([key]) => key !== "totals"))} master={master} selectedTimespan={selectedTimespan} setSelectedTimespan={setSelectedTimespan} isMonthly={isMonthly} setIsMonthly={setIsMonthly} totals={econData.data.chain_breakdown["totals"]} />}
      </div> */}
       

    </>
  );
}
