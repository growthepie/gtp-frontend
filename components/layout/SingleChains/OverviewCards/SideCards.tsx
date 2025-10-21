"use client";
import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import { useSSEChains } from "../useSSEChains";
import TPSChartCard from "./TPSChartCard";
import TXCostCard from "./TXCostCard";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import moment from "moment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Icon } from "@iconify/react";
import HighlightCards from "./HighlightCards";
import MetricCards from "./MetricCards";
import EventsCard from "./EventsCard";
import { EventItem } from "./EventsCard";
import { EthereumEvents } from "@/types/api/MasterResponse";
import { GTPTooltipNew, TooltipBody } from "@/components/tooltip/GTPTooltip";
import { isMobile } from "react-device-detect";
import { ChainOverview } from "@/lib/chains";



export interface ChainTPSHistoryItem {
    "24h_high": number;
    "24h_high_timestamp": string;
    ath: number;
    ath_timestamp: string;
    chain_name: string; 
    display_name: string;
    timestamp: string;
    tps: number; 
    tx_cost_avg: number;
    tx_cost_avg_usd: number;
    tx_cost_erc20_transfer: number;
    tx_cost_erc20_transfer_usd: number;
    tx_cost_median: number;
    tx_cost_median_usd: number;
    tx_cost_swap: number;
    tx_cost_swap_usd: number;
} 

interface HistoryArrayItem {
    tps: number;
    timestamp: string;
    timestamp_ms: number;
}


const PartitionLine = ({ title, infoContent, leftIcon }: { title?: string, infoContent?: string, leftIcon?: string }) => {
    return (
        <div className={`flex items-center gap-x-[10px] w-full px-[10px] text-[#5A6462] ${title ? "h-fit" : "h-[0px] overflow-y-visible"}`}>
            {leftIcon && (
                <GTPIcon icon={leftIcon as GTPIconName} size="md" containerClassName="!size-[28px] flex items-center justify-center" />
            )}
            <div 
                className="w-full h-[1px]" 
                style={{
                    backgroundImage: `linear-gradient(to right, #344240 50%, transparent 50%)`,
                    backgroundSize: '4px 1px',
                    backgroundRepeat: 'repeat-x'
                }}
            />
            <div className="flex-1 flex items-center gap-x-[5px]">
            {title && (
                <div className="heading-large-xxs h-[17px] flex items-center whitespace-nowrap pr-[5px]">{title}</div>
            )}
            {infoContent && (
            <div className='w-[15px] h-fit z-30'>
                <GTPTooltipNew
                    placement="bottom-start"
                    size="md"
                    allowInteract={true}
                    trigger={
                        <div
                        className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'} cursor-pointer`}
                        data-tooltip-trigger
                        >
                        <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                        </div>
                    }
                    containerClass="flex flex-col gap-y-[10px]"
                    positionOffset={{ mainAxis: -20, crossAxis: 20 }}

                >
                    <div>
                        <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                        {infoContent}
                        </TooltipBody>
                    </div>
                </GTPTooltipNew>
            </div>
            )}
            </div>
        </div>
    )
}

export default function LiveCards({ chainKey, chainData, master, chainDataOverview }: { chainKey: string, chainData: any, master: any, chainDataOverview: ChainOverview }) {

    const [tpsHistory, setTpsHistory] = useState<any[]>([]);
    const { data: initialHistory } = useSWR<any>(`https://sse.growthepie.com/api/chain/${chainKey}/history`);
    const {chainData: chainDataTPS, lastUpdated} = useSSEChains(chainKey);
    const [height, setHeight] = useState<number[]>([]);





    const totalHeight = useMemo(() => { 
        return height.reduce((acc, curr) => acc + curr, 0);
    }, [height]);


    useEffect(() => {
        if (initialHistory?.history) {
        setTpsHistory([...initialHistory.history].reverse());
        }
    }, [initialHistory]);

    // 2. Append new live data points from the SSE stream to the chart's history.
    useEffect(() => {
        if (chainDataTPS?.tps && lastUpdated && tpsHistory.length > 0) {
        const newPoint: HistoryArrayItem = {
            tps: chainDataTPS.tps,
            timestamp: lastUpdated.toISOString(),
            timestamp_ms: lastUpdated.getTime(),
        };

        // Prevent adding duplicate points for the same timestamp
        if (tpsHistory[tpsHistory.length - 1]?.timestamp !== newPoint.timestamp) {
            setTpsHistory((prev) => {
            const updatedHistory = [...prev, newPoint];
            // Keep the chart performant by only showing the last ~100 data points
            return updatedHistory.slice(-100);
            });
        }
        }
    }, [chainDataTPS, lastUpdated, initialHistory]); // Note: tpsHistory is intentionally omitted from deps


    

   
    return (
        <div  className="flex flex-col w-full gap-y-[10px]">
            {chainDataOverview && Object.keys(chainDataOverview.data.highlights || {}).length > 0 && <PartitionLine title="Highlight" infoContent="The number of transactions processed per second on the chain." leftIcon={"gtp-megaphone"} />}
            {chainDataOverview && Object.keys(chainDataOverview.data.highlights || {}).map((metric, index) => (
                <HighlightCards key={chainDataOverview.data.highlights[metric].metric_id} metric={chainDataOverview.data.highlights[metric].metric_name} icon={chainDataOverview.data.highlights[metric].icon} chainKey={chainKey} chainOverviewData={chainDataOverview} metricKey={chainDataOverview.data.highlights[metric].metric_id} index={index} />
            ))}
            {chainDataTPS && <PartitionLine title="Realtime" infoContent="The number of transactions processed per second on the chain." />}
            {chainDataTPS && (
                <>
                        <TPSChartCard initialHistory={initialHistory} tpsHistory={tpsHistory} chainData={chainDataTPS} chainKey={chainKey} master={master} />
                        <TXCostCard chainKey={chainKey} chainData={chainDataTPS} master={master} overviewData={chainDataOverview} />
                </>
            )}
            {chainDataOverview && <MetricCards chainKey={chainKey} master={master} metricKey={"fdv"} metricData={master.metrics["fdv"]} overviewData={chainDataOverview} />}
            
            {chainDataOverview && <PartitionLine title="Yesterday" infoContent="The number of transactions processed per second on the chain." />}
            {chainDataOverview && Object.keys(chainDataOverview.data.kpi_cards || {}).filter((metric) => !["fdv"].includes(metric)).map((metric) => (
                <MetricCards key={metric} chainKey={chainKey} master={master} metricKey={metric} metricData={master.metrics[metric]} overviewData={chainDataOverview} />
            ))}
            <PartitionLine />
            {chainDataOverview && (
                <EventsCard totalHeight={500}>
                    {[...chainDataOverview.data.events]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((event, index) => (
                            <EventItem event={event as EthereumEvents} setHeight={setHeight} eventIndex={index} key={event.date + index} />
                        ))}
                </EventsCard>
            )}
        </div>
    )
}