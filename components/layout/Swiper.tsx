import React from "react";
import useSWR from "swr";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useUIContext } from "@/contexts/UIContext";

import "@splidejs/splide/css";

const generateSlides = (
  length = 10,
  sig = 0,
): Array<{ src: string; alt: string }> => {
  return Array.from({ length }).map((value, index) => {
    index = sig || index;

    return {
      src: `https://source.unsplash.com/random/800x450?sig=${index}`,
      alt: `Image ${index + 1}`,
    };
  });
};

export default function Swiper({ ariaId }: { ariaId?: string }) {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
    // } = useSWR<LandingPageMetricsResponse>(LandingURL);
  } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const { isSidebarOpen } = useUIContext();

  return (
    <div className="wrapper">
      <Splide
        options={{
          gap: "15px",
          autoHeight: true,
          width: "100%",
          breakpoints: {
            640: {
              perPage: 1,
            },
            900: {
              perPage: 1,
            },
            1100: {
              perPage: isSidebarOpen ? 1 : 2,
            },
            1600: {
              perPage: 2,
            },
            6000: {
              perPage: 3,
            },
          },
        }}
        aria-labelledby={ariaId}
        hasTrack={false}
      >
        <SplideTrack>
          {landing && (
            <>
              <SplideSlide>
                <div className="group w-full h-[176px] chain">
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"txcount"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 -z-10"
                    href="/fundamentals/transaction-count"
                  >
                    Compare{" "}
                    <Icon icon="feather:chevron-right" className="w-6 h-6" />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div className="group w-full h-[176px] chain">
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"stables_mcap"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 -z-10"
                    href="/fundamentals/stablecoin-market-cap"
                  >
                    Compare{" "}
                    <Icon icon="feather:chevron-right" className="w-6 h-6" />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div className="group w-full h-[176px] chain">
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"fees"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 -z-10"
                    href="/fundamentals/fees-paid-by-users"
                  >
                    Compare{" "}
                    <Icon icon="feather:chevron-right" className="w-6 h-6" />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div className="group w-full h-[176px] chain">
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"rent_paid"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 -z-10"
                    href="/fundamentals/rent-paid"
                  >
                    Compare{" "}
                    <Icon icon="feather:chevron-right" className="w-6 h-6" />{" "}
                  </Link>
                </div>
              </SplideSlide>
            </>
          )}
        </SplideTrack>

        <div className="splide__arrows">
          <button className="splide__arrow splide__arrow--prev rounded-full bg-white dark:bg-[#1F2726] -ml-8">
            <Icon icon="feather:chevron-right" className="w-6 h-6 z-50" />
          </button>
          <button className="splide__arrow splide__arrow--next rounded-full bg-white dark:bg-[#1F2726] -mr-8">
            <Icon icon="feather:chevron-right" className="w-6 h-6 z-50" />
          </button>
        </div>
        <div className="splide__progress">
          <div className="splide__progress__bar" />
        </div>
      </Splide>
    </div>
  );
}
