"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Switch } from "../Switch";
import { Sources } from "@/lib/datasources";
import Container from "./Container";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { Chart } from "../charts/chart";
import { AllChainsByKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainAnimations from "./ChainAnimations";

export default function CategoryMetrics({
  data,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: CategoryComparisonResponseData;
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

  type ContractInfo = {
    address: string;
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

  type ChainData = {
    id: string;
    name: string;
    unixKey: string;
    dataKey: string;
    data: any[];
  };

  const ContractUrls = {
    arbitrum: "https://arbiscan.io/address/",
    optimism: "https://optimistic.etherscan.io/address/",
    zksync_era: "https://explorer.zksync.io/address/",
    polygon_zkevm: "https://zkevm.polygonscan.com/address/",
    imx: "https://immutascan.io/address/",
    base: "https://basescan.org/address/",
  };

  const [selectedMode, setSelectedMode] = useState("gas_fees_");
  const [selectedCategory, setSelectedCategory] = useState("nft_fi");
  const [contractHover, setContractHover] = useState({});

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [openSub, setOpenSub] = useState(false);
  const [selectedValue, setSelectedValue] = useState("absolute");

  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);

  const [contractCategory, setContractCategory] = useState("value");
  const [sortOrder, setSortOrder] = useState(true);
  const [chainValues, setChainValues] = useState<any[][] | null>(null);
  const [selectedType, setSelectedType] = useState("gas_fees_absolute_usd");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const { theme } = useTheme();

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>({
    arbitrum: true,
    zksync_era: true,
    optimism: true,
    polygon_zkevm: true,
    imx: true,
  });

  const [contracts, setContracts] = useState<{ [key: string]: ContractInfo }>(
    {},
  );
  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});

  const dailyKey = useMemo(() => {
    if (["90d", "365d"].includes(selectedTimespan)) {
      return "daily_7d_rolling";
    } else {
      return "daily";
    }
  }, [selectedTimespan]);

  useEffect(() => {
    // Process the data and create the contracts object
    const result: { [key: string]: ContractInfo } = {};

    for (const category of Object.keys(data)) {
      if (data[category]) {
        const contractsData =
          data[category].aggregated[selectedTimespan].contracts.data;
        const types =
          data[category].aggregated[selectedTimespan].contracts.types;

        for (const contract of Object.keys(contractsData)) {
          const dataArray = contractsData[contract];
          const key = dataArray[0] + dataArray[4];
          const values = dataArray;

          // Check if the key already exists in the result object
          if (result.hasOwnProperty(key)) {
            // If the key exists, update the values
            result[key] = {
              ...result[key],
              address: values[types.indexOf("address")],
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
    setContracts(result);
  }, [data, selectedTimespan]);

  const sortedChainValues = useMemo(() => {
    if (!chainValues || !selectedChains) return null;

    return chainValues
      .filter(([item]) => item !== "types")
      .sort((a, b) => b[1] - a[1])
      .sort(([itemA], [itemB]) =>
        selectedChains[itemA] === selectedChains[itemB]
          ? 0
          : selectedChains[itemA]
          ? -1
          : 1,
      );
  }, [chainValues, selectedChains]);

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
      "90d": {
        label: "90 days",
        value: 90,
      },
      // "180d": {
      //   label: "180 days",
      //   value: 180,
      // },
      "365d": {
        label: "1 year",
        value: 365,
      },
      // max: {
      //   label: "Maximum",
      //   value: 0,
      // },
    };
  }, []);

  const categories: { [key: string]: string } = useMemo(() => {
    if (master) {
      const result: { [key: string]: string } = {};

      result.categories = "Categories";
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

  const updatedSubcategories = useMemo(() => {
    const initialSelectedSubcategories = {};
    Object.keys(categories).forEach((category) => {
      if (data[category]?.subcategories?.list) {
        initialSelectedSubcategories[category] = [
          ...data[category].subcategories.list,
        ];
      } else {
        initialSelectedSubcategories[category] = [];
      }
    });
    return initialSelectedSubcategories;
  }, [data, categories]);

  const [selectedSubcategories, setSelectedSubcategories] =
    useState(updatedSubcategories);

  const chartReturn = useMemo(() => {
    const chainArray: ChainData[] = [];

    if (!selectedSubcategories) return [];

    console.log(
      "selectedSubcategories[selectedCategory].length",
      selectedSubcategories[selectedCategory].length,
    );
    console.log(
      "data[selectedCategory].subcategories.list.length",
      data[selectedCategory].subcategories.list.length,
    );

    //Array of selected chains to return to chart
    for (let i in selectedChains) {
      if (
        selectedChains[i] === true &&
        data[selectedCategory][dailyKey][String(i)]
      ) {
        // don't show imx gas fees chart
        if (i === "imx" && selectedMode === "gas_fees_") continue;

        // default to total main category values
        let chartData = data[selectedCategory][dailyKey][String(i)];

        // check if we're filtering out any subcategories
        if (
          selectedSubcategories[selectedCategory].length !==
          data[selectedCategory].subcategories.list.length
        ) {
          // get the lengths of the selected subcategories' daily values for this chain
          const selectedSubcategoryLengths = selectedSubcategories[
            selectedCategory
          ].map((subcategory) => {
            const rows =
              data[selectedCategory].subcategories[subcategory][dailyKey][
                String(i)
              ];
            return rows ? rows.length : 0;
          });

          // if all subcategories have no data, skip this chain
          if (selectedSubcategoryLengths.every((length) => length === 0))
            continue;

          // get the index of the longest subcategory
          const longestSubcategoryIndex = selectedSubcategoryLengths.indexOf(
            Math.max(...selectedSubcategoryLengths),
          );

          const baseData =
            data[selectedCategory].subcategories[
              selectedSubcategories[selectedCategory][longestSubcategoryIndex]
            ].daily[String(i)];

          for (
            let i = 0;
            i < selectedSubcategories[selectedCategory].length;
            i++
          ) {
            if (longestSubcategoryIndex) continue;

            const subcategory = selectedSubcategories[selectedCategory][i];
            const subcategoryData =
              data[selectedCategory].subcategories[subcategory][dailyKey][
                String(i)
              ] ?? [];

            // for each day, add the subcategory's values to the base value (except the first value which is the date)
            for (let row = 0; row < subcategoryData.length; row++) {
              for (let col = 1; col < subcategoryData[row].length; col++) {
                baseData[row][col] += subcategoryData[row][col];
              }
            }
          }

          if (baseData) {
            chartData = baseData;
          }
        }

        const obj = {
          id: [String(i), selectedCategory, selectedType].join("_"),
          name: String(i),
          unixKey: "unix",
          dataKey: selectedType,
          data: chartData,
        };
        chainArray.push(obj);
      }
    }

    return chainArray;
  }, [
    selectedSubcategories,
    selectedCategory,
    data,
    selectedChains,
    dailyKey,
    selectedMode,
    selectedType,
  ]);

  const chartSeries = useMemo(() => {
    const today = new Date().getTime();

    if (selectedCategory && data) return chartReturn;
    return [
      {
        id: ["arbitrum", "native_transfers", selectedType].join("_"),
        name: "arbitrum",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"][dailyKey]["arbitrum"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
      {
        id: ["optimism", "native_transfers", selectedType].join("_"),
        name: "optimism",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"][dailyKey]["optimism"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
      {
        id: ["zksync_era", "native_transfers", selectedType].join("_"),
        name: "zksync_era",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"][dailyKey]["zksync_era"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
      {
        id: ["polygon_zkevm", "native_transfers", selectedType].join("_"),
        name: "polygon_zkevm",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"][dailyKey]["polygon_zkevm"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
      {
        id: ["imx", "native_transfers", selectedType].join("_"),
        name: "imx",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"][dailyKey]["imx"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
    ];
  }, [selectedCategory, data, chartReturn, selectedType, dailyKey]);

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

  const categorySizes: { [key: string]: { width: string; height: string } } =
    useMemo(() => {
      const retSize: { [key: string]: { width: string; height: string } } = {};
      for (const category in categories) {
        if (data[category]) {
          const subcategoryCount = Object.keys(
            data[category].subcategories,
          ).length;
          let width = "100%"; // Default width
          let height = "";

          if (subcategoryCount >= 7) {
            height = !isMobile ? "210px" : "230px";
          } else if (subcategoryCount >= 5) {
            height = !isMobile ? "180px" : "200px";
          } else {
            height = "150px";
          }

          if (subcategoryCount >= 5 && subcategoryCount < 7) {
            width = "550px";
          } else if (subcategoryCount >= 7) {
            width = "450px";
          } else {
            width = "650px";
          }

          retSize[category] = { width, height };
        }
      }
      return retSize;
    }, [data, categories]);

  const result = HandleAggregate({
    selectedCategory,
    selectedType,
    selectedTimespan,
    selectedSubcategories,
    data,
    setChainValues,
  });

  const runType = HandleType({
    selectedMode,
    selectedValue,
    setSelectedType,
    showUsd,
  });

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

  function handleToggleSubcategory(category, subcategory) {
    setSelectedSubcategories((prevSelectedSubcategories) => {
      const categorySubcategories = prevSelectedSubcategories[category];
      const index = categorySubcategories.indexOf(subcategory);

      // Check if the subcategory exists in the list
      if (index !== -1) {
        // Check if it's the last subcategory in the list
        if (categorySubcategories.length === 1) {
          // If it's the last subcategory, don't remove it
          return prevSelectedSubcategories;
        }

        // Value exists, remove it
        const updatedSubcategories = [...categorySubcategories];
        updatedSubcategories.splice(index, 1);
        return {
          ...prevSelectedSubcategories,
          [category]: updatedSubcategories,
        };
      } else {
        // Value doesn't exist, insert it
        return {
          ...prevSelectedSubcategories,
          [category]: [...categorySubcategories, subcategory],
        };
      }
    });
  }

  useEffect(() => {
    if (!contracts) {
      return;
    }

    const filteredContracts = Object.entries(contracts)
      .filter(([key, contract]) => {
        const isChainSelected = selectedChains[contract.chain];

        const isSubcategorySelected =
          selectedCategory === "unlabeled" && contract.sub_category_key === null
            ? true
            : selectedSubcategories[contract.main_category_key].includes(
                contract.sub_category_key,
              );

        const isCategoryMatched =
          contract.main_category_key === selectedCategory;

        return isChainSelected && isSubcategorySelected && isCategoryMatched;
      })
      .reduce((filtered, [key, contract]) => {
        filtered[key] = contract;
        return filtered;
      }, {});

    let sortedContractKeys = Object.keys(filteredContracts);

    // Define a sorting function
    const sortFunction = (a, b) => {
      const valueA =
        selectedMode === "gas_fees_"
          ? showUsd
            ? filteredContracts[a]?.gas_fees_absolute_usd
            : filteredContracts[a]?.gas_fees_absolute_eth
          : filteredContracts[a]?.txcount_absolute;

      const valueB =
        selectedMode === "gas_fees_"
          ? showUsd
            ? filteredContracts[b]?.gas_fees_absolute_usd
            : filteredContracts[b]?.gas_fees_absolute_eth
          : filteredContracts[b]?.txcount_absolute;

      // Compare the values
      return valueA - valueB;
    };

    if (contractCategory === "contract") {
      // Use the sortFunction
      sortedContractKeys = sortedContractKeys.sort((a, b) => {
        const nameA = filteredContracts[a]?.name;
        const nameB = filteredContracts[b]?.name;

        if (nameA && nameB) {
          return nameA.localeCompare(nameB);
        }

        const addressA = filteredContracts[a]?.address;
        const addressB = filteredContracts[b]?.address;

        return addressA.localeCompare(addressB);
      });
    } else if (contractCategory === "category") {
      // Use the sortFunction
      sortedContractKeys = sortedContractKeys.sort((a, b) => {
        return filteredContracts[a]?.main_category_key.localeCompare(
          filteredContracts[b]?.main_category_key,
        );
      });
    } else if (contractCategory === "subcategory") {
      if (selectedCategory !== "unlabeled") {
        sortedContractKeys = sortedContractKeys.sort((a, b) => {
          return filteredContracts[a]?.sub_category_key.localeCompare(
            filteredContracts[b]?.sub_category_key,
          );
        });
      }
    } else if (contractCategory === "chain") {
      // Use the sortFunction
      sortedContractKeys = sortedContractKeys.sort((a, b) => {
        return filteredContracts[a]?.chain.localeCompare(
          filteredContracts[b]?.chain,
        );
      });
    } else if (contractCategory === "value" || contractCategory === "share") {
      // Use the sortFunction
      sortedContractKeys = sortedContractKeys.sort(sortFunction);
    }

    const sortedResult = sortedContractKeys.reduce((acc, key) => {
      acc[key] = filteredContracts[key];
      return acc;
    }, {});

    if (
      selectedCategory === "unlabeled" &&
      (contractCategory === "category" || contractCategory === "subcategory")
    ) {
      setSortedContracts(sortedContracts);
    } else {
      setSortedContracts(sortedResult);
    }
  }, [
    contractCategory,
    contracts,
    selectedCategory,
    selectedChains,
    selectedSubcategories,
    selectedMode,
    showUsd,
  ]);

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    if (selectedMode === "gas_fees_") {
      if (showUsd) {
        for (let i in sortedContracts) {
          if (sortedContracts[i].gas_fees_absolute_usd > retValue) {
            retValue = sortedContracts[i].gas_fees_absolute_usd;
          }
        }
      } else {
        for (let i in sortedContracts) {
          if (sortedContracts[i].gas_fees_absolute_eth > retValue) {
            retValue = sortedContracts[i].gas_fees_absolute_eth;
          }
        }
      }
    } else {
      for (let i in sortedContracts) {
        if (sortedContracts[i].txcount_absolute > retValue) {
          retValue = sortedContracts[i].txcount_absolute;
        }
      }
    }

    return retValue;
  }, [selectedMode, sortedContracts, showUsd]);

  function checkSubcategory(category, subcategory) {
    return selectedSubcategories[category].includes(subcategory);
  }

  function handleSelectAllSubcategories(category) {
    data[category].subcategories.list.forEach((subcategory) => {
      if (!selectedSubcategories[category].includes(subcategory)) {
        setSelectedSubcategories((prevSelectedSubcategories) => ({
          ...prevSelectedSubcategories,
          [category]: [...prevSelectedSubcategories[category], subcategory],
        }));
      }
    });
  }

  function checkAllSelected(category) {
    if (data[category].subcategories.list) {
      return data[category].subcategories.list.every((subcategory) =>
        selectedSubcategories[category].includes(subcategory),
      );
    }
    return false;
  }

  function HandleType({
    selectedMode,
    selectedValue,
    setSelectedType,
    showUsd,
  }) {
    useEffect(() => {
      if (selectedValue === "share" || selectedMode === "txcount_") {
        setSelectedType(selectedMode + selectedValue);
      } else if (showUsd) {
        if (selectedValue === "absolute_log") {
          setSelectedType(selectedMode + "absolute" + "_usd");
        } else {
          setSelectedType(selectedMode + selectedValue + "_usd");
        }
      } else {
        if (selectedValue === "absolute_log") {
          setSelectedType(selectedMode + "absolute" + "_eth");
        } else {
          setSelectedType(selectedMode + selectedValue + "_eth");
        }
      }
    }, [selectedMode, selectedValue, setSelectedType, showUsd]);

    //Calculate type to hand off to chart and find index selectedValue for data
  }

  function HandleAggregate({
    selectedCategory,
    selectedType,
    selectedTimespan,
    selectedSubcategories,
    data,
    setChainValues,
  }) {
    const category = selectedCategory;
    const timespan = selectedTimespan;
    const type = selectedType;

    useEffect(() => {
      setChainValues(null);
      let total = 0;
      if (selectedSubcategories[category]) {
        Object.keys(selectedSubcategories[category])?.forEach((subcategory) => {
          const subcategoryData =
            data[category].subcategories[
              selectedSubcategories[category][subcategory]
            ];

          const subcategoryChains = subcategoryData.aggregated[timespan].data;

          const index =
            subcategoryData.aggregated[timespan].data["types"].indexOf(type);

          Object.keys(subcategoryChains).forEach((chain) => {
            if (chain !== "types") {
              const chainValue =
                subcategoryData.aggregated[timespan].data[chain][index];

              setChainValues((prevChainValues) => {
                if (prevChainValues === null) {
                  return [[chain, chainValue]];
                } else {
                  const updatedValues = prevChainValues.map(
                    ([prevChain, prevValue]) =>
                      prevChain === chain
                        ? [prevChain, prevValue + chainValue]
                        : [prevChain, prevValue],
                  );

                  const existingChain = prevChainValues.find(
                    ([prevChain]) => prevChain === chain,
                  );
                  if (existingChain) {
                    return updatedValues;
                  } else {
                    return [...prevChainValues, [chain, chainValue]];
                  }
                }
              });
            }
          });
        });
      }
    }, [category, type, timespan, selectedSubcategories, data, setChainValues]);
  }

  function getWidth(x) {
    let retValue = "0%";

    if (selectedMode === "gas_fees_") {
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

  const handleOpen = (category) => {
    if (animationFinished) {
      if (!openSub) {
        setOpenSub(!openSub);
        setAnimationFinished(false);
        setTimeout(() => {
          setAnimationFinished(true);
        }, 500);
      } else {
        setExitAnimation(true);
        setTimeout(() => {
          setOpenSub(!openSub);
          setExitAnimation(false);
        }, 550);
      }
    }
  };

  const transitions = useTransition(
    sortedChainValues
      ?.filter(([item]) => !(item === "imx" && selectedMode === "gas_fees_"))
      .map(([item, value], index) => ({
        item,
        value,
        index,
        yValue: 50 * index,
      })) || [],
    {
      key: (item: any) => item.item, // Use item as the key
      from: { y: 0, opacity: 0 },
      leave: null,
      enter: ({ yValue, item }) => ({
        y: yValue,
        opacity: selectedChains[item] ? 1.0 : 0.3,
      }),
      update: ({ yValue, item }) => ({
        y: yValue,
        opacity: selectedChains[item] ? 1.0 : 0.3,
      }),
      config: { mass: 5, tension: 500, friction: 100 },
    },
  );

  const categoryTransitions = useTransition(
    Object.keys(categories).map((category, i) => ({
      category,
      i,
    })),
    {
      from: { width: "140px" }, // Initial width for closed categories
      enter: ({ category }) => ({
        width:
          openSub && selectedCategory === category
            ? Object.keys(data[category].subcategories).length > 8
              ? "650px"
              : Object.keys(data[category].subcategories).length > 5
              ? "500px"
              : "400px"
            : "140px",
      }),
      update: ({ category }) => ({
        width: !exitAnimation
          ? openSub && selectedCategory === category
            ? Object.keys(data[category].subcategories).length > 8
              ? "650px"
              : Object.keys(data[category].subcategories).length > 5
              ? "500px"
              : "400px"
            : "140px"
          : "140px",
      }),
      leave: { width: "140px" },

      keys: ({ category }) => category,
      config: { mass: 1, tension: 70, friction: 20 },
    },
  );

  const categoryAnimation = useSpring({
    height: openSub ? categorySizes[selectedCategory].height : "67px",
    config: { mass: 1, tension: 70, friction: 20 },
    onRest: () => {
      setAnimationFinished(true);
    },
  });

  return (
    <div className="w-full flex-col relative">
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                "gas_fees_" === selectedMode
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode("gas_fees_");
              }}
            >
              Gas Fees
            </button>
            <button
              className={`rounded-full grow px-4 py-1.5 lg:py-4 font-medium ${
                "txcount_" === selectedMode
                  ? "bg-forest-500 dark:bg-forest-1000"
                  : "hover:bg-forest-500/10"
              }`}
              onClick={() => {
                setSelectedMode("txcount_");
              }}
            >
              Transaction Count
            </button>
          </div>
          <div className="block lg:hidden w-[70%] mx-auto my-[10px]">
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
            <div
              className={`absolute transition-[transform] text-xs  duration-300 ease-in-out -z-10 top-[50px] right-[20px] md:right-[150px] lg:top-0 lg:right-[50px] pr-[15px] w-[calc(50%-19px)] md:w-[175px] lg:pr-[23px] lg:w-[168px] xl:w-[198px] xl:pr-[26px] ${
                !isMobile
                  ? ["365d", "90d"].includes(selectedTimespan)
                    ? "translate-y-[calc(-100%+3px)]"
                    : "translate-y-0 "
                  : ["365d", "90d"].includes(selectedTimespan)
                  ? "translate-y-[calc(100%+3px)]"
                  : "translate-y-0"
              }`}
            >
              <div className="font-medium bg-forest-100 dark:bg-forest-1000 rounded-b-2xl rounded-t-none lg:rounded-b-none lg:rounded-t-2xl border border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
                7-day rolling average
              </div>
            </div>
          </div>
        </div>
      </Container>
      {/* <Container className="block w-full !pr-0 lg:!px-[50px] lg:mt-0 mt-6">
        <div className="flex min-w-[1150px] md:min-w-[1200px] w-[95%] m-auto min-h-[67px] items-center rounded-[15px] bg-white border dark:text-forest-50  text-forest-1000 border-forest-400 dark:border-forest-800  dark:bg-forest-1000 mt-6">
          <div
            className={
              "relative flex flex-col min-w-[140px] max-w-[140px] w-[140px] min-h-[67px] justify-start pl-[16px] pt-2"
            }
          >
            <div className="">
              <div className="text-sm font-bold pb-[10px]">Categories</div>
              <div className="text-xs font-medium">Subcategories</div>
            </div>
          </div>
          <div className="flex flex-1">
            {Object.keys(categories)
              .filter((c) => c != "categories")
              .map((category, i) => {
                const subcategoryCount = Object.keys(categories).filter(
                  (c) => c != "categories",
                );

                return (
                  <div
                    key={i}
                    className={`relative text-sm min-h-[67px] flex flex-col items-center justify-center transition-all duration-300 ease-in-out overflow-clip border-l border-dotted border-white whitespace-nowrap ${
                      selectedCategory === category && openSub
                        ? "basis-[50%] font-bold"
                        : !openSub
                        ? "basis-full"
                        : "basis-[calc(50%/8)]"
                    }
                    ${selectedCategory === category ? "bg-[#5A6462]" : ``}
                    ${
                      i ===
                      Object.keys(categories).filter((c) => c != "categories")
                        .length -
                        1
                        ? "rounded-r-[13px]"
                        : ""
                    }`}
                  >
                    <div
                      className={`absolute z-10 inset-0 flex items-center justify-center shadow-[inset_35px_0px_13px_-25px_rgba(0,0,0,0.85),inset_-35px_0px_13px_-25px_rgba(0,0,0,0.85)] transition-opacity duration-300 pointer-events-none
                      ${
                        openSub &&
                        selectedCategory &&
                        selectedCategory !== category
                          ? "opacity-100"
                          : "opacity-0"
                      }
                      ${i === subcategoryCount - 1 ? "rounded-r-[13px]" : ""}`}
                    />
                    <div
                      className="flex flex-1 w-full justify-center items-center pt-1.5 text-sm cursor-pointer transition-all duration-300 hover:bg-gradient-to-b hover:from-forest-500/10 hover:to-forest-500/0"
                      onClick={() => {
                        setSelectedCategory(category);
                      }}
                    >
                      {categories[category]}
                    </div>
                    <div
                      className={`transition-[height] duration-300 ${
                        selectedCategory === category && openSub
                          ? "h-[50px]"
                          : "h-0 delay-300"
                      }`}
                    ></div>
                    <div
                      className="flex w-full justify-center items-center pb-1 text-xs font-medium cursor-pointer transition-all duration-300 hover:bg-gradient-to-t hover:from-forest-500/10 hover:to-forest-500/0"
                      onClick={() => {
                        if (selectedCategory !== category) {
                          setSelectedCategory(category);
                        }

                        if (selectedCategory === category || !openSub)
                          setOpenSub(!openSub);
                      }}
                    >
                      {openSub ? (
                        <Icon
                          icon="icon-park-outline:up"
                          className={`w-6 h-6 transition-opacity duration-300 ${
                            selectedCategory === category
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                      ) : (
                        <Icon
                          icon="icon-park-outline:down"
                          className="w-6 h-6"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </Container> */}
      <Container className="block w-full !pr-0 lg:!px-[50px] lg:mt-0 mt-6">
        <div className="w-[98%] mx-auto cxl:overflow-hidden overflow-x-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pb-2">
          <animated.div
            className="relative min-w-[1150px] md:min-w-[1200px] w-[97.5%] h-[67px] m-auto border-x-[1px] border-y-[1px] rounded-[15px] dark:text-forest-50  text-forest-1000 border-forest-400 dark:border-forest-800  dark:bg-forest-1000 mt-8 overflow-hidden"
            style={{ ...categoryAnimation }}
          >
            {!openSub ? (
              <div className="flex w-full h-full text-[12px]">
                {Object.keys(categories).map((category, i) =>
                  categories[category] !== "Categories" ? (
                    <div
                      key={category}
                      className={`relative flex w-full h-full justify-between items-center ${
                        selectedCategory === category
                          ? "borden-hidden rounded-[0px] text-white"
                          : "h-full"
                      }
                    ${isCategoryHovered[category] ? "" : ""}`}
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
                        borderLeft:
                          "0.5px dotted var(--dark-active-text, #CDD8D3)",
                        background:
                          selectedCategory === category
                            ? "#5A6462"
                            : theme === "light"
                            ? "#FFFFFF"
                            : `linear-gradient(
                                90deg,
                                rgba(16, 20, 19, ${
                                  0.3 -
                                  (i / (Object.keys(categories).length - 1)) *
                                    0.2
                                }) 0%,
                                #101413 15.10%,
                                rgba(16, 20, 19, ${
                                  0.06 +
                                  (i / Object.keys(categories).length) * 0.94
                                }) 48.96%,
                                #101413 86.98%,
                                rgba(16, 20, 19, ${
                                  0.3 -
                                  (i / (Object.keys(categories).length - 1)) *
                                    0.2
                                }) 100%
                              )`,
                      }}
                    >
                      <div
                        key={category}
                        className={`w-full h-full flex flex-col text-center items-center first-letter justify-between hover:cursor-pointer  ${
                          selectedCategory === category
                            ? ""
                            : "hover:bg-forest-500 dark:hover:bg-white/5"
                        }`}
                        onClick={() => {
                          if (selectedCategory === category) {
                            handleOpen(category);
                          }

                          setSelectedCategory(category);
                        }}
                      >
                        <div
                          className={`flex items-center h-[25px]  mt-1 ${
                            selectedCategory === category
                              ? "text-sm font-bold"
                              : "text-xs font-medium"
                          }`}
                        >
                          <h1>{categories[category]}</h1>
                        </div>

                        <div
                          key={i}
                          className="relative flex items-center mb-2.5 top-[8px] h-[24px] w-full"
                          onClick={() => {
                            handleOpen(category);
                          }}
                        >
                          <Icon
                            icon="icon-park-outline:down"
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Different response for "Chains" category
                    <div
                      key={category}
                      className={
                        "relative flex flex-col min-w-[140px] w-full h-full justify-start mt-2 ml-0.5 pl-[14px] dark:text-white bg-white dark:bg-inherit"
                      }
                    >
                      <div className="text-sm font-bold pb-[10px]">
                        {categories[category]}
                      </div>
                      <div className="text-xs font-medium">Subcategories</div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="flex w-full h-full text-[12px]">
                {categoryTransitions((style, item) =>
                  categories[item.category] !== "Categories" ? (
                    <animated.div
                      key={item.category}
                      className={`relative flex w-full h-full ${
                        selectedCategory === item.category
                          ? `border-hidden rounded-[0px] dark:text-inherit text-white ${
                              Object.keys(data[item.category].subcategories)
                                .length > 8
                                ? "w-[650px]"
                                : Object.keys(data[item.category].subcategories)
                                    .length > 5
                                ? "w-[500px]"
                                : "w-[400px]"
                            }`
                          : "h-full w-full min-w-[60px] hover:max-w-[180px]"
                      }



                      ${isCategoryHovered[item.category] ? "bg-white/5" : ""}
                      `}
                      onMouseEnter={() => {
                        setIsCategoryHovered((prev) => ({
                          ...prev,
                          [item.category]: true,
                        }));
                      }}
                      onMouseLeave={() => {
                        setIsCategoryHovered((prev) => ({
                          ...prev,
                          [item.category]: false,
                        }));
                      }}
                      style={{
                        borderLeft:
                          "0.5px dotted var(--dark-active-text, #CDD8D3)",
                        background:
                          selectedCategory === item.category
                            ? "#5A6462"
                            : theme === "light"
                            ? "#FFFFFF"
                            : `linear-gradient(
                                90deg,
                                rgba(16, 20, 19, ${
                                  0.3 -
                                  (item.i /
                                    (Object.keys(categories).length - 1)) *
                                    0.2
                                }) 0%,
                                #101413 15.10%,
                                rgba(16, 20, 19, ${
                                  0.06 +
                                  (item.i / Object.keys(categories).length) *
                                    0.94
                                }) 48.96%,
                                #101413 86.98%,
                                rgba(16, 20, 19, ${
                                  0.3 -
                                  (item.i /
                                    (Object.keys(categories).length - 1)) *
                                    0.2
                                }) 100%
                              )`,
                        ...style,
                      }}
                    >
                      <div
                        key={item.category}
                        className={`h-full flex flex-col first-letter justify-between  hover:cursor-pointer overflow-hidden ${
                          selectedCategory === item.category
                            ? `border-hidden rounded-[0px] ${
                                Object.keys(data[item.category].subcategories)
                                  .length > 8
                                  ? "w-[650px]"
                                  : Object.keys(
                                      data[item.category].subcategories,
                                    ).length > 4
                                  ? "w-[500px]"
                                  : "w-[400px]"
                              }`
                            : "hover:bg-white/5 w-full min-w-[60px] hover:max-w-[180px] "
                        }`}
                        onClick={() => {
                          if (selectedCategory === item.category) {
                            handleOpen(item.category);
                            return;
                          }

                          setSelectedCategory(item.category);
                        }}
                      >
                        <div
                          key={"label" + item.category}
                          className={`flex self-center justify-center mx-auto pb-8 pt-2 h-[30px]  ${
                            selectedCategory === item.category
                              ? "text-base font-bold "
                              : `text-base font-medium truncate hover:text-ellipsis ${
                                  isCategoryHovered[item.category]
                                    ? item.category === "native_transfers" ||
                                      item.category === "token_transfers"
                                      ? "pl-[0px] w-full"
                                      : "w-full pl-0"
                                    : item.category === "native_transfers" ||
                                      item.category === "token_transfers"
                                    ? "w-full "
                                    : "w-full pl-0"
                                }`
                          }`}
                          style={{
                            background:
                              selectedCategory === item.category
                                ? "#5A6462"
                                : "none",
                            backgroundClip:
                              selectedCategory === item.category
                                ? "initial"
                                : "text",
                            WebkitBackgroundClip:
                              selectedCategory === item.category
                                ? "initial"
                                : "text",
                            WebkitTextFillColor:
                              selectedCategory === item.category
                                ? "inherit"
                                : theme === "light"
                                ? "initial"
                                : "transparent",
                            backgroundImage:
                              selectedCategory === item.category
                                ? "none"
                                : theme === "light"
                                ? "none"
                                : `radial-gradient(ellipse at center, rgba(255, 255, 255, 1) 0%, rgba(0, 0, 0, 1) 100%), linear-gradient(90deg, rgba(16, 20, 19, ${
                                    0.4 +
                                    (item.i /
                                      (Object.keys(categories).length - 1)) *
                                      0.4
                                  }) 0%, #101413 15.10%, rgba(16, 20, 19, 0.00) 48.96%, #101413 86.98%, rgba(16, 20, 19, ${
                                    0.4 +
                                    (item.i /
                                      (Object.keys(categories).length - 1)) *
                                      0.4
                                  }) 100%)`,
                          }}
                        >
                          {categories[item.category]}
                        </div>

                        <div
                          className="flex flex-col gap-x-1 overflow-hidden h-full 
                                    mx-4 items-center"
                        >
                          {selectedCategory === item.category ? (
                            <div
                              className={`flex h-full ${
                                Object.keys(data[item.category].subcategories)
                                  .length > 8
                                  ? "w-[600px]"
                                  : Object.keys(
                                      data[item.category].subcategories,
                                    ).length > 4
                                  ? "w-[450px]"
                                  : "w-[350px]"
                              }`}
                            >
                              <div
                                key={data[item.category].subcategories}
                                className="flex flex-wrap w-full gap-x-2 gap-y-2 justify-center self-center items-center  "
                              >
                                {item.category !== "unlabeled" &&
                                item.category !== "native_transfers" ? (
                                  <div
                                    key={categories[item.category]}
                                    className={`flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-white/5 z-10    ${
                                      checkAllSelected(item.category)
                                        ? "opacity-100"
                                        : "opacity-30"
                                    }`}
                                    onClick={(e) => {
                                      handleSelectAllSubcategories(
                                        item.category,
                                      );
                                      e.stopPropagation();
                                    }}
                                  >
                                    <div className="mr-2">
                                      Select All Subcategories
                                    </div>
                                    <div className="rounded-full bg-forest-900 mr-[1px]">
                                      <Icon
                                        icon="feather:check-circle"
                                        className={`w-[14px] h-[14px] ${
                                          checkAllSelected(item.category)
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                    </div>
                                  </div>
                                ) : null}
                                {item.category !== "unlabeled" &&
                                item.category !== "native_transfers" ? (
                                  data[item.category].subcategories.list.map(
                                    (subcategory) => (
                                      <button
                                        key={subcategory}
                                        className={`flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-white/5 z-10 ${
                                          checkSubcategory(
                                            item.category,
                                            subcategory,
                                          )
                                            ? "opacity-100"
                                            : "opacity-30"
                                        }`}
                                        onClick={(e) => {
                                          handleToggleSubcategory(
                                            item.category,
                                            subcategory,
                                          );
                                          e.stopPropagation();
                                        }}
                                      >
                                        <div className="mr-2">
                                          {formatSubcategories(subcategory)}
                                        </div>
                                        <div className="rounded-full bg-forest-900">
                                          <Icon
                                            icon="feather:check-circle"
                                            className={`w-[14px] h-[14px]  ${
                                              checkSubcategory(
                                                item.category,
                                                subcategory,
                                              )
                                                ? "opacity-100"
                                                : "opacity-0"
                                            }  `}
                                          />
                                        </div>
                                      </button>
                                    ),
                                  )
                                ) : (
                                  <div className="flex items-center gap-x-1 ">
                                    <Icon
                                      icon="feather:info"
                                      className="w-6 h-6"
                                    />
                                    <h1>
                                      {" "}
                                      There are currently no subcategories for
                                      the given category.{" "}
                                    </h1>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <button
                          className="relative bottom-[4px] h-[24px] w-full"
                          onClick={() => {
                            handleOpen(item.category);
                          }}
                        >
                          <Icon
                            icon="icon-park-outline:up"
                            className="w-full h-full"
                          />
                        </button>
                      </div>
                    </animated.div>
                  ) : (
                    // Different response for "Chains" category
                    <div
                      key={item.category}
                      className={
                        "relative flex flex-col min-w-[140px] max-w-[140px] w-full h-full justify-start pl-[16px] pt-2"
                      }
                    >
                      <div className="text-sm font-bold pb-[10px]">
                        {categories[item.category]}
                      </div>
                      <div className="text-xs font-medium">Subcategories</div>
                    </div>
                  ),
                )}
              </div>
            )}
          </animated.div>
        </div>
      </Container>

      <Container>
        <div className="flex flex-col justify-between lg:flex-row w-[95%] mx-auto  mt-[20px] lg:mt-[30px]">
          <div className="w-full lg:w-[44%]  flex flex-col justify-between">
            <div className="flex flex-col mt-4 relative">
              {sortedChainValues &&
                transitions((style, item) => (
                  <animated.div
                    key={item.item}
                    style={{
                      ...style,
                    }}
                  >
                    <ChainAnimations
                      chain={item.item}
                      value={item.value}
                      index={item.index}
                      sortedValues={sortedChainValues}
                      selectedValue={selectedValue}
                      selectedMode={selectedMode}
                      selectedChains={selectedChains}
                      setSelectedChains={setSelectedChains}
                    />
                  </animated.div>
                ))}
            </div>
            <div className="flex flex-wrap items-center w-[87%] gap-y-2 invisible lg:visible">
              <div className="font-bold text-sm pr-2 pl-2">
                {formatSubcategories(selectedCategory)}:{" "}
              </div>

              {selectedSubcategories[selectedCategory] &&
                selectedSubcategories[selectedCategory].map((subcategory) => (
                  <div
                    key={subcategory}
                    className="  text-xs px-[4px] py-[5px] mx-[5px]"
                  >
                    {formatSubcategories(subcategory)}
                  </div>
                ))}
            </div>
          </div>
          <div className="w-full lg:w-[56%] relative bottom-2 mt-2 mb-[90px] h-[320px] lg:mt-0 lg:h-auto">
            {chartSeries && (
              <Chart
                chartType="line"
                types={
                  selectedCategory === null || selectedCategory === "Chains"
                    ? data.native_transfers[dailyKey].types
                    : data[selectedCategory][dailyKey].types
                }
                timespan={selectedTimespan}
                series={chartSeries}
                yScale={"linear"}
                // yScale="linear"
                chartHeight="400px"
                chartWidth="100%"
                decimals={selectedMode === "txcount_" ? 0 : 2}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center w-[100%] gap-y-2 lg:hidden">
            <div className="font-bold text-sm pr-2 pl-2">
              {formatSubcategories(selectedCategory)}:{" "}
            </div>

            {selectedSubcategories[selectedCategory] &&
              selectedSubcategories[selectedCategory].map((subcategory) => (
                <div
                  key={subcategory}
                  className="  text-xs px-[2px] py-[5px] mx-[5px]"
                >
                  {formatSubcategories(subcategory)}
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-col md:flex-row w-[98%] mx-auto items-end md:justify-end rounded-full  text-sm md:text-base  md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}

          <Tooltip placement="left" allowInteract>
            <TooltipTrigger>
              <div className="p-1 z-10">
                <Icon icon="feather:info" className="w-6 h-6" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="z-50 flex items-center justify-center pr-[3px]">
              <div className="px-3 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-[420px] h-[80px] flex items-center">
                <div className="flex flex-col space-y-1">
                  <div className="font-bold text-sm leading-snug">
                    Data Sources:
                  </div>
                  <div className="flex space-x-1 flex-wrap font-medium text-xs leading-snug"></div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </Container>
      <Container>
        <div className="w-[96%] mx-auto mt-[30px] flex flex-col">
          <h1 className="text-lg font-bold">Most Active Contracts</h1>
          <p className="text-sm mt-[15px]">
            See the most active contracts within the selected timeframe (
            {timespans[selectedTimespan].label}) and for your selected
            category/subcategories.{" "}
          </p>
        </div>
      </Container>
      <Container className="xl:overflow-hidden overflow-x-scroll scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller pb-4">
        <div className="flex flex-col mt-[30px] w-[98%] mx-auto min-w-[980px] ">
          <div className="flex text-[14px] font-bold mb-[10px] ">
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
            <div className="flex w-[30%]  ">
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
                {selectedMode === "gas_fees_"
                  ? "Gas Fees "
                  : "Transaction Count "}
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
          {!sortOrder
            ? Object.keys(sortedContracts).map((key, i) => {
                if (!showMore && i >= maxDisplayedContracts) {
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
                                icon={`gtp:${sortedContracts[key].chain.replace(
                                  "_",
                                  "-",
                                )}-logo-monochrome`}
                                className="min-w-5 min-h-5 w-5 h-5"
                                style={{
                                  color:
                                    AllChainsByKeys[sortedContracts[key].chain]
                                      .colors[theme][1],
                                }}
                              />
                            </div>
                          </div>

                          <div
                            key={sortedContracts[key].address}
                            className={` w-[200px] h-full flex items-center ${
                              contractHover[key] && !sortedContracts[key].name
                                ? "relative right-[10px] text-[14px]"
                                : ""
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
                            }}
                          >
                            {sortedContracts[key].name
                              ? sortedContracts[key].name
                              : contractHover[key]
                              ? sortedContracts[key].address
                              : sortedContracts[key].address.substring(0, 20) +
                                "..."}
                            {sortedContracts[key].name ? (
                              <span className="hover:visible invisible bg-black rounded-xl text-[12px] relative bottom-4">
                                {sortedContracts[key].address}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center text-[14px] w-[43%]  justify-start  h-full  ">
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
                                {selectedMode === "gas_fees_"
                                  ? showUsd
                                    ? `$`
                                    : `Ξ`
                                  : ""}
                              </div>
                              {selectedMode === "gas_fees_"
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
                  if (!showMore && i >= maxDisplayedContracts) {
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
                              className={` w-[200px] h-full flex items-center ${
                                contractHover[key] && !sortedContracts[key].name
                                  ? "relative right-[10px] text-[14px]"
                                  : ""
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
                              }}
                            >
                              {sortedContracts[key].name
                                ? sortedContracts[key].name
                                : contractHover[key]
                                ? sortedContracts[key].address
                                : sortedContracts[key].address.substring(
                                    0,
                                    20,
                                  ) + "..."}
                              {sortedContracts[key].name ? (
                                <span className="hover:visible invisible bg-black rounded-xl text-[12px] relative bottom-4">
                                  {sortedContracts[key].address}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center text-[14px] w-[43%]  justify-start  h-full ">
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
                                  {selectedMode === "gas_fees_"
                                    ? showUsd
                                      ? `$`
                                      : `Ξ`
                                    : ""}
                                </div>
                                {selectedMode === "gas_fees_"
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
          <button
            className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full bg-forest-700 p-[6px 16px] ${
              Object.keys(sortedContracts).length <= 10 ? "hidden" : "visible"
            }`}
            onClick={() => {
              setShowMore(!showMore);
              if (Object.keys(sortedContracts).length > maxDisplayedContracts) {
                setMaxDisplayedContracts(maxDisplayedContracts + 10);
              } else {
                setMaxDisplayedContracts(10);
              }
            }}
          >
            {Object.keys(sortedContracts).length}
            {Object.keys(sortedContracts).length < maxDisplayedContracts
              ? "Show Less"
              : "Show More"}
          </button>
        </div>
      </Container>
    </div>
  );
}
