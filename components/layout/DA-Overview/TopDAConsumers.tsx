"use client"
import { useEffect, useState, useMemo } from "react";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { TopConsumerColumns } from "@/types/api/DAOverviewResponse";
import { useMaster } from "@/contexts/MasterContext";
import Icon from "@/components/layout/Icon";


type DARowData = {
    item: string;
    value: any;
    index: number;
    y: any;
    height: any;
};

const unlabelledDAHex = ["#7D8887", "#697474", "#556060", "#404C4B", "#2C3938"]


export default function TopDAConsumers({consumer_data, selectedTimespan}: {consumer_data: TopConsumerColumns, selectedTimespan: string}) {
    const { AllChainsByKeys, da_metrics } = useMaster();

    const sortedDAConsumers = useMemo(() => {
        let types = consumer_data[selectedTimespan].types;
        return consumer_data[selectedTimespan].data.sort((a, b) => a[types.indexOf("data_posted")] - b[types.indexOf("data_posted")]).reverse();

    }, [consumer_data, selectedTimespan]);

    
    let height = 0;
    const transitions = useTransition(
        sortedDAConsumers
          ?.map(([item, value], index) => {
            const isPlaceholder = item === "placeholder";
    
            const rowHeight = !isPlaceholder ? 34 : 20;
            height += rowHeight / 8;
            return {
              item,
              value,
              index,
              y: (height += rowHeight) - rowHeight,
              height: rowHeight,
            } as DARowData;
          }) || [],
        {
          key: (item: any) => item.item, // Use item as the key
          from: { opacity: 0, height: 0 },
          leave: null,
          enter: ({ y, height, item }) => ({
            y: y,
            height: height,
            opacity: 1.0,
          }),
          update: ({ y, height, item }) => ({
            y: y,
            height: height,
            opacity: 1.0,
          }),
          config: { mass: 5, tension: 500, friction: 100 },
        },
    );

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return "0 Bytes";
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
    }

    return (
        <div className="w-full h-full relative">
            {transitions((style, item) => {

                
               
                return(
                    <animated.div
                        className="absolute w-full "
                        key={item.item}
                        style={style}
                    >
                        <div className={`h-full rounded-full bg-red-400 flex items-center px-[2px]`}
                             style={{
                                backgroundColor: AllChainsByKeys[sortedDAConsumers[item.index][3]] ? AllChainsByKeys[sortedDAConsumers[item.index][3]].colors["dark"][0] : unlabelledDAHex[item.index],
                                width: `${(sortedDAConsumers[item.index][4] / sortedDAConsumers[0][4]) * 100}%`,
                                minWidth: "122px"
                             }}
                        >
                            <div className="bg-[#1F2726] w-[122px] h-[30px] rounded-full flex items-center px-[5px] gap-x-[10px]">
                                <Icon
                                    icon={sortedDAConsumers[item.index][3] ? `gtp:${sortedDAConsumers[item.index][3].replace("_", "-").replace("_", "-")}-logo-monochrome` : "gtp:chain-dark"}
                                    className="w-[15px] h-[15px]"
                                    style={{}}

                                />
                                <div className="flex flex-col ">
                                    <div className="numbers-sm -mb-[1px]">{formatBytes(sortedDAConsumers[item.index][4])}</div>
                                    <div className="text-xxs -mt-[1px]">{sortedDAConsumers[item.index][1] ? sortedDAConsumers[item.index][1] : "Not listed chains"}</div>
                                </div>
                            </div>
                            <div></div>
                        </div>
                    </animated.div>
                )
            })}
        </div>
    )
}