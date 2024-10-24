import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useTransition, animated } from "@react-spring/web";
import { useUIContext } from "@/contexts/UIContext";

import { difference, intersection } from "lodash";
import { MasterResponse } from "@/types/api/MasterResponse";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { metricItems } from "@/lib/metrics";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GridTableContainer, GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useMetricData } from "./MetricDataContext";


const MetricTable = ({
  metric_type,
}: {
  metric_type: "fundamentals" | "data-availability";
}) => {
  const { data: master, metrics, da_metrics } = useMaster();

  const metricsDict = metric_type === "fundamentals" ? metrics : da_metrics;

  const { data, chainKeys, type, allChains, allChainsByKeys, metric_id, timeIntervals } = useMetricData();
  const { selectedChains, setSelectedChains, lastSelectedChains, setLastSelectedChains, showEthereumMainnet, setShowEthereumMainnet, timeIntervalKey } = useMetricChartControls();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [maxVal, setMaxVal] = useState<number | null>(null);

  const chainSelectToggleState = useMemo(() => {
    console.log("chainKeys", chainKeys);
    console.log("selectedChains", selectedChains);
    console.log("showEthereumMainnet", showEthereumMainnet);

    console.log("intersection(selectedChains, chainKeys)", intersection(selectedChains, chainKeys));

    console.log("intersection(selectedChains, chainKeys).length", intersection(selectedChains, chainKeys).length);
    console.log("chainKeys.length", chainKeys.length);

    console.log("diff(selectedChains, chainKeys)", difference(selectedChains, chainKeys));

    if (
      intersection(selectedChains, chainKeys).length === 1 &&
      showEthereumMainnet
    )
      return "none";
    if (
      intersection(selectedChains, chainKeys).length === 0 &&
      !showEthereumMainnet
    )
      return "none";

    if (chainKeys.includes("ethereum")) {
      if (intersection(selectedChains, chainKeys).length >= chainKeys.length - 1)
        return "all";
    } else {
      if (intersection(selectedChains, chainKeys).length === chainKeys.length)
        return "all";
    }

    return "normal";
  }, [chainKeys, selectedChains, showEthereumMainnet]);

  const onChainSelectToggle = useCallback(() => {
    // if all chains are selected, unselect all
    if (chainSelectToggleState === "all") {
      setSelectedChains(["ethereum"]);
    }

    // if no chains are selected, select last selected chains
    if (chainSelectToggleState === "none") {
      setSelectedChains(lastSelectedChains);
    }

    // if some chains are selected, select all chains
    if (chainSelectToggleState === "normal") {
      setSelectedChains(chainKeys);
    }
  }, [
    chainSelectToggleState,
    chainKeys,
    lastSelectedChains,
    setSelectedChains,
  ]);

  const handleChainClick = useCallback(
    (chainKey: string) => {
      if (chainKey === "ethereum") {
        if (showEthereumMainnet) {
          setShowEthereumMainnet(false);
        } else {
          setShowEthereumMainnet(true);
        }
        return;
      }

      let selected = [...selectedChains];

      if (selectedChains.includes(chainKey)) {
        selected = selected.filter((c) => c !== chainKey);
      } else {
        selected = [...selected, chainKey];
      }

      setLastSelectedChains(selected);
      setSelectedChains(selected);
    },

    [
      selectedChains,
      setLastSelectedChains,
      setSelectedChains,
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
      data.chains[Object.keys(data.chains)[0]][lastValueTimeIntervalKey].types;


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
      data.chains[Object.keys(data.chains)[0]][changesKey].types;

    console.log("sampleChainChangesTypes", sampleChainChangesTypes);

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

    return Object.keys(data.chains)
      .filter((chain) => chain !== "ethereum")
      .reduce((acc, chain) => {
        let types = data.chains[chain][lastValueTimeIntervalKey].types;
        let values =
          data.chains[chain][lastValueTimeIntervalKey].data[
          data.chains[chain][lastValueTimeIntervalKey].data.length - 1
          ];
        let lastVal = values[valueIndex];

        if (lastValueTimeIntervalKey === "monthly") {
          types = data.chains[chain].last_30d.types;
          values = data.chains[chain].last_30d.data;

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
          [chain]: lastVal,
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

    return Object.keys(data.chains)
      .filter(
        (chain) =>
          chain !== "ethereum" &&
          Object.keys(allChainsByKeys).includes(chain) &&
          allChainsByKeys[chain]
      )
      .map((chain: any) => {
        return {
          data: data.chains[chain],
          chain: allChainsByKeys[chain],
          lastVal: lastValues[chain],
          barWidth: `${(Math.max(lastValues[chain], 0) / maxVal) * 100}%`,
        };
      })
      .sort((a, b) => {
        // always show ethereum at the bottom
        if (a.chain.key === "ethereum") return 1;
        if (b.chain.key === "ethereum") return -1;

        // sort by last value in daily data array and keep unselected chains at the bottom in descending order
        if (reversePerformer) {
          if (selectedChains.includes(a.chain.key)) {
            if (selectedChains.includes(b.chain.key)) {
              return a.lastVal - b.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedChains.includes(b.chain.key)) {
              return 1;
            } else {
              return a.lastVal - b.lastVal;
            }
          }
        } else {
          if (selectedChains.includes(a.chain.key)) {
            if (selectedChains.includes(b.chain.key)) {
              return b.lastVal - a.lastVal;
            } else {
              return -1;
            }
          } else {
            if (selectedChains.includes(b.chain.key)) {
              return 1;
            } else {
              return b.lastVal - a.lastVal;
            }
          }
        }
      });
  }, [data, maxVal, lastValues, reversePerformer, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows()
      .map((data) => ({
        ...data,
        y: (height += 39) - 39,
        height: 39,
      })),
    {
      key: (d) => d.chain.key,
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

      if (!master) return { value: lastValues[item.chain.key], prefix: "", suffix: "" };

      // if (!master.da_metrics[metric_id]) return { value: lastValues[item.chain.key], prefix: "", suffix: "" };


      const units = metricsDict[metric_id].units;
      const unitKeys = Object.keys(units);

      // const units = [];

      if (unitKeys.length === 0) return { value: lastValues[item.chain.key], prefix: "", suffix: "" };

      const unitKey =
        unitKeys.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");

      let prefix = units[unitKey].prefix
        ? units[unitKey].prefix
        : "";
      let suffix = units[unitKey].suffix
        ? units[unitKey].suffix
        : "";
      const decimals =
        showGwei && !showUsd
          ? 2
          : units[unitKey].decimals;

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

      let value = formatNumber(lastValues[item.chain.key], decimals);

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
    [type, lastValueTimeIntervalKey, lastValues, master, metric_id, showGwei, showUsd],
  );

  const timespanLabels = {
    "1d": "24h",
    // "7d": "7 days",
    "30d": "30 days",
    "365d": "1 year",
  };

  const timespanLabelsMonthly = {
    "30d": "1 month",
    // "90d": "3 months",
    "180d": "6 months",
    "365d": "1 year",
  };

  if (!data) return null;

  return (
    <HorizontalScrollContainer
      includeMargin={false}
    >
      <VerticalScrollContainer
        height={!isMobile ? 434 : (chainKeys.length) * 39}

        scrollbarAbsolute={true}
        scrollbarPosition="right"
        header={
          <div className="hidden md:block">
            <div className="pr-[0px] md:pr-[45px] relative">
              <GridTableHeader
                gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                className="text-[12px] gap-x-[10px] !font-bold z-[2] !pl-[5px] !pr-[21px] !pt-0 !pb-0 h-[30px] select-none flex items-center"
              >
                <GridTableHeaderCell>
                  <div></div>
                </GridTableHeaderCell>
                <GridTableHeaderCell>
                  Chain
                </GridTableHeaderCell>
                <GridTableHeaderCell justify="end" className="truncate">
                  Yesterday
                </GridTableHeaderCell>
                {Object.entries(
                  timeIntervalKey === "monthly"
                    ? timespanLabelsMonthly
                    : timespanLabels,
                ).map(([timespan, label]) => (
                  <GridTableHeaderCell key={timespan} justify="end">
                    {label}
                  </GridTableHeaderCell>

                ))}


              </GridTableHeader>
              <div
                className={`absolute top-[5px] right-[34px] cursor-pointer`}
                onClick={onChainSelectToggle}
              >
                <div
                  className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    color:
                      chainSelectToggleState === "all" ? undefined : "#5A6462",
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
                    className={`w-6 h-6 ${chainSelectToggleState === "none"
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
                  className={`p-1 rounded-full ${chainSelectToggleState === "none"
                    ? "bg-forest-50 dark:bg-[#1F2726]"
                    : "bg-white dark:bg-forest-1000"
                    }`}
                >
                  <Icon
                    icon="feather:check-circle"
                    className={`w-[15px] h-[15px] ${chainSelectToggleState === "none"
                      ? "opacity-0"
                      : "opacity-100"
                      }`}
                    style={{
                      color:
                        chainSelectToggleState === "all"
                          ? undefined
                          : chainSelectToggleState === "normal"
                            ? "#5A6462"
                            : "#5A6462",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        }>
        {/* <VerticalScrollContainer
        height={!isMobile ? 434 : chainKeys.length * 39}
        paddingRight={22}

      > */}
        <div className="block md:hidden">
          <div className="pr-[45px] relative">
            <GridTableHeader
              gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
              className="text-[12px] gap-x-[10px] !font-bold z-[2] !pl-[5px] !pr-[21px] !pt-0 !pb-0 h-[30px] select-none flex items-center"
            >
              <GridTableHeaderCell>
                <div></div>
              </GridTableHeaderCell>
              <GridTableHeaderCell>
                Chain
              </GridTableHeaderCell>
              <GridTableHeaderCell justify="end" className="truncate">
                Yesterday
              </GridTableHeaderCell>
              {Object.entries(
                timeIntervalKey === "monthly"
                  ? timespanLabelsMonthly
                  : timespanLabels,
              ).map(([timespan, label]) => (
                <GridTableHeaderCell key={timespan} justify="end">
                  {label}
                </GridTableHeaderCell>

              ))}


            </GridTableHeader>
            <div
              className={`absolute top-[5px] right-[34px] cursor-pointer`}
              onClick={onChainSelectToggle}
            >
              <div
                className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  color:
                    chainSelectToggleState === "all" ? undefined : "#5A6462",
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
                  className={`w-6 h-6 ${chainSelectToggleState === "none"
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
                className={`p-1 rounded-full ${chainSelectToggleState === "none"
                  ? "bg-forest-50 dark:bg-[#1F2726]"
                  : "bg-white dark:bg-forest-1000"
                  }`}
              >
                <Icon
                  icon="feather:check-circle"
                  className={`w-[15px] h-[15px] ${chainSelectToggleState === "none"
                    ? "opacity-0"
                    : "opacity-100"
                    }`}
                  style={{
                    color:
                      chainSelectToggleState === "all"
                        ? undefined
                        : chainSelectToggleState === "normal"
                          ? "#5A6462"
                          : "#5A6462",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: `${rows().length * 37}px` }}>
          {transitions((style, item, t, index) => (
            <animated.div
              className="absolute w-full pr-[45px] select-none"
              style={{ zIndex: Object.keys(data.chains).length - index, ...style, }}
            >
              <div className="relative group">
                <GridTableRow
                  key={item.chain.key}
                  gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                  className={`text-[14px] gap-x-[10px] z-[2] !pl-[5px] !pr-[21px] !pt-0 !pb-0 h-[34px] select-none flex items-center cursor-pointer ${selectedChains.includes(item.chain.key)
                    ? "border-black/[16%] dark:border-[#5A6462] group-hover:bg-forest-500/10"
                    : "border-black/[16%] dark:border-[#5A6462] group-hover:bg-forest-500/5 transition-all duration-100"
                    }`}

                  onClick={() => handleChainClick(item.chain.key)}
                >
                  <div className="flex items-center justify-center size-[26px]">
                    <Icon
                      icon={`gtp:${item.chain.key.replace("_", "-").replace("_", "-")}-logo-monochrome`}
                      className="size-[15px]"
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? item.chain.colors[theme ?? "dark"][1]
                          : "#5A6462",
                      }}
                    />
                  </div>
                  <div className="text-xs">
                    {metric_type === "fundamentals" ? (
                      <Link
                        href={`/chains/${item.chain.key}`}
                        className={`truncate hover:underline`}
                        prefetch={true}
                      >
                        {item.chain.label}
                      </Link>
                    ) : (
                      <div className="truncate">{item.chain.label}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex w-full justify-end numbers-xs">
                      {getDisplayValue(item).prefix && (
                        <div className="">
                          {getDisplayValue(item).prefix}
                        </div>
                      )}
                      {getDisplayValue(item).value}
                      {getDisplayValue(item).suffix && (
                        <div className="pl-0.5">
                          {getDisplayValue(item).suffix}
                        </div>
                      )}
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
                        <span className="numbers-xs text-center inline-block">
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
                              className={`numbers-xs text-positive`}
                              style={{
                                color: selectedChains.includes(item.chain.key)
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
                              className={`numbers-xs text-negative`}
                              style={{
                                color: selectedChains.includes(item.chain.key)
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
                  onClick={() => handleChainClick(item.chain.key)}
                >
                  <div
                    className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      color: selectedChains.includes(item.chain.key)
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
                      className={`w-6 h-6 ${item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-0"
                          : "opacity-100"
                        : selectedChains.includes(item.chain.key)
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
                    className={`p-1 rounded-full ${selectedChains.includes(item.chain.key)
                      ? "bg-white dark:bg-forest-1000"
                      : "bg-forest-50 dark:bg-[#1F2726]"
                      }`}
                  >
                    <Icon
                      icon="feather:check-circle"
                      className={`w-[24px] h-[24px] ${item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "opacity-100"
                          : "opacity-0"
                        : selectedChains.includes(item.chain.key)
                          ? "opacity-100"
                          : "opacity-0"
                        }`}
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? undefined
                          : "#5A6462",
                      }}
                    />
                  </div>
                </div>
              </div>
            </animated.div>
          ))}
        </div>
        {/* </VerticalScrollContainer> */}
      </VerticalScrollContainer>

    </HorizontalScrollContainer>
  );
};

export default MetricTable;
