// "use client";
import React from "react";
// import useSWR from "swr";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
// import { useMediaQuery } from "usehooks-ts";
// import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
// import { useUIContext } from "@/contexts/UIContext";
import { LandingURL } from "@/lib/urls";
import { navigationItems } from "@/lib/navigation";

import "@splidejs/splide/css";
import { track } from "@vercel/analytics/react";
// import ShowLoading from "./ShowLoading";

export default function SwiperItem({
  metric_id,
  landing,
}: {
  metric_id: string;
  landing: any;
}) {
  // const {
  //   data: landing,
  //   error: landingError,
  //   isLoading: landingLoading,
  //   isValidating: landingValidating,
  // } = useSWR<any>(LandingURL);

  // const landing: any = await fetch(LandingURL, {
  //   next: { revalidate: 3600 },
  // }).then((res) => res.json());

  const urlKey = navigationItems[1].options.find(
    (item) => item.key === metric_id,
  )?.urlKey;

  return (
    <>
      <ChainComponent
        data={landing.data.all_l2s}
        chain={"all_l2s"}
        category={metric_id}
        selectedTimespan={"max"}
        selectedScale="linear"
        xMin={landing.data.all_l2s.metrics[metric_id].daily.data[0][0]}
      />
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
        Compare{" "}
        <Icon icon="feather:chevron-right" className="w-4 h-4 md:w-6 md:h-6" />{" "}
      </Link>
    </>
  );
}
