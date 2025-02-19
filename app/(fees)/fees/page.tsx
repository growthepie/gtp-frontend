"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { useSessionStorage, useLocalStorage, useMediaQuery } from "usehooks-ts";
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
import { useMaster } from "@/contexts/MasterContext";

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
  const { AllChainsByKeys } = useMaster();

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
      width: number;
      enabled: boolean;
    };
  }>({
    txcosts_median: {
      width: 115,
      enabled: true,
    },
    txcosts_native_median: {
      width: 125,
      enabled: true,
    },
    txcosts_swap: {
      width: 105,
      enabled: true,
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

    return length;
  }, [feeData]);

  useEffect(() => {
    if (!feeData || !master) return;

    const newMetrics = { ...metrics };

    // add tps to metrics if available
    if (feeData.chain_data["ethereum"]["hourly"]["tps"]) {
      newMetrics["tps"] = {
        width: 75,
        enabled: true,
      };
    } else {
      // remove tps from metrics if not available
      if ("tps" in metrics) {
        delete newMetrics["tps"];
      }
    }

    // add throughput to metrics if available
    if (feeData.chain_data["ethereum"]["hourly"]["throughput"]) {
      newMetrics["throughput"] = {
        width: 115,
        enabled: true,
      };
    } else {
      // remove throughput from metrics if not available
      if ("throughput" in metrics) {
        delete newMetrics["throughput"];
      }
    }

    // add average fee to metrics if available
    if (feeData.chain_data["ethereum"]["hourly"]["txcosts_avg"]) {
      newMetrics["txcosts_avg"] = {
        width: 115,
        enabled: true,
      };
    } else {
      // remove tps from metrics if not available
      if ("txcosts_avg" in metrics) {
        delete newMetrics["txcosts_avg"];
      }
    }

    // enabled should only be true for the 4 lowest priority metrics
    Object.keys(newMetrics)
      .filter((key) => feeData.chain_data["ethereum"]["hourly"][key])
      .sort((a, b) => {
        return master.fee_metrics[a].priority - master.fee_metrics[b].priority;
      })

      .forEach((key, index) => {
        newMetrics[key].enabled = index < 3;
      });

    setMetrics(newMetrics);
  }, [feeData, master]);

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
  const [allChainsSelect, setAllChainsSelect] = useState(false);
  const { theme } = useTheme();

  const [selectedChains, setSelectedChains] = useLocalStorage<{
    [key: string]: boolean;
  }>(
    "feesSelectedChains",
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

        if (aData.length > 0 && bData.length === 0) return -1;
        if (aData.length === 0 && bData.length > 0) return 1;

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
    master,
    selectedChains,
    sortOrder,
    selectedQuantitative,
    NUM_HOURS,
    selectedBarIndex,
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
      from: { y: -40, height: 0, opacity: 0 },
      enter: ({ y, height }) => ({ y, height, opacity: 1 }),
      update: ({ y, height }) => ({ y, height }),
      leave: { y: 40, height: 0, opacity: 0 },
      config: { mass: 1, tension: 300, friction: 50 },
      // trail: 50,
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

  const selectedChainOutcomes = useMemo(() => {
    let allChains = true;
    let noChains = true;
    let retNumber = 0;
    //ret number 0 allChains true, 1 noChains true, 2 custom.
    Object.keys(selectedChains).map((key) => {
      if (selectedChains[key]) {
        noChains = false;
        retNumber = 0;
      } else {
        allChains = false;
        retNumber = 1;
      }
    });

    if (!allChains && !noChains) {
      retNumber = 2;
      setAllChainsSelect(true);
    }

    return retNumber;
  }, [selectedChains]);

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

      let decimals =
        unitKey === "eth" && showGwei
          ? 2
          : master.fee_metrics[metric].units[unitKey]
            ? master.fee_metrics[metric].units[unitKey].decimals
            : 2;

      if (master.fee_metrics[metric].currency && showUsd && showCents) {
        decimals = master.fee_metrics[metric].units["usd"].decimals - 2;
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
                  maximumFractionDigits: decimals,
                  minimumFractionDigits: decimals,
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
                className={`text-[8px] text-forest-900 ${master.fee_metrics[metric].units[unitKey].suffix
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
                className={`text-[8px] text-forest-900 ${master.fee_metrics[metric].units[unitKey].suffix
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
                maximumFractionDigits: decimals,
                minimumFractionDigits: decimals,
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
              className={`text-[8px] text-forest-400 ${master.fee_metrics[metric].units[unitKey].suffix
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
              className={`text-[8px] text-forest-400 ${master.fee_metrics[metric].units[unitKey].suffix
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

  function toggleAllChains() {
    Object.keys(selectedChains).map((key) => {
      setSelectedChains((prevState) => {
        return {
          ...prevState,
          [key]: allChainsSelect,
        };
      });
    });

    setAllChainsSelect(!allChainsSelect);
  }

  return (
    <>
      <ShowLoading
        dataLoading={[feeLoading, masterLoading]}
        dataValidating={[feeValidating, masterValidating]}
        fullScreen={true}
      />
      <div
        className="transition-all duration-300 overflow-x-hidden"
        style={{
          paddingBottom: isChartOpen
            ? `${isMobile ? 313 + 60 : 413 + 60}px`
            : `${96 + 60}px`,
        }}
      // ref={pageRef}
      >
        <Header />

        <FeesContainer className={`hidden md:block`}>
          <div className="relative flex p-[5px] items-center w-full justify-between rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000] z-10">
            <a
              className="flex items-center w-[162px] bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
              href="https://www.growthepie.xyz/"
              target="_blank"
            >
              <div className="w-6 h-6">
                {/* <Icon icon="gtp:house" className="h-6 w-6" /> */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.3247 0.229798C11.7219 -0.0765992 12.2781 -0.0765992 12.6753 0.229798L22.5753 7.86616C22.8433 8.07284 23 8.39063 23 8.72727V20.7273C23 21.5953 22.6523 22.4277 22.0335 23.0414C21.4146 23.6552 20.5752 24 19.7 24H4.3C3.42479 24 2.58542 23.6552 1.96655 23.0414C1.34768 22.4277 1 21.5953 1 20.7273V8.72727C1 8.39063 1.15672 8.07284 1.42467 7.86616L11.3247 0.229798ZM3.2 9.26082V20.7273C3.2 21.0166 3.31589 21.2941 3.52218 21.4987C3.72847 21.7032 4.00826 21.8182 4.3 21.8182H19.7C19.9917 21.8182 20.2715 21.7032 20.4778 21.4987C20.6841 21.2941 20.8 21.0166 20.8 20.7273V9.26082L12 2.47294L3.2 9.26082Z"
                    fill="url(#paint0_linear_5844_24843)"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 12.0833C8 11.485 8.44772 11 9 11H15C15.5523 11 16 11.485 16 12.0833V22.9167C16 23.515 15.5523 24 15 24C14.4477 24 14 23.515 14 22.9167V13.1667H10V22.9167C10 23.515 9.55228 24 9 24C8.44772 24 8 23.515 8 22.9167V12.0833Z"
                    fill="url(#paint1_linear_5844_24843)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_5844_24843"
                      x1="12"
                      y1="0"
                      x2="28.5901"
                      y2="21.3803"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#FE5468" />
                      <stop offset="1" stopColor="#FFDF27" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_5844_24843"
                      x1="12"
                      y1="11"
                      x2="12"
                      y2="24"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#10808C" />
                      <stop offset="1" stopColor="#1DF7EF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="font-semibold">Main platform</div>
            </a>
            <div
              className={`flex items-center relative h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-[15px] py-[10px] gap transition-all z-[11] duration-300 hover:cursor-pointer ${hoverSettings
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
                className={`transition-all ${hoverSettings ? "hidden" : "block"
                  }`}
              >
                <Icon
                  icon="gtp:gtp-settings"
                  className={`h-6 w-6 ${hoverSettings ? "text-sm" : ""}`}
                />
              </div>
              <div
                className={`transition-all ${hoverSettings ? "block" : "hidden"
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
              className={`absolute top-6 min-h-0 bg-[#151A19] right-[5px] rounded-b-2xl z-[10] transition-all duration-300 overflow-hidden ${hoverSettings
                ? `shadow-[0px_4px_46.2px_0px_#000000]`
                : "shadow-transparent"
                }`}
              style={{
                width: hoverSettings ? "336px" : 0,
                height: hoverSettings
                  ? `calc(100px + 28px + 30px * (1 + ${Object.keys(metrics).length
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
                className={`pt-[30px] pb-[20px] flex flex-col`}
                style={{
                  height: `calc(100px + 28px * (1 + ${Object.keys(metrics).length
                    }))`,
                }}
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
                            className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative ${hoverSettings ? "text-sm" : ""
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
                              className={`w-full text-center ${!showCents && "opacity-50"
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
                                {categoryKey} Metrics
                              </div>
                              {Object.keys(master.fee_metrics)
                                .filter(
                                  (metricKey) =>
                                    metrics[metricKey] &&
                                    master.fee_metrics[metricKey].category ==
                                    categoryKey,
                                )
                                .sort((a, b) => {
                                  // sort by priority
                                  return (
                                    master.fee_metrics[a].priority -
                                    master.fee_metrics[b].priority
                                  );
                                })
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
                                          className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative self-center justify-self-center ${hoverSettings ? "text-sm" : ""
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
                                              enabledMetricsCount === 6
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
                                            className={`w-full text-center ${metrics[metric].enabled &&
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
        <FeesContainer className="w-full mt-[30px] flex items-end sm:items-center justify-between md:justify-start gap-x-[10px]">
          <h1 className="text-[20px] md:text-[30px] leading-[120%] font-bold md:pl-[15px]">
            How much a typical user paid on L2s
          </h1>
          <div className="min-w-[92px] h-[26px] py-[6px] pl-[10px] pr-[5px] items-center justify-center border-[#344240] border bg-[#1F2726] text-[12px] rounded-r-full leading-[1] font-bold">
            {NUM_HOURS - selectedBarIndex === 1
              ? "1 hour Ago"
              : `${NUM_HOURS - selectedBarIndex} hours ago`}
          </div>
        </FeesContainer>

        <FeesHorizontalScrollContainer className="">
          {feeData && master && (
            <div className="relative w-auto overflow-x-visible">
              <div
                className={`relative w-full flex justify-start pt-[40px] pb-[8px] pr-[10px] text-[10px] md:text-[12px] font-bold leading-[1]`}
              >
                <div className="pl-[15px] pr-[20px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[200px,auto,180px] gap-x-[20px]">
                  <div className={`flex items-center gap-x-[10px]`}>
                    <div className={`h-[0px] w-[18px] md:h-[0px] md:w-[24px]`}>
                      <div className="h-[0px] w-[18px] md:w-[24px]" />
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
                        className={` dark:text-white text-black w-[10px] h-[10px] ${selectedQualitative === "chain"
                          ? "opacity-100"
                          : "opacity-20"
                          }`}
                      />{" "}
                    </div>
                    <div
                      className="bg-[#344240] text-[#CDD8D3] text-[8px] flex rounded-full font-normal items-center px-[5px] h-[16px] cursor-pointer whitespace-nowrap"
                      onClick={() => {
                        if (!availabilityFilter && DAIndex === 0) {
                          setAvailabilityFilter(true);
                        } else {
                          if (DAIndex === allChainsDA.length - 1) {
                            setDAIndex(0);
                            setSelectedAvailability(allChainsDA[DAIndex]);
                          } else {
                            setDAIndex(DAIndex + 1);
                            setSelectedAvailability(allChainsDA[DAIndex]);
                          }
                        }
                      }}
                    >
                      Data Availability
                      <div
                        className={`flex items-center ${availabilityFilter && dataAvailByFilter
                          ? "max-w-[200px]"
                          : "max-w-0"
                          } overflow-hidden transition-all duration-500`}
                      >
                        :{" "}
                        <div className="pl-[3px] flex items-center gap-x-[3px]">
                          <div className="flex items-center font-semibold">
                            {selectedAvailability}
                          </div>
                          <div className="w-[10px] h-[10px] relative">
                            <div
                              className="absolute -left-[3px] -right-[8px] -top-[4px] -bottom-[4px] z-[5] cursor-pointer"
                              onClick={(e) => {
                                setAvailabilityFilter(false);
                                setDAIndex(0);

                                e.stopPropagation();
                              }}
                            />
                            <Icon
                              icon={"feather:x-circle"}
                              className={`w-[10px] h-[10px]`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-flow-col items-center gap-x-[10px]">
                    {[
                      ...new Set(
                        Object.values(master.fee_metrics).map(
                          (metric) => metric.category,
                        ),
                      ),
                    ]
                      .filter(
                        // remove categories that have no enabled metrics
                        (category) => {
                          return Object.keys(metrics).some(
                            (metric) =>
                              metrics[metric].enabled &&
                              master.fee_metrics[metric].category === category,
                          );
                        },
                      )
                      .map((category) => (
                        <div
                          key={category}
                          className="relative grid grid-flow-col items-center justify-between"
                          style={{
                            width:
                              Object.keys(metrics).filter(
                                (metric) => metrics[metric].enabled,
                              ).length === 1
                                ? "100%"
                                : "auto",
                            gridTemplateColumns:
                              Object.keys(metrics).filter(
                                (metric) => metrics[metric].enabled,
                              ).length === 1
                                ? undefined
                                : Object.keys(metrics)
                                  .filter(
                                    (metric) =>
                                      metrics[metric].enabled &&
                                      master.fee_metrics[metric].category ===
                                      category,
                                  )
                                  .map(
                                    (metric, i) =>
                                      // `minmax(${
                                      //   i === 0
                                      //     ? metrics[metric].width - 40
                                      //     : metrics[metric].width
                                      // }px, 100%)`,
                                      `minmax(${i === 0
                                        ? metrics[metric].width - 60
                                        : metrics[metric].width
                                      }px`,
                                  )
                                  .join(" "),
                          }}
                        >
                          {Object.keys(metrics).filter(
                            (metric) => metrics[metric].enabled,
                          ).length > 1 && (
                              <>
                                <div className="absolute left-[62px] -right-[0px] -bottom-[12px] -top-[22px] flex items-start justify-end text-[10px] font-normal text-forest-500/30 whitespace-nowrap">
                                  {category} Metrics
                                </div>
                                <div className="absolute left-8 right-0 bottom-[20px] h-[1px] bg-gradient-to-r from-transparent to-forest-500/15" />
                              </>
                            )}

                          {Object.keys(metrics)
                            .filter(
                              (metric) =>
                                master.fee_metrics[metric].category ===
                                category,
                            )
                            .sort(
                              (a, b) =>
                                master.fee_metrics[a].priority -
                                master.fee_metrics[b].priority,
                            )
                            .map((metric, i) => {
                              if (!metrics[metric].enabled) return null;

                              return (
                                <div
                                  key={metric + "_header"}
                                  className="flex items-center"
                                  style={{
                                    justifyContent:
                                      Object.keys(metrics).filter(
                                        (metric) =>
                                          metrics[metric].enabled &&
                                          master.fee_metrics[metric]
                                            .category === category,
                                      ).length === 1
                                        ? "center"
                                        : "end",
                                  }}
                                >
                                  <div
                                    className="flex items-center justify-end"
                                    style={{ width: metrics[metric].width }}
                                  >
                                    <div
                                      className="flex flex-col justify-end z-[1]"
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
                                      {Object.keys(metrics).filter(
                                        (metric) => metrics[metric].enabled,
                                      ).length === 1 && (
                                          <div className="absolute -top-[22px] flex flex-col items-end place-self-end">
                                            <div className="flex items-start justify-end text-[10px] font-normal text-forest-500/30 whitespace-nowrap">
                                              {category} Metrics
                                            </div>
                                            <div className="w-[125px] h-[1px] bg-gradient-to-r from-transparent to-forest-500/15" />
                                          </div>
                                        )}
                                      <div className="flex items-center gap-x-0.5 cursor-pointer -mr-[12px]">
                                        <div className="">
                                          {
                                            master.fee_metrics[metric]
                                              .name_short
                                          }
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
                                          className={`dark:text-white text-black w-[10px] h-[10px] ${!selectedQualitative &&
                                            selectedQuantitative === metric
                                            ? "opacity-100"
                                            : "opacity-20"
                                            }`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ))}
                  </div>
                  <div
                    className={`relative -right-[1px] md:-left-[1px] flex flex-col justify-end items-end space-x-[1px] font-normal overflow-y-visible`}
                  >
                    <div className="relative flex space-x-[1px] items-end -bottom-2">
                      <div
                        className={`absolute right-[5px] w-[29px] h-[12px] text-[8px] transition-all duration-100 ${selectedBarIndex >= 18 && selectedBarIndex <= 22
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
                          ${selectedBarIndex === index
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
                            className={`w-[5px] transition-all duration-0  ${selectedBarIndex === index
                              ? "h-[16px]"
                              : hoverBarIndex === index
                                ? "h-[14px]"
                                : "h-[8px]"
                              }`}
                          ></div>
                        </div>
                      ))}
                      <div
                        className={`flex w-[17px] h-[17px] items-center justify-center p-0.5 rounded-full absolute bottom-[0.5px] -right-[29px] bg-[#1F2726] cursor-pointer`}
                        onClick={(e) => {
                          toggleAllChains();

                          e.stopPropagation();
                        }}
                      >
                        <div
                          className="absolute rounded-full transform -right-[11px] top-2.5 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            color: "#EAECEB",
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 27 27"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`w-[18px] h-[18px] ${selectedChainOutcomes === 0
                              ? "opacity-0"
                              : selectedChainOutcomes === 1
                                ? "opacity-40"
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
                        <Icon
                          icon={"feather:check-circle"}
                          className={` dark:text-white text-black w-[13px] h-[13px]  cursor-pointer ${selectedChainOutcomes === 0
                            ? "opacity-100"
                            : selectedChainOutcomes === 2
                              ? "opacity-40"
                              : "opacity-0"
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="w-[160px] block md:hidden"></div> */}
              </div>
              <div
                className={`relative`}
                // extra row if mobile for Ethereum rows
                style={{
                  minHeight:
                    (finalSort.length + 1) * (rowHeight + rowGapY) + 25,
                }}
              >
                {transitions((style, item, t, index) => {
                  return (
                    <animated.div
                      key={item.chain[0]}
                      className={`w-full absolute pr-[10px] h-[34px]`}
                      style={{ ...style }}
                    >
                      <div
                        className={`w-full border-forest-700 border-[1px] rounded-full border-black/[16%] dark:border-[#5A6462] h-full pl-[15px] pr-[20px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[200px,auto,180px] items-center gap-x-[20px] 
                      ${isMobile ? "text-[12px]" : "text-[14px]"} ${selectedChains[item.chain[1]]
                            ? "opacity-100"
                            : "opacity-50"
                          }`}
                      >
                        <div className={`flex items-center gap-x-[10px]`}>
                          <div
                            className={`h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                          >
                            <Icon
                              icon={`gtp:${AllChainsByKeys[item.chain[1]].urlKey
                                }-logo-monochrome`}
                              className={`h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                              style={{
                                color:
                                  AllChainsByKeys[item.chain[1]].colors[
                                  "dark"
                                  ][0],
                              }}
                            />
                          </div>
                          <Link
                            className="hover:underline whitespace-nowrap"
                            href={`https://www.growthepie.xyz/chains/${AllChainsByKeys[item.chain[1]].urlKey
                              }`}
                            target="_blank"
                          >
                            {isMobile
                              ? master.chains[item.chain[1]].name_short
                              : AllChainsByKeys[item.chain[1]].label}
                          </Link>
                          <div
                            className={`group bg-[#344240] flex rounded-full transition-width duration-300 pl-[5px] pr-[5px] h-[18px] gap-x-[3px] whitespace-nowrap`}
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
                                  className={`flex relative items-center gap-x-[3px] cursor-pointer`}
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
                                    className={`h-[12px] md:w-[12px] ${dataAvailByFilter &&
                                      selectedAvailability === avail.label &&
                                      selectedChains[item.chain[1]]
                                      ? "text-forest-200"
                                      : "text-[#CDD8D3]/60"
                                      }
                                  `}
                                  />
                                  <div
                                    className={`flex items-center text-[8px] font-semibold leading-tight ${dataAvailByFilter &&
                                      selectedAvailability === avail.label &&
                                      selectedChains[item.chain[1]]
                                      ? "text-forest-200"
                                      : "text-[#CDD8D3]/60"
                                      }`}
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

                        <div className="grid grid-flow-col items-center gap-x-[10px]">
                          {[
                            ...new Set(
                              Object.values(master.fee_metrics).map(
                                (metric) => metric.category,
                              ),
                            ),
                          ]
                            .filter(
                              // remove categories that have no enabled metrics
                              (category) => {
                                return Object.keys(metrics).some(
                                  (metric) =>
                                    metrics[metric].enabled &&
                                    master.fee_metrics[metric].category ===
                                    category,
                                );
                              },
                            )
                            .map((category) => (
                              <div
                                key={category}
                                className={`grid grid-flow-col items-center justify-between`}
                                style={{
                                  width:
                                    Object.keys(metrics).filter(
                                      (metric) => metrics[metric].enabled,
                                    ).length === 1
                                      ? "100%"
                                      : "auto",
                                  gridTemplateColumns:
                                    Object.keys(metrics).filter(
                                      (metric) => metrics[metric].enabled,
                                    ).length === 1
                                      ? undefined
                                      : Object.keys(metrics)
                                        .filter(
                                          (metric) =>
                                            metrics[metric].enabled &&
                                            master.fee_metrics[metric]
                                              .category === category,
                                        )
                                        .map(
                                          (metric, i) =>
                                            // `minmax(${
                                            //   i === 0
                                            //     ? metrics[metric].width - 40
                                            //     : metrics[metric].width
                                            // }px, 100%)`,
                                            `minmax(${i === 0
                                              ? metrics[metric].width - 60
                                              : metrics[metric].width
                                            }px`,
                                        )
                                        .join(" "),
                                }}
                              >
                                {Object.keys(metrics)
                                  .filter(
                                    (metric) =>
                                      master.fee_metrics[metric].category ===
                                      category,
                                  )
                                  .sort(
                                    (a, b) =>
                                      master.fee_metrics[a].priority -
                                      master.fee_metrics[b].priority,
                                  )
                                  .map((metric, i) => {
                                    if (!metrics[metric].enabled) return null;

                                    return (
                                      <div
                                        key={metric + "_barcontent"}
                                        className="flex items-center"
                                        style={{
                                          justifyContent:
                                            Object.keys(metrics).filter(
                                              (metric) =>
                                                metrics[metric].enabled &&
                                                master.fee_metrics[metric]
                                                  .category === category,
                                            ).length === 1
                                              ? "center"
                                              : "end",
                                        }}
                                      >
                                        <div
                                          className="flex items-center justify-end"
                                          style={{
                                            width: metrics[metric].width,
                                          }}
                                        >
                                          {getFormattedLastValue(
                                            item.chain[1],
                                            metric,
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ))}
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
                                className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${selectedBarIndex === index
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
                        <div className="absolute right-[0px]">
                          <div
                            className={`relative flex items-center justify-end w-[22px] h-[22px] rounded-full cursor-pointer ${selectedChains[item.chain[1]]
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
                                              ([key, _]) =>
                                                key !== item.chain[1],
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
                                              ([key, _]) =>
                                                key !== item.chain[1],
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
                                            !manualSelectedChains[
                                            item.chain[1]
                                            ], // Replace newKey and newValue with the key-value pair you want to add
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
                                className={`w-[22px] h-[22px]  ${!selectedChains[item.chain[1]]
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
                              className={`p-0.5 rounded-full ${!selectedChains[item.chain[1]]
                                ? "bg-forest-50 dark:bg-[#1F2726]"
                                : "bg-white dark:bg-[#1F2726]"
                                }`}
                            >
                              <Icon
                                icon="feather:check-circle"
                                className={`w-[17.6px] h-[17.6px] ${!selectedChains[item.chain[1]]
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
                      </div>
                    </animated.div>
                  );
                })}
                {master && (
                  <div
                    className={`absolute bottom-[28px] w-full border-forest-700 border-[1px] rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[15px] pr-[32px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[200px,auto,180px] items-center  gap-x-[20px] ${isMobile ? "text-[12px]" : "text-[14px]"
                      }`}
                  >
                    <div
                      className={`flex justify-start items-center h-full gap-x-[10px]`}
                    >
                      <div
                        className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                      >
                        <Icon
                          icon={`gtp:${AllChainsByKeys["ethereum"].urlKey}-logo-monochrome`}
                          className={`${isMobile ? "h-[18px] w-[18px]" : "h-[24px] w-[24px]"
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
                    <div className="grid grid-flow-col items-center gap-x-[10px]">
                      {[
                        ...new Set(
                          Object.values(master.fee_metrics).map(
                            (metric) => metric.category,
                          ),
                        ),
                      ]
                        .filter(
                          // remove categories that have no enabled metrics
                          (category) => {
                            return Object.keys(metrics).some(
                              (metric) =>
                                metrics[metric].enabled &&
                                master.fee_metrics[metric].category ===
                                category,
                            );
                          },
                        )
                        .map((category) => (
                          <div
                            key={category}
                            className="grid grid-flow-col items-center justify-between"
                            style={{
                              width:
                                Object.keys(metrics).filter(
                                  (metric) => metrics[metric].enabled,
                                ).length === 1
                                  ? "100%"
                                  : "auto",
                              gridTemplateColumns:
                                Object.keys(metrics).filter(
                                  (metric) => metrics[metric].enabled,
                                ).length === 1
                                  ? undefined
                                  : Object.keys(metrics)
                                    .filter(
                                      (metric) =>
                                        metrics[metric].enabled &&
                                        master.fee_metrics[metric]
                                          .category === category,
                                    )
                                    .map(
                                      (metric, i) =>
                                        // `minmax(${
                                        //   i === 0
                                        //     ? metrics[metric].width - 40
                                        //     : metrics[metric].width
                                        // }px, 100%)`,
                                        `minmax(${i === 0
                                          ? metrics[metric].width - 60
                                          : metrics[metric].width
                                        }px`,
                                    )
                                    .join(" "),
                            }}
                          >
                            {Object.keys(metrics)
                              .filter(
                                (metric) =>
                                  master.fee_metrics[metric].category ===
                                  category,
                              )
                              .sort(
                                (a, b) =>
                                  master.fee_metrics[a].priority -
                                  master.fee_metrics[b].priority,
                              )
                              .map((metric, i) => {
                                if (!metrics[metric].enabled) return null;

                                return (
                                  <div
                                    key={metric + "_barcontent"}
                                    className="flex items-center"
                                    style={{
                                      justifyContent:
                                        Object.keys(metrics).filter(
                                          (metric) =>
                                            metrics[metric].enabled &&
                                            master.fee_metrics[metric]
                                              .category === category,
                                        ).length === 1
                                          ? "center"
                                          : "end",
                                    }}
                                  >
                                    <div
                                      className="flex items-center justify-end"
                                      style={{
                                        width: metrics[metric].width,
                                      }}
                                    >
                                      {getFormattedLastValue(
                                        "ethereum",
                                        metric,
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ))}
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
                            className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${selectedBarIndex === index
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
        {/* {master && (
          <div
            className="z-40 sticky transition-all duration-300 px-[20px] md:px-[50px]"
            style={{
              bottom: isMobile
                ? isChartOpen
                  ? `calc(${240 + 96 + 60 + 60}px)`
                  : "240px"
                : isChartOpen
                ? `calc(${535}px)`
                : "218px",
            }}
          >
            <div
              className={`absolute w-fit border-forest-700 border-[1px] rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[15px] pr-[32px] flex-1 grid grid-cols-[150px,auto,150px] md:grid-cols-[200px,auto,180px] items-center  gap-x-[20px] ${
                isMobile ? "text-[12px]" : "text-[14px]"
              }`}
            >
              <div
                className={`flex justify-start items-center h-full gap-x-[10px]`}
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
                      color: AllChainsByKeys["ethereum"].colors["light"][1],
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
              <div className="grid grid-flow-col items-center gap-x-[10px]">
                {[
                  ...new Set(
                    Object.values(master.fee_metrics).map(
                      (metric) => metric.category,
                    ),
                  ),
                ]
                  .filter(
                    // remove categories that have no enabled metrics
                    (category) => {
                      return Object.keys(metrics).some(
                        (metric) =>
                          metrics[metric].enabled &&
                          master.fee_metrics[metric].category === category,
                      );
                    },
                  )
                  .map((category) => (
                    <div
                      key={category}
                      className="grid grid-flow-col items-center justify-between"
                      style={{
                        width:
                          Object.keys(metrics).filter(
                            (metric) => metrics[metric].enabled,
                          ).length === 1
                            ? "100%"
                            : "auto",
                        gridTemplateColumns:
                          Object.keys(metrics).filter(
                            (metric) => metrics[metric].enabled,
                          ).length === 1
                            ? undefined
                            : Object.keys(metrics)
                                .filter(
                                  (metric) =>
                                    metrics[metric].enabled &&
                                    master.fee_metrics[metric].category ===
                                      category,
                                )
                                .map(
                                  (metric, i) =>
                                    // `minmax(${
                                    //   i === 0
                                    //     ? metrics[metric].width - 40
                                    //     : metrics[metric].width
                                    // }px, 100%)`,
                                    `minmax(${
                                      i === 0
                                        ? metrics[metric].width - 60
                                        : metrics[metric].width
                                    }px`,
                                )
                                .join(" "),
                      }}
                    >
                      {Object.keys(metrics)
                        .filter(
                          (metric) =>
                            master.fee_metrics[metric].category === category,
                        )
                        .sort(
                          (a, b) =>
                            master.fee_metrics[a].priority -
                            master.fee_metrics[b].priority,
                        )
                        .map((metric, i) => {
                          if (!metrics[metric].enabled) return null;

                          return (
                            <div
                              key={metric + "_barcontent"}
                              className="flex items-center"
                              style={{
                                justifyContent:
                                  Object.keys(metrics).filter(
                                    (metric) =>
                                      metrics[metric].enabled &&
                                      master.fee_metrics[metric].category ===
                                        category,
                                  ).length === 1
                                    ? "center"
                                    : "end",
                              }}
                            >
                              <div
                                className="flex items-center justify-end"
                                style={{
                                  width: metrics[metric].width,
                                }}
                              >
                                {getFormattedLastValue("ethereum", metric)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
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
                        backgroundColor: getCircleColor("ethereum", index),
                      }}
                    ></div>
                  </div>
                ))}
                <div className="absolute -right-[3px] top-[34px] w-[147px] h-[10px] border-forest-600 border-x-[1px] flex justify-between text-[10px]">
                  <div className="relative top-2">{NUM_HOURS} Hours Ago</div>
                  <div className="relative top-2">Now</div>
                </div>
              </div>
            </div>
          </div>
        )} */}

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
