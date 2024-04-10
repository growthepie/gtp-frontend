"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import useSWR from "swr";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import Header from "./Header";
import { useTransition, animated } from "@react-spring/web";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import OffScreenSlider from "./OffScreenSlider";
import SliderChart from "./SliderChart";
import Footer from "./Footer";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";
import { useElementSize } from "usehooks-ts";

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
  const [selectedTimescale, setSelectedTimescale] = useState("hourly");
  const [selectedQuantitative, setSelectedQuantitative] =
    useState("txcosts_median");
  const [selectedQualitative, setSelectedQualitative] = useState<null | string>(
    null,
  );
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("blobs");

  const [hoveredItems, setHoveredItems] = useState<HoveredItems>({
    hoveredChain: null,
    hoveredDA: null,
  });
  const [hoverBarIndex, setHoverBarIndex] = useState<Number | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState(23);

  const [sortOrder, setSortOrder] = useState(true);
  //True is default descending false ascending
  const { theme } = useTheme();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  // start Bottom Chart state
  const [isChartOpen, setIsChartOpen] = useState(false);

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

  const metrics = useMemo(() => {
    return {
      txcosts_median: {
        title: "Median Fee",
      },
      txcosts_native_median: {
        title: "Transfer ETH",
      },
      txcosts_swap: {
        title: "Swap Token",
      },
    };
  }, []);

  function dataAvailToArray(x: string): DAvailability[] {
    let retObject: DAvailability[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
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

      if (x.includes("MantleDA")) {
        retObject.push({
          icon: "customoffchain",
          label: "MantleDA",
        });
      }
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

    const sortedChains = Object.keys(feeData.chain_data)
      .filter((chain) => chain !== "ethereum") // Exclude "ethereum"
      .sort((a, b) => {
        const availabilityA = dataAvailToArray(master.chains[a].da_layer);
        const availabilityB = dataAvailToArray(master.chains[b].da_layer);

        // Check if availabilityA or availabilityB contains selectedAvailability
        const containsAvailabilityA = availabilityA.some(
          (item) => item.icon === selectedAvailability,
        );
        const containsAvailabilityB = availabilityB.some(
          (item) => item.icon === selectedAvailability,
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

    if (selectedQualitative) {
      if (selectedQualitative === "chain") {
        return sortByChains;
      } else {
        return sortByCallData;
      }
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

  const [horizontalScrollAmount, setHorizontalScrollAmount] = useState(0);

  const [pageDiv, { width: pageWidth, height: pageHeight }] =
    useElementSize<HTMLDivElement>();
  const [tableDiv, { width: tableWidth, height: tableHeight }] =
    useElementSize<HTMLDivElement>();

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(
    function () {
      tableDiv(tableRef.current);
    },
    [tableRef.current],
  );

  const [lastRowYRelativeToPage, setLastRowYRelativeToWindow] = useState(0);

  const [windowHeight, setWindowHeight] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const getLastRowYRelativeToWindow = () => {
      if (!tableRef.current) return;

      const tableRect = tableRef.current.getBoundingClientRect();

      setLastRowYRelativeToWindow(tableRect.bottom);
    };

    getLastRowYRelativeToWindow();
  }, [tableHeight, windowHeight, pageHeight, tableRef]);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // is window vertical scrollbar visible
  const isVerticalScrollbarVisible = useMemo(() => {
    return pageHeight > windowHeight;
  }, [pageHeight, windowHeight]);

  const [ethereumRowStyle, setEthereumRowStyle] = useState<React.CSSProperties>(
    {},
  );

  // const triggerSetEthereumRowStyle = useCallback(() => {
  //   if (isMobile) {
  //     if (pageHeight < windowHeight) {
  //       setEthereumRowStyle({
  //         position: "fixed",
  //         top: lastRowYRelativeToPage - 37 + "px",
  //         marginLeft: -horizontalScrollAmount + "px"
  //       })
  //     } else {
  //       setEthereumRowStyle({
  //         position: "fixed",
  //         bottom: 249 + "px",
  //         left: ""
  //       })
  //     }
  //   } else {
  //     if (pageHeight < windowHeight) {
  //       setEthereumRowStyle({
  //         position: "fixed",
  //         top: lastRowYRelativeToPage + "px",
  //         marginLeft: ""
  //       })
  //     } else {
  //       setEthereumRowStyle({
  //         position: "fixed",
  //         bottom: 190 + "px",
  //         left: ""
  //       })
  //     }
  //   }
  // }, [isMobile, pageHeight, windowHeight, horizontalScrollAmount, lastRowYRelativeToPage, tableHeight]);

  // useLayoutEffect(() => {
  //   triggerSetEthereumRowStyle();
  // }, [triggerSetEthereumRowStyle])

  // const ethereumRowStyle: React.CSSProperties = useMemo(() => {
  //   // 0px will place the ethereum row 81px above the bottom of the window
  //   // 34px is the height of the ethereum row
  //   if (isMobile) {
  //     // If the page height is less than the window height, the ethereum row should be positioned relative to the page
  //     if (windowHeight >= pageHeight) {
  //       return {
  //         position: "absolute",
  //         top: lastRowYRelativeToPage - 100 + "px",
  //         marginLeft: ""
  //       }
  //     }

  //     // If the page height is greater than the window height, the ethereum row should be fixed to the bottom of the window
  //     return {
  //       position: "fixed",
  //       bottom: 196 + 39 + - 18 + "px",
  //       left: -horizontalScrollAmount + "px"
  //     }
  //   } else {
  //     // If the page height is less than the window height, the ethereum row should be positioned relative to the page
  //     if (windowHeight >= pageHeight) {
  //       return {
  //         position: "absolute",
  //         top: lastRowYRelativeToPage + "px",
  //         marginLeft: ""
  //       }
  //     }
  //     // If the page height is greater than the window height, the ethereum row should be fixed to the bottom of the window
  //     return {
  //       position: "fixed",
  //       bottom: 190 + "px",
  //       left: ""
  //     }

  //   }
  // }, [isMobile, pageHeight, windowHeight, horizontalScrollAmount, isVerticalScrollbarVisible, lastRowYRelativeToPage]);

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

  return (
    <>
      {feeData && master && (
        <div
          // className={`overflow-y-scroll overflow-x-hidden w-full gap-y-1 `}
          // style={{
          //   maxHeight: screenHeight,
          // }}
          className="relative min-h-screen pb-[131px] md:pb-[190px]"
          ref={pageDiv}
        >
          <Header />

          <FeesContainer className={`w-full hidden md:block`}>
            <div className="flex px-[5px] items-center w-full h-[54px] rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
              <a
                className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
                href="https://www.growthepie.xyz/"
                target="_blank"
              >
                <Icon icon="gtp:house" className="h-6 w-6" />
                <div className="font-bold">Main platform</div>
              </a>
            </div>
          </FeesContainer>
          {/* <div className="w-full h-[70px]" /> */}
          <FeesContainer className="w-full mt-[30px]">
            <div className="flex w-full justify-between px-[10px] items-center ">
              <div
                className={`flex text-[20px] font-bold items-center  ${
                  isMobile ? "w-full " : "w-auto"
                }`}
              >
                {isMobile ? (
                  <p className="w-[82vh] inline-block relative">
                    <p className="inline leading-8">
                      How much a typical user paid
                    </p>
                    <span className="absolute justify-center items-center bottom-1 w-[92px] h-[26px] border-[#344240] border-[1.5px] bg-[#1F2726] text-[12px] ml-1 rounded-r-full inline-flex">
                      {24 - selectedBarIndex === 1
                        ? "1 Hour Ago"
                        : `${24 - selectedBarIndex} hours ago`}
                    </span>
                  </p>
                ) : (
                  <div className="flex w-full items-center">
                    {" "}
                    {`How much a typical user paid`}
                    <span className="w-[92px] h-[26px] flex items-center justify-center border-[#344240] border-[1.5px] bg-[#1F2726] text-[12px] ml-1 rounded-r-full">
                      {24 - selectedBarIndex === 1
                        ? "1 Hour Ago"
                        : `${24 - selectedBarIndex} hours ago`}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-[165px] h-[25px] flex bg-transparent px-0.5 items-center justify-between pr-[2px] rounded-full "></div>
            </div>
          </FeesContainer>
          <FeesHorizontalScrollContainer
            setHorizontalScrollAmount={(amount) =>
              setHorizontalScrollAmount(amount)
            }
          >
            <div className="relative w-[630px] md:w-auto md:pr-[40px] lg:pr-[0px] overflow-x-hidden md:overflow-x-visble">
              <div
                className={`relative w-[810px] mt-[8px] flex h-[26px] justify-start mb-1 text-[10px] md:text-[12px] font-bold`}
              >
                <div className="pl-[10px] flex-1 flex">
                  <div
                    className={`flex items-center gap-x-[5px] hover:cursor-pointer  ${
                      isMobile ? "w-[26%]" : "w-[30%]"
                    }`}
                  >
                    <div
                      className={`flex items-center h-[18px] w-[18px] md:h-[24px] md:w-[24px]`}
                    >
                      <div
                        className={`${
                          isMobile ? "h-[18px] w-[18px]" : "h-[24px] w-[24px]"
                        }`}
                      />
                    </div>
                    <div
                      className="flex items-center gap-x-0.5"
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
                      className="bg-[#344240] text-[8px] flex rounded-full font-normal items-center px-[5px] py-[3px] gap-x-[2px] hover:cursor-pointer"
                      onClick={() => {
                        if (selectedQualitative === "availability") {
                          setSortOrder(!sortOrder);
                        } else {
                          setSelectedQualitative("availability");
                        }
                      }}
                    >
                      Data Availability{" "}
                      <Icon
                        icon={
                          selectedQualitative === "availability"
                            ? sortOrder
                              ? "formkit:arrowdown"
                              : "formkit:arrowup"
                            : "formkit:arrowdown"
                        }
                        className={` dark:text-white text-black w-[10px] h-[10px] ${
                          selectedQualitative === "availability"
                            ? "opacity-100"
                            : "opacity-20"
                        }`}
                      />{" "}
                    </div>
                  </div>

                  <div
                    className={`relative flex items-center justify-end cursor-pointer ${
                      isMobile ? "w-[15%]" : "w-[15%]"
                    }`}
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
                    Median Fee
                    <Icon
                      icon={
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_median"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={`absolute -right-3 top-2 dark:text-white text-black w-[10px] h-[10px] ${
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_median"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />{" "}
                  </div>
                  <div
                    className={`relative flex items-center justify-end hover:cursor-pointer ${
                      isMobile ? "w-[16%]" : "w-[16%]"
                    }`}
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
                    Transfer ETH
                    <Icon
                      icon={
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_native_median"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={`absolute -right-3 top-2 dark:text-white text-black w-[10px] h-[10px] ${
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_native_median"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />{" "}
                  </div>
                  <div
                    className={`pr-2 relative flex items-center justify-end gap-x-0.5 hover:cursor-pointer ${
                      isMobile ? "w-[13.5%]" : "w-[16.5%]"
                    }`}
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
                    <div>Swap Token </div>
                    <Icon
                      icon={
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_swap"
                          ? sortOrder
                            ? "formkit:arrowdown"
                            : "formkit:arrowup"
                          : "formkit:arrowdown"
                      }
                      className={`absolute -right-1 top-2 dark:text-white text-black w-[10px] h-[10px] ${
                        !selectedQualitative &&
                        selectedQuantitative === "txcosts_swap"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />{" "}
                  </div>
                  <div
                    className={`relative pl-[14px] flex flex-col justify-end space-x-[1px] font-normal  ${
                      isMobile ? "w-[29.5%]" : "w-[22.5%]"
                    }`}
                  >
                    <div className="relative flex space-x-[1px] items-end -bottom-1">
                      <div
                        className={`absolute right-[24px] w-[29px] h-[12px] text-[8px] transition-all duration-100 ${
                          selectedBarIndex >= 18 && selectedBarIndex <= 22
                            ? "-top-5"
                            : "-top-2"
                        }`}
                      >
                        hourly
                      </div>
                      {Array.from({ length: 24 }, (_, index) => (
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
                          ${
                            ""
                            //   selectedBarIndex === index
                            // ? "w-[8px] border-[#344240] border-t-[1px] border-x-[1px] h-[23px] "
                            // : hoverBarIndex === index
                            //   ? "w-[5px] bg-[#344240] h-[14px]"
                            //   : "w-[5px] bg-[#344240] h-[8px]"
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
                <div className="w-[196px] block md:hidden"></div>
              </div>
              <div
                ref={tableRef}
                className={`gap-y-1 relative`}
                // extra row if mobile for Ethereum rows
                style={{
                  minHeight: isMobile
                    ? (finalSort.length + 1) * (rowHeight + rowGapY)
                    : finalSort.length * (rowHeight + rowGapY),
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
                      ${
                        isMobile
                          ? "text-[12px] w-[615px]"
                          : "text-[14px] w-[810px]"
                      } ${
                        selectedChains[item.chain[1]]
                          ? "opacity-100"
                          : "opacity-50"
                      }`}
                      style={{ ...style }}
                      // onLoad={() => {
                      //   setTimeout(() => {
                      //     triggerSetEthereumRowStyle();
                      //   }, 5000);
                      // }}
                    >
                      <div
                        className={`flex justify-start items-center h-full gap-x-[5px] ${
                          isMobile ? "w-[26%]" : "w-[30%]"
                        }`}
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
                                AllChainsByKeys[item.chain[1]].colors[theme][0],
                            }}
                          />
                        </div>
                        <div className="pr-[5px]">
                          {isMobile
                            ? master.chains[item.chain[1]].name_short
                            : AllChainsByKeys[item.chain[1]].label}
                        </div>
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
                          {dataAvailToArray(
                            master.chains[item.chain[1]].da_layer,
                          ).map((avail, index, array) => [
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
                                if (selectedQualitative !== "availability") {
                                  setSelectedQualitative("availability");
                                }
                                setSelectedAvailability(avail.icon);
                              }}
                            >
                              <Icon
                                icon={`gtp:${avail.icon}`}
                                className={`${
                                  selectedAvailability === avail.icon &&
                                  selectedQualitative === "availability"
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
                                  selectedAvailability === avail.icon &&
                                  selectedQualitative === "availability"
                                    ? "text-forest-200"
                                    : "text-[#5A6462] "
                                } `}
                                style={{
                                  maxWidth:
                                    hoveredItems.hoveredDA === avail.label &&
                                    hoveredItems.hoveredChain === item.chain[1]
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
                          ])}
                        </div>
                      </div>

                      <div className="h-full w-[15%] flex justify-end items-center ">
                        <div
                          className={`justify-center rounded-full flex items-center gap-x-0.5 font-inter ${
                            selectedQuantitative === "txcosts_median"
                              ? "border-[1.5px] px-3 py-1 leading-snug -mr-3"
                              : "border-0"
                          } 
                          ${passMedian ? "opacity-100" : "opacity-50"} ${
                            lowestMedianFee?.chain === item.chain[1]
                              ? "font-bold text-sm"
                              : "font-normal text-xs"
                          }`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                  true,
                                ),
                          }}
                        >
                          <div className="text-[0.65rem] font-light">{`${
                            passMedian ? (showUsd ? "$" : "Ξ") : ""
                          }`}</div>
                          {passMedian
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 3,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"]
                                  .txcosts_median.data[optIndex][
                                  showUsd ? 2 : 1
                                ],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`relative h-full flex justify-end items-center  ${
                          isMobile ? "w-[16%]" : "w-[16%]"
                        }`}
                      >
                        <div
                          className={`justify-center rounded-full flex items-center gap-x-0.5 font-inter ${
                            selectedQuantitative === "txcosts_native_median"
                              ? "border-[1.5px] px-3 py-1 leading-snug -mr-3"
                              : "border-0"
                          } ${passSwap ? "opacity-100" : "opacity-50"} ${
                            lowestTransferFee?.chain === item.chain[1]
                              ? "font-bold text-sm"
                              : "font-normal text-xs"
                          }`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                  true,
                                ),
                          }}
                        >
                          <div className="text-[0.65rem] font-light shadow-md">{`${
                            passTransfer ? (showUsd ? "$" : "Ξ") : ""
                          }`}</div>
                          {passTransfer
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 3,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"][
                                  "txcosts_native_median"
                                ].data[optIndex][showUsd ? 2 : 1],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`pr-2 h-full flex justify-end items-center ${
                          isMobile ? "w-[13.5%]" : "w-[16.5%]"
                        }`}
                      >
                        <div
                          className={`justify-center rounded-full flex items-center gap-x-0.5 font-inter ${
                            selectedQuantitative === "txcosts_swap"
                              ? "border-[1.5px] px-3 py-1 leading-snug -mr-3"
                              : "border-0"
                          } ${passSwap ? "opacity-100" : "opacity-50"} ${
                            lowestSwapFee?.chain === item.chain[1]
                              ? "font-bold text-sm"
                              : "font-normal text-xs"
                          }`}
                          style={{
                            borderColor: !feeIndexSort[optIndex][item.chain[1]]
                              ? "gray"
                              : getGradientColor(
                                  Math.floor(
                                    (feeIndexSort[optIndex][item.chain[1]][
                                      showUsd ? 2 : 1
                                    ] /
                                      feeIndexSort[optIndex][
                                        Object.keys(feeIndexSort[optIndex])[
                                          Object.keys(feeIndexSort[optIndex])
                                            .length - 1
                                        ]
                                      ][showUsd ? 2 : 1]) *
                                      100,
                                  ),
                                  true,
                                ),
                          }}
                        >
                          <div className="text-[0.65rem] font-light">{`${
                            passSwap ? (showUsd ? "$" : "Ξ") : ""
                          }`}</div>
                          {passSwap
                            ? Intl.NumberFormat(undefined, {
                                notation: "compact",
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 3,
                              }).format(
                                feeData.chain_data[item.chain[1]]["hourly"][
                                  "txcosts_swap"
                                ].data[optIndex][showUsd ? 2 : 1],
                              )
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`pl-[15px] relative flex items-center h-full space-x-[1px] ${
                          isMobile ? "w-[29.5%]" : "w-[22.5%]"
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
                              className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
                                selectedBarIndex === index
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
                          className={`relative flex items-center justify-end w-[22px] h-[22px] rounded-full cursor-pointer ${
                            selectedChains[item.chain[1]]
                              ? " bg-white dark:bg-forest-1000 dark:hover:forest-800"
                              : " bg-forest-50 dark:bg-[#1F2726] hover:bg-forest-50"
                          }`}
                          onClick={() => {
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
              </div>
            </div>
          </FeesHorizontalScrollContainer>
          {/* <div className="bg-white fixed right-0 top-0 text-black text-xs">
            <div>scroll: {isVerticalScrollbarVisible ? "visible" : "not visible"}</div>
            <div>table: {tableWidth} x {tableHeight}</div>
            <div>page: {pageWidth} x {pageHeight}</div>
            <div>window: {windowWidth} x {windowHeight}</div>
            <div>lastRow: {lastRowYRelativeToPage}</div>
            <div>horizontalScrollAmount: {horizontalScrollAmount}</div>
          </div> */}
          <FeesContainer
            className={`transition-transform duration-300 ${
              isChartOpen ? "translate-y-[-215px]" : "translate-y-[0px]"
            }`}
            style={{
              position: isVerticalScrollbarVisible ? "fixed" : "absolute",
              bottom: isVerticalScrollbarVisible ? "190px" : undefined,
              top:
                !isVerticalScrollbarVisible && isMobile
                  ? lastRowYRelativeToPage - 37
                  : undefined,
              left:
                isMobile && horizontalScrollAmount > 0
                  ? -horizontalScrollAmount
                  : undefined,
            }}
          >
            <div
              className={`border-forest-700 border-[1px] mb-1 absolute rounded-full bg-[#1F2726] border-black/[16%] dark:border-[#5A6462] shadow-[0px_0px_20px_0px_#000000] min-h-[34px] pl-[10px] flex items-center
              ${isMobile ? "text-[12px] w-[620px]" : "text-[14px] w-[820px]"}`}
            >
              <div className="w-[600px] md:w-[800px] min-h-[34px] flex items-center">
                <div
                  className={`flex justify-start items-center h-full gap-x-[5px] ${
                    isMobile ? "w-[26%]" : "w-[30%]"
                  }`}
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
                        color: AllChainsByKeys["ethereum"].colors[theme][0],
                      }}
                    />
                  </div>
                  <div className="">
                    {isMobile
                      ? master.chains["ethereum"].name_short
                      : AllChainsByKeys["ethereum"].label}
                  </div>
                  <div
                    className={`bg-[#344240] flex rounded-full  items-center  transition-width overflow-hidden duration-300 ${
                      isMobile
                        ? "px-[4px] py-[2px] gap-x-[1px]"
                        : "px-[5px] py-[3px] gap-x-[2px]"
                    }`}
                    onMouseEnter={() => {
                      setHoveredItems({
                        hoveredChain: "ethereum",
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
                    {dataAvailToArray(master.chains["ethereum"].da_layer).map(
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
                            if (selectedQualitative !== "availability") {
                              setSelectedQualitative("availability");
                            }
                            setSelectedAvailability(avail.icon);
                          }}
                        >
                          <Icon
                            icon={`gtp:${avail.icon}`}
                            className={`${
                              selectedAvailability === avail.icon &&
                              selectedQualitative === "availability"
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
                              selectedAvailability === avail.icon &&
                              selectedQualitative === "availability"
                                ? "text-forest-200"
                                : "text-[#5A6462] "
                            } `}
                            style={{
                              maxWidth:
                                hoveredItems.hoveredDA === avail.label &&
                                hoveredItems.hoveredChain === "ethereum"
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

                <div className="h-full w-[15%] flex justify-end items-center ">
                  <div
                    className={`justify-end rounded-full flex items-center gap-x-0.5 font-inter font-medium text-xs ${
                      selectedQuantitative === "txcosts_median"
                        ? "border-[1.5px] px-3 py-1 leading-snug -mr-3"
                        : "border-0"
                    }
                  ${true ? "opacity-100" : "opacity-50"}`}
                    style={{
                      borderColor: !feeIndexSort[optIndex]["ethereum"]
                        ? "gray"
                        : getGradientColor(
                            Math.floor(
                              (feeIndexSort[optIndex]["ethereum"][
                                showUsd ? 2 : 1
                              ] /
                                feeIndexSort[optIndex][
                                  Object.keys(feeIndexSort[optIndex])[
                                    Object.keys(feeIndexSort[optIndex]).length -
                                      1
                                  ]
                                ][showUsd ? 2 : 1]) *
                                100,
                            ),
                          ),
                    }}
                  >
                    <div className="text-[0.65rem] font-light">{`${
                      true ? (showUsd ? "$" : "Ξ") : ""
                    }`}</div>
                    {true
                      ? Intl.NumberFormat(undefined, {
                          notation: "compact",
                          maximumFractionDigits: 3,
                          minimumFractionDigits: 3,
                        }).format(
                          feeData.chain_data["ethereum"]["hourly"]
                            .txcosts_median.data[optIndex][showUsd ? 2 : 1],
                        )
                      : "N/A"}
                  </div>
                </div>
                <div
                  className={`h-full  flex justify-end items-center  ${
                    isMobile ? "w-[16%]" : "w-[16%]"
                  }`}
                >
                  <div
                    className={`justify-end rounded-full flex items-center gap-x-0.5 font-inter font-medium text-xs ${
                      selectedQuantitative === "txcosts_native_median"
                        ? "border-[1.5px] px-3 py-1 leading-snug -mr-3.5"
                        : "border-0"
                    } ${true ? "opacity-100" : "opacity-50"}`}
                    style={{
                      borderColor: !feeIndexSort[optIndex]["ethereum"]
                        ? "gray"
                        : getGradientColor(
                            Math.floor(
                              (feeIndexSort[optIndex]["ethereum"][
                                showUsd ? 2 : 1
                              ] /
                                feeIndexSort[optIndex][
                                  Object.keys(feeIndexSort[optIndex])[
                                    Object.keys(feeIndexSort[optIndex]).length -
                                      1
                                  ]
                                ][showUsd ? 2 : 1]) *
                                100,
                            ),
                          ),
                    }}
                  >
                    <div className="text-[0.65rem] font-light">{`${
                      true ? (showUsd ? "$" : "Ξ") : ""
                    }`}</div>
                    {true
                      ? Intl.NumberFormat(undefined, {
                          notation: "compact",
                          maximumFractionDigits: 3,
                          minimumFractionDigits: 0,
                        }).format(
                          feeData.chain_data["ethereum"]["hourly"][
                            "txcosts_native_median"
                          ].data[optIndex][showUsd ? 2 : 1],
                        )
                      : "N/A"}
                  </div>
                </div>
                <div
                  className={`h-full flex justify-end items-center pr-2 ${
                    isMobile ? "w-[13.5%]" : "w-[16.5%]"
                  }`}
                >
                  <div
                    className={`justify-end rounded-full flex items-center gap-x-0.5 font-inter font-medium text-xs ${
                      selectedQuantitative === "txcosts_swap"
                        ? "border-[1.5px] px-3 py-1 leading-snug -mr-3.5"
                        : "border-0 -mr-0.5"
                    } ${true ? "opacity-100" : "opacity-50"}`}
                    style={{
                      borderColor: !feeIndexSort[optIndex]["ethereum"]
                        ? "gray"
                        : getGradientColor(
                            Math.floor(
                              (feeIndexSort[optIndex]["ethereum"][
                                showUsd ? 2 : 1
                              ] /
                                feeIndexSort[optIndex][
                                  Object.keys(feeIndexSort[optIndex])[
                                    Object.keys(feeIndexSort[optIndex]).length -
                                      1
                                  ]
                                ][showUsd ? 2 : 1]) *
                                100,
                            ),
                          ),
                    }}
                  >
                    <div className="text-[0.65rem] font-light">{`${
                      true ? (showUsd ? "$" : "Ξ") : ""
                    }`}</div>
                    {true
                      ? Intl.NumberFormat(undefined, {
                          notation: "compact",
                          maximumFractionDigits: 3,
                          minimumFractionDigits: 3,
                        }).format(
                          feeData.chain_data["ethereum"]["hourly"][
                            "txcosts_swap"
                          ].data[optIndex][showUsd ? 2 : 1],
                        )
                      : "N/A"}
                  </div>
                </div>
                <div
                  className={`pl-[16px] md:pl-[12px] relative flex items-center h-full space-x-[1px] ${
                    isMobile ? "w-[29.5%]" : "w-[22.5%]"
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
                        className={`w-[5px] h-[5px] rounded-full transition-all duration-300 ${
                          selectedBarIndex === index
                            ? "scale-[160%]"
                            : hoverBarIndex === index
                            ? "scale-[120%] opacity-90"
                            : "scale-100 opacity-50"
                        }`}
                        style={{
                          backgroundColor: !feeIndexSort[23 - index]["ethereum"]
                            ? "gray"
                            : getGradientColor(
                                Math.floor(
                                  feeIndexSort[23 - index]["ethereum"][3] * 100,
                                ),
                              ),
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FeesContainer>
          <OffScreenSlider>
            <SliderChart isOpen={isChartOpen} setIsOpen={setIsChartOpen} />
          </OffScreenSlider>
          <Footer />
        </div>
      )}
    </>
  );
}
