import { ChainsData } from "@/types/api/ChainResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { navigationItems } from "@/lib/navigation";
import { AllChainsByKeys, Get_SupportedChainKeys } from "@/lib/chains";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

type intervalShown = {
  min: number;
  max: number;
  num: number;
  label: string;
} | null;

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

export function displayValuesHelper(
  data: ChainsData[],
  master: MasterResponse,
  showUsd: boolean,
  intervalShown: intervalShown,
  key: string,
  p: Object[],
  item: any,
  isGwei: boolean | undefined,
  chainIndex: number,
) {
  const units = Object.keys(master.metrics[key].units);

  const unitKey =
    units.find((unit) => unit !== "usd" && unit !== "eth") ||
    (showUsd ? "usd" : "eth");

  let prefix =
    isGwei && !showUsd ? "" : master.metrics[key].units[unitKey].prefix;
  let suffix =
    isGwei && !showUsd ? "Gwei" : master.metrics[key].units[unitKey].suffix;
  let valueIndex = showUsd ? 1 : 2;
  let valueMultiplier = isGwei && !showUsd ? 1000000000 : 1;

  let valueFormat = Intl.NumberFormat("en-GB", {
    notation: "compact",
    maximumFractionDigits:
      key === "txcosts" && showUsd
        ? master.metrics[key].units[unitKey].decimals
        : 2,
    minimumFractionDigits:
      key === "txcosts" && showUsd
        ? master.metrics[key].units[unitKey].decimals
        : 2,
  });

  let navItem = navigationItems[1].options.find((ni) => ni.key === key);

  let dateIndex = item.metrics[key].daily.data.length - 1;

  const latestUnix =
    item.metrics[key].daily.data[item.metrics[key].daily.data.length - 1];

  if (intervalShown) {
    const intervalMaxIndex = item.metrics[key].daily.data.findIndex(
      (d) => d[0] >= intervalShown?.max,
    );
    if (intervalMaxIndex !== -1) dateIndex = intervalMaxIndex;
  }

  let value = valueFormat.format(
    item.metrics[key].daily.data[dateIndex][
      master.metrics[key].units[unitKey].currency ? valueIndex : 1
    ] * valueMultiplier,
  );

  if (p.length < chainIndex + 1) p[chainIndex] = {};

  p[chainIndex][key] = {
    value,
    prefix,
    suffix,
  };

  return p[chainIndex][key];
}

export function compChainsHelper(master: MasterResponse, chainKey: string[]) {
  if (!master) return [];

  // const chainGroups = {};

  const chainItemsByKey = navigationItems[3].options
    .filter((option) => option.hide !== true)
    .filter(
      (option) =>
        option.key && Get_SupportedChainKeys(master).includes(option.key),
    )
    .reduce((acc, option) => {
      if (option.key) acc[option.key] = option;
      return acc;
    }, {});

  // group master.chains by bucket
  const chainsByBucket = Object.entries(master.chains).reduce(
    (acc, [key, chainInfo]) => {
      if (!acc[chainInfo.bucket]) {
        acc[chainInfo.bucket] = [];
      }

      if (chainItemsByKey[key] && key !== chainKey[0])
        acc[chainInfo.bucket].push(chainItemsByKey[key]);

      return acc;
    },
    {},
  );

  // sort each bucket in alphabetical order
  Object.keys(chainsByBucket).forEach((bucket) => {
    chainsByBucket[bucket].sort((a, b) => a.label.localeCompare(b.label));
  });

  return Object.keys(chainsByBucket).reduce((acc: any[], bucket: string) => {
    acc.push(...chainsByBucket[bucket]);
    return acc;
  }, []);
}

export function getOptionsHelper(
  data: ChainsData[],
  isAnimate,
  timespans,
  selectedTimespan,
  theme,
  tooltipFormatter,
  tooltipPositioner,
  passTickPositions,
  onXAxisSetExtremes,
): Highcharts.Options {
  const options: Highcharts.Options = {
    accessibility: { enabled: false },
    exporting: { enabled: false },
    chart: {
      type: "area",
      animation: isAnimate,
      height: 176,
      backgroundColor: undefined,
      margin: [1, 0, 40, 0],
      spacingBottom: 0,
      spacingTop: 40,
      panning: { enabled: true },
      panKey: "shift",
      zooming: {
        type: "x",
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

      style: {
        //@ts-ignore
        borderRadius: "0 0 15px 15px",
      },
    },

    title: undefined,
    yAxis: {
      title: { text: undefined },
      opposite: false,
      showFirstLabel: false,

      showLastLabel: true,
      gridLineWidth: 1,
      gridLineColor:
        theme === "dark"
          ? "rgba(215, 223, 222, 0.11)"
          : "rgba(41, 51, 50, 0.11)",

      type: "linear",
      min: 0,
      labels: {
        align: "left",
        y: -4,
        x: 2,
        style: {
          color: "#CDD8D3",
          gridLineColor:
            theme === "dark"
              ? "rgba(215, 223, 222, 0.33)"
              : "rgba(41, 51, 50, 0.33)",
          fontSize: "8px",
        },
      },
      // gridLineColor:
      //   theme === "dark"
      //     ? "rgba(215, 223, 222, 0.33)"
      //     : "rgba(41, 51, 50, 0.33)",
    },
    xAxis: {
      events: {
        afterSetExtremes: onXAxisSetExtremes,
      },
      type: "datetime",
      lineWidth: 0,
      crosshair: {
        width: 0.5,
        color: COLORS.PLOT_LINE,
        snap: false,
      },
      // min: zoomed
      //   ? zoomMin
      //   : timespans[selectedTimespan].xMin - 1000 * 60 * 60 * 24 * 7,
      // max: zoomed ? zoomMax : timespans[selectedTimespan].xMax,
      tickPositions: passTickPositions,
      tickmarkPlacement: "on",
      tickWidth: 1,
      tickLength: 20,
      ordinal: false,
      minorTicks: false,
      minorTickLength: 2,
      minorTickWidth: 2,
      minorGridLineWidth: 0,
      minorTickInterval: 1000 * 60 * 60 * 24 * 7,
      labels: {
        style: { color: COLORS.LABEL },
        enabled: false,
        formatter: (item) => {
          const date = new Date(item.value);
          const isMonthStart = date.getDate() === 1;
          const isYearStart = isMonthStart && date.getMonth() === 0;
          if (isYearStart) {
            return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
          } else {
            return `<span style="">${date.toLocaleDateString("en-GB", {
              month: "short",
            })}</span>`;
          }
        },
      },
      // minPadding: 0.04,
      // maxPadding: 0.04,
      gridLineWidth: 0,
    },
    legend: {
      enabled: false,
      useHTML: false,
      symbolWidth: 0,
    },
    tooltip: {
      hideDelay: 300,
      stickOnContact: false,
      useHTML: true,
      shared: true,
      outside: true,
      formatter: tooltipFormatter,
      positioner: tooltipPositioner,
      split: false,
      followPointer: true,
      followTouchMove: true,
      backgroundColor: (theme === "dark" ? "#2A3433" : "#EAECEB") + "EE",
      borderRadius: 17,
      borderWidth: 0,
      padding: 0,
      shadow: {
        color: "black",
        opacity: 0.015,
        offsetX: 2,
        offsetY: 2,
      },
      style: {
        color: theme === "dark" ? "rgb(215, 223, 222)" : "rgb(41 51 50)",
      },
    },

    plotOptions: {
      line: {
        lineWidth: 2,
      },
      area: {
        lineWidth: 2,
        // marker: {
        //   radius: 12,
        //   lineWidth: 4,
        // },
        fillOpacity: 1,
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [
              0,
              AllChainsByKeys[data[0].chain_id].colors[theme ?? "dark"][0] +
                "33",
            ],
            [
              1,
              AllChainsByKeys[data[0].chain_id].colors[theme ?? "dark"][1] +
                "33",
            ],
          ],
        },
        shadow: {
          color:
            AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][1] +
            "33",
          width: 10,
        },
        color: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
          },
          stops: [
            [0, AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][0]],
            // [0.33, AllChainsByKeys[series.name].colors[1]],
            [1, AllChainsByKeys[data[0].chain_id]?.colors[theme ?? "dark"][1]],
          ],
        },
        // borderColor:
        //   AllChainsByKeys[data[0].chain_id].colors[theme ?? "dark"][0],
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
          inactive: {
            enabled: true,
            opacity: 0.6,
          },
        },
      },
    },

    credits: {
      enabled: false,
    },
  };

  return options;
}

export const pointHoverHelper = (
  chartComponents: React.RefObject<Highcharts.Chart[]>,
) => {
  return function (this: Highcharts.Point, event: MouseEvent) {
    const { series: hoveredSeries, index: hoveredPointIndex } = this;
    const hoveredChart = hoveredSeries.chart;

    if (chartComponents.current && chartComponents.current.length > 1) {
      chartComponents.current.forEach((chart) => {
        if (!chart || chart.index === hoveredChart.index) return;

        let wasCrosshairDrawn = false;

        const chartSeries = chart.series;
        chartSeries.forEach((series, seriesIndex) => {
          if (event.type === "mouseOver" || event.type === "mouseMove") {
            if (event.target !== null) {
              const pointerEvent =
                event.target as unknown as Highcharts.PointerEventObject;
              const point =
                series.points.find((p) => p.x === pointerEvent.x) || null;

              if (point !== null) {
                const simulatedPointerEvent: any = {
                  chartX: point.plotX ?? 0,
                  chartY: point.plotY ?? 0,
                };
                point.setState("hover");
                if (!wasCrosshairDrawn) {
                  chart.xAxis[0].drawCrosshair(simulatedPointerEvent);
                  wasCrosshairDrawn = true;
                }
              }
              return;
            }
          }

          if (chart && chart.xAxis[0]) {
            if (seriesIndex === hoveredSeries.index) {
              chart.xAxis[0].hideCrosshair();
            }
            series.points.forEach((point) => {
              point.setState();
            });
          }
        });
      });
    }
  };
};

export const updateSeriesHelper = async (
  chartComponents: React.RefObject<Highcharts.Chart[]>,
  data: ChainsData[],
  enabledFundamentalsKeys: string[],
  pointHover:
    | Highcharts.PointMouseOverCallbackFunction
    | Highcharts.PointMouseOutCallbackFunction,
  showGwei: (key: string) => boolean | undefined,
  showUsd: boolean,
  theme: string | undefined,
) => {
  enabledFundamentalsKeys.forEach(async (key, i) => {
    if (chartComponents.current) {
      if (chartComponents.current[i]) {
        // Show loading
        // chartComponents.current[i].showLoading();

        // Get current series displayed on this chart
        const currentSeries = chartComponents.current[i].series;

        // ["ethereum", "bsc", "polygon"]
        const seriesToAdd = data.map((item) => item.chain_id);

        // Find the series to remove
        const seriesToRemove = currentSeries.filter(
          (s: Highcharts.Series) => !seriesToAdd.includes(s.name),
        );

        // Remove the series we don't need
        chartComponents.current[i].series.forEach((s) => {
          if (seriesToRemove.includes(s)) {
            s.remove(false);
          }
        });

        // Loop through the series we need to add/update
        data.forEach((item) => {
          const seriesName = item.chain_id;
          const series = currentSeries.find((s) => s.name === seriesName);

          const seriesData = item.metrics[key]?.daily.types.includes("eth")
            ? showUsd
              ? item.metrics[key].daily.data.map((d) => [
                  d[0],
                  d[item.metrics[key].daily.types.indexOf("usd")],
                ])
              : item.metrics[key].daily.data.map((d) => [
                  d[0],
                  showGwei(key)
                    ? d[item.metrics[key].daily.types.indexOf("eth")] *
                      1000000000
                    : d[item.metrics[key].daily.types.indexOf("eth")],
                ])
            : item.metrics[key]?.daily.data.map((d) => [d[0], d[1]]);

          const seriesTypes = item.metrics[key]?.daily.types;

          if (series) {
            series.update(
              {
                ...series.options,
                custom: { types: seriesTypes, metric: key },
              },
              false,
            );
            series.setData(seriesData, false);
          } else {
            if (chartComponents.current) {
              chartComponents.current[i].addSeries(
                {
                  name: seriesName,
                  crisp: false,
                  custom: {
                    types: item.metrics[key]?.daily.types,
                    metric: key,
                  },
                  data: seriesData,
                  showInLegend: false,
                  marker: {
                    enabled: false,
                  },
                  point: {
                    events: {
                      mouseOver: pointHover,
                      mouseOut: pointHover,
                    },
                  },
                  type: "area",
                  lineColor:
                    AllChainsByKeys[item.chain_id].colors[theme ?? "dark"][0],
                  fillColor: {
                    linearGradient: {
                      x1: 0,
                      y1: 0,
                      x2: 0,
                      y2: 1,
                    },
                    stops: [
                      [
                        0,
                        AllChainsByKeys[item.chain_id].colors[
                          theme ?? "dark"
                        ][0] + "33",
                      ],
                      [
                        1,
                        AllChainsByKeys[item.chain_id].colors[
                          theme ?? "dark"
                        ][1] + "33",
                      ],
                    ],
                  },
                  shadow: {
                    color:
                      AllChainsByKeys[item.chain_id]?.colors[
                        theme ?? "dark"
                      ][1] + "33",
                    width: 10,
                  },
                },
                false,
              );
            }
          }
        });

        // Redraw the chart
        chartComponents.current[i].redraw();
      }
    }
  });
};
