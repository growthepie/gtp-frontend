"use client";
import { useMemo, useState, useEffect, createContext, useContext, RefObject, ReactNode } from "react";
import Error from "next/error";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import useSWR from "swr";
import MetricsTable from "@/components/layout/MetricsTable";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import {
  Get_DefaultChainSelectionKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { intersection } from "lodash";
import { Icon } from "@iconify/react";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { navigationCategories, navigationItems } from "@/lib/navigation";
import Container, { PageContainer } from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useMaster } from "@/contexts/MasterContext";
import { TopRowChild, TopRowContainer, TopRowParent } from "@/components/layout/TopRow";
import { metricItems } from "@/lib/metrics";
import { Timespans, getTimespans } from "@/lib/chartUtils";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Switch } from "@/components/Switch";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { MetricDataProvider, useMetricData } from "./MetricDataContext";
import { MetricChartControlsProvider, useMetricChartControls } from "./MetricChartControlsContext";
import { MetricSeriesProvider } from "./MetricSeriesContext";
import { useParams } from "next/navigation";
import MetricChart from "./MetricChart";
import MetricTable from "./MetricTable";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

const Fundamentals = ({ params: { metric } }) => {
  const { is_og } = useParams();
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: metricData,
    error: metricError,
    isLoading: metricLoading,
    isValidating: metricValidating,
  } = useSWR<MetricsResponse>(MetricsURLs[metric]);

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, metricLoading]}
        dataValidating={[masterValidating, metricValidating]}
      />
      {master && metricData ? (
        <FundamentalsContent metric={metric} type="fundamentals" />
      ) : (
        <div className="w-full min-h-[1024px] md:min-h-[1081px] lg:min-h-[637px] xl:min-h-[736px]" />
      )}
    </>
  );
};

type FundamentalsContentProps = {
  metric: string;
  type: "fundamentals" | "data-availability";
};

const FundamentalsContent = ({ metric, type }: FundamentalsContentProps) => {
  return (
    <>
      <MetricDataProvider metric={metric} metric_type="fundamentals">
        <MetricChartControlsProvider metric_type={type}>
          <MetricSeriesProvider metric_type={type}>
            <PageContainer paddingY="none">
              <FundamentalsTopControls metric={metric} />
            </PageContainer>
            <div className="flex flex-col-reverse lg:flex-row gap-y-[15px] px-0 lg:px-[50px]">
              <div className="w-full lg:!w-[503px]">
                <MetricTable metric_type={type} />
              </div>
              <div className="w-full h-[434px] lg:!w-[calc(100%-503px)] lg:h-[434px] px-[20px] md:px-[50px] lg:px-0">
                <MetricChart metric_type={type} />
              </div>
            </div>
            <PageContainer paddingY="none">
              <FundamentalsBottomControls metric={metric} />
            </PageContainer>
          </MetricSeriesProvider>
        </MetricChartControlsProvider>
      </MetricDataProvider >
    </>
  );
};

export default Fundamentals;



const FundamentalsTopControls = ({ metric, is_embed = false }: { metric: string; is_embed?: boolean }) => {
  const {
    selectedTimeInterval,
    setSelectedTimeInterval,
    selectedTimespan,
    setSelectedTimespan,
    avg,
    monthly_agg,
    zoomed,
    setZoomed,
    chartComponent,
    intervalShown,
  } = useMetricChartControls();

  const {
    timespans,
  } = useMetricData();

  const { theme } = useTheme()

  const navItem = useMemo(() => {
    return metricItems.find((item) => item.key === metric);
  }, [metric]);

  // if (!metricData) return null;

  return (
    <TopRowContainer className="relative">
      {is_embed ? (
        <div className="hidden md:flex justify-center items-center">
          <div className="w-5 h-5 md:w-7 md:h-7 relative ml-[21px] mr-3">
            <Icon
              icon={
                navigationCategories[navItem?.category ?? "convenience"]
                  .icon
              }
              className="w-5 h-5 md:w-7 md:h-7"
            />
          </div>
          <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden md:block my-[10px]">
            {navItem?.label}
          </h2>
        </div>
      ) : (
        <TopRowParent>
          <div
            className={`absolute transition-[transform] hidden md:block duration-300 ease-in-out -z-10 top-0 left-[190px] sm:left-[300px] lg:left-0.5 pl-[40px] w-[200px] md:pl-[85px] md:w-[220px] lg:pl-[89px] lg:w-[149px] xl:w-[180px] xl:pl-[110px] ${monthly_agg && selectedTimeInterval === "monthly"
              ? "translate-y-[calc(-70%)]"
              : "translate-y-0 "
              }`}
          >
            <div className="text-[0.65rem] md:text-xs font-medium bg-forest-100 dark:bg-forest-1000 rounded-t-2xl border-t border-l border-r border-forest-700 dark:border-forest-400 text-center w-full pb-1 z-0">
              {monthly_agg_labels[monthly_agg]}
            </div>
          </div>
          {["daily", "monthly"].map((interval) => (
            <TopRowChild
              key={interval}
              className={"capitalize"}
              isSelected={selectedTimeInterval === interval}
              onClick={() => {
                if (selectedTimeInterval === interval) return;
                if (interval === "daily") {
                  if ("12m" === selectedTimespan) {
                    setSelectedTimespan("365d");
                  } else if ("maxM" === selectedTimespan) {
                    setSelectedTimespan("max");
                  } else {
                    // find closest timespan
                    const closestTimespan = Object.keys(timespans)
                      .filter((timespan) =>
                        ["90d", "180d", "365d", "max"].includes(timespan),
                      )
                      .reduce((prev, curr) =>
                        Math.abs(
                          timespans[curr].xMax -
                          timespans[selectedTimespan].xMax,
                        ) <
                          Math.abs(
                            timespans[prev].xMax -
                            timespans[selectedTimespan].xMax,
                          )
                          ? curr
                          : prev,
                      );

                    setSelectedTimespan(closestTimespan);
                  }
                } else {
                  if ("365d" === selectedTimespan) {
                    setSelectedTimespan("12m");
                  } else if ("max" === selectedTimespan) {
                    setSelectedTimespan("maxM");
                  } else {
                    // find closest timespan
                    const closestTimespan = Object.keys(timespans)
                      .filter((timespan) =>
                        ["6m", "12m", "maxM"].includes(timespan),
                      )
                      .reduce((prev, curr) =>
                        Math.abs(
                          timespans[curr].xMax -
                          timespans[selectedTimespan].xMax,
                        ) <
                          Math.abs(
                            timespans[prev].xMax -
                            timespans[selectedTimespan].xMax,
                          )
                          ? curr
                          : prev,
                      );

                    setSelectedTimespan(closestTimespan);
                  }
                }

                setSelectedTimeInterval(interval);
                // setXAxis();
                // chartComponent?.current?.xAxis[0].update({
                //   min: timespans[selectedTimespan].xMin,
                //   max: timespans[selectedTimespan].xMax,
                //   // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                //   tickPositions: getTickPositions(
                //     timespans.max.xMin,
                //     timespans.max.xMax,
                //   ),
                // });
                setZoomed(false);
              }}
            >
              <span className="hidden md:block">{interval}</span>
              <span className="block md:hidden">{interval[0]}</span>
            </TopRowChild>
          ))}
        </TopRowParent>
      )}
      {/* dashed line */}
      <div className="flex lg:hidden justify-center py-[10px] w-[75%]">
        <div
          className="border-forest-400 h-[1px] w-full stroke-forest-400 dark:stroke-forest-700"
          style={{
            backgroundImage:
              theme == "dark"
                ? `linear-gradient(to right, #CDD8D3 25%, rgba(255,255,255,0) 0%)`
                : `linear-gradient(to right, #88A09D 25%, rgba(255,255,255,0) 0%)`,
            backgroundPosition: "top",
            backgroundSize: "4px 1px",
            backgroundRepeat: "repeat-x",
          }}
        />
      </div>
      <TopRowParent>
        {!zoomed ? (
          Object.keys(timespans)
            .filter((timespan) =>
              selectedTimeInterval === "daily"
                ? ["90d", "180d", "365d", "max"].includes(timespan)
                : ["6m", "12m", "maxM"].includes(timespan),
            )
            .map((timespan) => (
              <TopRowChild
                key={timespan}
                isSelected={selectedTimespan === timespan}
                onClick={() => {
                  setSelectedTimespan(timespan);
                  // setXAxis();
                  // chartComponent?.current?.xAxis[0].update({
                  //   min: timespans[selectedTimespan].xMin,
                  //   max: timespans[selectedTimespan].xMax,
                  //   // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                  //   tickPositions: getTickPositions(
                  //     timespans.max.xMin,
                  //     timespans.max.xMax,
                  //   ),
                  // });
                  setZoomed(false);
                }}
              >
                <span className="hidden md:block">
                  {timespans[timespan].label}
                </span>
                <span className="block md:hidden">
                  {timespans[timespan].shortLabel}
                </span>
              </TopRowChild>
            ))
        ) : (
          <>
            <button
              className={`rounded-full flex items-center space-x-3 px-[15px] py-[7px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-[11px] xl:px-6 xl:py-[15px] font-medium border-[0.5px] border-forest-400 leading-snug`}
              onClick={() => {
                chartComponent?.current?.xAxis[0].setExtremes(
                  timespans[selectedTimespan].xMin,
                  timespans[selectedTimespan].xMax,
                );
                setZoomed(false);
              }}
            >
              <Icon
                icon="feather:zoom-out"
                className="w-4 h-4 md:w-6 md:h-6"
              />
              <span className="hidden md:block">Reset Zoom</span>
              <span className="block md:hidden">Reset</span>
            </button>
            <button
              className={`rounded-full px-[16px] py-[8px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4  bg-forest-100 dark:bg-forest-1000`}
            >
              {intervalShown?.label}
            </button>
          </>
        )}
      </TopRowParent>
      <div
        className={`absolute transition-[transform] duration-300 ease-in-out -z-10 top-0 right-0 pr-[15px] w-[117px] sm:w-[162px] md:w-[175px] lg:pr-[23px] lg:w-[168px] xl:w-[198px] xl:pr-[26px] ${avg && ["365d", "max"].includes(selectedTimespan)
          ? "translate-y-[calc(-80%)]"
          : "translate-y-0 "
          }`}
      >
        <div className="text-[0.65rem] md:text-xs font-medium bg-forest-100 dark:bg-forest-1000 rounded-t-2xl border-t border-l border-r border-forest-700 dark:border-forest-400 text-center w-full pb-1 z-0 ">
          <span className="hidden md:block">7-day rolling average</span>
          <span className="block md:hidden">7-day average</span>
        </div>
      </div>
    </TopRowContainer>
  );
}

const FundamentalsBottomControls = ({ metric, is_embed = false }: { metric: string; is_embed?: boolean }) => {
  // const [showEthereumMainnet, setShowEthereumMainnet] = useLocalStorage(
  //   "showEthereumMainnet",
  //   true,
  // );

  const {
    sources,
    metric_id,
    chainKeys,
  } = useMetricData();


  const {
    selectedScale,
    setSelectedScale,
    showEthereumMainnet,
    setShowEthereumMainnet,
  } = useMetricChartControls();



  const SourcesDisplay = useMemo(() => {
    return sources && sources.length > 0 ? (
      sources
        .map<ReactNode>((s) => (
          <Link
            key={s}
            rel="noopener noreferrer"
            target="_blank"
            href={Sources[s] ?? ""}
            className="hover:text-forest-500 dark:hover:text-forest-500 underline"
          >
            {s}
          </Link>
        ))
        .reduce((prev, curr) => [prev, ", ", curr])
    ) : (
      <>Unavailable</>
    );
  }, [sources]);


  return (
    <>
      {chainKeys.includes("ethereum") ? (
        <div className="flex flex-col md:flex-row w-full justify-normal md:justify-between items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}
          <div
            className={`flex justify-between w-full md:w-auto pt-0 md:pt-0 h-[35px] md:h-auto`}
          >
            <div className="flex z-10 items-center">
              <Switch
                checked={showEthereumMainnet}
                onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
              />
              <div className="ml-2 block md:hidden lg:block">
                Show Ethereum
              </div>
              <div className="ml-2 hidden md:block lg:hidden">ETH</div>
            </div>
            <div className="block md:hidden z-10">
              <Tooltip placement="left" allowInteract>
                <TooltipTrigger>
                  <div className="p-1 z-10 mr-0 md:-mr-0.5">
                    <Icon icon="feather:info" className="w-6 h-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                  <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                    <div className="flex flex-col space-y-1">
                      <div className="font-bold text-sm leading-snug">
                        Data Sources:
                      </div>
                      <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                        {SourcesDisplay}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className={`md:hidden w-[70%] mx-auto my-[4px] pb-2 md:pb-0`}>
            <hr
              className={`border-dotted border-top-[1px] h-[0.5px] border-forest-400`}
            />
          </div>
          <div className="flex justify-normal md:justify-end items-center w-full md:w-auto">
            {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
            {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
            {/* toggle ETH */}

            <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto">
              <div className="flex justify-between md:justify-center items-center  gap-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                <button
                  className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${"absolute" === selectedScale
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:enabled:bg-forest-500/10"
                    }`}
                  onClick={() => {
                    setSelectedScale("absolute");
                  }}
                >
                  Absolute
                </button>
                {metric_id !== "txcosts" && (
                  <>
                    <button
                      disabled={metric_id === "txcosts"}
                      className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${"stacked" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:enabled:bg-forest-500/10"
                        }`}
                      onClick={() => {
                        setSelectedScale("stacked");
                      }}
                    >
                      Stacked
                    </button>

                    <button
                      className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${"percentage" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:enabled:bg-forest-500/10"
                        }`}
                      onClick={() => {
                        setSelectedScale("percentage");
                      }}
                    >
                      Percentage
                    </button>
                  </>
                )}
              </div>
              <div className="hidden md:flex">
                <Tooltip placement="left" allowInteract>
                  <TooltipTrigger>
                    <div className="p-1 z-10">
                      <Icon icon="feather:info" className="w-6 h-6" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                    <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                      <div className="flex flex-col space-y-1">
                        <div className="font-bold text-sm leading-snug">
                          Data Sources:
                        </div>
                        <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                          {SourcesDisplay}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row w-full justify-end md:justify-end items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}

          <div className="flex justify-end items-center w-full md:w-auto">
            {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
            {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
            {/* toggle ETH */}

            <div className="flex justify-center items-center pl-0 md:pl-0 w-full md:w-auto">
              <div className="flex justify-between md:justify-center items-center gap-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                <button
                  className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${"absolute" === selectedScale
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                    }`}
                  onClick={() => {
                    setSelectedScale("absolute");
                  }}
                >
                  Absolute
                </button>
                {metric_id !== "txcosts" && (
                  <>
                    <button
                      className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${"stacked" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                        }`}
                      onClick={() => {
                        setSelectedScale("stacked");
                      }}
                    >
                      Stacked
                    </button>
                    <button
                      className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${"percentage" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                        }`}
                      onClick={() => {
                        setSelectedScale("percentage");
                      }}
                    >
                      Percentage
                    </button>
                  </>
                )}
              </div>
              <div className="flex">
                <Tooltip placement="left" allowInteract>
                  <TooltipTrigger>
                    <div className="p-1 z-10 ml-[5px]">
                      <Icon icon="feather:info" className="w-6 h-6" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                    <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                      <div className="flex flex-col space-y-1">
                        <div className="font-bold text-sm leading-snug">
                          Data Sources:
                        </div>
                        <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug">
                          {SourcesDisplay}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





{/* <ComparisonChart
          data={Object.keys(metricData.data.chains)
            .filter((chain) => selectedChains.includes(chain))
            .map((chain) => {
              return {
                name: chain,
                // type: 'spline',
                types: metricData.data.chains[chain][timeIntervalKey].types,
                data: metricData.data.chains[chain][timeIntervalKey].data,
              };
            })}
          minDailyUnix={
            Object.values(metricData.data.chains).reduce(
              (acc: number, chain: ChainData) => {
                if (!chain["daily"].data[0][0]) return acc;
                return Math.min(
                  acc,
                  chain["daily"].data[0][0],
                );
              }
              , Infinity) as number
          }
          maxDailyUnix={
            Object.values(metricData.data.chains).reduce(
              (acc: number, chain: ChainData) => {
                return Math.max(
                  acc,
                  chain["daily"].data[chain["daily"].data.length - 1][0],
                );
              }
              , 0) as number
          }
          metric_id={metricData.data.metric_id}
          timeIntervals={intersection(
            Object.keys(metricData.data.chains.arbitrum),
            ["daily", "weekly", "monthly"],
          )}
          selectedTimeInterval={selectedTimeInterval}
          setSelectedTimeInterval={setSelectedTimeInterval}
          showTimeIntervals={true}
          sources={metricData.data.source}
          avg={metricData.data.avg}
          monthly_agg={metricData.data.monthly_agg}
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          selectedScale={
            params.metric === "transaction-costs" ? "absolute" : selectedScale
          }
          setSelectedScale={setSelectedScale}
        >
          <MetricsTable
            data={metricData.data.chains}
            master={master}
            selectedChains={selectedChains}
            setSelectedChains={setSelectedChains}
            chainKeys={chainKeys}
            metric_id={metricData.data.metric_id}
            showEthereumMainnet={showEthereumMainnet}
            setShowEthereumMainnet={setShowEthereumMainnet}
            timeIntervalKey={timeIntervalKey}
          />
        </ComparisonChart> */}