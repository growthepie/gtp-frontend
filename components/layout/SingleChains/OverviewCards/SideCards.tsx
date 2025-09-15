"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useSSEChains } from "../useSSEChains";
import TPSChartCard from "./TPSChartCard";
import TXCostCard from "./TXCostCard";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import moment from "moment";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Icon } from "@iconify/react";
import HighlightCards from "./HighlightCards";
import { ChainOverview } from "@/lib/chains";
import MetricCards from "./MetricCards";


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


const PartitionLine = ({ title, infoContent }: { title: string, infoContent: string }) => {
    return (
        <div className="w-full flex items-center gap-x-[5px] h-[14px] max-w-[483px] px-[10px] text-[#5A6462]">
            <div 
                className="w-full h-[1px]" 
                style={{
                    backgroundImage: `linear-gradient(to right, #344240 50%, transparent 50%)`,
                    backgroundSize: '4px 1px',
                    backgroundRepeat: 'repeat-x'
                }}
            />
            <div className="heading-large-xxs  whitespace-nowrap pr-[5px]">{title}</div>
            <Tooltip placement="bottom">
                <TooltipTrigger>
                    <Icon icon="feather:info" className="w-[15px] h-[15px]" />
                </TooltipTrigger>
                <TooltipContent className="z-[99]">
                    <div className="px-[15px]">{infoContent}</div>
                </TooltipContent>
            </Tooltip>
        </div>
    )
}

export default function LiveCards({ chainKey, chainData, master }: { chainKey: string, chainData: any, master: any }) {

    const [tpsHistory, setTpsHistory] = useState<any[]>([]);
    const { data: initialHistory } = useSWR<any>(`https://sse.growthepie.com/api/chain/${chainKey}/history`);
    const {chainData: chainDataTPS, lastUpdated} = useSSEChains(chainKey);
    const { data: chainDataOverview } = useSWR<ChainOverview>(`https://api.growthepie.xyz/v1/chains/${chainKey}/overview.json`);
 


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


    
 
   
  if(!chainDataTPS || !chainDataOverview) return null;
    return (
        <>
            <PartitionLine title="Highlight" infoContent="The number of transactions processed per second on the chain." />
            <HighlightCards metric="Total Value Locked" icon="gtp-metrics-totalvaluelocked" value={"24.41B"} percentage={"20%"} chainKey={chainKey} />
            <PartitionLine title="Realtime" infoContent="The number of transactions processed per second on the chain." />
            <TPSChartCard initialHistory={initialHistory} tpsHistory={tpsHistory} chainData={chainDataTPS} chainKey={chainKey} master={master} />
            <TXCostCard chainKey={chainKey} chainData={chainDataTPS} master={master} />
            <PartitionLine title="Yesterday" infoContent="The number of transactions processed per second on the chain." />
            {Object.keys(chainDataOverview.data.kpi_cards || {}).map((metric) => (
                <div key={metric}>
                    <MetricCards chainKey={chainKey} master={master} metricKey={metric} metricData={master.metrics[metric]} overviewData={chainDataOverview} />
                </div>
            ))}
    
        </>
    )
}