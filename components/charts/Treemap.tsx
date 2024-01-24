"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts, { extend, merge } from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsTreemap from "highcharts/modules/treemap";
import highchartsHeatmap from "highcharts/modules/heatmap";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import {
  baseOptions,
  tooltipFormatter,
  tooltipPositioner,
  decimalToPercent,
  formatNumber,
} from "@/lib/chartUtils";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  ReactNode,
} from "react";
import { useLocalStorage, useWindowSize, useIsMounted } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce, forEach } from "lodash";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";

import { navigationItems, navigationCategories } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";
import { BlockspaceURLs, LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import GTPIcons from "@/icons/gtp.json";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const categoryOrder = [
  "nft",
  "token_transfers",
  "defi",
  "social",
  "cefi",
  "utility",
  "cross_chain",
  "unlabeled",
];

const keyToColor = {
  nft: "rgba(0, 0, 0, 0)",
  token_transfers: "rgba(0, 0, 0, 0.196)",
  defi: "rgba(0, 0, 0, 0.33)",
  social: "rgba(0, 0, 0, 0.463)",
  cefi: "rgba(0, 0, 0, 0.596)",
  utility: "rgba(0, 0, 0, 0.733)",
  cross_chain: "rgba(0, 0, 0, 0.867)",
  unlabeled: "rgba(0, 0, 0, 0.99)",
};

export default function Treemap({ d }: { d?: any }) {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const { data, error, isLoading, isValidating } = useSWR<any>(
    BlockspaceURLs["chain-overview"],
  );

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const theme = useTheme();

  const [chart, setChart] = useState<any>(null);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const chartRef = useRef<any>(null);

  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [selectedValueType, setSelectedValueType] = useState<string>("txcount");

  const [selectedValueScale, setSelectedValueScale] =
    useState<string>("absolute");

  const valueKey = useMemo(() => {
    //"gas_fees_eth_absolute", "gas_fees_usd_absolute", "txcount_absolute", "gas_fees_share_eth", "gas_fees_share_usd", "txcount_share"
    if (selectedValueType === "gas_fees" && selectedValueScale === "absolute")
      return `${selectedValueType}_${
        showUsd ? "usd" : "eth"
      }_${selectedValueScale}`;

    if (selectedValueType === "gas_fees" && selectedValueScale === "share")
      return `${selectedValueType}_${selectedValueScale}_${
        showUsd ? "usd" : "eth"
      }`;

    return `${selectedValueType}_${selectedValueScale}`;
  }, [selectedValueScale, selectedValueType, showUsd]);

  const timespans = useMemo(() => {
    return {
      "7d": {
        label: "7 days",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30 days",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      // "90d": {
      //   label: "90 days",
      //   value: 90,
      // },
      "180d": {
        label: "180 days",
        value: 180,
      },
      // "365d": {
      //   label: "1 year",
      //   value: 365,
      // },
      max: {
        label: "All Time",
        value: 0,
      },
    };
  }, []);

  const seriesData = useMemo(() => {
    if (!data || !data.data) return [];

    const chains = selectedChain
      ? [selectedChain]
      : Object.keys(data.data.chains).filter((c) => c !== "all_l2s");

    console.log("chains", chains);

    const treemapChildren = chains.map((chain) => {
      const types = data.data.chains[chain].overview.types;
      const chainData = data.data.chains[chain].overview[selectedTimespan];

      const categories = categoryOrder.map((categoryKey, i) => {
        return {
          name: master?.blockspace_categories.main_categories[categoryKey],
          id: `${chain}-${categoryKey}`,
          sortIndex: i,
          parent: chain,
          value: chainData[categoryKey].data
            ? chainData[categoryKey].data[types.indexOf(valueKey)]
            : 0,
          color:
            categoryKey !== "unlabeled"
              ? undefined
              : {
                  pattern: {
                    color: AllChainsByKeys[chain].colors["dark"][0] + "55",
                    path: {
                      d: "M 10 0 L 0 10 M 9 11 L 11 9 M -1 1 L 1 -1",
                      strokeWidth: 3,
                    },
                    width: 10,
                    height: 10,
                    opacity: 0.99,
                  },
                },

          // opacity: 0.11,
          borderColor: AllChainsByKeys[chain].colors["dark"][0],
          dataLabels: {
            align: "left",
            verticalAlign: "bottom",
            orientation: "vertical",
            style: {
              // color: AllChainsByKeys[chain].colors.dark[0],

              color: "#1F2726",
              // blend: "difference",
              // AllChainsByKeys[chain].darkTextOnBackground === true
              //   ? "#000"
              //   : "#fff",
            },
          },
        };
      });

      const chainTotal = categories.reduce((acc, curr) => acc + curr.value, 0);

      const iconKey = `${chain.replace("_", "-")}-logo-monochrome`;
      console.log(chain, iconKey);

      const parent = {
        name: AllChainsByKeys[chain].label,
        id: chain,
        value: chainTotal,
        color: AllChainsByKeys[chain].colors.dark[0],
        // image: `<svg width="15" height="15" viewBox="0 0 15 15">${
        //   GTPIcons.icons[iconKey] ? GTPIcons.icons[iconKey].body : ""
        // }</svg>`,
        dataLabels: {
          style: {
            // color: AllChainsByKeys[chain].colors.dark[0],
            color: "#1F2726FF",
            // blend: "difference",
            // AllChainsByKeys[chain].darkTextOnBackground === true
            //   ? "#000"
            //   : "#fff",
          },
        },
        // borderColor: AllChainsByKeys[chain].colors["dark"][0],
        // borderRadius: 6,
        borderWidth: 2,
        lineWidth: 2,
      };

      return [parent, ...categories];
    });

    const treemapSeries = {
      name: "Chains",
      type: "treemap",
      layoutAlgorithm: "stripes",
      allowDrillToNode: true,
      animationLimit: 1000,
      levelIsConstant: true,
      opacity: 0.65,
      cropThreshold: 0,
      // stroke: "#000000",
      borderColor: "#1F2726",
      borderRadius: 6,
      borderWidth: 3,
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "10px",
          fontWeight: "bold",
          textOutline: "none",
        },
      },
      clip: true,
      levels: [
        {
          level: 1,
          layoutAlgorithm: "squarified",
          // borderWidth: 2,
          dataLabels: {
            enabled: true,
            align: "left",
            verticalAlign: "top",
            style: {
              fontSize: "12px",
              fontWeight: "bold",
              textOutline: "none",
            },
          },
        },
        {
          level: 2,
          layoutAlgorithm: "stripes",
          borderRadius: 6,
          borderWidth: 0,
          borderColor: "#1F2726",
          dataLabels: {
            enabled: true,
            style: {
              fontSize: "10px",
            },
          },
          // colorByPoint: true,
          colorVariation: {
            key: "brightness",
            to: -0.5,
          },
        },
      ],
      data: treemapChildren.flat(),
    };

    return treemapSeries;
  }, [data, selectedChain, selectedTimespan, master, valueKey]);

  const [highchartsLoaded, setHighchartsLoaded] = useState<boolean>(false);

  // const extendHighcharts = () => {
  //   (function (H) {
  //     console.log("H.Series.types", H.Series.types);
  //     H.wrap(
  //       H.Series.types.treemap.prototype,
  //       "drawPoints",
  //       function (proceed) {
  //         const points = this.points;

  //         var series = this,
  //           chart = series.chart,
  //           renderer = chart.renderer,
  //           styledMode = chart.styledMode,
  //           options = series.options,
  //           shadow = styledMode ? {} : options.shadow,
  //           borderRadius = options.borderRadius,
  //           withinAnimationLimit = chart.pointCount < options.animationLimit,
  //           allowTraversingTree = options.allowTraversingTree;
  //         points.forEach(function (point) {
  //           var levelDynamic = point.node.levelDynamic,
  //             animatableAttribs = {},
  //             attribs = {},
  //             css = {},
  //             groupKey = "level-group-" + point.node.level,
  //             hasGraphic = !!point.graphic,
  //             shouldAnimate = withinAnimationLimit && hasGraphic,
  //             shapeArgs = point.shapeArgs;

  //           console.log("groupKey", groupKey);
  //           console.log("shapeArgs", shapeArgs);

  //           if (shapeArgs && shapeArgs.x > 0) {
  //             if (groupKey === "level-group-1") {
  //               // let paddingX = 5 * (shapeArgs.width / chart.plotWidth);
  //               let paddingY = 5 * (shapeArgs.height / chart.plotHeight);
  //               // shapeArgs.x -= paddingX;
  //               shapeArgs.y += paddingY;
  //               // shapeArgs.width -= paddingX * 2;
  //               shapeArgs.height -= paddingY * 2;
  //             }
  //           }

  //           // Don't bother with calculate styling if the point is not drawn
  //           if (point.shouldDraw()) {
  //             point.isInside = true;
  //             if (borderRadius) {
  //               attribs.r = borderRadius;
  //             }
  //             merge(
  //               true, // Extend object
  //               // Which object to extend
  //               shouldAnimate ? animatableAttribs : attribs,
  //               // Add shapeArgs to animate/attr if graphic exists
  //               hasGraphic ? shapeArgs : {},
  //               // Add style attribs if !styleMode
  //               styledMode
  //                 ? {}
  //                 : series.pointAttribs(
  //                     point,
  //                     point.selected ? "select" : void 0,
  //                   ),
  //             );
  //             // In styled mode apply point.color. Use CSS, otherwise the
  //             // fill used in the style sheet will take precedence over
  //             // the fill attribute.
  //             if (series.colorAttribs && styledMode) {
  //               // Heatmap is loaded
  //               extend(css, series.colorAttribs(point));
  //             }
  //             if (!series[groupKey]) {
  //               series[groupKey] = renderer
  //                 .g(groupKey)
  //                 .attr({
  //                   // @todo Set the zIndex based upon the number of
  //                   // levels, instead of using 1000
  //                   zIndex: 1000 - (levelDynamic || 0),
  //                 })
  //                 .add(series.group);
  //               series[groupKey].survive = true;
  //             }
  //           }
  //           // Draw the point
  //           point.draw({
  //             animatableAttribs: animatableAttribs,
  //             attribs: attribs,
  //             css: css,
  //             group: series[groupKey],
  //             renderer: renderer,
  //             shadow: shadow,
  //             shapeArgs: shapeArgs,
  //             shapeType: point.shapeType,
  //           });
  //           // If setRootNode is allowed, set a point cursor on clickables &
  //           // add drillId to point
  //           if (allowTraversingTree && point.graphic) {
  //             point.drillId = options.interactByLeaf
  //               ? series.drillToByLeaf(point)
  //               : series.drillToByGroup(point);
  //           }
  //         });
  //       },
  //     );
  //   })(Highcharts);
  // };

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsAnnotations(Highcharts);
    highchartsTreemap(Highcharts);
    highchartsHeatmap(Highcharts);
    highchartsPatternFill(Highcharts);
    // extendHighcharts();
    setHighchartsLoaded(true);
  }, []);

  // console.log("seriesData", seriesData);

  const tooltipFormatter = useCallback(
    function (this: Highcharts.TooltipFormatterContextObject) {
      console.log("this", this);
      // return;
      const { point, color, series, key } = this;

      if (!point) return;

      // const series = points[0].series;

      // const date = new Date(x);
      const dateString = "";
      // `
      // <div>
      //   ${date.toLocaleDateString(undefined, {
      //     timeZone: "UTC",
      //     month: "short",
      //     day: "numeric",
      //     year: "numeric",
      //   })}
      // </div>
      // `;

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 text-xs font-raleway"><div class="flex-1 font-bold text-[13px] md:text-[1rem] ml-6 mb-2 flex justify-between">${key}</div>`;
      const tooltipEnd = `</div>`;

      let pointsSum = point.value;
      // if (selectedScale !== "percentage")
      //   pointsSum = points.reduce((acc: number, point: any) => {
      //     acc += point.y;
      //     return pointsSum;
      //   }, 0);

      let prefix = "";
      let suffix = "";

      if (selectedValueType === "gas_fees") prefix = showUsd ? "$" : "Ξ";

      const y = point.value ? point.value : 0;

      const tooltipPoints = `
          <div class="flex w-full space-x-2 items-center font-medium mb-1">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
            <!--
            <div class="tooltip-point-name text-md">${key}</div>
            -->
            <div class="flex-1 text-left justify-start font-inter flex">
                <div class="opacity-70 mr-0.5 ${
                  !prefix && "hidden"
                }">${prefix}</div>
                ${y.toLocaleString(undefined, {
                  minimumFractionDigits: prefix ? 2 : 0,
                  maximumFractionDigits: prefix ? 2 : 0,
                })}
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
                }">${suffix}</div>
            </div>
          </div>
          <!-- <div class="flex ml-4 w-[calc(100% - 1rem)] relative mb-1">
            <div class="h-[2px] w-full bg-gray-200 rounded-full absolute left-0 top-0" > </div>

            <div class="h-[2px] rounded-full absolute right-0 top-0" style="width: ${formatNumber(
              y,
            )}%; background-color: ${color}33;"></div>
          </div> -->`;

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [selectedValueType, showUsd],
  );

  return (
    <div>
      <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 relative">
        {/* <div className="flex justify-center items-center">
          {["gas_fees", "txcount"].map((valueType) => (
            <button
              key={valueType}
              className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium capitalize ${
                selectedValueType.includes(valueType)
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                if (selectedValueType.includes(valueType)) return;

                setSelectedValueType(valueType);
                // setXAxis();
              }}
            >
              <span className="hidden md:block">{valueType}</span>
            </button>
          ))}
        </div> */}
        {/* <div className="flex justify-center items-center">
          {["gas_fees", "txcount"].map((valueType) => (
            <button
              key={valueType}
              className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium capitalize ${
                selectedValueType.includes(valueType)
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                if (selectedValueType.includes(valueType)) return;

                setSelectedValueType(valueType);
                // setXAxis();
              }}
            >
              {valueType === "gas_fees" ? "Gas Fees" : "Transaction Count"}
            </button>
          ))}
        </div> */}
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium disabled:opacity-30 ${
                selectedValueType.includes("gas_fees")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedValueType("gas_fees");
              }}
            >
              Gas Fees
            </button>
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                selectedValueType.includes("txcount")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedValueType("txcount");
              }}
            >
              Transaction Count
            </button>
          </div>
          <div className="block lg:hidden w-[70%] mx-auto mt-[5px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            {Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
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
                }}
              >
                {timespans[timespan].label}
              </button>
            ))}
          </div>
          <div
            className={`absolute transition-[transform] text-xs  duration-300 ease-in-out -z-10 top-[30px] right-[20px] md:right-[45px] lg:top-0 lg:right-[65px] pr-[15px] w-[calc(50%-34px)] md:w-[calc(50%-56px)] lg:pr-[23px] lg:w-[168px] xl:w-[158px] xl:pr-[23px] ${
              !isMobile
                ? ["max", "180d"].includes(selectedTimespan)
                  ? "translate-y-[calc(-100%+3px)]"
                  : "translate-y-0 "
                : ["max", "180d"].includes(selectedTimespan)
                ? "translate-y-[calc(100%+3px)]"
                : "translate-y-0"
            }`}
          >
            <div className="font-medium bg-forest-100 dark:bg-forest-1000 rounded-b-2xl rounded-t-none lg:rounded-b-none lg:rounded-t-2xl border border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
              7-day rolling average
            </div>
          </div>
        </div>
      </div>
      {highchartsLoaded && (
        <HighchartsReact
          options={{
            chart: {
              animation: true,
              backgroundColor: "transparent",
              plotBorderColor: "transparent",
              showAxes: false,
              type: "treemap",
              style: {
                fontFamily: "var(--font-raleway)",
                // borderRadius: "0 0 15px 15px",
              },
            },
            title: undefined,
            legend: {
              enabled: false,
              useHTML: false,
              symbolWidth: 0,
            },
            tooltip: {
              ...baseOptions.tooltip,
              formatter: tooltipFormatter,
            },
            series: seriesData,

            credits: {
              enabled: false,
            },
            navigation: {
              buttonOptions: {
                enabled: false,
              },
            },
            navigator: {
              enabled: false,
            },
            rangeSelector: {
              enabled: false,
            },
            stockTools: {
              gui: {
                enabled: false,
              },
            },
            scrollbar: {
              enabled: false,
            },
          }}
          highcharts={Highcharts}
          ref={chartRef}
        />
      )}
      {/* <textarea
        className="w-full h-96"
        value={JSON.stringify(seriesData, null, 2)}
        readOnly
      /> */}
    </div>
  );
}
