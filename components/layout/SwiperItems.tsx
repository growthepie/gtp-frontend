"use client";
import React, { Suspense } from "react";
import useSWR from "swr";
// import ChainComponent from "@/components/charts/ChainComponent";
// import Link from "next/link";
// import { Icon } from "@iconify/react";
// import { useMediaQuery } from "usehooks-ts";
import { SplideSlide } from "@splidejs/react-splide";
// import { useUIContext } from "@/contexts/UIContext";
import { LandingURL } from "@/lib/urls";
import Icon from "@/components/layout/Icon";

import "@splidejs/splide/css";
// import ShowLoading from "./ShowLoading";
import SwiperItem from "./SwiperItem";
import ShowLoading from "./ShowLoading";

export default function SwiperItems() {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);

  return (
    <>
      {["txcount", "stables_mcap", "fees", "rent_paid"].map((metric_id) => (
        <SplideSlide key={metric_id}>
          <div
            className="group w-full chain relative"
            // style={{
            //   pointerEvents: isDragging ? "none" : "all",
            // }}
          >
            {/* <Suspense
              fallback={
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
              }
            >
              <SwiperItem metric_id={metric_id} landing={landing} />
            </Suspense> */}
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
      ))}
    </>
  );
}
