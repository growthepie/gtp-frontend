import React from "react";
import Image from "next/image";
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
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { downloadElementAsImage } from "@/components/GTPComponents/chartSnapshotHelpers";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

type CompareAppEntry = {
    owner_project: string;
    data: ApplicationDetailsData;
    displayName: string;
};

// Handles both raw array format and { data: number[][] } object format
const getTimeseriesRows = (value: unknown): number[][] => {
    if (Array.isArray(value)) {
        return value as number[][];
    }
    if (
        value &&
        typeof value === "object" &&
        "data" in value &&
        Array.isArray((value as { data?: unknown }).data)
    ) {
        return (value as { data: number[][] }).data;
    }
    return [];
};

type SeriesEntry = { name: string; data: [number, number | null][] };

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
}): SeriesEntry[] {
    const { data, metric, timeInterval, selectedTotal, deselectedChains, hasChainData, isComparing, compareApps, showAvg } = params;
    const overTime = data.metrics[metric]?.over_time;
    if (!overTime) return [];

    function sumChainSeries(
        ot: Record<string, unknown>,
        excludeChains: string[] = [],
    ): [number, number | null][] {
        const sums = new Map<number, number | null>();
        const counts = new Map<number, number>();
        for (const chain of Object.keys(ot)) {
            if (excludeChains.includes(chain)) continue;
            const points = ((ot[chain] as any)?.[timeInterval]?.data ?? []) as number[][];
            for (const d of points) {
                const ts = Number(d[0]);
                const val: number | null = d[1] == null ? null : Number(d[1]);
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
        const intervalData = getTimeseriesRows(
            (overTime as any)?.all?.[timeInterval] ?? (overTime as Record<string, unknown>)[timeInterval],
        );
        const mainSeries: SeriesEntry = {
            name: "Total",
            data: intervalData.map((d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
        };
        if (!isComparing) return [mainSeries];
        const compareSeries = compareApps
            .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
            .map(app => {
                const appIntervalData = getTimeseriesRows(
                    (app.data.metrics[metric].over_time as any)?.all?.[timeInterval] ??
                    (app.data.metrics[metric].over_time as Record<string, unknown>)[timeInterval],
                );
                return {
                    name: `compare_${app.owner_project}`,
                    data: appIntervalData.map((d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
                } as SeriesEntry;
            });
        return [mainSeries, ...compareSeries];
    }

    const chains = Object.keys(overTime).filter((chain) => !deselectedChains.includes(chain));
    const perChain: SeriesEntry[] = chains.flatMap((chain) => {
        const intervalData = (overTime[chain] as any)?.[timeInterval]?.data;
        if (!Array.isArray(intervalData) || intervalData.length === 0) return [];
        return [{
            name: chain,
            data: intervalData.map((d: number[]): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
        }];
    });

    if (!selectedTotal && !isComparing) return perChain;

    const mainTotalSeries: SeriesEntry = {
        name: "Total",
        data: sumChainSeries(overTime as Record<string, unknown>, deselectedChains),
    };

    if (!isComparing) return [mainTotalSeries];

    const mainAppChains = new Set(Object.keys(overTime));
    const compareSeries = compareApps
        .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
        .map(app => {
            const compareOverTime = app.data.metrics[metric].over_time as Record<string, unknown>;
            // Exclude chains that are deselected on the main app, or that don't exist on the main app at all.
            // This ensures chain parity: only chains shared by both apps and actively selected contribute.
            const compareExclude = Object.keys(compareOverTime).filter(
                chain => deselectedChains.includes(chain) || !mainAppChains.has(chain),
            );
            return {
                name: `compare_${app.owner_project}`,
                data: sumChainSeries(compareOverTime, compareExclude),
            } as SeriesEntry;
        });

    return [mainTotalSeries, ...compareSeries];
}

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

    const [selectedTotal, setSelectedTotal] = useState(true);
    const [timeInterval, setTimeInterval] = useState("daily");
    const { AllChainsByKeys, data: master } = useMaster();
    const { theme } = useTheme();
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
    // ─── Compare state ────────────────────────────────────────────────────────
    const [compareAppKeys, setCompareAppKeys] = useState<string[]>([]);
    const [compareAppsData, setCompareAppsData] = useState<Map<string, ApplicationDetailsData>>(new Map());
    const isComparing = compareAppKeys.length > 0;
    const { ownerProjectToProjectData } = useProjectsMetadata();

    const compareSearchResults = useMemo(() => {
        const term = searchQuery.toLowerCase().trim();
        return Object.values(ownerProjectToProjectData)
            .filter(app =>
                app.on_apps_page &&
                app.owner_project !== owner_project &&
                !compareAppKeys.includes(app.owner_project) &&
                (term === "" || app.display_name.toLowerCase().includes(term)),
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

    // Memoize the filtered+sorted chains so both the render and the measurement share the same list.
    const filteredSortedChains = useMemo(() =>
        (data.chains_by_size ?? []).filter((chain) => AllChainsByKeys[chain]).sort((a, b) => {
            const aDeselected = deselectedChains.includes(a) ? 1 : 0;
            const bDeselected = deselectedChains.includes(b) ? 1 : 0;
            return aDeselected - bDeselected;
        }),
        [data.chains_by_size, AllChainsByKeys, deselectedChains],
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

    function filterTimespans(timespan: string, interval: string) {
        if (interval === "daily") {
            return !(timespan === "1d" || timespan === "3d" || timespan === "7d" || timespan === "30d");
        } else {
            return !(timespan === "30d" || timespan === "90d" || timespan === "180d" || timespan === "365d" || timespan === "max");
        }
    }

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
    }, [data, master, hasMetricDataForInterval, timeInterval, effectiveSelectedTotal, deselectedChains, compareAppsForChart]);

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
                    <Image src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[compareAppsForChart[0].owner_project]?.logo_path}`} alt={compareAppsForChart[0].displayName} width={24} height={24} className="rounded-full shrink-0 " />
                    <div className="flex flex-col items-center">
                        <div className="text-xxs">Compare to</div>
                        <div className="flex items-center gap-x-[5px]">
                            
                            <div className="heading-small-xs"> {compareAppsForChart[0].displayName}</div>
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
                                                    const totalChains = (data.chains_by_size ?? []).filter((c) => AllChainsByKeys[c]).length;
                                                    if (totalChains - next.size <= 1) return prev;
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
    }), [data, metric, selectedTotal, deselectedChains, timeInterval, resolvedMetricData, hasChainData, compareApps, isComparing]);

    const metricData = resolvedMetricData;
    const [selectedScale, setSelectedScale] = useState(metricData?.toggles?.[0] ?? "stacked");
    const isValueMetric = Object.keys(metricData?.units ?? {}).includes("value");
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

    if (!metricData) return null;

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
                                    labelDisplay: "active",
                                    leftIcon: "gtp-share-monochrome",
                                    size: isMobile ? "xs" : "sm",
                                    variant: "no-background",
                                }}
                                isOpen={isSharePopoverOpen}
                                onOpenChange={setIsSharePopoverOpen}
                                dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
                            />

                            <GTPButton
                                leftIcon="gtp-download-monochrome"
                                size={isMobile ? "xs" : "sm"}
                                variant="no-background"
                                visualState={isDownloadingChartSnapshot ? "disabled" : "default"}
                                disabled={isDownloadingChartSnapshot}
                                clickHandler={() => setIsDownloadingChartSnapshot(true)}
                            />
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
                    <GTPChart
                        height={280}
                        stack={selectedScale === "stacked"}
                        percentageMode={selectedScale === "percentage"}
                        series={visibleSeries.map((s: { name: string; data: [number, number | null][] }) => {
                            const { displayName, color } = resolveSeriesInfo(s.name);
                            return {
                                ...s,
                                seriesType: selectedScale === "percentage" || selectedScale === "stacked" ? "area" as const : "line" as const,
                                name: displayName,
                                color: color as [string, string],
                            };
                        })}
                        xAxisMin={xMin}
                        xAxisMax={xMax}
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
                    />


                </GTPCardLayout>
                </div>
            </div>
        </div>
    );
}
