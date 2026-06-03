"use client"
import { useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";
import ChartWatermark from "../ChartWatermark";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { AllDAOverview } from "@/types/api/DAOverviewResponse";
import { format as d3Format, scaleLinear } from "d3";
import TopDAConsumers from "./TopDAConsumers";
import { Carousel } from "@/components/Carousel";
import GTPChart, { GTPChartSeries } from "@/components/GTPComponents/GTPChart";

const chart_titles = {
  data_posted: "Data Posted",
  fees_paid: "DA Fees Paid",
};

const area_colors: Record<string, string> = {
  da_ethereum_blobs: "#FFC300",
  da_celestia: "#8E44ED",
  da_eigenda: "#3D29D9",
};

// Layout constants that must match the GTPChart grid prop below.
const GRID_TOP = 55;
const GRID_RIGHT = 21;
const CHART_HEIGHT = 232;
const PLOT_HEIGHT = CHART_HEIGHT - GRID_TOP; // 177

// The circle sits at the same y as the original: plotTop/3 + 6.
const CIRCLE_Y = GRID_TOP / 3 + 6; // ≈ 24

interface SlideProps {
  metricKey: string;
  isMonthly: boolean;
  showUsd: boolean;
  valuePrefix: string;
  normalizedData: AllDAOverview;
  rawMetricData: any;
  xBounds: { xMin: number; xMax: number } | undefined;
  splitLineColor: string;
  formatNumber: (metricKey: string, value: number) => string;
}

function DAHeadChartSlide({
  metricKey,
  isMonthly,
  showUsd,
  valuePrefix,
  normalizedData,
  rawMetricData,
  xBounds,
  splitLineColor,
  formatNumber,
}: SlideProps) {
  const [lastPt, setLastPt] = useState<{ pixelX: number; pixelY: number } | null>(null);

  const is_fees = metricKey.includes("fees_paid");
  const prefix = is_fees ? valuePrefix : "";
  const url = is_fees ? "/data-availability/fees-paid" : "/data-availability/data-posted";

  const chartSeries: GTPChartSeries[] = Object.keys(rawMetricData).map((daKey) => {
    const entry = (normalizedData.metrics as any)[metricKey][daKey];
    const timeData = entry[isMonthly ? "monthly" : "daily"];
    const types: string[] = timeData.types;
    let typeIndex = 1;
    if (types.includes("usd")) {
      typeIndex = types.indexOf(showUsd ? "usd" : "eth");
    }
    return {
      name: entry.metric_name as string,
      data: timeData.data.map((d: any) => [d[0], d[typeIndex]] as [number, number]),
      seriesType: "area",
      color: area_colors[daKey] ?? "#888888",
    };
  });

  // Latest stacked value for the summary number in the header.
  const sumValue = (() => {
    let sum = 0;
    Object.keys(rawMetricData).forEach((key) => {
      const entry = rawMetricData[key][isMonthly ? "monthly" : "daily"];
      let typeIndex = 1;
      if (entry.types.includes("usd")) {
        typeIndex = entry.types.indexOf(showUsd ? "usd" : "eth");
      }
      const rows = entry.data;
      sum += rows[rows.length - 1][typeIndex];
    });
    return sum;
  })();

  // Nice y-axis max derived from visible stacked data, aligned with GTPChart's own axis.
  const visibleXMin = xBounds?.xMin ?? -Infinity;
  const visibleXMax = xBounds?.xMax ?? Infinity;
  const stackedSums = new Map<number, number>();
  chartSeries.forEach(({ data: pts }) => {
    pts.forEach(([t, v]) => {
      if (typeof v === "number" && t >= visibleXMin && t <= visibleXMax) {
        stackedSums.set(t, (stackedSums.get(t) ?? 0) + v);
      }
    });
  });
  const rawMax = stackedSums.size > 0 ? Math.max(0, ...stackedSums.values()) : 0;
  const [, niceMax] = scaleLinear().domain([0, rawMax]).nice(3).domain() as [number, number];

  // 3 HTML y-axis labels at ⅓, ⅔, and full of niceMax (skip zero).
  const yLabels = ([1, 2 / 3, 1 / 3] as const).map((frac) => ({
    value: niceMax * frac,
    topPx: GRID_TOP + (1 - frac) * PLOT_HEIGHT + 3,
  }));

  return (
    <div
      className="select-none relative flex flex-col w-full overflow-hidden h-[232px] bg-color-bg-default rounded-2xl group"
    >
      {/* Title + link */}
      <Link
        className="absolute hover:underline items-center text-[16px] font-bold top-[15px] left-[15px] flex gap-x-[10px] z-10"
        href={url}
      >
        <div>{chart_titles[metricKey as keyof typeof chart_titles]}</div>
        <div className="rounded-full w-[15px] h-[15px] bg-color-bg-medium flex items-center justify-center text-[10px] z-10">
          <Icon icon="feather:arrow-right" className="w-[11px] h-[11px]" />
        </div>
      </Link>

      {/* Latest total value */}
      <div className="absolute numbers-lg top-[17px] right-[30px] numbers">
        {prefix +
          Intl.NumberFormat("en-GB", {
            notation: "standard",
            maximumFractionDigits: is_fees ? 0 : 2,
            minimumFractionDigits: is_fees ? 0 : 2,
          }).format(sumValue)}
        {is_fees ? "" : " GB"}
      </div>

      {/* Watermark */}
      <div className="absolute w-full h-full flex top-[10px] justify-center items-center bg-opacity-50 z-20 rounded-full opacity-50 gap-x-[2px] px-[3px] pointer-events-none">
        <ChartWatermark className="w-[128.54px] h-[25.69px] text-color-text-secondary mix-blend-darken dark:mix-blend-lighten" />
      </div>

      {/* Date-range labels */}
      {xBounds && (
        <>
          <div className="opacity-100 transition-opacity duration-[900ms] z-20 group-hover:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-color-bg-medium-50 pointer-events-none">
            <div className="w-[5px] h-[5px] bg-color-text-primary rounded-full" />
            <div className="text-color-text-primary text-[9px] font-medium leading-[150%]">
              {new Date(xBounds.xMin).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="duration-[900ms] group-hover:opacity-0 z-20 absolute right-[15px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-color-bg-medium-50 pointer-events-none">
            <div className="text-color-text-primary text-[9px] font-medium leading-[150%]">
              {new Date(xBounds.xMax).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className="w-[5px] h-[5px] bg-color-text-primary rounded-full" />
          </div>
        </>
      )}

      {/* Chart */}
      <div className="absolute inset-0">
        <GTPChart
          series={chartSeries}
          stack
          xAxisType="time"
          xAxisMin={xBounds?.xMin}
          xAxisMax={xBounds?.xMax}
          yAxisMax={niceMax}
          prefix={is_fees ? valuePrefix : ""}
          suffix={is_fees ? "" : " GB"}
          decimals={2}
          xAxisLabelFormatter={() => ""}
          ySplitNumber={3}
          showTotal
          height="100%"
          showWatermark={false}
          animation={false}
          onLastDataPointCoords={setLastPt}
          grid={{ top: GRID_TOP, right: GRID_RIGHT, bottom: 0, left: 0 }}
          optionOverrides={{
            yAxis: {
              type: "value",
              min: 0,
              max: niceMax,
              splitNumber: 3,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { show: false },
              splitLine: {
                lineStyle: { color: splitLineColor, width: 1 },
              },
            },
          }}
        />
      </div>

      {/* Last-point line + circle — mirrors the original Highcharts SVG overlay */}
      {lastPt && (
        <svg
          className="absolute inset-0 pointer-events-none z-[6] text-color-text-primary overflow-visible"
          width="100%"
          height="100%"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`lp-grad-${metricKey}`}
              gradientUnits="userSpaceOnUse"
              x1={lastPt.pixelX}
              y1={CIRCLE_Y + 5}
              x2={lastPt.pixelX}
              y2={lastPt.pixelY}
            >
              <stop offset="0%" stopColor="currentColor" stopOpacity={1} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.33} />
            </linearGradient>
          </defs>
          {/* Vertical gradient line from last data point up to just below the circle */}
          <line
            x1={lastPt.pixelX}
            y1={lastPt.pixelY}
            x2={lastPt.pixelX}
            y2={CIRCLE_Y + 5}
            stroke={`url(#lp-grad-${metricKey})`}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          {/* Dot at the top of the line */}
          <circle
            cx={lastPt.pixelX}
            cy={CIRCLE_Y}
            r={4.5}
            fill="currentColor"
          />
        </svg>
      )}

      {/* HTML y-axis labels — real DOM so fontFeatureSettings (tnum/lnum) applies */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        {yLabels.map(({ value, topPx }) => (
          <div
            key={topPx}
            className="absolute left-[6px] numbers-xxs text-color-text-primary"
            style={{ top: topPx }}
          >
            {formatNumber(metricKey, value)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DAHeadCharts({
  selectedTimespan,
  isMonthly,
  data,
}: {
  selectedTimespan: string;
  isMonthly: boolean;
  data: AllDAOverview;
}) {
  const [showUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const valuePrefix = useMemo(() => (showUsd ? "$" : "Ξ"), [showUsd]);

  const splitLineColor = theme === "light" ? "rgba(31, 39, 38, 0.11)" : "rgba(205, 216, 211, 0.11)";

  // Backend emits monthly timestamps in microseconds (16 digits) while daily
  // uses milliseconds (13 digits). Normalize monthly to ms so axis bounds and
  // series data speak the same unit.
  const normalizedData = useMemo(() => {
    const out: AllDAOverview = { ...data, metrics: {} as any };
    Object.keys(data.metrics).forEach((metricKey) => {
      const metricGroup = (data.metrics as any)[metricKey];
      const outGroup: any = {};
      Object.keys(metricGroup).forEach((daKey) => {
        const entry = metricGroup[daKey];
        if (!entry || !entry.monthly?.data || entry.monthly.data.length === 0) {
          outGroup[daKey] = entry;
          return;
        }
        if (String(Math.trunc(entry.monthly.data[0][0])).length < 16) {
          outGroup[daKey] = entry;
          return;
        }
        outGroup[daKey] = {
          ...entry,
          monthly: {
            ...entry.monthly,
            data: entry.monthly.data.map((row: any[]) => [row[0] / 1000, ...row.slice(1)]),
          },
        };
      });
      (out.metrics as any)[metricKey] = outGroup;
    });
    return out;
  }, [data]);

  const timespans = useMemo(() => {
    let xMax = 0;
    let xMin = Infinity;

    Object.keys((normalizedData.metrics as any)["fees_paid"]).forEach((key) => {
      const dataset = (normalizedData.metrics as any)["fees_paid"][key][isMonthly ? "monthly" : "daily"].data;
      const latestX = dataset[dataset.length - 1][0];
      if (latestX > xMax) xMax = latestX;
      const earliestX = dataset[0][0];
      if (earliestX < xMin) xMin = earliestX;
    });

    if (!isMonthly) {
      return {
        "1d": { xMin: xMax - 1 * 24 * 60 * 60 * 1000, xMax },
        "7d": { xMin: xMax - 7 * 24 * 60 * 60 * 1000, xMax },
        "30d": { xMin: xMax - 30 * 24 * 60 * 60 * 1000, xMax },
        "90d": { xMin: xMax - 90 * 24 * 60 * 60 * 1000, xMax },
        "365d": { xMin: xMax - 365 * 24 * 60 * 60 * 1000, xMax },
        max: { xMin, xMax },
      };
    } else {
      return {
        "90d": { xMin: xMax - 90 * 24 * 60 * 60 * 1000, xMax },
        "180d": { xMin: xMax - 180 * 24 * 60 * 60 * 1000, xMax },
        "365d": { xMin: xMax - 365 * 24 * 60 * 60 * 1000, xMax },
        max: { xMin, xMax },
      };
    }
  }, [isMonthly, normalizedData]);

  const formatNumber = useCallback(
    (metricKey: string, value: number): string => {
      const formatLargeNumber = (num: number) => {
        let formatted = d3Format(".2s")(num).replace(/G/, "B");
        if (/(\.\dK|\.\dM|\.\dB)$/.test(formatted)) {
          formatted = d3Format(".3s")(num).replace(/G/, "B");
        } else if (/(\.\d\dK|\.\d\dM|\.\d\dB)$/.test(formatted)) {
          formatted = d3Format(".4s")(num).replace(/G/, "B");
        }
        return formatted;
      };

      if (metricKey.includes("fees_paid")) {
        if (showUsd && value < 1) return valuePrefix + value.toFixed(2);
        return valuePrefix + formatLargeNumber(value);
      }
      return formatLargeNumber(value) + " GB";
    },
    [showUsd, valuePrefix],
  );

  return (
    <Carousel
      ariaId="da-overview"
      heightClass="h-[calc(232px+12px+15px)]"
      minSlideWidth={350}
      maxSlidesPerView={3}
      pagination="dots"
      arrows={false}
      bottomOffset={0}
    >
      {Object.keys(data.metrics)
        .filter(() => selectedTimespan !== "1d")
        .reverse()
        .map((metricKey) => (
          <DAHeadChartSlide
            key={metricKey}
            metricKey={metricKey}
            isMonthly={isMonthly}
            showUsd={showUsd}
            valuePrefix={valuePrefix}
            normalizedData={normalizedData}
            rawMetricData={(data.metrics as any)[metricKey]}
            xBounds={timespans[selectedTimespan as keyof typeof timespans]}
            splitLineColor={splitLineColor}
            formatNumber={formatNumber}
          />
        ))}

      {/* Top DA consumers slide */}
      {selectedTimespan === "1d" ? (
        <div className="w-full">
          <div className="flex flex-col gap-y-[5px] w-full py-[15px] relative h-[232px]">
            <div className="flex items-center heading-large-sm gap-x-[10px]">
              <div>Top 5 DA Consumers</div>
            </div>
            <TopDAConsumers
              consumer_data={data.top_da_consumers}
              selectedTimespan={selectedTimespan}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-[5px] w-full py-[15px] relative h-[232px]">
          <div className="flex items-center heading-large-sm gap-x-[10px]">
            <div>Top 5 DA Consumers</div>
          </div>
          <TopDAConsumers
            consumer_data={data.top_da_consumers}
            selectedTimespan={selectedTimespan}
          />
        </div>
      )}
    </Carousel>
  );
}
