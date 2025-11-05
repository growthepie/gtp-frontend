"use client";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useSWRConfig } from "swr";
import { useMaster } from "@/contexts/MasterContext";
import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChainTabs from "@/components/layout/SingleChains/ChainTabs";
import ChainChart from "@/components/layout/SingleChains/ChainChart";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import { TimespanProvider } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { MetricsProvider } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { SortProvider } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationsDataProvider } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { ApplicationDetailsDataProvider } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ChartSyncProvider } from "@/app/(layout)/applications/_contexts/GTPChartSyncContext";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import useSWR from "swr";
import { PageTitleAndDescriptionAndControls } from "@/app/(layout)/applications/_components/Components";
import { ApplicationsOverviewContent } from "@/app/(layout)/applications/_components/ApplicationsOverviewContent";
import ApplicationDetailsPage from "@/app/(layout)/applications/[owner_project]/page";
import { ChainsBaseURL, FeesURLs } from "@/lib/urls";
import Heading from "@/components/layout/Heading";
import ShowLoading from "@/components/layout/ShowLoading";
import { ChainData, Chains } from "@/types/api/ChainOverviewResponse";
import { ChainsData } from "@/types/api/ChainResponse";
import ChainsOverview from "@/components/layout/SingleChains/ChainsOverview";
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

  
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainData>(`https://api.growthepie.com/v1/chains/blockspace/${chainKey}.json`);

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR(FeesURLs.table);

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

  if (usageLoading || !chainData) return (
    <div className="w-full h-[60vh] overflow-hidden">
      <ShowLoading
        dataLoading={[usageLoading, !chainData]}
        dataValidating={[usageValidating]}
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

const AppsContent = memo(({
  chainKey,
  chain,
  master,
  selectedApplication,
}: {
  chainKey: string;
  chain: string;
  master: any;
  selectedApplication?: string;
}) => {
  const chainInfo = master?.chains?.[chainKey];
  const chainName = (chainInfo?.name ?? chainKey) || "Chain";
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useMemo(() => `/chains-rework/${chain}/apps`, [chain]);

  const buildUrl = useCallback(
    (params: URLSearchParams, ownerProject?: string) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("app");
      const query = cleanParams.toString();
      const path = ownerProject ? `${basePath}/${ownerProject}` : basePath;
      return query ? `${path}?${query}` : path;
    },
    [basePath]
  );

  const handleSelectApplication = useCallback(
    (ownerProject: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const href = buildUrl(params, ownerProject);
      router.push(href, { scroll: false });
    },
    [buildUrl, router, searchParams]
  );

  const detailFallbackHref = useMemo(() => {
    return buildUrl(new URLSearchParams(searchParams.toString()));
  }, [buildUrl, searchParams]);

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
              <ApplicationsDataProvider
                disableShowLoading
                viewOptions={{
                  enforcedOriginKeys: chainKey ? [chainKey] : [],
                  allowChainSelection: false,
                  hideChainFilter: true,
                  hideChainsColumn: false,
                  titleOverride: `Applications on ${chainName}`,
                  titleSize: "md",
                  descriptionOverride: `An overview of the most used applications on ${chainName}.`,
                  onSelectApplication: handleSelectApplication,
                  detailFallbackHref,
                  selectedApplication,
                }}
              >
                <Container className="flex flex-col w-full gap-y-[15px] overflow-visible" isPageRoot>
                  <PageTitleAndDescriptionAndControls />
                </Container>
                {selectedApplication ? (
                  <ApplicationDetailsDataProvider owner_project={selectedApplication} key={selectedApplication}>
                    <ChartSyncProvider>
                      <ApplicationDetailsPage params={{ owner_project: selectedApplication }} />
                    </ChartSyncProvider>
                  </ApplicationDetailsDataProvider>
                ) : (
                  <ApplicationsOverviewContent />
                )}
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
AppsContent.displayName = 'AppsContent';
BlockspaceContent.displayName = 'BlockspaceContent';

const VALID_TABS = new Set(["overview", "fundamentals", "economics", "apps", "blockspace"]);

const Chain = ({ params }: { params: { chain: string; segments?: string[] } }) => {
  const { chain, segments } = params;
  const master = useMaster();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const tabFromSegments = segments?.[0];
  const selectedTab = useMemo(() => {
    if (!tabFromSegments) return "overview";
    return VALID_TABS.has(tabFromSegments) ? tabFromSegments : "overview";
  }, [tabFromSegments]);

  const selectedApplication = useMemo(() => {
    if (selectedTab !== "apps") return undefined;
    if (!segments || segments.length < 2) return undefined;
    return segments[1];
  }, [segments, selectedTab]);

  const { AllChains, AllChainsByKeys } = useMaster();

  const [chainKey, setChainKey] = useState<string>(() => {
    const match = AllChains.find((c) => c.urlKey === chain);
    return match?.key ?? "";
  });

  useEffect(() => {
    const match = AllChains.find((c) => c.urlKey === chain);
    if (match?.key && match.key !== chainKey) {
      setChainKey(match.key);
    }
  }, [AllChains, chain, chainKey]);

  // Redirect legacy ?tab= usage to segment-based routing
  useEffect(() => {
    const legacyTab = searchParams.get("tab");
    if (!legacyTab) return;
    if (!VALID_TABS.has(legacyTab)) return;
    if (legacyTab === selectedTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    if (legacyTab !== "apps") {
      params.delete("app");
    }

    const basePath = `/chains-rework/${chain}${legacyTab === "overview" ? "" : `/${legacyTab}`}`;
    const queryString = params.toString();
    router.replace(`${basePath}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [chain, router, searchParams, selectedTab]);

  // Redirect legacy ?app= usage to segment-based routing
  useEffect(() => {
    const legacyApp = searchParams.get("app");
    if (selectedTab !== "apps") return;
    if (!legacyApp && !selectedApplication) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("app");
    const queryString = params.toString();

    const effectiveApp = selectedApplication ?? legacyApp ?? "";
    const target = `/chains-rework/${chain}/apps${effectiveApp ? `/${effectiveApp}` : ""}${
      queryString ? `?${queryString}` : ""
    }`;

    const current = `${window.location.pathname}${window.location.search ?? ""}`;
    if (current !== target) {
      router.replace(target, { scroll: false });
    }
  }, [chain, router, searchParams, selectedApplication, selectedTab]);

  const navigateToTab = useCallback(
    (tab: string) => {
      if (tab === selectedTab) return;
      const params = new URLSearchParams(searchParams.toString());
      if (tab !== "apps") {
        params.delete("app");
      }
      const basePath = `/chains-rework/${chain}${tab === "overview" ? "" : `/${tab}`}`;
      const queryString = params.toString();
      router.push(`${basePath}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [chain, router, searchParams, selectedTab]
  );

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
        return (
          <AppsContent
            chainKey={chainKey}
            chain={chain}
            master={master}
            selectedApplication={selectedApplication}
          />
        );
      case "blockspace":
        return <BlockspaceContent chainKey={chainKey} master={master} />;
      default:
        return <div className="p-8 text-center">Tab not found</div>;
    }
  }, [chain, chainKey, master, selectedApplication, selectedTab, showUsd]);

  if (!chainKey || !master?.chains?.[chainKey]) {
    return (
      <div className="w-full h-[60vh] overflow-hidden">
        <ShowLoading dataLoading={[true]} dataValidating={[]} section={true} />
      </div>
    );
  }

  return (
    <>
      <Container
        className={`flex flex-col gap-y-[15px] pt-[45px] md:pt-[30px] select-none ${
          selectedTab === "apps" ? "overflow-visible" : ""
        }`}
      >
        <ChainTabs
          chainInfo={master.chains[chainKey]}
          selectedTab={selectedTab}
          setSelectedTab={navigateToTab}
        />
      </Container>
      <div
        className={`${selectedTab !== "overview" ? "pt-[30px]" : "pt-[15px]"} ${
          selectedTab === "apps" ? "px-0" : "px-[20px] md:px-[50px]"
        }`}
      >
        {TabContent}
      </div>
      <Container>
        <RelatedQuickBites slug={AllChainsByKeys[chainKey].label} isTopic={true} />
      </Container>
    </>
  );
};

export default Chain;
