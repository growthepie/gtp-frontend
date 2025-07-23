"use client";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TopRowContainer,
  TopRowParent,
  TopRowChild,
} from "@/components/layout/TopRow";
import {
  Tooltip as InfoToolTip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";
import { GloHolderURL } from "@/lib/urls";
import useSWR from "swr";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import { HolderResponse, TableDataBreakdown } from "@/types/api/Holders";
import { useTransition, animated } from "@react-spring/web";
import ShowLoading from "@/components/layout/ShowLoading";
import Highcharts from "highcharts/highstock";
import Link from "next/link";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  LineSeries,
  Tooltip,
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
} from "react-jsx-highcharts";
import {
  AxisLabelsFormatterContextObject,
  GradientColorStopObject,
} from "highcharts/highstock";
import { baseOptions } from "@/lib/chartUtils";
import { useUIContext } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { tooltipFormatter, tooltipPositioner } from "@/lib/chartUtils";
import { Scrollbars } from "react-custom-scrollbars-2";
import VerticalScrollContainer from "../VerticalScrollContainer";
import "@/app/highcharts.axis.css";
import { useMaster } from "@/contexts/MasterContext";
import { Sources } from "@/lib/datasources";
import { ChartWatermarkWithMetricName } from "@/components/layout/ChartWatermark";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

type TopHolderData = {
  combined: {
    total: number;
  };
  others: {
    share: number;
    total: number;
  };
};

export default function StableInsights({ }: {}) {
  const { AllChainsByKeys } = useMaster();
  const [clicked, setClicked] = useState(true);
  const [sortOrder, setSortOrder] = useState(true);
  const [sortMetric, setSortMetric] = useState("balance");
  const [selectedTimespan, setSelectedTimespan] = useState("180d");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const handleClick = () => {
    setClicked(!clicked);
  };
  const { isMobile } = useUIContext();
  const { isSidebarOpen } = useUIContext();
  const {
    data: data,
    error: error,
    isLoading: isLoading,
    isValidating: isValidating,
  } = useSWR<HolderResponse>(GloHolderURL);

  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  const reversePerformer = true;
  const selectedScale: string = "absolute";

  const timespans = useMemo(() => {
    return {
      "30d": {
        label: "30 days",
        shortLabel: "30d",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "90d": {
        label: "90 days",
        shortLabel: "90d",
        value: 90,
        xMin: Date.now() - 90 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "180d": {
        label: "180 days",
        shortLabel: "180d",
        value: 180,
        xMin: Date.now() - 180 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      max: {
        label: "Max",
        shortLabel: "Max",
        value: 0,
      },
    };
  }, []);

  const sortedTableData = useMemo(() => {
    if (!data) return;

    const holdersTable = data.holders_table;
    const sortedEntries = Object.entries(holdersTable).sort(
      ([keyA, valueA], [keyB, valueB]) =>
        valueB[sortMetric] - valueA[sortMetric],
    );

    const sortedData = sortedEntries.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as TableDataBreakdown);

    return sortedData;
  }, [data, sortMetric]);

  const transitions = useTransition(
    sortedTableData
      ? (sortOrder
        ? Object.keys(sortedTableData)
        : Object.keys(sortedTableData).reverse()
      ).map((key, index) => ({
        y: index * 39,
        height: 34,
        key: key,
        i: index,
      }))
      : [],
    {
      key: (d) => d.key,
      from: { height: 0 },
      leave: { height: 0 },
      enter: ({ y, height }) => ({ y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      let dateString = date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // check if data steps are less than 1 day
      // if so, add the time to the tooltip
      const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      if (timeDiff < 1000 * 60 * 60 * 24) {
        dateString +=
          " " +
          date.toLocaleTimeString("en-GB", {
            hour: "numeric",
            minute: "2-digit",
          });
      }

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-36 md:w-40 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-8 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      // let pointsSum = 0;
      // if (selectedScale !== "percentage")
      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      let pointSumNonNegative = points.reduce((acc: number, point: any) => {
        if (point.y > 0) acc += point.y;
        return acc;
      }, 0);

      const maxPoint = points.reduce((max: number, point: any) => {
        if (point.y > max) max = point.y;
        return max;
      }, 0);

      const maxPercentage = points.reduce((max: number, point: any) => {
        if (point.percentage > max) max = point.percentage;
        return max;
      }, 0);

      const tooltipPoints = points
        .sort((a: any, b: any) => {
          if (reversePerformer) return a.y - b.y;

          return b.y - a.y;
        })
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${"#24E5DF"}"></div>
                <div class="tooltip-point-name">${name}</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
              percentage,
              2,
            )}%</div>
              </div>
              
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
    
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="
                  width: ${(percentage / maxPercentage) * 100}%;
                  background-color: ${AllChainsByKeys["all_l2s"].colors["dark"][0]
              };
                "></div>
              </div>`;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;
          let displayValue = y;

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${"#24E5DF"}"></div>
            <div class="tooltip-point-name text-md">${name}</div>
            <div class="flex-1 text-right font-inter flex">
                <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
            }">${prefix}</div>
                ${parseFloat(displayValue).toLocaleString("en-GB", {
              minimumFractionDigits: valuePrefix ? 2 : 0,
              maximumFractionDigits: valuePrefix ? 2 : 0,
            })}
                <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          `;
        })
        .join("");

      let prefix = valuePrefix;
      let suffix = "";
      let value = pointsSum;

      const sumRow =
        selectedScale === "stacked"
          ? `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">

              <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
          }">${prefix}</div>
              ${parseFloat(value).toLocaleString("en-GB", {
            minimumFractionDigits: valuePrefix ? 2 : 0,
            maximumFractionDigits: valuePrefix ? 2 : 0,
          })}
              <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
          }">${suffix}</div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
        </div>`
          : "";

      return tooltip + tooltipPoints + sumRow + tooltipEnd;
    },
    [valuePrefix, reversePerformer],
  );

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;

        const distance = 40;
        const pointX = point.plotX + plotLeft;
        const pointY = point.plotY + plotTop;
        let tooltipX =
          pointX - distance - tooltipWidth < plotLeft
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        const tooltipY =
          pointY - tooltipHeight / 2 < plotTop
            ? pointY + distance
            : pointY - tooltipHeight / 2;

        if (isMobile) {
          if (pointX - tooltipWidth / 2 < plotLeft) {
            return {
              x: plotLeft,
              y: 0,
            };
          }
          if (pointX + tooltipWidth / 2 > plotLeft + plotWidth) {
            return {
              x: plotLeft + plotWidth - tooltipWidth,
              y: 0,
            };
          }
          return {
            x: pointX - tooltipWidth / 2,
            y: 0,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY,
        };
      },
      [isMobile],
    );

  function formatNumber(x: number) {
    return (
      <div className="flex gap-x-0.5 ">
        <span>
          {Intl.NumberFormat("en-GB", {
            notation: "standard",
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          }).format(x)}
        </span>
      </div>
    );
  }

  const combinedHolders = useMemo(() => {
    if (!data || !sortedTableData) return;

    let retValue: TopHolderData = {
      combined: {
        total: 0,
      },
      others: {
        share: 0,
        total: data.chart.data[data.chart.data.length - 1][2],
      },
    };

    Object.keys(data.holders_table).map((key) => {
      retValue.combined.total =
        retValue.combined.total + data.holders_table[key].balance;
    });

    Object.keys(sortedTableData).map((key, i) => {
      retValue.others.total =
        retValue.others.total - data.holders_table[key].balance;
    });

    retValue.others.share =
      retValue.others.total / data.chart.data[data.chart.data.length - 1][2];

    return retValue;
  }, [data, showUsd]);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });

    // update x-axis label sizes if it is a 4 digit number
    Highcharts.wrap(
      Highcharts.Axis.prototype,
      "renderTick",
      function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const axis: Highcharts.Axis = this;
        const ticks: Highcharts.Dictionary<Highcharts.Tick> = axis.ticks;
        if (
          axis.isXAxis &&
          axis.options.labels &&
          axis.options.labels.enabled
        ) {
          Object.keys(ticks).forEach((tick) => {
            const tickLabel = ticks[tick].label;
            if (!tickLabel) return;
            const tickValue = tickLabel.element.textContent;
            if (tickValue) {
              if (tickValue.length === 4) {
                tickLabel.css({
                  transform: "scale(1.4)",
                  fontWeight: "600",
                });
              }
            }
          });
        }
      },
    );
  }, []);

  const SourcesDisplay = useMemo(() => {
    if (!data) return <></>;
    return data.source && data.source.length > 0 ? (
      data.source
        .map<React.ReactNode>((s) => (
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
  }, [data]);

  const topValue = useMemo(() => {
    if (!data) return 0;

    return Object.keys(data.holders_table).reduce((maxKey, key) =>
      data.holders_table[key].balance > data.holders_table[maxKey].balance
        ? key
        : maxKey,
    );
  }, [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      {sortedTableData && data && (
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex items-center gap-x-[8px]">
            <Image
              src="/Glo_Dollar.svg"
              alt="Glo Dollar Icon"
              className="object-contain w-[32px] h-[32px]"
              height={36}
              width={36}
            />
            <Heading className="text-[36px] leading-[120%]" as="h1">
              Glo Dollar Holders
            </Heading>
          </div>

          <div
            className={``}

          >
            <div className="flex lg:flex-row lg:gap-y-0 gap-y-[20px] flex-col w-full lg:justify-between pb-[30px]">
              <div className="flex flex-col gap-y-[20px] lg:max-w-[520px] xl:max-w-[618px]">
                <p className="text-[14px] w-full">
                  Glo Dollar is a fiat-backed stablecoin that funds public
                  goods. With Glo Dollar, you can help fund public goods and
                  charitable causes just by holding a stablecoin. It&apos;s a
                  new, donationless form of philanthropy.
                </p>

                <p className="text-[14px] w-full">
                  Explore the top wallets currently holding Glo Dollar and supporting public goods.
                  {/* Check here which are the top supporting Glo Dollar wallets
                  currently. */}
                </p>
              </div>
              <a
                className="select-none h-[52px] max-w-[100%] sm:h-[96px] w-[175px] sm:w-[249px] self-start lg:self-end rounded-2xl bg-[#2F3B3A] flex flex-col px-[15px] py-[5px] md:py-[10px]"
                href="https://www.glodollar.org/"
                target="_blank"
              >
                <div className="flex gap-x-[10px] md:gap-x-[15px] items-center ">
                  <Image
                    src={"/Glo_Dollar.svg"}
                    alt={"Glo Dollar Icon"}
                    className="sm:w-[36px] sm:h-[36px]  w-[18px] h-[18px]"
                    height={36}
                    width={36}
                  />
                  <div className="sm:text-[34px] text-[17px] -ml-1 flex gap-x-1 font-bold">
                    <span>Glo</span>
                    <span>Dollar</span>
                  </div>
                </div>
                <div className="sm:text-[12px] text-[8px] flex  lg:items-center lg:justify-start ">
                  More about Glo Dollar on their website
                </div>
              </a>
            </div>
            <TopRowContainer>
              <TopRowParent>
                <TopRowChild isSelected={true}>By Holder</TopRowChild>
              </TopRowParent>
              <div className="block lg:hidden w-[70%] mx-auto my-[10px]">
                <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
              </div>
              <TopRowParent className="">
                {Object.keys(timespans).map((timespan) => {
                  return (
                    <TopRowChild
                      isSelected={selectedTimespan === timespan}
                      onClick={() => {
                        setSelectedTimespan(timespan);
                      }}
                      key={timespan}
                    >
                      {isMobile
                        ? timespans[timespan].shortLabel
                        : timespans[timespan].label}
                    </TopRowChild>
                  );
                })}
              </TopRowParent>
            </TopRowContainer>

            <div className="flex flex-col-reverse lg:flex-row w-full gap-x-[10px] gap-y-[5px]">
              <div className="w-full lg:flex-1 lg:pt-[10px] relative">
                <GridTableHeader
                  gridDefinitionColumns="grid-cols-[auto,100px,50px]"
                  className="text-[14px] !font-bold gap-x-[15px] z-[2] !pl-[15px] !pr-[44px] !pt-[10px] !pb-[3px] select-none"
                >
                  <div className="text-[14px]">Holder</div>
                  <div className="flex justify-end text-[12px]">Amount</div>
                  <div className="flex justify-end">
                    <div className="flex justify-center text-[9px] items-center bg-[#344240] rounded-full h-[16px] w-[45px] font-bold leading-tight">Share</div>
                  </div>
                </GridTableHeader>
                <VerticalScrollContainer height={420}>
                  <div className="flex flex-col gap-y-[5px]">
                    {Object.keys(sortedTableData).map((key, i) => (
                      <GridTableRow
                        key={key + i}
                        gridDefinitionColumns="grid-cols-[minmax(0,1600px),100px,50px]"
                        databarWidth={`${(sortedTableData[key].balance / Object.values(sortedTableData)[0].balance) * 100}%`}
                        databarStyle={{
                          background: "linear-gradient(-90deg, #24E5DF99 0px, #24E5DF 300px)",
                        }}
                      >
                        <div className="flex gap-x-[10px]" onClick={(e) => {
                          if (e.detail === 2) {

                            const holder = document.getElementById(key);
                            if (!holder) return;

                            // select the text inside the element
                            const selection = window.getSelection();
                            const range = document.createRange();
                            range.selectNode(holder);
                            selection?.removeAllRanges();
                            selection?.addRange(range);
                          }
                        }}>
                          {key.substring(0, 2) === "0x" ? (
                            <div className="flex min-w-0" id={key}>
                              <div className="text-[12px] truncate min-w-0">
                                {key.substring(0, 38)}
                              </div>
                              <div className="text-[12px]">
                                {key.substring(38)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[12px] truncate min-w-0">
                              {key}
                            </div>
                          )}
                          {data.holders_table[key].website && (
                            <a
                              href={data.holders_table[key].website}
                              target="_blank"
                              className="w-[15px] h-[15px] flex items-center"
                            >
                              <WorldIcon />
                            </a>
                          )}
                          {data.holders_table[key].twitter && (
                            <a
                              href={data.holders_table[key].twitter}
                              target="_blank"
                              className="w-[15px] h-[15px] flex items-center"
                            >
                              <XIcon />
                            </a>
                          )}
                        </div>
                        <div className="flex justify-end text-[14px]">${formatNumber(data.holders_table[key].balance)}</div>
                        <div className="flex justify-end">
                          <div className="flex justify-center text-[9px] items-center bg-[#5A6462] rounded-full h-[16px] w-[45px] font-medium leading-tight">
                            {formatNumber(data.holders_table[key].share * 100)}%
                          </div>
                        </div>
                      </GridTableRow>
                    ))}

                    <GridTableRow
                      gridDefinitionColumns="grid-cols-[minmax(0,1600px),100px,50px]"
                    >
                      <div className="text-[12px] truncate min-w-0">Other Holders Combined</div>
                      {combinedHolders && (
                        <div className="flex justify-end text-[14px]">${formatNumber(combinedHolders.others.total)}</div>
                      )}
                      {combinedHolders && (
                        <div className="flex justify-end">
                          <div className="flex justify-center text-[9px] items-center bg-[#5A6462] rounded-full h-[16px] w-[45px]">
                            {formatNumber(combinedHolders.others.share * 100)}%
                          </div>
                        </div>
                      )}
                    </GridTableRow>
                    {/* gap for the last row */}

                  </div>
                </VerticalScrollContainer>
                <div className="pr-[22px] pt-[5px]">
                  <GridTableRow gridDefinitionColumns="grid-cols-[minmax(0,1600px),100px,50px]" className="bg-[#5A6462] !border-[#CDD8D3] font-medium">
                    <div className="text-[12px] truncate min-w-0">Total Glo Dollar Holders</div>
                    <div className="flex justify-end text-[14px]">${formatNumber(data.chart.data[data.chart.data.length - 1][2])}</div>
                    <div className="flex justify-end">

                    </div>
                  </GridTableRow>
                </div>
              </div>
              <div className="w-full lg:flex-1 lg:min-w-[500px] relative h-[300px] md:h-auto pt-[46px] pb-[25px]">
                <div className="absolute inset-0 left-[30px] right-[10px] top-[50px] bottom-[70px] flex flex-col space-y-[0px] items-center justify-center pointer-events-none z-0 opacity-20">
                  <ChartWatermarkWithMetricName className="w-[192.87px] text-forest-300 dark:text-[#EAECEB]" metricName={"GLO DOLLAR STABLECOIN HOLDERS"} />
                </div>
                {/* <div className="inset-0 absolute z-10 flex items-center justify-center pointer-events-none select-none">
                  <Image
                    src="/glowatermark.svg"
                    alt="GTP Chain"
                    className="w-[226px] h-[60px] "
                    height={60}
                    width={226}
                  />
                </div> */}
                <HighchartsProvider Highcharts={Highcharts}>
                  <HighchartsChart
                    containerProps={{
                      style: {
                        height: "100%",
                        width: undefined,
                        overflow: "visible",
                      },
                    }}
                    // responsive={{
                    //   rules: [
                    //     {
                    //       condition: {
                    //         maxWidth: 500,
                    //       },
                    //       chartOptions: {
                    //         legend: {
                    //           enabled: false,
                    //         },
                    //       },
                    //     },
                    //   ],
                    // }}
                    plotOptions={{
                      line: {
                        lineWidth: 2,
                      },
                      area: {
                        lineWidth: 2,
                        // marker: {
                        //   radius: 12,
                        //   lineWidth: 4,
                        // },
                        fillOpacity: 1,
                        fillColor: {
                          linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1,
                          },
                          stops: [
                            [
                              0,
                              AllChainsByKeys["all_l2s"].colors["dark"][0] +
                              "33",
                            ],
                            [
                              1,
                              AllChainsByKeys["all_l2s"].colors["dark"][1] +
                              "33",
                            ],
                          ],
                        },
                        // shadow: {
                        //   color:
                        //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
                        //   width: 10,
                        // },
                        color: {
                          linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 1,
                            y2: 0,
                          },
                          stops: [
                            [0, AllChainsByKeys["all_l2s"]?.colors["dark"][0]],
                            // [0.33, AllChainsByKeys[series.name].colors[1]],
                            [1, AllChainsByKeys["all_l2s"]?.colors["dark"][1]],
                          ],
                        },
                        // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                        // borderWidth: 1,
                      },
                      series: {
                        zIndex: 10,
                        animation: false,
                        marker: {
                          lineColor: "white",
                          radius: 0,
                          symbol: "circle",
                        },
                      },
                    }}
                  >
                    <Chart
                      title={undefined}
                      backgroundColor={"transparent"}
                      type="area"
                      panning={{
                        enabled: false,
                      }}
                      panKey="shift"
                      zooming={{
                        type: undefined,
                      }}
                      style={{
                        borderRadius: 15,
                      }}
                      animation={{
                        duration: 50,
                      }}
                      // marginBottom={38}
                      marginLeft={30}
                      // marginRight={0}
                      marginTop={4}

                      onRender={(chartData) => {
                        const chart = chartData.target as any;
                        if (chart && chart.series[0]) {
                          const yAxis = chart.series[0].yAxis;

                          Object.keys(yAxis.ticks).map((key, i) => {
                            const lastVal = Object.keys(yAxis.ticks).length - 1;
                            const gridLine = yAxis.ticks[key].gridLine.element;
                            if (i === 0) {
                              gridLine.setAttribute("stroke", "#CDD8D333");
                            }
                          });
                        }
                      }}
                    />
                    <Tooltip
                      useHTML={true}
                      shared={true}
                      split={false}
                      followPointer={true}
                      followTouchMove={true}
                      backgroundColor={"#2A3433EE"}
                      padding={0}
                      hideDelay={300}
                      stickOnContact={true}
                      shape="rect"
                      borderRadius={17}
                      borderWidth={0}
                      outside={true}
                      shadow={{
                        color: "black",
                        opacity: 0.015,
                        offsetX: 2,
                        offsetY: 2,
                      }}
                      style={{
                        color: "rgb(215, 223, 222)",
                      }}
                      formatter={tooltipFormatter}
                      // ensure tooltip is always above the chart
                      positioner={tooltipPositioner}
                      valuePrefix={"$"}
                      valueSuffix={""}
                    />
                    <XAxis
                      {...baseOptions.xAxis}
                      title={undefined}
                      type="datetime"
                      labels={{
                        align: undefined,
                        rotation: 0,
                        allowOverlap: false,
                        // staggerLines: 1,
                        reserveSpace: true,
                        overflow: "justify",
                        useHTML: true,
                        formatter: function (
                          this: AxisLabelsFormatterContextObject,
                        ) {
                          if (
                            timespans[selectedTimespan].xMax -
                            timespans[selectedTimespan].xMin <=
                            40 * 24 * 3600 * 1000
                          ) {
                            let isBeginningOfWeek =
                              new Date(this.value).getUTCDay() === 1;
                            let showMonth =
                              this.isFirst ||
                              new Date(this.value).getUTCDate() === 1;

                            return new Date(this.value).toLocaleDateString(
                              "en-GB",
                              {
                                timeZone: "UTC",
                                month: "short",
                                day: "numeric",
                                year: this.isFirst ? "numeric" : undefined,
                              },
                            );
                          } else {
                            // if Jan 1st, show year
                            if (new Date(this.value).getUTCMonth() === 0) {
                              return new Date(this.value).toLocaleDateString(
                                "en-GB",
                                {
                                  timeZone: "UTC",
                                  year: "numeric",
                                },
                              );
                            }
                            return new Date(this.value).toLocaleDateString(
                              "en-GB",
                              {
                                timeZone: "UTC",
                                month: "short",
                                year: "numeric",
                              },
                            );
                          }
                        },
                        y: 30,
                        style: {
                          fontSize: "10px",
                          color: "#CDD8D3",
                        },
                      }}
                      crosshair={{
                        width: 0.5,
                        color: COLORS.PLOT_LINE,
                        snap: true,
                      }}
                      // tickmarkPlacement="on"
                      tickWidth={1}
                      tickLength={20}
                      ordinal={false}
                      min={
                        timespans[selectedTimespan].value
                          ? data.chart.data[data.chart.data.length - 1][0] -
                          timespans[selectedTimespan].value *
                          24 *
                          60 *
                          60 *
                          1000
                          : data.chart.data[0][0]
                      }
                      max={data.chart.data[data.chart.data.length - 1][0]}
                    ></XAxis>
                    <YAxis
                      title={undefined}
                      opposite={false}
                      // showFirstLabel={true}
                      // showLastLabel={true}
                      type="linear"
                      gridLineWidth={1}
                      gridLineColor={"#CDD8D355"}
                      showFirstLabel={true}
                      showLastLabel={true}
                      tickAmount={3}
                      labels={{
                        align: "left",
                        y: 3,
                        x: -37,
                        style: {
                          fontSize: "10px",
                          color: "#CDD8D3",
                        },
                        formatter: function () {
                          const value = this.value as number | bigint;
                          return (
                            valuePrefix +
                            Intl.NumberFormat("en-GB", {
                              notation: "compact",
                              maximumFractionDigits: 1,
                              minimumFractionDigits: 0,
                            }).format(value)
                          );
                        },
                      }}
                    >
                      <AreaSeries
                        name={""}
                        showInLegend={false}
                        data={data.chart.data.map((d: any) => [
                          d[0],
                          d[showUsd ? 2 : 1],
                        ])}
                        color={"#24E5DF"}
                        fillColor={"#24E5DF33"}
                        fillOpacity={1}
                        states={{
                          hover: {
                            enabled: true,
                            halo: {
                              size: 5,
                              opacity: 1,
                              attributes: {
                                fill: "#24E5DF" + "99",
                                stroke: "#24E5DF" + "66",
                              },
                            },
                            brightness: 0.3,
                          },
                          inactive: {
                            enabled: true,
                            opacity: 0.6,
                          },
                        }}
                      ></AreaSeries>
                    </YAxis>
                  </HighchartsChart>
                </HighchartsProvider>
              </div>
            </div>
            <div className="select-none w-full bg-[#1F2726] rounded-full h-[36px] flex justify-end items-center py-[3px] px-[5px] mt-[10px]">
              <div className="mr-[15px] h-full text-[16px] w-[158px] rounded-full flex items-center justify-center bg-[#151A19]">
                Total Market Cap
              </div>
              <InfoToolTip placement="left" allowInteract>
                <TooltipTrigger>
                  <div className="p-1 z-10 mr-0 md:-mr-0.5">
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
              </InfoToolTip>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type GridTableProps = {
  gridDefinitionColumns: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  databarWidth?: number | string;
  databarStyle?: React.CSSProperties;
};

const GridTableHeader = ({ children, gridDefinitionColumns, className, style }: GridTableProps) => {
  return (
    <div className={`h-[40px] select-none gap-x-[10px] pl-[15px] pr-[33px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns} ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] 
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
const GridTableRow = ({ children, gridDefinitionColumns, style, className, databarWidth, databarStyle }: GridTableProps) => {
  return (
    <div className={`relative h-[34px] select-text gap-x-[10px] rounded-full border border-forest-900/20 dark:border-forest-500/20 pl-[15px] pr-[11px] py-[5px] text-xs items-center grid ${gridDefinitionColumns} ${className ?? ""}`} style={style}>
      {children}

      {databarWidth && (
        <div
          className="flex flex-col justify-end items-end absolute inset-[-1px] rounded-full overflow-hidden pointer-events-none"
        >
          <div
            className="h-[1px]"
            style={{
              width: databarWidth,
              ...databarStyle,
            }}
          ></div>
        </div>
      )}
    </div>
  );
}

const WorldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.52757 1.86364C4.12609 1.86364 1.36865 4.61098 1.36865 8C1.36865 11.389 4.12609 14.1364 7.52757 14.1364C10.9291 14.1364 13.6865 11.389 13.6865 8C13.6865 4.61098 10.9291 1.86364 7.52757 1.86364ZM0 8C0 3.85786 3.37021 0.5 7.52757 0.5C11.6849 0.5 15.0551 3.85786 15.0551 8C15.0551 12.1421 11.6849 15.5 7.52757 15.5C3.37021 15.5 0 12.1421 0 8Z" fill="#CDD8D3" />
    <path fillRule="evenodd" clipRule="evenodd" d="M0 8C0 7.62344 0.306383 7.31818 0.684325 7.31818H14.3708C14.7488 7.31818 15.0551 7.62344 15.0551 8C15.0551 8.37656 14.7488 8.68182 14.3708 8.68182H0.684325C0.306383 8.68182 0 8.37656 0 8Z" fill="#CDD8D3" />
    <path fillRule="evenodd" clipRule="evenodd" d="M5.47476 8C5.52166 10.0965 6.24532 12.1149 7.52757 13.7608C8.80982 12.1149 9.53349 10.0965 9.58039 8C9.53349 5.90352 8.80982 3.88512 7.52757 2.23918C6.24532 3.88512 5.52166 5.90352 5.47476 8ZM7.52757 1.18182L7.02231 0.721984C5.19874 2.71107 4.16242 5.2924 4.1061 7.9858C4.1059 7.99527 4.1059 8.00473 4.1061 8.0142C4.16242 10.7076 5.19874 13.2889 7.02231 15.278C7.15196 15.4194 7.33533 15.5 7.52757 15.5C7.71981 15.5 7.90319 15.4194 8.03284 15.278C9.85641 13.2889 10.8927 10.7076 10.949 8.0142C10.9492 8.00473 10.9492 7.99527 10.949 7.9858C10.8927 5.2924 9.85641 2.71107 8.03284 0.721984L7.52757 1.18182Z" fill="#CDD8D3" />
  </svg>
);

const XIcon = () => (
  <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.51237 6.85148L13.8026 0.5H12.549L7.95548 6.0149L4.28669 0.5H0.0551758L5.60311 8.8395L0.0551758 15.5H1.30885L6.15968 9.67608L10.0342 15.5H14.2657L8.51237 6.85148ZM6.79529 8.91297L6.23317 8.08255L1.76057 1.47476H3.68614L7.29558 6.80746L7.8577 7.63788L12.5495 14.5696H10.624L6.79529 8.91297Z" fill="#CDD8D3" />
  </svg>
);