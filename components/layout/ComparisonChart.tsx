import HighchartsReact from "highcharts-react-official";
import Highcharts, {
  AxisLabelsFormatterContextObject,
} from "highcharts/highstock";
import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useLocalStorage } from "usehooks-ts";
import { debounce, merge } from "lodash";
// import { theme as customTheme } from "tailwind.config.js";
import { useTheme } from "next-themes";
import { Switch } from "../Switch";
import { AllChainsByKeys } from "@/lib/chains";
import d3 from "d3";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import Container from "./Container";
import ChartWatermark from "./ChartWatermark";
import { navigationItems, navigationCategories } from "@/lib/navigation";
import { IS_PREVIEW } from "@/lib/helpers";
import { useWindowSize } from "usehooks-ts";

const monthly_agg_labels = {
  avg: "Average",
  sum: "Total",
  unique: "Distinct",
  distinct: "Distinct",
};

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135", // mignight-express but lighter
  ANNOTATION_BG: "rgb(215, 223, 222)",
  SERIES: ["#36a2eb", "#ff6384", "#8142ff", "#ff9f40", "#ffcd56", "#4bc0c0"],
};
const isArray = (obj: any) =>
  Object.prototype.toString.call(obj) === "[object Array]";
const splat = (obj: any) => (isArray(obj) ? obj : [obj]);

const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "column",
    animation: true,
    backgroundColor: "transparent",
    showAxes: false,
    zooming: {
      type: "x",
      resetButton: {
        position: {
          x: 0,
          y: 10,
        },
        theme: {
          fill: "transparent",
          style: {
            opacity: 1,
            fontSize: "12",
            fontFamily: "Inter",
            fontWeight: "300",
            color: "#fff",
            textTransform: "lowercase",
            border: "1px solid #fff",
          },
          borderRadius: 4,
          padding: 8,
          borderWidth: 2,
          r: 16,
          states: { hover: { fill: "#fff", style: { color: "#000" } } },
        },
      },
    },
    panning: {
      enabled: true,
    },
    panKey: "shift",
  },
  title: undefined,
  yAxis: {
    title: { text: undefined },
    labels: {
      enabled: true,
    },
    gridLineWidth: 1,
    gridLineColor: COLORS.GRID,
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    crosshair: {
      width: 0.5,
      color: COLORS.PLOT_LINE,
      snap: false,
    },
    labels: {
      style: { color: COLORS.LABEL },
      enabled: true,
      formatter: (item) => {
        const date = new Date(item.value);
        const isMonthStart = date.getDate() === 1;
        const isYearStart = isMonthStart && date.getMonth() === 0;

        if (isYearStart) {
          return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
        } else {
          return `<span style="">${date.toLocaleDateString(undefined, {
            timeZone: "UTC",
            month: "short",
          })}</span>`;
        }
      },
    },
    tickmarkPlacement: "on",
    tickWidth: 4,
    tickLength: 4,
    gridLineWidth: 0,
  },
  legend: {
    enabled: false,
    useHTML: false,
    symbolWidth: 0,
  },
  tooltip: {
    // backgroundColor: 'transparent',
    useHTML: true,
    shadow: false,
    shared: true,
  },
  plotOptions: {
    column: {
      grouping: false,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      groupPadding: 0,
      animation: false,
    },
    series: {
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      marker: {
        lineColor: "white",
        radius: 0,
        symbol: "circle",
      },
      shadow: false,
      animation: false,
    },
  },
  credits: {
    enabled: false,
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
};

export default function ComparisonChart({
  data,
  timeIntervals,
  showTimeIntervals = true,
  children,
  sources,
  avg,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
  selectedTimeInterval,
  setSelectedTimeInterval,
  selectedScale,
  setSelectedScale,
  metric_id,
  monthly_agg,
  is_embed = false,
}: {
  data: any;
  timeIntervals: string[];
  showTimeIntervals: boolean;
  children?: ReactNode;
  sources: string[];
  avg?: boolean;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
  selectedTimeInterval: string;
  setSelectedTimeInterval: (timeInterval: string) => void;
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  metric_id: string;
  monthly_agg: string;
  is_embed?: boolean;
}) {
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);
    setHighchartsLoaded(true);
  }, []);

  // const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [showGwei, reversePerformer] = useMemo(() => {
    const item = navigationItems[1].options.find(
      (item) => item.key === metric_id,
    );

    return [item?.page?.showGwei, item?.page?.reversePerformer];
  }, [metric_id]);

  // const [selectedTimespan, setSelectedTimespan] = useState("365d");

  // const [selectedScale, setSelectedScale] = useState(
  //   is_embed && metric_id != "txcosts" ? "log" : "absolute",
  // );

  // const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState(0);
  const [zoomMax, setZoomMax] = useState(0);

  const [valuePrefix, setValuePrefix] = useState("");

  const isMobile = useMediaQuery("(max-width: 767px)");

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

  const getTickPositions = useCallback(
    (xMin: any, xMax: any): number[] => {
      const tickPositions: number[] = [];
      const xMinDate = new Date(xMin);
      const xMaxDate = new Date(xMax);
      const xMinMonth = xMinDate.getUTCMonth();
      const xMaxMonth = xMaxDate.getUTCMonth();

      const xMinYear = xMinDate.getUTCFullYear();
      const xMaxYear = xMaxDate.getUTCFullYear();

      if (selectedTimespan === "max" || selectedTimespan === "maxM") {
        for (let year = xMinYear; year <= xMaxYear; year++) {
          for (let month = 0; month < 12; month = month + 4) {
            if (year === xMinYear && month < xMinMonth) continue;
            if (year === xMaxYear && month > xMaxMonth) continue;
            tickPositions.push(Date.UTC(year, month, 1).valueOf());
          }
        }
        return tickPositions;
      }

      for (let year = xMinYear; year <= xMaxYear; year++) {
        for (let month = 0; month < 12; month++) {
          if (year === xMinYear && month < xMinMonth) continue;
          if (year === xMaxYear && month > xMaxMonth) continue;
          tickPositions.push(Date.UTC(year, month, 1).valueOf());
        }
      }

      return tickPositions;
    },
    [selectedTimespan],
  );

  const getSeriesType = useCallback(
    (name: string) => {
      if (name === "ethereum") return "area";
      if (selectedScale === "percentage") return "area";
      if (selectedScale === "log")
        return selectedTimeInterval === "daily" ? "area" : "column";

      return "line";
    },
    [selectedScale, selectedTimeInterval],
  );

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  const filteredData = useMemo<any[]>(() => {
    if (!data)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];

    const d: any[] = showEthereumMainnet
      ? data
      : data.filter((d) => d.name !== "ethereum");

    if (d.length === 0)
      return [
        {
          name: "",
          data: [],
          types: [],
        },
      ];

    return d.sort((a, b) => {
      // always show ethereum on the bottom
      if (a.name === "ethereum") return 1;
      if (b.name === "ethereum") return -1;

      const aData = a.data[a.data.length - 1][1];
      const bData = b.data[b.data.length - 1][1];
      if (reversePerformer) return aData - bData;

      return bData - aData;
    });
  }, [data, reversePerformer, showEthereumMainnet]);

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      let prefix = valuePrefix;
      let suffix = "";
      let val = parseFloat(value as string);

      if (
        !showUsd &&
        filteredData[0].types.includes("eth") &&
        selectedScale !== "percentage"
      ) {
        if (showGwei) {
          prefix = "";
          suffix = " Gwei";
        }
      }

      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3.format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3.format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3.format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          }
        }
      }

      return number;
    },
    [valuePrefix, showUsd, filteredData, selectedScale, showGwei],
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      const dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: selectedTimeInterval === "daily" ? "numeric" : undefined,
        year: "numeric",
      });

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
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
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
                  AllChainsByKeys[name].colors[theme][0]
                }"></div>
                <div class="tooltip-point-name">${
                  AllChainsByKeys[name].label
                }</div>
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
                  background-color: ${AllChainsByKeys[name].colors[theme][0]};
                "></div>
              </div>`;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;

          if (!showUsd && filteredData[0].types.includes("eth")) {
            if (showGwei) {
              prefix = "";
              suffix = " Gwei";
            }
          }

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${
              AllChainsByKeys[name].colors[theme][0]
            }"></div>
            <div class="tooltip-point-name text-md">${
              AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
                <div class="opacity-70 mr-0.5 ${
                  !prefix && "hidden"
                }">${prefix}</div>
                ${parseFloat(value).toLocaleString(undefined, {
                  minimumFractionDigits: valuePrefix ? 2 : 0,
                  maximumFractionDigits: valuePrefix
                    ? metric_id === "txcosts"
                      ? 3
                      : 2
                    : 0,
                })}
                <div class="opacity-70 ml-0.5 ${
                  !suffix && "hidden"
                }">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(Math.max(0, value) / maxPoint) * 100}%;
              background-color: ${AllChainsByKeys[name].colors[theme][0]};
            "></div>
          </div>`;
        })
        .join("");

      let prefix = valuePrefix;
      let suffix = "";
      let value = pointsSum;

      const sumRow =
        selectedScale === "log"
          ? `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">
              <div class="opacity-70 mr-0.5 ${
                !prefix && "hidden"
              }">${prefix}</div>
              ${parseFloat(value).toLocaleString(undefined, {
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
    [
      filteredData,
      reversePerformer,
      selectedScale,
      showGwei,
      showUsd,
      theme,
      valuePrefix,
      selectedTimeInterval,
    ],
  );

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;

        const distance = 20;
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
          if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
            tooltipX = plotLeft + plotWidth - tooltipWidth;
          }
          return {
            x: tooltipX,
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

  const maxDate = useMemo(() => {
    let maxDate = new Date();
    if (filteredData && filteredData[0].name !== "") {
      maxDate = new Date(
        filteredData.length > 0
          ? filteredData[0].data[filteredData[0].data.length - 1][0]
          : 0,
      );
    }
    return maxDate;
  }, [filteredData]);

  const timespans = useMemo(() => {
    // let maxDate = new Date();
    // if (filteredData && filteredData[0].name !== "") {
    //   maxDate = new Date(
    //     filteredData.length > 0
    //       ? filteredData[0].data[filteredData[0].data.length - 1][0]
    //       : 0,
    //   );
    // }

    const buffer = 0.5 * 24 * 60 * 60 * 1000;
    const maxPlusBuffer = maxDate.valueOf() + buffer;

    //
    const firstDayOfLastMonth = new Date(
      maxDate.getFullYear(),
      maxDate.getMonth() - 1,
      1,
    );
    const monthMaxPlusBuffer = firstDayOfLastMonth.valueOf() + buffer;

    return {
      // "30d": {
      //   label: "30 days",
      //   value: 30,
      //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
      //   xMax: Date.now(),
      // },
      "90d": {
        label: "90 days",
        shortLabel: "90D",
        value: 90,
        xMin: maxDate.valueOf() - 90 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        shortLabel: "180D",
        value: 180,
        xMin: maxDate.valueOf() - 180 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        shortLabel: "365D",
        value: 365,
        xMin: maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "6m": {
        label: "6 months",
        shortLabel: "6M",
        value: 6,
        xMin: maxPlusBuffer.valueOf() - 6 * 31 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      "12m": {
        label: "1 year",
        shortLabel: "1Y",
        value: 12,
        xMin: maxPlusBuffer.valueOf() - 12 * 31 * 24 * 60 * 60 * 1000 - buffer,
        xMax: maxPlusBuffer,
      },
      maxM: {
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin:
          filteredData[0].name === ""
            ? Date.now() - 365 * 24 * 60 * 60 * 1000
            : filteredData.reduce(
                (min, d) => Math.min(min, d.data[0][0]),
                Infinity,
              ) - buffer,

        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        shortLabel: "Max",
        value: 0,
        xMin:
          filteredData[0].name === ""
            ? Date.now() - 365 * 24 * 60 * 60 * 1000
            : filteredData.reduce(
                (min, d) => Math.min(min, d.data[0][0]),
                Infinity,
              ) - buffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, maxDate]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.xAxis[0].setExtremes(
        timespans[selectedTimespan].xMin,
        timespans[selectedTimespan].xMax,
      );
    }
  }, [selectedTimespan, timespans]);

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const onXAxisSetExtremes =
    useCallback<Highcharts.AxisSetExtremesEventCallbackFunction>(
      function (e) {
        if (e.trigger === "pan") return;
        const { min, max } = e;
        const numDays = (max - min) / (24 * 60 * 60 * 1000);

        setIntervalShown({
          min,
          max,
          num: numDays,
          label: `${Math.round(numDays)} day${numDays > 1 ? "s" : ""}`,
        });

        if (
          e.trigger === "zoom" ||
          // e.trigger === "pan" ||
          e.trigger === "navigator" ||
          e.trigger === "rangeSelectorButton"
        ) {
          const { xMin, xMax } = timespans[selectedTimespan];

          if (min === xMin && max === xMax) {
            setZoomed(false);
          } else {
            setZoomed(true);
          }
          setZoomMin(min);
          setZoomMax(max);
        }
      },
      [selectedTimespan, timespans],
    );

  const dataGrouping = useMemo(() => {
    let grouping: Highcharts.DataGroupingOptionsObject | undefined = {
      enabled: false,
    };

    if (
      (avg === true || selectedScale === "log") &&
      ["max", "365d"].includes(selectedTimespan)
    ) {
      grouping = {
        enabled: false,
        // units: [["week", [1]]],
        // approximation: "average",
        // forced: true,
      };
    } else {
      grouping = {
        enabled: false,
      };
    }

    return grouping;
  }, [avg, selectedScale, selectedTimespan]);

  const scaleToPlotOptions = useMemo<Highcharts.PlotOptions>(() => {
    switch (selectedScale) {
      case "absolute":
        return {
          line: {
            stacking: undefined,
          },
          area: {
            stacking: undefined,
          },
        };
      case "percentage":
        return {
          line: {
            stacking: "percent",
          },
          area: {
            stacking: "percent",
          },
        };
      case "log":
        return {
          column: {
            stacking: "normal",
            crisp: true,
            // fillColor: {
            //   pattern: {
            //     path: {
            //       d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
            //       strokeWidth: 13,
            //     },
            //     width: 5,
            //     height: 5,
            //     opacity: 0,
            //   },
            // },
            // color: {
            //   pattern: {
            //     path: {
            //       d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
            //       strokeWidth: 3,
            //     },
            //     width: 20,
            //     height: 20,
            //     opacity: 0.4,
            //   },
            // },
          },
          area: {
            stacking: "normal",
          },
        };
      default:
        return {
          column: {
            stacking: "normal",
          },
          line: {
            stacking: undefined,
          },
          area: {
            stacking: undefined,
          },
        };
    }
  }, [selectedScale]);

  const avgMonthlyMetrics = useMemo(
    () => ["daa", "stables_mcap", "tvl", "txcosts"],
    [],
  );

  const getSeriesData = useCallback(
    (name: string, types: string[], data: number[][]) => {
      if (name === "")
        return {
          data: [],
          zoneAxis: undefined,
          zones: undefined,
          fillColor: undefined,
          fillOpacity: undefined,
          color: undefined,
        };

      const timeIndex = 0;
      let valueIndex = 1;
      let valueMulitplier = 1;

      let zones: any[] | undefined = undefined;
      let zoneAxis: string | undefined = undefined;

      const isLineChart = getSeriesType(name) === "line";
      const isColumnChart = getSeriesType(name) === "column";

      const isAreaChart = getSeriesType(name) === "area";

      let fillOpacity = undefined;

      let seriesFill = "transparent";

      if (isAreaChart) {
        seriesFill = AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "33";
      }

      if (isAreaChart) {
        seriesFill = AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "33";
      }

      let fillColor =
        selectedTimeInterval === "daily"
          ? AllChainsByKeys[name]?.colors[theme ?? "dark"][0]
          : undefined;
      let color =
        selectedTimeInterval === "daily"
          ? AllChainsByKeys[name]?.colors[theme ?? "dark"][0]
          : undefined;

      if (types.includes("usd")) {
        if (showUsd) {
          valueIndex = types.indexOf("usd");
        } else {
          valueIndex = types.indexOf("eth");
          if (showGwei) valueMulitplier = 1000000000;
        }
      }

      const seriesData = data.map((d) => {
        return [d[timeIndex], d[valueIndex] * valueMulitplier];
      });

      if (selectedTimeInterval === "daily") {
        return {
          data: seriesData,
          zoneAxis,
          zones,
          fillColor: seriesFill,
          fillOpacity,
          color,
        };
      }

      const columnFillColor = {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        stops: [
          [0, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "FF"],
          [0.349, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "00"],
        ],
      };

      const columnColor = {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        stops: [
          [0, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "FF"],
          [0.349, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, AllChainsByKeys[name]?.colors[theme ?? "dark"][0] + "00"],
        ],
      };

      const dottedColumnColor = {
        pattern: {
          path: {
            d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
            strokeWidth: 3,
          },
          width: 10,
          height: 10,
          opacity: 1,
          color: AllChainsByKeys[name].colors[theme ?? "dark"][0] + "CC",
        },
      };

      const todaysDate = new Date().getUTCDate();

      const secondZoneDottedColumnColor =
        todaysDate === 1 ? columnColor : dottedColumnColor;

      const secondZoneDashStyle = todaysDate === 1 ? "Solid" : "Dot";

      // if it is not the last day of the month, add a zone to the chart to indicate that the data is incomplete
      // if (new Date().getUTCDate() !== 1) {
      zoneAxis = "x";
      zones = [
        {
          value: seriesData[seriesData.length - 2][0] + 1,
          dashStyle: "Solid",
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart
            ? columnColor
            : AllChainsByKeys[name].colors[theme ?? "dark"][0],
        },
        {
          // value: monthlyData[monthlyData.length - 2][0],
          dashStyle: secondZoneDashStyle,
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart
            ? secondZoneDottedColumnColor
            : AllChainsByKeys[name].colors[theme ?? "dark"][0],
        },
      ];
      // }

      return {
        data: seriesData,
        zoneAxis,
        zones,
        fillColor,
        fillOpacity,
        color,
      };
    },
    [getSeriesType, selectedTimeInterval, theme, showUsd, showGwei],
  );

  const getChartHeight = useCallback(() => {
    if (is_embed) return window ? window.innerHeight - 160 : 400;
    if (isMobile) return 275;
    return 400;
  }, [isMobile, is_embed]);

  const options = useMemo((): Highcharts.Options => {
    if (!filteredData || filteredData.length === 0) return {};

    if (filteredData[0].types.includes("usd")) {
      if (!showUsd) setValuePrefix("Ξ");
      else setValuePrefix("$");
    } else {
      setValuePrefix("");
    }

    const dynamicOptions: Highcharts.Options = {
      chart: {
        height: getChartHeight(),
        type: getSeriesType(filteredData[0].name),
        plotBorderColor: "transparent",
        zooming: {
          resetButton: {
            theme: {
              zIndex: -10,
              fill: "transparent",
              stroke: "transparent",
              style: {
                color: "transparent",
                height: 0,
                width: 0,
              },
              states: {
                hover: {
                  fill: "transparent",
                  stroke: "transparent",
                  style: {
                    color: "transparent",
                    height: 0,
                    width: 0,
                  },
                },
              },
            },
          },
        },
      },
      plotOptions: scaleToPlotOptions,
      legend: {
        enabled: false,
      },
      yAxis: {
        opposite: false,
        showFirstLabel: true,
        showLastLabel: true,
        type: "linear",
        // ["absolute", "percentage"].includes(selectedScale)
        //   ? "linear"
        //   : "logarithmic",
        // reversed: reversePerformer ?? false,
        min: metric_id === "profit" ? null : 0,
        max: selectedScale === "percentage" ? 100 : undefined,
        labels: {
          y: 5,
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
          formatter: function (t: AxisLabelsFormatterContextObject) {
            return formatNumber(t.value, true);
          },
        },
        gridLineColor:
          theme === "dark"
            ? "rgba(215, 223, 222, 0.11)"
            : "rgba(41, 51, 50, 0.11)",
      },
      xAxis: {
        ordinal: false,
        minorTicks: true,
        minorTickLength: 2,
        minorTickWidth: 2,
        minorGridLineWidth: 0,
        minorTickInterval: 1000 * 60 * 60 * 24 * 7,
        // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
        tickPositions: getTickPositions(timespans.max.xMin, timespans.max.xMax),
        labels: {
          style: {
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
          },
        },
        events: {
          afterSetExtremes: onXAxisSetExtremes,
        },
        // ...xAxisMinMax,
        min: zoomed ? zoomMin : timespans[selectedTimespan].xMin,
        max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
      },
      tooltip: {
        formatter: tooltipFormatter,
        positioner: tooltipPositioner,
        split: false,
        followPointer: true,
        followTouchMove: true,
        backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
        borderRadius: 17,
        borderWidth: 0,
        padding: 0,
        outside: true,
        shadow: {
          color: "black",
          opacity: 0.015,
          offsetX: 2,
          offsetY: 2,
        },
        style: {
          color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
        },
      },
      //@ts-ignore
      series: [
        ...filteredData.map((series: any, i: number) => {
          const zIndex = showEthereumMainnet
            ? series.name === "ethereum"
              ? 0
              : 10
            : 10;
          let borderRadius: string | null = null;

          if (showEthereumMainnet && i === 1) {
            borderRadius = "8%";
          } else if (i === 0) {
            borderRadius = "8%";
          }

          const timeIntervalToMilliseconds = {
            daily: 1 * 24 * 3600 * 1000,
            weekly: 7 * 24 * 3600 * 1000,
            monthly: 30 * 24 * 3600 * 1000,
          };

          const pointsSettings = {
            pointPlacement:
              selectedTimeInterval === "monthly" && selectedScale === "log"
                ? 0
                : 0.5,
          };

          return {
            name: series.name,
            // always show ethereum on the bottom
            zIndex: zIndex,
            step: undefined,
            data: getSeriesData(series.name, series.types, series.data).data,
            zoneAxis: getSeriesData(series.name, series.types, series.data)
              .zoneAxis,
            zones: getSeriesData(series.name, series.types, series.data).zones,
            ...pointsSettings,
            type: getSeriesType(series.name),
            // fill if series name is ethereum
            clip: true,
            dataGrouping: dataGrouping,
            borderRadiusTopLeft: borderRadius,
            borderRadiusTopRight: borderRadius,
            fillOpacity: getSeriesData(series.name, series.types, series.data)
              .fillOpacity,
            fillColor: getSeriesData(series.name, series.types, series.data)
              .fillColor,
            color: getSeriesData(series.name, series.types, series.data).color,
            borderColor:
              AllChainsByKeys[series.name]?.colors[theme ?? "dark"][0],
            borderWidth: 1,
            lineWidth: 2,
            ...// @ts-ignore
            (getSeriesType(series.name) !== "column"
              ? {
                  shadow: {
                    color:
                      AllChainsByKeys[series.name]?.colors[theme ?? "dark"][1] +
                      "33",
                    width: 10,
                  },
                  // color: {
                  //   linearGradient: {
                  //     x1: 0,
                  //     y1: 0,
                  //     x2: 1,
                  //     y2: 0,
                  //   },
                  //   stops: [
                  //     [
                  //       0,
                  //       AllChainsByKeys[series.name]?.colors[
                  //         theme ?? "dark"
                  //       ][0],
                  //     ],
                  //     // [0.33, AllChainsByKeys[series.name].colors[1]],
                  //     [
                  //       1,
                  //       AllChainsByKeys[series.name]?.colors[
                  //         theme ?? "dark"
                  //       ][1],
                  //     ],
                  //   ],
                  // },
                }
              : series.name === "all_l2s"
              ? {
                  borderColor: "transparent",

                  shadow: {
                    color: "#CDD8D3" + "FF",
                    // color:
                    //   AllChainsByKeys[series.name].colors[theme][1] + "33",
                    // width: 10,
                    offsetX: 0,
                    offsetY: 0,
                    width: 2,
                  },
                  // color: {
                  //   linearGradient: {
                  //     x1: 0,
                  //     y1: 0,
                  //     x2: 0,
                  //     y2: 1,
                  //   },
                  //   stops:
                  //     theme === "dark"
                  //       ? [
                  //           [
                  //             0,
                  //             AllChainsByKeys[series.name]?.colors[
                  //               theme ?? "dark"
                  //             ][0] + "E6",
                  //           ],

                  //           [
                  //             1,
                  //             AllChainsByKeys[series.name]?.colors[
                  //               theme ?? "dark"
                  //             ][1] + "E6",
                  //           ],
                  //         ]
                  //       : [
                  //           [
                  //             0,
                  //             AllChainsByKeys[series.name]?.colors[
                  //               theme ?? "dark"
                  //             ][0] + "E6",
                  //           ],

                  //           [
                  //             1,
                  //             AllChainsByKeys[series.name]?.colors[
                  //               theme ?? "dark"
                  //             ][1] + "E6",
                  //           ],
                  //         ],
                  // },
                }
              : {
                  borderColor: "transparent",
                  shadow: {
                    color: "#CDD8D3" + "FF",
                    offsetX: 0,
                    offsetY: 0,
                    width: 2,
                  },
                  // fillColor: {
                  //   linearGradient: {
                  //     x1: 0,
                  //     y1: 0,
                  //     x2: 0,
                  //     y2: 1,
                  //   },
                  //   stops: [
                  //     [
                  //       0,
                  //       AllChainsByKeys[series.name]?.colors[
                  //         theme ?? "dark"
                  //       ][0] + "FF",
                  //     ],
                  //     [
                  //       0.349,
                  //       AllChainsByKeys[series.name]?.colors[
                  //         theme ?? "dark"
                  //       ][0] + "88",
                  //     ],
                  //     [
                  //       1,
                  //       AllChainsByKeys[series.name]?.colors[
                  //         theme ?? "dark"
                  //       ][0] + "00",
                  //     ],
                  //   ],
                  // },
                }),
            states: {
              hover: {
                enabled: true,
                halo: {
                  size: 5,
                  opacity: 1,
                  attributes: {
                    fill:
                      AllChainsByKeys[series.name]?.colors[theme ?? "dark"][0] +
                      "99",
                    stroke:
                      AllChainsByKeys[series.name]?.colors[theme ?? "dark"][0] +
                      "66",
                    strokeWidth: 0,
                  },
                },
                brightness: 0.3,
              },
              inactive: {
                enabled: true,
                opacity: 0.6,
              },
              selection: {
                enabled: false,
              },
            },
            showInNavigator: false,
          };
        }),
      ],
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
    };

    return merge({}, baseOptions, dynamicOptions);
  }, [
    filteredData,
    isMobile,
    getSeriesType,
    scaleToPlotOptions,
    selectedScale,
    theme,
    getTickPositions,
    timespans,
    onXAxisSetExtremes,
    zoomed,
    zoomMin,
    selectedTimespan,
    zoomMax,
    tooltipFormatter,
    tooltipPositioner,
    showUsd,
    formatNumber,
    showEthereumMainnet,
    dataGrouping,
    showGwei,
    metric_id,
    getSeriesData,
    getChartHeight,
    selectedTimeInterval,
  ]);

  // useEffect(() => {
  //   if (chartComponent.current) {
  //     chartComponent.current.reflow();
  //   }
  // }, [chartComponent, filteredData]);

  const resituateChart = debounce(() => {
    chartComponent.current && chartComponent.current.reflow();
  }, 300);

  useEffect(() => {
    resituateChart();

    // cancel the debounced function on component unmount
    return () => {
      resituateChart.cancel();
    };
  }, [chartComponent, selectedTimespan, timespans, resituateChart]);

  const { isSidebarOpen } = useUIContext();

  useEffect(() => {
    setTimeout(() => {
      resituateChart();
    }, 300);

    return () => {
      resituateChart.cancel();
    };
  }, [isSidebarOpen, resituateChart]);

  useEffect(() => {
    if (chartComponent.current) {
      if (is_embed) {
        return;
      }

      if (isMobile) {
        chartComponent.current.setSize(null, 275, false);
        return;
      }

      chartComponent.current.setSize(null, 400, false);
    }
  }, [isMobile, is_embed]);

  const { width, height } = useWindowSize();
  useEffect(() => {
    if (!is_embed) return;

    if (chartComponent.current) {
      chartComponent.current.setSize(width, height - 160, false);
    }
  }, [is_embed, width, height]);

  return (
    <div className="w-full flex-col relative">
      {/* {is_embed === true && (
        <div className="absolute top-0 left-20 md:top-4 md:left-20 font-bold text-[14px] md:text-[18px] leading-snug z-50">
          {
            navigationItems[1].options.find((item) => item.key === metric_id)
              ?.label
          }
        </div>
      )} */}
      <Container className={`${is_embed ? "!p-0 !m-0" : ""}`}>
        <div className="flex w-full justify-between items-center text-xs rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 relative">
          {is_embed ? (
            <div className="hidden md:flex justify-center items-center">
              <div className="w-5 h-5 md:w-7 md:h-7 relative ml-[21px] mr-3">
                <Icon
                  icon={
                    navigationCategories[
                      navigationItems[1].options.find(
                        (item) => item.key === metric_id,
                      )?.category ?? "convenience"
                    ].icon
                  }
                  className="w-5 h-5 md:w-7 md:h-7"
                />
              </div>
              {/* <Icon icon="gtp:chain" className="w-7 h-7 lg:w-9 lg:h-9" /> */}
              <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden md:block my-[10px]">
                {
                  navigationItems[1].options.find(
                    (item) => item.key === metric_id,
                  )?.label
                }
              </h2>
            </div>
          ) : (
            <div className="flex justify-center items-center">
              {/* <div className="w-7 h-7 md:w-9 md:h-9 relative ml-[21px] mr-1.5">
                <Image
                  src="/GTP-Chain.png"
                  alt="GTP Chain"
                  className="object-contain"
                  fill
                />
              </div>
              <h2 className="text-[24px] xl:text-[30px] leading-snug font-bold hidden lg:block my-[10px]">
                Selected Chains
              </h2> */}
              <div
                className={`absolute transition-[transform] duration-300 ease-in-out -z-10 top-0 left-0 pl-[40px] w-[90px] md:pl-[85px] md:w-[151px] lg:pl-[89px] lg:w-[149px] xl:w-[170px] xl:pl-[110px] ${
                  monthly_agg && selectedTimeInterval === "monthly"
                    ? "translate-y-[calc(-100%+3px)]"
                    : "translate-y-0 "
                }`}
              >
                <div className="text-[0.65rem] md:text-xs font-medium bg-forest-100 dark:bg-forest-1000 rounded-t-2xl border-t border-l border-r border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0">
                  {monthly_agg_labels[monthly_agg]}
                </div>
              </div>
              {["daily", "monthly"].map((interval) => (
                <button
                  key={interval}
                  className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium capitalize ${
                    selectedTimeInterval === interval
                      ? "bg-forest-500 dark:bg-forest-1000"
                      : "hover:bg-forest-500/10"
                  }`}
                  onClick={() => {
                    if (selectedTimeInterval === interval) return;

                    if (interval === "daily") setSelectedTimespan("180d");
                    else setSelectedTimespan("12m");

                    setSelectedTimeInterval(interval);
                    // setXAxis();
                    chartComponent?.current?.xAxis[0].update({
                      min: timespans[selectedTimespan].xMin,
                      max: timespans[selectedTimespan].xMax,
                      // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                      tickPositions: getTickPositions(
                        timespans.max.xMin,
                        timespans.max.xMax,
                      ),
                    });
                    setZoomed(false);
                  }}
                >
                  <span className="hidden md:block">{interval}</span>
                  <span className="block md:hidden">{interval[0]}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex md:w-auto justify-between md:justify-center items-stretch md:items-center space-x-[4px] md:space-x-1">
            {!zoomed ? (
              Object.keys(timespans)
                .filter((timespan) =>
                  selectedTimeInterval === "daily"
                    ? ["90d", "180d", "365d", "max"].includes(timespan)
                    : ["6m", "12m", "maxM"].includes(timespan),
                )
                .map((timespan) => (
                  <button
                    key={timespan}
                    className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium ${
                      selectedTimespan === timespan
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedTimespan(timespan);
                      // setXAxis();
                      chartComponent?.current?.xAxis[0].update({
                        min: timespans[selectedTimespan].xMin,
                        max: timespans[selectedTimespan].xMax,
                        // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                        tickPositions: getTickPositions(
                          timespans.max.xMin,
                          timespans.max.xMax,
                        ),
                      });
                      setZoomed(false);
                    }}
                  >
                    <span className="hidden sm:block">
                      {timespans[timespan].label}
                    </span>
                    <span className="block sm:hidden">
                      {timespans[timespan].shortLabel}
                    </span>
                  </button>
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
          </div>
          <div
            className={`absolute transition-[transform] duration-300 ease-in-out -z-10 top-0 right-0 pr-[15px] w-[117px] sm:w-[162px] md:w-[175px] lg:pr-[23px] lg:w-[168px] xl:w-[198px] xl:pr-[26px] ${
              avg && ["365d", "max"].includes(selectedTimespan)
                ? "translate-y-[calc(-100%+3px)]"
                : "translate-y-0 "
            }`}
          >
            <div className="text-[0.65rem] md:text-xs font-medium bg-forest-100 dark:bg-forest-1000 rounded-t-2xl border-t border-l border-r border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
              <span className="hidden md:block">7-day rolling average</span>
              <span className="block md:hidden">7-day average</span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col-reverse lg:flex-row pt-8 md:pt-0">
          {!is_embed && (
            <div
              className={`hidden lg:block lg:w-7/12 xl:w-5/12 pl-2 pr-[19px] self-center`}
            >
              <div className="-mt-7 lg:-mr-10">{children}</div>
            </div>
          )}
          {highchartsLoaded ? (
            <>
              <div
                className={
                  is_embed ? "w-full" : "w-full lg:w-5/12 xl:w-7/12 relative"
                }
              >
                <div
                  className={
                    is_embed ? "w-full" : "w-full p-0 py-0 xl:pl-4 xl:py-14"
                  }
                >
                  <div
                    className={
                      is_embed
                        ? "w-full relative h-[calc(100vh-160px)] md:h-[calc(100vh-100px)]"
                        : "w-full h-[17rem] md:h-[26rem] relative rounded-xl"
                    }
                  >
                    <div
                      className={
                        is_embed
                          ? "relative block w-full top-0 md:top-8"
                          : "block absolute w-full h-[275px] md:h-[24rem] top-0 md:top-4"
                      }
                    >
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                        ref={(chart) => {
                          chartComponent.current = chart?.chart;
                        }}
                        constructorType={"stockChart"}
                      />
                    </div>
                    <div className="absolute bottom-[48.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
                      <ChartWatermark className="w-[128.67px] h-[30.67px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                    </div>
                  </div>
                </div>

                {/* {avg && ["365d", "max"].includes(selectedTimespan) && (
                  <div className="absolute -top-[10px] right-3 sm:-top-[7px] md:top-[5px] md:right-3 lg:top-[5px] xl:top-[60px] xl:right-[calc(0%+1.75rem)] rounded-full text-xs font-medium capitalize">
                    Displaying 7d Rolling Average
                  </div>
                )} */}
                {filteredData.length === 1 && filteredData[0].name === "" && (
                  <div className="absolute top-[calc(50%+1.5rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
                    No chain(s) selected for comparison. Please select at least
                    one.
                  </div>
                )}
                <div className="absolute top-3 left-[calc(0%-1.75rem)] rounded-full text-xs font-medium"></div>
              </div>
            </>
          ) : (
            <div className="w-full lg:w-1/2 xl:w-7/12 h-[26rem] my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
        </div>
        {data.filter((d) => d.name === "ethereum").length > 0 ? (
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
                <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${
                      "absolute" === selectedScale
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
                        className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${
                          "log" === selectedScale
                            ? "bg-forest-500 dark:bg-forest-1000"
                            : "hover:enabled:bg-forest-500/10"
                        }`}
                        onClick={() => {
                          setSelectedScale("log");
                        }}
                      >
                        Stacked
                      </button>

                      <button
                        className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium disabled:opacity-30 ${
                          "percentage" === selectedScale
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
                <div className="flex justify-between md:justify-center items-center  space-x-[4px] md:space-x-1 mr-0 md:mr-2.5 w-full md:w-auto ">
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "absolute" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("absolute");
                    }}
                  >
                    Absolute
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "log" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("log");
                    }}
                  >
                    Stacked
                  </button>
                  <button
                    className={`rounded-full z-10 px-[16px] py-[6px] w-full md:w-auto text-sm md:text-base  lg:px-4 lg:py-1 lg:text-base xl:px-4 xl:py-1 xl:text-base font-medium  ${
                      "percentage" === selectedScale
                        ? "bg-forest-500 dark:bg-forest-1000"
                        : "hover:bg-forest-500/10"
                    }`}
                    onClick={() => {
                      setSelectedScale("percentage");
                    }}
                  >
                    Percentage
                  </button>
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
      </Container>
      {!is_embed && (
        <Container className="block mt-6 lg:hidden w-full !pr-0">
          {children}
        </Container>
      )}
    </div>
  );
}
