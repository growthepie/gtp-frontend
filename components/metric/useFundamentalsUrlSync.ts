"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Opt-in URL parameters for the fundamental metric charts.
 *
 * The chart's real source of truth stays the sessionStorage-backed
 * MetricChartControlsContext (plus a couple of local states in MetricsContainer).
 * This hook is a thin sync layer on top of the existing setters with one firm rule:
 *
 *   The URL is only ever written to if the page was loaded from a URL that already
 *   contained at least one recognized param ("armed"). A normal visit leaves the
 *   address bar untouched and behaves exactly as before.
 *
 * When armed, the recognized params are hydrated into state on mount and then kept
 * in sync (params equal to their default are removed so the URL stays minimal).
 */

const RECOGNIZED_PARAMS = [
  "timespan",
  "interval",
  "scale",
  "chains",
  "zoom",
  "showUsd",
  "hideTable",
] as const;

const SCALE_VALUES = ["absolute", "stacked", "percentage"];

// Defaults — a param is omitted from the URL when its value matches these.
const DEFAULT_TIMESPAN = "365d";
const DEFAULT_INTERVAL = "daily";
const DEFAULT_SCALE = "absolute";
const DEFAULT_SHOW_USD = true;
const DEFAULT_HIDE_TABLE = false;

const WRITE_DEBOUNCE_MS = 300;

type FundamentalsUrlSyncArgs = {
  /** Only fundamentals opt in for now; pass metric_type === "fundamentals". */
  enabled: boolean;

  selectedTimespan: string;
  setSelectedTimespan: (v: string) => void;
  selectedTimeInterval: string;
  setSelectedTimeInterval: (v: string) => void;
  selectedScale: string;
  setSelectedScale: (v: string) => void;
  selectedChains: string[];
  setSelectedChains: (v: string[]) => void;
  selectedRange: [number, number] | null;
  setSelectedRange: (v: [number, number] | null) => void;
  setZoomed: (v: boolean) => void;
  showUsd: boolean;
  setShowUsd: (v: boolean) => void;
  collapseTable: boolean;
  setCollapseTable: (v: boolean) => void;

  /** Reference data for validating hydrated values / omitting defaults. */
  availableTimespans: string[];
  availableIntervals: string[];
  availableChains: string[];
  defaultChains: string[];
};

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((v) => setB.has(v));
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string,
  defaultValue: string,
) {
  if (value === defaultValue) params.delete(key);
  else params.set(key, value);
}

export function useFundamentalsUrlSync(args: FundamentalsUrlSyncArgs) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // armed = at least one recognized param was present on the initial load.
  const armedRef = useRef(false);
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest args in a ref so the debounced writer never reads stale values.
  const argsRef = useRef(args);
  argsRef.current = args;

  // Reference data (timespans/intervals/chains) loads asynchronously; wait for it so
  // the data-dependent params (timespan/interval/chains) can be validated on hydrate.
  const dataReady =
    args.availableTimespans.length > 0 &&
    args.availableIntervals.length > 0 &&
    args.availableChains.length > 0;

  // 1. Arm detection + hydrate (runs once, after reference data is ready).
  useEffect(() => {
    if (!args.enabled || hydratedRef.current || !dataReady) return;
    hydratedRef.current = true;

    const armed = RECOGNIZED_PARAMS.some((k) => searchParams.has(k));
    armedRef.current = armed;
    if (!armed) return;

    // Set interval before timespan (existing context effects sanitize mismatches).
    const interval = searchParams.get("interval");
    if (interval && args.availableIntervals.includes(interval)) {
      args.setSelectedTimeInterval(interval);
    }

    const timespan = searchParams.get("timespan");
    if (timespan && args.availableTimespans.includes(timespan)) {
      args.setSelectedTimespan(timespan);
    }

    const scale = searchParams.get("scale");
    if (scale && SCALE_VALUES.includes(scale)) {
      args.setSelectedScale(scale);
    }

    const chains = searchParams.get("chains");
    if (chains !== null) {
      const list = chains
        .split(",")
        .filter(Boolean)
        .filter((c) => args.availableChains.includes(c));
      if (list.length) args.setSelectedChains(list);
    }

    const showUsd = searchParams.get("showUsd");
    if (showUsd !== null) args.setShowUsd(showUsd === "true");

    const hideTable = searchParams.get("hideTable");
    if (hideTable !== null) args.setCollapseTable(hideTable === "true");

    const zoom = searchParams.get("zoom");
    if (zoom) {
      const [a, b] = zoom.split("_").map(Number);
      if (Number.isFinite(a) && Number.isFinite(b) && a < b) {
        args.setSelectedRange([a, b]);
        args.setZoomed(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [args.enabled, dataReady]);

  // 2. Write-back (only when armed). Debounced so drag-zoom doesn't spam history.
  useEffect(() => {
    if (!args.enabled || !armedRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const a = argsRef.current;
      const params = new URLSearchParams(window.location.search);

      setOrDelete(params, "timespan", a.selectedTimespan, DEFAULT_TIMESPAN);
      setOrDelete(params, "interval", a.selectedTimeInterval, DEFAULT_INTERVAL);
      setOrDelete(params, "scale", a.selectedScale, DEFAULT_SCALE);
      setOrDelete(params, "showUsd", String(a.showUsd), String(DEFAULT_SHOW_USD));
      setOrDelete(params, "hideTable", String(a.collapseTable), String(DEFAULT_HIDE_TABLE));

      if (sameSet(a.selectedChains, a.defaultChains)) {
        params.delete("chains");
      } else {
        params.set("chains", a.selectedChains.join(","));
      }

      if (a.selectedRange) {
        params.set(
          "zoom",
          `${Math.round(a.selectedRange[0])}_${Math.round(a.selectedRange[1])}`,
        );
      } else {
        params.delete("zoom");
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, WRITE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    args.enabled,
    args.selectedTimespan,
    args.selectedTimeInterval,
    args.selectedScale,
    args.selectedChains,
    args.selectedRange,
    args.showUsd,
    args.collapseTable,
    pathname,
    router,
  ]);
}
