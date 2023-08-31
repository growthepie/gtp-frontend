"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { AllChainsByKeys } from "@/lib/chains";
import { color } from "highcharts";
import { useHover, useMediaQuery } from "usehooks-ts";
import { Chart } from "../charts/chart";
import Container from "./Container";
import Colors from "tailwindcss/colors";
import { LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useLocalStorage } from "usehooks-ts";

const DisabledStates: {
  [mode: string]: {
    [chain: string]: {
      text: string;
      reason: string;
    };
  };
} = {
  gas_fees_share_eth: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
  gas_fees_share_usd: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
  gas_fees_usd_absolute: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
  gas_fees_eth_absolute: {
    imx: {
      text: "No Gas Fees",
      reason: "IMX does not charge Gas Fees",
    },
  },
};

type ContractInfo = {
  address: string;
  project_name: string;
  name: string;
  main_category_key: string;
  sub_category_key: string;
  chain: string;
  gas_fees_absolute_eth: number;
  gas_fees_absolute_usd: number;
  gas_fees_share: number;
  txcount_absolute: number;
  txcount_share: number;
};

const ContractUrls = {
  arbitrum: "https://arbiscan.io/address/",
  optimism: "https://optimistic.etherscan.io/address/",
  zksync_era: "https://explorer.zksync.io/address/",
  polygon_zkevm: "https://zkevm.polygonscan.com/address/",
  imx: "https://immutascan.io/address/",
  base: "https://basescan.org/address/",
};

export default function OverviewMetrics({
  data,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: Chains;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [selectedMode, setSelectedMode] = useState("gas_fees_share_usd");
  const [isCategoryMenuExpanded, setIsCategoryMenuExpanded] = useState(true);
  const [contractCategory, setContractCategory] = useState("value");
  const [sortOrder, setSortOrder] = useState(true);

  const [showMore, setShowMore] = useState(false);
  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
  const [contractHover, setContractHover] = useState({});
  const [selectedValue, setSelectedValue] = useState("share");
  const [copyContract, setCopyContract] = useState(false);
  // const [contracts, setContracts] = useState<{ [key: string]: ContractInfo }>(
  //   {},
  // );
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});

  const categories: { [key: string]: string } = useMemo(() => {
    if (master) {
      const result: { [key: string]: string } = {};

      const categoryKeys = Object.keys(
        master.blockspace_categories.main_categories,
      );

      // Remove "unlabeled" if present and store it for later
      const unlabeledIndex = categoryKeys.indexOf("unlabeled");
      let unlabeledCategory = "";
      if (unlabeledIndex !== -1) {
        unlabeledCategory = categoryKeys.splice(unlabeledIndex, 1)[0];
      }

      categoryKeys.forEach((key) => {
        const words =
          master.blockspace_categories.main_categories[key].split(" ");
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[key] = formatted;
      });

      // Add "unlabeled" to the end if it was present
      if (unlabeledCategory) {
        const words =
          master.blockspace_categories.main_categories[unlabeledCategory].split(
            " ",
          );
        const formatted = words
          .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(" ");
        result[unlabeledCategory] = formatted;
      }

      return result;
    }

    return {};
  }, [master]);

  const [isCategoryHovered, setIsCategoryHovered] = useState<{
    [key: string]: boolean;
  }>(() => {
    if (master) {
      const initialIsCategoryHovered: { [key: string]: boolean } = {};
      Object.keys(master.blockspace_categories.main_categories).forEach(
        (key) => {
          if (key !== "cross_chain") {
            initialIsCategoryHovered[key] = false;
          }
        },
      );
      return initialIsCategoryHovered;
    }

    return {
      native_transfers: false,
      token_transfers: false,
      nft_fi: false,
      defi: false,
      cefi: false,
      utility: false,
      scaling: false,
      gaming: false,
    };
  });

  const [selectedCategory, setSelectedCategory] = useState("nft");

  // useEffect(() => {
  //   // Process the data and create the contracts object
  //   const result: { [key: string]: ContractInfo } = {};

  //   for (const category of Object.keys(data)) {
  //     if (data) {
  //       const contractsData =
  //         data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
  //           .data;
  //       const types =
  //         data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
  //           .types;

  //       for (const contract of Object.keys(contractsData)) {
  //         const dataArray = contractsData[contract];
  //         const key = dataArray[0] + dataArray[4];
  //         const values = dataArray;

  //         // Check if the key already exists in the result object
  //         if (result.hasOwnProperty(key)) {
  //           // If the key exists, update the values
  //           result[key] = {
  //             ...result[key],
  //             address: values[types.indexOf("address")],
  //             project_name: values[types.indexOf("project_name")],
  //             name: values[types.indexOf("name")],
  //             main_category_key: values[types.indexOf("main_category_key")],
  //             sub_category_key: values[types.indexOf("sub_category_key")],
  //             chain: values[types.indexOf("chain")],
  //             gas_fees_absolute_eth:
  //               values[types.indexOf("gas_fees_absolute_eth")],
  //             gas_fees_absolute_usd:
  //               values[types.indexOf("gas_fees_absolute_usd")],
  //             gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
  //             txcount_absolute: values[types.indexOf("txcount_absolute")],
  //             txcount_share: values[types.indexOf("txcount_share")] ?? "",
  //           };
  //         } else {
  //           // If the key doesn't exist, create a new entry
  //           result[key] = {
  //             address: values[types.indexOf("address")],
  //             project_name: values[types.indexOf("project_name")],
  //             name: values[types.indexOf("name")],
  //             main_category_key: values[types.indexOf("main_category_key")],
  //             sub_category_key: values[types.indexOf("sub_category_key")],
  //             chain: values[types.indexOf("chain")],
  //             gas_fees_absolute_eth:
  //               values[types.indexOf("gas_fees_absolute_eth")],
  //             gas_fees_absolute_usd:
  //               values[types.indexOf("gas_fees_absolute_usd")],
  //             gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
  //             txcount_absolute: values[types.indexOf("txcount_absolute")],
  //             txcount_share: values[types.indexOf("txcount_share")] ?? "",
  //           };
  //         }
  //       }
  //     }
  //   }

  //   // Update the contracts state with the new data
  //   setContracts(result);
  // }, [data, selectedCategory, selectedTimespan]);

  const formatSubcategories = useCallback(
    (str: string) => {
      const masterStr =
        master && master.blockspace_categories.sub_categories[str]
          ? master.blockspace_categories.sub_categories[str]
          : str;

      const title = masterStr.replace(/_/g, " ");
      const words = title.split(" ");
      const formatted = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });

      return formatted.join(" ");
    },
    [master],
  );

  const contracts = useMemo<{ [key: string]: ContractInfo }>(() => {
    const result: { [key: string]: ContractInfo } = {};
    for (const category of Object.keys(data)) {
      if (data) {
        const contractsData =
          data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
            .data;
        const types =
          data.all_l2s["overview"][selectedTimespan][selectedCategory].contracts
            .types;

        for (const contract of Object.keys(contractsData)) {
          const dataArray = contractsData[contract];
          const key = dataArray[0] + dataArray[4] + dataArray[5];
          const values = dataArray;

          // Check if the key already exists in the result object
          if (result.hasOwnProperty(key)) {
            // If the key exists, update the values
            result[key] = {
              ...result[key],
              address: values[types.indexOf("address")],
              project_name: values[types.indexOf("project_name")],
              name: values[types.indexOf("name")],
              main_category_key: values[types.indexOf("main_category_key")],
              sub_category_key: values[types.indexOf("sub_category_key")],
              chain: values[types.indexOf("chain")],
              gas_fees_absolute_eth:
                values[types.indexOf("gas_fees_absolute_eth")],
              gas_fees_absolute_usd:
                values[types.indexOf("gas_fees_absolute_usd")],
              gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
              txcount_absolute: values[types.indexOf("txcount_absolute")],
              txcount_share: values[types.indexOf("txcount_share")] ?? "",
            };
          } else {
            // If the key doesn't exist, create a new entry
            result[key] = {
              address: values[types.indexOf("address")],
              project_name: values[types.indexOf("project_name")],
              name: values[types.indexOf("name")],
              main_category_key: values[types.indexOf("main_category_key")],
              sub_category_key: values[types.indexOf("sub_category_key")],
              chain: values[types.indexOf("chain")],
              gas_fees_absolute_eth:
                values[types.indexOf("gas_fees_absolute_eth")],
              gas_fees_absolute_usd:
                values[types.indexOf("gas_fees_absolute_usd")],
              gas_fees_share: values[types.indexOf("gas_fees_share")] ?? "",
              txcount_absolute: values[types.indexOf("txcount_absolute")],
              txcount_share: values[types.indexOf("txcount_share")] ?? "",
            };
          }
        }
      }
    }

    // Update the contracts state with the new data
    return result;
  }, [data, selectedCategory, selectedTimespan]);

  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const [relativePercentage, setRelativePercentage] = useState(
    100 -
      (Object.keys(data["arbitrum"].overview[selectedTimespan]).length - 1) * 2,
    // For right now determine the amount of categories  based on gasfees length
    // In the future if different categories have different amount of value will refactor.
  );

  const relativePercentageByChain = useMemo(() => {
    return Object.keys(data).reduce((acc, chainKey) => {
      return {
        ...acc,
        [chainKey]:
          100 -
          (Object.keys(data[chainKey].overview[selectedTimespan]).length - 1) *
            2,
      };
    }, {});
    // return {
    //   optimism:
    //     100 -
    //     (Object.keys(data["optimism"].overview[selectedTimespan]).length - 1) *
    //       2,
    //   arbitrum:
    //     100 -
    //     (Object.keys(data["arbitrum"].overview[selectedTimespan]).length - 1) *
    //       2,
    //   imx:
    //     100 -
    //     (Object.keys(data["imx"].overview[selectedTimespan]).length - 1) * 2,
    // };
  }, [data, selectedTimespan]);

  const { theme } = useTheme();
  const timespans = useMemo(() => {
    return {
      "7d": {
        label: "7 days",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30 days",
        value: 30,
        xMin: Date.now() - 30 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      // "90d": {
      //   label: "90 days",
      //   value: 90,
      // },
      "180d": {
        label: "180 days",
        value: 180,
      },
      // "365d": {
      //   label: "1 year",
      //   value: 365,
      // },
      max: {
        label: "Maximum",
        value: 0,
      },
    };
  }, []);

  const chartSeries = useMemo(() => {
    const dataKey = selectedMode;
    if (selectedChain) {
      //   id: [selectedChain, selectedCategory, selectedMode].join("_"),
      //   name: selectedChain,
      //   unixKey: "unix",
      //   dataKey: dataKey,
      //   data: data[selectedChain].daily[selectedCategory].data.length,
      // });
      return [
        {
          id: [selectedChain, selectedCategory, selectedMode].join("_"),
          name: selectedChain,
          unixKey: "unix",
          dataKey: dataKey,
          data: data[selectedChain].daily[selectedCategory].data,
        },
      ];
    }

    // return Object.keys(data)
    //   .filter(
    //     (chainKey) =>
    //       chainKey !== "all_l2s" &&
    //       data[chainKey].daily[selectedCategory].data.length > 0,
    //   )
    //   .map((chainKey) => {
    //     return {
    //       id: [chainKey, selectedCategory, selectedMode].join("_"),
    //       name: chainKey,
    //       unixKey: "unix",
    //       dataKey: dataKey,
    //       data: data[chainKey].daily[selectedCategory].data,
    //     };
    //   });
    return [
      {
        id: ["all_l2s", selectedCategory, selectedMode].join("_"),
        name: "all_l2s",
        unixKey: "unix",
        dataKey: selectedMode,
        data: data.all_l2s.daily[selectedCategory].data,
      },
    ];
  }, [selectedMode, selectedChain, data, selectedCategory]);

  useEffect(() => {
    if (selectedMode.includes("gas_fees_share")) {
      setSelectedMode(showUsd ? "gas_fees_share_usd" : "gas_fees_share_eth");
    } else {
      setSelectedMode(
        showUsd ? "gas_fees_usd_absolute" : "gas_fees_eth_absolute",
      );
    }
  }, [selectedMode, showUsd]);

  // console.log(data["optimism"].overview.types.indexOf("gas_fees_share"));
  // console.log(relativePercentage);
  useEffect(() => {
    if (!contracts) {
      return;
    }

    const filteredContracts = Object.entries(contracts)
      .filter(([key, contract]) => {
        const isAllChainsSelected = selectedChain === null;
        const isChainSelected =
          isAllChainsSelected || contract.chain === selectedChain;
        const isCategoryMatched =
          contract.main_category_key === selectedCategory;

        return isChainSelected && isCategoryMatched;
      })
      .reduce((filtered, [key, contract]) => {
        filtered[key] = contract;
        return filtered;
      }, {});

    const sortFunction = (a, b) => {
      const valueA = selectedMode.includes("gas_fees_")
        ? showUsd
          ? filteredContracts[a]?.gas_fees_absolute_usd
          : filteredContracts[a]?.gas_fees_absolute_eth
        : filteredContracts[a]?.txcount_absolute;

      const valueB = selectedMode.includes("gas_fees_")
        ? showUsd
          ? filteredContracts[b]?.gas_fees_absolute_usd
          : filteredContracts[b]?.gas_fees_absolute_eth
        : filteredContracts[b]?.txcount_absolute;

      // Compare the values
      return valueA - valueB;
    };

    const sortedResult = Object.keys(filteredContracts).sort((a, b) => {
      if (contractCategory === "contract") {
        return (
          filteredContracts[a]?.name || filteredContracts[a]?.address
        ).localeCompare(
          filteredContracts[b]?.name || filteredContracts[b]?.address,
        );
      } else if (contractCategory === "category") {
        return filteredContracts[a]?.main_category_key.localeCompare(
          filteredContracts[b]?.main_category_key,
        );
      } else if (
        contractCategory === "subcategory" &&
        selectedCategory !== "unlabeled"
      ) {
        return filteredContracts[a]?.sub_category_key.localeCompare(
          filteredContracts[b]?.sub_category_key,
        );
      } else if (contractCategory === "chain") {
        return filteredContracts[a]?.chain.localeCompare(
          filteredContracts[b]?.chain,
        );
      } else if (contractCategory === "value" || contractCategory === "share") {
        return sortFunction(a, b);
      }
    });

    const sortedContractsObj = sortedResult.reduce((acc, key) => {
      acc[key] = filteredContracts[key];
      return acc;
    }, {});

    if (
      selectedCategory === "unlabeled" &&
      (contractCategory === "category" || contractCategory === "subcategory")
    ) {
      setSortedContracts(sortedContractsObj);
    } else {
      setSortedContracts(sortedContractsObj);
    }
  }, [
    contractCategory,
    contracts,
    selectedCategory,
    selectedChain,
    selectedMode,
    showUsd,
  ]);

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    for (const contract of Object.values(sortedContracts)) {
      const value = selectedMode.includes("gas_fees_")
        ? showUsd
          ? contract.gas_fees_absolute_usd
          : contract.gas_fees_absolute_eth
        : contract.txcount_absolute;

      retValue = Math.max(retValue, value);
    }

    return retValue;
  }, [selectedMode, sortedContracts, showUsd]);

  const sumChainValue = useMemo(() => {
    const chainValues = {};

    Object.keys(data).forEach((chainKey) => {
      let sumValue = 0;

      // Iterate over each category for the current chain
      Object.keys(data[chainKey].overview[selectedTimespan]).forEach(
        (category) => {
          const categoryData =
            data[chainKey].overview[selectedTimespan][category].data;

          // Check if category data exists and index is valid
          if (
            categoryData &&
            data[chainKey].overview["types"].indexOf(selectedMode) !== -1
          ) {
            const dataIndex =
              data[chainKey].overview["types"].indexOf(selectedMode);
            const categoryValue = categoryData[dataIndex];
            sumValue += categoryValue; // Add to the sum
          }
        },
      );

      // Store the sum of values for the chain
      chainValues[chainKey] = sumValue;
    });

    return chainValues;
  }, [data, selectedTimespan, selectedMode]);

  // Usage: largestChainValue["optimism"] will give you the largest value for the "optimism" chain

  function getWidth(x) {
    let retValue = "0%";

    if (selectedMode.includes("gas_fees")) {
      if (showUsd) {
        retValue =
          String(
            (
              (x.gas_fees_absolute_usd.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      } else {
        retValue =
          String(
            (
              (x.gas_fees_absolute_eth.toFixed(2) / largestContractValue) *
              100
            ).toFixed(1),
          ) + "%";
      }
    } else {
      retValue =
        String(((x.txcount_absolute / largestContractValue) * 100).toFixed(1)) +
        "%";
    }

    return retValue;
  }

  const getBarSectionStyle = useCallback(
    (
      chainKey: string,
      categoryKey: string, // dataIndex: number,
    ) => {
      const style: CSSProperties = {
        backgroundColor: "white",
        // width: "0px",
        borderRadius: "0px",
      };

      const categoriesKey = Object.keys(categories).indexOf(categoryKey);
      const dataKeys = Object.keys(data[chainKey].overview[selectedTimespan]);
      const dataKeysIntersectCategoriesKeys = Object.keys(categories).filter(
        (key) => dataKeys.includes(key),
      );
      const dataIndex = dataKeysIntersectCategoriesKeys.indexOf(categoryKey);

      const categoryData =
        data[chainKey].overview[selectedTimespan][categoryKey]["data"];

      // const isLastCategory =
      //   dataIndex === dataKeysIntersectCategoriesKeys.length - 1;

      const isLastCategory = categoryKey === "unlabeled";
      const isFirstCategory = categoryKey === "nft_fi";

      const dataTypes = data[chainKey].overview.types;

      const isSelectedCategory = selectedCategory === categoryKey;

      const isSelectedChainOrNoSelectedChain =
        selectedChain === chainKey || !selectedChain;

      // default transition
      style.transition = "all 0.165s ease-in-out";

      if (isFirstCategory) style.transformOrigin = "left center";
      else if (isLastCategory) style.transformOrigin = "right center";

      if (isLastCategory)
        style.borderRadius = "20000px 99999px 99999px 20000px";

      if (!categoryData) {
        if (
          (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
          isCategoryHovered[categoryKey]
        ) {
          if (isSelectedCategory && isSelectedChainOrNoSelectedChain) {
            style.backgroundColor = "rgba(255,255,255, 0.88)";
            style.color = "rgba(0, 0, 0, 0.66)";
            // style.marginRight = "-5px";
          } else {
            style.backgroundColor = "rgba(255,255,255, 0.6)";
            style.color = "rgba(0, 0, 0, 0.33)";
          }
          if (isLastCategory) {
            style.borderRadius = "25% 125% 125% 25%";
          } else {
            style.borderRadius = "5px";
          }
          style.transform =
            isCategoryHovered[categoryKey] && !isSelectedCategory
              ? "scale(1.2)"
              : isSelectedChainOrNoSelectedChain
              ? "scale(1.30)"
              : "scale(1.2)";

          if (isLastCategory && isSelectedChainOrNoSelectedChain)
            style.transform += " translateX(3px)";
          style.zIndex = isCategoryHovered[categoryKey] ? 2 : 5;
        } else {
          style.backgroundColor = "rgba(255,255,255, 0.60)";
          if (isLastCategory) {
            style.borderRadius = "20000px 9999999px 9999999px 20000px";
            style.paddingRight = "30px";
          } else {
            style.borderRadius = "2px";
          }
        }
        style.paddingTop = "0px";
        style.paddingBottom = "0px";
        style.width =
          isCategoryHovered[categoryKey] || selectedCategory === categoryKey
            ? "45px"
            : "10px";

        style.margin = "0px 1px";

        return style;
      }
      if (
        (isSelectedCategory && isSelectedChainOrNoSelectedChain) ||
        isCategoryHovered[categoryKey]
      ) {
        if (isLastCategory) {
          style.borderRadius = "20000px 99999px 99999px 20000px";
        } else {
          style.borderRadius = "5px";
        }

        if (selectedValue === "share") {
          style.width = categoryData
            ? categoryData[dataTypes.indexOf(selectedMode)] *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
          // if()
        } else {
          style.width = categoryData
            ? (categoryData[dataTypes.indexOf(selectedMode)] /
                sumChainValue[chainKey]) *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
          // if()
        }
        style.transform =
          isCategoryHovered[categoryKey] && !isSelectedCategory
            ? "scaleY(1.01)"
            : isSelectedChainOrNoSelectedChain
            ? "scaleY(1.08)"
            : "scaleY(1.01)";

        if (isLastCategory && isSelectedChainOrNoSelectedChain)
          style.transform += " translateX(3px)";

        // style.outline =
        //   isSelectedCategory && isSelectedChainOrNoSelectedChain
        //     ? "3px solid rgba(255,255,255, 1)"
        //     : "3px solid rgba(255,255,255, 0.33)";

        style.zIndex = isCategoryHovered[categoryKey] ? 2 : 5;

        style.backgroundColor = "";
      } else {
        if (selectedValue === "share") {
          style.width = categoryData
            ? categoryData[dataTypes.indexOf(selectedMode)] *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
          // if()
        } else {
          style.width = categoryData
            ? (categoryData[dataTypes.indexOf(selectedMode)] /
                sumChainValue[chainKey]) *
                relativePercentageByChain[chainKey] +
              8 +
              "%"
            : "0px";
        }

        // if(isCategoryHovered[categoryKey])
        // style.transform =
        //   isCategoryHovered[categoryKey] && !isSelectedCategory
        //     ? "scale(1)"
        //     : "scale(1.05)";

        if (isLastCategory) {
          style.borderRadius = "0px 99999px 99999px 0px";
        } else {
          style.borderRadius = "0px";
        }

        if (categoryKey === "unlabeled" && categoryData) {
          // style.backgroundColor = "rgba(88, 88, 88, 0.55)";
          style.background =
            "linear-gradient(-45deg, rgba(0, 0, 0, .88) 25%, rgba(0, 0, 0, .99) 25%, rgba(0, 0, 0, .99) 50%, rgba(0, 0, 0, .88) 50%, rgba(0, 0, 0, .88) 75%, rgba(0, 0, 0, .99) 75%, rgba(0, 0, 0, .99))";
          // style.background = undefined;
          //   "linear-gradient(to right, #e5405e 0%, #ffdb3a 45%, #3fffa2 100%)";
          // style.backgroundPosition = "75% 0%";
          // style.backgroundRepeat = "repeat";
          style.animation = "unlabeled-gradient 20s linear infinite";
          style.backgroundSize = "10px 10px";
        } else {
          style.backgroundColor = `rgba(0, 0, 0, ${
            0.06 + (dataIndex / (Object.keys(categories).length - 1)) * 0.94
          })`;
        }
      }
      return style;
    },
    [
      selectedCategory,
      selectedMode,
      selectedChain,
      data,
      relativePercentageByChain,
      isCategoryHovered,
      categories,
      selectedTimespan,
    ],
  );

  const chartMax = useMemo(() => {
    let returnValue = 0;
    let typeIndex = data["all_l2s"].daily["types"].indexOf(selectedMode);

    if (selectedChain) {
      for (
        let i = 0;
        i <
        (selectedTimespan === "max"
          ? data[selectedChain].daily[selectedCategory].data.length
          : timespans[selectedTimespan].value);
        i++
      ) {
        if (
          data[selectedChain].daily[selectedCategory].data.length - (i + 1) >=
          0
        ) {
          if (
            data[selectedChain].daily[selectedCategory].data[
              data[selectedChain].daily[selectedCategory].data.length - (i + 1)
            ][typeIndex] > returnValue
          ) {
            returnValue =
              data[selectedChain].daily[selectedCategory].data[
                data[selectedChain].daily[selectedCategory].data.length -
                  (i + 1)
              ][typeIndex];
          }
        }
      }
    } else {
      for (
        let i = 0;
        i <
        (selectedTimespan === "max"
          ? data["all_l2s"].daily[selectedCategory].data.length
          : timespans[selectedTimespan].value);
        i++
      ) {
        if (
          data["all_l2s"].daily[selectedCategory].data.length - (i + 1) >=
          0
        ) {
          if (
            data["all_l2s"].daily[selectedCategory].data[
              data["all_l2s"].daily[selectedCategory].data.length - (i + 1)
            ][typeIndex] > returnValue
          ) {
            returnValue =
              data["all_l2s"].daily[selectedCategory].data[
                data["all_l2s"].daily[selectedCategory].data.length - (i + 1)
              ][typeIndex];
          }
        }
      }
    }
    return returnValue;
  }, [selectedTimespan, selectedCategory, selectedMode, selectedChain]);

  console.log(chartMax);
  function formatNumber(number: number): string {
    if (number === 0) {
      return "0";
    } else if (Math.abs(number) >= 1e6) {
      if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(1) + "B";
      } else {
        return (number / 1e6).toFixed(1) + "M";
      }
    } else if (Math.abs(number) >= 1e3) {
      const rounded =
        Math.abs(number) >= 10000
          ? Math.round(number / 1e3)
          : (number / 1e3).toFixed(1);
      return `${rounded}${Math.abs(number) >= 10000 ? "K" : "k"}`;
    } else if (Math.abs(number) >= 100) {
      return number.toFixed(0);
    } else if (Math.abs(number) >= 10) {
      return number.toFixed(1);
    } else {
      return number.toFixed(2);
    }
  }

  return (
    <div className="w-full flex-col relative">
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                selectedMode.includes("gas_fees")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode(
                  selectedValue === "absolute"
                    ? showUsd
                      ? "gas_fees_usd_absolute"
                      : "gas_fees_eth_absolute"
                    : showUsd
                    ? "gas_fees_share_usd"
                    : "gas_fees_share_eth",
                );
              }}
            >
              Gas Fees
            </button>
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                selectedMode.includes("txcount")
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode(
                  selectedValue === "absolute"
                    ? "txcount_absolute"
                    : "txcount_share",
                );
              }}
            >
              Transaction Count
            </button>
          </div>
          <div className="block lg:hidden w-[70%] mx-auto mt-[5px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            {Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                  selectedTimespan === timespan
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedTimespan(timespan);
                  // setXAxis();
                  // chartComponent?.current?.xAxis[0].update({
                  //   min: timespans[selectedTimespan].xMin,
                  //   max: timespans[selectedTimespan].xMax,
                  //   // calculate tick positions based on the selected time interval so that the ticks are aligned to the first day of the month
                  //   tickPositions: getTickPositions(
                  //     timespans.max.xMin,
                  //     timespans.max.xMax,
                  //   ),
                  // });
                }}
              >
                {timespans[timespan].label}
              </button>
            ))}
          </div>
          <div
            className={`absolute transition-[transform] text-xs  duration-300 ease-in-out -z-10 top-[50px] right-[20px] md:right-[45px] lg:top-0 lg:right-[65px] pr-[15px] w-[calc(50%-34px)] md:w-[calc(50%-56px)] lg:pr-[23px] lg:w-[168px] xl:w-[158px] xl:pr-[23px] ${
              !isMobile
                ? ["max", "180d"].includes(selectedTimespan)
                  ? "translate-y-[calc(-100%+3px)]"
                  : "translate-y-0 "
                : ["max", "180d"].includes(selectedTimespan)
                ? "translate-y-[calc(100%+3px)]"
                : "translate-y-0"
            }`}
          >
            <div className="font-medium bg-forest-100 dark:bg-forest-1000 rounded-b-2xl rounded-t-none lg:rounded-b-none lg:rounded-t-2xl border border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
              7-day rolling average
            </div>
          </div>
        </div>
      </Container>
      <Container className="block w-full !pr-0 lg:!px-[50px]">
        <div className="overflow-x-scroll lg:overflow-x-visible z-100 w-full scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
          <div
            className={
              "min-w-[880px] md:min-w-[910px] overflow-hidden px-[16px]"
            }
          >
            <div
              className={
                "relative h-[50px] border-x-[1px] border-t-[1px] rounded-t-[15px] text-forest-50 dark:text-forest-50 border-forest-400 dark:border-forest-800 bg-forest-900 dark:bg-forest-1000 mt-6 overflow-hidden"
              }
            >
              <div className="flex w-full h-full text-[12px]">
                <div
                  className={`relative flex w-[138px] h-full justify-center items-center`}
                >
                  <button className="flex flex-col flex-1 h-full justify-center items-center border-x border-transparent overflow-hidden">
                    <div
                      className={`relative -left-[39px] top-[17px] text-xs font-medium`}
                    ></div>
                    <div
                      className={`relative left-[30px] -top-[17px] text-xs font-medium`}
                    ></div>
                  </button>
                </div>
                <div className="flex flex-1">
                  {Object.keys(categories).map(
                    (category, i) =>
                      categories[category] !== "Chains" && (
                        <div
                          key={category}
                          className={`relative flex h-full justify-center items-center 
                          ${category === "unlabeled" ? "flex-1" : "flex-1"}
                          ${
                            selectedCategory === category
                              ? "borden-hidden rounded-[0px]"
                              : "h-full"
                          }`}
                          onMouseEnter={() => {
                            setIsCategoryHovered((prev) => ({
                              ...prev,
                              [category]: true,
                            }));
                          }}
                          onMouseLeave={() => {
                            setIsCategoryHovered((prev) => ({
                              ...prev,
                              [category]: false,
                            }));
                          }}
                          style={{
                            backgroundColor:
                              selectedCategory === category
                                ? "#5A6462"
                                : `rgba(0, 0, 0, ${
                                    0.06 +
                                    (i / Object.keys(categories).length) * 0.94
                                  })`,
                          }}
                        >
                          <button
                            key={category}
                            className={`flex flex-col w-full h-full justify-center items-center overflow-hidden border-l border-[
                          1px 
                        ] border-forest-50 dark:border-forest-800
                          ${
                            selectedCategory === category
                              ? "bg-forest-800/[0.025]"
                              : ""
                          } 
                          ${
                            isCategoryHovered[category]
                              ? "bg-forest-800/50"
                              : ""
                          }`}
                            onClick={() => {
                              setSelectedCategory(category);
                              setSelectedChain(null);
                            }}
                          >
                            <div
                              className={`${
                                selectedCategory === category
                                  ? "text-sm font-semibold"
                                  : "text-xs font-medium"
                              }`}
                            >
                              {categories[category]}
                            </div>
                          </button>
                        </div>
                      ),
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* <colorful rows> */}
          {/* {selectedScale === "gasfees" ? ( */}
          <div className="flex flex-col space-y-[10px] min-w-[880px] md:min-w-[910px] mb-8">
            {
              //chain name is key
              Object.keys(data)
                .filter((c) => c !== "all_l2s")
                .map((chainKey, index) => {
                  return (
                    <div key={index} className="w-full h-full relative">
                      {DisabledStates[selectedMode] &&
                      DisabledStates[selectedMode][chainKey] ? (
                        <>
                          <div
                            className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
                              ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                                ? "text-white dark:text-black"
                                : "text-white"
                            } ${
                              AllChainsByKeys[chainKey].backgrounds[theme][1]
                            }`}
                          >
                            <div className="flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px] z-10">
                              <div className="flex justify-center items-center w-[30px]">
                                <Icon
                                  icon={`gtp:${chainKey}-logo-monochrome`}
                                  className="w-[15px] h-[15px]"
                                />
                              </div>
                              <div className="-mb-0.5">
                                {AllChainsByKeys[chainKey].label}
                              </div>
                            </div>
                            <div className="flex flex-col w-full h-[41px] justify-center items-center px-4 py-5 z-10">
                              <div className="flex flex-row w-full justify-center items-center text-sm">
                                {DisabledStates[selectedMode][chainKey].text}
                                <Tooltip placement="right" allowInteract>
                                  <TooltipTrigger>
                                    <div className="p-1 z-10 mr-0 md:-mr-0.5">
                                      <Icon
                                        icon="feather:info"
                                        className="w-4 h-4"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                                    <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                                      {
                                        DisabledStates[selectedMode][chainKey]
                                          .reason
                                      }
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="absolute w-full h-full p-[2px]">
                              <div className="w-full h-full bg-white/60 rounded-full"></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className={`flex flex-row flex-grow h-full items-center rounded-full text-xs font-medium ${
                            ["arbitrum", "imx", "all_l2s"].includes(chainKey)
                              ? "text-white dark:text-black"
                              : "text-white"
                          } ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`}
                        >
                          <div className="flex items-center h-[45px] pl-[20px] w-[155px] min-w-[155px]">
                            <div className="flex justify-center items-center w-[30px]">
                              <Icon
                                icon={`gtp:${chainKey.replace(
                                  "_",
                                  "-",
                                )}-logo-monochrome`}
                                className="w-[15px] h-[15px]"
                              />
                            </div>
                            <div className="-mb-0.5">
                              {AllChainsByKeys[chainKey].label}
                            </div>
                          </div>
                          <div className="flex w-full pr-[2px] py-[2px] relative">
                            {/* {(DisabledStates[selectedMode] &&
                            DisabledStates[selectedMode][chainKey]) && (
                              <div className="flex flex-col w-full h-[41px] justify-center items-center px-4 py-5 ">
                                <div className="flex flex-row w-full justify-center items-center text-sm">
                                  No Gas Fees{" "}
                                  <Tooltip placement="right" allowInteract>
                                    <TooltipTrigger>
                                      <div className="p-1 z-10 mr-0 md:-mr-0.5">
                                        <Icon
                                          icon="feather:info"
                                          className="w-4 h-4"
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
                                      <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-autow-[420px] h-[80px] flex items-center">
                                        IMX does not charge gas fees.
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            )} */}
                            {Object.keys(categories).map((categoryKey, i) => {
                              // console.log(
                              //   "data[chainKey].overview[selectedTimespan][categoryKey]",
                              //   data[chainKey].overview[selectedTimespan][
                              //     categoryKey
                              //   ],
                              // );
                              const rawChainCategories = Object.keys(
                                data[chainKey].overview[selectedTimespan],
                              );

                              const chainCategories = Object.keys(
                                categories,
                              ).filter((x) => rawChainCategories.includes(x));

                              const categoryIndex =
                                chainCategories.indexOf(categoryKey);

                              return (
                                <div
                                  key={categoryKey}
                                  onClick={() => {
                                    if (selectedCategory === categoryKey) {
                                      if (
                                        !data[chainKey].overview[
                                          selectedTimespan
                                        ][categoryKey]["data"]
                                      ) {
                                        return;
                                      }
                                      if (selectedChain === chainKey) {
                                        // setSelectedCategory(categoryKey);
                                        setSelectedChain(null);
                                      } else {
                                        // setSelectedCategory(categoryKey);
                                        setSelectedChain(chainKey);
                                      }
                                    } else {
                                      setSelectedCategory(categoryKey);
                                      setSelectedChain(null);
                                    }
                                  }}
                                  onMouseEnter={() => {
                                    setIsCategoryHovered((prev) => ({
                                      ...prev,
                                      [categoryKey]: true,
                                    }));
                                  }}
                                  onMouseLeave={() => {
                                    setIsCategoryHovered((prev) => ({
                                      ...prev,
                                      [categoryKey]: false,
                                    }));
                                  }}
                                  className={`flex flex-col h-[41px] justify-center items-center py-5 cursor-pointer relative transition-all duration-200 ease-in-out
                                    ${
                                      data[chainKey].overview[selectedTimespan][
                                        categoryKey
                                      ]
                                        ? (selectedCategory === categoryKey &&
                                            (selectedChain === chainKey ||
                                              selectedChain === null)) ||
                                          isCategoryHovered[categoryKey]
                                          ? isCategoryHovered[categoryKey] &&
                                            selectedCategory !== categoryKey
                                            ? `py-[23px] -my-[0px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                                            : `py-[25px] -my-[5px] z-[2] shadow-lg ${AllChainsByKeys[chainKey].backgrounds[theme][1]}`
                                          : `z-[1]`
                                        : "py-[23px] -my-[0px] z-[2] shadow-lg"
                                    } 
                                    ${
                                      categoryIndex ===
                                      Object.keys(categories).length - 1
                                        ? selectedCategory === categoryKey &&
                                          (selectedChain === chainKey ||
                                            selectedChain === null)
                                          ? ""
                                          : "rounded-r-full"
                                        : ""
                                    }`}
                                  style={getBarSectionStyle(
                                    chainKey,
                                    categoryKey,
                                  )}
                                >
                                  <div
                                    className={`mix-blend-luminosity font-medium w-full absolute inset-0 flex items-center justify-center ${
                                      (selectedCategory === categoryKey &&
                                        (selectedChain === chainKey ||
                                          selectedChain === null)) ||
                                      isCategoryHovered[categoryKey]
                                        ? `${
                                            isCategoryHovered[categoryKey] &&
                                            selectedCategory !== categoryKey
                                              ? "text-xs"
                                              : "text-sm font-semibold"
                                          } ${
                                            [
                                              "arbitrum",
                                              "imx",
                                              "all_l2s",
                                            ].includes(chainKey)
                                              ? "text-black"
                                              : "text-white"
                                          }`
                                        : [
                                            "arbitrum",
                                            "imx",
                                            "all_l2s",
                                          ].includes(chainKey)
                                        ? i > 4
                                          ? "text-white/60 text-xs"
                                          : "text-black text-xs"
                                        : i > 4
                                        ? "text-white/60 text-xs"
                                        : "text-white/80 text-xs"
                                    }`}
                                  >
                                    {data[chainKey].overview[selectedTimespan][
                                      categoryKey
                                    ]["data"] ? (
                                      <>
                                        {selectedValue === "absolute"
                                          ? selectedMode.includes("txcount")
                                            ? ""
                                            : showUsd
                                            ? "$ "
                                            : "Ξ "
                                          : ""}
                                        {selectedValue === "share"
                                          ? (
                                              data[chainKey].overview[
                                                selectedTimespan
                                              ][categoryKey]["data"][
                                                data[
                                                  chainKey
                                                ].overview.types.indexOf(
                                                  selectedMode,
                                                )
                                              ] * 100.0
                                            ).toFixed(2)
                                          : formatNumber(
                                              data[chainKey].overview[
                                                selectedTimespan
                                              ][categoryKey]["data"][
                                                data[
                                                  chainKey
                                                ].overview.types.indexOf(
                                                  selectedMode,
                                                )
                                              ],
                                            )}
                                        {selectedValue === "share" ? "%" : ""}{" "}
                                      </>
                                    ) : (
                                      <div
                                        className={`text-black/80
                                        ${
                                          isCategoryHovered[categoryKey] ||
                                          selectedCategory === categoryKey
                                            ? "opacity-100 py-8"
                                            : "opacity-0"
                                        } transition-opacity duration-300 ease-in-out`}
                                      >
                                        {selectedValue === "absolute"
                                          ? selectedMode.includes("txcount")
                                            ? ""
                                            : showUsd
                                            ? "$ "
                                            : "Ξ "
                                          : ""}
                                        0 {selectedValue === "share" ? "%" : ""}{" "}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
                .concat(
                  <div className="relative pl-[155px] w-full flex justify-between h-[15px] -top-[10px] text-[10px]">
                    {[0, 20, 40, 60, 80, 100].map((x, i) => (
                      <div key={x} className="relative">
                        <div className="h-[15px] border-r border-forest-900 dark:border-forest-500"></div>
                        {x === 0 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] left-0">
                            {x}%
                          </div>
                        )}
                        {x === 100 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute top-[110%] right-0">
                            {x}%
                          </div>
                        )}
                        {x !== 0 && x !== 100 && (
                          <div className="text-forest-900 dark:text-forest-500 absolute w-8 top-[110%] -left-2">
                            {x}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>,
                )
            }
          </div>
        </div>
      </Container>
      <Container>
        <div className="mt-[20px] lg:mt-[50px] mb-[38px] ">
          <h2 className="text-[20px] font-bold">
            {selectedChain
              ? AllChainsByKeys[selectedChain].label
              : "All Chains"}
            : {categories[selectedCategory]}
          </h2>
        </div>
        <Chart
          types={
            selectedChain === null
              ? data.all_l2s.daily.types
              : data[selectedChain].daily.types
          }
          chartType="area"
          stack
          timespan={selectedTimespan}
          series={chartSeries}
          yScale={selectedValue === "share" ? "percentage" : "linear"}
          chartHeight="196px"
          chartWidth="100%"
          maxY={chartMax}
        />
      </Container>
      <Container className="w-[98%] ml-4">
        <div className="flex flex-wrap items-center w-[100%] gap-y-2 invisible lg:visible">
          <h1 className="font-bold text-sm pr-2 pl-2">
            {master &&
              master.blockspace_categories.main_categories[selectedCategory]}
          </h1>
          {master &&
            Object.keys(
              master.blockspace_categories["mapping"][selectedCategory],
            ).map((key) => {
              return (
                <p className="text-xs px-[4px] py-[5px] mx-[5px]" key={key}>
                  {formatSubcategories(
                    master.blockspace_categories["mapping"][selectedCategory][
                      key
                    ],
                  )}
                </p>
              );
            })}
        </div>
      </Container>
      <Container>
        {" "}
        <div className="flex flex-row w-[98%] mx-auto justify-center md:items-center items-end md:justify-end rounded-full  text-sm md:text-base  md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}
          <button
            className={`px-[16px] py-[4px]  rounded-full ${
              selectedValue === "absolute"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute");
              if (!selectedMode.includes("absolute")) {
                if (selectedMode.includes("gas_fees")) {
                  if (showUsd) {
                    setSelectedMode("gas_fees_usd_absolute");
                  } else {
                    setSelectedMode("gas_fees_eth_absolute");
                  }
                } else {
                  setSelectedMode("txcount_absolute");
                }
              }
            }}
          >
            Absolute
          </button>
          <button
            className={`px-[16px] py-[4px]  rounded-full ${
              selectedValue === "share"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("share");

              if (selectedMode.includes("gas_fees")) {
                if (showUsd) {
                  setSelectedMode("gas_fees_share_usd");
                } else {
                  setSelectedMode("gas_fees_share_eth");
                }
              } else {
                setSelectedMode("txcount_share");
              }
            }}
          >
            Share of Chain Usage
          </button>
        </div>
      </Container>

      <Container>
        <div className="w-[97%] mx-auto mt-[30px] flex flex-col">
          <h1 className="text-lg font-bold">Most Active Contracts</h1>
          <p className="text-sm mt-[15px]">
            See the most active contracts within the selected timeframe (
            {timespans[selectedTimespan].label}) and for your selected category.{" "}
          </p>
        </div>
      </Container>

      <Container className="lg:overflow-hidden overflow-x-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pb-4">
        <div className="flex flex-col mt-[30px] w-[99%] mx-auto min-w-[1020px]  ">
          <div className="flex exl:text-[14px] text-[12px] font-bold mb-[10px]">
            <div className="flex gap-x-[15px] w-[33%] ">
              <button
                className="flex gap-x-1 pl-4"
                onClick={() => {
                  if (contractCategory !== "chain") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("chain");
                }}
              >
                Chain
                <Icon
                  icon={
                    contractCategory === "chain"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "chain" ? "opacity-100" : "opacity-20"
                  }`}
                />
              </button>

              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "contract") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("contract");
                }}
              >
                Contract
                <Icon
                  icon={
                    contractCategory === "contract"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "contract"
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                />
              </button>
            </div>
            <div className="flex w-[30%]">
              <button className="flex gap-x-1 w-[53%] ">Category </button>
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "subcategory") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("subcategory");
                }}
              >
                Subcategory{" "}
                <Icon
                  icon={
                    contractCategory === "subcategory"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "subcategory"
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                />
              </button>
            </div>
            <div className="flex w-[37%]  ">
              <button
                className="flex gap-x-1 w-[51.5%] justify-end "
                onClick={() => {
                  if (contractCategory !== "value") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("value");
                }}
              >
                {selectedMode.includes("gas_fees")
                  ? "Gas Fees "
                  : "Transaction Count "}
                <p className="font-normal">
                  ({timespans[selectedTimespan].label})
                </p>
                <Icon
                  icon={
                    contractCategory === "value"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "value" ? "opacity-100" : "opacity-20"
                  }`}
                />
              </button>

              <div className="flex gap-x-1 w-[48.5%] justify-center">
                <div>Block Explorer </div>
              </div>
            </div>
          </div>
          <div>
            {!sortOrder
              ? Object.keys(sortedContracts).map((key, i) => {
                  if (i >= maxDisplayedContracts) {
                    return null;
                  }

                  return (
                    <div key={key + "" + sortOrder}>
                      <div className="flex rounded-full border-forest-100 border-[1px] h-[60px] mt-[7.5px] ">
                        <div className="flex w-[100%] ml-4 mr-8 items-center ">
                          <div className="flex items-center h-10 w-[34%] gap-x-[20px] pl-1  ">
                            <div className=" w-[40px]">
                              <div
                                className={`flex min-w-9 min-h-9 w-9 h-9 rounded-full items-center justify-center border-[5px] ${
                                  AllChainsByKeys[sortedContracts[key].chain]
                                    .border[theme][1]
                                }`}
                              >
                                <Icon
                                  icon={`gtp:${sortedContracts[
                                    key
                                  ].chain.replace("_", "-")}-logo-monochrome`}
                                  className="min-w-5 min-h-5 w-5 h-5"
                                  style={{
                                    color:
                                      AllChainsByKeys[
                                        sortedContracts[key].chain
                                      ].colors[theme][1],
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              key={sortedContracts[key].address}
                              className={`flex flex-col overflow-hidden h-full items-start justify-center  ${
                                contractHover[key]
                                  ? "whitespace-nowrap"
                                  : "whitespace-normal"
                              } `}
                              onMouseEnter={() => {
                                setContractHover((prevHover) => ({
                                  ...prevHover,
                                  [key]: true,
                                }));
                              }}
                              onMouseLeave={() => {
                                setContractHover((prevHover) => ({
                                  ...prevHover,
                                  [key]: false,
                                }));
                                setCopyContract(false);
                              }}
                            >
                              {sortedContracts[key].name
                                ? !contractHover[key]
                                  ? `${
                                      sortedContracts[key].project_name
                                        ? sortedContracts[key].project_name +
                                          ": "
                                        : ""
                                    } ${sortedContracts[key].name}`
                                  : `${
                                      (
                                        sortedContracts[key].project_name +
                                        ": " +
                                        sortedContracts[key].name
                                      ).length >= 40
                                        ? (
                                            sortedContracts[key].project_name +
                                            ": " +
                                            sortedContracts[key].name
                                          ).substring(0, 38) + "..."
                                        : sortedContracts[key].project_name
                                        ? sortedContracts[key].project_name +
                                          ": " +
                                          sortedContracts[key].name
                                        : sortedContracts[key].name
                                    }`
                                : sortedContracts[key].address.substring(0, 6) +
                                  "..." +
                                  sortedContracts[key].address.substring(
                                    36,
                                    42,
                                  )}{" "}
                              {sortedContracts[key].name ||
                              sortedContracts[key].address ? (
                                <div
                                  className={` space-x-2 items-center bg-black/50 px-0.5 rounded-xl text-[12px] ${
                                    contractHover[key] ? "flex" : "hidden"
                                  } ${
                                    (
                                      sortedContracts[key].project_name +
                                      ": " +
                                      sortedContracts[key]
                                    ).length > 40
                                      ? "relative left-20 bottom-4"
                                      : "none"
                                  }`}
                                  onClick={() => {
                                    setCopyContract(true);
                                  }}
                                >
                                  <div>
                                    {sortedContracts[key].address.substring(
                                      0,
                                      6,
                                    ) +
                                      "..." +
                                      sortedContracts[key].address.substring(
                                        36,
                                        42,
                                      )}
                                  </div>
                                  <Icon
                                    icon={`${
                                      !copyContract
                                        ? "feather:copy"
                                        : "feather:check"
                                    }`}
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        sortedContracts[key].address,
                                      );
                                    }}
                                    className="w-3 h-3 cursor-pointer"
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center text-[14px] w-[43%] justify-start h-full">
                            <div className="flex w-[40%] ">
                              {master &&
                                master.blockspace_categories.main_categories[
                                  sortedContracts[key].main_category_key
                                ]}
                            </div>
                            <div className="flex ">
                              {" "}
                              {master &&
                              master.blockspace_categories.sub_categories[
                                sortedContracts[key].sub_category_key
                              ]
                                ? master.blockspace_categories.sub_categories[
                                    sortedContracts[key].sub_category_key
                                  ]
                                : "Unlabeled"}
                            </div>
                          </div>
                          <div className="flex items-center w-[24.5%]  mr-4  ">
                            <div className="flex flex-col w-[38%] items-end ">
                              <div className="flex gap-x-1 w-[110px] justify-end  ">
                                <div className="flex">
                                  {" "}
                                  {selectedMode.includes("gas_fees_")
                                    ? showUsd
                                      ? `$`
                                      : `Ξ`
                                    : ""}
                                </div>
                                {selectedMode.includes("gas_fees_")
                                  ? showUsd
                                    ? Number(
                                        sortedContracts[
                                          key
                                        ].gas_fees_absolute_usd.toFixed(0),
                                      ).toLocaleString("en-US")
                                    : Number(
                                        sortedContracts[
                                          key
                                        ].gas_fees_absolute_eth.toFixed(2),
                                      ).toLocaleString("en-US")
                                  : Number(
                                      sortedContracts[
                                        key
                                      ].txcount_absolute.toFixed(0),
                                    ).toLocaleString("en-US")}
                              </div>

                              <div className="h-[3px] w-[110px] bg-forest-900 flex justify-end">
                                <div
                                  className={`h-full bg-forest-50`}
                                  style={{
                                    width: getWidth(sortedContracts[key]),
                                  }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center w-[57%] justify-end ">
                              <a
                                href={
                                  ContractUrls[sortedContracts[key].chain] +
                                  "" +
                                  sortedContracts[key].address
                                }
                                target="_blank"
                              >
                                <Icon
                                  icon="material-symbols:link"
                                  className="w-[30px] h-[30px]"
                                />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : Object.keys(sortedContracts)
                  .reverse()
                  .map((key, i) => {
                    if (i >= maxDisplayedContracts) {
                      return null;
                    }

                    return (
                      <div key={key + "" + sortOrder}>
                        <div className="flex rounded-full border-forest-100 border-[1px] h-[60px] mt-[7.5px] ">
                          <div className="flex w-[100%] ml-4 mr-8 items-center ">
                            <div className="flex items-center h-10 w-[34%] gap-x-[20px] pl-1  ">
                              <div className=" w-[40px]">
                                <div
                                  className={`flex min-w-9 min-h-9 w-9 h-9 rounded-full items-center justify-center border-[5px] ${
                                    AllChainsByKeys[sortedContracts[key].chain]
                                      .border[theme][1]
                                  }`}
                                >
                                  <Icon
                                    icon={`gtp:${sortedContracts[
                                      key
                                    ].chain.replace("_", "-")}-logo-monochrome`}
                                    className="min-w-5 min-h-5 w-5 h-5"
                                    style={{
                                      color:
                                        AllChainsByKeys[
                                          sortedContracts[key].chain
                                        ].colors[theme][1],
                                    }}
                                  />
                                </div>
                              </div>

                              <div
                                key={sortedContracts[key].address}
                                className={`flex flex-col overflow-hidden h-full items-start justify-center  ${
                                  contractHover[key]
                                    ? "whitespace-nowrap"
                                    : "whitespace-normal"
                                } `}
                                onMouseEnter={() => {
                                  setContractHover((prevHover) => ({
                                    ...prevHover,
                                    [key]: true,
                                  }));
                                }}
                                onMouseLeave={() => {
                                  setContractHover((prevHover) => ({
                                    ...prevHover,
                                    [key]: false,
                                  }));
                                  setCopyContract(false);
                                }}
                              >
                                {sortedContracts[key].name
                                  ? !contractHover[key]
                                    ? `${
                                        sortedContracts[key].project_name
                                          ? sortedContracts[key].project_name +
                                            ": "
                                          : ""
                                      } ${sortedContracts[key].name}`
                                    : `${
                                        (
                                          sortedContracts[key].project_name +
                                          ": " +
                                          sortedContracts[key].name
                                        ).length >= 40
                                          ? (
                                              sortedContracts[key]
                                                .project_name +
                                              ": " +
                                              sortedContracts[key].name
                                            ).substring(0, 38) + "..."
                                          : sortedContracts[key].project_name
                                          ? sortedContracts[key].project_name +
                                            ": " +
                                            sortedContracts[key].name
                                          : sortedContracts[key].name
                                      }`
                                  : sortedContracts[key].address.substring(
                                      0,
                                      6,
                                    ) +
                                    "..." +
                                    sortedContracts[key].address.substring(
                                      36,
                                      42,
                                    )}{" "}
                                {sortedContracts[key].name ||
                                sortedContracts[key].address ? (
                                  <div
                                    className={` space-x-2 items-center bg-black/50 px-0.5 rounded-xl text-[12px] ${
                                      contractHover[key] ? "flex" : "hidden"
                                    } ${
                                      (
                                        sortedContracts[key].project_name +
                                        ": " +
                                        sortedContracts[key]
                                      ).length > 40
                                        ? "relative left-20 bottom-4"
                                        : "none"
                                    }`}
                                    onClick={() => {
                                      setCopyContract(true);
                                    }}
                                  >
                                    <div>
                                      {sortedContracts[key].address.substring(
                                        0,
                                        6,
                                      ) +
                                        "..." +
                                        sortedContracts[key].address.substring(
                                          36,
                                          42,
                                        )}
                                    </div>

                                    <Icon
                                      icon={`${
                                        !copyContract
                                          ? "feather:copy"
                                          : "feather:check"
                                      }`}
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          sortedContracts[key].address,
                                        );
                                      }}
                                      className="w-3 h-3 cursor-pointer"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center text-[14px] w-[43%] justify-start h-full">
                              <div className="flex w-[40%] ">
                                {master &&
                                  master.blockspace_categories.main_categories[
                                    sortedContracts[key].main_category_key
                                  ]}
                              </div>
                              <div className="flex ">
                                {" "}
                                {master &&
                                master.blockspace_categories.sub_categories[
                                  sortedContracts[key].sub_category_key
                                ]
                                  ? master.blockspace_categories.sub_categories[
                                      sortedContracts[key].sub_category_key
                                    ]
                                  : "Unlabeled"}
                              </div>
                            </div>
                            <div className="flex items-center w-[24.5%]  mr-4  ">
                              <div className="flex flex-col w-[38%] items-end ">
                                <div className="flex gap-x-1 w-[110px] justify-end  ">
                                  <div className="flex">
                                    {" "}
                                    {selectedMode.includes("gas_fees_")
                                      ? showUsd
                                        ? `$`
                                        : `Ξ`
                                      : ""}
                                  </div>
                                  {selectedMode.includes("gas_fees_")
                                    ? showUsd
                                      ? Number(
                                          sortedContracts[
                                            key
                                          ].gas_fees_absolute_usd.toFixed(0),
                                        ).toLocaleString("en-US")
                                      : Number(
                                          sortedContracts[
                                            key
                                          ].gas_fees_absolute_eth.toFixed(2),
                                        ).toLocaleString("en-US")
                                    : Number(
                                        sortedContracts[
                                          key
                                        ].txcount_absolute.toFixed(0),
                                      ).toLocaleString("en-US")}
                                </div>

                                <div className="h-[3px] w-[110px] bg-forest-900 flex justify-end">
                                  <div
                                    className={`h-full bg-forest-50`}
                                    style={{
                                      width: getWidth(sortedContracts[key]),
                                    }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex items-center w-[57%] justify-end ">
                                <a
                                  href={
                                    ContractUrls[sortedContracts[key].chain] +
                                    "" +
                                    sortedContracts[key].address
                                  }
                                  target="_blank"
                                >
                                  <Icon
                                    icon="material-symbols:link"
                                    className="w-[30px] h-[30px]"
                                  />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            <div className="w-full flex justify-center mb-2">
              <button
                className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full  hover:bg-forest-700 p-[6px 16px] ${
                  Object.keys(sortedContracts).length <= 10
                    ? "hidden"
                    : "visible"
                } ${
                  Object.keys(sortedContracts).length <=
                    maxDisplayedContracts || maxDisplayedContracts >= 50
                    ? "hidden"
                    : "visible"
                }`}
                onClick={() => {
                  setShowMore(!showMore);
                  if (
                    Object.keys(sortedContracts).length > maxDisplayedContracts
                  ) {
                    setMaxDisplayedContracts(maxDisplayedContracts + 10);
                  } else {
                    setMaxDisplayedContracts(10);
                  }
                }}
              >
                Show More
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
