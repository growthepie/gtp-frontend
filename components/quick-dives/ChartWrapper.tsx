// File: components/quick-dives/ChartWrapper.tsx
'use client';
import addHighchartsMore from "highcharts/highcharts-more";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Highcharts from 'highcharts/highstock';
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  Tooltip,
  Series,
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

// Extend Highcharts Chart type to include customWatermark
declare module 'highcharts' {
  interface Chart {
    customWatermark?: Highcharts.SVGElement;
  }
}

interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'bar' | 'column' | 'pie';
  data: any;
  options?: any;
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  options = {},
  width = '100%',
  height = 400,
  title,
  subtitle
}) => {
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize Highcharts modules
  useEffect(() => {
    try {
      // Only initialize once
      if (!Highcharts.charts || Highcharts.charts.length === 0) {
        highchartsRoundedCorners(Highcharts);
        highchartsAnnotations(Highcharts);
        highchartsPatternFill(Highcharts);
        
        Highcharts.setOptions({
          lang: {
            numericSymbols: ["K", " M", "B", "T", "P", "E"],
          },
        });
      }
      
      // Validate data
      if (!Array.isArray(data)) {
        throw new Error('Chart data must be an array');
      }
      
      setIsChartReady(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to initialize chart');
      setLoading(false);
    }
  }, [data]);
  
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


      const tooltip = `<div class="mt-3 mr-3 mb-3 w-56 md:w-56 text-xs font-raleway rounded-full bg-opacity-60">
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

        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          console.log(series)

          const isFees = true;
          const nameString = name.slice(0, 20);
          

          const color = series.color.stops ? series.color.stops[0][1] : series.color;

          let prefix = "";
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
              ${
                parseFloat(displayValue).toLocaleString(
                  "en-GB",
                  {
                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2,
                  },
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
    [],
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

  console.log(chartType)
  return (
    <div style={{ width, height }} className="relative">
      <HighchartsProvider Highcharts={Highcharts}>
        <HighchartsChart ref={chartRef}
            plotOptions={{
              line: {
                lineWidth: 1.5,
              },
              area: {
                lineWidth: 1.5,
                dataGrouping: {
                  enabled: true,
                  
                },

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
            marginBottom={5}
            marginLeft={45}
            marginRight={45}
            marginTop={15}
            

          />
          
          
          <XAxis 
            labels={{
              style: {
                color: theme === 'dark' ? '#CDD8D3' : '#293332',
                fontSize: '10px',
              }
            }}
        
            gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
            lineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
            tickColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.33)' : 'rgba(41, 51, 50, 0.33)'}
          />
          
          <YAxis 
            labels={{
              style: {
                color: theme === 'dark' ? '#CDD8D3' : '#293332',
                fontSize: '10px',
              }
            }}
            gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
          >
            {chartType === 'line' && (
              data.map((series: any) => (
                <LineSeries
                  animation={true}
                  key={series.name}
                  name={series.name}
                  data={series.data}
                  color={series.color}

                />
              ))
            )}  
            
            {chartType === 'area' && (
              data.map((series: any) => {
                return (
                  <AreaSeries
                    key={series.name}
                    name={series.name}
                    data={series.data}
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
                  />
                );
              })
            )}
            
            {chartType === 'column' && (
              console.log(data),
              data.map((series: any) => {
                return(
                  <ColumnSeries
                    borderRadius="8%"
                    borderColor="transparent"
                    
                    pointPlacement="on"
                    data={series.data}
                    color={series.color}
                    name={series.name}
                    key={series.name}
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
          />
          
        </HighchartsChart>
      </HighchartsProvider>
      <div className="absolute bottom-[5%] left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40 h-full">
        <ChartWatermark className="w-[200.67px] h-[150.67px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
      </div>
    </div>
  );
};

export default ChartWrapper;