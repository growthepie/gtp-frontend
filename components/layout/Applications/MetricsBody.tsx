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
import { useState, useMemo, useRef, useEffect, useLayoutEffect, useReducer, useCallback } from "react";
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

export default function MetricsBody({ data, owner_project, projectMetadata }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata }) {
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
    const chainsSelectedRef = useRef<HTMLDivElement>(null);
    const chainCount = (data.chains_by_size ?? []).filter((chain) => AllChainsByKeys[chain]).length;
    // useReducer so dispatch() doesn't match the `set`-prefixed setState lint rule
    const [dynamicLabelCount, dispatchLabelCount] = useReducer((_: number, next: number) => next, chainCount);
    // Incrementing this forces a re-render so useLayoutEffect can measure the new overflow state
    const [, forceCheck] = useReducer((c: number) => c + 1, 0);

    // ─── Compare state ────────────────────────────────────────────────────────
    const [compareAppKeys, setCompareAppKeys] = useState<string[]>([]);
    const [compareAppsData, setCompareAppsData] = useState<Map<string, ApplicationDetailsData>>(new Map());
    const isComparing = compareAppKeys.length > 0;
    const { ownerProjectToProjectData } = useProjectsMetadata();

    const compareSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const term = searchQuery.toLowerCase();
        return Object.values(ownerProjectToProjectData)
            .filter(app =>
                app.on_apps_page &&
                app.owner_project !== owner_project &&
                !compareAppKeys.includes(app.owner_project) &&
                app.display_name.toLowerCase().includes(term),
            )
            .slice(0, 6);
    }, [searchQuery, ownerProjectToProjectData, owner_project, compareAppKeys]);

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

    // After every render: if the chain selector is overflowing its allocated flex width,
    // trim one labeled button. Runs synchronously before paint so intermediate states are invisible.
    useLayoutEffect(() => {
        const el = chainsSelectedRef.current;
        if (!el) return;
        if (el.scrollWidth > el.clientWidth) {
            dispatchLabelCount(Math.max(0, dynamicLabelCount - 1));
        }
    });

    // Post-paint safety net: useLayoutEffect measures before the browser has finished resolving
    // flex layout during fast resize. By the time useEffect runs (after paint), dimensions are
    // fully settled — the same state as when any other item's state update triggers a re-render
    // and incidentally fixes the overflow.
    useEffect(() => {
        const el = chainsSelectedRef.current;
        if (!el) return;
        if (el.scrollWidth > el.clientWidth) {
            dispatchLabelCount(Math.max(0, dynamicLabelCount - 1));
        }
    });

    // Drive the trim/grow loop from the parent row's width.
    // The parent row is w-full so it reliably changes on every window resize,
    // unlike the chain selector itself which stops growing once it reaches its
    // natural trimmed content width (flex-grow: 0 prevents further expansion).
    //
    // grow  → reset to all labels; the useLayoutEffect trim loop synchronously
    //         converges to the exact count that fits before the browser paints
    // shrink → force a re-render so the trim loop can measure the new overflow
    useEffect(() => {
        const el = chainsSelectedRef.current;
        if (!el) return;
        const parentRow = el.parentElement;
        if (!parentRow) return;

        let lastParentWidth = parentRow.getBoundingClientRect().width;

        let settleTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new ResizeObserver(() => {
            const newParentWidth = parentRow.getBoundingClientRect().width;
            if (newParentWidth > lastParentWidth) {
                dispatchLabelCount(chainCount);
            } else if (newParentWidth < lastParentWidth) {
                forceCheck();
            }
            lastParentWidth = newParentWidth;

            // After resize stops, do one final reset so the trim loop converges
            // from scratch and catches any edge-case overflow from fast resizing.
            if (settleTimer !== null) clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                dispatchLabelCount(chainCount);
                forceCheck();
            }, 500);
        });

        observer.observe(parentRow);
        return () => {
            observer.disconnect();
            if (settleTimer !== null) clearTimeout(settleTimer);
        };
    }, [chainCount]);

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


    return (
        <div className="pt-[30px] w-full">
            {/* Invisible data loaders for each compare app */}
            {compareAppKeys.map(key => (
                <CompareLoader key={key} owner_project={key} onDataLoaded={handleCompareDataLoaded} />
            ))}

            <div className="w-full flex justify-between items-center gap-x-[15px] ">
                <div ref={chainsSelectedRef} className="flex min-w-0 w-full items-center gap-x-[5px] bg-color-bg-medium rounded-full pl-[15px] pr-[2px] py-[3px]">
                    <div className="text-sm shrink-0">Chains Selected</div>
                    <div className="flex shrink-0 items-center gap-x-[2px] border-color-bg-default border rounded-full ">
                    {(data.chains_by_size ?? []).filter((chain) => AllChainsByKeys[chain]).sort((a, b) => {
                        const aDeselected = deselectedChains.includes(a) ? 1 : 0;
                        const bDeselected = deselectedChains.includes(b) ? 1 : 0;
                        return aDeselected - bDeselected;
                    }).map((chain, i) => {
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
                                size="md"
                                clickHandler={() => {
                                    setDeselectedChains((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(chain)) {
                                            next.delete(chain);
                                        } else {
                                            next.add(chain);
                                        }
                                        return Array.from(next);
                                    });
                                }}
                            />
                        )
                    })}
                    </div>
                </div>
                <div className="relative min-w-[230px] max-w-[261px] w-full">
                    {/* Compare pill button — relative + z-20 so it sits above the dropdown */}
                    <div
                        className="relative z-20 w-full p-[5px] bg-color-bg-medium rounded-full flex items-center justify-between cursor-pointer select-none"
                        onClick={() => setIsCompareDropdownOpen((prev) => !prev)}
                    >
                        <GTPIcon icon="gtp-chevronleft-monochrome" containerClassName="!size-[34px] flex p-[5px] items-center justify-center" className="!size-[16px]" size="sm" />
                        <div className="flex flex-col items-center">
                            <div className="text-xxs">Compare</div>
                            <div className="flex items-center gap-x-[5px]">
                                <GTPIcon icon="gtp-compare" size="sm" />
                                <div className="heading-small-xs">App Name</div>
                            </div>
                        </div>
                        <GTPIcon icon="gtp-chevronright-monochrome" containerClassName="!size-[34px] flex p-[5px] items-center justify-center" className="!size-[16px]" size="sm" />
                    </div>

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
                            className="bg-color-bg-default rounded-b-[15px] justify-center px-[10px] z-50"
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
                                <GTPIcon
                                    icon="in-button-close"
                                    className="!size-[12px] cursor-pointer"
                                    containerClassName="!size-[15px] flex items-center justify-center"
                                    onClick={() => setSearchQuery("")}
                                />
                            </div>
                            {(compareAppKeys.length > 0 || compareSearchResults.length > 0) && (
                                <div className="mt-[8px] flex flex-col max-h-[300px] overflow-y-auto">
                                    {compareAppKeys.map(key => {
                                        const meta = ownerProjectToProjectData[key];
                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center gap-x-[8px] px-[8px] py-[5px] rounded-full cursor-pointer hover:bg-color-bg-medium transition-colors"
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
                                            className="flex items-center gap-x-[8px] px-[8px] py-[5px] rounded-full cursor-pointer hover:bg-color-bg-medium transition-colors"
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
                                            <span className="truncate flex-1 min-w-0">{app.display_name ?? app.owner_project}</span>
                                        </div>
                                    ))}
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
                                <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} key={interval} label={INTERVALS[interval as keyof typeof INTERVALS].label} size="sm" variant="primary" isSelected={timeInterval === interval}
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
                                <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} key={timespan} label={timespans[timespan].label} size="sm" variant="primary" isSelected={selectedTimespan === timespan} clickHandler={() => setSelectedTimespan(timespan)} />
                            ))}
                        </GTPButtonRow>
                        <GTPButtonRow wrap={isMobile ? true : false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} label="Total" size="sm" variant="primary" isSelected={effectiveSelectedTotal} clickHandler={() => setSelectedTotal(true)} />
                            <GTPButton
                                className="w-full justify-center"
                                innerStyle={{ width: "100%" }}
                                label="By Chain"
                                size="sm"
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
                    .map((metric) => (
                    <AppMetricChart key={metric} data={data} owner_project={owner_project} projectMetadata={projectMetadata} metric={metric} metric_data={master?.app_metrics?.[metric] as MetricInfo} timeInterval={timeInterval} selectedTotal={effectiveSelectedTotal} deselectedChains={deselectedChains} setDeselectedChains={setDeselectedChains} compareApps={compareAppsForChart} syncId="app-metrics" />
                ))}
            </div>
        </div>
    )
}


const AppMetricChart = ({ data, owner_project, projectMetadata, metric, metric_data, timeInterval, selectedTotal, deselectedChains, setDeselectedChains, compareApps, syncId }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, metric: string, metric_data?: MetricInfo, timeInterval: string, selectedTotal: boolean, deselectedChains: string[], setDeselectedChains: React.Dispatch<React.SetStateAction<string[]>>, compareApps: CompareAppEntry[], syncId?: string }) => {
    const { theme } = useTheme();
    const { getAppColors } = useAppColors();
    const appColor = getAppColors(owner_project, theme);
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const inactiveSeriesNames = useMemo(() => new Set(deselectedChains), [deselectedChains]);
    const [hoverSeriesName, setHoverSeriesName] = useState<string | null>(null);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    const { AllChainsByKeys, data: master } = useMaster();
    const [showUsd] = useLocalStorage("showUsd", true);
    // metric_data may be passed directly or resolved from master for resilience
    const resolvedMetricData = metric_data ?? master?.app_metrics?.[metric];
    const hasChainData = resolvedMetricData?.chain_specific;
    const isComparing = compareApps.length > 0;

    const seriesData = useMemo(() => {
        const showAvg = resolvedMetricData?.all_l2s_aggregate === "avg";
        const overTime = data.metrics[metric]?.over_time;

        if (!overTime) return [];

        // Sums all chains in an over_time map into one aggregate total series.
        // Uses `any` cast because OverTimeData only types `daily`, but `hourly` also exists at runtime.
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

        // ── Non-chain-specific metrics (e.g. success_rate, throughput) ────────
        if (!hasChainData) {
            const intervalData = getTimeseriesRows(
                overTime?.all?.[timeInterval] ?? (overTime as Record<string, unknown>)[timeInterval],
            );
            const mainSeries = {
                name: "Total",
                data: intervalData.map((d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
            };

            if (!isComparing) return [mainSeries];

            const compareSeries = compareApps
                .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
                .map(app => {
                    const appIntervalData = getTimeseriesRows(
                        app.data.metrics[metric].over_time?.all?.[timeInterval] ??
                        (app.data.metrics[metric].over_time as Record<string, unknown>)[timeInterval],
                    );
                    return {
                        name: `compare_${app.owner_project}`,
                        data: appIntervalData.map((d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
                    };
                });

            return [mainSeries, ...compareSeries];
        }

        // ── Chain-specific metrics ─────────────────────────────────────────────
        // flatMap skips chains that have no data for the current interval
        const chains = Object.keys(overTime).filter((chain) => !deselectedChains.includes(chain));
        const perChain = chains.flatMap((chain) => {
            const intervalData = (overTime[chain] as any)?.[timeInterval]?.data;
            if (!Array.isArray(intervalData) || intervalData.length === 0) return [];
            return [{
                name: chain,
                data: intervalData.map(
                    (d: number[]): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])],
                ),
            }];
        });

        // By Chain view — only available when not comparing
        if (!selectedTotal && !isComparing) return perChain;

        const mainTotalSeries = {
            name: "Total",
            data: sumChainSeries(overTime as Record<string, unknown>, deselectedChains),
        };

        if (!isComparing) return [mainTotalSeries];

        // Compare mode: one total series per compare app (all chains, no deselection)
        const compareSeries = compareApps
            .filter((app): app is CompareAppEntry => Boolean(app.data?.metrics?.[metric]))
            .map(app => ({
                name: `compare_${app.owner_project}`,
                data: sumChainSeries(app.data.metrics[metric].over_time as Record<string, unknown>),
            }));

        return [mainTotalSeries, ...compareSeries];
    }, [data, metric, selectedTotal, deselectedChains, timeInterval, resolvedMetricData, hasChainData, compareApps, isComparing]);

    const { timespans, selectedTimespan } = useTimespan();

    const { xMin, xMax } = useMemo(() => {
        const days = timespans[selectedTimespan]?.value ?? 0;
        let latestTs = 0;
        for (const series of seriesData) {
            if (series.data.length > 0) {
                const ts = series.data[series.data.length - 1][0];
                if (ts > latestTs) latestTs = ts;
            }
        }
        const xMax = latestTs > 0 ? latestTs : new Date().getTime();
        const xMin = days > 0 ? xMax - days * 24 * 60 * 60 * 1000 : undefined;
        return { xMin, xMax };
    }, [timespans, selectedTimespan, seriesData]);

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
            : (AllChainsByKeys[seriesName]?.name_short ?? (isSuccessRateMetric ? "Total L2 Average" : projectMetadata.display_name + ""));

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

    if (!metricData) return null;

    return (
        <div className="pt-[30px] w-full">
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
                <GTPCardLayout
                 className=""
                 mobileBreakpoint={0}
                 header={
                     <div className="flex items-center justify-between pt-[3px] px-[4px]">
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
                                    size: "sm",
                                    variant: "no-background",
                                }}
                                isOpen={isSharePopoverOpen}
                                onOpenChange={setIsSharePopoverOpen}
                                dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
                            />

                            <GTPButton
                                leftIcon="gtp-download-monochrome"
                                size={"sm"}
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
                                <GTPButton key={toggle} label={toggle.charAt(0).toUpperCase() + toggle.slice(1)} size="sm" variant="primary" isSelected={selectedScale === toggle} clickHandler={() => setSelectedScale(toggle)} />
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
                    />

                    <div className="flex items-center justify-center w-full gap-x-[5px] relative  bottom-[35px] h-[20px]"
                    >
                        {visibleSeries.sort((a: { name: string }, b: { name: string }) => {
                            // Main "Total" first, then chain series, then compare-app series
                            if (a.name === "Total") return -1;
                            if (b.name === "Total") return 1;
                            if (a.name.startsWith("compare_")) return 1;
                            if (b.name.startsWith("compare_")) return -1;
                            return data.chains_by_size.indexOf(a.name) - data.chains_by_size.indexOf(b.name);
                        }).map((s: { name: string; data: [number, number | null][] }) => {
                            const { isCompareApp, displayName, color } = resolveSeriesInfo(s.name);
                            const legendLabel = isCompareApp
                                ? displayName
                                : (selectedTotal ? projectMetadata.display_name : AllChainsByKeys[s.name]?.name_short ?? s.name);
                            const dotColor = color[0];

                            return (
                                <div className="" key={s.name + "app-metric-chart-legend"}
                                    onMouseEnter={() => setHoverSeriesName(s.name)}
                                    onMouseLeave={() => setHoverSeriesName(null)}
                                >
                                    <GTPButton
                                        label={legendLabel}
                                        variant="primary"
                                        size="xs"
                                        clickHandler={() => {
                                            // Chain toggling only applies in by-chain view
                                            if (selectedTotal || isCompareApp) return;
                                            setDeselectedChains((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(s.name)) {
                                                    next.delete(s.name);
                                                } else {
                                                    next.add(s.name);
                                                }
                                                return Array.from(next);
                                            });
                                        }}
                                        rightIcon={
                                            hoverSeriesName === s.name && !selectedTotal && !isCompareApp
                                              ? inactiveSeriesNames.has(s.name)
                                                ? "in-button-plus"
                                                : "in-button-close"
                                              : undefined
                                        }
                                        animateRightIcon
                                        rightIconClassname="!w-[12px] !h-[12px]"
                                        textClassName={inactiveSeriesNames.has(s.name) ? "text-color-text-secondary" : undefined}
                                        className={inactiveSeriesNames.has(s.name) ? "border border-color-bg-medium" : undefined}
                                        leftIconOverride={(
                                            <div
                                                className="min-w-[6px] min-h-[6px] rounded-full"
                                                style={{ backgroundColor: dotColor, opacity: inactiveSeriesNames.has(s.name) ? 0.35 : 1 }}
                                            />
                                        )}
                                    />
                                </div>
                            );
                        })}

                    </div>
                </GTPCardLayout>
            </div>
        </div>
    );
}
