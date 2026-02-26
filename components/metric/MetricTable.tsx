import { useCallback, useMemo, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useTheme } from "next-themes";

import { intersection } from "lodash";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import { metricItems, daMetricItems } from "@/lib/metrics";
import { GTPIconName } from "@/icons/gtp-icon-names";
import ChainMetricTableRow from "@/components/layout/ChainMetricTableRow";
import {
  GridTableHeader,
} from "@/components/layout/GridTable";
import { GTPButton } from "../GTPButton/GTPButton";
import GTPScrollPane, { GTPScrollPaneScrollMetrics } from "../GTPButton/GTPScrollPane";
import { useMetricChartControls } from "./MetricChartControlsContext";
import { useMetricData } from "./MetricDataContext";
import ChartWatermark, { ChartWatermarkWithMetricName } from "../layout/ChartWatermark";

const METRIC_TABLE_GRID_TEMPLATE_COLUMNS =
  "minmax(120px, 174px) 4px minmax(60px, 2fr) minmax(44px, 1fr) minmax(44px, 1fr) minmax(44px, 1fr) 22px";

const timeIntervalSummaryKeys = {
  hourly: "last_1d",
  daily: "last_1d",
  daily_7d_rolling: "last_1d",
  weekly: "last_7d",
  monthly: "last_30d",
}

const timespanLabels: { [key: string]: { [key: string]: string } } = {
  hourly: {
    "1d": "1d",
    "3d": "3d",
    "7d": "7d",
  },
  daily: {
    "1d": "24h",
    "30d": "30d",
    "365d": "1y",
  },
  daily_7d_rolling: {
    "1d": "24h",
    "30d": "30d",
    "365d": "1y",
  },
  weekly: {
    "7d": "1w",
    "28d": "4w",
    "365d": "1y",
  },
  monthly: {
    "30d": "1m",
    "180d": "6m",
    "365d": "1y",
  },
}

const MetricTable = ({
  metric_type,
  scrollRef,
  onScrollMetricsChange,
}: {
  metric_type: "fundamentals" | "data-availability";
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScrollMetricsChange?: (metrics: GTPScrollPaneScrollMetrics) => void;
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
    allChainsByKeys,
    metric_id,
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
        intersection(selectedChains, chainKeys).length ===
        chainKeys.length
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
    focusEnabled,
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
      focusEnabled,
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

  const lastValueTimeIntervalKey = useMemo(() => {
    // hourly has no dedicated changes/summary rows — fall back to daily
    if (timeIntervalKey === "daily_7d_rolling") {
      return "daily";
    }

    return timeIntervalKey;
  }, [timeIntervalKey]);

  const changesValueIndex = useMemo(() => {
    if (!data || chainKeys.length === 0) return;

    const sampleChainKey = chainKeys.find(
      (chainKey) =>
        Array.isArray(
          data.chains[chainKey]?.changes?.[lastValueTimeIntervalKey]?.types,
        ),
    );

    if (!sampleChainKey) return 0;

    const sampleChainChangesTypes =
      data.chains[sampleChainKey]?.changes?.[lastValueTimeIntervalKey]?.types ?? [];

    if (sampleChainChangesTypes.includes("usd")) {
      if (showUsd) {
        return sampleChainChangesTypes.indexOf("usd");
      } else {
        return sampleChainChangesTypes.indexOf("eth");
      }
    } else {
      return 0;
    }
  }, [data, chainKeys, lastValueTimeIntervalKey, showUsd]);

  const lastValues = useMemo(() => {
    if (!data) return null;

    return chainKeys
      .filter((chain) => (chain !== "ethereum" ? true : !focusEnabled))
      .reduce((acc, chain) => {
        const summaryKey = timeIntervalSummaryKeys[lastValueTimeIntervalKey];
        const summary = data.chains[chain]?.summary?.[summaryKey];
        if (!summary || !Array.isArray(summary.types) || !Array.isArray(summary.data)) {
          return {
            ...acc,
            [chain]: 0,
          };
        }

        let types = summary.types;
        let values = summary.data;

        let valueIndex = 0;

        if(types.includes("usd")) {
          if (showUsd) {
            valueIndex = types.indexOf("usd");
          } else {
            valueIndex = types.indexOf("eth");
          }
        }

        let lastVal = values[valueIndex];
        if (typeof lastVal !== "number" || !Number.isFinite(lastVal)) {
          lastVal = 0;
        }

        // if (lastValueTimeIntervalKey === "monthly") {
        //   types = data.chains[chain].last_30d.types;
        //   values = data.chains[chain].last_30d.data;

        //   let monthlyValueIndex = 0;

        //   if (types.includes("usd")) {
        //     if (showUsd) {
        //       monthlyValueIndex = types.indexOf("usd");
        //     } else {
        //       monthlyValueIndex = types.indexOf("eth");
        //     }
        //   }

        //   lastVal = values[monthlyValueIndex];
        // }

        return {
          ...acc,
          [chain]: lastVal,
        };
      }, {});
  }, [chainKeys, data, lastValueTimeIntervalKey, showUsd, focusEnabled]);

  const rows = useCallback(() => {
    if (!data || lastValues === null) return [];

    const valuesArray = Object.values<number>(lastValues);
    const maxVal = valuesArray.length > 0 ? Math.max(...valuesArray) : 0;
    const safeMaxVal = Number.isFinite(maxVal) && maxVal > 0 ? maxVal : 1;


    return chainKeys
      .filter(
        (chain) =>
          (chain !== "ethereum" ? true : !focusEnabled) &&
          Object.keys(allChainsByKeys).includes(chain) &&
          allChainsByKeys[chain] &&
          (timeIntervalKey !== "hourly" ||
            (Array.isArray(data.chains[chain]?.hourly?.data) &&
              data.chains[chain].hourly!.data.length > 0)),
      )
      .map((chain: any) => {
        return {
          data: data.chains[chain],
          chain: allChainsByKeys[chain],
          lastVal: lastValues[chain],
          barWidth: Math.max(lastValues[chain], 0) / safeMaxVal < 0.004 ? 0 : Math.max(lastValues[chain], 0) / safeMaxVal,
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
    focusEnabled,
    timeIntervalKey,
  ]);

  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "lastVal",
    sortOrder: "desc",
  });

  const lastValueLabels = {
    hourly: "Latest",
    daily: "Yesterday",
    daily_7d_rolling: "Yesterday",
    monthly: "Last 30d",
    weekly: "Last 7d",
  };

  // New function to create rows with placeholders
  const rowsWithPlaceholders = useCallback(() => {
    const timespanKeys = Object.keys(timespanLabels[timeIntervalKey] ?? {});
    const sortedRows = rows().sort((a, b) => {
      const aIsSelected = selectedChains.includes(a.chain.key);
      const bIsSelected = selectedChains.includes(b.chain.key);
      if (sort.metric === "lastVal") {
        if (aIsSelected && !bIsSelected) {
          return -1;
        }
        if (!aIsSelected && bIsSelected) {
          return 1;
        }
        if (reversePerformer) {
          return sort.sortOrder === "desc" ? a.lastVal - b.lastVal : b.lastVal - a.lastVal;
        } else {
          return sort.sortOrder === "desc" ? b.lastVal - a.lastVal : a.lastVal - b.lastVal;
        }
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
      else if (timespanKeys.includes(sort.metric)) {
        const timespanIndex = timespanKeys.indexOf(sort.metric);
        const timespanKey = timespanKeys[timespanIndex];
        const bValRaw = b.data?.changes?.[lastValueTimeIntervalKey]?.[timespanKey]?.[0];
        const aValRaw = a.data?.changes?.[lastValueTimeIntervalKey]?.[timespanKey]?.[0];
        const bVal = typeof bValRaw === "number" && Number.isFinite(bValRaw) ? bValRaw : null;
        const aVal = typeof aValRaw === "number" && Number.isFinite(aValRaw) ? aValRaw : null;

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
        if (bVal === null || aVal === null) {
          return 0;
        }

        return sort.sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    // Insert placeholder items between selected and unselected chains
    const result: any[] = [];

    for (let i = 0; i < sortedRows.length; i++) {
      const current = sortedRows[i];
      const next = sortedRows[i + 1];

      // Push the current item
      result.push(current);

      // Check if we need to add a placeholder
      if (selectedChains.includes(current.chain.key) && next && !selectedChains.includes(next.chain.key)) {
        result.push({
          isPlaceholder: true,
          chain: { key: "placeholder" },
          data: null,
          lastVal: 0,
          barWidth: 0,
        });
      }
    }

    return result;
  }, [rows, selectedChains, sort.metric, sort.sortOrder, timeIntervalKey, reversePerformer, lastValueTimeIntervalKey]);

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

      const intervalData = item.data?.[lastValueTimeIntervalKey];
      let types = intervalData?.types ?? [];
      let values = intervalData?.data?.[intervalData.data.length - 1] ?? [];
      // let value = formatNumber(
      //   item.data[lastValueTimeIntervalKey].data[
      //     item.data[lastValueTimeIntervalKey].data.length - 1
      //   ][1],
      // );

      // if (lastValueTimeIntervalKey === "monthly") {
      //   types = item.data.last_30d.types;
      //   values = item.data.last_30d.data;
      //   // value = formatNumber(values[0]);
      // }

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
            const ethValue = values[types.indexOf("eth")];
            value = typeof ethValue === "number" && Number.isFinite(ethValue)
              ? formatNumber(ethValue * 1000000000, decimals)
              : "0";
          }
        } else {
          const usdValue = values[types.indexOf("usd")];
          value = typeof usdValue === "number" && Number.isFinite(usdValue)
            ? formatNumber(usdValue, decimals)
            : "0";
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

  if (!data || !timespanLabels[timeIntervalKey]) return timeIntervalKey;
  const tableViewportHeight =
    !isMobile ? 470 : 250;

  const getHeaderSortIcon = (metric: string) => {
    if (sort.metric !== metric) return "gtp-chevrondown-monochrome";
    return sort.sortOrder === "asc" ? "gtp-chevronup-monochrome" : "gtp-chevrondown-monochrome";
  };
  const isHeaderSortActive = (metric: string) => sort.metric === metric;
  const handleHeaderSortClick = (metric: string) => {
    setSort((prev) => ({
      metric,
      sortOrder: prev.metric === metric ? (prev.sortOrder === "asc" ? "desc" : "asc") : "desc",
    }));
  };

 
  return (
    <HorizontalScrollContainer className="h-full" hideScrollbar={true} enableDragScroll={true} includeMargin={false}>
      <div className="w-full min-w-[338px] relative " style={{ height: `${tableViewportHeight}px` }}>
        <div className="absolute hidden top-0 bottom-[52px] left-0 right-0  items-center justify-center">
          <ChartWatermarkWithMetricName metricName={metricsDict[metric_id].name} className="w-[145px] text-color-text-primary opacity-20 mix-blend-darken dark:mix-blend-lighten" />
        </div>
        <div className="hidden lg:block">
          <div className="relative px-[6px]">
            <GridTableHeader
              className="z-[20] md:z-[2] flex h-[37px] select-none items-center gap-x-[6px] !pb-0 !pl-[4px] !pr-0 !pt-0 text-[12px] !font-semibold text-color-text-primary"
              style={{ gridTemplateColumns: METRIC_TABLE_GRID_TEMPLATE_COLUMNS }}
            >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: METRIC_TABLE_GRID_TEMPLATE_COLUMNS }}
                >
                  <div className="bg-transparent" />
                  <div />
                  <div className="bg-color-bg-default/8" />
                  <div className="bg-color-bg-medium/32" />
                  <div className="bg-color-bg-default/8" />
                  <div className="bg-color-bg-medium/32" />
                  <div />
                </div>
                <div className="relative z-[1] flex h-full items-center pl-[10px]">Chain</div>
                <div aria-hidden className="relative z-[1] h-full" />
                <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                  <GTPButton
                    label={lastValueLabels[timeIntervalKey]}
                    rightIcon={getHeaderSortIcon("lastVal")}
                    rightIconClassname="!w-[8px] !h-[8px] "
                    variant="primary"
                    visualState={isHeaderSortActive("lastVal") ? "active" : "default"}
                    size="xs"
                    clickHandler={() => handleHeaderSortClick("lastVal")}
                    rightIconContainerClassName="min-w-[12px] min-h-[12px] flex items-center justify-center"
                  />
                </div>
                {Object.entries(
                  timespanLabels[timeIntervalKey],
                ).map(([timespan, label]) => (
                  <div key={timespan} className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                    <GTPButton
                      
                      label={label}
                      rightIcon={getHeaderSortIcon(timespan)}
                      rightIconClassname="!w-[8px] !h-[8px] "
                      variant="primary"
                      visualState={isHeaderSortActive(timespan) ? "active" : "default"}
                      size="xs"
                      clickHandler={() => handleHeaderSortClick(timespan)}
                      rightIconContainerClassName="min-w-[12px] min-h-[12px] flex items-center justify-center"
                    />
                  </div>
                ))}
                <div className="relative z-[3] flex h-full w-full items-center justify-center translate-x-[6px] rounded-full">
                  <GTPButton
                    leftIcon={(chainSelectToggleState === "all" || chainSelectToggleState === "normal") ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
                    leftIconClassname={`${chainSelectToggleState !== "all" ? "opacity-50" : "opacity-100"}`}
                    variant="primary"
                    visualState="default"
                    size="xs"
                    clickHandler={onChainSelectToggle}
                  />
                </div>
            </GridTableHeader>
          </div>
        </div>
        <div className="block lg:hidden">
          <div className="relative px-[6px]">
            <GridTableHeader
              className="z-[2] flex h-[37px] select-none items-center gap-x-[6px] !pb-0 !pl-[4px] !pr-0 !pt-0 text-[12px] !font-semibold text-color-text-primary"
              style={{ gridTemplateColumns: METRIC_TABLE_GRID_TEMPLATE_COLUMNS }}
            >
              <div className="relative z-[1] flex h-full items-center pl-[10px]">Chain</div>
              <div aria-hidden className="relative z-[1] h-full" />
              <div className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                <GTPButton
                  label={lastValueLabels[timeIntervalKey]}
                  rightIcon={getHeaderSortIcon("lastVal")}
                  variant="no-background"
                  visualState={isHeaderSortActive("lastVal") ? "active" : "default"}
                  size="xs"
                  clickHandler={() => handleHeaderSortClick("lastVal")}
                />
              </div>
              {Object.entries(
                timespanLabels[timeIntervalKey],
              ).map(([timespan, label]) => (
                <div key={timespan} className="relative z-[1] flex h-full w-full items-center justify-end pr-[2px]">
                  <GTPButton
                    label={label}
                    rightIcon={getHeaderSortIcon(timespan)}
                    variant="no-background"
                    visualState={isHeaderSortActive(timespan) ? "active" : "default"}
                    size="xs"
                    clickHandler={() => handleHeaderSortClick(timespan)}
                  />
                </div>
              ))}
              <div className="relative z-[3] flex h-full w-full items-center justify-center translate-x-[6px] rounded-full">
                <GTPButton
                  leftIcon={chainSelectToggleState === "all" ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
                  variant="primary"
                  visualState="default"
                  size="xs"
                  clickHandler={onChainSelectToggle}
                />
              </div>
            </GridTableHeader>
          </div>
        </div>
        <div className="relative h-[calc(100%-60px)] ">
          <GTPScrollPane
            className="h-full px-[6px] pt-[1px]"
            scrollRef={scrollRef}
            onScrollMetricsChange={onScrollMetricsChange}
            bottomFadeHeight={isMobile ? 15 : 37}
          >
            <div className="space-y-[2px]">
              {rowsWithPlaceholders().map((item, index) => (
                <div key={item.isPlaceholder ? `placeholder-${index}` : item.chain.key} className="w-full select-none">
                  {item.isPlaceholder ? (
                    <div className="flex h-[18px] items-center gap-x-[8px] px-[2px]">
                      <div className="h-[1px] flex-1 bg-color-bg-medium/80" />
                      <span className="text-[10px] font-semibold tracking-[0.06em] text-color-text-secondary">
                        NOT SHOWING IN CHART
                      </span>
                      <div className="h-[1px] flex-1 bg-color-bg-medium/80" />
                    </div>
                  ) : (
                    (() => {
                      const selected = selectedChains.includes(item.chain.key);
                      const timespanKeys = Object.keys(timespanLabels[timeIntervalKey]);
                      const [change1Key, change2Key, change3Key] = timespanKeys;
                      const displayValue = getDisplayValue(item);
                      const absoluteLabel = `${displayValue.prefix ?? ""}${displayValue.value}${displayValue.suffix ?? ""}`;

                      const formatChangeForTimespan = (timespan?: string) => {
                        if (!timespan || changesValueIndex === undefined) {
                          return { label: "—", change: 0 };
                        }

                        const rawValue = item.data.changes[lastValueTimeIntervalKey]?.[timespan]?.[changesValueIndex];
                        if (rawValue === null || rawValue === undefined || Number.isNaN(rawValue)) {
                          return { label: "—", change: 0 };
                        }

                        const adjustedValue = (reversePerformer ? -1.0 : 1.0) * rawValue;
                        const roundedAbsValue = Math.abs(Math.round(rawValue * 1000) / 10);
                        const roundedString = roundedAbsValue.toFixed(1);
                        const compactValue =
                          roundedString.length >= 4 ? `${Math.floor(roundedAbsValue)}` : roundedString;
                        const sign = adjustedValue >= 0 ? (reversePerformer ? "-" : "+") : reversePerformer ? "+" : "-";

                        return {
                          label: `${sign}${compactValue}%`,
                          change: adjustedValue * 100,
                        };
                      };

                      const change1 = formatChangeForTimespan(change1Key);
                      const change2 = formatChangeForTimespan(change2Key);
                      const change3 = formatChangeForTimespan(change3Key);

                      return (
                        <div className="py-[1px]">
                          <ChainMetricTableRow
                            key={item.chain.key}
                            id={item.chain.key}
                            label={item.chain.label}
                            icon={`${item.chain.key.replaceAll("_", "-")}-logo-monochrome` as GTPIconName}
                            chainHref={
                              metric_type === "fundamentals" && ChainsNavigationItemsByKeys[item.chain.key]
                                ? `/chains/${ChainsNavigationItemsByKeys[item.chain.key].urlKey}`
                                : undefined
                            }
                            accentColor={item.chain.colors[theme ?? "dark"][1]}
                            selected={selected}
                            gridTemplateColumns={METRIC_TABLE_GRID_TEMPLATE_COLUMNS}
                            truncateChainLabel={false}
                            show24h={Boolean(change1Key)}
                            show30d={Boolean(change2Key)}
                            show1y={Boolean(change3Key)}
                            barWidth={`${Math.max(0, item.barWidth) * 100}%`}
                            yesterdayValue={absoluteLabel}
                            hours24Value={change1.label}
                            hours24Change={change1.change}
                            days30Value={change2.label}
                            days30Change={change2.change}
                            year1Value={change3.label}
                            year1Change={change3.change}
                            onToggle={handleChainClick}
                          />
                        </div>
                      );
                    })()
                  )}
                </div>
              ))}
            </div>
          </GTPScrollPane>
        </div>
      </div>
    </HorizontalScrollContainer>
  );
};

export default MetricTable;
