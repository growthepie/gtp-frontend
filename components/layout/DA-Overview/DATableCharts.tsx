"use client";
import {
    HighchartsProvider,
    HighchartsChart,
    Chart,
    XAxis,
    YAxis,
    Title,
    Tooltip,
    PlotBand,
    AreaSeries,
    ColumnSeries,
    LineSeries,
    PieSeries,
    Series,
} from "react-jsx-highcharts";
import Highcharts, { chart } from "highcharts/highstock";
import { useLocalStorage } from "usehooks-ts";
import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { useMaster } from "@/contexts/MasterContext";
import "@/app/highcharts.axis.css";
import Icon from "@/components/layout/Icon";
import { DAConsumerChart } from "@/types/api/DAOverviewResponse";
import { stringToDOM } from "million";
import { Any } from "react-spring";
import { format } from "path";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { MasterResponse } from "@/types/api/MasterResponse";
import DynamicIcon from "../DynamicIcon";

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};

type PieData = { name: string, y: number, color: string }[]
// @/public/da_table_watermark.png


const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C","#667170","#5A6665","#4F5B5A","#43504F","#384443","#2C3938"]

export default function DATableCharts({selectedTimespan, data, isMonthly, da_name, pie_data, master}: {selectedTimespan: string, data?: any, isMonthly: boolean, da_name: string, pie_data: DAConsumerChart, master: MasterResponse }) {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const { AllDALayersByKeys, AllChainsByKeys } = useMaster();
    const [selectedChain, setSelectedChain] = useState<string>("all");


    
    const timespans = useMemo(() => {

        let xMax = 0;
        Object.keys(data.da_consumers).forEach((key) => { 
          
          const values = data.da_consumers[key].daily.values;
          const length = values.length;
          const types = data.da_consumers[key].daily.types;
      
          if(values[values.length - 1][types.indexOf("unix")] > xMax){
            xMax = values[values.length - 1][types.indexOf("unix")];
          }
        })

    
        if (!isMonthly) {
          return {
            "1d": {
              shortLabel: "1d",
              label: "1 day",
              value: 1,
            },
            "7d": {
              shortLabel: "7d",
              label: "7 days",
              value: 7,
              xMin: xMax - 7 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "30d": {
              shortLabel: "30d",
              label: "30 days",
              value: 30,
              xMin: xMax - 30 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "90d": {
              shortLabel: "90d",
              label: "90 days",
              value: 90,
              xMin: xMax - 90 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        } else {
          return {
            "180d": {
              shortLabel: "6m",
              label: "6 months",
              value: 90,
              xMin: xMax - 180 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        }
      }, [isMonthly, data, selectedTimespan]);


    const allChainsTotal = useMemo(() => {

        let totalArray = [[Number, Number]]
        Object.keys(data.da_consumers).forEach((key) => { 
          
          const values = data.da_consumers[key].daily.values;
          const types = data.da_consumers[key].daily.types;
          const total = values.map((d) => [
            d[types.indexOf("unix")], 
            d[types.indexOf("data_posted")]
          ])
          
        })
    }, [data]);    

    const formattedPieData = useMemo(() => {
        let pieRetData: PieData = []; // Correctly define the type as an array of [string, number] tuples
    
        // Create a map of pie data for quick lookup

        let pieTotal = 0;
        pie_data.data.forEach((d) => {
            pieTotal += d[4];
        });
        
        const pieDataMap = new Map(
            pie_data.data.map((d) => [
                d[0],
                {
                    name: d[1],
                    y: d[4],
                    color: AllChainsByKeys[d[0]] 
                        ? AllChainsByKeys[d[0]].colors["dark"][0] 
                        : "#566462",
                },
            ])
        );
    
        // Add selected chains in order
        if(selectedChain !== "all"){
        
            if (pieDataMap.has(selectedChain)) {
                pieRetData.push(pieDataMap.get(selectedChain)!); // Add data in selected order
            }
        
        }else{
        // Add non-selected chains
            pie_data.data.forEach((d) => {
                
                    pieRetData.push({
                        name: d[1] ? d[1] : d[0],
                        y: d[4] / pieTotal,
                        color: AllChainsByKeys[d[0]] 
                            ? AllChainsByKeys[d[0]].colors["dark"][0] 
                            : "#566462",
                    });
                
            });
        }
    
        return pieRetData;
    }, [pie_data, selectedChain, AllChainsByKeys]);
    


    const filteredChains = useMemo(() => {
        const baseData = data.da_consumers;

        if (selectedChain === "all") {
            return baseData;
        } else {
            const filteredData: any = {};
            filteredData[selectedChain] = baseData[selectedChain];
            return filteredData;
        }
    }, [data, selectedChain]);

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return "0 Bytes";
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }



    const tooltipFormatter = useCallback(
        function (this: any) {
            const { x, points } = this;
            const date = new Date(x);
            let dateString = date.toLocaleDateString("en-GB", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });

            let total = 0;
            const chartTitle = this.series.chart.title.textStr;
    
            // check if data steps are less than 1 day
            // if so, add the time to the tooltip
            const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
            if (timeDiff < 1000 * 60 * 60 * 24) {
                dateString +=
                    " " +
                    date.toLocaleTimeString("en-GB", {
                        hour: "numeric",
                        minute: "2-digit",
                    });
            }
    
            // Create a scrollable container using CSS
            const tooltip = `<div class="mt-3 mr-3 w-[245px] md:w-52 text-xs font-raleway ">
                <div class="flex justify-between items-start max-w-[175px] heading-small-xs ml-6 mb-2"><div>${dateString}</div><div class="text-xs">Data Posted</div></div>
                <div class="max-h-[200px] w-full overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling: touch; hover:!pointer-events-auto tooltip-scrollbar"
                    onwheel="(function(e) {
                        const scroller = e.currentTarget;
                        const isAtTop = scroller.scrollTop === 0;
                        const isAtBottom = scroller.scrollHeight - scroller.clientHeight === scroller.scrollTop;
                        
                        if (e.deltaY < 0 && isAtTop) {
                            // Scrolling up at the top
                            return;
                        }
                        if (e.deltaY > 0 && isAtBottom) {
                            // Scrolling down at the bottom
                            return;
                        }
                        
                        e.stopPropagation();
                        e.preventDefault();
                        scroller.scrollTop += e.deltaY;
                    })(event)"
                >`;
            const tooltipEnd = `</div></div>`;
    
            // Updated scrollbar styles with thicker width and new color
            const scrollbarStyles = `
                <style>
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(31, 39, 38, 0.1);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #1F2726;
                        border-radius: 4px;
                    }
                    /* Firefox */
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #1F2726 rgba(31, 39, 38, 0.1);
                    }
                    /* Prevent text selection during scrolling */
                    #tooltipScroller {
                        user-select: none;
                    }
                </style>
            `;
    
            let pointsSum = points.reduce((acc: number, point: any) => {
                acc += point.y;
                return acc;
            }, 0);
    
            let pointSumNonNegative = points.reduce((acc: number, point: any) => {
                if (point.y > 0) acc += point.y;
                return acc;
            }, 0);
    
            const maxPoint = points.reduce((max: number, point: any) => {
                if (point.y > max) max = point.y;
                return max;
            }, 0);
    
            const maxPercentage = points.reduce((max: number, point: any) => {
                if (point.percentage > max) max = point.percentage;
                return max;
            }, 0);
    
        
            const tooltipPoints = points
                .sort((a: any, b: any) => b.y - a.y)
                .map((point: any, index: number) => {
                    const { series, y, percentage } = point;
                    const { name } = series;
                    const nameString = name;
                    let percentSize = (y / pointsSum) * 175;
                    let suffix = "";
                    let value = y;
                    let displayValue = y;
                    total += y;
    
                    return `
                    <div class="flex w-[215px] space-x-2 items-center font-medium mb-0.5 pr-2 overflow-x-hidden ">
                        <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color}"></div>
                        <div class="tooltip-point-name text-xs">${nameString}</div>
                        <div class="flex-1 text-right justify-end flex numbers-xs w-full">
                            <div class="flex justify-end text-right w-full">
                                <div class="flex justify-end w-full">${formatBytes(displayValue)}</div>
                                
                                
                            </div>
                            <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
                        </div>
                        <div class="relative">
                            <hr class="absolute border-t-[2px] right-[8px] top-[6px] min-w-[1px]" style="width: ${percentSize}px; border-color: ${series.color}"; />
                        </div>
                    </div>
                    `;
                })
                .join("");
            
            const totalString = `
                <div class="flex items-center pl-[25px] pr-[20px] mb-1.5 w-full justify-between">
                    <div class="tooltip-point-name text-xs font bold">Total</div>
                    <div class="numbers-xs">${formatBytes(total)}</div>
                </div>
            `
            return scrollbarStyles + tooltip + tooltipPoints + tooltipEnd + totalString;
        },
        [showUsd],
    );



    const pieTooltipFormatter = useCallback(
        function (this: any) {
            

          
            return `<div class="mt-3 mr-3 mb-3 w-40 text-xs font-raleway justify-between gap-x-[5px] flex items-center">
                <div class="flex gap-x-[5px] items-center ">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${this.color}"></div>
                    <div class="tooltip-point-name text-xs">${this.key}</div>
                </div>
                <div class="tooltip-point-name numbers-xs">${Intl.NumberFormat("en-GB", {
                    notation: "standard",
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                }).format(this.y * 100) + " %"}</div>
            
            </div>`;


    }, [showUsd])
    


    return(
        <div className="flex h-full w-full gap-x-[10px]">
            <div className="min-w-[730px] w-full flex flex-1 h-[217px] relative mr-[20px]">
                <div className="absolute left-[calc(50%-113px)] top-[calc(50%-29.5px)] z-50">
                    <Image src="/da_table_watermark.svg" alt="chart_watermark" width={226} height={59}  className="mix-blend-darken"/>
                </div>
                
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "234px",
                                width: "100%",
                                
                                

                                overflow: "visible",
                            },
                        }}
                        plotOptions={{
                            column: {
                                stacking: "normal",

                                borderWidth: 0,
                                color: {
                                    linearGradient: {
                                        x1: 0,
                                        y1: 1,
                                        x2: 0,
                                        y2: 0 // Adjust this for vertical or diagonal gradients if needed
                                    },
                                    stops: [
                                        [0, '#FE5468'], // 0% color
                                        [1, '#FFDF27']  // 100% color
                                    ]
                                }
                            },
                            area: {
                                stacking: "normal",
                                lineWidth: 2,
                                marker: {
                                    enabled: false,
                                },
                                
                            },
                            series: {
                                zIndex: 10,
                                animation: false,
                                marker: {
                                lineColor: "white",
                                radius: 0,
                                symbol: "circle",
                                },
                            },
                        }}
                    >
                    <Chart
                        backgroundColor={""}
                        type="column"
                        title={"test"}
                        overflow="visible"
                        panning={{ enabled: true }}
                        panKey="shift"
                        zooming={{ type: undefined }}
                        style={{ borderRadius: 15 }}
                        animation={{ duration: 50 }}
                        // margin={[0, 15, 0, 0]} // Use the array form for margin
                        //margin={[15, 21, 15, 0]}
                        marginLeft={40}
                        

                        marginBottom={30}

                        marginTop={2}
                    />
                    <Tooltip
                        useHTML={true}
                        shared={true}
                        split={false}
                        followPointer={true}
                        followTouchMove={true}
                        backgroundColor={"#1F2726"}
                        padding={0}
                        hideDelay={300}
                        stickOnContact={true}
                        shape="rect"
                        borderRadius={17}
                        borderWidth={0}
                        outside={true}
                        shadow={{
                            color: "black",
                            opacity: 0.015,
                            offsetX: 2,
                            offsetY: 2,
                        }}
                        style={{
                            color: "rgb(215, 223, 222)",
                        }}
                    
                        // ensure tooltip is always above the chart
                        //positioner={tooltipPositioner}
                        valuePrefix={showUsd ? "$" : ""}
                        valueSuffix={showUsd ? "" : " Gwei"}
                        formatter={tooltipFormatter}
                    />
                    <XAxis
                        title={undefined}
                        type="datetime"
                   
                        labels={{
                            align: undefined,
                            rotation: 0,
                            // allowOverlap: false,
                            // staggerLines: 1,
                            // reserveSpace: true,

                            
                            overflow: "justify",
                            useHTML: true,
                            distance: -14,
                            style: {
                                color: COLORS.LABEL,
                                fontSize: "10px",
                                fontWeight: "550",
                                fontVariant: "small-caps",
                                textTransform: "lowercase",
                                fontFamily: "var(--font-raleway), sans-serif",
                                // fontVariant: "all-small-caps",
                                zIndex: 1000,
                                paddingTop: "22px",
                            },
                            enabled: true,

                            formatter: function () {
                            // Convert Unix timestamp to milliseconds
                            const date = new Date(this.value);
                            // Format the date as needed (e.g., "dd MMM yyyy")
                            const dateString = date
                                .toLocaleDateString("en-GB", {
                                day: !(
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                )
                                    ? "2-digit"
                                    : undefined,
                                month: "short",
                                year:
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                    ? "numeric"
                                    : undefined,
                                })
                                .toUpperCase();

                            return `<span class="font-bold">${dateString}</span>`;
                            },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: COLORS.PLOT_LINE,
                            snap: false,
                        }}
                        zoomEnabled={false}
                 
                        lineWidth={1}
                        
                        
                        startOnTick={true}
                        endOnTick={true}
                        tickAmount={0}

                        tickLength={5}
                        tickWidth={1}
                        // ordinal={true}
                        
                        minorTicks={false}
                        minorTickLength={2}
                        minorTickWidth={2}
                        minorGridLineWidth={0}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
                        // min={
                        //   timespans[selectedTimespan].xMin
                        //     ? newestUnixTimestamp -
                        //       1000 *
                        //         60 *
                        //         60 *
                        //         24 *
                        //         (timespans[selectedTimespan].value - 1)
                        //     : undefined
                        // }
                        min={timespans[selectedTimespan].xMin} // don't include the last day
                        max={timespans[selectedTimespan].xMax}
                        panningEnabled={true}
                    ></XAxis>
                    <YAxis
                    opposite={false}
                    type="linear"
                    gridLineWidth={0}
                    gridLineColor={"#5A64624F"}
                    showFirstLabel={false}
                    showLastLabel={false}
                    tickAmount={5}
                    labels={{
                        align: "right",
                        y: -2,
                        x: -2,
                        style: {
                            backgroundColor: "#1F2726",
                            whiteSpace: "nowrap",
                            color: "rgb(215, 223, 222)",
                            fontSize: "9px",
                            fontWeight: "600",
                            fontFamily: "var(--font-raleway), sans-serif",
                        },
                        // formatter: function (
                        // t: Highcharts.AxisLabelsFormatterContextObject,
                        // ) {
                        //   return formatNumber(metricKey, t.value);
                        // },
                    }}
                    min={0}
                    
                    >
                        {Object.keys(filteredChains).map((key, index) => {
                            const types = data.da_consumers[key].daily.types;
                            const name = data.da_consumers[key].daily.values[0][1];
                            
                            return(
                                <AreaSeries
                                    key={key + "-DATableCharts" + da_name} 
                                    name={name} 
                                    visible={data.da_consumers[key].daily.values.length > 0}
                                    
                                    data={data.da_consumers[key].daily.values.map((d) => [
                                        d[types.indexOf("unix")], 
                                        d[types.indexOf("data_posted")]
                                    ])}
                                    color={AllChainsByKeys[key] ? AllChainsByKeys[key].colors["dark"][0] : UNLISTED_CHAIN_COLORS[index]}
                                />
                            )
                        })}

                        
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
            <div className="min-w-[125px] flex flex-col gap-y-[2px] items-start justify-center h-full">
                {/* Chains */}

                
                {Object.keys(data.da_consumers).map((key, index) => {
                        const custom_logo_keys = Object.keys(master.custom_logos);
                        
                        return(
                            <div key={key + "da_consumers_info"} className={`flex relative gap-x-[5px] px-[5px] text-xxs rounded-full py-[0.5px] items-center transition-all cursor-pointer bg-[#344240] ${
                                (selectedChain === "all" || selectedChain === key) ? "bg-[#344240] border-[1px] border-transparent" : "bg-transparent border-[1px] border-[#344240]"}
                                ${selectedChain === "all" ? "px-[5px]" : "pl-[5px] pr-[20px]"}

                            }`}
                                onClick={() => {
                                    setSelectedChain((prev) => {
                                        if (selectedChain === key) {
                                            return "all";
                                        } else {
                                            return key
                                        }
                                    });
                                }}
                               
                            >
                                
                                <div>{AllChainsByKeys[data.da_consumers[key].daily.values[0][2]] ? 
                                    (<Icon icon={`gtp:${AllChainsByKeys[data.da_consumers[key].daily.values[0][2]].urlKey}-logo-monochrome`} className="w-[12px] h-[12px]" style={{ color: AllChainsByKeys[key].colors["dark"][0] }} />) 
                                    : custom_logo_keys.includes(key) 
                                        ? (    
                                         <DynamicIcon 
                                            pathString={master.custom_logos[key].body}
                                            size={12} 
                                            className="text-forest-200"
                                            viewBox="0 0 15 15"
                                             
                                        />
                                          ) 
                                        : (<div></div>)}</div>
                                <div className="text-xxs">{data.da_consumers[key].daily.values[0][1]}</div>
                                <div className={`absolute right-[2px] top-[2.5px] w-[12px] h-[12px] text-[#FE5468] ${selectedChain === "all" ? "invisible" : "visible"}`}><Icon icon={selectedChain === key ? "gtp:x-circle" : "gtp:plus-circle"} className="w-[12px] h-[12px] "></Icon></div>
                            </div>
                        )
                    }
                )}
            </div>
            <div className="min-w-[254px] flex items-center  relative pt-[15px] ">
                {/* Pie Chart */}
                <div className="absolute left-[31%] w-[99px] flex items-center justify-center bottom-[49%] text-xxxs font-bold leading-[120%] ">{"% OF TOTAL USAGE"}</div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "234px",
                                width: "254px",
                                
                                

                                overflow: "visible",
                            },
                        }}
                        plotOptions={{
                            pie: {
                                allowPointSelect: true,
                                cursor: "pointer",
                                dataLabels: {
                                    enabled: true,
                                    format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                                },
                                showInLegend: true,
                                borderWidth: 10,
                                borderColor: "transparent",
                            }
                        }}
                    >
                    <Chart
                        backgroundColor={""}
                        type="area"
                        title={"test"}
                        overflow="visible"
                        panning={{ enabled: true }}
                        panKey="shift"
                        zooming={{ type: undefined }}
                        style={{ borderRadius: 15 }}
                        animation={{ duration: 50 }}
                        // margin={[0, 15, 0, 0]} // Use the array form for margin
                        //margin={[15, 21, 15, 0]}
                        

                        marginBottom={30}

                        marginTop={2}

                        
                    />
                    <Tooltip
                        useHTML={true}
                        shared={true}
                        split={false}
                        followPointer={true}
                        followTouchMove={true}
                        backgroundColor={"#2A3433EE"}
                        padding={0}
                        hideDelay={300}
                        stickOnContact={true}
                        shape="rect"
                        borderRadius={17}
                        borderWidth={0}
                        outside={true}
                        shadow={{
                            color: "black",
                            opacity: 0.015,
                            offsetX: 2,
                            offsetY: 2,
                        }}
                        style={{
                            color: "rgb(215, 223, 222)",
                        }}
                    
                        // ensure tooltip is always above the chart
                        //positioner={tooltipPositioner}

                        valuePrefix={showUsd ? "$" : ""}
                        valueSuffix={showUsd ? "" : " Gwei"}
                        formatter={pieTooltipFormatter}
                        
                    />
                    <XAxis
                        title={undefined}
                        type="datetime"
                        
                        labels={{
                            align: undefined,
                            rotation: 0,
                            // allowOverlap: false,
                            // staggerLines: 1,
                            // reserveSpace: true,

                            
                            overflow: "justify",
                            useHTML: true,
                            distance: -14,
                            style: {
                                color: COLORS.LABEL,
                                fontSize: "10px",
                                fontWeight: "550",
                                fontVariant: "small-caps",
                                textTransform: "lowercase",
                                fontFamily: "var(--font-raleway), sans-serif",
                                // fontVariant: "all-small-caps",
                                zIndex: 1000,
                                paddingTop: "22px",
                            },
                            enabled: true,

                            formatter: function () {
                            // Convert Unix timestamp to milliseconds
                            const date = new Date(this.value);
                            // Format the date as needed (e.g., "dd MMM yyyy")
                            const dateString = date
                                .toLocaleDateString("en-GB", {
                                day: !(
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                )
                                    ? "2-digit"
                                    : undefined,
                                month: "short",
                                year:
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                    ? "numeric"
                                    : undefined,
                                })
                                .toUpperCase();

                            return `<span class="font-bold">${dateString}</span>`;
                            },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: "transparent",
                            snap: false,

                        }}
                        zoomEnabled={false}
                 
                        lineWidth={3}
                        
                        
                        startOnTick={true}
                        endOnTick={true}
                        tickAmount={0}

                        tickLength={5}
                        tickWidth={1}
                        // ordinal={true}
                        
                        minorTicks={false}
                        minorTickLength={2}
                        minorTickWidth={2}
                        minorGridLineWidth={0}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
                        // min={
                        //   timespans[selectedTimespan].xMin
                        //     ? newestUnixTimestamp -
                        //       1000 *
                        //         60 *
                        //         60 *
                        //         24 *
                        //         (timespans[selectedTimespan].value - 1)
                        //     : undefined
                        // }
                        min={timespans[selectedTimespan].xMin} // don't include the last day
                        max={timespans[selectedTimespan].xMax}
                        panningEnabled={true}
                    ></XAxis>
                    <YAxis
                    opposite={false}
                    type="linear"
                    gridLineWidth={0}
                    gridLineColor={"#5A64624F"}
                    showFirstLabel={false}
                    showLastLabel={false}
                    tickAmount={5}
                    labels={{
                        align: "right",
                        y: -2,
                        x: -2,
                        style: {
                            backgroundColor: "#1F2726",
                            whiteSpace: "nowrap",
                            color: "rgb(215, 223, 222)",
                            fontSize: "9px",
                            fontWeight: "600",
                            fontFamily: "var(--font-raleway), sans-serif",
                        },
                        // formatter: function (
                        // t: Highcharts.AxisLabelsFormatterContextObject,
                        // ) {
                        //   return formatNumber(metricKey, t.value);
                        // },
                    }}
                    min={0}
                    
                    >
                            <PieSeries
                                key={`${"Pie"}-DATableCharts-${da_name}`}
                                name={"Pie Chart"}
                                innerSize={"95%"}
                                dataLabels={{
                                    enabled: false,
                                }}
                                type="pie"
                                data={formattedPieData}
                                point={{
                                    events: {
                                        mouseOver: function () {
                                            
                                        },
                                    },
                                }}
                                
                            /> 
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
        </div>
    )
}