// src/lib/highcharts/seriesUtils.ts
import * as d3 from 'd3';

export interface SeriesDataResult {
  data: [number, number][];
  zoneAxis?: string;
  zones?: any[];
  fillColor?: string;
  fillOpacity?: number;
  color?: any;
  gradient?: any;
  marker?: any;
}

export interface SeriesGradient {
  linearGradient: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  stops: [number, string][];
}

/**
 * Process raw data into series format for charts
 */
export function processSeriesData(
  name: string,
  types: string[],
  data: [number, number][],
  chartType: string,
  gradient: SeriesGradient,
  options: {
    showUsd?: boolean;
    timeInterval?: 'daily' | 'weekly' | 'monthly';
    theme?: 'light' | 'dark';
  } = {}
): SeriesDataResult {
  if (name === "") {
    return {
      data: [],
      zoneAxis: undefined,
      zones: undefined,
      fillColor: undefined,
      fillOpacity: undefined,
      color: ["", ""],
      gradient
    };
  }
  
  const { showUsd = true, timeInterval = 'weekly', theme = 'dark' } = options;

  const colors = gradient.stops.map((stop) => stop[1]);
  const firstColor = colors[0];
  const secondColor = colors[1];

  const timeIndex = types.findIndex((type) => type === "unix");
  let valueIndex = 1;
  let valueMulitplier = 1;

  let zones: any[] | undefined = undefined;
  let zoneAxis: string | undefined = undefined;

  const isLineChart = chartType === "line";
  const isColumnChart = chartType === "column";
  const isAreaChart = chartType === "area";

  let fillOpacity = undefined;
  let seriesFill = "transparent";

  if (isAreaChart) {
    seriesFill = firstColor + "33";
  }

  let fillColor = timeInterval === "weekly" ? firstColor : undefined;
  let lineColor = timeInterval === "weekly" ? firstColor : undefined;
  
  const dottedColumnColor = {
    pattern: {
      path: {
        d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
        "stroke-width": 3,
      },
      width: 10,
      height: 10,
      opacity: 1,
      color: firstColor + "CC",
    },
  };

  if (types.includes("usd")) {
    if (showUsd) {
      valueIndex = types.indexOf("usd");
    } else {
      valueIndex = types.indexOf("eth");
    }
  }

  const seriesData = data.map((d) => {
    return [d[timeIndex], d[valueIndex] * valueMulitplier] as [number, number];
  });

  let marker = {
    lineColor: firstColor,
    radius: 0,
    symbol: "circle",
  };
 
  if (timeInterval === "weekly") {
    return {
      data: seriesData,
      zoneAxis,
      zones,
      fillColor: seriesFill,
      fillOpacity,
      color: [firstColor, secondColor],
      gradient,
      marker,
    };
  }

  const columnFillColor = {
    linearGradient: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 1,
    },
    stops: [
      [0, firstColor + "FF"],
      [1, secondColor + "00"],
    ],
  };

  const columnColor = {
    linearGradient: {
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
    },
    stops: [
      [0, firstColor + "FF"],
      [1, secondColor + "00"],
    ],
  };

  const todaysDateUTC = new Date().getUTCDate();
  const secondZoneDottedColumnColor = todaysDateUTC === 1 ? columnColor : dottedColumnColor;
  const secondZoneDashStyle = todaysDateUTC === 1 ? "Solid" : "Dot";

  // Add zones for incomplete data in the current period
  if (chartType === "line") {
    if (seriesData.length > 1 && todaysDateUTC !== 1) {
      zoneAxis = "x";
      zones = [
        {
          value: seriesData[seriesData.length - 2][0] + 1,
          dashStyle: "Solid",
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart ? columnColor : firstColor,
        },
        {
          dashStyle: secondZoneDashStyle,
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart ? secondZoneDottedColumnColor : secondColor,
        },
      ];
    } else if (todaysDateUTC !== 1) {
      zoneAxis = "x";
      zones = [
        {
          dashStyle: secondZoneDashStyle,
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart ? secondZoneDottedColumnColor : secondColor,
        }
      ];
      marker.radius = 2;
    } else {
      zoneAxis = "x";
      zones = [
        {
          dashStyle: secondZoneDashStyle,
          fillColor: isColumnChart ? columnFillColor : seriesFill,
          color: isColumnChart ? secondZoneDottedColumnColor : secondColor,
        }
      ];
    }
  }

  return {
    data: seriesData,
    zoneAxis,
    zones,
    fillColor,
    fillOpacity,
    color: [firstColor, secondColor],
    gradient,
    marker,
  };
}

/**
 * Filters and processes landing chart data based on selected metrics and view options
 */
export function processLandingChartData(
  data: any, 
  options: {
    selectedMetric: string;
    showEthereumMainnet?: boolean; 
    focusEnabled?: boolean;
    chainColorMap?: Record<string, any>;
  }
): any[] {
  if (!data) return [];
  
  const { 
    selectedMetric, 
    showEthereumMainnet = false, 
    focusEnabled = true,
    chainColorMap = {}
  } = options;
  
  const compositions = data.timechart.compositions;
  const types = data.timechart.types;
  let retData: any = [];

  // Define explicit order for the keys
  const orderedKeys = ["single_l2", "multiple_l2s", "cross_layer", "only_l1"];

  // Filter keys and apply custom ordering
  const compositionKeys = Object.keys(compositions)
    .filter((key) => !(key === "only_l1" && focusEnabled))
    .sort((a, b) => orderedKeys.indexOf(a) - orderedKeys.indexOf(b));

  if (selectedMetric === "Total Ethereum Ecosystem") {
    if (!focusEnabled) {
      let onlySumData: number[][] = [];
      let onlyL2SumData: number[][] = [];
      
      compositions.only_l1.forEach((element: any, index: number) => {
        let sum_l1 = 0;
        let sum_l2 = 0;
        sum_l1 += compositions.only_l1[index][types.indexOf("value")];
        sum_l1 += compositions.cross_layer[index][types.indexOf("value")];
        sum_l2 += compositions.multiple_l2s[index][types.indexOf("value")];
        sum_l2 += compositions.single_l2[index][types.indexOf("value")];

        onlySumData.push([element[types.indexOf("unix")], sum_l1]);
        onlyL2SumData.push([element[types.indexOf("unix")], sum_l2]);
      });

      retData.push({ name: "main_l2", data: onlyL2SumData, types: types });
      retData.push({ name: "main_l1", data: onlySumData, types: types });
    } else {
      let sumData: number[][] = [];
  
      compositions.cross_layer.forEach((element: any, index: number) => {
        let sum = 0;
        compositionKeys.forEach((key) => {
          sum += compositions[key][index][types.indexOf("value")];
        });
  
        sumData.push([element[types.indexOf("unix")], sum]);
      });
  
      retData.push({ name: "all_l2s", data: sumData, types: types, stacked: false });
      
      if (focusEnabled && showEthereumMainnet) {
        retData.push({ name: "ethereum", data: compositions.only_l1, types: types, stacked: false });
      }
    }
  } else {
    compositionKeys.forEach((key) => {
      retData.push({ 
        name: key, 
        data: compositions[key], 
        types: types, 
        stacked: key === "single_l2" ? false : true 
      });
    });
    
    if (focusEnabled && showEthereumMainnet) {
      retData.push({ name: "ethereum", data: compositions.only_l1, types: types, stacked: false });
    }
  }

  return retData;
}

/**
 * Calculates timespan ranges for chart x-axis
 */
export function calculateTimeSpans(
  filteredData: any[], 
  maxDate: Date,
  scale: 'absolute' | 'percentage' = 'absolute'
): Record<string, { label: string; value: number; xMin: number; xMax: number }> {
  const buffer = scale === 'percentage' ? 0 : 7 * 24 * 60 * 60 * 1000;
  const maxPlusBuffer = maxDate.valueOf() + buffer;

  return {
    "90d": {
      label: "90 days",
      value: 90,
      xMin: maxPlusBuffer - 90 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "180d": {
      label: "180 days",
      value: 180,
      xMin: maxPlusBuffer - 180 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "365d": {
      label: "1 year",
      value: 365,
      xMin: maxPlusBuffer - 365 * 24 * 60 * 60 * 1000,
      xMax: maxPlusBuffer,
    },
    "max": {
      label: "Maximum",
      value: 0,
      xMin: filteredData.reduce((min, d) => {
        if (d.data && d.data[0] && d.data[0][0] !== undefined) {
          return Math.min(min, d.data[0][0]);
        }
        return min;
      }, Infinity) - buffer,
      xMax: maxPlusBuffer,
    },
  };
}