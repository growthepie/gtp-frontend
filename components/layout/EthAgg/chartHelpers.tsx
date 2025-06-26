import Highcharts from 'highcharts';

// --- Constants ---
export const CHART_MARGINS = {
  marginTop: 76,
  marginRight: 42,
  marginBottom: 0,
  marginLeft: 0,
};

// --- onRender Logic ---
// We create a function that returns the onRender callback.
// This helps manage state (like lastPointLines) outside the component's render cycle.
export const createChartOnRender = (
  lastPointLines: { [key: string]: Highcharts.SVGElement[] },
  uniqueChartId: string
) => {
  return function (this: Highcharts.Chart) {
    const chart = this;
    if (!chart || !chart.series || chart.series.length === 0) return;

    chart.series.forEach((series, index) => {
      const dictionaryKey = `${series.name}_${uniqueChartId}`;
      const lastPoint = series.points[series.points.length - 1];

      // Clean up old lines before drawing new ones
      if (lastPointLines[dictionaryKey]) {
        lastPointLines[dictionaryKey].forEach((line) => line.destroy());
      }
      lastPointLines[dictionaryKey] = [];

      if (!lastPoint || typeof lastPoint.plotY === 'undefined') return;

      // Calculate the fraction that 42px is in relation to the pixel width of the chart
      const fraction = 42 / chart.chartWidth;

      // Create a line from the last point to the top of the chart
      const line = chart.renderer
        .createElement("line")
        .attr({
          x1: chart.chartWidth * (1 - fraction),
          y1: lastPoint.plotY + chart.plotTop,
          x2: chart.chartWidth * (1 - fraction),
          y2: chart.plotTop - 35,
          stroke: "#CDD8D3",
          "stroke-width": 1,
          rendering: "crispEdges",
          zIndex: 0,
        })
        .add();

      lastPointLines[dictionaryKey].push(line);
    });
  };
};

// --- Tooltip Formatter ---
export const createTooltipFormatter = (showUsd: boolean) => {
  return function (this: Highcharts.TooltipFormatterContextObject) {
    const { x, points } = this;
    if (!points) return "";

    const date = new Date(x as number);
    const dateString = date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });


    const tooltipHeader = `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
      <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2 ">${dateString}</div>`;

    const tooltipFooter = `</div>`;

    const tooltipPoints = points
      .sort((a, b) => (b.y || 0) - (a.y || 0))
      .map((point) => {
        const { series, y } = point;
        const prefix = showUsd ? "$" : "Ξ";
        const displayValue = Intl.NumberFormat("en-GB", {
          notation: "compact",
          maximumFractionDigits: 2,
        }).format(y || 0);

        console.log("series.color", series.color);

        const color = typeof series.color === "string" ? series.color : (series.color as Highcharts.GradientColorObject).stops[0][1];

        return `
        <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
          <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${color}"></div>
          <div class="tooltip-point-name text-xs">${series.name}</div>
          <div class="flex-1 text-right justify-end flex numbers-xs">
            <div class="flex justify-end text-right w-full">
                <div>${prefix}</div>
                <div>${displayValue}</div>
            </div>
          </div>
        </div>`;
      })
      .join("");

    return tooltipHeader + tooltipPoints + tooltipFooter;
  };
};