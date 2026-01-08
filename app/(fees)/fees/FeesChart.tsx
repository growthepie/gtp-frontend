import {
  formatNumber,
  tooltipFormatter,
  tooltipPositioner,
} from "@/lib/chartUtils";
import Highcharts from "highcharts/highstock";
import ReactJson from "react-json-view";
import {
  HighchartsProvider,
  HighchartsChart,
  Chart,
  XAxis,
  YAxis,
  Title,
  Subtitle,
  Legend,
  LineSeries,
  Tooltip,
  PlotBand,
  PlotLine,
  withHighcharts,
  AreaSeries,
} from "react-jsx-highcharts";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { use, useCallback, useMemo } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useHighchartsWrappers, useUIContext } from "@/contexts/UIContext";
import { format as d3Format } from "d3";
import { FeesLineChart } from "@/types/api/Fees/LineChart";
import { MasterResponse } from "@/types/api/MasterResponse";
import "../../highcharts.axis.css";
import { useMaster } from "@/contexts/MasterContext";
import moment from "moment";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

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
  showCents: boolean;
  chartWidth: number;
  master: MasterResponse;
};

export default function FeesChart({
  selectedMetric,
  selectedTimeframe,
  selectedChains,
  showGwei,
  showCents,
  chartWidth,
  master,
}: FeesChartProps) {
  const { theme } = useTheme();
  useHighchartsWrappers();
  const { AllChainsByKeys } = useMaster();
  const isMobile = useUIContext((state) => state.isMobile);
  // const seriesKey = "txcosts_avg";
  const selectedScale: string = "absolute";

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const { data, error, isLoading, isValidating } = useSWR<FeesLineChart>(
    "https://api.growthepie.com/v1/fees/linechart.json",
  );

  const reversePerformer = useMemo(() => {
    if (master.fee_metrics[selectedMetric].invert_normalization) return false;
    return true;
  }, [selectedMetric]);

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
      let unitKey = "";
      if (master.fee_metrics[selectedMetric].currency) {
        unitKey = showUsd ? "usd" : "eth";
      } else {
        unitKey = "value";
      }

      let prefix = master.fee_metrics[selectedMetric].units[unitKey].prefix
        ? " " + master.fee_metrics[selectedMetric].units[unitKey].prefix
        : "";
      let suffix = master.fee_metrics[selectedMetric].units[unitKey].suffix
        ? " " + master.fee_metrics[selectedMetric].units[unitKey].suffix
        : "";
      let multiplier = 1;

      let decimals =
        unitKey === "eth" && showGwei
          ? 2
          : master.fee_metrics[selectedMetric].units[unitKey]
            ? master.fee_metrics[selectedMetric].units[unitKey].decimals
            : 2;

      if (master.fee_metrics[selectedMetric].currency && showUsd && showCents) {
        decimals = master.fee_metrics[selectedMetric].units["usd"].decimals - 2;
      }

      if (master.fee_metrics[selectedMetric].currency) {
        if (!showUsd) {
          if (showGwei) {
            prefix = "";
            suffix = " gwei";
            multiplier = 1e9;
          }
        } else {
          if (showCents) {
            prefix = "";
            suffix = " cents";
            multiplier = 100;
          }
        }
      }

      let val = parseFloat(value as string) * multiplier;

      let number = d3Format(`.2~s`)(val).replace(/G/, "B");

      if (isAxis) {
        if (selectedScale === "percentage") {
          number = d3Format(".2~s")(val).replace(/G/, "B") + "%";
        } else {
          if ((showGwei && !showUsd) || (showCents && showUsd)) {
            // for small USD amounts, show 2 decimals
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
            else if (val < 10)
              number =
                prefix + d3Format(".3s")(val).replace(/G/, "B") + suffix;
            else if (val < 100)
              number =
                prefix + d3Format(".4s")(val).replace(/G/, "B") + suffix;
            else
              number =
                prefix + d3Format(".2s")(val).replace(/G/, "B") + suffix;
          } else {
            number = prefix + d3Format(".2s")(val).replace(/G/, "B") + suffix;
            if (val < 1) number = prefix + val.toFixed(2) + suffix;
          }
        }
      }

      return number;
    },
    [master.fee_metrics, selectedMetric, showUsd, showGwei, showCents],
  );

  const tooltipFormatter = useCallback(
    function (this: any) {
      const { x, points } = this;
      const date = new Date(x);
      
      // Sort points first
      points.sort((a: any, b: any) => {
        if (reversePerformer) return a.y - b.y;
        return b.y - a.y;
      });
  
      const showOthers = points.length > 10;
      
      // Use moment format like the good example
      let dateString = moment.utc(x).utc().locale("en-GB").format("DD MMM YYYY");
  
      // check if data steps are less than 1 day
      const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
      if (timeDiff < 1000 * 60 * 60 * 24) {
        dateString += " " + moment.utc(x).utc().format("HH:mm");
      }
  
      // Match the header structure from the good example
      const tooltip = `<div class="mt-3 mr-3 mb-3 min-w-[220px] md:min-w-[250px] text-xs font-raleway">
        <div class="flex justify-between items-center font-bold text-[13px] md:text-[1rem] ml-6 mb-2 gap-x-[15px]">
          <div>${dateString}</div>
          <div class="text-xs">${master.fee_metrics[selectedMetric].name}</div>
        </div>`;
      const tooltipEnd = `</div>`;
  
      let pointsSum = points.reduce((acc: number, point: any) => {
        acc += point.y;
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
  
      const firstTenPoints = points.slice(0, 10);
      const afterTenPoints = points.slice(10);
  
      const tooltipPoints = (showOthers ? firstTenPoints : points)
        .map((point: any) => {
          const { series, y, percentage } = point;
          const { name } = series;
          if (!data) return;
  
          if (selectedScale === "percentage")
            return `
              <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
                <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]}"></div>
                <div class="tooltip-point-name text-xs">${AllChainsByKeys[name].label}</div>
                <div class="flex-1 text-right numbers-xs">${percentage.toFixed(2)}%</div>
              </div>
              <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
                <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
                style="width: ${(percentage / maxPercentage) * 100}%; background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]}99;"></div>
              </div>`;
              
          let valueIndex = 1;
          if (master.fee_metrics[selectedMetric].currency === true) {
            valueIndex = showUsd ? 2 : 1;
          }
          const typeString =
            data.chain_data[name][selectedMetric][selectedTimeframe].types[valueIndex];
          const unitKey = typeString.replace("value_", "");
  
          let decimals = master.fee_metrics[selectedMetric].currency
            ? showGwei && !showUsd
              ? 2
              : master.fee_metrics[selectedMetric].units[unitKey].decimals
            : master.fee_metrics[selectedMetric].units[unitKey].decimals;
  
          if (master.fee_metrics[selectedMetric].currency && showUsd && showCents) {
            decimals = master.fee_metrics[selectedMetric].units["usd"].decimals - 2;
          }
  
          let prefix = master.fee_metrics[selectedMetric].units[unitKey].prefix || "";
          let suffix = master.fee_metrics[selectedMetric].units[unitKey].suffix || "";
          let value = y;
          let displayValue = y;
  
          if (master.fee_metrics[selectedMetric].currency) {
            if (!showUsd) {
              if (showGwei) {
                prefix = "";
                suffix = " gwei";
                displayValue = y * 1e9;
              }
            } else {
              if (showCents) {
                prefix = "";
                suffix = " cents";
                displayValue = y * 100;
                if (displayValue < 0.1) {
                  displayValue = 0.1;
                  prefix = "< " + prefix;
                }
              } else if (displayValue < 0.001) {
                displayValue = 0.001;
                prefix = "< " + prefix;
              }
            }
          } else {
            displayValue = y;
          }
  
          return `
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]}"></div>
              <div class="tooltip-point-name text-xs">${AllChainsByKeys[name].label}</div>
              <div class="flex-1 text-right justify-end numbers-xs flex">
                <div class="${!prefix && "hidden"}">${prefix}</div>
                ${selectedMetric === "fdv" || selectedMetric === "market_cap"
                  ? shortenNumber(displayValue).toString()
                  : parseFloat(displayValue).toLocaleString("en-GB", {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })
                }
                <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
              </div>
            </div>
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
              style="width: ${(Math.max(0, value) / maxPoint) * 100}%; background-color: ${AllChainsByKeys[name].colors[theme ?? "dark"][0]}99;"></div>
            </div>`;
        })
        .join("");
  
      // Add "Others" row if there are more than 10 points
      let othersRow = "";
      if (showOthers && afterTenPoints.length > 0) {
        const restSum = afterTenPoints.reduce((acc: number, point: any) => acc + point.y, 0);
        const restPercentage = afterTenPoints.reduce((acc: number, point: any) => acc + point.percentage, 0);
  
        if (selectedScale === "percentage") {
          othersRow = `
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
              <div class="tooltip-point-name text-xs">${afterTenPoints.length > 1 ? `${afterTenPoints.length} Others` : "1 Other"}</div>
              <div class="flex-1 text-right numbers-xs">${restPercentage.toFixed(2)}%</div>
            </div>
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
              style="width: ${(restPercentage / maxPercentage) * 100}%; background-color: #E0E7E699;"></div>
            </div>`;
        } else {
          // Get the same unit formatting as the points above
          let valueIndex = 1;
          if (master.fee_metrics[selectedMetric].currency === true) {
            valueIndex = showUsd ? 2 : 1;
          }
          const firstPointName = afterTenPoints[0].series.name;
          const typeString = data?.chain_data[firstPointName][selectedMetric][selectedTimeframe].types[valueIndex];
          const unitKey = typeString.replace("value_", "");
  
          let decimals = master.fee_metrics[selectedMetric].currency
            ? showGwei && !showUsd
              ? 2
              : master.fee_metrics[selectedMetric].units[unitKey].decimals
            : master.fee_metrics[selectedMetric].units[unitKey].decimals;
  
          if (master.fee_metrics[selectedMetric].currency && showUsd && showCents) {
            decimals = master.fee_metrics[selectedMetric].units["usd"].decimals - 2;
          }
  
          let prefix = master.fee_metrics[selectedMetric].units[unitKey].prefix || "";
          let suffix = master.fee_metrics[selectedMetric].units[unitKey].suffix || "";
  
          if (master.fee_metrics[selectedMetric].currency) {
            if (!showUsd && showGwei) {
              prefix = "";
              suffix = " gwei";
            } else if (showUsd && showCents) {
              prefix = "";
              suffix = " cents";
            }
          }
  
          // Calculate display values
          let displayRestSum = restSum;
          let displayRestRange = afterTenPoints[afterTenPoints.length - 1].y;
  
          if (master.fee_metrics[selectedMetric].currency) {
            if (!showUsd && showGwei) {
              displayRestSum = restSum * 1e9;
              displayRestRange = displayRestRange * 1e9;
            } else if (showUsd && showCents) {
              displayRestSum = restSum * 100;
              displayRestRange = displayRestRange * 100;
            }
          }
  
          const formattedSum = selectedMetric === "fdv" || selectedMetric === "market_cap"
            ? shortenNumber(displayRestSum)
            : displayRestSum.toLocaleString("en-GB", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              });
  
          const formattedRange = displayRestRange.toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
  
          const restText = reversePerformer === true ? formattedRange : formattedSum;
          const showBar = reversePerformer === true ? false : true;
  
          othersRow = `
            <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full" style="background-color: #E0E7E6"></div>
              <div class="tooltip-point-name text-xs">${afterTenPoints.length > 1 ? `${afterTenPoints.length} Others` : "1 Other"}</div>
              <div class="flex-1 text-right justify-end numbers-xs flex">
                ${reversePerformer === true ? "<div class='opacity-70 pr-1'>up to</div>" : ""}
                <div class="${!prefix && "hidden"}">${prefix}</div>
                ${restText}
                <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
              </div>
            </div>
            ${showBar ? `
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
              <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
              style="width: ${(restSum / maxPoint) * 100}%; background-color: #E0E7E699;"></div>
            </div>` : ""}
          `;
        }
      }
  
      let prefix = valuePrefix || "";
      let suffix = "";
      let value = pointsSum;
  
      const sumRow =
        selectedScale === "stacked"
          ? `
            <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5">
              <div class="w-4 h-1.5 rounded-r-full"></div>
              <div class="tooltip-point-name text-xs">Total</div>
              <div class="flex-1 text-right justify-end numbers-xs flex">
                <div class="${!prefix && "hidden"}">${prefix}</div>
                ${parseFloat(value).toLocaleString("en-GB", {
                  minimumFractionDigits: valuePrefix ? 2 : 0,
                  maximumFractionDigits: valuePrefix ? 2 : 0,
                })}
                <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
              </div>
            </div>
            <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
              <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
            </div>`
          : "";
  
      const tooltipTop = `<div class="rounded-[15px] bg-color-bg-default shadow-standard pl-[0px] pr-[5px] py-[5px] text-color-text-primary">`
      const tooltipBody = tooltip + tooltipPoints + othersRow + sumRow + tooltipEnd;
      const tooltipBottom = `</div>`
  
      return tooltipTop + tooltipBody + tooltipBottom;
    },
    [
      valuePrefix,
      reversePerformer,
      theme,
      showUsd,
      selectedMetric,
      showGwei,
      showCents,
      master,
      selectedScale,
      data,
      selectedTimeframe,
    ],
  );

  const tooltipPositioner =
  useCallback<Highcharts.TooltipPositionerCallbackFunction>(
    function (this, width, height, point) {
      const chart = this.chart;
      const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
      const tooltipWidth = width;
      const tooltipHeight = height;

      const distance = 20;
      const pointX = point.plotX + plotLeft;
      const pointY = point.plotY + plotTop;

      if (isMobile) {
        // Position tooltip above the chart on mobile
        let tooltipX = pointX - tooltipWidth / 2;
        
        // Keep tooltip within chart bounds horizontally
        if (tooltipX < plotLeft) {
          tooltipX = plotLeft;
        } else if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
          tooltipX = plotLeft + plotWidth - tooltipWidth;
        }

        return {
          x: tooltipX,
          y: -tooltipHeight - 10, // Position above chart with 10px gap
        };
      }

      // Desktop positioning - tooltip to the left or right of point
      let tooltipX =
        pointX - distance - tooltipWidth < plotLeft
          ? pointX + distance
          : pointX - tooltipWidth - distance;

      // Vertically center on the point, but keep within plot area
      let tooltipY = pointY - tooltipHeight / 2;
      
      if (tooltipY < plotTop) {
        tooltipY = pointY + distance;
      } else if (tooltipY + tooltipHeight > plotTop + plotHeight) {
        tooltipY = plotTop + plotHeight - tooltipHeight - distance;
      }

      return {
        x: tooltipX,
        y: tooltipY,
      };
    },
    [isMobile],
  );

  const dataIndex = useMemo(() => {
    if (!data) return;

    // array of strings of the types of data available for the selected series
    const types =
      data.chain_data["optimism"][selectedMetric][selectedTimeframe].types;

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

    x = pointX + (pointX < plotWidth / 2 ? 30 : -260);

    if (point.plotY + height > plotHeight) {
      y = plotTop + plotHeight - height;
    } else {
      y = point.plotY + plotTop;
    }

    return { x: x, y: y };
  }, []);

  const zIndexByChainKey = useMemo(() => {
    if (!data)
      return Object.keys(selectedChains).reduce((acc, chainKey) => {
        acc[chainKey] = 0;
        return acc;
      }, {});

    // get the latest value for each chain
    const latestValues = Object.keys(data.chain_data).reduce(
      (acc, chainKey) => {
        const chainData =
          data.chain_data[chainKey][selectedMetric][selectedTimeframe].data;
        if (chainData.length > 0) {
          acc[chainKey] = chainData[chainData.length - 1][dataIndex];
        }
        return acc;
      },
      {},
    );

    // sort the chains by their latest value
    const sortedChains = Object.keys(latestValues).sort(
      (a, b) => latestValues[b] - latestValues[a],
    );

    return sortedChains.reduce((acc, chainKey, index) => {
      acc[chainKey] = index + 1;
      return acc;
    }, {});
  }, [data, selectedTimeframe, selectedChains, selectedMetric, dataIndex]);

  const [containerRef, { width: containerWidth, height: containerHeight }] = useElementSizeObserver<HTMLDivElement>();

  return (
    <div ref={containerRef} className="relative w-full h-full">
    <HighchartsProvider Highcharts={Highcharts}>
      <HighchartsChart
        plotOptions={plotOptions}
      >
        <Chart
          height={containerHeight}
          backgroundColor={"transparent"}
          type="line"
          panning={{
            enabled: true,
          }}
          panKey="shift"
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
          backgroundColor={"transparent"}
          padding={0}
          hideDelay={300}
          stickOnContact={true}
          shape="rect"
          outside={true}
          formatter={tooltipFormatter}
          // ensure tooltip is always above the chart
          positioner={tooltipPositioner}
          valuePrefix={showUsd ? "$" : ""}
          valueSuffix={showUsd ? "" : " Gwei"}
        />
        <XAxis
          title={undefined}
          type="datetime"
          maxPadding={chartWidth ? 15 / chartWidth : 0}
          minPadding={chartWidth ? 15 / chartWidth : 0}
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
            //     return `<span style="">${date.toLocaleDateString("en-GB", {
            //       month: "short",
            //     })}</span>`;
            //   }
            // },
          }}
          crosshair={{
            width: 0.5,
            color: COLORS.PLOT_LINE,
            snap: true,
          }}
          tickmarkPlacement="on"
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
          // showFirstLabel={true}
          // showLastLabel={true}
          type="linear"
          gridLineWidth={1}
          gridLineColor={theme === "dark" ? "#5A64624D" : "#5A64624D"}
          showFirstLabel={false}
          showLastLabel={false}
          labels={{
            align: "left",
            y: 11,
            x: 3,
            style: {
              color: "rgb(215, 223, 222)",
              fontSize: "10px",
              fontWeight: "700",
              fontFamily: "Fira Sans",
            },
            formatter: function (
              t: Highcharts.AxisLabelsFormatterContextObject,
            ) {
              return formatNumber(t.value, true);
            },
          }}
          // min={-1}
        >
          {data &&
            Object.keys(data.chain_data)
              .filter((chainKey) => selectedChains.includes(chainKey))
              .map((chainKey) => {
                if (
                  data.chain_data[chainKey][selectedMetric][selectedTimeframe]
                )
                  return (
                    <LineSeries
                      key={`${chainKey}-${selectedMetric}-${selectedTimeframe}`}
                      zIndex={zIndexByChainKey[chainKey] ?? 0}
                      name={chainKey}
                      data={data.chain_data[chainKey][selectedMetric][
                        selectedTimeframe
                      ].data.map((d: any) => [d[0], d[dataIndex]])}
                      color={AllChainsByKeys[chainKey].colors["dark"][0]}
                      fillColor={"transparent"}
                      fillOpacity={1}
                      borderColor={AllChainsByKeys[chainKey].colors["dark"][0]}
                      borderWidth={1}
                      lineWidth={2}
                      clip={true}
                      shadow={{
                        color:
                          AllChainsByKeys[chainKey]?.colors[
                          theme ?? "dark"
                          ][1] + "66",
                        width: 9,
                      }}
                      states={{
                        hover: {
                          enabled: true,
                          halo: {
                            size: 5,
                            opacity: 1,
                            attributes: {
                              fill:
                                AllChainsByKeys[chainKey]?.colors[
                                theme ?? "dark"
                                ][0] + "99",
                              stroke:
                                AllChainsByKeys[chainKey]?.colors[
                                theme ?? "dark"
                                ][0] + "66",
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
                    />
                  );
              })}
        </YAxis>
      </HighchartsChart>
      {chartWidth}
    </HighchartsProvider>
    </div>
  );
}
