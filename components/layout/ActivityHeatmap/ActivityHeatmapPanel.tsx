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
const parseDateByMode = (date: string, timeZone: "utc" | "local") =>
  new Date(`${date}T00:00:00${timeZone === "utc" ? "Z" : ""}`);

const getDayLabel = (date: string, timeZone: "utc" | "local") =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timeZone === "utc" ? "UTC" : undefined,
  }).format(parseDateByMode(date, timeZone));

const formatDateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(parseDate(date));

const formatDateLabelLong = (date: string, timeZone: "utc" | "local") => {
  const parsed = parseDateByMode(date, timeZone);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timeZone === "utc" ? "UTC" : undefined,
  }).format(parsed);
  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: timeZone === "utc" ? "UTC" : undefined,
  }).format(parsed);
  const day = timeZone === "utc" ? parsed.getUTCDate() : parsed.getDate();
  const suffix = (() => {
    if (day >= 11 && day <= 13) return "th";
    const mod = day % 10;
    if (mod === 1) return "st";
    if (mod === 2) return "nd";
    if (mod === 3) return "rd";
    return "th";
  })();
  return `${weekday}, ${month} ${day}${suffix}`;
};

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

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildLast7Dates = (baseDate: Date, timeZone: "utc" | "local") => {
  const endDate =
    timeZone === "utc"
      ? new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate()))
      : new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dates: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(endDate);
    if (timeZone === "utc") {
      d.setUTCDate(endDate.getUTCDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    } else {
      d.setDate(endDate.getDate() - i);
      dates.push(toLocalDateKey(d));
    }
  }
  return dates;
};

const ActivityHeatmapPanel = () => {
  const { theme } = useTheme();
  const [metric, setMetric] = useState<MetricKey>("active_addresses");
  const [timeMode, setTimeMode] = useState<"utc" | "local">("utc");
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
    bgMedium: getCssVarAsRgb("--bg-medium"),
    uiShadow: getCssVarAsRgb("--ui-shadow"),
  });

  const [palette, setPalette] = useState(readPalette());

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setPalette(readPalette());
    });
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  const baseDate = useMemo(
    () => (lastUpdated ? new Date(`${lastUpdated.replace(" ", "T")}Z`) : new Date()),
    [lastUpdated],
  );
  const last7Dates = useMemo(() => buildLast7Dates(baseDate, timeMode), [baseDate, timeMode]);
  const last7Set = useMemo(() => new Set(last7Dates), [last7Dates]);
  const partialLastDate = useMemo(() => {
    if (!last7Dates.length) return null;
    const now = new Date();
    const todayUtc = now.toISOString().slice(0, 10);
    const currentHourUtc = now.getUTCHours();
    const todayLocal = toLocalDateKey(now);
    const currentHourLocal = now.getHours();
    const lastDate = last7Dates[last7Dates.length - 1];
    if (
      (timeMode === "utc" && lastDate === todayUtc && currentHourUtc < 23) ||
      (timeMode === "local" && lastDate === todayLocal && currentHourLocal < 23)
    ) {
      return lastDate;
    }
    return null;
  }, [last7Dates, timeMode]);

  const dataByDateHour = useMemo(() => {
    const map = new Map<string, HeatmapPoint>();
    rows.forEach((row) => {
      let dateKey = row.date;
      let hourKey = row.hour;
      if (timeMode === "local") {
        const utcBase = new Date(`${row.date}T00:00:00Z`);
        utcBase.setUTCHours(row.hour);
        dateKey = toLocalDateKey(utcBase);
        hourKey = utcBase.getHours();
      }

      if (!last7Set.has(dateKey)) return;
      const key = `${dateKey}-${hourKey}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          date: dateKey,
          hour: hourKey,
          values: { ...row.values },
        });
      } else {
        existing.values.active_addresses += row.values.active_addresses;
        existing.values.transaction_count += row.values.transaction_count;
        existing.values.gas_fees_paid += row.values.gas_fees_paid;
      }
    });
    return map;
  }, [rows, last7Set, timeMode]);

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
    const todayLocal = toLocalDateKey(now);
    const currentHourLocal = now.getHours();

    last7Dates.forEach((date) => {
      const isFutureDate = timeMode === "utc" ? date > todayUtc : date > todayLocal;
      for (let hour = 0; hour < 24; hour += 1) {
        const entry = dataByDateHour.get(`${date}-${hour}`);
        const value = entry ? entry.values[metric] : 0;
        const hourLabel = hour.toString();
        const isFuture =
          isFutureDate ||
          (timeMode === "utc"
            ? date === todayUtc && hour > currentHourUtc
            : date === todayLocal && hour > currentHourLocal);
        data.push({
          value: [hourLabel, date, isFuture ? null : value],
          isFuture,
        });
      }
    });

    return data;
  }, [dataByDateHour, last7Dates, metric, timeMode]);

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
      borderWidth: 0,
      borderColor: "transparent",
      extraCssText: "border: none;",
      shadowColor: palette.uiShadow,
      shadowBlur: 27,
      borderRadius: 12,
      padding: [10, 12],
      textStyle: { color: palette.textPrimary, fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif" },
      axisPointer: { type: "none" },
      formatter: (params: any) => {
        if (!params || !params.data) return "";
        const dataPoint = params.data as { value: [string, string, number | null]; isFuture?: boolean };
        const [hourValue, date, value] = dataPoint.value;
        const hour = Number(hourValue);
        const hourStart = formatHour(hour);
        const hourEnd = formatHour((hour + 1) % 24);
        const dayLabel = getDayLabel(date, timeMode);
        const avg = hourlyAverages[hour] || 0;
        const delta = formatDelta(value ?? 0, avg);

        if (dataPoint.isFuture) {
          return `
            <div class="text-xs font-raleway flex flex-col gap-y-[6px]">
              <div class="heading-small-xs">${dayLabel} · ${hourStart}:00–${hourEnd}:00 ${timeMode === "utc" ? "UTC" : "Local"}</div>
              <div class="text-xs">No data yet</div>
            </div>
          `;
        }

        return `
          <div class="text-xs font-raleway flex flex-col gap-y-[6px]">
            <div class="heading-small-xs">${dayLabel} · ${hourStart}:00–${hourEnd}:00 ${timeMode === "utc" ? "UTC" : "Local"}</div>
            <div class="flex justify-between gap-x-[12px]">
              <span class="text-xs">${tooltipMetricLabel}</span>
              <span class="numbers-xs">${formatValue(value ?? 0, metric)}</span>
            </div>
            <div class="flex justify-between gap-x-[12px]">
              <span class="text-xs">Δ vs 7-day hourly avg</span>
              <span class="numbers-xs">${delta}</span>
            </div>
          </div>
        `;
      },
    };

    return {
      backgroundColor: "transparent",
      grid: { left: 80, right: 120, top: 30, bottom: 30 },
      tooltip,
      xAxis: {
        type: "category",
        data: Array.from({ length: 24 }, (_, i) => i.toString()),
        axisLabel: {
          color: palette.textPrimary,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif",
          interval: (_: number, value: string) => Number(value) % 2 === 0,
          formatter: (value: string) => `${value.padStart(2, "0")}:00`,
        },
        axisTick: { show: false },
        axisLine: { show: false },
        name: "",
      },
      yAxis: {
        type: "category",
        data: last7Dates,
        inverse: true,
        axisLabel: {
          color: palette.textPrimary,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "var(--font-raleway), var(--font-fira-sans), sans-serif",
          formatter: (value: string) => formatDateLabelLong(value, timeMode),
        },
        axisTick: { show: false },
        axisLine: { show: false },
        name: "",
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
        itemWidth: 10,
        itemHeight: 160,
        text: ["High Activity", "Low Activity"],
        textGap: 8,
        textStyle: {
          color: palette.textPrimary,
          fontSize: 10,
          fontWeight: 600,
        },
        handleLabel: {
          show: false,
        },
        formatter: () => "",
        precision: 0,
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
            borderColor: palette.bgMedium,
            borderWidth: 2,
            borderRadius: 6,
          },
          markArea: partialLastDate
            ? {
                silent: true,
                itemStyle: { color: withOpacity(palette.textPrimary, 0.06) },
                data: [[{ yAxis: partialLastDate }, { yAxis: partialLastDate }]],
              }
            : undefined,
        },
      ],
    };
  }, [heatmapData, hourlyAverages, metric, palette, colorRange, theme, last7Dates, partialLastDate, timeMode]);

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
          <div className="flex w-full flex-wrap justify-center lg:justify-between items-stretch lg:items-center gap-[6px] text-[12px] lg:text-[14px]">
            <div className="flex items-stretch lg:items-center space-x-[5px]">
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
            <div className="flex items-stretch lg:items-center space-x-[5px]">
              {[
                { key: "utc", label: "UTC" },
                { key: "local", label: "Local time" },
              ].map((option) => {
                const isActive = timeMode === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTimeMode(option.key as "utc" | "local")}
                    className={`rounded-full px-[16px] py-[8px] lg:py-[11px] font-medium transition ${
                      isActive
                        ? "bg-color-ui-active text-color-text-primary"
                        : "text-color-text-primary hover:bg-color-ui-hover"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
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
