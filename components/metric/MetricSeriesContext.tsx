import { useMaster } from "@/contexts/MasterContext";
import { Get_SupportedChainKeys } from "@/lib/chains";
import { DAMetricsURLs, MetricsURLs } from "@/lib/urls";
import { ChainData, MetricsResponse } from "@/types/api/MetricsResponse";
import { intersection, merge } from "lodash";
import { RefObject, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useMetricData } from "./MetricDataContext";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useTheme } from "next-themes";
import { daMetricItems, metricItems } from "@/lib/metrics";

type SeriesData = {
  name: string;
  types: string[];
  data: number[][];
}

type MetricSeriesContextType = {
  seriesData: SeriesData[];
};

const MetricSeriesContext = createContext<MetricSeriesContextType>({
  seriesData: [],
});

type MetricSeriesProviderProps = {
  children: React.ReactNode;
  metric_type: "fundamentals" | "data-availability";
};

export const MetricSeriesProvider = ({ children, metric_type }: MetricSeriesProviderProps) => {
  const UrlsMap = {
    fundamentals: MetricsURLs,
    "data-availability": DAMetricsURLs,
  };

  const { theme } = useTheme();
  const { data: master, AllChainsByKeys, AllDALayersByKeys, SupportedChainKeys, EnabledChainsByKeys } = useMaster();
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const { data, chainKeys, metric_id, avg } = useMetricData();
  const { selectedChains, selectedTimeInterval, selectedTimespan, timeIntervalKey, selectedScale, showEthereumMainnet, selectedYAxisScale } = useMetricChartControls();


  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const navItem = useMemo(() => {

    return metric_type === "fundamentals" ? metricItems.find((item) => item.key === metric_id) : daMetricItems.find((item) => item.key === metric_id);
    //return navigationItems[1].options.find((item) => item.key === metric_id);
  }, [metric_id, metric_type]);

  const urlKey = useMemo(() => {
    if (!navItem) return null;

    return navItem.urlKey;
  }, [navItem]);

  const [showGwei, reversePerformer] = useMemo(() => {
    if (!navItem) return [false, false];

    return [navItem.page?.showGwei, navItem.page?.reversePerformer];
  }, [navItem]);



  const getSeriesType = useCallback(
    (name: string) => {
      if (name === "ethereum" && focusEnabled) {
        // show column chart for ethereum if monthly and stacked
        if ((selectedTimeInterval === "monthly" || selectedTimeInterval === "weekly") && selectedScale === "stacked")
          return "column";
        // else respect the selectedScale for ethereum
        if (selectedScale === "percentage") return "area";
        if (selectedScale === "stacked") return "area";
        // Change this line to show area (stacked style) instead of line for absolute scale
        return "area"; // for absolute scale - changed from "line" to "area"
      }
     
      if (selectedScale === "percentage") return "area";
      if (selectedScale === "stacked")
        return selectedTimeInterval === "daily" ? "area" : "column";

      return "line";
    },
    [selectedScale, selectedTimeInterval, focusEnabled],
  );

  const MetadataByKeys = useMemo(() => {
    if (!master) return {};
    return metric_type === "fundamentals" ? master.chains : master.da_layers
  }, [master, metric_type]);

  const getSeriesData = useCallback(
    (name: string, types: string[], data: number[][]) => {
      if (name === "")
        return {
          data: [],
          zoneAxis: undefined,
          zones: undefined,
          fillColor: undefined,
          fillOpacity: undefined,
          color: undefined,
          shadow: undefined,
        };

      const timeIndex = 0;
      let valueIndex = 1;
      let valueMulitplier = 1;

      let zones: any[] | undefined = undefined;
      let zoneAxis: string | undefined = undefined;

      const isLineChart = getSeriesType(name) === "line";
      const isColumnChart = getSeriesType(name) === "column";
      const isAreaChart = getSeriesType(name) === "area";

      let fillOpacity = undefined;

      let seriesFill: Highcharts.GradientColorObject | string | undefined = undefined;

      let shadow: Highcharts.ShadowOptionsObject | undefined = undefined;

      if (["area", "line"].includes(getSeriesType(name)) && selectedScale !== "stacked") {
        shadow = {
          color: MetadataByKeys[name]?.colors.dark[1] + "66",
          width: 9,
        };
      }

      if (isAreaChart) {
        seriesFill = {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "99"],
            [1, MetadataByKeys[name]?.colors[theme ?? "dark"][1] + "33"],
          ],
        };
      }

      let fillColor: Highcharts.GradientColorObject | string | undefined =
      selectedTimeInterval === "daily"
        ? {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "99"],
            [1, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "33"],
          ],
        }
        : undefined;
    let color: Highcharts.GradientColorObject | string | undefined =
      selectedTimeInterval === "daily"
        ? {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
          },
          stops: [
            [0, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "EE"],
            [1, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "FF"],
          ],
        }
        : undefined;

      if(selectedYAxisScale === "logarithmic" && selectedScale === "absolute") {
        color = MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "FF";
      }

      if (types.includes("usd")) {
        if (showUsd) {
          valueIndex = types.indexOf("usd");
        } else {
          valueIndex = types.indexOf("eth");
          if (showGwei) valueMulitplier = 1000000000;
        }
      }

      const seriesData = data.map((d) => {
        return [d[timeIndex], d[valueIndex] * valueMulitplier];
      });

      let marker = {
        lineColor: MetadataByKeys[name].colors[theme ?? "dark"][0],
        radius: 0,
        symbol: "circle",
      }

      if (selectedTimeInterval === "daily") {
        return {
          data: seriesData,
          zoneAxis,
          zones,
          fillColor: seriesFill,
          fillOpacity,
          color,
          marker,
          shadow,
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
          [0, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "FF"],
          // [0.349, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "00"],
        ],
      };

      const columnColor = {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
        stops: [
          [0, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "FF"],
          // [0.349, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "88"],
          [1, MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "00"],
        ],
      };

      const dottedColumnColor = {
        pattern: {
          path: {
            d: "M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11",
            "stroke-width": 3,
          },
          width: 10,
          height: 10,
          opacity: 1,
          color: MetadataByKeys[name].colors[theme ?? "dark"][0] + "CC",
        },
      };

      const todaysDayOfMonthUTC = new Date().getUTCDate();

      const secondZoneDottedColumnColor =
        todaysDayOfMonthUTC === 1 ? columnColor : dottedColumnColor;

      const secondZoneDashStyle = todaysDayOfMonthUTC === 1 ? "Solid" : "Dot";



      // if it is not the last day of the month, add a zone to the chart to indicate that the data is incomplete
      if (selectedTimeInterval === "monthly") {

        if (seriesData.length > 1 && todaysDayOfMonthUTC !== 1) {
          zoneAxis = "x";
          zones = [
            {
              value: seriesData[seriesData.length - 2][0] + 1,
              dashStyle: "Solid",
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? columnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            },
            {
              // value: monthlyData[monthlyData.length - 2][0],
              dashStyle: secondZoneDashStyle,
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? secondZoneDottedColumnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            },
          ];
        } else if (todaysDayOfMonthUTC !== 1) {
          zoneAxis = "x";
          zones = [
            {
              // value: monthlyData[monthlyData.length - 2][0],
              dashStyle: secondZoneDashStyle,
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? secondZoneDottedColumnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            }
          ];
          marker.radius = 2;
        } else {
          zoneAxis = "x";
          zones = [
            {
              // value: monthlyData[monthlyData.length - 2][0],
              dashStyle: secondZoneDashStyle,
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? secondZoneDottedColumnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            }
          ];
        }
      }else if (selectedTimeInterval === "weekly") {
        const todaysDateUTC = new Date().getTime();
        const daysSinceLastDataPoint = Math.floor((todaysDateUTC - seriesData[seriesData.length - 1][0]) / (1000 * 60 * 60 * 24));

        if(daysSinceLastDataPoint >= 7) {
          zoneAxis = "x";
          zones = [
            {
              // value: monthlyData[monthlyData.length - 2][0],
              dashStyle: "Solid",
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? columnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            }
          ];
        }else{
          zoneAxis = "x";
          zones = [
            {
              value: seriesData[seriesData.length - 2][0] + 1,
              dashStyle: "Solid",
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? columnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            },
            {
              // value: monthlyData[monthlyData.length - 2][0],
              dashStyle: secondZoneDashStyle,
              fillColor: isColumnChart ? columnFillColor : seriesFill,
              color: isColumnChart
                ? secondZoneDottedColumnColor
                : MetadataByKeys[name].colors[theme ?? "dark"][0],
            },
          ];
        }

      }

      return {
        data: seriesData,
        zoneAxis,
        zones,
        fillColor,
        fillOpacity,
        color,
        marker,
        shadow,
        theme,
      };
    },
    [
      getSeriesType,
      selectedTimeInterval,
      MetadataByKeys,
      theme,
      showUsd,
      showGwei,
    ],
  );


  const dataGrouping = useMemo(() => {
    let grouping: Highcharts.DataGroupingOptionsObject | undefined = {
      enabled: false,
    };

    if (
      (avg === true || selectedScale === "stacked") &&
      ["max", "365d"].includes(selectedTimespan)
    ) {
      grouping = {
        enabled: false,
        // units: [["week", [1]]],
        // approximation: "average",
        // forced: true,
      };
    } else {
      grouping = {
        enabled: false,
      };
    }

    return grouping;
  }, [avg, selectedScale, selectedTimespan]);

  const seriesData = useMemo(() => {
    if (!data) return [] as SeriesData[];




    let borderRadius: string | null = null;



    const timeIntervalToMilliseconds = {
      daily: 1 * 24 * 3600 * 1000,
      weekly: 7 * 24 * 3600 * 1000,
      monthly: 30 * 24 * 3600 * 1000,
    };

    // Determine if this will be a column chart for weekly/monthly stacked
    const isColumnChart = (selectedTimeInterval === "weekly" || selectedTimeInterval === "monthly") && selectedScale === "stacked";
    
    const pointsSettings = isColumnChart
      ? {
          pointPlacement: selectedTimeInterval === "monthly" ? 0 : 0.5,
          pointRange: timeIntervalToMilliseconds[selectedTimeInterval],
        }
      : {
          pointPlacement:
            (selectedTimeInterval === "monthly" || selectedTimeInterval === "weekly") &&
              selectedScale === "stacked"
              ? 0
              : 0.5,
        };


    const chainDataKeys = (metric_type === "fundamentals" ? chainKeys.filter((chainKey) =>
      selectedChains.includes(chainKey) && SupportedChainKeys.includes(chainKey)
    ) : chainKeys.filter((chainKey) => selectedChains.includes(chainKey)))
      // exclude chains that don't have data for the current time interval
      .filter((chainKey) => !!data.chains[chainKey]?.[timeIntervalKey]);

    const d = chainDataKeys.sort((a, b) => {
      if (["stacked", "percentage"].includes(selectedScale)) {
        const aData = data.chains[a][timeIntervalKey]?.data ?? [];
        const bData = data.chains[b][timeIntervalKey]?.data ?? [];

        if (showEthereumMainnet && !focusEnabled) {
          if (a === "ethereum") {
            return 1;
          }
          if (b === "ethereum") {
            return -1;
          }
        }

        // if (metric_type === "data-availability" && chainDataKeys.includes("da_ethereum_calldata") && chainDataKeys.includes("da_ethereum_blobs")) {
        //   if(["da_ethereum_calldata", "da_ethereum_blobs"].includes(a) && ["da_ethereum_calldata", "da_ethereum_blobs"].includes(b)) {
        //     return 1;
        //   }
        // }

        // sort by the time of the first data point so that the series are stacked in the correct order
        return (bData[0]?.[0] ?? 0) - (aData[0]?.[0] ?? 0);
      }
      // else keep the order of the series the same
      return 0;
    }).sort((a, b) => {
      if(metric_type === "data-availability" && metric_id === "data_posted") {
        const dataKeys =[...chainDataKeys];
        const order = [...dataKeys.filter((key) => !["da_ethereum_calldata", "da_ethereum_blobs"].includes(key)), "da_ethereum_blobs", "da_ethereum_calldata"];
        return order.indexOf(a) - order.indexOf(b);
      }
      return 0;
    }).map((chainKey, i) => {
      const chain = data.chains[chainKey];

      
      const zIndex = showEthereumMainnet
        ? chainKey === "ethereum"
          ? 0
          : 10
        : 10;

      if (showEthereumMainnet && i === 1) {
        borderRadius = "8%";
      } else if (i === 0) {
        borderRadius = "8%";
      }

      return {
        name: chainKey,
        types: chain[timeIntervalKey].types,
        // data: chain[timeIntervalKey].data,

        zIndex: 100,
        index: i,
        step: undefined,
        data: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data).data,
        zoneAxis: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .zoneAxis,
        zones: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .zones,
        ...pointsSettings,
        type: getSeriesType(chainKey),
        clip: true,
        dataGrouping: dataGrouping,
        // borderRadiusTopLeft: borderRadius,
        // borderRadiusTopRight: borderRadius,
        fillOpacity: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .fillOpacity,
        fillColor: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .fillColor,
        color: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .color,
        shadow: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .shadow,
        borderColor:
          MetadataByKeys[chainKey]?.colors[theme ?? "dark"][0],
        borderWidth: 0,
        lineWidth: 2,
        marker: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data).marker,
        states: {
          hover: {
            enabled: true,
            halo: {
              size: 5,
              opacity: 1,
              attributes: {
                fill:
                  MetadataByKeys[chainKey]?.colors[
                  theme ?? "dark"
                  ][0] + "99",
                stroke:
                  MetadataByKeys[chainKey]?.colors[
                  theme ?? "dark"
                  ][0] + "66",
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
        },
        
      };
    });

    return d;
  }, [data, selectedTimeInterval, selectedScale, chainKeys, metric_type, selectedChains, SupportedChainKeys, showEthereumMainnet, timeIntervalKey, getSeriesData, getSeriesType, dataGrouping, MetadataByKeys, focusEnabled, theme, metric_id]);

  return (
    <MetricSeriesContext.Provider
      value={{
        seriesData: seriesData,
      }}
    >
      {children}
    </MetricSeriesContext.Provider>
  );
}

export const useMetricSeries = () => useContext(MetricSeriesContext);