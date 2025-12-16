"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import LandingChart from "@/components/layout/LandingChart";
import LandingMetricsTable, { TableRankingProvider } from "@/components/layout/LandingMetricsTable";
import { Icon } from "@iconify/react";
import { LandingURL, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { isMobile } from "react-device-detect";
import { useMaster } from "@/contexts/MasterContext";
import { useLocalStorage } from "usehooks-ts";
import ViewToggle from "../ViewToggle";
import ChainTypeFilter from "../ChainTypeFilter";
import { GTPIcon } from "../layout/GTPIcon";
import Subheading from "../layout/Subheading";
import Heading from "../layout/Heading";
import { TopRowContainer, TopRowParent } from "../layout/TopRow";
import { IS_PRODUCTION } from "@/lib/helpers";

export default function LandingUserBaseChart({ isLoading = false }: { isLoading?: boolean }) {
  const [isSidebarOpen] = useState(false);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const [selectedChainTypes, setSelectedChainTypes] = useLocalStorage<string[]>(
    "landingChainTypeFilter",
    ["l1", "rollup", "others"]
  );
  const [showTable, setShowTable] = useLocalStorage("landingShowTable", true);
  const { AllChains, AllChainsByKeys } = useMaster();

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

  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState("Total Ethereum Ecosystem");

  const [sort, setSort] = useState<{ metric: string; sortOrder: "asc" | "desc" }>({ metric: "users", sortOrder: "desc" });


  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.engagement[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);




  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, landingLoading]}
        dataValidating={[masterValidating, landingValidating]}
        fullScreen={true}
      />

      {data && landing && master && AllChainsByKeys ? (
        <>
          <Container
            className={`w-full`}
          >
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
            <Subheading className="text-md px-[5px]">
              Overview of the chains being part of the (wider) Ethereum ecosystem.
            </Subheading>
          </Container>
          <Container className="pt-[15px]">
            <TopRowContainer className="gap-y-[10px] rounded-t-[15px] rounded-b-[24px] !p-[2px] !pl-[10px] flex-col-reverse">
              <TopRowParent className="text-md">
                <ChainTypeFilter
                  selectedTypes={selectedChainTypes}
                  onChange={setSelectedChainTypes}
                />
              </TopRowParent>
              {!IS_PRODUCTION && (
                <TopRowParent className="">
                  <ViewToggle showTable={showTable} setShowTable={setShowTable} />
                </TopRowParent>
              )}
            </TopRowContainer>
          </Container>
          <HorizontalScrollContainer reduceLeftMask={true}>
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
                />
              </div>
            </TableRankingProvider>
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
