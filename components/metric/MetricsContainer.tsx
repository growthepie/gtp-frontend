"use client";
import { useMemo, ReactNode } from "react";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPButtonContainer from "../GTPButton/GTPButtonContainer";
import GTPButtonRow from "../GTPButton/GTPButtonRow";
import GTPCardLayout from "../GTPButton/GTPCardLayout";
import GTPSplitPane from "../GTPButton/GTPSplitPane";
import { useMediaQuery } from "@react-hook/media-query";
import { useMetricData } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useLocalStorage } from "usehooks-ts";
import { useMaster } from "@/contexts/MasterContext";
import { Switch } from "@/components/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import Link from "next/link";
import { Sources } from "@/lib/datasources";
import MetricTable from "./MetricTable";
import MetricChart from "./MetricChart";

export default function MetricsContainer({ metric }: { metric: string }) {
    const isMobile = useMediaQuery("(max-width: 767px)");

    const {
        timespans,
        timeIntervals,
        sources,
        metric_id,
        chainKeys,
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
    } = useMetricChartControls();

    const { data: master } = useMaster();
    const [focusEnabled] = useLocalStorage("focusEnabled", false);

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
        return sources && sources.length > 0 ? (
            sources
                .map<ReactNode>((s) => (
                    <Link
                        key={s}
                        rel="noopener noreferrer"
                        target="_blank"
                        href={Sources[s] ?? ""}
                        className="hover:text-color-text-primary dark:hover:text-color-text-primary underline"
                    >
                        {s}
                    </Link>
                ))
                .reduce((prev, curr) => [prev, ", ", curr])
        ) : (
            <>Unavailable</>
        );
    }, [sources]);

    return (
        <GTPCardLayout
            fullBleed={false}
            contentHeight={538}
            topBar={
                <GTPButtonContainer className="mt-[2px]">
                    <GTPButtonRow>
                    {timeIntervals.map((interval) => (
                        <GTPButton
                            key={interval}
                            label={interval.charAt(0).toUpperCase() + interval.slice(1)}
                            variant="primary"
                            size={isMobile ? "xs" : "sm"}
                            clickHandler={() => {
                                if (selectedTimeInterval === interval) return;
                                if (interval === "daily") {
                                    if(["12w"].includes(selectedTimespan)) {
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
                                    if(["90d"].includes(selectedTimespan)) {
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
                                    if (["365d", "52w"].includes(selectedTimespan)) {
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
                        {Object.keys(timespans)
                            .filter((timespan) =>
                                selectedTimeInterval === "daily"
                                    ? ["90d", "180d", "365d", "max"].includes(timespan)
                                    : selectedTimeInterval === "weekly"
                                    ? ["12w", "24w", "52w", "maxW"].includes(timespan)
                                    : ["6m", "12m", "maxM"].includes(timespan))
                            .map((timespan) => (
                            <GTPButton
                                key={timespan}
                                label={timespans[timespan].label}
                                variant="primary"
                                size={isMobile ? "xs" : "sm"}
                                clickHandler={() => {
                                    setSelectedTimespan(timespan);
                                    setZoomed(false);
                                }}
                                isSelected={selectedTimespan === timespan}
                            />
                        ))}
                    </GTPButtonRow>
                </GTPButtonContainer>
            }
            bottomBar={
                <GTPButtonContainer>
                    {chainKeys.includes("ethereum") && focusEnabled && (
                        <div className="flex items-center gap-2 px-2">
                            <Switch
                                checked={showEthereumMainnet}
                                onChange={() => setShowEthereumMainnet(!showEthereumMainnet)}
                            />
                            <span className="hidden xl:block text-sm font-medium">
                                Compare Ethereum Mainnet
                            </span>
                            <span className="hidden md:block xl:hidden text-sm font-medium">
                                Compare ETH
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-[3px] ml-auto">
                        <GTPButtonRow>
                            <GTPButton
                                label="Absolute"
                                variant="primary"
                                size={isMobile ? "xs" : "sm"}
                                isSelected={selectedScale === "absolute"}
                                clickHandler={() => setSelectedScale("absolute")}
                            />
                            {!shouldDisableStacking && (
                                <>
                                    <GTPButton
                                        label="Stacked"
                                        variant="primary"
                                        size={isMobile ? "xs" : "sm"}
                                        isSelected={selectedScale === "stacked"}
                                        disabled={metric_id === "txcosts"}
                                        clickHandler={() => setSelectedScale("stacked")}
                                    />
                                    <GTPButton
                                        label="Percentage"
                                        variant="primary"
                                        size={isMobile ? "xs" : "sm"}
                                        isSelected={selectedScale === "percentage"}
                                        clickHandler={() => setSelectedScale("percentage")}
                                    />
                                </>
                            )}
                        </GTPButtonRow>

                    </div>
                </GTPButtonContainer>
            }
        >
            <GTPSplitPane
                left={
                    <div className="relative h-full min-h-0 w-full min-w-[160px] rounded-[14px] overflow-hidden">
                        <MetricTable metric_type="fundamentals" />
                    </div>
                }
                right={
                <div className="w-full h-full flex items-center justify-center">
                    <MetricChart metric_type="fundamentals" />
                </div>
                }
            />
        </GTPCardLayout>
    );
}
