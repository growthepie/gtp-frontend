const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
  minInterval: number;
  /** The first clean tick boundary (snapped min, where ticks start). */
  firstTick?: number;
  /** The last clean tick boundary within the visible axis range. */
  lastTick?: number;
  /** Effective range in days — used to select the correct label formatter tier. */
  rangeDays: number;
};

// --- Custom overlay label types ---

export type TickPosition = { timestamp: number };

export type FormattedLabel = {
  text: string;
  isBold: boolean;
  boldType?: "year" | "date";
};

export type PlainLabelFormatter = (timestamp: number, isFirst: boolean) => FormattedLabel;

export type VisibleLabel = {
  timestamp: number;
  text: string;
  isBold: boolean;
  boldType?: "year" | "date";
  pixelX: number;
  align: "left" | "center" | "right";
  textWidth: number;
};

type BuildTimeXAxisLayoutParams = {
  timestamps: number[];
  barSeriesData: Array<[number, number | null][]>;
  xAxisMin?: number;
  xAxisMax?: number;
  grid: Grid;
  snapToCleanBoundary?: boolean;
  tickIntervalMs?: number;
  tickAlignToCleanBoundary?: boolean;
  barEdgePaddingRatio?: number;
};

// --- Tick interval table (deterministic, based on effective range) ---

const MINUTE_MS = 60 * 1000;

const TICK_INTERVALS: { maxDays: number; intervalMs: number }[] = [
  // Hourly ranges
  { maxDays: 1 / 24, intervalMs: 10 * MINUTE_MS },        // ≤ 1 hour  → 10 min
  { maxDays: 3 / 24, intervalMs: 30 * MINUTE_MS },        // ≤ 3 hours → 30 min
  { maxDays: 6 / 24, intervalMs: 1 * HOUR_MS },           // ≤ 6 hours → 1 hour
  { maxDays: 12 / 24, intervalMs: 2 * HOUR_MS },          // ≤ 12 hours → 2 hours
  { maxDays: 1, intervalMs: 4 * HOUR_MS },                // ≤ 1 day   → 4 hours
  // Daily+ ranges
  { maxDays: 7, intervalMs: 1 * DAY_MS },                 // ≤ 7 days  → 1 day
  { maxDays: 30, intervalMs: 7 * DAY_MS },                // ≤ 30 days → 1 week
  { maxDays: 90, intervalMs: 30 * DAY_MS },               // ≤ 90 days → 1 month
  { maxDays: 365, intervalMs: 2 * 30 * DAY_MS },          // ≤ 1 year  → 2 months
  { maxDays: 730, intervalMs: 3 * 30 * DAY_MS },          // ≤ 2 years → 3 months
  { maxDays: 1460, intervalMs: 6 * 30 * DAY_MS },         // ≤ 4 years → 6 months
];
const FALLBACK_INTERVAL_MS = 12 * 30 * DAY_MS;            // > 4 years → 12 months

const getTickInterval = (rangeDays: number): number => {
  for (const tier of TICK_INTERVALS) {
    if (rangeDays <= tier.maxDays) return tier.intervalMs;
  }
  return FALLBACK_INTERVAL_MS;
};

const SHORT_RANGE_THRESHOLD_DAYS = 40;

// --- Bar chart axis padding ---

const getMedian = (values: number[]) => {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const getBarBoundsWithPadding = ({
  barSeriesData,
  xAxisMin,
  xAxisMax,
  xAxisRangeMs,
  edgePaddingRatio = 0.25,
}: {
  barSeriesData: Array<[number, number | null][]>;
  xAxisMin?: number;
  xAxisMax?: number;
  xAxisRangeMs?: number;
  edgePaddingRatio?: number;
}) => {
  if (barSeriesData.length === 0) {
    return { min: xAxisMin, max: xAxisMax };
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
    return { min: xAxisMin, max: xAxisMax };
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
    typeof xAxisRangeMs === "number" && xAxisRangeMs > 0 ? xAxisRangeMs / 20 : undefined;
  const edgeInterval = medianInterval ?? fallbackInterval;

  const minBase = Number(xAxisMin ?? sortedBarTimestamps[0]);
  const maxBase = Number(xAxisMax ?? sortedBarTimestamps[sortedBarTimestamps.length - 1]);

  if (!Number.isFinite(minBase) || !Number.isFinite(maxBase)) {
    return { min: xAxisMin, max: xAxisMax };
  }

  const safePaddingRatio = Number.isFinite(edgePaddingRatio) ? Math.max(0, edgePaddingRatio) : 0.25;
  const pad = Number.isFinite(edgeInterval) ? Number(edgeInterval) * safePaddingRatio : 0;
  return { min: minBase - pad, max: maxBase + pad };
};

// --- Tick alignment ---
// Snap the axis min to a clean UTC boundary so ticks land on round values
// (midnight, 1st of month, etc.) instead of arbitrary offsets from xAxisMin.

const snapToCleanBoundary = (timestampMs: number, intervalMs: number): number => {
  const date = new Date(timestampMs);

  if (intervalMs >= 30 * DAY_MS) {
    // Monthly or larger: snap to a month aligned with January so that
    // year boundaries (Jan 1st) are always included in the tick set.
    // e.g. 6-month step → snaps to Jan or Jul; 12-month → always Jan.
    const monthStep = Math.max(1, Math.round(intervalMs / (30 * DAY_MS)));
    const alignedMonth = Math.floor(date.getUTCMonth() / monthStep) * monthStep;
    return Date.UTC(date.getUTCFullYear(), alignedMonth, 1);
  }

  if (intervalMs >= DAY_MS) {
    // Daily or weekly: snap to midnight
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  // Sub-day: snap down to the nearest interval boundary from midnight
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const msSinceMidnight = timestampMs - midnight;
  const intervals = Math.floor(msSinceMidnight / intervalMs);
  return midnight + intervals * intervalMs;
};

// --- Tick position helpers ---
// Find the last clean tick boundary that fits within the visible axis range.
// For monthly+ intervals, uses calendar-aware stepping to handle varying month lengths.
const findLastVisibleTick = (
  firstTick: number,
  axisMax: number,
  intervalMs: number,
): number => {
  if (!Number.isFinite(firstTick) || !Number.isFinite(axisMax) || axisMax <= firstTick) {
    return firstTick;
  }

  if (intervalMs >= 30 * DAY_MS) {
    // Monthly+: step by calendar months (months vary 28-31 days)
    const monthStep = Math.max(1, Math.round(intervalMs / (30 * DAY_MS)));
    let lastValid = firstTick;
    const d = new Date(firstTick);
    for (;;) {
      d.setUTCMonth(d.getUTCMonth() + monthStep);
      const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      if (next > axisMax) break;
      lastValid = next;
      d.setTime(lastValid);
    }
    return lastValid;
  }

  // Sub-monthly: fixed interval stepping
  const steps = Math.floor((axisMax - firstTick) / intervalMs);
  return firstTick + steps * intervalMs;
};

// --- Subtick interval mapping ---

const getSubtickInterval = (mainIntervalMs: number): number => {
  if (mainIntervalMs <= 10 * MINUTE_MS) return 2 * MINUTE_MS;
  if (mainIntervalMs <= 30 * MINUTE_MS) return 10 * MINUTE_MS;
  if (mainIntervalMs <= HOUR_MS) return 15 * MINUTE_MS;
  if (mainIntervalMs <= 2 * HOUR_MS) return 30 * MINUTE_MS;
  if (mainIntervalMs <= 4 * HOUR_MS) return HOUR_MS;
  if (mainIntervalMs <= DAY_MS) return 6 * HOUR_MS;
  if (mainIntervalMs <= 7 * DAY_MS) return DAY_MS;
  if (mainIntervalMs <= 30 * DAY_MS) return 7 * DAY_MS;
  if (mainIntervalMs <= 2 * 30 * DAY_MS) return 30 * DAY_MS;
  if (mainIntervalMs <= 6 * 30 * DAY_MS) return 2 * 30 * DAY_MS;
  return 3 * 30 * DAY_MS;
};

export const computeSubtickPixelPositions = ({
  mainIntervalMs,
  axisMin,
  axisMax,
  plotLeft,
  plotWidth,
  labeledTimestamps,
  timestampToPixel,
}: {
  mainIntervalMs: number;
  axisMin: number;
  axisMax: number;
  plotLeft: number;
  plotWidth: number;
  labeledTimestamps: Set<number>;
  timestampToPixel: (ts: number) => number;
}): number[] => {
  const subInterval = getSubtickInterval(mainIntervalMs);
  if (subInterval >= mainIntervalMs) return [];
  if (plotWidth <= 0) return [];

  const firstSub = snapToCleanBoundary(axisMin, subInterval);
  const ticks = enumerateTickPositions(firstSub, axisMax, subInterval, axisMax);

  // Skip if too dense (< 4px average spacing)
  if (ticks.length > 0 && plotWidth / ticks.length < 4) return [];

  const seen = new Set<number>();
  return ticks
    .filter((t) => !labeledTimestamps.has(t.timestamp))
    .map((t) => Math.round(timestampToPixel(t.timestamp)))
    .filter((px) => px >= plotLeft && px <= plotLeft + plotWidth && !seen.has(px) && seen.add(px));
};

// --- Custom overlay label functions ---

export const enumerateTickPositions = (
  firstTick: number,
  lastTick: number,
  intervalMs: number,
  axisMax: number,
): TickPosition[] => {
  const ticks: TickPosition[] = [];
  if (!Number.isFinite(firstTick) || !Number.isFinite(lastTick) || lastTick < firstTick) return ticks;

  if (intervalMs >= 30 * DAY_MS) {
    const monthStep = Math.max(1, Math.round(intervalMs / (30 * DAY_MS)));
    const d = new Date(firstTick);
    let current = firstTick;
    while (current <= axisMax) {
      ticks.push({ timestamp: current });
      if (current >= lastTick) break;
      d.setUTCMonth(d.getUTCMonth() + monthStep);
      current = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
      d.setTime(current);
    }
  } else {
    let current = firstTick;
    while (current <= axisMax) {
      ticks.push({ timestamp: current });
      if (current >= lastTick) break;
      current += intervalMs;
    }
  }
  return ticks;
};

export const createPlainLabelFormatter = (rangeDays: number): PlainLabelFormatter => {
  const isIntraday = rangeDays <= 1;
  const isShortRange = rangeDays <= SHORT_RANGE_THRESHOLD_DAYS;

  return (value: number, isFirst: boolean): FormattedLabel => {
    if (!Number.isFinite(value)) return { text: String(value), isBold: false };
    const date = new Date(value);

    if (isIntraday) {
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      if (hours === 0 && minutes === 0) {
        return {
          text: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(value),
          isBold: true,
          boldType: "date",
        };
      }
      return {
        text: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }).format(value),
        isBold: false,
      };
    }

    if (isShortRange) {
      if (isFirst) {
        return {
          text: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value),
          isBold: false,
        };
      }
      return {
        text: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(value),
        isBold: false,
      };
    }

    // Long range
    const isJanFirst = date.getUTCMonth() === 0 && date.getUTCDate() === 1;
    if (isJanFirst) {
      return {
        text: new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: "UTC" }).format(value),
        isBold: true,
        boldType: "year",
      };
    }

    if (date.getUTCDate() === 1) {
      return {
        text: new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(value),
        isBold: false,
      };
    }

    return {
      text: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(value),
      isBold: false,
    };
  };
};

const getEffectiveRightEdge = (label: VisibleLabel): number => {
  if (label.align === "left") return label.pixelX + label.textWidth;
  if (label.align === "right") return label.pixelX;
  return label.pixelX + label.textWidth / 2;
};

export const computeVisibleXAxisLabels = ({
  ticks,
  containerWidth,
  labelFormatter,
  measureText,
  timestampToPixel,
  minGap = 16,
}: {
  ticks: TickPosition[];
  containerWidth: number;
  labelFormatter: PlainLabelFormatter;
  measureText: (text: string, isBold: boolean) => number;
  timestampToPixel: (ts: number) => number;
  minGap?: number;
}): VisibleLabel[] => {
  if (ticks.length === 0 || containerWidth <= 0) return [];

  // Build candidates with pixel positions and measured widths
  const candidates = ticks.map((tick, index) => {
    const pixelX = timestampToPixel(tick.timestamp);
    const formatted = labelFormatter(tick.timestamp, index === 0);
    const textWidth = measureText(formatted.text, formatted.isBold);
    return { timestamp: tick.timestamp, text: formatted.text, isBold: formatted.isBold, boldType: formatted.boldType, pixelX, textWidth };
  });

  if (candidates.length === 0) return [];

  const first = candidates[0];
  const last = candidates.length > 1 ? candidates[candidates.length - 1] : null;
  const lastIdx = last ? candidates.length - 1 : -1;

  const resolveAlign = (c: { pixelX: number; textWidth: number }, isFirst: boolean, isLast: boolean): VisibleLabel["align"] => {
    if (isFirst && c.pixelX - c.textWidth / 2 < 0) return "left";
    if (isLast && c.pixelX + c.textWidth / 2 > containerWidth) return "right";
    return "center";
  };

  const getLeftEdge = (c: { pixelX: number; textWidth: number }, align: VisibleLabel["align"]): number => {
    if (align === "left") return c.pixelX;
    if (align === "right") return c.pixelX - c.textWidth;
    return c.pixelX - c.textWidth / 2;
  };

  // Two-pass greedy placement: bold (year) labels first, then fill in regular.
  // This ensures year boundaries are always shown when there's room.
  const hasBoldCandidates = candidates.some((c) => c.isBold);

  const placedMap = new Map<number, VisibleLabel>();

  const fitsWithNeighbours = (_candidateIdx: number, align: VisibleLabel["align"], c: { pixelX: number; textWidth: number }): boolean => {
    const leftEdge = getLeftEdge(c, align);
    const rightEdge = align === "left" ? c.pixelX + c.textWidth : align === "right" ? c.pixelX : c.pixelX + c.textWidth / 2;

    // Check against all already-placed labels
    for (const [, placed] of placedMap) {
      const pRight = getEffectiveRightEdge(placed);
      const pLeft = getLeftEdge(placed, placed.align);
      // Overlap check: does [leftEdge, rightEdge] conflict with [pLeft, pRight]?
      if (leftEdge < pRight + minGap && rightEdge > pLeft - minGap) return false;
    }
    return true;
  };

  // Always place first
  const firstAlign = resolveAlign(first, true, lastIdx === 0);
  placedMap.set(0, { ...first, align: firstAlign });

  // Always place last
  if (last && lastIdx > 0) {
    const lastAlign = resolveAlign(last, false, true);
    if (fitsWithNeighbours(lastIdx, lastAlign, last)) {
      placedMap.set(lastIdx, { ...last, align: lastAlign });
    }
  }

  // Pass 1: place bold (year) labels in the middle range
  if (hasBoldCandidates) {
    for (let i = 1; i < (last ? candidates.length - 1 : candidates.length); i++) {
      const c = candidates[i];
      if (!c.isBold) continue;
      const align = resolveAlign(c, false, false);
      if (fitsWithNeighbours(i, align, c)) {
        placedMap.set(i, { ...c, align });
      }
    }
  }

  // Pass 2: fill in regular labels
  for (let i = 1; i < (last ? candidates.length - 1 : candidates.length); i++) {
    if (placedMap.has(i)) continue;
    const c = candidates[i];
    const align = resolveAlign(c, false, false);
    if (fitsWithNeighbours(i, align, c)) {
      placedMap.set(i, { ...c, align });
    }
  }

  // If last was placed but its predecessor is too close, drop the predecessor
  if (last && lastIdx > 0 && !placedMap.has(lastIdx)) {
    // Last didn't fit initially — try dropping the closest placed label before it
    const sortedKeys = [...placedMap.keys()].sort((a, b) => a - b);
    const prevKey = sortedKeys.length > 1 ? sortedKeys[sortedKeys.length - 1] : undefined;
    if (prevKey !== undefined && prevKey !== 0) {
      placedMap.delete(prevKey);
      const lastAlign = resolveAlign(last, false, true);
      if (fitsWithNeighbours(lastIdx, lastAlign, last)) {
        placedMap.set(lastIdx, { ...last, align: lastAlign });
      } else {
        // Re-add the removed one since last still doesn't fit
        const prevC = candidates[prevKey];
        const prevAlign = resolveAlign(prevC, false, false);
        if (fitsWithNeighbours(prevKey, prevAlign, prevC)) {
          placedMap.set(prevKey, { ...prevC, align: prevAlign });
        }
      }
    }
  }

  // Return in tick order
  return [...placedMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, label]) => label);
};

// --- Main entry point ---

/**
 * Resolve all time-axis layout in one place:
 * - deterministic tick interval based on effective range,
 * - label formatter (short-range vs long-range logic),
 * - padded axis bounds for bar charts.
 */
export const buildTimeXAxisLayout = ({
  timestamps,
  barSeriesData,
  xAxisMin,
  xAxisMax,
  grid,
  snapToCleanBoundary: snapToCleanBoundaryEnabled = true,
  tickIntervalMs,
  tickAlignToCleanBoundary,
  barEdgePaddingRatio,
}: BuildTimeXAxisLayoutParams): TimeAxisLayout => {
  const dedupedTimestamps = Array.from(
    new Set(timestamps.filter((timestamp) => Number.isFinite(timestamp))),
  ).sort((a, b) => a - b);
  const minTimestamp = dedupedTimestamps.length > 0 ? dedupedTimestamps[0] : undefined;
  const maxTimestamp = dedupedTimestamps.length > 0 ? dedupedTimestamps[dedupedTimestamps.length - 1] : undefined;

  // Compute the effective visible range. Prefer explicit bounds, but also handle
  // cases where only one bound is set (e.g., timespan presets that set xMin but not xMax).
  const effectiveMin = Number.isFinite(xAxisMin) ? Number(xAxisMin) : minTimestamp;
  const effectiveMax = Number.isFinite(xAxisMax) ? Number(xAxisMax) : maxTimestamp;
  const xAxisRangeMs =
    effectiveMin !== undefined && effectiveMax !== undefined && effectiveMax > effectiveMin
      ? effectiveMax - effectiveMin
      : undefined;
  const rangeDays = typeof xAxisRangeMs === "number" ? xAxisRangeMs / DAY_MS : 365;

  const interval =
    typeof tickIntervalMs === "number" && Number.isFinite(tickIntervalMs) && tickIntervalMs > 0
      ? tickIntervalMs
      : getTickInterval(rangeDays);
  const snapTicksToCleanBoundary = tickAlignToCleanBoundary ?? snapToCleanBoundaryEnabled;

  // Snap axis min to a clean boundary so ticks land on round values.
  const snappedMin =
    effectiveMin !== undefined && snapToCleanBoundaryEnabled
      ? snapToCleanBoundary(effectiveMin, interval)
      : effectiveMin;
  const snappedTickStart =
    effectiveMin !== undefined && snapTicksToCleanBoundary
      ? snapToCleanBoundary(effectiveMin, interval)
      : effectiveMin;

  const bounds = getBarBoundsWithPadding({
    barSeriesData,
    xAxisMin: snappedMin ?? xAxisMin,
    xAxisMax,
    xAxisRangeMs,
    edgePaddingRatio: barEdgePaddingRatio,
  });

  const resolvedMax = bounds.max ?? effectiveMax;
  const firstTick = snappedTickStart;
  const lastTick =
    firstTick !== undefined && resolvedMax !== undefined
      ? findLastVisibleTick(firstTick, resolvedMax, interval)
      : undefined;

  return {
    grid,
    min: bounds.min ?? snappedMin,
    max: resolvedMax,
    minInterval: interval,
    firstTick,
    lastTick,
    rangeDays,
  };
};
