import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";
import { useUIContext } from "@/contexts/UIContext";

import { intersection } from "lodash";
import { MasterResponse } from "@/types/api/MasterResponse";
import VerticalScrollContainer from "../VerticalScrollContainer";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { metricItems } from "@/lib/metrics";
import { GTPIcon } from "./GTPIcon";
import { GridTableHeader, GridTableHeaderCell, GridTableRow } from "./GridTable";

const AnimatedDiv = animated.div as any;

const DAMetricsTable = ({
  data,
  master,
  daLayerKeys,
  selectedDALayers,
  setSelectedDALayers,
  metric_id,
  showEthereumMainnet,
  setShowEthereumMainnet,
  timeIntervalKey,
}: {
  data: any;
  master?: MasterResponse;
  daLayerKeys: string[];
  selectedDALayers: any;
  setSelectedDALayers: any;
  metric_id: string;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  timeIntervalKey: string;
}) => {
  const { AllDALayers: DALayers, AllDALayersByKeys: DALayersByKeys } = useMaster();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [maxVal, setMaxVal] = useState<number | null>(null);

  const [lastSelectedDALayers, setLastSelectedDALayers] = useSessionStorage(
    "lastSelectedDALayers",
    DALayers.map((daLayer) => daLayer.key),
  );

  const daLayerSelectToggleState = useMemo(() => {
    if (
      intersection(selectedDALayers, daLayerKeys).length === 1 &&
      showEthereumMainnet
    )
      return "none";
    if (
      intersection(selectedDALayers, daLayerKeys).length === 0 &&
      !showEthereumMainnet
    )
      return "none";

    if (intersection(selectedDALayers, daLayerKeys).length === daLayerKeys.length)
      return "all";

    return "normal";

    // ethereum always selected
    if (selectedDALayers.length === 1) return "none";

    if (selectedDALayers.length === daLayerKeys.length) return "all";

    return "normal";
  }, [daLayerKeys, selectedDALayers]);

  const onChainSelectToggle = useCallback(() => {
    // if all daLayers are selected, unselect all
    if (daLayerSelectToggleState === "all") {
      setSelectedDALayers(["ethereum"]);
    }

    // if no daLayers are selected, select last selected daLayers
    if (daLayerSelectToggleState === "none") {
      setSelectedDALayers(lastSelectedDALayers);
    }

    // if some daLayers are selected, select all daLayers
    if (daLayerSelectToggleState === "normal") {
      setSelectedDALayers(daLayerKeys);
    }
  }, [
    daLayerSelectToggleState,
    daLayerKeys,
    lastSelectedDALayers,
    setSelectedDALayers,
  ]);

  const handleChainClick = useCallback(
    (daLayerKey: string) => {
      if (daLayerKey === "ethereum") {
        if (showEthereumMainnet) {
          setShowEthereumMainnet(false);
        } else {
          setShowEthereumMainnet(true);
        }
        return;
      }

      let selected = [...selectedDALayers];

      if (selectedDALayers.includes(daLayerKey)) {
        selected = selected.filter((c) => c !== daLayerKey);
      } else {
        selected = [...selected, daLayerKey];
      }

      setLastSelectedDALayers(selected);
      setSelectedDALayers(selected);
    },

    [
      selectedDALayers,
      setLastSelectedDALayers,
      setSelectedDALayers,
      setShowEthereumMainnet,
      showEthereumMainnet,
    ],
  );

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const { theme } = useTheme();

  const [showGwei, reversePerformer] = useMemo(() => {
    const item = metricItems.find((item) => item.key === metric_id);

    return [item?.page?.showGwei, item?.page?.reversePerformer];
  }, [metric_id]);

  const { isSidebarOpen, isSafariBrowser } = useUIContext();

  const changesKey = useMemo(() => {
    if (timeIntervalKey === "monthly") {
      return "changes_monthly";
    }

    return "changes";
  }, [timeIntervalKey]);

  const lastValueTimeIntervalKey = useMemo(() => {
    if (timeIntervalKey === "daily_7d_rolling") {
      return "daily";
    }

    return timeIntervalKey;
  }, [timeIntervalKey]);

  const valueIndex = useMemo(() => {
    if (!data) return;

    const sampleChainDataTypes =
      data[Object.keys(data)[0]][lastValueTimeIntervalKey].types;

    if (sampleChainDataTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainDataTypes.indexOf("usd");
      } else {
        return sampleChainDataTypes.indexOf("eth");
      }
    } else {
      return 1;
    }
  }, [data, showUsd, lastValueTimeIntervalKey]);

  const changesValueIndex = useMemo(() => {
    if (!data) return;

    const sampleChainChangesTypes =
      data[Object.keys(data)[0]][changesKey].types;

    if (sampleChainChangesTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainChangesTypes.indexOf("usd");
      } else {
        return sampleChainChangesTypes.indexOf("eth");
      }
    } else {
      return 0;
    }
  }, [changesKey, data, showUsd]);

  const lastValues = useMemo(() => {
    if (!data) return null;

    return Object.keys(data)
      .filter((daLayer) => daLayer !== "ethereum")
      .reduce((acc, daLayer) => {
        let types = data[daLayer][lastValueTimeIntervalKey].types;
        let values =
          data[daLayer][lastValueTimeIntervalKey].data[
          data[daLayer][lastValueTimeIntervalKey].data.length - 1
          ];
        let lastVal = values[valueIndex];

        if (lastValueTimeIntervalKey === "monthly") {
          types = data[daLayer].last_30d.types;
          values = data[daLayer].last_30d.data;

          let monthlyValueIndex = 0;

          if (types.includes("usd")) {
            if (showUsd) {
              monthlyValueIndex = types.indexOf("usd");
            } else {
              monthlyValueIndex = types.indexOf("eth");
            }
          }

          lastVal = values[monthlyValueIndex];
        }

        return {
          ...acc,
          [daLayer]: lastVal,
        };
      }, {});
  }, [data, valueIndex, lastValueTimeIntervalKey, showUsd]);

  // set maxVal
  useEffect(() => {
    if (!data || !lastValues) return;

    const valuesArray = Object.values<number>(lastValues);

    const maxVal = Math.max(...valuesArray);

    setMaxVal(maxVal);
  }, [data, valueIndex, lastValueTimeIntervalKey, showUsd, lastValues]);

  const rows = useCallback(() => {
    if (!data || maxVal === null || lastValues === null) return [];

    return Object.keys(data)
      .filter(
        (daLayer) =>
          daLayer !== "ethereum" &&
          Object.keys(DALayersByKeys).includes(daLayer) &&
          DALayersByKeys[daLayer]
      )
      .map((daLayer: any) => {
        return {
          data: data[daLayer],
          daLayer: DALayersByKeys[daLayer],
          lastVal: lastValues[daLayer],
          barWidth: `${(Math.max(lastValues[daLayer], 0) / maxVal) * 100}%`,
        };
      })
      .sort((a, b) => {
        // always show ethereum at the bottom
        if (a.daLayer.key === "ethereum") return 1;
        if (b.daLayer.key === "ethereum") return -1;

        // sort by last value in daily data array and keep unselected daLayers at the bottom in descending order
        if (reversePerformer) {
          if (selectedDALayers.includes(a.daLayer.key)) {
            if (selectedDALayers.includes(b.daLayer.key)) {
              return a.lastVal - b.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedDALayers.includes(b.daLayer.key)) {
              return 1;
            } else {
              return a.lastVal - b.lastVal;
            }
          }
        } else {
          if (selectedDALayers.includes(a.daLayer.key)) {
            if (selectedDALayers.includes(b.daLayer.key)) {
              return b.lastVal - a.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedDALayers.includes(b.daLayer.key)) {
              return 1;
            } else {
              return b.lastVal - a.lastVal;
            }
          }
        }
      });
  }, [data, maxVal, lastValues, reversePerformer, selectedDALayers]);

  let height = 0;
  const transitions = useTransition(
    rows()
      .map((data) => ({
        ...data,
        y: (height += 37) - 37,
        height: 37,
      })),
    {
      key: (d) => d.daLayer.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  function formatNumber(number: number, decimals?: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e9) {
      if (Math.abs(number) >= 1e12) {
        return (number / 1e12).toFixed(2) + "T";
      } else if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + "B";
      }
    } else if (Math.abs(number) >= 1e6) {
      return (number / 1e6).toFixed(2) + "M";
    } else if (Math.abs(number) >= 1e3) {
      const rounded = (number / 1e3).toFixed(2);
      return `${rounded}${Math.abs(number) >= 10000 ? "k" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(decimals ? decimals : 2);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(decimals ? decimals : 2);
    } else {
      return number.toFixed(decimals ? decimals : 2);
    }

    // Default return if none of the conditions are met
    return "";
  }

  const getDisplayValue = useCallback(
    (item: any) => {
      if (!lastValues || !master) return { value: "0", prefix: "", suffix: "" };

      if (!master.da_metrics[metric_id]) return { value: lastValues[item.daLayer.key], prefix: "", suffix: "" };

      const units = Object.keys(master.da_metrics[metric_id].units);
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");

      let prefix = master.da_metrics[metric_id].units[unitKey].prefix
        ? master.da_metrics[metric_id].units[unitKey].prefix
        : "";
      let suffix = master.da_metrics[metric_id].units[unitKey].suffix
        ? master.da_metrics[metric_id].units[unitKey].suffix
        : "";
      const decimals =
        showGwei && !showUsd
          ? 2
          : master.da_metrics[metric_id].units[unitKey].decimals;

      let types = item.data[lastValueTimeIntervalKey].types;
      let values =
        item.data[lastValueTimeIntervalKey].data[
        item.data[lastValueTimeIntervalKey].data.length - 1
        ];
      // let value = formatNumber(
      //   item.data[lastValueTimeIntervalKey].data[
      //     item.data[lastValueTimeIntervalKey].data.length - 1
      //   ][1],
      // );

      if (lastValueTimeIntervalKey === "monthly") {
        types = item.data.last_30d.types;
        values = item.data.last_30d.data;
        // value = formatNumber(values[0]);
      }

      let value = formatNumber(lastValues[item.daLayer.key], decimals);

      if (types.includes("eth")) {
        if (!showUsd) {
          let navItem = metricItems.find((item) => item.key === metric_id);

          if (navItem && navItem.page?.showGwei) {
            prefix = "";
            suffix = " Gwei";
            value = formatNumber(
              values[types.indexOf("eth")] * 1000000000,
              decimals,
            );
          }
        } else {
          value = formatNumber(values[types.indexOf("usd")], decimals);
        }
      }
      return { value, prefix, suffix };
    },
    [lastValueTimeIntervalKey, lastValues, metric_id, showUsd],
  );

  const timespanLabels = {
    "1d": "24h",
    "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  const timespanLabelsMonthly = {
    "30d": "1 month",
    "90d": "3 months",
    "180d": "6 months",
    "365d": "1 year",
  };

  return (
    <HorizontalScrollContainer
      // className="flex flex-col mt-3 md:mt-0 ml-0 lg:-ml-2 font-semibold space-y-[5px] z-100 w-full py-5"
      includeMargin={false}
    >
      <div className="relative min-w-[570px] md:min-w-[600px] lg:min-w-full pr-[20px] md:pr-[50px] lg:pr-2 w-full">

        {/* <div
          className="h-auto overflow-y-hidden lg:h-[426px] lg:overflow-y-scroll overflow-x-visible relative  scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
          style={{
            direction: "rtl",
          }}
        > */}
        <div className="pr-[25px] pb-[3px] relative">

          <GridTableHeader
            gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
            className="text-[14px] gap-x-[10px] !font-bold z-[2] !pl-[5px] !pr-[31px] !pt-0 !pb-0 h-[34px] select-none flex items-center"
          >
            <GridTableHeaderCell>
              <div></div>
            </GridTableHeaderCell>
            <GridTableHeaderCell className="truncate">
              Yesterday
            </GridTableHeaderCell>
            <GridTableHeaderCell justify="end">
              24h
            </GridTableHeaderCell>
            <GridTableHeaderCell justify="end">
              7 days
            </GridTableHeaderCell>
            <GridTableHeaderCell justify="end">
              30 days
            </GridTableHeaderCell>
            <GridTableHeaderCell justify="end">
              1 year
            </GridTableHeaderCell>
          </GridTableHeader>
          <div
            className={`absolute top-[5px] right-[15px] cursor-pointer`}
            onClick={onChainSelectToggle}
          >
            <div
              className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                color:
                  daLayerSelectToggleState === "all" ? undefined : "#5A6462",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-6 h-6 ${daLayerSelectToggleState === "none"
                  ? "opacity-100"
                  : "opacity-0"
                  }`}
              >
                <circle
                  xmlns="http://www.w3.org/2000/svg"
                  cx="12"
                  cy="12"
                  r="8"
                />
              </svg>
            </div>
            <div
              className={`p-1 rounded-full ${daLayerSelectToggleState === "none"
                ? "bg-forest-50 dark:bg-color-bg-default"
                : "bg-white dark:bg-color-ui-active"
                }`}
            >
              <Icon
                icon="feather:check-circle"
                className={`w-[17.65px] h-[17.65px] ${daLayerSelectToggleState === "none"
                  ? "opacity-0"
                  : "opacity-100"
                  }`}
                style={{
                  color:
                    daLayerSelectToggleState === "all"
                      ? undefined
                      : daLayerSelectToggleState === "normal"
                        ? "#5A6462"
                        : "#5A6462",
                }}
              />
            </div>
          </div>
        </div>
        <VerticalScrollContainer
          height={!isMobile ? 381 : daLayerKeys.length * 45}
          paddingRight={22}
        // scrollbarWidth={22}
        // scrollbarAbsolute={true}
        // className="pr-[10px] lg:pr-8"
        // paddingRight={22}
        // className="lg:max-h-[381px] overflow-x-visible lg:overflow-y-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-[10px] lg:pr-8"
        // style={{ direction: "ltr" }}
        >
          {transitions((style, item, t, index) => (
            <AnimatedDiv
              className="absolute w-full pr-[25px] select-none"
              style={{ zIndex: Object.keys(data).length - index, ...style, }}
            >
              <div className="relative group">
                <GridTableRow
                  key={item.daLayer.key}
                  gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                  className={`text-[14px] gap-x-[10px] z-[2] !pl-[5px] !pr-[31px] !pt-0 !pb-0 h-[34px] select-none flex items-center cursor-pointer ${selectedDALayers.includes(item.daLayer.key)
                    ? "border-black/[16%] dark:border-[#5A6462] group-hover:bg-forest-500/10"
                    : "border-black/[16%] dark:border-[#5A6462] group-hover:bg-forest-500/5 transition-all duration-100"
                    }`}

                  onClick={() => handleChainClick(item.daLayer.key)}
                >
                  <div className="flex items-center justify-center size-[26px]">
                    <Icon
                      icon={`gtp:${item.daLayer.key.replace("_", "-").replace("_", "-")}-logo-monochrome`}
                      className="size-[15px]"
                      style={{
                        color: selectedDALayers.includes(item.daLayer.key)
                          ? item.daLayer.colors[theme ?? "dark"][1]
                          : "#5A6462",
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex w-full items-baseline text-sm font-bold leading-[120%]">
                        {getDisplayValue(item).prefix && (
                          <div className="text-[14px] font-bold mr-[1px]">
                            {getDisplayValue(item).prefix}
                          </div>
                        )}
                        {getDisplayValue(item).value}
                        {getDisplayValue(item).suffix && (
                          <div className="text-[14px] font-bold ml-0.5">
                            {getDisplayValue(item).suffix}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/daLayers/${item.daLayer.key}`}
                        className={`truncate font-medium leading-snug text-ellipsis overflow-hidden hover:underline max-w-fit text-[10px]`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.daLayer.name}
                      </Link>
                    </div>
                  </div>
                  {Object.keys(
                    timeIntervalKey === "monthly"
                      ? timespanLabelsMonthly
                      : timespanLabels,
                  ).map((timespan) => (
                    <div key={timespan} className="w-full text-right">
                      {item.data[changesKey][timespan][changesValueIndex] ===
                        null ? (
                        <span className="text-gray-500 text-center inline-block">
                          —
                        </span>
                      ) : (
                        <>
                          {(reversePerformer ? -1.0 : 1.0) *
                            item.data[changesKey][timespan][
                            changesValueIndex
                            ] >=
                            0 ? (
                            <div
                              className={`text-[#45AA6F] dark:text-color-positive font-medium`}
                              style={{
                                color: selectedDALayers.includes(item.daLayer.key)
                                  ? undefined
                                  : "#5A6462",
                              }}
                            >
                              {reversePerformer ? "-" : "+"}
                              {(() => {
                                const rawPercentage = Math.abs(
                                  Math.round(
                                    item.data[changesKey][timespan][
                                    changesValueIndex
                                    ] * 1000,
                                  ) / 10,
                                ).toFixed(1);

                                const percentage = parseFloat(rawPercentage);

                                if (!isNaN(percentage)) {
                                  // if (Math.abs(percentage) >= 1000)
                                  //   return formatNumber(percentage);

                                  const formattedPercentage =
                                    percentage.toFixed(1);

                                  return formattedPercentage.length >= 4
                                    ? Math.floor(percentage)
                                    : formattedPercentage;
                                } else {
                                  return "Invalid Percentage";
                                }
                              })()}
                              %
                            </div>
                          ) : (
                            <div
                              className={`text-[#DD3408] dark:text-color-negative font-medium`}
                              style={{
                                color: selectedDALayers.includes(item.daLayer.key)
                                  ? undefined
                                  : "#5A6462",
                              }}
                            >
                              {reversePerformer ? "+" : "-"}
                              {
                                Math.abs(
                                  Math.round(
                                    item.data[changesKey][timespan][
                                    changesValueIndex
                                    ] * 1000,
                                  ) / 10,
                                ).toFixed(1)
                              }
                              %
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </GridTableRow>
                <div
                  className={`absolute cursor-pointer top-0 right-[-15px]`}
                  onClick={() => handleChainClick(item.daLayer.key)}
                >
                  <div
                    className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      color: selectedDALayers.includes(item.daLayer.key)
                        ? undefined
                        : "#5A6462",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-6 h-6 ${item.daLayer.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-0"
                          : "opacity-100"
                        : selectedDALayers.includes(item.daLayer.key)
                          ? "opacity-0"
                          : "opacity-100"
                        }`}
                    >
                      <circle
                        xmlns="http://www.w3.org/2000/svg"
                        cx="12"
                        cy="12"
                        r="10"
                      />
                    </svg>
                  </div>
                  <div
                    className={`p-1 rounded-full ${selectedDALayers.includes(item.daLayer.key)
                      ? "bg-white dark:bg-color-ui-active"
                      : "bg-forest-50 dark:bg-color-bg-default"
                      }`}
                  >
                    <Icon
                      icon="feather:check-circle"
                      className={`w-6 h-6 ${item.daLayer.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-100"
                          : "opacity-0"
                        : selectedDALayers.includes(item.daLayer.key)
                          ? "opacity-100"
                          : "opacity-0"
                        }`}
                      style={{
                        color: selectedDALayers.includes(item.daLayer.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    />
                  </div>
                </div>
              </div>
            </AnimatedDiv>
          ))}

          {/* <div
            className="w-full relative"
            style={{ height: height, direction: "ltr" }}
          // style={{ height: height, direction: "ltr" }}
          >
            {transitions((style, item, t, index) => (
              <AnimatedDiv
                className="absolute w-full select-none"
                style={{ zIndex: Object.keys(data).length - index, ...style }}
              >
                <div
                  key={item.daLayer.key}
                  className={`flex items-center justify-between p-1.5 pl-4 py-[4px] lg:pr-2 lg:py-[10.5px] lg:pl-2 rounded-full w-full font-[400] border-[1px] whitespace-nowrap text-xs lg:text-[0.95rem] cursor-pointer group relative
              ${item.daLayer.key === "ethereum"
                      ? showEthereumMainnet
                        ? "border-black/[16%] dark:border-[#5A6462] hover:border hover:p-1.5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px] hover:lg:p-3 hover:lg:py-[7px]"
                        : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 p-[7px] py-[4px] lg:p-[13px] lg:py-[8px]"
                      : selectedDALayers.includes(item.daLayer.key)
                        ? "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/10"
                        : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 transition-all duration-100"
                    } `}
                  onClick={() => handleChainClick(item.daLayer.key)}
                >
                  <div className="w-full h-full absolute left-0 bottom-0 rounded-full overflow-clip pointer-events-none">
                    <div className="relative w-full h-full">
                      {item.daLayer.key !== "ethereum" && (
                        <>
                          <div
                            className={`absolute left-[15px] right-[15px] lg:left-[18px] lg:right-[18px] bottom-[0px] h-[1px] lg:h-[2px] rounded-none font-semibold transition-width duration-300 `}
                            style={{
                              background: selectedDALayers.includes(
                                item.daLayer.key,
                              )
                                ? item.daLayer.colors[theme ?? "dark"][1]
                                : "#5A6462",
                              width: item.barWidth,
                            }}
                          ></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`flex ${isSidebarOpen ? "w-1/4 2xl:w-1/3" : "w-1/3"
                      } items-center pl-[44px] lg:pl-[52px]`}
                    style={{
                      color: selectedDALayers.includes(item.daLayer.key)
                        ? undefined
                        : "#5A6462",
                    }}
                  >
                    <Icon
                      icon={`gtp:${item.daLayer.key.replace("_", "-").replace("_", "-")}-logo-monochrome`}
                      className="absolute left-[12px] lg:left-[17px] w-[29px] h-[29px]"
                      style={{
                        color: selectedDALayers.includes(item.daLayer.key)
                          ? item.daLayer.colors[theme ?? "dark"][1]
                          : "#5A6462",
                      }}
                    />
                    <div className="flex-1 break-inside-avoid">
                      <div className="flex-1 flex flex-col">
                        <div className="flex w-full items-baseline text-sm font-bold leading-snug">
                          {getDisplayValue(item).prefix && (
                            <div className="text-[13px] font-normal mr-[1px] leading-snug">
                              {getDisplayValue(item).prefix}
                            </div>
                          )}
                          {getDisplayValue(item).value}
                          {getDisplayValue(item).suffix && (
                            <div className="text-[13px] font-normal ml-0.5 leading-snug">
                              {getDisplayValue(item).suffix}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/daLayers/${item.daLayer.key}`}
                          className={`font-medium leading-snug text-ellipsis overflow-hidden hover:underline max-w-fit ${isSidebarOpen
                            ? "text-[10px] 2xl:text-xs"
                            : "text-xs"
                            }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.daLayer.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${isSidebarOpen ? "w-3/4 2xl:w-2/3" : "w-2/3"
                      } flex pr-4 font-medium`}
                  >
                    {Object.keys(
                      timeIntervalKey === "monthly"
                        ? timespanLabelsMonthly
                        : timespanLabels,
                    ).map((timespan) => (
                      <div
                        key={timespan}
                        className={`text-right  
                      ${isSidebarOpen
                            ? "w-1/3 text-sm 2xl:text-base 2xl:w-1/4"
                            : "w-1/4 text-base"
                          }
                      ${isSidebarOpen &&
                            (timespan === "7d" || timespan === "90d")
                            ? "hidden 2xl:block"
                            : ""
                          }`}
                      >
                        {item.data[changesKey][timespan][changesValueIndex] ===
                          null ? (
                          <span className="text-gray-500 text-center mx-4 inline-block">
                            —
                          </span>
                        ) : (
                          <>
                            {(reversePerformer ? -1.0 : 1.0) *
                              item.data[changesKey][timespan][
                              changesValueIndex
                              ] >=
                              0 ? (
                              <div
                                className={`text-[#45AA6F] dark:text-color-positive ${Math.abs(
                                  item.data[changesKey][timespan][
                                  changesValueIndex
                                  ],
                                ) >= 10
                                  ? "lg:text-[13px] lg:font-[550] 2xl:text-[14px] 2xl:font-[600]"
                                  : ""
                                  }`}
                                style={{
                                  color: selectedDALayers.includes(item.daLayer.key)
                                    ? undefined
                                    : "#5A6462",
                                }}
                              >
                                {reversePerformer ? "-" : "+"}
                                {(() => {
                                  const rawPercentage = Math.abs(
                                    Math.round(
                                      item.data[changesKey][timespan][
                                      changesValueIndex
                                      ] * 1000,
                                    ) / 10,
                                  ).toFixed(1);

                                  const percentage = parseFloat(rawPercentage);

                                  if (!isNaN(percentage)) {
                                    // if (Math.abs(percentage) >= 1000)
                                    //   return formatNumber(percentage);

                                    const formattedPercentage =
                                      percentage.toFixed(1);

                                    return formattedPercentage.length >= 4
                                      ? Math.floor(percentage)
                                      : formattedPercentage;
                                  } else {
                                    return "Invalid Percentage";
                                  }
                                })()}
                                %
                              </div>
                            ) : (
                              <div
                                className={`text-[#DD3408] dark:text-color-negative ${Math.abs(
                                  item.data[changesKey][timespan][
                                  changesValueIndex
                                  ],
                                ) >= 10
                                  ? "lg:text-[13px] lg:font-[550]  2xl:text-[14px] 2xl:font-[600]"
                                  : ""
                                  }`}
                                style={{
                                  color: selectedDALayers.includes(item.daLayer.key)
                                    ? undefined
                                    : "#5A6462",
                                }}
                              >
                                {reversePerformer ? "+" : "-"}
                                {
                                  Math.abs(
                                    Math.round(
                                      item.data[changesKey][timespan][
                                      changesValueIndex
                                      ] * 1000,
                                    ) / 10,
                                  ).toFixed(1)
                                }
                                %
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    className={`absolute cursor-pointer ${item.daLayer.key === "ethereum"
                      ? showEthereumMainnet
                        ? "-right-[19px] group-hover:-right-[20px]"
                        : "-right-[19px]"
                      : "-right-[20px]"
                      }`}
                    onClick={() => handleChainClick(item.daLayer.key)}
                  >
                    <div
                      className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        color: selectedDALayers.includes(item.daLayer.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-6 h-6 ${item.daLayer.key === "ethereum"
                          ? showEthereumMainnet
                            ? "opacity-0"
                            : "opacity-100"
                          : selectedDALayers.includes(item.daLayer.key)
                            ? "opacity-0"
                            : "opacity-100"
                          }`}
                      >
                        <circle
                          xmlns="http://www.w3.org/2000/svg"
                          cx="12"
                          cy="12"
                          r="10"
                        />
                      </svg>
                    </div>
                    <div
                      className={`p-1 rounded-full ${selectedDALayers.includes(item.daLayer.key)
                        ? "bg-white dark:bg-color-ui-active"
                        : "bg-forest-50 dark:bg-color-bg-default"
                        }`}
                    >
                      <Icon
                        icon="feather:check-circle"
                        className={`w-6 h-6 ${item.daLayer.key === "ethereum"
                          ? showEthereumMainnet
                            ? "opacity-100"
                            : "opacity-0"
                          : selectedDALayers.includes(item.daLayer.key)
                            ? "opacity-100"
                            : "opacity-0"
                          }`}
                        style={{
                          color: selectedDALayers.includes(item.daLayer.key)
                            ? undefined
                            : "#5A6462",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </AnimatedDiv>
            ))}
          </div> */}
        </VerticalScrollContainer>
        {/* </div> */}
      </div>
    </HorizontalScrollContainer>
  );
};

export default DAMetricsTable;
