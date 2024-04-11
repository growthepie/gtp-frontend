"use client";
import { AllChainsByKeys } from '@/lib/chains';
import { formatNumber, tooltipFormatter, tooltipPositioner } from '@/lib/chartUtils';
import Highcharts from 'highcharts/highstock';
import ReactJson from 'react-json-view';
import {
  HighchartsProvider, HighchartsChart, Chart, XAxis, YAxis, Title, Subtitle, Legend, LineSeries, Tooltip, PlotBand, PlotLine, withHighcharts, AreaSeries
} from 'react-jsx-highcharts';
import useSWR from "swr";
import { useTheme } from 'next-themes';
import { use, useCallback, useMemo } from 'react';
import { useLocalStorage, useSessionStorage } from 'usehooks-ts';
import { useUIContext } from '@/contexts/UIContext';
import d3 from "d3";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};


const plotOptions: Highcharts.PlotOptions = {
  column: {
    grouping: false,
    stacking: "normal",
    events: {
      legendItemClick: function () {
        return false;
      },
    },
    groupPadding: 0,
    animation: false,
  },
  series: {
    stacking: undefined,
    events: {
      legendItemClick: function () {
        return false;
      },
    },
    marker: {
      lineColor: "white",
      radius: 0,
      symbol: "circle",
    },
    shadow: false,
    animation: false,
  },
};

type FeesChartProps = {
  selectedMetric: string;
  selectedTimeframe: string;
  selectedChains: string[];
  showGwei: boolean;
};

export default function FeesChart({ selectedMetric, selectedTimeframe, selectedChains, showGwei }: FeesChartProps) {
  const { theme } = useTheme();
  const { isMobile } = useUIContext();
  // const seriesKey = "txcosts_avg";
  const selectedScale: string = "absolute";

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const {
    data,
    error,
    isLoading,
    isValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees/linechart.json");

  const reversePerformer = true;

  const valuePrefix = useMemo(() => {
    if (showUsd) return "$";
    // eth symbol
    return "Ξ";
  }, [showUsd]);

  function shortenNumber(number) {
    let numberStr = Math.floor(number).toString();

    const suffixes = ["", "k", "M", "B"];
    const numberOfDigits = numberStr.length;
    const magnitude = Math.floor((numberOfDigits - 1) / 3);
    const suffixIndex = Math.min(magnitude, suffixes.length - 1);

    const suffix = suffixes[suffixIndex];

    let shortenedNumber;
    if (magnitude > 0) {
      const digitsBeforeDecimal = numberOfDigits % 3 || 3;
      shortenedNumber =
        parseFloat(numberStr.slice(0, digitsBeforeDecimal + 2)) / 100;
      // Remove trailing zeros after the decimal point
      shortenedNumber = shortenedNumber.toFixed(2).replace(/\.?0+$/, "");
    } else {
      shortenedNumber = number.toFixed(2);
    }

    // Concatenate the suffix
    return shortenedNumber.toString() + suffix;
  }

  const formatNumber = useCallback(
    (value: number | string, isAxis = false) => {
      let prefix = valuePrefix;
      let suffix = "";
      let val = parseFloat(value as string);

      if (!showUsd) {
        if (showGwei) {
          prefix = "";
          suffix = " Gwei";
        }
      }

      let number = d3.format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3.format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if (showGwei && showUsd) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3.format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3.format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
          }
        }
      }

      return number;
    },
    [valuePrefix, showUsd, selectedScale, showGwei],
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      let dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // check if data steps are less than 1 day
      // if so, add the time to the tooltip
      const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      if (timeDiff < 1000 * 60 * 60 * 24) {
        dateString += " " + date.toLocaleTimeString(undefined, {
          timeZone: "UTC",
          hour: "numeric",
          minute: "2-digit",
        });
      }

      const tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;
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
        .sort((a: any, b: any) => {
          if (reversePerformer) return a.y - b.y;

          return b.y - a.y;
        })
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
              }"></div>
                <div class="tooltip-point-name">${AllChainsByKeys[name].label
              }</div>
                <div class="flex-1 text-right font-inter">${Highcharts.numberFormat(
                percentage,
                2,
              )}%</div>
              </div>
              
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
    
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="
                  width: ${(percentage / maxPercentage) * 100}%;
                  background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]};
                "></div>
              </div>`;

          let prefix = valuePrefix;
          let suffix = "";
          let value = y;
          let displayValue = y;

          if (!showUsd) {
            if (showGwei) {
              prefix = "";
              suffix = " Gwei";
              displayValue = y * 1e9;
            }
          }

          return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]
            }"></div>
            <div class="tooltip-point-name text-md">${AllChainsByKeys[name].label
            }</div>
            <div class="flex-1 text-right justify-end font-inter flex">
                <div class="opacity-70 mr-0.5 ${!prefix && "hidden"
            }">${prefix}</div>
                ${selectedMetric === "fdv" || selectedMetric === "market_cap"
              ? shortenNumber(displayValue).toString()
              : parseFloat(displayValue).toLocaleString(undefined, {
                minimumFractionDigits: valuePrefix ? 2 : 0,
                maximumFractionDigits: valuePrefix
                  ? selectedMetric === "txcosts"
                    ? 3
                    : 2
                  : 0,
              })
            }
                <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
            }">${suffix}</div>
            </div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>

            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="
              width: ${(Math.max(0, value) / maxPoint) * 100}%;
              background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]};
            "></div>
          </div>`;
        })
        .join("");

      let prefix = valuePrefix;
      let suffix = "";
      let value = pointsSum;

      const sumRow =
        selectedScale === "stacked"
          ? `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">

              <div class="opacity-70 mr-0.5 ${!prefix && "hidden"}">${prefix}</div>
              ${parseFloat(value).toLocaleString(undefined, {
            minimumFractionDigits: valuePrefix ? 2 : 0,
            maximumFractionDigits: valuePrefix ? 2 : 0,
          })}
              <div class="opacity-70 ml-0.5 ${!suffix && "hidden"
          }">${suffix}</div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
        </div>`
          : "";

      return tooltip + tooltipPoints + sumRow + tooltipEnd;
    },
    [valuePrefix, reversePerformer, theme, showUsd, selectedMetric, showGwei],
  );

  const tooltipPositioner =
    useCallback<Highcharts.TooltipPositionerCallbackFunction>(
      function (this, width, height, point) {
        const chart = this.chart;
        const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
        const tooltipWidth = width;
        const tooltipHeight = height;

        const distance = 40;
        const pointX = point.plotX + plotLeft;
        const pointY = point.plotY + plotTop;
        let tooltipX =
          pointX - distance - tooltipWidth < plotLeft
            ? pointX + distance
            : pointX - tooltipWidth - distance;

        const tooltipY =
          pointY - tooltipHeight / 2 < plotTop
            ? pointY + distance
            : pointY - tooltipHeight / 2;

        if (isMobile) {
          if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
            tooltipX = plotLeft + plotWidth - tooltipWidth;
          }
          return {
            x: tooltipX,
            y: -100,
          };
        }

        return {
          x: tooltipX,
          y: tooltipY - 200,
        };
      },
      [isMobile],
    );

  const dataIndex = useMemo(() => {
    if (!data) return;

    // array of strings of the types of data available for the selected series
    const types = data.chain_data["optimism"][selectedMetric][selectedTimeframe].types;

    if (types.includes("value_usd")) {
      return showUsd ? types.indexOf("value_usd") : types.indexOf("value_eth");
    } else {
      return 1;
    }
  }, [data, selectedMetric, selectedTimeframe, showUsd]);


  const positioner = useCallback(function (this, width, height, point) {
    const chart = this.chart;
    const plotLeft = chart.plotLeft;
    const plotTop = chart.plotTop;
    const plotWidth = chart.plotWidth;
    const plotHeight = chart.plotHeight;
    const pointX = point.plotX;

    let x = 0;
    let y = 0;

    x = pointX + (pointX < plotWidth / 2 ? 30 : -260)

    if (point.plotY + height > plotHeight) {
      y = plotTop + plotHeight - height;
    } else {
      y = point.plotY + plotTop;
    }

    return { x: x, y: y };
  }, []);


  const zIndexByChainKey = useMemo(() => {
    if (!data) return Object.keys(selectedChains).reduce((acc, chainKey) => {
      acc[chainKey] = 0;
      return acc;
    }, {});

    // get the latest value for each chain
    const latestValues = Object.keys(data.chain_data).reduce((acc, chainKey) => {
      const chainData = data.chain_data[chainKey][selectedMetric][selectedTimeframe].data;
      if (chainData.length > 0) {
        acc[chainKey] = chainData[chainData.length - 1][dataIndex];
      }
      return acc;
    }, {});

    // sort the chains by their latest value
    const sortedChains = Object.keys(latestValues).sort((a, b) => latestValues[b] - latestValues[a]);

    return sortedChains.reduce((acc, chainKey, index) => {
      acc[chainKey] = index + 1;
      return acc;
    }, {});



  }, [data, selectedTimeframe, selectedChains, selectedMetric, dataIndex]);

  return (
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart plotOptions={plotOptions} containerProps={{ style: { height: "100%", width: "100%" } }} >
        <Chart
          backgroundColor={"transparent"}
          type='line'
          panning={{
            enabled: true,
          }}
          panKey='shift'
          zooming={{
            type: undefined,
          }}
          style={{
            borderRadius: 15,
          }}
          animation={{
            duration: 50,
          }}
          marginBottom={1}
          marginLeft={0}
          marginRight={0}
          marginTop={0}
        // paddingTop={0}
        // paddingBottom={0}
        // spacing={[0, 0, 0, 0]}

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
            color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41, 51, 50)"
          }}

          formatter={tooltipFormatter}
          // ensure tooltip is always above the chart
          positioner={tooltipPositioner}
          valuePrefix={showUsd ? "$" : ""}
          valueSuffix={showUsd ? "" : " Gwei"}
        />
        <XAxis
          title={undefined}
          type="datetime"
          maxPadding={0}
          minPadding={0}
          labels={{
            useHTML: true,
            style: {
              color: COLORS.LABEL,
              fontSize: "10px",
              fontFamily: "var(--font-raleway), sans-serif",
              zIndex: 1000,
            },
            enabled: true,
            // formatter: (item) => {
            //   const date = new Date(item.value);
            //   const isMonthStart = date.getDate() === 1;
            //   const isYearStart = isMonthStart && date.getMonth() === 0;
            //   if (isYearStart) {
            //     return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
            //   } else {
            //     return `<span style="">${date.toLocaleDateString(undefined, {
            //       month: "short",
            //     })}</span>`;
            //   }
            // },
          }}
          crosshair={{
            width: 0.5,
            color: COLORS.PLOT_LINE,
            snap: false,
          }}
          tickmarkPlacement='on'
          tickWidth={1}
          tickLength={20}
          ordinal={false}
          minorTicks={false}
          minorTickLength={2}
          minorTickWidth={2}
          minorGridLineWidth={0}
          minorTickInterval={1000 * 60 * 60 * 24 * 7}
        >
          {/* <XAxis.Title>Time</XAxis.Title> */}

        </XAxis>
        <YAxis
          opposite={false}
          showFirstLabel={true}
          showLastLabel={true}
          type="linear"
          gridLineWidth={1}
          gridLineColor={theme === "dark"
            ? "#5A6462"
            : "#5A6462"
          }
          labels={{
            align: "left",
            y: 15,
            x: 5,
            style: {
              gridLineColor:
                theme === "dark"
                  ? "#5A6462"
                  : "#5A6462",
              fontSize: "10px",
              color: "#5A6462",
            },
            formatter: function (t: Highcharts.AxisLabelsFormatterContextObject) {
              return formatNumber(t.value, true);
            },
          }}
          min={0}

        >
          {data && Object.keys(data.chain_data).filter((chainKey) => selectedChains.includes(chainKey)).map((chainKey) => {
            if (data.chain_data[chainKey][selectedMetric][selectedTimeframe])
              return (
                <LineSeries
                  key={`${chainKey}-${selectedMetric}-${selectedTimeframe}`}
                  zIndex={zIndexByChainKey[chainKey] ?? 0}
                  name={chainKey}
                  data={data.chain_data[chainKey][selectedMetric][selectedTimeframe].data.map((d: any) => [d[0], d[dataIndex]])}
                  color={AllChainsByKeys[chainKey].colors["dark"][0]}
                  fillColor={"transparent"}
                  fillOpacity={1}
                  borderColor={AllChainsByKeys[chainKey].colors["dark"][0]}
                  borderWidth={1}
                  lineWidth={2}
                  clip={true}
                  shadow={{
                    color:
                      AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][1] +
                      "66",
                    width: 6,
                  }}
                  states={{
                    hover: {
                      enabled: true,
                      halo: {
                        size: 5,
                        opacity: 1,
                        attributes: {
                          fill:
                            AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0] +
                            "99",
                          stroke:
                            AllChainsByKeys[chainKey]?.colors[theme ?? "dark"][0] +
                            "66",
                          strokeWidth: 0,
                        },
                      },
                      brightness: 0.3,
                    },
                    inactive: {
                      enabled: true,
                      opacity: 0.6,
                    },
                  }}
                // marker={{
                //   lineColor: "white",
                //   radius: 0,
                //   symbol: "circle",
                // }}
                />)
          })}
        </YAxis>
      </HighchartsChart>
    </HighchartsProvider>
  );

}