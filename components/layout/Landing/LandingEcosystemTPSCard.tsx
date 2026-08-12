"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useTheme } from "next-themes";
import Icon from "@/components/layout/Icon";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { useSSEMetrics } from "@/components/layout/EthAgg/useSSEMetrics";
import { HistoryData } from "@/components/layout/EthAgg/types";
import type { TPSChartHistoryItem } from "@/components/layout/EthAgg/MetricsTop";
import { track } from "@/lib/tracking";

const TPS_HISTORY_URL = "https://sse.growthepie.com/api/history";
const ECOSYSTEM_URL = "/ethereum-ecosystem/metrics";

const formatTPS = (value: number | undefined, decimals: number = 1) =>
  Intl.NumberFormat("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);

/**
 * Landing carousel tile showing the live Ethereum Ecosystem TPS counter.
 * Mirrors the ecosystem page's TPS card, minus the expandable chains list,
 * and links through to the ecosystem page.
 */
export default function LandingEcosystemTPSCard() {
  const { theme } = useTheme();
  const { data: initialHistory } = useSWR<HistoryData>(TPS_HISTORY_URL);
  const { globalMetrics, lastUpdated } = useSSEMetrics();

  const [tpsHistory, setTpsHistory] = useState<TPSChartHistoryItem[]>([]);

  // Seed the chart with the fetched history (reversed for chronological order).
  useEffect(() => {
    if (initialHistory?.history) {
      setTpsHistory([...initialHistory.history].reverse());
    }
  }, [initialHistory]);

  // Append live points coming in over SSE.
  useEffect(() => {
    if (globalMetrics.total_tps && lastUpdated && tpsHistory.length > 0) {
      const newPoint: TPSChartHistoryItem = {
        tps: globalMetrics.total_tps,
        timestamp: lastUpdated.toISOString(),
      };

      if (tpsHistory[tpsHistory.length - 1]?.timestamp !== newPoint.timestamp) {
        setTpsHistory((prev) => [...prev, newPoint].slice(-100));
      }
    }
    // Note: tpsHistory is intentionally omitted from deps
  }, [globalMetrics.total_tps, lastUpdated]);

  const chartSeries = useMemo<GTPChartSeries[]>(() => {
    const colors: [string, string] = theme === "dark"
      ? ["#1df7ef", "#10808c"]
      : ["#00cfc5", "#0e6f7a"];
    return [{
      name: "Ethereum Ecosystem",
      seriesType: "bar",
      data: tpsHistory.slice(-40).map(item => [new Date(item.timestamp).getTime(), item.tps]),
      color: colors,
    }];
  }, [tpsHistory, theme]);

  const allTimeHigh = globalMetrics.total_tps_24h_high && globalMetrics.total_tps_ath
    ? Math.max(globalMetrics.total_tps_24h_high, globalMetrics.total_tps_ath)
    : globalMetrics.total_tps_ath;

  return (
    <Link
      href={ECOSYSTEM_URL}
      onClick={() => {
        track("clicked Ethereum Ecosystem TPS card", {
          location: "landing carousel",
          page: window.location.pathname,
        });
      }}
      className="group/tps flex flex-col w-full min-w-[100px] h-[145px] md:h-[176px] rounded-[15px] bg-color-bg-default border-[1px] border-color-bg-medium px-[15px] py-[10px] select-none"
    >
      <div className="flex items-center justify-between gap-x-[10px]">
        <div className="heading-large-sm md:heading-large-md truncate">Ethereum Ecosystem TPS</div>
        <div className="size-[24px] shrink-0 bg-color-bg-medium rounded-full flex items-center justify-center transition-colors duration-300 group-hover/tps:bg-color-ui-hover">
          <Icon icon="feather:arrow-right" className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-x-[10px] pt-[4px]">
        <div className="flex flex-col">
          <div className="flex gap-x-[4px] items-baseline numbers-xl md:numbers-2xl bg-gradient-to-b from-color-accent-petrol to-color-accent-turquoise bg-clip-text text-transparent whitespace-nowrap">
            <div>{formatTPS(globalMetrics.total_tps)}</div>
            <div>TPS</div>
          </div>
          <div className="heading-small-xxxs text-color-ui-hover pt-[5px] whitespace-nowrap">all chains combined</div>
        </div>
        <div className="flex flex-col gap-y-[3px] items-end">
          <div className="flex gap-x-[5px] items-baseline whitespace-nowrap">
            <div className="heading-small-xxxs text-color-text-secondary">All-Time High</div>
            <div className="numbers-xs">{formatTPS(allTimeHigh, 0)}</div>
          </div>
          <div className="flex gap-x-[5px] items-baseline whitespace-nowrap">
            <div className="heading-small-xxxs text-color-text-secondary">24h Peak</div>
            <div className="numbers-xs">{formatTPS(globalMetrics.total_tps_24h_high, 0)}</div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 w-full pt-[5px]">
        <GTPChart
          series={chartSeries}
          xAxisType="category"
          yAxisMin={0}
          animation={false}
          showWatermark={false}
          grid={{ right: 0, top: 5, bottom: 0 }}
          ySplitNumber={2}
          yAxisLabelFormatter={(v) => {
            if (v === 0) return "";
            if (Math.abs(v) >= 1_000_000) return `${+(v / 1_000_000).toPrecision(3)}M`;
            if (Math.abs(v) >= 1_000) return `${+(v / 1_000).toPrecision(3)}k`;
            return String(Math.round(v));
          }}
          seriesOverrides={(s) => ({
            ...s,
            itemStyle: {
              ...(s.itemStyle as Record<string, unknown>),
              color: {
                type: "linear",
                x: 0, y: 1, x2: 0, y2: 0,
                colorStops: [
                  { offset: 0, color: theme === "dark" ? "#10808c" : "#0e6f7a" },
                  { offset: 1, color: theme === "dark" ? "#1df7ef" : "#00cfc5" },
                ],
              },
            },
          })}
          // The tile navigates on click, so the hover tooltip would only get in the way.
          optionOverrides={{ tooltip: { show: false } }}
          suffix=" TPS"
          decimals={1}
          height="100%"
        />
      </div>
    </Link>
  );
}
