import React from "react";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import { useTimespan } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ProjectMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useTheme } from "next-themes";
import { GTPIcon } from "../GTPIcon";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import { useState, useMemo } from "react";
import { MetricInfo } from "@/types/api/MasterResponse";
import GTPCardLayout from "@/components/GTPButton/GTPCardLayout";
import GTPChart from "@/components/GTPButton/GTPChart";
import GTPButtonDropdown from "@/components/GTPButton/GTPButtonDropdown";
import ShareDropdownContent from "@/components/layout/FloatingBar/ShareDropdownContent";
import { useLocalStorage } from "usehooks-ts";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

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
    const [selectedTotal, setSelectedTotal] = useState(false);
    const [timeInterval, setTimeInterval] = useState("daily");
    const { AllChainsByKeys, data: master } = useMaster();
    const { theme } = useTheme();
    const [deselectedChains, setDeselectedChains] = useState<string[]>([]);
    



    
    return (
        <div className="pt-[30px] w-full">
            <div className="w-full flex justify-between items-center gap-x-[15px] ">
                <div className="flex items-center gap-x-[5px] bg-color-bg-medium rounded-full pl-[15px] pr-[2px] py-[3px]">
                    <div className="text-sm  ">Chains Selected</div>
                    <div className="flex items-center gap-x-[2px] border-color-bg-default border rounded-full ">
                    {Object.keys(projectMetadata.active_on ?? {}).map((chain, i) => {
                        const chainColor = AllChainsByKeys[chain]?.colors?.[theme ?? "dark"]?.[0];
                        return (
                            <GTPButton
                                key={chain + i}
                                label={AllChainsByKeys[chain]?.name_short}
                                leftIcon={`gtp:${AllChainsByKeys[chain]?.urlKey}-logo-monochrome` as GTPIconName}
                                leftIconStyle={{ color: chainColor }}
                                visualState={deselectedChains.includes(chain) ? "default" : "active"}
                                labelDisplay={i < 5 ? "always" : "hover"}
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
                <div className=" min-w-[230px] max-w-[261px] w-full p-[5px] bg-color-bg-medium rounded-full flex items-center justify-between">
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
            </div>
            <div className="pt-[10px] w-full">
                <GTPButtonContainer className="w-full flex flex-nowrap">         
                        <GTPButtonRow wrap={false} 
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            {Object.keys(INTERVALS).map((interval) => (
                                <GTPButton key={interval} label={INTERVALS[interval as keyof typeof INTERVALS].label} size="sm" variant="primary" isSelected={timeInterval === interval} clickHandler={() => setTimeInterval(interval)} />
                            ))}
                        </GTPButtonRow>
                    <div className="flex gap-x-[5px]" >
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            {Object.keys(timespans).filter((timespan) => !(timespan === "1d" || timespan === "7d" || timespan === "30d")).map((timespan) => (
                                <GTPButton key={timespan} label={timespans[timespan].label} size="sm" variant="primary" isSelected={selectedTimespan === timespan} clickHandler={() => setSelectedTimespan(timespan)} />
                            ))}
                        </GTPButtonRow>
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            <GTPButton label="Total" size="sm" variant="primary" isSelected={selectedTotal} clickHandler={() => setSelectedTotal(true)} />
                            <GTPButton label="By Chain" size="sm" variant="primary" isSelected={!selectedTotal} clickHandler={() => setSelectedTotal(false)} />
                        </GTPButtonRow>
                    </div>
                </GTPButtonContainer>
                            
            </div>
            <div className="grid grid-cols-2 gap-x-[30px]">
                {Object.keys(data.metrics ?? {}).map((metric) => (
                    <AppMetricChart key={metric} data={data} owner_project={owner_project} projectMetadata={projectMetadata} metric={metric} metric_data={master?.app_metrics?.[metric] as MetricInfo} timeInterval={timeInterval} selectedTotal={selectedTotal} deselectedChains={deselectedChains} setDeselectedChains={setDeselectedChains} />
                ))}
            </div>
        </div>
    )
}


const AppMetricChart = ({ data, owner_project, projectMetadata, metric, metric_data, timeInterval, selectedTotal, deselectedChains, setDeselectedChains }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, metric: string, metric_data: MetricInfo, timeInterval: string, selectedTotal: boolean, deselectedChains: string[], setDeselectedChains: React.Dispatch<React.SetStateAction<string[]>> }) => {
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const inactiveSeriesNames = useMemo(() => new Set(deselectedChains), [deselectedChains]);
    const [hoverSeriesName, setHoverSeriesName] = useState<string | null>(null);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    const [collapseTable, setCollapseTable] = useState(false);
    const { AllChainsByKeys } = useMaster();
    const { theme } = useTheme();


    const seriesData = useMemo(() => {
        const chains = Object.keys(data.metrics[metric].over_time).filter((chain) => !deselectedChains.includes(chain));
        const perChain = chains.map((chain) => ({
            name: chain,
            data: data.metrics[metric].over_time[chain].daily.data.map(
                (d): [number, number | null] => [Number(d[0]), d[1] == null ? null : Number(d[1])],
            ),
        }));

        if (!selectedTotal) return perChain;

        // Build a map of timestamp → sum across all chains
        const totals = new Map<number, number | null>();
        for (const { data: points } of perChain) {
            for (const [ts, val] of points) {
                if (!totals.has(ts)) {
                    totals.set(ts, val);
                } else {
                    const existing = totals.get(ts)!;
                    totals.set(ts, existing === null ? val : val === null ? existing : existing + val);
                }
            }
        }

        return [{
            name: "Total",
            data: Array.from(totals.entries()).sort((a, b) => a[0] - b[0]) as [number, number | null][],
        }];
    }, [data, metric, selectedTotal, deselectedChains]);

    const { timespans, selectedTimespan } = useTimespan();

    const { xMin, xMax } = useMemo(() => {
        const days = timespans[selectedTimespan]?.value ?? 0;
        const xMax = new Date().getTime();
        const xMin = days > 0 ? xMax - days * 24 * 60 * 60 * 1000 : undefined;
        return { xMin, xMax };
    }, [timespans, selectedTimespan]);

    const [selectedScale, setSelectedScale] = useLocalStorage("selectedScale", "absolute");


    return (
        <div className="pt-[30px] w-full">
            <div className="flex items-center gap-x-[8px]">
                <GTPIcon icon={`gtp-${metric_data.icon}` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[16px]" size="sm" />
                <div className="heading-large-xxs xs:heading-large-xs">{metric_data.name}</div>
            </div>
            <div className="pt-[15px] text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
            <div className="pt-[15px]">
                <GTPCardLayout
                 className=""
                 mobileBreakpoint={0}
                 header={
                     <div className="flex items-center justify-between pt-[3px] px-[4px]">
                        <div className="flex items-center gap-x-[8px]">
                            <GTPIcon icon={`gtp-${metric_data.icon}-monochrome` as GTPIconName} containerClassName="flex items-center justify-center" className="!size-[12px]" size="sm" />
                            <div className="text-xxxs">{metric_data.name} for {projectMetadata.display_name}</div>
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
                                className="!size-[28px]"
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
                            <GTPButton label="Absolute" size="sm" variant="primary" isSelected={selectedScale === "absolute"} clickHandler={() => setSelectedScale("absolute")} />
                            <GTPButton label="Stacked" size="sm" variant="primary" isSelected={selectedScale === "stacked"} clickHandler={() => setSelectedScale("stacked")} />
                            <GTPButton label="Percentage" size="sm" variant="primary" isSelected={selectedScale === "percentage"} clickHandler={() => setSelectedScale("percentage")} />
                        </GTPButtonRow>
                            
                    </GTPButtonContainer>
                 }

                >
                    <GTPChart
                        height={280}
                        series={seriesData.map((s) => ({
                            ...s,
                            color: s.name === "Total" ? AllChainsByKeys["all_l2s"]?.colors?.[theme ?? "dark"]?.[1] : AllChainsByKeys[s.name]?.colors?.[theme ?? "dark"]?.[0],
                            seriesType: "line" as const,
                            name: AllChainsByKeys[s.name]?.name_short ?? s.name,
                        }))}
                        xAxisMin={xMin}
                        xAxisMax={xMax}
                        compactXAxis
                        ySplitNumber={2}
                        decimalPercentage={["success_rate"].includes(metric)}
                        className="mb-[30px]"
                    />
                    
                    <div className="flex items-center justify-center w-full gap-x-[5px] relative  bottom-[35px] h-[20px]" 
                    >
                        {seriesData.map((s) => (
                            <div className="" key={s.name + "app-metric-chart-legend"}
                                onMouseEnter={() => setHoverSeriesName(s.name)}
                                onMouseLeave={() => setHoverSeriesName(null)}
                            >
                                <GTPButton
                                    label={selectedTotal ? "Total" : AllChainsByKeys[s.name]?.name_short ?? s.name}
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
                                            style={{ backgroundColor: AllChainsByKeys[s.name]?.colors?.[theme ?? "dark"]?.[0], opacity: inactiveSeriesNames.has(s.name) ? 0.35 : 1 }}
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