"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useSSEChains } from "../useSSEChains";
import TPSChartCard from "./TPSChartCard";
import TXCostCard from "./TXCostCard";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import moment from "moment";


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
export default function LiveCards({ chainKey, chainData, master }: { chainKey: string, chainData: any, master: any }) {

    const [tpsHistory, setTpsHistory] = useState<any[]>([]);
    const { data: initialHistory } = useSWR<any>(`https://sse.growthepie.com/api/chain/${chainKey}/history`);
    const {chainData: chainDataTPS, lastUpdated} = useSSEChains(chainKey);


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


 
   
  if(!chainDataTPS) return null;
    return (
        <>
            <TPSChartCard initialHistory={initialHistory} tpsHistory={tpsHistory} chainData={chainDataTPS} chainKey={chainKey} master={master} />
            
        </>
    )
}