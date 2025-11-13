import React, { useEffect, useState } from "react";
import { useSessionStorage } from "usehooks-ts";
import { MetricDataProvider } from "./MetricDataContext";
import { MetricChartControlsProvider } from "./MetricChartControlsContext";

type MetricContextWrapperProps = {
  children: React.ReactNode;
  metric: string;
  metric_type: "fundamentals" | "data-availability";
  defaultChains?: string[];
  defaultTimespan?: string;
  defaultTimeInterval?: string;
  showRollingAverage?: boolean;
  defaultScale?: string;
  is_embed?: boolean;
  embed_start_timestamp?: number;
  embed_end_timestamp?: number;
};

export const MetricContextWrapper = ({
  children,
  metric,
  metric_type,
  defaultChains,
  defaultTimespan,
  defaultTimeInterval,
  showRollingAverage = true,
  defaultScale,
  is_embed = false,
  embed_start_timestamp,
  embed_end_timestamp,
}: MetricContextWrapperProps) => {
  const StorageKeyPrefixMap = {
    fundamentals: "fundamentals",
    "data-availability": "da",
  };

  const [selectedTimeInterval, setSelectedTimeInterval] = useSessionStorage(
    `${StorageKeyPrefixMap[metric_type]}TimeInterval`,
    "daily"
  );

  useEffect(() => {
    if (defaultTimeInterval) {
      setSelectedTimeInterval(defaultTimeInterval);
    }
  }, []);

  return (
    <MetricDataProvider
      metric={metric}
      metric_type={metric_type}
      selectedTimeInterval={defaultTimeInterval || selectedTimeInterval}
    >
      <div>{defaultChains?.join(", ")}</div>
      <MetricChartControlsProvider
        metric_type={metric_type}
        is_embed={is_embed}
        embed_start_timestamp={embed_start_timestamp}
        embed_end_timestamp={embed_end_timestamp}
        selectedTimeInterval={selectedTimeInterval}
        selectedTimespan={defaultTimespan}
        showRollingAverage={showRollingAverage}
        defaultScale={defaultScale}
        setSelectedTimeInterval={setSelectedTimeInterval}
      >
        {children}
      </MetricChartControlsProvider>
    </MetricDataProvider>
  );
};
