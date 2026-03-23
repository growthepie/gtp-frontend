// File: components/quick-bites/ChartWrapper.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Highcharts from 'highcharts/highstock';
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
import GTPChart, { GTPChartSeries, GTPChartXAxisLine } from "@/components/GTPButton/GTPChart";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPButtonDropdown from "@/components/GTPButton/GTPButtonDropdown";
import ShareDropdownContent from "@/components/layout/FloatingBar/ShareDropdownContent";
import { downloadElementAsImage } from "@/components/GTPButton/chartSnapshotHelpers";
import "@/app/highcharts.axis.css";
import { GTPIcon } from "../layout/GTPIcon";
import { Icon } from "@iconify/react";
import type { AxisLabelsFormatterContextObject } from 'highcharts';
import dayjs from "@/lib/dayjs";
import { format as d3Format } from "d3"

let highchartsInitialized = false;
interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'column' | 'pie';
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
      aggregation?: "daily" | "weekly" | "monthly"
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
  chainQuickBitesTopBar?: React.ReactNode;
  quickBiteTabRightEdgeFlush?: boolean;
  quickBiteTabLeftEdgeFlush?: boolean;
}

const normalizeSeriesLabel = (value: string) => value.toLowerCase().replace(/[\s:_-]+/g, "");
const DAY_MS = 24 * 60 * 60 * 1000;
const CHAIN_QUICKBITES_HEADER_ICON = "gtp-quick-bites-monochrome" as const;
const mapToGTPSeriesType = (value: string | undefined, fallback: ChartWrapperProps["chartType"]): GTPChartSeries["seriesType"] => {
  const normalized = (value || fallback || "line").toLowerCase();
  if (normalized === "column" || normalized === "bar") return "bar";
  if (normalized === "area") return "area";
  return "line";
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
  chainQuickBitesTopBar,
  quickBiteTabRightEdgeFlush = false,
  quickBiteTabLeftEdgeFlush = false,
}) => {
  const chartRef = useRef<any>(null);
  const chartCardRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);
  const [hoverLegendSeriesName, setHoverLegendSeriesName] = useState<string | null>(null);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);

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

  const processedSeriesData = useMemo(() => {
    if (!jsonMeta?.meta || !jsonData) return [];
    
    return jsonMeta.meta.map((series: any, index: number) => ({
      ...series,
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
  }, [jsonMeta, jsonData]);

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

  const filteredSeries = useMemo(() => {
    return processedSeriesData.filter(series => 
      filteredNames.length === 0 || filteredNames.includes(series.name)
    );
  }, [processedSeriesData, filteredNames]);

  const renderWithGTPChart = useMemo(() => {
    return useNewChart && chartType !== "pie" && processedSeriesData.length > 0;
  }, [chartType, processedSeriesData.length, useNewChart]);

  const gtpSeries = useMemo<GTPChartSeries[]>(() => {
    if (!renderWithGTPChart || orderedSeriesEntries.length === 0) return [];

    return orderedSeriesEntries.flatMap(({ series, processedData }) => {
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
  }, [chartType, filteredNames, orderedSeriesEntries, renderWithGTPChart]);

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
      const { x, points } = this;
      const dateFormat = shouldShowTimeInTooltip ? "DD MMM YYYY HH:mm" : "DD MMM YYYY";
      let dateString = dayjs.utc(x).format(dateFormat);
      const total = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const tooltip = `<div class="mt-3 mr-3 mb-3  text-xs font-raleway rounded-full bg-opacity-60 min-w-[240px]">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      const filteredPoints = showZeroTooltip ? points : points.filter((point: any) => point.y !== 0);
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
          const aValue = parseFloat(a.y);
          const bValue = parseFloat(b.y);
          return bValue - aValue;
        })
        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          
          const nameString = name.slice(0, 20);
          
          const color = series.color.stops ? series.color.stops[0][1] : series.color;

          
          // Match meta by series name instead of the sorted index so suffix/prefix follow the right series
          const metaEntry = jsonMeta?.meta.find((meta) => meta.name === name);
          const currentPrefix = metaEntry?.prefix || '';
          const currentSuffix = metaEntry?.suffix || '';
          const currentDecimals = metaEntry?.tooltipDecimals ?? 2;
          const stackingMode = metaEntry?.stacking;


          let displayValue = parseFloat(y).toLocaleString("en-GB", {
            minimumFractionDigits: currentDecimals,
            maximumFractionDigits: currentDecimals
          });

          let displayText;
          /* this might be wrong */
          if (stackingMode === "percent") {
            const percentageValue = ((y / total) * 100).toFixed(1); // keep 1 decimal
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
    [jsonMeta, shouldShowTimeInTooltip, disableTooltipSort, showZeroTooltip, showTotalTooltip],
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
  const filterableSeriesNames = useMemo(() => {
    const source = chartType === 'pie' && resolvedPieData
      ? resolvedPieData
      : (orderedSeriesEntries.length > 0 ? orderedSeriesEntries.map((entry) => entry.series) : (jsonMeta?.meta || data || []));

    if (!Array.isArray(source)) {
      return [];
    }

    const names = source
      .map((item: any) => (typeof item?.name === "string" ? item.name : ""))
      .filter((name: string) => name.length > 0);

    return Array.from(new Set(names));
  }, [chartType, resolvedPieData, orderedSeriesEntries, jsonMeta?.meta, data]);

  const legendCategories = useMemo(() => {
    const source = chartType === 'pie' && resolvedPieData
      ? resolvedPieData
      : (orderedSeriesEntries.length > 0 ? orderedSeriesEntries.map((entry) => entry.series) : (jsonMeta?.meta || data || []));
    return Array.isArray(source) ? source : [];
  }, [chartType, resolvedPieData, orderedSeriesEntries, jsonMeta?.meta, data]);

  const primaryLegendCategories = useMemo(
    () => legendCategories.filter((series: any) => !series.oppositeYAxis),
    [legendCategories],
  );

  const secondaryLegendCategories = useMemo(
    () => legendCategories.filter((series: any) => series.oppositeYAxis === true),
    [legendCategories],
  );

  const toggleLegendCategory = useCallback((name: string) => {
    if (!name) return;
    setFilteredNames((prev) => {
      if (!prev.includes(name)) {
        const next = [...prev, name];
        if (next.length === legendCategories.length) {
          return [];
        }
        return next;
      }
      return prev.filter((seriesName) => seriesName !== name);
    });
  }, [legendCategories.length]);

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
  const quickBitesTabWrapperStyle = isChainQuickBitesTabChart
    ? {
        width: "100%",
        maxWidth: "1250px",
        marginLeft: quickBiteTabRightEdgeFlush ? "auto" : undefined,
      }
    : undefined;

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
        } relative flex flex-col gap-y-[12px] h-full`}
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
              marginBottom={chartType === 'pie' ? 10 : (showXAsDate ? 32 : 20)}
              marginLeft={chartType === 'pie' ? undefined : 50}
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
                enabled: showXAsDate,
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
                } : undefined
              }}
              
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              lineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              tickColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              type={showXAsDate ? "datetime" : undefined}
              tickAmount={5}
              tickLength={15}
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
              type={options?.yAxis?.[0]?.type}
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
            >
              {chartType !== 'pie' && orderedSeriesEntries
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
                    marker={{
                      enabled: false,
                    }}
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
              type={options?.yAxis?.[1]?.type || options?.yAxis?.[0]?.type}
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
              
            >
              {orderedSeriesEntries
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
                    marker={{
                      enabled: false,
                    }}
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
                  const isActive = filteredNames.length === 0 || filteredNames.includes(category.name);
                  const seriesColor = typeof category.color === "string" ? category.color : "#999999";

                  return (
                    <GTPButton
                      key={category.name}
                      label={category.name}
                      variant={isActive ? "primary" : "no-background"}
                      size="xs"
                      clickHandler={() => toggleLegendCategory(category.name)}
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
                        <div
                          className="min-w-[6px] min-h-[6px] rounded-full"
                          style={{ backgroundColor: seriesColor, opacity: isActive ? 1 : 0.35 }}
                        />
                      )}
                    />
                  );
                })}
                {filteredNames.length > 0 && (
                  <GTPButton
                    label="Reset"
                    variant="highlight"
                    size="xs"
                    leftIcon="gtp-close-monochrome"
                    clickHandler={() => setFilteredNames([])}
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
          <div className="md:px-[50px] relative bottom-[2px] flex flex-col justify-between gap-y-[5px] md:gap-y-0">
            <div className="flex flex-col gap-y-[5px]">
              <div className="flex flex-1 gap-[5px] flex-wrap items-center justify-center">
                {(chartType === 'pie' && resolvedPieData ? resolvedPieData : (jsonMeta?.meta || data)).filter((series: any) => !series.oppositeYAxis).map((category: any) => {
                  const allCategories: any[] = chartType === 'pie' && resolvedPieData ? resolvedPieData : (jsonMeta?.meta || data);
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if(filteredNames.length > 0 && (!filteredNames.includes(category.name))) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }

                  return (
                    <div key={category.name} className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`} onClick={() => {
                      if(!filteredNames.includes(category.name)) {
                        setFilteredNames((prev) => {
                          const newFilteredNames = [...prev, category.name];
                          if (newFilteredNames.length === allCategories.length) {
                            return [];
                          }
                          return newFilteredNames;
                        });
                      } else {
                        setFilteredNames((prev) => prev.filter((name) => name !== category.name));
                      }
                    }}>
                      <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: category.color }}></div>
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}

                {(jsonMeta?.meta || data).filter((series: any) => series.oppositeYAxis === true).map((category) => {
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if(filteredNames.length > 0 && (!filteredNames.includes(category.name))) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }

                  return (
                    <div key={category.name} className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`} onClick={() => {
                      if(!filteredNames.includes(category.name)) {
                        setFilteredNames((prev) => {
                          const newFilteredNames = [...prev, category.name];
                          if (newFilteredNames.length === (jsonMeta?.meta || data).length) {
                            return [];
                          }
                          return newFilteredNames;
                        });
                      } else {
                        setFilteredNames((prev) => prev.filter((name) => name !== category.name));
                      }
                    }}>
                      <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: category.color }}></div>
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}
              </div>
              {filteredNames && filteredNames.length > 0 && (
                <div className={`flex items-center justify-center rounded-full gap-x-[5px] pl-[3px] pr-[4px] h-[18px] cursor-pointer `} onClick={() => setFilteredNames([])}>
                  <div className="w-[5px] h-[5px] rounded-full flex items-center justify-center"><GTPIcon icon={"gtp-close-monochrome"} className={`!size-[7px] text-red-500`} containerClassName='!size-[7px]'  /></div>
                  <div className="text-xxxs whitespace-nowrap">Reset</div>
                </div>
              )}
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
