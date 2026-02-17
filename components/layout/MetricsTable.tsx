import { Get_SupportedChainKeys } from "@/lib/chains";
import Image from "next/image";
import { useCallback, useMemo } from "react";
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

const AnimatedDiv = animated.div as any;

const MetricsTable = ({
  data,
  master,
  chainKeys,
  selectedChains,
  setSelectedChains,
  metric_id,
  showEthereumMainnet,
  setShowEthereumMainnet,
  timeIntervalKey,
}: {
  data: any;
  master?: MasterResponse;
  chainKeys: string[];
  selectedChains: any;
  setSelectedChains: any;
  metric_id: string;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  timeIntervalKey: string;
}) => {
  const { AllChains, AllChainsByKeys } = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [lastSelectedChains, setLastSelectedChains] = useSessionStorage(
    "lastSelectedChains",
    AllChains.filter(
      (chain) =>
        (chain.ecosystem.includes("all-chains") &&
          ["arbitrum", "optimism", "base", "linea", "zksync_era"].includes(
            chain.key,
          )) ||
        chain.key === "ethereum",
    ).map((chain) => chain.key),
  );

  const chainSelectToggleState = useMemo(() => {
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

    if (intersection(selectedChains, chainKeys).length === chainKeys.length)
      return "all";

    return "normal";

    // ethereum always selected
    if (selectedChains.length === 1) return "none";

    if (selectedChains.length === chainKeys.length) return "all";

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

  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const isSafariBrowser = useUIContext((state) => state.isSafariBrowser);

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
    if (!data || Object.keys(data).length === 0) return;

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
    if (!data || Object.keys(data).length === 0) return;

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
      .filter((chain) => chain !== "ethereum")
      .reduce((acc, chain) => {
        let types = data[chain][lastValueTimeIntervalKey].types;
        let values =
          data[chain][lastValueTimeIntervalKey].data[
          data[chain][lastValueTimeIntervalKey].data.length - 1
          ];
        let lastVal = values[valueIndex];

        if (lastValueTimeIntervalKey === "monthly") {
          types = data[chain].last_30d.types;
          values = data[chain].last_30d.data;

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

  const maxVal = useMemo(() => {
    if (!data || !lastValues) return null;
    const valuesArray = Object.values<number>(lastValues);
    if (valuesArray.length === 0) return null;
    return Math.max(...valuesArray);
  }, [data, lastValues]);

  const rows = useCallback(() => {
    if (!data || maxVal === null || lastValues === null) return [];

    return Object.keys(data)
      .filter(
        (chain) =>
          chain !== "ethereum" &&
          Object.keys(AllChainsByKeys).includes(chain) &&
          AllChainsByKeys[chain].ecosystem.includes("all-chains"),
      )
      .map((chain: any) => {
        return {
          data: data[chain],
          chain: AllChainsByKeys[chain],
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
  }, [AllChainsByKeys, data, maxVal, lastValues, reversePerformer, selectedChains]);

  const rowHeight = isMobile ? 40 : 52;
  const transitionRows = useMemo(
    () =>
      rows()
        .filter((row) => {
          const name = row.chain.key;
          const supportedChainKeys = Get_SupportedChainKeys(master);
          return supportedChainKeys.includes(name);
        })
        .map((row, index) => ({
          ...row,
          y: index * rowHeight,
          height: rowHeight,
        })),
    [master, rowHeight, rows],
  );

  const tableHeight = transitionRows.length * rowHeight;

  const transitions = useTransition(
    transitionRows,
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

  const formatNumber = useCallback((number: number, decimals?: number): string => {
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
  }, []);

  const getDisplayValue = useCallback(
    (item: any) => {
      if (!lastValues || !master) return { value: "0", prefix: "", suffix: "" };
      if (!master.metrics[metric_id])
        return { value: formatNumber(lastValues[item.chain.key]), prefix: "", suffix: "" };
      const units = Object.keys(master.metrics[metric_id].units);
      const unitKey =
        units.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");

      let prefix = master.metrics[metric_id].units[unitKey].prefix
        ? master.metrics[metric_id].units[unitKey].prefix
        : "";
      let suffix = master.metrics[metric_id].units[unitKey].suffix
        ? master.metrics[metric_id].units[unitKey].suffix
        : "";
      const decimals =
        showGwei && !showUsd
          ? 2
          : master.metrics[metric_id].units[unitKey].decimals;

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
    [formatNumber, lastValueTimeIntervalKey, lastValues, master, metric_id, showGwei, showUsd],
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
      className="z-100 mt-3 ml-0 flex w-full flex-col py-5 font-semibold md:mt-0 lg:-ml-2"
      includeMargin={false}
    >
      <div className="relative min-w-[570px] md:min-w-[600px] lg:min-w-full pr-[20px] md:pr-[50px] lg:pr-2 w-full">
        <div
          className={`mt-2 flex h-[37px] items-center justify-between rounded-full px-[6px] py-[4px] text-[12px] font-semibold whitespace-nowrap text-color-text-primary lg:mt-3`}
        >
          <div
            className={`${isSidebarOpen ? "w-1/4 2xl:w-1/3" : "w-1/3"} pl-[44px] lg:pl-[52px]`}
          >
            {timeIntervalKey === "monthly" ? "Last 30d" : "Yesterday"}
          </div>
          <div
            className={`${isSidebarOpen ? "w-3/4 2xl:w-2/3" : "w-2/3"
              } flex pr-7 lg:pr-4`}
          >
            {/* <div className={`w-1/5 text-right capitalize`}>
              Current
            </div> */}
            {Object.entries(
              timeIntervalKey === "monthly"
                ? timespanLabelsMonthly
                : timespanLabels,
            ).map(([timespan, label]) => (
              <div
                key={timespan}
                className={`text-right ${isSidebarOpen ? "w-1/3 2xl:w-1/4" : "w-1/4"
                  }
                ${isSidebarOpen && (timespan === "7d" || timespan === "90d")
                    ? "hidden 2xl:block"
                    : "block"
                  }`}
              >
                {label}
              </div>
            ))}
            <div
              className={`absolute top-[8px] right-[26px] cursor-pointer md:right-[56px] lg:right-[36px]`}
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
                    ? "bg-forest-50 dark:bg-color-bg-default"
                    : "bg-white dark:bg-color-ui-active"
                  }`}
              >
                <Icon
                  icon="feather:check-circle"
                  className={`w-[17.65px] h-[17.65px] ${chainSelectToggleState === "none"
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

        {/* <div
          className="h-auto overflow-y-hidden lg:h-[426px] lg:overflow-y-scroll overflow-x-visible relative  scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
          style={{
            direction: "rtl",
          }}
        > */}
        <VerticalScrollContainer
          height={!isMobile ? 381 : chainKeys.length * 45}
          // className="pr-[10px] lg:pr-8"
          paddingRight={22}
        // className="lg:max-h-[381px] overflow-x-visible lg:overflow-y-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pr-[10px] lg:pr-8"
        // style={{ direction: "ltr" }}
        >
          <div
            className="w-full relative"
            style={{ height: tableHeight, direction: "ltr" }}
          // style={{ height: height, direction: "ltr" }}
          >
            {transitions((style, item, t, index) => (
              <AnimatedDiv
                className="absolute w-full select-none"
                style={{ zIndex: Object.keys(data).length - index, ...style }}
              >
                <div
                  key={item.chain.key}
                  className={`relative flex w-full cursor-pointer items-center justify-between rounded-full border-[1px] p-1.5 py-[3px] pl-4 text-xs font-[400] whitespace-nowrap group lg:py-[8px] lg:pl-2 lg:pr-2 lg:text-[0.95rem]
              ${item.chain.key === "ethereum"
                      ? showEthereumMainnet
                        ? "border-black/[16%] p-[7px] py-[3px] hover:border hover:p-1.5 hover:lg:px-[13px] hover:lg:py-[7px] dark:border-[#5A6462] lg:px-[13px] lg:py-[8px]"
                        : "border-black/[16%] p-[7px] py-[3px] hover:bg-forest-500/5 dark:border-[#5A6462] lg:px-[13px] lg:py-[8px]"
                      : selectedChains.includes(item.chain.key)
                        ? "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/10"
                        : "border-black/[16%] dark:border-[#5A6462] hover:bg-forest-500/5 transition-all duration-100"
                    } `}
                  onClick={() => handleChainClick(item.chain.key)}
                >
                  <div className="w-full h-full absolute left-0 bottom-0 rounded-full overflow-clip pointer-events-none">
                    <div className="relative w-full h-full">
                      {item.chain.key !== "ethereum" && (
                        <>
                          <div
                            className={`absolute left-[15px] right-[15px] lg:left-[18px] lg:right-[18px] bottom-[0px] h-[1px] lg:h-[2px] rounded-none font-semibold transition-width duration-300 `}
                            style={{
                              background: selectedChains.includes(
                                item.chain.key,
                              )
                                ? item.chain.colors[theme ?? "dark"][1]
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
                      color: selectedChains.includes(item.chain.key)
                        ? undefined
                        : "#5A6462",
                    }}
                  >
                    {/* <div
                      className={`w-[34px] h-[29px] rounded-full ${
                        item.chain.border[theme ?? "dark"][1]
                      } ${selectedChains.includes(item.chain.key) ? "" : ""}`}
                    ></div> */}
                    <Icon
                      icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                      className="absolute left-[12px] lg:left-[17px] w-[29px] h-[29px]"
                      style={{
                        color: selectedChains.includes(item.chain.key)
                          ? item.chain.colors[theme ?? "dark"][1]
                          : "#5A6462",
                      }}
                    />
                    {/* <Icon
                      icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
                      className="w-[29px] h-[29px]"
                      style={{
                        color: item.chain.colors[theme ?? "dark"][1],
                      }}
                    /> */}
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
                          href={`/chains/${item.chain.urlKey}`}
                          className={`font-medium leading-snug text-ellipsis overflow-hidden hover:underline max-w-fit ${isSidebarOpen
                              ? "text-[10px] 2xl:text-xs"
                              : "text-xs"
                            }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.chain.label}
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
                                className={`text-[#DD3408] dark:text-color-negative ${Math.abs(
                                  item.data[changesKey][timespan][
                                  changesValueIndex
                                  ],
                                ) >= 10
                                    ? "lg:text-[13px] lg:font-[550]  2xl:text-[14px] 2xl:font-[600]"
                                    : ""
                                  }`}
                                style={{
                                  color: selectedChains.includes(item.chain.key)
                                    ? undefined
                                    : "#5A6462",
                                }}
                              >
                                {reversePerformer ? "+" : "-"}
                                {
                                  // Math.abs(item.data[changesKey][timespan][0]) >= 10
                                  //   ? formatNumber(
                                  //       Math.abs(
                                  //         Math.round(
                                  //           item.data[changesKey][timespan][0] * 1000,
                                  //         ) / 10,
                                  //       ),
                                  //     )
                                  //   :
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
                    className={`absolute cursor-pointer ${item.chain.key === "ethereum"
                        ? showEthereumMainnet
                          ? "-right-[19px] group-hover:-right-[20px]"
                          : "-right-[19px]"
                        : "-right-[20px]"
                      }`}
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
                          ? "bg-white dark:bg-color-ui-active"
                          : "bg-forest-50 dark:bg-color-bg-default"
                        }`}
                    >
                      <Icon
                        icon="feather:check-circle"
                        className={`w-6 h-6 ${item.chain.key === "ethereum"
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
              </AnimatedDiv>
            ))}
          </div>
        </VerticalScrollContainer>
        {/* </div> */}
      </div>
    </HorizontalScrollContainer>
  );
};

export default MetricsTable;
