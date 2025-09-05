"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMemo, useEffect, useState } from "react";
import moment from "moment";
import { useLocalStorage } from "usehooks-ts";

export default function TXCostCard({ chainKey, chainData, master }: { chainKey: string, chainData: any, master: any }) {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  
    return (
        <div className="bg-[#1F2726] p-[10px] rounded-[15px] max-w-[483px] flex flex-col gap-y-[10px]">
            <div className="flex justify-between items-center">
                <div className="flex gap-x-[10px] h-[28px] items-center ">
                    <div className="w-[24px] h-[24px] p-[2px] border-t-[1px] border-r-[1px] border-b-[1px] border-[#5A6462] rounded-r-full rounded-tl-full rounded-bl-full relative flex items-center justify-center">
                        <GTPIcon icon={"gtp-metrics-throughput-monochrome"} color={master.chains[chainKey].colors.dark[0]} size="sm" containerClassName="relative left-[0.5px] top-[0.5px] w-[12px] h-[12px]" />
                        <div className="absolute numbers-xxxs -left-[6px] top-[35%] " style={{color: master.chains[chainKey].colors.dark[0]}}>12</div>
                    </div>
                    
                    <div className="heading-large-xs ">Transaction Cost</div>
                </div>
            </div>
            <div className="flex justify-between items-center pl-[30px]">
                <div className="flex flex-col gap-y-[2px] group">
                    <div className="heading-small-xs numbers-sm">{showUsd ? "$" : "" + chainData[showUsd ? "tx_cost_erc20_transfer_usd" : "tx_cost_erc20_transfer"]?.toFixed(4)} </div>
                    <div className="relative min-w-[80px]">
                        <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">ERC-20 Transfer</div>
                        <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["erc20_transfer"]).format("D/M/Y HH:mm UTC")}</div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-[2px] group">
                    <div className="heading-small-xs numbers-sm">{chainData[showUsd ? "tx_cost_swap_usd" : "tx_cost_swap"]?.toFixed(4)} </div>
                    <div className="relative min-w-[80px]">
                        <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">Swap Fee</div>
                        <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["swap_fee"]).format("D/M/Y HH:mm UTC")}</div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-[2px] group">
                    <div className="heading-small-xs numbers-sm">{chainData[showUsd ? "tx_cost_avg_usd" : "tx_cost_avg"]?.toFixed(4)} </div>
                    <div className="relative min-w-[80px]">
                        <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">Average Fee</div>
                        <div className="heading-small-xxxs text-[#5A6462] absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["swap_fee"]).format("D/M/Y HH:mm UTC")}</div>
                    </div>
                </div>
                <div className="flex flex-col gap-y-[2px] items-end group">
                    <div className="flex items-center gap-x-[5px] heading-small-xs numbers-md" >
                        <div style={{ color: master.chains[chainKey].colors.dark[0] }}>{chainData[showUsd ? "tx_cost_median_usd" : "tx_cost_median"]?.toFixed(4)} </div>
                        <GTPIcon icon={"gtp-realtime"} size="sm" />
                    </div>
                    <div className="relative min-w-[80px] flex justify-end text-right">
                        <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">Median Fee</div>
                        <div className="heading-small-xxxs text-[#5A6462] absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{moment.utc(chainData["swap_fee"]).format("D/M/Y HH:mm UTC")}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}