"use client";

import { useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import GTPChart, { GTPChartSeries } from "@/components/GTPButton/GTPChart";
import { useMaster } from "@/contexts/MasterContext";
import { useMetricData, useSyncSelectedChainsToDataContext } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { daMetricItems, metricItems } from "@/lib/metrics";

type MetricChartProps = {
  metric_type: "fundamentals" | "data-availability";
  is_embed?: boolean;
  embed_zoomed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
  type?: string;
};

const getSeriesType = (
  selectedScale: string,
  timeIntervalKey: string,
): GTPChartSeries["seriesType"] => {
  if (selectedScale === "absolute") return "line";
  if (selectedScale === "percentage") return "area";
  return timeIntervalKey === "daily" || timeIntervalKey === "daily_7d_rolling" ? "area" : "bar";
};

export default function MetricChart({ metric_type }: MetricChartProps) {
  const { data: master } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);

  const { data, metric_id, chainKeys, timespans } = useMetricData();
  const {
    selectedScale,
    selectedTimespan,
    timeIntervalKey,
    selectedChains,
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
        const colors = chainMeta?.colors?.dark;

        const series: GTPChartSeries = {
          name: chainMeta?.name ?? chainKey,
          data: points,
          seriesType,
          color: colors ? [colors[0], colors[1]] : undefined,
        };
        return series;
      })
      .filter((item): item is GTPChartSeries => Boolean(item));
  }, [
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

  const activeTimespan = timespans[selectedTimespan] ?? timespans.max ?? undefined;

  return (
    <div className="w-full h-full">
      <GTPChart
        series={chartSeries}
        stack={selectedScale === "stacked"}
        percentageMode={selectedScale === "percentage"}
        xAxisType="time"
        xAxisMin={activeTimespan?.xMin}
        xAxisMax={activeTimespan?.xMax}
        watermarkMetricName={metricMeta?.name ?? null}
        showWatermark
      />
    </div>
  );
}
