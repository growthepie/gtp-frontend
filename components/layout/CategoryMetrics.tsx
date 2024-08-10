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
import { useLocalStorage, useSessionStorage, useMediaQuery } from "usehooks-ts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Switch } from "../Switch";
import { Sources } from "@/lib/datasources";
import Container from "./Container";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { Chart } from "../charts/chart";
import { AllChainsByKeys, Get_SupportedChainKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainAnimations from "./ChainAnimations";
import { useUIContext } from "@/contexts/UIContext";
import ContractLabelModal from "./ContractLabelModal";
import CategoryBar from "@/components/layout/CategoryBar";

import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import HorizontalScrollContainer from "../HorizontalScrollContainer";

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

  const searchParams = useSearchParams();

  // get the category from the url
  const queryCategory = searchParams?.get("category");
  // subcategories is an array of strings
  const querySubcategories = searchParams?.get("subcategories")?.split(",");

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

  type ChainData = {
    id: string;
    name: string;
    unixKey: string;
    dataKey: string;
    data: any[];
  };

  const { isSidebarOpen } = useUIContext();
  const [selectedMode, setSelectedMode] = useState("gas_fees_");
  const [selectedCategory, setSelectedCategory] = useState(
    queryCategory ?? "nft",
  );
  const [contractHover, setContractHover] = useState({});

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [openSub, setOpenSub] = useState(querySubcategories ? true : false);
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedChartType, setSelectedChartType] = useState("absolute");

  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);

  const [contractCategory, setContractCategory] = useState("value");
  const [sortOrder, setSortOrder] = useState(true);
  const [chainValues, setChainValues] = useState<any[][] | null>(null);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);
  const [copyContract, setCopyContract] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(
    null,
  );
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("nft");

  const stackIndex = {
    op_stack: ["base", "optimism"],
    op_super: ["base", "optimism"],
  };

  const { theme } = useTheme();

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
      return acc;
    }, {}),
  );

  const [contracts, setContracts] = useState<{ [key: string]: ContractInfo }>(
    {},
  );
  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});

  const dailyKey = useMemo(() => {
    if (["180d", "max"].includes(selectedTimespan)) {
      return "daily_7d_rolling";
    } else {
      return "daily";
    }
  }, [selectedTimespan]);

  const selectedType = useMemo(() => {
    let retVal;

    if (selectedValue === "share" || selectedMode === "txcount_") {
      retVal = selectedMode + selectedValue;
    } else if (showUsd) {
      if (selectedValue === "absolute_log") {
        retVal = selectedMode + "absolute" + "_usd";
      } else {
        retVal = selectedMode + selectedValue + "_usd";
      }
    } else {
      if (selectedValue === "absolute_log") {
        retVal = selectedMode + "absolute" + "_eth";
      } else {
        retVal = selectedMode + selectedValue + "_eth";
      }
    }

    return retVal;
  }, [selectedMode, selectedValue, showUsd]);

  //Calculate type to hand off to chart and find index selectedValue for data

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
    setContracts(result);
  }, [data, selectedTimespan]);

  const sortedChainValues = useMemo(() => {
    if (!chainValues || !selectedChains) return null;

    return chainValues
      .filter(([item]) => {
        const supportedChainKeys = Get_SupportedChainKeys(master);
        const isSupported =
          item === "all_l2s" ? true : supportedChainKeys.includes(item);
        const isMaster = master?.chains[item] ? true : false;
        const passEcosystem =
          item === "all_l2s"
            ? true
            : isMaster
            ? chainEcosystemFilter === "all-chains"
              ? true
              : master?.chains[item].bucket.includes(chainEcosystemFilter)
            : false;

        return item !== "types" && isSupported && passEcosystem;
      })
      .sort((a, b) => b[1] - a[1])
      .sort(([itemA], [itemB]) =>
        selectedChains[itemA] === selectedChains[itemB]
          ? 0
          : selectedChains[itemA]
          ? -1
          : 1,
      );
  }, [chainValues, selectedChains, chainEcosystemFilter]);

  const timespans = useMemo(() => {
    return {
      "7d": {
        label: "7 days",
        shortLabel: "7d",
        value: 7,
        xMin: Date.now() - 7 * 24 * 60 * 60 * 1000,
        xMax: Date.now(),
      },
      "30d": {
        label: "30 days",
        shortLabel: "30d",
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
        shortLabel: "180d",
        value: 180,
      },
      // "365d": {
      //   label: "1 year",
      //   value: 365,
      // },
      max: {
        label: "All Time",
        shortLabel: "Max",
        value: 0,
      },
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
      if (
        queryCategory === category &&
        querySubcategories &&
        querySubcategories.length > 0
      ) {
        const intersection = data[category].subcategories.list.filter(
          (subcategory) => {
            return querySubcategories.includes(subcategory);
          },
        );

        if (intersection.length > 0) {
          initialSelectedSubcategories[category] = intersection;
          return;
        }
      }

      // else use the default subcategories
      if (data[category]?.subcategories?.list) {
        initialSelectedSubcategories[category] = [
          ...data[category].subcategories.list,
        ];
      } else {
        initialSelectedSubcategories[category] = [];
      }
    });
    return initialSelectedSubcategories;
  }, [categories, queryCategory, data, querySubcategories]);

  const [selectedSubcategories, setSelectedSubcategories] =
    useState(updatedSubcategories);

  // const chartData = useMemo(() => {
  //   if (!selectedSubcategories) return [];

  //   let chartData = [];

  //   return chartData;
  // }, [selectedSubcategories]);

  const chartReturn = useMemo(() => {
    const chainArray: ChainData[] = [];

    if (!selectedSubcategories) return [];

    // get list of selectedSubcategories for the selected category
    const selectedSubcategoriesList = selectedSubcategories[selectedCategory];

    for (const currChain in selectedChains) {
      const supportedChainKeys = Get_SupportedChainKeys(master);
      const isSupported =
        currChain === "all_l2s" ? true : supportedChainKeys.includes(currChain);
      const isMaster = master?.chains[currChain] ? true : false;
      const passEcosystem =
        currChain === "all_l2s"
          ? true
          : isMaster
          ? chainEcosystemFilter === "all-chains"
            ? true
            : master?.chains[currChain].bucket.includes(chainEcosystemFilter)
          : false;
      if (
        isSupported &&
        passEcosystem &&
        selectedChains[currChain] === true &&
        data[selectedCategory][dailyKey][String(currChain)]
      ) {
        if (selectedMode.includes("gas_fees") && String(currChain) === "imx") {
          // Skip this iteration
          continue;
        }

        let selectedFilter =
          selectedMode +
          selectedValue +
          (selectedMode.includes("gas_fees")
            ? showUsd
              ? "_usd"
              : "_eth"
            : "");

        let chartData = data[selectedCategory][dailyKey][String(currChain)];

        const dataCategorySubcategoriesList =
          data[selectedCategory].subcategories.list;

        // if we have the number of selectedSubcategories don't match the number of subcategories in the data
        // we need to merge the data for the dailyKey data for the selected subcategories
        if (
          selectedSubcategoriesList.length !==
          dataCategorySubcategoriesList.length
        ) {
          // get the data for the selected subcategories and filter out the undefined values
          const selectedSubcategoriesData: any[][] = selectedSubcategoriesList
            .map((subcategory) => {
              return data[selectedCategory].subcategories[subcategory][
                dailyKey
              ][currChain];
            })
            .filter((item) => item);

          // get a sorted list of all the unix timestamps with duplicates removed
          const unixList = selectedSubcategoriesData
            .reduce((acc, curr) => {
              return [...acc, ...curr.map((item) => item[0])];
            }, [])
            .sort((a, b) => a - b)
            .filter((item, i, arr) => {
              return i === 0 || item !== arr[i - 1];
            });

          // create a new array of arrays with the unix timestamp as the key and the values for each subcategory as the value
          const unixData = unixList
            .map((unix) => {
              const unixValues = selectedSubcategoriesData.map((data) => {
                const index = data.findIndex((item) => item[0] === unix);
                return index !== -1 ? data[index] : null;
              });

              return unixValues;
            })
            .map((unixValues) => unixValues.filter((item) => item));

          chartData = unixData.map((unixDataList, unixIndex) => {
            const unix = unixList[unixIndex];
            const unixDataListFiltered = unixDataList.filter((item) => item);

            // add up the values for each subcategory (ignore first item which is the unix timestamp)
            return unixDataListFiltered.reduce((acc, curr) => {
              if (acc.length === 0) return curr;

              return acc.map((col, i) => {
                return i === 0 ? col : col + curr[i];
              });
            }, []);
          });
        }

        if (chartData.length > 0) {
          const obj = {
            id: [String(currChain), selectedType].join("_"),
            name: String(currChain),
            unixKey: "unix",
            dataKey: selectedType,
            data: chartData,
          };

          chainArray.push(obj);
        }
      }
    }
    return chainArray;
  }, [
    selectedSubcategories,
    selectedChains,
    data,
    selectedCategory,
    dailyKey,
    selectedMode,
    selectedValue,
    showUsd,
    selectedType,
    chainEcosystemFilter,
  ]);

  const chartSeries = useMemo(() => {
    const today = new Date().getTime();

    if (selectedCategory && data) return chartReturn;
    return Object.keys(data["native_transfers"][dailyKey]).map((chain) => ({
      id: [chain, "native_transfers", selectedType].join("||"),
      name: chain,
      unixKey: "unix",
      dataKey: selectedType,
      data: data["native_transfers"][dailyKey][chain],
      type: selectedChartType,
    }));
  }, [
    selectedCategory,
    data,
    chartReturn,
    dailyKey,
    selectedType,
    selectedChartType,
  ]);

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
            width = "550px";
          } else {
            width = "650px";
          }

          retSize[category] = { width, height };
        }
      }
      return retSize;
    }, [data, categories]);

  const result = useMemo(() => {
    let updatedChainValues: [string, number][] | null = null;
    setChainValues(null);

    if (selectedSubcategories[selectedCategory]) {
      Object.keys(selectedSubcategories[selectedCategory])?.forEach(
        (subcategory) => {
          const subcategoryData =
            data[selectedCategory].subcategories[
              selectedSubcategories[selectedCategory][subcategory]
            ];
          const subcategoryChains =
            subcategoryData.aggregated[selectedTimespan].data;
          const index = subcategoryChains["types"].indexOf(selectedType);

          Object.keys(subcategoryChains).forEach((chain) => {
            if (chain !== "types" && AllChainsByKeys.hasOwnProperty(chain)) {
              const chainValue = subcategoryChains[chain][index];

              if (updatedChainValues === null) {
                updatedChainValues = [[chain, chainValue]];
              } else {
                const existingIndex = updatedChainValues.findIndex(
                  ([prevChain]) => prevChain === chain,
                );
                if (existingIndex !== -1) {
                  updatedChainValues[existingIndex][1] += chainValue;
                } else {
                  updatedChainValues.push([chain, chainValue]);
                }
              }
            }
          });
        },
      );
    }

    if (updatedChainValues !== null) {
      setChainValues(updatedChainValues);
    }
  }, [
    selectedSubcategories,
    data,
    setChainValues,
    selectedCategory,
    selectedTimespan,
    selectedType,
  ]);

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
        if (!AllChainsByKeys.hasOwnProperty(contract.chain)) return false;

        const isChainSelected = selectedChains[contract.chain];
        const isSubcategorySelected =
          selectedCategory === "unlabeled" && contract.sub_category_key === null
            ? true
            : selectedSubcategories[contract.main_category_key]?.includes(
                contract.sub_category_key,
              );
        const isCategoryMatched =
          contract.main_category_key === selectedCategory;
        const filterChains =
          AllChainsByKeys[contract.chain].ecosystem.includes(
            chainEcosystemFilter,
          );

        return (
          isChainSelected &&
          isSubcategorySelected &&
          isCategoryMatched &&
          filterChains
        );
      })
      .reduce((filtered, [key, contract]) => {
        filtered[key] = contract;
        return filtered;
      }, {});
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

    const sortedContractKeys = Object.keys(filteredContracts).sort((a, b) => {
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
        return sortFunction(a, b); // Using the previously defined sortFunction
      }
    });

    const sortedResult = sortedContractKeys.reduce((acc, key) => {
      acc[key] = filteredContracts[key];
      return acc;
    }, {});

    if (
      selectedCategory === "unlabeled" &&
      (contractCategory === "category" || contractCategory === "subcategory")
    ) {
      setSortedContracts(sortedResult);
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
    chainEcosystemFilter,
  ]);

  const largestContractValue = useMemo(() => {
    let retValue = 0;
    for (const contract of Object.values(sortedContracts)) {
      const value =
        selectedMode === "gas_fees_"
          ? showUsd
            ? contract.gas_fees_absolute_usd
            : contract.gas_fees_absolute_eth
          : contract.txcount_absolute;

      retValue = Math.max(retValue, value);
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

  let height = 0;
  const rowHeight = 52;
  const transitions = useTransition(
    sortedChainValues
      ?.filter(([item]) => !(item === "imx" && selectedMode === "gas_fees_"))
      .map(([item, value], index) => ({
        item,
        value,
        index,
        y: (height += rowHeight) - rowHeight,
        height: rowHeight,
      })) || [],
    {
      key: (item: any) => item.item, // Use item as the key
      from: { opacity: 0, height: 0 },
      leave: null,
      enter: ({ y, height, item }) => ({
        y: y,
        height: height,
        opacity: selectedChains[item] ? 1.0 : 0.3,
      }),
      update: ({ y, height, item }) => ({
        y: y,
        height: height,
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
              ? "700px"
              : Object.keys(data[category].subcategories).length > 5
              ? "550px"
              : "550px"
            : "190px",
      }),
      update: ({ category }) => ({
        width: !exitAnimation
          ? openSub && selectedCategory === category
            ? Object.keys(data[category].subcategories).length > 8
              ? "700px"
              : Object.keys(data[category].subcategories).length > 5
              ? "550px"
              : "550px"
            : "190px"
          : "190px",
      }),
      leave: { width: "190px" },

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
    <>
      {selectedSubcategories && (
        <div className="w-full flex-col relative">
          <Container>
            <TopRowContainer>
              <TopRowParent>
                <TopRowChild
                  isSelected={"gas_fees_" === selectedMode}
                  onClick={() => {
                    setSelectedMode("gas_fees_");
                  }}
                >
                  Gas Fees
                </TopRowChild>
                <TopRowChild
                  isSelected={"txcount_" === selectedMode}
                  onClick={() => {
                    setSelectedMode("txcount_");
                  }}
                >
                  Transaction Count
                </TopRowChild>
              </TopRowParent>
              <div className="block lg:hidden w-[70%] mx-auto my-[10px]">
                <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
              </div>
              <TopRowParent>
                {Object.keys(timespans).map((timespan) => (
                  <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespan === timespan}
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
                    <span className="hidden md:block">
                      {timespans[timespan].label}
                    </span>
                    <span className="block md:hidden">
                      {timespans[timespan].shortLabel}
                    </span>
                  </TopRowChild>
                ))}
                <div
                  className={`absolute transition-[transform] text-xs  duration-300 ease-in-out -z-10 top-[63px] right-[22px] md:right-[65px] md:top-[68px] lg:top-0 lg:right-[65px] pr-[15px] w-[calc(50%-34px)] md:w-[calc(50%-56px)] lg:pr-[23px] lg:w-[168px] xl:w-[158px] xl:pr-[23px] ${
                    !isMobile
                      ? ["max", "180d"].includes(selectedTimespan)
                        ? "translate-y-[calc(-100%+3px)]"
                        : "translate-y-0 "
                      : ["max", "180d"].includes(selectedTimespan)
                      ? "translate-y-[calc(40%+3px)]"
                      : "-translate-y-[calc(40%+3px)]"
                  }`}
                >
                  <div className="font-medium bg-forest-100 dark:bg-forest-1000 rounded-b-2xl rounded-t-none lg:rounded-b-none lg:rounded-t-2xl border border-forest-700 dark:border-forest-400 text-center w-full py-1 z-0 ">
                    7-day rolling average
                  </div>
                </div>
              </TopRowParent>
            </TopRowContainer>
          </Container>

          <div id="content-container" className="w-full">
            <HorizontalScrollContainer
              forcedMinWidth={isMobile ? 990 : 1050}
              paddingBottom={8}
            >
              <CategoryBar
                data={data}
                master={master}
                categories={categories}
                querySubcategories={querySubcategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                checkSubcategory={checkSubcategory}
                formatSubcategories={formatSubcategories}
                checkAllSelected={checkAllSelected}
                handleSelectAllSubcategories={handleSelectAllSubcategories}
                handleToggleSubcategory={handleToggleSubcategory}
              />
            </HorizontalScrollContainer>

            <Container>
              <div className="flex flex-col justify-between lg:flex-row w-[98.5%] gap-y-8 mx-auto mt-[20px] lg:mt-[30px] mb-[20px] lg:mb-0">
                <div className="w-full lg:w-[44%] flex flex-col justify-between ">
                  <div
                    className="mt-4 relative"
                    style={{
                      height: height,
                      minHeight: isMobile ? undefined : "500px",
                    }}
                  >
                    {sortedChainValues &&
                      master &&
                      transitions((style, item) => (
                        <animated.div
                          className="absolute w-full"
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
                            selectedCategory={selectedCategory}
                            master={master}
                          />
                        </animated.div>
                      ))}
                  </div>
                </div>
                <div className="w-full lg:w-[56%] relative bottom-2 mt-6 mb-[30px] h-[320px] lg:mt-0 lg:h-auto">
                  {chartSeries && (
                    <Chart
                      chartType={
                        selectedChartType === "absolute" ? "line" : "area"
                      }
                      stack={selectedChartType !== "absolute"}
                      types={
                        selectedCategory === null ||
                        selectedCategory === "Chains"
                          ? data.native_transfers[dailyKey].types
                          : data[selectedCategory][dailyKey].types
                      }
                      timespan={selectedTimespan}
                      series={chartSeries}
                      yScale={
                        selectedChartType === "percentage"
                          ? "percentage"
                          : "linear"
                      }
                      // yScale="linear"
                      chartHeight={isMobile ? "400" : "560"}
                      chartWidth="100%"
                      decimals={selectedMode === "txcount_" ? 0 : 2}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center w-[100%] gap-y-2 lg:hidden mt-8 ">
                  <div className="font-bold text-sm pr-2 pl-2">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="  text-xs px-[2px] py-[5px] mx-[5px]"
                        >
                          {formatSubcategories(subcategory)}
                        </div>
                      ),
                    )}
                </div>
              </div>
              <div>
                {" "}
                <div className="flex flex-wrap items-center w-[98%] mx-auto gap-y-2 invisible lg:visible ">
                  <div className="font-bold text-sm pr-2 pl-2">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="  text-xs px-[4px] py-[5px] mx-[5px]"
                        >
                          {formatSubcategories(subcategory)}
                        </div>
                      ),
                    )}
                </div>{" "}
              </div>
            </Container>
          </div>
          <Container>
            {" "}
            <div className="flex flex-row w-[100%] mx-auto justify-center md:items-center items-end md:justify-end rounded-full  text-sm md:text-base  md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}
              <button
                className={`px-[16px] py-[4px]  rounded-full ${
                  selectedChartType === "absolute"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("absolute");
                }}
              >
                Absolute
              </button>
              <button
                className={`px-[16px] py-[4px]  rounded-full ${
                  selectedChartType === "stacked"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("stacked");
                }}
              >
                Stacked
              </button>
              <button
                className={`px-[16px] py-[4px]  rounded-full ${
                  selectedChartType === "percentage"
                    ? "bg-forest-500 dark:bg-forest-1000"
                    : "hover:bg-forest-500/10"
                }`}
                onClick={() => {
                  setSelectedChartType("percentage");
                }}
              >
                Percentage
              </button>
            </div>
          </Container>
          <Container>
            <div className="w-[97%] mx-auto mt-[5px] lg:mt-[30px] flex flex-col">
              <h1 className="text-lg font-bold">Most Active Contracts</h1>
              <p className="text-sm mt-[15px]">
                See the most active contracts within the selected timeframe (
                {timespans[selectedTimespan].label}) and for your selected
                category/subcategories.{" "}
              </p>
            </div>
          </Container>
          <HorizontalScrollContainer paddingBottom={16}>
            <div
              className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200  ${
                selectedContract
                  ? "opacity-80"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <div
                className={`absolute inset-0 bg-white dark:bg-black`}
                onClick={() => setSelectedContract(null)}
              ></div>
            </div>
            <div className="flex flex-col mt-[30px] w-[99%] mx-auto min-w-[880px] ">
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
                      className={` dark:text-white text-black ${
                        contractCategory === "chain"
                          ? "opacity-100"
                          : "opacity-20"
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
                      className={` dark:text-white text-black ${
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
                      className={` dark:text-white text-black ${
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
                      className={` dark:text-white text-black ${
                        contractCategory === "value"
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    />
                  </button>

                  <div className="flex gap-x-1 w-[48.5%] justify-center">
                    <div>Block Explorer </div>
                  </div>
                </div>
              </div>
              <div>
                {(!sortOrder
                  ? Object.keys(sortedContracts)
                  : Object.keys(sortedContracts).reverse()
                )
                  .slice(0, maxDisplayedContracts)
                  .map((key, i) => {
                    // if (i >= maxDisplayedContracts) {
                    //   return null;
                    // }

                    if (
                      selectedContract &&
                      selectedContract.address === sortedContracts[key].address
                    ) {
                      return (
                        <div key={key + "" + sortOrder}>
                          <div className="flex rounded-[27px] bg-forest-50 dark:bg-forest-1000 border-forest-200 dark:border-forest-500 border mt-[7.5px] group relative z-[100]">
                            <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
                              <div className="w-full h-full rounded-[27px] overflow-clip">
                                <div className="relative w-full h-full">
                                  <div
                                    className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                                    style={{
                                      background:
                                        AllChainsByKeys[
                                          sortedContracts[key].chain
                                        ].colors[theme ?? "dark"][1],
                                      width: getWidth(sortedContracts[key]),
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center justify-center w-full h-full pl-[15px] pr-[30px] py-[10px] space-y-[15px]">
                              <div className="flex space-x-[26px] items-center w-full">
                                <div>
                                  <Icon
                                    icon="gtp:add-tag"
                                    className="w-[34px] h-[34px]"
                                  />
                                </div>
                                <div className="text-[16px]">
                                  Suggested label for contract{" "}
                                  <i>{selectedContract.address}</i>
                                </div>
                              </div>
                              <form
                                className="flex flex-col space-y-[5px] items-start justify-center w-full"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.target as any,
                                  );

                                  // const data = Object.fromEntries(
                                  //   formData.entries(),
                                  // );

                                  setIsFormSubmitting(true);

                                  // send POST to /api/contracts
                                  const res = fetch("/api/contracts", {
                                    method: "POST",
                                    body: formData,
                                  })
                                    .then((res) => res.json())
                                    .finally(() => {
                                      setIsFormSubmitting(false);
                                      setSelectedContract(null);
                                    });
                                }}
                              >
                                <input
                                  type="hidden"
                                  name="address"
                                  value={selectedContract.address}
                                />
                                <input
                                  type="hidden"
                                  name="chain"
                                  value={selectedContract.chain}
                                />
                                <div className="flex space-x-[26px] items-center w-full">
                                  <Icon
                                    icon={`gtp:${selectedContract.chain.replace(
                                      "_",
                                      "-",
                                    )}-logo-monochrome`}
                                    className="w-[34px] h-[34px]"
                                    style={{
                                      color:
                                        AllChainsByKeys[selectedContract.chain]
                                          .colors[theme ?? "dark"][1],
                                    }}
                                  />
                                  <div className="flex space-x-[15px] items-center w-full">
                                    <div className="relative w-[33%]">
                                      <input
                                        type="text"
                                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                        placeholder="Contract Name"
                                        name="name"
                                      />
                                      <div className="absolute right-0.5 top-0.5">
                                        <Tooltip placement="top">
                                          <TooltipTrigger>
                                            <Icon
                                              icon="feather:info"
                                              className="w-6 h-6 text-forest-900 dark:text-forest-500"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent className="z-[110]">
                                            <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                              <div className="font-medium">
                                                This is the Contract name.
                                              </div>
                                              <div>
                                                It should be the name of the
                                                contract, not the name of the
                                                project.
                                              </div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                    <div className="relative w-[33%]">
                                      <input
                                        type="text"
                                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                        placeholder="Project Name"
                                        name="project_name"
                                      />
                                      <div className="absolute right-0.5 top-0.5">
                                        <Tooltip placement="top">
                                          <TooltipTrigger>
                                            <Icon
                                              icon="feather:info"
                                              className="w-6 h-6 text-forest-900 dark:text-forest-500"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent className="z-[110]">
                                            <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg w-[420px] flex flex-col">
                                              <div className="font-medium">
                                                This is the Project name.
                                              </div>
                                              <div>
                                                It should be the name of the
                                                project, not the name of the
                                                contract.
                                              </div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                    <div className="relative w-[16%]">
                                      <select
                                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                                        name="main_category_key"
                                        onChange={(e) => {
                                          setLabelFormMainCategoryKey(
                                            e.target.value,
                                          );
                                        }}
                                      >
                                        <option value="" disabled selected>
                                          Category
                                        </option>
                                        {master &&
                                          Object.keys(
                                            master.blockspace_categories
                                              .main_categories,
                                          ).map((key) => (
                                            <option
                                              key={key}
                                              value={key}
                                              className="bg-forest-50 dark:bg-[#1F2726]"
                                            >
                                              {
                                                master.blockspace_categories
                                                  .main_categories[key]
                                              }
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                    <div className="relative w-[16%]">
                                      <select
                                        className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[4px]"
                                        name="sub_category_key"
                                      >
                                        <option value="" disabled selected>
                                          Subcategory
                                        </option>
                                        {labelFormMainCategoryKey &&
                                          master &&
                                          master.blockspace_categories[
                                            "mapping"
                                          ][labelFormMainCategoryKey].map(
                                            (key) => (
                                              <option
                                                key={key}
                                                value={key}
                                                className="bg-forest-50 dark:bg-[#1F2726]"
                                              >
                                                {formatSubcategories(key)}
                                              </option>
                                            ),
                                          )}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="pl-[50px] flex flex-col space-y-[5px] text-[14px] items-start justify-center w-full ml-2 pt-[15px]">
                                  <div>
                                    Please add your details to participate in
                                    ...
                                  </div>
                                  <div className="flex space-x-[15px] items-center w-full">
                                    <input
                                      type="text"
                                      className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                      placeholder="X Handle (formerly Twitter)"
                                      name="twitter_handle"
                                    />
                                    <input
                                      type="text"
                                      className="bg-transparent border border-forest-200 dark:border-forest-500 rounded-full w-full px-[15px] py-[2px]"
                                      placeholder="Source (optional)"
                                      name="source"
                                    />
                                  </div>
                                </div>
                                <div className="flex space-x-[15px] items-start justify-center w-full font-medium pt-[15px]">
                                  <button
                                    className="px-[16px] py-[6px] rounded-full border border-forest-900 dark:border-forest-500 text-forest-900 dark:text-forest-500"
                                    onClick={() => setSelectedContract(null)}
                                    disabled={isFormSubmitting}
                                  >
                                    Cancel
                                  </button>
                                  <button className="px-[16px] py-[6px] rounded-full bg-[#F0995A] text-forest-900">
                                    {isFormSubmitting ? (
                                      <Icon
                                        icon="feather:loader"
                                        className="w-4 h-4 animate-spin"
                                      />
                                    ) : (
                                      "Submit"
                                    )}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key + "" + sortOrder}>
                        <div className="flex rounded-full border-forest-200 dark:border-forest-500 border h-[60px] mt-[7.5px] group hover:bg-forest-300 hover:dark:bg-forest-800 relative">
                          <div className="absolute top-0 left-0 right-0 bottom-[-1px] pointer-events-none">
                            <div className="w-full h-full rounded-full overflow-clip">
                              <div className="relative w-full h-full">
                                <div
                                  className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
                                  style={{
                                    background:
                                      AllChainsByKeys[
                                        sortedContracts[key].chain
                                      ].colors[theme ?? "dark"][1],
                                    width: getWidth(sortedContracts[key]),
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex w-[100%] items-center ml-4 mr-8">
                            <div className="flex items-center h-10 !w-[34%] relative">
                              <div className="absolute right-0 top-0 bottom-0 w-0 group-hover:w-4 bg-gradient-to-r from-transparent to-forest-300 dark:to-forest-800 z-10"></div>
                              <div className="flex-none mr-[36px]">
                                <Icon
                                  icon={`gtp:${sortedContracts[
                                    key
                                  ].chain.replace("_", "-")}-logo-monochrome`}
                                  className="w-[29px] h-[29px]"
                                  style={{
                                    color:
                                      AllChainsByKeys[
                                        sortedContracts[key].chain
                                      ].colors[theme ?? "dark"][1],
                                  }}
                                />
                                {/* </div> */}
                              </div>
                              <div className="flex flex-grow">
                                <div
                                  className={`flex flex-none items-center space-x-2 w-0 ${
                                    copyContract ? " delay-1000" : ""
                                  } overflow-clip transition-all duration-200 ease-in-out ${
                                    sortedContracts[key].name &&
                                    sortedContracts[key].project_name
                                      ? "group-hover:w-[48px]"
                                      : "group-hover:w-[96px]"
                                  }`}
                                >
                                  {!(
                                    sortedContracts[key].name &&
                                    sortedContracts[key].project_name
                                  ) && (
                                    <div
                                      className="rounded-full p-2 bg-forest-50 dark:bg-forest-1000 text-black dark:text-white cursor-pointer"
                                      onClick={() => {
                                        setSelectedContract(
                                          sortedContracts[key],
                                        );
                                        setIsContractLabelModalOpen(true);
                                      }}
                                    >
                                      <Icon
                                        icon="gtp:add-tag"
                                        className="w-6 h-6"
                                      />
                                      {/* <Icon
                                      icon="feather:plus"
                                      className="absolute right-0 top-2 stroke-2 stroke-forest-900"
                                    /> */}
                                    </div>
                                  )}
                                  <div
                                    className={`rounded-full p-2 ${
                                      copyContract
                                        ? "bg-forest-50/60 dark:bg-forest-1000/60"
                                        : "bg-forest-50 dark:bg-forest-1000"
                                    } text-white cursor-pointer`}
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        sortedContracts[key].address,
                                      );
                                      setCopyContract(true);
                                      setTimeout(() => {
                                        setCopyContract(false);
                                      }, 1000);
                                    }}
                                  >
                                    {!copyContract && (
                                      <Icon
                                        icon="feather:copy"
                                        className="w-5 h-5"
                                      />
                                    )}
                                    {copyContract && (
                                      <Icon
                                        icon="feather:check"
                                        className="w-5 h-5"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={`flex flex-col flex-grow h-full justify-start text-ellipsis overflow-hidden whitespace-nowrap `}
                                >
                                  {sortedContracts[key].name ||
                                  sortedContracts[key].project_name ? (
                                    <>
                                      <div
                                        className={`min-w-full max-w-full text-base ${
                                          sortedContracts[key].project_name
                                            ? "font-bold"
                                            : "opacity-30 italic"
                                        }`}
                                      >
                                        {sortedContracts[key].project_name
                                          ? sortedContracts[key].project_name
                                          : "Project Label Missing"}
                                      </div>

                                      <div
                                        className={`min-w-full max-w-full text-sm ${
                                          sortedContracts[key].name
                                            ? ""
                                            : "opacity-30 italic"
                                        }`}
                                      >
                                        {sortedContracts[key].name
                                          ? sortedContracts[key].name
                                          : "Contract Label Missing"}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="min-w-full max-w-full text-base opacity-30 italic">
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
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center text-[14px] !w-[43%] justify-start h-full z-10">
                              <div className="flex w-[40%]">
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
                            <div className="flex items-center !w-[23%]  mr-4">
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
                                        ).toLocaleString("en-GB")
                                      : Number(
                                          sortedContracts[
                                            key
                                          ].gas_fees_absolute_eth.toFixed(2),
                                        ).toLocaleString("en-GB")
                                    : Number(
                                        sortedContracts[
                                          key
                                        ].txcount_absolute.toFixed(0),
                                      ).toLocaleString("en-GB")}
                                </div>

                                {/* <div className="h-[3px] w-[110px] bg-forest-100 dark:bg-forest-900 flex justify-end">
                                  <div
                                    className={`h-full bg-forest-900 dark:bg-forest-50`}
                                    style={{
                                      width: getWidth(sortedContracts[key]),
                                    }}
                                  ></div>
                                </div> */}
                              </div>

                              <div className="flex items-center w-[57%] justify-end ">
                                {master && (
                                  <Link
                                    href={
                                      master.chains[sortedContracts[key].chain]
                                        .block_explorer +
                                      "address/" +
                                      sortedContracts[key].address
                                    }
                                    target="_blank"
                                  >
                                    <Icon
                                      icon="material-symbols:link"
                                      className="w-[30px] h-[30px]"
                                    />
                                  </Link>
                                )}
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
                        Object.keys(sortedContracts).length >
                        maxDisplayedContracts
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
          </HorizontalScrollContainer>
        </div>
      )}
    </>
  );
}
