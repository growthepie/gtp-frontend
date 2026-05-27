import React from "react";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { useTimespan } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ProjectMetadata, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useTheme } from "next-themes";
import { GTPIcon } from "../GTPIcon";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import { useState, useMemo, useRef, useEffect, useCallback, useTransition } from "react";
import { MetricInfo } from "@/types/api/MasterResponse";
import GTPCardLayout from "@/components/GTPComponents/GTPLayout/GTPCardLayout";
import GTPChart from "@/components/GTPComponents/GTPChart";
import GTPButtonDropdown from "@/components/GTPComponents/ButtonComponents/GTPButtonDropdown";
import ShareDropdownContent from "@/components/layout/FloatingBar/ShareDropdownContent";
import { useLocalStorage } from "usehooks-ts";
import { useAppColors } from "@/hooks/useAppColors";
import { useMediaQuery } from "@react-hook/media-query";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import useSWR from "swr";
import { ApplicationsURLs } from "@/lib/urls";
import { normalizeString } from "@/lib/searchNormalize";
import { IS_PRODUCTION } from "@/lib/helpers";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { downloadElementAsImage } from "@/components/GTPComponents/chartSnapshotHelpers";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

type CompareAppEntry = {
    owner_project: string;
    data: ApplicationDetailsData;
    displayName: string;
};

// Handles both raw array format and { types, data } object format
const getTimeseries = (value: unknown): { types: string[]; rows: number[][] } => {
    if (Array.isArray(value)) {
        return { types: [], rows: value as number[][] };
    }
    if (value && typeof value === "object") {
        const obj = value as { data?: unknown; types?: unknown };
        const rows = Array.isArray(obj.data) ? (obj.data as number[][]) : [];
        const types = Array.isArray(obj.types) ? (obj.types as string[]) : [];
        return { types, rows };
    }
    return { types: [], rows: [] };
};

const getTimeseriesRows = (value: unknown): number[][] => getTimeseries(value).rows;

// Picks the column index for the active currency, falling back to "value" for
// non-currency metrics and finally to index 1 when types is unavailable.
const resolveValueIndex = (types: string[], showUsd: boolean): number => {
    if (types.length === 0) return 1;
    const preferred = showUsd ? "usd" : "eth";
    const fallback = showUsd ? "eth" : "usd";
    let idx = types.indexOf(preferred);
    if (idx === -1) idx = types.indexOf(fallback);
    if (idx === -1) idx = types.indexOf("value");
    return idx === -1 ? 1 : idx;
};

type SeriesEntry = { name: string; data: [number, number | null][] };

const escapeCsvCell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
};

const slugifyFilenamePart = (value: string | undefined) =>
    (value ?? "chart")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "chart";

function computeMetricSeriesData(params: {
    data: ApplicationDetailsData;
    metric: string;
    timeInterval: string;
    selectedTotal: boolean;
    deselectedChains: string[];
    hasChainData: boolean | undefined;
    isComparing: boolean;
    compareApps: CompareAppEntry[];
    showAvg: boolean;
    showUsd: boolean;
}): SeriesEntry[] {
    const { data, metric, timeInterval, selectedTotal, deselectedChains, hasChainData, isComparing, compareApps, showAvg, showUsd } = params;
    const overTime = data.metrics[metric]?.over_time;
    if (!overTime) return [];

    function buildActiveTsByChain(weightsOt: Record<string, unknown>): Map<string, Map<number, number>> {
        const result = new Map<string, Map<number, number>>();
        for (const chain of Object.keys(weightsOt)) {
            const { types, rows } = getTimeseries((weightsOt[chain] as any)?.[timeInterval]);
            const idx = resolveValueIndex(types, showUsd);
            const m = new Map<number, number>();
            for (const r of rows) {
                const w = Number(r[idx]);
                if (Number.isFinite(w) && w > 0) m.set(Number(r[0]), w);
            }
            result.set(chain, m);
        }
        return result;
    }

    function sumChainSeries(
        ot: Record<string, unknown>,
        excludeChains: string[] = [],
        weightsOt: Record<string, unknown> | null = null,
    ): [number, number | null][] {
        // Weighted-average path: a chain only contributes at a timestamp where its weight
        // is > 0. Used for success_rate so chains with no txs that day aren't counted
        // as "0% success rate" and don't drag the average down.
        if (weightsOt) {
            const activeByChain = buildActiveTsByChain(weightsOt);
            const weightedSums = new Map<number, number>();
            const weightTotals = new Map<number, number>();
            const tsSet = new Set<number>();
            for (const chain of Object.keys(ot)) {
                if (excludeChains.includes(chain)) continue;
                const { types, rows } = getTimeseries((ot[chain] as any)?.[timeInterval]);
                const valIdx = resolveValueIndex(types, showUsd);
                const weightByTs = activeByChain.get(chain);
                for (const d of rows) {
                    const ts = Number(d[0]);
                    tsSet.add(ts);
                    if (!weightByTs) continue;
                    const w = weightByTs.get(ts);
                    if (w === undefined) continue;
                    const v = Number(d[valIdx]);
                    if (!Number.isFinite(v)) continue;
                    weightedSums.set(ts, (weightedSums.get(ts) ?? 0) + v * w);
                    weightTotals.set(ts, (weightTotals.get(ts) ?? 0) + w);
                }
            }
            return Array.from(tsSet)
                .sort((a, b) => a - b)
                .map((ts): [number, number | null] => {
                    const wt = weightTotals.get(ts) ?? 0;
                    return [ts, wt > 0 ? (weightedSums.get(ts) ?? 0) / wt : null];
                });
        }

        const sums = new Map<number, number | null>();
        const counts = new Map<number, number>();
        for (const chain of Object.keys(ot)) {
            if (excludeChains.includes(chain)) continue;
            const { types, rows } = getTimeseries((ot[chain] as any)?.[timeInterval]);
            const valIdx = resolveValueIndex(types, showUsd);
            for (const d of rows) {
                const ts = Number(d[0]);
                const raw = d[valIdx];
                const val: number | null = raw == null ? null : Number(raw);
                if (!sums.has(ts)) {
                    sums.set(ts, val);
                    counts.set(ts, val !== null ? 1 : 0);
                } else {
                    const existing = sums.get(ts)!;
                    sums.set(ts, existing === null ? val : val === null ? existing : existing + val);
                    if (val !== null) counts.set(ts, (counts.get(ts) ?? 0) + 1);
                }
            }
        }
        return Array.from(sums.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([ts, sum]): [number, number | null] => {
                if (!showAvg || sum === null) return [ts, sum];
                const count = counts.get(ts) ?? 0;
                return [ts, count > 0 ? sum / count : null];
            });
    }

    if (!hasChainData) {
        const series =
            (overTime as any)?.all?.[timeInterval] ??
            (overTime as Record<string, unknown>)[timeInterval];
        const { types, rows } = getTimeseries(series);
        const valIdx = resolveValueIndex(types, showUsd);
        const mainSeries: SeriesEntry = {
            name: "Total",
            data: rows.map((d): [number, number | null] => [Number(d[0]), d[valIdx] == null ? null : Number(d[valIdx])]),
        };
        if (!isComparing) return [mainSeries];
        const compareSeries = compareApps
            .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
            .map(app => {
                const appSeries =
                    (app.data.metrics[metric].over_time as any)?.all?.[timeInterval] ??
                    (app.data.metrics[metric].over_time as Record<string, unknown>)[timeInterval];
                const { types: appTypes, rows: appRows } = getTimeseries(appSeries);
                const appValIdx = resolveValueIndex(appTypes, showUsd);
                return {
                    name: `compare_${app.owner_project}`,
                    data: appRows.map((d): [number, number | null] => [Number(d[0]), d[appValIdx] == null ? null : Number(d[appValIdx])]),
                } as SeriesEntry;
            });
        return [mainSeries, ...compareSeries];
    }

    const chains = Object.keys(overTime).filter((chain) => !deselectedChains.includes(chain));

    // success_rate is a rate, not a sum — weight per-chain contributions by txcount so
    // chains with no activity neither show as a flat 0% line nor drag the Total down.
    const mainWeightsOverTime = metric === "success_rate"
        ? (data.metrics.txcount?.over_time as Record<string, unknown> | undefined) ?? null
        : null;
    const mainActiveTsByChain = mainWeightsOverTime
        ? buildActiveTsByChain(mainWeightsOverTime)
        : null;

    const perChain: SeriesEntry[] = chains.flatMap((chain) => {
        const { types, rows } = getTimeseries((overTime[chain] as any)?.[timeInterval]);
        if (rows.length === 0) return [];
        const valIdx = resolveValueIndex(types, showUsd);
        const activeTs = mainActiveTsByChain?.get(chain) ?? null;
        return [{
            name: chain,
            data: rows.map((d: number[]): [number, number | null] => {
                const ts = Number(d[0]);
                if (activeTs && !activeTs.has(ts)) return [ts, null];
                return [ts, d[valIdx] == null ? null : Number(d[valIdx])];
            }),
        }];
    });

    if (!selectedTotal && !isComparing) return perChain;

    const mainTotalSeries: SeriesEntry = {
        name: "Total",
        data: sumChainSeries(overTime as Record<string, unknown>, deselectedChains, mainWeightsOverTime),
    };

    if (!isComparing) return [mainTotalSeries];

    const compareSeries = compareApps
        .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
        .map(app => {
            const compareOverTime = app.data.metrics[metric].over_time as Record<string, unknown>;
            const compareWeights = metric === "success_rate"
                ? (app.data.metrics.txcount?.over_time as Record<string, unknown> | undefined) ?? null
                : null;
            return {
                name: `compare_${app.owner_project}`,
                data: sumChainSeries(compareOverTime, deselectedChains, compareWeights),
            } as SeriesEntry;
        });

    return [mainTotalSeries, ...compareSeries];
}

// ─── Replay feature ──────────────────────────────────────────────────────────
// Everything between this banner and the matching "End replay feature" banner
// below is for the per-chart replay/play button. To remove the feature:
//   1. Delete this block (snappedXMin + niceStep + niceStepCeil helpers)
//   2. Delete the matching "End replay feature" block at the bottom of this file
//   3. In AppMetricChart, remove every `// replay:` tagged line and the
//      <div pointerEvents=...> wrapper around <GTPChart>
//   4. In components/GTPComponents/GTPChart.tsx, remove the `yAxisInterval`
//      prop, destructure, and the override branch inside primaryYAxisLayout
// The button itself is gated behind REPLAY_BUTTON_ENABLED — same !IS_PRODUCTION
// pattern that ChainTabs uses for the User Insights tab (lib/helpers.ts). True on
// local `next dev` and on the dev / preview Vercel deploys, false on prod.

const REPLAY_BUTTON_ENABLED = !IS_PRODUCTION;

// Mirrors GTPChart / buildTimeXAxisLayout's snap behavior so the replay can use the same
// padded lower-bound the chart actually renders (e.g. 90d view snaps Feb 24 → Feb 1).
// Keep this in sync with lib/echarts-x-axis-layout.ts (TICK_INTERVALS + snapToCleanBoundary).
function snappedXMin(xMin: number, xMax: number): number {
    const DAY = 86400 * 1000;
    const rangeDays = (xMax - xMin) / DAY;
    let intervalMs: number;
    if (rangeDays <= 1 / 24) intervalMs = 10 * 60 * 1000;
    else if (rangeDays <= 3 / 24) intervalMs = 30 * 60 * 1000;
    else if (rangeDays <= 6 / 24) intervalMs = 60 * 60 * 1000;
    else if (rangeDays <= 12 / 24) intervalMs = 2 * 60 * 60 * 1000;
    else if (rangeDays <= 1) intervalMs = 4 * 60 * 60 * 1000;
    else if (rangeDays <= 7) intervalMs = DAY;
    else if (rangeDays <= 30) intervalMs = 7 * DAY;
    else if (rangeDays <= 90) intervalMs = 30 * DAY;
    else if (rangeDays <= 365) intervalMs = 60 * DAY;
    else if (rangeDays <= 730) intervalMs = 90 * DAY;
    else if (rangeDays <= 1460) intervalMs = 180 * DAY;
    else intervalMs = 360 * DAY;

    const d = new Date(xMin);
    if (intervalMs >= 30 * DAY) {
        const monthStep = Math.max(1, Math.round(intervalMs / (30 * DAY)));
        const alignedMonth = Math.floor(d.getUTCMonth() / monthStep) * monthStep;
        return Date.UTC(d.getUTCFullYear(), alignedMonth, 1);
    }
    if (intervalMs >= DAY) {
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const msSinceMidnight = xMin - midnight;
    return midnight + Math.floor(msSinceMidnight / intervalMs) * intervalMs;
}

// Mirrors GTPChart's internal getNiceStep so the replay can pre-snap y-axis steps to the same
// 1 / 2 / 2.5 / 5 / 10 nice-number cadence the chart uses naturally.
function niceStep(raw: number): number {
    const safe = Math.max(raw, Number.EPSILON);
    const magnitude = Math.pow(10, Math.floor(Math.log10(safe)));
    const normalized = safe / magnitude;
    if (normalized <= 1.5) return 1 * magnitude;
    if (normalized <= 2.25) return 2 * magnitude;
    if (normalized <= 3.75) return 2.5 * magnitude;
    if (normalized <= 7.5) return 5 * magnitude;
    return 10 * magnitude;
}

// Smallest nice step that is >= raw. Replay locks its interval count, so the step must round
// UP to guarantee step * intervals >= padded max — otherwise tall points get clipped early on.
function niceStepCeil(raw: number): number {
    const safe = Math.max(raw, Number.EPSILON);
    const magnitude = Math.pow(10, Math.floor(Math.log10(safe)));
    const normalized = safe / magnitude;
    if (normalized <= 1) return 1 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 2.5) return 2.5 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    if (normalized <= 10) return 10 * magnitude;
    return 10 * magnitude;
}
// ─── End replay-helpers section ─────────────────────────────────────────────

// Returns the timestamp of the first data point with a real (non-null, non-zero) value.
// The API pads series from a global start date with null or 0 before the app was active —
// both must be skipped to find where the app's data actually begins.
function firstNonNullTs(data: [number, number | null][]): number | null {
    for (const [ts, val] of data) {
        if (val !== null && val !== 0) return ts;
    }
    return null;
}

const INTERVALS = {
    hourly: {
        label: "Hourly",
        value: "hourly",
    },
    daily: {
        label: "Daily",
        value: "daily",
    },
} as const;

function filterTimespans(timespan: string, interval: string) {
    if (interval === "daily") {
        return !(timespan === "1d" || timespan === "3d" || timespan === "7d" || timespan === "30d");
    } else {
        return !(timespan === "30d" || timespan === "90d" || timespan === "180d" || timespan === "365d" || timespan === "max");
    }
}

// Fetches compare app data and reports back — renders nothing visible
const CompareLoader = ({ owner_project, onDataLoaded }: {
    owner_project: string;
    onDataLoaded: (key: string, appData: ApplicationDetailsData) => void;
}) => {
    const { data } = useSWR<ApplicationDetailsData>(
        ApplicationsURLs.details.replace("{owner_project}", owner_project),
    );
    useEffect(() => {
        if (data) onDataLoaded(owner_project, data);
    }, [data, owner_project, onDataLoaded]);
    return null;
};

const COMPARE_ITEM_HEIGHT = 28; // px per app row (py-[5px] * 2 + ~18px icon/text)
const COMPARE_DIVIDER_HEIGHT = 13; // px for the separator between selected and results
const COMPARE_LIST_MAX_HEIGHT = 220;

export default function MetricsBody({ data, owner_project, projectMetadata, highlightMetric, onHighlightConsumed }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, highlightMetric?: string | null, onHighlightConsumed?: () => void }) {
    const { timespans, selectedTimespan, setSelectedTimespan } = useTimespan();

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [, startIntervalTransition] = useTransition();

    const [selectedTotal, setSelectedTotal] = useState(true);
    // timeInterval is derived from the URL so a shared link / refresh restores it.
    // Same replaceState pattern as TimespanContext: no history entry is added, so the
    // browser back button still navigates to whatever page brought the user here.
    const intervalParam = searchParams.get("interval");
    const timeInterval = intervalParam === "hourly" ? "hourly" : "daily";

    const setTimeInterval = useCallback((value: string) => {
        if (value === timeInterval) return;
        startIntervalTransition(() => {
            // Read the live URL rather than the captured `searchParams` snapshot. The
            // toggle handler calls setSelectedTimespan immediately before this, which
            // already wrote to the URL via replaceState — using the snapshot here would
            // overwrite that timespan change.
            const currentParams = new URLSearchParams(window.location.search);
            if (value === "daily") {
                currentParams.delete("interval");
            } else {
                currentParams.set("interval", value);
            }
            const queryString = currentParams.toString();
            const url = `${pathname}${queryString ? `?${decodeURIComponent(queryString)}` : ""}`;
            window.history.replaceState(null, "", url);
        });
    }, [timeInterval, pathname, startIntervalTransition]);
    const { AllChainsByKeys, data: master } = useMaster();
    const { theme } = useTheme();
    const [showUsd] = useLocalStorage("showUsd", true);
    const [deselectedChains, setDeselectedChains] = useState<string[]>([]);
    const [isCompareDropdownOpen, setIsCompareDropdownOpen] = useState(false);
    const [cachedTimespans, setCachedTimespans] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const isMobile = useMediaQuery("(max-width: 1024px)");
    const compareDropdownRef = useRef<HTMLDivElement>(null);
    const chainsSelectedRef = useRef<HTMLDivElement>(null);
    const chainsTextRef = useRef<HTMLDivElement>(null);
    const labelMeasureRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [dynamicLabelCount, setDynamicLabelCount] = useState(0);
    const [adaptiveSpacerWidth, setAdaptiveSpacerWidth] = useState(120);

    useEffect(() => {
        if (!isCompareDropdownOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (compareDropdownRef.current && !compareDropdownRef.current.contains(e.target as Node)) {
                setIsCompareDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isCompareDropdownOpen]);

    // If the URL-driven timespan is filtered out by the current time interval (e.g. landing
    // here with ?timespan=30d while timeInterval defaults to "daily"), no timespan button
    // would appear selected. Snap to the interval's default so the UI stays consistent.
    useEffect(() => {
        if (!filterTimespans(selectedTimespan, timeInterval)) {
            setSelectedTimespan(timeInterval === "hourly" ? "7d" : "90d");
        }
    }, [selectedTimespan, timeInterval, setSelectedTimespan]);
    // ─── Compare state ────────────────────────────────────────────────────────
    const [compareAppKeys, setCompareAppKeys] = useState<string[]>([]);
    const [compareAppsData, setCompareAppsData] = useState<Map<string, ApplicationDetailsData>>(new Map());
    const isComparing = compareAppKeys.length > 0;
    const { ownerProjectToProjectData } = useProjectsMetadata();

    const compareSearchResults = useMemo(() => {
        const term = normalizeString(searchQuery);
        return Object.values(ownerProjectToProjectData)
            .filter(app =>
                app.on_apps_page &&
                app.owner_project !== owner_project &&
                !compareAppKeys.includes(app.owner_project) &&
                (term === "" || normalizeString(app.display_name).includes(term)),
            );
    }, [searchQuery, ownerProjectToProjectData, owner_project, compareAppKeys]);

    const compareListHeight = useMemo(() => {
        const hasDivider = compareAppKeys.length > 0 && compareSearchResults.length > 0;
        const natural =
            (compareAppKeys.length + compareSearchResults.length) * COMPARE_ITEM_HEIGHT +
            (hasDivider ? COMPARE_DIVIDER_HEIGHT : 0);
        return Math.min(Math.max(natural + 20, COMPARE_ITEM_HEIGHT), COMPARE_LIST_MAX_HEIGHT);
    }, [compareAppKeys.length, compareSearchResults.length]);

    const handleCompareDataLoaded = useCallback((key: string, appData: ApplicationDetailsData) => {
        setCompareAppsData(prev => {
            const next = new Map(prev);
            next.set(key, appData);
            return next;
        });
    }, []);

    // Only include compare apps whose data has finished loading
    const compareAppsForChart = useMemo<CompareAppEntry[]>(() =>
        compareAppKeys
            .filter(key => compareAppsData.has(key))
            .map(key => ({
                owner_project: key,
                data: compareAppsData.get(key) as ApplicationDetailsData,
                displayName: ownerProjectToProjectData[key]?.display_name ?? key,
            })),
        [compareAppKeys, compareAppsData, ownerProjectToProjectData],
    );

    // When comparing, always treat as "Total" — By Chain is not supported in compare mode.
    // Derived rather than synced via useEffect to avoid a cascading-render lint warning.
    const effectiveSelectedTotal = isComparing ? true : selectedTotal;

    function handleRemoveCompareApp(key: string) {
        setCompareAppKeys(prev => prev.filter(k => k !== key));
        setCompareAppsData(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
    }

    function handleSelectCompareApp(appKey: string) {
        setCompareAppKeys(prev => prev.includes(appKey) ? prev : [...prev, appKey]);
        setSearchQuery("");
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Merge chains from the main app and all loaded compare apps.
    // Main app chains come first in their size order; each compare app's chains are appended
    // in their size order, skipping any chain already present.
    const mergedChainsBySize = useMemo(() => {
        const seen = new Set<string>();
        const result: string[] = [];
        for (const chain of (data.chains_by_size ?? [])) {
            if (!seen.has(chain)) {
                seen.add(chain);
                result.push(chain);
            }
        }
        for (const compareApp of compareAppsForChart) {
            for (const chain of (compareApp.data.chains_by_size ?? [])) {
                if (!seen.has(chain)) {
                    seen.add(chain);
                    result.push(chain);
                }
            }
        }
        return result;
    }, [data.chains_by_size, compareAppsForChart]);


    
    // Memoize the filtered+sorted chains so both the render and the measurement share the same list.
    const filteredSortedChains = useMemo(() =>
        mergedChainsBySize.filter((chain) => AllChainsByKeys[chain]).sort((a, b) => {
            const aDeselected = deselectedChains.includes(a) ? 1 : 0;
            const bDeselected = deselectedChains.includes(b) ? 1 : 0;
            return aDeselected - bDeselected;
        }),
        [mergedChainsBySize, AllChainsByKeys, deselectedChains],
    );

    // Button geometry (icon-only width and per-label expansion delta) varies by button size.
    // sm (mobile, icon 16px): alone=28px, delta=30+textW
    // md (desktop, icon 24px): alone=36px, delta=28+textW
    const calculateLabelCount = useCallback(() => {
        const container = chainsSelectedRef.current;
        if (!container) return;

        const n = filteredSortedChains.length;
        if (n === 0) {
            setDynamicLabelCount(0);
            return;
        }

        const containerWidth = container.clientWidth;
        const ICON_ONLY_W = isMobile ? 28 : 36;
        const BUTTON_GAP = 2;
        const LABEL_DELTA = isMobile ? 30 : 28;

        // Fixed costs: left-pad(15) + "Chains" text + gap(5) + inner-border(2) + right-pad(2)
        const fixedCost =
            15 +
            (chainsTextRef.current?.offsetWidth ?? 80) +
            5 +
            2 +
            2;

        const iconOnlyCost = n * ICON_ONLY_W + Math.max(0, n - 1) * BUTTON_GAP;
        let remaining = containerWidth - fixedCost - iconOnlyCost;

        // Adaptive spacer: wide enough for the largest possible hover label expansion.
        const maxLabelW = Math.max(
            ...labelMeasureRefs.current.slice(0, n).map((el) => el?.offsetWidth ?? 60),
        );
        setAdaptiveSpacerWidth(LABEL_DELTA + maxLabelW);

        let count = 0;
        for (let i = 0; i < n; i++) {
            const labelEl = labelMeasureRefs.current[i];
            const labelW = labelEl ? labelEl.offsetWidth : 60;
            if (remaining >= LABEL_DELTA + labelW + 2) {
                remaining -= LABEL_DELTA + labelW;
                count++;
            } else {
                break;
            }
        }

        // Reserve hover-expansion room for the first icon-only button so it doesn't
        // shift neighbours when expanded, causing a jitter loop with the ResizeObserver.
        if (count < n) {
            const hoverLabelEl = labelMeasureRefs.current[count];
            const hoverLabelW = hoverLabelEl ? hoverLabelEl.offsetWidth : 60;
            if (remaining < LABEL_DELTA + hoverLabelW) {
                count = Math.max(0, count - 1);
            }
        }

        setDynamicLabelCount(count);
    }, [filteredSortedChains, isMobile]);

    // Re-run label calculation whenever the pill resizes (window resize / parent reflow).
    useEffect(() => {
        const el = chainsSelectedRef.current;
        if (!el) return;
        const observer = new ResizeObserver(calculateLabelCount);
        observer.observe(el);
        return () => observer.disconnect();
    }, [calculateLabelCount]);

    // Checks whether a metric actually has data for the current time interval,
    // so we skip rendering empty charts instead of just checking for hourly keys.
    const hasMetricDataForInterval = useMemo(() => {
        return Object.fromEntries(
            Object.keys(data.metrics ?? {}).map((metric) => {
                const overTime = data.metrics[metric]?.over_time;
                const isChainSpecific = master?.app_metrics?.[metric]?.chain_specific;

                if (!overTime) {
                    return [metric, false];
                }

                if (!isChainSpecific) {
                    const intervalData = getTimeseriesRows(
                        overTime?.all?.[timeInterval] ?? (overTime as Record<string, unknown>)[timeInterval],
                    );
                    return [metric, Array.isArray(intervalData) && intervalData.length > 0];
                }

                const hasSeriesForInterval = Object.values(overTime).some(
                    (series) => {
                        const intervalData = (series as any)?.[timeInterval]?.data;
                        return Array.isArray(intervalData) && intervalData.length > 0;
                    },
                );

                return [metric, hasSeriesForInterval];
            }),
        ) as Record<string, boolean>;
    }, [data, master, timeInterval]);

    // Compute the global xMin across all visible metric series so every chart shares the same x-axis start.
    const globalXMin = useMemo(() => {
        const isComparing = compareAppsForChart.length > 0;
        const visibleMetrics = Object.keys(data.metrics ?? {})
            .filter((m) => master?.app_metrics?.[m])
            .filter((m) => hasMetricDataForInterval[m]);

        let earliestTs = Infinity;
        for (const m of visibleMetrics) {
            const hasChainData = !!master?.app_metrics?.[m]?.chain_specific;
            const series = computeMetricSeriesData({
                data,
                metric: m,
                timeInterval,
                selectedTotal: effectiveSelectedTotal,
                deselectedChains,
                hasChainData,
                isComparing,
                compareApps: compareAppsForChart,
                showAvg: master?.app_metrics?.[m]?.all_l2s_aggregate === "avg",
                showUsd,
            });
            // Apply the same visibleSeries filter used in AppMetricChart
            const visible = series.filter(s =>
                !hasChainData && !effectiveSelectedTotal && !isComparing ? s.name !== "Total" : true,
            );
            for (const s of visible) {
                const ts = firstNonNullTs(s.data);
                if (ts !== null) earliestTs = Math.min(earliestTs, ts);
            }
        }

        return earliestTs !== Infinity ? earliestTs : undefined;
    }, [data, master, hasMetricDataForInterval, timeInterval, effectiveSelectedTotal, deselectedChains, compareAppsForChart, showUsd]);

    const comparePill = useMemo(() => {

        if(compareAppsForChart.length !== 1) {
            return (
            <div
                className="relative z-20 w-full p-[5px] bg-color-bg-medium rounded-full flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsCompareDropdownOpen((prev) => !prev)}
            >
                <GTPIcon icon={"gtp-project"} containerClassName="!size-[34px] flex p-[5px] items-center justify-center" className="!size-[29px]" size="sm" />
                <div className="flex flex-col items-center">
                    <div className="text-xxs">Compare to</div>
                    <div className="flex items-center gap-x-[5px]">
                        
                        <div className="heading-small-xs"> {compareAppsForChart.length === 0 ? "" : compareAppsForChart.length} Other App{compareAppsForChart.length !== 1 ? "s" : ""}</div>
                    </div>
                </div>
                <GTPIcon icon="gtp-chevronright-monochrome" containerClassName="!size-[34px] flex p-[5px] opacity-0 items-center justify-center" className="!size-[16px]" size="sm" />
            </div>
            )
        }else{
            return (
                <div
                    className="relative z-20 w-full p-[5px] pl-[10px] bg-color-bg-medium rounded-full flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setIsCompareDropdownOpen((prev) => !prev)}
                >
                    {ownerProjectToProjectData[compareAppsForChart[0].owner_project]?.logo_path ? 
                    <Image src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[compareAppsForChart[0].owner_project]?.logo_path}`} alt={compareAppsForChart[0].displayName} width={24} height={24} className="rounded-full shrink-0 " />
                    : <GTPIcon icon="gtp-project" size="md" className="!size-[24px] text-color-ui-hover" containerClassName="flex items-center justify-center" />
                    }
                    <div className="flex flex-col items-center gap-x-[5px]">
                        <div className="text-xxs">Compare to</div>
                        <div className="flex items-center gap-x-[5px] text-center w-full max-w-[180px]">
                            
                            <div className="heading-small-xs text-nowrap truncate overflow-hidden "> {compareAppsForChart[0].displayName}</div>
                        </div>
                    </div>
                    <GTPIcon icon="gtp-chevronright-monochrome" containerClassName="!size-[34px] flex p-[5px] opacity-0 items-center justify-center" className="!size-[16px]" size="sm" />
                </div>
            );
        }
    }, [compareAppsForChart, ownerProjectToProjectData]);

    return (
        <div className="pt-[30px] w-full relative">
            {/* Full-screen backdrop — same pattern as Screenshots lightbox.
                Always in DOM so opacity can transition out; pointerEvents none when invisible. */}
            <div
                className="fixed inset-0"
                style={{
                    zIndex: 120,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    backdropFilter: highlightMetric ? "blur(2px)" : "none",
                    WebkitBackdropFilter: highlightMetric ? "blur(2px)" : "none",
                    opacity: highlightMetric ? 1 : 0,
                    pointerEvents: highlightMetric ? "auto" : "none",
                    transition: "opacity 0.4s ease",
                }}
                onClick={() => onHighlightConsumed?.()}
            />
            {/* Invisible data loaders for each compare app */}
            {compareAppKeys.map(key => (
                <CompareLoader key={key} owner_project={key} onDataLoaded={handleCompareDataLoaded} />
            ))}

            {/* Hidden label measurement spans — read by calculateLabelCount to get exact text widths. */}
            <div
                aria-hidden="true"
                style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", display: "flex" }}
            >
                {filteredSortedChains.map((chain, i) => (
                    <span
                        key={chain}
                        ref={(el) => { labelMeasureRefs.current[i] = el; }}
                        className="text-md font-raleway font-medium whitespace-nowrap"
                    >
                        {AllChainsByKeys[chain]?.name_short}
                    </span>
                ))}
            </div>

            <div className="w-full flex flex-row items-center gap-x-[15px] relative z-10">
                <div ref={chainsSelectedRef} className="flex flex-1 min-w-0 items-center gap-x-[5px] bg-color-bg-medium rounded-full pl-[15px] pr-[2px] py-[3px]">
                    <div ref={chainsTextRef} className="text-xs md:text-sm shrink-0">{isMobile ? "Chains" : "Chains Selected"}</div>
                    <HorizontalScrollContainer
                        includeMargin={false}
                        hideScrollbar={true}
                        hideGradientOverlays={true}
                        enableDragScroll={true}
                    >
                        <div className="flex flex-nowrap items-center gap-x-[2px]">
                            <div className="flex shrink-0 items-center gap-x-[2px] border-color-bg-default border rounded-full">
                            {filteredSortedChains.map((chain, i) => {
                                const chainColor = AllChainsByKeys[chain]?.colors?.[theme ?? "dark"]?.[0];
                                return (
                                    <GTPButton
                                        key={chain + i}
                                        label={AllChainsByKeys[chain]?.name_short}
                                        leftIcon={`gtp:${AllChainsByKeys[chain]?.urlKey}-logo-monochrome` as GTPIconName}
                                        leftIconStyle={{ color: chainColor }}
                                        visualState={deselectedChains.includes(chain) ? "default" : "active"}
                                        className="z-40"
                                        labelDisplay={i < dynamicLabelCount ? "always" : "hover"}
                                        size={"md"}
                                        clickHandler={() => {
                                            setDeselectedChains((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(chain)) {
                                                    next.delete(chain);
                                                } else {
                                                    if (filteredSortedChains.length - next.size <= 1) return prev;
                                                    next.add(chain);
                                                }
                                                return Array.from(next);
                                            });
                                        }}
                                    />
                                )
                            })}
                            </div>
                            <div className="shrink-0" style={{ width: adaptiveSpacerWidth }} aria-hidden="true" />
                        </div>
                    </HorizontalScrollContainer>
                </div>
                <div ref={compareDropdownRef} className="relative shrink-0 lg:min-w-[230px] lg:max-w-[261px]">
                    {/* Compare pill button — relative + z-20 so it sits above the dropdown */}

                    {comparePill}
                    {/* Dropdown — absolute, below the button, slides out from under it */}
                    <div
                        className="absolute left-0 right-0 overflow-hidden z-10 rounded-b-[15px]"
                        style={{
                            top: "calc(100% - 20px)",
                            maxHeight: isCompareDropdownOpen ? "450px" : "0px",
                            transition: "max-height 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0px 0px 27px 0px var(--color-ui-shadow, #151A19)",
                        }}
                    >
                        <div
                            className="bg-color-bg-default rounded-b-[15px] justify-center px-[10px] z-50 overflow-x-hidden"
                            style={{ paddingTop: "30px", paddingBottom: "10px" }}
                        >
                            <div className="flex items-center bg-color-bg-medium rounded-full pl-[10px] pr-[5px] py-[5px] justify-between w-full">
                                <div className="flex items-center gap-x-[10px]">
                                    <GTPIcon icon="gtp-search" className="!size-[12px]" containerClassName="!size-[12px]" />
                                    <input
                                        type="text"
                                        className="text-xxs bg-transparent outline-none"
                                        placeholder="Search apps"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {searchQuery.length > 0 && (
                                <GTPIcon
                                    icon="in-button-close-monochrome"
                                    className={`!size-[12px] cursor-pointer text-color-accent-red hover:text-chains-custom-warm-1`}
                                    containerClassName="!size-[15px] flex items-center justify-center"
                                    onClick={() => setSearchQuery("")}
                                    
                                />
                                )}
                            </div>
                            {(compareAppKeys.length > 0 || compareSearchResults.length > 0) && (
                                <div className="mt-[8px] z-[50] w-full">
                                    <VerticalScrollContainer
                                        height={compareListHeight}
                                        scrollbarPosition="right"
                                        scrollbarWidth="4px"
                                        paddingRight={15}
                                        reserveScrollbarSpace
                                    >
                                        <div className="flex flex-col w-full min-w-0 mr-[5px]">
                                            {compareAppKeys.map(key => {
                                                const meta = ownerProjectToProjectData[key];
                                                return (
                                                    <div
                                                        key={key}
                                                        className="flex items-center gap-x-[8px] px-[8px] py-[5px] rounded-full cursor-pointer hover:bg-color-bg-medium transition-colors w-full min-w-0"
                                                        onClick={() => handleRemoveCompareApp(key)}
                                                    >
                                                        <GTPIcon icon="gtp-checkmark-checked-monochrome" className="!size-[16px] shrink-0" containerClassName="!size-[16px] shrink-0 flex items-center justify-center" />
                                                        {meta?.logo_path && (
                                                            <Image
                                                                src={`https://api.growthepie.com/v1/apps/logos/${meta.logo_path}`}
                                                                alt={meta.display_name}
                                                                width={18}
                                                                height={18}
                                                                className="rounded-full shrink-0"
                                                            />
                                                        )}
                                                        <span className="truncate flex-1 min-w-0">{meta?.display_name ?? key}</span>
                                                    </div>
                                                );
                                            })}
                                            {compareAppKeys.length > 2 && (
                                                <div
                                                    className="flex items-center gap-x-[8px] px-[8px] py-[5px] rounded-full cursor-pointer hover:bg-color-bg-medium transition-colors w-full min-w-0"
                                                    onClick={() => setCompareAppKeys([])}
                                                >
                                                    <GTPIcon icon="gtp-checkmark-unchecked-monochrome" className="!size-[16px] shrink-0 " containerClassName="!size-[16px] shrink-0 flex items-center justify-center" />
                                                    <span className="truncate flex-1 min-w-0">Deselect All</span>
                                                </div>
                                            )}
                                            {compareAppKeys.length > 0 && compareSearchResults.length > 0 && (
                                                <div className="my-[6px] border-t border-color-bg-medium" />
                                            )}
                                            {compareSearchResults.map(app => (
                                                <div
                                                    key={app.owner_project}
                                                    className="flex items-center gap-x-[8px] px-[8px] py-[5px] rounded-full cursor-pointer hover:bg-color-bg-medium transition-colors w-full min-w-0"
                                                    onClick={() => handleSelectCompareApp(app.owner_project)}
                                                >
                                                    <GTPIcon icon="gtp-checkmark-unchecked-monochrome" className="!size-[16px] shrink-0" containerClassName="!size-[16px] shrink-0 flex items-center justify-center" />
                                                    {app.logo_path && (
                                                        <Image
                                                            src={`https://api.growthepie.com/v1/apps/logos/${app.logo_path}`}
                                                            alt={app.display_name}
                                                            width={18}
                                                            height={18}
                                                            className="rounded-full shrink-0"
                                                        />
                                                    )}
                                                    <span className="truncate flex-1 min-w-0">{app.display_name ? isMobile ? app.display_name : (app.display_name.slice(0, 16) + (app.display_name.length > 16 ? "..." : "")) : app.owner_project}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </VerticalScrollContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="pt-[10px] w-full">
                <GTPButtonContainer className="w-full flex">
                        <GTPButtonRow wrap={isMobile ? true : false}

                            className="flex-nowrap"
                            style={{width: isMobile ? "100%" : "auto"}}
                        >
                            {Object.keys(INTERVALS).map((interval) => (
                                <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} key={interval} label={INTERVALS[interval as keyof typeof INTERVALS].label} size={isMobile ? "xs" : "sm"} variant="primary" isSelected={timeInterval === interval}
                                clickHandler={() => {
                                    if(cachedTimespans !== null) {
                                        setSelectedTimespan(cachedTimespans);
                                    }else{
                                        interval === "hourly" ? setSelectedTimespan("7d") : setSelectedTimespan("90d");
                                    }
                                    setCachedTimespans(selectedTimespan);
                                    setTimeInterval(interval);

                                }} />
                            ))}
                        </GTPButtonRow>
                    <div className="flex gap-x-[5px] "
                        style={{width: isMobile ? "100%" : "auto"}}
                    >
                        <GTPButtonRow wrap={isMobile ? true : false}
                            className="flex-nowrap"
                            style={{width: isMobile ? "100%" : "auto"}}
                        >
                            {Object.keys(timespans).filter((timespan) => filterTimespans(timespan, timeInterval)).map((timespan) => (
                                <GTPButton 
                                    className="w-full justify-center" 
                                    innerStyle={{ width: "100%" }} 
                                    key={timespan} 
                                    label={isMobile ? timespans[timespan].shortLabel : timespans[timespan].label} 
                                    size={isMobile ? "xs" : "sm"} 
                                    variant="primary" 
                                    isSelected={selectedTimespan === timespan} 
                                    clickHandler={() => setSelectedTimespan(timespan)} 
                                />
                            ))}
                        </GTPButtonRow>
                        <GTPButtonRow wrap={isMobile ? true : false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} label="Total" size={isMobile ? "xs" : "sm"} variant="primary" isSelected={effectiveSelectedTotal} clickHandler={() => setSelectedTotal(true)} />
                            <GTPButton
                                className="w-full justify-center"
                                innerStyle={{ width: "100%" }}
                                label="By Chain"
                                size={isMobile ? "xs" : "sm"}
                                variant="primary"
                                isSelected={!effectiveSelectedTotal}
                                disabled={isComparing}
                                visualState={isComparing ? "disabled" : undefined}
                                clickHandler={() => { if (!isComparing) setSelectedTotal(false); }}
                            />
                        </GTPButtonRow>
                    </div>
                </GTPButtonContainer>

            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-[30px]">
                {Object.keys(data.metrics ?? {})
                    .filter((metric) => master?.app_metrics?.[metric])
                    .filter((metric) => hasMetricDataForInterval[metric])
                    .map((metric, index) => (
                    <AppMetricChart key={metric} data={data} owner_project={owner_project} projectMetadata={projectMetadata} metric={metric} metric_data={master?.app_metrics?.[metric] as MetricInfo} timeInterval={timeInterval} selectedTotal={effectiveSelectedTotal} deselectedChains={deselectedChains} setDeselectedChains={setDeselectedChains} compareApps={compareAppsForChart} syncId="app-metrics" index={index} xMin={timespans[selectedTimespan]?.value === 0 ? globalXMin : undefined} highlightMetric={highlightMetric} onHighlightConsumed={onHighlightConsumed}/>
                ))}
            </div>
        </div>
    )
}


const AppMetricChart = ({ data, owner_project, projectMetadata, metric, metric_data, timeInterval, selectedTotal, deselectedChains, setDeselectedChains, compareApps, syncId, index, xMin: xMinProp, highlightMetric, onHighlightConsumed }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, metric: string, metric_data?: MetricInfo, timeInterval: string, selectedTotal: boolean, deselectedChains: string[], setDeselectedChains: React.Dispatch<React.SetStateAction<string[]>>, compareApps: CompareAppEntry[], syncId?: string, index: number, xMin?: number, highlightMetric?: string | null, onHighlightConsumed?: () => void }) => {
    const { theme } = useTheme();
    const { getAppColors } = useAppColors();
    const appColor = getAppColors(owner_project, theme);
    const mediumBreakpoint = useMediaQuery("(max-width: 1024px)");
    const isMobile = useMediaQuery("(max-width: 728px)");
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const inactiveSeriesNames = useMemo(() => new Set(deselectedChains), [deselectedChains]);
    const [hoverSeriesName, setHoverSeriesName] = useState<string | null>(null);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    // Replay walks an "end timestamp" cutoff across the visible window. Series points past
    // the cutoff are sliced out; xAxisMin/xAxisMax stay fixed so only y-axis re-scales.
    const [replayEndTs, setReplayEndTs] = useState<number | null>(null);
    const replayFrameRef = useRef<number | null>(null);
    // Locked tick count for the current replay (captured at start, kept for the whole run).
    const replayTickIntervalsRef = useRef<number>(2);
    // Monotonic nice-step for the y-axis during replay — never shrinks so labels grow cleanly.
    const replayStepRef = useRef<number>(0);
    // Snapped lower bound captured at start of replay so the chart-render filter knows where
    // data drawing begins (matches the chart's snapToCleanBoundary padding).
    const replayLowerBoundRef = useRef<number>(0);
    // Pre-trimmed series captured at replay start. The raw API series can carry 1000+ historical
    // points; trimming to [visualXMin, xMax] means ECharts only redraws ~90 points per frame
    // (for a 90d view) instead of ~1000, which removes the perceived lag during playback.
    const replayTrimmedSeriesRef = useRef<typeof visibleSeries>([]);
    // DEBUG: instrumentation refs for measuring lag
    const replayLastFrameTsRef = useRef<number>(0);
    const replayLastSetTsRef = useRef<number>(0);
    const replayFrameCountRef = useRef<number>(0);
    const replayJankCountRef = useRef<number>(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isDownloadingChartSnapshot) return;
        const el = cardRef.current;
        if (!el) {
            setIsDownloadingChartSnapshot(false);
            return;
        }
        downloadElementAsImage(el, metricData?.name ?? metric).finally(() => {
            setIsDownloadingChartSnapshot(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDownloadingChartSnapshot]);
    // 'off' → 'on' (ring appears) → 'fading' (ring transitions out) → 'off'
    const [highlightPhase, setHighlightPhase] = useState<'off' | 'on' | 'fading'>('off');

    useEffect(() => {
        if (!highlightMetric || metric !== highlightMetric) return;

        // Raise #content-panel above FloatingPortal badges (z-100) — same pattern as Screenshots.tsx
        const panel = document.getElementById("content-panel");
        if (panel) panel.style.zIndex = "150";

        // Give the tab content 200ms to finish layout before scrolling
        const scrollTimer = setTimeout(() => {
            const el = wrapperRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const targetY = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
            const startY = window.scrollY;
            const diff = targetY - startY;
            const duration = 800;
            let start: number | null = null;
            function step(ts: number) {
                if (start === null) start = ts;
                const elapsed = ts - start;
                const t = Math.min(elapsed / duration, 1);
                // ease-in-out cubic
                const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                window.scrollTo(0, startY + diff * eased);
                if (elapsed < duration) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }, 200);

        // Ring appears immediately, holds for 2s, then transitions out over 800ms
        setHighlightPhase('on');
        const fadeTimer = setTimeout(() => setHighlightPhase('fading'), 2000);
        const clearTimer = setTimeout(() => {
            setHighlightPhase('off');
            onHighlightConsumed?.();
            if (panel) panel.style.zIndex = "";
        }, 2800);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(fadeTimer);
            clearTimeout(clearTimer);
            if (panel) panel.style.zIndex = "";
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlightMetric]);
    const { AllChainsByKeys, data: master } = useMaster();
    const [showUsd] = useLocalStorage("showUsd", true);
    // metric_data may be passed directly or resolved from master for resilience
    const resolvedMetricData = metric_data ?? master?.app_metrics?.[metric];
    const hasChainData = resolvedMetricData?.chain_specific;
    const isComparing = compareApps.length > 0;

    const seriesData = useMemo(() => computeMetricSeriesData({
        data,
        metric,
        timeInterval,
        selectedTotal,
        deselectedChains,
        hasChainData: !!hasChainData,
        isComparing,
        compareApps,
        showAvg: resolvedMetricData?.all_l2s_aggregate === "avg",
        showUsd,
    }), [data, metric, selectedTotal, deselectedChains, timeInterval, resolvedMetricData, hasChainData, compareApps, isComparing, showUsd]);

    const metricData = resolvedMetricData;
    const [selectedScale, setSelectedScale] = useState(metricData?.toggles?.[0] ?? "stacked");
    const metricUnits = metricData?.units ?? {};
    const isValueMetric = Object.keys(metricUnits).includes("value");
    const hasCurrencyUnits = "usd" in metricUnits || "eth" in metricUnits;
    const isSuccessRateMetric = metric === "success_rate";

    // Resolves display name and gradient colors for both chain series and compare-app series
    function resolveSeriesInfo(seriesName: string) {
        const isCompareApp = seriesName.startsWith("compare_");
        const compareOwnerProject = isCompareApp ? seriesName.replace("compare_", "") : null;
        const compareApp = compareOwnerProject
            ? compareApps.find(a => a.owner_project === compareOwnerProject)
            : null;
        const compareAppColor = compareApp ? getAppColors(compareApp.owner_project, theme) : null;

        const displayName = isCompareApp
            ? (compareApp?.displayName ?? compareOwnerProject ?? seriesName)
            : (AllChainsByKeys[seriesName]?.name_short ?? projectMetadata.display_name);

        const color: [string | undefined, string | undefined] = isCompareApp
            ? [compareAppColor?.[0], compareAppColor?.[1]]
            : seriesName === "Total"
                ? [appColor[0], appColor[1]]
                : [AllChainsByKeys[seriesName]?.colors?.[theme ?? "dark"]?.[0], AllChainsByKeys[seriesName]?.colors?.[theme ?? "dark"]?.[1]];

        return { isCompareApp, compareOwnerProject, displayName, color };
    }

    // When !hasChainData && !selectedTotal && !isComparing the "Total" series is intentionally
    // hidden so the "cannot be broken down by chain" message shows instead.
    const visibleSeries = seriesData.filter(s =>
        !hasChainData && !selectedTotal && !isComparing ? s.name !== "Total" : true
    );

    const { timespans, selectedTimespan } = useTimespan();

    const xMax = useMemo(() => {
        let latestTs = 0;
        for (const series of visibleSeries) {
            if (series.data.length > 0) {
                const lastTs = series.data[series.data.length - 1][0];
                if (lastTs > latestTs) latestTs = lastTs;
            }
        }
        return latestTs > 0 ? latestTs : new Date().getTime();
    }, [visibleSeries]);

    const xMin = useMemo(() => {
        if (xMinProp !== undefined) return xMinProp;
        const days = timespans[selectedTimespan]?.value ?? 0;
        return days > 0 ? xMax - days * 24 * 60 * 60 * 1000 : undefined;
    }, [xMinProp, timespans, selectedTimespan, xMax]);

    const isReplaying = replayEndTs !== null;

    const stopReplay = useCallback(() => {
        if (replayFrameRef.current !== null) {
            cancelAnimationFrame(replayFrameRef.current);
            replayFrameRef.current = null;
        }
        setReplayEndTs(null);
    }, []);

    const startReplay = useCallback(() => {
        if (typeof xMin !== "number" || typeof xMax !== "number" || xMax <= xMin) return;
        if (replayFrameRef.current !== null) cancelAnimationFrame(replayFrameRef.current);
        // Use the same snapped lower bound the chart actually renders, so the tick count
        // and pace are derived from every point that will be visible during replay (not just
        // points after raw xMin).
        const visualXMinForStats = xMinProp === undefined ? snappedXMin(xMin, xMax) : xMin;
        // Pace the replay by data density — wider timespans hold more points and should
        // take proportionally longer. Use the densest visible series so chains with sparse
        // data don't shrink the duration unfairly. Hourly points cover less real time per
        // dot than daily, so they tick by faster per-point with a lower floor.
        let pointCount = 0;
        // Also collect the eventual full-data max so we can lock the tick count up front.
        let fullDataMax = 0;
        const stacked = selectedScale === "stacked";
        const stackSumByTs = stacked ? new Map<number, number>() : null;
        for (const s of visibleSeries) {
            let n = 0;
            for (const [ts, val] of s.data) {
                if (ts < visualXMinForStats || ts > xMax) continue;
                n++;
                if (typeof val !== "number" || !Number.isFinite(val)) continue;
                if (stacked && stackSumByTs) {
                    if (val > 0) stackSumByTs.set(ts, (stackSumByTs.get(ts) ?? 0) + val);
                } else if (val > fullDataMax) {
                    fullDataMax = val;
                }
            }
            if (n > pointCount) pointCount = n;
        }
        if (stacked && stackSumByTs) {
            for (const v of stackSumByTs.values()) if (v > fullDataMax) fullDataMax = v;
        }
        const isHourly = timeInterval === "hourly";
        const msPerPoint = isHourly ? 50 : 100;
        const minMs = isHourly ? 3000 : 5000;
        const duration = Math.max(minMs, Math.min(30000, pointCount * msPerPoint));

        // Lock the tick interval count for the entire replay. Replicates the chart's clean-step
        // path (niceStep → ceil(padded / step)) so the count matches what the chart would
        // naturally settle on for the final data.
        const baseSplit = 2; // matches ySplitNumber={2} below
        if (fullDataMax > 0) {
            const padded = fullDataMax * 1.03;
            const finalStep = niceStep(padded / baseSplit);
            replayTickIntervalsRef.current = Math.max(1, Math.ceil(padded / finalStep));
        } else {
            replayTickIntervalsRef.current = baseSplit;
        }
        replayStepRef.current = 0;

        // Seed the starting cutoff at one interval past the chart's actual visual left edge.
        // The chart snaps xMin back to a clean tick boundary (e.g. 90d view snaps Feb 24 → Feb 1),
        // so animating from raw xMin makes the replay skip the visible padded region the user
        // sees pre-replay. Use the snapped boundary so the animation matches the chart's frame.
        const intervalMs = timeInterval === "hourly" ? 3600 * 1000 : 86400 * 1000;
        const initialEndTs = Math.min(visualXMinForStats + intervalMs, xMax);
        replayLowerBoundRef.current = visualXMinForStats;
        // Pre-trim each series to the visible window so ECharts redraws only the points it
        // would actually paint. The raw `s.data` can hold years of history before xMin; nulling
        // them per-frame still leaves ECharts iterating the full array, which is what makes
        // the playback feel laggy on dense charts.
        const trimT0 = performance.now();
        replayTrimmedSeriesRef.current = visibleSeries.map((s) => ({
            ...s,
            data: s.data.filter(([ts]) => ts >= visualXMinForStats && ts <= xMax),
        }));
        const trimT1 = performance.now();
        const totalPointsBefore = visibleSeries.reduce((sum, s) => sum + s.data.length, 0);
        const totalPointsAfter = replayTrimmedSeriesRef.current.reduce((sum, s) => sum + s.data.length, 0);
        replayLastFrameTsRef.current = 0;
        replayLastSetTsRef.current = 0;
        replayFrameCountRef.current = 0;
        replayJankCountRef.current = 0;
        // eslint-disable-next-line no-console
        console.log(
            `[replay/perf] ${metric} trim=${(trimT1 - trimT0).toFixed(1)}ms points=${totalPointsBefore}→${totalPointsAfter} seriesCount=${visibleSeries.length} duration=${duration}ms intervals=${replayTickIntervalsRef.current}`,
        );

        setReplayEndTs(initialEndTs);

        // Single rAF — start the animation immediately so the 2-point initial state isn't
        // held for an extra frame before the loop kicks in. The trimmed-series optimization
        // (replayTrimmedSeriesRef) keeps the per-frame redraw cheap enough that the initial
        // state still paints without needing the double-rAF defensive wait.
        const startWall = performance.now();
        const step = (now: number) => {
            if (replayFrameRef.current === null) return; // canceled
            // DEBUG: track frame gap and jank
            const lastFrame = replayLastFrameTsRef.current;
            if (lastFrame > 0) {
                const gap = now - lastFrame;
                // anything >25ms means we dropped from 60fps → flag as jank
                if (gap > 25) replayJankCountRef.current++;
            }
            replayLastFrameTsRef.current = now;
            replayFrameCountRef.current++;

            // rAF's `now` can sit a few ms before startWall, producing a negative t. Clamp
            // so replayEndTs never moves backwards (which would drop visible points).
            const t = Math.max(0, Math.min((now - startWall) / duration, 1));
            // ease-in-out cubic — relaxed pace at the edges, steady through the middle
            const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            replayLastSetTsRef.current = performance.now();
            setReplayEndTs(initialEndTs + (xMax - initialEndTs) * eased);
            if (t < 1) {
                replayFrameRef.current = requestAnimationFrame(step);
            } else {
                replayFrameRef.current = null;
                // DEBUG: summary at end of replay
                // eslint-disable-next-line no-console
                console.log(
                    `[replay/perf] ${metric} DONE frames=${replayFrameCountRef.current} janky=${replayJankCountRef.current} (${((replayJankCountRef.current / Math.max(replayFrameCountRef.current, 1)) * 100).toFixed(0)}%) targetFps=${Math.round(replayFrameCountRef.current / (duration / 1000))}`,
                );
                // brief hold on the full chart, then release the cutoff
                setTimeout(() => setReplayEndTs(null), 500);
            }
        };
        replayFrameRef.current = requestAnimationFrame(step);
    }, [xMin, xMax, xMinProp, visibleSeries, timeInterval, selectedScale]);

    // Cancel any in-flight replay when the viewing window or data shape changes
    useEffect(() => {
        if (replayFrameRef.current !== null) {
            cancelAnimationFrame(replayFrameRef.current);
            replayFrameRef.current = null;
        }
        setReplayEndTs(null);
    }, [xMin, xMax, timeInterval, selectedTotal, deselectedChains, compareApps.length]);

    useEffect(() => () => {
        if (replayFrameRef.current !== null) cancelAnimationFrame(replayFrameRef.current);
    }, []);

    // DEBUG: measure how long React takes to commit a replayEndTs update
    useEffect(() => {
        if (replayEndTs === null || replayLastSetTsRef.current === 0) return;
        const commitMs = performance.now() - replayLastSetTsRef.current;
        if (commitMs > 16) {
            // eslint-disable-next-line no-console
            console.warn(`[replay/perf] ${metric} slow commit ${commitMs.toFixed(1)}ms`);
        }
    }, [replayEndTs, metric]);

    // While replaying, force the y-axis to (intervals × step) where `intervals` was captured
    // at replay start (so the tick count stays constant) and `step` only grows (so labels never
    // shrink). Lookahead lets the axis grow ahead of incoming spikes — set to 0 to scale exactly
    // when each point appears (useful for A/B comparison).
    // Skip for percentage mode (axis is locked 0–100) and success_rate (decimal-percentage view).
    const REPLAY_Y_LOOKAHEAD_FRACTION = 0; // was 0.15
    const replayYAxis = useMemo<{ max: number; interval: number } | null>(() => {
        if (replayEndTs === null) return null;
        if (typeof xMin !== "number" || typeof xMax !== "number") return null;
        if (selectedScale === "percentage" || isSuccessRateMetric) return null;
        const lookahead = (xMax - xMin) * REPLAY_Y_LOOKAHEAD_FRACTION;
        const horizon = replayEndTs + lookahead;
        // Use the same lower bound the chart-render filter uses (the snapped visual left edge).
        // Otherwise tall points in the snap-padded region [visualXMin, xMin) are rendered but
        // not counted toward yAxisMax, and they get clipped above the top of the chart.
        const lowerBound = replayLowerBoundRef.current;
        const intervals = Math.max(1, replayTickIntervalsRef.current);
        const stacked = selectedScale === "stacked";
        let lookaheadMax = 0;
        if (stacked) {
            const posSumByTs = new Map<number, number>();
            for (const s of visibleSeries) {
                for (const [ts, val] of s.data) {
                    if (ts < lowerBound) continue;
                    if (ts > horizon) break;
                    if (typeof val === "number" && Number.isFinite(val) && val > 0) {
                        posSumByTs.set(ts, (posSumByTs.get(ts) ?? 0) + val);
                    }
                }
            }
            for (const v of posSumByTs.values()) if (v > lookaheadMax) lookaheadMax = v;
        } else {
            for (const s of visibleSeries) {
                for (const [ts, val] of s.data) {
                    if (ts < lowerBound) continue;
                    if (ts > horizon) break;
                    if (typeof val === "number" && Number.isFinite(val) && val > lookaheadMax) lookaheadMax = val;
                }
            }
        }
        if (lookaheadMax <= 0) return null;
        // Match the chart's natural Y_AXIS_PADDING_MULTIPLIER (1.03) so the locked tick count
        // we captured at start agrees with the step we pick here.
        const padded = lookaheadMax * 1.03;
        // Ceiling variant — guarantees step >= padded / intervals so step * intervals >= padded
        // and no points get clipped above the y-axis.
        const candidateStep = niceStepCeil(padded / intervals);
        // Step is monotonic — never shrinks mid-replay, so tick labels only grow.
        if (candidateStep > replayStepRef.current) replayStepRef.current = candidateStep;
        const step = replayStepRef.current;
        return { max: step * intervals, interval: step };
    }, [replayEndTs, visibleSeries, xMin, xMax, selectedScale, isSuccessRateMetric]);

    if (!metricData) return null;

    const handleDownloadSelectedChartData = () => {
        if (typeof window === "undefined" || visibleSeries.length === 0) return;

        const filteredSeries = visibleSeries
            .map((series) => {
                const { displayName } = resolveSeriesInfo(series.name);
                const valuesByTimestamp = new Map<number, number | null>();

                series.data.forEach(([timestamp, value]) => {
                    if (typeof xMin === "number" && timestamp < xMin) return;
                    if (typeof xMax === "number" && timestamp > xMax) return;
                    valuesByTimestamp.set(timestamp, value);
                });

                return {
                    name: displayName,
                    valuesByTimestamp,
                };
            })
            .filter((series) => series.valuesByTimestamp.size > 0);

        if (filteredSeries.length === 0) return;

        const timestamps = Array.from(
            new Set(filteredSeries.flatMap((series) => Array.from(series.valuesByTimestamp.keys()))),
        ).sort((a, b) => a - b);

        if (timestamps.length === 0) return;

        const unitLabel = selectedScale === "percentage" || isSuccessRateMetric
            ? "percent"
            : isValueMetric
              ? "value"
              : showUsd
                ? "usd"
                : "eth";

        const headers = [
            "timestamp",
            "datetime_utc",
            "owner_project",
            "app_name",
            "metric_id",
            "metric_name",
            "time_interval",
            "scale",
            ...(hasCurrencyUnits ? ["unit"] : []),
            ...filteredSeries.map((series) => series.name),
        ];

        const rows = timestamps.map((timestamp) => {
            const values = filteredSeries.map((series) => series.valuesByTimestamp.get(timestamp) ?? null);
            const displayedValues = selectedScale === "percentage"
                ? values.map((value) => {
                    if (typeof value !== "number" || !Number.isFinite(value)) return null;
                    const total = values.reduce<number>(
                        (sum, item) => typeof item === "number" && Number.isFinite(item) ? sum + item : sum,
                        0,
                    );
                    return total > 0 ? (value / total) * 100 : null;
                })
                : isSuccessRateMetric
                  ? values.map((value) => typeof value === "number" && Number.isFinite(value) ? value * 100 : null)
                  : values;

            return [
                timestamp,
                new Date(timestamp).toISOString(),
                owner_project,
                projectMetadata.display_name,
                metric,
                metricData.name,
                timeInterval,
                selectedScale,
                ...(hasCurrencyUnits ? [unitLabel] : []),
                ...displayedValues,
            ];
        });

        const csv = [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((row) => row.map(escapeCsvCell).join(",")),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `growthepie-${slugifyFilenamePart(owner_project)}-${slugifyFilenamePart(metric)}-${timeInterval}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div
            ref={wrapperRef}
            id={`metric-chart-${metric}`}
            className="pt-[30px] w-full"
            style={{
                position: "relative",
                zIndex: highlightPhase !== 'off' ? 130 : "auto",
            }}
        >
            <div className="flex items-center gap-x-[8px]">
                <GTPIcon icon={`gtp-${metricData.icon}` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[16px]" size="sm" />
                <div className="heading-large-xxs xs:heading-large-xs">{metricData.name}</div>
                <GTPTooltipNew
                    placement="right"
                    hoverOpenDelay={100}
                    trigger={
                        <GTPIcon icon="gtp-info-monochrome" containerClassName="!size-[12px] relative top-[1px] text-color-text-secondary" className="!size-[12px]"  />
                    }

                >
                    <div className="text-xs pl-[15px]">{metricData.description} <br/> Source: {metricData.source.join(", ")}</div>
                </GTPTooltipNew>
            </div>
            {/* <div className="pt-[15px] text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div> */}
            <div className="pt-[15px]">
                <div
                    ref={cardRef}
                    style={{
                        borderRadius: '18px',
                        boxShadow: highlightPhase !== 'off' ? `0 0 24px 10px rgb(var(--bg-default))` : 'none',
                        transition: highlightPhase === 'fading' ? 'box-shadow 0.8s ease-out' : 'none',
                    }}
                >
                <GTPCardLayout
                 className=""
                 mobileBreakpoint={0}
                 header={
                     <div className="flex items-center justify-between pt-[10px] pb-[2px] px-[4px]">
                        <div className="flex items-center gap-x-[8px]">
                            <GTPIcon icon={`gtp-${metricData.icon}-monochrome` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[12px]" size="sm" />
                            <div className="text-xxxs">{metricData.name} for {projectMetadata.display_name}</div>
                        </div>
                        <div className="flex items-center gap-x-[8px]">
                            <GTPIcon icon={`gtp-realtime` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[16px]" size="sm" />
                            <div className="text-xxxs">Last updated 12 hours ago</div>
                        </div>
                     </div>
                 }
                 bottomBar={
                    <GTPButtonContainer
                        className="w-full flex flex-nowrap"
                    >
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            <GTPButtonDropdown
                                openDirection="top"
                                matchTriggerWidthToDropdown
                                buttonProps={{
                                    label: "Share",
                                    labelDisplay: "hover",
                                    leftIcon: "gtp-share-monochrome",
                                    size: isMobile ? "xs" : "sm",
                                    variant: "no-background",
                                }}
                                isOpen={isSharePopoverOpen}
                                onOpenChange={setIsSharePopoverOpen}
                                dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
                            />

                            <GTPButton
                                leftIcon="gtp-png-monochrome"
                                label="Take Screenshot"
                                labelDisplay="hover"
                                size={isMobile ? "xs" : "sm"}
                                variant="no-background"
                                visualState={isDownloadingChartSnapshot ? "disabled" : "default"}
                                disabled={isDownloadingChartSnapshot}
                                clickHandler={() => setIsDownloadingChartSnapshot(true)}
                            />
                            <GTPButton
                                leftIcon="gtp-download-monochrome"
                                label="Download Data"
                                labelDisplay="hover"
                                size={isMobile ? "xs" : "sm"}
                                variant="no-background"
                                visualState={visibleSeries.length === 0 ? "disabled" : "default"}
                                disabled={visibleSeries.length === 0}
                                clickHandler={handleDownloadSelectedChartData}
                            />
                            {/* replay: dev-only Play/Stop button. Hidden in production via REPLAY_BUTTON_ENABLED. */}
                            {REPLAY_BUTTON_ENABLED && (
                            <GTPButton
                                leftIconOverride={
                                    isReplaying ? (
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                backgroundColor: "currentColor",
                                                borderRadius: 1,
                                            }}
                                        />
                                    ) : (
                                        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                                            <polygon points="1,0.5 9,5 1,9.5" fill="currentColor" />
                                        </svg>
                                    )
                                }
                                label={isReplaying ? "Stop" : "Play"}
                                labelDisplay="hover"
                                size={isMobile ? "xs" : "sm"}
                                variant="no-background"
                                isSelected={isReplaying}
                                visualState={
                                    visibleSeries.length === 0 || typeof xMin !== "number" || typeof xMax !== "number"
                                        ? "disabled"
                                        : "default"
                                }
                                disabled={
                                    visibleSeries.length === 0 || typeof xMin !== "number" || typeof xMax !== "number"
                                }
                                clickHandler={() => (isReplaying ? stopReplay() : startReplay())}
                            />
                            )}
                        </GTPButtonRow>
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            {metricData?.toggles?.map((toggle: string) => (
                                <GTPButton key={toggle} label={toggle.charAt(0).toUpperCase() + toggle.slice(1)} size={isMobile ? "xs" : "sm"} variant="primary" isSelected={selectedScale === toggle} clickHandler={() => setSelectedScale(toggle)} />
                            ))}
                        </GTPButtonRow>

                    </GTPButtonContainer>
                 }

                >
                    {/* Block pointer events on the chart while replaying. setOption with notMerge
                        rebuilds ECharts' internal series indices every frame; a mousemove/out
                        dispatched against the previous render's seriesData crashes inside
                        getDataParams ("Cannot read properties of undefined (reading 'getRawIndex')").
                        Suppressing DOM hover for the few seconds of playback dodges the race entirely. */}
                    <div style={{ pointerEvents: isReplaying ? "none" : undefined }}>
                    <GTPChart
                        height={280}
                        stack={selectedScale === "stacked"}
                        percentageMode={selectedScale === "percentage"}
                        preserveStackOrder={selectedScale === "percentage"}
                        series={(() => {
                            // replay: use the pre-trimmed series (only points in the visible window)
                            // to keep ECharts' per-frame redraw cheap. Outside replay, use the full
                            // series so the chart renders exactly as before.
                            const sourceSeries = replayEndTs !== null
                                ? replayTrimmedSeriesRef.current
                                : visibleSeries;
                            // replay: pre-sort percentage-mode series by full-data last value so
                            // GTPChart's internal re-sort (which uses truncated data during replay)
                            // doesn't swap stack positions mid-animation. Paired with preserveStackOrder.
                            return (selectedScale === "percentage" && sourceSeries.length > 1
                                ? [...sourceSeries].sort((a, b) => {
                                    const aLast = [...a.data].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
                                    const bLast = [...b.data].reverse().find((p) => typeof p[1] === "number")?.[1] ?? 0;
                                    return (aLast as number) - (bLast as number);
                                })
                                : sourceSeries
                            );
                        })().map((s: { name: string; data: [number, number | null][] }) => {
                            const { displayName, color } = resolveSeriesInfo(s.name);
                            // replay: slice s.data up to the first point past replayEndTs so ECharts
                            // renders a growing array instead of a same-size array with most values nulled.
                            // Allocating 1040 [ts, null] tuples per frame was the dominant per-frame cost;
                            // a binary-search slice does one allocation and ECharts has fewer points to paint.
                            const data = replayEndTs !== null
                                ? (() => {
                                    let lo = 0, hi = s.data.length;
                                    while (lo < hi) {
                                        const mid = (lo + hi) >>> 1;
                                        if (s.data[mid][0] <= replayEndTs) lo = mid + 1;
                                        else hi = mid;
                                    }
                                    return s.data.slice(0, lo);
                                })()
                                : s.data;
                            return {
                                ...s,
                                data,
                                seriesType: selectedScale === "percentage" || selectedScale === "stacked" ? "area" as const : "line" as const,
                                name: displayName,
                                color: color as [string, string],
                            };
                        })}
                        xAxisMin={xMin}
                        xAxisMax={xMax}
                        yAxisMax={replayYAxis?.max}
                        yAxisInterval={replayYAxis?.interval}
                        snapToCleanBoundary={xMinProp === undefined}
                        showTooltipTimestamp={timeInterval === "hourly"}
                        compactXAxis
                        ySplitNumber={2}
                        showTotal={selectedScale === "stacked" && !isSuccessRateMetric}
                        decimalPercentage={["success_rate"].includes(metric)}
                        className="mb-[30px]"
                        suffix={metricData?.units?.[isValueMetric ? "value" : showUsd ? "usd" : "eth"]?.suffix ?? undefined}
                        prefix={metricData?.units?.[isValueMetric ? "value" : showUsd ? "usd" : "eth"]?.prefix ?? undefined}
                        decimals={metricData?.units?.[isValueMetric ? "value" : showUsd ? "usd" : "eth"]?.decimals_tooltip ?? undefined}
                        underChartText={!hasChainData && !selectedTotal ? "This metric cannot be broken down by chain" : undefined}
                        syncId={syncId}
                        showLegend={true}
                        watermarkOverlap={mediumBreakpoint ? index === 0 : index === 1}
                        notMerge={!isReplaying}
                    />
                    </div>


                </GTPCardLayout>
                </div>
            </div>
        </div>
    );
}
