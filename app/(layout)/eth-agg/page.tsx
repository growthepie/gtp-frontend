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
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "@/components/layout/GTPIcon";



export default function EthAgg() {
 
  const [selectedBreakdownGroup, setSelectedBreakdownGroup] = useState("Metrics");
  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [isMonthly, setIsMonthly] = useState(false);
  const TopMetricsComponent = <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />


  

  return (
    <>
     <TopSelectArea selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} />
     <div className="mt-[15px]">
        <div className={`px-[20px] md:px-[50px] text-[#CDD8D3] overflow-hidden transition-height duration-500 ${selectedBreakdownGroup === "Ethereum Ecosystem" ? "h-[159px]" : selectedBreakdownGroup === "Builders & Apps" ? "h-[141px]" : "h-[0px]"}`}>  
          <div className={`h-[144px] px-[30px] py-[15px] rounded-[15px] bg-[#1F2726] flex flex-col gap-y-[15px] ${selectedBreakdownGroup === "Ethereum Ecosystem" ? "h-[144px]" : selectedBreakdownGroup === "Builders & Apps" ? "h-[126px]" : "h-[0px]"}`}>
            <div className="heading-large-lg">{selectedBreakdownGroup === "Ethereum Ecosystem" ? "What is the Ethereum Ecosystem?" : "Ethereum is for Builders and Apps"}</div>
            <div className="text-sm">
              {selectedBreakdownGroup === "Ethereum Ecosystem" ?
              "Ethereum today is a layered ecosystem: the proof‑of‑stake mainnet secures DeFi, NFT, DAO and other dApps, while over $42 billion (peak) now resides on Layer 2 rollups such as Optimism, Arbitrum, Base, ZKsync and Starknet. Since the community adopted a “rollup‑centric roadmap,” the protocol assumes most user activity migrates to these rollups, leaving Layer 1 to specialise in settlement, consensus and minimal data availability."
              : 
              "Ethereum is for everyone. Every builder who explores different use cases, from payments, to art, to identity solutions. Explore here how much builder activity there is and which apps are already out there."
            
              }
            </div>

          </div>
        </div>
        <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />
        <MetricsCharts selectedBreakdownGroup={selectedBreakdownGroup} />
        <Container>
          <EcosystemBottom  selectedBreakdownGroup={selectedBreakdownGroup}/>
        </Container>
        
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



const EcosystemBottom = ({selectedBreakdownGroup}: {selectedBreakdownGroup: string}) => {

  if (selectedBreakdownGroup !== "Ethereum Ecosystem") return null;

  return (
    <div className='flex flex-col gap-y-[15px]'>
      <div className='flex items-center w-full justify-between'>
        <div className='flex items-center gap-x-[8px]'>
          <GTPIcon icon={"gtp-read"} size='lg'       />
          <div className='heading-large-md'>The Why and How of the Ethereum Ecosystem</div>
        </div>
        
      </div>
      <div className='text-md pl-[44px]'>Learn why Ethereum is built the way it is, how it prioritizes security, sovereignty and freedom to use applications for everyone. </div>
    </div>
  )
}
