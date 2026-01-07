"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { formatNumber } from "@/lib/utils/formatters";
import { useRouter } from "next/navigation";
import { getFundamentalsByKey } from "@/lib/metrics";


export default function HighlightCards({ metric, icon, chainKey, chainOverviewData, metricKey, index}: { metric: string, icon: string, chainKey: string, chainOverviewData: any, metricKey: string, index: number }) {

    const { AllChainsByKeys, metrics } = useMaster();
    const [showUsd] = useLocalStorage("showUsd", true);
    const router = useRouter();
    

    const chainData = AllChainsByKeys[chainKey];

   const metricData = metrics[metricKey];

   const handleCardClick = useCallback(() => {
     const fundamentalsByKey = getFundamentalsByKey;
     const metricItem = fundamentalsByKey[metricKey];
     const chainUrlKey = chainData.urlKey;
     
     if (metricItem && metricItem.urlKey) {
        // Set localStorage values for chart controls
    //    sessionStorage.setItem('fundamentalsScale', 'stacked');
       sessionStorage.setItem('fundamentalsChains', JSON.stringify([chainKey]));
       router.push(`/fundamentals/${metricItem.urlKey}/${chainUrlKey}`);
     }
   }, [metricKey, chainData, chainKey, router]);

 
    if (!chainData || !chainOverviewData) return null;
    return (
        <div 
          className="group relative rounded-[15px] bg-color-bg-medium hover:bg-color-ui-hover p-[5px] pl-[10px] min-h-[56px] w-full flex justify-between transition-colors duration-200 cursor-pointer"
          onClick={handleCardClick}
        >
            <div className="flex items-center gap-x-[10px]">
                <GTPIcon icon={`gtp-${metricData.icon.replace(/^(metrics-)(.*)/, (match, prefix, rest) => prefix + rest.replace(/-/g, ''))}` as GTPIconName} size="sm" containerClassName="!size-[28px] flex items-center justify-center"/>
          
                <div className="flex flex-col gap-y-[2px] items-start">
                    <div className="heading-small-xs">{metricData.name}</div>
                    <div className="text-xxs ">{chainOverviewData.data.highlights[index].text || "All-Time High"}</div>
                </div>
            </div>
            <div className="flex items-center gap-x-[5px] p-[5px] pl-[10px]">
                <div className="flex flex-col gap-y-[5px] items-end">
                    <div className="numbers-md group-hover:!text-color-text-primary" style={{ color: chainData.colors.dark[0] }}>{chainOverviewData.data.highlights[index].value}</div>
                    <div className="numbers-xxs ">{chainOverviewData.data.highlights[index].date.replace(/-/g, "/")}</div>
                </div>
                <GTPIcon icon={icon as GTPIconName} size="sm" />
            </div>
            {/* Chevron that appears on hover */}
            <div className="absolute right-[10px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none" className="text-color-text-primary">
                    <path d="M0.662115 2.29808C0.293362 1.89949 0.278805 1.2785 0.645793 0.862551C1.01283 0.44657 1.63111 0.383401 2.07253 0.699746L2.15833 0.767964L7.62295 5.58974C9.02778 6.82932 9.07141 8.99007 7.75437 10.2872L7.62295 10.4103L2.15833 15.232L2.07253 15.3003C1.63111 15.6166 1.01283 15.5534 0.645793 15.1375C0.278805 14.7215 0.293362 14.1005 0.662115 13.7019L0.740378 13.6249L6.205 8.80356L6.24895 8.76255C6.68803 8.33017 6.67331 7.60965 6.205 7.19644L0.740378 2.37508L0.662115 2.29808Z" fill="currentColor"/>
                </svg>
            </div>
        </div>
    )
}