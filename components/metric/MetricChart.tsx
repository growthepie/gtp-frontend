"use client";

import { useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricData, useSyncSelectedChainsToDataContext } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { daMetricItems, metricItems } from "@/lib/metrics";
import { useTheme } from "next-themes";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { escapeHtml, formatCompactNumber } from "@/lib/echarts-utils";
import { GTPButton } from "../GTPComponents/ButtonComponents/GTPButton";
import colors from "tailwindcss/colors";

type MetricChartProps = {
  collapseTable: boolean;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  metric_type: "fundamentals" | "data-availability";
  is_embed?: boolean;
  embed_zoomed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
  type?: string;
  selectedRange: [number, number] | null;
  setSelectedRange: (range: [number, number] | null) => void;
};

type TransformedChainSeries = {
  chainKey: string;
  label: string;
  points: [number, number | null][];
  color?: [string, string];
};

type NetSupplyEntry = TransformedChainSeries & {
  startValue: number;
  endValue: number;
  netSupply: number;
};

const getSeriesType = (
  selectedScale: string,
  timeIntervalKey: string,
): GTPChartSeries["seriesType"] => {
  if (selectedScale === "absolute") return "line";
  if (selectedScale === "percentage") return "area";
  return timeIntervalKey === "daily" || timeIntervalKey === "daily_7d_rolling" ? "area" : "bar";
};

const NET_SUPPLY_POSITIVE_COLORS: [string, string] = [
  colors.emerald[500],
  colors.emerald[300],
];

const NET_SUPPLY_NEGATIVE_COLORS: [string, string] = [
  colors.rose[500],
  colors.rose[300],
];

const getNiceStep = (raw: number) => {
  const safeRaw = Math.max(raw, Number.EPSILON);
  const magnitude = 10 ** Math.floor(Math.log10(safeRaw));
  const normalized = safeRaw / magnitude;

  if (normalized <= 1.5) return 1 * magnitude;
  if (normalized <= 2.25) return 2 * magnitude;
  if (normalized <= 3.75) return 2.5 * magnitude;
  if (normalized <= 7.5) return 5 * magnitude;
  return 10 * magnitude;
};

const formatSignedMetricValue = ({
  value,
  prefix,
  suffix,
  decimals,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) => {
  const sign = value < 0 ? "-" : "";
  return `${sign}${prefix ?? ""}${formatCompactNumber(Math.abs(value), decimals)}${suffix ?? ""}`;
};

const getBoundaryPoint = (
  points: [number, number | null][],
  target: number | undefined,
  boundary: "start" | "end",
) => {
  const validPoints = points.filter(
    (point): point is [number, number] =>
      typeof point[1] === "number" && Number.isFinite(point[1]),
  );

  if (validPoints.length === 0) {
    return null;
  }

  if (!Number.isFinite(target)) {
    return boundary === "start" ? validPoints[0] : validPoints[validPoints.length - 1];
  }

  if (boundary === "start") {
    for (let i = validPoints.length - 1; i >= 0; i -= 1) {
      if (validPoints[i][0] <= target) {
        return validPoints[i];
      }
    }

    return validPoints.find((point) => point[0] >= target) ?? validPoints[0];
  }

  for (let i = validPoints.length - 1; i >= 0; i -= 1) {
    if (validPoints[i][0] <= target) {
      return validPoints[i];
    }
  }

  return validPoints[validPoints.length - 1];
};

export default function MetricChart({
  metric_type,
  suffix,
  prefix,
  decimals,
  selectedRange,
  setSelectedRange,
  collapseTable,
}: MetricChartProps) {
  const { data: master } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const { theme } = useTheme();
  const { data, metric_id, chainKeys, timespans } = useMetricData();
  const containerMobile = useMediaQuery("(max-width: 967px)");
  const [hoverChainKey, setHoverChainKey] = useState<string | null>(null);
  const {
    selectedScale,
    selectedTimespan,
    timeIntervalKey,
    selectedChains,
    setSelectedChains,
    showEthereumMainnet,
  } = useMetricChartControls();

  useSyncSelectedChainsToDataContext(selectedChains);

  const metricMeta = useMemo(() => {
    if (!metric_id) return undefined;
    return metric_type === "fundamentals"
      ? master?.metrics?.[metric_id]
      : master?.da_metrics?.[metric_id];
  }, [master, metric_id, metric_type]);

  const [showGwei, reversePerformer] = useMemo(() => {
    const navItem =
      metric_type === "fundamentals"
        ? metricItems.find((item) => item.key === metric_id)
        : daMetricItems.find((item) => item.key === metric_id);

    return [
      Boolean(navItem?.page?.showGwei),
      Boolean(navItem?.page?.reversePerformer),
    ] as const;
  }, [metric_id, metric_type]);

  const activeTimespan = timespans[selectedTimespan] ?? timespans?.["max"] ?? undefined;
  const rangeStart = selectedRange?.[0] ?? activeTimespan?.xMin;
  const rangeEnd = selectedRange?.[1] ?? activeTimespan?.xMax;
  const isNetSupplyMode = selectedScale === "netSupply" && metric_id === "stables_mcap";
  const textPrimary = theme === "light" ? "rgb(31, 39, 38)" : "rgb(205, 216, 211)";
  const metadataByKey =
    metric_type === "fundamentals" ? master?.chains : master?.da_layers;

  const visibleChainKeys = useMemo(
    () =>
      chainKeys
        .filter((chainKey) => selectedChains.includes(chainKey))
        .filter((chainKey) => {
          if (chainKey !== "ethereum") return true;
          if (!focusEnabled) return true;
          return showEthereumMainnet;
        }),
    [chainKeys, focusEnabled, selectedChains, showEthereumMainnet],
  );

  const transformedSeriesByChain = useMemo<TransformedChainSeries[]>(() => {
    if (!data) return [];

    return visibleChainKeys
      .map((chainKey) => {
        const chainData = data.chains[chainKey]?.[timeIntervalKey];
        if (!chainData) return null;

        const valueTypes = chainData.types ?? [];
        const usdIdx = valueTypes.indexOf("usd");
        const ethIdx = valueTypes.indexOf("eth");

        let valueIndex = valueTypes.length > 1 ? 1 : 0;
        if (usdIdx !== -1 && ethIdx !== -1) {
          valueIndex = showUsd ? usdIdx : ethIdx;
        }

        const multiplier = !showUsd && showGwei && ethIdx !== -1 ? 1_000_000_000 : 1;
        const points: [number, number | null][] = (chainData.data ?? []).map((row) => {
          const rawValue = row[valueIndex];
          if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
            return [row[0], null];
          }

          return [row[0], rawValue * multiplier];
        });

        const chainMeta = metadataByKey?.[chainKey];
        const chainColors = chainMeta?.colors?.[theme ?? "dark"];

        return {
          chainKey,
          label: chainMeta?.name ?? chainKey,
          points,
          color: chainColors ? [chainColors[0], chainColors[1]] as [string, string] : undefined,
        };
      })
      .filter((item): item is TransformedChainSeries => Boolean(item));
  }, [
    data,
    metadataByKey,
    showGwei,
    showUsd,
    theme,
    timeIntervalKey,
    visibleChainKeys,
  ]);

  const netSupplyEntries = useMemo<NetSupplyEntry[]>(() => {
    if (!isNetSupplyMode) return [];

    return transformedSeriesByChain
      .map((series) => {
        const startPoint = getBoundaryPoint(series.points, rangeStart, "start");
        const endPoint = getBoundaryPoint(series.points, rangeEnd, "end");

        if (!startPoint || !endPoint || endPoint[0] < startPoint[0]) {
          return null;
        }

        return {
          ...series,
          startValue: startPoint[1],
          endValue: endPoint[1],
          netSupply: endPoint[1] - startPoint[1],
        };
      })
      .filter((item): item is NetSupplyEntry => Boolean(item))
      .sort((a, b) => {
        if (b.netSupply !== a.netSupply) {
          return b.netSupply - a.netSupply;
        }

        return a.label.localeCompare(b.label);
      });
  }, [isNetSupplyMode, rangeEnd, rangeStart, transformedSeriesByChain]);

  const chartSeries = useMemo<GTPChartSeries[]>(() => {
    if (isNetSupplyMode) {
      return [{
        name: "Net Supply",
        data: netSupplyEntries.map((entry, pointIndex) => [
          pointIndex,
          entry.netSupply,
        ]),
        seriesType: "bar",
        color: NET_SUPPLY_POSITIVE_COLORS,
        negativeColor: NET_SUPPLY_NEGATIVE_COLORS,
      }];
    }

    const seriesType = getSeriesType(selectedScale, timeIntervalKey);

    return transformedSeriesByChain
      .map((series) => ({
        name: series.label,
        data: series.points,
        seriesType,
        color: series.color,
        pattern: "dashed" as const,
        dashedLastSegment:
          selectedScale === "absolute" &&
          (timeIntervalKey === "monthly" || timeIntervalKey === "weekly"),
      }))
      .sort((a, b) => {
        const aFirst = a.data.find((point) => point[1] !== null)?.[0] ?? Infinity;
        const bFirst = b.data.find((point) => point[1] !== null)?.[0] ?? Infinity;
        return aFirst - bFirst;
      });
  }, [
    isNetSupplyMode,
    netSupplyEntries,
    selectedScale,
    timeIntervalKey,
    transformedSeriesByChain,
  ]);

  const netSupplyXAxis = useMemo(() => {
    if (!isNetSupplyMode) return undefined;

    const values = netSupplyEntries.map((entry) => entry.netSupply);
    const minValue = values.length > 0 ? Math.min(...values, 0) : 0;
    const maxValue = values.length > 0 ? Math.max(...values, 0) : 0;
    const step = getNiceStep(Math.max(maxValue - minValue, 1) / 6);
    const minBound = minValue < 0 ? Math.floor(minValue / step) * step : 0;
    const maxBound = maxValue > 0 ? Math.ceil(maxValue / step) * step : 0;

    return {
      type: "value",
      min: minBound,
      max: maxBound,
      interval: step,
      boundaryGap: [0, 0],
      axisLine: {
        lineStyle: {
          color:
            theme === "light"
              ? "rgba(31, 39, 38, 0.45)"
              : "rgba(205, 216, 211, 0.45)",
        },
      },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        color: textPrimary,
        fontSize: 10,
        fontFamily: "var(--font-fira-sans), sans-serif",
        fontWeight: 500,
        formatter: (value: number) => formatSignedMetricValue({ value, prefix, suffix, decimals }),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color:
            theme === "light"
              ? "rgba(31, 39, 38, 0.12)"
              : "rgba(205, 216, 211, 0.12)",
          type: "dashed",
        },
      },
    };
  }, [decimals, isNetSupplyMode, netSupplyEntries, prefix, suffix, textPrimary, theme]);

  const netSupplyYAxis = useMemo(() => {
    if (!isNetSupplyMode) return undefined;

    return {
      type: "category",
      data: netSupplyEntries.map((entry) => entry.label),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        interval: 0,
        color: textPrimary,
        fontSize: 11,
        fontFamily: "var(--font-raleway), sans-serif",
        fontWeight: 600,
        margin: 14,
        formatter: (value: string) =>
          value.length > 18 ? `${value.slice(0, 17)}...` : value,
      },
      splitLine: { show: false },
    };
  }, [isNetSupplyMode, netSupplyEntries, textPrimary]);

  const netSupplyTooltipFormatter = useMemo(() => {
    if (!isNetSupplyMode) return undefined;

    return (params: { value: [number, number]; seriesName: string; color?: string }[]) => {
      const point = params.find((param) => Number.isFinite(param.value?.[1]));
      if (!point) return "";

      const entryIndex = Number(point.value?.[0]);
      const entry = Number.isInteger(entryIndex) ? netSupplyEntries[entryIndex] : undefined;
      if (!entry) return "";

      const markerColor =
        entry.netSupply >= 0 ? NET_SUPPLY_POSITIVE_COLORS[0] : NET_SUPPLY_NEGATIVE_COLORS[0];
      const netSupplyLabel = formatSignedMetricValue({
        value: entry.netSupply,
        prefix,
        suffix,
        decimals,
      });
      const startValueLabel = formatSignedMetricValue({
        value: entry.startValue,
        prefix,
        suffix,
        decimals,
      });
      const endValueLabel = formatSignedMetricValue({
        value: entry.endValue,
        prefix,
        suffix,
        decimals,
      });

      return `
        <div class="flex min-w-[220px] flex-col gap-y-[8px] rounded-[14px] bg-color-bg-default px-[15px] py-[14px]">
          <div class="text-[10px] font-semibold uppercase tracking-[0.08em] text-color-text-secondary">Net Supply Change</div>
          <div class="flex items-center gap-x-[8px]">
            <div class="h-[8px] w-[8px] rounded-full" style="background:${markerColor};"></div>
            <div class="text-xs font-medium text-color-text-primary">${escapeHtml(entry.label)}</div>
            <div class="ml-auto numbers-xs text-color-text-primary">${escapeHtml(netSupplyLabel)}</div>
          </div>
          <div class="grid grid-cols-[1fr_auto] gap-x-[12px] gap-y-[2px] text-[10px] text-color-text-secondary">
            <div>Start</div>
            <div class="numbers-xxs text-color-text-primary">${escapeHtml(startValueLabel)}</div>
            <div>Latest</div>
            <div class="numbers-xxs text-color-text-primary">${escapeHtml(endValueLabel)}</div>
          </div>
        </div>
      `;
    };
  }, [decimals, isNetSupplyMode, netSupplyEntries, prefix, suffix]);

  const netSupplyGrid = useMemo(() => {
    if (!isNetSupplyMode) return undefined;

    const longestLabel = netSupplyEntries.reduce(
      (max, entry) => Math.max(max, entry.label.length),
      0,
    );
    const left = Math.min(Math.max(100, longestLabel * 7 + 28), 190);

    return { left, right: 12, top: 12, bottom: 26 };
  }, [isNetSupplyMode, netSupplyEntries]);

  const visibleSelectedChains = selectedChains.slice(0, 9);
  const hiddenSelectedChainsCount = Math.max(selectedChains.length - visibleSelectedChains.length, 0);

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height: containerMobile
          ? `${300 + (collapseTable ? 30 : 0)}px`
          : collapseTable
            ? `${400 + (collapseTable ? 30 : 0)}px`
            : `${440 + (collapseTable ? 30 : 0)}px`,
      }}
    >
      <GTPChart
        series={chartSeries}
        stack={!isNetSupplyMode && selectedScale === "stacked"}
        percentageMode={!isNetSupplyMode && selectedScale === "percentage"}
        xAxisType={isNetSupplyMode ? "category" : "time"}
        xAxisMin={isNetSupplyMode ? undefined : rangeStart}
        xAxisMax={isNetSupplyMode ? undefined : rangeEnd}
        suffix={suffix}
        prefix={prefix}
        tooltipTitle={isNetSupplyMode ? "Net Supply Change" : metricMeta?.name ?? undefined}
        decimals={decimals}
        limitTooltipRows={10}
        watermarkMetricName={metricMeta?.name ?? null}
        showWatermark
        height={containerMobile ? 300 : 415}
        minHeight={containerMobile ? 300 : 415}
        maxHeight={containerMobile ? 300 : 415}
        emptyStateMessage="Select chains to show their historic data"
        onDragSelect={
          isNetSupplyMode
            ? undefined
            : (xStart, xEnd) => {
                if (xStart < xEnd) {
                  setSelectedRange([Math.floor(xStart), Math.floor(xEnd)]);
                } else {
                  setSelectedRange([Math.floor(xEnd), Math.floor(xStart)]);
                }
              }
        }
        dragSelectOverlayColor="rgb(var(--text-secondary) / 50%)"
        dragSelectIcon={"feather:zoom-in" as GTPIconName}
        minDragSelectPoints={2}
        yAxisLabelFormatter={(value) => {
          if (selectedScale === "percentage") {
            return `${formatCompactNumber(value, decimals)}%`;
          }

          if (isNetSupplyMode) {
            return formatSignedMetricValue({ value, prefix, suffix, decimals });
          }

          return `${prefix ?? ""}${formatCompactNumber(value, decimals)}${suffix ?? ""}`;
        }}
        showTooltipTimestamp={!isNetSupplyMode && timeIntervalKey === "hourly"}
        showTotal={!isNetSupplyMode && selectedScale === "stacked"}
        reverseTooltipOrder={reversePerformer}
        barMaxWidth={isNetSupplyMode ? 46 : undefined}
        grid={netSupplyGrid}
        tooltipFormatter={netSupplyTooltipFormatter}
        xAxisLines={isNetSupplyMode ? [{ xValue: 0, lineColor: textPrimary, lineWidth: 1 }] : undefined}
        seriesOverrides={
          isNetSupplyMode
            ? (seriesConfig) => ({
                ...seriesConfig,
                encode: { x: 1, y: 0 },
              })
            : undefined
        }
        optionOverrides={
          isNetSupplyMode && netSupplyXAxis && netSupplyYAxis
            ? {
                xAxis: netSupplyXAxis,
                yAxis: netSupplyYAxis,
              }
            : undefined
        }
      />

      {collapseTable && (
        <div className="relative bottom-[9px] flex h-[30px] w-full items-center justify-center gap-[5px]">
          {visibleSelectedChains.map((chain) => (
            <GTPButton
              key={chain}
              label={master?.chains?.[chain]?.name}
              variant="primary"
              size="xs"
              clickHandler={() => {
                setSelectedChains(selectedChains.filter((selectedChain) => selectedChain !== chain));
              }}
              onMouseEnter={() => setHoverChainKey(chain)}
              onMouseLeave={() => setHoverChainKey(null)}
              rightIcon={hoverChainKey === chain ? "in-button-close" : undefined}
              rightIconClassname="!w-[12px] !h-[12px]"
              leftIconOverride={
                <div
                  className="min-h-[6px] min-w-[6px] rounded-full"
                  style={{ backgroundColor: master?.chains?.[chain]?.colors?.[theme ?? "dark"]?.[0] }}
                />
              }
            />
          ))}
          {hiddenSelectedChainsCount > 0 && (
            <GTPButton
              key="hidden-chains"
              label={`+${hiddenSelectedChainsCount} chains`}
              variant="primary"
              size="xs"
            />
          )}
        </div>
      )}
    </div>
  );
}
