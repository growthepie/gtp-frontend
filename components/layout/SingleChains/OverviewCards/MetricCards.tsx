"use client";

import { GTPIcon } from "../../GTPIcon";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverview } from "@/lib/chains";
import { MasterResponse, Metrics, MetricInfo } from "@/types/api/MasterResponse";
import { useLocalStorage } from "usehooks-ts";

const formatLargeNumber = (value: number, decimals: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) {
        return (value / 1e9).toFixed(decimals) + 'B';
    } else if (absValue >= 1e6) {
        return (value / 1e6).toFixed(decimals) + 'M';
    } else if (absValue >= 1e3) {
        return (value / 1e3).toFixed(decimals) + 'K';
    }
    return value.toFixed(decimals);
};

export default function MetricCards({ chainKey, master, metricKey, metricData, overviewData }: { chainKey: string, master: MasterResponse, metricKey: string, metricData: MetricInfo, overviewData: ChainOverview }) {
    const { AllChainsByKeys } = useMaster();
    const chainData = AllChainsByKeys[chainKey];
    const showUsd = useLocalStorage("showUsd", true);
    const metricUseUSD = Object.keys(metricData.units).includes("usd");

    if (!chainData || !overviewData.data.ranking[metricKey] || !metricData) return null;


    console.log(metricUseUSD);
    const prefix = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].prefix;
    const suffix = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].suffix;
    const decimals = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].decimals;
    // const prefix = metricData.units.value[showUsd ? "usd" : "eth"].prefix;
    // const suffix = metricData.units.value[showUsd ? "usd" : "eth"].suffix;
    // const decimals = metricData.units.value[showUsd ? "usd" : "eth"].decimals;

    return (
        <div className="rounded-[15px] bg-[#1F2726] p-[10px] max-w-[483px] flex justify-between">
            <div className="flex items-center gap-x-[10px] min-w-[175px]">
                <div className="w-[24px] h-[24px] p-[2px] border-t-[1px] border-r-[1px] border-b-[1px] border-[#5A6462] rounded-r-full rounded-tl-full rounded-bl-full relative flex items-center justify-center">
                    <GTPIcon icon={"gtp-metrics-throughput-monochrome"} color={master.chains[chainKey].colors.dark[0]} size="sm" containerClassName="relative left-[0.5px] top-[0.5px] w-[12px] h-[12px]" />
                    <div className="absolute numbers-xxxs -left-[6px] top-[35%] " style={{color: master.chains[chainKey].colors.dark[0]}}>
                        {overviewData.data.ranking[metricKey].rank}
                    </div>
                </div>
                <div className="heading-large-xs ">{metricData.name}</div>
            </div>
            <div>Chart Here</div>
            <div className="flex flex-col gap-y-[2px] items-end min-w-[120px]">
                <div className="numbers-md" style={{ color: chainData.colors.dark[0] }}>
                    {prefix}{formatLargeNumber(overviewData.data.kpi_cards[metricKey].current_values.data[0], 2)} {suffix}
                </div>
                <div className="numbers-xxs " style={{ color: overviewData.data.kpi_cards[metricKey].wow_change.data[0] > 0 ? "#4CFF7E" : "#FF3838" }}>{Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 1 }).format(overviewData.data.kpi_cards[metricKey].wow_change.data[0] * 100)}%</div>

            </div>
            
        </div>
    )
}