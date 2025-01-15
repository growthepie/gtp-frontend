"use client"
import Container from "@/components/layout/Container"
import { useState, useMemo } from "react";
import {
    HighchartsProvider,
    HighchartsChart,
    Chart,
    XAxis,
    YAxis,
    Title,
    Tooltip,
    PlotBand,
    LineSeries,
} from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";
import useSWR from "swr";
import { BlockspaceURLs } from "@/lib/urls";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useEffect, useCallback } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { time } from "console";
import {
    baseOptions,
    getTimespans,
    getTickPositions,
    getXAxisLabels,
    decimalToPercent,
    tooltipFormatter, // maybe I need to use this 
    formatNumber,
    tooltipPositioner,
  } from "@/lib/chartUtils";
import ChartWatermark from "@/components/layout/ChartWatermark"; 

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    // TOOLTIP_BG: "#1b2135", //Should be transparent? 
    TOOLTIP_BG: "rgba(40, 51, 51, 0.8)",
    ANNOTATION_BG: "rgb(215, 223, 222)",
  };




export default function Page(){
    const { data: chainOverviewData, 
            error: chainOverviewError, 
            isLoading: chainOverviewLoading, 
            isValidating: chainOverviewValidating } 
    = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

    const x = true

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

    const [selectedTimespan, setSelectedTimespan] = useSessionStorage( //is this setting to max by default?
        "blockspaceTimespan",
        "max",
    );
    useEffect(() => { // not sure if this is needed? if defualt is max?
        if (selectedTimespan === "1d") {
          setSelectedTimespan("7d");
        }
      }, []);
    const timespans = useMemo(() => {
    let xMax = Date.now();

    
        return {
        "1d": {
            shortLabel: "1d",
            label: "1 day",
            value: 1,
            xMin: xMax - 1 * 24 * 60 * 60 * 1000,
            xMax: xMax,
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
        
      }, []);


      const tooltipFormatter = useCallback(
        function (this: any) {
          const { x, points } = this;

          const date = new Date(x);
          let dateString = date.toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
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
    
          const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-52 text-xs font-raleway">
            <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
          const tooltipEnd = `</div>`;
    
          // let pointsSum = 0;
          // if (selectedScale !== "percentage")
    
          const tooltipPoints = points
    
            .map((point: any, index: number) => {
              const { series, y, percentage } = point;
              const { name } = series;
              let blob_value;
              let blob_index;
    
              const isFees = true;
              const nameString = name;
              
              const color = series.color;
    
              let prefix = isFees ? "" : "";
              let suffix = "";
              let value = y;
              let displayValue = y;
    
              return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
                <div class="tooltip-point-name text-xs">${nameString}</div>
                <div class="flex-1 text-right justify-end flex numbers-xs">
                  <div class="flex justify-end text-right w-full">
                      <div class="${!prefix && "hidden"
                }">${prefix}</div>
                  ${isFees
                  ? parseFloat(displayValue).toLocaleString(
                    "en-GB",
                    {
                      minimumFractionDigits: 2,
    
                      maximumFractionDigits: 2,
                    },
                  )
                  : ""
                }
                   
                    </div>
                    <div class="ml-0.5 ${!suffix && "hidden"
                }">${suffix}</div>
                </div>
              </div>
             `;
            })
            .join("");
    
          return tooltip + tooltipPoints + tooltipEnd;
        },
        [showUsd],
      );
    


   
    return (
        <Container>
       
            <TopRowContainer>
                <div // Why did I have to add a div why couldnt I do this in parent?
                    className= "flex justify-end"
                >
                </div>
                <TopRowParent>
                   {Object.keys(timespans).map((timespan) => (
                        <TopRowChild
                            isSelected={selectedTimespan === timespan}
                            key={timespan}
                            onClick={() => setSelectedTimespan(timespan)}
                            className={`${selectedTimespan === timespan ? "selected" : ""}`}
                        >
                            {timespans[timespan].shortLabel}
                        </TopRowChild>
                    ))}
                </TopRowParent>
            </TopRowContainer>
            <div className="relative ">
            <HighchartsProvider Highcharts={Highcharts}>
                <HighchartsChart
                    containerProps={{
                    style: {
                        height: "197px",
                        width: "100%",
                        marginLeft: "auto",
                        marginRight: "auto",
                        position: "relative",

                        overflow: "visible",
                    },
                    }}
                    
                >
                    <Chart 
                        backgroundColor={"transparent"}
                        type="line"
                        title={"test"}
                        
                    />
                    <YAxis><LineSeries 
                        name="All L2s"  
                        color={COLORS.PLOT_LINE}
                        data={chainOverviewData?.data.chains["all_l2s"].daily["cefi"].data.map(
                        (d: any) => [
                        d[0],
                        showUsd ? d[2] : d[1], // 1 = ETH 2 = USD
                        ],
                    )} />
                    </YAxis>
                    <XAxis
                        type="datetime"
                        min={timespans[selectedTimespan].xMin}
                        max={timespans[selectedTimespan].xMax}
                    >
                    </XAxis>
                    <Tooltip
                        useHTML={true}
                        borderRadius={15}
                        backgroundColor={COLORS.TOOLTIP_BG}
                        style={{ color: 'rgb(215, 223, 222)', padding: '10px' }}
                        formatter={tooltipFormatter}
                        shared={true}
                    />
                    {/* <ChartWatermark
                        className={`h-[30.67px] md:h-[46px] ${parseInt(chartHeight, 10) > 200
                        ? "w-[128px] md:w-[163px]"
                        : "w-[128.67px] md:w-[193px] "
                        } text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten`}
                    /> */}
                    
                </HighchartsChart>
               
                
            </HighchartsProvider>
            <div className="absolute bottom-[calc(50%-0px)] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
                <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
            </div>
        </div>
            
        </Container>
    );
}