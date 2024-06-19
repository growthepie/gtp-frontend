"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import {
  useEventListener,
  useIsMounted,
  useLocalStorage,
  useMediaQuery,
} from "usehooks-ts";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Header from "./Header";
import { useTransition, animated } from "@react-spring/web";
import OffScreenSlider from "./OffScreenSlider";
import ChartContainer from "./ChartContainer";
import Footer from "./Footer";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";
import {
  useResizeObserver,
  useWindowSize,
  useDebounceCallback,
} from "usehooks-ts";
import Link from "next/link";

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
  const isMobile = useMediaQuery("(max-width: 767px)");

  const showGwei = true;

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
  const [selectedBarIndex, setSelectedBarIndex] = useState(23);
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

  const [metrics, setMetrics] = useState({
    txcosts_median: {
      title: "Median Fee",
      enabled: true,
    },
    txcosts_native_median: {
      title: "Transfer ETH",
      enabled: true,
    },
    txcosts_swap: {
      title: "Swap Token",
      enabled: true,
    },
  });

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
  } = useSWR("https://api.growthepie.xyz/v1/fees/table.json");

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
  }, [feeData, master, selectedChains, selectedAvailability, sortOrder]);

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
  ]);

  const sortByMetric = useMemo(() => {
    if (!feeData) return [];

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const isSelectedA = selectedChains[a];
        const isSelectedB = selectedChains[b];

        // If sortOrder is false, reverse the comparison
        const comparison = sortOrder ? 1 : -1;

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
        const aTxCost = aData[23 - selectedBarIndex]
          ? aData[23 - selectedBarIndex][showUsd ? 2 : 1]
          : null;
        const bTxCost = bData[23 - selectedBarIndex]
          ? bData[23 - selectedBarIndex][showUsd ? 2 : 1]
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
    showUsd,
    selectedBarIndex,
    sortOrder,
  ]);

  const finalSort = useMemo(() => {
    if (!feeData) return [];

    if (selectedQualitative === "chain") {
      return sortByChains;
    } else {
      return sortByMetric;
    }
  }, [
    sortByChains,
    sortByMetric,
    sortByCallData,
    selectedQualitative,
    sortOrder,
  ]);

  const feeIndexSortWithEthereum = useMemo(() => {
    if (!feeData) return [];

    const indices = Array.from({ length: 24 }, (_, i) => i); // Create an array from 0 to 23

    const sortedCosts = indices.map((index) => {
      const chainsData = Object.entries(feeData.chain_data).map(
        ([chain, data]) => ({
          chain,
          txCost: (data as any)["hourly"][selectedQuantitative]?.data[index]
            ? (data as any)["hourly"][selectedQuantitative]?.data[index][
            showUsd ? 2 : 1
            ]
            : null,
        }),
      );

      const filteredChainsData = chainsData.filter(
        ({ txCost }) => txCost !== null,
      );

      const sortedChains = filteredChainsData.sort((a, b) => {
        return a.txCost - b.txCost;
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
  }, [feeData, showUsd, selectedQuantitative]);

  const feeIndexSort = useMemo(() => {
    if (!feeData) return [];

    const indices = Array.from({ length: 24 }, (_, i) => i); // Create an array from 0 to 23

    const sortedCosts = indices.map((index) => {
      const chainsData = Object.entries(feeData.chain_data).map(
        ([chain, data]) => ({
          chain,
          txCost: (data as any)["hourly"][selectedQuantitative]?.data[index]
            ? (data as any)["hourly"][selectedQuantitative]?.data[index][
            showUsd ? 2 : 1
            ]
            : null,
        }),
      );

      const filteredChainsData = chainsData.filter(
        ({ txCost }) => txCost !== null,
      );

      const sortedChains = filteredChainsData.sort((a, b) => {
        return a.txCost - b.txCost;
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
      delete costs["ethereum"];
      return costs;
    });

    return filteredSortedCosts;
  }, [feeData, showUsd, selectedQuantitative]);

  const optIndex = useMemo(() => {
    let pickIndex = hoverBarIndex ? hoverBarIndex : selectedBarIndex;
    let retIndex = 23 - Number(pickIndex);
    return retIndex;
  }, [selectedBarIndex, hoverBarIndex]);

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

  // const bottomPaddingRef = useRef<HTMLDivElement>(null);
  // const { width: bottomPaddingWidth, height: bottomPaddingHeight } =
  //   useResizeObserver<HTMLDivElement>({
  //     ref: bottomPaddingRef,
  //     box: "content-box",
  //   });
  // const bottomSliderRef = useRef<HTMLDivElement>(null);
  // const { width: bottomSliderWidth, height: bottomSliderHeight } =
  //   useResizeObserver<HTMLDivElement>({
  //     ref: bottomSliderRef,
  //     box: "content-box",
  //   });
  // const pageRef = useRef<HTMLDivElement>(null);
  // const { width: pageWidth, height: pageHeight } =
  //   useResizeObserver<HTMLDivElement>({
  //     ref: pageRef,
  //     box: "content-box",
  //   });
  // const tableRef = useRef<HTMLDivElement>(null);
  // const { width: tableWidth, height: tableHeight } =
  //   useResizeObserver<HTMLDivElement>({
  //     ref: tableRef,
  //     box: "content-box",
  //   });
  // const ethereumRowPlaceHolderRef = useRef<HTMLDivElement>(null);
  // const { width: ethereumRowPlaceHolderWidth, height: ethereumRowPlaceHolderHeight } =
  //   useResizeObserver<HTMLDivElement>({
  //     ref: ethereumRowPlaceHolderRef,
  //     box: "content-box",
  //   });

  // const ethereumRowRef = useRef<HTMLDivElement>(null);

  // const [tableHorizontalScrollAmount, setTableHorizontalScrollAmount] =
  //   useState(0);

  // const [ethereumRowYRelativeToPlaceholder, setEthereumRowYRelativeToPlaceholder] =
  //   useState(0);
  // const [lastRowYRelativeToPage, setLastRowYRelativeToWindow] = useState(0);

  // // const [isBottomOfPageVisible, setIsBottomOfPageVisible] = useState(false);
  // const [isVerticalScrollbarVisible, setIsVerticalScrollbarVisible] =
  //   useState<boolean>(false);

  // const hasVerticalScrollbar = () => {
  //   if (window.innerHeight) {
  //     return Math.abs(document.body.offsetHeight - window.innerHeight) > 1;
  //   } else {
  //     return (
  //       document.documentElement.scrollHeight >
  //         document.documentElement.offsetHeight ||
  //       document.body.scrollHeight > document.body.offsetHeight
  //     );
  //   }
  // };

  // const handleResize = useCallback(() => {
  //   if (!ethereumRowPlaceHolderRef.current) return;

  //   const placeholderRect = ethereumRowPlaceHolderRef.current.getBoundingClientRect();
  //   // tableRect.bottom is the distance from the top of the viewport to the bottom of the table
  //   // to get the distance from the top of the page to the bottom of the table, we add the current scroll position
  //   const placeHolderTop = placeholderRect.top + window.scrollY;
  //   if(isMobile) setLastRowYRelativeToWindow(placeHolderTop);
  //   setLastRowYRelativeToWindow(placeHolderTop);

  //   if (!ethereumRowRef.current) return;

  //   const ethereumRowRect = ethereumRowRef.current.getBoundingClientRect();
  //   if(isMobile) setEthereumRowYRelativeToPlaceholder(ethereumRowRect.top - placeholderRect.top +34);
  //   else setEthereumRowYRelativeToPlaceholder(ethereumRowRect.top - placeholderRect.top);

  //   const isWindowScrollable = hasVerticalScrollbar();

  //   setIsVerticalScrollbarVisible(isWindowScrollable);

  //   // // check if no scroll or scroll full
  //   // const noScrollOrScrollFullCheck =
  //   //   Math.abs(
  //   //     window.scrollY + window.innerHeight - document.body.scrollHeight,
  //   //   ) < 5
  //   //     ? true
  //   //     : false;
  //   // setIsBottomOfPageVisible(noScrollOrScrollFullCheck);
  // }, []);

  // const [scrollYPixels, setScrollYPixels] = useState(0);

  // const handleScroll = useCallback(() => {
  //   setScrollYPixels(window.scrollY);

  //   handleResize();
  // }, [handleResize]);

  // useEventListener("scroll", handleScroll);
  // useEventListener("resize", handleResize);

  // useEffect(() => {
  //   handleResize();
  // }, [feeData, handleResize, master]);

  // useEffect(() => {
  //   if(isChartOpen) {
  //     setBottomPaddingStyle({
  //       height: isMobile ? "300px" : "400px",
  //     });

  //   }else{
  //     setBottomPaddingStyle({
  //       height: "0px",
  //     });
  //   }
  //   const chartToggleTimeout = setTimeout(() => {
  //     handleResize();
  //   }, 300);

  //   return () => {
  //     clearTimeout(chartToggleTimeout);
  //   };
  // }, [handleResize, isChartOpen, isMobile, isVerticalScrollbarVisible]);

  // const [bottomPaddingStyle, setBottomPaddingStyle] =
  //   useState<React.CSSProperties>({
  //     height: "0px",
  //   });

  // const [lastRowSliderSpacing, setLastRowSliderSpacing] = useState(0);
  // const [lastRowEthereumSpacing, setLastRowEthereumSpacing] = useState(0);

  // const ethereumRowStyle = useMemo<React.CSSProperties>(() => {
  //   let style = {};

  //   if (!pageHeight || !lastRowYRelativeToPage || !bottomSliderHeight)
  //     return {};

  //   let settledTop = lastRowYRelativeToPage;
  //   let sliderTop = pageHeight - bottomSliderHeight;
  //   let settledPositionToSlider = lastRowYRelativeToPage - sliderTop;
  //   let lastRowSliderTopDiff = sliderTop - lastRowYRelativeToPage;
  //   let lastRowWindowHeightDiff = window.innerHeight - lastRowYRelativeToPage;
  //   let bottomPadding = 0;

  //   let lastRowToBottomOfWindow = window.innerHeight - lastRowYRelativeToPage;

  //   let finalPositionY = settledTop;
  //   if (isMobile) finalPositionY = settledTop - 59;

  //   if (isChartOpen) {
  //     const initialPositionY = sliderTop - lastRowSliderSpacing;
  //     finalPositionY = sliderTop - lastRowSliderSpacing + scrollYPixels;

  //     if (isMobile)
  //       finalPositionY = sliderTop - lastRowSliderSpacing + scrollYPixels;

  //     let diff = lastRowYRelativeToPage - initialPositionY;

  //     bottomPadding = diff;

  //     if (isMobile) bottomPadding = diff - 59;

  //     if (lastRowSliderSpacing < 120) {
  //       finalPositionY = sliderTop - 120 + scrollYPixels + lastRowSliderSpacing;
  //       if (isMobile) finalPositionY = sliderTop - 120 + scrollYPixels - 59;

  //       bottomPadding = 120 - lastRowSliderTopDiff;
  //     }
  //   } else {
  //     if (lastRowSliderSpacing < 120) {
  //       finalPositionY = sliderTop - 120 + scrollYPixels + lastRowSliderSpacing;
  //       if (isMobile) finalPositionY = sliderTop - 120 - 59 + scrollYPixels;

  //       bottomPadding = 120 - lastRowSliderTopDiff;
  //     }
  //     setLastRowSliderSpacing(lastRowSliderTopDiff);
  //     setBottomPaddingStyle({
  //       height: "0px",
  //     });
  //   }

  //   // console.log({
  //   //   settledTop,
  //   //   sliderTop,
  //   //   settledPositionToSlider,
  //   //   lastRowSliderTopDiff,
  //   //   bottomPadding,
  //   //   finalPositionY,
  //   //   lastRowToBottomOfWindow,
  //   //   lastRowWindowHeightDiff,
  //   //   lastRowSliderSpacing,
  //   //   lastRowEthereumSpacing,
  //   // });

  //   setBottomPaddingStyle({
  //     height: `${bottomPadding}px`,
  //   });

  //   style = {
  //     position: "absolute",
  //     top: finalPositionY,
  //     left:
  //       tableHorizontalScrollAmount > 0
  //         ? `${-tableHorizontalScrollAmount}px`
  //         : undefined,
  //   };

  //   return style;
  // }, [
  //   bottomSliderHeight,
  //   isChartOpen,
  //   isMobile,
  //   lastRowEthereumSpacing,
  //   lastRowSliderSpacing,
  //   lastRowYRelativeToPage,
  //   pageHeight,
  //   scrollYPixels,
  //   tableHorizontalScrollAmount,
  // ]);

  // returns which chain has the lowest median fee in the selected time period
  const lowestMedianFee = useMemo(() => {
    if (!feeData) return null;

    const chains = Object.keys(feeData.chain_data).filter(
      (chain) => chain !== "ethereum",
    );

    const chainData = chains.map((chain) => {
      const chainData =
        feeData.chain_data[chain].hourly[selectedQuantitative].data;
      const medianFee = chainData[optIndex]
        ? chainData[optIndex][showUsd ? 2 : 1]
        : null;

      return {
        chain,
        medianFee,
      };
    });

    const sortedChainData = chainData
      .filter(({ medianFee }) => medianFee !== null)
      .sort((a, b) => a.medianFee - b.medianFee);

    return sortedChainData[0];
  }, [feeData, selectedQuantitative, showUsd, optIndex]);

  const lowestSwapFee = useMemo(() => {
    if (!feeData) return null;

    const chains = Object.keys(feeData.chain_data).filter(
      (chain) => chain !== "ethereum",
    );

    const chainData = chains.map((chain) => {
      const chainData = feeData.chain_data[chain].hourly["txcosts_swap"].data;
      const medianFee = chainData[optIndex]
        ? chainData[optIndex][showUsd ? 2 : 1]
        : null;

      return {
        chain,
        medianFee,
      };
    });

    const sortedChainData = chainData
      .filter(({ medianFee }) => medianFee !== null)
      .sort((a, b) => a.medianFee - b.medianFee);

    return sortedChainData[0];
  }, [feeData, showUsd, optIndex]);

  const lowestTransferFee = useMemo(() => {
    if (!feeData) return null;

    const chains = Object.keys(feeData.chain_data).filter(
      (chain) => chain !== "ethereum",
    );

    const chainData = chains.map((chain) => {
      const chainData =
        feeData.chain_data[chain].hourly["txcosts_native_median"].data;
      const medianFee = chainData[optIndex]
        ? chainData[optIndex][showUsd ? 2 : 1]
        : null;

      return {
        chain,
        medianFee,
      };
    });

    const sortedChainData = chainData
      .filter(({ medianFee }) => medianFee !== null)
      .sort((a, b) => a.medianFee - b.medianFee);

    return sortedChainData[0];
  }, [feeData, showUsd, optIndex]);

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

  const getValueColor = useCallback(
    (chain: string) => {
      return !feeIndexSort[optIndex][chain]
        ? "gray"
        : getGradientColor(
          Math.floor(
            (feeIndexSort[optIndex][chain][showUsd ? 2 : 1] /
              feeIndexSort[optIndex][
              Object.keys(feeIndexSort[optIndex])[
              Object.keys(feeIndexSort[optIndex]).length - 1
              ]
              ][showUsd ? 2 : 1]) *
            100,
          ),
          true,
        );
    },
    [feeIndexSort, optIndex, getGradientColor, showUsd],
  );

  const getFormattedLastValue = useCallback(
    (chain, metric) => {
      // feeData.chain_data[item.chain[1]]?.hourly?.txcosts_native_median?.data[optIndex]
      // true, feeData.chain_data["ethereum"]["hourly"]["txcosts_swap"].data[optIndex][showUsd ? 2 : 1]
      if (!feeData) return null;

      const value = feeData.chain_data[chain]["hourly"][metric].data[optIndex]
        ? feeData.chain_data[chain]["hourly"][metric].data[optIndex][
        showUsd ? 2 : 1
        ]
        : null;

      const usdClasses = "justify-center w-[60px] md:w-[65px] -mr-1.5";
      const gweiClasses = "justify-end w-[75px] md:w-[85px] -mr-1.5";
      const centsClasses = "justify-end w-[65px] md:w-[75px] -mr-1.5";

      let classes = usdClasses;
      // if (showGwei && !showUsd) classes = gweiClasses;
      // if (showCents && showUsd) classes = centsClasses;

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
      if (showGwei && !showUsd) {
        multiplier = 1000000000;
      }
      if (showCents && showUsd) {
        multiplier = 100;
      }
      const multipliedValue = value * multiplier;
      const fractionDigits = getNumFractionDigits(multipliedValue);

      console.log(multipliedValue + " - " + chain);

      // ethereum chain as a special case
      if (chain === "ethereum" && metric === selectedQuantitative) {
        return (
          <div
            className={`font-semibold flex items-center ${classes} h-[24px] transition-colors duration-100 border rounded-full`}
            style={{
              background: "#FE5468",
              borderColor: "#FF3838",
              color: "#1F2726",
            }}
          >
            {showUsd && !showCents && <div className="text-[10px]">$</div>}
            <div className="flex items-center">
              {Intl.NumberFormat("en-GB", {
                notation: "compact",
                maximumFractionDigits: fractionDigits,
                minimumFractionDigits: fractionDigits,
              }).format(multipliedValue)}
            </div>
            {showUsd && showCents && (
              <div className="pl-0.5 text-[8px] pr-[5px] text-forest-900">
                {" cents"}
              </div>
            )}
            {!showUsd && showGwei && (
              <div className="pl-0.5 text-[8px] pr-[5px] text-forest-900">
                {" gwei"}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          className={`flex items-center ${classes} h-[24px] transition-colors duration-100 border rounded-full`}
          style={{
            borderColor:
              selectedQuantitative === metric && selectedQualitative !== "chain"
                ? getValueColor(chain)
                : "transparent",
          }}
        >
          {showUsd && !showCents && (
            <div className="text-[9px] text-center mt-[1px] pr-[2px] text-forest-400">
              $
            </div>
          )}
          <div>
            {showCents && multipliedValue < 0.1
              ? "< 0.1"
              : !showCents && multipliedValue < 0.001
                ? "< 0.001"
                : Intl.NumberFormat(undefined, {
                  notation: "compact",
                  maximumFractionDigits: fractionDigits,
                  minimumFractionDigits: fractionDigits,
                }).format(multipliedValue)}
          </div>
          {showUsd && showCents && (
            <div className="pl-0.5 text-[8px] pr-[5px] text-forest-400">
              {" cents"}
            </div>
          )}
          {!showUsd && showGwei && (
            <div className="pl-0.5 text-[8px] pr-[5px] text-forest-400">
              {" gwei"}
            </div>
          )}
          {/* <div className="pl-0.5 text-[0.5rem] pr-[5px] text-forest-400">
              {showUsd ? " ¢" : showGwei ? " gwei" : ""}
            </div> */}
        </div>
      );
    },
    [
      feeData,
      getNumFractionDigits,
      getValueColor,
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

  return (
    <>
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
              className={`flex items-center relative h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-[15px] py-[10px] gap transition-all z-40 duration-300 hover:cursor-pointer ${hoverSettings
                ? "w-[308px] justify-start"
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
              className={`absolute top-6 bg-[#151A19] right-[5px] rounded-b-2xl z-20 transition-all duration-[290ms] overflow-hidden px-2 ${hoverSettings
                ? "w-[308px] h-[188px] shadow-[0px_4px_46.2px_0px_#000000] "
                : "w-[0px] h-[10px] shadow-transparent"
                }`}
              onMouseEnter={() => {
                setHoverSettings(true);
              }}
              onMouseLeave={() => {
                setHoverSettings(false);
              }}
            >
              <div className={`mt-[42px] flex flex-col relative `}>
                <div className="flex flex-col w-full absolute min-w-[280px]">
                  <div className="flex items-center mx-2 w-full gap-x-[10px]">
                    <Icon
                      icon="gtp:gtp-dollar"
                      className={`h-[15px] w-[15px] mt-1 font-[900] text-[#CDD8D3] relative -top-[3px] ${hoverSettings ? "text-sm" : ""
                        }`}
                    />
                    <div className="text-[10px] text-white">Denominates in</div>
                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                    <div
                      className="relative w-[143px] h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                      onClick={() => {
                        setShowCents(!showCents);
                      }}
                    >
                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px] ">
                        <div className="w-full flex items-start justify-center">
                          Full Dollar
                        </div>
                        <div
                          className={`w-full text-center ${!showCents && "opacity-50"
                            }`}
                        >
                          USD cents
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
                          {!showCents ? "Full Dollar" : "USD cents"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mx-2 w-full gap-x-[10px] relative min-w-[280px]">
                    <div className="relative top-2  left-1 z-20 flex flex-col gap-y-2 text-[12px]">
                      <div className="font-semibold">Metrics:</div>
                      {Object.keys(metrics).map((metric) => {
                        return (
                          <div
                            className="flex w-full justify-between min-w-[260px]"
                            key={metric + "_settings"}
                          >
                            <div className="font-semibold">
                              {metrics[metric].title}
                            </div>
                            <div
                              className="relative w-[143px] h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
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
                                        setSelectedQuantitative(metricKey);
                                        break; // Exit loop once the first enabled metric is found
                                      }
                                    }
                                  }
                                  if (!metrics[metric].enabled) {
                                    setSelectedQuantitative(metric);
                                  }

                                  setMetrics((prevMetrics) => ({
                                    ...prevMetrics,
                                    [metric]: {
                                      ...prevMetrics[metric],
                                      enabled: !prevMetrics[metric].enabled,
                                    },
                                  }));
                                }
                              }}
                            >
                              <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px] ">
                                <div className="w-full flex items-start justify-center">
                                  Enabled
                                </div>
                                <div
                                  className={`w-full text-center ${metrics[metric].enabled && "opacity-50"
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
        {/* <div className="w-full h-[70px]" /> */}
        <FeesContainer className="w-full mt-[30px] flex items-end sm:items-center justify-between md:justify-start  gap-x-[10px]">
          <h1 className="text-[20px] md:text-[30px] leading-[120%] font-bold ">
            {`How much a typical user paid on Layer 2s`}
          </h1>
          <div className="min-w-[92px] h-[26px] py-[6px] pl-[10px] pr-[5px] items-center justify-center border-[#344240] border bg-[#1F2726] text-[12px] rounded-r-full leading-[1] font-bold">
            {24 - selectedBarIndex === 1
              ? "1 hour Ago"
              : `${24 - selectedBarIndex} hours ago`}
          </div>
        </FeesContainer>

        <FeesHorizontalScrollContainer
          // ref={tableRef}
          className="w-[900px] pt-[20px]"
          // setHorizontalScrollAmount={(amount) =>
          //   setTableHorizontalScrollAmount(amount)
          // }
          style={{
            // fade out the bottom of the div into the background with a mask
            // maskImage:
            //   ethereumRowYRelativeToPlaceholder > 0
            //     ? `linear-gradient(to bottom, black 0, black ${
            //         ethereumRowYRelativeToPlaceholder - 50
            //       }px, transparent ${ethereumRowYRelativeToPlaceholder - 0}px)`
            //     : "none",
            // maskImage: ethereumRowYRelativeToPlaceholder < -5
            //     ? isChartOpen ? `linear-gradient(to top, transparent 0, transparent ${Math.abs(ethereumRowYRelativeToPlaceholder)+160+bottomSliderHeight-60}px, white ${Math.abs(ethereumRowYRelativeToPlaceholder)+250+bottomSliderHeight-60}px)`
            //     :`linear-gradient(to top, transparent 0, transparent ${Math.abs(ethereumRowYRelativeToPlaceholder)+160}px, white ${Math.abs(ethereumRowYRelativeToPlaceholder)+250}px)`
            //     : "none",
            transition: "0.3s ease",
            overflowX: "visible",
            // paddingBottom: isChartOpen ? `${(bottomSliderHeight??0) + 60}px`: `${(bottomSliderHeight??0)+60}px`,
          }}
        >
          {feeData && master && (
            <div
              className="relative w-[670px] md:w-auto md:pr-[40px] lg:pr-[0px] overflow-x-hidden md:overflow-x-visble"
              style={{
                // fade out the bottom of the div into the background with a mask
                // maskImage:
                //   ethereumRowYRelativeToPlaceholder > 0
                //     ? `linear-gradient(to bottom, black 0, black ${
                //         ethereumRowYRelativeToPlaceholder - 50
                //       }px, transparent ${ethereumRowYRelativeToPlaceholder - 0}px)`
                //     : "none",
                // maskImage: ethereumRowYRelativeToPlaceholder < -5
                //     ? isChartOpen ? `linear-gradient(to top, transparent 0, transparent ${Math.abs(ethereumRowYRelativeToPlaceholder)}px, white ${Math.abs(ethereumRowYRelativeToPlaceholder)+50}px)`
                //     :`linear-gradient(to top, transparent 0, transparent ${Math.abs(ethereumRowYRelativeToPlaceholder)}px, white ${Math.abs(ethereumRowYRelativeToPlaceholder)+50}px)`
                //     : "none",
                transition: "0.3s ease",
                // overflowX: "visible",
                // paddingBottom: isChartOpen ? `${bottomSliderHeight + 60}px`: `${bottomSliderHeight+60}px`,
              }}
            >
              <div
                className={`relative w-[808px] flex justify-start pt-[10px] pb-[8px] text-[10px] md:text-[12px] font-bold leading-[1]`}
              >
                <div className="pl-[10px] flex-1 flex">
                  <div
                    className={`flex items-center gap-x-[5px] ${isMobile ? "w-[23%]" : "w-[27%]"
                      }`}
                  >
                    <div
                      className={`flex items-center h-[0px] w-[18px] md:h-[0px] md:w-[24px]`}
                    >
                      <div
                        className={`${isMobile ? "h-[0px] w-[18px]" : "h-[0px] w-[24px]"
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
                        className={` dark:text-white text-black w-[10px] h-[10px] ${selectedQualitative === "chain"
                          ? "opacity-100"
                          : "opacity-20"
                          }`}
                      />{" "}
                    </div>
                    <div
                      className="bg-[#344240] text-[8px] flex rounded-full font-normal items-center px-[5px] py-[4px] gap-x-[2px] cursor-pointer whitespace-nowrap"
                      onClick={
                        !availabilityFilter
                          ? () => setAvailabilityFilter(!availabilityFilter)
                          : undefined
                      }
                    >
                      Data Availability
                      {availabilityFilter && dataAvailByFilter
                        ? ": " + selectedAvailability
                        : ""}
                      <Icon
                        icon={"feather:x-circle"}
                        className={` dark:text-white text-black w-[10px] h-[10px] relative bottom-[0.5px] ${availabilityFilter ? "block" : "hidden"
                          }`}
                        onClick={() => {
                          setAvailabilityFilter(false);
                        }}
                      />{" "}
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-end ${isMobile ? "w-[15%]" : "w-[15%]"
                      }`}
                  >
                    <div
                      className="flex items-center gap-x-0.5 cursor-pointer -mr-[12px] z-10"
                      onClick={() => {
                        if (selectedQuantitative === "txcosts_median") {
                          if (selectedQualitative) {
                            setSelectedQualitative(null);
                          } else {
                            setSortOrder(!sortOrder);
                          }
                        } else {
                          setSelectedQualitative(null);
                          setSelectedQuantitative("txcosts_median");
                        }
                      }}
                    >
                      <div>Median Fee</div>
                      <Icon
                        icon={
                          !selectedQualitative &&
                            selectedQuantitative === "txcosts_median"
                            ? sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                            : "formkit:arrowdown"
                        }
                        className={`dark:text-white text-black w-[10px] h-[10px] ${!selectedQualitative &&
                          selectedQuantitative === "txcosts_median"
                          ? "opacity-100"
                          : "opacity-20"
                          }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-end ${isMobile ? "w-[16%]" : "w-[16%]"
                      }`}
                  >
                    <div
                      className="flex items-center gap-x-0.5 cursor-pointer -mr-[12px] z-10"
                      onClick={() => {
                        if (selectedQuantitative === "txcosts_native_median") {
                          if (selectedQualitative) {
                            setSelectedQualitative(null);
                          } else {
                            setSortOrder(!sortOrder);
                          }
                        } else {
                          setSelectedQualitative(null);
                          setSelectedQuantitative("txcosts_native_median");
                        }
                      }}
                    >
                      <div>Transfer ETH</div>
                      <Icon
                        icon={
                          !selectedQualitative &&
                            selectedQuantitative === "txcosts_native_median"
                            ? sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                            : "formkit:arrowdown"
                        }
                        className={`dark:text-white text-black w-[10px] h-[10px] ${!selectedQualitative &&
                          selectedQuantitative === "txcosts_native_median"
                          ? "opacity-100"
                          : "opacity-20"
                          }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`pr-[20px] flex items-center justify-end ${isMobile ? "w-[16.5%]" : "w-[19.5%]"
                      }`}
                  >
                    <div
                      className="flex items-center gap-x-0.5 cursor-pointer -mr-[12px] z-10"
                      onClick={() => {
                        if (selectedQuantitative === "txcosts_swap") {
                          if (selectedQualitative) {
                            setSelectedQualitative(null);
                          } else {
                            setSortOrder(!sortOrder);
                          }
                        } else {
                          setSelectedQualitative(null);
                          setSelectedQuantitative("txcosts_swap");
                        }
                      }}
                    >
                      <div>Swap Token</div>
                      <Icon
                        icon={
                          !selectedQualitative &&
                            selectedQuantitative === "txcosts_swap"
                            ? sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                            : "formkit:arrowdown"
                        }
                        className={`dark:text-white text-black w-[10px] h-[10px] ${!selectedQualitative &&
                          selectedQuantitative === "txcosts_swap"
                          ? "opacity-100"
                          : "opacity-20"
                          }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`relative pl-[14px] flex flex-col justify-end space-x-[1px] font-normal  ${isMobile ? "w-[29.5%]" : "w-[22.5%]"
                      }`}
                  >
                    <div className="relative flex space-x-[1px] items-end -bottom-2">
                      <div
                        className={`absolute right-[35px] md:right-[25px] w-[29px] h-[12px] text-[8px] transition-all duration-100 ${selectedBarIndex >= 18 && selectedBarIndex <= 22
                          ? "-top-[22px]"
                          : "-top-2"
                          }`}
                      >
                        hourly
                      </div>
                      {Array.from({ length: 24 }, (_, index) => (
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
                    </div>
                  </div>
                </div>
                <div className="w-[160px] block md:hidden"></div>
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
                  let passMedian =
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_median
                      ?.data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_median
                      ?.data[optIndex][showUsd ? 2 : 1];

                  let passTransfer =
                    feeData.chain_data[item.chain[1]]?.hourly
                      ?.txcosts_native_median?.data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly
                      ?.txcosts_native_median?.data[optIndex][showUsd ? 2 : 1];

                  let passSwap =
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_swap
                      .data[optIndex] &&
                    feeData.chain_data[item.chain[1]]?.hourly?.txcosts_swap
                      ?.data[optIndex][showUsd ? 2 : 1];

                  return (
                    <animated.div
                      key={item.chain[0]}
                      className={`border-forest-700 border-[1px] mb-1 absolute rounded-full border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[10px] flex items-center
                      ${isMobile
                          ? "text-[12px] w-[650px]"
                          : "text-[14px] w-[808px]"
                        } ${selectedChains[item.chain[1]]
                          ? "opacity-100"
                          : "opacity-50"
                        }`}
                      style={{ ...style }}
                    >
                      <div
                        className={`flex justify-start items-center h-full gap-x-[5px] ${isMobile ? "w-[23%]" : "w-[27%]"
                          }`}
                      >
                        <div
                          className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                        >
                          <Icon
                            icon={`gtp:${AllChainsByKeys[item.chain[1]].urlKey
                              }-logo-monochrome`}
                            className={`${isMobile
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
                          className="pr-[5px] hover:underline"
                          href={`https://www.growthepie.xyz/chains/${AllChainsByKeys[item.chain[1]].urlKey
                            }`}
                          target="_blank"
                        >
                          {isMobile
                            ? master.chains[item.chain[1]].name_short
                            : AllChainsByKeys[item.chain[1]].label}
                        </Link>
                        <div
                          className={`bg-[#344240] flex rounded-full  items-center  transition-width overflow-hidden duration-300 ${isMobile
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
                                  className={`${dataAvailByFilter &&
                                    selectedAvailability === avail.label &&
                                    selectedChains[item.chain[1]]
                                    ? "text-forest-200"
                                    : "text-[#5A6462] "
                                    }
                                  ${isMobile
                                      ? "h-[10px] w-[10px] "
                                      : "h-[12px] w-[12px] "
                                    }`}
                                />
                                <div
                                  className={`text-[8px] text-center font-semibold overflow-hidden ${selectedAvailability === avail.label &&
                                    selectedQualitative === "availability"
                                    ? "text-forest-200"
                                    : "text-[#5A6462] "
                                    } ${hoveredItems.hoveredDA === avail.label &&
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
                      <div
                        className={`flex justify-between pl-[40px] pr-[22.5px] ${isMobile ? "w-[47.5%]" : "w-[50.5%]"
                          }`}
                      >
                        {Object.keys(metrics)
                          .filter((metricKey) => metrics[metricKey].enabled)
                          .map((metric) => {
                            return (
                              <div
                                className="flex items-center justify-end"
                                key={metric + "_barcontent"}
                              >
                                {getFormattedLastValue(item.chain[1], metric)}
                              </div>
                            );
                          })}
                      </div>
                      {/* 
                      <div className="h-full w-[15%] flex justify-end items-center">
                        {getFormattedLastValue(item.chain[1], "txcosts_median")}
                      </div>
                      <div
                        className={`relative h-full flex justify-end items-center  ${
                          isMobile ? "w-[16%]" : "w-[16%]"
                        }`}
                      >
                        {getFormattedLastValue(
                          item.chain[1],
                          "txcosts_native_median",
                        )}
                      </div>
                      <div
                        className={`pr-[20px] h-full flex justify-end items-center ${
                          isMobile ? "w-[16.5%]" : "w-[19.5%]"
                        }`}
                      >
                        {getFormattedLastValue(item.chain[1], "txcosts_swap")}
                      </div> */}
                      <div
                        className={`pl-[15px] relative flex items-center h-full space-x-[1px] ${isMobile ? "w-[29.5%]" : "w-[22.5%]"
                          }`}
                      >
                        {Array.from({ length: 24 }, (_, index) => (
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
                                backgroundColor: !feeIndexSort[23 - index][
                                  item.chain[1]
                                ]
                                  ? "gray"
                                  : getGradientColor(
                                    Math.floor(
                                      feeIndexSort[23 - index][
                                      item.chain[1]
                                      ][3] * 100,
                                    ),
                                  ),
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-[99%]">
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
                    </animated.div>
                  );
                })}
                {master && (
                  <div
                    // ref={ethereumRowRef}
                    className={`aboslute bottom-[28px] border-forest-700 border-[1px] absolute rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] min-h-[34px] pl-[10px] flex items-center
              ${isMobile ? "text-[12px] w-[663px]" : "text-[14px] w-[820px]"}`}
                  >
                    <div className="w-[638px] md:w-[796px] flex items-center">
                      <div
                        className={`flex justify-start items-center h-full gap-x-[5px] ${isMobile ? "w-[23%]" : "w-[27%]"
                          }`}
                      >
                        <div
                          className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                        >
                          <Icon
                            icon={`gtp:${AllChainsByKeys["ethereum"].urlKey}-logo-monochrome`}
                            className={`${isMobile
                              ? "h-[18px] w-[18px]"
                              : "h-[24px] w-[24px]"
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
                        className={`flex justify-between pl-[40px] pr-[22.5px] ${isMobile ? "w-[47.5%]" : "w-[50.5%]"
                          }`}
                      >
                        {Object.keys(metrics)
                          .filter((metricKey) => metrics[metricKey].enabled)
                          .map((metric) => {
                            return (
                              <div
                                className="flex items-center justify-end"
                                key={metric + "_ethbar"}
                              >
                                {getFormattedLastValue("ethereum", metric)}
                              </div>
                            );
                          })}
                      </div>
                      <div
                        className={`pl-[15px] relative flex items-center h-full space-x-[1px] ${isMobile ? "w-[29.5%]" : "w-[22.5%]"
                          }`}
                      >
                        {Array.from({ length: 24 }, (_, index) => (
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
                                backgroundColor: !feeIndexSortWithEthereum[
                                  23 - index
                                ]["ethereum"][3]
                                  ? "gray"
                                  : getGradientColor(
                                    Math.floor(
                                      feeIndexSortWithEthereum[23 - index][
                                      "ethereum"
                                      ][3] * 100,
                                    ),
                                  ),
                              }}
                            ></div>
                          </div>
                        ))}
                        <div className="absolute left-[12px] top-[34px] w-[148px] h-[10px] border-forest-600 border-x-[1px] flex justify-between text-[10px]">
                          <div className="relative top-2">24 Hours Ago</div>
                          <div className="relative top-2">Now</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* <div ref={ethereumRowPlaceHolderRef} className="h-[34px] w-full"></div> */}
        </FeesHorizontalScrollContainer>
        {/* {feeData && master && (
          <div className="block fixed right-0 top-0 text-[0.6rem] gap-0.5 p-0.5 font-inter z-[99999] bg-black text-white">
            <div>scroll: {isVerticalScrollbarVisible ? "visible" : "not visible"}</div>
            <div>table: {tableWidth?.toFixed(2)} x {tableHeight?.toFixed(2)}</div>
            <div>page: {pageWidth?.toFixed(2)} x {pageHeight?.toFixed(2)}</div>
            <div>window: {windowWidth} x {windowHeight.toFixed(2)}</div>
            <div>lastRow: {lastRowYRelativeToPage.toFixed(2)}</div>
            <div>horizontalScrollAmount: {tableHorizontalScrollAmount}</div>
            <div>ethereumRowYRelativeToTable: {ethereumRowYRelativeToTable.toFixed(2)}</div>
            <div>isBottomOfPageVisible: {isBottomOfPageVisible ? "true" : "false"}</div>
            <div>bottomSliderHeight: {bottomSliderHeight}</div>

            <div>placeholder: {ethereumRowYRelativeToPlaceholder}</div>
          </div>
        )} */}
        {/* <FeesContainer ref={ethereumRowRef} style={ethereumRowStyle}>
          {feeData && master && (
            
          )}
        </FeesContainer> */}
        <OffScreenSlider
        // ref={bottomSliderRef}
        // floatingChildren={ master &&
        //   <FeesContainer
        //     className="w-[900px]"
        //     style={{
        //       position: isVerticalScrollbarVisible || isChartOpen ? "relative" : "absolute",
        //       bottom: isVerticalScrollbarVisible || isChartOpen ? (isMobile ? `${34 + 60}px` : `${34 + 60}px`) : windowHeight - (ethereumRowPlaceHolderRef.current ? ethereumRowPlaceHolderRef.current?.getBoundingClientRect().top: 0) + (isMobile ? 16 : 0),
        //       left: tableHorizontalScrollAmount > 0 ? -tableHorizontalScrollAmount : undefined,
        //       // top: isVerticalScrollbarVisible ? undefined : - (ethereumRowPlaceHolderRef.current ? ethereumRowPlaceHolderRef.current?.getBoundingClientRect().top : 0),
        //     }}
        //   >
        //   <div

        //     ref={ethereumRowRef}
        //     className={`border-forest-700 border-[1px] absolute rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] shadow-[0px_0px_20px_0px_#000000] min-h-[34px] pl-[10px] flex items-center
        //     ${isMobile ? "text-[12px] w-[663px]" : "text-[14px] w-[820px]"}`}
        //   >
        //     <div className="w-[638px] md:w-[798px] flex items-center">
        //       <div
        //         className={`flex justify-start items-center h-full gap-x-[5px] ${
        //           isMobile ? "w-[23%]" : "w-[27%]"
        //         }`}
        //       >
        //         <div
        //           className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
        //         >
        //           <Icon
        //             icon={`gtp:${AllChainsByKeys["ethereum"].urlKey}-logo-monochrome`}
        //             className={`${
        //               isMobile ? "h-[18px] w-[18px]" : "h-[24px] w-[24px]"
        //             }`}
        //             style={{
        //               color: AllChainsByKeys["ethereum"].colors["light"][1],
        //             }}
        //           />
        //         </div>
        //         <div className="">
        //           {isMobile
        //             ? master.chains["ethereum"].name_short
        //             : AllChainsByKeys["ethereum"].label}
        //         </div>
        //       </div>

        //       <div className="h-full w-[15%] flex justify-end items-center">
        //         {getFormattedLastValue("ethereum", "txcosts_median")}
        //       </div>
        //       <div
        //         className={`h-full  flex justify-end items-center ${
        //           isMobile ? "w-[16%]" : "w-[16%]"
        //         }`}
        //       >
        //         {getFormattedLastValue("ethereum", "txcosts_native_median")}
        //       </div>
        //       <div
        //         className={`pr-[20px] h-full flex justify-end items-center ${
        //           isMobile ? "w-[16.5%]" : "w-[19.5%]"
        //         }`}
        //       >
        //         {getFormattedLastValue("ethereum", "txcosts_swap")}
        //       </div>
        //       <div
        //         className={`pl-[15px] relative flex items-center h-full space-x-[1px] ${
        //           isMobile ? "w-[29.5%]" : "w-[22.5%]"
        //         }`}
        //       >
        //         {Array.from({ length: 24 }, (_, index) => (
        //           <div
        //             key={index.toString() + "circles"}
        //             className="h-[32px] flex items-center justify-end cursor-pointer"
        //             onMouseEnter={() => {
        //               setHoverBarIndex(index);
        //             }}
        //             onMouseLeave={() => {
        //               setHoverBarIndex(null);
        //             }}
        //             onClick={() => {
        //               setSelectedBarIndex(index);
        //             }}
        //           >
        //             <div
        //               className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
        //                 selectedBarIndex === index
        //                   ? "scale-[160%]"
        //                   : hoverBarIndex === index
        //                   ? "scale-[120%] opacity-90"
        //                   : "scale-100 opacity-50"
        //               }`}
        //               style={{
        //                 backgroundColor: !feeIndexSort[23 - index]
        //                   ? "gray"
        //                   : getGradientColor(
        //                       Math.floor(
        //                         feeIndexSortWithEthereum[23 - index][
        //                           "ethereum"
        //                         ][3] * 100,
        //                       ),
        //                     ),
        //               }}
        //             ></div>
        //           </div>
        //         ))}
        //         <div className="absolute left-[12px] top-[34px] w-[148px] h-[10px] border-forest-600 border-x-[1px] flex justify-between text-[10px]">
        //           <div className="relative top-2">24 Hours Ago</div>
        //           <div className="relative top-2">Now</div>
        //         </div>
        //       </div>
        //     </div>
        //   </div>
        //   </FeesContainer>
        // }
        >
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
            />
          )}
        </OffScreenSlider>

        <Footer
          showCents={showCents}
          setShowCents={setShowCents}
          hoverSettings={hoverSettings}
          setHoverSettings={setHoverSettings}
        />
      </div>
      {/* <div
        className={`transition-all duration-0 w-full`}
        ref={bottomPaddingRef}
        // style={{
        //   height: isChartOpen ? `${60+96}px` : "0px",
        // }}
      ></div> */}
    </>
  );
}
