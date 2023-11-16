import React from "react";
import useSWR from "swr";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useUIContext } from "@/contexts/UIContext";
import { LandingURL } from "@/lib/urls";

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
  } = useSWR<any>(LandingURL);

  const { isSidebarOpen } = useUIContext();

  const [isDragging, setIsDragging] = React.useState(false);

  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className="wrapper">
      <Splide
        options={{
          gap: "15px",
          autoHeight: true,
          width: "100%",
          padding: {
            left: isMobile ? "30px" : "50px",
            right: isMobile ? "30px" : "50px",
          },
          breakpoints: {
            640: {
              perPage: 1,
            },
            900: {
              perPage: 1,
            },
            1100: {
              perPage: 2,
            },
            1250: {
              perPage: isSidebarOpen ? 2 : 3,
            },
            1450: {
              perPage: 3,
            },
            1600: {
              perPage: 3,
            },
            6000: {
              perPage: isSidebarOpen ? 3 : 4,
            },
          },
        }}
        aria-labelledby={ariaId}
        hasTrack={false}
        onDrag={(e) => {
          setIsDragging(true);
        }}
        onDragged={(e) => {
          setIsDragging(false);
        }}
      >
        <SplideTrack>
          {landing && (
            <>
              <SplideSlide>
                <div
                  className="group w-full chain relative"
                  style={{
                    pointerEvents: isDragging ? "none" : "all",
                  }}
                >
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"txcount"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
                    href="/fundamentals/transaction-count"
                  >
                    Compare{" "}
                    <Icon
                      icon="feather:chevron-right"
                      className="w-4 h-4 md:w-6 md:h-6"
                    />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div
                  className="group w-full chain"
                  style={{
                    pointerEvents: isDragging ? "none" : "all",
                  }}
                >
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"stables_mcap"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
                    href="/fundamentals/stablecoin-market-cap"
                  >
                    Compare{" "}
                    <Icon
                      icon="feather:chevron-right"
                      className="w-4 h-4 md:w-6 md:h-6"
                    />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div
                  className="group w-full chain"
                  style={{
                    pointerEvents: isDragging ? "none" : "all",
                  }}
                >
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"fees"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
                    href="/fundamentals/fees-paid-by-users"
                  >
                    Compare{" "}
                    <Icon
                      icon="feather:chevron-right"
                      className="w-4 h-4 md:w-6 md:h-6"
                    />{" "}
                  </Link>
                </div>
              </SplideSlide>
              <SplideSlide>
                <div
                  className="group w-full chain"
                  style={{
                    pointerEvents: isDragging ? "none" : "all",
                  }}
                >
                  <ChainComponent
                    data={landing.data.all_l2s}
                    chain={"all_l2s"}
                    category={"rent_paid"}
                    selectedTimespan={"max"}
                    selectedScale="linear"
                  />
                  <Link
                    className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
                    href="/fundamentals/rent-paid"
                  >
                    Compare{" "}
                    <Icon
                      icon="feather:chevron-right"
                      className="w-4 h-4 md:w-6 md:h-6"
                    />{" "}
                  </Link>
                </div>
              </SplideSlide>
            </>
          )}
        </SplideTrack>

        <div className="splide__arrows -mt-8 md:-mt-0">
          <button className="splide__arrow splide__arrow--prev rounded-full text-forest-400 bg-white dark:bg-forest-700 ml-1 md:ml-6 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
          <button className="splide__arrow splide__arrow--next rounded-full text-forest-400 bg-white dark:bg-forest-700 mr-1 md:mr-6 !w-5 md:!w-8 !h-5 md:!h-8">
            <Icon
              icon="feather:chevron-right"
              className="w-3 h-3 md:w-6 md:h-6 z-50"
            />
          </button>
        </div>
        <div className="splide__progress -mt-8">
          <div className="splide__progress__bar" />
        </div>
      </Splide>
    </div>
  );
}
