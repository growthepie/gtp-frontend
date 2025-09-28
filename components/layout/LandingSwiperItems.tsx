"use client";
import React, { memo, useMemo, createContext, useContext, useEffect, useState } from "react";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { LandingURL } from "@/lib/urls";
import { navigationItems } from "@/lib/navigation";
import { metricItems } from "@/lib/metrics";

import "@splidejs/splide/css";
import { track } from "@vercel/analytics/react";
import { MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useLocalStorage } from "usehooks-ts";
import useAsyncStorage from "@/hooks/useAsyncStorage";
import { getQuickBiteBySlug } from "@/lib/quick-bites/quickBites";
import { QuickBiteData } from "@/lib/types/quickBites";
import { TitleButtonLink } from "./TextHeadingComponents";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";

const SwiperItem = function SwiperItem({ metric_id, landing, master, chartId }: { metric_id: string, landing: any, master: MasterResponse, chartId: number }) {
  const [focusEnabled] = useLocalStorage("focusEnabled", false);

  const urlKey =
  metricItems[metricItems.findIndex((item) => item.key === metric_id)]
    ?.urlKey;
    
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
        className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
        href={`/fundamentals/${urlKey}`}
        onClick={() => {
          track("clicked Compare link", {
            location: `landing top chart - ${metric_id}`,
            page: window.location.pathname,
          });
        }}
      >
        Breakdown{" "}
        <Icon icon="feather:chevron-right" className="w-4 h-4 md:w-6 md:h-6" />{" "}
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

const quickBiteIds = ["anniversary-report"];

const QuickBiteCard = ({ quickBite, slug }: { quickBite: QuickBiteData, slug: string }) => {
 
  return (
    <Link 
      href={`/quick-bites/${slug}`}
      className="relative w-full min-w-[100px] h-[145px] md:h-[176px] rounded-[15px] bg-color-bg-default px-[15px] py-[15px] flex flex-col justify-between border-[3px] border-color-border"  
      style={{
        background: `url(${quickBite.image}) no-repeat center center / cover`,
      }}
    >
        <div className="heading-large-md z-10">{quickBite.title}</div>
        <div className="flex justify-end">
          <TitleButtonLink label="Read our Ecosystem Report" href={`/quick-bites/${slug}`} className="w-fit" containerClassName="!border-none" leftIcon={undefined} rightIcon={"feather:arrow-right" as GTPIconName} gradientClass="bg-[#263130]" />
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


const metricIds = ["txcount", "throughput", "stables_mcap", "fees", "rent_paid", "market_cap"];

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

  const [quickBiteItems, setQuickBiteItems] = useState<{slug: string, quickBite: QuickBiteData}[]>([]);
  useEffect(() => {
    const quickBites = quickBiteIds.map(quickBiteId => ({slug: quickBiteId, quickBite: getQuickBiteBySlug(quickBiteId)}));
    setQuickBiteItems(quickBites.filter((quickBite): quickBite is {slug: string, quickBite: QuickBiteData} => quickBite.quickBite !== undefined));
  }, []);


  return (
    // <FocusProvider>
      <SplideTrack>
        {quickBiteItems.map(({slug, quickBite}) => (
          <SplideSlide key={slug}>
            <div className="group w-full">
              <QuickBiteCard quickBite={quickBite} slug={slug} />
            </div>
          </SplideSlide>
        ))}
        {filteredMetricIds.map(
          (metric_id, index) => (
            <SplideSlide key={metric_id}>
              <div
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
            </SplideSlide>
          ),
        )}
      </SplideTrack>
    // </FocusProvider>
  );
}
