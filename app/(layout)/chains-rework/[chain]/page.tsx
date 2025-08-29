"use client";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import { useState, useMemo, memo } from "react";
import { ChainInfo } from "@/types/api/MasterResponse";
import ChainTabs from "@/components/layout/SingleChains/ChainTabs";
import ChainChart from "@/components/layout/SingleChains/ChainChart";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import AppsChain from "@/components/layout/SingleChains/AppsChain";
import { TimespanProvider } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { MetricsProvider } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { SortProvider } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationsDataProvider } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import useSWR from "swr";
import { PageTitleAndDescriptionAndControls } from "@/app/(layout)/applications/_components/Components";
import { ChainsBaseURL } from "@/lib/urls";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import ShowLoading from "@/components/layout/ShowLoading";
import { ChainData, Chains } from "@/types/api/ChainOverviewResponse";

// Fetcher function for API calls
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Memoized tab content components
const OverviewContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  const { data: chainData, error, isLoading } = useSWR(
    chainKey ? `${ChainsBaseURL}/${chainKey}` : null,
    fetcher
  );

  if (isLoading) return <div className="p-8 text-center">Loading overview...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading overview data</div>;
  if (!chainData) return <div className="p-8 text-center">No data available</div>;

  return (
    <ChainChart 
      chainData={chainData}
      master={master}
      chain={chain}
      defaultChainKey={chainKey}
    />
  );
});

const FundamentalsContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  const { data: chainData, error, isLoading } = useSWR(
    chainKey ? `${ChainsBaseURL}/${chainKey}` : null,
    fetcher
  );

  if (isLoading) return <div className="p-8 text-center">Loading fundamentals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading fundamentals data</div>;
  if (!chainData) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Fundamentals</h2>
      <ChainChart 
        chainData={chainData}
        master={master}
        chain={chain}
        defaultChainKey={chainKey}
      />
    </div>
  );
});

const EconomicsContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  if (!chainKey) return <div className="p-8 text-center">No chain data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Economics</h2>
      <div className="p-8 text-center text-gray-500">
        Economics content will be implemented here
      </div>
    </div>
  );
});

const AppsContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  if (!chainKey) return <div className="p-8 text-center">No chain data available</div>;
  const chainInfo = master?.chains?.[chainKey];
  
  return (
    <TimespanProvider timespans={{
      "1d": {
        shortLabel: "1d",
        label: "1 day",
        value: 1,
      },
      "7d": {
        shortLabel: "7d",
        label: "7 days",
        value: 7,
      },
      "30d": {
        shortLabel: "30d",
        label: "30 days",
        value: 30,
      },
      "90d": {
        shortLabel: "90d",
        label: "90 days",
        value: 90,
      },
      "365d": {
        shortLabel: "1y",
        label: "1 year",
        value: 365,
      },
      max: {
        shortLabel: "Max",
        label: "Max",
        value: 0,
      },
    } as {
      [key: string]: {
        label: string;
        shortLabel: string;
        value: number;
      };
    }}>
      <MetricsProvider>
        <SortProvider defaultOrder="desc" defaultKey="txcount">
          <ApplicationsDataProvider>
            {/* <Container className="sticky top-0 z-[10] flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot> */}
              <AppsChain chainInfo={chainInfo} chainKey={chainKey} defaultQuery={chainInfo?.name || ""} />
          </ApplicationsDataProvider>
        </SortProvider>
      </MetricsProvider>
    </TimespanProvider>
  );
});

const BlockspaceContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainData>(`https://api.growthepie.com/v1/chains/blockspace/${chainKey}.json`);

  const overviewData: Chains | null = useMemo(() => {
    if (!usageData) return null;

    return { [chainKey]: usageData };
  }, [chainKey, usageData]);

  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");

  


  if (usageLoading || !overviewData) return (
    <ShowLoading
      dataLoading={[usageLoading, !overviewData]}
      dataValidating={[usageValidating]}
      fullScreen={false}
    />
  )

  return (
    <>
        <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
          <div
            className="flex gap-x-[8px] items-center scroll-mt-8"
            id="blockspace"
          >
            <Image
              src="/GTP-Package.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px]"
              height={36}
              width={36}
            />
            <Heading
              className="text-[20px] leading-snug md:text-[30px] !z-[-1]"
              as="h2"
            >
              {master.chains[chainKey].name} Blockspace
            </Heading>
          </div>
        </div>
        <div className="flex items-center mb-[30px]">
          <div className="text-[16px]">
            An overview of {master.chains[chainKey].name} high-level
            blockspace usage. All expressed in share of chain usage. You can
            toggle between share of chain usage or absolute numbers.
          </div>
        </div>

      <div>
        <div className="-mx-[20px] md:-mx-[50px]">
          <OverviewMetrics
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={overviewData}
            master={master.data}
            forceSelectedChain={chainKey}
          />
        </div>
      </div>
    </>
  );
});

// Add display names for debugging
OverviewContent.displayName = 'OverviewContent';
FundamentalsContent.displayName = 'FundamentalsContent';
EconomicsContent.displayName = 'EconomicsContent';
AppsContent.displayName = 'AppsContent';
BlockspaceContent.displayName = 'BlockspaceContent';

const Chain = ({ params }: { params: any }) => {
    const { chain } = params;
    const master = useMaster();
    const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
    const { theme } = useTheme();
    const [selectedTab, setSelectedTab] = useState<string>("overview");
  
    const { AllChains, AllChainsByKeys } = useMaster();
  
    const [chainKey, setChainKey] = useState<string>(
      AllChains.find((c) => c.urlKey === chain)?.key
        ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
        : "",
    );

    // Memoized tab content renderer
    const TabContent = useMemo(() => {
      const props = { chainKey, chain, master };
      
      switch (selectedTab) {
        case "overview":
          return <OverviewContent {...props} />;
        case "fundamentals":
          return <FundamentalsContent {...props} />;
        case "economics":
          return <EconomicsContent chainKey={chainKey} master={master} />;
        case "apps":
          return <AppsContent chainKey={chainKey} master={master} />;
        case "blockspace":
          return <BlockspaceContent chainKey={chainKey} master={master} />;
        default:
          return <div className="p-8 text-center">Tab not found</div>;
      }
    }, [selectedTab, chainKey, chain, master]);

    return(
        <Container className="flex flex-col gap-y-[15px] pt-[45px] md:pt-[30px]">
            <ChainTabs 
              chainInfo={master.chains[chainKey]} 
              selectedTab={selectedTab} 
              setSelectedTab={setSelectedTab} 
            />
            <div className="mt-6">
              {TabContent}
            </div>
        </Container>
    )
}


export default Chain;