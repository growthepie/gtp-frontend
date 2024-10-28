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

  const { data, chainKeys, metric_id, avg } = useMetricData();
  const { selectedChains, selectedTimeInterval, selectedTimespan, timeIntervalKey, selectedScale, showEthereumMainnet } = useMetricChartControls();

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
      if (name === "ethereum") {
        // show column chart for ethereum if monthly and stacked
        if (selectedTimeInterval === "monthly" && selectedScale === "stacked")
          return "column";
        // else show area
        return "area";
      }
      if (selectedScale === "percentage") return "area";
      if (selectedScale === "stacked")
        return selectedTimeInterval === "daily" ? "area" : "column";

      return "line";
    },
    [selectedScale, selectedTimeInterval],
  );

  const MetadataByKeys = useMemo(() => {
    return merge(AllChainsByKeys, AllDALayersByKeys);
  }, [AllChainsByKeys, AllDALayersByKeys]);

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

      let seriesFill = "transparent";

      if (isAreaChart) {
        seriesFill = MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "33";
      }

      if (isAreaChart) {
        seriesFill = MetadataByKeys[name]?.colors[theme ?? "dark"][0] + "33";
      }

      let fillColor =
        selectedTimeInterval === "daily"
          ? MetadataByKeys[name]?.colors[theme ?? "dark"][0]
          : undefined;
      let color =
        selectedTimeInterval === "daily"
          ? MetadataByKeys[name]?.colors[theme ?? "dark"][0]
          : undefined;

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

      if (selectedTimeInterval === "daily") {
        return {
          data: seriesData,
          zoneAxis,
          zones,
          fillColor: seriesFill,
          fillOpacity,
          color,
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

      const todaysDate = new Date().getUTCDate();

      const secondZoneDottedColumnColor =
        todaysDate === 1 ? columnColor : dottedColumnColor;

      const secondZoneDashStyle = todaysDate === 1 ? "Solid" : "Dot";

      // if it is not the last day of the month, add a zone to the chart to indicate that the data is incomplete
      if (seriesData.length > 2 && new Date().getUTCDate() !== 1 && selectedTimeInterval === "monthly") {
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

      return {
        data: seriesData,
        zoneAxis,
        zones,
        fillColor,
        fillOpacity,
        color,
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

    const pointsSettings = {
      pointPlacement:
        selectedTimeInterval === "monthly" &&
          selectedScale === "stacked"
          ? 0
          : 0.5,
    };


    const chainDataKeys = metric_type === "fundamentals" ? chainKeys.filter((chainKey) =>
      selectedChains.includes(chainKey) && SupportedChainKeys.includes(chainKey)
    ) : chainKeys.filter((chainKey) => selectedChains.includes(chainKey));

    const d = chainDataKeys.sort((a, b) => {
      if (selectedScale === "stacked" || selectedScale === "percentage") {
        const aData = data.chains[a][timeIntervalKey].data;
        const bData = data.chains[b][timeIntervalKey].data;
        // sort by the time of the first data point so that the series are stacked in the correct order
        return bData[0][0] - aData[0][0];
      }
      // else keep the order of the series the same
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

        zIndex: zIndex,
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
        borderRadiusTopLeft: borderRadius,
        borderRadiusTopRight: borderRadius,
        fillOpacity: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .fillOpacity,
        fillColor: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .fillColor,
        color: getSeriesData(chainKey, chain[timeIntervalKey].types, chain[timeIntervalKey].data)
          .color,
        borderColor:
          MetadataByKeys[chainKey]?.colors[theme ?? "dark"][0],
        borderWidth: 1,
        lineWidth: 2,
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
        ...// @ts-ignore
        (["area", "line"].includes(getSeriesType(chainKey))
          ? {
            shadow: {
              color:
                MetadataByKeys[chainKey]?.colors[
                theme ?? "dark"
                ][1] + "FF",
              width: 10,
            },
          }
          : chainKey === "all_l2s"
            ? {
              borderColor: "transparent",
              shadow: "none",
            }
            : {
              borderColor: "transparent",
              shadow: "none",

            }),
      };
    });

    console.log("d", d);

    return d;
  }, [data, selectedTimeInterval, selectedScale, chainKeys, metric_type, selectedChains, SupportedChainKeys, showEthereumMainnet, timeIntervalKey, getSeriesData, getSeriesType, dataGrouping, MetadataByKeys, theme]);

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