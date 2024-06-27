"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { FeesURLs, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Header from "./Header";
import { useTransition, animated } from "@react-spring/web";
import OffScreenSlider from "./OffScreenSlider";
import ChartContainer from "./ChartContainer";
import Footer from "./Footer";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";
import { useWindowSize } from "usehooks-ts";
import Link from "next/link";
import { FeesTableResponse } from "@/types/api/Fees/Table";
import ShowLoading from "@/components/layout/ShowLoading";

interface HoveredItems {
  hoveredChain: string | null;
  hoveredDA: string | null;
}

interface DAvailability {
  icon: string;
  label: string;
}

const getGradientColor = (percentage) => {
  const colors = [
    { percent: 0, color: "#1DF7EF" },
    { percent: 20, color: "#76EDA0" },
    { percent: 50, color: "#FFDF27" },
    { percent: 70, color: "#FF9B47" },
    { percent: 100, color: "#FE5468" },
  ];

  let lowerBound = colors[0];
  let upperBound = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (
      percentage >= colors[i].percent &&
      percentage <= colors[i + 1].percent
    ) {
      lowerBound = colors[i];
      upperBound = colors[i + 1];
      break;
    }
  }

  const percentDiff =
    (percentage - lowerBound.percent) /
    (upperBound.percent - lowerBound.percent);

  const r = Math.floor(
    parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(1, 3), 16) -
          parseInt(lowerBound.color.substring(1, 3), 16)),
  );

  const g = Math.floor(
    parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(3, 5), 16) -
          parseInt(lowerBound.color.substring(3, 5), 16)),
  );

  const b = Math.floor(
    parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
        (parseInt(upperBound.color.substring(5, 7), 16) -
          parseInt(lowerBound.color.substring(5, 7), 16)),
  );

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export default function FeesPage() {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR<FeesTableResponse>(FeesURLs.table);

  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(0);
  const [DAIndex, setDAIndex] = useState(0);

  // const [enabledMetrics, setEnabledMetrics] = useState<string[]>([]);
  // const MetricWidths

  const [metrics, setMetrics] = useState<{
    [key: string]: {
      width: string;
      enabled: boolean;
    };
  }>({
    txcosts_median: {
      width: "90px",
      enabled: true,
    },
    txcosts_native_median: {
      width: "90px",
      enabled: true,
    },
    txcosts_swap: {
      width: "80px",
      enabled: false,
    },
  });

  const NUM_HOURS = useMemo(() => {
    if (!feeData) return 0;

    const length =
      Math.min(
        feeData.chain_data["ethereum"]["hourly"]["txcosts_median"].data.length,
        24,
      ) || 0;

    setSelectedBarIndex(length - 1);

    // check if tps data is available
    if (feeData.chain_data["ethereum"]["hourly"]["tps"]) {
      // add tps to metrics if available
      setMetrics((prevMetrics: any) => {
        return {
          ...prevMetrics,
          throughput: {
            title: "Throughput",
            width: "80px",
            enabled: false,
          },
          txcosts_avg: {
            title: "Average Fee",
            width: "80px",
            enabled: false,
          },
          tps: {
            title: "TPS",
            width: "50px",
            enabled: true,
          },
        };
      });
    } else {
      // remove tps from metrics if not available
      if ("throughput" in metrics) {
        setMetrics((prevMetrics: any) => {
          delete prevMetrics.throughput;
          return prevMetrics;
        });
      }
      if ("txcosts_avg" in metrics) {
        setMetrics((prevMetrics: any) => {
          delete prevMetrics.txcosts_avg;
          return prevMetrics;
        });
      }
      if ("tps" in metrics) {
        setMetrics((prevMetrics: any) => {
          delete prevMetrics.tps;
          return prevMetrics;
        });
      }
    }

    return length;
  }, [feeData]);

  const isMobile = useMediaQuery("(max-width: 767px)");

  const showGwei = true;

  const metricCategories = useMemo(() => {
    if (!master) return [];

    let retValue: string[] = [];
    Object.keys(master.fee_metrics).forEach((key) => {
      const category = master.fee_metrics[key].category;
      if (!retValue.includes(category)) {
        retValue.push(category);
      }
    });

    return retValue;
  }, [master]);

  const allChainsDA = useMemo(() => {
    if (!feeData || !master) return [];
    let retArray: string[] = [];

    Object.keys(feeData.chain_data).forEach((key) => {
      let keyDA = dataAvailToArray(master.chains[key].da_layer);
      keyDA.forEach((element) => {
        if (!retArray.includes(element.label)) {
          retArray.push(element.label);
        }
      });
    });

    retArray = retArray.filter((key) => key !== "N/A");
    retArray.sort();

    return retArray;
  }, [feeData, master]);

  const { width: windowWidth = 0, height: windowHeight = 0 } = useWindowSize();
  const [selectedTimescale, setSelectedTimescale] = useState("hourly");
  const [selectedQuantitative, setSelectedQuantitative] =
    useState("txcosts_median");
  const [selectedQualitative, setSelectedQualitative] = useState<null | string>(
    null,
  );
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean>(false);
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("Blobs");

  const [hoveredItems, setHoveredItems] = useState<HoveredItems>({
    hoveredChain: null,
    hoveredDA: null,
  });
  const [hoverBarIndex, setHoverBarIndex] = useState<Number | null>(null);

  const prevSelectedAvailabilityRef = useRef(availabilityFilter);
  const prevSelectedLayerRef = useRef(selectedAvailability);
  const [sortOrder, setSortOrder] = useState(true);
  //True is default descending false ascending
  const [hoverSettings, setHoverSettings] = useState<boolean>(false);
  const [showCents, setShowCents] = useLocalStorage("showCents", true);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  const [manualSelectedChains, setManualSelectedChains] = useState<{
    [key: string]: boolean;
  }>({});

  // start Bottom Chart state
  const [isChartOpen, setIsChartOpen] = useState(false);

  const quantitativeValueIndex = useMemo(() => {
    if (!master) return 1;

    if (master.fee_metrics[selectedQuantitative].currency === true) {
      return showUsd ? 2 : 1;
    }

    return 1;
  }, [master, selectedQuantitative, showUsd]);

  const toggleMetric = (metricKey) => {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [metricKey]: {
        ...prevMetrics[metricKey],
        enabled: !prevMetrics[metricKey].enabled,
      },
    }));
  };

  const enabledMetricsCount = useMemo(() => {
    return Object.values(metrics).reduce((acc, curr) => {
      return acc + (curr.enabled ? 1 : 0);
    }, 0);
  }, [metrics]);

  // useEffect(() => {
  //   if (!master) return;

  //   if (enabledMetricsCount > 4) {
  //     // disable the metrics with lowest priority so we're only showing 4 metrics
  //     const enabledMetrics = Object.entries(metrics).filter(
  //       ([key, value]) => value.enabled,
  //     );

  //     // sort by priority
  //     enabledMetrics.sort(([aKey, aValue], [bKey, bValue]) => {
  //       // priority is in master
  //       return (
  //         master.fee_metrics[aKey].priority - master.fee_metrics[bKey].priority
  //       );
  //     });

  //     // disable the metrics with lowest priority
  //     const metricsToDisable = enabledMetrics.slice(4);

  //     setMetrics((prevMetrics) => {
  //       const updatedMetrics = { ...prevMetrics };

  //       metricsToDisable.forEach(([key, value]) => {
  //         updatedMetrics[key] = {
  //           ...value,
  //           enabled: false,
  //         };
  //       });

  //       return updatedMetrics;
  //     });
  //   }
  // }, [enabledMetricsCount, master, metrics]);

  const timescales = useMemo(() => {
    return {
      thirty_min: {
        label: "Last 30 Minutes",
      },
      hourly: {
        label: "Last Hour",
      },
      six_hours: {
        label: "Last 6 Hours",
      },
      twelve_hours: {
        label: "Last 12 Hours",
      },
    };
  }, []);

  function dataAvailToArray(x: string): DAvailability[] {
    let retObject: DAvailability[] = [];
    if (typeof x === "string") {
      // Convert x to lowercase to ensure case-insensitive matching
      x = x.toLowerCase();

      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }

      if (x.includes("mantleda") || x.includes("eigenda")) {
        retObject.push({
          icon: "customoffchain",
          label: "EigenDA",
        });
      }

      if (x.includes("dac")) {
        retObject.push({
          icon: "committee",
          label: "DAC (committee)",
        });
      }

      if (x.includes("celestia")) {
        retObject.push({
          icon: "celestiafp",
          label: "Celestia",
        });
      }

      if (x.includes("memo")) {
        retObject.push({
          icon: "memofp",
          label: "Memo",
        });
      }
    }

    if (retObject.length === 0) {
      retObject.push({
        icon: "fa:circle",
        label: "N/A",
      });
    }
    return retObject;
  }

  const dataAvailByChain = useMemo<{ [key: string]: DAvailability[] }>(() => {
    if (!master) return {};
    const availByChain: { [key: string]: DAvailability[] } = {};

    Object.keys(master.chains).forEach((chain) => {
      const daLayer = master.chains[chain].da_layer;
      availByChain[chain] = dataAvailToArray(daLayer);
    });

    return availByChain;
  }, [master]);

  const sortByChains = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // If sortOrder is false, reverse the comparison
        const comparison = sortOrder ? 1 : -1;

        // Compare chain names alphabetically
        const chainNameComparison = a.localeCompare(b);

        // If both chains are selected or unselected, sort by chain name
        if (isSelectedA === isSelectedB) {
          return chainNameComparison * comparison;
        }

        // Prioritize selected chains
        return isSelectedA ? -1 : 1;
      });

    return sortedChains;
  }, [feeData, selectedChains, sortOrder]);

  const sortByCallData = useMemo(() => {
    if (!feeData || !master) return [];
    const x = { ...selectedChains };

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const availabilityA = dataAvailByChain[a];
        const availabilityB = dataAvailByChain[b];

        // Check if availabilityA or availabilityB contains selectedAvailability
        const containsAvailabilityA = availabilityA.some(
          (item) => item.label === selectedAvailability,
        );
        const containsAvailabilityB = availabilityB.some(
          (item) => item.label === selectedAvailability,
        );

        // Check isSelected for chains a and b
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // Sort based on availability and isSelected
        if (isSelectedA && !isSelectedB) {
          return -1;
        } else if (!isSelectedA && isSelectedB) {
          return 1;
        } else if (containsAvailabilityA && !containsAvailabilityB) {
          return -1;
        } else if (!containsAvailabilityA && containsAvailabilityB) {
          return 1;
        } else {
          // If both contain or don't contain the selected availability and isSelected, sort alphabetically
          return a.localeCompare(b);
        }
      });

    // Reverse the sorted chains if sortOrder is false
    if (!sortOrder) {
      sortedChains.reverse();
    }

    return sortedChains;
  }, [
    feeData,
    master,
    selectedChains,
    sortOrder,
    dataAvailByChain,
    selectedAvailability,
  ]);

  //Disable not selected data availabilities

  useEffect(() => {
    if (!master || !feeData) return;

    if (prevSelectedAvailabilityRef.current && !availabilityFilter) {
      // Set all selectedChains to true
      setManualSelectedChains({});

      setSelectedChains((prevSelectedChains) => {
        const updatedSelectedChains = { ...prevSelectedChains };

        // Iterate over each chain and set it to true
        Object.keys(updatedSelectedChains).forEach((chain) => {
          updatedSelectedChains[chain] = true;
        });

        return updatedSelectedChains;
      });
    } else if (
      (!prevSelectedAvailabilityRef.current && availabilityFilter) ||
      (availabilityFilter &&
        selectedAvailability !== prevSelectedLayerRef.current)
    ) {
      setSelectedChains((prevSelectedChains) => {
        const updatedSelectedChains = { ...prevSelectedChains };
        Object.keys(feeData.chain_data).forEach((chain) => {
          const chainData = feeData.chain_data[chain];
          const availability = dataAvailByChain[chain];
          const containsAvailability = availability.some(
            (item) => item.label === selectedAvailability,
          );

          // Update the selected chains based on availability and manual selection
          if (!containsAvailability) {
            updatedSelectedChains[chain] = false;
          } else {
            updatedSelectedChains[chain] = true;
          }
        });
        return updatedSelectedChains;
      });
    }

    prevSelectedAvailabilityRef.current = availabilityFilter;
    prevSelectedLayerRef.current = selectedAvailability;
  }, [
    feeData,
    master,
    selectedAvailability,
    setSelectedChains,
    availabilityFilter,
    dataAvailByChain,
  ]);

  const sortByMetric = useMemo(() => {
    if (!feeData || !master) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // If sortOrder is false, reverse the comparison
        let comparison = sortOrder ? 1 : -1;

        if (master.fee_metrics[selectedQuantitative].invert_normalization) {
          comparison = comparison * -1;
        }
        // Handle cases where one or both chains are not selected
        if (isSelectedA && !isSelectedB) return -1;
        if (!isSelectedA && isSelectedB) return 1;

        const aData =
          feeData.chain_data[a]["hourly"][selectedQuantitative].data;
        const bData =
          feeData.chain_data[b]["hourly"][selectedQuantitative].data;

        // Handle empty array case
        if (aData.length === 0 && bData.length === 0) {
          // Both arrays are empty, prioritize based on selection
          return isSelectedA ? -1 : isSelectedB ? 1 : 0;
        } else if (aData.length === 0) {
          // aData is empty, prioritize based on sortOrder
          return sortOrder ? 1 : -1;
        } else if (bData.length === 0) {
          // bData is empty, prioritize based on sortOrder
          return sortOrder ? -1 : 1;
        }

        // If both chains are selected or unselected, sort by median cost
        const aTxCost = aData[NUM_HOURS - 1 - selectedBarIndex]
          ? aData[NUM_HOURS - 1 - selectedBarIndex][quantitativeValueIndex]
          : null;
        const bTxCost = bData[NUM_HOURS - 1 - selectedBarIndex]
          ? bData[NUM_HOURS - 1 - selectedBarIndex][quantitativeValueIndex]
          : null;

        if (aTxCost === null && bTxCost === null) return 0;
        if (aTxCost === null) return 1 * comparison;
        if (bTxCost === null) return -1 * comparison;

        return (aTxCost - bTxCost) * comparison;
      });

    return sortedChains;
  }, [
    feeData,
    selectedChains,
    selectedQuantitative,
    selectedBarIndex,
    sortOrder,
    NUM_HOURS,
    quantitativeValueIndex,
  ]);

  const finalSort = useMemo(() => {
    if (!feeData) return [];

    if (selectedQualitative === "chain") {
      return sortByChains;
    } else {
      return sortByMetric;
    }
  }, [feeData, selectedQualitative, sortByChains, sortByMetric]);

  const feeIndexSortWithEthereum = useMemo(() => {
    if (!feeData) return [];

    const indices = Array.from({ length: NUM_HOURS }, (_, i) => i); // Create an array from 0 to 23

    const sortedCosts = indices.map((index) => {
      const chainsData = Object.entries(feeData.chain_data).map(
        ([chain, data]) => ({
          chain,
          metric: (data as any)["hourly"][selectedQuantitative]?.data[index]
            ? (data as any)["hourly"][selectedQuantitative]?.data[index][
                quantitativeValueIndex
              ]
            : null,
        }),
      );

      const filteredChainsData = chainsData.filter(
        ({ metric }) => metric !== null,
      );

      const sortedChains = filteredChainsData.sort((a, b) => {
        return a.metric - b.metric;
      });

      return sortedChains.reduce((acc, { chain }) => {
        if (
          feeData.chain_data[chain]?.["hourly"]?.[selectedQuantitative]?.data?.[
            index
          ] !== undefined
        ) {
          acc[chain] =
            feeData.chain_data[chain]?.["hourly"]?.[
              selectedQuantitative
            ]?.data?.[index];
        }
        return acc;
      }, {});
    });

    // Filter out the "ethereum" chain
    const filteredSortedCosts = sortedCosts.map((costs) => {
      return costs;
    });

    return filteredSortedCosts;
  }, [feeData, selectedQuantitative, NUM_HOURS, quantitativeValueIndex]);

  const feeIndexSort = useMemo(() => {
    if (!feeData) return [];

    const indices = Array.from({ length: NUM_HOURS }, (_, i) => i); // Create an array from 0 to 23

    const sortedCosts = indices.map((index) => {
      const chainsData = Object.entries(feeData.chain_data).map(
        ([chain, data]) => ({
          chain,
          metric: data["hourly"][selectedQuantitative]?.data[index]
            ? data["hourly"][selectedQuantitative]?.data[index][
                quantitativeValueIndex
              ]
            : null,
        }),
      );

      const sortedChains = chainsData
        .filter(({ metric }) => metric !== null)
        .sort((a, b) => {
          //@ts-ignore
          return a.metric - b.metric;
        });

      const result = sortedChains.reduce((acc, { chain }) => {
        if (
          feeData.chain_data[chain]?.["hourly"]?.[selectedQuantitative]?.data?.[
            index
          ] !== undefined
        ) {
          acc[chain] =
            feeData.chain_data[chain]?.["hourly"]?.[
              selectedQuantitative
            ]?.data?.[index];
        }
        return acc;
      }, {});

      return result;
    });

    // Filter out the "ethereum" chain
    const filteredSortedCosts = sortedCosts.map((costs) => {
      delete costs["ethereum"];
      return costs;
    });

    return filteredSortedCosts;
  }, [feeData, quantitativeValueIndex, selectedQuantitative, NUM_HOURS]);

  const optIndex = useMemo(() => {
    let pickIndex = hoverBarIndex ? hoverBarIndex : selectedBarIndex;
    let retIndex = NUM_HOURS - 1 - Number(pickIndex);
    return retIndex;
  }, [selectedBarIndex, hoverBarIndex, NUM_HOURS]);

  const getGradientColor = useCallback((percentage, weighted = false) => {
    const colors = !weighted
      ? [
          { percent: 0, color: "#1DF7EF" },
          { percent: 20, color: "#76EDA0" },
          { percent: 50, color: "#FFDF27" },
          { percent: 70, color: "#FF9B47" },
          { percent: 100, color: "#FE5468" },
        ]
      : [
          { percent: 0, color: "#1DF7EF" },
          { percent: 2, color: "#76EDA0" },
          { percent: 10, color: "#FFDF27" },
          { percent: 40, color: "#FF9B47" },
          { percent: 80, color: "#FE5468" },
          { percent: 100, color: "#FE5468" }, // Repeat the final color to ensure upper bound
        ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    if (weighted) {
      // Adjust lower and upper bounds for weighted gradient
      lowerBound = colors[0];
      upperBound = colors[1];
    }

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(1, 3), 16) -
            parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(3, 5), 16) -
            parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
        percentDiff *
          (parseInt(upperBound.color.substring(5, 7), 16) -
            parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, []);

  const rowHeight = 34;
  const rowGapY = 3;
  const transitions = useTransition(
    Object.entries(finalSort).map((chain, index) => {
      return {
        y: index * (rowHeight + rowGapY),
        height: rowHeight,
        chain: chain, // Assuming `chain` is used as a key
      };
    }),
    {
      key: (d) => d.chain[1],
      from: { height: 0 },
      leave: { height: 0 },
      enter: ({ y, height }) => ({ y, height }),
      update: ({ y, height }) => ({ y, height }), // Ensure height change is animated
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  const getNumFractionDigits = useCallback(
    (x) => {
      if (showUsd) {
        // if showCents is true, show 2 decimal places
        if (showCents) return 1;
        // if showCents is false, show 3 decimal places if x < 1, otherwise show 2 decimal places
        return x < 1 ? 3 : 2;
      }

      return x < 1000 ? 0 : 2;
    },
    [showCents, showUsd],
  );

  const getCircleColor = useCallback(
    (chain: string, index: number) => {
      const indexSortArray =
        chain === "ethereum" ? feeIndexSortWithEthereum : feeIndexSort;

      let result = "";

      if (
        !master ||
        !feeData ||
        !indexSortArray[NUM_HOURS - 1 - index][chain]
      ) {
        result = "gray";
        return result;
      }

      let normalizedIndex =
        feeData.chain_data[chain].hourly[selectedQuantitative]?.types.indexOf(
          "normalized",
        ) || 3;

      if (
        master.fee_metrics[selectedQuantitative].invert_normalization === true
      ) {
        // this should be in reverse order

        result = getGradientColor(
          Math.floor(
            indexSortArray[NUM_HOURS - 1 - index][chain][normalizedIndex] * 100,
          ),
        );
      }
      result = getGradientColor(
        Math.floor(
          indexSortArray[NUM_HOURS - 1 - index][chain][normalizedIndex] * 100,
        ),
      );

      // console.log(`getCircleColor(${chain}, ${index}) = ${result}`);

      return result;
    },
    [
      feeIndexSortWithEthereum,
      feeIndexSort,
      master,
      feeData,
      NUM_HOURS,
      selectedQuantitative,
      getGradientColor,
    ],
  );

  const getValueColor = useCallback(
    (chain: string) => {
      if (!feeIndexSort[optIndex]) return "gray";

      if (
        master?.fee_metrics[selectedQuantitative].invert_normalization === true
      ) {
        // this should be in reverse order
        return getGradientColor(
          100 -
            Math.floor(
              (feeIndexSort[optIndex][chain][quantitativeValueIndex] /
                feeIndexSort[optIndex][
                  Object.keys(feeIndexSort[optIndex])[
                    Object.keys(feeIndexSort[optIndex]).length - 1
                  ]
                ][quantitativeValueIndex]) *
                100,
            ),
          true,
        );
      }
      return getGradientColor(
        Math.floor(
          (feeIndexSort[optIndex][chain][quantitativeValueIndex] /
            feeIndexSort[optIndex][
              Object.keys(feeIndexSort[optIndex])[
                Object.keys(feeIndexSort[optIndex]).length - 1
              ]
            ][quantitativeValueIndex]) *
            100,
        ),
        true,
      );
    },
    [
      feeIndexSort,
      optIndex,
      master?.fee_metrics,
      selectedQuantitative,
      getGradientColor,
      quantitativeValueIndex,
    ],
  );

  const getFormattedLastValue = useCallback(
    (chain, metric) => {
      // feeData.chain_data[item.chain[1]]?.hourly?.txcosts_native_median?.data[optIndex]
      // true, feeData.chain_data["ethereum"]["hourly"]["txcosts_swap"].data[optIndex][showUsd ? 2 : 1]
      if (
        !feeData ||
        !(metric in feeData.chain_data[chain]["hourly"]) ||
        !master
      )
        return null;

      let valueIndex = 1;

      if (master.fee_metrics[metric].currency === true) {
        valueIndex = showUsd ? 2 : 1;
      }

      const value = feeData.chain_data[chain]["hourly"][metric].data[optIndex]
        ? feeData.chain_data[chain]["hourly"][metric].data[optIndex][valueIndex]
        : null;

      const typeString =
        feeData.chain_data[chain]["hourly"][metric].types[valueIndex];
      const unitKey = typeString.replace("value_", "");

      const usdClasses = " w-[63px] md:w-[63px] -mr-1.5 pr-2";
      const gweiClasses = "w-[80px] md:w-[85px] -mr-1.5";
      const centsClasses = " w-[80px] md:w-[90px] -mr-1.5";
      const tpsClasses = " w-[50px] md:w-[52px] pr-2.5 -mr-2.5";

      // default to gwei classes
      let classes = gweiClasses;

      if (master.fee_metrics[metric].currency === true) {
        if (showUsd) {
          if (showCents) {
            classes = centsClasses;
          } else {
            classes = usdClasses;
          }
        } else {
          if (showGwei) {
            classes = gweiClasses;
          } else {
            classes = centsClasses;
          }
        }
      }

      if (metric === "tps") {
        classes = tpsClasses;
      }

      // return N/A if value is null
      if (value === null)
        return (
          <div
            className={`flex items-center justify-center ${classes} h-[24px] transition-colors duration-100 border rounded-full opacity-30`}
            style={{
              borderColor:
                selectedQuantitative === metric ? "gray" : "transparent",
            }}
          >
            <div>N/A</div>
          </div>
        );

      // multiply value by 1000000000 if showGwei is true
      let multiplier = 1;
      if (master.fee_metrics[metric].currency === true) {
        if (showGwei && !showUsd) {
          multiplier = 1000000000;
        }

        if (showCents && showUsd) {
          multiplier = 100;
        }
      }

      const multipliedValue = value * multiplier;

      let lessThanOverride = false;
      let lessThanValue = 0.1;

      if (master.fee_metrics[metric].currency === true && showUsd) {
        if (showCents && multipliedValue < 0.1) {
          lessThanOverride = true;
        } else if (!showCents && multipliedValue < 0.001) {
          lessThanOverride = true;
          lessThanValue = 0.001;
        }
      }

      // ethereum chain as a special case
      if (chain === "ethereum" && metric === selectedQuantitative) {
        return (
          <div
            className={`font-semibold flex items-center ${classes} h-[24px] transition-colors duration-100 border rounded-full justify-end`}
            style={{
              background: "#FE5468",
              borderColor: "#FF3838",
              color: "#1F2726",
            }}
          >
            {lessThanOverride && (
              <div className="h-[12px] w-[12px]">
                <Icon
                  icon="feather:chevron-left"
                  className="h-[12px] w-[12px]"
                />
              </div>
            )}
            {master.fee_metrics[metric].currency && showUsd && !showCents && (
              <div className="text-[10px]">$</div>
            )}
            {!master.fee_metrics[metric].currency && (
              <div className="text-[10px]">
                {master.fee_metrics[metric].prefix
                  ? master.fee_metrics[metric].prefix
                  : ""}
              </div>
            )}
            <div
              className="flex items-center self-center text-[12px] md:text-[12px]"
              style={{
                fontFeatureSettings: "'pnum' on, 'lnum' on",
              }}
            >
              {lessThanOverride
                ? lessThanValue
                : Intl.NumberFormat(undefined, {
                    notation: "compact",
                    maximumFractionDigits:
                      unitKey === "eth" && showGwei
                        ? 2
                        : master.fee_metrics[metric].units[unitKey].decimals,
                    minimumFractionDigits:
                      unitKey === "eth" && showGwei
                        ? 2
                        : master.fee_metrics[metric].units[unitKey].decimals,
                  }).format(multipliedValue)}
            </div>
            {master.fee_metrics[metric].currency && showUsd && showCents && (
              <div className="pl-0.5 text-[8px] pr-[7px] text-forest-900">
                {" cents"}
              </div>
            )}
            {master.fee_metrics[metric].currency && !showUsd && showGwei && (
              <div className="pl-0.5 text-[8px] pr-[5px] text-forest-900">
                {" gwei"}
              </div>
            )}

            {!master.fee_metrics[metric].currency && (
              <div
                className={`text-[8px] text-forest-900 ${
                  master.fee_metrics[metric].units[unitKey].suffix
                    ? "pr-[5px] pl-0.5"
                    : "pr-[0px] pl-0"
                }`}
              >
                {master.fee_metrics[metric].units[unitKey].suffix
                  ? master.fee_metrics[metric].units[unitKey].suffix
                  : ""}
              </div>
            )}
            {master.fee_metrics[metric].suffix && (
              <div
                className={`text-[8px] text-forest-900 ${
                  master.fee_metrics[metric].units[unitKey].suffix
                    ? "pr-[5px] pl-0.5"
                    : "pr-[0px] pl-0"
                }`}
              >
                {master.fee_metrics[metric].units[unitKey].suffix
                  ? master.fee_metrics[metric].units[unitKey].suffix
                  : ""}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          className={`flex items-center ${classes}  h-[24px] transition-colors duration-100 border rounded-full justify-end`}
          style={{
            borderColor:
              selectedQuantitative === metric && selectedQualitative !== "chain"
                ? getValueColor(chain)
                : "transparent",
          }}
        >
          {lessThanOverride && (
            <div className="h-[12px] w-[12px]">
              <Icon icon="feather:chevron-left" className="h-[12px] w-[12px]" />
            </div>
          )}
          {master.fee_metrics[metric].currency && showUsd && !showCents && (
            <div className="text-[9px] text-center mt-[1px] pr-[2px] text-forest-400">
              $
            </div>
          )}

          {!master.fee_metrics[metric].currency && (
            <div className="text-[10px]">
              {master.fee_metrics[metric].prefix
                ? master.fee_metrics[metric].prefix
                : ""}
            </div>
          )}
          <div
            className="flex items-center self-center text-[12px] md:text-[12px]"
            style={{
              fontFeatureSettings: "'pnum' on, 'lnum' on",
            }}
          >
            {lessThanOverride
              ? lessThanValue
              : Intl.NumberFormat(undefined, {
                  notation: "compact",
                  maximumFractionDigits:
                    unitKey === "eth" && showGwei
                      ? 2
                      : master.fee_metrics[metric].units[unitKey].decimals,
                  minimumFractionDigits:
                    unitKey === "eth" && showGwei
                      ? 2
                      : master.fee_metrics[metric].units[unitKey].decimals,
                }).format(multipliedValue)}
          </div>
          {master.fee_metrics[metric].currency && showUsd && showCents && (
            <div className="pl-0.5 text-[8px] pr-[7px] text-forest-400">
              {" cents"}
            </div>
          )}
          {master.fee_metrics[metric].currency && !showUsd && showGwei && (
            <div className="pl-0.5 text-[8px] pr-[5px] text-forest-400">
              {" gwei"}
            </div>
          )}
          {!master.fee_metrics[metric].currency && (
            <div
              className={`text-[8px] text-forest-400 ${
                master.fee_metrics[metric].units[unitKey].suffix
                  ? "pr-[5px] pl-0.5"
                  : "pr-[0px] pl-0"
              }`}
            >
              {master.fee_metrics[metric].units[unitKey].suffix
                ? master.fee_metrics[metric].units[unitKey].suffix
                : ""}
            </div>
          )}
          {master.fee_metrics[metric].suffix && (
            <div
              className={`text-[8px] text-forest-400 ${
                master.fee_metrics[metric].units[unitKey].suffix
                  ? "pr-[5px] pl-0.5"
                  : "pr-[0px] pl-0"
              }`}
            >
              {master.fee_metrics[metric].units[unitKey].suffix
                ? master.fee_metrics[metric].units[unitKey].suffix
                : ""}
            </div>
          )}
        </div>
      );
    },
    [
      feeData,
      getValueColor,
      master,
      optIndex,
      selectedQualitative,
      selectedQuantitative,
      showCents,
      showGwei,
      showUsd,
    ],
  );

  const dataAvailByFilter: boolean = useMemo(() => {
    if (Object.keys(dataAvailByChain).length === 0) return false;

    let allPass = true;
    finalSort.forEach((chain) => {
      if (
        dataAvailByChain[chain][0].label !== selectedAvailability &&
        selectedChains[chain]
      ) {
        allPass = false;
      } else if (
        dataAvailByChain[chain][0].label === selectedAvailability &&
        !selectedChains[chain]
      ) {
        allPass = false;
      }
    });

    return allPass;
  }, [dataAvailByChain, finalSort, selectedAvailability, selectedChains]);

  console.log(master ? master : "");

  return (
    <>
      <ShowLoading
        dataLoading={[feeLoading, masterLoading]}
        dataValidating={[feeValidating, masterValidating]}
        fullScreen={true}
      />
      <div
        className="relative min-h-screen w-full flex flex-col transition-all duration-300"
        style={{
          paddingBottom: isChartOpen
            ? `${isMobile ? 313 + 60 : 413 + 60}px`
            : `${96 + 60}px`,
        }}
        // ref={pageRef}
      >
        <Header />

        <FeesContainer className={`w-full hidden md:block`}>
          <div className="relative flex p-[5px] items-center w-full justify-between rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
            <a
              className="flex items-center w-[162px] bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
              href="https://www.growthepie.xyz/"
              target="_blank"
            >
              <div className="w-6 h-6">
                <Icon icon="gtp:house" className="h-6 w-6" />
              </div>
              <div className="font-semibold">Main platform</div>
            </a>
            <div
              className={`flex items-center relative h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-[15px] py-[10px] gap transition-all z-40 duration-300 hover:cursor-pointer ${
                hoverSettings
                  ? "w-[336px] justify-start"
                  : "w-[128px] justify-start"
              }`}
              onMouseEnter={() => {
                setHoverSettings(true);
              }}
              onMouseLeave={() => {
                setHoverSettings(false);
              }}
            >
              <div
                className={`transition-all ${
                  hoverSettings ? "hidden" : "block"
                }`}
              >
                <Icon
                  icon="gtp:gtp-settings"
                  className={`h-6 w-6 ${hoverSettings ? "text-sm" : ""}`}
                />
              </div>
              <div
                className={`transition-all ${
                  hoverSettings ? "block" : "hidden"
                }`}
              >
                <Icon
                  icon="feather:chevron-down"
                  className={`h-5 w-5 mt-1 ${hoverSettings ? "text-sm" : ""}`}
                />
              </div>
              <div className="font-semibold transition-all">Settings</div>
            </div>

            <div
              className={`absolute top-6 min-h-0 bg-[#151A19] right-[5px] rounded-b-2xl z-20 transition-all duration-300 overflow-hidden ${
                hoverSettings
                  ? `shadow-[0px_4px_46.2px_0px_#000000]`
                  : "shadow-transparent"
              }`}
              style={{
                width: hoverSettings ? "336px" : 0,
                height: hoverSettings
                  ? `calc(100px + 28px + 30px * (1 + ${
                      Object.keys(metrics).length
                    }))`
                  : 0,
              }}
              onMouseEnter={() => {
                setHoverSettings(true);
              }}
              onMouseLeave={() => {
                setHoverSettings(false);
              }}
            >
              <div
                className={`pt-[30px] pb-[20px] flex flex-col h-[calc(100px + 28px * (1 + ${
                  Object.keys(metrics).length
                }))] w-[336px]`}
              >
                <div className="flex flex-col w-full">
                  <div className="flex items-center w-full">
                    <div className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full pl-[8px] pr-[15px]">
                      <div className="font-normal text-forest-500/50 text-right">
                        Units
                      </div>
                      <div className="grid grid-cols-[140px,6px,auto] gap-x-[10px] items-center w-full  place-items-center whitespace-nowrap">
                        <div className="flex flex-1 items-center place-self-end">
                          <Icon
                            icon="gtp:gtp-dollar"
                            className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative ${
                              hoverSettings ? "text-sm" : ""
                            }`}
                          />
                          <div className="font-semibold text-right pl-[8px]">
                            USD Display
                          </div>
                        </div>
                        {/* <div className="flex gap-x-[10px] items-center"> */}
                        <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                        <div
                          className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                          onClick={() => {
                            setShowCents(!showCents);
                          }}
                        >
                          <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px]">
                            <div className="w-full flex items-start justify-center">
                              Full Dollar
                            </div>
                            <div
                              className={`w-full text-center ${
                                !showCents && "opacity-50"
                              }`}
                            >
                              US Cents
                            </div>
                          </div>
                          <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                            <div
                              className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                              style={{
                                transform: !showCents
                                  ? "translateX(0%)"
                                  : "translateX(100%)",
                              }}
                            >
                              {!showCents ? "Full Dollar" : "US cents"}
                            </div>
                          </div>
                        </div>
                        {/* </div> */}
                      </div>
                      {metricCategories &&
                        master &&
                        metricCategories.map((categoryKey) => {
                          return (
                            <div
                              key={categoryKey + "_categories"}
                              className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full pl-[8px]"
                            >
                              <div className="font-normal text-forest-500/50 text-right">
                                {categoryKey + " Metrics"}
                              </div>
                              {Object.keys(master.fee_metrics)
                                .filter(
                                  (metricKey) =>
                                    metrics[metricKey] &&
                                    master.fee_metrics[metricKey].category ==
                                      categoryKey,
                                )
                                .sort(
                                  (a, b) =>
                                    master.fee_metrics[a].priority -
                                    master.fee_metrics[b].priority,
                                )
                                .map((metric) => {
                                  const enabledMetricKeysByPriority =
                                    Object.keys(metrics)
                                      .filter(
                                        (metricKey) =>
                                          metrics[metricKey].enabled,
                                      )
                                      .sort(
                                        (a, b) =>
                                          master.fee_metrics[b].priority -
                                          master.fee_metrics[a].priority,
                                      );

                                  return (
                                    <div
                                      className="grid grid-cols-[140px,6px,auto] gap-x-[10px] items-center w-full place-items-center whitespace-nowrap"
                                      key={metric + "_settings"}
                                    >
                                      <div className="flex flex-1 items-center place-self-end">
                                        <Icon
                                          icon=""
                                          className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative self-center justify-self-center ${
                                            hoverSettings ? "text-sm" : ""
                                          }`}
                                        />
                                        <div className="flex-1 font-semibold">
                                          {master.fee_metrics[metric].name}
                                        </div>
                                      </div>
                                      {/* <div className="flex gap-x-[10px] items-center"> */}
                                      <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                                      <div
                                        className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                                        onClick={() => {
                                          if (
                                            enabledMetricsCount > 1 ||
                                            !metrics[metric].enabled
                                          ) {
                                            if (
                                              metrics[metric].enabled &&
                                              selectedQuantitative === metric
                                            ) {
                                              for (const metricKey of Object.keys(
                                                metrics,
                                              )) {
                                                if (
                                                  metrics[metricKey].enabled &&
                                                  metricKey !== metric
                                                ) {
                                                  setSelectedQuantitative(
                                                    metricKey,
                                                  );
                                                  break; // Exit loop once the first enabled metric is found
                                                }
                                              }
                                            }
                                            if (!metrics[metric].enabled) {
                                              setSelectedQuantitative(metric);
                                            }

                                            const prevMetrics = { ...metrics };

                                            const isEnabling =
                                              !prevMetrics[metric].enabled;

                                            // if enabling another metric will exceed the limit of 4 enabled metrics, disable the previously enabled metric with the lowest priority
                                            if (
                                              isEnabling &&
                                              enabledMetricsCount === 4
                                            ) {
                                              const lowestPriorityMetricKey =
                                                enabledMetricKeysByPriority[0];

                                              prevMetrics[
                                                lowestPriorityMetricKey
                                              ].enabled = false;
                                            }

                                            // toggle the enabled state of the metric
                                            prevMetrics[metric].enabled =
                                              !prevMetrics[metric].enabled;

                                            // set the updated metrics state
                                            setMetrics(prevMetrics);

                                            // setMetrics((prevMetrics) => ({
                                            //   ...prevMetrics,
                                            //   [metric]: {
                                            //     ...prevMetrics[metric],
                                            //     enabled: !prevMetrics[metric].enabled,
                                            //   },
                                            // }));
                                          }
                                        }}
                                      >
                                        <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px] ">
                                          <div className="w-full flex items-start justify-center">
                                            Enabled
                                          </div>
                                          <div
                                            className={`w-full text-center ${
                                              metrics[metric].enabled &&
                                              "opacity-50"
                                            }`}
                                          >
                                            Disabled
                                          </div>
                                        </div>
                                        <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                                          <div
                                            className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                                            style={{
                                              transform: metrics[metric].enabled
                                                ? "translateX(0%)"
                                                : "translateX(100%)",
                                            }}
                                          >
                                            {metrics[metric].enabled
                                              ? "Enabled"
                                              : "Disabled"}
                                          </div>
                                        </div>
                                      </div>
                                      {/* </div> */}
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FeesContainer>
        <FeesContainer className="w-full mt-[30px] flex items-end sm:items-center justify-between md:justify-start  gap-x-[10px]">
          <h1 className="text-[20px] md:text-[30px] leading-[120%] font-bold ">
            {`How much a typical user paid on Layer 2s`}
          </h1>
          <div className="min-w-[92px] h-[26px] py-[6px] pl-[10px] pr-[5px] items-center justify-center border-[#344240] border bg-[#1F2726] text-[12px] rounded-r-full leading-[1] font-bold">
            {NUM_HOURS - selectedBarIndex === 1
              ? "1 hour Ago"
              : `${NUM_HOURS - selectedBarIndex} hours ago`}
          </div>
        </FeesContainer>

        <FeesHorizontalScrollContainer className="">
          {feeData && master && (
            <div className="relative w-auto md:pr-[0px] lg:pr-[0px] overflow-x-visible">
              <div
                className={`relative w-[750px] md:w-[887px] flex justify-start pt-[30px] pb-[8px] text-[10px] md:text-[12px] font-bold leading-[1]`}
              >
                <div className="pl-[10px] pr-[30px] md:pr-[20px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[180px,auto,180px]">
                  <div className={`flex items-center gap-x-[5px]`}>
                    <div
                      className={`flex items-center h-[0px] w-[18px] md:h-[0px] md:w-[24px]`}
                    >
                      <div
                        className={`${
                          isMobile ? "h-[0px] w-[18px]" : "h-[0px] w-[24px]"
                        }`}
                      />
                    </div>
                    <div
                      className="flex items-center gap-x-0.5 cursor-pointer"
                      onClick={() => {
                        if (selectedQualitative === "chain") {
                          setSortOrder(!sortOrder);
                        } else {
                          setSelectedQualitative("chain");
                        }
                      }}
                    >
                      <div>Chain</div>
                      <Icon
                        icon={
                          selectedQualitative === "chain"
                            ? sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                            : "formkit:arrowdown"
                        }
                        className={` dark:text-white text-black w-[10px] h-[10px] ${
                          selectedQualitative === "chain"
                            ? "opacity-100"
                            : "opacity-20"
                        }`}
                      />{" "}
                    </div>
                    <div
                      className="bg-[#344240] text-[8px] flex rounded-full font-normal items-center px-[5px] py-[4px] gap-x-[2px] cursor-pointer whitespace-nowrap"
                      onClick={() => {
                        setAvailabilityFilter(true);
                        if (DAIndex === allChainsDA.length - 1) {
                          setAvailabilityFilter(false);
                          setDAIndex(0);
                          setSelectedAvailability(allChainsDA[DAIndex]);
                        } else {
                          setDAIndex(DAIndex + 1);
                          setSelectedAvailability(allChainsDA[DAIndex]);
                        }
                      }}
                    >
                      Data Availability
                      {availabilityFilter && dataAvailByFilter
                        ? ": " + selectedAvailability
                        : ""}
                      <Icon
                        icon={"feather:x-circle"}
                        className={` dark:text-white text-black w-[10px] h-[10px] relative bottom-[0.5px] ${
                          availabilityFilter ? "block" : "hidden"
                        }`}
                        onClick={() => {
                          setAvailabilityFilter(false);
                        }}
                      />{" "}
                    </div>
                  </div>
                  <div
                    className="grid grid-flow-col items-center justify-between pr-[10px]"
                    style={{
                      gridTemplateColumns: Object.values(metrics)
                        .filter((metric) => metric.enabled)
                        .map((metric) => `minmax(${metric.width}, 100%)`)
                        .join(" "),
                    }}
                  >
                    {Object.keys(metrics)
                      .sort(
                        // master has the priority of each metric
                        (a, b) =>
                          master.fee_metrics[a].priority -
                          master.fee_metrics[b].priority,
                      )
                      .map((metric, i) => {
                        if (!metrics[metric].enabled) return null;

                        return (
                          <div
                            className="flex items-center justify-center"
                            key={metric + "_header"}
                          >
                            <div
                              className="flex items-center justify-end"
                              style={{ width: metrics[metric].width }}
                            >
                              <div
                                className="flex items-center gap-x-0.5 cursor-pointer -mr-[12px]  z-10"
                                onClick={() => {
                                  if (selectedQuantitative === metric) {
                                    if (selectedQualitative) {
                                      setSelectedQualitative(null);
                                    } else {
                                      setSortOrder(!sortOrder);
                                    }
                                  } else {
                                    setSelectedQualitative(null);
                                    setSelectedQuantitative(metric);
                                  }
                                }}
                              >
                                <div className="">
                                  {master.fee_metrics[metric].name}
                                </div>
                                <Icon
                                  icon={
                                    !selectedQualitative &&
                                    selectedQuantitative === metric
                                      ? sortOrder
                                        ? "formkit:arrowdown"
                                        : "formkit:arrowup"
                                      : "formkit:arrowdown"
                                  }
                                  className={`dark:text-white text-black w-[10px] h-[10px] ${
                                    !selectedQualitative &&
                                    selectedQuantitative === metric
                                      ? "opacity-100"
                                      : "opacity-20"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div
                    className={`relative pl-[14px] flex flex-col justify-end items-end space-x-[1px] font-normal overflow-y-visible`}
                  >
                    <div className="relative flex space-x-[1px] items-end -bottom-2">
                      <div
                        className={`absolute right-[5px] w-[29px] h-[12px] text-[8px] transition-all duration-100 ${
                          selectedBarIndex >= 18 && selectedBarIndex <= 22
                            ? "-top-[22px]"
                            : "-top-2"
                        }`}
                      >
                        hourly
                      </div>
                      {Array.from({ length: NUM_HOURS }, (_, index) => (
                        <div
                          key={index.toString() + "columns"}
                          className={`flex items-end w-[5px] origin-bottom  border-t border-x border-[#344240] bg-[#344240] hover:cursor-pointer rounded-t-full transition-transform duration-100 
                          ${
                            selectedBarIndex === index
                              ? "scale-[1.5] bg-transparent"
                              : hoverBarIndex === index
                              ? "scale-x-[100%]"
                              : "scale-x-[100%]"
                          }
                          `}
                          onMouseEnter={() => {
                            setHoverBarIndex(index);
                          }}
                          onMouseLeave={() => {
                            setHoverBarIndex(null);
                          }}
                          onClick={() => {
                            setSelectedBarIndex(index);
                          }}
                        >
                          <div
                            className={`w-[5px] transition-all duration-0  ${
                              selectedBarIndex === index
                                ? "h-[16px]"
                                : hoverBarIndex === index
                                ? "h-[14px]"
                                : "h-[8px]"
                            }`}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* <div className="w-[160px] block md:hidden"></div> */}
              </div>
              <div
                className={`gap-y-1 relative`}
                // extra row if mobile for Ethereum rows
                style={{
                  minHeight:
                    (finalSort.length + 1) * (rowHeight + rowGapY) + 25,
                }}
              >
                {transitions((style, item) => {
                  return (
                    <animated.div
                      key={item.chain[0]}
                      className={`border-forest-700 border-[1px] mb-1 absolute rounded-full border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[10px] pr-[20px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[180px,auto,180px] items-center
                      ${
                        isMobile
                          ? "text-[12px] w-[740px]"
                          : "text-[14px] w-[888px]"
                      } ${
                        selectedChains[item.chain[1]]
                          ? "opacity-100"
                          : "opacity-50"
                      }`}
                      style={{ ...style }}
                    >
                      <div
                        className={`flex justify-start items-center h-full gap-x-[5px] `}
                      >
                        <div
                          className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                        >
                          <Icon
                            icon={`gtp:${
                              AllChainsByKeys[item.chain[1]].urlKey
                            }-logo-monochrome`}
                            className={`${
                              isMobile
                                ? "h-[18px] w-[18px]"
                                : "h-[24px] w-[24px]"
                            }`}
                            style={{
                              color:
                                AllChainsByKeys[item.chain[1]].colors[
                                  theme ?? "dark"
                                ][0],
                            }}
                          />
                        </div>
                        <Link
                          className="pr-[5px] hover:underline whitespace-nowrap"
                          href={`https://www.growthepie.xyz/chains/${
                            AllChainsByKeys[item.chain[1]].urlKey
                          }`}
                          target="_blank"
                        >
                          {isMobile
                            ? master.chains[item.chain[1]].name_short
                            : AllChainsByKeys[item.chain[1]].label}
                        </Link>
                        <div
                          className={`bg-[#344240] flex rounded-full  items-center  transition-width overflow-hidden duration-300 ${
                            isMobile
                              ? "px-[4px] py-[2px] gap-x-[1px]"
                              : "px-[5px] py-[3px] gap-x-[2px]"
                          }`}
                          onMouseEnter={() => {
                            setHoveredItems({
                              hoveredChain: item.chain[1],
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredItems({
                              hoveredChain: null,
                              hoveredDA: hoveredItems.hoveredDA,
                            });
                          }}
                        >
                          {dataAvailByChain[item.chain[1]].map(
                            (avail, index, array) => [
                              <div
                                key={avail.icon}
                                className={`flex relative items-center gap-x-0.5 hover:cursor-pointer`}
                                onMouseEnter={() => {
                                  setHoveredItems({
                                    hoveredChain: hoveredItems.hoveredChain,
                                    hoveredDA: avail.label,
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredItems({
                                    hoveredChain: hoveredItems.hoveredChain,
                                    hoveredDA: null,
                                  });
                                }}
                                onClick={() => {
                                  if (!availabilityFilter) {
                                    setAvailabilityFilter(true);
                                  }
                                  setSelectedAvailability(avail.label);
                                  setManualSelectedChains({});
                                }}
                              >
                                <Icon
                                  icon={`gtp:${avail.icon}`}
                                  className={`${
                                    dataAvailByFilter &&
                                    selectedAvailability === avail.label &&
                                    selectedChains[item.chain[1]]
                                      ? "text-forest-200"
                                      : "text-[#5A6462] "
                                  }
                                  ${
                                    isMobile
                                      ? "h-[10px] w-[10px] "
                                      : "h-[12px] w-[12px] "
                                  }`}
                                />
                                <div
                                  className={`text-[8px] text-center font-semibold overflow-hidden ${
                                    selectedAvailability === avail.label &&
                                    selectedQualitative === "availability"
                                      ? "text-forest-200"
                                      : "text-[#5A6462] "
                                  } ${
                                    hoveredItems.hoveredDA === avail.label &&
                                    hoveredItems.hoveredChain === item.chain[1]
                                      ? ""
                                      : "-mr-[2px]"
                                  }`}
                                  style={{
                                    maxWidth:
                                      hoveredItems.hoveredDA === avail.label &&
                                      hoveredItems.hoveredChain ===
                                        item.chain[1]
                                        ? "50px"
                                        : "0px",

                                    transition: "max-width 0.3s ease", // Adjust duration and timing function as needed
                                  }}
                                >
                                  {avail.label}
                                </div>
                              </div>,
                              index !== array.length - 1 && (
                                /* Content to render when index is not the last element */
                                <div
                                  key={avail.label}
                                  className="w-[12px] h-[12px] flex items-center justify-center"
                                  style={{
                                    color: "#5A6462",
                                  }}
                                >
                                  +
                                </div>
                              ),
                            ],
                          )}
                        </div>
                      </div>
                      {/* <div
                        className={`flex justify-between pl-[40px] pr-[22.5px]`}
                      > */}
                      <div
                        className="grid grid-flow-col items-center justify-between pr-[10px]"
                        style={{
                          gridTemplateColumns: Object.values(metrics)
                            .filter((metric) => metric.enabled)
                            .map((metric) => `minmax(${metric.width}, 100%)`)
                            .join(" "),
                        }}
                      >
                        {Object.keys(metrics)
                          .sort(
                            // master has the priority of each metric
                            (a, b) =>
                              master.fee_metrics[a].priority -
                              master.fee_metrics[b].priority,
                          )
                          .map((metric, i) => {
                            if (!metrics[metric].enabled) return null;

                            return (
                              <div
                                className="flex items-center justify-center"
                                key={metric + "_barcontent"}
                              >
                                <div
                                  className="flex items-center justify-end"
                                  style={{ width: metrics[metric].width }}
                                >
                                  {getFormattedLastValue(item.chain[1], metric)}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div
                        className={`pl-[15px] relative flex justify-end items-center h-full space-x-[1px]`}
                      >
                        {Array.from({ length: NUM_HOURS }, (_, index) => (
                          <div
                            key={index.toString() + "circles"}
                            className="h-[34px] flex items-center justify-end cursor-pointer"
                            onMouseEnter={() => {
                              setHoverBarIndex(index);
                            }}
                            onMouseLeave={() => {
                              setHoverBarIndex(null);
                            }}
                            onClick={() => {
                              setSelectedBarIndex(index);
                            }}
                          >
                            <div
                              className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
                                selectedBarIndex === index
                                  ? "scale-[160%]"
                                  : hoverBarIndex === index
                                  ? "scale-[120%] opacity-90"
                                  : "scale-100 opacity-50"
                              }`}
                              style={{
                                backgroundColor: getCircleColor(
                                  item.chain[1],
                                  index,
                                ),
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-[99%]">
                        <div
                          className={`relative flex items-center justify-end w-[22px] h-[22px] rounded-full cursor-pointer ${
                            selectedChains[item.chain[1]]
                              ? " bg-white dark:bg-forest-1000 dark:hover:forest-800"
                              : " bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                          }`}
                          onClick={() => {
                            if (selectedQualitative === "availability") {
                              if (
                                Object.keys(manualSelectedChains).includes(
                                  item.chain[1],
                                )
                              ) {
                                if (
                                  dataAvailByChain[item.chain[1]][0].label ===
                                    selectedAvailability &&
                                  !manualSelectedChains[item.chain[1]]
                                ) {
                                  setManualSelectedChains(
                                    (prevManualSelectedChains) => {
                                      // Create a new object by filtering out the key to remove
                                      const updatedManualSelectedChains =
                                        Object.fromEntries(
                                          Object.entries(
                                            prevManualSelectedChains,
                                          ).filter(
                                            ([key, _]) => key !== item.chain[1],
                                          ),
                                        );

                                      // Return the updated object
                                      return updatedManualSelectedChains;
                                    },
                                  );
                                } else if (
                                  dataAvailByChain[item.chain[1]][0].label !==
                                    selectedAvailability &&
                                  manualSelectedChains[item.chain[1]]
                                ) {
                                  setManualSelectedChains(
                                    (prevManualSelectedChains) => {
                                      // Create a new object by filtering out the key to remove
                                      const updatedManualSelectedChains =
                                        Object.fromEntries(
                                          Object.entries(
                                            prevManualSelectedChains,
                                          ).filter(
                                            ([key, _]) => key !== item.chain[1],
                                          ),
                                        );

                                      // Return the updated object
                                      return updatedManualSelectedChains;
                                    },
                                  );
                                } else {
                                  setManualSelectedChains(
                                    (prevManualSelectedChains) => {
                                      // Create a new object by spreading the previous state and adding the new object
                                      return {
                                        ...prevManualSelectedChains,
                                        [item.chain[1]]:
                                          !manualSelectedChains[item.chain[1]], // Replace newKey and newValue with the key-value pair you want to add
                                      };
                                    },
                                  );
                                }
                              } else {
                                setManualSelectedChains(
                                  (prevManualSelectedChains) => {
                                    // Create a new object by spreading the previous state and adding the new object
                                    return {
                                      ...prevManualSelectedChains,
                                      [item.chain[1]]:
                                        !selectedChains[item.chain[1]], // Replace newKey and newValue with the key-value pair you want to add
                                    };
                                  },
                                );
                              }
                            }
                            setSelectedChains((prevState) => {
                              return {
                                ...prevState,
                                [item.chain[1]]: !prevState[item.chain[1]],
                              };
                            });
                          }}
                        >
                          <div
                            className="absolute rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              color: !selectedChains[item.chain[1]]
                                ? undefined
                                : "#EAECEB",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="22"
                              height="22"
                              viewBox="0 0 22 22"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`w-[22px] h-[22px]  ${
                                !selectedChains[item.chain[1]]
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <circle
                                xmlns="http://www.w3.org/2000/svg"
                                cx="11"
                                cy="11"
                                r="7.6"
                              />
                            </svg>
                          </div>
                          <div
                            className={`p-0.5 rounded-full ${
                              !selectedChains[item.chain[1]]
                                ? "bg-forest-50 dark:bg-[#1F2726]"
                                : "bg-white dark:bg-[#1F2726]"
                            }`}
                          >
                            <Icon
                              icon="feather:check-circle"
                              className={`w-[17.6px] h-[17.6px] ${
                                !selectedChains[item.chain[1]]
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                              style={{
                                color: selectedChains[item.chain[1]]
                                  ? undefined
                                  : "#EAECEB",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </animated.div>
                  );
                })}
                {master && (
                  <div
                    className={`w-full aboslute bottom-[28px] border-forest-700 border-[1px] absolute rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[10px] pr-[32px] md:pr-[20px] lg:pr-[32px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[180px,auto,180px] items-center ${
                      isMobile ? "text-[12px]" : "text-[14px]"
                    }`}
                  >
                    <div
                      className={`flex justify-start items-center h-full gap-x-[5px] `}
                    >
                      <div
                        className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                      >
                        <Icon
                          icon={`gtp:${AllChainsByKeys["ethereum"].urlKey}-logo-monochrome`}
                          className={`${
                            isMobile ? "h-[18px] w-[18px]" : "h-[24px] w-[24px]"
                          }`}
                          style={{
                            color:
                              AllChainsByKeys["ethereum"].colors["light"][1],
                          }}
                        />
                      </div>
                      <Link
                        className="hover:underline"
                        href={`https://www.growthepie.xyz/chains/${AllChainsByKeys["ethereum"].urlKey}`}
                        target="_blank"
                      >
                        {isMobile
                          ? master.chains["ethereum"].name_short
                          : AllChainsByKeys["ethereum"].label}
                      </Link>
                    </div>

                    <div
                      className="grid grid-flow-col items-center justify-between pr-[10px]"
                      style={{
                        gridTemplateColumns: Object.values(metrics)
                          .filter((metric) => metric.enabled)
                          .map((metric) => `minmax(${metric.width}, 100%)`)
                          .join(" "),
                      }}
                    >
                      {Object.keys(metrics)
                        .sort(
                          (a, b) =>
                            // master has the priority of each metric
                            master.fee_metrics[a].priority -
                            master.fee_metrics[b].priority,
                        )
                        .map((metric) => {
                          if (!metrics[metric].enabled) return null;

                          return (
                            <div
                              className="flex items-center justify-center"
                              key={metric + "_ethbar"}
                            >
                              <div
                                className="flex items-center justify-end"
                                style={{ width: metrics[metric].width }}
                              >
                                {getFormattedLastValue("ethereum", metric)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div
                      className={`pl-[15px] relative flex items-center h-full space-x-[1px] justify-end`}
                    >
                      {Array.from({ length: NUM_HOURS }, (_, index) => (
                        <div
                          key={index.toString() + "circles"}
                          className="h-[32px] flex items-center justify-end cursor-pointer"
                          onMouseEnter={() => {
                            setHoverBarIndex(index);
                          }}
                          onMouseLeave={() => {
                            setHoverBarIndex(null);
                          }}
                          onClick={() => {
                            setSelectedBarIndex(index);
                          }}
                        >
                          <div
                            className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
                              selectedBarIndex === index
                                ? "scale-[160%]"
                                : hoverBarIndex === index
                                ? "scale-[120%] opacity-90"
                                : "scale-100 opacity-50"
                            }`}
                            style={{
                              backgroundColor: getCircleColor(
                                "ethereum",
                                index,
                              ),
                            }}
                          ></div>
                        </div>
                      ))}
                      <div className="absolute -right-[3px] top-[34px] w-[147px] h-[10px] border-forest-600 border-x-[1px] flex justify-between text-[10px]">
                        <div className="relative top-2">
                          {NUM_HOURS} Hours Ago
                        </div>
                        <div className="relative top-2">Now</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </FeesHorizontalScrollContainer>

        <OffScreenSlider>
          {feeData && master && (
            <ChartContainer
              isOpen={isChartOpen}
              setIsOpen={setIsChartOpen}
              selectedMetric={selectedQuantitative}
              selectedTimeframe={"24hrs"}
              selectedChains={Object.keys(selectedChains).filter(
                (c) => selectedChains[c] === true,
              )}
              showGwei={showGwei}
              showCents={showCents}
              master={master}
            />
          )}
        </OffScreenSlider>

        <Footer
          showCents={showCents}
          setShowCents={setShowCents}
          hoverSettings={hoverSettings}
          setHoverSettings={setHoverSettings}
          selectedQuantitative={selectedQuantitative}
          setSelectedQuantitative={setSelectedQuantitative}
          metricCategories={metricCategories}
          metrics={metrics}
          setMetrics={setMetrics}
          enabledMetricsCount={enabledMetricsCount}
          master={master}
        />
      </div>
    </>
  );
}
