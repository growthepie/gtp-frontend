"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { EChartsOption } from "echarts";
import { useTheme } from "next-themes";
import { Title } from "@/components/layout/TextHeadingComponents";

const DATA_URL = "https://api.growthepie.xyz/v1/applications/test_heatmap.json";

const METRICS = {
  active_addresses: {
    label: "Active addresses",
    index: 2,
  },
  transaction_count: {
    label: "Transaction count",
    index: 3,
  },
  gas_fees_paid: {
    label: "Gas fees paid (ETH)",
    index: 4,
  },
} as const;

type MetricKey = keyof typeof METRICS;

type HeatmapResponse = {
  data: {
    types: string[];
    data: Array<[string, number, number, number, number]>;
  };
  last_updated_utc?: string;
};

type HeatmapPoint = {
  date: string;
  hour: number;
  values: Record<MetricKey, number>;
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatHour = (hour: number) => hour.toString().padStart(2, "0");

const getCssVarAsRgb = (name: string): string => {
  if (typeof window === "undefined") return "rgb(0, 0, 0)";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = value.split(" ").filter(Boolean);
  return `rgb(${parts.join(", ")})`;
};

const withOpacity = (rgb: string, opacity: number) => {
  if (!rgb.startsWith("rgb(")) return rgb;
  return rgb.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);

const getDayLabel = (date: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(parseDate(date));

const formatDateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(parseDate(date));

const formatDelta = (value: number, avg: number) => {
  if (!avg) return "N/A";
  const delta = ((value - avg) / avg) * 100;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
};

const formatValue = (value: number, metric: MetricKey) => {
  if (metric === "gas_fees_paid") {
    return new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: 4,
    }).format(value);
  }
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
};

const formatLastUpdated = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
};

const buildLast7Dates = (lastUpdatedUtc?: string) => {
  const base = lastUpdatedUtc
    ? new Date(`${lastUpdatedUtc.replace(" ", "T")}Z`)
    : new Date();
  const endDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const dates: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(endDate);
    d.setUTCDate(endDate.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const ActivityHeatmapPanel = () => {
  const { theme } = useTheme();
  const [metric, setMetric] = useState<MetricKey>("active_addresses");
  const [rows, setRows] = useState<HeatmapPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(DATA_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const json = (await response.json()) as HeatmapResponse;
        if (!mounted) return;

        const parsed = json.data.data.map((row) => ({
          date: row[0],
          hour: Number(row[1]),
          values: {
            active_addresses: row[2],
            transaction_count: row[3],
            gas_fees_paid: row[4],
          },
        }));

        setRows(parsed);
        setLastUpdated(json.last_updated_utc);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to fetch heatmap data", error);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const readPalette = () => ({
    turquoise: getCssVarAsRgb("--accent-turquoise"),
    yellow: getCssVarAsRgb("--accent-yellow"),
    red: getCssVarAsRgb("--accent-red"),
    textPrimary: getCssVarAsRgb("--text-primary"),
    textSecondary: getCssVarAsRgb("--text-secondary"),
    bgDefault: getCssVarAsRgb("--bg-default"),
    uiShadow: getCssVarAsRgb("--ui-shadow"),
  });

  const [palette, setPalette] = useState(readPalette());

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPalette(readPalette());
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  const last7Dates = useMemo(() => buildLast7Dates(lastUpdated), [lastUpdated]);
  const last7Set = useMemo(() => new Set(last7Dates), [last7Dates]);
  const partialLastDate = useMemo(() => {
    if (!last7Dates.length) return null;
    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);
    const currentHourUtc = now.getUTCHours();
    const lastDate = last7Dates[last7Dates.length - 1];
    if (lastDate === todayUtc && currentHourUtc < 23) {
      return lastDate;
    }
    return null;
  }, [last7Dates]);

  const dataByDateHour = useMemo(() => {
    const map = new Map<string, HeatmapPoint>();
    rows.forEach((row) => {
      if (last7Set.has(row.date)) {
        map.set(`${row.date}-${row.hour}`, row);
      }
    });
    return map;
  }, [rows, last7Set]);

  const hourlyAverages = useMemo(() => {
    const totals = new Array(24).fill(0);
    const counts = new Array(24).fill(0);

    last7Dates.forEach((date) => {
      for (let hour = 0; hour < 24; hour += 1) {
        const entry = dataByDateHour.get(`${date}-${hour}`);
        if (entry) {
          totals[hour] += entry.values[metric];
          counts[hour] += 1;
        }
      }
    });

    return totals.map((total, idx) => (counts[idx] ? total / counts[idx] : 0));
  }, [dataByDateHour, last7Dates, metric]);

  const heatmapData = useMemo(() => {
    const data: Array<{ value: [string, string, number | null]; isFuture: boolean }> = [];
    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);
    const currentHourUtc = now.getUTCHours();

    last7Dates.forEach((date) => {
      const isFutureDate = date > todayUtc;
      for (let hour = 0; hour < 24; hour += 1) {
        const entry = dataByDateHour.get(`${date}-${hour}`);
        const value = entry ? entry.values[metric] : 0;
        const hourLabel = hour.toString();
        const isFuture = isFutureDate || (date === todayUtc && hour > currentHourUtc);
        data.push({
          value: [date, hourLabel, isFuture ? null : value],
          isFuture,
        });
      }
    });

    return data;
  }, [dataByDateHour, last7Dates, metric]);

  const metricValues = useMemo(
    () =>
      heatmapData
        .filter((item) => !item.isFuture)
        .map((item) => item.value[2])
        .filter((value): value is number => value !== null),
    [heatmapData],
  );

  const colorRange = useMemo(() => {
    const min = percentile(metricValues, 0.1);
    const max = percentile(metricValues, 0.95);
    return {
      min,
      max: Math.max(min + Number.EPSILON, max),
    };
  }, [metricValues]);

  const option = useMemo<EChartsOption>(() => {
    const tooltipMetricLabel = METRICS[metric].label;
    const tooltip = {
      trigger: "item",
      renderMode: "html",
      appendToBody: true,
      confine: false,
      backgroundColor: palette.bgDefault,
      shadowColor: palette.uiShadow,
      shadowBlur: 27,
      borderRadius: 12,
      padding: [10, 12],
      textStyle: { color: palette.textPrimary, fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif" },
      formatter: (params: any) => {
        if (!params || !params.data) return "";
        const dataPoint = params.data as { value: [string, string, number | null]; isFuture?: boolean };
        const [date, hourValue, value] = dataPoint.value;
        const hour = Number(hourValue);
        const hourStart = formatHour(hour);
        const hourEnd = formatHour((hour + 1) % 24);
        const dayLabel = getDayLabel(date);
        const avg = hourlyAverages[hour] || 0;
        const delta = formatDelta(value ?? 0, avg);

        if (dataPoint.isFuture) {
          return `
            <div class="text-xs font-raleway flex flex-col gap-y-[6px]">
              <div class="heading-small-xs">${dayLabel} · ${hourStart}:00–${hourEnd}:00 UTC</div>
              <div class="text-xs text-color-text-secondary">No data yet</div>
            </div>
          `;
        }

        return `
          <div class="text-xs font-raleway flex flex-col gap-y-[6px]">
            <div class="heading-small-xs">${dayLabel} · ${hourStart}:00–${hourEnd}:00 UTC</div>
            <div class="flex justify-between gap-x-[12px]">
              <span class="text-xs text-color-text-secondary">${tooltipMetricLabel}</span>
              <span class="numbers-xs">${formatValue(value ?? 0, metric)}</span>
            </div>
            <div class="flex justify-between gap-x-[12px]">
              <span class="text-xs text-color-text-secondary">Δ vs 7-day hourly avg</span>
              <span class="numbers-xs">${delta}</span>
            </div>
          </div>
        `;
      },
    };

    return {
      backgroundColor: "transparent",
      grid: { left: 40, right: 60, top: 30, bottom: 30 },
      tooltip,
      xAxis: {
        type: "category",
        data: last7Dates,
        axisLabel: {
          color: palette.textPrimary,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif",
          formatter: (value: string) => formatDateLabel(value),
        },
        axisTick: { show: false },
        axisLine: { show: false },
        name: "",
      },
      yAxis: {
        type: "category",
        data: Array.from({ length: 24 }, (_, i) => (23 - i).toString()),
        axisLabel: {
          color: palette.textPrimary,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif",
          formatter: (value: string) => `${value.padStart(2, "0")}:00`,
        },
        axisTick: { show: false },
        axisLine: { show: false },
        name: "Hour (UTC)",
        nameLocation: "middle",
        nameGap: 40,
        nameTextStyle: {
          color: palette.textPrimary,
          fontSize: 11,
          fontWeight: 600,
        },
      },
      visualMap: {
        type: "continuous",
        min: Math.max(0, colorRange.min),
        max: colorRange.max,
        dimension: 2,
        seriesIndex: 0,
        calculable: true,
        orient: "vertical",
        right: 10,
        top: 30,
        bottom: 30,
        itemHeight: 90,
        text: ["", ""],
        textGap: 0,
        textStyle: {
          color: "transparent",
          fontSize: 10,
          fontWeight: 600,
        },
        inRange: {
          color: [palette.turquoise, palette.yellow, palette.red],
        },
        outOfRange: {
          color: [withOpacity(palette.textPrimary, theme === "dark" ? 0.12 : 0.08)],
        },
      },
      series: [
        {
          type: "heatmap",
          encode: { x: 0, y: 1, value: 2 },
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: withOpacity(palette.textPrimary, 0.35),
              borderWidth: 2,
            },
          },
          itemStyle: {
            borderColor: withOpacity(palette.bgDefault, 0.4),
            borderWidth: 1,
          },
          markArea: partialLastDate
            ? {
                silent: true,
                itemStyle: { color: withOpacity(palette.textPrimary, 0.06) },
                data: [[{ xAxis: partialLastDate }, { xAxis: partialLastDate }]],
              }
            : undefined,
        },
      ],
    };
  }, [heatmapData, hourlyAverages, metric, palette, colorRange, theme, last7Dates, partialLastDate]);

  const lastUpdatedLabel = useMemo(() => formatLastUpdated(lastUpdated), [lastUpdated]);
  return (
    <div className="flex flex-col gap-y-[15px]">
      <div className="flex flex-col gap-y-[6px]">
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] relative">
          <Title title="When are users active?" icon="gtp-users" as="h1" />
        </div>
        <div className="text-[14px] w-[99%] mx-auto">
          Rolling 7-day UTC activity heatmap. Use the slider to adjust intensity per metric.
        </div>
        {lastUpdatedLabel && (
          <div className="text-[12px] w-[99%] mx-auto text-color-text-secondary">
            Last updated: {lastUpdatedLabel} UTC
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-full bg-color-bg-medium p-[3px] animate-pulse">
          <div className="h-[36px] md:h-[44px] rounded-full bg-color-bg-default/40" />
        </div>
      ) : (
        <div className="rounded-full bg-color-bg-medium p-[3px]">
          <div className="flex w-full justify-center lg:justify-start items-stretch lg:items-center mx-[0px] space-x-[5px] text-[12px] lg:text-[14px]">
            {(Object.keys(METRICS) as MetricKey[]).map((key) => {
              const isActive = metric === key;
              return (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={`rounded-full px-[16px] py-[8px] lg:py-[11px] font-medium transition ${
                    isActive
                      ? "bg-color-ui-active text-color-text-primary"
                      : "text-color-text-primary hover:bg-color-ui-hover"
                  }`}
                >
                  {METRICS[key].label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-[18px] bg-color-bg-medium p-[12px] md:p-[18px]">
        <div className="h-[280px] w-full">
          {isLoading ? (
            <div className="h-full w-full rounded-[12px] bg-color-bg-default/40 animate-pulse" />
          ) : (
            <ReactECharts key={`${metric}-${theme}`} option={option} style={{ height: "100%", width: "100%" }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmapPanel;
