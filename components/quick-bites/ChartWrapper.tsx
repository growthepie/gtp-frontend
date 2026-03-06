// File: components/quick-bites/ChartWrapper.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  PieSeries,
  Series
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
import dayjs from "@/lib/dayjs";
import { format as d3Format } from "d3"

let highchartsInitialized = false;
interface ChartWrapperProps {
  chartType: 'line' | 'area' | 'column' | 'pie';
  data: any;
  margins?: "none" | "normal";
  options?: any;
  width?: number | string;
  height?: number | string;
  disableTooltipSort?: boolean;
  title?: string;
  subtitle?: string;
  jsonData?: any;
  centerName?: string;
  pieData?: { name: string; y: number; color: string; tooltipDecimals?: number }[];
  showPiePercentage?: boolean;
  yAxisLine?: {
    xValue: number;
    annotationPositionY: number;
    annotationPositionX: number;
    annotationText: string;
    lineStyle?: "solid" | "dashed" | "dotted" | "dashdot" | "longdash" | "longdashdot";
    lineColor?: string;
    textColor?: string;
    lineWidth?: number;
    textFontSize?: string;
    backgroundColor?: string;
  }[];
  jsonMeta?: {
    meta: {
      type?: string,
      name: string,
      color: string,
      stacking?: "normal" | "percent" | null;
      xIndex: number,
      yIndex: number,
      oppositeYAxis?: boolean,
      suffix?: string,
      prefix?: string,
      tooltipDecimals?: number,
      dashStyle?: Highcharts.DashStyleValue,
      makeNegative?: boolean,
      yMultiplication?: number,
      aggregation?: "daily" | "weekly" | "monthly"
    }[]
  }
  seeMetricURL?: string | null;
  showXAsDate?: boolean;
  showZeroTooltip?: boolean;
  showTotalTooltip?: boolean;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  chartType,
  data,
  margins = "normal",
  options = {},
  width = '100%',
  height = 400,
  title,
  subtitle,
  // stacking,
  jsonData,
  jsonMeta,
  yAxisLine,
  seeMetricURL,
  showXAsDate = false,
  disableTooltipSort = false,
  showZeroTooltip = true,
  showTotalTooltip = false,
  centerName,
  pieData,
  showPiePercentage = false,
}) => {
  const chartRef = useRef<any>(null);
  const { theme } = useTheme();
  const [isChartReady, setIsChartReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredNames, setFilteredNames] = useState<string[]>([]);

  const formatNumber = useCallback(
    (value: number | string, isAxis = false, selectedScale = "normal") => {
      const val = parseFloat(value as string);
      const absVal = Math.abs(val);

      // Default: compact SI formatting with 2 significant digits
      let number = d3Format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          // Always max 2 decimals for percentages
          number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (absVal === 0) {
            number = "0";
          } else if (absVal < 1) {
            // Small values: cap at 2 decimal places
            number = val.toFixed(2);
          } else {
            // All other axis values: SI with max 2 significant digits
            number = d3Format(".2~s")(val).replace(/G/, "B");
          }
        }
      }

      return `${number}`;
    },
    [],
  );

  const processedSeriesData = useMemo(() => {
    if (!jsonMeta?.meta || !jsonData) return [];
    
    return jsonMeta.meta.map((series: any, index: number) => ({
      ...series,
      processedData: (() => {
        let rawData = jsonData[index]?.map((item: any) => [
          item[series.xIndex],
          item[series.yIndex]
        ]) || [];

        // Apply transformations (multiplication, negation) if specified
        rawData = rawData.map(([x, y]) => {
          if (y === null || y === undefined) return [x, null];

          let transformedY = y;

          if (typeof series.yMultiplication === "number") {
            transformedY = transformedY * series.yMultiplication;
          }

          if (series.makeNegative) {
            transformedY = -transformedY;
          }

          return [x, transformedY];
        });

        // Apply aggregation if specified
        if (series.aggregation && series.aggregation !== "daily") {
          const aggregated = new Map<string, { sum: number; count: number; firstTimestamp: number }>();
          
          // Filter out null values for aggregation
          const validData = rawData.filter(([x, y]) => y !== null && y !== undefined);
          
          if (validData.length === 0) {
            return rawData;
          }
          
          validData.forEach(([timestamp, value]) => {
            let key: string;
            if (series.aggregation === "weekly") {
              // Group by calendar weeks (week starts on Monday)
              const date = new Date(timestamp);
              const weekStart = new Date(date);
              const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
              // Convert to Monday-based: Monday = 0, Tuesday = 1, ..., Sunday = 6
              const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              weekStart.setUTCDate(date.getUTCDate() - mondayOffset); // Go back to Monday
              weekStart.setUTCHours(0, 0, 0, 0);
              key = weekStart.getTime().toString();
            } else if (series.aggregation === "monthly") {
              // Group by calendar month (year-month)
              const date = new Date(timestamp);
              const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
              monthStart.setUTCHours(0, 0, 0, 0);
              key = monthStart.getTime().toString();
            } else {
              return; // Unknown aggregation, skip
            }
            
            if (!aggregated.has(key)) {
              aggregated.set(key, { sum: 0, count: 0, firstTimestamp: timestamp });
            }
            
            const bucket = aggregated.get(key)!;
            bucket.sum += value;
            bucket.count += 1;
          });
          
          // Convert aggregated map to array, summing values for each period
          rawData = Array.from(aggregated.entries()).map(([key, bucket]) => [
            parseInt(key), // Use the period start timestamp
            bucket.sum // Sum of all values in the period
          ]).sort((a, b) => a[0] - b[0]); // Sort by timestamp
        }

        return rawData;
      })()
    }));
  }, [jsonMeta, jsonData]);

  const filteredSeries = useMemo(() => {
    return processedSeriesData.filter(series => 
      filteredNames.length === 0 || filteredNames.includes(series.name)
    );
  }, [processedSeriesData, filteredNames]);

  const minTimestampDelta = useMemo(() => {
    const seriesToInspect = filteredSeries.length ? filteredSeries : processedSeriesData;
    let smallestDelta = Number.POSITIVE_INFINITY;

    seriesToInspect.forEach((series: any) => {
      const points = series?.processedData || [];
      for (let i = 1; i < points.length; i++) {
        const current = points[i]?.[0];
        const previous = points[i - 1]?.[0];

        if (typeof current === "number" && typeof previous === "number") {
          const delta = Math.abs(current - previous);
          if (delta > 0 && delta < smallestDelta) {
            smallestDelta = delta;
          }
        }
      }
    });

    return smallestDelta === Number.POSITIVE_INFINITY ? null : smallestDelta;
  }, [filteredSeries, processedSeriesData]);

  const shouldShowTimeInTooltip = showXAsDate && !!minTimestampDelta && minTimestampDelta < 24 * 60 * 60 * 1000;
  
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
      // Pie charts with static pieData don't need the time-series data array
      if (chartType === 'pie' && pieData && pieData.length > 0) {
        setIsChartReady(true);
        setLoading(false);
        setError(null);
        return;
      }
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
  }, [data, chartType, pieData]); // Runs when data change
  
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
      const dateFormat = shouldShowTimeInTooltip ? "DD MMM YYYY HH:mm" : "DD MMM YYYY";
      let dateString = dayjs.utc(x).format(dateFormat);
      const total = points.reduce((acc: number, point: any) => {
        acc += point.y;
        return acc;
      }, 0);

      const tooltip = `<div class="mt-3 mr-3 mb-3  text-xs font-raleway rounded-full bg-opacity-60 min-w-[240px]">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;
      const tooltipEnd = `</div>`;

      const filteredPoints = showZeroTooltip ? points : points.filter((point: any) => point.y !== 0);
      const totalMeta = jsonMeta?.meta?.[0];
      const totalPrefix = totalMeta?.prefix || '';
      const totalSuffix = totalMeta?.suffix || '';
      const totalDecimals = totalMeta?.tooltipDecimals ?? 2;
      const totalValue = total.toLocaleString("en-GB", {
        minimumFractionDigits: totalDecimals,
        maximumFractionDigits: totalDecimals
      });
      const totalLine = showTotalTooltip
        ? `<div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full"></div>
            <div class="tooltip-point-name text-xs">Total</div>
            <div class="flex-1 text-right justify-end numbers-xs flex">
              <div class="${!totalPrefix && "hidden"}">${totalPrefix}</div>
              ${totalValue}
              <div class="ml-0.5 ${!totalSuffix && "hidden"}">${totalSuffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
          </div>`
        : "";

      const tooltipPoints = filteredPoints
        // order by value
        .sort((a: any, b: any) => {
          if(disableTooltipSort) return 0;
          const aValue = parseFloat(a.y);
          const bValue = parseFloat(b.y);
          return bValue - aValue;
        })
        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          
          const nameString = name.slice(0, 20);
          
          const color = series.color.stops ? series.color.stops[0][1] : series.color;

          
          // Match meta by series name instead of the sorted index so suffix/prefix follow the right series
          const metaEntry = jsonMeta?.meta.find((meta) => meta.name === name);
          const currentPrefix = metaEntry?.prefix || '';
          const currentSuffix = metaEntry?.suffix || '';
          const currentDecimals = metaEntry?.tooltipDecimals ?? 2;
          const stackingMode = metaEntry?.stacking;


          let displayValue = parseFloat(y).toLocaleString("en-GB", {
            minimumFractionDigits: currentDecimals,
            maximumFractionDigits: currentDecimals
          });

          let displayText;
          /* this might be wrong */
          if (stackingMode === "percent") {
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

      return tooltip + tooltipPoints + totalLine + tooltipEnd;
    },
    [jsonMeta, shouldShowTimeInTooltip, disableTooltipSort, showZeroTooltip, showTotalTooltip],
  );

  const resolvedPieData = useMemo(() => {
    if (chartType !== 'pie') return null;
    if (pieData && pieData.length > 0) return pieData;
    // Compute from fetched time-series: take the last non-null y value per series
    return processedSeriesData.map(s => ({
      name: s.name,
      y: [...s.processedData].reverse().find(([, y]) => y !== null && y !== undefined)?.[1] ?? 0,
      color: s.color,
    }));
  }, [chartType, pieData, processedSeriesData]);

  const pieTooltipFormatter = useCallback(
    function(this: any) {
      const color = this.point.color;
      const name = this.point.name;
      const y = this.y;
      const percentage = this.percentage;

      const metaEntry = pieData
        ? pieData.find(p => p.name === name)
        : jsonMeta?.meta.find(m => m.name === name);
      const prefix = (metaEntry as any)?.prefix || '';
      const suffix = (metaEntry as any)?.suffix || '';
      const decimals = (metaEntry as any)?.tooltipDecimals ?? 2;

      const displayValue = y.toLocaleString("en-GB", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      const percentageStr = showPiePercentage
        ? `<div class="text-right numbers-xs text-forest-400">${percentage.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</div>`
        : '';

      return `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
        <div class="flex space-x-2 items-center font-medium mb-0.5">
          <div class="min-w-4 max-w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
          <div class="tooltip-point-name text-xs">${name}</div>
          <div class="flex-1 text-right justify-end flex numbers-xs ml-2 gap-x-[5px]">
            <div>${prefix}${displayValue}${suffix}</div>${percentageStr}
          </div>
        </div>
      </div>`;
    },
    [pieData, jsonMeta, showPiePercentage],
  );

  const hasOppositeYAxis = jsonMeta?.meta.some((series: any) => series.oppositeYAxis === true);

  
  if (loading) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-forest-50 dark:bg-forest-900 rounded-lg animate-pulse"
        aria-busy="true"
      >
        <p className="text-color-text-primary dark:text-forest-400">Loading chart...</p>
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
    <div className={`relative ${margins === "none" ? "px-0" : "md:px-[35px]"}`}>
      <div style={{ width, height }} className="relative bg-transparent md:bg-color-ui-active rounded-[25px] shadow-none md:shadow-md flex flex-col gap-y-[15px] h-full md:p-[15px] ">
        <div className="w-full h-auto pl-[10px] pr-[5px] py-[5px] bg-color-bg-default rounded-full">
          <div className="flex items-center justify-center md:justify-between">
            <div className="flex items-center gap-x-[5px]">
              <div className="w-fit h-fit"><GTPIcon icon={"gtp-quick-bites"} className="w-[24px] h-[24px] "/></div>
              <div className="heading-small-md">{title}</div>
            </div>
          </div>
        </div>
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart chart={chartRef.current} options={options || {}}
              plotOptions={{
                pie: {
                  allowPointSelect: false,
                  cursor: "pointer",
                  showInLegend: false,
                  borderWidth: 10,
                  borderColor: "transparent",
                  dataLabels: { enabled: false },
                },
                line: {
                  lineWidth: 3,
                },
                area: {
                  lineWidth: 2,
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
              type={chartType === 'pie' ? 'pie' : 'line'}
              panning={{
                enabled: false,
                type: "x",
              }}

              panKey="shift"
              zooming={{
                mouseWheel: {
                  enabled: false,
                },
              }}
              animation={{
                duration: 50,
              }}
              marginBottom={chartType === 'pie' ? 10 : (showXAsDate ? 32 : 20)}
              marginLeft={chartType === 'pie' ? undefined : 50}
              marginRight={chartType === 'pie' ? undefined : (hasOppositeYAxis ? 50 : 5)}
              marginTop={chartType === 'pie' ? 2 : 15}
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
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
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
              plotLines={yAxisLine?.map((line) => ({
                value: line.xValue,
                color: line.lineColor || (theme === 'dark' ? '#CDD8D3' : '#293332'),
                width: line.lineWidth || 1,
                zIndex: 5,
                dashStyle: line.lineStyle as Highcharts.DashStyleValue || 'solid',
                label: {
                  text: `<div class="text-xxs font-raleway bg-${line.backgroundColor || 'color-bg-default'} rounded-[15px] px-2 py-1">${line.annotationText}</div>`,
                  useHTML: true,
                  align: 'center',
                  rotation: 0,
                  x: line.annotationPositionX,
                  y: line.annotationPositionY,
                  style: {
                    color: line.textColor || (theme === 'dark' ? '#CDD8D3' : '#293332'),
                    fontSize: line.textFontSize || '9px',
                    fontFamily: 'Raleway'
                  }
                }
              }))}
            />
            <YAxis
              id="0"
              type={options?.yAxis?.[0]?.type}
              labels={{
                style: {
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                  fontSize: '8px',
                },
                // formatter: function (this: any) {
                //   if (jsonMeta?.meta[0]?.suffix) {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     }) + jsonMeta.meta[0].suffix;
                //   } else {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     });
                //   }
                // }
                formatter: function (t: AxisLabelsFormatterContextObject) {
                  return formatNumber(t.value, true, filteredSeries?.[0]?.stacking || "normal");
                },
              }}
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
            >
              {chartType !== 'pie' && jsonMeta && jsonMeta.meta && jsonMeta.meta
              .map((series: any, index: number) => {
                // filter out series that are not on the opposite y axis and not filtered out
                const showSeries = !series.oppositeYAxis && (filteredNames.length === 0 || filteredNames.includes(series.name));
                if(!showSeries) return null;

                // use the type from the jsonMeta if it exists, otherwise use the chartType
                const type = series.type || chartType;
                // use the yaxis from the jsonMeta if it exists, otherwise use 0
                const chartYaxis = series.oppositeYAxis === true ? 1 : 0;

                const fillOpacity = type === "area" ? 0.3 : undefined;

                return (
                  <Series
                    key={series.name}
                    type={type}
                    name={series.name}
                    yAxis={chartYaxis}
                    data={processedSeriesData[index].processedData}
                    color={series.color}
                    fillOpacity={fillOpacity}
                    dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    animation={true}
                    stacking={series.stacking ? series.stacking : undefined}
                    borderRadius={type === "column" ? "8%" : undefined}
                    marker={{
                      enabled: false,
                    }}
                    states={{
                      hover: {
                        enabled: true,
                        brightness: 0.1,
                      },
                      inactive: {
                        opacity: 0.6,
                      },
                    }}
                    zIndex={type === "column" ? 0 : 1}
                  />
                )
              })}
              {chartType === 'pie' && resolvedPieData && (
                <PieSeries
                  innerSize="95%"
                  size="100%"
                  borderRadius={8}
                  dataLabels={{ enabled: false }}
                  data={resolvedPieData.filter(d => filteredNames.length === 0 || filteredNames.includes(d.name))}
                  animation={true}
                  states={{
                    hover: { enabled: true, brightness: 0.1 },
                    inactive: { opacity: 0.6 },
                  }}
                />
              )}
            </YAxis>
            <YAxis
              id="1"
              type={options?.yAxis?.[1]?.type || options?.yAxis?.[0]?.type}
              opposite={true}
              labels={{
                style: {
                  color: theme === 'dark' ? '#CDD8D3' : '#293332',
                  fontSize: '8px',
                },
                // formatter: function (this: any) {
                //   if (jsonMeta?.meta[0]?.suffix) {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     }) + jsonMeta.meta[0].suffix;
                //   } else {
                //     return this.value.toLocaleString("en-GB", {
                //       minimumFractionDigits: 0,
                //       maximumFractionDigits: 2
                //     });
                //   }
                // }
                formatter: function (t: AxisLabelsFormatterContextObject) {
                  return formatNumber(t.value, true, filteredSeries?.[0]?.stacking || "normal");
                },
              }}
              gridLineColor={theme === 'dark' ? 'rgba(215, 223, 222, 0.11)' : 'rgba(41, 51, 50, 0.11)'}
              
            >
              {jsonMeta && jsonMeta.meta && jsonMeta.meta
              .map((series: any, index: number) => {
                // filter out series that are not on the opposite y axis and not filtered out
                const showSeries = series.oppositeYAxis === true && (filteredNames.length === 0 || filteredNames.includes(series.name));
                if(!showSeries) return null;

                // use the type from the jsonMeta if it exists, otherwise use the chartType
                const type = series.type || chartType;
                // use the yaxis from the jsonMeta if it exists, otherwise use 0
                const chartYaxis = series.oppositeYAxis === true ? 1 : 0;
                const fillOpacity = type === "area" ? 0.3 : undefined;
                
                return (
                  <Series 
                    key={series.name}
                    type={type}
                    name={series.name}
                    yAxis={chartYaxis}
                    data={processedSeriesData[index].processedData} 
                    color={series.color} 
                    fillOpacity={fillOpacity}
                    dashStyle={series.dashStyle ? series.dashStyle : undefined}
                    animation={true}
                    stacking={series.stacking ? series.stacking : undefined}
                    borderRadius={type === "column" ? "8%" : undefined}
                    marker={{
                      enabled: false,
                    }}
                    states={{
                      hover: {
                        enabled: true,
                        brightness: 0.1,
                      },
                      inactive: {
                        opacity: 0.6,
                      },
                    }}
                    zIndex={type === "column" ? 0 : 1}
                  />
                )
              })}
            </YAxis>
            {/* {chartType === 'column' && (
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
              )} */}

              {/* {chartType === 'line' && (
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
              )} */}
            
            <Tooltip
              useHTML={true}
              shared={chartType === 'pie' ? false : true}
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
              formatter={chartType === 'pie' ? pieTooltipFormatter : tooltipFormatter}
            />

          </HighchartsChart>
        </HighchartsProvider>
        {chartType === 'pie' && centerName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-xxxs font-bold leading-[120%] text-center max-w-[80px]">
              {centerName}
            </div>
          </div>
        )}
        <div className="absolute bottom-[27.5%] md:bottom-[18.5%] left-[40px] md:left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-40  "
          style={{
            height: typeof height === "number" ? (height - 147) + "px" : "100%"
          }}
        >
          <ChartWatermark className="w-[128.67px] h-[30.67px] md:w-[193px] md:h-[46px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
        </div>
        {/*Footer*/}
        <div className="md:px-[50px] relative bottom-[2px] flex flex-col justify-between gap-y-[5px] md:gap-y-0">
          <div className="flex flex-col gap-y-[5px]">
            {/*Categories*/}
            <div className="flex flex-1 gap-[5px] flex-wrap items-center justify-center">
              {/* <div className="flex gap-x-[5px] md:items-stretch items-center md:justify-normal justify-center"> */}
                {(chartType === 'pie' && resolvedPieData ? resolvedPieData : (jsonMeta?.meta || data)).filter((series: any) => !series.oppositeYAxis).map((category: any) => {
                  const allCategories: any[] = chartType === 'pie' && resolvedPieData ? resolvedPieData : (jsonMeta?.meta || data);
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if(filteredNames.length > 0 && (!filteredNames.includes(category.name))) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }

                  return (
                    <div key={category.name} className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`} onClick={() => {
                      if(!filteredNames.includes(category.name)) {
                        setFilteredNames((prev) => {
                          const newFilteredNames = [...prev, category.name];
                          // Check if we would have all categories selected
                          if (newFilteredNames.length === allCategories.length) {
                            return []; // Reset to empty if all would be selected
                          }
                          return newFilteredNames;
                        });
                      } else {
                        setFilteredNames((prev) => prev.filter((name) => name !== category.name));
                      }
                    }}>
                      <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: category.color }}></div>
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}
                
              {/* </div> */}
              {/* <div className="flex gap-x-[5px] md:items-stretch items-center md:justify-normal justify-center"> */}
                {(jsonMeta?.meta || data).filter((series: any) => series.oppositeYAxis === true).map((category) => {
                  let bgBorderClass = "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-[#5A6462] hover:bg-color-ui-hover ";
                  if(filteredNames.length > 0 && (!filteredNames.includes(category.name))) {
                    bgBorderClass = "border-[1px] border-color-bg-medium bg-transparent hover:border-[#5A6462] hover:bg-color-ui-hover";
                  }
                  
                  return (
                    <div key={category.name} className={`bg-color-bg-medium hover:bg-color-ui-hover flex items-center justify-center rounded-full gap-x-[2px] pl-[3px] pr-[4px] h-[18px] cursor-pointer ${bgBorderClass}`} onClick={() => {
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
                      <div className="text-xxxs -mb-[1px] whitespace-nowrap">{category.name}</div>
                    </div>
                  )
                })}
                
              {/* </div> */}
            </div>
            {filteredNames && filteredNames.length > 0 && (
              <div className={`flex items-center justify-center rounded-full gap-x-[5px] pl-[3px] pr-[4px] h-[18px] cursor-pointer `} onClick={() => setFilteredNames([])}>
                <div className="w-[5px] h-[5px] rounded-full flex items-center justify-center"><GTPIcon icon={"gtp-close-monochrome"} className={`!size-[7px] text-red-500`} containerClassName='!size-[7px]'  /></div>
                <div className="text-xxxs whitespace-nowrap">Reset</div>
              </div>
            )}
          </div>
          <div className="h-full flex md:flex-row flex-col justify-between md:items-end items-center ">
            <div className="flex flex-row md:flex-col gap-y-[2px]">
              
              {/* <div className="text-[10px]"><span className="font-bold">Chart type:</span>{` ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`}</div>
              <div className="md:hidden md:mx-0 mx-1 flex items-center relative bottom-[6px] justify-center ">-</div>
              <div className="text-[10px]"><span className="font-bold">Aggregation:</span>{` 7-Day Rolling Average`}</div> */}
            </div>
            {seeMetricURL && (
              <a className="bg-color-bg-medium md:w-auto w-full rounded-full pl-[15px] pr-[5px] flex items-center md:justify-normal justify-center h-[36px] gap-x-[8px] " href={seeMetricURL} rel="_noopener" style={{
                border: `1px solid transparent`,
              backgroundImage: `linear-gradient(var(--Gradient-Red-Yellow, rgb(var(--bg-medium))), var(--Gradient-Red-Yellow, rgb(var(--bg-medium)))), linear-gradient(144.58deg, #FE5468 0%, #FF8F4F 70%, #FFDF27 100%)`,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box'
            }}>
              <div className="heading-small-xs text-color-text-primary">See metric page</div>
              <div className="w-[24px] h-[24px] flex items-center justify-center bg-color-bg-medium rounded-full"><Icon icon={'fluent:arrow-right-32-filled'} className={`w-[15px] h-[15px]`}  /></div>
            </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWrapper;


// const GetSeriesComponent = (series: any, jsonMeta: any, data: any, jsonData: any, filteredNames: string[], stacking: string, chartType: string) => {
//   {chartType === 'line' && (
//     (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;
     
//       return (
//         <LineSeries
//           animation={true}
//           key={series.name}
//           name={series.name}
//           data={seriesData}
//           color={series.color}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       );
//     })
//   )}  
  
//   {chartType === 'area' && (
//     (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;
      
//       return (
//         <AreaSeries
//           stacking={stacking ? stacking : undefined}
//           key={series.name}
//           name={series.name}
//           data={seriesData}
//           color={series.color}
//           animation={true}
//           states={{
//             hover: {
//               enabled: true,
//               brightness: 0.1,
//             },
//             inactive: {
//               opacity: 0.6,
//             },
//           }}
//           fillOpacity={0.3}
//           marker={{
//             enabled: false,
//           }}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       );
//     })
//   )}
  
//   if(series.type === "column") {
//     return (jsonMeta ? jsonMeta.meta : data).map((series: any, index: number) => {
//       const useJson = jsonMeta ? true : false;
//       const seriesData = jsonData ? jsonData[index].map((item: any) => [
//         item[series.xIndex], // x value
//         item[series.yIndex]  // y value
//       ]) : series.data;

  
//       if(!filteredNames.includes(series.name) && filteredNames.length > 0) return null;
//       return(
//         <ColumnSeries
//           borderRadius="8%"
//           stacking={stacking ? stacking : undefined}
//           borderColor="transparent"
//           pointPlacement="on"
//           data={seriesData}
//           color={series.color}
//           name={series.name}
//           key={series.name}
//           dashStyle={series.dashStyle ? series.dashStyle : undefined}
//         />
//       )
//     })
//   }
  
//   if(series.type === "pie") {
//     return (
//     <PieSeries
//       animation={true}
//       states={{
//         hover: {
//           enabled: true,
//           brightness: 0.1,
//         },
//         inactive: {
//           opacity: 0.6,
//         },
//       }}
//       allowPointSelect={true}
//       cursor="pointer"
//       borderWidth={0}
//       borderRadius={5}
//       dataLabels={{
//         enabled: false,
//       }}
//       showInLegend={true}
//     />
//     )
//   }
// }