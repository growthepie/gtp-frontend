"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
// import LandingChart from "@/components/layout/LandingChart";
import LandingMetricsTable, { TableRankingProvider } from "@/components/layout/LandingMetricsTable";
import { Icon } from "@iconify/react";
import { LandingURL, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { isMobile } from "react-device-detect";
import { useMaster } from "@/contexts/MasterContext";
import { useLocalStorage } from "usehooks-ts";
import dynamic from "next/dynamic";

const LandingChart = dynamic(() => import("@/components/layout/LandingChart"), { ssr: false });

export default function LandingUserBaseChart() {
  const [isSidebarOpen] = useState(false);
  const [focusEnabled] = useLocalStorage("focusEnabled", false)
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
              sources={landing.data.metrics.user_base.source}
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
              className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-[#1F2726]"
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
              className="flex items-center justify-center h-full w-full rounded-lg animate-pulse bg-forest-50 dark:bg-[#1F2726]"
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
