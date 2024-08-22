"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  AllChains,
  AllChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import LandingChart from "@/components/layout/LandingChart";
// import LandingMetricsTable from "@/components/layout/LandingMetricsTable";
import { Icon } from "@iconify/react";
import { LandingURL, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { isMobile } from "react-device-detect";
import LandingMetricsTable from "../layout/LandingMetricsTable";
import { MetricTable } from "../table/MetricTable";

export default function LandingUserBaseChart() {
  // const isLargeScreen = useMediaQuery("(min-width: 1280px)");

  const [isSidebarOpen] = useState(false);

  // useEffect(() => {
  //   setIsSidebarOpen(isLargeScreen);
  // }, [isLargeScreen]);

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
  const [tableVisual, setTableVisual] = useState<any>(null);

  const [selectedTimeInterval, _setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState("Total Users");

  useEffect(() => {
    if (landing) {
      const dataSpecificInterval =
        landing.data.metrics.user_base[selectedTimeInterval];
      dataSpecificInterval.chains = dataSpecificInterval.chains;
      const chainsFiltered = {
        ...dataSpecificInterval,
        chains: {
          all_l2s: dataSpecificInterval.chains.all_l2s,
          base: dataSpecificInterval.chains.base,
          ethereum: dataSpecificInterval.chains.ethereum,
          zora: dataSpecificInterval.chains.zora,
        },
      };

      const chainToSearch = Object.keys(chainsFiltered.chains);
      const FilteredSelectedChains = selectedChains.filter((chain) =>
        chainToSearch.includes(chain),
      );
      const tableVisual = {
        all_l2s: landing.data.metrics.table_visual.all_l2s,
        base: landing.data.metrics.table_visual.base,
        ethereum: landing.data.metrics.table_visual.ethereum,
        zora: landing.data.metrics.table_visual.zora,
      };
      setTableVisual(tableVisual);

      setSelectedChains(FilteredSelectedChains);
      setData(chainsFiltered);
    }
  }, [landing, selectedTimeInterval]);

  useEffect(() => {
    if (!data) return;

    setSelectedChains(
      Object.keys(data.chains)
        .filter((chainKey) => AllChainsByKeys.hasOwnProperty(chainKey))
        .map((chain) => chain),
    );
  }, [data, landing, selectedMetric, selectedTimeInterval]);

  const chains = useMemo(() => {
    if (!data || !master) return [];

    return AllChains.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key) &&
        Get_SupportedChainKeys(master) &&
        chain.key != "ethereum",
    );
  }, [data, master]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key),
  );

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, landingLoading]}
        dataValidating={[masterValidating, landingValidating]}
        fullScreen={true}
      />
      {data && landing && master ? (
        <>
          <Container
            className={`w-full ${isMobile ? "h-[620px]" : "h-[600px]"} ${
              isSidebarOpen
                ? "md:h-[718px] lg:h-[626px]"
                : "md:h-[718px] lg:h-[657px]"
            } rounded-[15px] pb-[15px] md:pb-[42px]`}
          >
            <LandingChart
              data={Object.keys(data.chains)
                .filter((chain) => selectedChains.includes(chain))
                .map((chain) => {
                  return {
                    name: chain,
                    // type: 'spline',
                    types: data.chains[chain].data.types,
                    data: data.chains[chain].data.data,
                  };
                })}
              master={master}
              sources={landing.data.metrics.user_base.source}
              cross_chain_users={data.cross_chain_users}
              cross_chain_users_comparison={data.cross_chain_users_comparison}
              latest_total={data.latest_total}
              latest_total_comparison={data.latest_total_comparison}
              l2_dominance={data.l2_dominance}
              l2_dominance_comparison={data.l2_dominance_comparison}
              selectedMetric={selectedMetric}
              metric={selectedTimeInterval}
              setSelectedMetric={setSelectedMetric}
            />
          </Container>
          <HorizontalScrollContainer>
            <MetricTable
              data={{ chains: tableVisual }}
              selectedChains={selectedChains}
              setSelectedChains={setSelectedChains}
              chains={chains}
              metric={selectedTimeInterval}
              master={master}
              // interactable={selectedMetric !== "Total Users"}
              interactable={false}
            />
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
