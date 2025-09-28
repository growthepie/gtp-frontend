import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { useSSEChains } from "../useSSEChains";
import { TPSChart } from "../../EthAgg/TPSChart";
import { MasterResponse } from "@/types/api/MasterResponse";
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


export const TPSChartCard = ({ initialHistory, tpsHistory, chainData, chainKey, master }: { initialHistory: any, tpsHistory: any, chainData: any, chainKey: string, master: MasterResponse  }) => {
  // Ensure the chart data is properly formatted and triggers updates
  const chartData = useMemo(() => {
    return tpsHistory || [];
  }, [tpsHistory]);

  return (
    <div className="bg-color-bg-default p-[10px] rounded-[15px] w-full flex flex-col gap-y-[10px] h-4xl">
      <div className="flex gap-x-[10px] h-[28px] items-center ">
        <GTPIcon icon={"gtp-metrics-totalvaluelocked"} size="sm" />
        <div className="heading-large-xs ">Transactions Per Second</div>
      </div>
      <div className={`relative transition-height duration-500 w-full h-[54px] overflow-visible`}>
          <TPSChart 
            key={`tps-chart-${chainKey}-${chartData.length}`}
            data={chartData} 
            overrideColor={master.chains[chainKey].colors.dark} 
          />
        </div>

        <div className="flex justify-between pl-[30%] tems-center">
           <div className="flex flex-col gap-y-[2px] group">
                <div className="heading-small-xs numbers-sm">{chainData.ath?.toFixed(1)} TPS</div>
                <div className="relative min-w-[80px]">
                    <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">All-Time High</div>
                    <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["ath_timestamp"]).format("D/M/Y HH:mm UTC")}</div>
                </div>
           </div>
           <div className="flex flex-col gap-y-[2px] group ">
                <div className="heading-small-xs numbers-sm">{chainData["24h_high"]?.toFixed(1)} TPS</div>
                <div className="relative min-w-[90x]">
                    <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">24h Peak</div>
                    <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["24h_high_timestamp"]).format("D/M/Y HH:mm UTC")}</div>
                </div>
           </div>
           <div className="flex flex-col gap-y-[2px] items-end">
                <div className="flex items-center gap-x-[5px] heading-small-xs numbers-md" >
                    <div style={{ color: master.chains[chainKey].colors.dark[0] }}>{chainData.tps?.toFixed(1)} TPS</div>
                    <GTPIcon icon={"gtp-realtime"} size="sm" />
                </div>
                <div className="heading-small-xxxs text-[#5A6462]">Current TPS</div>
           </div>
        </div>
    </div>
  )
}

export default TPSChartCard;