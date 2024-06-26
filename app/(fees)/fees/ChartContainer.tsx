"use client";
import Icon from "@/components/layout/Icon";
import { track } from "@vercel/analytics";
import { useEffect, useState, useMemo, useRef } from "react";
import SwiperItem from "@/components/layout/SwiperItem";
import useSWR from "swr";
import { LandingURL } from "@/lib/urls";
import FeesChart from "./FeesChart";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { FeesLineChart } from "@/types/api/Fees/LineChart";
import { useResizeObserver, useMediaQuery } from "usehooks-ts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { MasterResponse } from "@/types/api/MasterResponse";

type SlidingFooterContainerProps = {
  // children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedMetric: string;
  selectedTimeframe: string;
  selectedChains: string[];
  showGwei: boolean;
  showCents: boolean;
  master: MasterResponse;
};

const metricLabels = {
  txcosts_avg: "Average",
  txcosts_median: "Median",
  txcosts_native_median: "Transfer ETH",
  txcosts_swap: "Swap Token",
  tps: "Transactions Per Second",
};

export default function ChartContainer({
  // children,
  isOpen,
  setIsOpen,
  selectedMetric,
  selectedTimeframe,
  selectedChains,
  showGwei,
  showCents,
  master,
}: SlidingFooterContainerProps) {
  const { data, error, isLoading, isValidating } = useSWR<FeesLineChart>(
    "https://api.growthepie.xyz/v1/fees/linechart.json",
  );

  const [metricIndex, setMetricIndex] = useState(0);
  const [timeFrameIndex, setTimeFrameIndex] = useState(0);
  const [timeFrames, setTimeFrames] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    if (data) {
      const chains = Object.keys(data.chain_data);

      const m: string[] = Object.keys(data.chain_data[chains[0]]);
      setMetrics(m);

      const tf: string[] = Object.keys(data.chain_data[chains[0]][m[0]]);
      setTimeFrames(tf);
    }
  }, [data]);

  useEffect(() => {
    if (selectedMetric && metrics.length > 0) {
      const index = metrics.indexOf(selectedMetric);
      if (index !== -1) {
        setMetricIndex(index);
      }
    }
  }, [metrics, selectedMetric]);

  useEffect(() => {
    if (selectedTimeframe && timeFrames.length > 0) {
      const index = timeFrames.indexOf(selectedTimeframe);
      if (index !== -1) {
        setTimeFrameIndex(index);
      }
    }
  }, [timeFrames, selectedTimeframe]);

  const timeframeToText = (timeframe: string) => {
    switch (timeframe) {
      case "24hrs":
        return "Last 24 Hours";
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      case "180d":
        return "Last 180 Days";
      case "1y":
        return "Last 1 Year";
      case "all":
        return "All Time";
      default:
        return "Last 24 Hours";
    }
  };

  const chartMinMaxXAxisLabels = useMemo(() => {
    if (
      !data ||
      !metrics.length ||
      !timeFrames.length ||
      !selectedChains.length
    ) {
      return ["", ""];
    }

    const chains = Object.keys(data.chain_data).filter((chain) =>
      selectedChains.includes(chain),
    );

    // check the current metric and timeframe for all selected chains
    const selectedMetricData = chains.map((chain) => {
      return data.chain_data[chain][metrics[metricIndex]][
        timeFrames[timeFrameIndex]
      ];
    });

    // get the minimum and maximum x-axis values
    const xValues = selectedMetricData
      .map((metric) => metric.data.map((d) => d[0]))
      .flat();
    const min = Math.min(...xValues);
    const max = Math.max(...xValues);

    // get the middle value
    // const middle = min + (max - min) / 2;

    if (timeFrames[timeFrameIndex] === "24hrs") {
      return [
        new Date(min).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        new Date(max).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ];
    }

    return [
      new Date(min).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      new Date(max).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    ];
  }, [data, metricIndex, metrics, selectedChains, timeFrameIndex, timeFrames]);

  // const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartContainerRef, { width: chartContainerWidth }] =
    useElementSizeObserver<HTMLDivElement>();

  return (
    <div
      className={`relative w-full bg-[#1F2726] rounded-t-[30px] pt-[15px] ${
        isMobile ? "pb-[55px]" : "pb-[30px]"
      }`}
    >
      <div className="absolute -top-[12px] left-0 right-0 flex justify-center z-50">
        <div
          className={`flex items-center gap-x-[10px] text-[10px] pl-[15px] pr-[20px] py-[3px] leading-[150%] rounded-full bg-[#1F2726] shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000] cursor-pointer border-[1.5px] border-forest-500 dark:border-[#344240] ${
            isOpen ? "" : "hard-shine-2"
          }`}
          onClick={() => {
            const wasOpen = isOpen;

            setIsOpen(!wasOpen);

            if (!wasOpen) {
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
              className={`w-[16px] h-[16px] transition-transform duration-300 ${
                isOpen ? "-rotate-180" : "rotate-0"
              }`}
            />
          </div>
          <div
            className="transition-all duration-300 overflow-hidden whitespace-nowrap"
            style={{
              maxWidth: isOpen ? "58px" : `650px`,
            }}
          >
            {isOpen
              ? `Close Chart`
              : `Open Chart for “${master.fee_metrics[selectedMetric].name} over time”`}
          </div>
        </div>
      </div>
      {metrics.length > 0 && timeFrames.length > 0 && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-[400px] pb-[55px]" : "max-h-[51px]"
          }`}
        >
          <div
            className={`w-full  flex flex-col gap-y-[10px] md:gap-y-[5px] transition-all duration-200 ${
              isOpen ? "delay-0 opacity-100" : "delay-100 opacity-0"
            }`}
          >
            <div className="w-full flex flex-col md:flex-row gap-y-[10px] md:gap-y-0 justify-between px-[15px]">
              <div className="flex gap-x-1 text-[20px] leading-[120%]">
                <div className="font-bold">
                  {master.fee_metrics[selectedMetric].name}
                </div>
                <div>{` over time`}</div>
              </div>
              <div className="w-full md:w-[165px] bg-[#344240] rounded-full px-[2px] py-[2px] flex items-center gap-x-[2px] justify-between">
                <div
                  className="px-[7px] py-[3px] bg-[#5A6462] dark:bg-[#1F2726] rounded-full cursor-pointer"
                  onClick={() => {
                    if (timeFrameIndex === 0) {
                      setTimeFrameIndex(timeFrames.length - 1);
                    } else {
                      setTimeFrameIndex(
                        (timeFrameIndex - 1) % timeFrames.length,
                      );
                    }
                    track("clicked Previous Timeframe", {
                      location: `fees page - ${metrics[metricIndex]} - ${timeFrames[timeFrameIndex]}`,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <Icon
                    icon="feather:arrow-left"
                    className="w-[15px] h-[15px]"
                  />
                </div>
                <div className="flex gap-x-[5px] items-center text-[#CDD8D3]">
                  <Icon icon="feather:clock" className="w-[10px] h-[10px]" />
                  <div className="text-[10px] font-semibold">
                    {timeframeToText(timeFrames[timeFrameIndex])}
                  </div>
                </div>
                <div
                  className="px-[7px] py-[3px] bg-[#5A6462] dark:bg-[#1F2726] rounded-full cursor-pointer"
                  onClick={() => {
                    if (timeFrameIndex === timeFrames.length - 1) {
                      setTimeFrameIndex(0);
                    } else {
                      setTimeFrameIndex(
                        (timeFrameIndex + 1) % timeFrames.length,
                      );
                    }
                    track("clicked Next Timeframe", {
                      location: `fees page - ${metrics[metricIndex]} - ${timeFrames[timeFrameIndex]}`,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <Icon
                    icon="feather:arrow-right"
                    className="w-[15px] h-[15px]"
                  />
                </div>
              </div>
            </div>
            <div className="px-[5px]">
              <div
                className="relative border border-[#5A6462] rounded-[15px] h-[146px] md:h-[279px] w-full overflow-hidden"
                ref={chartContainerRef}
              >
                <FeesChart
                  selectedMetric={metrics[metricIndex]}
                  selectedTimeframe={timeFrames[timeFrameIndex]}
                  selectedChains={selectedChains}
                  showGwei={showGwei}
                  chartWidth={chartContainerWidth}
                  showCents={showCents}
                  master={master}
                />
                {/* </div> */}
                <div className="absolute bottom-[calc(50%-15px)] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
                  <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                </div>
              </div>
              {/* xMin and xMax chart labels */}
              <div className="relative w-full px-[15px] pb-[10px]">
                <div className="h-[15px] flex justify-between">
                  {chartMinMaxXAxisLabels.map((label, index) => (
                    <div
                      key={index}
                      className="h-[15px] w-[1px] bg-[#5A6462]"
                    ></div>
                  ))}
                </div>
                <div className="absolute inset-0 top-[14px] px-[15px] flex justify-between text-[10px]">
                  {chartMinMaxXAxisLabels.map((label, index) => (
                    <div key={index}>{label}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
