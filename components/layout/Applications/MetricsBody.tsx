import React from "react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { useTimespan } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ProjectMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useTheme } from "next-themes";
import { GTPIcon } from "../GTPIcon";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import { useState, useMemo, useRef, useEffect, useLayoutEffect, useReducer } from "react";
import { MetricInfo } from "@/types/api/MasterResponse";
import GTPCardLayout from "@/components/GTPComponents/GTPLayout/GTPCardLayout";
import GTPChart from "@/components/GTPComponents/GTPChart";
import GTPButtonDropdown from "@/components/GTPComponents/ButtonComponents/GTPButtonDropdown";
import ShareDropdownContent from "@/components/layout/FloatingBar/ShareDropdownContent";
import { useLocalStorage } from "usehooks-ts";
import { useAppColors } from "@/hooks/useAppColors";
import { useMediaQuery } from "@react-hook/media-query";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { getFundamentalsByKey } from "@/lib/navigation";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

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
                        const intervalData = series?.[timeInterval]?.data;
                        return Array.isArray(intervalData) && intervalData.length > 0;
                    },
                );

                return [metric, hasSeriesForInterval];
            }),
        ) as Record<string, boolean>;
    }, [data, master, timeInterval]);

    const chainOrder = useMemo(() => {
        const original = data.chains_by_size ?? [];
        const deselectedSet = new Set(deselectedChains);
        const selected = original.filter((chain) => !deselectedSet.has(chain));
        const deselected = original.filter((chain) => deselectedSet.has(chain));
        return [...selected, ...deselected];
    }, [data, deselectedChains]);
    

    function filterTimespans(timespan: string, timeInterval: string) {
        if (timeInterval === "daily") {
            return !(timespan === "1d" || timespan === "3d" || timespan === "7d" || timespan === "30d");
        } else {
            return !( timespan === "30d" || timespan === "90d" || timespan === "180d" || timespan === "365d" || timespan === "max");
        }
    }


    
    return (
        <div className="pt-[30px] w-full">
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
                            maxHeight: isCompareDropdownOpen ? "115px" : "0px",
                            transition: "max-height 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0px 0px 27px 0px var(--color-ui-shadow, #151A19)",
                        }}
                    >
                        <div
                            className="bg-color-bg-default rounded-b-[15px] justify-center px-[10px]"
                            style={{ paddingTop: "30px", height: "115px" }}
                        >
                            <div className="flex items-center bg-color-bg-medium rounded-full pl-[10px] pr-[5px] py-[5px] justify-between w-full">
                                <div className="flex items-center gap-x-[10px]">
                                    <GTPIcon icon="gtp-search" className="!size-[12px]" containerClassName="!size-[12px]" />
                                    <input 
                                    type="text" 
                                    className="text-xxs bg-transparent outline-none" 
                                    placeholder="Search" 
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
                            <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} label="Total" size="sm" variant="primary" isSelected={selectedTotal} clickHandler={() => setSelectedTotal(true)} />
                            <GTPButton className="w-full justify-center" innerStyle={{ width: "100%" }} label="By Chain" size="sm" variant="primary" isSelected={!selectedTotal} clickHandler={() => setSelectedTotal(false)} />
                        </GTPButtonRow>
                    </div>
                </GTPButtonContainer>
                            
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-[30px]">
                {Object.keys(data.metrics ?? {})
                    .filter((metric) => master?.app_metrics?.[metric])
                    .filter((metric) => hasMetricDataForInterval[metric])
                    .map((metric) => (
                    <AppMetricChart key={metric} data={data} owner_project={owner_project} projectMetadata={projectMetadata} metric={metric} metric_data={master?.app_metrics?.[metric] as MetricInfo} timeInterval={timeInterval} selectedTotal={selectedTotal} deselectedChains={deselectedChains} setDeselectedChains={setDeselectedChains} />
                ))}
            </div>
        </div>
    )
}


const AppMetricChart = ({ data, owner_project, projectMetadata, metric, metric_data, timeInterval, selectedTotal, deselectedChains, setDeselectedChains }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, metric: string, metric_data?: MetricInfo, timeInterval: string, selectedTotal: boolean, deselectedChains: string[], setDeselectedChains: React.Dispatch<React.SetStateAction<string[]>> }) => {
    const { theme } = useTheme();
    const { getAppColors } = useAppColors();
    const appColor = getAppColors(owner_project, theme);
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const inactiveSeriesNames = useMemo(() => new Set(deselectedChains), [deselectedChains]);
    const [hoverSeriesName, setHoverSeriesName] = useState<string | null>(null);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    const [collapseTable, setCollapseTable] = useState(false);
    const { AllChainsByKeys, data: master } = useMaster();
    const [cachedTimespans, setCachedTimespans] = useState<string | null>(null);
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const resolvedMetricData = metric_data ?? master?.app_metrics?.[metric];
    const hasChainData = resolvedMetricData?.chain_specific;
    

    const seriesData = useMemo(() => {
        const showAvg = resolvedMetricData?.all_l2s_aggregate === "avg";
        const overTime = data.metrics[metric]?.over_time;

        if (!overTime) {
            return [];
        }
        

        if (!hasChainData) {
            const intervalData = getTimeseriesRows(
                overTime?.all?.[timeInterval] ?? (overTime as Record<string, unknown>)[timeInterval],
            );
            return [{
                name: "Total",
                data: intervalData.map((d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])]),
            }];
        }

        const chains = Object.keys(overTime).filter((chain) => !deselectedChains.includes(chain));
        const perChain = chains.flatMap((chain) => {
            const intervalData = overTime?.[chain]?.[timeInterval]?.data;
            if (!Array.isArray(intervalData) || intervalData.length === 0) {
                return [];
            }

            return [{
                name: chain,
                data: intervalData.map(
                    (d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])],
                ),
            }];
        });

        if (!selectedTotal) return perChain;

        // Build a map of timestamp → sum and count across all chains
        const sums = new Map<number, number | null>();
        const counts = new Map<number, number>();
        for (const { data: points } of perChain) {
            for (const [ts, val] of points) {
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

        const totals: [number, number | null][] = Array.from(sums.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([ts, sum]) => {
                if (!showAvg || sum === null) return [ts, sum];
                const count = counts.get(ts) ?? 0;
                return [ts, count > 0 ? sum / count : null];
            });

        return [{
            name: "Total",
            data: totals,
        }];
    }, [data, deselectedChains, hasChainData, metric, resolvedMetricData?.all_l2s_aggregate, selectedTotal, timeInterval]);

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


    const [selectedScale, setSelectedScale] = useState(resolvedMetricData?.toggles?.[0] ?? "stacked");
    const metricData = resolvedMetricData;
    const isValueMetric = Object.keys(metricData?.units ?? {}).includes("value");
    const isSuccessRateMetric = metric === "success_rate";

    const altNames = useMemo(() => {
        switch (metric) {
        case "gas_fees":
            return "fees_paid";
        case "data_posted":
            return "Data Posted";
        case "success_rate":
            return "Success Rate";
        case "throughput":
            return "Throughput";
    
        default:
            return metric;
        }
    }, [metric]);

    if (!metricData) {
        return null;
    }
    
    return (
        <div className="pt-[30px] w-full">
            <div className="flex items-center gap-x-[8px]">
                <GTPIcon icon={`gtp-${metricData.icon}` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[16px]" size="sm" />
                <div className="heading-large-xxs xs:heading-large-xs">{metricData.name}</div>
                <GTPTooltipNew
                    placement="right"
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
                            {metricData?.toggles?.map((toggle) => (
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
                        series={seriesData.filter((s) => !hasChainData && !selectedTotal ? s.name !== "Total" : true).map((s) => ({
                            ...s,
                            seriesType: selectedScale === "percentage" || selectedScale === "stacked" ? "area" as const : "line" as const,
                            name: AllChainsByKeys[s.name]?.name_short ?? (isSuccessRateMetric ? "Total L2 Average" : projectMetadata.display_name + " L2 Total"),
                            color: s.name === "Total"
                                ? [appColor[0], appColor[1]]
                                : [AllChainsByKeys[s.name]?.colors?.[theme ?? "dark"]?.[0], AllChainsByKeys[s.name]?.colors?.[theme ?? "dark"]?.[1]],
                        }))}
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
                    />
                    
                    <div className="flex items-center justify-center w-full gap-x-[5px] relative  bottom-[35px] h-[20px]" 
                    >
                        {seriesData.filter((s) => !hasChainData && !selectedTotal ? s.name !== "Total" : true).sort((a, b) => data.chains_by_size.indexOf(a.name) - data.chains_by_size.indexOf(b.name)).map((s) => (
                            <div className="" key={s.name + "app-metric-chart-legend"}
                                onMouseEnter={() => setHoverSeriesName(s.name)}
                                onMouseLeave={() => setHoverSeriesName(null)}
                            >
                                <GTPButton
                                    label={selectedTotal ? projectMetadata.display_name : AllChainsByKeys[s.name]?.name_short ?? s.name}
                                    variant="primary" 
                                    size="xs"
                                    clickHandler={() => {
                                        if(selectedTotal) return;
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
                                        hoverSeriesName === s.name && !selectedTotal
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
                                            style={{ backgroundColor: s.name === "Total" ? appColor[0] : AllChainsByKeys[s.name]?.colors?.[theme ?? "dark"]?.[0], opacity: inactiveSeriesNames.has(s.name) ? 0.35 : 1 }}
                                        />
                                    )}
                                />
                            </div>
                        ))}

                    </div>
                </GTPCardLayout>
            </div>
        </div>  
    );
}
