import React, { useMemo, useState, useCallback } from 'react';
import { GTPIcon } from '../GTPIcon';
import Container from '../Container';
import { TopRowContainer } from '../TopRow';
import { TopRowParent } from '../TopRow';
import { TopRowChild } from '../TopRow';
import { HighchartsProvider, HighchartsChart, YAxis, XAxis, Tooltip, Chart, LineSeries, Series } from 'react-jsx-highcharts';
import useSWR from 'swr';
import { EthAggURL } from '@/lib/urls';
import { EthAggResponse, CountLayer2s, Tps, Stables, Gdp } from '@/types/api/EthAggResponse';
import Highcharts, { theme } from 'highcharts';
import "@/app/highcharts.axis.css";
import { tooltipPositioner } from '@/lib/chartUtils';
import { createTooltipFormatter } from '@/lib/highcharts/tooltipFormatters';
import { BACKEND_SIMULATION_CONFIG } from '../LandingChart';
import { PatternRegistry, initializePatterns } from "@/lib/highcharts/svgPatterns";
import { useLocalStorage } from "usehooks-ts";
// Define the props type for MetricsChartsComponent

const CHART_MARGINS = {
  marginTop: 0,
  marginRight: 42,
  marginBottom: 0,
  marginLeft: 0,
}

interface MetricsChartsProps {
  selectedBreakdownGroup: string;
}

function MetricsChartsComponent({ selectedBreakdownGroup }: MetricsChartsProps) {
  const { data, error, isLoading } = useSWR<EthAggResponse>(EthAggURL);

  const stableData = data ? data.data.stables : null;
  const gdpData = data ? data.data.gdp : null;
  const layer2Data = data ? data.data.count_layer2s : null;
  const tpsData = data ? data.data.tps : null;

  const maxUnix = useMemo(() => {
    if(!stableData || !gdpData || !layer2Data || !tpsData) return null;

    // get the max unix from the daily values of each data
    const stableDataSeries = Object.values(stableData);
    const gdpDataSeries = Object.values(gdpData);
    const layer2DataSeries = layer2Data;
    const tpsDataSeries = Object.values(tpsData);

    const maxUnix = Math.max(
      ...stableDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0)),
      ...gdpDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0)),
      layer2DataSeries.daily.values.reduce((max: number, value: any) => Math.max(max, value[layer2DataSeries.daily.types.indexOf("unix")]), 0),
      ...tpsDataSeries.map(series => series.daily.values.reduce((max: number, value: any) => Math.max(max, value[series.daily.types.indexOf("unix")]), 0))
    );
    return maxUnix;
  }, [stableData, gdpData, layer2Data, tpsData]);




  if (!stableData || !gdpData || !layer2Data || !tpsData || !maxUnix) return;

  return (
    <Container className='flex flex-col gap-y-[60px] mt-[60px] w-full'>
      <EconCharts selectedBreakdownGroup={selectedBreakdownGroup} gdpData={gdpData} stableData={stableData} maxUnix={maxUnix} />
      <ScalingCharts selectedBreakdownGroup={selectedBreakdownGroup} layer2Data={layer2Data} tpsData={tpsData} maxUnix={maxUnix} />
    </Container>
  );
}

const EconCharts = ({ selectedBreakdownGroup, stableData, gdpData, maxUnix }: MetricsChartsProps & { stableData: Stables, gdpData: Gdp, maxUnix: number }) => {
  const [selectedMode, setSelectedMode] = useState("gas_fees_usd_absolute");
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedTimespan, setSelectedTimespan] = useState("max");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [xAxisExtremesGdp, setXAxisExtremesGdp] = useState({
    xMin: gdpData.ethereum_mainnet.daily.values[0][gdpData.ethereum_mainnet.daily.types.indexOf("unix")] < gdpData.layer_2s.daily.values[0][gdpData.layer_2s.daily.types.indexOf("unix")] ? gdpData.ethereum_mainnet.daily.values[0][gdpData.ethereum_mainnet.daily.types.indexOf("unix")] : gdpData.layer_2s.daily.values[0][gdpData.layer_2s.daily.types.indexOf("unix")],
    xMax: gdpData.ethereum_mainnet.daily.values[gdpData.ethereum_mainnet.daily.values.length - 1][gdpData.ethereum_mainnet.daily.types.indexOf("unix")] > gdpData.layer_2s.daily.values[gdpData.layer_2s.daily.values.length - 1][gdpData.layer_2s.daily.types.indexOf("unix")] ? gdpData.ethereum_mainnet.daily.values[gdpData.ethereum_mainnet.daily.values.length - 1][gdpData.ethereum_mainnet.daily.types.indexOf("unix")] : gdpData.layer_2s.daily.values[gdpData.layer_2s.daily.values.length - 1][gdpData.layer_2s.daily.types.indexOf("unix")],
  });

  const [xAxisExtremesStable, setXAxisExtremesStable] = useState({
    xMin: stableData.ethereum_mainnet.daily.values[0][stableData.ethereum_mainnet.daily.types.indexOf("unix")] < stableData.layer_2s.daily.values[0][stableData.layer_2s.daily.types.indexOf("unix")] ? stableData.ethereum_mainnet.daily.values[0][stableData.ethereum_mainnet.daily.types.indexOf("unix")] : stableData.layer_2s.daily.values[0][stableData.layer_2s.daily.types.indexOf("unix")],
    xMax: stableData.ethereum_mainnet.daily.values[stableData.ethereum_mainnet.daily.values.length - 1][stableData.ethereum_mainnet.daily.types.indexOf("unix")] > stableData.layer_2s.daily.values[stableData.layer_2s.daily.values.length - 1][stableData.layer_2s.daily.types.indexOf("unix")] ? stableData.ethereum_mainnet.daily.values[stableData.ethereum_mainnet.daily.values.length - 1][stableData.ethereum_mainnet.daily.types.indexOf("unix")] : stableData.layer_2s.daily.values[stableData.layer_2s.daily.values.length - 1][stableData.layer_2s.daily.types.indexOf("unix")],
  });


  const timespans = useMemo(() => ({

    "1y": {
      label: "1 year",
      shortLabel: "1y",
      value: 365,
      xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    "5y": {
      label: "5 years",
      shortLabel: "5y",
      value: 1825,
      xMin: Date.now() - 1825 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    max: {
      label: "Maximum",
      shortLabel: "Max",
      value: 0,
      xMin: null,
      xMax: Date.now(),
    },
  }), []);

  
  // const GDPChartConfig = {
  //     compositions: {
  //       layer_2s: gdpData.layer_2s.daily.values,
  //       ethereum_mainnet: gdpData.ethereum_mainnet.daily.values,
  //     },
  //     types: ["unix", "usd", "eth"],

  //     compositionTypes: {
  //       layer_2s: {
  //         description: "Layer 2s",
  //         fill: {
  //           type: "gradient",
  //           config: {
  //             type: "linearGradient",
  //             linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
  //             stops: [[0, "#FE5468"], [1, "#FFDF27"]]
  //           }
  //         },
  //         name: "Layer 2s",
  //         order: 1,
  //       },
  //       ethereum_mainnet: {
  //         description: "Ethereum Mainnet",
  //         fill: {
  //           type: "gradient",
  //           config: {
  //             type: "linearGradient",
  //             linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
  //             stops: [[0, "#94ABD3"], [1, "#596780"]]
  //           }
  //         },
  //         name: "Ethereum Mainnet",
  //         order: 0,
  //       }
  //     }
  //   };


      
  // const customTooltipFormatter = useCallback((chartConfig) => createTooltipFormatter({
  //   selectedScale: "absolute",
  //   selectedMetric: "GDP",
  //   theme: "dark",
  //   focusEnabled: true,
  //   compositionTypes: chartConfig.compositionTypes,
  //   enableTotal: true,
  //   weeklyFormat: false,
  // }), []);


  // console.log(GDPChartConfig);

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
    
      const date = new Date(x);
      const isMonthly = false;
      const valuePrefix = showUsd ? '$' : '';
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

      const tooltip = `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
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
        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const nameString = name;




          let prefix = showUsd ? "$" : "Ξ";
          let suffix = series.valueSuffix;
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
              ${Intl.NumberFormat("en-GB", {
              notation: "standard",
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
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
    [showUsd],
  );

  if (selectedBreakdownGroup !== "Metrics") {
    return null;
  }



  return (
    <div className='flex flex-col gap-y-[15px]'>
      <div className='flex gap-x-[8px] items-center'>
        <GTPIcon icon='gtp-metrics-economics' size='lg' className='text-[#5A6462]' />
        <div className='heading-large-lg'>Economic Activity is Shifting Onchain</div>
      </div>
      <div className='pl-[45px] text-md'>Value locked and user spending are growing across the Ethereum ecosystem, with Ethereum Mainnet remaining the most trusted ledger. </div>
      {/* <TopRowContainer>
        <TopRowParent>
          <div></div>
        </TopRowParent>
        <TopRowParent>
          {Object.keys(timespans).map((timespan) => (
            <TopRowChild
              key={timespan}
              isSelected={selectedTimespan === timespan}
              onClick={() => {
                setSelectedTimespan(timespan);
              }}
            >
              <span className="hidden md:block">
                {timespans[timespan].label}
              </span>
              <span className="block md:hidden">
                {timespans[timespan].shortLabel}
              </span>
            </TopRowChild>
          ))}
        </TopRowParent>
      </TopRowContainer> */}
      <div className='flex gap-x-[15px] w-full'>
        <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
          <div className='flex h-[56px] px-[30px] items-start w-full'>
            <div className='flex gap-x-[5px] items-center'>
              <div className='heading-large-md text-nowrap'>Gross Domestic Product</div>
              <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
            </div>
            <div className='flex flex-col h-full items-end pt-[5px] w-full'>
              <div className='flex items-center gap-x-[5px]'>
                <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
                  {showUsd ? "$" : "Ξ"}{Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(gdpData.layer_2s.daily.values[gdpData.layer_2s.daily.values.length - 1][gdpData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")] + gdpData.ethereum_mainnet.daily.values[gdpData.ethereum_mainnet.daily.values.length - 1][gdpData.ethereum_mainnet.daily.types.indexOf(showUsd ? "usd" : "eth")])}
                </div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                  }}>
                </div>
              </div>
              <div className='flex items-center gap-x-[5px]'>
                <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: {Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format((gdpData.layer_2s.daily.values[gdpData.layer_2s.daily.values.length - 1][gdpData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")]) /  (gdpData.layer_2s.daily.values[gdpData.layer_2s.daily.values.length - 1][gdpData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")] + gdpData.ethereum_mainnet.daily.values[gdpData.ethereum_mainnet.daily.values.length - 1][gdpData.ethereum_mainnet.daily.types.indexOf(showUsd ? "usd" : "eth")]) * 100)}%</div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "transparent",
                  }}>
                </div>
              </div>

            </div>
          </div>
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
                type="line"
                height={309}
                plotOptions={{
                  series: {
                    marker: {
                      lineColor: "white",
                      radius: 0,
                      symbol: "circle",
                    },
                  },
                }}
                // marginLeft={-5}
                // // marginRight={0}
                // marginBottom={0}
                // marginRight={40}
                {...CHART_MARGINS}
                spacing={[0, 0, 0, 0]}

              />
              <XAxis
                type="datetime"
                gridLineWidth={0}

                //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                //method for showiing set amount of ticks
                labels={{
                  enabled: false,
                  overflow: "allow",
                  step: 1,
                  x: 10,
                  y: -10,
                  align: "center",
                  distance: 10,
                  style: {
                    color: "#D7DFDE",
                    fontSize: "9px",
                    fontFamily: "Fira Sans",
                  }
                }}
                min={timespans[selectedTimespan].xMin}
                max={maxUnix}
              />
              <YAxis
                gridLineWidth={1}
                tickAmount={4}
                gridLineColor={"#5A6462"}
                lineColor={"#5A6462"}

                labels={{
                  overflow: "allow",
                  x: 8,
                  y: 11,
                  align: "left",
                  distance: 5,
                  style: {
                    color: "#CDD8D3",
                    fontSize: "9px",
                    fontFamily: "Raleway",
                  },
                  useHTML: true,
                  formatter: function () {
                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                  }

                }}
              >
                {Object.entries(gdpData).map(([name, data]) => {
                  const color = name === "layer_2s" ? {
                    linearGradient: {
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 1,
                    },
                    stops: [[0, "#FE5468"], [1, "#FFDF27"]]
                  } : {
                    linearGradient: {
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 1,
                    },
                    stops: [[0, "#94ABD3"], [1, "#596780"]]
                  }
                  return(
                    <Series
                      type="area"
                      name={name === "layer_2s" ? "Layer 2s" : "Ethereum Mainnet"}
                      stacking="normal"
                      marker={{
                        enabled: false,
                      }}
                      color={{
                        linearGradient: {
                          x1: 0,
                          x2: 0,
                          y1: 0,
                          y2: 1,
                        },
                        stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]

                      }}
                      data={data.daily.values.map((value) => [value[data.daily.types.indexOf("unix")], value[data.daily.types.indexOf(showUsd ? "usd" : "eth")]])
                      }
                      key={name + "gdpData"}
                    />
                  )})}
              </YAxis>
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
                positioner={tooltipPositioner}

              />
            </HighchartsChart>
          </HighchartsProvider>

          <div className='absolute bottom-0 left-0 right-0 flex items-center px-[33px]'>
            <div className='w-full h-[22px] bg-[#34424080] flex justify-between items-center rounded-t-[15px] px-[7px]'>
              <div className={`flex items-center  text-xs gap-x-[2px] `}>
                <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                <div className='text-xs'>{new Date(xAxisExtremesGdp.xMin).toLocaleDateString("en-GB", {

                  year: "numeric",
                })}</div>
              </div>
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className={`flex items-center  text-xs gap-x-[2px] ${i < 2 ? "flex-row" : "flex-row-reverse"} `}>
                  <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                  <div className='text-xs'>{new Date(xAxisExtremesGdp.xMin + ((xAxisExtremesGdp.xMax - xAxisExtremesGdp.xMin) / 2) * (i + 1)).toLocaleDateString("en-GB", {

                    year: "numeric",
                  })}</div>
                </div>
              ))}
              <div className={`flex items-center flex-row-reverse text-xs gap-x-[2px] `}>
                <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                <div className='text-xs'>{new Date(xAxisExtremesGdp.xMax).toLocaleDateString("en-GB", {

                  year: "numeric",
                })}</div>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
          <div className='flex h-[56px] px-[30px] items-start w-full'>
            <div className='flex gap-x-[5px] items-center'>
              <div className='heading-large-md text-nowrap'>Stablecoin Supply</div>
              <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
            </div>
            <div className='flex flex-col h-full items-end pt-[5px] w-full'>
              <div className='flex items-center gap-x-[5px]'>
                <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
                  {showUsd ? "$" : "Ξ"}{Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(stableData.layer_2s.daily.values[stableData.layer_2s.daily.values.length - 1][stableData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")] + stableData.ethereum_mainnet.daily.values[stableData.ethereum_mainnet.daily.values.length - 1][stableData.ethereum_mainnet.daily.types.indexOf(showUsd ? "usd" : "eth")])}
                </div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                  }}>
                </div>
              </div>
              <div className='flex items-center gap-x-[5px]'>
                <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: {Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format((stableData.layer_2s.daily.values[stableData.layer_2s.daily.values.length - 1][stableData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")]) /  (stableData.layer_2s.daily.values[stableData.layer_2s.daily.values.length - 1][stableData.layer_2s.daily.types.indexOf(showUsd ? "usd" : "eth")] + stableData.ethereum_mainnet.daily.values[stableData.ethereum_mainnet.daily.values.length - 1][stableData.ethereum_mainnet.daily.types.indexOf(showUsd ? "usd" : "eth")]) * 100)}%</div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "transparent",
                  }}>
                </div>
              </div>

            </div>
          </div>
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
                type="line"
                height={309}
                plotOptions={{
                  series: {
                    stacking: "normal",
                    marker: {
                      lineColor: "white",
                      radius: 0,
                      symbol: "circle",
                    },
                  },
                }}
                // marginLeft={-5}
                // // marginRight={0}
                // marginBottom={0}
                // marginRight={40}
                {...CHART_MARGINS}
                spacing={[0, 0, 0, 0]}
              />
              <XAxis
                type="datetime"
                gridLineWidth={0}
                min={timespans[selectedTimespan].xMin}
                max={maxUnix}

                //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                //method for showiing set amount of ticks
                labels={{
                  enabled: false,
                  overflow: "allow",
                  step: 1,
                  x: 10,
                  y: -10,
                  align: "center",
                  distance: 10,
                  style: {
                    color: "#D7DFDE",
                    fontSize: "9px",
                    fontFamily: "Fira Sans",
                    zIndex: 10
                  }
                }}
              />
              <YAxis
                gridLineWidth={1}
                tickAmount={4}
                gridLineColor={"#5A6462"}
                lineColor={"#5A6462"}
              
                labels={{
                  overflow: "allow",
                  x: 8,
                  y: 11,
                  align: "left",
                  distance: 5,
                  style: {
                    color: "#CDD8D3",
                    fontSize: "9px",
                    fontFamily: "Raleway",
                  },
                  useHTML: true,
                  formatter: function () {

                    
                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                  }

                }}
              >
                {Object.entries(stableData).map(([name, data]) => {

                  return (
                    <Series
                      key={name}
                      type="area"
                      name={name === "layer_2s" ? "Layer 2s" : "Ethereum Mainnet"}
                      stacking="normal"
                      marker={{
                        enabled: false,
                      }}
                      color={{
                        linearGradient: {
                          x1: 0,
                          x2: 0,
                          y1: 0,
                          y2: 1,
                        },
                        stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]

                      }}

                      data={data.daily.values.map((value) => [value[data.daily.types.indexOf("unix")], value[data.daily.types.indexOf(showUsd ? "usd" : "eth")]])}
                    />
                  )
                })}
              </YAxis>
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
                positioner={tooltipPositioner}
                valuePrefix={showUsd ? "$" : ""}
                valueSuffix={showUsd ? "" : " Gwei"}
              />
            </HighchartsChart>
          </HighchartsProvider>

          <div className='absolute bottom-0 left-0 right-0 flex items-center px-[33px]'>

            <div className='w-full h-[22px] flex justify-between items-center px-[7px] bg-[#34424080] rounded-t-[15px]'>
              <div className={`flex items-center  text-xs gap-x-[2px] `}>
                <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                <div className='text-xs'>{new Date(xAxisExtremesGdp.xMin).toLocaleDateString("en-GB", {

                  year: "numeric",
                })}</div>
              </div>
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className={`flex items-center  text-xs gap-x-[2px] ${i < 2 ? "flex-row" : "flex-row-reverse"} `}>
                    <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                    <div className='text-xs'>{new Date(xAxisExtremesGdp.xMin + ((xAxisExtremesGdp.xMax - xAxisExtremesGdp.xMin) / 3) * (i + 1)).toLocaleDateString("en-GB", {

                      year: "numeric",
                    })}</div>
                  </div>
                ))}
                <div className={`flex items-center flex-row-reverse text-xs gap-x-[2px] `}>
                  <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                  <div className='text-xs'>{new Date(xAxisExtremesGdp.xMax).toLocaleDateString("en-GB", {

                    year: "numeric",
                  })}</div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ScalingCharts = ({ selectedBreakdownGroup, layer2Data, tpsData, maxUnix }: MetricsChartsProps & { layer2Data: CountLayer2s, tpsData: Tps, maxUnix: number }) => {
  const [selectedMode, setSelectedMode] = useState("gas_fees_usd_absolute");
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedTimespan, setSelectedTimespan] = useState("max");
  const [showUsd, setShowUsd] = useState(true);

  const [xAxisExtremesL2, setXAxisExtremesL2] = useState({
    xMin: layer2Data.daily.values[0][layer2Data.daily.types.indexOf("unix")],
    xMax: layer2Data.daily.values[layer2Data.daily.values.length - 1][layer2Data.daily.types.indexOf("unix")],
  });

  const [xAxisExtremesTps, setXAxisExtremesTps] = useState({
    xMin: tpsData.layer_2s.daily.values[0][tpsData.layer_2s.daily.types.indexOf("unix")],
    xMax: tpsData.layer_2s.daily.values[tpsData.layer_2s.daily.values.length - 1][tpsData.layer_2s.daily.types.indexOf("unix")],
  });




  const timespans = useMemo(() => ({

    "1y": {
      label: "1 year",
      shortLabel: "1y",
      value: 365,
      xMin: Date.now() - 365 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    "5y": {
      label: "5 years",
      shortLabel: "5y",
      value: 1825,
      xMin: Date.now() - 1825 * 24 * 60 * 60 * 1000,
      xMax: Date.now(),
    },
    max: {
      label: "Maximum",
      shortLabel: "Max",
      value: 0,
      xMin: null,
      xMax: Date.now(),
    },
  }), []);

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      
      const date = new Date(x);
      const isMonthly = false;
      const valuePrefix = showUsd ? '$' : '';
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

      const tooltip = `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
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
        .map((point: any, index: number) => {
          const { series, y, percentage } = point;
          const { name } = series;
          const nameString = name === "total_l2s" ? "Total Layer 2s" : name;
          const seriesIndex = point.point.index;
          const l2names = name === "total_l2s" ? layer2Data.daily.values[seriesIndex][layer2Data.daily.types.indexOf("l2s_launched")] : null;
          
          
       

          let prefix = "";
          let suffix =  "";
          let value = y;
          let displayValue = y;

          return `
          <div>
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color}"></div>
              <div class="tooltip-point-name text-xs">${nameString}</div>
              <div class="flex-1 text-right justify-end flex numbers-xs">
              <div class="flex justify-end text-right w-full">
              <div class="${!prefix && "hidden"}">${prefix}</div>
                ${Intl.NumberFormat("en-GB", {
                  notation: "standard",
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 0,
                }).format(
                  displayValue
                )}
                    
              </div>
                <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
              </div>

            </div>
            <div class="flex flex-col w-full items-center font-medium mb-0.5">
                ${l2names && Array.isArray(l2names) ? l2names.map((l2: any) => {
                  return `
                  <div class="flex w-full items-center font-medium mb-0.5 ml-4">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${series.color}"></div>

                    <div class="tooltip-point-name text-xs">${l2.l2beat_name}</div>

                  </div>
                  `
                }).join("") : ""}
            </div>
            </div>`;
        })
        .join("");

      return tooltip + tooltipPoints + tooltipEnd;
    },
    [showUsd],
  );

  if (selectedBreakdownGroup !== "Metrics") {
    return null;
  }

  return (
    <div className='flex flex-col gap-y-[15px]'>
      <div className='flex gap-x-[8px] items-center'>
        <GTPIcon icon='gtp-ecosystem-scaling' size='lg' className='text-[#5A6462]' />
        <div className='heading-large-lg'>The Ethereum Ecosystem is Scaling</div>
      </div>
      <div className='pl-[45px] text-md'>Transaction throughput is rising across Ethereum Mainnet and its growing number of Layer 2 networks.</div>
      {/* <TopRowContainer>
        <TopRowParent>
          <div></div>
        </TopRowParent>
        <TopRowParent>
          {Object.keys(timespans).map((timespan) => (
            <TopRowChild
              key={timespan}
              isSelected={selectedTimespan === timespan}
              onClick={() => {
                setSelectedTimespan(timespan);
              }}
            >
              <span className="hidden md:block">
                {timespans[timespan].label}
              </span>
              <span className="block md:hidden">
                {timespans[timespan].shortLabel}
              </span>
            </TopRowChild>
          ))}
        </TopRowParent>
      </TopRowContainer> */}
      <div className='flex gap-x-[15px]'>
        <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
          <div className='flex h-[56px] px-[30px] items-start w-full'>
            <div className='flex gap-x-[5px] items-center'>
              <div className='heading-large-md text-nowrap'>Layer 2s Building on Ethereum</div>
              <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
            </div>
            <div className='flex flex-col h-full items-end pt-[5px] w-full'>
              <div className='flex items-center gap-x-[5px]'>
                <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
                  {Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 2,
                  }).format(layer2Data.daily.values[layer2Data.daily.values.length - 1][layer2Data.daily.types.indexOf("value")])}
                </div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                  }}>
                </div>
              </div>
              <div className='flex items-center gap-x-[5px]'>
                {/* <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div> */}
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "transparent",
                  }}>
                </div>
              </div>

            </div>
          </div>
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
                type="line"
                height={309}
                plotOptions={{
                  series: {
                    marker: {
                      lineColor: "white",
                      radius: 0,
                      symbol: "circle",
                    },
                  },
                }}
                // marginLeft={-5}
                // // marginRight={0}
                // marginBottom={0}
                // marginRight={40}
                {...CHART_MARGINS}
              />
              <XAxis
                type="datetime"
                gridLineWidth={0}
                min={timespans[selectedTimespan].xMin}
                max={maxUnix}
                
                //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                //method for showiing set amount of ticks
                labels={{
                  enabled: false,
                  overflow: "allow",
                  step: 1,
                  x: 10,
                  y: -10,
                  align: "center",
                  distance: 10,
                  style: {
                    color: "#D7DFDE",
                    fontSize: "9px",
                    fontFamily: "Fira Sans",
                  }
                }}
              />
              <YAxis
                gridLineWidth={1}
                tickAmount={4}
                gridLineColor={"#5A6462"}
                lineColor={"#5A6462"}

                labels={{
                  
                  overflow: "allow",
                  x: 8,
                  y: 11,
                  align: "left",
                  distance: 5,
                  style: {
                    color: "#CDD8D3",
                    fontSize: "9px",
                    fontFamily: "Raleway",
                  },
                  useHTML: true,
                  formatter: function () {
                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                  }

                }}
              >
                <Series
                  type="column"
                  name="total_l2s"
                  borderRadius={0}
                  borderColor={"transparent"}
                  marker={{
                    enabled: false,
                  }}
                  color={{
                    linearGradient: {
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 1,
                    },
                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]

                  }}
                  data={layer2Data.daily.values.map((value) => [value[layer2Data.daily.types.indexOf("unix")], value[layer2Data.daily.types.indexOf("value")]])
                  }
                />
              </YAxis>
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
                positioner={tooltipPositioner}
                valuePrefix={showUsd ? "$" : ""}
                valueSuffix={showUsd ? "" : " Gwei"}
              />
            </HighchartsChart>
          </HighchartsProvider>

          <div className='absolute bottom-0 left-0 right-0 flex items-center px-[33px]'>
            <div className='w-full h-[22px] flex justify-between items-center bg-[#34424080] rounded-t-[15px] px-[7px]'>
                <div className={`flex items-center  text-xs gap-x-[2px] `}>
                  <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                  <div className='text-xs'>{new Date(xAxisExtremesL2.xMin).toLocaleDateString("en-GB", {

                    year: "numeric",
                  })}</div>
                </div>
                {Array.from({ length: 2 }, (_, i) => {


                return (  
                  <div key={i} className={`flex items-center  text-xs gap-x-[2px] ${i < 2 ? "flex-row" : "flex-row-reverse"} `}>
                    <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                    <div className='text-xs'>{new Date(xAxisExtremesL2.xMin + ((xAxisExtremesL2.xMax - xAxisExtremesL2.xMin) / 3) * (i + 1)).toLocaleDateString("en-GB", {

                      year: "numeric",
                    })}</div>
                  </div>
                )})}
                <div className={`flex items-center flex-row-reverse text-xs gap-x-[2px] `}>
                  <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                  <div className='text-xs'>{new Date(xAxisExtremesL2.xMax).toLocaleDateString("en-GB", {

                    year: "numeric",
                  })}</div>
                </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col relative rounded-[15px] w-full h-[375px] bg-[#1F2726] pt-[15px] overflow-hidden'>
          <div className='flex h-[56px] px-[30px] items-start w-full'>
            <div className='flex gap-x-[5px] items-center'>
              <div className='heading-large-md text-nowrap'>Average Daily TPS</div>
              <GTPIcon icon='gtp-info-monochrome' size='sm' className='' />
            </div>
            <div className='flex flex-col h-full items-end pt-[5px] w-full'>
              <div className='flex items-center gap-x-[5px]'>
                <div className='numbers-3xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
                  {Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 2,
                  }).format(tpsData.layer_2s.daily.values[tpsData.layer_2s.daily.values.length - 1][tpsData.layer_2s.daily.types.indexOf("value")])}
                </div>
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "linear-gradient(to bottom, #10808C, #1DF7EF)",
                  }}>
                </div>
              </div>
              <div className='flex items-center gap-x-[5px]'>
                {/* <div className='text-sm bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>Layer 2 Share: 39%</div> */}
                <div className='w-[16px] h-[16px] rounded-full '
                  style={{
                    background: "transparent",
                  }}>
                </div>
              </div>

            </div>
          </div>
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
                type="line"
                height={309}
                plotOptions={{
                  series: {
                    marker: {
                      lineColor: "white",
                      radius: 0,
                      symbol: "circle",
                    },
                  },
                }}
                // marginLeft={-5}
                // // marginRight={0}
                // marginBottom={0}
                // marginRight={40}
                {...CHART_MARGINS}
              />
              <XAxis
                type="datetime"
                gridLineWidth={0}
                min={timespans[selectedTimespan].xMin}
                max={maxUnix}
                //tickInterval={timespans[selectedTimespan].xMax - timespans[selectedTimespan].xMin / 4}
                //method for showiing set amount of ticks
                labels={{
                  enabled: false,
                  overflow: "allow",
                  step: 1,
                  zIndex: 50,
                  x: 10,
                  y: -10,
                  align: "center",
                  distance: 10,
                  style: {
                    color: "#D7DFDE",
                    fontSize: "9px",
                    fontFamily: "Fira Sans",
                  }
                }}
              />
              <YAxis
                gridLineWidth={1}
                tickAmount={4}
                gridLineColor={"#5A6462"}
                lineColor={"#5A6462"}

                labels={{
                  overflow: "allow",
                  x: 8,
                  y: 11,
                  align: "left",
                  distance: 5,
                  style: {
                    color: "#CDD8D3",
                    fontSize: "9px",
                    fontFamily: "Raleway",
                  },
                  useHTML: true,
                  formatter: function () {
                    return Number(this.value) > 0 ? `<div class="numbers-xxxs">${this.value.toLocaleString()}</div>` : "";
                  }

                }}
              >
                <Series
                  type="area"
                  name="Transactions Per Second"
                  marker={{
                    enabled: false,
                  }}
                  color={{
                    linearGradient: {
                      x1: 0,
                      x2: 0,
                      y1: 0,
                      y2: 1,
                    },
                    stops: [[0, "#10808C"], [0.7, "#10808C"], [0.8, "#158B99"], [0.9, "#1AC4D4"], [1, "#1DF7EF"]]

                  }}
                  data={tpsData.layer_2s.daily.values.map((value) => [value[tpsData.layer_2s.daily.types.indexOf("unix")], value[tpsData.layer_2s.daily.types.indexOf("value")]])
                  }
                />
              </YAxis>
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
                positioner={tooltipPositioner}
                valuePrefix={showUsd ? "$" : ""}
                valueSuffix={showUsd ? "" : " Gwei"}
              />
            </HighchartsChart>
          </HighchartsProvider>

          <div className='absolute bottom-0 left-0 right-0 flex items-center px-[33px]'>
            <div className='w-full h-[22px] flex justify-between items-center bg-[#34424080] rounded-t-[15px] px-[7px]'>
              <div className={`flex items-center  text-xs gap-x-[2px] `}>
                <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                <div className='text-xs'>{new Date(xAxisExtremesTps.xMin).toLocaleDateString("en-GB", {

                  year: "numeric",
                })}</div>
              </div>

              {Array.from({ length: 2 }, (_, i) => {
                return (
                  <div key={i} className={`flex items-center  text-xs gap-x-[2px] ${i < 2 ? "flex-row" : "flex-row-reverse"} `}>
                    <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                    <div className='text-xs'>{new Date(xAxisExtremesTps.xMin + ((xAxisExtremesTps.xMax - xAxisExtremesTps.xMin) / 3) * (i + 1)).toLocaleDateString("en-GB", {

                      year: "numeric",
                    })}</div> 
                  </div>
                )
              })}
              <div className={`flex items-center flex-row-reverse text-xs gap-x-[2px] `}>
                <div className='w-[6px] h-[6px] mt-0.5 bg-[#CDD8D3] rounded-full'></div>
                <div className='text-xs'>{new Date(xAxisExtremesTps.xMax).toLocaleDateString("en-GB", {

                  year: "numeric",
                })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const arePropsEqual = (
  prevProps: Readonly<MetricsChartsProps>,
  nextProps: Readonly<MetricsChartsProps>
) => {
  // This comparison means MetricsChartsComponent will only re-evaluate 
  // its rendering if selectedBreakdownGroup actually changes its value OR 
  // if selectedBreakdownGroup *becomes* or *stops being* "Metrics".

  // If it was not "Metrics" and is now "Metrics", re-render (to mount MetricsCharts properly)
  if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup === "Metrics") {
    return false;
  }
  // If it was "Metrics" and is now not "Metrics", re-render (to unmount/hide MetricsCharts)
  if (prevProps.selectedBreakdownGroup === "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
    return false;
  }

  if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
    return true; // Effectively, don't care about changes if not displaying Metrics.
  }

  return prevProps.selectedBreakdownGroup === nextProps.selectedBreakdownGroup;
};

export default React.memo(MetricsChartsComponent, arePropsEqual);