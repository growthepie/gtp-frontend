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
import { useMemo, memo,  useState, useCallback, useRef, useEffect } from "react";
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
import { match } from "assert";
import useChartSync from "./components/ChartHandler";
import { get } from "lodash";
import { locale } from "moment";
import ChartWatermark from "../ChartWatermark";
import { Badge } from "@/app/(labels)/labels/Search";
import highchartsPatternFill from "highcharts/modules/pattern-fill";
// import highchartsAnnotations from "highcharts/modules/annotations";
import highchartsRoundedCorners from "highcharts-rounded-corners";

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
interface DATableChartsProps {
    selectedTimespan: string;
    data?: any;
    isOpen?: boolean;
    isMonthly: boolean;
    da_name: string;
    pie_data: DAConsumerChart;
    master: MasterResponse;
}

const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C","#667170","#5A6665","#4F5B5A","#43504F","#384443","#2C3938"]

const DATableChartsComponent = ({
    selectedTimespan,
    data,
    isMonthly,
    isOpen,
    da_name,
    pie_data,
    master,
  }: DATableChartsProps) => {
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const { AllDALayersByKeys, AllChainsByKeys } = useMaster();
    const [selectedChain, setSelectedChain] = useState<string>("all");
  // const [hoverChain, setHoverChain] = useState<string | null>(null);
    const pieChartComponent = useRef<Highcharts.Chart | null>(null);
    const chartComponent = useRef<Highcharts.Chart | null>(null);

    useEffect(() => {
        Highcharts.setOptions({
          lang: {
            numericSymbols: ["K", " M", "B", "T", "P", "E"],
          },
        });
        highchartsRoundedCorners(Highcharts);
        // highchartsAnnotations(Highcharts);
        highchartsPatternFill(Highcharts);
    
        // update x-axis label sizes if it is a 4 digit number
        Highcharts.wrap(
          Highcharts.Axis.prototype,
          "renderTick",
          function (proceed) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    
            const axis: Highcharts.Axis = this;
            const ticks: Highcharts.Dictionary<Highcharts.Tick> = axis.ticks;
            if (
              axis.isXAxis &&
              axis.options.labels &&
              axis.options.labels.enabled
            ) {
              Object.keys(ticks).forEach((tick) => {
                const tickLabel = ticks[tick].label;
                if (!tickLabel) return;
                const tickValue = tickLabel.element.textContent;
                if (tickValue) {
                  // if the tick value is a 4 digit number, increase the font size
                  if (tickValue.length === 4) {
                    tickLabel.css({
                      transform: "scale(1.4)",
                      fontWeight: "600",
                    });
                  }
                }
              });
            }
          },
        );
    
      }, []);
   

    
    const timespans = useMemo(() => {

        let xMax = 0;
        let xMin = Infinity;
      
        Object.keys(data[selectedTimespan].da_consumers).forEach((key) => {
            const values = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values;
            const types = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].types;
            
            if (values.length > 0) {
                const unixIndex = types.indexOf("unix");
        
                // Calculate xMax (latest x-value)
                if (values[values.length - 1][unixIndex] > xMax) {
                xMax = values[values.length - 1][unixIndex];
                }
        
                // Calculate xMin (earliest x-value)
                if (values[0][unixIndex] < xMin) {
                xMin = values[0][unixIndex];
                }
            }
        });
       

    
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

            "180d": {
                shortLabel: "6m",
                label: "6 months",
                value: 180,
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
              xMin: xMin,
              xMax: xMax,
            },
          };
        } else {
          return {
            "90d": {
                shortLabel: "3m",
                label: "3 months",
                value: 90,
                xMin: xMax - 90 * 24 * 60 * 60 * 1000,
                xMax: xMax,
            },
            "180d": {
                shortLabel: "6m",
                label: "6 months",
                value: 180,
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
              xMin: xMin,
              xMax: xMax,
            },
          };
        }
      }, [isMonthly, data, selectedTimespan]);


    const allChainsTotal = useMemo(() => {

        let totalArray = [[Number, Number]]
        Object.keys(data[selectedTimespan].da_consumers).forEach((key) => { 
          
          const values = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values;
          const types = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].types;
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
            pie_data.data.map((d, index) => [
                d[0],
                {
                    name: d[1],
                    y: d[4],
                    color: AllChainsByKeys[d[0]] 
                        ? AllChainsByKeys[d[0]].colors["dark"][0] 
                        : UNLISTED_CHAIN_COLORS[index],
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
            pie_data.data.forEach((d, index) => {
                
                    pieRetData.push({
                        name: d[1] ? d[1] : d[0],
                        y: d[4] / pieTotal,
                        color: AllChainsByKeys[d[0]] 
                            ? AllChainsByKeys[d[0]].colors["dark"][0] 
                            : UNLISTED_CHAIN_COLORS[index],
                    });
                
            });
        }
    
        return pieRetData;
    }, [pie_data, selectedChain, AllChainsByKeys]);
    


    const filteredChains = useMemo(() => {
        const baseData = data[selectedTimespan].da_consumers;

        if (selectedChain === "all") {
            return baseData;
        } else {
            const filteredData: any = {};
            filteredData[selectedChain] = baseData[selectedChain];
            return filteredData;
        }
    }, [data, selectedChain, selectedTimespan]);

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return "0 Bytes";
    
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    
        const i = Math.floor(Math.log(bytes) / Math.log(k));
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    const getNameFromKey = useMemo<Record<string, string>>(() => {

        const chains = pie_data.data.reduce((acc, d) => {
            acc[d[0]] = d[1];
            return acc;
        }, {});
        
        return chains;

    }, [pie_data])

    const tooltipFormatter = useCallback(
        function (this: any) {
            const { x, points } = this;
            const date = new Date(x);
            let dateString = date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: !isMonthly ? "numeric" : undefined,
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
                        timeZone: "UTC",
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
    
            const nameToKey = Object.keys(getNameFromKey).reduce((acc, key) => {
                acc[getNameFromKey[key]] = key;
                return acc;
            }, {});
        
            const tooltipPoints = points
                .sort((a: any, b: any) => b.y - a.y)
                .map((point: any, index: number) => {
                    const { series, y, percentage } = point;
                    const { name } = series;
                    const realIndex = Object.keys(data[selectedTimespan].da_consumers).findIndex((k) => k === name);
                    const color = AllChainsByKeys[nameToKey[name]] ? AllChainsByKeys[nameToKey[name]].colors["dark"][0] : UNLISTED_CHAIN_COLORS[realIndex];
                    const nameString = name;
                    let percentSize = (y / pointsSum) * 175;
                    let suffix = "";
                    let value = y;
                    let displayValue = y;
                    total += y;
    
                    return `
                    <div class="flex w-[215px] space-x-2 items-center font-medium mb-0.5 pr-2 overflow-x-hidden ">
                        <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
                        <div class="tooltip-point-name text-xs">${nameString}</div>
                        <div class="flex-1 text-right justify-end flex numbers-xs w-full">
                            <div class="flex justify-end text-right w-full">
                                <div class="flex justify-end w-full">${formatBytes(displayValue)}</div>
                                
                                
                            </div>
                            <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
                        </div>
                        <div class="relative">
                            <hr class="absolute border-t-[2px] right-[8px] top-[6px] min-w-[1px]" style="width: ${percentSize}px; border-color: ${color}"; />
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
        [AllChainsByKeys, data, getNameFromKey, isMonthly, selectedTimespan],
    );



    const pieTooltipFormatter = useCallback(
        function (this: any) {
            

          
            return `<div class="mt-3 mr-3 mb-3 w-40 text-xs font-raleway justify-between gap-x-[5px] flex items-center">
                <div class="flex gap-x-[5px] items-center ">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${this.color}"></div>
                    <div class="tooltip-point-name text-xs">${this.key}</div>
                </div>
                <div class="tooltip-point-name numbers-xs">${selectedChain === "all" ? Intl.NumberFormat("en-GB", {
                    notation: "standard",
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                }).format((this.y * 100)) + " %" 
                
                :
                (formatBytes(this.y))
            }</div>
            
            </div>`;


    }, [showUsd, selectedChain])





  // const { hoverChain, setHoverChain } = useChartSync(pieChartComponent, chartComponent, getNameFromKey)

    const getSeriesData = useCallback(
        (name: string, types: string[], data: number[][], chartType: string, daColor: string) => {
            if (name === "")
                return {
                    data: [],
                    zoneAxis: undefined,
                    zones: undefined,
                    fillColor: undefined,
                    fillOpacity: undefined,
                    color: undefined,
                };
            const selectedTimeInterval = isMonthly ? "monthly" : "daily";

            const timeIndex = types.findIndex((type) => type === "unix");
            let valueIndex = 1;
            let valueMulitplier = 1;

            let zones: any[] | undefined = undefined;
            let zoneAxis: string | undefined = undefined;

            const isLineChart = chartType === "line";
            const isColumnChart = chartType === "column";

            const isAreaChart = chartType === "area";

            let fillOpacity = undefined;

            let seriesFill = "transparent";

            if (isAreaChart) {
                seriesFill = daColor + "33";
            }

            if (isAreaChart) {
                seriesFill = daColor + "33";
            }

            let fillColor =
                selectedTimeInterval === "daily"
                    ? daColor
                    : undefined;
            let color =
                selectedTimeInterval === "daily"
                    ? daColor
                    : undefined;

            if (types.includes("usd")) {
                if (showUsd) {
                    valueIndex = types.indexOf("usd");
                } else {
                    valueIndex = types.indexOf("eth");
                    // if (showGwei) valueMulitplier = 1000000000;
                }
            }
            console.log(data)
            const seriesData = data.map((d) => {
                return [d[timeIndex], d[valueIndex] * valueMulitplier];
            });

            let marker = {
                lineColor: daColor,
                radius: 0,
                symbol: "circle",
            }
            console.log(color)
            if (selectedTimeInterval === "daily") {
                return {
                    data: seriesData,
                    zoneAxis,
                    zones,
                    fillColor: seriesFill,
                    fillOpacity,
                    color,
                    marker,
                };
            }

            const columnFillColor = {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                },
                stops: [
                    [0, daColor + "FF"],
                    // [0.349, daColor + "88"],
                    [1, daColor + "00"],
                ],
            };

            const columnColor = {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1,
                },
                stops: [
                    [0, daColor + "FF"],
                    // [0.349, daColor + "88"],
                    [1, daColor + "00"],
                ],
            };

            const dottedColumnColor = {
                pattern: {
                    path: {
                        d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
                        "stroke-width": 3,
                    },
                    width: 10,
                    height: 10,
                    opacity: 1,
                    color: daColor + "CC",
                },
            };

            const todaysDateUTC = new Date().getUTCDate();

            const secondZoneDottedColumnColor =
                todaysDateUTC === 1 ? columnColor : dottedColumnColor;

            const secondZoneDashStyle = todaysDateUTC === 1 ? "Solid" : "Dot";

            console.log(isColumnChart)
            console.log(seriesData)

            // if it is not the last day of the month, add a zone to the chart to indicate that the data is incomplete
            if (selectedTimeInterval === "monthly") {

                if (seriesData.length > 1 && todaysDateUTC !== 1) {
                    zoneAxis = "x";
                    zones = [
                        {
                            value: seriesData[seriesData.length - 2][0] + 1,
                            dashStyle: "Solid",
                            fillColor: isColumnChart ? columnFillColor : seriesFill,
                            color: isColumnChart
                                ? columnColor
                                : daColor,
                        },
                        {
                            // value: monthlyData[monthlyData.length - 2][0],
                            dashStyle: secondZoneDashStyle,
                            fillColor: isColumnChart ? columnFillColor : seriesFill,
                            color: isColumnChart
                                ? secondZoneDottedColumnColor
                                : daColor,
                        },
                    ];
                } else if (todaysDateUTC !== 1) {
                    zoneAxis = "x";
                    zones = [
                        {
                            // value: monthlyData[monthlyData.length - 2][0],
                            dashStyle: secondZoneDashStyle,
                            fillColor: isColumnChart ? columnFillColor : seriesFill,
                            color: isColumnChart
                                ? secondZoneDottedColumnColor
                                : daColor,
                        }
                    ];
                    marker.radius = 2;
                } else {
                    zoneAxis = "x";
                    zones = [
                        {
                            // value: monthlyData[monthlyData.length - 2][0],
                            dashStyle: secondZoneDashStyle,
                            fillColor: isColumnChart ? columnFillColor : seriesFill,
                            color: isColumnChart
                                ? secondZoneDottedColumnColor
                                : daColor,
                        }
                    ];
                }
            }

            return {
                data: seriesData,
                zoneAxis,
                zones,
                fillColor,
                fillOpacity,
                color,
                marker,
            };
        },
        [isMonthly, showUsd],
    );
    
    

    


    return(
        <div className="flex h-full w-full gap-x-[10px]">
            <div className="heading-large-xs w-[250px] absolute left-[45px] h-[39px] flex items-center -top-[0px]">
                    Data Posted {selectedChain !== "all" ? `(${getNameFromKey[selectedChain]})` : ""}
            </div>
            <div className="min-w-[450px] w-full mt-[39px] flex flex-1 h-[217px] relative px-[5px] overflow-hidden  pr-[5px]">
                <div className="absolute left-[calc(50%-85px)] top-[calc(39%-29.5px)] z-0 opacity-20">
                    <ChartWatermark className="w-[225px] h-[45px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                    <div className="w-[225px] h-[15px] flex items-center justify-center "><div className=" text-[10px] leading-[120%] font-semibold ">DA: {da_name === "da_celestia" ? "CELESTIA" : "ETHEREUM BLOBS"}</div></div>
                </div>
                

                <hr className="absolute w-[92.5%] border-t-[2px] left-[55px] top-[4px] border-[#5A64624F] border-dotted " />
                <hr className="absolute w-[92.5%] border-t-[2px] left-[55px] top-[97px] border-[#5A64624F] border-dotted " />
                <hr className="absolute w-[92.5%] border-t-[2px] left-[55px] top-[190px] border-[#5A64624F] border-dotted " />
                
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "222px",
                                width: "100%",
                                position: "absolute",
                                

                                overflow: "visible",
                            },
                        }}
                        time={{
                            timezone: 'UTC',
                        }}

                        plotOptions={{
                            area: {
                                stacking: "normal",
                                lineWidth: 2,
                                marker: {
                                    enabled: false,
                                },
                                
                            },
                            column: {
                                stacking: "normal",
                                borderColor: "transparent",
                                groupPadding: 0,
                                animation: true,
                               
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
                        marginLeft={50}
                        
                        
                        marginBottom={32}

                        marginTop={5}
                        onRender={function (event) {
                            const chart = this; // Assign `this` to a variable for clarity
                            chartComponent.current = chart;
                           
                                
                            


                        }}


                        
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

                            formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {

                                if (timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin <= 40 * 24 * 3600 * 1000) {
                                  let isBeginningOfWeek = new Date(this.value).getUTCDay() === 1;
                                  let showMonth = this.isFirst || new Date(this.value).getUTCDate() === 1;
              
                                  return new Date(this.value).toLocaleDateString("en-GB", {
                                    timeZone: "UTC",
                                    month: "short",
                                    day: "numeric",
                                    year: this.isFirst ? "numeric" : undefined,
                                  });
                                }
                                else {
                                  // if Jan 1st, show year
                                  if (new Date(this.value).getUTCMonth() === 0) {
                                    return new Date(this.value).toLocaleDateString("en-GB", {
                                      timeZone: "UTC",
                                      year: "numeric",
                                    });
                                  }
                                  // if not 1st of the month, show month and day
                                  else if (new Date(this.value).getUTCDate() !== 1) {
                                    return new Date(this.value).toLocaleDateString("en-GB", {
                                      timeZone: "UTC",
                                      month: "short",
                                      day: "numeric",
                                    });
                                  }
                                  return new Date(this.value).toLocaleDateString("en-GB", {
                                    timeZone: "UTC",
                                    month: "short",
                                    year: "numeric",
                                  });
                                }
                              },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: COLORS.PLOT_LINE,
                            snap: false,
                        }}
                        zoomEnabled={false}
                 
                        lineWidth={1}

                        gridLineWidth={0}
                        startOnTick={false}
                        endOnTick={false}
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
                    showFirstLabel={true}
                    showLastLabel={true}
                    tickAmount={3}
                    offset={0}
                   
                    labels={{
                        align: "right",
                        y: 2,
                        x: -2,
                        
                        style: {
                            backgroundColor: "#1F2726",
                            whiteSpace: "nowrap",
                            color: "rgb(215, 223, 222)",
                            fontSize: "9px",
                            fontWeight: "600",
                            fontFamily: "var(--font-raleway), sans-serif",
                            
                        },
                        formatter: function (
                        t: Highcharts.AxisLabelsFormatterContextObject,
                        ) {
                          return formatBytes(t.value as number, 1);
                        },
                    }}
                    min={0}
                    
                    >
                        {Object.keys(filteredChains).filter((key) => {return data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0]}).map((key, index) => {
                            const realIndex = Object.keys(data[selectedTimespan].da_consumers).findIndex((k) => k === key);
                            const types = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].types;
                            const name = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][1];
                            
                            const daColor = AllChainsByKeys[key] ? AllChainsByKeys[key].colors["dark"][0] : UNLISTED_CHAIN_COLORS[realIndex];
                            
                            const unlistedColor =  AllChainsByKeys[key] ? false : true;

                            const seriesData = getSeriesData(
                                name,
                                types,
                                data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values,
                                isMonthly ? "column" : "area",
                                AllChainsByKeys[key] ? AllChainsByKeys[key].colors["dark"][0] : UNLISTED_CHAIN_COLORS[realIndex],
                            );

                            

                            const color = seriesData.color;
                            const zoneAxis = seriesData.zoneAxis;
                            const zones = seriesData.zones;
                            const fillColor = seriesData.fillColor;
                            const fillOpacity = seriesData.fillOpacity;
                            const marker = seriesData.marker;
                            const pointsSettings = {
                                pointPlacement:
                                  isMonthly
                                    ? 0
                                    : 0.5,
                              };

                            // getSeries data returns:
                            // return {
                            //     data: [],
                            //     zoneAxis: undefined,
                            //     zones: undefined,
                            //     fillColor: undefined,
                            //     fillOpacity: undefined,
                            //     color: undefined,
                            // };

                            

                            
                            return (
                                <Series
                                    type={isMonthly ? "column" : "area"}
                                    key={key + "-DATableCharts" + da_name}
                                    name={name}

                                    visible={data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values.length > 0}

                                    data={data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values.map((d) => [
                                        d[types.indexOf("unix")],
                                        d[types.indexOf("data_posted")]
                                    ])}
                                    color={color}
                                    
                                    states={{
                                        hover: {
                                          enabled: true,
                                          halo: {
                                            size: 5,
                                            opacity: 1,
                                            attributes: {
                                              fill:
                                                daColor + "99",
                                              stroke:
                                                daColor + "66",
                                              "stroke-width": 0,
                                            },
                                          },
                                          brightness: 0.3,
                                        },
                                        inactive: {
                                          enabled: true,
                                          opacity: 0.6,
                                        },
                                        selection: {
                                          enabled: false,
                                        },
                                      }}
                                    pointPlacement={pointsSettings.pointPlacement}
                                    fillColor={fillColor}
                                    fillOpacity={fillOpacity}
                                    zones={zones}
                                    zoneAxis={zoneAxis}
                                    marker={marker}
                                    clip={true}
                                    // // @ts-ignore
                                    // (["area", "line"].includes(getSeriesType(chainKey))
                                    // ? {
                                    //     shadow: {
                                    //     color:
                                    //         MetadataByKeys[chainKey]?.colors[
                                    //         theme ?? "dark"
                                    //         ][1] + "FF",
                                    //     width: 7,
                                    //     },
                                    // }
                                    // : chainKey === "all_l2s"
                                    //     ? {
                                    //     borderColor: "transparent",
                                    //     shadow: "none",
                                    //     }
                                    //     : {
                                    //     borderColor: "transparent",
                                    //     shadow: "none",

                                    //     }),
                                    shadow={isMonthly ? {

                                        color: color + "CC",
                                        width: 5,
                                    } : undefined}
                                    borderColor={isMonthly ? color : undefined}

                                />
                            )
                        })}

                        
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
            <div className="p-[15px] pl-[30px] flex">
                <ChartLegend 
                    selectedTimespan={selectedTimespan}
                    data={data}
                    isMonthly={isMonthly}
                    setSelectedChain={setSelectedChain}
                    selectedChain={selectedChain}
                    isPie={true}
                    pie_data={pie_data}
                    pieChartComponent={pieChartComponent}
                    chartComponent={chartComponent}
                    getNameFromKey={getNameFromKey}
                />
                <div className="min-w-[254px] flex items-center justify-center  relative  ">
                {/* Pie Chart */}
                <div className="absolute left-[32%] w-[99px] flex items-center justify-center bottom-[48%] text-xxxs font-bold leading-[120%] ">{"% OF TOTAL USAGE"}</div>
                    <HighchartsProvider Highcharts={Highcharts}>
                        <HighchartsChart                             
                            containerProps={{
                                style: {
                                    height: "254px",
                                    width: "254px",
                                    
                                    

                                    overflow: "visible",
                                },
                            }}

                            plotOptions={{
                                pie: {
                                    allowPointSelect: false,
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
                            type="pie"
                            title={"test"}
                            overflow="visible"
                            panning={{ enabled: true }}
                            panKey="shift"
                            zooming={{ type: undefined }}
                            style={{ borderRadius: 15 }}
                            animation={{ duration: 50 }}
                            // margin={[0, 15, 0, 0]} // Use the array form for margin
                            //margin={[15, 21, 15, 0]}


                            marginBottom={10}

                            marginTop={2}
                            
                            onRender={function (event) {
                                const chart = this; // Assign `this` to a variable for clarity
                                pieChartComponent.current = chart;


                            }}
                            
                            
                            
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
                                    size={"100%"}
                                    dataLabels={{
                                        enabled: false,
                                    }}
                                    type="pie"
                                    data={formattedPieData}
                                    
                                    point={{
                                        events: {
                                            click: function (event) {
                                                
                                                if(event.point.options.name){
                                                    const key = Object.entries(getNameFromKey).find(([_, value]) => value === event.point.options.name)?.[0];
                                                    if(key && key !== selectedChain){
                                                        setSelectedChain(key)
                                                    }else if(key === selectedChain){
                                                        setSelectedChain("all")
                                                    }
                                                    
                                                }
                                            }
                                        },
                                    }}
                                    
                                    
                                /> 
                        </YAxis>                     
                            
                        </HighchartsChart>

                    </HighchartsProvider>
                </div>
            </div>
        </div>
    
    )
}

const ChartLegend = (
  {
    selectedTimespan,
    data,
    isMonthly,
    setSelectedChain,
    selectedChain,
    isPie,
    pie_data,
    pieChartComponent,
    chartComponent,
    getNameFromKey

  }: {
    selectedTimespan: string,
    data: any,
    isMonthly: boolean,
    setSelectedChain: React.Dispatch<React.SetStateAction<string>>,
    selectedChain: string,
    isPie: boolean,
    pie_data: DAConsumerChart,
    pieChartComponent: React.MutableRefObject<Highcharts.Chart | null>,
    chartComponent: React.MutableRefObject<Highcharts.Chart | null>,
    getNameFromKey: Record<string, string>

  }) => {
  const { AllChainsByKeys, data: master } = useMaster();
  const { hoverChain, setHoverChain } = useChartSync(pieChartComponent, chartComponent, getNameFromKey)

  if(!master) return null;

  return (
    <div className="min-w-[125px] flex flex-col gap-y-[2px] items-start justify-center h-full">
      {/* Chains */}


      {Object.keys(data[selectedTimespan].da_consumers).sort((a, b) => {

        if (a === "others") return 1;
        if (b === "others") return -1;
        return 0;
      }).map((key, index) => {
        const custom_logo_keys = Object.keys(master.custom_logos);

        // default to unlisted chain icon
        let icon = "gtp:chain-dark";
        let color = UNLISTED_CHAIN_COLORS[index];
        
        // check if chain exists in AllChainsByKeys 
        if(AllChainsByKeys[data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][2]]){
          icon = `gtp:${AllChainsByKeys[data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][2]].urlKey}-logo-monochrome`;
          color = AllChainsByKeys[key].colors["dark"][0];
        // check if chain exists in custom logos (see libs/icons.mjs for how it gets imported)
        }else if(custom_logo_keys.includes(key)){
          icon = `gtp:${key}-custom-logo-monochrome`;
          color="#b5c4c3";
        }

        let bgBorderClass = "border-[1px] border-[#344240] bg-[#344240] hover:border-[#5A6462] hover:bg-[#5A6462] h-[18px] !py-[2px] !px-[2px]";

        if(selectedChain !== "all" && selectedChain !== key)
            bgBorderClass = "border-[1px] border-[#344240] bg-transparent hover:border-[#5A6462] hover:bg-[#5A6462] h-[18px] !py-[2px] !px-[2px]";
        

        return (
            <Badge
                key={index + "da_consumers"}
                leftIcon={icon}
                leftIconColor={color}
                rightIcon={selectedChain === key ? "heroicons-solid:x-circle" : ""}
                rightIconSize="md"
                rightIconColor="#FE5468"
                label={data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][1]}
                size="sm"
                onClick={() => {
                    setSelectedChain((prev) => {
                        if (selectedChain === key) {
                            return "all";
                        } else {
                            return key
                        }
                    });
                }}     
                onMouseEnter={() => {
                    setHoverChain(key);
                }}
                onMouseLeave={() => {
                    setHoverChain(null);
                }}   
                className={`cursor-pointer select-none ${bgBorderClass}`}
            />
        )


        // return (
        //   <div key={key + "da_consumers_info"} className={`flex group/chain  relative gap-x-[5px] px-[5px] text-xxs rounded-full py-[0.5px] items-center transition-all cursor-pointer bg-[#344240] ${(selectedChain === "all" || selectedChain === key) ? "bg-[#344240] border-[1px] border-transparent hover:bg-[#5A6462] " : "bg-transparent border-[1px] border-[#344240] hover:bg-[#5A6462] "}
        //     ${selectedChain === "all" || selectedChain !== key ? "px-[5px]" : "pl-[5px] pr-[20px]"}

        //     }`}
        //     onClick={() => {
        //       setSelectedChain((prev) => {
        //         if (selectedChain === key) {
        //           return "all";
        //         } else {
        //           return key
        //         }
        //       });
        //     }}
        //     onMouseEnter={() => {
        //       setHoverChain(key);


        //     }}
        //     onMouseLeave={() => {
        //       setHoverChain(null);
        //     }}
        //   >

        //     <div>{AllChainsByKeys[data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][2]] ?
        //       (<Icon icon={`gtp:${AllChainsByKeys[data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][2]].urlKey}-logo-monochrome`} className="w-[12px] h-[12px]" style={{ color: AllChainsByKeys[key].colors["dark"][0] }} />)
        //       : custom_logo_keys.includes(key)
        //         ? (
        //           <DynamicIcon
        //             pathString={master.custom_logos[key].body}
        //             size={12}
        //             className="text-forest-200"
        //             viewBox="0 0 15 15"

        //           />
        //         )
        //         : ( <Icon
        //             icon={"gtp:chain-dark"}
        //             className={`w-[12px] h-[12px] ${key === "others" ? "hidden" : "block"}`}
        //             style={{
        //                 color: UNLISTED_CHAIN_COLORS[index]
        //             }}
        //             />)}</div>
        //     <div className="text-xxs ">{data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0][1]}</div>
        //     <div className={`absolute right-[2px] top-[2.5px] w-[12px] h-[12px] text-[#FE5468] ${selectedChain === "all" ? "invisible" : "visible"}`}><Icon icon={selectedChain === key ? "gtp:x-circle" : ""} className="w-[12px] h-[12px] "></Icon></div>
        //   </div>
        // )
      }
      )}
    </div>
  )
};


const DATableCharts = memo(DATableChartsComponent, (prevProps, nextProps) => {
    if (!prevProps.isOpen && !nextProps.isOpen) {
        return true; // No need to re-render
    }
    return (
      prevProps.selectedTimespan === nextProps.selectedTimespan &&
      prevProps.isMonthly === nextProps.isMonthly &&
      prevProps.da_name === nextProps.da_name &&
      prevProps.data === nextProps.data &&
      prevProps.pie_data === nextProps.pie_data &&
      prevProps.master === nextProps.master
    );
  });
  export default DATableCharts;