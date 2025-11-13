"use client";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { useSWRConfig } from "swr";
import { useMaster } from "@/contexts/MasterContext";
import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChainInfo } from "@/types/api/MasterResponse";
import ChainTabs from "@/components/layout/SingleChains/ChainTabs";
import ChainChart from "@/components/layout/SingleChains/ChainChart";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import AppsChain from "@/components/layout/SingleChains/AppsChain";
import { TimespanProvider } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { MetricsProvider } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { SortProvider } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationsDataProvider, useApplicationsData } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import useSWR from "swr";
import { PageTitleAndDescriptionAndControls } from "@/app/(layout)/applications/_components/Components";
import Controls from "@/app/(layout)/applications/_components/Controls";
import { ChainsBaseURL, FeesURLs } from "@/lib/urls";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import ShowLoading from "@/components/layout/ShowLoading";
import { ChainData, Chains } from "@/types/api/ChainOverviewResponse";
import { ChainsData } from "@/types/api/ChainResponse";
import ChainsOverview from "@/components/layout/SingleChains/ChainsOverview";
import { Icon } from "@iconify/react";
import RelatedQuickBites from "@/components/RelatedQuickBites";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { ChainOverview } from "@/lib/chains";

// Fetcher function for API calls
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Memoized tab content components
const OverviewContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  const chainData = master.chains[chainKey];
  const { data: chainDataOverview, isLoading: chainDataOverviewLoading, isValidating: chainDataOverviewValidating } = useSWR<ChainOverview>(`https://api.growthepie.xyz/v1/chains/${chainKey}/overview.json`);

  if(!master || !chainData || !chainDataOverview) return (
  <div className="w-full h-[60vh] overflow-hidden">
    <ShowLoading dataLoading={[chainDataOverviewLoading, chainDataOverviewValidating]} dataValidating={[chainDataOverviewValidating]} section={true} />
  </div>
  );
  
  return (
    <>
          <ChainsOverview chainKey={chainKey} chainData={chainData} master={master} chainDataOverview={chainDataOverview} />
    </>
  );
});

const FundamentalsContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  const [chainError, setChainError] = useState(null);
  const [chainData, setChainData] = useState<ChainsData | null>(null);
  const [chainValidating, setChainValidating] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);

  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const { cache, mutate } = useSWRConfig();

  const fetchChainData = useCallback(async () => {
    setChainLoading(true);
    setChainValidating(true);


    try {
      // Fetch the data
      const response = await fetch(
        `${ChainsBaseURL}${chainKey}.json`.replace("/v1/", `/${apiRoot}/`),
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      // Ensure responseData has the expected structure
      const flattenedData = data.data || data;

      // Update state with fetched data
      setChainData(flattenedData);
      setChainError(null);
    } catch (error) {
      // Handle errors
      setChainData(null);
      setChainError(error);
    } finally {
      // Ensure loading and validating states are correctly reset
      setChainLoading(false);
      setChainValidating(false);
    }
  }, [apiRoot, chainKey]);

  useEffect(() => {
    fetchChainData();
  }, [chainKey, fetchChainData]);

  if (chainLoading || !chainData) return (
    <div className="w-full h-[60vh] overflow-hidden">
      <ShowLoading
        dataLoading={[chainLoading, !chainData]}
        dataValidating={[chainValidating]}
        section={true}
        
      />
    </div>
  )
 


  return (
    <div className="flex flex-col gap-y-[15px]">
      <div
        className="flex gap-x-[8px] items-center scroll-mt-8"
        id="fundamentals"
      >
        <GTPIcon icon="gtp-fundamentals" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
        <Heading
          className="text-[20px] leading-snug md:text-[30px] !z-[-1]"
          as="h2"
        >
              Fundamental Metrics
        </Heading>
        </div>

        {chainData && (
          <ChainChart
            chain={chain}
            master={master}
            chainData={chainData}
            defaultChainKey={chainKey}
          />
        )}

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

// Inner component that can access the ApplicationsDataContext
const AppsContentInner = memo(({ chainInfo, chainKey }: { chainInfo: any, chainKey: string }) => {
  const { getIsLoading } = useApplicationsData();
  
  if (getIsLoading()) {
    return (
      <div className="w-full h-[60vh] overflow-hidden">
        <ShowLoading
          dataLoading={[true]}
          dataValidating={[]}
          section={true}
        />
      </div>
    );
  }

  return <AppsChain chainInfo={chainInfo} chainKey={chainKey} defaultQuery={chainInfo?.name || ""} />;
});

const AppsContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  const chainInfo = master?.chains?.[chainKey];
  
  return (
    <div className="mt-[-5px]">
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
            <ProjectsMetadataProvider>
              <ApplicationsDataProvider disableShowLoading={true}>
                {/* <Container className="sticky top-0 z-[10] flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot> */}
                <AppsContentInner chainInfo={chainInfo} chainKey={chainKey} />
              </ApplicationsDataProvider>
            </ProjectsMetadataProvider>
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
    </div>  
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

  const [selectedTimespan, setSelectedTimespan] = useState<string>("180d");

  


  if (usageLoading || !overviewData) return (
    <div className="w-full h-[60vh] overflow-hidden">
      <ShowLoading
        dataLoading={[usageLoading, !overviewData]}
        dataValidating={[usageValidating]}
        section={true}
        
      />
    </div>
  )

  

  return (
    <>
        <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
          <div
            className="flex gap-x-[8px] items-center scroll-mt-8"
            id="blockspace"
          >

            <GTPIcon icon="gtp-package" size="lg" className="!w-[36px] !h-[36px]" containerClassName="w-[36px] h-[36px]" />
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
            We label smart contracts based on their usage type and aggregate usage per category. 
            You can toggle between share of chain
            usage or absolute numbers. The category definitions can 
            be found <a
              href="https://github.com/openlabelsinitiative/OLI/blob/main/1_label_schema/tags/valuesets/usage_category.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >here</a>.
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
            isSingleChainView={true}
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
AppsContentInner.displayName = 'AppsContentInner';
AppsContent.displayName = 'AppsContent';
BlockspaceContent.displayName = 'BlockspaceContent';

const Chain = ({ params }: { params: any }) => {
    const { chain } = params;
    const master = useMaster();
    const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    
    // Initialize selectedTab based on URL parameter, defaulting to "overview"
    const [selectedTab, setSelectedTab] = useState<string>(() => {
      const tabFromUrl = searchParams.get("tab");
      return tabFromUrl || "overview";
    });
  
    const { AllChains, AllChainsByKeys } = useMaster();
  
    const [chainKey, setChainKey] = useState<string>(
      AllChains.find((c) => c.urlKey === chain)?.key
        ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
        : "",
    );

    // Update URL when selectedTab changes
    useEffect(() => {
      const currentParams = new URLSearchParams(searchParams.toString());
      
      if (selectedTab === "overview") {
        // Remove tab parameter for overview (default)
        currentParams.delete("tab");
      } else {
        // Set tab parameter for other tabs
        currentParams.set("tab", selectedTab);
      }
      
      const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }, [selectedTab, router, searchParams]);



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
    }, [selectedTab, chainKey, chain, master, showUsd]);



    return(
        <Container className="flex flex-col gap-y-[15px] pt-[45px] md:pt-[30px] select-none">
            <ChainTabs 
              chainInfo={master.chains[chainKey]} 
              selectedTab={selectedTab} 
              setSelectedTab={setSelectedTab} 
            />
            <div className={`${selectedTab !== "overview" ? "pt-[15px]" : ""}`}>
              {TabContent}
            </div>
            <RelatedQuickBites slug={AllChainsByKeys[chainKey].label} isTopic={true} />
        </Container>
    )
}


export default Chain;