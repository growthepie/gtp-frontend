"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { Get_SupportedChainKeys } from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { EthereumEcosystemOverviewResponse, MeetL2s } from "@/types/api/EthereumEcosystemOverviewResponse";
import LandingChart from "@/components/layout/LandingChart";
import LandingMetricsTable, { TableRankingProvider } from "@/components/layout/LandingMetricsTable";
import { Icon } from "@iconify/react";
import { EthAggURL, LandingURL, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { useLocalStorage } from "usehooks-ts";
import ChainTypeFilter from "../ChainTypeFilter";
import { GTPIcon } from "../layout/GTPIcon";
import Subheading from "../layout/Subheading";
import Heading from "../layout/Heading";
import { TopRowContainer, TopRowParent } from "../layout/TopRow";
import { useTheme } from "next-themes";
import { useUIContext } from "@/contexts/UIContext";
import ViewToggle from "../ViewToggle";
import { ProjectsMetadataProvider, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { MeetL2sCard } from "@/components/layout/MeetL2sSlider";
import dayjs from "@/lib/dayjs";
import { format as d3Format } from "d3";
import { IS_PRODUCTION } from "@/lib/helpers";
import LandingEventsChart from "./LandingEventsChart";

const formatNumber = (number: number, decimals = 2): string => {
  if (!Number.isFinite(number)) return "N/A";
  if (number === 0) return "0";

  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) return (number / 1e12).toFixed(1) + "T";
  if (absNumber >= 1e9) return (number / 1e9).toFixed(1) + "B";
  if (absNumber >= 1e6) return (number / 1e6).toFixed(1) + "M";
  if (absNumber >= 1e3) return (number / 1e3).toFixed(1) + "k";
  if (absNumber >= 100) return number.toFixed(decimals);
  return number.toFixed(decimals);
};

const formatAgeShort = (launchDate?: string) => {
  if (!launchDate) return "N/A";
  const diff = dayjs.duration(dayjs().diff(dayjs(launchDate)));
  const years = diff.years();
  const months = diff.months();
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}m`;
  return "N/A";
};

const MeetL2sMapCards = ({
  meetL2sData,
  tableVisual,
  chainKeys,
  chainAges,
}: {
  meetL2sData: MeetL2s | null | undefined;
  tableVisual: LandingPageMetricsResponse["data"]["metrics"]["table_visual"];
  chainKeys: string[];
  chainAges: Record<string, string>;
}) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const [showUsd] = useLocalStorage("showUsd", true);
  const { resolvedTheme } = useTheme();

  const projectData = useMemo(() => {
    if (!ownerProjectToProjectData || !meetL2sData) return null;
    const mapped: Record<string, any> = {};
    Object.keys(meetL2sData).forEach((key) => {
      if (meetL2sData[key]?.top_apps) {
        mapped[key] = meetL2sData[key].top_apps
          .map((app) => ownerProjectToProjectData[app])
          .filter(Boolean);
      }
    });
    return mapped;
  }, [meetL2sData, ownerProjectToProjectData]);

  return (
    <div className="grid gap-[15px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {chainKeys.map((chainKey) => {
        const tableEntry = tableVisual[chainKey] as any;
        const userShare = tableEntry?.user_share;
        const crossChain = tableEntry?.cross_chain_activity;
        const metrics = (
          <>
            <div className="flex gap-x-[10px] items-center justify-between">
              <div className="flex flex-col gap-y-[5px] w-[125px]">
                <div className="numbers-2xl">{formatNumber(tableEntry?.users)}</div>
                <div className="text-xs">Weekly Active</div>
              </div>
              <div className="flex flex-col gap-y-[5px] w-[125px]">
                <div className="numbers-2xl">
                  {userShare !== undefined && userShare !== null ? `${(userShare * 100).toFixed(2)}%` : "N/A"}
                </div>
                <div className="text-xs">User Share</div>
              </div>
            </div>
            <div className="flex gap-x-[10px] items-center justify-between">
              <div className="flex flex-col gap-y-[5px] w-[125px]">
                <div className="numbers-2xl">
                  {crossChain !== undefined && crossChain !== null ? d3Format(crossChain > 0.01 ? ".1%" : ".1%")(crossChain) : "N/A"}
                </div>
                <div className="text-xs">Cross-Chain Activity</div>
              </div>
              <div className="flex flex-col gap-y-[5px] w-[125px]">
                <div className="numbers-2xl">{chainAges[chainKey] ?? "N/A"}</div>
                <div className="text-xs">Age</div>
              </div>
            </div>
          </>
        );

        return (
          <MeetL2sCard
            key={chainKey}
            chainKey={chainKey}
            l2Data={meetL2sData?.[chainKey]}
            projectData={projectData?.[chainKey]}
            showUsd={showUsd}
            resolvedTheme={resolvedTheme}
            metrics={metrics}
          />
        );
      })}
    </div>
  );
};

export default function LandingUserBaseChart({ isLoading = false }: { isLoading?: boolean }) {
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  
  const [focusEnabled] = useLocalStorage("focusEnabled", false)
  const [selectedChainTypes, setSelectedChainTypes] = useLocalStorage<string[]>(
    "landingChainTypeFilter",
    ["l1", "rollup", "others"]
  );
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();


  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<LandingPageMetricsResponse>(LandingURL);
  // } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: ethAgg,
  } = useSWR<EthereumEcosystemOverviewResponse>(EthAggURL);


  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState("Total Ethereum Ecosystem");

  

  const [sort, setSort] = useState<{ metric: string; sortOrder: "asc" | "desc" }>({ metric: "users", sortOrder: "desc" });


  //Filters for apps grid/table
  const [showTable, setShowTable] = useState(true);

  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.engagement[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);

  const { resolvedTheme } = useTheme();

  const chainAges = useMemo(() => {
    if (!master) return {};
    return Object.keys(master.chains).reduce<Record<string, string>>((acc, chainKey) => {
      acc[chainKey] = formatAgeShort(master.chains[chainKey]?.launch_date);
      return acc;
    }, {});
  }, [master]);

  const tableChainKeys = useMemo(() => {
    if (!landing || !master) return [];

    const supportedChainKeys = Get_SupportedChainKeys(master);

    return Object.keys(landing.data.metrics.table_visual)
      .filter((chainKey) => {
        const chainData = landing.data.metrics.table_visual[chainKey] as any;
        const chain = EnabledChainsByKeys[chainKey];

        // Only enabled chains
        if (!chain) return false;
        // Only supported (deployed) chains
        if (!supportedChainKeys.includes(chainKey)) return false;
        // Exclude ethereum when focus mode is enabled
        if (focusEnabled && chainKey === "ethereum") return false;
        // Only chains with users > 0
        if (!chainData?.users || chainData.users <= 0) return false;
        // Must have a valid chainType
        if (!chain.chainType) return false;
        // Filter by selected chain types
        if (!selectedChainTypes.includes(chain.chainType)) return false;

        return true;
      })
      .sort((a, b) => {
        const aData = landing.data.metrics.table_visual[a] as any;
        const bData = landing.data.metrics.table_visual[b] as any;

        if (sort.metric === "chain_name") {
          const aVal = aData?.chain_name ?? "";
          const bVal = bData?.chain_name ?? "";
          return sort.sortOrder === "desc"
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal);
        }

        if (sort.metric === "age") {
          const aVal = master.chains[a]?.launch_date ? dayjs(master.chains[a].launch_date).valueOf() : 0;
          const bVal = master.chains[b]?.launch_date ? dayjs(master.chains[b].launch_date).valueOf() : 0;
          return sort.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
        }

        // Numeric sort for users, user_share, cross_chain_activity, etc.
        const aVal = aData?.[sort.metric] ?? 0;
        const bVal = bData?.[sort.metric] ?? 0;
        return sort.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      });

  }, [EnabledChainsByKeys, focusEnabled, landing, master, selectedChainTypes, sort]);



  console.log(data);
  console.log(landing);
  console.log(master);
  console.log(AllChainsByKeys);
  console.log(EnabledChainsByKeys);
  console.log(chainAges);
  console.log(tableChainKeys);
  console.log(sort);
  console.log(selectedChainTypes);
  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, landingLoading]}
        dataValidating={[masterValidating, landingValidating]}
        fullScreen={true}
      />

      {data && landing && master && AllChainsByKeys ? (
        <>

          <Container className="w-full">
           
          
            <LandingChart
              data={data}
              master={master}
              sources={landing.data.metrics.engagement.source}
              cross_chain_users={data.cross_chain_users}
              cross_chain_users_comparison={data.cross_chain_users_comparison}
              latest_total={focusEnabled ? data.latest_total_l2 : data.latest_total}
              latest_total_comparison={focusEnabled ? data.latest_total_comparison_l2 : data.latest_total_comparison}
              l2_dominance={data.l2_dominance}
              l2_dominance_comparison={data.l2_dominance_comparison}
              selectedMetric={selectedMetric}
              metric={selectedTimeInterval}
              setSelectedMetric={setSelectedMetric}
            />
          </Container>
          <Container className="flex flex-col flex-1 w-full mt-[30px] md:mt-[60px] mb-[15px] md:mb-[15px] gap-y-[15px] justify-center">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-x-[8px] py-[10px] md:py-0">
                <GTPIcon
                  icon="gtp-multiple-chains"
                  size="lg"
                />
                <Heading
                  id="layer-2-traction-title"
                  className="heading-large-lg"
                  as="h2"
                >
                  Chains in the Ecosystem
                </Heading>
              </div>
            </div>
            <Subheading className="text-md">
              Overview of the chains being part of the (wider) Ethereum ecosystem.
            </Subheading>
          </Container>
    
          <Container className="pt-[15px]">
            <TopRowContainer className="!justify-between flex-col rounded-[15px] gap-y-[5px] !p-[2px] lg:!pl-[10px] gap-x-[10px]">
              <TopRowParent className="!justify-center lg:!justify-normal">
                <div className="text-md hidden lg:block pl-[5px] pr-[5px] whitespace-nowrap">Choose which chains to show</div>
                <ChainTypeFilter
                  selectedTypes={selectedChainTypes}
                  onChange={setSelectedChainTypes}
                />
              </TopRowParent>
             
                <TopRowParent className="w-full flex justify-end text-md lg:min-h-[30px]">
                  <div className="flex items-center gap-x-[10px]">
                    <ViewToggle
                      showTable={showTable}
                      setShowTable={setShowTable}
                    />
                  </div>
                </TopRowParent>
      
            </TopRowContainer>
          </Container>
          <HorizontalScrollContainer reduceLeftMask={true} enableDragScroll>
            <div className="" style={{ display: showTable ? "block" : "none" }}>
              <TableRankingProvider>
                <div className="flex flex-col gap-y-[5px]">
                <LandingMetricsTable
                  data={{ chains: landing.data.metrics.table_visual }}
                  master={master}
                  // interactable={selectedMetric !== "Total Users"}
                  interactable={false}
                  sort={sort}
                  setSort={setSort}
                  selectedChainTypes={selectedChainTypes}
                  theme={resolvedTheme}
                />
                </div>
              </TableRankingProvider>
            </div>
            <div className="rounded-[15px] pr-[10px] mt-[15px] -ml-[5px]" style={{ display: showTable ? "none" : "block" }}>
              <ProjectsMetadataProvider>
                <MeetL2sMapCards
                  meetL2sData={ethAgg?.data.meet_l2s}
                  tableVisual={landing.data.metrics.table_visual}
                  chainKeys={tableChainKeys}
                  chainAges={chainAges}
                />
              </ProjectsMetadataProvider>
            </div>
          </HorizontalScrollContainer>
        </>
      ) : (
        <Container>
          <div
            className={
              isSidebarOpen
                ? `w-full h-[470.98px] md:h-[718px] xl:h-[636px] rounded-[15px]`
                : `w-full h-[470.98px] md:h-[718px] lg:h-[657px] xl:h-[636px] rounded-[15px]`
            }
          >
            <div
              role="status"
              className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-color-bg-default"
            >
              <Icon
                icon="feather:loading"
                className="w-6 h-6 text-white z-10"
              />
              <span className="sr-only">Loading...</span>
            </div>
          </div>
          <div
            className={
              isSidebarOpen
                ? `w-full h-[470.98px] md:h-[536.78px] lg:h-[626px] xl:h-[626px] 2xl:h-[606px] rounded-[15px]`
                : `w-full h-[470.98px] md:h-[536.78px] lg:h-[606px] xl:h-[606px] 2xl:h-[586px] rounded-[15px]`
            }
          >
            <div
              role="status"
              className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-color-bg-default"
            >
              <Icon
                icon="feather:loading"
                className="w-6 h-6 text-white z-10"
              />
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </Container>
      )}
    </>
  );
}
