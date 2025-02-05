"use client";

import { useState, useMemo, useCallback} from "react";
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
    AreaSeries,
} from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";
import ChartWatermark from "@/components/layout/ChartWatermark"; 
import "@/app/highcharts.axis.css";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

export default function PracticeChart({
    data, 
    master, 
    showUsd, 
    selectedCategory,
    timespans,
    selectedTimespan
    }: {
    data: ChainOverviewResponse,
    master: MasterResponse,
    showUsd: boolean,
    selectedCategory: string,
    timespans: Object,
    selectedTimespan: string
    }) {
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
    <div>
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
                          }
                          }}
                          plotOptions = {{
                            area: {
                                marker: {
                                    lineColor: "white",
                                    radius: 0,
                                    symbol: "circle",
                                }
                            }
                           }}
                          
                      >
                          <Chart 
                              backgroundColor={"transparent"}
                              type="area"
                              title={"test"}
                              overflow="visible"
                              panning={{ enabled: true }}
                              panKey="shift"
                              zooming={{ type: undefined }}
                              style={{ borderRadius: 15 }}
                          />
                          <YAxis
                            gridLineColor="#2d3532"
                            tickAmount={3}
                            labels={{
                              style: {
                                  fontWeight: '700',
                                  color: 'rgb(215, 223, 222)'
                              },
                              formatter: function (this: any) {
                                const prefix = showUsd ? '$' : 'Ξ';
                                let value = this.value;
                                let suffix = '';
                                if (value >= 1000 && value < 10000) {
                                    value = value / 1000;
                                    suffix = 'K';
                                } else if (value >= 10000) {
                                    value = value / 1000000;
                                    suffix = 'M';
                                }
                                return `${prefix}${value}${suffix}`;
                            }
                            }
                          }
                          ><AreaSeries 
                              name="All L2s"  
                              // color={master.chains.all_l2s.colors['dark'][1] 
                              color={{
                                linearGradient: {
                                  x1: 0,
                                  y1: 0,
                                  x2: 0,
                                  y2: 1,
                                },
                                stops: [
                                    [0, master.chains.all_l2s.colors['dark'][0] + "F9"],
                                    [1, master.chains.all_l2s.colors['dark'][1] + "F9"],
                                ]
                              }}
                              fillColor={{linearGradient: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 1,
                              },
                              stops: [
                                  
                                 
                                  // [0.349, daColor + "88"],
                                  [0, master.chains.all_l2s.colors['dark'][0] + "33"],
                                  // [0.55, master.chains.all_l2s.colors['dark'][0] + "CC"],
                                  [1, master.chains.all_l2s.colors['dark'][1] + "33"],
                              ]
                                }}
                           
                              data={data.data.chains["all_l2s"].daily[selectedCategory].data.map(
                              (d: any) => [
                              d[0],
                              showUsd ? d[2] : d[1], // 1 = ETH 2 = USD
                              ],
                          )} />
                          </YAxis>
                          <XAxis
                          labels={{
                            style: {
                                color: 'rgb(215, 223, 222)'
                            },
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
      
                              return `<span class="font-semibold">${dateString}</span>`;
                            }
                          }}
                              type="datetime"
                              min={selectedTimespan !== 'max' ? timespans[selectedTimespan].xMin : undefined}
                              max={timespans[selectedTimespan].xMax}
                          >
                          </XAxis>
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
                            formatter={tooltipFormatter}
                            // ensure tooltip is always above the chart
                            //positioner={tooltipPositioner}
                          />
      
                      </HighchartsChart>
                     
                      
                  </HighchartsProvider>
                  <div className="absolute bottom-[calc(50%-0px)] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-50">
                      <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                  </div>
              </div>
  )
}