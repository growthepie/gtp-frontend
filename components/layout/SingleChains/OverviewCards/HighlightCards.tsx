"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { formatNumber } from "@/lib/utils/formatters";


export default function HighlightCards({ metric, icon, chainKey, chainOverviewData, metricKey, index}: { metric: string, icon: string, chainKey: string, chainOverviewData: any, metricKey: string, index: number }) {

    const { AllChainsByKeys, metrics } = useMaster();
    const [showUsd] = useLocalStorage("showUsd", true);
    

    const chainData = AllChainsByKeys[chainKey];

   const metricData = metrics[metricKey];

 
    if (!chainData || !chainOverviewData) return null;
    return (
        <div className="rounded-[15px] bg-color-bg-medium p-[5px] pl-[10px] min-h-[56px] w-full flex justify-between">
            <div className="flex items-center gap-x-[10px]">
                <GTPIcon icon={`gtp-${metricData.icon.replace(/^(metrics-)(.*)/, (match, prefix, rest) => prefix + rest.replace(/-/g, ''))}` as GTPIconName} size="sm" containerClassName="!size-[28px] flex items-center justify-center"/>
          
                <div className="flex flex-col gap-y-[2px] items-start">
                    <div className="heading-small-xs">{metricData.name}</div>
                    <div className="heading-small-xxxs ">{chainOverviewData.data.highlights[index].text || "All-Time High"}</div>
                </div>
            </div>
            <div className="flex items-center gap-x-[5px] p-[5px] pl-[10px]">
                <div className="flex flex-col gap-y-[5px] items-end">
                    <div className="numbers-md" style={{ color: chainData.colors.dark[0] }}>{chainOverviewData.data.highlights[index].value}</div>
                    <div className="numbers-xxs ">{chainOverviewData.data.highlights[index].date.replace(/-/g, "/")}</div>
                </div>
                <GTPIcon icon={icon as GTPIconName} size="sm" />
            </div>
        </div>
    )
}