"use client";
import React, { memo, useMemo, createContext, useContext, useEffect, useState } from "react";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { LandingURL } from "@/lib/urls";
import { navigationItems } from "@/lib/navigation";
import { metricItems } from "@/lib/metrics";

import { track } from "@/lib/tracking";
import { MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useLocalStorage } from "usehooks-ts";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { getQuickBiteBySlug } from "@/lib/quick-bites/quickBites";
import { QuickBiteData } from "@/lib/types/quickBites";
import { TitleButtonLink } from "./TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { Carousel } from "@/components/Carousel";
import { useUIContext } from "@/contexts/UIContext";

const SwiperItem = function SwiperItem({ metric_id, landing, master, chartId }: { metric_id: string, landing: any, master: MasterResponse, chartId: number }) {
  const [focusEnabled] = useLocalStorage("focusEnabled", false);

  const urlKey =
    metricItems[metricItems.findIndex((item) => item.key === metric_id)]?.urlKey;
    
  const chartComponent = useMemo(() => {
    if (!master || !landing) return null;
    
    return (
      <ChainComponent
        data={landing.data.all_l2s}
        ethData={landing.data.ethereum}
        focusEnabled={focusEnabled}
        chain={"all_l2s"}
        category={metric_id}
        selectedTimespan={"max"}
        selectedScale="linear"
        master={master}
        xMin={landing.data.all_l2s.metrics[metric_id].daily.data[0][0]}
      />
    );
  }, [landing, master, metric_id, focusEnabled]);

  const linkComponent = useMemo(() => {
    return (
      <Link
        className="flex w-fit space-x-[10px] items-center opacity-0 py-1.5 pl-[20px] text-xs transition-all duration-300 -translate-y-[40px] group-hover:translate-y-0 md:group-hover:translate-y-[2px] group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
        href={`/fundamentals/${urlKey}`}
        onClick={() => {
          track("clicked Compare link", {
            location: `landing top chart - ${metric_id}`,
            page: window.location.pathname,
          });
        }}
      >
        Breakdown{" "}
        <Icon icon="feather:chevron-right" className="w-4 h-4" />{" "}
      </Link>
    );
  }, [metric_id, urlKey]);

  return (
    <>
      {chartComponent}
      {linkComponent}
    </>
  );
};

const quickBiteIds = ["eip-8004", "octant-v2-migration"];

const QuickBiteCard = ({ quickBite, slug, forceLightText = false }: { quickBite: QuickBiteData, slug: string, forceLightText?: boolean }) => {
 
  return (
    <Link 
      href={`/quick-bites/${slug}`}
      className="relative w-full min-w-[100px] h-[145px] md:h-[176px] rounded-[15px] bg-color-bg-default px-[15px] py-[15px] flex flex-col justify-between border-[3px] border-color-bg-medium"  
      style={{
        background: `url(${quickBite.image}) no-repeat center center / cover`,
      }}
    >
        <div className={`heading-large-md z-10 ${forceLightText ? "text-[#cdd8d3]" : ""}`}>{quickBite.title}</div>
        <div className="flex justify-end">
          <div className="pl-[38px] md:pl-0 select-none">
            <div className="flex items-center justify-center p-[1px] rounded-full bg-[#263130] w-fit">
              <div className="flex items-center pl-[15px] py-[4px] gap-x-[8px] bg-forest-50 dark:bg-forest-900 rounded-full transition-all duration-300 pr-[5px]">
                <div className="transition-all duration-300 whitespace-nowrap overflow-hidden heading-small-xs">
                  Full Article
                </div>
                <div className="size-[24px] bg-color-bg-medium rounded-full flex items-center justify-center">
                  <Icon icon="feather:arrow-right" className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{
          opacity: 0.6,
          background: "linear-gradient(180deg, var(--color-bg-default, #1F2726) 15%, rgba(31, 39, 38, 0.00) 54.17%)",
        }} 
        className="absolute top-0 left-0 w-full h-full rounded-[15px] z-0 pointer-events-none"
        />

    </Link>
  )
}


const metricIds = ["stables_mcap", "rent_paid", "txcount", "throughput", "market_cap"];

export default function LandingSwiperItems() {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);

  const {data: master} = useMaster();

  const filteredMetricIds = useMemo(() => {
    return metricIds.filter((metric_id) => {
      return landing?.data?.all_l2s?.metrics[metric_id]?.daily?.data?.length > 0;
    });
  }, [landing]);

  // warn if missing metrics
  useEffect(() => {
    if (landing?.data?.all_l2s?.metrics) {
      const missingMetrics = metricIds.filter((metric_id) => !landing?.data?.all_l2s?.metrics[metric_id]);
      if (missingMetrics.length > 0) {
        console.log(`[LandingSwiperItems] Missing metrics: ${missingMetrics.join(", ")}`);  
      }
    }
  }, [landing]);

  // const [quickBiteItems, setQuickBiteItems] = useState<{slug: string, quickBite: QuickBiteData}[]>([]);
  // useEffect(() => {
  //   const quickBites = quickBiteIds.map(quickBiteId => ({slug: quickBiteId, quickBite: getQuickBiteBySlug(quickBiteId)}));
  //   setQuickBiteItems(quickBites.filter((quickBite): quickBite is {slug: string, quickBite: QuickBiteData} => quickBite.quickBite !== undefined));
  // }, []);

  const quickBiteItems = useMemo(() => {
    // return [];
    return quickBiteIds.map(quickBiteId => ({slug: quickBiteId, quickBite: getQuickBiteBySlug(quickBiteId)})).filter((quickBite): quickBite is {slug: string, quickBite: QuickBiteData} => quickBite.quickBite !== undefined);
  }, []);

  return (
    <Carousel
      ariaId="layer-2-traction-title"
      heightClass="h-[150px] md:h-[185px]"
      minSlideWidth={{ 0: 280, 1280: 350, 1650: 450 }}
      pagination="dots"
      arrows={true}
      desktopRightPadding
      bottomOffset={-28}
    >
      {quickBiteItems.map(({slug, quickBite}) => (
        <div key={slug} className="group w-full">
          <QuickBiteCard quickBite={quickBite} slug={slug} forceLightText={true} />
        </div>
      ))}
      {filteredMetricIds.map(
        (metric_id, index) => (
          <div
            key={metric_id}
            className="group w-full chain relative"
          >
            {landing && master ? (
              <SwiperItem
                metric_id={metric_id}
                landing={landing}
                master={master}
                chartId={index}
              />
            ) : (
              <div className="w-full h-[145px] md:h-[176px] rounded-[15px] bg-color-bg-default">
                <div className="flex items-center justify-center h-full w-full">
                  <div className="w-8 h-8 border-[5px] border-forest-500/30 rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
            )}
          </div>
        ),
      )}
    </Carousel>
  );
}
