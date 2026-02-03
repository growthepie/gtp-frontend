"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Mustache from "mustache";
import dayjs from "@/lib/dayjs";
import { useQuickBite } from "@/contexts/QuickBiteContext";
import {
  LiveMetricsBlock as LiveMetricsBlockType,
  LiveMetricsCardConfig,
  LiveMetricsFeeDisplayRowConfig,
  LiveMetricConfig,
  LiveMetricFormat,
} from "@/lib/types/blockTypes";
import LiveMetricsCard, {
  LiveMetricDisplay,
  LiveMetricHighlight,
} from "@/components/quick-bites/LiveMetricsCard";
import { LiveMetricsChart } from "@/components/quick-bites/LiveMetricsChart";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { FeeDisplayRow } from "@/components/layout/EthAgg/FeeDisplayRow";
import { getGradientColor } from "@/components/layout/EthAgg/helpers";

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

const formatFeeValue = (number: number, decimals: number = 2): string => {
  if (Number.isNaN(number)) return "0";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const toNumber = (value: unknown): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const extractHistoryValues = (source: unknown, preferredKey?: string): number[] => {
  if (!Array.isArray(source)) return [];

  return source
    .map((entry) => {
      if (typeof entry === "number") return entry;
      if (typeof entry === "string") return toNumber(entry);
      if (!entry || typeof entry !== "object") return null;

      const candidateKeys = [
        preferredKey,
        "value",
        "tx_cost_erc20_transfer_usd",
        "tx_cost_erc20_transfer",
        "tps",
        "y",
      ].filter(Boolean) as string[];

      for (const key of candidateKeys) {
        const parsed = toNumber((entry as Record<string, unknown>)[key]);
        if (parsed !== null) return parsed;
      }

      return null;
    })
    .filter((value): value is number => value !== null);
};

interface FeeDisplayRowItemProps {
  row: LiveMetricsFeeDisplayRowConfig;
  historyValues: number[];
  currentValue: number | null;
}

const FeeDisplayRowItem: React.FC<FeeDisplayRowItemProps> = ({ row, historyValues, currentValue }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const normalizedSelectedIndex =
    selectedIndex === -1
      ? Math.max(historyValues.length - 1, 0)
      : Math.min(Math.max(selectedIndex, 0), Math.max(historyValues.length - 1, 0));

  const hoveredOrSelectedIndex = hoverIndex ?? normalizedSelectedIndex;
  const fallbackValue =
    historyValues[hoveredOrSelectedIndex] ??
    historyValues[historyValues.length - 1] ??
    0;
  const rowValue = currentValue ?? fallbackValue;

  return (
    <FeeDisplayRow
      title={row.title}
      costValue={rowValue}
      costHistory={historyValues}
      showUsd={row.showUsd ?? true}
      gradientClass={row.gradientClass || "from-[#FE5468] to-[#FFDF27]"}
      selectedIndex={normalizedSelectedIndex}
      hoverIndex={hoverIndex}
      onSelect={setSelectedIndex}
      onHover={setHoverIndex}
      getGradientColor={getGradientColor}
      formatNumber={formatFeeValue}
      hoverText={row.hoverText}
      hideValue={true}
    />
  );
};

interface FeeDisplayRowsProps {
  rows: LiveMetricsFeeDisplayRowConfig[];
  resolvedData: any;
  historyData: any;
  defaultHistoryPath?: string;
}

const FeeDisplayRows: React.FC<FeeDisplayRowsProps> = ({
  rows,
  resolvedData,
  historyData,
  defaultHistoryPath,
}) => {
  const preparedRows = useMemo(() => {
    return rows
      .slice(0, 1)
      .map((row) => {
        const source = getNestedValue(historyData, row.historyPath || defaultHistoryPath);
        const historyValues = extractHistoryValues(source, row.valueKey);
        const limitedHistory =
          row.limit && row.limit > 0 ? historyValues.slice(-row.limit) : historyValues;
        const parsedCurrentValue = row.valuePath
          ? toNumber(getNestedValue(resolvedData, row.valuePath))
          : null;

        return {
          row,
          historyValues: limitedHistory,
          currentValue: parsedCurrentValue,
        };
      })
      .filter(({ row }) => Boolean(row?.title));
  }, [rows, historyData, defaultHistoryPath, resolvedData]);

  if (!preparedRows.length) return null;

  return (
    <div className="flex flex-col gap-y-[10px]">
      {preparedRows.map(({ row, historyValues, currentValue }, index) => (
        <FeeDisplayRowItem
          key={`${row.title}-${row.historyPath || defaultHistoryPath || "history"}-${index}`}
          row={row}
          historyValues={historyValues}
          currentValue={currentValue}
        />
      ))}
    </div>
  );
};

export const LiveMetricsCardRenderer: React.FC<{ config: LiveMetricsCardConfig }> = ({ config }) => {
  const { sharedState } = useQuickBite();
  const hasFeeDisplayRows = Boolean(config.feeDisplayRows?.length);
  const chartConfig = hasFeeDisplayRows ? undefined : config.chart;

  useEffect(() => {
    if (hasFeeDisplayRows && config.chart) {
      console.warn(`Live metrics card "${config.title}" has both chart and feeDisplayRows. chart will be ignored.`);
    }
  }, [hasFeeDisplayRows, config.chart, config.title]);

  useEffect(() => {
    if ((config.feeDisplayRows?.length || 0) > 1) {
      console.warn(`Live metrics card "${config.title}" currently supports only one feeDisplayRow. Extra rows will be ignored.`);
    }
  }, [config.feeDisplayRows, config.title]);

  const liveDataUrl = useMemo(() => resolveUrl(config.dataUrl, sharedState), [config.dataUrl, sharedState]);
  const historyUrl = useMemo(() => {
    if (!chartConfig && !hasFeeDisplayRows) return null;
    return resolveUrl(config.historyUrl ?? config.dataUrl, sharedState);
  }, [chartConfig, hasFeeDisplayRows, config.historyUrl, config.dataUrl, sharedState]);

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

  const feeDisplayRowsNode = hasFeeDisplayRows ? (
    <FeeDisplayRows
      rows={config.feeDisplayRows || []}
      resolvedData={resolvedData}
      historyData={historyData}
      defaultHistoryPath={config.historyPath}
    />
  ) : null;

  return (
    <LiveMetricsCard
      title={config.title}
      icon={config.icon as GTPIconName | undefined}
      chart={chartNode}
      feeDisplayRows={feeDisplayRowsNode}
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
