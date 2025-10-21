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
            description: "Increased Chain Revenue",
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
                          {"Streaks are consecutive days of growth in key metrics. The icons represent your progress over the last week, with a special icon indicating today's performance so far."}
                        </TooltipBody>
                      </div>
                    </GTPTooltipNew>
            </div>
            <div className="flex flex-nowrap justify-between w-full items-start gap-x-[10px] gap-y-[10px]">
                {Object.keys(data.streaks).map((key) => {
                    const keyValue = key === "txcount" ? "value" : showUsd ? "usd" : "eth";
                    const valueName = key === "txcount" ? "Transactions" : showUsd ? "USD" : "ETH";
                    return (
                        <div className="flex items-center flex-col flex-1 min-w-[200px]" key={key + "streaks"}>
                            <div className="text-xxs font-bold leading-[15px]">
                                <span className="numbers-xxs">{Math.floor(data.streaks[key][keyValue].streak_length / 7)  > 0 ? Math.floor(data.streaks[key][keyValue].streak_length / 7) + " weeks and " : ""}</span>
                                <span className="numbers-xxs">{data.streaks[key][keyValue].streak_length % 7 + " days in last week" || ""}</span>
                            </div>
                           
                            <div className="flex items-center gap-x-[5px] h-[35px] pt-[2px]">
                            {Array.from({ length: data.streaks[key][keyValue].streak_length }, (_, i) => (
                                <div key={i + "streaks"}  className="w-[13.69px] h-[24.09px]">
                                    <StreakIcon progress={i < data.streaks[key][keyValue].streak_length ? 100 : 0} />
                                </div>
                            ))}
                            <div className="w-[22.16px] h-[39px]">
                                <StreakIcon progress={streaksData.data[chainKey][key][keyValue] / data.streaks[key][keyValue].yesterday_value * 100} key={"streak-icon-progress"} animated={true} />
                            </div>
                            {Array.from({ length: 7 - (data.streaks[key][keyValue].streak_length + 1)}, (_, i) => (
                                <div key={i + "streaks"} className="w-[13.69px] h-[24.09px]">
                                    <StreakIcon progress={0} />
                                </div>
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

    const transparentChartOptions = (progressValue: number, chartSize: number = 74): EChartsOption => {
        const remainingValue = 100 - progressValue;
        
        // Calculate the angle for the end of the progress arc
        // ECharts pie starts at top (12 o'clock = 90° in standard math coords) and goes clockwise
        // Standard math: 0° = right (3 o'clock), angles increase counter-clockwise
        const progressAngle = (progressValue / 100) * 360; // degrees of progress clockwise from top
        const angleRad = ((90 - progressAngle) * Math.PI) / 180; // Convert to radians in standard math coordinates
        
        // Calculate position of the circle
        // Radius is 87.5% of half the chart size (middle of the ring)
        const radiusPixels = (chartSize / 2) * 0.875;
        const centerX = chartSize / 2;
        const centerY = chartSize / 2;
        
        // Calculate circle position in pixels (center of the circle on the arc)
        const circleRadius = 4;
        const circleCenterX = centerX + radiusPixels * Math.cos(angleRad);
        const circleCenterY = centerY - radiusPixels * Math.sin(angleRad); // Negative because Y increases downward
        
        // Adjust for the fact that 'left' and 'top' position the top-left corner, not center
        const circleX = circleCenterX - circleRadius;
        const circleY = circleCenterY - circleRadius;
        
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
                                        { offset: 0, color: 'transparent' },
                                        { offset: 1, color: 'transparent' }
                                    ]
                                }
                            }
                        },
                        { 
                            name: 'Remaining', 
                            value: remainingValue, 
                            itemStyle: {
                                color: 'transparent',
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
                        color: '#344240',
                    },
                    silent: true,
                    emphasis: {
                        disabled: true
                    },
                }
            ],
            graphic: progressValue > 0 ? [
                {
                    type: 'circle',
                    left: circleX,
                    top: circleY,
                    shape: {
                        r: circleRadius
                    },
                    style: {
                        fill: '#CBD8D3',
                        stroke: '#CBD8D3',
                        lineWidth: 0,
                        opacity: 0.9
                    },

                    z: 100
                }
            ] : []
        };
    }




    // Callback function to generate chart options with dynamic progress value
    const getChartOptions = (progressValue: number, chartSize: number = 84): EChartsOption => {
        const remainingValue = 100 - progressValue;
        
        return {
            tooltip: {
                show: false,
            },
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
                    emphasis: {
                        disabled: false,
                        scale: true,
                        scaleSize: 2.5,
                    },
                    showEmptyCircle: true,
                    emptyCircleStyle: {
                        color: 'transparent',
                    },
                }
            ],
        };
    };


    
    return(
        <div className="flex flex-col w-full gap-y-[15px] overflow-visible">
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
                          {"Lifetime achievements showcase the total accumulated value of the chains key metrics (i.e. liftime revenue, total active addresses, lifetime transactions since inception). Each chart visualizes the chains progress toward the next level based on the total accumulated value."}
                        </TooltipBody>
                      </div>
                </GTPTooltipNew>
            </div>
            <div className="flex flex-nowrap justify-between gap-x-[10px] gap-y-[10px] overflow-visible">
                {Object.keys(data.lifetime).map((key) => {
                    
                    const valueType = Object.keys(master.metrics[key].units).includes("usd") ? showUsd ? "usd" : "eth" : "value";

                    return (
                    <div className="flex flex-col items-center overflow-visible" key={key + "lifetime"}>
                        <div className="flex w-full max-w-[100px] h-[84px] items-center justify-center relative overflow-visible">
                            <div className="absolute w-[100px] h-[94px] flex items-center justify-center z-20 overflow-visible">
                                <ReactECharts 
                                    option={getChartOptions(data.lifetime[key][valueType].percent_to_next_level, 84)} 
                                    style={{ width: '84px', height: '84px', overflow: 'visible' }}
                                /> 
                                
                            </div>
                            <div className="absolute w-full h-full flex items-center justify-center bottom-[0.5px] right-[0.5px] z-10">
                                <ReactECharts 
                                    option={transparentChartOptions(data.lifetime[key][valueType].percent_to_next_level, 64)} 
                                    style={{ width: '64px', height: '64px', }}
                                />
                            </div>
                            <div className="absolute top-[2px] left-[4px] w-[34px] h-[34px] flex flex-col -gap-y-[5px] justify-center items-center bg-medium-background/80 rounded-full z-30">
                                <div className="numbers-xxs -mb-[2px]">{data.lifetime[key][valueType].level}</div>
                                <div className="text-xxxs text-color-ui-hover">Level</div>
                            </div>
                            <div className="absolute flex flex-col  gap-y-[2px] justify-center items-center right-0 left-0 top-[37%]">
                                <div className="numbers-sm">{formatNumber(data.lifetime[key][valueType].total_value)}</div>
                                <div className="flex gap-x-[1px] h-fit items-center numbers-xxxs">
                                    <div className="pt-[1px]">{Math.round(data.lifetime[key][valueType].percent_to_next_level)}%</div> 
                                    <div className="text-xxxs">to</div> 
                                    <div className="flex items-center justify-center w-[16px] h-[16px] rounded-full bg-color-bg-medium numbers-xxs ">{data.lifetime[key][valueType].level + 1}</div></div>
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


// const StreakIcon = ({highlighted}: {highlighted: boolean}) => {
//     return (
//         <svg xmlns="http://www.w3.org/2000/svg" width={!highlighted ? "14" : "22"} height={!highlighted ? "25" : "39"} viewBox="0 0 14 25" fill="none">
//             <defs>
//                 <linearGradient id="paint0_linear_3243_5093" x1="3.48746" y1="0" x2="3.48746" y2="25" gradientUnits="userSpaceOnUse">
//                     <stop stopColor="#FE5468"/>
//                     <stop offset="0.5" stopColor="#FFDF27"/>
//                     <stop offset="1" stopColor="#FE5468"/>
//                 </linearGradient>
//             </defs>
//             <path d="M0.305062 13.1511C0.227915 12.0746 0.521074 11.0862 1.15005 10.1278C1.57118 9.49066 2.16839 8.80269 2.82732 8.04483C4.52728 6.08711 6.63295 3.66378 7.14848 0.452637C8.26938 2.91409 7.72572 5.30747 6.48501 7.50843C5.92683 8.49773 5.30874 9.20839 4.71879 9.88638C4.02447 10.6842 3.37008 11.4366 2.89993 12.543C2.64126 13.1447 2.49423 13.7211 2.42525 14.2847L0.305062 13.1511Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//             <path d="M3.94336 15.0985C4.20203 14.1492 4.64948 13.2615 5.24397 12.4002C5.7359 11.6814 6.19697 11.1486 6.61084 10.6703C8.00312 9.05926 8.86717 8.05907 8.61394 2.65967C8.77641 3.00638 8.93705 3.34038 9.09316 3.66258L9.09407 3.6644C10.4519 6.48345 11.4049 8.46023 9.80382 11.1749C9.01238 12.5164 8.43514 13.1835 7.92506 13.7734C7.35054 14.4369 6.86043 15.0041 6.24416 16.3238L3.94336 15.0985Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//             <path d="M9.90482 14.248C9.28038 14.9877 8.26113 16.0078 8.21484 16.075L13.9827 12.8503C13.862 11.7756 13.0697 10.5095 12.0958 8.70972C12.2928 11.0822 11.367 12.5153 9.90482 14.248Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//             <path d="M13.9412 13.9224C13.786 14.6103 12.9365 16.0416 12.3121 16.785C10.3389 19.1321 9.31151 20.1332 7.62335 23.6647C7.52805 23.2826 7.42821 22.9223 7.33291 22.5783C6.86186 20.8792 6.57233 19.4643 7.13686 18.2444L13.9412 13.9224Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//             <path d="M6.32152 21.879C5.83867 20.4659 5.49196 19.2842 5.74427 17.7893L3.72755 16.4751C3.61592 18.6742 4.5553 21.2419 7.14926 24.5474C7.0113 23.7288 6.59743 22.6868 6.32152 21.879Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//             <path d="M2.38333 15.5991C2.41782 16.3143 2.85983 18.2048 3.25555 19.205C2.12648 17.7646 0.892125 15.5546 0.539062 14.3965L2.38333 15.5991Z" fill={highlighted ? "url(#paint0_linear_3243_5093)" : "#344240"}/>
//         </svg>
//     )
// }

const StreakIcon = ({ progress = 0, animated = false }) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));
  
    // Convert volume percentage to height percentage for diamond shape
    const volumeToHeight = (volumePercent) => {
        const v = volumePercent / 100;
        
        // Diamond shape: narrow bottom → wide middle → narrow top
        const gamma = 0.995;
        const heightPercent = v <= 0.5 ? Math.pow(2 * v, gamma) * 50 : 100 - Math.pow(2 * (1 - v), gamma) * 50;

        return heightPercent;
    };
    
    // Calculate the height of the filled portion (from bottom up)
    // Since the viewBox height is 25, we calculate based on that
    const viewBoxHeight = 25;
    const heightPercent = volumeToHeight(clampedProgress);
    const filledHeight = (heightPercent / 100) * viewBoxHeight;
    const unfilledY = viewBoxHeight - filledHeight;
  
    const waveY = unfilledY;
    const waveHeight = 1; // Height of the wave oscillation
  
    const uniqueId = `fire-progress-${Math.random().toString(36).substring(2, 11)}`;
    
    const linearGradientProps = [
        {
            id: `${uniqueId}-paint0_linear`,
            x1: "4.48463",
            y1: "0.452637",
            x2: "4.48463",
            y2: "14.2847",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
        {
            id: `${uniqueId}-paint1_linear`,
            x1: "7.75112",
            y1: "2.65967",
            x2: "7.75112",
            y2: "16.3238",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
        {
            id: `${uniqueId}-paint2_linear`,
            x1: "11.5578",
            y1: "8.70972",
            x2: "11.5578",
            y2: "16.075",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
        {
            id: `${uniqueId}-paint3_linear`,
            x1: "10.8427",
            y1: "13.9224",
            x2: "10.8427",
            y2: "23.6647",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
        {
            id: `${uniqueId}-paint4_linear`,
            x1: "5.89299",
            y1: "16.4751",
            x2: "5.89299",
            y2: "24.5474",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
        {
            id: `${uniqueId}-paint5_linear`,
            x1: "2.35629",
            y1: "14.3965",
            x2: "2.35629",
            y2: "19.205",
            stops: [
                {offset: 0, stopColor: "#FE5468"},
                {offset: 1, stopColor: "#FFDF27" }
            ]
        },
    ];

    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 25" fill="none">
        <defs>
        {linearGradientProps.map((props, index) => (
            <linearGradient key={index} {...props} gradientUnits="userSpaceOnUse">
                {props.stops.map((s, i) => (
                    <stop key={i} offset={s.offset} stopColor={s.stopColor}>
                        {/* {animated && (
                            <animate
                                attributeName="stop-color"
                                values="#FE5468; #FF6B3D; #FE5468; #FF4757; #FE5468"
                                dur="2.5s"
                                repeatCount="indefinite"
                            />
                        )} */}
                    </stop>
                ))}
            </linearGradient>
        ))}
          
          {/* Clip path for the filled portion */}
          <clipPath id={`${uniqueId}-fillClip`}>
            {animated && clampedProgress > 0 && clampedProgress < 100 ? (
              <path 
                d={`M 0 ${waveY} Q 1.17 ${waveY - waveHeight} 2.33 ${waveY} T 4.67 ${waveY} T 7 ${waveY} T 9.33 ${waveY} T 11.67 ${waveY} T 14 ${waveY} L 14 25 L 0 25 Z`}
              >
                <animate
                  attributeName="d"
                  dur="3s"
                  repeatCount="indefinite"
                  values={`
                    M 0 ${waveY} Q 1.17 ${waveY - waveHeight} 2.33 ${waveY} T 4.67 ${waveY} T 7 ${waveY} T 9.33 ${waveY} T 11.67 ${waveY} T 14 ${waveY} L 14 25 L 0 25 Z;
                    M 0 ${waveY} Q 1.17 ${waveY + waveHeight * 0.5} 2.33 ${waveY} T 4.67 ${waveY} T 7 ${waveY - waveHeight * 0.8} T 9.33 ${waveY} T 11.67 ${waveY} T 14 ${waveY} L 14 25 L 0 25 Z;
                    M 0 ${waveY} Q 1.17 ${waveY} 2.33 ${waveY} T 4.67 ${waveY + waveHeight * 0.6} T 7 ${waveY} T 9.33 ${waveY} T 11.67 ${waveY - waveHeight} T 14 ${waveY} L 14 25 L 0 25 Z;
                    M 0 ${waveY} Q 1.17 ${waveY - waveHeight * 0.4} 2.33 ${waveY} T 4.67 ${waveY} T 7 ${waveY + waveHeight * 0.7} T 9.33 ${waveY} T 11.67 ${waveY} T 14 ${waveY - waveHeight * 0.5} L 14 25 L 0 25 Z;
                    M 0 ${waveY} Q 1.17 ${waveY} 2.33 ${waveY + waveHeight * 0.8} T 4.67 ${waveY} T 7 ${waveY} T 9.33 ${waveY - waveHeight * 0.6} T 11.67 ${waveY} T 14 ${waveY} L 14 25 L 0 25 Z;
                    M 0 ${waveY} Q 1.17 ${waveY - waveHeight} 2.33 ${waveY} T 4.67 ${waveY} T 7 ${waveY} T 9.33 ${waveY} T 11.67 ${waveY} T 14 ${waveY} L 14 25 L 0 25 Z
                  `}
                  keyTimes="0; 0.2; 0.4; 0.6; 0.8; 1"
                  calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1; 0.45 0 0.55 1"
                />
              </path>
            ) : (
              <rect x="0" y={unfilledY} width="14" height={filledHeight} />
            )}
          </clipPath>
          
          {/* Clip path for the unfilled portion (top part) */}
          <clipPath id={`${uniqueId}-unfillClip`}>
            <rect x="0" y="0" width="14" height={viewBoxHeight} />
          </clipPath>
        </defs>
        
        {/* Gray unfilled portion */}
        <g clipPath={`url(#${uniqueId}-unfillClip)`}>
          <path d="M0.305062 13.1511C0.227915 12.0746 0.521074 11.0862 1.15005 10.1278C1.57118 9.49066 2.16839 8.80269 2.82732 8.04483C4.52728 6.08711 6.63295 3.66378 7.14848 0.452637C8.26938 2.91409 7.72572 5.30747 6.48501 7.50843C5.92683 8.49773 5.30874 9.20839 4.71879 9.88638C4.02447 10.6842 3.37008 11.4366 2.89993 12.543C2.64126 13.1447 2.49423 13.7211 2.42525 14.2847L0.305062 13.1511Z" fill="rgb(var(--bg-medium))"></path>
          <path d="M3.94336 15.0985C4.20203 14.1492 4.64948 13.2615 5.24397 12.4002C5.7359 11.6814 6.19697 11.1486 6.61084 10.6703C8.00312 9.05926 8.86717 8.05907 8.61394 2.65967C8.77641 3.00638 8.93705 3.34038 9.09316 3.66258L9.09407 3.6644C10.4519 6.48345 11.4049 8.46023 9.80382 11.1749C9.01238 12.5164 8.43514 13.1835 7.92506 13.7734C7.35054 14.4369 6.86043 15.0041 6.24416 16.3238L3.94336 15.0985Z" fill="rgb(var(--bg-medium))"></path>
          <path d="M9.90482 14.248C9.28038 14.9877 8.26113 16.0078 8.21484 16.075L13.9827 12.8503C13.862 11.7756 13.0697 10.5095 12.0958 8.70972C12.2928 11.0822 11.367 12.5153 9.90482 14.248Z" fill="rgb(var(--bg-medium))"></path>
          <path d="M13.9412 13.9224C13.786 14.6103 12.9365 16.0416 12.3121 16.785C10.3389 19.1321 9.31151 20.1332 7.62335 23.6647C7.52805 23.2826 7.42821 22.9223 7.33291 22.5783C6.86186 20.8792 6.57233 19.4643 7.13686 18.2444L13.9412 13.9224Z" fill="rgb(var(--bg-medium))"></path>
          <path d="M6.32152 21.879C5.83867 20.4659 5.49196 19.2842 5.74427 17.7893L3.72755 16.4751C3.61592 18.6742 4.5553 21.2419 7.14926 24.5474C7.0113 23.7288 6.59743 22.6868 6.32152 21.879Z" fill="rgb(var(--bg-medium))"></path>
          <path d="M2.38333 15.5991C2.41782 16.3143 2.85983 18.2048 3.25555 19.205C2.12648 17.7646 0.892125 15.5546 0.539062 14.3965L2.38333 15.5991Z" fill="rgb(var(--bg-medium))"></path>
        </g>
        
        {/* Colored filled portion */}
        <g clipPath={`url(#${uniqueId}-fillClip)`}>
          <path d="M0.764047 13.1511C0.686899 12.0746 0.980059 11.0862 1.60904 10.1278C2.03017 9.49066 2.62738 8.80269 3.28631 8.04483C4.98627 6.08711 7.09193 3.66378 7.60746 0.452637C8.72836 2.91409 8.1847 5.30747 6.94399 7.50843C6.38581 8.49773 5.76772 9.20839 5.17778 9.88638C4.48345 10.6842 3.82906 11.4366 3.35892 12.543C3.10025 13.1447 2.95321 13.7211 2.88423 14.2847L0.764047 13.1511Z" fill={`url(#${uniqueId}-paint0_linear)`}></path>
          <path d="M4.40234 15.0985C4.66101 14.1492 5.10847 13.2615 5.70296 12.4002C6.19488 11.6814 6.65595 11.1486 7.06982 10.6703C8.4621 9.05926 9.32615 8.05907 9.07293 2.65967C9.23539 3.00638 9.39604 3.34038 9.55215 3.66258L9.55305 3.6644C10.9108 6.48345 11.8638 8.46023 10.2628 11.1749C9.47137 12.5164 8.89413 13.1835 8.38405 13.7734C7.80953 14.4369 7.31942 15.0041 6.70315 16.3238L4.40234 15.0985Z" fill={`url(#${uniqueId}-paint1_linear)`}></path>
          <path d="M10.3638 14.248C9.73937 14.9877 8.72012 16.0078 8.67383 16.075L14.4417 12.8503C14.321 11.7756 13.5287 10.5095 12.5548 8.70972C12.7517 11.0822 11.826 12.5153 10.3638 14.248Z" fill={`url(#${uniqueId}-paint2_linear)`}></path>
          <path d="M14.4002 13.9224C14.245 14.6103 13.3955 16.0416 12.7711 16.785C10.7979 19.1321 9.77049 20.1332 8.08233 23.6647C7.98703 23.2826 7.88719 22.9223 7.79189 22.5783C7.32084 20.8792 7.03131 19.4643 7.59585 18.2444L14.4002 13.9224Z" fill={`url(#${uniqueId}-paint3_linear)`}></path>
          <path d="M6.7805 21.879C6.29765 20.4659 5.95094 19.2842 6.20326 17.7893L4.18654 16.4751C4.0749 18.6742 5.01428 21.2419 7.60825 24.5474C7.47029 23.7288 7.05642 22.6868 6.7805 21.879Z" fill={`url(#${uniqueId}-paint4_linear)`}></path>
          <path d="M2.84232 15.5991C2.87681 16.3143 3.31882 18.2048 3.71454 19.205C2.58547 17.7646 1.35111 15.5546 0.998047 14.3965L2.84232 15.5991Z" fill={`url(#${uniqueId}-paint5_linear)`}></path>
        </g>
      </svg>
    );
};