"use client";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import useSWR from "swr";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EconomicsURL, EthAggURL } from "@/lib/urls";
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
import { useParams, useRouter } from "next/navigation";
import { EthereumEcosystemOverviewResponse } from "@/types/api/EthereumEcosystemOverviewResponse";
import { HistoryData } from "@/components/layout/EthAgg/types";
import { useBirthdayAnimation } from "@/components/animations/useBirthdayAnimation";
import ApplicationsGrid from "@/components/layout/SingleChains/OverviewCards/ApplicationsGrid";
import { ProjectsMetadataProvider } from "../../applications/_contexts/ProjectsMetadataContext";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Link from "next/link";
// import ConfettiAnimation from "@/components/animations/ConfettiAnimation";

const DEFAULT_TAB = "Metrics";

const TABS = {
  "metrics": "Metrics",
  "ethereum-ecosystem": "Ethereum Ecosystem",
  "builders-and-apps": "Builders & Apps",
}

const useCustomState = (defaultValue: string) => {
  const [state, setState] = useState<string>(defaultValue);
  
  useEffect(() => {
    const key = Object.keys(TABS).find((key) => TABS[key] === state);
    if (key) {
      window.history.pushState({}, '', `/ethereum-ecosystem/${key}`);
    }
  }, [state]);
  return [state, setState] as [string, (value: string) => void];
}

export default function EthAgg() {
  const params = useParams();
  const tab = params.tab as string;
  const [selectedBreakdownGroup, setSelectedBreakdownGroup] = useCustomState(TABS[tab as keyof typeof TABS]);

  // for loading the ecosystem data
  const { data: ecosystemData, error, isLoading: isEcosystemLoading, isValidating: isEcosystemValidating } = useSWR<EthereumEcosystemOverviewResponse>(EthAggURL);
  const { data: historyData, isLoading: isHistoryLoading, isValidating: isHistoryValidating } = useSWR<HistoryData>("https://sse.growthepie.com/api/history")

  const { setFocusSwitchEnabled } = useUIContext();
  // const { showBirthdayAnimation } = useBirthdayAnimation();

  // // const [selectedBreakdownGroup, setSelectedBreakdownGroup] = useState(TABS[tab as keyof typeof TABS] || DEFAULT_TAB);
  // const selectedBreakdownGroup = useMemo(() => {
  //   return TABS[tab];
  // }, [tab]);


  // const [selectedTimespan, setSelectedTimespan] = useState("365d");
  // const [isMonthly, setIsMonthly] = useState(false);
  // const TopMetricsComponent = <TopEthAggMetrics selectedBreakdownGroup={selectedBreakdownGroup} />

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
      {/* Birthday Animation Overlay */}
      {/* {showBirthdayAnimation && (
        <ConfettiAnimation 
          isActive={true}
          duration={10000}
          particleCount={200}
          fullScreen={true}
          showFullAnimation={true}
        />
      )} */}

      <ShowLoading dataLoading={[isEcosystemLoading, isHistoryLoading]} dataValidating={[isEcosystemValidating, isHistoryValidating]} />
      <Container
        className="flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] pb-[15px]"
        isPageRoot
      >
        <div className="flex items-center h-[43px] gap-x-[8px] ">
          <GTPIcon icon="gtp-ethereumlogo" size="lg" />
          <Heading className="heading-large-xl leading-snug " as="h1">
            {"Ethereum Ecosystem Metrics"}
          </Heading>
        </div>

      </Container>
      <div className="flex flex-col pt-[15px]">
        <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${selectedBreakdownGroup === "Metrics" ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
          <div className="overflow-hidden">
            <Container className="mb-[15px]">
              <div className="px-[30px] py-[15px] rounded-[15px] bg-color-bg-default flex flex-col gap-y-[15px]">
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
        <EcosystemBottom selectedBreakdownGroup={selectedBreakdownGroup} />
      </div>
    </>
  );
}

// const BuildersAndApps = ({ selectedBreakdownGroup }: { selectedBreakdownGroup: string }) => {
//   const showContainer = selectedBreakdownGroup === "Builders & Apps";
//   const [isMounted, setIsMounted] = useState(false);
//   const [containerRef, { width: containerWidth }] = useElementSizeObserver<HTMLDivElement>();

//   useEffect(() => {
//     if (!showContainer) {
//       setIsMounted(false);
//       return;
//     }
//     setIsMounted(true);
//   }, [showContainer]);

//   return (
//     <Container className={`  overflow-hidden`}>
//       {isMounted && (
//       <div ref={containerRef} className="py-[15px] rounded-[15px] bg-color-bg-default flex flex-col gap-y-[15px]">
//         <ProjectsMetadataProvider>
//           <ApplicationsGrid chainKey="ethereum-ecosystem" width={containerWidth} />
//         </ProjectsMetadataProvider>
//       </div>
//       )}
//       <div className="w-full flex items-start pt-[0px] -pl-[20px] md:-pl-[50px] ">
//       {isMounted && (
//         <div>
//           <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
//             <GTPIcon
//               icon="gtp-faq"
//               size="lg"
//             />
//             <Heading
//               id="layer-2-traction-title"
//               className="heading-large-lg"
//             >
//               <div>Frequently Asked Questions</div>
//             </Heading>
//           </div>
//           <div className="flex flex-col space-y-[15px] my-0 md:my-[30px]">
//             <QuestionAnswer
//               question="What are applications in this context?"
//               answer={
//                 <>
//                   Applications are projects that are deployed onchain on
//                   Ethereum Mainnet or any Layer 2. We map smart contracts to 
//                   their respective applications to provide insights into their
//                   usage and performance.
//                 </>
//               }
//             />

//           </div>
//           </div>
//         )}
//       </div>
//     </Container>
//   )
// }



const EcosystemBottom = ({ selectedBreakdownGroup }: { selectedBreakdownGroup: string }) => {

  if (selectedBreakdownGroup !== "Ethereum Ecosystem") return null;

  return (
    <Container className="!pt-[60px]">
      <div className='flex items-center w-full justify-between'>
        <div className='flex items-center gap-x-[8px]'>
          <GTPIcon icon={"gtp-read"} size='lg' />
          <div className='heading-large-lg'>The Why and How of the Ethereum Ecosystem</div>
        </div>

      </div>
      <div className='text-md pl-[44px]'>Learn why Ethereum is built the way it is, how it prioritizes security, sovereignty and freedom to use applications for everyone. </div>
    </Container>
  )
}
