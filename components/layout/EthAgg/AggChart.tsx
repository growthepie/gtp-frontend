// components/layout/EthAgg/DashboardChart.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { HighchartsProvider, HighchartsChart, Chart, XAxis, YAxis, Series, Tooltip, ColumnSeries } from 'react-jsx-highcharts';
import Highcharts from 'highcharts';
import { useId } from 'react';
import { ChartWatermarkWithMetricName } from '../ChartWatermark';
import { CHART_MARGINS, createChartOnRender, createTooltipFormatter } from './chartHelpers';
import { Gdp, Stables, CountLayer2s, Tps } from '@/types/api/EthAggResponse';
import * as d3 from 'd3';
import "@/app/highcharts.axis.css";
import { useLocalStorage } from 'usehooks-ts';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import { tooltipPositioner } from '@/lib/chartUtils';
import { useMaster } from '@/contexts/MasterContext';
import { AggChartProps } from './MetricsCharts';

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};


// --- Helper Functions (can be in this file or a utils file) ---
function formatNumber(number: number, decimals = 2): string {
  if (number === 0) return "0";
  if (Math.abs(number) >= 1e12) return (number / 1e12).toFixed(decimals) + "T";
  if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(decimals) + "B";
  if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(decimals) + "M";
  if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(decimals) + "k";
  return number.toFixed(decimals);
}


export function AggChart({
  title,
  dataSource,
  seriesConfigs,
  totalValueExtractor,
  shareValueExtractor,
}: AggChartProps) {
  const uniqueId = useId();
  const { AllChainsByKeys } = useMaster();
  const [showUsd] = useLocalStorage("showUsd", true);

  // --- INTERNAL CALCULATION USING CONFIGS ---
  const { totalValue, shareValue, seriesData, xAxisMin, xAxisMax } = useMemo(() => {
    const total = totalValueExtractor(dataSource, showUsd);
    const share = shareValueExtractor ? shareValueExtractor(dataSource, showUsd) : undefined;

    let minX = Infinity;
    let maxX = -Infinity;

    const dataForSeries = seriesConfigs.map(config => {
      const dataPoints = config.dataExtractor(dataSource, showUsd);
      if (dataPoints.length > 0) {
        minX = Math.min(minX, dataPoints[0][0]);
        maxX = Math.max(maxX, dataPoints[dataPoints.length - 1][0]);
      }
      return dataPoints;
    });

    return {
      totalValue: total,
      shareValue: share,
      seriesData: dataForSeries,
      xAxisMin: isFinite(minX) ? minX : null,
      xAxisMax: isFinite(maxX) ? maxX : Date.now(),
    };
  }, [dataSource, seriesConfigs, showUsd, totalValueExtractor, shareValueExtractor]);

  // The rest of the component remains largely the same, but it now uses the internally calculated values.
  const lastPointLines = useRef<{ [key: string]: Highcharts.SVGElement[] }>({}).current;
  const onRender = useMemo(() => createChartOnRender(lastPointLines, uniqueId), [lastPointLines, uniqueId]);
  // Memoize the tooltip formatter
  const tooltipFormatter = useMemo(() => createTooltipFormatter(showUsd), [showUsd]);

  const getSeriesName = (key: string) => (key === 'layer_2s' ? 'Layer 2s' : 'Ethereum Mainnet');
  const getChainKey = (key: string) => (key === 'layer_2s' ? 'all_l2s' : 'ethereum');
  const [chartContainerRef, { width: chartContainerWidth }] =
    useElementSizeObserver<HTMLDivElement>();

  const prefix = showUsd ? "$" : "Ξ";

  const xAxisExtremes = useMemo(() => {
    const xMin = xAxisMin !== null ? xAxisMin : (seriesData[0]?.values[0]?.[0] || 0);
    const xMax = xAxisMax || (seriesData[0]?.values[seriesData[0].values.length - 1]?.[0] || Date.now());
    return { xMin, xMax };
  }, [xAxisMin, xAxisMax, seriesData]);


  const formatNumberOther = useCallback(
    (value: number | string) => {
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
      if (true) {
        if (showUsd) {
          if (val < 1) {
            number = prefix + val.toFixed(2);
          } else {
            number = prefix + formatLargeNumber(val);
          }
        } else {
          number = prefix + formatLargeNumber(val);
        }
      } else {
        number = number + " GB";
      }

      return number;
    },
    [showUsd],
  );


  return (
    <div className='group/chart flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
      {/* Header */}
      <div className='flex h-[56px] px-[34px] items-start w-full'>
        <div className='flex gap-x-[5px] items-center'>
          <div className='heading-large-md text-nowrap'>{title}</div>
        </div>
        <div className='flex flex-col h-full items-end pt-[5px] w-full'>
          <div className='flex items-center gap-x-[5px]'>
            <div className='numbers-xl bg-gradient-to-b bg-[#CDD8D3] bg-clip-text text-transparent'>{totalValue}</div>
            <div className='w-[16px] h-[16px] rounded-full z-chart bg-[#CDD8D3]' />
          </div>
          {shareValue && (
            <div className='flex items-center gap-x-[5px]'>
              <div className='text-sm bg-gradient-to-b from-[#FE5468] to-[#FFDF27] bg-clip-text text-transparent'>{shareValue}</div>
              <div className='w-[16px] h-[16px] rounded-full bg-transparent' />
            </div>
          )}
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-[40.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
        <ChartWatermarkWithMetricName className="w-[128.67px] h-[36px] md:w-[193px] md:h-[58px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten z-30" metricName={title} />
      </div>
      <div className='w-full absolute bottom-0' ref={chartContainerRef}>
        <HighchartsProvider Highcharts={Highcharts}>
          <HighchartsChart
            plotOptions={{
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
              backgroundColor={"transparent"}
              height={380}
              spacing={[0, 0, 0, 0]}
              {...CHART_MARGINS}
              onRender={onRender}
              animation={false}
            />
            <XAxis
              type="datetime"
              gridLineWidth={0}
              labels={{ enabled: false }}
              crosshair={{
                width: 0.5,
                color: COLORS.PLOT_LINE,
                snap: false,
              }}
              min={xAxisMin}
              max={xAxisMax}
            />
            <YAxis
              opposite={false}
              type="linear"
              gridLineWidth={1}
              gridLineColor={"#5A64624F"}
              showFirstLabel={false}
              // showLastLabel={false}
              tickAmount={5}
              labels={{
                useHTML: true,
                align: "left",
                y: 15,
                x: 5,
                style: {
                  backgroundColor: "transparent",
                  whiteSpace: "nowrap",
                  color: "#CDD8D3",
                  fontSize: "9px",
                  fontWeight: "500",
                  fontFamily: "var(--font-raleway), sans-serif",
                },
                formatter: function (
                  t: Highcharts.AxisLabelsFormatterContextObject,
                ) {
                  return formatNumberOther(t.value);
                },
              }}
            >
              {seriesConfigs.map((config, index) => {
                const colors = AllChainsByKeys[config.key] ? AllChainsByKeys[config.key].colors.dark : ["#10808C", "#1DF7EF"];
                // Dynamically create Series or ColumnSeries based on config
                const commonProps = {
                  name: config.name,
                  data: seriesData[index],
                  color: colors[0],
                  stacking: config.stacking,
                  marker: { enabled: false },

                };

                if (config.type === 'column') {
                  return <ColumnSeries

                    key={index}
                    {...commonProps}
                    clip={false}
                    borderRadius={0}
                    borderColor="transparent"
                    // pointPadding={0}
                    // groupPadding={0}
                    pointWidth={((chartContainerWidth - 44) / seriesData[index].length) * 0.7}
                    pointPlacement="on"
                    crisp={true}
                    color={{
                      linearGradient: {
                        x1: 0,
                        y1: 1,
                        x2: 0,
                        y2: 0,
                      },
                      stops: [
                        [0, colors[0]],
                        // [0.33, AllChainsByKeys[series.name].colors[1]],
                        [1, colors[1]],
                      ],
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
                          colors[1] + "33",
                        ],

                        [
                          1,
                          colors[0] + "33",
                        ],
                      ],
                    }}
                    shadow={{
                      color: colors[1] + "CC",
                      width: 5,
                    }}
                    states={{
                      hover: {
                        halo: {
                          size: 5,
                          opacity: 1,
                          attributes: {
                            fill:
                              colors[0] + "99",
                            stroke:
                              colors[0] + "66",
                            "stroke-width": 0,
                          },

                        },
                        brightness: 0.3,
                      },
                      inactive: {
                        enabled: true,
                        opacity: 0.6,
                      },
                    }}
                  />;
                }
                return <Series key={index} type="area" {...commonProps}
                  lineWidth={1.5}
                  crisp={true}
                  color={{
                    linearGradient: {
                      x1: 0,
                      y1: 0,
                      x2: 1,
                      y2: 0,
                    },
                    stops: [
                      [0, colors[0] + "CC"],
                      // [0.33, AllChainsByKeys[series.name].colors[1]],
                      [1, colors[1] + "CC"],
                    ],
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
                        colors[1] + "33",
                      ],

                      [
                        1,
                        colors[0] + "33",
                      ],
                    ],
                  }}
                  shadow={{
                    color: colors[1] + "CC",
                    width: 5,
                  }}
                  states={{
                    hover: {
                      halo: {
                        size: 5,
                        opacity: 1,
                        attributes: {
                          fill:
                            colors[0] + "99",
                          stroke:
                            colors[0] + "66",
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
                />;
              })}
            </YAxis>
            <Tooltip
              useHTML={true} shared={true} split={false} followPointer={true}
              backgroundColor={"#2A3433EE"} padding={0} hideDelay={300} stickOnContact={true}
              shape="rect" borderRadius={17} borderWidth={0} outside={true}
              style={{ color: "rgb(215, 223, 222)" }}
              formatter={tooltipFormatter}
              positioner={tooltipPositioner}
              // ADDED SHADOW HERE
              shadow={{
                color: "black",
                opacity: 0.015,
                offsetX: 2,
                offsetY: 2,
              }}
            />
          </HighchartsChart>
        </HighchartsProvider>
      </div>
      {/* Custom X-Axis Timeline (This could also be its own component later) */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center px-[33px] opacity-100 transition-opacity duration-[900ms] group-hover/chart:opacity-0 pointer-events-none'>
        <div className='w-full h-[22px] bg-[#34424080] flex items-center rounded-t-[15px] px-[7px]'>
          <div className={`flex items-center  text-xs gap-x-[2px] flex-1`}>
            <div className='min-w-[6px] min-h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
            <div className='text-xs'>{new Date(xAxisExtremes.xMin + 43 * (xAxisExtremes.xMax - xAxisExtremes.xMin) / (chartContainerWidth - 44)).toLocaleDateString("en-GB", {
              year: "numeric",
            })}
            </div>
            <div className=' w-full h-[1px] bg-[#344240]' />
          </div>
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className={`flex  flex-1 items-center  text-xs gap-x-[2px]  `}>
              <div className={`${i < 1 ? "w-[6px] h-[6px]" : "w-0 h-0"}  mt-0.5 bg-[#CDD8D3] rounded-full`}></div>
              <div className='text-xs'>{new Date((xAxisExtremes.xMin + ((xAxisExtremes.xMax - xAxisExtremes.xMin) / 3) * (i + 1)) * ((chartContainerWidth - 44) / chartContainerWidth)).toLocaleDateString("en-GB", {

                year: "numeric",
              })}</div>
              <div className={`${i >= 1 ? "min-w-[6px] min-h-[6px]" : "w-0 h-0"}  mt-0.5 bg-[#CDD8D3] rounded-full`}></div>

              <div className=' w-full h-[1px] bg-[#344240]' />




            </div>
          ))}
          <div className={`flex items-center flex-row-reverse text-xs gap-x-[2px] `}>
            <div className='min-w-[6px] min-h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
            <div className='text-xs'>{new Date(xAxisExtremes.xMax).toLocaleDateString("en-GB", {

              year: "numeric",
            })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}