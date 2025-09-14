"use client";

import { GTPIcon } from "../../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from "@/contexts/MasterContext";

export default function HighlightCards({ metric, icon, value, percentage, chainKey }: { metric: string, icon: string, value: string, percentage: string, chainKey: string }) {

    const { AllChainsByKeys } = useMaster();
    const chainData = AllChainsByKeys[chainKey];

 
    if (!chainData) return null;
    return ( 

        <div className="rounded-[15px] bg-[#344240] p-[10px] max-w-[483px] flex justify-between">
            <div className="flex items-center gap-x-[10px]">
                <GTPIcon icon={"gtp-megaphone"} size="sm" />
          
                <div className="flex flex-col gap-y-[2px] items-start">
                    <div className="heading-small-xs">{metric}</div>
                    <div className="heading-small-xxxs text-[#5A6462]">All-Time High</div>
                </div>
            </div>
            <div className="flex items-center gap-x-[10px]">
                <div className="flex flex-col gap-y-[2px] items-end">
                    <div className="numbers-md" style={{ color: chainData.colors.dark[0] }}>{value}</div>
                    <div className="numbers-xxs ">{percentage}</div>
                </div>
                <GTPIcon icon={icon as GTPIconName} size="sm" />

            </div>
        </div>
    )
}