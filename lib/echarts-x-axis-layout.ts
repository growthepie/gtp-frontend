import { clamp } from "./echarts-utils";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const THREE_DAYS_MS = 3 * DAY_MS;
const THREE_MONTHS_MS = 3 * 30 * DAY_MS;
const SEVEN_DAYS_MS = 7 * DAY_MS;

type XAxisValue = number | string;
type XAxisLabelFormatter = (value: XAxisValue) => string;

type TimeRangeProfile = "intraday" | "daily" | "monthly";

type Grid = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type TimeAxisLayout = {
  grid: Grid;
  min?: number;
  max?: number;
  splitNumber: number;
  minInterval?: number;
  labelFormatter: XAxisLabelFormatter;
  defaultLabelFormatter: XAxisLabelFormatter;
};

type BuildTimeXAxisLayoutParams = {
  timestamps: number[];
  barSeriesData: Array<[number, number | null][]>;
  xAxisMin?: number;
  xAxisMax?: number;
  xAxisLabelFormatter?: XAxisLabelFormatter;
  containerWidth: number;
  grid: Grid;
};

const getRangeProfile = (xAxisRangeMs?: number) => {
  const isLessThan3Days = typeof xAxisRangeMs === "number" && xAxisRangeMs < THREE_DAYS_MS;
  const isLessThan3Months = typeof xAxisRangeMs === "number" && xAxisRangeMs < THREE_MONTHS_MS;
  const isLongerThan7Days = typeof xAxisRangeMs === "number" && xAxisRangeMs > SEVEN_DAYS_MS;

  const profile: TimeRangeProfile = isLessThan3Days ? "intraday" : isLessThan3Months ? "daily" : "monthly";
  const fallbackLabelWidthPx = profile === "intraday" ? 40 : profile === "daily" ? 72 : 62;
  const labelGapPx = profile === "intraday" ? 12 : 16;

  return {
    profile,
    isLongerThan7Days,
    fallbackLabelWidthPx,
    labelGapPx,
  };
};

const createDefaultLabelFormatter = ({
  profile,
  isLongerThan7Days,
}: {
  profile: TimeRangeProfile;
  isLongerThan7Days: boolean;
}): XAxisLabelFormatter => {
  return (value: XAxisValue) => {
    const numericValue = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numericValue)) {
      return String(value);
    }

    const date = new Date(numericValue);
    const isJanFirst = date.getUTCMonth() === 0 && date.getUTCDate() === 1;

    if (isLongerThan7Days && isJanFirst) {
      const yearLabel = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        timeZone: "UTC",
      }).format(numericValue);
      return `{yearBold|${yearLabel}}`;
    }

    if (profile === "intraday") {
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      if (hours === 0 && minutes === 0) {
        const dayLabel = new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(numericValue);
        return `{dateBold|${dayLabel}}`;
      }

      return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        hour12: false,
      }).format(numericValue);
    }

    if (profile === "daily") {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(numericValue);
    }

    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(numericValue);
  };
};

const stripRichLabelTags = (label: string) =>
  label
    .replace(/\{[^|}]+\|([^}]*)\}/g, "$1")
    .replace(/[{}]/g, "")
    .trim();

const estimateLabelWidthPx = (rawLabel: string) => {
  const plainLabel = stripRichLabelTags(rawLabel);
  if (!plainLabel) {
    return 0;
  }

  const isYearOnly = /^\d{4}$/.test(plainLabel);
  const charWidth = isYearOnly ? 7.2 : 6.4;
  const horizontalPadding = isYearOnly ? 14 : 16;
  return Math.ceil(plainLabel.length * charWidth + horizontalPadding);
};

const sampleTimestamps = ({
  visibleTimestamps,
  visibleMinTs,
  visibleMaxTs,
  minTimestamp,
  maxTimestamp,
}: {
  visibleTimestamps: number[];
  visibleMinTs: number;
  visibleMaxTs: number;
  minTimestamp?: number;
  maxTimestamp?: number;
}) => {
  if (visibleTimestamps.length > 0) {
    if (visibleTimestamps.length <= 12) {
      return visibleTimestamps;
    }

    const stride = Math.ceil(visibleTimestamps.length / 12);
    return visibleTimestamps.filter(
      (_, index) => index % stride === 0 || index === visibleTimestamps.length - 1,
    );
  }

  const fallbackMin = Number.isFinite(visibleMinTs)
    ? visibleMinTs
    : minTimestamp !== undefined
      ? minTimestamp
      : undefined;
  const fallbackMax = Number.isFinite(visibleMaxTs)
    ? visibleMaxTs
    : maxTimestamp !== undefined
      ? maxTimestamp
      : undefined;

  if (
    fallbackMin === undefined ||
    fallbackMax === undefined ||
    !Number.isFinite(fallbackMin) ||
    !Number.isFinite(fallbackMax) ||
    fallbackMax <= fallbackMin
  ) {
    return [] as number[];
  }

  const sampleCount = 6;
  const step = (fallbackMax - fallbackMin) / (sampleCount - 1);
  return Array.from({ length: sampleCount }, (_, index) => fallbackMin + step * index);
};

const getMedian = (values: number[]) => {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const getBarBoundsWithPadding = ({
  barSeriesData,
  xAxisMin,
  xAxisMax,
  xAxisRangeMs,
}: {
  barSeriesData: Array<[number, number | null][]>;
  xAxisMin?: number;
  xAxisMax?: number;
  xAxisRangeMs?: number;
}) => {
  if (barSeriesData.length === 0) {
    return {
      min: xAxisMin,
      max: xAxisMax,
    };
  }

  const tsMin = Number.isFinite(Number(xAxisMin)) ? Number(xAxisMin) : -Infinity;
  const tsMax = Number.isFinite(Number(xAxisMax)) ? Number(xAxisMax) : Infinity;
  const sortedBarTimestamps = Array.from(
    new Set(
      barSeriesData.flatMap((points) =>
        points
          .filter((point) => typeof point[1] === "number" && Number.isFinite(point[1]))
          .map((point) => Number(point[0]))
          .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= tsMin && timestamp <= tsMax),
      ),
    ),
  ).sort((a, b) => a - b);

  if (sortedBarTimestamps.length === 0) {
    return {
      min: xAxisMin,
      max: xAxisMax,
    };
  }

  const intervals: number[] = [];
  for (let i = 1; i < sortedBarTimestamps.length; i += 1) {
    const interval = sortedBarTimestamps[i] - sortedBarTimestamps[i - 1];
    if (interval > 0 && Number.isFinite(interval)) {
      intervals.push(interval);
    }
  }

  const medianInterval = getMedian(intervals);
  const fallbackInterval =
    typeof xAxisRangeMs === "number" && xAxisRangeMs > 0
      ? xAxisRangeMs / 20
      : undefined;
  const edgeInterval = medianInterval ?? fallbackInterval;

  const minBase = Number(xAxisMin ?? sortedBarTimestamps[0]);
  const maxBase = Number(xAxisMax ?? sortedBarTimestamps[sortedBarTimestamps.length - 1]);

  if (!Number.isFinite(minBase) || !Number.isFinite(maxBase)) {
    return {
      min: xAxisMin,
      max: xAxisMax,
    };
  }

  const pad = Number.isFinite(edgeInterval) ? Number(edgeInterval) * 0.25 : 0;
  return {
    min: minBase - pad,
    max: maxBase + pad,
  };
};

/**
 * Resolve all time-axis sizing/layout knobs in one place.
 * A single call determines:
 * - label formatter,
 * - tick density (`splitNumber` + `minInterval`),
 * - padded axis bounds for bar charts.
 */
export const buildTimeXAxisLayout = ({
  timestamps,
  barSeriesData,
  xAxisMin,
  xAxisMax,
  xAxisLabelFormatter,
  containerWidth,
  grid,
}: BuildTimeXAxisLayoutParams): TimeAxisLayout => {
  const dedupedTimestamps = Array.from(
    new Set(timestamps.filter((timestamp) => Number.isFinite(timestamp))),
  ).sort((a, b) => a - b);
  const minTimestamp = dedupedTimestamps.length > 0 ? dedupedTimestamps[0] : undefined;
  const maxTimestamp = dedupedTimestamps.length > 0 ? dedupedTimestamps[dedupedTimestamps.length - 1] : undefined;

  const explicitRangeMs =
    Number.isFinite(xAxisMin) && Number.isFinite(xAxisMax) ? Number(xAxisMax) - Number(xAxisMin) : undefined;
  const inferredRangeMs =
    minTimestamp !== undefined && maxTimestamp !== undefined ? maxTimestamp - minTimestamp : undefined;
  const xAxisRangeMs = explicitRangeMs ?? inferredRangeMs;

  const rangeProfile = getRangeProfile(xAxisRangeMs);
  const defaultLabelFormatter = createDefaultLabelFormatter(rangeProfile);
  const labelFormatter = xAxisLabelFormatter ?? defaultLabelFormatter;

  const visibleMinTs = Number.isFinite(xAxisMin) ? Number(xAxisMin) : -Infinity;
  const visibleMaxTs = Number.isFinite(xAxisMax) ? Number(xAxisMax) : Infinity;

  const visibleTimestamps = dedupedTimestamps.filter(
    (timestamp) => timestamp >= visibleMinTs && timestamp <= visibleMaxTs,
  );
  const sampledTimestamps = sampleTimestamps({
    visibleTimestamps,
    visibleMinTs,
    visibleMaxTs,
    minTimestamp,
    maxTimestamp,
  });

  const sampledLabelWidths = sampledTimestamps
    .map((timestamp) => {
      try {
        return estimateLabelWidthPx(String(labelFormatter(timestamp)));
      } catch {
        return estimateLabelWidthPx(String(defaultLabelFormatter(timestamp)));
      }
    })
    .filter((width) => Number.isFinite(width) && width > 0);

  const labelWidthPx = clamp(
    sampledLabelWidths.length > 0
      ? Math.max(...sampledLabelWidths, rangeProfile.fallbackLabelWidthPx)
      : rangeProfile.fallbackLabelWidthPx,
    rangeProfile.fallbackLabelWidthPx,
    160,
  );

  const plotWidthPx = Math.max(100, (containerWidth || 600) - grid.left - grid.right);
  const splitNumber = Math.max(2, Math.floor(plotWidthPx / (labelWidthPx + rangeProfile.labelGapPx)));
  const minInterval =
    typeof xAxisRangeMs === "number" && splitNumber > 1 ? xAxisRangeMs / (splitNumber - 1) : undefined;

  const bounds = getBarBoundsWithPadding({
    barSeriesData,
    xAxisMin,
    xAxisMax,
    xAxisRangeMs,
  });

  return {
    grid,
    min: bounds.min,
    max: bounds.max,
    splitNumber,
    minInterval,
    labelFormatter,
    defaultLabelFormatter,
  };
};
