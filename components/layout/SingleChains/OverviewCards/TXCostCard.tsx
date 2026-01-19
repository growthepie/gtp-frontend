"use client";

import { GTPIcon } from "../../GTPIcon";
import { useMemo, useEffect, useState } from "react";
import moment from "moment";
import { useLocalStorage } from "usehooks-ts";
import { HistoryDots } from "../../EthAgg/HistoryDots";
import { getGradientColor } from "../../EthAgg/helpers";
import { GetRankingColor } from "@/lib/chains";
import { formatNumber } from "@/lib/utils/formatters";
import { useTheme } from "next-themes";
export interface ChainData {
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


export default function TXCostCard({ chainKey, chainData, master, overviewData, costHistory }: { chainKey: string, chainData: ChainData, master: any, overviewData?: any, costHistory: ChainData[] }) {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const [txCostSelectedIndex, setTxCostSelectedIndex] = useState<number | null>(null);
    const [txCostHoverIndex, setTxCostHoverIndex] = useState<number | null>(null);
    const recentCostHistory = useMemo(() => costHistory.slice(-24), [costHistory]);
    const { theme } = useTheme();
    useEffect(() => {
        if (recentCostHistory.length === 0) {
            setTxCostSelectedIndex(null);
            return;
        }

        setTxCostSelectedIndex((prev) => {
            const lastIndex = recentCostHistory.length - 1;

            if (prev === null) {
                return lastIndex;
            }

            if (prev >= recentCostHistory.length || prev < 0) {
                return lastIndex;
            }

            if (recentCostHistory.length > 1 && prev === recentCostHistory.length - 2) {
                return lastIndex;
            }

            return prev;
        });
    }, [recentCostHistory.length]);

    // Get ranking color for transaction costs if overview data is available
    const rankingColor = overviewData?.data?.ranking?.txcosts
        ? GetRankingColor(overviewData.data.ranking.txcosts.color_scale * 100, false, theme as "dark" | "light" ?? "dark")
        : master.chains[chainKey].colors[theme ?? "dark"][0];

    const activeIndex = txCostHoverIndex ?? txCostSelectedIndex ?? (recentCostHistory.length ? recentCostHistory.length - 1 : null);
    const lastCostData = activeIndex !== null ? recentCostHistory[activeIndex] : undefined;

    const getDisplayValue = (key: string, showUsd: boolean) => {
        if (!lastCostData) return "N/A";
        const valueKey = showUsd ? key + "_usd" : key;
        if(showUsd){
            return "$" + lastCostData[valueKey]?.toFixed(lastCostData[valueKey] < 0.0001 ? 6 : 4);
        } else {
            return <><span className={key.includes("median") ? "numbers-md" : "numbers-sm"}>{formatNumber((lastCostData[key] * 1000000000), {decimals: 1})}</span><span className="heading-small-xxxs"> Gwei</span></>;
        }
    }


    return (
        <div className="group bg-color-bg-default xs:p-[10px] p-[15px] rounded-[15px] w-full flex flex-col gap-y-[10px] min-h-[86px]">
            {/* <div className="text-[0.6rem]">{JSON.stringify(lastCostData)}</div> */}
            <div className="flex justify-between items-center">
                <div className="flex xs:gap-x-[10px] gap-x-[2px] h-[28px] relative items-center">
                    <div className="!size-[28px] relative flex items-center justify-center">
                        <div className="w-[24px] h-[24px] p-[2px] border-t-[1px] border-r-[1px] border-b-[1px] border-[#5A6462] rounded-r-full rounded-tl-full rounded-bl-full relative flex items-center justify-center">
                            <GTPIcon icon={"gtp-metrics-throughput-monochrome"} color={rankingColor} size="sm" containerClassName="relative left-[0.5px] top-[0.5px] w-[12px] h-[12px]" />
                            <div className="absolute numbers-xxxs -left-[6px] top-[35%] " style={{ color: rankingColor }}>12</div>
                        </div>
                    </div>

                    <div className="heading-large-xs ">Transaction Cost</div>
                </div>
                <div className="w-[150px] flex items-center justify-end gap-x-[2px] bg">
                    <HistoryDots
                        data={recentCostHistory.map((x) => x["tx_cost_median"])}
                        selectedIndex={txCostSelectedIndex ?? Math.max(recentCostHistory.length - 1, 0)}
                        hoverIndex={txCostHoverIndex}
                        onSelect={setTxCostSelectedIndex}
                        onHover={setTxCostHoverIndex}
                        getGradientColor={getGradientColor}
                        theme={theme as "dark" | "light" ?? "dark"}
                    />
                </div>
            </div>
            <div className="flex justify-end flex-wrap ">
                <div className="w-0 xs:w-[50px]"></div>
                <div className="flex flex-col md:flex-row flex-1 gap-y-[10px]">
                    <div className="flex flex-col gap-y-[2px] flex-1">
                        {lastCostData ? <div className="heading-small-xs numbers-sm">{getDisplayValue("tx_cost_erc20_transfer", showUsd)} </div> : <div className="heading-small-xs numbers-sm">N/A</div>}
                        <div className="relative min-w-[80px]">
                            <div className="heading-small-xxxs text-[#5A6462]">ERC-20 Transfer</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-y-[2px] flex-1 ">
                        {lastCostData ? <div className="heading-small-xs numbers-sm">{getDisplayValue("tx_cost_swap", showUsd)} </div> : <div className="heading-small-xs numbers-sm">N/A</div>}
                        <div className="relative min-w-[80px]">
                            <div className="heading-small-xxxs text-[#5A6462]">Swap Fee</div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col-reverse md:flex-row flex-1 gap-y-[10px]">
                    <div className="flex flex-col gap-y-[2px] flex-1 min-w-[110px] items-end md:items-start">
                        {lastCostData ? <div className="heading-small-xs numbers-sm">{getDisplayValue("tx_cost_avg", showUsd)} </div> : <div className="heading-small-xs numbers-sm">N/A</div>}
                        <div className="relative md:min-w-[80px]">
                            <div className="heading-small-xxxs text-[#5A6462]">Average Fee</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-y-[2px] items-end min-w-[110px]">
                        <div className="flex items-center gap-x-[5px] heading-small-xs numbers-md" >
                            {lastCostData ? <div className="text-right" style={{ color: master.chains[chainKey].colors[theme ?? "dark"][0] }}>{getDisplayValue("tx_cost_median", showUsd)} </div> : <div className="heading-small-xs numbers-md">N/A</div>}
                            <GTPIcon icon={"gtp-realtime"} size="sm" className="animate-pulse" />
                        </div>
                        <div className="relative min-w-[80px] flex justify-end text-right">
                            <div className="heading-small-xxxs text-[#5A6462] group-hover:opacity-0 transition-opacity duration-200">Median Fee</div>
                            {lastCostData ? <div className="heading-small-xxxs text-[#5A6462] absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">{!txCostHoverIndex && "updated"} {Math.abs(moment.utc(lastCostData["last_updated"]).diff(moment.utc(), "seconds"))} seconds ago</div> : <div className="heading-small-xs numbers-sm">N/A</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}