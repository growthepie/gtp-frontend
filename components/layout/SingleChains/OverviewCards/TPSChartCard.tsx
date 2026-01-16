import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { useSSEChains } from "../useSSEChains";
import { TPSChart } from "../../EthAgg/TPSChart";
import { MasterResponse } from "@/types/api/MasterResponse";
import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import moment from "moment";


 export interface ChainTPSHistoryItem {
  chain_name:                 string;
  display_name:               string;
  block_time:                 number;
  tps:                        number;
  timestamp:                  number;
  tx_cost_erc20_transfer:     number;
  tx_cost_erc20_transfer_usd: number;
  tx_cost_swap:               number;
  tx_cost_swap_usd:           number;
  tx_cost_avg:                number;
  tx_cost_avg_usd:            number;
  tx_cost_median:             number;
  tx_cost_median_usd:         number;
  last_updated:               Date;
  ath:                        number;
  ath_timestamp:              Date;
  "24h_high":                 number;
  "24h_high_timestamp":       Date;
  is_active:                  boolean;
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
  const formatTps = (value?: number) => {
    if (value == null) {
      return "N/A";
    }
    const hasDecimals = Math.abs(value) < 1000;

    return value.toLocaleString("en-US", {
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: hasDecimals ? 1 : 0,
    });
  };


  return (
    <div className="bg-color-bg-default xs:p-[10px] p-[15px] rounded-[15px] w-full flex flex-col gap-y-[10px] min-h-[146px]">
      <div className="flex gap-x-[10px] h-[28px] items-center relative ">
        <GTPIcon icon="gtp-metrics-transactionspersecond" size="sm" containerClassName="!size-[28px] relative flex items-center justify-center" />
        <div className="heading-large-xs ">Transactions Per Second</div>
      </div>
      <div className={`relative transition-height duration-500 w-full h-[54px] overflow-visible`}>
          <div className="w-full h-full xs:ml-0 -ml-[5px]">
            <TPSChart 
              key={`tps-chart-${chainKey}-${chartData.length}`}
              data={chartData} 
              overrideColor={master.chains[chainKey].colors.dark} 
              chainName={chainData.display_name}
              centerWatermark={true}
            />
          </div>
        </div>

        <div className="flex justify-between xs:pl-[45px] pl-[5px] items-center">
          <div className="flex flex-col gap-y-[10px] md:flex-row md:w-full">
            <div className="flex flex-col gap-y-[2px] group ">
                  <div className="heading-small-xs numbers-sm">{chainData.block_time ? chainData.block_time > 1 ? chainData.block_time + " s" : chainData.block_time * 1000 + " ms" : "N/A"}</div>
                  <div className="relative min-w-[80px]">
                      <div className="heading-small-xxxs text-[#5A6462]  duration-200">Block Time</div>
                  </div>
            </div>
            <div className="flex flex-col gap-y-[2px] group md:mx-auto">
                  <div className="heading-small-xs numbers-sm">{formatTps(chainData.ath)} TPS</div>
                  <div className="relative min-w-[80px]">
                      <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">All-Time High</div>
                      <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["ath_timestamp"]).format("D/M/Y HH:mm UTC")}</div>
                  </div>
            </div>
           </div>
           <div className="flex flex-col-reverse gap-y-[10px] md:flex-row md:w-full md:justify-between">
            <div className="flex flex-col gap-y-[2px] group items-end md:items-start">
                  <div className="heading-small-xs numbers-sm">{formatTps(chainData["24h_high"])} TPS</div>
                  <div className="relative min-w-[90x]">
                      <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">24h Peak</div>
                      <div className="heading-small-xxxs text-[#5A6462] absolute top-0 right-0 md:right-auto md:left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["24h_high_timestamp"]).format("D/M/Y HH:mm UTC")}</div>
                  </div>
            </div>
            <div className="flex items-center gap-x-[8px] heading-small-xs  group">
                  <div className="flex flex-col gap-y-[2px] items-end">
                    <div className="numbers-2xl group-hover:numbers-md transition-all duration-200" style={{ color: master.chains[chainKey].colors.dark[0] }}>{formatTps(chainData.tps)}</div>
                    <div className="heading-small-xxxs text-[#5A6462] group-hover:h-[10px] h-[0px] overflow-hidden transition-height duration-200">Current TPS</div>
                  </div>
                  <GTPIcon icon={"gtp-realtime"} size="sm" className="mb-0.5 animate-pulse" />
            </div>
           </div>

        </div>
    </div>
  )
}

export default TPSChartCard;
