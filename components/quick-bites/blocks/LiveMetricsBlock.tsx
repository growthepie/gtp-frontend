"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import Mustache from "mustache";
import dayjs from "@/lib/dayjs";
import { useQuickBite } from "@/contexts/QuickBiteContext";
import {
  LiveMetricsBlock as LiveMetricsBlockType,
  LiveMetricsCardConfig,
  LiveMetricConfig,
  LiveMetricFormat,
} from "@/lib/types/blockTypes";
import LiveMetricsCard, {
  LiveMetricDisplay,
  LiveMetricHighlight,
} from "@/components/quick-bites/LiveMetricsCard";
import { LiveMetricsChart } from "@/components/quick-bites/LiveMetricsChart";
import { GTPIconName } from "@/icons/gtp-icon-names";

const getNestedValue = (obj: any, path?: string) => {
  if (!path) return obj;
  return path.split(".").reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), obj);
};

const resolveUrl = (template: string | undefined, sharedState: Record<string, any>) => {
  if (!template) return null;
  if (!template.includes("{{")) return template;

  const requiredVars = (Mustache.parse(template) || [])
    .filter((tag) => tag[0] === "name")
    .map((tag) => tag[1]);
  const allVarsAvailable = requiredVars.every((v) => sharedState[v] !== null && sharedState[v] !== undefined);
  if (!allVarsAvailable) return null;

  return Mustache.render(template, sharedState);
};

const formatNumber = (value: number, format?: LiveMetricFormat) => {
  const locale = format?.locale || "en-GB";
  const options: Intl.NumberFormatOptions = {};

  if (format?.compact) {
    options.notation = "compact";
    options.compactDisplay = "short";
  }

  if (typeof format?.decimals === "number") {
    options.minimumFractionDigits = format.decimals;
    options.maximumFractionDigits = format.decimals;
  } else {
    if (typeof format?.minDecimals === "number") {
      options.minimumFractionDigits = format.minDecimals;
    }
    if (typeof format?.maxDecimals === "number") {
      options.maximumFractionDigits = format.maxDecimals;
    }
  }

  return value.toLocaleString(locale, options);
};

const formatMetricValue = (rawValue: any, format?: LiveMetricFormat) => {
  const fallback = format?.fallback ?? "N/A";
  if (rawValue === null || rawValue === undefined) return fallback;

  if (format?.type === "date") {
    return dayjs.utc(rawValue).format(format.dateFormat || "D/M/YYYY HH:mm [UTC]");
  }

  if (format?.type === "duration") {
    const seconds = Number(rawValue);
    if (Number.isNaN(seconds)) return fallback;
    const value = seconds >= 1 ? seconds : seconds * 1000;
    const unit = seconds >= 1 ? " s" : " ms";
    const prefix = format?.prefix ?? "";
    const suffix = format?.suffix ?? unit;
    return `${prefix}${formatNumber(value, format)}${suffix}`;
  }

  const numericValue = Number(rawValue);
  if (!Number.isNaN(numericValue)) {
    const multiplier = format?.multiply ?? 1;
    const value = numericValue * multiplier;
    const prefix = format?.prefix ?? "";
    const suffix = format?.suffix ?? "";
    return `${prefix}${formatNumber(value, format)}${suffix}`;
  }

  return String(rawValue);
};

const buildMetricDisplay = (metric: LiveMetricConfig, data: any): LiveMetricDisplay => {
  const value = formatMetricValue(getNestedValue(data, metric.valuePath), metric.valueFormat);
  const hoverValue = metric.hoverValuePath
    ? formatMetricValue(getNestedValue(data, metric.hoverValuePath), metric.hoverFormat)
    : undefined;

  return {
    label: metric.label,
    value,
    hoverLabel: metric.hoverLabel ?? hoverValue,
    align: metric.align,
  };
};

export const LiveMetricsCardRenderer: React.FC<{ config: LiveMetricsCardConfig }> = ({ config }) => {
  const { sharedState } = useQuickBite();

  const liveDataUrl = useMemo(() => resolveUrl(config.dataUrl, sharedState), [config.dataUrl, sharedState]);
  const historyUrl = useMemo(() => {
    if (!config.chart) return null;
    return resolveUrl(config.historyUrl ?? config.dataUrl, sharedState);
  }, [config.chart, config.historyUrl, config.dataUrl, sharedState]);

  const { data: liveData } = useSWR(liveDataUrl, {
    refreshInterval: config.refreshInterval,
  });
  const { data: historyData } = useSWR(historyUrl, {
    refreshInterval: config.refreshInterval,
  });

  const resolvedData = useMemo(() => {
    if (!liveData) return null;
    return getNestedValue(liveData, config.dataPath);
  }, [liveData, config.dataPath]);

  const chartConfig = config.chart;
  const chartData = useMemo(() => {
    if (!chartConfig || !historyData) return [];
    const source = getNestedValue(historyData, chartConfig.dataPath || config.historyPath);
    if (!Array.isArray(source)) return [];

    const valueKey = chartConfig.valueKey || "tps";
    const timeKey = chartConfig.timeKey || "timestamp";
    const mapped = source
      .map((item) => {
        const value = item?.[valueKey];
        const timestamp = item?.[timeKey];
        if (value === null || value === undefined || timestamp === null || timestamp === undefined) {
          return null;
        }

        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) return null;

        const timeValue = typeof timestamp === "number" ? new Date(timestamp).toISOString() : String(timestamp);
        return {
          tps: numericValue,
          timestamp: timeValue,
        };
      })
      .filter(Boolean) as { tps: number; timestamp: string }[];

    if (chartConfig.limit && chartConfig.limit > 0) {
      return mapped.slice(-chartConfig.limit);
    }
    return mapped;
  }, [chartConfig, historyData, config.historyPath]);

  const seriesName = useMemo(() => {
    if (!chartConfig) return undefined;
    if (chartConfig.seriesName) return chartConfig.seriesName;
    if (chartConfig.seriesNamePath && resolvedData) {
      const resolved = getNestedValue(resolvedData, chartConfig.seriesNamePath);
      return resolved ? String(resolved) : undefined;
    }
    return undefined;
  }, [chartConfig, resolvedData]);

  const leftMetrics = useMemo(() => {
    if (!config.metricsLeft || !resolvedData) return [];
    return config.metricsLeft.map((metric) => buildMetricDisplay(metric, resolvedData));
  }, [config.metricsLeft, resolvedData]);

  const rightMetrics = useMemo(() => {
    if (!config.metricsRight || !resolvedData) return [];
    return config.metricsRight.map((metric) => buildMetricDisplay(metric, resolvedData));
  }, [config.metricsRight, resolvedData]);

  const liveMetric = useMemo<LiveMetricHighlight | undefined>(() => {
    if (!config.liveMetric || !resolvedData) return undefined;
    const display = buildMetricDisplay(config.liveMetric, resolvedData);
    const accentColor = config.liveMetric.accentColor || chartConfig?.overrideColor?.[0];
    return {
      ...display,
      accentColor,
      liveIcon: config.liveMetric.liveIcon as GTPIconName | undefined,
    };
  }, [config.liveMetric, resolvedData, chartConfig]);

  const chartNode = chartConfig && chartData.length > 0 ? (
    <LiveMetricsChart
      data={chartData}
      chainName={seriesName}
      centerWatermark={chartConfig.centerWatermark}
      anchorZero={chartConfig.anchorZero}
      overrideColor={chartConfig.overrideColor}
      metricLabel={chartConfig.metricLabel}
    />
  ) : null;

  return (
    <LiveMetricsCard
      title={config.title}
      icon={config.icon as GTPIconName | undefined}
      chart={chartNode}
      leftMetrics={leftMetrics}
      rightMetrics={rightMetrics}
      liveMetric={liveMetric}
      layout={config.layout}
      chartHeightClassName={config.chartHeightClassName}
      className={config.className}
    />
  );
};

export const LiveMetricsBlock: React.FC<{ block: LiveMetricsBlockType }> = ({ block }) => (
  <LiveMetricsCardRenderer config={block} />
);

export default LiveMetricsBlock;
