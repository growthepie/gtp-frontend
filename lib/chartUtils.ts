import * as d3 from "d3";
import { AllChainsByKeys } from "./chains";
import Highcharts from "highcharts";

export const ChartColors = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export const decimalToPercent = (decimal: number | string, decimals = 2) => {
  return `${parseFloat(decimal as string).toFixed(decimals)}%`;
};

export const tooltipFormatter = (
  shared = true,
  percentage = true,
  valueFormatter: null | ((value: any) => string) = (value) => value,
  dataKey?: string,
  reversePerformer?: boolean,
  stacked = false,
  showTime?: boolean,
) => {
  const percentageFormatter = function (
    this: Highcharts.TooltipFormatterContextObject,
  ) {
    // shared tooltip
    const { points } = this;

    if (!points || points.length < 1) {
      return "";
    }
    const { x } = points[0];

    const date = x ? new Date(x) : new Date();
    const dateString = date.toLocaleDateString("en-GB", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;

    let pointsSum = points.reduce((acc: number, point: any) => {
      acc += point.y ? point.y : point.percentage;
      return acc;
    }, 0);

    let maxPercentage = points.reduce((acc: number, point: any) => {
      if (point.percentage > acc) {
        acc = point.percentage;
      }
      return acc;
    }, 0);

    points
      .sort((a: any, b: any) => {
        if (reversePerformer) return a.y - b.y;

        return b.y - a.y;
      })
      .forEach((point: any) => {
        const { y, color, series, percentage } = point;
        const name = series.name;
        const label = series.options.custom?.tooltipLabel
          ? series.options.custom.tooltipLabel
          : AllChainsByKeys[name].label;
        const fillOpacity = series.options.fillOpacity;

        const date = x ? new Date(x) : new Date();
        const dateString = date.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        let value = y ? formatNumber(y, false, true) : percentage;
        // let value = y;

        if (valueFormatter) {
          value = valueFormatter(value);
        } else {
          value = Highcharts.numberFormat(percentage, 2) + "%";
        }

        tooltip += `
        <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
        <div class="relative w-4 h-1.5 rounded-r-full bg-white dark:bg-forest-1000">

          <div class="absolute w-4 h-1.5 rounded-r-full" style="
            background-color: ${AllChainsByKeys[name].colors["dark"][0]};
            opacity: ${fillOpacity};
          ">
          </div>
        
        </div>
        <div class="tooltip-point-name">${label}</div>
        <div class="flex-1 text-right font-inter">${value}</div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white dark:bg-forest-1000" style="
          width: ${(percentage / maxPercentage) * 100}%;
        ">
        </div>

        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" style="
          width: ${(percentage / maxPercentage) * 100}%;
          background-color: ${AllChainsByKeys[name].colors["dark"][0]};
          opacity: ${fillOpacity};
        ">
        </div>
      </div>`;
      });

    // // if (stacked) {
    // let value = formatNumber(pointsSum, false, true);

    // if (valueFormatter) {
    //   value = valueFormatter(value);
    // }

    // tooltip += `
    //       <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
    //         <div class="w-4 h-1.5 rounded-r-full" style=""></div>
    //         <div class="tooltip-point-name text-md">Total</div>
    //         <div class="flex-1 text-right justify-end font-inter flex">
    //             ${pointsSum}
    //         </div>
    //       </div>
    //       <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
    //         <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
    //       </div>`;
    // // }

    tooltip += `
        </div>
      </div>`;
    return tooltip;
  };

  const normalFormatter = function (
    this: Highcharts.TooltipFormatterContextObject,
  ) {
    // shared tooltip
    const { points } = this;
    if (!points || points.length < 1) {
      return "";
    }
    const { x } = points[0];

    const date = x ? new Date(x) : new Date();
    const dateString = showTime
      ? date.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })
      : date.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    let prefix = "";
    let suffix = "";

    if (dataKey) {
      if (dataKey.includes("eth")) {
        suffix = "Ξ";
      } else if (dataKey.includes("usd")) {
        prefix = "$";
      }
    }

    let pointsSum = points.reduce((acc: number, point: any) => {
      acc += point.y;
      return acc;
    }, 0);

    let maxPoint = points.reduce((acc: number, point: any) => {
      if (point.y > acc) {
        acc = point.y;
      }
      return acc;
    }, 0);

    let tooltip = `<div class="mt-3 mr-3 mb-3 w-52 md:w-60 text-xs font-raleway">
        <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2">${dateString}</div>`;

    points
      .sort((a: any, b: any) => {
        if (reversePerformer || showTime) return a.y - b.y;

        return b.y - a.y;
      })
      .forEach((point: any) => {
        const { y, color, series, percentage } = point;
        const name = series.name;
        const label = series.options.custom?.tooltipLabel
          ? series.options.custom.tooltipLabel
          : AllChainsByKeys[name].label;
        const fillOpacity = series.options.fillOpacity;

        const date = x ? new Date(x) : new Date();
        const dateString = date.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        let value = y;
        // let value = y;

        if (valueFormatter) {
          value = valueFormatter(value);
        } else {
          value = formatNumber(y, false, false, prefix, suffix);
        }

        tooltip += `
        <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
        <div class="relative w-4 h-1.5 rounded-r-full bg-white dark:bg-forest-1000">
          <div class="w-4 h-1.5 rounded-r-full" style="
            background-color: ${AllChainsByKeys[name].colors["dark"][0]};
            opacity: ${fillOpacity};
          "></div>
        </div>
        <div class="tooltip-point-name">${label}</div>
        <div class="flex-1 text-right justify-end font-inter flex">
          <div class="opacity-70 mr-0.5 ${!prefix && "hidden"}">${prefix}</div>
          ${parseFloat(value).toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: showTime ? (name === "base" ? 4 : 3) : 2,
          })}
          <div class="opacity-70 ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
        </div>
      </div>
      <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white dark:bg-forest-1000" style="
          width: ${(y / maxPoint) * 100}%;
        ">
        </div>

        <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" style="
          width: ${(y / maxPoint) * 100}%;
          background-color: ${AllChainsByKeys[name].colors["dark"][0]};
          opacity: ${fillOpacity};
        "></div>
      </div>`;
      });

    if (stacked) {
      const value = formatNumber(pointsSum, false, false, prefix, suffix);
      tooltip += `
        <div class="flex w-full space-x-2 items-center font-medium mt-1.5 mb-0.5 opacity-70">
          <div class="w-4 h-1.5 rounded-r-full" style=""></div>
          <div class="tooltip-point-name text-md">Total</div>
          <div class="flex-1 text-right justify-end font-inter flex">
              <div class="opacity-70 mr-0.5 ${
                !prefix && "hidden"
              }">${prefix}</div>
              ${parseFloat(value).toLocaleString("en-GB", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              <div class="opacity-70 ml-0.5 ${
                !suffix && "hidden"
              }">${suffix}</div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[3px] w-full bg-white/0"></div>
        </div>`;
    }

    tooltip += `
        </div>
      </div>`;
    return tooltip;
  };

  if (shared) {
    return percentage ? percentageFormatter : normalFormatter;
  }
  return undefined;
};

export const tooltipPositioner = function (this, width, height, point) {
  const chart = this.chart;
  const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
  const tooltipWidth = width;
  const tooltipHeight = height;

  const distance = 20;
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

  // if (isMobile) {
  //   if (tooltipX + tooltipWidth > plotLeft + plotWidth) {
  //     tooltipX = plotLeft + plotWidth - tooltipWidth;
  //   }
  //   return {
  //     x: tooltipX,
  //     y: 0,
  //   };
  // }

  return {
    x: tooltipX,
    y: tooltipY,
  };
};

export const baseOptions: any = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "column",
    animation: true,
    backgroundColor: "transparent",
    plotBorderColor: "transparent",
    showAxes: false,
    panning: { enabled: false },
    panKey: "shift",
    zooming: {
      mouseWheel: {
        enabled: false,
      },
      resetButton: {
        theme: {
          zIndex: -10,
          fill: "transparent",
          stroke: "transparent",
          style: {
            color: "transparent",
            height: 0,
            width: 0,
          },
          states: {
            hover: {
              fill: "transparent",
              stroke: "transparent",
              style: {
                color: "transparent",
                height: 0,
                width: 0,
              },
            },
          },
        },
      },
    },
  },
  title: undefined,
  yAxis: {
    opposite: false,
    showFirstLabel: true,
    showLastLabel: true,
    type: "linear",
    labels: {
      y: 5,
      style: {
        color: "rgb(215, 223, 222)",
      },
      formatter: function (t: Highcharts.AxisLabelsFormatterContextObject) {
        return formatNumber(t.value, true);
        // return t.value;
      },
    },
    gridLineColor: "rgba(215, 223, 222, 0.33)",
  },
  xAxis: {
    type: "datetime",
    lineWidth: 0,
    crosshair: {
      width: 0.5,
      color: ChartColors.PLOT_LINE,
      snap: false,
    },
    labels: {
      style: { color: ChartColors.LABEL },
      enabled: true,
      formatter: (item) => {
        const date = new Date(item.value);
        const isMonthStart = date.getDate() === 1;
        const isYearStart = isMonthStart && date.getMonth() === 0;

        if (isYearStart) {
          return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
        } else {
          return `<span style="">${date.toLocaleDateString("en-GB", {
            timeZone: "UTC",
            month: "short",
          })}</span>`;
        }
      },
    },
    tickmarkPlacement: "on",
    tickWidth: 4,
    tickLength: 4,
    gridLineWidth: 0,
  },
  legend: {
    enabled: false,
    useHTML: false,
    symbolWidth: 0,
  },
  tooltip: {
    // formatter: tooltipFormatter,
    positioner: tooltipPositioner,
    formatter: tooltipFormatter(true, true, decimalToPercent),
    useHTML: true,
    shared: true,
    split: false,
    followPointer: true,
    followTouchMove: true,
    backgroundColor: "#2A3433EE",
    borderRadius: 17,
    borderWidth: 0,
    padding: 0,
    outside: true,
    shadow: {
      color: "black",
      opacity: 0.015,
      offsetX: 2,
      offsetY: 2,
    },
    style: {
      color: "rgb(215, 223, 222)",
    },
  },
  plotOptions: {
    line: {
      animation: true,
      dataGrouping: {
        enabled: false,
      },
    },
    area: {
      stacking: undefined,
      animation: true,
      dataGrouping: {
        enabled: false,
      },
    },
    column: {
      grouping: false,
      crisp: true,
      stacking: "normal",
      events: {
        legendItemClick: function () {
          return false;
        },
      },
      dataGrouping: {
        enabled: false,
      },
      groupPadding: 0,
    },
    series: {
      stacking: "normal",
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
      animation: true,
    },
  },

  credits: {
    enabled: false,
  },
  navigation: {
    buttonOptions: {
      enabled: false,
    },
  },
  navigator: {
    enabled: false,
  },
  rangeSelector: {
    enabled: false,
  },
  stockTools: {
    gui: {
      enabled: false,
    },
  },
  scrollbar: {
    enabled: false,
  },
};

export const formatNumber =
  // (
  //   value: number | string,
  //   isAxis = false,
  //   isPercentage = false,
  // ) => {
  (
    value: number | string,
    isAxis = false,
    isPercentage = false,
    prefix = "",
    suffix = "",
  ) => {
    // let prefix = valuePrefix;
    // let suffix = "";
    let val = parseFloat(value as string);

    let number = d3.format(`.2~s`)(val).replace(/G/, "B");

    if (isAxis) {
      if (isPercentage) {
        number = decimalToPercent(val * 100, 0);
      } else {
        number = prefix + d3.format(".2s")(val).replace(/G/, "B") + suffix;
      }
    } else {
      if (isPercentage) {
        number =
          d3
            .format(".2~s")(val * 100)
            .replace(/G/, "B") + "%";
      } else {
        number = val;
      }
    }

    return number;
  };

type TimespanSelections = "1d" | "7d" | "30d" | "90d" | "180d" | "365d" | "max";

export const getTimespans = (
  data?,
  isPercentageScale = false,
): {
  [key in TimespanSelections]: {
    label: string;
    value: number;
    xMin: number;
    xMax: number;
  };
} => {
  const maxDate = data
    ? new Date(data.length > 0 ? data[data.length - 1][0] : 0)
    : new Date();
  const buffer = isPercentageScale ? 0 : 3.5 * 24 * 60 * 60 * 1000;
  const maxPlusBuffer = maxDate.valueOf() + buffer;
  const minDate = data
    ? data.reduce((min, d) => Math.min(min, d[0]), Infinity)
    : maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000;
  return {
    "1d": {
      label: "1 day",
      value: 1,
      xMin: maxDate.valueOf() - 1 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "7d": {
      label: "7 days",
      value: 7,
      xMin: maxDate.valueOf() - 7 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "30d": {
      label: "30 days",
      value: 30,
      xMin: maxDate.valueOf() - 30 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "90d": {
      label: "90 days",
      value: 90,
      xMin: maxDate.valueOf() - 90 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "180d": {
      label: "180 days",
      value: 180,
      xMin: maxDate.valueOf() - 180 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "365d": {
      label: "1 year",
      value: 365,
      xMin: maxDate.valueOf() - 365 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    max: {
      label: "Maximum",
      value: 0,
      xMin: minDate,

      xMax: maxPlusBuffer,
    },
  };
};

export const getTickPositions = (
  xMin: number,
  xMax: number,
  maxTimespanSelected: boolean = false,
): number[] => {
  const tickPositions: number[] = [];
  const xMinDate = new Date(xMin);
  const xMaxDate = new Date(xMax);

  const xMinMonth = xMinDate.getUTCMonth();
  const xMaxMonth = xMaxDate.getUTCMonth();

  const xMinYear = xMinDate.getUTCFullYear();
  const xMaxYear = xMaxDate.getUTCFullYear();

  const xMinDay = xMinDate.getUTCDate();
  const xMaxDay = xMaxDate.getUTCDate();

  if (maxTimespanSelected) {
    for (let year = xMinYear; year <= xMaxYear; year++) {
      for (let month = 0; month < 12; month = month + 4) {
        if (year === xMinYear && month < xMinMonth) continue;
        if (year === xMaxYear && month > xMaxMonth) continue;
        tickPositions.push(Date.UTC(year, month, 1).valueOf());
      }
    }
    return tickPositions;
  }

  if (xMax - xMin < 1000 * 60 * 60 * 24 * 30 * 2) {
    for (let year = xMinYear; year <= xMaxYear; year++) {
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 0; day < daysInMonth; day++) {
          if (xMax - xMin < 1000 * 60 * 60 * 24 * 30 * 2) {
            if (year === xMinYear && month < xMinMonth && day < xMinDay)
              continue;
            if (year === xMaxYear && month > xMaxMonth && day > xMaxDay)
              continue;

            tickPositions.push(Date.UTC(year, month, day + 1).valueOf());
          }
        }
      }
    }
    return tickPositions;
  }

  for (let year = xMinYear; year <= xMaxYear; year++) {
    for (let month = 0; month < 12; month++) {
      if (year === xMinYear && month < xMinMonth) continue;
      if (year === xMaxYear && month > xMaxMonth) continue;

      tickPositions.push(Date.UTC(year, month, 1).valueOf());
    }
  }

  return tickPositions;
};

export const getXAxisLabels = (dailyTicks = false) => {
  return {
    style: { color: ChartColors.LABEL },
    enabled: true,
    formatter: (item) => {
      const date = new Date(item.value);
      const isDayStart = date.getHours() === 0 && date.getMinutes() === 0;
      const isMonthStart = date.getDate() === 1;
      const isYearStart = isMonthStart && date.getMonth() === 0;

      if (isYearStart) {
        return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
      } else {
        if (dailyTicks && isDayStart) {
          return `<span style="">${date.toLocaleDateString("en-GB", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
          })}</span>`;
        }

        return `<span style="">${date.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "short",
        })}</span>`;
      }
    },
  };
};
