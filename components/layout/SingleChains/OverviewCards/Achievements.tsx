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
                          className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'} cursor-pointer`}
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
                {Object.keys(data.streaks).map((key) => {
                    const keyValue = key === "txcount" ? "value" : showUsd ? "usd" : "eth";
                    const valueName = key === "txcount" ? "Transactions" : showUsd ? "USD" : "ETH";
                    return (
                        <div className="flex items-center flex-col w-full " key={key + "streaks"}>
                            <div className="text-xxs font-bold leading-[15px]"><span className="numbers-xxs">{data.streaks[key][keyValue].streak_length}</span> / 7 days</div>
                           
                            <div className="flex items-center gap-x-[5px] h-[35px] pt-[2px]">
                            {Array.from({ length: 7 }, (_, i) => (
                                <StreakIcon highlighted={i < data.streaks[key][keyValue].streak_length} key={i + "streaks"} />
                            ))}
                            </div>
                            {streaksData.data[chainKey] && <StreakBar yesterdayValue={data.streaks[key][keyValue].yesterday_value} todayValue={streaksData.data[chainKey][key][keyValue]} keyValue={keyValue} />}
                            <div className="flex items-center gap-x-[5px] pt-[5px] text-xxxs">
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
        <div className="flex flex-col w-full min-w-[200px]">
            <div className="flex  pl-[2px] pr-[5px] py-[2px] justify-between w-full bg-color-bg-medium rounded-full">
                <div className="flex items-center gap-x-[5px] h-[15px] pl-[5px] pr-[2px] justify-start bg-color-ui-active rounded-full"
                 style={{width: `${todayValue / (yesterdayValue) * 100}%`}}
                >
                    <div className="text-xxxs">{prefix}{formatNumber(todayValue)}</div>


                </div>
                <div className="flex items-center gap-x-[5px] h-[15px]">
                    <div className="text-xxxs">{prefix}{formatNumber(yesterdayValue)}</div>


                </div>
            

            </div>
            <div className="flex items-center justify-between gap-x-[5px] px-[8px] pt-[2px]">
                <div className="text-xxxs ">today</div>
                <div className="text-xxxs ">yesterday</div>
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
                          className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'} cursor-pointer`}
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
            <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-x-[10px] gap-y-[10px]">
                {Object.keys(data.lifetime).map((key) => {
                    
                    const valueType = Object.keys(master.metrics[key].units).includes("usd") ? showUsd ? "usd" : "eth" : "value";



                    

                
                    return (
                    <div className="flex flex-col items-center" key={key + "lifetime"}>
                        <div className="flex w-full max-w-[100px] h-[84px] items-center justify-center overflow-hidden relative ">
                            <div className="flex h-full items-center">
                                <ReactECharts 
                                    option={getChartOptions(data.lifetime[key][valueType].percent_to_next_level)} 
                                    style={{ width: '84px', height: '84px' }}
                                />
                                
                            </div>
                            <div className="absolute top-[2px] left-[4px] w-[34px] h-[34px] flex flex-col -gap-y-[5px] justify-center items-center bg-medium-background/80 rounded-full">
                                <div className="numbers-xxs -mb-[2px]">{data.lifetime[key][valueType].level}</div>
                                <div className="text-xxxs text-color-ui-hover">Level</div>
                            </div>
                            <div className="absolute flex flex-col  gap-y-[2px] justify-center items-center right-0 left-0 top-[37%]">
                                <div className="numbers-sm">{formatNumber(data.lifetime[key][valueType].total_value)}</div>
                                <div className="flex gap-x-[1px] h-fit items-center numbers-xxxs">
                                    <div className="pt-[1px]">{Math.round(data.lifetime[key][valueType].percent_to_next_level)}%</div> 
                                    <div className="text-xxxs">to</div> 
                                    <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-color-bg-medium numbers-xxs">{data.lifetime[key][valueType].level + 1}</div></div>
                            </div>
                        </div>
                        <div className="flex w-full gap-x-[2px] items-center justify-center">
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


const StreakIcon = ({highlighted}: {highlighted: boolean}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={!highlighted ? "14" : "22"} height={!highlighted ? "25" : "39"} viewBox="0 0 14 25" fill="none">
            <defs>
                <linearGradient id="paint0_linear_3243_5093" x1="3.48746" y1="0" x2="3.48746" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE5468"/>
                    <stop offset="0.5" stopColor="#FFDF27"/>
                    <stop offset="1" stopColor="#FE5468"/>
                </linearGradient>
            </defs>
            <path d="M0.305062 13.1511C0.227915 12.0746 0.521074 11.0862 1.15005 10.1278C1.57118 9.49066 2.16839 8.80269 2.82732 8.04483C4.52728 6.08711 6.63295 3.66378 7.14848 0.452637C8.26938 2.91409 7.72572 5.30747 6.48501 7.50843C5.92683 8.49773 5.30874 9.20839 4.71879 9.88638C4.02447 10.6842 3.37008 11.4366 2.89993 12.543C2.64126 13.1447 2.49423 13.7211 2.42525 14.2847L0.305062 13.1511Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
            <path d="M3.94336 15.0985C4.20203 14.1492 4.64948 13.2615 5.24397 12.4002C5.7359 11.6814 6.19697 11.1486 6.61084 10.6703C8.00312 9.05926 8.86717 8.05907 8.61394 2.65967C8.77641 3.00638 8.93705 3.34038 9.09316 3.66258L9.09407 3.6644C10.4519 6.48345 11.4049 8.46023 9.80382 11.1749C9.01238 12.5164 8.43514 13.1835 7.92506 13.7734C7.35054 14.4369 6.86043 15.0041 6.24416 16.3238L3.94336 15.0985Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
            <path d="M9.90482 14.248C9.28038 14.9877 8.26113 16.0078 8.21484 16.075L13.9827 12.8503C13.862 11.7756 13.0697 10.5095 12.0958 8.70972C12.2928 11.0822 11.367 12.5153 9.90482 14.248Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
            <path d="M13.9412 13.9224C13.786 14.6103 12.9365 16.0416 12.3121 16.785C10.3389 19.1321 9.31151 20.1332 7.62335 23.6647C7.52805 23.2826 7.42821 22.9223 7.33291 22.5783C6.86186 20.8792 6.57233 19.4643 7.13686 18.2444L13.9412 13.9224Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
            <path d="M6.32152 21.879C5.83867 20.4659 5.49196 19.2842 5.74427 17.7893L3.72755 16.4751C3.61592 18.6742 4.5553 21.2419 7.14926 24.5474C7.0113 23.7288 6.59743 22.6868 6.32152 21.879Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
            <path d="M2.38333 15.5991C2.41782 16.3143 2.85983 18.2048 3.25555 19.205C2.12648 17.7646 0.892125 15.5546 0.539062 14.3965L2.38333 15.5991Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
        </svg>
    )
}