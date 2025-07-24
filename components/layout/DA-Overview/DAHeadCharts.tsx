"use client"
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
} from "react-jsx-highcharts";
import Container from "../Container";
import Highcharts, { chart } from "highcharts/highstock";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import ChartWatermark from "../ChartWatermark";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { AllDAOverview } from "@/types/api/DAOverviewResponse";
import { useUIContext } from "@/contexts/UIContext";
import d3 from "d3";
import TopDAConsumers from "./TopDAConsumers";
import "@/app/highcharts.axis.css";
import { Any } from "react-spring";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/splide/css";
import SwiperContainer from "../SwiperContainer";

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};


const chart_titles = {
    data_posted: "Data Posted",
    fees_paid: "DA Fees Paid",
}

const area_colors = {
    da_ethereum_blobs: "#FFC300",
    da_celestia: "#8E44ED",
    da_eigenda: "#3D29D9"
}
  
export default function DAHeadCharts({selectedTimespan, isMonthly, data}: {selectedTimespan: string, isMonthly: boolean, data: AllDAOverview}) {

    const [chartWidth, setChartWidth] = useState<number | null>(null);
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const { isSidebarOpen, isSafariBrowser } = useUIContext();
    const chartComponent = useRef<Highcharts.Chart | null>(null);
    const lastPointLines = useMemo<{
        [key: string]: Highcharts.SVGElement[];
    }>(() => ({}), []);

    const lastPointCircles = useMemo<{
        [key: string]: Highcharts.SVGElement[];
    }>(() => ({}), []);

    const valuePrefix = useMemo(() => {
        if (showUsd) return "$";
        // eth symbol
        return "Ξ";
    }, [showUsd]);


    const timespans = useMemo(() => {

      let xMax = 0;
      let xMin = Infinity;
      
      Object.keys(data.metrics["fees_paid"]).forEach((key) => { 
        const dataset = data.metrics["fees_paid"][key][isMonthly ? "monthly" : "daily"].data;
      
        // Find xMax (latest x-value)
        const latestX = dataset[dataset.length - 1][0];
        if (latestX > xMax) {
          xMax = latestX;
        }
      
        // Find xMin (earliest x-value)
        const earliestX = dataset[0][0];
        if (earliestX < xMin) {
          xMin = earliestX;
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
    }, [isMonthly, data]);



    const tooltipFormatter = useCallback(
        function (this: any) {
          const { x, points } = this;
          const date = new Date(x);
          let dateString = date.toLocaleDateString("en-GB", {
            month: "short",
            day: isMonthly ? undefined : "numeric",
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
          .map((point: any, index: number)  => {
              const { series, y, percentage } = point;
              const { name } = series;
              const nameString = name;
              let isFees = chartTitle.includes("fees_paid");
              
              
    
              let prefix = isFees ? valuePrefix : "";
              let suffix = isFees ? "" : " GB";
              let value = y;
              let displayValue = y;
    
              return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color}"></div>
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
                    : Intl.NumberFormat("en-GB", {
                        notation: "standard",
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      }).format(
                        displayValue
                      )
                      
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
        [showUsd, isMonthly],
      );

    function getSumDisplayValue(isolated_data) {
        let sum = 0;
        Object.keys(isolated_data).map((key) => {
            let typeIndex = 1;
            if(isolated_data[key][isMonthly ? "monthly" : "daily"].types.includes("usd")){
                typeIndex = isolated_data[key][isMonthly ? "monthly" : "daily"].types.indexOf(showUsd ? "usd" : "eth")
            }
     
          sum +=
            isolated_data[key][isMonthly ? "monthly" : "daily"].data[isolated_data[key][isMonthly ? "monthly" : "daily"].data.length - 1][
                typeIndex
            ];
        });
    
        return sum;
    }
    

      const formatNumber = useCallback(
        (key: string, value: number | string) => {
          let val = parseFloat(value as string);
    
          // Function to format large numbers with at least 2 decimals
          const formatLargeNumber = (num) => {
            let formatted = d3.format(".2s")(num).replace(/G/, "B");
            if (/(\.\dK|\.\dM|\.\dB)$/.test(formatted)) {
              formatted = d3.format(".3s")(num).replace(/G/, "B");
            } else if (/(\.\d\dK|\.\d\dM|\.\d\dB)$/.test(formatted)) {
              formatted = d3.format(".4s")(num).replace(/G/, "B");
            } else {
              formatted = d3.format(".2s")(num).replace(/G/, "B");
            }
            return formatted;
          };
    
          let number = formatLargeNumber(val);
          if(key.includes("fees_paid")){
            if (showUsd) {
              if (val < 1) {
                number = valuePrefix + val.toFixed(2);
              } else {
                number = valuePrefix + formatLargeNumber(val);
              }
            } else {
              number = valuePrefix + formatLargeNumber(val);
            }
          } else {
            number = number + " GB";
          }
    
          return number;
        },
        [showUsd],
      );


      // useEffect(() => {
      //   console.log(`Inside ${isMonthly ? "Monthly" : "Daily"} useEffect`)
      //   console.log(chartComponent)
      //   console.log("------------------------------------------------------")
      //   chartComponent.current?.redraw();
      // }, [isMonthly]);



    return (
        <SwiperContainer ariaId="da-overview" size="data-availability">
          <SplideTrack >
          
          
            {Object.keys(data.metrics).filter(() =>  selectedTimespan !== "1d").reverse()
              .map((metricKey, i) => { 
              let is_fees = metricKey.includes("fees_paid");
              let prefix = is_fees ? valuePrefix : "";
              
              let url = metricKey.includes("fees_paid") ? "/data-availability/fees-paid" : "/data-availability/data-posted";
              return (   
                
              <SplideSlide key={metricKey + "_splide"} className="select-none">       
                <div className={`relative flex flex-col w-full overflow-hidden h-[232px] bg-[#1F2726] rounded-2xl  group 
                ${selectedTimespan === "1d" ?  "hidden" : "flex flex-col"}`} key={metricKey}>
                    <Link
                        className={`absolute hover:underline items-center text-[16px] font-bold top-[15px] left-[15px] flex gap-x-[10px]  z-10 ${/*link ? "cursor-pointer" : ""*/ ""}`}
                        href={url}
                        target=""
                        rel=""
                    >
                    
                        <div>{chart_titles[metricKey]}</div>
                        <div
                            className={`rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10 ${/*!link ? "hidden" : "block" */ ""}`}
                        >
                            <Icon
                            icon="feather:arrow-right"
                            className="w-[11px] h-[11px]"
                            />
                        </div>
                    </Link>
                    <div className="absolute text-[18px] top-[17px] right-[30px] numbers">
                        {prefix + Intl.NumberFormat("en-GB", {                          
                              notation: "standard",
                              maximumFractionDigits: is_fees ? 0 : 2,
                              minimumFractionDigits: is_fees ? 0 : 2,}).format(getSumDisplayValue(data.metrics[metricKey]))
                        }
                        {is_fees ? "" : " GB"}
                    </div>
                    <hr className="absolute w-full border-t-[2px] top-[64px] border-[#5A64624F] my-4" />
                    <hr className="absolute w-full border-t-[2px] top-[114px] border-[#5A64624F] my-4" />
                    <hr className="absolute w-full border-t-[2px] top-[166px] border-[#5A64624F] my-4" />
                    <div className="absolute bottom-[40%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                        <ChartWatermark className="w-[128.54px] h-[25.69px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                    </div>
                    <div className="opacity-100 transition-opacity duration-[900ms] z-20 group-hover:opacity-0 absolute left-[7px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
                          <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                          <div className="text-[#CDD8D3] text-[9px] font-medium leading-[150%]">
                              {new Date(
                                timespans[selectedTimespan].xMin,
                              ).toLocaleDateString("en-GB", {
                                timeZone: "UTC",
                                month: "short",
                                // day: "numeric",
                                year: "numeric",
                              })}

                          </div>
                    </div>
                    <div className=" duration-[900ms] group-hover:opacity-0 z-20 absolute right-[15px] bottom-[3px] flex items-center px-[4px] py-[1px] gap-x-[3px] rounded-full bg-forest-50/50 dark:bg-[#344240]/70 pointer-events-none">
                          <div className="text-[#CDD8D3] text-[9px] font-medium leading-[150%]">
                            {new Date(
                                timespans[selectedTimespan].xMax,
                              ).toLocaleDateString("en-GB", {
                                timeZone: "UTC",
                                month: "short",
                                // day: "numeric",
                                year: "numeric",
                              })}
                              
                          </div>
                          <div className="w-[5px] h-[5px] bg-[#CDD8D3] rounded-full"></div>
                      </div>

                    <div className="h-[232px] pt-[15px]">
                        <HighchartsProvider Highcharts={Highcharts}>
                            <HighchartsChart
                                containerProps={{
                                style: {
                                    height: "232px",
                                    width: "100%",
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                    position: "absolute",

                                    overflow: "visible",
                                },
                                }}
                                plotOptions={{
                                line: {
                                    lineWidth: 1.5,
                                    
                                },
                                area: {
                                    stacking: "normal",
                                    lineWidth: 1.5,
                                    states: {
                                      hover: {
                                        brightness: 1.5
                                      }
                                    },

                                    // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                                    // borderWidth: 1,
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
                                <Title
                                style={{ display: "none" }} // This hides the title
                                >
                                {metricKey}
                                </Title>
                                <Chart
                                backgroundColor={"transparent"}
                                type="area"
                                title={"test"}
                                panning={{ enabled: false }}
                                panKey="shift"
                                zooming={{ type: undefined }}
                                style={{ borderRadius: 15 }}
                                animation={{ duration: 50 }}
                                // margin={[0, 15, 0, 0]} // Use the array form for margin
                                margin={[15, 21, 15, 0]}
                                spacingBottom={0}
                                spacingTop={40}
                                spacingLeft={10}
                                spacingRight={10}

                                onRender={function (chartData) {
                                    const chart = chartData.target as any; // Cast chartData.target to any
                                    const chartRef = this; // Assign `this` to a variable for clarity
                                    chartComponent.current = chartRef;
                                    if (
                                      !chart ||
                                      !chart.series ||
                                      chart.series.length === 0 ||
                                      selectedTimespan === "1d"
                                    )
                                      return;
      
                                    //Set width for y axis label
                                    if (
                                      chartWidth === null ||
                                      chartWidth !== chart.plotWidth
                                    ) {
                                      setChartWidth(chart.plotWidth);
                                    }
      
                                    chart.series.forEach((object, index) => {
                                      const dictionaryKey = `${chart.series[index].name}_${metricKey}`;
      
                                      // check if gradient exists
                                      if (!document.getElementById("gradient0")) {
                                        // add def containing linear gradient with stop colors for the circle
                                        chart.renderer.definition({
                                          attributes: {
                                            id: "gradient0",
                                            x1: "0%",
                                            y1: "0%",
                                            x2: "0%",
                                            y2: "95%",
                                          },
                                          children: [
                                            {
                                              tagName: "stop",
                                              // offset: "0%",
                                              attributes: {
                                                id: "stop1",
                                                offset: "0%",
                                              },
                                            },
                                            {
                                              tagName: "stop",
                                              // offset: "100%",
                                              attributes: {
                                                id: "stop2",
                                                offset: "100%",
                                              },
                                            },
                                          ],
                                          tagName: "linearGradient",
                                          textContent: "",
                                        });
                                        const stop1 =
                                          document.getElementById("stop1");
                                        const stop2 =
                                          document.getElementById("stop2");
                                        stop1?.setAttribute("stop-color", "#CDD8D3");
                                        stop1?.setAttribute("stop-opacity", "1");
                                        stop2?.setAttribute("stop-color", "#CDD8D3");
                                        stop2?.setAttribute("stop-opacity", "0.33");
                                      }
                                      const lastPoint: Highcharts.Point =
                                        chart.series[index].points[
                                        chart.series[index].points.length - 1
                                        ];


                                        
                                      // check if i exists as a key in lastPointLines
                                      if (!lastPointLines[dictionaryKey]) {
                                        lastPointLines[dictionaryKey] = [];
                                      }
                                      if (
                                        lastPointLines[dictionaryKey] &&
                                        lastPointLines[dictionaryKey].length > 0
                                      ) {
                                        lastPointLines[dictionaryKey].forEach(
                                          (line) => {
                                            line.destroy();
                                          },
                                        );
                                        lastPointLines[dictionaryKey] = [];
                                      }
                                      // calculate the fraction that 15px is in relation to the pixel width of the chart
                                      const fraction = 21 / chart.chartWidth;
                                      // create a bordered line from the last point to the top of the chart's container
                                      
                                      lastPointLines[dictionaryKey][
                                        lastPointLines[dictionaryKey].length
                                      ] = chart.renderer
                                        .createElement("line")
                                        .attr({
                                          x1:
                                            chart.chartWidth * (1 - fraction) +
                                            0.00005,
                                          y1: lastPoint.plotY
                                            ? lastPoint.plotY + chart.plotTop
                                            : 0,
                                          x2:
                                            chart.chartWidth * (1 - fraction) -
                                            0.00005,
                                          y2: chart.plotTop - 6,
      
                                          stroke: isSafariBrowser ? "#CDD8D3" : "url('#gradient0')",
                                          "stroke-dasharray": null, // Remove or set to null for a solid line
                                          "stroke-width": 1,
                                          rendering: "crispEdges",
                                        })
                                        .add();
                                      lastPointLines[dictionaryKey][
                                        lastPointLines[dictionaryKey].length
                                      ] = chart.renderer
                                        .circle(
                                          chart.chartWidth * (1 - fraction),
                                          chart.plotTop / 3 + 6,
      
                                          3,
                                        )
                                        .attr({
                                          fill: "#CDD8D3",
                                          r: 4.5,
                                          zIndex: 9999,
                                          rendering: "crispEdges",
                                        })
                                        .add();
                                    });
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
                                formatter={tooltipFormatter}
                                // ensure tooltip is always above the chart
                                //positioner={tooltipPositioner}
                                valuePrefix={showUsd ? "$" : ""}
                                valueSuffix={showUsd ? "" : " Gwei"}
                                />
                                <XAxis
                                title={undefined}
                                type="datetime"
                                labels={{
                                    useHTML: true,
                                    style: {
                                    color: COLORS.LABEL,
                                    fontSize: "10px",
                                    fontFamily: "var(--font-raleway), sans-serif",
                                    zIndex: 1000,
                                    },
                                    enabled: true,
                                    formatter: (item) => {
                                    const date = new Date(item.value);
                                    const isMonthStart = date.getDate() === 1;
                                    const isYearStart =
                                        isMonthStart && date.getMonth() === 0;
                                    if (isYearStart) {
                                        return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                                    } else {
                                        return `<span style="">${date.toLocaleDateString(
                                        "en-GB",
                                        {
                                            month: "short",
                                        },
                                        )}</span>`;
                                    }
                                    },
                                }}
                                crosshair={{
                                    width: 0.5,
                                    color: COLORS.PLOT_LINE,
                                    snap: true,
                                }}
                                tickmarkPlacement="on"
                                tickWidth={0}
                                tickLength={20}
                                ordinal={false}
                                minorTicks={false}
                                minorTickInterval={1000 * 60 * 60 * 24 * 1}
                                min={timespans[selectedTimespan].xMin + 1000 * 60 * 60 * 24 * 1} // don't include the last day
                                max={timespans[selectedTimespan].xMax}
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
                                    align: "left",
                                    y: -2,
                                    x: 2,
                                    
                                  

                                    style: {
                                      backgroundColor: "#1F2726",
                                      whiteSpace: "nowrap",
                                      color: "rgb(215, 223, 222)",
                                      fontSize: "8px",
                                      fontWeight: "600",
                                      fontFamily: "var(--font-raleway), sans-serif",
                                    },
                                    formatter: function (
                                    t: Highcharts.AxisLabelsFormatterContextObject,
                                    ) {
                                      return formatNumber(metricKey, t.value);
                                    },
                                }}
                                min={0}
                                >
                                    {Object.keys(data.metrics[metricKey])
                                    .map((key, i) => {
                                        let types = data.metrics[metricKey][key][isMonthly ? "monthly" : "daily"].types;
                                        let typeIndex = 1;

                                        
                                        


                                        if(types.includes("usd")){
                                            typeIndex = types.indexOf(showUsd ? "usd" : "eth")
                                        }
                                        

                                        return(
                                            <AreaSeries 
                                                key={key}
                                                data={data.metrics[metricKey][key][isMonthly ? "monthly" : "daily"].data.map((d) => [d[0], d[typeIndex]])}
                                                color={area_colors[key]}
                                                name={data.metrics[metricKey][key].metric_name}
                                                shadow={{
                                                  color: area_colors[key] + "CC",
                                                  width: 5,
                                                }}
                                                states={{
                                                  hover: {
                                                    halo: {
                                                      size: 5,
                                                      opacity: 1,
                                                      attributes: {
                                                        fill:
                                                          area_colors[key] + "99",
                                                        stroke:
                                                        area_colors[key] + "66",
                                                        "stroke-width": 0,
                                                      },
                                                      
                                                    },
                                                    brightness: 0.8,
                                                  }
                                                }}
                                                fillColor={{
                                                  linearGradient: {
                                                    x1: 0,
                                                    y1: 0,
                                                    x2: 0,
                                                    y2: 1,
                                                  },
                                                  stops: [
                                                    [
                                                      0,
                                                      area_colors[key] + "33",
                                                    ],
    
                                                    [
                                                      1,
                                                      area_colors[key] + "33",
                                                    ],
                                                  ],
                                                }}
                                            />
                                        )
                                })}

                                </YAxis>
                            </HighchartsChart>
                        </HighchartsProvider>
                    </div>
                </div>
              </SplideSlide>
              )})}
              { selectedTimespan === "1d" ? (
                  <div className="w-full">
                    <SplideSlide>
                        <div className="flex flex-col gap-y-[5px] w-full py-[15px] relative  h-[232px]">
                            <div className="flex items-center heading-large-sm gap-x-[10px]">
                                <div>Top 5 DA Consumers</div>
                            </div>
                            <TopDAConsumers consumer_data={data.top_da_consumers} selectedTimespan={selectedTimespan} />
                        </div>
                    </SplideSlide>
                  </div>
                  ) : (
                    <SplideSlide>
                    <div className="flex flex-col gap-y-[5px] w-full py-[15px] relative  h-[232px]">
                        <div className="flex items-center heading-large-sm gap-x-[10px]">
                            <div>Top 5 DA Consumers</div>
                        </div>
                        <TopDAConsumers consumer_data={data.top_da_consumers} selectedTimespan={selectedTimespan} />
                    </div>
                </SplideSlide>
                )
              }
              
          </SplideTrack>
          </SwiperContainer>
  )
}