"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricData, useSyncSelectedChainsToDataContext } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { daMetricItems, metricItems } from "@/lib/metrics";
import { useTheme } from "next-themes";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { formatCompactNumber } from "@/lib/echarts-utils";
import { GTPButton } from "../GTPComponents/ButtonComponents/GTPButton";
import colors from "tailwindcss/colors";
import { useState } from "react";
import { useUIContext } from "@/contexts/UIContext";
import {
  getLaunchTimestamp,
  getRelativeLaunchIndex,
  isExcludedFromSinceLaunch,
  isSinceLaunchInterval,
  SINCE_LAUNCH_UNIT_BY_INTERVAL,
} from "./launchDate";
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
  /** True when the chart pane is stacked above the table (split pane in its mobile
   *  layout, bottom bar in-flow directly below the chart). Driven by the split pane's
   *  actual content width — not the viewport — so the reserved legend footer is dropped
   *  whenever the bottom bar sits under the chart, even when a wide viewport is narrowed
   *  by the sidebar. */
  isStacked?: boolean;
};

const getSeriesType = (
  selectedScale: string,
  timeIntervalKey: string,
): GTPChartSeries["seriesType"] => {
  if (selectedScale === "absolute") return "line";
  if (selectedScale === "percentage") return "area";
  return timeIntervalKey === "daily" || timeIntervalKey === "daily_7d_rolling" ? "area" : "bar";
};

export default function MetricChart({ metric_type, suffix, prefix, decimals, selectedRange, setSelectedRange, collapseTable, isStacked = false }: MetricChartProps) {
  const { data: master } = useMaster();
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const [showUsd] = useLocalStorage("showUsd", true);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const { theme } = useTheme();
  const { data, metric_id, chainKeys, timespans } = useMetricData();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const containerMobile = useMediaQuery("(max-width: 967px)");
  const [hoverChainKey, setHoverChainKey] = useState<string | null>(null);
  const {
    selectedScale,
    selectedTimespan,
    selectedTimeInterval,
    timeIntervalKey,
    selectedChains,
    setSelectedChains,
    showEthereumMainnet,
  } = useMetricChartControls();
  const sinceLaunchInterval = isSinceLaunchInterval(selectedTimeInterval)
    ? selectedTimeInterval
    : "daily";
  const isSinceLaunch = selectedTimespan === "sinceLaunch" && isSinceLaunchInterval(selectedTimeInterval);
  const sinceLaunchUnit = SINCE_LAUNCH_UNIT_BY_INTERVAL[sinceLaunchInterval];
  const sinceLaunchLabel = sinceLaunchUnit.charAt(0).toUpperCase() + sinceLaunchUnit.slice(1);
  const effectiveSelectedScale = isSinceLaunch ? "absolute" : selectedScale;

  // Keep MetricDataContext chain selection aligned with controls so timespans/x-axis bounds stay correct.
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

  const seriesNameToChainKey = useMemo(() => {
    const metadataByKey =
      metric_type === "fundamentals" ? master?.chains : master?.da_layers;
    const map = new Map<string, string>();
    chainKeys.forEach((chainKey) => {
      const name = metadataByKey?.[chainKey]?.name ?? chainKey;
      map.set(name, chainKey);
    });
    return map;
  }, [chainKeys, master?.chains, master?.da_layers, metric_type]);

  // Snapshot the selected chains at the moment the table is collapsed: that
  // freezes the legend's chain list so toggling a chain off in the legend
  // dims it instead of making it disappear. The snapshot is cleared whenever
  // the table is reopened so the next close captures a fresh set. We adjust
  // this during render (tracking the previous collapse state) rather than in
  // an effect, which avoids the extra commit/cascading render.
  const [legendChainKeys, setLegendChainKeys] = useState<string[] | null>(null);
  const [wasTableCollapsed, setWasTableCollapsed] = useState(collapseTable);

  if (collapseTable !== wasTableCollapsed) {
    setWasTableCollapsed(collapseTable);
    setLegendChainKeys(collapseTable ? [...selectedChains] : null);
  }

  const handleLegendToggle = useCallback(
    (seriesName: string, isActive: boolean) => {
      const chainKey = seriesNameToChainKey.get(seriesName);
      if (!chainKey) return;
      if (isActive) {
        if (!selectedChains.includes(chainKey)) {
          setSelectedChains([...selectedChains, chainKey]);
        }
      } else {
        // Enforce a minimum of one active chain so the chart never goes blank.
        if (selectedChains.length <= 1) return;
        setSelectedChains(selectedChains.filter((c) => c !== chainKey));
      }
    },
    [seriesNameToChainKey, selectedChains, setSelectedChains],
  );

  const chartSeries = useMemo<GTPChartSeries[]>(() => {
    if (!data) return [];

    const metadataByKey =
      metric_type === "fundamentals" ? master?.chains : master?.da_layers;
    const seriesType = getSeriesType(effectiveSelectedScale, timeIntervalKey);

    // When the table is hidden, the legend universe is frozen to whatever
    // chains were selected at close time — so the chart needs to include all
    // of them as series (deselected ones get dimmed/hidden via the legend's
    // inactive set). When the table is open there is no legend, so filter to
    // selectedChains directly.
    const legendUniverse = legendChainKeys ?? selectedChains;
    const candidateKeys = collapseTable
      ? chainKeys.filter((chainKey) => legendUniverse.includes(chainKey))
      : chainKeys.filter((chainKey) => selectedChains.includes(chainKey));

    return candidateKeys
      .filter((chainKey) => {
        // These chains have no data back to their launch, so they can't be rebased
        // to a "since launch" index — drop them from the since-launch view.
        if (isSinceLaunch && isExcludedFromSinceLaunch(chainKey, metric_id)) return false;
        if (chainKey !== "ethereum") return true;
        if (!focusEnabled) return true;
        return showEthereumMainnet;
      })
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
        const launchTimestamp = getLaunchTimestamp(master?.chains, chainKey) ?? chainData.data?.[0]?.[0];
        const points: [number, number | null][] = (chainData.data ?? []).map((row) => {
          const rawValue = row[valueIndex];
          const xValue = isSinceLaunch && Number.isFinite(launchTimestamp)
            ? getRelativeLaunchIndex(row[0], launchTimestamp, sinceLaunchInterval)
            : row[0];
          if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
            return [xValue, null];
          }
          return [xValue, rawValue * multiplier];
        });

        const chainMeta = metadataByKey?.[chainKey];
        const colors = chainMeta?.colors?.[theme ?? "dark"];

        const series: GTPChartSeries = {
          name: chainMeta?.name ?? chainKey,
          data: points,
          seriesType,
          color: colors ? [colors[0], colors[1]] : undefined,
          pattern: "dashed",
          dashedLastSegment:
            effectiveSelectedScale === "absolute" && (timeIntervalKey === "monthly" || timeIntervalKey === "weekly"),
        };
        return series;
      })
      .filter((item): item is GTPChartSeries => Boolean(item))
      .sort((a, b) => {
        const aFirst = a.data.find((p) => p[1] !== null)?.[0] ?? Infinity;
        const bFirst = b.data.find((p) => p[1] !== null)?.[0] ?? Infinity;
        return aFirst - bFirst;
      });
  }, [
    theme,
    chainKeys,
    collapseTable,
    data,
    focusEnabled,
    legendChainKeys,
    master?.chains,
    master?.da_layers,
    metric_id,
    metric_type,
    selectedChains,
    effectiveSelectedScale,
    showEthereumMainnet,
    showGwei,
    showUsd,
    isSinceLaunch,
    sinceLaunchInterval,
    timeIntervalKey,
  ]);

  const legendInactiveSeriesNames = useMemo(() => {
    if (!collapseTable) return undefined;
    const metadataByKey =
      metric_type === "fundamentals" ? master?.chains : master?.da_layers;
    const universe = legendChainKeys ?? selectedChains;
    return universe
      .filter((chainKey) => !selectedChains.includes(chainKey))
      .map((chainKey) => metadataByKey?.[chainKey]?.name ?? chainKey);
  }, [collapseTable, legendChainKeys, selectedChains, metric_type, master?.chains, master?.da_layers]);

  const yAxisLabelFormatter = useCallback((value: number) => {
    return `${effectiveSelectedScale === "percentage" ? "" : prefix ?? ""}${formatCompactNumber(value, decimals)}${effectiveSelectedScale === "percentage" ? "%" : suffix ?? ""}`;
  }, [effectiveSelectedScale, prefix, decimals, suffix]);

  const activeTimespan = timespans[selectedTimespan] ?? timespans?.["max"] ?? undefined;
  const visibleSelectedChains = selectedChains.slice(0, 9);
  const hiddenSelectedChainsCount = Math.max(selectedChains.length - visibleSelectedChains.length, 0);

  return (
    <div className="">
        <GTPChart
          series={chartSeries}
          stack={effectiveSelectedScale === "stacked"}
          percentageMode={effectiveSelectedScale === "percentage"}
          
          xAxisType={isSinceLaunch ? "value" : "time"}
          xAxisLabelFormatter={isSinceLaunch ? (value) => `${sinceLaunchLabel} ${Math.round(Number(value))}` : undefined}
          xAxisTooltipLabelFormatter={isSinceLaunch ? (value) => `${sinceLaunchLabel} ${Math.round(Number(value))}` : undefined}
          grid={isSinceLaunch ? { right: 25 } : undefined}
          snapToCleanBoundary={false}
          xAxisMin={selectedRange ? selectedRange[0] : activeTimespan?.xMin}
          xAxisMax={selectedRange ? selectedRange[1] : activeTimespan?.xMax}
          suffix={suffix}
          prefix={prefix}
          tooltipTitle={metricMeta?.name ?? undefined}
          decimals={decimals}
          limitTooltipRows={10}
          watermarkMetricName={metricMeta?.name ?? null}
          showWatermark
          className={isStacked ? undefined : "mb-[30px]"}
          height={(containerMobile ? 300 : 440) + 30}

          emptyStateMessage="Select chains to show their historic data"
          onDragSelect={(xStart, xEnd) => {
            
            if(xStart < xEnd) {
              setSelectedRange([Math.floor(xStart), Math.floor(xEnd)]);
            } else {
              setSelectedRange([Math.floor(xEnd), Math.floor(xStart)]);
            }
          }}
          dragSelectOverlayColor="rgb(var(--text-secondary) / 50%)"
          dragSelectIcon={"feather:zoom-in" as GTPIconName}
          minDragSelectPoints={2}
          yAxisLabelFormatter={yAxisLabelFormatter}
          showTooltipTimestamp={timeIntervalKey === "hourly"}
          showTotal={effectiveSelectedScale === "stacked"}
          reverseTooltipOrder={reversePerformer}
          showLegend={collapseTable}
          legendLift={!isStacked}
          legendInactiveSeries={legendInactiveSeriesNames}
          onLegendToggle={handleLegendToggle}
        />
  </div>

  );
}
