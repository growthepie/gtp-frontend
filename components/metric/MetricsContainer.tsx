"use client";
import { useMemo, ReactNode, useRef, useCallback, useEffect } from "react";
import { GTPButton } from "../GTPComponents/ButtonComponents/GTPButton";
import GTPButtonContainer from "../GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "../GTPComponents/ButtonComponents/GTPButtonRow";
import GTPCardLayout from "../GTPComponents/GTPLayout/GTPCardLayout";
import GTPSplitPane from "../GTPComponents/GTPLayout/GTPSplitPane";
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
import GTPButtonDropdown from "../GTPComponents/ButtonComponents/GTPButtonDropdown";
import GTPResizeDivider from "../GTPComponents/GTPLayout/GTPResizeDivider";
import { GTPScrollPaneScrollMetrics } from "../GTPComponents/GTPLayout/GTPScrollPane";
import { downloadElementAsImage, prewarmSnapshotFonts } from "../GTPComponents/chartSnapshotHelpers";
import LoadingSpinnerIcon from "../GTPComponents/LoadingSpinnerIcon";
import { useIsSafari } from "@/hooks/useIsSafari";
import { GTPIcon } from "../layout/GTPIcon";
import { findMetricConfig } from "@/lib/fundamentals/seo";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from "@iconify/react";
import { GTPTooltipNew } from "../tooltip/GTPTooltip";
import { metricItems } from "@/lib/metrics";

const escapeCsvCell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
};

const slugifyFilenamePart = (value: string | undefined) =>
    (value ?? "metric")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "metric";

export default function MetricsContainer({ metric }: { metric: string }) {
    const isMobile = useMediaQuery("(max-width: 967px)");
    const splitRows = useMediaQuery("(max-width: 967px)");
    // The chart screenshot doesn't render correctly on Safari/iOS WebKit, so hide the
    // Take Screenshot button there (it's simply not rendered, so the row closes up — no gap).
    const isSafari = useIsSafari();
    const [collapseTable, setCollapseTable] = useState(false);
    // Tracks the split pane's *actual* stacked layout (content-width based), so the
    // chart's reserved legend footer is dropped whenever the bottom bar sits in-flow
    // below the chart — including the band where a wide viewport is narrowed by the
    // sidebar enough to stack, but the viewport media query still reads "desktop".
    const [isChartStacked, setIsChartStacked] = useState(false);
    const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
    const [isDownloadingChartSnapshot, setIsDownloadingChartSnapshot] = useState(false);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    // Card width (≈ the stacked bottom bar width on mobile), used to decide whether the
    // two-row bottom bar has room to show the left controls' labels instead of icons.
    const [cardWidth, setCardWidth] = useState(0);
    // Off-screen always-labelled replica of the left controls, measured so labels only
    // show when they actually fit (accounting for the button text containers' padding).
    const bottomLeftMeasureRef = useRef<HTMLDivElement | null>(null);
    const [bottomLeftLabelledWidth, setBottomLeftLabelledWidth] = useState(0);
    const [scrollMetrics, setScrollMetrics] = useState<GTPScrollPaneScrollMetrics | undefined>();
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const [show7dRollingText, setShow7dRollingText] = useState(false);
    const [selectedRange, setSelectedRange] = useState<[number, number] | null>(null);

    // Warm the screenshot font-embed cache during idle time so the first "Take Screenshot"
    // click is fast, without competing with page load.
    useEffect(() => prewarmSnapshotFonts(), []);

    useEffect(() => {
        const cardElement = cardRef.current;
        if (!cardElement) return;
        const sync = () => setCardWidth(cardElement.getBoundingClientRect().width);
        sync();
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) setCardWidth(entry.contentRect.width);
        });
        observer.observe(cardElement);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const measureElement = bottomLeftMeasureRef.current;
        if (!measureElement) return;
        const sync = () => {
            const setElement = measureElement.firstElementChild;
            const buttons = setElement ? Array.from(setElement.children) : [];
            if (buttons.length === 0) {
                setBottomLeftLabelledWidth(0);
                return;
            }
            const widths = buttons.map((button) => (button as HTMLElement).getBoundingClientRect().width);
            // The first button (table toggle) takes a fixed 40px when the table is shown
            // (icon), but its full natural width when hidden ("Open Table" is shown in full
            // and never shrinks). The rest are equal width and must each be at least as wide
            // as the widest of them. Add the inter-button gaps (gap-[2px]) and padding.
            const tableWidth = collapseTable ? (widths[0] ?? 0) : 40;
            const otherWidths = widths.slice(1);
            const widestOther = otherWidths.length > 0 ? Math.max(...otherWidths) : 0;
            setBottomLeftLabelledWidth(tableWidth + widestOther * otherWidths.length + (buttons.length - 1) * 2 + 4);
        };
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(measureElement);
        return () => observer.disconnect();
    }, [collapseTable]);
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
        selectedChains,
        selectedTimeInterval,
        setSelectedTimeInterval,
        selectedTimespan,
        setSelectedTimespan,
        setZoomed,
        timeIntervalKey,
    } = useMetricChartControls();

    const { data: master } = useMaster();
    const metricUnits = master?.metrics?.[metric_id]?.units ?? {};
    const valueKey = Object.keys(metricUnits).find(key => key !== "usd" && key !== "eth");
    const hasCurrencyUnits = "usd" in metricUnits || "eth" in metricUnits;
    const showGwei = Boolean(metricItems.find((item) => item.key === metric_id)?.page?.showGwei);
    

    const suffix = metricUnits?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.suffix;
    const prefix = metricUnits?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.prefix;
    const decimals = metricUnits?.[valueKey ? "value" : showUsd ? "usd" : "eth"]?.decimals_tooltip;
    const gweiOverrides = decimals && decimals > 6;
    const [focusEnabled] = useLocalStorage("focusEnabled", false);
    const [topIsWrapping, setTopIsWrapping] = useState(false);
    const [bottomIsWrapping, setBottomIsWrapping] = useState(false);
    const metricConfig = findMetricConfig(metric);

    // When the bottom bar is stacked into two rows on mobile (so the left controls row
    // spans the full width) show the Share / Screenshot / Download buttons expanded — but
    // only when the measured labelled width actually fits, so the rightmost button is
    // never cut off. cardWidth slightly over-states the bottom bar width, hence the
    // small buffer.
    const showBottomLeftLabels =
        isMobile && bottomLeftLabelledWidth > 0 && cardWidth >= bottomLeftLabelledWidth + 16;
    const bottomLeftLabelDisplay = showBottomLeftLabels ? "always" : "hover";
    // When the table is hidden on a small screen, the "Open Table" button is the priority:
    // it always shows its full label (shrink-0, never capped/clipped). The other buttons
    // split the leftover room — and the measurement reserves the table's full width when
    // collapsed, so they only keep their labels if they still fit, otherwise icons.
    const tableHiddenOnSmall = isMobile && collapseTable;
    // When shown + expanded, the table toggle stays compact (40px icon); the remaining
    // buttons are equal width and split the leftover room with their content centred.
    const bottomLeftTableExpandClassName = tableHiddenOnSmall
        ? "shrink-0"
        : showBottomLeftLabels
            ? "w-[40px] overflow-hidden"
            : undefined;
    const bottomLeftExpandClassName = showBottomLeftLabels ? "flex-1 justify-center" : undefined;
    const bottomLeftInnerButtonClassName = showBottomLeftLabels ? "w-full justify-center" : undefined;
    const bottomLeftExpandInnerStyle = showBottomLeftLabels ? ({ width: "100%" } as const) : undefined;
    const bottomLeftTableExpandInnerStyle = tableHiddenOnSmall ? undefined : bottomLeftExpandInnerStyle;


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

    const handleDownloadSelectedChartData = useCallback(() => {
        if (!metricData || typeof window === "undefined") return;

        const activeTimespan = timespans[selectedTimespan] ?? timespans.max;
        const xMin = selectedRange ? selectedRange[0] : activeTimespan?.xMin;
        const xMax = selectedRange ? selectedRange[1] : activeTimespan?.xMax;

        const visibleChainKeys = chainKeys.filter((chainKey) => {
            if (!selectedChains.includes(chainKey)) return false;
            if (chainKey !== "ethereum") return true;
            if (!focusEnabled) return true;
            return showEthereumMainnet;
        });

        const seriesRows = visibleChainKeys
            .map((chainKey) => {
                const intervalData = metricData.chains[chainKey]?.[timeIntervalKey];
                if (!intervalData) return null;

                const valueTypes = intervalData.types ?? [];
                const usdIdx = valueTypes.indexOf("usd");
                const ethIdx = valueTypes.indexOf("eth");
                let valueIndex = valueTypes.length > 1 ? 1 : 0;

                if (usdIdx !== -1 && ethIdx !== -1) {
                    valueIndex = showUsd ? usdIdx : ethIdx;
                }

                const multiplier = !showUsd && showGwei && ethIdx !== -1 ? 1_000_000_000 : 1;
                const valuesByTimestamp = new Map<number, number | null>();

                (intervalData.data ?? []).forEach((row) => {
                    const timestamp = row[0];
                    if (typeof xMin === "number" && timestamp < xMin) return;
                    if (typeof xMax === "number" && timestamp > xMax) return;

                    const rawValue = row[valueIndex];
                    valuesByTimestamp.set(
                        timestamp,
                        typeof rawValue === "number" && Number.isFinite(rawValue)
                            ? rawValue * multiplier
                            : null,
                    );
                });

                return {
                    chainKey,
                    chainName: master?.chains?.[chainKey]?.name ?? metricData.chains[chainKey]?.chain_name ?? chainKey,
                    valuesByTimestamp,
                };
            })
            .filter((item): item is {
                chainKey: string;
                chainName: string;
                valuesByTimestamp: Map<number, number | null>;
            } => Boolean(item));

        if (seriesRows.length === 0) return;

        const timestamps = Array.from(
            new Set(seriesRows.flatMap((series) => Array.from(series.valuesByTimestamp.keys()))),
        ).sort((a, b) => a - b);

        if (timestamps.length === 0) return;

        const unitLabel = selectedScale === "percentage"
            ? "percent"
            : showUsd
            ? "usd"
            : showGwei
              ? "gwei"
              : valueKey ?? "eth";

        const headers = [
            "timestamp",
            "datetime_utc",
            "metric_id",
            "metric_name",
            "time_interval",
            "scale",
            ...(hasCurrencyUnits ? ["unit"] : []),
            ...seriesRows.map((series) => series.chainName),
        ];

        const rows = timestamps.map((timestamp) => {
            const values = seriesRows.map((series) => series.valuesByTimestamp.get(timestamp) ?? null);
            const displayedValues = selectedScale === "percentage"
                ? values.map((value) => {
                    if (typeof value !== "number" || !Number.isFinite(value)) return null;
                    const total = values.reduce<number>(
                        (sum, item) => typeof item === "number" && Number.isFinite(item) ? sum + item : sum,
                        0,
                    );
                    return total > 0 ? (value / total) * 100 : null;
                })
                : values;

            return [
                timestamp,
                new Date(timestamp).toISOString(),
                metricData.metric_id,
                metricData.metric_name,
                timeIntervalKey,
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
        anchor.download = `growthepie-${slugifyFilenamePart(metricData.metric_id)}-${timeIntervalKey}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    }, [
        chainKeys,
        focusEnabled,
        master?.chains,
        metricData,
        selectedChains,
        selectedRange,
        selectedScale,
        selectedTimespan,
        showEthereumMainnet,
        showGwei,
        showUsd,
        timeIntervalKey,
        timespans,
        valueKey,
        hasCurrencyUnits,
    ]);

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
        <>
        {/* Off-screen, always-labelled replica of the bottom-bar left controls, used only
            to measure the width the expanded row needs (see showBottomLeftLabels). */}
        <div
            ref={bottomLeftMeasureRef}
            aria-hidden
            className="pointer-events-none invisible absolute top-0 left-0 -z-50"
        >
            <GTPButtonRow>
                <GTPButton
                    label={!collapseTable ? undefined : "Open Table"}
                    leftIcon={!collapseTable ? "gtp-side-close-monochrome" : "gtp-side-open-monochrome"}
                    size={"sm"}
                    variant={!collapseTable ? "no-background" : "highlight"}
                    labelDisplay="always"
                />
                <GTPButton label="Share" leftIcon="gtp-share-monochrome" size={"sm"} variant="no-background" labelDisplay="always" />
                {!isSafari && <GTPButton label="Take Screenshot" leftIcon="gtp-png-monochrome" size={"sm"} variant="no-background" labelDisplay="always" />}
                <GTPButton label="Download Data" leftIcon="gtp-download-monochrome" size={"sm"} variant="no-background" labelDisplay="always" />
            </GTPButtonRow>
        </div>
        <GTPCardLayout
            fullBleed={false}
            contentHeight={538}
            mobileBreakpoint={967}
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
                <GTPButtonContainer className=" " isWrapping={topIsWrapping} setIsWrapping={setTopIsWrapping}>
                    <GTPButtonRow style={{width: isMobile ? "100%" : "auto"}}>
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
                    <GTPButtonRow style={{width: isMobile ? "100%" : "auto"}}>
                        
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
                <GTPButtonContainer className="gap-x-[5px] " isWrapping={bottomIsWrapping} setIsWrapping={setBottomIsWrapping}>
                    
                    <GTPButtonRow style={{ width: isMobile ? "100%" : "auto"}}>

                        <GTPButton
                            label={!collapseTable ? undefined : "Open Table"}
                            leftIcon={!collapseTable ? "gtp-side-close-monochrome" : "gtp-side-open-monochrome"}
                            size={"sm"}
                            variant={!collapseTable ? "no-background" : "highlight"}
                            visualState="default"
                            className={bottomLeftTableExpandClassName}
                            innerStyle={bottomLeftTableExpandInnerStyle}
                            clickHandler={() => setCollapseTable(!collapseTable)}
                        />

                        <GTPButtonDropdown
                            openDirection="top"
                            matchTriggerWidthToDropdown={!showBottomLeftLabels}
                            className={bottomLeftExpandClassName}
                            buttonProps={{
                                label: "Share",
                                labelDisplay: bottomLeftLabelDisplay,
                                leftIcon: "gtp-share-monochrome",
                                size: "sm",
                                variant: "no-background",
                                className: bottomLeftInnerButtonClassName,
                                innerStyle: bottomLeftExpandInnerStyle,
                            }}
                            isOpen={isSharePopoverOpen}
                            onOpenChange={setIsSharePopoverOpen}
                            dropdownContent={<ShareDropdownContent onClose={() => setIsSharePopoverOpen(false)} />}
                        />

                        {!isSafari && (
                        <GTPButton
                            leftIcon="gtp-png-monochrome"
                            leftIconOverride={isDownloadingChartSnapshot ? <LoadingSpinnerIcon /> : undefined}
                            label="Take Screenshot"
                            labelDisplay={bottomLeftLabelDisplay}
                            size={"sm"}
                            variant="no-background"
                            className={bottomLeftExpandClassName}
                            innerStyle={bottomLeftExpandInnerStyle}
                            visualState={isDownloadingChartSnapshot ? "disabled" : "default"}
                            disabled={isDownloadingChartSnapshot}
                            clickHandler={handleDownloadChartSnapshot}
                        />
                        )}
                        <GTPButton
                            leftIcon="gtp-download-monochrome"
                            label="Download Data"
                            labelDisplay={bottomLeftLabelDisplay}
                            size={"sm"}
                            variant="no-background"
                            className={bottomLeftExpandClassName}
                            innerStyle={bottomLeftExpandInnerStyle}
                            visualState={!metricData ? "disabled" : "default"}
                            disabled={!metricData}
                            clickHandler={handleDownloadSelectedChartData}
                        />
                     
                    </GTPButtonRow>
                   
                   <div className="flex items-center gap-x-[8px] h-full text-xxs text-color-text-secondary justify-end" style={{ width: isMobile ? "100%" : "auto" }}>
                    <GTPButtonRow style={{width: isMobile ? "100%" : "auto"}}>
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
                mobileBreakpoint={967}
                onLayoutChange={setIsChartStacked}
                divider={({ onDragStart, isMobile: isMobileLayout }) =>
                    !isMobile ? (
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
                    <div className="relative h-full min-h-0 w-full min-w-[160px]  rounded-[14px] overflow-hidden block">
                        <MetricTable
                            metric_type="fundamentals"
                            scrollRef={scrollRef}
                            onScrollMetricsChange={setScrollMetrics}
                        />
                    </div>
                }
                right={
                    <div className=" w-full h-full items-center justify-center">
                        <MetricChart collapseTable={collapseTable} isStacked={isChartStacked} selectedRange={selectedRange} setSelectedRange={setSelectedRange} metric_type="fundamentals" suffix={gweiOverrides ? " Gwei" : suffix ?? undefined} prefix={prefix ?? undefined} decimals={gweiOverrides ? decimals - 6 : decimals ?? undefined} />
                    </div>
                }
            />
        </GTPCardLayout>
        </>
    );
}
