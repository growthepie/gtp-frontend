"use client";

import { useMemo } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import GTPChart, { GTPChartSeries } from "@/components/GTPButton/GTPChart";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricData, useSyncSelectedChainsToDataContext } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { daMetricItems, metricItems } from "@/lib/metrics";
import { useTheme } from "next-themes";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { formatCompactNumber } from "@/lib/echarts-utils";
import { GTPButton } from "../GTPButton/GTPButton";
import colors from "tailwindcss/colors";
import { useState } from "react";

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

const getSeriesType = (
  selectedScale: string,
  timeIntervalKey: string,
): GTPChartSeries["seriesType"] => {
  if (selectedScale === "absolute") return "line";
  if (selectedScale === "percentage") return "area";
  return timeIntervalKey === "daily" || timeIntervalKey === "daily_7d_rolling" ? "area" : "bar";
};

export default function MetricChart({ metric_type, suffix, prefix, decimals, selectedRange, setSelectedRange, collapseTable }: MetricChartProps) {
  const { data: master } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const { theme } = useTheme();
  const { data, metric_id, chainKeys, timespans } = useMetricData();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [hoverChainKey, setHoverChainKey] = useState<string | null>(null);
  const {
    selectedScale,
    selectedTimespan,
    timeIntervalKey,
    selectedChains,
    setSelectedChains,
    showEthereumMainnet,
  } = useMetricChartControls();

  // Keep MetricDataContext chain selection aligned with controls so timespans/x-axis bounds stay correct.
  useSyncSelectedChainsToDataContext(selectedChains);

  const metricMeta = useMemo(() => {
    if (!metric_id) return undefined;
    return metric_type === "fundamentals"
      ? master?.metrics?.[metric_id]
      : master?.da_metrics?.[metric_id];
  }, [master, metric_id, metric_type]);

  const showGwei = useMemo(() => {
    const navItem =
      metric_type === "fundamentals"
        ? metricItems.find((item) => item.key === metric_id)
        : daMetricItems.find((item) => item.key === metric_id);

    return Boolean(navItem?.page?.showGwei);
  }, [metric_id, metric_type]);

  const chartSeries = useMemo<GTPChartSeries[]>(() => {
    if (!data) return [];

    const metadataByKey =
      metric_type === "fundamentals" ? master?.chains : master?.da_layers;
    const seriesType = getSeriesType(selectedScale, timeIntervalKey);

    return chainKeys
      .filter((chainKey) => selectedChains.includes(chainKey))
      .filter((chainKey) => {
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
        const points: [number, number | null][] = (chainData.data ?? []).map((row) => {
          const rawValue = row[valueIndex];
          if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
            return [row[0], null];
          }
          return [row[0], rawValue * multiplier];
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
            selectedScale === "absolute" && timeIntervalKey === "monthly",
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
    data,
    focusEnabled,
    master?.chains,
    master?.da_layers,
    metric_type,
    selectedChains,
    selectedScale,
    showEthereumMainnet,
    showGwei,
    showUsd,
    timeIntervalKey,
  ]);

  const activeTimespan = timespans[selectedTimespan] ?? timespans?.["max"] ?? undefined;

  return (
    <div className="w-full h-full ">
      <GTPChart
        series={chartSeries}
        stack={selectedScale === "stacked"}
        percentageMode={selectedScale === "percentage"}
        xAxisType="time"
        xAxisMin={selectedRange ? selectedRange[0] : activeTimespan?.xMin}
        xAxisMax={selectedRange ? selectedRange[1] : activeTimespan?.xMax}
        suffix={suffix}
        prefix={prefix}
        tooltipTitle={metricMeta?.name ?? undefined}
        decimals={decimals}
        limitTooltipRows={10}
        watermarkMetricName={metricMeta?.name ?? null}
        showWatermark
        minHeight={isMobile ? 300 : collapseTable ? 400 : 440}
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
        yAxisLabelFormatter={(value) => {
          return `${prefix ?? ""}${formatCompactNumber(value, decimals)}${` ${suffix ?? ""}`}`;
        }}
        showTooltipTimestamp={timeIntervalKey === "hourly"}
      />
      {collapseTable && (
        <div className="h-[30px] w-full relative flex items-center justify-center gap-[5px] bottom-[30px]" >
          {selectedChains.map((chain) => (
            <div
              key={chain}
              onMouseEnter={() => setHoverChainKey(chain)}
              onMouseLeave={() => setHoverChainKey(null)}
            >
              <GTPButton
                label={master?.chains?.[chain]?.name}
                variant="primary"
                size="xs"
                clickHandler={() => {
                  setSelectedChains(selectedChains.filter((selectedChain) => selectedChain !== chain));
                }}
                rightIcon={hoverChainKey === chain ? "in-button-close" : undefined}
                rightIconClassname="!w-[12px] !h-[12px]"
                leftIconOverride={<div className="min-w-[6px] min-h-[6px] rounded-full" style={{ backgroundColor: master?.chains?.[chain]?.colors?.[theme ?? "dark"]?.[0] }}></div>}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
