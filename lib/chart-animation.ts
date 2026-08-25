export const CHART_REVEAL_DURATION_MS = 500;

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const LONG_TIMESPANS = new Set(["365d", "52w", "12m", "24m", "sinceLaunch"]);
const MAX_TIMESPANS = new Set(["max", "maxW", "maxM"]);

export function getTimeseriesChartRevealDurationMs(
  timespan: string,
  visibleRangeMs: number,
) {
  const multiplier =
    LONG_TIMESPANS.has(timespan) ||
    (MAX_TIMESPANS.has(timespan) && visibleRangeMs > ONE_YEAR_MS)
      ? 4
      : 2;

  return CHART_REVEAL_DURATION_MS * multiplier;
}
