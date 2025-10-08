"use client";

import { MasterResponse } from "@/types/api/MasterResponse";
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../../GTPIcon";
import { useLocalStorage } from "usehooks-ts";
import * as d3 from "d3";

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

export const LifetimeAchievments = ({data, master}: {data: AchievmentsData, master: MasterResponse}) => {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

    // Custom format function for achievement numbers
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
            <div className="heading-large-xs">Lifetime</div>
            <div className="flex items-start gap-x-[10px]">
                {Object.keys(data.lifetime).map((key) => {
                    
                    const valueType = Object.keys(master.metrics[key].units).includes("usd") ? showUsd ? "usd" : "eth" : "value";



                    

                
                    return (
                    <div className="flex flex-col w-full gap-y-[10px]" key={key + "lifetime"}>
                        <div className="flex w-full h-[100px] items-center justify-center overflow-hidden relative -ml-[25px]">
                            <div className="pt-[20px]">
                                <ReactECharts 
                                    option={getChartOptions(data.lifetime[key][valueType].percent_to_next_level)} 
                                    style={{ width: '80px', height: '100%' }}
                                />
                            </div>
                            <div className="absolute top-[15px] left-[25px] w-[34px] h-[34px] flex flex-col -gap-y-[5px] justify-center items-center bg-medium-background/80 rounded-full">
                                <div className="numbers-xxs -mb-[2px]">{data.lifetime[key][valueType].level}</div>
                                <div className="text-xxxs text-color-ui-hover">Level</div>
                            </div>
                            <div className="absolute flex flex-col justify-center items-center right-0 left-0 top-[50%]">
                                <div className="numbers-sm">{formatNumber(data.lifetime[key][valueType].total_value)}</div>
                                <GTPIcon icon={"gtp-metrics-onchainprofit-monochrome"} size="sm" />
                            </div>
                        </div>
                        <div className="flex w-full gap-x-[2px] items-center justify-center -ml-[25px]">
                            <GTPIcon icon={`gtp-${master.metrics[key].icon.replace(/^(metrics-)(.*)/, (match, prefix, rest) => prefix + rest.replace(/-/g, ''))}` as GTPIconName} size="sm"
                             className="w-[15px] h-[15px]"
                             containerClassName="flex items-center justify-center w-[24px] h-[24px]"
                            />
                            <div className="text-xxxs">{master.metrics[key].name}</div>                        
                        </div>
                        
                         
                     </div>
                )})}
            </div>

        </div>
    )
}