"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { formatNumber } from "@/lib/utils/formatters";


export default function HighlightCards({ metric, icon, chainKey, chainOverviewData, metricKey}: { metric: string, icon: string, chainKey: string, chainOverviewData: any, metricKey: string }) {

    const { AllChainsByKeys, metrics } = useMaster();
    const [showUsd] = useLocalStorage("showUsd", true);

    const chainData = AllChainsByKeys[chainKey];
    const getValueKey = useCallback((data: {types: string[], data: number[][]}) => {
        let valueKey = "value";
        if(data.types.includes("usd")) {
            valueKey = showUsd ? "usd" : "eth";
        }
        return valueKey;
    }, [showUsd]);

   const metricData = metrics[metricKey];

    const valueData = useMemo(() => {
        const valueKey = getValueKey(chainOverviewData.data.kpi_cards[metricKey].current_values);
        const index = chainOverviewData.data.kpi_cards[metricKey].current_values.types.indexOf(valueKey);
        const v = chainOverviewData.data.kpi_cards[metricKey].current_values.data[index];
        const prefix = metricData.units[valueKey].prefix;
        const suffix = metricData.units[valueKey].suffix;
        const decimals = metricData.units[valueKey].decimals;

        return { value: v, prefix, suffix, decimals };
    }, [chainOverviewData, metricKey, getValueKey, metricData]);

    const percentageData = useMemo(() => {
        const valueKey = getValueKey(chainOverviewData.data.kpi_cards[metricKey].wow_change);
        const index = chainOverviewData.data.kpi_cards[metricKey].wow_change.types.indexOf(valueKey);
        const v = chainOverviewData.data.kpi_cards[metricKey].wow_change.data[index]
        return {
            value: Math.abs(v) * 100,
            prefix: v >= 0 ? "+" : "-",
            suffix: "%",
            decimals: 2
        }
    }, [chainOverviewData, metricKey, getValueKey]);
    const { value, prefix: valuePrefix, suffix: valueSuffix, decimals: valueDecimals } = valueData;
    const { value: percentageValue, prefix: percentagePrefix, suffix: percentageSuffix, decimals: percentageDecimals } = percentageData;

    const formattedPercentageValue = formatNumber(percentageValue, {
        decimals: percentageDecimals,
    });

    const formattedValue = formatNumber(value, {
        decimals: valueDecimals,
    });
 
    if (!chainData) return null;
    return (
        <div className="rounded-[15px] bg-color-bg-medium p-[5px] pl-[10px] min-h-[56px] w-full flex justify-between">
            <div className="flex items-center gap-x-[10px]">
                <GTPIcon icon={icon as GTPIconName} size="sm" containerClassName="!size-[28px] flex items-center justify-center"/>
          
                <div className="flex flex-col gap-y-[2px] items-start">
                    <div className="heading-small-xs">{metricData.name}</div>
                    <div className="heading-small-xxxs text-[#5A6462]">All-Time High</div>
                </div>
            </div>
            <div className="flex items-center gap-x-[5px] p-[5px] pl-[10px]">
                <div className="flex flex-col gap-y-[5px] items-end">
                    <div className="numbers-md" style={{ color: chainData.colors.dark[0] }}>{valuePrefix}{formattedValue} {valueSuffix}</div>
                    {percentageValue >= 0 ? <div className="numbers-xxs text-positive">{percentagePrefix}{formattedPercentageValue}{percentageSuffix}</div> : <div className="numbers-xxs text-negative">{percentagePrefix}{formattedPercentageValue}{percentageSuffix}</div>}
                </div>
                <GTPIcon icon={icon as GTPIconName} size="sm" />
            </div>
        </div>
    )
}