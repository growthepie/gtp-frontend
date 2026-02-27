"use client";
import { useMemo, ReactNode, useRef, useCallback } from "react";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPSplitPane from "../GTPButton/GTPSplitPane";
import { useMediaQuery } from "@react-hook/media-query";
import { useMetricData } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { Switch } from "@/components/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Link from "next/link";

import MetricTable from "./MetricTable";
import MetricChart from "./MetricChart";
import ShareDropdownContent from "../layout/FloatingBar/ShareDropdownContent";
import GTPButtonDropdown from "../GTPButton/GTPButtonDropdown";
import GTPResizeDivider from "../GTPButton/GTPResizeDivider";
import { GTPScrollPaneScrollMetrics } from "../GTPButton/GTPScrollPane";
import { downloadElementAsImage } from "../GTPButton/chartSnapshotHelpers";
import { GTPIcon } from "../layout/GTPIcon";
import { findMetricConfig } from "@/lib/fundamentals/seo";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from "@iconify/react";
import { GTPTooltipNew } from "../tooltip/GTPTooltip";

export default function MetricsContainer({ metric }: { metric: string }) {
    const isMobile = useMediaQuery("(max-width: 767px)");
    const splitRows = useMediaQuery("(max-width: 967px)");
    const [collapseTable, setCollapseTable] = useState(false);
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [scrollMetrics, setScrollMetrics] = useState<GTPScrollPaneScrollMetrics | undefined>();
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const [show7dRollingText, setShow7dRollingText] = useState(false);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);
    const {
        timespans,
        timeIntervals,
        sources,
        metric_id,
        chainKeys,
        data: metricData,
    } = useMetricData();

    const {
        selectedScale,
        setSelectedScale,
        showEthereumMainnet,
        setShowEthereumMainnet,
        selectedTimeInterval,
        setSelectedTimeInterval,
        selectedTimespan,
        setSelectedTimespan,
        setZoomed,
        timeIntervalKey,
    } = useMetricChartControls();

    const { data: master } = useMaster();
    const valueKey = Object.keys(master?.metrics?.[metric_id]?.units ?? {}).find(key => key !== "usd" && key !== "eth");
    

    const suffix = master?.metrics?.[metric_id]?.units?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.suffix;
    const prefix = master?.metrics?.[metric_id]?.units?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.prefix;
    const decimals = master?.metrics?.[metric_id]?.units?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.decimals_tooltip;
    const gweiOverrides = decimals && decimals > 6;
    const [focusEnabled] = useLocalStorage("focusEnabled", false);
    const metricConfig = findMetricConfig(metric);


    const pageData = metricConfig?.page ?? {
        title: metricConfig?.label ?? "",
        description: "",
        icon: "",
      };

    const shouldDisableStacking = useMemo(() => {
        if (!master || !metric_id) return false;

        const metricInfoKey = Object.keys(master).find(key =>
            master[key] && typeof master[key] === 'object' && metric_id in master[key]
        );

        if (!metricInfoKey) return false;

        const metricInfo = master[metricInfoKey][metric_id];
        if (!metricInfo) return false;

        return metricInfo.all_l2s_aggregate !== 'sum';
    }, [master, metric_id]);
    

    const SourcesDisplay = useMemo(() => {
        return sources && master && sources.length > 0 ? (
            sources
                .map<ReactNode>((s) => (
                    <Link
                        key={s}
                        rel="noopener noreferrer"
                        target="_blank"
                        href={master.sources[s]?.url ?? ""}
                        className="hover:text-color-text-primary dark:hover:text-color-text-primary underline"
                    >
                        {master.sources[s]?.name ?? s}
                    </Link>
                ))
                .reduce((prev, curr) => [prev, ", ", curr])
        ) : (
            <>Unavailable</>
        );
    }, [sources, master]);

    const handleDownloadChartSnapshot = useCallback(async () => {
        if (isDownloadingChartSnapshot) return;
        const cardElement = cardRef.current;
        if (!cardElement || typeof window === "undefined") return;
        setIsDownloadingChartSnapshot(true);
        try {
            await downloadElementAsImage(cardElement, metricData?.metric_name ?? "metric");
        } finally {
            setIsDownloadingChartSnapshot(false);
        }
    }, [isDownloadingChartSnapshot, metricData?.metric_name]);

    const lastUpdatedString = useMemo(() => {

        if (!metricData?.last_updated_utc) return "N/A";

        const rawStr = metricData.last_updated_utc;
        // If no timezone info is present, treat as UTC by appending 'Z'.
        // Without this, JS parses date-time strings as local time, causing the
        // diff to go negative for users in timezones behind UTC.
        const normalizedStr = /Z$|[+-]\d{2}:\d{2}$/.test(rawStr) ? rawStr : rawStr + 'Z';
        const lastUpdatedDate = new Date(normalizedStr);
        if (Number.isNaN(lastUpdatedDate.getTime())) return "N/A";

   
        const diffMs = Math.max(Date.now() - lastUpdatedDate.getTime(), 0);
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        if (totalMinutes <= 0) return "Data updated just now";

        const totalHours = Math.floor(totalMinutes / 60);
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        const minutes = totalMinutes % 60;

        const dayLabel = `${days} ${days === 1 ? "day" : "days"}`;
        const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;
        const minuteLabel = `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

        if (days > 0) {
            return `Data updated ${dayLabel}${hours ? ` ${hourLabel}` : ""} ago`;
        }

        if (hours > 0) {
            return `Data updated ${hourLabel}${minutes ? ` ${minuteLabel}` : ""} ago`;
        }

        return `Data updated ${minuteLabel} ago`;
    }, [metricData?.last_updated_utc]);


    return (
        <GTPCardLayout
            fullBleed={false}
            contentHeight={538}
            cardRef={cardRef}
            header={
                <div className="flex items-center justify-between gap-x-[8px] pt-[4px] pr-[10px] pl-[6px] pb-[4px]">
                  <div className="flex items-center gap-x-[8px] h-full text-xxs text-color-text-primary">
                    <GTPIcon icon={`${pageData?.icon}-monochrome` as GTPIconName} className="!w-[12px] !h-[12px]" containerClassName="!h-[12px] !w-[12px]" />
                    <span className="">{metricData?.metric_name}</span>
                   
                  </div>
                  {(() => {
                    const show7dRolling = timeIntervalKey === "daily_7d_rolling";
                 
                    return (
                      <div className="flex items-center gap-x-[5px] h-full text-xxs text-color-text-secondary min-w-[200px] justify-end"
                       onMouseEnter={() => setShow7dRollingText(true)}
                       onMouseLeave={() => setShow7dRollingText(false)}
                      >
                        <GTPIcon
                          icon="gtp-realtime"
                          className="!w-[12px] !h-[12px] text-color-text-primary"
                          containerClassName="!w-[12px] !h-[12px]"
                        />
                        <div className="text-xxs relative text-color-text-primary   group   transition-opacity ">
                            <span className={` whitespace-nowrap `}>{show7dRolling && !show7dRollingText ? "7-day rolling average" :  lastUpdatedString}</span>

                        </div>
                        <GTPTooltipNew
                            placement="left"
                            allowInteract={true}
                            
                            containerClass="z-[99]"
                            trigger={
                            <div className="size-[12px]">
                                <Icon icon="feather:info" className="size-[12px]"  />
                            </div>
                            }
                        >
                            <div className="text-xxs flex items-center gap-x-[5px] relative text-color-text-primary pl-[15px] w-[100px]  group   transition-opacity ">
                              Sources: <span className="text-color-text-primary">{SourcesDisplay}</span>
                            </div>
                        </GTPTooltipNew>
                        
                      </div>
                    );
                  })()}
                </div>
              }

            
            topBar={
                <GTPButtonContainer className=" ">
                    <GTPButtonRow>
                    {timeIntervals.map((interval) => (
                        <GTPButton
                            key={interval}
                            label={interval.charAt(0).toUpperCase() + interval.slice(1)}
                            innerStyle={{ width: "100%" }}
                            className="w-full justify-center"
                            variant="primary"
                            size={"sm"}
                          
                            clickHandler={() => {
                                if (selectedTimeInterval === interval) return;
                                if (interval === "hourly") {
                                    setSelectedTimespan("7d");
                                } else if (interval === "daily") {
                                    if (["24h", "3d", "7d"].includes(selectedTimespan)) {
                                        setSelectedTimespan("90d");
                                    } else if(["12w"].includes(selectedTimespan)) {
                                        setSelectedTimespan("90d");
                                    } else if (["6m", "24m"].includes(selectedTimespan)) {
                                        setSelectedTimespan("180d");
                                    } else if (["12m", "52w"].includes(selectedTimespan)) {
                                        setSelectedTimespan("365d");
                                    } else if (["maxM", "maxW"].includes(selectedTimespan)) {
                                        setSelectedTimespan("max");
                                    } else {
                                        const closestTimespan = Object.keys(timespans)
                                            .filter((timespan) =>
                                                ["90d", "180d", "365d", "max"].includes(timespan),
                                            )
                                            .reduce((prev, curr) =>
                                                Math.abs(
                                                    timespans[curr].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                ) <
                                                Math.abs(
                                                    timespans[prev].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                )
                                                    ? curr
                                                    : prev,
                                            );
                                        setSelectedTimespan(closestTimespan);
                                    }
                                } else if (interval === "weekly") {
                                    if (["24h", "3d", "7d"].includes(selectedTimespan)) {
                                        setSelectedTimespan("12w");
                                    } else if(["90d"].includes(selectedTimespan)) {
                                        setSelectedTimespan("12w");
                                    } else if(["365d", "12m"].includes(selectedTimespan)) {
                                        setSelectedTimespan("52w");
                                    } else if (["180d", "6m"].includes(selectedTimespan)) {
                                        setSelectedTimespan("24w");
                                    } else if (["max", "maxM"].includes(selectedTimespan)) {
                                        setSelectedTimespan("maxW");
                                    } else {
                                        const closestTimespan = Object.keys(timespans)
                                            .filter((timespan) =>
                                                ["12w", "24w", "52w", "maxW"].includes(timespan),
                                            )
                                            .reduce((prev, curr) =>
                                                Math.abs(
                                                    timespans[curr].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                ) <
                                                Math.abs(
                                                    timespans[prev].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                )
                                                    ? curr
                                                    : prev,
                                            );
                                        setSelectedTimespan(closestTimespan);
                                    }
                                } else {
                                    if (["24h", "3d", "7d"].includes(selectedTimespan)) {
                                        setSelectedTimespan("6m");
                                    } else if (["365d", "52w"].includes(selectedTimespan)) {
                                        setSelectedTimespan("12m");
                                    } else if ("180d" === selectedTimespan || "24w" === selectedTimespan) {
                                        setSelectedTimespan("6m");
                                    } else if ("max" === selectedTimespan || "maxW" === selectedTimespan) {
                                        setSelectedTimespan("maxM");
                                    } else {
                                        const closestTimespan = Object.keys(timespans)
                                            .filter((timespan) =>
                                                ["6m", "12m", "maxM"].includes(timespan),
                                            )
                                            .reduce((prev, curr) =>
                                                Math.abs(
                                                    timespans[curr].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                ) <
                                                Math.abs(
                                                    timespans[prev].xMax -
                                                    timespans[selectedTimespan].xMax,
                                                )
                                                    ? curr
                                                    : prev,
                                            );
                                        setSelectedTimespan(closestTimespan);
                                    }
                                }
                                setSelectedTimeInterval(interval);
                                setZoomed(false);
                            }}
                            isSelected={selectedTimeInterval === interval}
                        />
                    ))}
                    </GTPButtonRow>
                    <GTPButtonRow>
                        
                        {!selectedRange ? (
                            Object.keys(timespans)
                                .filter((timespan) =>
                                    selectedTimeInterval === "hourly"
                                        ? ["24h", "3d", "7d"].includes(timespan)
                                        : selectedTimeInterval === "daily"
                                          ? ["90d", "180d", "365d", "max"].includes(timespan)
                                          : selectedTimeInterval === "weekly"
                                            ? ["12w", "24w", "52w", "maxW"].includes(timespan)
                                            : ["6m", "12m", "maxM"].includes(timespan),
                                )
                                .map((timespan) => (
                                    <GTPButton
                                        key={timespan}
                                        label={timespans[timespan].label}
                                        innerStyle={{ width: "100%" }}
                                        className="w-full justify-center"
                                        variant="primary"
                                        size={"sm"}
                                        clickHandler={() => {
                                            setSelectedTimespan(timespan);
                                            setZoomed(false);
                                        }}
                                        isSelected={selectedTimespan === timespan}
                                    />
                                ))
                        ) : (
                            <div className="flex items-center gap-x-[8px]">
                            <GTPButton
                                label={selectedRange ? "Reset Zoom" : undefined}
                                leftIcon={"feather:zoom-out" as GTPIconName}
                                leftIconClassname="text-color-text-primary"
                                size={"sm"}
                                className="block"
                                variant="highlight"
                                visualState="default"
                                clickHandler={() => setSelectedRange(null)}
                            />
                            <GTPButton
                                label={(() => {
                                    const dateLabel = new Intl.DateTimeFormat("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "UTC",
                                    }).format(selectedRange[0]);

                                    const dateLabel2 = new Intl.DateTimeFormat("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "UTC",
                                    }).format(selectedRange[1]);
                                    return ` ${dateLabel} - ${dateLabel2}`;
                                })()}
                                size={"sm"}
                                className="block"
                                variant="primary"
                                visualState="active"
                        
                            />
                            </div>
                        )}
                    </GTPButtonRow>
                </GTPButtonContainer>
            }
            bottomBar={
                <GTPButtonContainer className="gap-x-[5px]" style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap" }}>
                    
                    <GTPButtonRow style={{ width: "auto"}}>
                        {!splitRows && (
                        <GTPButton
                            label={!collapseTable ? undefined : "Open Table"}
                            leftIcon={!collapseTable ? "gtp-side-close-monochrome" : "gtp-side-open-monochrome"}
                            size={"sm"}
                            variant={!collapseTable ? "no-background" : "highlight"}
                            visualState="default"
                            clickHandler={() => setCollapseTable(!collapseTable)}
                        />
                        )}
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
                            clickHandler={handleDownloadChartSnapshot}
                        />
                     
                    </GTPButtonRow>
                   
                   <div className="flex items-center gap-x-[8px] h-full text-xxs text-color-text-secondary justify-end w-full">
                    <GTPButtonRow>
                        <GTPButton
                            label="Absolute"
                            variant="primary"
                            size={"sm"}
                            isSelected={selectedScale === "absolute"}
                            clickHandler={() => setSelectedScale("absolute")}
                            innerStyle={{ width: "100%" }}
                            className="w-full justify-center"
                        />
                        {!shouldDisableStacking && (
                            <>
                                <GTPButton
                                    label="Stacked"
                                    variant="primary"
                                    size={"sm"}
                                    isSelected={selectedScale === "stacked"}
                                    disabled={metric_id === "txcosts"}
                                    clickHandler={() => setSelectedScale("stacked")}
                                    innerStyle={{ width: "100%", }}
                                    className="w-full justify-center"
                                />
                                <GTPButton
                                    label="Percentage"
                                    variant="primary"
                                    size={"sm"}
                                    isSelected={selectedScale === "percentage"}
                                    clickHandler={() => setSelectedScale("percentage")}
                                    innerStyle={{ width: "100%" }}
                                    className="w-full justify-center"
                                />
                            </>
                        )}
                    </GTPButtonRow>

                    </div>

                    
                </GTPButtonContainer>
            }
        >
            <GTPSplitPane
                leftCollapsed={collapseTable}
                maxLeftPanePercent={50}
                divider={({ onDragStart, isMobile: isMobileLayout }) =>
                    !isMobileLayout && !collapseTable ? (
                      <GTPResizeDivider
                        onDragStart={onDragStart}
                        showScrollbar
                        scrollMetrics={scrollMetrics}
                        scrollTargetRef={scrollRef}
                      />
                    ) : null
                  }

                leftClassName="!pb-0 "
                left={
                    <div className={`relative h-full min-h-0 w-full min-w-[160px]  rounded-[14px] overflow-hidden ${collapseTable ? "hidden" : "block"}`}>
                        <MetricTable
                            metric_type="fundamentals"
                            scrollRef={scrollRef}
                            onScrollMetricsChange={setScrollMetrics}
                        />
                    </div>
                }
                right={
                    <div className=" w-full h-full items-center justify-center">
                        <MetricChart collapseTable={collapseTable} selectedRange={selectedRange} setSelectedRange={setSelectedRange} metric_type="fundamentals" suffix={gweiOverrides ? " Gwei" : suffix ?? undefined} prefix={prefix ?? undefined} decimals={gweiOverrides ? decimals - 6 : decimals ?? undefined} />
                    </div>
                }
            />
        </GTPCardLayout>
    );
}
