import Icon from "@/components/layout/Icon";
import { track } from "@vercel/analytics";
import { useState } from "react";
import SwiperItem from "@/components/layout/SwiperItem";
import useSWR from "swr";
import { LandingURL } from "@/lib/urls";

type SlidingFooterContainerProps = {
  // children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const metrics = ["txcount", "stables_mcap", "fees", "rent_paid", "market_cap"];

export default function SliderChart({
  // children,
  isOpen,
  setIsOpen,
}: SlidingFooterContainerProps) {

  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);

  const [metricIndex, setMetricIndex] = useState(0);

  return (
    <div
      className={`relative w-full bg-[#1F2726] rounded-t-[30px] pt-[15px] pb-[30px]`}
    >

      <div className="absolute -top-[12px] left-0 right-0 flex justify-center z-50">
        <div
          className="flex items-center gap-x-[10px] text-[10px] px-[15px] py-[4px] leading-[150%] rounded-full bg-[#1F2726] shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000] cursor-pointer"
          onClick={() => {
            const currentState = isOpen;

            setIsOpen(!currentState);

            if (!currentState) {
              track("opened Chart", {
                location: `fees page - ${metrics[metricIndex]}`,
                page: window.location.pathname,
              });
            } else {
              track("closed Chart", {
                location: `fees page - ${metrics[metricIndex]}`,
                page: window.location.pathname,
              });
            }

          }}
        >
          <div className="w-[16px] h-[16px]">
            <Icon
              icon="feather:chevron-up"
              className={`w-[16px] h-[16px] ${isOpen ? "transform rotate-180" : ""
                }`}
            />
          </div>
          <div className="">
            {isOpen
              ? "Close Chart"
              : "Open Chart for “Median fees over time”"}
          </div>
        </div>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[300px] pb-[55px]' : 'max-h-[51px]'}`}>
        <div className={`w-full  flex flex-col gap-y-[10px] md:gap-y-[5px] transition-all duration-200 ${isOpen ? 'delay-0 opacity-100' : 'delay-100 opacity-0'}`}>
          <div className="w-full flex flex-col md:flex-row gap-y-[10px] md:gap-y-0 justify-between px-[15px]">
            <div className="flex gap-x-1 text-[20px] leading-[120%]">
              <div className="font-bold">Swap Token</div>
              <div>fees over time</div>
            </div>
            <div className="w-full md:w-[165px] bg-[#344240] rounded-full px-[2px] py-[2px] flex items-center gap-x-[2px] justify-between">
              <div
                className="px-[7px] py-[3px] bg-[#5A6462] dark:bg-[#1F2726] rounded-full cursor-pointer"
                onClick={() => {
                  setMetricIndex((metricIndex - 1 + metrics.length) % metrics.length);
                  track("clicked Previous Metric", {
                    location: `fees page - ${metrics[metricIndex]}`,
                    page: window.location.pathname,
                  });
                }}
              >
                <Icon icon="feather:arrow-left" className="w-[15px] h-[15px]" />
              </div>
              <div className="flex gap-x-[5px] items-center text-[#CDD8D3]">
                <Icon
                  icon="feather:clock"
                  className="w-[10px] h-[10px]"
                />
                <div className="text-[10px] font-semibold">
                  Last 24 Hours
                </div>
              </div>
              <div
                className="px-[7px] py-[3px] bg-[#5A6462] dark:bg-[#1F2726] rounded-full cursor-pointer"
                onClick={() => {
                  setMetricIndex((metricIndex + 1) % metrics.length);
                  track("clicked Next Metric", {
                    location: `fees page - ${metrics[metricIndex]}`,
                    page: window.location.pathname,
                  });
                }}
              >
                <Icon icon="feather:arrow-right" className="w-[15px] h-[15px]" />
              </div>
            </div>
          </div>
          <div className="px-[5px]">
            <div className="border border-[#5A6462] rounded-[15px] h-[146px] md:h-[179px] w-full overflow-hidden">
              {landing && <SwiperItem metric_id={metrics[metricIndex]} landing={landing} />}
            </div>
          </div>
        </div>
      </div>
    </ div>
  );
}
