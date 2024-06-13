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
import { AllChainsByKeys } from "@/lib/chains";
import { useUIContext } from "@/contexts/UIContext";
import { useLocalStorage } from "usehooks-ts";
import { tooltipFormatter, tooltipPositioner } from "@/lib/chartUtils";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export default function StableInsights({}: {}) {
  const [clicked, setClicked] = useState(true);
  const [sortOrder, setSortOrder] = useState(true);
  const [sortMetric, setSortMetric] = useState("balance");
  const [selectedTimespan, setSelectedTimespan] = useState("180d");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const handleClick = () => {
    setClicked(!clicked);
  };
  const { isMobile } = useUIContext();
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
        label: "Maximum",
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
                  background-color: ${
                    AllChainsByKeys["all_l2s"].colors["dark"][0]
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
                <div class="opacity-70 mr-0.5 ${
                  !prefix && "hidden"
                }">${prefix}</div>
                ${parseFloat(displayValue).toLocaleString("en-GB", {
                  minimumFractionDigits: valuePrefix ? 2 : 0,
                  maximumFractionDigits: valuePrefix ? 2 : 0,
                })}
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
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

              <div class="opacity-70 mr-0.5 ${
                !prefix && "hidden"
              }">${prefix}</div>
              ${parseFloat(value).toLocaleString("en-GB", {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix ? 2 : 0,
              })}
              <div class="opacity-70 ml-0.5 ${
                !suffix && "hidden"
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
    if (!data) return;

    let retValue: [number, number] = [0, 0];

    Object.keys(data.holders_table).map((key) => {
      retValue[0] = retValue[0] + data.holders_table[key].balance;
      retValue[1] = retValue[1] + data.holders_table[key].share;
    });

    return retValue;
  }, [data, showUsd]);

  return (
    <>
      {(IS_DEVELOPMENT || IS_PREVIEW) && sortedTableData && data && (
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex items-center gap-x-[8px] ">
            <Image
              src="/GTP-Package.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px] "
              height={36}
              width={36}
            />
            <Heading className="text-[30px] leading-snug " as="h1">
              Stablecoin Insights
            </Heading>
          </div>
          <div className="w-full h-[36px] bg-[#24E5DF] rounded-full flex items-center pl-2 gap-x-[10px] ">
            <div
              className="bg-white dark:bg-forest-1000 rounded-full w-[24px] h-[24px] p-1 flex items-center justify-center relative cursor-pointer "
              onClick={(e) => {
                handleClick();
              }}
            >
              <Image
                src={"/Glo_Dollar.svg"}
                className="w-[16px] h-[16px]"
                alt={"Glo Dollar Icon"}
                height={16}
                width={16}
              />
              <Icon
                icon={"gtp:circle-arrow"}
                className={`w-[4px] h-[9px] absolute top-2 right-0 `}
                style={{
                  transform: `rotate(${clicked ? "90deg" : "0deg"})`,
                  transformOrigin: "-8px 4px",
                  transition: "transform 0.5s",
                }}
              />
            </div>
            <div className="text-[#1F2726] text-[15px] sm:text-[20px] font-bold">
              Top 10 Glo Dollar Stablecoin Holders
            </div>
          </div>
          <div
            className={`overflow-clip hover:!overflow-visible flex flex-col gap-y-[10px] px-[30px] ${
              clicked ? "max-h-[1400px] lg:max-h-[739px]" : "max-h-[0px]"
            }`}
            style={{
              transition: "all 0.5s",
            }}
          >
            <div className="flex lg:flex-row lg:gap-y-0 gap-y-[10px] flex-col  w-full lg:justify-between px-[10px]">
              <div className="flex flex-col gap-y-[5px] lg:max-w-[520px] xl:max-w-[690px]">
                <div className="pt-[5px] md:text-base text-[13px] w-full ">
                  Glo Dollar is a fiat-backed stablecoin that funds public
                  goods. With Glo Dollar, you can help fund public goods and
                  charitable causes just by holding a stablecoin. It&apos;s a
                  new, donationless form of philanthropy. Check here which are
                  the top supporting Glo Dollar wallets currently.
                </div>

                <div className="pt-[5px] md:text-base text-[13px] w-full">
                  Check here which are the top supporting Glo Dollar wallets
                  currently.
                </div>
              </div>
              <div className="h-[60px] max-w-[100%] md:h-[96px] w-[176px] md:w-[249px] self-start lg:self-end rounded-2xl bg-[#344240] flex flex-col px-[15px] py-[5px] md:py-[10px]">
                <div className="flex gap-x-[10px] md:gap-x-[15px] items-center ">
                  <Image
                    src={"/Glo_Dollar.svg"}
                    alt={"Glo Dollar Icon"}
                    className="w-[24px] h-[24px]  md:w-[36px] md:h-[36px]"
                    height={36}
                    width={36}
                  />
                  <div className="md:text-[34px] text-[22px] -ml-1 flex gap-x-1 font-bold">
                    <span>Glo</span>
                    <span>Dollar</span>
                  </div>
                </div>
                <div className="md:text-[12px] text-[8px] flex  lg:items-center lg:justify-start ">
                  More about Glo Dollar on their website
                </div>
              </div>
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
            <div className="flex lg:flex-row flex-col-reverse w-full lg:gap-y-0 gap-y-[15px] gap-x-[5px]  overflow-scroll">
              <div className="flex flex-col gap-y-[15px] relative h-[493px] w-full lg:w-[57.5%] min-w-[300px] ">
                <div
                  className="w-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px]"
                  style={{
                    gridTemplateColumns: `auto ${
                      isMobile ? "100px" : "150px"
                    } 50px`,
                  }}
                >
                  <div className="text-[14px] font-bold items-center ">
                    Holder
                  </div>
                  <div className="flex justify-end items-center text-[14px] font-bold cursor-pointer">
                    <div>Amount</div>{" "}
                    <Icon
                      icon={sortOrder ? "formkit:arrowdown" : "formkit:arrowup"}
                      className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[10px] h-[10px] "
                    />
                  </div>
                  <div className="flex text-[10px] justify-center items-center bg-[#344240] rounded-full py-[2px] px-[2px] cursor-pointer">
                    <div>Share</div>
                    <Icon
                      icon={sortOrder ? "formkit:arrowdown" : "formkit:arrowup"}
                      className="dark:text-forest-50 group-hover:text-forest-50/80 text-black w-[8px] h-[8px] "
                    />
                  </div>
                </div>
                {transitions((style, item) => {
                  console.log(data.holders_table[item.key]);
                  if (item.i > 9) {
                    return;
                  }
                  return (
                    <animated.div
                      className="absolute w-full rounded-full border-[#5A6462] top-[30px] border-[1px] h-[34px] min-w-[300px]"
                      style={{ ...style }}
                    >
                      <div
                        className="w-full h-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px] "
                        style={{
                          gridTemplateColumns: `auto ${
                            isMobile ? "100px" : "150px"
                          } 50px`,
                        }}
                      >
                        <div className="xl:text-[12px] text-[11px] lg:text-[10px] h-full gap-x-[5px] flex items-center ">
                          <div className="sm:max-w-full 3xs:max-w-[100px] truncate">
                            {item.key}
                          </div>
                          {data.holders_table[item.key].website && (
                            <Link href={data.holders_table[item.key].website}>
                              <Image
                                src="/webvector.svg"
                                alt="GTP Chain"
                                className="object-contain w-[15px] h-[15px] "
                                height={15}
                                width={15}
                              />
                            </Link>
                          )}
                          {data.holders_table[item.key].twitter && (
                            <Link href={data.holders_table[item.key].twitter}>
                              <Icon
                                icon="gtp:twitter"
                                className="object-contain w-[15px] h-[15px] "
                              />
                            </Link>
                          )}
                        </div>
                        <div className="xl:text-[12px]  text-[11px]  lg:text-[10px] h-full flex items-center justify-end gap-x-0.5">
                          ${formatNumber(data.holders_table[item.key].balance)}
                        </div>

                        <div className="flex  text-[11px]  h-[18px] justify-center items-center bg-[#344240]  rounded-full my-auto ml-1  py-[2px] px-[2px]">
                          <div className="xl:text-[9px] text-[9px] lg:text-[8px] flex items-center justify-center gap-x-0.5">
                            %
                            {formatNumber(
                              data.holders_table[item.key].share * 100,
                            )}
                          </div>
                        </div>
                      </div>
                    </animated.div>
                  );
                })}
                <div className="absolute w-full rounded-full border-forest-200 border-dashed top-[420px] border-[1px] h-[34px]">
                  <div
                    className="w-full h-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px] "
                    style={{ gridTemplateColumns: `auto 100px 50px` }}
                  >
                    <div className="xl:text-[12px]  text-[11px] sm:leading-normal leading-tight  lg:text-[10px] h-full flex grow items-center ">
                      Top 10+ Holders Combined
                    </div>
                    {combinedHolders && (
                      <div className="xl:text-[12px]  text-[11px]  lg:text-[10px] h-full flex items-center justify-end gap-x-0.5">
                        ${formatNumber(combinedHolders[0])}
                      </div>
                    )}
                    {combinedHolders && (
                      <div className="flex xl:text-[12px]  text-[11px]  lg:text-[10px] h-[18px] justify-center items-center bg-[#344240] rounded-full my-auto ml-1 py-[2px] px-[2px]">
                        <div className="text-[9px] flex items-center justify-center gap-x-0.5">
                          %{formatNumber(combinedHolders[1] * 100)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute w-full rounded-full border-forest-100 top-[459px] bg-[#5A6462] border-[1px] h-[34px]">
                  <div
                    className="w-full h-full grid px-[10px] gap-x-[10px] pl-[15px] pr-[15px] "
                    style={{ gridTemplateColumns: "auto 120px 50px" }}
                  >
                    <div className="text-[12px] h-full flex grow items-center sm:leading-normal leading-tight ">
                      Total Glo Dollar Market Cap
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[42.5%] md:h-auto h-[300px] overflow-visible">
                {" "}
                <HighchartsProvider Highcharts={Highcharts}>
                  <HighchartsChart
                    containerProps={{
                      style: {
                        height: "100%",
                        width: "100%",
                        overflow: "visible",
                      },
                    }}
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
                      marginBottom={38}
                      marginLeft={0}
                      marginRight={0}
                      marginTop={0}
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
                        useHTML: true,
                        align: undefined,
                        allowOverlap: false,
                        reserveSpace: true,
                        overflow: "justify",
                        y: 30,
                        style: {
                          fontSize: "10px",
                          color: "#CDD8D3",
                        },
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

                        enabled: true,
                      }}
                      crosshair={{
                        width: 0.5,
                        color: COLORS.PLOT_LINE,
                        snap: false,
                      }}
                      tickmarkPlacement="on"
                      tickWidth={1}
                      tickLength={20}
                      ordinal={false}
                      minorTicks={true}
                      minorTickLength={2}
                      minorTickWidth={2}
                      minorGridLineWidth={0}
                      minorTickInterval={
                        timespans[selectedTimespan].xMax -
                          timespans[selectedTimespan].xMin <=
                        40 * 24 * 3600 * 1000
                          ? 24 * 3600 * 1000
                          : 30 * 24 * 3600 * 1000
                      }
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
                    >
                      <XAxis.Title>X Axis</XAxis.Title>
                    </XAxis>
                    <YAxis
                      opposite={false}
                      // showFirstLabel={true}
                      // showLastLabel={true}
                      type="linear"
                      gridLineWidth={1}
                      gridLineColor={"#5A64624F"}
                      showFirstLabel={false}
                      showLastLabel={true}
                      labels={{
                        align: "left",
                        y: 11,
                        x: 3,
                        style: {
                          fontSize: "10px",
                          color: "#CDD8D34D",
                        },
                        formatter: function () {
                          const value = this.value as number | bigint;
                          return (
                            valuePrefix +
                            Intl.NumberFormat("en-GB", {
                              notation: "compact",
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            }).format(value)
                          );
                        },
                      }}
                    >
                      <YAxis.Title>Y Axis</YAxis.Title>
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
          </div>
        </div>
      )}
    </>
  );
}
