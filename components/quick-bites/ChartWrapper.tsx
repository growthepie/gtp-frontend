// File: components/quick-bites/ChartWrapper.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "@/lib/echarts-setup";
import type { EChartsOption } from "echarts";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Tooltip,
  LineSeries,
  AreaSeries,
  ColumnSeries,
  PieSeries,
  Series
} from 'react-jsx-highcharts';
import highchartsAnnotations from 'highcharts/modules/annotations';
import highchartsRoundedCorners from 'highcharts-rounded-corners';
import highchartsPatternFill from 'highcharts/modules/pattern-fill';
import { debounce } from 'lodash';
import { useTheme } from 'next-themes';
import ChartWatermark from '@/components/layout/ChartWatermark';
import { useMaster } from '@/contexts/MasterContext';
import GTPChart, { GTPChartSeries, GTPChartXAxisLine } from "@/components/GTPButton/GTPChart";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPButtonDropdown from "@/components/GTPButton/GTPButtonDropdown";
import ShareDropdownContent from "@/components/layout/FloatingBar/ShareDropdownContent";
import { downloadElementAsImage } from "@/components/GTPButton/chartSnapshotHelpers";
import { getGTPTooltipContainerClass } from "@/components/tooltip/tooltipShared";
import "@/app/highcharts.axis.css";
import { GTPIcon } from "../layout/GTPIcon";
import { Icon } from "@iconify/react";
import type { AxisLabelsFormatterContextObject } from 'highcharts';
import dayjs from "@/lib/dayjs";
import { format as d3Format } from "d3"

let highchartsInitialized = false;
interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'column' | 'pie' | 'scatter';
  data: any;
  margins?: "none" | "normal";
  options?: any;
  width?: number | string;
  height?: number | string;
  disableTooltipSort?: boolean;
  title?: string;
  subtitle?: string;
  jsonData?: any;
  centerName?: string;
  pieData?: { name: string; y: number; color: string; tooltipDecimals?: number }[];
  showPiePercentage?: boolean;
  yAxisLine?: {
    xValue: number;
    annotationPositionY: number;
    annotationPositionX: number;
    annotationText: string;
    lineStyle?: "solid" | "dashed" | "dotted" | "dashdot" | "longdash" | "longdashdot";
    lineColor?: string;
    textColor?: string;
    lineWidth?: number;
    textFontSize?: string;
    backgroundColor?: string;
  }[];
  jsonMeta?: {
    meta: {
      type?: string,
      name: string,
      color: string,
      stacking?: "normal" | "percent" | null;
      xIndex: number,
      yIndex: number,
      oppositeYAxis?: boolean,
      suffix?: string,
      prefix?: string,
      tooltipDecimals?: number,
      dashStyle?: Highcharts.DashStyleValue,
      makeNegative?: boolean,
      yMultiplication?: number,
      aggregation?: "daily" | "weekly" | "monthly",
      deselected?: boolean,
    }[]
  }
  seeMetricURL?: string | null;
  showXAsDate?: boolean;
  showZeroTooltip?: boolean;
  showTotalTooltip?: boolean;
  useNewChart?: boolean;
  snapToCleanBoundary?: boolean;
  timeAxisTickIntervalDays?: number;
  timeAxisTickAlignToCleanBoundary?: boolean;
  timeAxisBarEdgePaddingRatio?: number;
  isChainQuickBitesTabChart?: boolean;
  defaultFilteredSeriesNames?: string[];
  top10ByMetric?: string;
  scatterTrendline?: {
    enabled?: boolean;
    label?: string;
    color?: string;
  };
  chainQuickBitesTopBar?: React.ReactNode;
  quickBiteTabRightEdgeFlush?: boolean;
  quickBiteTabLeftEdgeFlush?: boolean;
}

const normalizeSeriesLabel = (value: string) => value.toLowerCase().replace(/[\s:_-]+/g, "");
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_CHAIN_SERIES_LIMIT = 10;
const DEFAULT_SCATTER_TRENDLINE_LABEL = "Trendline";
const SCATTER_TRENDLINE_X_AXIS_BUFFER_RATIO = 0.12;
const SCATTER_TRENDLINE_X_AXIS_BUFFER_RATIO_CHAIN_TAB = 0.24;
const CHAIN_QUICKBITES_HEADER_ICON = "gtp-quick-bites-monochrome" as const;
const DEFAULT_SCATTER_TOOLTIP_CONTAINER_CLASS = getGTPTooltipContainerClass(
  "fit",
  "mt-3 mr-3 mb-3 min-w-60 md:min-w-60 max-w-[min(92vw,420px)] gap-y-[2px] py-[15px] pr-[15px] bg-color-bg-default",
);
const mapToGTPSeriesType = (value: string | undefined, fallback: ChartWrapperProps["chartType"]): GTPChartSeries["seriesType"] => {
  const normalized = (value || fallback || "line").toLowerCase();
  if (normalized === "column" || normalized === "bar") return "bar";
  if (normalized === "area") return "area";
  return "line";
};
const mapToEChartsAxisType = (value: string | undefined): "value" | "time" | "log" => {
  if (!value) return "value";
  const normalized = value.toLowerCase();
  if (normalized === "datetime" || normalized === "time") return "time";
  if (normalized === "log" || normalized === "logarithmic") return "log";
  return "value";
};
const mapToEChartsYAxisType = (value: string | undefined): "value" | "log" => {
  if (!value) return "value";
  const normalized = value.toLowerCase();
  if (normalized === "log" || normalized === "logarithmic") return "log";
  return "value";
};

const isStackingMode = (stacking: unknown): stacking is "normal" | "percent" =>
  stacking === "normal" || stacking === "percent";

const getFirstSeriesTimestamp = (processedData: any): number => {
  if (!Array.isArray(processedData)) return Number.POSITIVE_INFINITY;

  const firstNonZeroPoint = processedData.find((point: any) => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [timestamp, value] = point;
    return Number.isFinite(Number(timestamp)) && typeof value === "number" && Number.isFinite(value) && value !== 0;
  });

  if (firstNonZeroPoint) {
    return Number(firstNonZeroPoint[0]);
  }

  const firstNumericPoint = processedData.find((point: any) => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const [timestamp, value] = point;
    return Number.isFinite(Number(timestamp)) && typeof value === "number" && Number.isFinite(value);
  });

  return firstNumericPoint ? Number(firstNumericPoint[0]) : Number.POSITIVE_INFINITY;
};

const trimLeadingZeroValues = (seriesData: Array<[number, number | null]>): Array<[number, number | null]> => {
  if (!Array.isArray(seriesData) || seriesData.length === 0) {
    return seriesData;
  }

  const firstNonZeroIndex = seriesData.findIndex((point) => {
    if (!Array.isArray(point) || point.length < 2) return false;
    const value = point[1];
    return typeof value === "number" && Number.isFinite(value) && value !== 0;
  });

  return seriesData.map((point, index) => {
    if (index >= firstNonZeroIndex && firstNonZeroIndex !== -1) {
      return point;
    }

    const timestamp = Number(point?.[0]);
    const value = point?.[1];
    if (!Number.isFinite(timestamp) || typeof value !== "number" || !Number.isFinite(value)) {
      return point;
    }

    return [timestamp, null];
  });
};

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  margins = "normal",
  options = {},
  width = '100%',
  height = 400,
  title,
  subtitle,
  // stacking,
  jsonData,
  jsonMeta,
  yAxisLine,
  seeMetricURL,
  showXAsDate = false,
  disableTooltipSort = false,
  showZeroTooltip = true,
  showTotalTooltip = false,
  useNewChart = true,
  snapToCleanBoundary,
  timeAxisTickIntervalDays,
  timeAxisTickAlignToCleanBoundary,
  timeAxisBarEdgePaddingRatio,
  centerName,
  pieData,
  showPiePercentage = false,
  isChainQuickBitesTabChart = false,
  defaultFilteredSeriesNames = [],
  top10ByMetric,
  scatterTrendline,
  chainQuickBitesTopBar,
  quickBiteTabRightEdgeFlush = false,
  quickBiteTabLeftEdgeFlush = false,
}) => {
  const chartRef = useRef<any>(null);
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const { AllChainsByKeys, chains } = useMaster();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredNames, setFilteredNames] = useState<string[]>(() => {
    const deselectedSeries = jsonMeta?.meta?.filter((s) => s.deselected) ?? [];
    if (deselectedSeries.length === 0) return [];
    return (jsonMeta?.meta ?? []).filter((s) => !s.deselected).map((s) => s.name);
  });
  const [isScatterTrendlineVisible, setIsScatterTrendlineVisible] = useState(true);
  const [hoverLegendSeriesName, setHoverLegendSeriesName] = useState<string | null>(null);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
  const themeMode: "dark" | "light" = theme === "light" ? "light" : "dark";
  const scatterTrendlineLabel =
    typeof scatterTrendline?.label === "string" && scatterTrendline.label.trim().length > 0
      ? scatterTrendline.label.trim()
      : DEFAULT_SCATTER_TRENDLINE_LABEL;
  const isScatterTrendlineEnabled = chartType === "scatter" && scatterTrendline?.enabled === true;
  const scatterTrendlineColor =
    typeof scatterTrendline?.color === "string" && scatterTrendline.color.trim().length > 0
      ? scatterTrendline.color
      : theme === "dark"
        ? "rgba(215, 223, 222, 0.9)"
        : "rgba(41, 51, 50, 0.9)";
  const scatterTrendlineTextColor = theme === "dark" ? "#CDD8D3" : "#293332";
  const scatterTrendlineLabelBackground =
    theme === "dark" ? "rgba(42, 52, 51, 0.92)" : "rgba(234, 236, 235, 0.96)";

  const chainColorByAlias = useMemo(() => {
    const map = new Map<string, string>();
    const chains = Object.values(AllChainsByKeys || {});

    chains.forEach((chain) => {
      const color = chain?.colors?.[themeMode]?.[0]
        || chain?.colors?.dark?.[0]
        || chain?.colors?.light?.[0];

      if (!color) return;

      const aliases = [chain.key, chain.urlKey, chain.label, chain.name_short]
        .filter(Boolean)
        .map((alias) => normalizeSeriesLabel(String(alias)));

      aliases.forEach((alias) => {
        if (!map.has(alias)) {
          map.set(alias, color);
        }
      });
    });

    return map;
  }, [AllChainsByKeys, themeMode]);

  const resolveSeriesColor = useCallback((series: any) => {
    if (typeof series?.color === "string" && series.color.trim().length > 0) {
      return series.color;
    }

    const aliases = [series?.name, series?.key, series?.urlKey]
      .filter(Boolean)
      .map((alias) => normalizeSeriesLabel(String(alias)));

    for (const alias of aliases) {
      const resolved = chainColorByAlias.get(alias);
      if (resolved) return resolved;
    }

    return "#999999";
  }, [chainColorByAlias]);

  const formatNumber = useCallback(
    (value: number | string, isAxis = false, selectedScale = "normal") => {
      const val = parseFloat(value as string);
      const absVal = Math.abs(val);

      // Default: compact SI formatting with 2 significant digits
      let number = d3Format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          // Always max 2 decimals for percentages
          number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (absVal === 0) {
            number = "0";
          } else if (absVal < 1) {
            // Small values: cap at 2 decimal places
            number = val.toFixed(2);
          } else {
            // All other axis values: SI with max 2 significant digits
            number = d3Format(".2~s")(val).replace(/G/, "B");
          }
        }
      }

      return `${number}`;
    },
    [],
  );
  const formatScatterRatio = useCallback((
    ratio: number | null,
    units?: { prefix?: string; suffix?: string },
  ) => {
    if (ratio === null || !Number.isFinite(ratio)) return "N/A";

    const absRatio = Math.abs(ratio);
    const decimals = absRatio > 0 && absRatio < 0.01 ? 4 : 2;
    const prefix = units?.prefix ?? "";
    const suffix = units?.suffix ?? "";

    const formattedRatio = ratio.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${prefix}${formattedRatio}${suffix}`;
  }, []);

  const processedSeriesData = useMemo(() => {
    if (!jsonMeta?.meta || !jsonData) return [];
    
    return jsonMeta.meta.map((series: any, index: number) => ({
      ...series,
      color: resolveSeriesColor(series),
      processedData: (() => {
        let rawData = jsonData[index]?.map((item: any) => [
          item[series.xIndex],
          item[series.yIndex]
        ]) || [];

        // Apply transformations (multiplication, negation) if specified
        rawData = rawData.map(([x, y]) => {
          if (y === null || y === undefined) return [x, null];

          let transformedY = y;

          if (typeof series.yMultiplication === "number") {
            transformedY = transformedY * series.yMultiplication;
          }

          if (series.makeNegative) {
            transformedY = -transformedY;
          }

          return [x, transformedY];
        });

        // Apply aggregation if specified
        if (series.aggregation && series.aggregation !== "daily") {
          const aggregated = new Map<string, { sum: number; count: number; firstTimestamp: number }>();
          
          // Filter out null values for aggregation
          const validData = rawData.filter(([x, y]) => y !== null && y !== undefined);
          
          if (validData.length === 0) {
            return rawData;
          }
          
          validData.forEach(([timestamp, value]) => {
            let key: string;
            if (series.aggregation === "weekly") {
              // Group by calendar weeks (week starts on Monday)
              const date = new Date(timestamp);
              const weekStart = new Date(date);
              const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
              // Convert to Monday-based: Monday = 0, Tuesday = 1, ..., Sunday = 6
              const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              weekStart.setUTCDate(date.getUTCDate() - mondayOffset); // Go back to Monday
              weekStart.setUTCHours(0, 0, 0, 0);
              key = weekStart.getTime().toString();
            } else if (series.aggregation === "monthly") {
              // Group by calendar month (year-month)
              const date = new Date(timestamp);
              const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
              monthStart.setUTCHours(0, 0, 0, 0);
              key = monthStart.getTime().toString();
            } else {
              return; // Unknown aggregation, skip
            }
            
            if (!aggregated.has(key)) {
              aggregated.set(key, { sum: 0, count: 0, firstTimestamp: timestamp });
            }
            
            const bucket = aggregated.get(key)!;
            bucket.sum += value;
            bucket.count += 1;
          });
          
          // Convert aggregated map to array, summing values for each period
          rawData = Array.from(aggregated.entries()).map(([key, bucket]) => [
            parseInt(key), // Use the period start timestamp
            bucket.sum // Sum of all values in the period
          ]).sort((a, b) => a[0] - b[0]); // Sort by timestamp
        }

        return trimLeadingZeroValues(rawData as Array<[number, number | null]>);
      })()
    }));
  }, [jsonMeta, jsonData, resolveSeriesColor]);

  const shouldSortStackedSeriesByAge = useMemo(() => {
    return (jsonMeta?.meta ?? []).some((series) => isStackingMode(series?.stacking));
  }, [jsonMeta?.meta]);

  const orderedSeriesEntries = useMemo(() => {
    if (!jsonMeta?.meta) return [];

    const baseEntries = jsonMeta.meta.map((series, index) => {
      const processedData = processedSeriesData[index]?.processedData ?? [];
      return {
        series,
        originalIndex: index,
        processedData,
        firstTimestamp: getFirstSeriesTimestamp(processedData),
      };
    });

    if (!shouldSortStackedSeriesByAge) {
      return baseEntries;
    }

    const sortStackGroup = (groupEntries: typeof baseEntries) => {
      const stackedEntries = groupEntries
        .filter((entry) => isStackingMode(entry.series?.stacking))
        .sort((a, b) => {
          if (a.firstTimestamp !== b.firstTimestamp) {
            return a.firstTimestamp - b.firstTimestamp;
          }
          return a.originalIndex - b.originalIndex;
        });

      const nonStackedEntries = groupEntries.filter((entry) => !isStackingMode(entry.series?.stacking));
      return [...stackedEntries, ...nonStackedEntries];
    };

    const primaryEntries = baseEntries.filter((entry) => !entry.series?.oppositeYAxis);
    const secondaryEntries = baseEntries.filter((entry) => entry.series?.oppositeYAxis === true);

    return [...sortStackGroup(primaryEntries), ...sortStackGroup(secondaryEntries)];
  }, [jsonMeta?.meta, processedSeriesData, shouldSortStackedSeriesByAge]);

  const normalizedTop10MetricKey = useMemo(
    () => normalizeSeriesLabel(top10ByMetric?.trim() || ""),
    [top10ByMetric],
  );
  const chainDeploymentByAlias = useMemo(() => {
    const map = new Map<string, boolean>();

    Object.entries(chains || {}).forEach(([chainKey, chain]) => {
      const isProd = chain?.deployment === "PROD";
      const aliases = [chainKey, chain?.url_key, chain?.name, chain?.name_short]
        .filter((alias): alias is string => typeof alias === "string" && alias.trim().length > 0)
        .map((alias) => normalizeSeriesLabel(alias));

      aliases.forEach((alias) => {
        const existing = map.get(alias);
        if (existing === true) return;
        map.set(alias, isProd);
      });
    });

    return map;
  }, [chains]);

  const baseSeriesEntriesForRendering = useMemo(() => {
    if (orderedSeriesEntries.length > 0) {
      return orderedSeriesEntries.map((entry) => ({
        ...entry,
        series: {
          ...entry.series,
          color: resolveSeriesColor(entry.series),
        },
      }));
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((series: any, index: number) => ({
      series: {
        ...series,
        color: resolveSeriesColor(series),
      },
      originalIndex: index,
      processedData: Array.isArray(series?.data) ? series.data : [],
      firstTimestamp: getFirstSeriesTimestamp(Array.isArray(series?.data) ? series.data : []),
    }));
  }, [data, orderedSeriesEntries, resolveSeriesColor]);

  const topRankedSeriesNameSet = useMemo(() => {
    if (!normalizedTop10MetricKey) {
      return null;
    }

    const optionsXAxisTitle = normalizeSeriesLabel(String(options?.xAxis?.title?.text || ""));
    const optionsPrimaryYAxisTitle = normalizeSeriesLabel(
      String((Array.isArray(options?.yAxis) ? options?.yAxis?.[0] : options?.yAxis)?.title?.text || ""),
    );
    const optionsSecondaryYAxisTitle = normalizeSeriesLabel(
      String((Array.isArray(options?.yAxis) ? options?.yAxis?.[1] : undefined)?.title?.text || ""),
    );

    const scatterMetricAxis: "x" | "y" = (() => {
      const xMetricMatches =
        normalizedTop10MetricKey === "x" ||
        normalizedTop10MetricKey === "xaxis" ||
        normalizedTop10MetricKey === optionsXAxisTitle ||
        normalizedTop10MetricKey.includes("activeaddress") ||
        normalizedTop10MetricKey.includes("users");

      const yMetricMatches =
        normalizedTop10MetricKey === "y" ||
        normalizedTop10MetricKey === "yaxis" ||
        normalizedTop10MetricKey === optionsPrimaryYAxisTitle ||
        normalizedTop10MetricKey === optionsSecondaryYAxisTitle ||
        normalizedTop10MetricKey.includes("txcount") ||
        normalizedTop10MetricKey.includes("transaction");

      if (xMetricMatches && !yMetricMatches) return "x";
      return "y";
    })();

    const scoredSeries = baseSeriesEntriesForRendering
      .map(({ series, processedData }) => {
        const seriesName = typeof series?.name === "string" ? series.name : "";
        if (!seriesName) {
          return null;
        }
        const seriesAliases = [series?.name, series?.key, series?.urlKey]
          .filter((alias): alias is string => typeof alias === "string" && alias.trim().length > 0)
          .map((alias) => normalizeSeriesLabel(alias));

        const matchedDeploymentFlags = seriesAliases
          .map((alias) => chainDeploymentByAlias.get(alias))
          .filter((value): value is boolean => typeof value === "boolean");

        const isKnownChain = matchedDeploymentFlags.length > 0;
        const isProdChain = matchedDeploymentFlags.some((value) => value === true);
        if (isKnownChain && !isProdChain) {
          return null;
        }

        const rawSeriesMetricCandidates: unknown[] = [];

        if (top10ByMetric && typeof series?.[top10ByMetric] !== "undefined") {
          rawSeriesMetricCandidates.push(series[top10ByMetric]);
        }

        if (typeof series?.metrics === "object" && series.metrics !== null) {
          const normalizedMetricEntry = Object.entries(series.metrics as Record<string, unknown>).find(
            ([metricKey]) => normalizeSeriesLabel(metricKey) === normalizedTop10MetricKey,
          );
          if (normalizedMetricEntry) {
            rawSeriesMetricCandidates.push(normalizedMetricEntry[1]);
          }
        }

        const directSeriesMetric = rawSeriesMetricCandidates
          .map((value) => Number(value))
          .find((value) => Number.isFinite(value));

        if (typeof directSeriesMetric === "number" && Number.isFinite(directSeriesMetric)) {
          return { name: seriesName, value: directSeriesMetric };
        }

        const points = (Array.isArray(processedData) ? processedData : [])
          .filter((point: any) => Array.isArray(point) && point.length >= 2)
          .map((point: any) => [Number(point[0]), Number(point[1])])
          .filter(([xValue, yValue]: [number, number]) => Number.isFinite(xValue) && Number.isFinite(yValue));

        if (!points.length) {
          return null;
        }

        if (chartType === "scatter") {
          const lastPoint = points[points.length - 1];
          const value = scatterMetricAxis === "x" ? lastPoint[0] : lastPoint[1];
          return Number.isFinite(value) ? { name: seriesName, value } : null;
        }

        if (normalizedTop10MetricKey.includes("sum")) {
          const sumValue = points.reduce((sum, [, yValue]) => sum + yValue, 0);
          return Number.isFinite(sumValue) ? { name: seriesName, value: sumValue } : null;
        }

        const latestValue = points[points.length - 1][1];
        return Number.isFinite(latestValue) ? { name: seriesName, value: latestValue } : null;
      })
      .filter((entry): entry is { name: string; value: number } => Boolean(entry))
      .sort((a, b) => b.value - a.value);

    if (!scoredSeries.length) {
      return null;
    }

    return new Set(scoredSeries.slice(0, TOP_CHAIN_SERIES_LIMIT).map((entry) => entry.name));
  }, [
    baseSeriesEntriesForRendering,
    chainDeploymentByAlias,
    chartType,
    normalizedTop10MetricKey,
    options?.xAxis?.title?.text,
    options?.yAxis,
    top10ByMetric,
  ]);

  const seriesEntriesForRendering = useMemo(() => {
    if (!topRankedSeriesNameSet) {
      return baseSeriesEntriesForRendering;
    }

    return baseSeriesEntriesForRendering.filter(({ series }) =>
      typeof series?.name === "string" && topRankedSeriesNameSet.has(series.name),
    );
  }, [baseSeriesEntriesForRendering, topRankedSeriesNameSet]);

  const filteredSeries = useMemo(() => {
    return seriesEntriesForRendering
      .filter(({ series }) => filteredNames.length === 0 || filteredNames.includes(series.name))
      .map(({ series, processedData }) => ({
        ...series,
        processedData,
      }));
  }, [filteredNames, seriesEntriesForRendering]);

  const renderWithGTPChart = useMemo(() => {
    return useNewChart && chartType !== "pie" && chartType !== "scatter" && seriesEntriesForRendering.length > 0;
  }, [chartType, seriesEntriesForRendering.length, useNewChart]);

  const gtpSeries = useMemo<GTPChartSeries[]>(() => {
    if (!renderWithGTPChart || seriesEntriesForRendering.length === 0) return [];

    return seriesEntriesForRendering.flatMap(({ series, processedData }) => {
      if (!Array.isArray(processedData)) return [];

      const axisIndex: 0 | 1 = series.oppositeYAxis ? 1 : 0;

      // `processedData` is derived from `jsonData` as `[x, y]` pairs where `y` can be null.
      // Cast is safe because we normalize `null` values in `processedSeriesData` below.
      const data = processedData as [number, number | null][];

      return [
        {
          name: series.name,
          data,
          color: series.color,
          yAxisIndex: axisIndex,
          seriesType: mapToGTPSeriesType(series.type, chartType),
        } satisfies GTPChartSeries,
      ];
    }).filter((series) => filteredNames.length === 0 || filteredNames.includes(series.name));
  }, [chartType, filteredNames, renderWithGTPChart, seriesEntriesForRendering]);

  const hasGTPSecondaryAxis = useMemo(
    () => gtpSeries.some((series) => series.yAxisIndex === 1),
    [gtpSeries],
  );

  const gtpPrimaryFormat = useMemo(() => {
    const sourceMeta = jsonMeta?.meta ?? [];
    const firstPrimarySeries = gtpSeries.find((series) => (series.yAxisIndex ?? 0) === 0);
    const firstPrimaryMeta = sourceMeta.find((meta) => meta.name === firstPrimarySeries?.name) ?? sourceMeta.find((meta) => !meta.oppositeYAxis);

    return {
      prefix: firstPrimaryMeta?.prefix,
      suffix: firstPrimaryMeta?.suffix,
      decimals: firstPrimaryMeta?.tooltipDecimals,
    };
  }, [gtpSeries, jsonMeta?.meta]);

  const gtpSecondaryFormat = useMemo(() => {
    const sourceMeta = jsonMeta?.meta ?? [];
    const firstSecondarySeries = gtpSeries.find((series) => (series.yAxisIndex ?? 0) === 1);
    const firstSecondaryMeta = sourceMeta.find((meta) => meta.name === firstSecondarySeries?.name) ?? sourceMeta.find((meta) => meta.oppositeYAxis);

    return {
      prefix: firstSecondaryMeta?.prefix,
      suffix: firstSecondaryMeta?.suffix,
      decimals: firstSecondaryMeta?.tooltipDecimals,
    };
  }, [gtpSeries, jsonMeta?.meta]);

  const gtpXAxisLines = useMemo<GTPChartXAxisLine[]>(() => {
    if (!yAxisLine?.length) return [];

    const mapLineStyle = (style: string | undefined): GTPChartXAxisLine["lineStyle"] => {
      if (!style) return undefined;
      const normalized = style.toLowerCase();
      if (normalized.includes("dot")) return "dotted";
      if (normalized.includes("dash")) return "dashed";
      return "solid";
    };

    const normalizeColorValue = (value: string | undefined) => value?.trim().toLowerCase();
    const isLikelyCssColorValue = (value: string) =>
      /^(#|rgb\(|rgba\(|hsl\(|hsla\(|var\(|transparent$)/i.test(value.trim());

    return yAxisLine
      .filter((line) => Number.isFinite(line.xValue))
      .map((line) => {
        const normalizedTextColor = normalizeColorValue(line.textColor);
        const normalizedBackgroundColor = normalizeColorValue(line.backgroundColor);
        const hasEqualTextAndBackground =
          Boolean(normalizedTextColor) &&
          Boolean(normalizedBackgroundColor) &&
          normalizedTextColor === normalizedBackgroundColor;

        const fallbackBackgroundColor =
          typeof line.backgroundColor === "string" && !isLikelyCssColorValue(line.backgroundColor)
            ? "transparent"
            : line.backgroundColor;
        const fallbackTextColor =
          typeof line.textColor === "string" && !isLikelyCssColorValue(line.textColor)
            ? undefined
            : line.textColor;

        return {
          xValue: line.xValue,
          annotationText: line.annotationText,
          annotationPositionX: line.annotationPositionX,
          annotationPositionY: line.annotationPositionY,
          lineStyle: mapLineStyle(line.lineStyle),
          lineColor: line.lineColor,
          lineWidth: line.lineWidth,
          textColor: hasEqualTextAndBackground ? undefined : fallbackTextColor,
          textFontSize: line.textFontSize ? Number.parseFloat(line.textFontSize) : undefined,
          backgroundColor: hasEqualTextAndBackground ? "transparent" : fallbackBackgroundColor,
        };
      });
  }, [yAxisLine]);

  const gtpStack = useMemo(() => {
    return (jsonMeta?.meta ?? []).some((series) => series.stacking === "normal" || series.stacking === "percent");
  }, [jsonMeta?.meta]);

  const gtpPercentageMode = useMemo(() => {
    return (jsonMeta?.meta ?? []).some((series) => series.stacking === "percent");
  }, [jsonMeta?.meta]);

  const gtpXAxisMin = useMemo(() => {
    if (!renderWithGTPChart || gtpSeries.length === 0) return undefined;

    let minTimestampNonZero: number | undefined;
    let minTimestampAnyValue: number | undefined;

    gtpSeries.forEach((series) => {
      series.data.forEach(([timestamp, value]) => {
        const numericTimestamp = Number(timestamp);
        if (!Number.isFinite(numericTimestamp)) return;
        if (typeof value !== "number" || !Number.isFinite(value)) return;

        if (minTimestampAnyValue === undefined || numericTimestamp < minTimestampAnyValue) {
          minTimestampAnyValue = numericTimestamp;
        }

        if (value !== 0 && (minTimestampNonZero === undefined || numericTimestamp < minTimestampNonZero)) {
          minTimestampNonZero = numericTimestamp;
        }
      });
    });

    return minTimestampNonZero ?? minTimestampAnyValue;
  }, [gtpSeries, renderWithGTPChart]);

  const computedTimeAxisTickConfig = useMemo(() => {
    const explicitIntervalMs =
      typeof timeAxisTickIntervalDays === "number" &&
      Number.isFinite(timeAxisTickIntervalDays) &&
      timeAxisTickIntervalDays > 0
        ? timeAxisTickIntervalDays * DAY_MS
        : undefined;

    if (explicitIntervalMs !== undefined) {
      return {
        intervalMs: explicitIntervalMs,
        alignToCleanBoundary: timeAxisTickAlignToCleanBoundary,
      };
    }

    if (!renderWithGTPChart || !showXAsDate || gtpSeries.length === 0) {
      return {
        intervalMs: undefined as number | undefined,
        alignToCleanBoundary: timeAxisTickAlignToCleanBoundary,
      };
    }

    const timestamps = gtpSeries.flatMap((series) =>
      series.data
        .map(([timestamp]) => Number(timestamp))
        .filter((timestamp) => Number.isFinite(timestamp)),
    );

    if (timestamps.length === 0) {
      return {
        intervalMs: undefined as number | undefined,
        alignToCleanBoundary: timeAxisTickAlignToCleanBoundary,
      };
    }

    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    const rangeMs = Math.max(0, maxTimestamp - minTimestamp);
    const rangeDays = rangeMs / DAY_MS;

    // Quickbite default: when monthly spacing would only produce 1-2 ticks,
    // fall back to weekly ticks to preserve readable time context.
    if (rangeDays > 30) {
      const projectedMonthlyTicks = Math.floor(rangeMs / (30 * DAY_MS)) + 1;
      if (projectedMonthlyTicks < 3) {
        return {
          intervalMs: 7 * DAY_MS,
          alignToCleanBoundary: timeAxisTickAlignToCleanBoundary ?? true,
        };
      }
    }

    return {
      intervalMs: undefined as number | undefined,
      alignToCleanBoundary: timeAxisTickAlignToCleanBoundary,
    };
  }, [
    gtpSeries,
    renderWithGTPChart,
    showXAsDate,
    timeAxisTickAlignToCleanBoundary,
    timeAxisTickIntervalDays,
  ]);

  const minTimestampDelta = useMemo(() => {
    const seriesToInspect = renderWithGTPChart && gtpSeries.length > 0
      ? gtpSeries.map((series) => ({ processedData: series.data }))
      : (filteredSeries.length ? filteredSeries : processedSeriesData);
    let smallestDelta = Number.POSITIVE_INFINITY;

    seriesToInspect.forEach((series: any) => {
      const points = series?.processedData || [];
      for (let i = 1; i < points.length; i++) {
        const current = points[i]?.[0];
        const previous = points[i - 1]?.[0];

        if (typeof current === "number" && typeof previous === "number") {
          const delta = Math.abs(current - previous);
          if (delta > 0 && delta < smallestDelta) {
            smallestDelta = delta;
          }
        }
      }
    });

    return smallestDelta === Number.POSITIVE_INFINITY ? null : smallestDelta;
  }, [filteredSeries, gtpSeries, processedSeriesData, renderWithGTPChart]);

  const shouldShowTimeInTooltip = showXAsDate && !!minTimestampDelta && minTimestampDelta < 24 * 60 * 60 * 1000;
  
  // Add timespans and selectedTimespan
  const timespans = {
    all: { xMin: 0, xMax: Date.now() },
    // Add other timespans as needed
  };
  const selectedTimespan = 'all';

  // Initialize Highcharts modules
  useEffect(() => {
    try {
      if (!highchartsInitialized) {
        highchartsRoundedCorners(Highcharts);
        highchartsAnnotations(Highcharts);
        highchartsPatternFill(Highcharts);
        Highcharts.setOptions({
          lang: {
            numericSymbols: ["K", " M", "B", "T", "P", "E"],
          },
        });
        highchartsInitialized = true;
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect now only handles data-specific logic
    try {
      // Pie charts with static pieData don't need the time-series data array
      if (chartType === 'pie' && pieData && pieData.length > 0) {
        setIsChartReady(true);
        setLoading(false);
        setError(null);
        return;
      }
      if (!Array.isArray(data)) {
        throw new Error('Chart data must be an array');
      }
      setIsChartReady(true);
      setLoading(false);
      setError(null); // Clear previous error
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, [data, chartType, pieData]); // Runs when data change
  
  // Handle resize events
  useEffect(() => {
    const handleResize = debounce(() => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.reflow();
      }
    }, 300);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);

  const tooltipFormatter = useCallback(
    function (this: any) {
      const isScatterTooltip = chartType === "scatter";
      const x = this?.x;
      const contextPoints = Array.isArray(this?.points) ? this.points : [];
      const fallbackPoint =
        this?.point ??
        (this?.series
          ? { series: this.series, y: this?.y, percentage: this?.percentage }
          : null);
      const points = isScatterTooltip
        ? (contextPoints.length > 0 ? contextPoints : fallbackPoint ? [fallbackPoint] : [])
        : contextPoints;
      if (points.length === 0) {
        return "";
      }

      const renderScatterTooltip = ({
        header,
        markerColor,
        rows,
      }: {
        header: string;
        markerColor: string;
        rows: Array<{ label: string; value: string }>;
      }) => {
        const rowMarkup = rows
          .map((row, index) => {
            const dividerMarkup = `<div class="ml-[18px] mr-[1px] h-[2px] relative mb-[2px] overflow-hidden">
                <div class="h-[2px] rounded-none absolute right-0 top-0" style="width:100%; background-color:${index === 0 ? "transparent" : "transparent"}"></div>
              </div>`;

            return `
              <div class="flex w-full space-x-1.5 items-center font-medium leading-tight">
                <div class="w-[15px] h-[10px] rounded-r-full" style="background-color:${markerColor}"></div>
                <div class="tooltip-point-name text-xs">${row.label}</div>
                <div class="flex-1 text-right justify-end flex numbers-xs">${row.value}</div>
              </div>
              ${dividerMarkup}
            `;
          })
          .join("");

        return `<div class="${DEFAULT_SCATTER_TOOLTIP_CONTAINER_CLASS}">
          <div class="flex-1 flex items-center justify-between font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">
            <div>${header}</div>
          </div>
          <div class="flex flex-col w-full">
            ${rowMarkup}
          </div>
        </div>`;
      };

      if (isScatterTooltip) {
        const point = points[0];
        const series = point?.series || {};
        const seriesName = typeof series?.name === "string" ? series.name : "";
        const xValue = Number(point?.x ?? x);
        const yValue = Number(point?.y);
        const yMeta = jsonMeta?.meta?.find((meta) => meta.name === seriesName) ?? jsonMeta?.meta?.[0];
        const yPrefix = yMeta?.prefix || "";
        const ySuffix = yMeta?.suffix || "";
        const yDecimals = yMeta?.tooltipDecimals ?? 2;

        const primaryYAxis = Array.isArray(options?.yAxis) ? options?.yAxis?.[0] : options?.yAxis;
        const xLabel = options?.xAxis?.title?.text || "X Value";
        const yLabelBase = primaryYAxis?.title?.text || "Y Value";
        const shouldStripGasPerSecondFromLabel =
          typeof ySuffix === "string" && /gas\s*\/\s*s/i.test(ySuffix);
        const yLabelWithUnitAdjusted = shouldStripGasPerSecondFromLabel
          ? yLabelBase.replace(/\s*\(\s*gas\s*\/\s*s\s*\)\s*$/i, "")
          : yLabelBase;
        const yLabel = yLabelWithUnitAdjusted
          .replace(/\s*\(\s*usd\s*\)\s*$/i, "")
          .replace(/^\s*weekly\s+/i, "");

        const formatValue = (value: number, decimals: number = 2) => {
          if (!Number.isFinite(value)) return "N/A";
          return value.toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
          });
        };

        const formattedX = formatValue(xValue, 2);
        const formattedY = `${yPrefix}${formatValue(yValue, yDecimals)}${ySuffix}`;
        const ratioValue = Number.isFinite(xValue) && xValue !== 0 && Number.isFinite(yValue) ? yValue / xValue : null;
        const formattedRatio = formatScatterRatio(ratioValue, {
          prefix: yPrefix,
          suffix: ySuffix,
        });
        const markerColor =
          typeof series?.color === "string"
            ? series.color
            : series?.color?.stops?.[0]?.[1] ?? "#999999";

        return renderScatterTooltip({
          header: seriesName,
          markerColor,
          rows: [
            { label: yLabel, value: formattedY },
            { label: xLabel, value: formattedX },
            { label: "Ratio", value: formattedRatio },
          ],
        });
      }

      const dateFormat = shouldShowTimeInTooltip ? "DD MMM YYYY HH:mm" : "DD MMM YYYY";
      let dateString = isScatterTooltip
        ? (Number.isFinite(Number(x)) ? dayjs.utc(Number(x)).format(dateFormat) : "")
        : dayjs.utc(x).format(dateFormat);
      const total = points.reduce((acc: number, point: any) => {
        acc += isScatterTooltip ? (Number(point?.y) || 0) : point.y;
        return acc;
      }, 0);

      const tooltip = `<div class="mt-3 mr-3 mb-3  text-xs font-raleway rounded-full bg-opacity-60 min-w-[240px]">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      const filteredPoints = showZeroTooltip
        ? points
        : points.filter((point: any) => (isScatterTooltip ? (Number(point?.y) || 0) : point.y) !== 0);
      const totalMeta = jsonMeta?.meta?.[0];
      const totalPrefix = totalMeta?.prefix || '';
      const totalSuffix = totalMeta?.suffix || '';
      const totalDecimals = totalMeta?.tooltipDecimals ?? 2;
      const totalValue = total.toLocaleString("en-GB", {
        minimumFractionDigits: totalDecimals,
        maximumFractionDigits: totalDecimals
      });
      const totalLine = showTotalTooltip
        ? `<div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full"></div>
            <div class="tooltip-point-name text-xs">Total</div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
              <div class="${!totalPrefix && "hidden"}">${totalPrefix}</div>
              ${totalValue}
              <div class="ml-0.5 ${!totalSuffix && "hidden"}">${totalSuffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
          </div>`
        : "";

      const tooltipPoints = filteredPoints
        // order by value
        .sort((a: any, b: any) => {
          if(disableTooltipSort) return 0;
          const aValue = isScatterTooltip ? (Number(a?.y) || 0) : parseFloat(a.y);
          const bValue = isScatterTooltip ? (Number(b?.y) || 0) : parseFloat(b.y);
          return bValue - aValue;
        })
        .map((point: any, index: number) => {
          const series = isScatterTooltip ? (point?.series || {}) : point.series;
          const y = isScatterTooltip ? (Number(point?.y) || 0) : point.y;
          const name = isScatterTooltip
            ? (typeof series?.name === "string" ? series.name : "")
            : series.name;
          
          const nameString = name.slice(0, 20);
          
          const color = isScatterTooltip
            ? (typeof series?.color === "string"
              ? series.color
              : series?.color?.stops?.[0]?.[1] ?? "#999999")
            : (series.color.stops ? series.color.stops[0][1] : series.color);

          
          // Match meta by series name instead of the sorted index so suffix/prefix follow the right series
          const metaEntry = jsonMeta?.meta.find((meta) => meta.name === name);
          const currentPrefix = metaEntry?.prefix || '';
          const currentSuffix = metaEntry?.suffix || '';
          const currentDecimals = metaEntry?.tooltipDecimals ?? 2;
          const stackingMode = metaEntry?.stacking;


          let displayValue = y.toLocaleString("en-GB", {
            minimumFractionDigits: currentDecimals,
            maximumFractionDigits: currentDecimals
          });

          let displayText;
          /* this might be wrong */
          if (stackingMode === "percent") {
            const percentageValue = isScatterTooltip
              ? (total !== 0 ? ((y / total) * 100).toFixed(1) : "0.0")
              : ((y / total) * 100).toFixed(1); // keep 1 decimal
            displayText = `${currentPrefix}${displayValue}${currentSuffix} (${percentageValue}%)`;
        } else {
            displayText = `${currentPrefix}${displayValue}${currentSuffix}`;
        }

        return `
        <div class="flex space-x-2 items-center font-medium mb-0.5">
          <div class="min-w-4 max-w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
          <div class="tooltip-point-name text-xs w-min truncate ">${nameString}</div>
          <div class=" flex-1 text-right justify-end w-full flex numbers-xs">
            <div class="flex justify-end text-right w-full">
              <div>${displayText}</div>
            </div>
          </div>
        </div>`;
        })
        .join("");

      return tooltip + tooltipPoints + totalLine + tooltipEnd;
    },
    [chartType, jsonMeta, options, shouldShowTimeInTooltip, disableTooltipSort, showZeroTooltip, showTotalTooltip, formatScatterRatio],
  );

  const resolvedPieData = useMemo(() => {
    if (chartType !== 'pie') return null;
    if (pieData && pieData.length > 0) return pieData;
    // Compute from fetched time-series: take the last non-null y value per series
    return processedSeriesData.map(s => ({
      name: s.name,
      y: [...s.processedData].reverse().find(([, y]) => y !== null && y !== undefined)?.[1] ?? 0,
      color: s.color,
    }));
  }, [chartType, pieData, processedSeriesData]);

  const pieTooltipFormatter = useCallback(
    function(this: any) {
      const color = this.point.color;
      const name = this.point.name;
      const y = this.y;
      const percentage = this.percentage;

      const metaEntry = pieData
        ? pieData.find(p => p.name === name)
        : jsonMeta?.meta.find(m => m.name === name);
      const prefix = (metaEntry as any)?.prefix || '';
      const suffix = (metaEntry as any)?.suffix || '';
      const decimals = (metaEntry as any)?.tooltipDecimals ?? 2;

      const displayValue = y.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      const percentageStr = showPiePercentage
        ? `<div class="text-right numbers-xs text-forest-400">${percentage.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>`
        : '';

      return `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
        <div class="flex space-x-2 items-center font-medium mb-0.5">
          <div class="min-w-4 max-w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
          <div class="tooltip-point-name text-xs">${name}</div>
          <div class="flex-1 text-right justify-end flex numbers-xs ml-2 gap-x-[5px]">
            <div>${prefix}${displayValue}${suffix}</div>${percentageStr}
          </div>
        </div>
      </div>`;
    },
    [pieData, jsonMeta, showPiePercentage],
  );

  const hasOppositeYAxis = jsonMeta?.meta.some((series: any) => series.oppositeYAxis === true);
  const isQuickBitePageScatter = chartType === "scatter" && !isChainQuickBitesTabChart;
  const primaryYAxisOptions = Array.isArray(options?.yAxis) ? options.yAxis[0] : options?.yAxis;
  const secondaryYAxisOptions = Array.isArray(options?.yAxis) ? options.yAxis[1] : undefined;
  const showNumericXAxisLabels = isQuickBitePageScatter || options?.xAxis?.labels?.enabled === true;
  const scatterXAxisTitle = useMemo(() => {
    if (!isQuickBitePageScatter) return options?.xAxis?.title;

    return {
      ...(options?.xAxis?.title || {}),
      margin: options?.xAxis?.title?.margin ?? 14,
      style: {
        color: theme === "dark" ? "#CDD8D3" : "#293332",
        fontSize: "10px",
        fontFamily: "Raleway",
        ...(options?.xAxis?.title?.style || {}),
      },
    };
  }, [isQuickBitePageScatter, options?.xAxis?.title, theme]);

  const scatterPrimaryYAxisTitle = useMemo(() => {
    if (!isQuickBitePageScatter) return primaryYAxisOptions?.title;

    return {
      ...(primaryYAxisOptions?.title || {}),
      margin: primaryYAxisOptions?.title?.margin ?? 14,
      reserveSpace: true,
      style: {
        color: theme === "dark" ? "#CDD8D3" : "#293332",
        fontSize: "10px",
        fontFamily: "Raleway",
        ...(primaryYAxisOptions?.title?.style || {}),
      },
    };
  }, [isQuickBitePageScatter, primaryYAxisOptions?.title, theme]);

  const scatterSecondaryYAxisTitle = useMemo(() => {
    if (!isQuickBitePageScatter) return secondaryYAxisOptions?.title;

    return {
      ...(secondaryYAxisOptions?.title || {}),
      margin: secondaryYAxisOptions?.title?.margin ?? 14,
      reserveSpace: true,
      style: {
        color: theme === "dark" ? "#CDD8D3" : "#293332",
        fontSize: "10px",
        fontFamily: "Raleway",
        ...(secondaryYAxisOptions?.title?.style || {}),
      },
    };
  }, [isQuickBitePageScatter, secondaryYAxisOptions?.title, theme]);
  const renderWithScatterEChart = chartType === "scatter";
  const scatterXAxisTitleText = typeof scatterXAxisTitle?.text === "string" ? scatterXAxisTitle.text : "X Value";
  const scatterPrimaryYAxisTitleText = typeof scatterPrimaryYAxisTitle?.text === "string" ? scatterPrimaryYAxisTitle.text : "Y Value";
  const scatterSecondaryYAxisTitleText = typeof scatterSecondaryYAxisTitle?.text === "string"
    ? scatterSecondaryYAxisTitle.text
    : scatterPrimaryYAxisTitleText;
  const scatterSeriesForECharts = useMemo(() => {
    return seriesEntriesForRendering
      .map(({ series, processedData }) => {
        if (filteredNames.length > 0 && !filteredNames.includes(series.name)) {
          return null;
        }

        const points = (Array.isArray(processedData) ? processedData : [])
          .filter((point: any) => Array.isArray(point) && point.length >= 2)
          .map((point: any) => [Number(point[0]), Number(point[1])])
          .filter(([xVal, yVal]: [number, number]) => Number.isFinite(xVal) && Number.isFinite(yVal));

        if (!points.length) {
          return null;
        }

        return {
          name: series.name,
          color: resolveSeriesColor(series),
          yAxisIndex: series.oppositeYAxis === true ? 1 : 0,
          points,
          prefix: typeof series?.prefix === "string" ? series.prefix : "",
          suffix: typeof series?.suffix === "string" ? series.suffix : "",
          tooltipDecimals:
            typeof series?.tooltipDecimals === "number" && Number.isFinite(series.tooltipDecimals)
              ? series.tooltipDecimals
              : undefined,
        };
      })
      .filter(
        (
          series,
        ): series is {
          name: string;
          color: string;
          yAxisIndex: 0 | 1;
          points: [number, number][];
          prefix: string;
          suffix: string;
          tooltipDecimals: number | undefined;
        } => Boolean(series),
      );
  }, [seriesEntriesForRendering, filteredNames, resolveSeriesColor]);
  const scatterMetaBySeriesName = useMemo(() => {
    return new Map((jsonMeta?.meta ?? []).map((meta: any) => [meta.name, meta]));
  }, [jsonMeta?.meta]);
  const scatterTrendlineResult = useMemo<{ points: [number, number][]; ratio: number | null } | null>(() => {
    if (!isScatterTrendlineEnabled || !isScatterTrendlineVisible) {
      return null;
    }

    const points = scatterSeriesForECharts.flatMap((series) =>
      series.points.map(([xValue, yValue]) => ({ xValue, yValue })),
    );

    if (points.length < 1) {
      return null;
    }

    const sumXY = points.reduce((sum, point) => sum + point.xValue * point.yValue, 0);
    const sumXX = points.reduce((sum, point) => sum + point.xValue * point.xValue, 0);

    if (!Number.isFinite(sumXX) || sumXX === 0) {
      return null;
    }

    // Forced-origin fit: y = kx, where k = sum(x*y) / sum(x^2).
    const slope = sumXY / sumXX;
    if (!Number.isFinite(slope)) {
      return null;
    }

    const xValues = points.map((point) => point.xValue).filter((value) => Number.isFinite(value));
    if (!xValues.length) {
      return null;
    }

    const xMax = Math.max(...xValues);

    if (!Number.isFinite(xMax) || xMax <= 0) {
      return null;
    }

    const yAtXMax = slope * xMax;

    return {
      points: [
        [0, 0],
        [xMax, yAtXMax],
      ],
      ratio: Number.isFinite(slope) ? slope : null,
    };
  }, [isScatterTrendlineEnabled, isScatterTrendlineVisible, scatterSeriesForECharts]);
  const scatterTrendlineRatioUnits = useMemo(() => {
    const firstVisibleSeries = scatterSeriesForECharts[0];
    if (!firstVisibleSeries) {
      return { prefix: "", suffix: "" };
    }

    const metaEntry = scatterMetaBySeriesName.get(firstVisibleSeries.name);
    return {
      prefix: metaEntry?.prefix ?? firstVisibleSeries.prefix ?? "",
      suffix: metaEntry?.suffix ?? firstVisibleSeries.suffix ?? "",
    };
  }, [scatterMetaBySeriesName, scatterSeriesForECharts]);
  const scatterTrendlineRatioLabel = useMemo(
    () => formatScatterRatio(scatterTrendlineResult?.ratio ?? null, scatterTrendlineRatioUnits),
    [formatScatterRatio, scatterTrendlineResult?.ratio, scatterTrendlineRatioUnits],
  );
  const scatterEChartOption = useMemo<EChartsOption>(() => {
    const axisTextColor = theme === "dark" ? "#CDD8D3" : "#293332";
    const axisLineColor = theme === "dark" ? "rgba(215, 223, 222, 0.33)" : "rgba(41, 51, 50, 0.33)";
    const axisGridColor = theme === "dark" ? "rgba(215, 223, 222, 0.11)" : "rgba(41, 51, 50, 0.11)";
    const xAxisType = showXAsDate ? "time" : mapToEChartsAxisType(options?.xAxis?.type);
    const hasActiveScatterTrendline =
      isScatterTrendlineEnabled && isScatterTrendlineVisible && Boolean(scatterTrendlineResult);
    const scatterGridRight = hasActiveScatterTrendline
      ? (hasOppositeYAxis ? 92 : 56)
      : (hasOppositeYAxis ? 72 : 20);
    const scatterXAxisMax = (() => {
      const configuredMax = options?.xAxis?.max;

      if (!hasActiveScatterTrendline || xAxisType === "time" || xAxisType === "log") {
        return configuredMax;
      }

      const xValues = scatterSeriesForECharts
        .flatMap((series) => series.points.map(([xValue]) => xValue))
        .filter((xValue) => Number.isFinite(xValue));

      if (!xValues.length) {
        return configuredMax;
      }

      const dataMax = Math.max(...xValues);
      const dataMin = Math.min(...xValues);
      const spread = Math.abs(dataMax - dataMin);
      const baseline = Math.max(spread, Math.abs(dataMax), 1);
      const bufferRatio = isChainQuickBitesTabChart
        ? SCATTER_TRENDLINE_X_AXIS_BUFFER_RATIO_CHAIN_TAB
        : SCATTER_TRENDLINE_X_AXIS_BUFFER_RATIO;
      const minBuffer = baseline * bufferRatio;
      const bufferedMax = dataMax + minBuffer;

      if (typeof configuredMax === "number" && Number.isFinite(configuredMax)) {
        return Math.max(configuredMax, bufferedMax);
      }

      if (typeof configuredMax === "string") {
        const numericConfiguredMax = Number(configuredMax);
        if (Number.isFinite(numericConfiguredMax)) {
          return Math.max(numericConfiguredMax, bufferedMax);
        }
      }

      return bufferedMax;
    })();

    const scatterYAxisOptions: any[] = [
      {
        type: mapToEChartsYAxisType(primaryYAxisOptions?.type),
        name: scatterPrimaryYAxisTitleText,
        nameLocation: "middle",
        nameGap: 52,
        nameTextStyle: {
          color: axisTextColor,
          fontSize: 10,
          fontFamily: "Raleway",
        },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: true, lineStyle: { color: axisLineColor } },
        splitLine: { show: true, lineStyle: { color: axisGridColor } },
        axisLabel: {
          color: axisTextColor,
          fontSize: 8,
          fontFamily: "Fira Sans",
          formatter: (value: any) => formatNumber(Number(value), true, "normal"),
        },
      },
    ];
    if (hasOppositeYAxis) {
      scatterYAxisOptions.push({
        type: mapToEChartsYAxisType(secondaryYAxisOptions?.type || primaryYAxisOptions?.type),
        name: scatterSecondaryYAxisTitleText,
        nameLocation: "middle",
        nameGap: 52,
        nameTextStyle: {
          color: axisTextColor,
          fontSize: 10,
          fontFamily: "Raleway",
        },
        position: "right",
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: true, lineStyle: { color: axisLineColor } },
        splitLine: { show: false },
        axisLabel: {
          color: axisTextColor,
          fontSize: 8,
          fontFamily: "Fira Sans",
          formatter: (value: any) => formatNumber(Number(value), true, "normal"),
        },
      });
    }

    return {
      animation: false,
      backgroundColor: "transparent",
      grid: {
        left: hasOppositeYAxis ? 72 : 66,
        right: scatterGridRight,
        top: 24,
        bottom: isQuickBitePageScatter ? 58 : 78,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "transparent",
        borderWidth: 0,
        padding: 0,
        appendToBody: true,
        extraCssText: "box-shadow:none; border:none; z-index:2147483647;",
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!point) return "";

          const value = Array.isArray(point.value) ? point.value : [];
          const xRaw = Number(value[0]);
          const yRaw = Number(value[1]);
          const seriesName = String(point.seriesName || "");
          const metaEntry = scatterMetaBySeriesName.get(seriesName);
          const seriesIndex = typeof point.seriesIndex === "number" ? point.seriesIndex : -1;
          const seriesConfig = seriesIndex >= 0 ? scatterSeriesForECharts[seriesIndex] : undefined;
          const yPrefix = metaEntry?.prefix ?? seriesConfig?.prefix ?? "";
          const ySuffix = metaEntry?.suffix ?? seriesConfig?.suffix ?? "";
          const yDecimals = metaEntry?.tooltipDecimals ?? seriesConfig?.tooltipDecimals ?? 2;
          const axisIndex = seriesIndex >= 0 ? (scatterSeriesForECharts[seriesIndex]?.yAxisIndex ?? 0) : 0;
          const yLabelBase = axisIndex === 1 ? scatterSecondaryYAxisTitleText : scatterPrimaryYAxisTitleText;
          const shouldStripGasPerSecondFromLabel =
            typeof ySuffix === "string" && /gas\s*\/\s*s/i.test(ySuffix);
          const yLabelWithUnitAdjusted = shouldStripGasPerSecondFromLabel
            ? yLabelBase.replace(/\s*\(\s*gas\s*\/\s*s\s*\)\s*$/i, "")
            : yLabelBase;
          const yLabel = yLabelWithUnitAdjusted
            .replace(/\s*\(\s*usd\s*\)\s*$/i, "")
            .replace(/^\s*weekly\s+/i, "");
          const ratio = Number.isFinite(xRaw) && xRaw !== 0 && Number.isFinite(yRaw) ? yRaw / xRaw : null;
          const markerColor =
            typeof point.color === "string"
              ? point.color
              : point.color?.colorStops?.[0]?.color ?? "#999999";

          const formattedX = showXAsDate && Number.isFinite(xRaw)
            ? dayjs.utc(xRaw).format(shouldShowTimeInTooltip ? "DD MMM YYYY HH:mm" : "DD MMM YYYY")
            : Number.isFinite(xRaw)
              ? xRaw.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
              : "N/A";
          const formattedY = Number.isFinite(yRaw)
            ? `${yPrefix}${yRaw.toLocaleString("en-GB", {
              minimumFractionDigits: 0,
              maximumFractionDigits: yDecimals,
            })}${ySuffix}`
            : "N/A";
          const formattedRatio = formatScatterRatio(ratio, {
            prefix: yPrefix,
            suffix: ySuffix,
          });

          const rowMarkup = [
            { label: yLabel, value: formattedY },
            { label: scatterXAxisTitleText, value: formattedX },
            { label: "Ratio", value: formattedRatio },
          ]
            .map((row, index) => {
              const dividerMarkup = `<div class="ml-[18px] mr-[1px] h-[2px] relative mb-[2px] overflow-hidden">
                  <div class="h-[2px] rounded-none absolute right-0 top-0" style="width:100%; background-color:${index === 0 ? "transparent" : "transparent"}"></div>
                </div>`;
              return `
                <div class="flex w-full space-x-1.5 items-center font-medium leading-tight">
                  <div class="w-[15px] h-[10px] rounded-r-full" style="background-color:${markerColor}"></div>
                  <div class="tooltip-point-name text-xs">${row.label}</div>
                  <div class="flex-1 text-right justify-end flex numbers-xs">${row.value}</div>
                </div>
                ${dividerMarkup}
              `;
            })
            .join("");

          return `<div class="${DEFAULT_SCATTER_TOOLTIP_CONTAINER_CLASS}">
            <div class="flex-1 flex items-center justify-between font-bold text-[13px] md:text-[1rem] ml-[18px] mb-1">
              <div>${seriesName}</div>
            </div>
            <div class="flex flex-col w-full">
              ${rowMarkup}
            </div>
          </div>`;
        },
      },
      xAxis: {
        type: xAxisType,
        max: scatterXAxisMax,
        name: scatterXAxisTitleText,
        nameLocation: "middle",
        nameGap: isQuickBitePageScatter ? 34 : 42,
        nameTextStyle: {
          color: axisTextColor,
          fontSize: 10,
          fontFamily: "Raleway",
        },
        axisLine: { lineStyle: { color: axisLineColor } },
        axisTick: { show: true, lineStyle: { color: axisLineColor } },
        splitLine: {
          show: true,
          showMaxLine: !hasActiveScatterTrendline,
          lineStyle: { color: axisGridColor },
        },
        axisLabel: {
          color: axisTextColor,
          fontFamily: "Fira Sans",
          fontSize: 10,
          showMaxLabel: !hasActiveScatterTrendline,
          formatter: (value: any) => {
            const numericValue = Number(value);
            if (showXAsDate && Number.isFinite(numericValue)) {
              return dayjs.utc(numericValue).format("DD MMM");
            }
            return Number.isFinite(numericValue) ? formatNumber(numericValue, true, "normal") : "";
          },
        },
      },
      yAxis: scatterYAxisOptions,
      series: [
        ...scatterSeriesForECharts.map((series) => ({
          type: "scatter" as const,
          name: series.name,
          yAxisIndex: series.yAxisIndex,
          data: series.points,
          symbolSize: 9,
          itemStyle: {
            color: series.color,
          },
          emphasis: {
            scale: 1.1,
          },
        })),
        ...(scatterTrendlineResult
          ? [
              {
                type: "line" as const,
                name: scatterTrendlineLabel,
                data: scatterTrendlineResult.points,
                showSymbol: false,
                silent: true,
                tooltip: { show: false },
                lineStyle: {
                  type: "dashed" as const,
                  width: 2,
                  color: scatterTrendlineColor,
                },
                endLabel: {
                  show: true,
                  distance: 10,
                  color: scatterTrendlineTextColor,
                  fontFamily: "Raleway",
                  fontSize: 9,
                  fontWeight: 500,
                  backgroundColor: scatterTrendlineLabelBackground,
                  borderRadius: 15,
                  padding: [4, 8],
                  formatter: `Avg ratio: ${scatterTrendlineRatioLabel}`,
                },
              },
            ]
          : []),
      ],
    };
  }, [
    theme,
    showXAsDate,
    shouldShowTimeInTooltip,
    options?.xAxis?.type,
    options?.xAxis?.max,
    hasOppositeYAxis,
    primaryYAxisOptions?.type,
    secondaryYAxisOptions?.type,
    scatterXAxisTitleText,
    scatterPrimaryYAxisTitleText,
    scatterSecondaryYAxisTitleText,
    scatterMetaBySeriesName,
    scatterSeriesForECharts,
    scatterTrendlineLabelBackground,
    scatterTrendlineColor,
    isScatterTrendlineEnabled,
    isScatterTrendlineVisible,
    scatterTrendlineResult,
    scatterTrendlineRatioLabel,
    scatterTrendlineLabel,
    scatterTrendlineTextColor,
    formatNumber,
    formatScatterRatio,
    isChainQuickBitesTabChart,
    isQuickBitePageScatter,
  ]);
  const filterableSeriesNames = useMemo(() => {
    const source = chartType === 'pie' && resolvedPieData
      ? resolvedPieData
      : seriesEntriesForRendering.map((entry) => entry.series);

    if (!Array.isArray(source)) {
      return [];
    }

    const names = source
      .map((item: any) => (typeof item?.name === "string" ? item.name : ""))
      .filter((name: string) => name.length > 0);

    return Array.from(new Set(names));
  }, [chartType, resolvedPieData, seriesEntriesForRendering]);

  const legendCategories = useMemo(() => {
    const source = chartType === 'pie' && resolvedPieData
      ? resolvedPieData
      : seriesEntriesForRendering.map((entry) => entry.series);
    if (!Array.isArray(source)) {
      return [];
    }

    const categories = source.map((series: any) => ({
      ...series,
      color: resolveSeriesColor(series),
    }));

    if (isScatterTrendlineEnabled) {
      categories.push({
        name: scatterTrendlineLabel,
        color: scatterTrendlineColor,
        isScatterTrendline: true,
      });
    }

    return categories;
  }, [
    chartType,
    isScatterTrendlineEnabled,
    resolvedPieData,
    scatterTrendlineColor,
    scatterTrendlineLabel,
    seriesEntriesForRendering,
    resolveSeriesColor,
  ]);

  const selectableSeriesLegendCount = useMemo(
    () => legendCategories.filter((category: any) => !category?.isScatterTrendline).length,
    [legendCategories],
  );
  const selectableSeriesLegendNames = useMemo(
    () =>
      legendCategories
        .filter((category: any) => !category?.isScatterTrendline)
        .map((category: any) => category?.name)
        .filter((name: unknown): name is string => typeof name === "string" && name.length > 0),
    [legendCategories],
  );

  const primaryLegendCategories = useMemo(
    () => legendCategories.filter((series: any) => !series.oppositeYAxis),
    [legendCategories],
  );

  const secondaryLegendCategories = useMemo(
    () => legendCategories.filter((series: any) => series.oppositeYAxis === true),
    [legendCategories],
  );

  const isLegendCategoryActive = useCallback(
    (category: any) => {
      if (category?.isScatterTrendline) {
        return isScatterTrendlineVisible;
      }

      return filteredNames.length === 0 || filteredNames.includes(category?.name);
    },
    [filteredNames, isScatterTrendlineVisible],
  );

  const toggleLegendCategory = useCallback(
    (category: any) => {
      if (!category || typeof category !== "object") return;

      if (category.isScatterTrendline) {
        if (!isScatterTrendlineEnabled) return;
        setIsScatterTrendlineVisible((prev) => !prev);
        return;
      }

      const name = typeof category.name === "string" ? category.name : "";
      if (!name) return;

      setFilteredNames((prev) => {
        if (chartType === "scatter" && prev.length === 0) {
          return selectableSeriesLegendNames.filter((seriesName) => seriesName !== name);
        }

        if (!prev.includes(name)) {
          const next = [...prev, name];
          if (next.length === selectableSeriesLegendCount) {
            return [];
          }
          return next;
        }
        return prev.filter((seriesName) => seriesName !== name);
      });
    },
    [chartType, isScatterTrendlineEnabled, selectableSeriesLegendCount, selectableSeriesLegendNames],
  );

  const shouldShowLegendReset = filteredNames.length > 0 || (isScatterTrendlineEnabled && !isScatterTrendlineVisible);

  const resetLegendFilters = useCallback(() => {
    setFilteredNames([]);
    if (isScatterTrendlineEnabled) {
      setIsScatterTrendlineVisible(true);
    }
  }, [isScatterTrendlineEnabled]);

  const handleDownloadChartSnapshot = useCallback(async () => {
    if (isDownloadingChartSnapshot) return;
    if (typeof window === "undefined") return;
    const cardElement = chartCardRef.current;
    if (!cardElement) return;

    setIsDownloadingChartSnapshot(true);
    try {
      await downloadElementAsImage(cardElement, title ?? "quickbite-chart");
    } finally {
      setIsDownloadingChartSnapshot(false);
    }
  }, [isDownloadingChartSnapshot, title]);

  const normalizedPreferredSeriesNames = useMemo(
    () =>
      defaultFilteredSeriesNames
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name))
        .map(normalizeSeriesLabel),
    [defaultFilteredSeriesNames],
  );

  useEffect(() => {
    if (!isChainQuickBitesTabChart) {
      return;
    }

    if (filterableSeriesNames.length <= 1 || normalizedPreferredSeriesNames.length === 0) {
      return;
    }

    const matchedSeriesName = filterableSeriesNames.find((name) =>
      normalizedPreferredSeriesNames.includes(normalizeSeriesLabel(name)),
    );

    if (!matchedSeriesName) {
      return;
    }

    setFilteredNames((prev) => {
      if (prev.length > 0) {
        return prev;
      }
      return [matchedSeriesName];
    });
  }, [isChainQuickBitesTabChart, filterableSeriesNames, normalizedPreferredSeriesNames]);

  useEffect(() => {
    setIsScatterTrendlineVisible(isScatterTrendlineEnabled);
  }, [isScatterTrendlineEnabled]);

  
  if (loading) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg animate-pulse"
        aria-busy="true"
      >
        <p className="text-color-text-primary dark:text-forest-400">Loading chart...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg"
        role="alert"
      >
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Failed to load chart</p>
          <p className="text-sm text-forest-700 dark:text-forest-300">{error}</p>
        </div>
      </div>
    );
  }



 
  
  const wrapperPaddingClass = isChainQuickBitesTabChart
    ? "px-0"
    : margins === "none"
      ? "px-0"
      : quickBiteTabRightEdgeFlush
        ? "md:px-[35px] lg:pl-[35px] lg:pr-0"
        : quickBiteTabLeftEdgeFlush
          ? "md:px-[35px] lg:pl-0 lg:pr-[35px]"
          : "md:px-[35px]";
  const isSingleChainQuickBitesTabChart =
    isChainQuickBitesTabChart && !quickBiteTabRightEdgeFlush && !quickBiteTabLeftEdgeFlush;
  const quickBitesTabWrapperStyle = isChainQuickBitesTabChart
    ? {
        width: "100%",
        maxWidth: isSingleChainQuickBitesTabChart ? undefined : "1250px",
        marginLeft: quickBiteTabRightEdgeFlush ? "auto" : undefined,
      }
    : undefined;
  const quickBitePageFooterClassName = isQuickBitePageScatter
    ? "md:px-[50px] relative bottom-0 mt-0 flex flex-col justify-between gap-y-[3px] md:gap-y-0"
    : "md:px-[50px] relative bottom-[2px] flex flex-col justify-between gap-y-[5px] md:gap-y-0";

  return (
    <div className={`relative ${wrapperPaddingClass}`} style={quickBitesTabWrapperStyle}>
      <div
        ref={chartCardRef}
        style={{ width, height }}
        className={`${
          isChainQuickBitesTabChart
            ? `chain-quick-bites-tab-chart-anchor bg-color-bg-default rounded-[18px] px-[8px] pb-[42px] ${
                chainQuickBitesTopBar ? "pt-[38px]" : "pt-[8px]"
              }`
            : "bg-transparent md:bg-color-ui-active rounded-[25px] shadow-none md:shadow-md md:p-[15px]"
        } relative flex flex-col ${isQuickBitePageScatter ? "gap-y-[10px]" : "gap-y-[12px]"} h-full`}
      >
        {isChainQuickBitesTabChart ? (
          <>
            {chainQuickBitesTopBar ? (
              <div className="absolute inset-x-0 top-0 z-[30]">
                <div className="w-full bg-color-bg-medium rounded-full p-[2px]">
                  <div className="mr-auto w-fit">{chainQuickBitesTopBar}</div>
                </div>
              </div>
            ) : null}
            {title ? (
              <div className="flex items-center gap-x-[6px] pt-[4px] pr-[10px] pl-[6px] pb-[4px]">
                <GTPIcon
                  icon={CHAIN_QUICKBITES_HEADER_ICON}
                  className="!w-[12px] !h-[12px] text-color-text-primary"
                  containerClassName="!w-[12px] !h-[12px]"
                />
                <span className="text-xxs text-color-text-primary/85">{title}</span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="w-full h-auto pl-[10px] pr-[5px] py-[5px] bg-color-bg-default rounded-full">
            <div className="flex items-center justify-center md:justify-between">
              <div className="flex items-center gap-x-[5px]">
                <div className="w-fit h-fit"><GTPIcon icon={"gtp-quick-bites"} className="w-[24px] h-[24px] "/></div>
                <div className="heading-small-md">{title}</div>
              </div>
            </div>
          </div>
        )}
        {renderWithGTPChart ? (
          <div className="relative h-full min-h-0 flex-1">
            <GTPChart
              series={gtpSeries}
              stack={gtpStack}
              percentageMode={gtpPercentageMode}
              preserveStackOrder={shouldSortStackedSeriesByAge}
              xAxisMin={gtpXAxisMin}
              snapToCleanBoundary={snapToCleanBoundary ?? false}
              timeAxisTickIntervalMs={computedTimeAxisTickConfig.intervalMs}
              timeAxisTickAlignToCleanBoundary={computedTimeAxisTickConfig.alignToCleanBoundary}
              timeAxisBarEdgePaddingRatio={timeAxisBarEdgePaddingRatio ?? 0}
              hidePrimaryYAxisWhenEmpty
              prefix={gtpPrimaryFormat.prefix}
              suffix={gtpPrimaryFormat.suffix}
              decimals={gtpPrimaryFormat.decimals}
              secondaryPrefix={gtpSecondaryFormat.prefix}
              secondarySuffix={gtpSecondaryFormat.suffix}
              secondaryDecimals={gtpSecondaryFormat.decimals}
              xAxisLines={gtpXAxisLines}
              showTooltipTimestamp={shouldShowTimeInTooltip}
              showTotal={showTotalTooltip && !hasGTPSecondaryAxis}
              reverseTooltipOrder={false}
              height="100%"
              showWatermark={false}
            />
          </div>
        ) : renderWithScatterEChart ? (
          <div className="relative h-full min-h-0 flex-1">
            <ReactEChartsCore
              echarts={echarts}
              option={scatterEChartOption}
              notMerge={true}
              lazyUpdate={true}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        ) : (
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart chart={chartRef.current} options={options || {}}
              plotOptions={{
                pie: {
                  allowPointSelect: false,
                  cursor: "pointer",
                  showInLegend: false,
                  borderWidth: 10,
                  borderColor: "transparent",
                  dataLabels: { enabled: false },
                },
                line: {
                  lineWidth: 3,
                },
                area: {
                  lineWidth: 2,
                },
                column: {

                  borderColor: "transparent",
                  animation: true,
                  pointPlacement: "on",
                },
                scatter: {
                  lineWidth: 0,
                  marker: {
                    enabled: true,
                    radius: 4,
                    symbol: "circle",
                  },
                },
                series: {
                  zIndex: 10,
                  animation: false,

                  marker: {
                    lineColor: "white",
                    radius: 0,
                    symbol: "circle",
                  },
                  states: {
                    hover: {
                      enabled: true,
                      brightness: 0.1,
                    },
                    inactive: {
                      opacity: 0.6,
                    }
                  }
                },
              }}
          >
            <Chart
              backgroundColor={"transparent"}
              type={chartType === 'pie' ? 'pie' : 'line'}
              panning={{
                enabled: false,
                type: "x",
              }}

              panKey="shift"
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={chartType === 'pie' ? 10 : (showXAsDate ? 32 : (isQuickBitePageScatter ? 36 : 20))}
              marginLeft={chartType === 'pie' ? undefined : (isQuickBitePageScatter ? 68 : 50)}
              marginRight={chartType === 'pie' ? undefined : (hasOppositeYAxis ? 50 : 5)}
              marginTop={chartType === 'pie' ? 2 : 15}
            />
            
            
            <XAxis
              crosshair={{
                width: 0.5,
                color: theme === 'dark' ? '#CDD8D3' : '#293332',
                snap: true,
              }}
              labels={{
                style: {
                  fontFamily: "Fira Sans",
                  fontSize: "10px",
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                },
                distance: 20,
                enabled: showXAsDate || showNumericXAxisLabels,
                useHTML: true,
                formatter: showXAsDate ? function (this: AxisLabelsFormatterContextObject) {
                  if (timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin <= 40 * 24 * 3600 * 1000) {
                    let isBeginningOfWeek = new Date(this.value).getUTCDay() === 1;
                    let showMonth = this.isFirst || new Date(this.value).getUTCDate() === 1;

                    return new Date(this.value).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                      month: "short",
                      day: "numeric",
                      year: this.isFirst ? "numeric" : undefined,
                    });
                  }
                  else {
                    // if Jan 1st, show year
                    if (new Date(this.value).getUTCMonth() === 0 && new Date(this.value).getUTCDate() === 1) {
                      return new Date(this.value).toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                        year: "numeric",
                      });
                    }
                    // if not 1st of the month, show month and day
                    else if (new Date(this.value).getUTCDate() !== 1) {
                      return new Date(this.value).toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                      });
                    }
                    return new Date(this.value).toLocaleDateString("en-GB", {
                      timeZone: "UTC",
                      month: "short",
                      year: "numeric",
                    });
                  }
                } : isQuickBitePageScatter ? function (this: AxisLabelsFormatterContextObject) {
                  return formatNumber(this.value, true, "normal");
                } : undefined
              }}
              
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              lineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              tickColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              type={showXAsDate ? "datetime" : undefined}
              tickAmount={5}
              tickLength={15}
              tickWidth={isQuickBitePageScatter ? 1 : undefined}
              lineWidth={isQuickBitePageScatter ? 1 : undefined}
              title={scatterXAxisTitle}
              plotLines={yAxisLine?.map((line) => ({
                value: line.xValue,
                color: line.lineColor || (theme === 'dark' ? '#CDD8D3' : '#293332'),
                width: line.lineWidth || 1,
                zIndex: 5,
                dashStyle: line.lineStyle as Highcharts.DashStyleValue || 'solid',
                label: {
                  text: `<div class="text-xxs font-raleway bg-${line.backgroundColor || 'color-bg-default'} rounded-[15px] px-2 py-1">${line.annotationText}</div>`,
                  useHTML: true,
                  align: 'center',
                  rotation: 0,
                  x: line.annotationPositionX,
                  y: line.annotationPositionY,
                  style: {
                    color: line.textColor || (theme === 'dark' ? '#CDD8D3' : '#293332'),
                    fontSize: line.textFontSize || '9px',
                    fontFamily: 'Raleway'
                  }
                }
              }))}
            />
            <YAxis
              id="0"
              type={primaryYAxisOptions?.type}
              reversedStacks={shouldSortStackedSeriesByAge ? false : undefined}
              labels={{
                style: {
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                  fontSize: '8px',
                },
                // formatter: function (this: any) {
                //   if (jsonMeta?.meta[0]?.suffix) {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     }) + jsonMeta.meta[0].suffix;
                //   } else {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     });
                //   }
                // }
                formatter: function (t: AxisLabelsFormatterContextObject) {
                  return formatNumber(t.value, true, filteredSeries?.[0]?.stacking || "normal");
                },
              }}
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              title={scatterPrimaryYAxisTitle}
            >
              {chartType !== 'pie' && seriesEntriesForRendering
              .map(({ series, processedData }) => {
                // filter out series that are not on the opposite y axis and not filtered out
                const showSeries = !series.oppositeYAxis && (filteredNames.length === 0 || filteredNames.includes(series.name));
                if(!showSeries) return null;

                // use the type from the jsonMeta if it exists, otherwise use the chartType
                const type = series.type || chartType;
                // use the yaxis from the jsonMeta if it exists, otherwise use 0
                const chartYaxis = series.oppositeYAxis === true ? 1 : 0;

                const fillOpacity = type === "area" ? 0.3 : undefined;

                return (
                  <Series
                    key={series.name}
                    type={type}
                    name={series.name}
                    yAxis={chartYaxis}
                    data={processedData}
                    color={series.color}
                    fillOpacity={fillOpacity}
                    dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    animation={true}
                    stacking={series.stacking ? series.stacking : undefined}
                    borderRadius={type === "column" ? "8%" : undefined}
                    marker={{ enabled: false }}
                    states={{
                      hover: {
                        enabled: true,
                        brightness: 0.1,
                      },
                      inactive: {
                        opacity: 0.6,
                      },
                    }}
                    zIndex={type === "column" ? 0 : 1}
                  />
                )
              })}
              {chartType === 'pie' && resolvedPieData && (
                <PieSeries
                  innerSize="95%"
                  size="100%"
                  borderRadius={8}
                  dataLabels={{ enabled: false }}
                  data={resolvedPieData.filter(d => filteredNames.length === 0 || filteredNames.includes(d.name))}
                  animation={true}
                  states={{
                    hover: { enabled: true, brightness: 0.1 },
                    inactive: { opacity: 0.6 },
                  }}
                />
              )}
            </YAxis>
            <YAxis
              id="1"
              type={secondaryYAxisOptions?.type || primaryYAxisOptions?.type}
              opposite={true}
              reversedStacks={shouldSortStackedSeriesByAge ? false : undefined}
              labels={{
                style: {
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                  fontSize: '8px',
                },
                // formatter: function (this: any) {
                //   if (jsonMeta?.meta[0]?.suffix) {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     }) + jsonMeta.meta[0].suffix;
                //   } else {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     });
                //   }
                // }
                formatter: function (t: AxisLabelsFormatterContextObject) {
                  return formatNumber(t.value, true, filteredSeries?.[0]?.stacking || "normal");
                },
              }}
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              title={scatterSecondaryYAxisTitle}
              
            >
              {seriesEntriesForRendering
              .map(({ series, processedData }) => {
                // filter out series that are not on the opposite y axis and not filtered out
                const showSeries = series.oppositeYAxis === true && (filteredNames.length === 0 || filteredNames.includes(series.name));
                if(!showSeries) return null;

                // use the type from the jsonMeta if it exists, otherwise use the chartType
                const type = series.type || chartType;
                // use the yaxis from the jsonMeta if it exists, otherwise use 0
                const chartYaxis = series.oppositeYAxis === true ? 1 : 0;
                const fillOpacity = type === "area" ? 0.3 : undefined;
                
                return (
                  <Series 
                    key={series.name}
                    type={type}
                    name={series.name}
                    yAxis={chartYaxis}
                    data={processedData} 
                    color={series.color} 
                    fillOpacity={fillOpacity}
                    dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    animation={true}
                    stacking={series.stacking ? series.stacking : undefined}
                    borderRadius={type === "column" ? "8%" : undefined}
                    marker={{ enabled: false }}
                    states={{
                      hover: {
                        enabled: true,
                        brightness: 0.1,
                      },
                      inactive: {
                        opacity: 0.6,
                      },
                    }}
                    zIndex={type === "column" ? 0 : 1}
                  />
                )
              })}
            </YAxis>
            {/* {chartType === 'column' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  const useJson = jsonMeta ? true : false;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;

              
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  return(
                    <ColumnSeries
                      borderRadius="8%"
                      stacking={stacking ? stacking : undefined}
                      borderColor="transparent"
                      pointPlacement="on"
                      data={seriesData}
                      color={series.color}
                      name={series.name}
                      key={series.name}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  )
                })
              )} */}

              {/* {chartType === 'line' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;
                 
                  return (
                    <LineSeries
                      animation={true}
                      key={series.name}
                      name={series.name}
                      data={seriesData}
                      color={series.color}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  );
                })
              )}  
              
              {chartType === 'area' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;
                  
                  return (
                    <AreaSeries
                      stacking={stacking ? stacking : undefined}
                      key={series.name}
                      name={series.name}
                      data={seriesData}
                      color={series.color}
                      animation={true}
                      states={{
                        hover: {
                          enabled: true,
                          brightness: 0.1,
                        },
                        inactive: {
                          opacity: 0.6,
                        },
                      }}
                      fillOpacity={0.3}
                      marker={{
                        enabled: false,
                      }}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  );
                })
              )}
              
              {chartType === 'column' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  const useJson = jsonMeta ? true : false;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;

              
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  return(
                    <ColumnSeries
                      borderRadius="8%"
                      stacking={stacking ? stacking : undefined}
                      borderColor="transparent"
                      pointPlacement="on"
                      data={seriesData}
                      color={series.color}
                      name={series.name}
                      key={series.name}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  )
                })
              )}
              
              {chartType === 'pie' && (
                <PieSeries
                  animation={true}
                  states={{
                    hover: {
                      enabled: true,
                      brightness: 0.1,
                    },
                    inactive: {
                      opacity: 0.6,
                    },
                  }}
                  allowPointSelect={true}
                  cursor="pointer"
                  borderWidth={0}
                  borderRadius={5}
                  dataLabels={{
                    enabled: false,
                  }}
                  showInLegend={true}
                />
              )} */}
            
            <Tooltip
              useHTML={true}
              shared={chartType === 'pie' ? false : true}
              split={false}
              followPointer={true}
              followTouchMove={true}
              backgroundColor={"#2A3433EE"}
              padding={0}
              hideDelay={300}
              stickOnContact={false}
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
              formatter={chartType === 'pie' ? pieTooltipFormatter : tooltipFormatter}
            />

          </HighchartsChart>
        </HighchartsProvider>
        )}
        {chartType === 'pie' && centerName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-xxxs font-bold leading-[120%] text-center max-w-[80px]">
              {centerName}
            </div>
          </div>
        )}
        <div className="absolute bottom-[27.5%] md:bottom-[18.5%] left-[40px] md:left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40  "
          style={{
            height: typeof height === "number" ? (height - 147) + "px" : "100%"
          }}
        >
          <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
        </div>
        {/*Footer*/}
        {isChainQuickBitesTabChart ? (
          <>
            {legendCategories.length > 0 && (
              <div className="min-h-[24px] w-full flex items-center justify-center gap-[5px] flex-wrap">
                {[...primaryLegendCategories, ...secondaryLegendCategories].map((category: any) => {
                  const isActive = isLegendCategoryActive(category);
                  const seriesColor = typeof category.color === "string" ? category.color : "#999999";
                  const markerOpacity = isActive ? 1 : 0.35;

                  return (
                    <GTPButton
                      key={category.name}
                      label={category.name}
                      variant={isActive ? "primary" : "no-background"}
                      size="xs"
                      clickHandler={() => toggleLegendCategory(category)}
                      onMouseEnter={() => setHoverLegendSeriesName(category.name)}
                      onMouseLeave={() => setHoverLegendSeriesName(null)}
                      rightIcon={
                        hoverLegendSeriesName === category.name
                          ? isActive
                            ? "in-button-close"
                            : "in-button-plus"
                          : undefined
                      }
                      rightIconClassname="!w-[12px] !h-[12px]"
                      textClassName={isActive ? undefined : "text-color-text-secondary"}
                      className={isActive ? undefined : "border border-color-bg-medium"}
                      leftIconOverride={(
                        category?.isScatterTrendline ? (
                          <div
                            className="min-w-[16px] h-0 border-t-2 border-dashed rounded-none"
                            style={{ borderColor: seriesColor, opacity: markerOpacity }}
                          />
                        ) : (
                          <div
                            className="min-w-[6px] min-h-[6px] rounded-full"
                            style={{ backgroundColor: seriesColor, opacity: markerOpacity }}
                          />
                        )
                      )}
                    />
                  );
                })}
                {shouldShowLegendReset && (
                  <GTPButton
                    label="Reset"
                    variant="highlight"
                    size="xs"
                    leftIcon="gtp-close-monochrome"
                    clickHandler={resetLegendFilters}
                  />
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-[30]">
              <GTPButtonContainer>
                <div className="mr-auto">
                  <GTPButtonRow className="shrink-0">
                    <GTPButtonDropdown
                      openDirection="top"
                      matchTriggerWidthToDropdown
                      buttonProps={{
                        label: "Share",
                        labelDisplay: "active",
                        leftIcon: "gtp-share-monochrome",
                        size: "xs",
                        variant: "no-background",
                      }}
                      isOpen={isSharePopoverOpen}
                      onOpenChange={setIsSharePopoverOpen}
                      dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
                    />
                    <GTPButton
                      leftIcon="gtp-download-monochrome"
                      size="xs"
                      variant="no-background"
                      visualState={isDownloadingChartSnapshot ? "disabled" : "default"}
                      disabled={isDownloadingChartSnapshot}
                      clickHandler={handleDownloadChartSnapshot}
                    />
                  </GTPButtonRow>
                </div>
              </GTPButtonContainer>
            </div>
          </>
        ) : (
          <div className={quickBitePageFooterClassName}>
            <div className="flex flex-col gap-y-[5px]">
              <div className="flex flex-1 gap-[5px] flex-wrap items-center justify-center">
                {primaryLegendCategories.map((category: any) => {
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if (!isLegendCategoryActive(category)) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }
                  const seriesColor = typeof category.color === "string" ? category.color : "#999999";
                  const markerOpacity = isLegendCategoryActive(category) ? 1 : 0.35;

                  return (
                    <div
                      key={category.name}
                      className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`}
                      onClick={() => toggleLegendCategory(category)}
                    >
                      {category?.isScatterTrendline ? (
                        <div
                          className="w-[16px] h-0 border-t-2 border-dashed rounded-none"
                          style={{ borderColor: seriesColor, opacity: markerOpacity }}
                        ></div>
                      ) : (
                        <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: seriesColor, opacity: markerOpacity }}></div>
                      )}
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}

                {secondaryLegendCategories.map((category: any) => {
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if (!isLegendCategoryActive(category)) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }
                  const seriesColor = typeof category.color === "string" ? category.color : "#999999";
                  const markerOpacity = isLegendCategoryActive(category) ? 1 : 0.35;

                  return (
                    <div
                      key={category.name}
                      className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`}
                      onClick={() => toggleLegendCategory(category)}
                    >
                      {category?.isScatterTrendline ? (
                        <div
                          className="w-[16px] h-0 border-t-2 border-dashed rounded-none"
                          style={{ borderColor: seriesColor, opacity: markerOpacity }}
                        ></div>
                      ) : (
                        <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: seriesColor, opacity: markerOpacity }}></div>
                      )}
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}
                {shouldShowLegendReset && (
                  <div
                    className="border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[5px] pl-[3px] pr-[4px] h-[18px] cursor-pointer"
                    onClick={resetLegendFilters}
                  >
                    <div className="w-[5px] h-[5px] rounded-full flex items-center justify-center">
                      <GTPIcon
                        icon={"gtp-close-monochrome"}
                        className={"!size-[7px] text-red-500"}
                        containerClassName="!size-[7px]"
                      />
                    </div>
                    <div className="text-xxxs whitespace-nowrap">Reset</div>
                  </div>
                )}
              </div>
            </div>
            <div className="h-full flex md:flex-row flex-col justify-between md:items-end items-center ">
              <div className="flex flex-row md:flex-col gap-y-[2px]"></div>
              {seeMetricURL && (
                <a className="bg-color-bg-medium md:w-auto w-full rounded-full pl-[15px] pr-[5px] flex items-center md:justify-normal justify-center h-[36px] gap-x-[8px] " href={seeMetricURL} rel="_noopener" style={{
                  border: `1px solid transparent`,
                backgroundImage: `linear-gradient(var(--Gradient-Red-Yellow, rgb(var(--bg-medium))), var(--Gradient-Red-Yellow, rgb(var(--bg-medium)))), linear-gradient(144.58deg, #FE5468 0%, #FF8F4F 70%, #FFDF27 100%)`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box'
              }}>
                <div className="heading-small-xs text-color-text-primary">See metric page</div>
                <div className="w-[24px] h-[24px] flex items-center justify-center bg-color-bg-medium rounded-full"><Icon icon={'fluent:arrow-right-32-filled'} className={`w-[15px] h-[15px]`}  /></div>
              </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartWrapper;


// const GetSeriesComponent = (series: any, jsonMeta: any, data: any, jsonData: any, filteredNames: string[], stacking: string, chartType: string) => {
//   {chartType === 'line' && (
//     (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;
     
//       return (
//         <LineSeries
//           animation={true}
//           key={series.name}
//           name={series.name}
//           data={seriesData}
//           color={series.color}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       );
//     })
//   )}  
  
//   {chartType === 'area' && (
//     (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;
      
//       return (
//         <AreaSeries
//           stacking={stacking ? stacking : undefined}
//           key={series.name}
//           name={series.name}
//           data={seriesData}
//           color={series.color}
//           animation={true}
//           states={{
//             hover: {
//               enabled: true,
//               brightness: 0.1,
//             },
//             inactive: {
//               opacity: 0.6,
//             },
//           }}
//           fillOpacity={0.3}
//           marker={{
//             enabled: false,
//           }}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       );
//     })
//   )}
  
//   if(series.type === "column") {
//     return (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       const useJson = jsonMeta ? true : false;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;

  
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       return(
//         <ColumnSeries
//           borderRadius="8%"
//           stacking={stacking ? stacking : undefined}
//           borderColor="transparent"
//           pointPlacement="on"
//           data={seriesData}
//           color={series.color}
//           name={series.name}
//           key={series.name}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       )
//     })
//   }
  
//   if(series.type === "pie") {
//     return (
//     <PieSeries
//       animation={true}
//       states={{
//         hover: {
//           enabled: true,
//           brightness: 0.1,
//         },
//         inactive: {
//           opacity: 0.6,
//         },
//       }}
//       allowPointSelect={true}
//       cursor="pointer"
//       borderWidth={0}
//       borderRadius={5}
//       dataLabels={{
//         enabled: false,
//       }}
//       showInLegend={true}
//     />
//     )
//   }
// }
