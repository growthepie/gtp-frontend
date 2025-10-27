"use client";
import React from "react";
import { Icon } from "@iconify/react";
import { Splide, SplideTrack } from "@splidejs/react-splide";
import { useUIContext } from "@/contexts/UIContext";
import "@splidejs/splide/css";
import Container from "./Container";

export type SwiperContainerProps = {
  ariaId?: string;
  // chrildren should be SplideTrack
  children: React.ReactElement<typeof SplideTrack>;
  size?: "landing" | "data-availability" | "economics" | "meet-layer-2s";
};

export default function SwiperContainer({
  ariaId, 
  children, 
  size = "landing",
  }: SwiperContainerProps) {

  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const isMobile = useUIContext((state) => state.isMobile);


  const sizeClassMap = {
    landing: "h-[145px] md:h-[183px]",
    "data-availability": "h-[232px]",
    economics: "h-[197px]",
    "meet-layer-2s": "h-[270px]",
  };

  const splideRef = React.useRef<Splide>(null);

  // useEffect(() => {
  //   if (splideRef.current) {
  //     splideRef.current.on("mounted", () => {
  //       const progress = document.querySelector(".splide__progress__bar");
  //       if (progress) {
  //         progress.style.animation = "none";
  //         progress.style.animation = "progress 5s linear infinite";
  //       }
  //     });
  //   }
  // }, []);

  let breakpoints: { [key: number]: { perPage: number } } = {
    640: {
      perPage: 1,
    },
    900: {
      perPage: isSidebarOpen ? 1 : 2,
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
      perPage: 3,
    },
  }

  if(size === "meet-layer-2s") {
    breakpoints = {
      640: {
        perPage: 1,
      },
      900: {
        perPage: 2,
      },
      1250: {
        perPage: 3,
      },
      1600: {
        perPage: 4,
      },
      6000: {
        perPage: 5,
      }
    }
  }

  return (
    <Container className="!px-0 fade-edge-div pb-[24px] -mb-[24px]">
      <div className={`relative wrapper w-full ${sizeClassMap[size]} ${size === "landing" ? "md:pr-[15px]" : ""}`}>
        <Splide
          ref={splideRef}
          options={{
            gap: "15px",
            autoHeight: true,
            width: "100%",
            padding: {
              left: isMobile ? "30px" : "50px",
              right: isMobile ? "30px" : "50px",
            },
            breakpoints: breakpoints,
          }}
          onResized={(splide) => {
            splide.on("overflow", function (isOverflow) {
              splide.options = {
                arrows    : isOverflow,
                pagination: isOverflow,
                drag      : isOverflow,
                clones    : isOverflow ? undefined : 0, // Toggle clones
              };
            });
          }}
          onMounted={(splide) => {
            setTimeout(() => {
              splide.refresh();
            }, 100);
          }}
          aria-labelledby={ariaId}
          hasTrack={false}
        >
          {children}

          <div className="splide__arrows">
            <button 
              className="splide__arrow splide__arrow--prev rounded-full text-forest-400 bg-white dark:bg-forest-700 !size-[20px] md:!size-[30px] !left-[20px] md:!left-[32px]"
              style={{
                position: "absolute",
                top: size === "landing" ? "50%" : "55%",
              }}
            >
              <Icon
                icon="feather:chevron-right"
                className="w-3 h-3 md:w-6 md:h-6 z-50"
              />
            </button>
            <button 
              className="splide__arrow splide__arrow--next rounded-full text-forest-400 bg-white dark:bg-forest-700 !size-[20px] md:!size-[30px] !right-[20px] md:!right-[32px]"
              style={{
                position: "absolute",
                top: size === "landing" ? "50%" : "55%",
              }}
            >
              <Icon
                icon="feather:chevron-right"
                className="w-3 h-3 md:w-6 md:h-6 z-50"
              />
            </button>
          <div 
          className="splide__progress"
          style={{
            marginTop: size === "landing" ? "-32px" : undefined,
          }}
          >
            <div className="splide__progress__bar" />
          </div>
          </div>
        </Splide>
      </div>
    </Container>
  );
}
