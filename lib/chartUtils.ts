import * as d3 from "d3";

export const ChartColors = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
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

export const baseOptions: Highcharts.Options = {
  accessibility: { enabled: false },
  exporting: { enabled: false },
  chart: {
    type: "column",
    animation: true,
    backgroundColor: "transparent",
    plotBorderColor: "transparent",
    showAxes: false,
    zooming: {
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
    panning: {
      enabled: true,
    },
    panKey: "shift",
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
          return `<span style="">${date.toLocaleDateString(undefined, {
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
    formatter: function (this: Highcharts.TooltipFormatterContextObject) {
      // shared tooltip
      const { points } = this;
      if (!points || points.length < 1) {
        return "";
      }

      const { x, y, color, name } = points[0];

      const date = new Date(x);
      const dateString = date.toLocaleDateString(undefined, {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const value = formatNumber(y, false, true);

      const tooltip = `
      <div class="mt-3 mr-3 mb-3 w-48 md:w-60 text-xs font-raleway">
        <div class="w-full flex justify-between font-bold text-[13px] md:text-[1rem] items-end pl-6 pr-1 mb-2">${dateString}</div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <div style="width: 8px; height: 8px; border-radius: 4px; background-color: ${color}; margin-right: 8px;"></div>
            <div>${name}</div>
          </div>
          <div style="font-size: 14px; font-weight: 600;">${value}</div>
        </div>
      </div>`;

      return tooltip;
    },
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

const formatNumber = (
  value: number | string,
  isAxis = false,
  isPercentage = false,
) => {
  return isAxis
    ? !isPercentage
      ? d3.format(".2s")(value)
      : d3.format(".2s")(value) + "%"
    : d3.format(",.2~s")(value);
};

type TimespanSelections = "7d" | "30d" | "90d" | "180d" | "365d" | "max";

export const getTimespans = (
  data,
  isPercentageScale = false,
): {
  [key in TimespanSelections]: {
    label: string;
    value: number;
    xMin: number;
    xMax: number;
  };
} => {
  const maxDate = new Date(data.length > 0 ? data[data.length - 1][0] : 0);
  const buffer = isPercentageScale ? 0 : 3.5 * 24 * 60 * 60 * 1000;
  const maxPlusBuffer = maxDate.valueOf() + buffer;

  return {
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
      xMin: data.reduce((min, d) => Math.min(min, d[0]), Infinity),

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
          return `<span style="">${date.toLocaleDateString(undefined, {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
          })}</span>`;
        }

        return `<span style="">${date.toLocaleDateString(undefined, {
          timeZone: "UTC",
          month: "short",
        })}</span>`;
      }
    },
  };
};
