"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { useEffect, useState } from "react";
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
import { useUIContext } from "@/contexts/UIContext";
import { useParams } from "next/navigation";

const DEFAULT_TAB = "Metrics";

const TABS = {
  "metrics": "Metrics",
  "ethereum-ecosystem": "Ethereum Ecosystem",
  "builders-and-apps": "Builders & Apps",
}

export default function EthAgg() {
  const params = useParams();

  const tab = params.tab as string;

  const { setFocusSwitchEnabled } = useUIContext();

  const [selectedBreakdownGroup, setSelectedBreakdownGroup] = useState(TABS[tab as keyof typeof TABS] || DEFAULT_TAB);
  const [selectedTimespan, setSelectedTimespan] = useState("365d");
  const [isMonthly, setIsMonthly] = useState(false);
  const TopMetricsComponent = <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />

  useEffect(() => {
    // Disable scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // set focus switch enabled to false
    setFocusSwitchEnabled(false);

    return () => {
      setFocusSwitchEnabled(true);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const titles = {
    "Ethereum Ecosystem": "What is the Ethereum Ecosystem?",
    Metrics: null,

    "Builders & Apps": "Ethereum is for Builders and Apps",
  };
  const Messages = {
    "Ethereum Ecosystem": "Ethereum today is a layered ecosystem: the proof‑of‑stake mainnet secures DeFi, NFT, DAO and other dApps, while over $42 billion (peak) now resides on Layer 2 rollups such as Optimism, Arbitrum, Base, ZKsync and Starknet. Since the community adopted a “rollup‑centric roadmap,” the protocol assumes most user activity migrates to these rollups, leaving Layer 1 to specialise in settlement, consensus and minimal data availability.",
    Metrics: null,
    "Builders & Apps": "Ethereum is for everyone. Every builder who explores different use cases, from payments, to art, to identity solutions. Explore here how much builder activity there is and which apps are already out there.",
  };

  return (
    <>
      <TopSelectArea selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} />
      <div className="flex flex-col pt-[15px]">
        <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${selectedBreakdownGroup === "Metrics" ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
          <div className="overflow-hidden">
            <Container className="mb-[15px]">
              <div className="px-[30px] py-[15px] rounded-[15px] bg-[#1F2726] flex flex-col gap-y-[15px]">
                <div className="heading-large-lg select-auto">{titles[selectedBreakdownGroup]}</div>
                <div className="text-sm select-auto">
                  {Messages[selectedBreakdownGroup]}
                </div>
              </div>
            </Container>
          </div>
        </div>

        <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />
        <MetricsCharts selectedBreakdownGroup={selectedBreakdownGroup} />
        <Container className="pt-[30px]">
          <EcosystemBottom selectedBreakdownGroup={selectedBreakdownGroup} />
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



const EcosystemBottom = ({ selectedBreakdownGroup }: { selectedBreakdownGroup: string }) => {

  if (selectedBreakdownGroup !== "Ethereum Ecosystem") return null;

  return (
    <div className='flex flex-col gap-y-[15px]'>
      <div className='flex items-center w-full justify-between'>
        <div className='flex items-center gap-x-[8px]'>
          <GTPIcon icon={"gtp-read"} size='lg' />
          <div className='heading-large-lg'>The Why and How of the Ethereum Ecosystem</div>
        </div>

      </div>
      <div className='text-md pl-[44px]'>Learn why Ethereum is built the way it is, how it prioritizes security, sovereignty and freedom to use applications for everyone. </div>
    </div>
  )
}
