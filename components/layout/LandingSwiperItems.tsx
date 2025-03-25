"use client";
import React from "react";
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

export default function LandingSwiperItems() {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);
  const [focusEnabled] = useLocalStorage("focusEnabled", true);

  const { data: master, error: masterError } =
    useSWR<MasterResponse>(MasterURL);

  const SwiperItem = ({ metric_id, landing }) => {
    const urlKey =
    metricItems[metricItems.findIndex((item) => item.key === metric_id)]
      ?.urlKey;

    return (
    <>
      {master && landing && (
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
      )}
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
    </>
  )
}

  return (
    <SplideTrack>
          {["txcount", "stables_mcap", "fees", "rent_paid", "market_cap"].map(
            (metric_id) => (
              <SplideSlide key={metric_id}>
                <div
                  className="group w-full chain relative"
                >
                  {landing ? (
                    <SwiperItem metric_id={metric_id} landing={landing} />
                  ) : (
                    <div className="w-full h-[145px] md:h-[183px] rounded-[15px]">
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
                  )}
                </div>
              </SplideSlide>
            ),
          )}
        </SplideTrack>
  );
}
