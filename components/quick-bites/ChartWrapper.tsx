// File: components/quick-bites/ChartWrapper.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Highcharts from 'highcharts/highstock';
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Tooltip,
  LineSeries,
  AreaSeries,
  ColumnSeries,
  PieSeries
} from 'react-jsx-highcharts';
import highchartsAnnotations from 'highcharts/modules/annotations';
import highchartsRoundedCorners from 'highcharts-rounded-corners';
import highchartsPatternFill from 'highcharts/modules/pattern-fill';
import { debounce } from 'lodash';
import { useTheme } from 'next-themes';
import ChartWatermark from '@/components/layout/ChartWatermark';
import "@/app/highcharts.axis.css";
import { GTPIcon } from "../layout/GTPIcon";
import { Icon } from "@iconify/react";
import type { AxisLabelsFormatterContextObject } from 'highcharts';
import moment from "moment";

let highchartsInitialized = false;
interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'column' | 'pie';
  data: any;
  options?: any;
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  stacking?: "normal" | "percent" | null;
  jsonData?: any;
  jsonMeta?: {
    meta: {
      name: string,
      color: string,
      xIndex: number,
      yIndex: number,
      suffix?: string,
      prefix?: string,
      tooltipDecimals?: number,
      dashStyle?: Highcharts.DashStyleValue
    }[]
  }
  seeMetricURL?: string | null;
  showXAsDate?: boolean;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  options = {},
  width = '100%',
  height = 400,
  title,
  subtitle,
  stacking,
  jsonData,
  jsonMeta,
  seeMetricURL,
  showXAsDate = false
}) => {
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);

  
  // Add timespans and selectedTimespan
  const timespans = {
    all: { xMin: 0, xMax: Date.now() },
    // Add other timespans as needed
  };
  const selectedTimespan = 'all';

  // Initialize Highcharts modules
  useEffect(() => {
    try {
      if (!highchartsInitialized) {
        highchartsRoundedCorners(Highcharts);
        highchartsAnnotations(Highcharts);
        highchartsPatternFill(Highcharts);
        Highcharts.setOptions({
          lang: {
            numericSymbols: ["K", " M", "B", "T", "P", "E"],
          },
        });
        highchartsInitialized = true;
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This effect now only handles data-specific logic
    try {
      if (!Array.isArray(data)) {
        throw new Error('Chart data must be an array');
      }
      setIsChartReady(true);
      setLoading(false);
      setError(null); // Clear previous error
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, [data]); // Runs when data change
  
  // Handle resize events
  useEffect(() => {
    const handleResize = debounce(() => {
      if (chartRef.current?.chart) {
        chartRef.current.chart.reflow();
      }
    }, 300);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, []);

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      let dateString = moment.utc(x).utc().locale("en-GB").format("DD MMM YYYY");
      const total = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const tooltip = `<div class="mt-3 mr-3 mb-3  text-xs font-raleway rounded-full bg-opacity-60">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      const tooltipPoints = points
        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          
          const nameString = name.slice(0, 20);
          
          const color = series.color.stops ? series.color.stops[0][1] : series.color;

          const currentPrefix = jsonMeta?.meta[index].prefix || '';
          const currentSuffix = jsonMeta?.meta[index].suffix || '';
          const currentDecimals = jsonMeta?.meta[index].tooltipDecimals || 2;

          let displayValue = parseFloat(y).toLocaleString("en-GB", {
            minimumFractionDigits: currentDecimals,
            maximumFractionDigits: currentDecimals
          });

          let displayText;
          if (stacking === "percent") {
            const percentageValue = ((y / total) * 100).toFixed(1); // keep 1 decimal
            displayText = `${currentPrefix}${displayValue}${currentSuffix} (${percentageValue}%)`;
        } else {
            displayText = `${currentPrefix}${displayValue}${currentSuffix}`;
        }

        return `
        <div class="flex space-x-2 items-center font-medium mb-0.5">
          <div class="min-w-4 max-w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
          <div class="tooltip-point-name text-xs w-min truncate ">${nameString}</div>
          <div class=" flex-1 text-right justify-end w-full flex numbers-xs">
            <div class="flex justify-end text-right w-full">
              <div>${displayText}</div>
            </div>
          </div>
        </div>`;
        })
        .join("");

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [jsonMeta],
  );

  
  if (loading) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg animate-pulse"
        aria-busy="true"
      >
        <p className="text-forest-500 dark:text-forest-400">Loading chart...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg"
        role="alert"
      >
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Failed to load chart</p>
          <p className="text-sm text-forest-700 dark:text-forest-300">{error}</p>
        </div>
      </div>
    );
  }

 
  
  return (
    <div className="relative md:px-[35px]">
      <div style={{ width, height }} className="relative bg-transparent md:bg-active-black rounded-[25px] shadow-none md:shadow-md flex flex-col gap-y-[15px] h-full md:p-[15px] ">
        <div className="w-full h-auto pl-[10px] pr-[5px] py-[5px] bg-[#1F2726] rounded-full">
          <div className="flex items-center justify-center md:justify-between">
            <div className="flex items-center gap-x-[5px]">
              <div className="w-fit h-fit"><GTPIcon icon={"gtp-quick-bites"} className="w-[24px] h-[24px] "/></div>
              <div className="heading-small-md">{title}</div>
            </div>
          </div>
        </div>
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart chart={chartRef.current} options={options}
              plotOptions={{
                line: {
                  lineWidth: 1.5,
                },
                area: {
                  lineWidth: 1.5,



                  // marker: {
                  //   radius: 12,
                  //   lineWidth: 4,
                  // },

                  // shadow: {
                  //   color:
                  //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
                  //   width: 10,
                  // },

                  // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                  // borderWidth: 1,
                },
                column: {
                  
                  borderColor: "transparent",
                  animation: true,
                  pointPlacement: "on",
                },
                series: {
                  zIndex: 10,
                  animation: false,

                  marker: {
                    lineColor: "white",
                    radius: 0,
                    symbol: "circle",
                  },
                  states: {
                    hover: {
                      enabled: true,
                      brightness: 0.1,
                    },
                    inactive: {
                      opacity: 0.6,
                    }
                  }
                },
              }}
          >
            <Chart 
              backgroundColor={"transparent"}
              type="line"
              panning={{
                enabled: false,
                type: "x",
              }}
              
              panKey="shift"
              // zooming={{
              //   type: "x",
              //   mouseWheel: {
              //     enabled: false,
              //     type: "xy",
              //   },
              // }}
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={showXAsDate ? 32 : 20}
              marginLeft={50}
              marginRight={5}
              marginTop={15}
              
               

            />
            
            
            <XAxis
              crosshair={{
                width: 0.5,
                color: theme === 'dark' ? '#CDD8D3' : '#293332',
                snap: true,
              }}
              labels={{
                style: {
                  fontFamily: "Fira Sans",
                  fontSize: "10px",
                  color: "#CDD8D3",
                },
                distance: 20,
                enabled: showXAsDate,
                useHTML: true,
                formatter: showXAsDate ? function (this: AxisLabelsFormatterContextObject) {
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
                    if (new Date(this.value).getUTCMonth() === 0 && new Date(this.value).getUTCDate() === 1) {
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
                } : undefined
              }}
              
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              lineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              tickColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
              type={showXAsDate ? "datetime" : undefined}
              tickAmount={5}
              tickLength={15}
            />
            
            <YAxis 
              labels={{
                style: {
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                  fontSize: '8px',
                },
                formatter: function (this: any) {

                
                  if (jsonMeta?.meta[0]?.suffix) {
                    return this.value.toLocaleString("en-GB", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    }) + jsonMeta.meta[0].suffix;
                  } else {
                    return this.value.toLocaleString("en-GB", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    });
                  }
                }
              }}
              
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
            >
              {chartType === 'line' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;
                 
                  return (
                    <LineSeries
                      animation={true}
                      key={series.name}
                      name={series.name}
                      data={seriesData}
                      color={series.color}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  );
                })
              )}  
              
              {chartType === 'area' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;
                  
                  return (
                    <AreaSeries
                      stacking={stacking ? stacking : undefined}
                      key={series.name}
                      name={series.name}
                      data={seriesData}
                      color={series.color}
                      animation={true}
                      states={{
                        hover: {
                          enabled: true,
                          brightness: 0.1,
                        },
                        inactive: {
                          opacity: 0.6,
                        },
                      }}
                      fillOpacity={0.3}
                      marker={{
                        enabled: false,
                      }}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  );
                })
              )}
              
              {chartType === 'column' && (
                (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
                  const useJson = jsonMeta ? true : false;
                  const seriesData = jsonData ? jsonData[index].map((item: any) => [
                    item[series.xIndex], // x value
                    item[series.yIndex]  // y value
                  ]) : series.data;

              
                  if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
                  return(
                    <ColumnSeries
                      borderRadius="8%"
                      stacking={stacking ? stacking : undefined}
                      borderColor="transparent"
                      pointPlacement="on"
                      data={seriesData}
                      color={series.color}
                      name={series.name}
                      key={series.name}
                      dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    />
                  )
                })
              )}
              
              {chartType === 'pie' && (
                <PieSeries
                  animation={true}
                  states={{
                    hover: {
                      enabled: true,
                      brightness: 0.1,
                    },
                    inactive: {
                      opacity: 0.6,
                    },
                  }}
                  allowPointSelect={true}
                  cursor="pointer"
                  borderWidth={0}
                  borderRadius={5}
                  dataLabels={{
                    enabled: false,
                  }}
                  showInLegend={true}
                />
              )}
            </YAxis >
            
            <Tooltip 
              useHTML={true}
              shared={true}
              split={false}
              followPointer={true}
              followTouchMove={true}
              backgroundColor={"#2A3433EE"}
              padding={0}
              hideDelay={300}
              stickOnContact={false}
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

            />
            
          </HighchartsChart>
        </HighchartsProvider>
        <div className="absolute bottom-[27.5%] md:bottom-[24.5%] left-[40px] md:left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40  " 
          style={{
            height: typeof height === "number" ? (height - 147) + "px" : "100%"
          }}
        >
          <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
        </div>
        {/*Footer*/}
        <div className="md:pl-[40px] relative bottom-[2px] flex flex-col justify-between gap-y-[5px] md:gap-y-0">
          <div className="flex flex-col gap-y-[5px]">
            {/*Categories*/}
            <div className="flex gap-x-[5px] md:items-stretch items-center md:justify-normal justify-center">
              {(jsonMeta?.meta || data).map((category) => {
                let bgBorderClass = "border-[1px] border-[#344240] bg-[#344240] hover:border-[#5A6462] hover:bg-[#5A6462] ";
                if(filteredNames.length > 0 && (!filteredNames.includes(category.name))) {
                  bgBorderClass = "border-[1px] border-[#344240] bg-transparent hover:border-[#5A6462] hover:bg-[#5A6462]";
                }
                
                return (
                  <div key={category.name} className={`bg-[#344240] hover:bg-[#5A6462] flex items-center justify-center rounded-full gap-x-[2px] px-[3px] h-[18px] cursor-pointer ${bgBorderClass}`} onClick={() => {
                    
                    if(!filteredNames.includes(category.name)) {
                      setFilteredNames((prev) => {
                        const newFilteredNames = [...prev, category.name];
                        // Check if we would have all categories selected
                        if (newFilteredNames.length === (jsonMeta?.meta || data).length) {
                          return []; // Reset to empty if all would be selected
                        }
                        return newFilteredNames;
                      });
                    } else {
                      setFilteredNames((prev) => prev.filter((name) => name !== category.name));
                    }
                  }}>
                    <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: category.color }}></div>
                    <div className="text-xxxs !leading-[9px]">{category.name}</div>
                  </div>
                )
              })}
            </div>

          </div>
          <div className="h-full flex md:flex-row flex-col justify-between md:items-end items-center ">
            <div className="flex flex-row md:flex-col gap-y-[2px]">
              
              {/* <div className="text-[10px]"><span className="font-bold">Chart type:</span>{` ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`}</div>
              <div className="md:hidden md:mx-0 mx-1 flex items-center relative bottom-[6px] justify-center ">-</div>
              <div className="text-[10px]"><span className="font-bold">Aggregation:</span>{` 7-Day Rolling Average`}</div> */}
            </div>
            {seeMetricURL && (
              <a className="bg-[#263130] md:w-auto w-full rounded-full pl-[15px] pr-[5px] flex items-center md:justify-normal justify-center h-[36px] gap-x-[8px] " href={seeMetricURL} rel="_noopener" style={{
                border: `1px solid transparent`,
              backgroundImage: `linear-gradient(var(--Gradient-Red-Yellow, #263130), var(--Gradient-Red-Yellow, #263130)), linear-gradient(144.58deg, #FE5468 0%, #FF8F4F 70%, #FFDF27 100%)`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}>
              <div className="heading-small-xs">See metric page</div>
              <div className="w-[24px] h-[24px] flex items-center justify-center bg-medium-background rounded-full"><Icon icon={'fluent:arrow-right-32-filled'} className={`w-[15px] h-[15px]`}  /></div>
            </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWrapper;