"use client";

import { MasterResponse } from "@/types/api/MasterResponse";
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../../GTPIcon";
import { useLocalStorage } from "usehooks-ts";
import * as d3 from "d3";
import { GTPTooltipNew, TooltipBody } from "@/components/tooltip/GTPTooltip";
import {useMediaQuery} from "usehooks-ts";
import { StreaksData } from "@/types/api/ChainOverviewResponse";

interface AchievmentsData {
    streaks: Object;
    lifetime: {
        [key: string]: {
            [key: string]: {
                level: number;
                total_value: number;
                percent_to_next_level: number;
            }
        }
    }
}

const formatNumber = (value: number): string => {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
        return "0";
    }
    
    if (numValue < 1000) {
        return Math.floor(numValue).toString();
    }
    
    if (numValue >= 1000000000) {
        return (numValue / 1000000000).toFixed(1).replace('.0', '') + 'B';
    }
    
    if (numValue >= 1000000) {
        return (numValue / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    
    if (numValue >= 1000) {
        return (numValue / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    
    return numValue.toString();
};


export const StreaksAchievments = ({data, master, streaksData, chainKey}: {data: AchievmentsData, master: MasterResponse, streaksData: StreaksData, chainKey: string}) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

    const keyData = {
        txcount: {
            name: "Transactions",
            icon: "gtp-metrics-transactioncount",
            description: "Increased Transaction Count",
        },
        fees: {
            name: "Fees",
            icon: "gtp-metrics-feespaidbyusers",
            description: "Decreased Fees",
        }
    }
    
    
    return (
        <div className="flex flex-col w-full gap-y-[15px]">
            <div className="flex items-center gap-x-[10px]">
                <div className="heading-large-xs">Streaks</div>
                <GTPTooltipNew
                      placement="top-end"
                      size="md"
                      allowInteract={true}
                      trigger={
                        <div
                          className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'}`}
                          data-tooltip-trigger
                        >
                          <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                        </div>
                      }
                      containerClass="flex flex-col gap-y-[10px]"
                      positionOffset={{ mainAxis: 0, crossAxis: 20 }}

                    >
                      <div>
                        <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                          {"Tooltip content"}
                        </TooltipBody>
                      </div>
                    </GTPTooltipNew>
            </div>
            <div className="flex items-start gap-x-[10px]">
                {Object.keys(data.streaks).map((key) => {
                    const keyValue = key === "txcount" ? "value" : showUsd ? "usd" : "eth";
                    const valueName = key === "txcount" ? "Transactions" : showUsd ? "USD" : "ETH";
                    return (
                        <div className="flex items-center flex-col w-full gap-y-[10px]" key={key + "streaks"}>
                            <div className="heading-large-xs">{data.streaks[key][keyValue].streak_length + " / 7 days"}</div>
                           
                            <div className="flex items-center gap-x-[10px] h-[35px]">
                            {Array.from({ length: 7 }, (_, i) => (
                                <div className="w-[10px] h-[10px]" key={i + "streaks"}
                                    style={{
                                        backgroundColor: i < data.streaks[key][keyValue].streak_length ? "white" : "gray",
                                    }}
                                >
                                </div>
                            ))}
                            </div>
                            <StreakBar yesterdayValue={data.streaks[key][keyValue].yesterday_value} todayValue={streaksData.data[chainKey][key][keyValue]} keyValue={keyValue} />
                            <div className="flex items-center gap-x-[5px] text-xxxs">
                                <GTPIcon icon={keyData[key].icon as GTPIconName} size="sm" />
                                {keyData[key].description}
                            </div>
                        </div>

                    )
                })}
            </div>
        </div>
    )
}


const StreakBar = ({yesterdayValue, todayValue, keyValue}: {yesterdayValue: number, todayValue: number, keyValue: string}) => {
    const prefix = keyValue === "usd" ? "$" : keyValue === "eth" ? "Ξ" : "";
    return (
        <div className="flex  px-[2px] py-[2px] justify-between w-full bg-color-bg-medium rounded-full">
            <div className="flex items-center gap-x-[5px] px-[2px] py-[2px] bg-color-ui-active rounded-full">
                <div className="text-xxxs">{prefix}{formatNumber(todayValue)}</div>

                <div className="text-xxxs text-[#4B534F]">(today)</div>
            </div>
            <div className="flex items-center gap-x-[5px]">
                <div className="text-xxxs">{prefix}{formatNumber(yesterdayValue)}</div>

                <div className="text-xxxs text-[#4B534F]">(yesterday)</div>
            </div>
        

        </div>
    )
}

export const LifetimeAchievments = ({data, master}: {data: AchievmentsData, master: MasterResponse}) => {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const isMobile = useMediaQuery("(max-width: 768px)");





    // Callback function to generate chart options with dynamic progress value
    const getChartOptions = (progressValue: number): EChartsOption => {
        const remainingValue = 100 - progressValue;
        
        return {
            series: [
                {
                    type: 'pie',
                    data: [
                        { 
                            name: 'Progress', 
                            value: progressValue,
                            itemStyle: {
                                color: {
                                    type: 'linear',
                                    x: 0,
                                    y: 0,
                                    x2: 1,
                                    y2: 1,
                                    colorStops: [
                                        { offset: 0, color: master.chains["all_l2s"].colors.dark[0] },
                                        { offset: 1, color: master.chains["all_l2s"].colors.dark[1] }
                                    ]
                                }
                            }
                        },
                        { 
                            name: 'Remaining', 
                            value: remainingValue, 
                            itemStyle: {
                                color: '#344240',
                            } 
                        }
                    ],
                    name: 'Percent to next level',
                    label: {
                        show: false,
                    },
                    labelLine: {
                        show: false,
                    },
                    radius: ['85%', '90%'],
                    center: ['50%', '50%'],
                    showEmptyCircle: true,
                    emptyCircleStyle: {
                        color: 'transparent',
                    },
                }
            ]
        };
    };


    
    return(
        <div className="flex flex-col w-full gap-y-[15px]">
            <div className="flex items-center gap-x-[10px]">
                <div className="heading-large-xs">Lifetime</div>
                <GTPTooltipNew
                      placement="top-end"
                      size="md"
                      allowInteract={true}
                      trigger={
                        <div
                          className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'}`}
                          data-tooltip-trigger
                        >
                          <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                        </div>
                      }
                      containerClass="flex flex-col gap-y-[10px]"
                      positionOffset={{ mainAxis: 0, crossAxis: 20 }}

                    >
                      <div>
                        <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                          {"Tooltip content"}
                        </TooltipBody>
                      </div>
                </GTPTooltipNew>
            </div>
            <div className="flex items-start gap-x-[10px] ">
                {Object.keys(data.lifetime).map((key) => {
                    
                    const valueType = Object.keys(master.metrics[key].units).includes("usd") ? showUsd ? "usd" : "eth" : "value";



                    

                
                    return (
                    <div className="flex flex-col w-full gap-y-[10px]" key={key + "lifetime"}>
                        <div className="flex w-full h-[100px] items-center justify-center overflow-hidden relative ">
                            <div className="">
                                <ReactECharts 
                                    option={getChartOptions(data.lifetime[key][valueType].percent_to_next_level)} 
                                    style={{ width: '80px', height: '100%' }}
                                />
                            </div>
                            <div className="absolute top-[7px] left-[2.5px] w-[34px] h-[34px] flex flex-col -gap-y-[5px] justify-center items-center bg-medium-background/80 rounded-full">
                                <div className="numbers-xxs -mb-[2px]">{data.lifetime[key][valueType].level}</div>
                                <div className="text-xxxs text-color-ui-hover">Level</div>
                            </div>
                            <div className="absolute flex flex-col justify-center items-center right-0 left-0 top-[39%]">
                                <div className="numbers-sm">{formatNumber(data.lifetime[key][valueType].total_value)}</div>
                                <div className="flex h-fit items-center numbers-xxxs">
                                    <div className="pt-[1px]">{Math.round(data.lifetime[key][valueType].percent_to_next_level)}%</div> 
                                    <div className="text-xxxs">to</div> 
                                    <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-color-bg-medium numbers-xxs">{data.lifetime[key][valueType].level + 1}</div></div>
                            </div>
                        </div>
                        <div className="flex w-full gap-x-[2px] items-center justify-center -mt-[12.5px]">
                            <GTPIcon icon={`gtp-${master.metrics[key].icon.replace(/^(metrics-)(.*)/, (match, prefix, rest) => prefix + rest.replace(/-/g, ''))}` as GTPIconName} size="sm"
                             className="w-[15px] h-[15px]"
                             containerClassName="flex items-center justify-center w-[24px] h-[24px]"
                            />
                            <div className="text-xxxs whitespace-nowrap">{master.metrics[key].name}</div>                        
                        </div>
                        
                         
                     </div>
                )})}
            </div>

        </div>
    )
}