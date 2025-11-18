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
      <TopSelectArea selectedBreakdownGroup={selectedBreakdownGroup} setSelectedBreakdownGroup={setSelectedBreakdownGroup} />
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
        <BuildersAndApps selectedBreakdownGroup={selectedBreakdownGroup} />
        <EcosystemBottom selectedBreakdownGroup={selectedBreakdownGroup} />
      </div>
    </>
  );
}

const BuildersAndApps = ({ selectedBreakdownGroup }: { selectedBreakdownGroup: string }) => {
  const showContainer = selectedBreakdownGroup === "Builders & Apps";
  const [isMounted, setIsMounted] = useState(false);
  const [containerRef, { width: containerWidth }] = useElementSizeObserver<HTMLDivElement>();

  useEffect(() => {
    if (!showContainer) {
      setIsMounted(false);
      return;
    }
    setIsMounted(true);
  }, [showContainer]);

  return (
    <Container className={` overflow-hidden`}>
      <div ref={containerRef} className="py-[15px] rounded-[15px] bg-color-bg-default flex flex-col gap-y-[15px]">
        <ProjectsMetadataProvider>
          {isMounted && containerWidth > 0 && <ApplicationsGrid chainKey="ethereum-ecosystem" width={containerWidth} />}
        </ProjectsMetadataProvider>
      </div>
      <div className="w-full flex items-start pt-[0px] -ml-[20px] md:-ml-[50px]">
      <Container>
        <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
          <GTPIcon
            icon="gtp-faq"
            size="lg"
          />
          <Heading
            id="layer-2-traction-title"
            className="heading-large-lg"
          >
            <div>Frequently Asked Questions</div>
          </Heading>
        </div>
        <div className="flex flex-col space-y-[15px] my-0 md:my-[30px]">
          <QuestionAnswer
            question="What's growthepie?"
            answer={
              <>
                growthepie is the open analytics platform for the Ethereum 
                ecosystem - empowering builders with actionable insights 
                to grow the pie. From Mainnet to Layer 2s and onchain applications, 
                explore open data on usage, growth, and adoption. 
              </>
            }
          />
          <QuestionAnswer
            question="What's up with the name 'growthepie'?"
            answer={
              <>
                We view Ethereum's different scaling solutions
                as complementary technologies for the ecosystem that enable more use
                cases, rather than competitors vying for market share. We
                believe that the space is a positive-sum game, where each unique
                flavor of layer 2 technology brings its own benefits to the
                table, and together {" "}
                <Link
                  href="https://en.wikipedia.org/wiki/Growing_the_pie"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  &quot;growing the pie&quot;
                </Link>{" "}
                for everyone. Hence the name
                &quot;growthepie&quot; - we&apos;re all in this together, and the pie
                is getting bigger in many different ways. Btw, our brand name is always
                one word and lowercase: growthepie.
              </>
            }
          />
          <QuestionAnswer
            question="What's the difference between Ethereum Mainnet and the Ethereum ecosystem?"
            answer={
              <>
                Ethereum Mainnet, also called Ethereum L1, is the Ethereum blockchain
                that launched in 2015. The Ethereum ecosystem, however, includes many
                blockchains that are built on top of Ethereum Mainnet (Layer 2s). These
                blockchains settle to Ethereum Mainnet and therefore can benefit from
                some of its security guarantees. Not all of these chains necessarily run
                the EVM (Ethereum Virtual Machine) - Layer 2s can also use other VMs 
                (i.e. CairoVM, SVM, FuelVM, etc.). The VM doesn't define the Ethereum 
                ecosystem - settling to Ethereum Mainnet defines it.
              </>
            }
          />
          <QuestionAnswer
            question='What exactly does "Active on Multiple Chains" stand for?'
            answer={
              <>
                The &quot;multiple&quot; category denotes addresses that were
                active on multiple networks (Ethereum Mainnet OR Layer 2) within a given week.
                This implies that if an address was active on different networks,
                such as Arbitrum and OP Mainnet, in the same week, it would
                be included in the &quot;multiple&quot; category. For a more detailed
                breakdown of active addresses on each individual chain, please
                refer to the{" "}
                <Link
                  href="https://www.growthepie.com/fundamentals/daily-active-addresses"
                  className="underline"
                >
                  &quot;Active addresses&quot;
                </Link>{" "}
                tab.
              </>
            }
          />
          <QuestionAnswer
            question="I attested contract labels via the Open Labels Initiative - when will they show on the Applications section?"
            answer={
              <>
                Thank you for attesting your contracts via <Link
                  href="https://www.openlabelsinitiative.org/"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  OLI
                </Link>!
                Your attestations are securely stored in the OLI Label Pool.
                We, as growthepie, consume labels from the OLI Label Pool and
                we apply our own verification step before we add them to our platform.
                Usually, this step takes 1 to 3 days and you should see your application
                being listed very soon. In case you have issues, please reach out via
                Discord.
              </>
            }
          />
          <QuestionAnswer
            question="L2Beat has way more Layer 2s listed why do you not cover all of them?"
            answer={
              <>
                The goal is to cover as many Layer 2s as possible. We will add
                more Layer 2s over time. For our type of analysis, we need
                access to the raw data of each L2. This makes adding new L2s
                time and resource-consuming. Our goal is to cover at least 80%
                of all Ethereum ecosystem usage.
              </>
            }
          />
          </div>
          </Container>
      </div>
    </Container>
  )
}



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
