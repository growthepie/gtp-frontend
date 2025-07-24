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
import { metricItems, daMetricItems } from "@/lib/metrics";
import { GTPIcon } from "@/components/layout/GTPIcon";
import {
  GridTableContainer,
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useMetricData } from "./MetricDataContext";

const MetricTable = ({
  metric_type,
}: {
  metric_type: "fundamentals" | "data-availability";
}) => {
  const {
    data: master,
    metrics,
    da_metrics,
    ChainsNavigationItemsByKeys,
  } = useMaster();

  const metricsDict = metric_type === "fundamentals" ? metrics : da_metrics;

  const {
    data,
    chainKeys,
    type,
    allChains,
    allChainsByKeys,
    metric_id,
    timeIntervals,
  } = useMetricData();
  const {
    selectedChains,
    setSelectedChains,
    lastSelectedChains,
    setLastSelectedChains,
    showEthereumMainnet,
    setShowEthereumMainnet,
    timeIntervalKey,
  } = useMetricChartControls();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [maxVal, setMaxVal] = useState<number | null>(null);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);

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

    if (chainKeys.includes("ethereum")) {
      if (
        intersection(selectedChains, chainKeys).length >=
        chainKeys.length - 1
      )
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
      if (showEthereumMainnet && focusEnabled) setSelectedChains(["ethereum"]);
      else setSelectedChains([]);
    }

    // if no chains are selected, select last selected chains
    if (chainSelectToggleState === "none") {
      if (showEthereumMainnet && focusEnabled)
        setSelectedChains([...lastSelectedChains, "ethereum"]);
      else setSelectedChains([...lastSelectedChains]);
    }

    // if some chains are selected, select all chains
    if (chainSelectToggleState === "normal") {
      setSelectedChains(chainKeys);
    }
  }, [
    chainSelectToggleState,
    showEthereumMainnet,
    setSelectedChains,
    lastSelectedChains,
    chainKeys,
  ]);

  const handleChainClick = useCallback(
    (chainKey: string) => {
      if (chainKey === "ethereum" && focusEnabled) {
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
    const item =
      metric_type === "fundamentals"
        ? metricItems.find((item) => item.key === metric_id)
        : daMetricItems.find((item) => item.key === metric_id);

    return [item?.page?.showGwei, item?.page?.reversePerformer];
  }, [metric_id, metric_type]);

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
      data.chains[chainKeys[0]][lastValueTimeIntervalKey].types;

    if (sampleChainDataTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainDataTypes.indexOf("usd");
      } else {
        return sampleChainDataTypes.indexOf("eth");
      }
    } else {
      return 1;
    }
  }, [chainKeys, data, showUsd, lastValueTimeIntervalKey]);

  const changesValueIndex = useMemo(() => {
    if (!data) return;

    const sampleChainChangesTypes = data.chains[chainKeys[0]][changesKey].types;

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

    return chainKeys
      .filter((chain) => (chain !== "ethereum" ? true : !focusEnabled))
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
  }, [chainKeys, data, valueIndex, lastValueTimeIntervalKey, showUsd, focusEnabled]);

  // set maxVal
  useEffect(() => {
    if (!data || !lastValues) return;

    const valuesArray = Object.values<number>(lastValues);

    const maxVal = Math.max(...valuesArray);

    setMaxVal(maxVal);
  }, [data, valueIndex, lastValueTimeIntervalKey, showUsd, lastValues]);

  const rows = useCallback(() => {
    if (!data || lastValues === null) return [];

    const valuesArray = Object.values<number>(lastValues);

    const maxVal = Math.max(...valuesArray);

    return chainKeys
      .filter(
        (chain) =>
          (chain !== "ethereum" ? true : !focusEnabled) &&
          Object.keys(allChainsByKeys).includes(chain) &&
          allChainsByKeys[chain],
      )
      .map((chain: any) => {

        return {
          data: data.chains[chain],
          chain: allChainsByKeys[chain],
          lastVal: lastValues[chain],
          barWidth: Math.max(lastValues[chain], 0) / maxVal,
        };
      })
      .sort((a, b) => {
        // always show ethereum at the bottom


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
  }, [
    allChainsByKeys,
    chainKeys,
    data,
    lastValues,
    reversePerformer,
    selectedChains,
    focusEnabled
  ]);

  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "lastVal",
    sortOrder: "desc",
  });

  const lastValueLabels = {
    monthly: "last 30d",
    daily: "Yesterday",
    daily_7d_rolling: "Yesterday",
  };

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

  let height = 0;
  const transitions = useTransition(
    rows().sort((a, b) => {
      const aIsSelected = selectedChains.includes(a.chain.key);
      const bIsSelected = selectedChains.includes(b.chain.key);
      if (sort.metric === "lastVal") {
        if (aIsSelected && !bIsSelected) {
          return -1;
        }
        if (!aIsSelected && bIsSelected) {
          return 1;
        }
        return sort.sortOrder === "desc" ? b.lastVal - a.lastVal : a.lastVal - b.lastVal;
      }
      else if (sort.metric === "chain") {
        if (aIsSelected && !bIsSelected) {
          return -1;
        }
        if (!aIsSelected && bIsSelected) {
          return 1;
        }
        return sort.sortOrder === "desc" ? b.chain.key.localeCompare(a.chain.key) : a.chain.key.localeCompare(b.chain.key);
      }
      // if sort.metric is a timespan, sort by the timespan value
      else if (Object.keys(timespanLabels).includes(sort.metric)) {
        const timespanIndex = Object.keys(timespanLabels).indexOf(sort.metric);
        const bVal = b.data[changesKey][Object.keys(timespanLabels)[timespanIndex]][0];
        const aVal = a.data[changesKey][Object.keys(timespanLabels)[timespanIndex]][0];

        if (aIsSelected && !bIsSelected) {
          return -1;
        }
        if (!aIsSelected && bIsSelected) {
          return 1;
        }
        if (bVal === null && aVal === null) {
          return 0;
        }
        if (bVal === null && aVal !== null) {
          return -1;
        }
        if (bVal !== null && aVal === null) {
          return 1;
        }

        return sort.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    }).map((data) => ({
      ...data,
      y: (height += 39) - 39,
      height: 39,
    })),
    {
      key: (d) => d.chain.key,
      from: ({ y, height }) => ({ opacity: 0, y, height }),
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),            // smooth reordering
      leave: ({ y, height }) => ({ opacity: 0, y, height }),

      trail: 6, // tiny cascade

      config: (item, idx, phase) => ({
        mass: 0.6,
        tension: 520,
        friction: 40,
        clamp: phase === 'leave',
        precision: 0.01,
      }),
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

      if (!master)
        return { value: lastValues[item.chain.key], prefix: "", suffix: "" };

      // if (!master.da_metrics[metric_id]) return { value: lastValues[item.chain.key], prefix: "", suffix: "" };

      const units = metricsDict[metric_id].units;
      const unitKeys = Object.keys(units);

      // const units = [];

      if (unitKeys.length === 0)
        return { value: lastValues[item.chain.key], prefix: "", suffix: "" };

      const unitKey =
        unitKeys.find((unit) => unit !== "usd" && unit !== "eth") ||
        (showUsd ? "usd" : "eth");

      let prefix = units[unitKey].prefix ? units[unitKey].prefix : "";
      let suffix = units[unitKey].suffix ? units[unitKey].suffix : "";
      const decimals = showGwei && !showUsd ? 2 : units[unitKey].decimals;

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

      let value;
      if (!focusEnabled && item.chain.key !== "ethereum") {
        value = formatNumber(lastValues[item.chain.key]);
      } else if (lastValues[item.chain.key] !== undefined) {

        value = formatNumber(lastValues[item.chain.key]);
      } else {
        value = lastValues[item.chain.key];
      }

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
    [
      lastValues,
      master,
      metricsDict,
      metric_id,
      showUsd,
      showGwei,
      lastValueTimeIntervalKey,
      focusEnabled
    ],
  );

  if (!data) return null;

  return (
    <HorizontalScrollContainer includeMargin={isMobile ? true : false}>
      <VerticalScrollContainer
        height={
          !isMobile
            ? 434
            : chainKeys.filter((chain) => chain != "ethereum").length * 39 + 45
        }
        scrollbarAbsolute={true}
        scrollbarPosition="right"
        className="w-full min-w-[503px]"
        header={
          <div className="hidden lg:block">
            <div className="relative pr-[0px] lg:pr-[45px]">
              <GridTableHeader
                gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                className="z-[20] md:z-[2] flex h-[30px] select-none items-center gap-x-[10px] !pb-0 !pl-[5px] !pr-[25px] !pt-0 text-[12px] !font-bold"
              >
                {/* Icon */}
                <GridTableHeaderCell>
                  <div></div>
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="chain"
                  className="heading-small-xxs"
                  sort={sort}
                  setSort={setSort}
                >
                  Chain
                </GridTableHeaderCell>
                {/* Last Value */}
                <GridTableHeaderCell
                  metric="lastVal"
                  justify="end"
                  className="truncate heading-small-xxs"
                  sort={sort}
                  setSort={setSort}
                >
                  {lastValueLabels[timeIntervalKey]}
                </GridTableHeaderCell>
                {/* Timespans */}
                {Object.entries(
                  timeIntervalKey === "monthly"
                    ? timespanLabelsMonthly
                    : timespanLabels,
                ).map(([timespan, label]) => (
                  <GridTableHeaderCell
                    key={timespan}
                    metric={timespan}
                    justify="end"
                    className="heading-small-xxs"
                    sort={sort}
                    setSort={setSort}
                  >
                    {label}
                  </GridTableHeaderCell>
                ))}
              </GridTableHeader>
              <div
                className={`absolute right-[34px] top-[5px] cursor-pointer`}
                onClick={onChainSelectToggle}
              >
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
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
                    className={`h-6 w-6 ${chainSelectToggleState === "none"
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
                  className={`rounded-full p-1 ${chainSelectToggleState === "none"
                      ? "bg-forest-50 dark:bg-[#1F2726]"
                      : "bg-white dark:bg-forest-1000"
                    }`}
                >
                  <Icon
                    icon="feather:check-circle"
                    className={`h-[15px] w-[15px] ${chainSelectToggleState === "none"
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
        }
      >
        {/* <VerticalScrollContainer
        height={!isMobile ? 434 : chainKeys.length * 39}
        paddingRight={22}

      > */}
        <div className="block lg:hidden">
          <div className="relative pr-[16px] lg:pr-[45px]">
            <GridTableHeader
              gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
              className="z-[2] flex h-[30px] select-none items-center gap-x-[10px] !pb-0 !pl-[5px] !pr-[25px] !pt-0 text-[12px] !font-bold"
            >
              {/* Icon */}
              <GridTableHeaderCell>
                <div></div>
              </GridTableHeaderCell>
              {/* Chain */}
              <GridTableHeaderCell
                metric="chain"
                className="heading-small-xxs"
                sort={sort}
                setSort={setSort}
              >Chain</GridTableHeaderCell>
              {/* Last Value */}
              <GridTableHeaderCell metric="lastVal" justify="end" className="truncate heading-small-xxs" sort={sort} setSort={setSort}>
                {lastValueLabels[timeIntervalKey]}
              </GridTableHeaderCell>
              {/* Timespans */}
              {Object.entries(
                timeIntervalKey === "monthly"
                  ? timespanLabelsMonthly
                  : timespanLabels,
              ).map(([timespan, label]) => (
                <GridTableHeaderCell key={timespan} metric={timespan} justify="end" className="heading-small-xxs" sort={sort} setSort={setSort}>
                  {label}
                </GridTableHeaderCell>
              ))}
            </GridTableHeader>
            <div
              className={`absolute right-[5px] top-[5px] cursor-pointer`}
              onClick={onChainSelectToggle}
            >
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
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
                  className={`h-6 w-6 ${chainSelectToggleState === "none"
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
                className={`rounded-full p-1 ${chainSelectToggleState === "none"
                    ? "bg-forest-50 dark:bg-[#1F2726]"
                    : "bg-white dark:bg-forest-1000"
                  }`}
              >
                <Icon
                  icon="feather:check-circle"
                  className={`h-[15px] w-[15px] ${chainSelectToggleState === "none"
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
          {transitions((styles, item, t, index) => (
            <animated.div
              className="absolute w-full select-none pr-[16px] lg:pr-[45px]"
              style={{
                zIndex: chainKeys.length - index,
                ...styles,
              }}
            >
              <div className="group relative">
                <GridTableRow
                  key={item.chain.key}
                  gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                  className={`z-[2] flex h-[34px] cursor-pointer select-none items-center gap-x-[10px] !pb-0 !pl-[5px] !pr-[25px] !pt-0 text-[14px] ${selectedChains.includes(item.chain.key)
                      ? "border-black/[16%] group-hover:bg-forest-500/10 dark:border-[#5A6462]"
                      : "border-black/[16%] transition-all duration-100 group-hover:bg-forest-500/5 dark:border-[#5A6462]"
                    }`}
                  onClick={() => handleChainClick(item.chain.key)}
                  bar={{
                    width: item.barWidth,
                    color: selectedChains.includes(item.chain.key)
                      ? item.chain.colors[theme ?? "dark"][1]
                      : "#5A6462",
                    containerStyle: {
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 1,
                      paddingLeft: "8px",
                      paddingRight: "8px",
                      borderRadius: "9999px 9999px 9999px 9999px",
                      zIndex: -1,
                      overflow: "hidden",
                    },
                  }}
                >
                  <div className="flex size-[26px] items-center justify-center">
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
                    {metric_type === "fundamentals" &&
                      ChainsNavigationItemsByKeys[item.chain.key] ? (
                      <Link
                        href={`/chains/${ChainsNavigationItemsByKeys[item.chain.key].urlKey}`}
                        className={`truncate hover:underline`}
                        prefetch={true}
                        onClick={(e) => e.stopPropagation()}
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
                        <div className="">{getDisplayValue(item).prefix}</div>
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
                        <span className="inline-block text-center text-gray-500 numbers-xs">
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
                              className={`text-positive numbers-xs`}
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
                              className={`text-negative numbers-xs`}
                              style={{
                                color: selectedChains.includes(item.chain.key)
                                  ? undefined
                                  : "#5A6462",
                              }}
                            >
                              {reversePerformer ? "+" : "-"}
                              {Math.abs(
                                Math.round(
                                  item.data[changesKey][timespan][
                                  changesValueIndex
                                  ] * 1000,
                                ) / 10,
                              ).toFixed(1)}
                              %
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </GridTableRow>
                <div
                  className={`absolute right-[-15px] top-0 cursor-pointer`}
                  onClick={() => handleChainClick(item.chain.key)}
                >
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full"
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
                      className={`h-6 w-6 ${selectedChains.includes(item.chain.key)
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
                    className={`rounded-full p-1 ${selectedChains.includes(item.chain.key)
                        ? "bg-white dark:bg-forest-1000"
                        : "bg-forest-50 dark:bg-[#1F2726]"
                      }`}
                  >
                    <Icon
                      icon="feather:check-circle"
                      className={`h-[24px] w-[24px] ${selectedChains.includes(item.chain.key)
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
