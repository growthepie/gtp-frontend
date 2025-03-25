"use client";

import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";
import HighchartsReact from "highcharts-react-official";
import HighchartsColumnSeries from "highcharts/es-modules/Series/Column/ColumnSeries"
import Highcharts, {
  AxisLabelsFormatterContextObject,
  Tick,
  chart,
  color,
} from "highcharts/highstock";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Tooltip as HighchartsTooltip,
  PlotBand,
  AreaSeries,
  ColumnSeries,
  LineSeries,
  PieSeries,
  
  Series,
  
} from "react-jsx-highcharts";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { debounce, fill, merge } from "lodash";
import { Switch } from "../Switch";
import {
  // AllChainsByKeys,
  // EnabledChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import d3 from "d3";
import { Icon } from "@iconify/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import { useUIContext, useHighchartsWrappers } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import ChartWatermark from "./ChartWatermark";
import { BASE_URL, IS_PREVIEW } from "@/lib/helpers";
import EmbedContainer from "@/app/(embeds)/embed/EmbedContainer";
import "../../app/highcharts.axis.css";
import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
import { transparent } from "tailwindcss/colors";
import { createTooltipFormatter, formatNumber } from "@/lib/highcharts/tooltipFormatters";
import { baseChartOptions } from "@/lib/highcharts/chartUtils";
import { PatternRegistry, initializePatterns } from "@/lib/highcharts/svgPatterns";


const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

const METRIC_COLORS = {
  cross_layer: ["#C1C1C1", "#FE5468"],
  single_l2: ["#FFDF27", "#FE5468"],
  multiple_l2s: ["#FFDF27", "#FE5468"],
  only_l1: ["#C1C1C1", "#5B5B5B"],
  main_l1: ["#C1C1C1", "#5B5B5B"],
  main_l2: ["#FFDF27", "#FE5468"],
}

export type GradientConfig = {
  type: "linearGradient" | "radialGradient";
  linearGradient?: { x1: number; y1: number; x2: number; y2: number };
  radialGradient?: { cx: number; cy: number; r: number; fx: number; fy: number };
  stops: [number, string][];
}

export type PatternConfig = {
  type: string;
  direction: string;
  color: string;
  backgroundFill: string;
}

export type MaskConfig = {
  direction: string;
}

export type BACKEND_SIMULATION_CONFIG = {
  defs: {
    gradients: {
      id: string;
      config: GradientConfig
    }[];
    patterns: {
      id: string;
      type: string;
      config: {
        type: string;
        direction: string;  
      };
    }[];
  };
  compositionTypes: {
    [key: string]: {
      order: number;
      name?: string;
      description?: string;
      fill: {
        type: string;
        config: GradientConfig | PatternConfig;
      };
      mask?: {
        config: MaskConfig;
      };
    };
  };
}

export const BACKEND_SIMULATION_CONFIG: BACKEND_SIMULATION_CONFIG = {
  defs: {
    gradients: [
      {
        id: "cross_layer_background_gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 1.5, y1: 1.5, x2: -1, y2: -1 },
          stops: [[0, "#FE5468"], [1, "#FFDF27"]]
        }
      }
    ],
    patterns: []
  },
  compositionTypes: {
    main_l1: {
      order: 0,
      name: "Ethereum Mainnet",
      description: "Ethereum Mainnet data",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, "#94ABD3"], [1, "#596780"]]
        }
      }
    },
    main_l2: {
      order: 1,
      name: "Layer 2",
      description: "Layer 2 scaling solutions",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [[0, "#FE5468"], [1, "#FFDF27"]]
        }
      }
    },
    only_l1: {
      order: 0,
      name: "Ethereum Mainnet",
      description: "Only users that interacted with Ethereum Mainnet but not with any L2.",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, "#94ABD3"], [1, "#596780"]]
        }
      }
    },
    cross_layer: {
      order: 1,
      name: "Cross-Layer",
      description: "Users that interacted with Ethereum Mainnet and at least one L2.",
      fill: {
        type: "pattern",
        config: {
          type: "colored-hash",
          direction: "right",
          color: "#94ABD3",
          backgroundFill: "url(#cross_layer_background_gradient)"
        }
      }
    },
    multiple_l2s: {
      order: 2,
      name: "Multiple Layer 2s",
      description: "Users that interacted with multiple L2s but not Ethereum Mainnet.",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
          stops: [[0, "#FE5468"], [1, "#FFDF27"]]
        }
      }
    },
    single_l2: {
      order: 3,
      name: "Single Layer 2",
      description: "Users that interacted with a single L2 but not Ethereum Mainnet.",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
          stops: [[0, "#FE5468"], [1, "#FFDF27"]]
        }
      },
      mask: {
        config: {
          direction: "right"
        }
      }
    },
    all_l2s: {
      order: 4,
      name: "All Layer 2s",
      description: "Users that interacted with all L2s.",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [[0, "#FE5468"], [1, "#FFDF27"]]
        }
      }
    },
    ethereum: {
      order: 5,
      name: "Ethereum Mainnet",
      description: "Users that interacted with Ethereum Mainnet.",
      fill: {
        type: "gradient",
        config: {
          type: "linearGradient",
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, "#94ABD3"], [1, "#596780"]]
        }
      }
    }
  }
};

const isArray = (obj: any) =>
  Object.prototype.toString.call(obj) === "[object Array]";
const splat = (obj: any) => (isArray(obj) ? obj : [obj]);


export default function LandingChart({
  data,
  master,
  cross_chain_users,
  cross_chain_users_comparison,
  latest_total,
  latest_total_comparison,
  l2_dominance,
  l2_dominance_comparison,
  selectedMetric,
  setSelectedMetric,
  metric,
  sources,
  is_embed = false,
  embed_timespan,
  embed_start_timestamp,
  embed_end_timestamp,
  embed_show_mainnet,
  embed_zoomed,
}: // timeIntervals,
  // onTimeIntervalChange,
  // showTimeIntervals = true,
  {
    data: any;
    master: any;
    cross_chain_users: number;
    cross_chain_users_comparison: number;
    latest_total: number;
    latest_total_comparison: number;
    l2_dominance: number;
    l2_dominance_comparison: number;
    selectedMetric: string;
    setSelectedMetric: (metric: string) => void;
    metric: string;
    sources: string[];
    is_embed?: boolean;
    embed_timespan?: string;
    embed_start_timestamp?: number;
    embed_end_timestamp?: number;
    embed_show_mainnet?: boolean;
    embed_zoomed?: boolean;
    // timeIntervals: string[];
    // onTimeIntervalChange: (interval: string) => void;
    // showTimeIntervals: boolean;
  }) {
  const { AllChainsByKeys, EnabledChainsByKeys } = useMaster();
  const [highchartsLoaded, setHighchartsLoaded] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const { isSidebarOpen, setEmbedData, embedData } = useUIContext();


  // useEffect(() => {
  //   if (embedData.src !== BASE_URL + "/embed/user-base")
  //     setEmbedData(prevEmbedData => ({
  //       ...prevEmbedData,
  //       title: "Layer 2 Weekly Engagement - growthepie",
  //       src: BASE_URL + "/embed/user-base",
  //     }));
  // }, [embedData]);

  useHighchartsWrappers();

  const [maskIds, setMaskIds] = useState<{ rightMaskId: string; leftMaskId: string } | null>(null);



  useEffect(() => {
    Highcharts.setOptions({
      lang: {
        numericSymbols: ["K", " M", "B", "T", "P", "E"],
      },
    });
    highchartsRoundedCorners(Highcharts);
    // highchartsAnnotations(Highcharts);
    highchartsPatternFill(Highcharts);
    // loadHighchartsWrappers();

    // update x-axis label sizes if it is a 4 digit number
    Highcharts.wrap(
      Highcharts.Axis.prototype,
      "renderTick",
      function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const axis: Highcharts.Axis = this;
        const ticks: Highcharts.Dictionary<Tick> = axis.ticks;
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

    setHighchartsLoaded(true);
  }, []);

  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [focusEnabled] = useLocalStorage("focusEnabled", true);

  const [selectedTimespan, setSelectedTimespan] = useState(
    embed_timespan ?? "max",
  );

  const [selectedScale, setSelectedScale] = useState(
    selectedMetric === "Compsoition Split" ? "percentage" : "absolute",
  );
  const [selectedTimeInterval, setSelectedTimeInterval] = useState("daily");

  const [zoomed, setZoomed] = useState(false);
  const [zoomMin, setZoomMin] = useState(0);
  const [zoomMax, setZoomMax] = useState(0);

  useEffect(() => {
    if (embed_zoomed && embed_start_timestamp && embed_end_timestamp) {
      setZoomed(embed_zoomed);
      setZoomMin(embed_start_timestamp);
      setZoomMax(embed_end_timestamp);
    }
  }, [embed_end_timestamp, embed_start_timestamp, embed_zoomed]);

  const [showEthereumMainnet, setShowEthereumMainnet] = useState(
    embed_show_mainnet ?? false,
  );

  const [totalUsersIncrease, setTotalUsersIncrease] = useState(0);

  const isMobile = useMediaQuery("(max-width: 767px)");

  const getSeriesType = useCallback(
    (name: string) => {
      if (selectedScale === "percentage") return "area";

      if (name === "ethereum") return "area";

      return "column";
    },
    [selectedScale],
  );

  const chartComponent = useRef<Highcharts.Chart | null | undefined>(null);

  const [daysShown, setDaysShown] = useState(900);

  const chartConfig = useMemo(() => {
    if (!data) return null;
    return {
      compositions: data.timechart.compositions,
      types: data.timechart.types,
      compositionTypes: BACKEND_SIMULATION_CONFIG.compositionTypes,
    };
  }, [data]);

  const customTooltipFormatter = useMemo(() => createTooltipFormatter({
    selectedScale: selectedScale as "percentage" | "absolute",
    selectedMetric: selectedMetric,
    theme: theme as "dark" | "light",
    focusEnabled: focusEnabled,
    showEthereumMainnet: showEthereumMainnet,
    compositionTypes: chartConfig?.compositionTypes,
  }), [selectedScale, selectedMetric, theme, focusEnabled, showEthereumMainnet, chartConfig?.compositionTypes]);

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

        const tooltipY = pointY - tooltipHeight / 2;

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

  const [showTotalUsers, setShowTotalUsers] = useState(
    selectedMetric === "Total Ethereum Ecosystem",
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    const compositions = data.timechart.compositions;
    const types = data.timechart.types;
    let retData: any = [];
  
    // Define explicit order for the keys
    const orderedKeys = ["single_l2", "multiple_l2s", "cross_layer", "only_l1"]; // Adjust as needed
  
    // Filter keys and apply custom ordering
    const compositionKeys = Object.keys(compositions)
      .filter((key) => !(key === "only_l1" && focusEnabled))
      .sort((a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b)); // Sort based on explicit order
  
    if (selectedMetric === "Total Ethereum Ecosystem") {
      if(!focusEnabled){
        let onlySumData: number[][] = [];
        let onlyL2SumData: number[][] = [];
        compositions.only_l1.forEach((element, index) => {
          let sum_l1 = 0;
          let sum_l2 = 0;
          sum_l1 += compositions.only_l1[index][types.indexOf("value")];
          sum_l1 += compositions.cross_layer[index][types.indexOf("value")];
          sum_l2 += compositions.multiple_l2s[index][types.indexOf("value")];
          sum_l2 += compositions.single_l2[index][types.indexOf("value")];

          onlySumData.push([element[types.indexOf("unix")], sum_l1]);
          onlyL2SumData.push([element[types.indexOf("unix")], sum_l2]);
        });

        retData.push({ name: "main_l2", data: onlyL2SumData, types: types });
        retData.push({ name: "main_l1", data: onlySumData, types: types });

      } else {
        let sumData: number[][] = [];
    
        compositions.cross_layer.forEach((element, index) => {
          let sum = 0;
          compositionKeys.forEach((key) => {
            sum += compositions[key][index][types.indexOf("value")];
          });
    
          sumData.push([element[types.indexOf("unix")], sum]);
        });
    
        retData.push({ name: "all_l2s", data: sumData, types: types , stacked: false});
        if(focusEnabled && showEthereumMainnet){
          retData.push({ name: "ethereum", data: compositions.only_l1, types: types, stacked: false });
          
        }
      }
    } else {

      compositionKeys.forEach((key) => {
        retData.push({ name: key, data: compositions[key], types: types, stacked: key === "single_l2" ? false : true });
      });
      if(focusEnabled && showEthereumMainnet){
        retData.push({ name: "ethereum", data: compositions.only_l1, types: types, stacked: false, });
      }
    }
  
    return retData;
  }, [data, showEthereumMainnet, showTotalUsers, focusEnabled, selectedMetric]);
  
  

  const maxDate = useMemo(() => {
    if (embed_end_timestamp) return new Date(embed_end_timestamp);

    let maxDate = new Date();
    if (filteredData && filteredData[0].name !== "") {
      maxDate = new Date(
        filteredData.length > 0 &&
          filteredData[0].data[filteredData[0].data.length - 1][0]
          ? filteredData[0].data[filteredData[0].data.length - 1][0]
          : 0,
      );
    }
    return maxDate;
  }, [embed_end_timestamp, filteredData]);

  const timespans = useMemo(() => {
    const buffer = selectedScale === "percentage" ? 0 : 7 * 24 * 60 * 60 * 1000;
    const maxPlusBuffer = maxDate.valueOf() + buffer;

    return {
      // "30d": {
      //   label: "30 days",
      //   value: 30,
      //   xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
      //   xMax: Date.now(),
      // },
      "90d": {
        label: "90 days",
        value: 90,
        xMin: maxPlusBuffer - 90 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "180d": {
        label: "180 days",
        value: 180,
        xMin: maxPlusBuffer - 180 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      "365d": {
        label: "1 year",
        value: 365,
        xMin: maxPlusBuffer - 365 * 24 * 60 * 60 * 1000,
        xMax: maxPlusBuffer,
      },
      max: {
        label: "Maximum",
        value: 0,
        xMin:
          filteredData.reduce((min, d) => {
            if (d.data && d.data[0] && d.data[0][0] !== undefined) {
              return Math.min(min, d.data[0][0]);
            }
            return min;
          }, Infinity) - buffer,

        xMax: maxPlusBuffer,
      },
    };
  }, [filteredData, maxDate, selectedScale]);

  useEffect(() => {
    const startTimestamp = zoomed ? zoomMin : undefined;
    const endTimestamp = zoomed ? zoomMax : maxDate.valueOf();

    const vars = {
      theme: theme ? theme : "dark",
      timespan: selectedTimespan,
      scale: selectedScale,
      // interval: selectedTimeInterval,
      showMainnet: showEthereumMainnet ? "true" : "false",
      metric: selectedMetric,
    };

    const absoluteVars = {
      zoomed: zoomed ? "true" : "false",
      startTimestamp: startTimestamp ? startTimestamp.toString() : "",
      endTimestamp: endTimestamp ? endTimestamp.toString() : "",
    };

    let src =
      BASE_URL +
      "/embed/user-base/" +
      "?" +
      new URLSearchParams(vars).toString();
    if (embedData.timeframe === "absolute") {
      src += "&" + new URLSearchParams(absoluteVars).toString();
    }

    setEmbedData((prevEmbedData) => ({
      ...prevEmbedData,
      title: "Layer 2 Weekly Engagement - growthepie",
      src: src,
      zoomed: zoomed,
      timeframe: zoomed ? "absolute" : embedData.timeframe,
    }));
  }, [
    embedData.timeframe,
    maxDate,
    selectedScale,
    selectedTimeInterval,
    selectedTimespan,
    showEthereumMainnet,
    showUsd,
    theme,
    timespans,
    zoomMax,
    zoomMin,
    zoomed,
    selectedMetric,
  ]);

  useEffect(() => {
    if (chartComponent.current) {
      if (!zoomed)
        chartComponent.current.xAxis[0].setExtremes(
          timespans[selectedTimespan].xMin,
          timespans[selectedTimespan].xMax,
        );
    }
  }, [selectedTimespan, timespans, zoomed]);

  const [intervalShown, setIntervalShown] = useState<{
    min: number;
    max: number;
    num: number;
    label: string;
  } | null>(null);

  const handleAfterSetExtremes = useCallback((e: any) => {
    console.log("handleAfterSetExtremes called", e.trigger);
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
  }, [selectedTimespan, timespans]);

  // const containerRef = useRef<HTMLDivElement>(null);

  const [containerRef, { width, height }] = useElementSizeObserver();

  const getChartHeight = useCallback(() => {
    if (is_embed) return height;
    if (isMobile) return 264;
    return 400;
  }, [isMobile, is_embed, height]);

  const options = useMemo((): Highcharts.Options => {
    const dynamicOptions: Highcharts.Options = {
      chart: {
        height: getChartHeight(),
        className: "zoom-chart",
        type: selectedScale === "percentage" ? "area" : "column",
        plotBorderColor: "transparent",
        panning: {
          enabled: is_embed ? false : true,
        },
        zooming: {
          type: is_embed ? undefined : "x",
          mouseWheel: {
            enabled: false,
          },
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
        events: {
          load: function() {
            const registry = initializePatterns(this, BACKEND_SIMULATION_CONFIG);
            this.options['patternRegistry'] = registry;
          },
          render: function() {
            const registry = this.options['patternRegistry'] as PatternRegistry;
            if(!registry) return;

            const series = this.series;

            series.forEach((series: any, index: number) => {
              const seriesOptions = series.options;
              const compositionType = seriesOptions.custom?.compositionType;
              
              if (!compositionType || !BACKEND_SIMULATION_CONFIG.compositionTypes[compositionType]) return;

              console.log("series", series.name, "compositionType", compositionType);
              
              const typeConfig = BACKEND_SIMULATION_CONFIG.compositionTypes[compositionType];
              if(typeConfig.fill.type === "gradient" || typeConfig.fill.type === "pattern") {
                registry.applyFillToSeries(index, `${series.name}_fill`);
              }

              if(typeConfig.mask) {
                registry.applyMaskToSeries(index, `${series.name}_mask`);
              }
            });
          },
          redraw: function() {
            const registry = this.options['patternRegistry'] as PatternRegistry;
            if(!registry) return;

            
            const series = this.series;

            series.forEach((series: any, index: number) => {
              const seriesOptions = series.options;
              const compositionType = seriesOptions.custom?.compositionType;
              
              if (!compositionType || !BACKEND_SIMULATION_CONFIG.compositionTypes[compositionType]) return;
              
              const typeConfig = BACKEND_SIMULATION_CONFIG.compositionTypes[compositionType];
              if(typeConfig.fill.type === "gradient" || typeConfig.fill.type === "pattern") {
                registry.applyFillToSeries(index, `${series.name}_fill`);
              }

              if(typeConfig.mask) {
                registry.applyMaskToSeries(index, `${series.name}_mask`);
              }
            });
          },
        },
        // height: isMobile ? 200 : 400,
      },
      plotOptions: {
        area: {
          stacking: selectedScale === "percentage" ? "percent" : "normal",
          animation: false,
          dataGrouping: {
            enabled: false,
          },
        },
        column: {
          animation: false,
          crisp: false,
          dataGrouping: {
            enabled: false,
          },
        },
      },
      legend: {
        enabled: false,
      },
      yAxis: {
        opposite: false,
        showFirstLabel: true,
        showLastLabel: true,
        type: selectedScale === "log" ? "logarithmic" : "linear",
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
        minorTicks: true,
        minorTickColor: "#CDD8D34C",
        minorTickPosition: "outside",
        minorTickLength: 3,
        minorTickWidth: 2,
        minorGridLineWidth: 0,
        tickColor: "#CDD8D34C",
        tickLength: 15,
        tickWidth: 1,
        offset: 0,
        minTickInterval: 30 * 24 * 3600 * 1000,
        minPadding: 0,
        maxPadding: 0,
        labels: {
          align: undefined,
          rotation: 0,
          allowOverlap: false,
          // staggerLines: 1,
          reserveSpace: true,
          overflow: "justify",
          useHTML: true,
          formatter: function (this: AxisLabelsFormatterContextObject) {
            // if Jan 1st, show year
            if (new Date(this.value).getUTCMonth() === 0) {
              return new Date(this.value).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                year: "numeric",
              });
            }
            return new Date(this.value).toLocaleDateString("en-GB", {
              timeZone: "UTC",
              month: isMobile ? "short" : "short",
              year: "numeric",
            });
          },
          y: 30,
          style: {
            fontSize: "10px",
            color: "#CDD8D3",
          },
        },
        events: {
          setExtremes: function(e: any) {
            const registry = this.options['patternRegistry'] as PatternRegistry;
            if(!registry) return;
            
            const series = this.series;

            series.forEach((series: any, index: number) => {
              const seriesOptions = series.options;
              const compositionType = seriesOptions.custom?.compositionType;
              
              if (!compositionType) return;
              
              const typeConfig = BACKEND_SIMULATION_CONFIG.compositionTypes[compositionType];
              console.log("series", series.name, "typeConfig", typeConfig);
              if(typeConfig.fill.type === "gradient" || typeConfig.fill.type === "pattern") {
                registry.applyFillToSeries(index, `${series.name}_fill`);
              }

              if(typeConfig.mask) {
                registry.applyMaskToSeries(index, `${series.name}_mask`);
              }
            });
          },
          afterSetExtremes: handleAfterSetExtremes,
        },
        min: zoomed ? zoomMin : timespans[selectedTimespan].xMin,
        max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
      },
      tooltip: {
        formatter: customTooltipFormatter,
        positioner: tooltipPositioner,
        split: false,
        followPointer: true,
        followTouchMove: true,
        backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
        borderRadius: 17,
        borderWidth: 0,
        padding: 0,
        outside: true,
        useHTML: true,
        shadow: {
          color: "black",
          opacity: 0.015,
          offsetX: 2,
          offsetY: 2,
        },
        style: {
          color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
        },
        enabled: isDragging ? false : true,
      },
      series: [
        ...filteredData
          .sort((a, b) => {
            if(!["main_l1", "main_l2"].includes(a.name)) {
              return BACKEND_SIMULATION_CONFIG.compositionTypes[b.name]!.order - BACKEND_SIMULATION_CONFIG.compositionTypes[a.name]!.order;
            }
            const aValue =
              a.data && a.data[a.data.length - 1]
                ? a.data[a.data.length - 1][1]
                : 0;
            const bValue =
              b.data && b.data[b.data.length - 1]
                ? b.data[b.data.length - 1][1]
                : 0;

            if (selectedScale === "percentage") {
              return aValue - bValue;
            } else {
              return bValue - aValue;
            }
          })
          .map((series: any, i: number) => {
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
              daily: 1 * 24 * 60 * 60 * 1000,
              weekly: 7 * 24 * 60 * 60 * 1000,
              monthly: 30 * 24 * 60 * 60 * 1000,
            };

            
            const pointsSettings =
              getSeriesType(series.name) === "column"
                ? {
                  pointPlacement: 0.5,
                  pointPadding: 0.15,
                  pointRange: timeIntervalToMilliseconds[metric],
                }
                : {
                  pointPlacement: 0.5,
                };

            let color: any = {
              linearGradient: {x1: 0, y1: 0, x2: 0, y2: 0},
              stops: [
                [0, "#000000"],
                [1, "#000000"],
              ],
              pattern: undefined,
            }
            let primaryColor = color.stops[0][1];

            let fill: any = undefined;

            // if gradient, get the color from the gradient
            if(BACKEND_SIMULATION_CONFIG.compositionTypes[series.name]?.fill?.config?.type === "linearGradient") {
              const config = BACKEND_SIMULATION_CONFIG.compositionTypes[series.name]?.fill?.config as GradientConfig;
              color.linearGradient = config.linearGradient;
              color.stops = config.stops;
              primaryColor = config.stops.map((stop: [number, string]) => stop[1])[0];
              fill = {
                linearGradient: config.linearGradient,
                stops: config.stops,
              }
            }
            // if pattern, get the color from the pattern
            if(BACKEND_SIMULATION_CONFIG.compositionTypes[series.name]?.fill?.config?.type === "colored-hash") {
              const config = BACKEND_SIMULATION_CONFIG.compositionTypes[series.name]?.fill?.config as PatternConfig;
              primaryColor = config.color;
              
            }

            // if(color !== undefined && fill === undefined) {
            //   fill = color;
            // }
            fill = undefined; //`url(#${series.name}_fill)`;
            color = `url(#${series.name}_fill)`;
            

            // console.log("series", series.name,"color", color, "fillColor", fillColor, "fillOpacity", fillOpacity, "marker", marker, "gradient", gradient)

            return {
              name: series.name,
              custom: {
                compositionType: series.name, // Reference to COMPOSITION_TYPES
              },
              // always show ethereum on the bottom
              zIndex: zIndex,
              step: "center",
              data: series.data.map((d: any) => [d[0], d[1]]),
              ...pointsSettings,
              clip: true,
              lineWidth: 1,
              borderRadiusTopLeft: borderRadius,
              borderRadiusTopRight: borderRadius,
              type: getSeriesType(series.name),
              // color: undefined, // Use gradient from composition type
              // fillColor: undefined, // Use gradient from composition type
              color: color,
              fillColor: fill,
              states: {
                hover: {
                  enabled: true,
                    halo: {
                      size: 5,
                      opacity: 1,
                      attributes: {
                        fill:
                          primaryColor + "99",
                        stroke:
                          primaryColor + "66",
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
              pointPlacement: pointsSettings.pointPlacement,
              // marker: {
              //   lineColor: primaryColor,
              //   radius: 2,
              //   symbol: "circle",
              // },
              // fillColor: series.name === "cross_layer" ? {pattern: seriesPattern} : fillColor,
              // fillOpacity: fillOpacity,
            };
          }),
      ],
      // stockchart options
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

    return merge({}, baseChartOptions, dynamicOptions);
    // return { ...baseOptions };
  }, [getChartHeight, selectedScale, is_embed, theme, handleAfterSetExtremes, zoomed, zoomMin, timespans, selectedTimespan, zoomMax, customTooltipFormatter, tooltipPositioner, isDragging, filteredData, isMobile, showEthereumMainnet, getSeriesType, metric]);

  useEffect(() => {
    if (chartComponent.current) {
      if (is_embed) {
        return;
      }

      if (isMobile) {
        chartComponent.current.setSize(null, 284, false);
        return;
      }

      chartComponent.current.setSize(null, 400, false);
    }
  }, [isMobile, is_embed]);

  useEffect(() => {
    if (chartComponent.current) {
      chartComponent.current.setSize(width, getChartHeight(), true);
    }
  }, [is_embed, width, height, getChartHeight, isSidebarOpen]);

  if (is_embed)
    return (
      <EmbedContainer
        title="User Base"
        icon="gtp:gtp-pie"
        url="https://www.growthepie.xyz"
        time_frame={timespans[selectedTimespan].label}
        chart_type={selectedMetric}
        aggregation={selectedScale}
      >
        <div className="h-full w-full rounded-xl" ref={containerRef}>
          {highchartsLoaded ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={options}
              constructorType={"stockChart"}
              ref={(chart) => {
                chartComponent.current = chart?.chart;
              }}
            />
          ) : (
            <div className="w-full flex-1 my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
          <div className="absolute bottom-[48.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
            <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
          </div>
          {filteredData.length === 0 && (
            <div className="absolute top-[calc(50%+2rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
              No chain(s) selected for comparison. Please select at least one.
            </div>
          )}
          {/* </div> */}
        </div>
      </EmbedContainer>
    );

  return (
    <div
      id="content-container"
      className={`w-full h-full flex flex-col justify-between `}
    >
      <div
        className={`h-[225px] lg:h-[81px] 2xl:h-[60px] ${isMobile ? "mb-[30px]" : "mb-0"
          }`}
      >
        <div className="flex flex-col lg:hidden justify-center pb-[15px] gap-y-[5px]">
          <MobileMetricCard
            icon="gtp-users"
            metric_name="Active Addresses"
            metric_value={latest_total}
            metric_comparison={latest_total_comparison}
            theme={theme || "dark"}
          />
          <div className="flex justify-center gap-x-[5px]">
            <MobileMetricCard
              icon="gtp-walletsmultiplechains"
              metric_name="Multi-Chain Users"
              metric_value={cross_chain_users}
              metric_comparison={cross_chain_users_comparison}
              theme={theme || "dark"}
            />
            <MobileMetricCard
              icon="gtp-layers"
              metric_name="L2 Dominance"
              metric_value={(Math.round(l2_dominance * 100) / 100).toFixed(2)}
              metric_comparison={l2_dominance_comparison}
              theme={theme || "dark"}
              is_multiple
            />
          </div>
        </div>
        <TopRowContainer className="!flex-col !rounded-[15px] !py-[3px] !px-[3px] !text-xs  2xl:!gap-y-0 2xl:!text-base 2xl:!flex 2xl:!flex-row 2xl:!rounded-full">
          <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px]">
            <TopRowChild
              isSelected={showTotalUsers}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(true);
                setSelectedScale("absolute");
                setSelectedMetric("Total Ethereum Ecosystem");
              }}
            >
              <div className="flex items-center gap-x-[5px]">
                <GTPIcon icon="gtp-metrics-ethereum-ecosystem" className="w-4 h-4" />
                <div>Total Ethereum Ecosystem</div>
              </div>
            </TopRowChild>
            <TopRowChild
              isSelected={"absolute" === selectedScale && !showTotalUsers}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(false);
                setSelectedScale("absolute");
                setSelectedMetric("Composition");
              }}
            >
              <div className="flex items-center gap-x-[5px]">
                <GTPIcon icon="gtp-metrics-chains-grouping" className="w-4 h-4" />
                <div>Composition</div>
              </div>
             
            </TopRowChild>

            <TopRowChild
              isSelected={"percentage" === selectedScale}
              className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
              onClick={() => {
                setShowTotalUsers(false);
                setSelectedScale("percentage");
                setSelectedMetric("Composition Split");
              }}
            >
              <div className="flex items-center gap-x-[5px]">
                <GTPIcon icon="gtp-metrics-chains-percentage" size="md" />
                <div>Composition Split</div>
              </div>
           
            </TopRowChild>
          </TopRowParent>
          <div className="block 2xl:hidden w-[70%] mx-auto my-[10px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <TopRowParent className="!w-full 2xl:!w-auto !justify-between 2xl:!justify-center !items-stretch 2xl:!items-center !mx-4 2xl:!mx-0 !gap-x-[4px] 2xl:!gap-x-[5px]">
            {!zoomed ? (
              Object.keys(timespans).map((timespan) => (
                <TopRowChild
                  key={timespan}
                  className={"!px-[16px] !py-[4px] !grow !text-sm 2xl:!text-base 2xl:!px-4 2xl:!py-[14px] 3xl:!px-6 3xl:!py-4"}
                  //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
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
                    // if (zoomed)
                    //   setZoomed(false);
                  }}
                >
                  {timespans[timespan].label}
                </TopRowChild>
              ))
            ) : (
              <>
                <button
                  className={`rounded-full flex items-center justify-center space-x-3 px-4 py-1.5 2xl:py-3 text-md w-full 2xl:w-auto 2xl:px-4 2xl:text-md font-medium border-[1px] border-forest-800`}
                  onClick={() => {
                    setZoomed(false);
                  }}
                >
                  <Icon
                    icon="feather:zoom-out"
                    className="h-4 w-4 2xl:w-4 2xl:h-4"
                  />
                  <div>Reset Zoom</div>
                </button>
                <button
                  className={`rounded-full text-md w-full 2xl:w-auto px-4 py-1.5 2xl:py-3.5 2xl:px-4 font-medium bg-forest-100 dark:bg-forest-1000`}
                >
                  {intervalShown?.label}
                </button>
              </>
            )}
          </TopRowParent>
        </TopRowContainer>
      </div>
      <div className="flex-1 min-h-0 w-full pb-4 pt-[30px] md:pt-[15px] xl:pt-[5px] md:pb-[5px] ">
        <div
          className="relative h-[284px] md:h-[400px] w-full rounded-xl"
          ref={containerRef}
        >
          {highchartsLoaded ? (
            <HighchartsReact
              // containerProps={{ style: { cursor: "url('cursors/zoom.svg') 14.5 14.5, pointer" } }}
              highcharts={Highcharts}
              options={options}
              constructorType={"stockChart"}
              ref={(chart) => {
                chartComponent.current = chart?.chart;
              }}
            />
          ) : (
            <div className="w-full flex-1 my-4 flex justify-center items-center">
              <div className="w-10 h-10 animate-spin">
                <Icon
                  icon="feather:loader"
                  className="w-10 h-10 text-forest-500"
                />
              </div>
            </div>
          )}
          <div className="absolute bottom-[56.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
            <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
          </div>
          {filteredData.length === 0 && (
            <div className="absolute top-[calc(50%+2rem)] left-[0px] text-xs font-medium flex justify-center w-full text-forest-500/60">
              No chain(s) selected for comparison. Please select at least one.
            </div>
          )}
          {/* </div> */}
        </div>

      </div>
      <div className="pb-[69px]">
        <div className="h-[32px] lg:h-[44px] flex flex-col justify-start ">
          <div className="flex justify-between items-center rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 relative h-[44px]">
            {/* toggle ETH */}
            <div>
              <div className={`z-10 pl-0 lg:pl-[10px] ${focusEnabled ? "flex items-center" : "hidden"}`} >
                <Switch
                  checked={showEthereumMainnet}
                  onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
                />
                <div className="ml-2 block md:hidden xl:block heading-small-xs">
                  Compare Ethereum
                </div>
                <div className={`ml-2 hidden md:block xl:hidden heading-small-xs`}>
                  Compare ETH
                </div>
              </div>
              <div className={`${focusEnabled ? "hidden" : "flex"} items-center`}>

                <Tooltip placement="right" allowInteract >
                  <TooltipTrigger>
                    <div className={`bottom-[28px] right-[8px] p-0 -mr-0.5 lg:p-1.5 z-10 lg:mr-0 absolute lg:static lg:mb-0.5`}>
                      <Icon icon="feather:info" className="w-6 h-6" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                      <div className="flex flex-col items-center">
                          <div className="p-[15px] text-sm bg-forest-100 dark:bg-[#1F2726] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                            <div className="heading-small-xs">Ethereum showing vs Not</div>
                            <div className="text-xxs text-wrap">
                                Something something something ..... admo
                            </div>
                          </div>
                      </div>
                    </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="flex justify-end items-center absolute top-[56px] lg:-top-[10px] right-[20px] rounded-full z-10">
              <div className="flex justify-center items-center">
                <div className="flex items-center justify-center gap-x-[20px] pr-[10px]">
                  <MetricCard
                    icon="gtp-users"
                    metric_name="Active Addresses"
                    metric_value={latest_total}
                    metric_comparison={latest_total_comparison}
                    theme={theme || "dark"}
                  />
                  <MetricCard
                    icon="gtp-walletsmultiplechains"
                    metric_name="Active on Multiple Chains"
                    metric_value={cross_chain_users}
                    metric_comparison={cross_chain_users_comparison}
                    theme={theme || "dark"}
                  />
                  <MetricCard
                    icon="gtp-layers"
                    metric_name="Layer 2 Dominance"
                    metric_value={(Math.round(l2_dominance * 100) / 100).toFixed(
                      2,
                    )}
                    metric_comparison={l2_dominance_comparison}
                    theme={theme || "dark"}
                    is_multiple
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MobileMetricCard = ({
  icon,
  metric_name,
  metric_value,
  metric_comparison,
  is_multiple = false,
  theme,
}: {
  icon: GTPIconName;
  metric_name: string;
  metric_value: number | string;
  metric_comparison: number;
  is_multiple?: boolean;
  theme: string;
}) => {
  return (
    <div className="flex bg-forest-200/10 dark:bg-[#CDD8D3]/20 backdrop-blur-[30px] rounded-[15px] px-[7px] pt-[10px] pb-[7px] items-center w-full">
      <div className="flex flex-col items-center flex-1">
        <GTPIcon icon={icon} size="md" />
        <div className="block text-[10px] font-medium leading-[1.5] text-center">
          {metric_name}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-7/12 gap-y-[3px]">
        <div className="numbers-xl font-[650] py-[5px] flex items-end">
          <div className="numbers-xl">
            {metric_value.toLocaleString("en-GB")}
          </div>
          <div className="numbers-xl">{is_multiple && "x"}</div>
        </div>
        <div className="text-[10px] font-medium leading-[1.5]">
          {metric_comparison > 0 ? (
            <span
              className="text-green-500 dark:text-green-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              +{(metric_comparison * 100).toFixed(2)}%
            </span>
          ) : (
            <span
              className="text-red-500 dark:text-red-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              {(metric_comparison * 100).toFixed(2)}%
            </span>
          )}{" "}
          in last week
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({
  icon,
  metric_name,
  metric_value,
  metric_comparison,
  is_multiple = false,
  theme,
}: {
  icon: GTPIconName;
  metric_name: string;
  metric_value: number | string;
  metric_comparison: number;
  is_multiple?: boolean;
  theme: string;
}) => {
  return (
    <div className="hidden lg:flex gap-x-[6px] bg-forest-200/10 dark:bg-[#CDD8D3]/20 rounded-[11px] px-[13px] py-[5px] items-center backdrop-blur-[30px]">
      <GTPIcon icon={icon} size="md" />
      <div className="flex flex-col items-center justify-center -space-y-[5px]">
        <div className="text-[10px] font-medium leading-[1.5]">
          {metric_name}
        </div>
        <div className="numbers-2xl font-[650] flex items-end pt-[5px] pb-[8px]">
          <div className="">
            {metric_value.toLocaleString("en-GB")}
          </div>
          <span className="numbers-2xl">{is_multiple && "x"}</span>
        </div>
        <div className="numbers-xxs font-medium">
          {metric_comparison > 0 ? (
            <span
              className="text-green-500 dark:text-green-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              +{(metric_comparison * 100).toFixed(2)}%
            </span>
          ) : (
            <span
              className="text-red-500 dark:text-red-500 font-semibold"
              style={{
                textShadow:
                  theme === "dark"
                    ? "1px 1px 4px #00000066"
                    : "1px 1px 4px #ffffff99",
              }}
            >
              {(metric_comparison * 100).toFixed(2)}%
            </span>
          )}{" "}
          <span className="font-raleway">in last week</span>
        </div>
      </div>
    </div>
  );
};
