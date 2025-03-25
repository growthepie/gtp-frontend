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
import { Get_SupportedChainKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { LabelsURLS, LandingURL, MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainAnimations from "./ChainAnimations";
import { useUIContext } from "@/contexts/UIContext";
import ContractLabelModal from "./ContractLabelModal";
import CategoryBar from "@/components/layout/CategoryBar";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";
import {
  GridTableChainIcon,
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { LabelsProjectsResponse } from "@/types/Labels/ProjectsResponse";
import "@/app/highcharts.axis.css";
import VerticalScrollContainer from "../VerticalScrollContainer";

export default function CategoryMetrics({
  data,
  master,
  showEthereumMainnet,
  setShowEthereumMainnet,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: CategoryComparisonResponseData;
  master: MasterResponse;
  showEthereumMainnet: boolean;
  setShowEthereumMainnet: (show: boolean) => void;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const { AllChainsByKeys } = useMaster();

  const { data: projectsData } = useSWR<LabelsProjectsResponse>(
    LabelsURLS.projects,
  );

  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const ownerProjectDisplayNameToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let displayNameIndex = projectsData.data.types.indexOf("display_name");

    if (displayNameIndex === -1) return {};

    let d = {};

    projectsData.data.data.forEach((project) => {
      if (project[displayNameIndex] !== null)
        d[project[displayNameIndex]] = project;
    });

    return d;
  }, [projectsData]);

  // const {
  //   data: master,
  //   error: masterError,
  //   isLoading: masterLoading,
  //   isValidating: masterValidating,
  // } = useSWR<MasterResponse>(MasterURL);

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

  type ChainRowData = {
    item: string;
    value: any;
    index: number;
    y: any;
    height: any;
  };

  const { isSidebarOpen } = useUIContext();
  const [selectedMode, setSelectedMode] = useState("txcount_");
  const [selectedCategory, setSelectedCategory] = useState(
    queryCategory ?? "defi",
  );
  const [contractHover, setContractHover] = useState({});

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [openSub, setOpenSub] = useState(querySubcategories ? true : false);
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedChartType, setSelectedChartType] = useState("absolute");

  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);

  const [contractCategory, setContractCategory] = useState("gas_fees");
  const [sortOrder, setSortOrder] = useState(true);
  const [chainValues, setChainValues] = useState<[string, number][] | null>(
    null,
  );

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);
  const [copyContract, setCopyContract] = useState(false);
  const [copyID, setCopyID] = useState<string | null>("");
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
  >(Object.keys(master.blockspace_categories)[0]);

  const stackIndex = {
    op_stack: ["base", "optimism"],
    op_super: ["base", "optimism"],
  };

  const { theme } = useTheme();

  const [updatePlaceholderOpacity, setUpdatePlaceholderOpacity] =
    useState<boolean>(false);

  const [selectedChains, setSelectedChains] = useState<{
    [key: string]: boolean;
  }>(
    Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
      if (Get_SupportedChainKeys(master).includes(chain.key)) acc[key] = true;
      return acc;
    }, {}),

    // Object.entries(AllChainsByKeys).reduce((acc, [key, chain]) => {
    //   if (AllChainsByKeys[key].chainType === "L2") acc[key] = true;
    //   return acc;
    // }, {}),
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

  const sortedChainValues = useMemo<[string, number][] | null>(() => {
    if (!chainValues || !selectedChains) return null;

    return chainValues
      .filter(([item]: [string, number]) => {
        const supportedChainKeys = Get_SupportedChainKeys(master);
        const isSupported =
          item === "all_l2s" ? true : supportedChainKeys.includes(item);
        const isMaster = master?.chains[item] ? true : false;
       
        const passETH = item === "ethereum" ? !focusEnabled : true;
        const passEcosystem =
          item === "all_l2s"
            ? true
            : isMaster
              ? chainEcosystemFilter === "all-chains"
                ? true
                : AllChainsByKeys[item].ecosystem.includes(chainEcosystemFilter)
              : false;

        return item !== "types" && isSupported && passEcosystem && passETH;
      })
      .sort((a, b) => b[1] - a[1])
      .sort(([itemA], [itemB]) =>
        selectedChains[itemA] === selectedChains[itemB]
          ? 0
          : selectedChains[itemA]
            ? -1
            : 1,
      );
  }, [chainValues, selectedChains, chainEcosystemFilter, focusEnabled]);

  const sortedChainValuesWithPlaceholder = useMemo<
    [string, number, number][] | null
  >(() => {
    if (!chainValues || !selectedChains) return null;

    let sortedValues = chainValues
      .filter(([item]) => {
        const supportedChainKeys = Get_SupportedChainKeys(master);
        const isSupported =
          item === "all_l2s" ? true : supportedChainKeys.includes(item);
        const isMaster = master?.chains[item] ? true : false;
        const passETH = item === "ethereum" ? !focusEnabled : true;
        const passEcosystem =
          item === "all_l2s"
            ? true
            : isMaster
              ? chainEcosystemFilter === "all-chains"
                ? true
                : AllChainsByKeys[item].ecosystem.includes(chainEcosystemFilter)
              : false;

        return item !== "types" && isSupported && passEcosystem && passETH;
      })
      .sort((a, b) => b[1] - a[1])
      .sort(([itemA], [itemB]) =>
        selectedChains[itemA] === selectedChains[itemB]
          ? 0
          : selectedChains[itemA]
            ? -1
            : 1,
      );

    // Insert the placeholder array
    const result: [string, number, number][] = [];

    for (let i = 0; i < sortedValues.length; i++) {
      const current = sortedValues[i] as [string, number];
      const next = sortedValues[i + 1] as [string, number] | undefined;

      // Push the current item with its true index
      result.push([current[0], current[1], i]);

      // Check the condition and add the placeholder with a null index if needed
      if (selectedChains[current[0]] && next && !selectedChains[next[0]]) {
        result.push(["placeholder", 0, 0]);
      }
    }

    return result;
  }, [
    chainValues,
    selectedChains,
    master,
    chainEcosystemFilter,
    AllChainsByKeys,
    focusEnabled,
  ]);

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
        label: "Max",
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
      const passETH = currChain === "ethereum" ? !focusEnabled : true;
      const passEcosystem =
        currChain === "all_l2s"
          ? true
          : isMaster
            ? chainEcosystemFilter === "all-chains"
              ? true
              : AllChainsByKeys[currChain].ecosystem.includes(
                  chainEcosystemFilter,
                )
            : false;
      if (
        isSupported &&
        passEcosystem &&
        selectedChains[currChain] === true &&
        data[selectedCategory][dailyKey][String(currChain)] &&
        passETH
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
    focusEnabled,
  ]);

  const chartSeries = useMemo(() => {
    const today = new Date().getTime();

    if (selectedCategory && data) return chartReturn;
    return Object.keys(data["native_transfers"][dailyKey]).filter((chain) => {
      const passETH = chain === "ethereum" ? !focusEnabled : true;
      return passETH;
    }).map((chain) => ({
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
    focusEnabled
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
      setChainValues(updatedChainValues as [string, number][]);
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
        const passETH = contract.chain === "ethereum" ? !focusEnabled : true;

        return (
          isChainSelected &&
          isSubcategorySelected &&
          isCategoryMatched &&
          filterChains &&
          passETH
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
      } else if (
        contractCategory === "gas_fees" ||
        contractCategory === "txcount"
      ) {
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
    AllChainsByKeys,
    focusEnabled
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

  const isAllChainsSelected = useMemo(() => {
    if (!sortedChainValues) return true;

    let retVal = true;

    sortedChainValues.forEach((arrayVals) => {
      if (!selectedChains[arrayVals[0]]) {
        retVal = false;
      }
    });

    return retVal;
  }, [sortedChainValues, selectedChains]);

  let height = 0;

  const transitions = useTransition(
    sortedChainValuesWithPlaceholder
      ?.filter(([item]) => !(item === "imx" && selectedMode === "gas_fees_"))
      .map(([item, value], index) => {
        const isPlaceholder = item === "placeholder";

        const rowHeight = !isPlaceholder ? 39 : 20;

        return {
          item,
          value,
          index,
          y: (height += rowHeight) - rowHeight,
          height: rowHeight,
        } as ChainRowData;
      }) || [],
    {
      key: (item: any) => item.item, // Use item as the key
      from: { opacity: 0, height: 0 },
      leave: null,
      enter: ({ y, height, item }) => ({
        y: y,
        height: height,
        opacity: 1.0,
      }),
      update: ({ y, height, item }) => ({
        y: y,
        height: height,
        opacity: 1.0,
      }),
      config: { mass: 5, tension: 500, friction: 100 },
    },
  );

  useEffect(() => {
    if (!sortedChainValuesWithPlaceholder || !sortedChainValues) return;
    if (sortedChainValuesWithPlaceholder.length > sortedChainValues.length) {
      setUpdatePlaceholderOpacity(true);
    }
  }, [sortedChainValues, sortedChainValuesWithPlaceholder]);

  const [chainAnimationsContainer, { width: chainAnimationsContainerWidth }] =
    useElementSizeObserver<HTMLDivElement>();

  // console.log(sortedChainValues);

  return (
    <>
      {selectedSubcategories && (
        <div className="relative w-full flex-col">
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
              <div className="mx-auto my-[10px] block w-[70%] lg:hidden">
                <hr className="border-top-[1px] h-[0.5px] border-dotted border-forest-400" />
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
                  className={`absolute right-[22px] top-[63px] -z-10 w-[calc(50%-34px)] pr-[15px] text-xs transition-[transform] duration-300 ease-in-out md:right-[65px] md:top-[68px] md:w-[calc(50%-56px)] lg:right-[65px] lg:top-0 lg:w-[168px] lg:pr-[23px] xl:w-[158px] xl:pr-[23px] ${
                    !isMobile
                      ? ["max", "180d"].includes(selectedTimespan)
                        ? "translate-y-[calc(-100%+3px)]"
                        : "translate-y-0"
                      : ["max", "180d"].includes(selectedTimespan)
                        ? "translate-y-[calc(40%+3px)]"
                        : "-translate-y-[calc(40%+3px)]"
                  }`}
                >
                  <div className="z-0 w-full rounded-b-2xl rounded-t-none border border-forest-700 bg-forest-100 py-1 text-center font-medium dark:border-forest-400 dark:bg-forest-1000 lg:rounded-b-none lg:rounded-t-2xl">
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
              <div className="mx-auto mb-[20px] mt-[20px] flex w-[98.5%] flex-col justify-between gap-y-8 lg:mb-0 lg:mt-[30px] lg:flex-row">
                <VerticalScrollContainer
                  height={468}
                  className="flex w-full flex-col justify-between lg:w-[44%]"
                >
                  <div
                    ref={chainAnimationsContainer}
                    className="relative mt-4 overflow-hidden"
                    style={{
                      height: height,
                      minHeight: isMobile ? undefined : "500px",
                    }}
                  >
                    {sortedChainValues &&
                      sortedChainValuesWithPlaceholder &&
                      master &&
                      transitions((style, item) => (
                        <animated.div
                          className="absolute w-full"
                          key={item.item}
                          style={style}
                        >
                          {item.item !== "placeholder" ? (
                            <ChainAnimations
                              chain={item.item}
                              value={item.value}
                              index={sortedChainValues.findIndex(
                                (chain) => chain[0] === item.item,
                              )}
                              sortedValues={sortedChainValues}
                              selectedValue={selectedValue}
                              selectedMode={selectedMode}
                              selectedChains={selectedChains}
                              setSelectedChains={setSelectedChains}
                              selectedCategory={selectedCategory}
                              parentContainerWidth={
                                chainAnimationsContainerWidth
                              }
                              master={master}
                            />
                          ) : (
                            <div
                              className={`flex items-center transition-opacity duration-[1500ms] ${
                                updatePlaceholderOpacity
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <div className="flex-grow border-t border-[#5A6462]"></div>
                              <span className="mx-4 text-[12px] font-semibold text-[#CDD8D3]">
                                Not showing in chart
                              </span>
                              <div className="flex-grow border-t border-[#5A6462]"></div>
                            </div>
                          )}
                        </animated.div>
                      ))}
                  </div>
                </VerticalScrollContainer>
                <div className="relative bottom-2 mb-[30px] mt-1 h-[320px] w-full lg:mt-0 lg:h-auto lg:w-[56%]">
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
                      chartHeight={isMobile ? "400" : "468"}
                      chartWidth="100%"
                      decimals={selectedMode === "txcount_" ? 0 : 2}
                    />
                  )}
                </div>
                <div className="mt-8 flex w-[100%] flex-wrap items-center gap-y-2 lg:hidden">
                  <div className="pl-2 pr-2 text-sm font-bold">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="mx-[5px] px-[2px] py-[5px] text-xs"
                        >
                          {formatSubcategories(subcategory)}
                        </div>
                      ),
                    )}
                </div>
              </div>
              <div>
                {" "}
                <div className="mx-auto hidden w-[98%] items-center gap-y-2 lg:flex lg:flex-row">
                  <div className="pl-2 pr-2 text-sm font-bold">
                    {formatSubcategories(selectedCategory)}:{" "}
                  </div>

                  {selectedSubcategories[selectedCategory] &&
                    selectedSubcategories[selectedCategory].map(
                      (subcategory) => (
                        <div
                          key={subcategory}
                          className="mx-[5px] px-[4px] py-[5px] text-xs"
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
            <div className="mx-auto mt-8 flex w-[100%] flex-row items-end justify-center gap-x-1 rounded-full bg-forest-50 p-0.5 px-0.5 py-[4px] text-md text-sm dark:bg-[#1F2726] md:items-center md:justify-end md:rounded-full md:px-1 md:text-base">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}
              <button
                className={`rounded-full px-[16px] py-[4px] ${
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
                className={`rounded-full px-[16px] py-[4px] ${
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
                className={`rounded-full px-[16px] py-[4px] ${
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
            <div className="mx-auto mt-[5px] flex w-[97%] flex-col lg:mt-[30px]">
              <h1 className="text-lg font-bold">Most Active Contracts</h1>
              <p className="mt-[15px] text-sm">
                See the most active contracts within the selected timeframe (
                {timespans[selectedTimespan].label}) and for your selected
                category/subcategories.{" "}
              </p>
            </div>
          </Container>
          <HorizontalScrollContainer paddingBottom={16}>
            <div
              className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200 ${
                selectedContract
                  ? "opacity-80"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <div
                className={`absolute inset-0 bg-white dark:bg-black`}
                onClick={() => setSelectedContract(null)}
              ></div>
            </div>
            <div className="mx-auto flex w-[99%] min-w-[880px] flex-col">
              <GridTableHeader
                gridDefinitionColumns="grid-cols-[20px,225px,280px,95px,minmax(135px,800px),115px]"
                className="z-[2] gap-x-[15px] pb-[4px] text-[12px]"
              >
                <div></div>
                {/* <button
                  className="flex gap-x-1"
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
                    className={` dark:text-white text-black ${contractCategory === "chain"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />
                </button> */}
                <GridTableHeaderCell
                  metric="owner_project"
                  sort={{
                    sortOrder: sortOrder ? "asc" : "desc",
                    metric: contractCategory,
                  }}
                  setSort={(sort: { metric: string; sortOrder: string }) => {
                    setSortOrder(!sortOrder);
                    setContractCategory(sort.metric);
                  }}
                >
                  Owner Project
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="contract"
                  sort={{
                    sortOrder: sortOrder ? "asc" : "desc",
                    metric: contractCategory,
                  }}
                  setSort={(sort: { metric: string; sortOrder: string }) => {
                    setSortOrder(!sortOrder);
                    setContractCategory(sort.metric);
                  }}
                >
                  Contract
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="category"
                  sort={{
                    sortOrder: sortOrder ? "asc" : "desc",
                    metric: contractCategory,
                  }}
                  setSort={(sort: { metric: string; sortOrder: string }) => {
                    setSortOrder(!sortOrder);
                    setContractCategory(sort.metric);
                  }}
                >
                  Category
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="subcategory"
                  sort={{
                    sortOrder: sortOrder ? "asc" : "desc",
                    metric: contractCategory,
                  }}
                  setSort={(sort: { metric: string; sortOrder: string }) => {
                    setSortOrder(!sortOrder);
                    setContractCategory(sort.metric);
                  }}
                >
                  Subcategory
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  justify="end"
                  metric={selectedMode === "gas_fees_" ? "gas_fees" : "txcount"}
                  sort={{
                    sortOrder: sortOrder ? "desc" : "asc",
                    metric: contractCategory,
                  }}
                  setSort={(sort: { metric: string; sortOrder: string }) => {
                    setSortOrder(!sortOrder);
                    setContractCategory(sort.metric);
                  }}
                >
                  {selectedMode === "gas_fees_"
                    ? "Gas Fees"
                    : "Transaction Count"}
                </GridTableHeaderCell>

                {/* <button
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
                    className={` dark:text-white text-black ${contractCategory === "contract"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />
                </button>
                <button className="flex gap-x-1">Category </button>
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
                    className={` dark:text-white text-black ${contractCategory === "subcategory"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />
                </button>
                <button
                  className="flex gap-x-1 justify-end relative "
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
                  <div className="absolute font-normal -top-[15px] right-2">
                    ({timespans[selectedTimespan].label})
                  </div>
                  <Icon
                    icon={
                      contractCategory === "value"
                        ? sortOrder
                          ? "formkit:arrowdown"
                          : "formkit:arrowup"
                        : "formkit:arrowdown"
                    }
                    className={` dark:text-white text-black ${contractCategory === "value"
                      ? "opacity-100"
                      : "opacity-20"
                      }`}
                  />
                </button> */}

                {/* <div className="flex gap-x-1 w-[48.5%] justify-center">
                  <div>Block Explorer </div>
                </div> */}
              </GridTableHeader>
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
                          <div className="group relative z-[100] mt-[7.5px] flex rounded-[27px] border border-forest-200 bg-forest-50 dark:border-forest-500 dark:bg-forest-1000">
                            <div className="pointer-events-none absolute bottom-[-1px] left-0 right-0 top-0">
                              <div className="h-full w-full overflow-clip rounded-[27px]">
                                <div className="relative h-full w-full">
                                  <div
                                    className={`absolute bottom-[0px] left-[1px] right-[1px] z-20 h-[2px] rounded-none font-semibold transition-width duration-300`}
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
                            <div className="flex h-full w-full flex-col items-center justify-center space-y-[15px] py-[10px] pl-[15px] pr-[30px]">
                              <div className="flex w-full items-center space-x-[26px]">
                                <div>
                                  <Icon
                                    icon="gtp:add-tag"
                                    className="h-[34px] w-[34px]"
                                  />
                                </div>
                                <div className="text-[16px]">
                                  Suggested label for contract{" "}
                                  <i>{selectedContract.address}</i>
                                </div>
                              </div>
                              <form
                                className="flex w-full flex-col items-start justify-center space-y-[5px]"
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
                                <div className="flex w-full items-center space-x-[26px]">
                                  <Icon
                                    icon={`gtp:${selectedContract.chain.replace(
                                      "_",
                                      "-",
                                    )}-logo-monochrome`}
                                    className="h-[34px] w-[34px]"
                                    style={{
                                      color:
                                        AllChainsByKeys[selectedContract.chain]
                                          .colors[theme ?? "dark"][1],
                                    }}
                                  />
                                  <div className="flex w-full items-center space-x-[15px]">
                                    <div className="relative w-[33%]">
                                      <input
                                        type="text"
                                        className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[2px] dark:border-forest-500"
                                        placeholder="Contract Name"
                                        name="name"
                                      />
                                      <div className="absolute right-0.5 top-0.5">
                                        <Tooltip placement="top">
                                          <TooltipTrigger>
                                            <Icon
                                              icon="feather:info"
                                              className="h-6 w-6 text-forest-900 dark:text-forest-500"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent className="z-[110]">
                                            <div className="flex w-[420px] flex-col rounded-xl bg-forest-100 p-3 text-sm text-forest-900 shadow-lg dark:bg-[#4B5553] dark:text-forest-100">
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
                                        className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[2px] dark:border-forest-500"
                                        placeholder="Project Name"
                                        name="project_name"
                                      />
                                      <div className="absolute right-0.5 top-0.5">
                                        <Tooltip placement="top">
                                          <TooltipTrigger>
                                            <Icon
                                              icon="feather:info"
                                              className="h-6 w-6 text-forest-900 dark:text-forest-500"
                                            />
                                          </TooltipTrigger>
                                          <TooltipContent className="z-[110]">
                                            <div className="flex w-[420px] flex-col rounded-xl bg-forest-100 p-3 text-sm text-forest-900 shadow-lg dark:bg-[#4B5553] dark:text-forest-100">
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
                                        className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[4px] dark:border-forest-500"
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
                                        className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[4px] dark:border-forest-500"
                                        name="sub_category_key"
                                      >
                                        <option value="" disabled selected>
                                          Subcategory
                                        </option>
                                        {labelFormMainCategoryKey &&
                                          master &&
                                          master.blockspace_categories.mapping[
                                            labelFormMainCategoryKey
                                          ]?.map((key) => (
                                            <option
                                              key={key}
                                              value={key}
                                              className="bg-forest-50 dark:bg-[#1F2726]"
                                            >
                                              {formatSubcategories(key)}
                                            </option>
                                          ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-2 flex w-full flex-col items-start justify-center space-y-[5px] pl-[50px] pt-[15px] text-[14px]">
                                  <div>
                                    Please add your details to participate in
                                    ...
                                  </div>
                                  <div className="flex w-full items-center space-x-[15px]">
                                    <input
                                      type="text"
                                      className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[2px] dark:border-forest-500"
                                      placeholder="X Handle (formerly Twitter)"
                                      name="twitter_handle"
                                    />
                                    <input
                                      type="text"
                                      className="w-full rounded-full border border-forest-200 bg-transparent px-[15px] py-[2px] dark:border-forest-500"
                                      placeholder="Source (optional)"
                                      name="source"
                                    />
                                  </div>
                                </div>
                                <div className="flex w-full items-start justify-center space-x-[15px] pt-[15px] font-medium">
                                  <button
                                    className="rounded-full border border-forest-900 px-[16px] py-[6px] text-forest-900 dark:border-forest-500 dark:text-forest-500"
                                    onClick={() => setSelectedContract(null)}
                                    disabled={isFormSubmitting}
                                  >
                                    Cancel
                                  </button>
                                  <button className="rounded-full bg-[#F0995A] px-[16px] py-[6px] text-forest-900">
                                    {isFormSubmitting ? (
                                      <Icon
                                        icon="feather:loader"
                                        className="h-4 w-4 animate-spin"
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

                    if (!master) return null;

                    return (
                      <GridTableRow
                        key={key + "" + sortOrder}
                        gridDefinitionColumns="grid-cols-[20px,225px,280px,95px,minmax(135px,800px),115px] relative"
                        className="group mb-[3px] inline-grid h-[34px] gap-x-[15px] text-[12px] transition-all duration-300"
                      >
                        <GridTableChainIcon
                          origin_key={sortedContracts[key].chain}
                        />
                        <div className="flex justify-between">
                          <div>
                            {sortedContracts[key].project_name ? (
                              sortedContracts[key].project_name
                            ) : (
                              <div className="flex h-full items-center gap-x-[3px] text-[10px] text-[#5A6462]">
                                Not Available
                              </div>
                            )}
                          </div>
                          {ownerProjectDisplayNameToProjectData[
                            sortedContracts[key].project_name
                          ] && (
                            <div className="flex gap-x-[5px]">
                              {/* <div className="flex 3xl:hidden">
                                <Icon
                                  icon={copiedAddress === sortedContracts[key].project_name.address ? "feather:check-circle" : "feather:copy"}
                                  className="w-[14px] h-[14px] cursor-pointer"
                                  onClick={() => {
                                    handleCopyAddress(filteredLabelsData[item.index].address);
                                  }}
                                />
                              </div> */}
                              <div className="flex items-center gap-x-[5px]">
                                <div className="h-[15px] w-[15px]">
                                  {ownerProjectDisplayNameToProjectData[
                                    sortedContracts[key].project_name
                                  ][5] && (
                                    <a
                                      href={
                                        ownerProjectDisplayNameToProjectData[
                                          sortedContracts[key].project_name
                                        ][5]
                                      }
                                      target="_blank"
                                      className="group flex items-center gap-x-[5px] text-xs"
                                    >
                                      <Icon
                                        icon="feather:monitor"
                                        className="h-[15px] w-[15px]"
                                      />
                                    </a>
                                  )}
                                </div>
                                <div className="h-[15px] w-[15px]">
                                  {ownerProjectDisplayNameToProjectData[
                                    sortedContracts[key].project_name
                                  ][4] && (
                                    <a
                                      href={`https://x.com/${
                                        ownerProjectDisplayNameToProjectData[
                                          sortedContracts[key].project_name
                                        ][4]
                                      }`}
                                      target="_blank"
                                      className="group flex items-center gap-x-[5px] text-xs"
                                    >
                                      <Icon
                                        icon="ri:twitter-x-fill"
                                        className="h-[15px] w-[15px]"
                                      />
                                    </a>
                                  )}
                                </div>
                                <div className="h-[15px] w-[15px]">
                                  {ownerProjectDisplayNameToProjectData[
                                    sortedContracts[key].project_name
                                  ][3] && (
                                    <a
                                      href={`https://github.com/${
                                        ownerProjectDisplayNameToProjectData[
                                          sortedContracts[key].project_name
                                        ][3]
                                      }`}
                                      target="_blank"
                                      className="group flex items-center gap-x-[5px] text-xs"
                                    >
                                      <Icon
                                        icon="ri:github-fill"
                                        className="h-[15px] w-[15px]"
                                      />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between gap-x-[10px]">
                          {sortedContracts[key].name ? (
                            <div className="truncate">
                              {sortedContracts[key].name}
                            </div>
                          ) : (
                            <div className="truncate font-mono">
                              {sortedContracts[key].address}
                            </div>
                          )}
                          <div className="flex items-center gap-x-[5px]">
                            <div className="h-[15px] w-[15px]">
                              <div
                                className="group flex cursor-pointer items-center gap-x-[5px] text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    sortedContracts[key].address,
                                  );
                                  setCopyContract(true);
                                  setCopyID(key);
                                  setTimeout(() => {
                                    setCopyContract(false);
                                    setCopyID(null);
                                  }, 1000);
                                }}
                              >
                                <Icon
                                  icon={
                                    copyContract && key === copyID
                                      ? "feather:check"
                                      : "feather:copy"
                                  }
                                  className="h-[15px] w-[15px]"
                                />
                              </div>
                            </div>
                            <Link
                              href={`${
                                master.chains[sortedContracts[key].chain]
                                  .block_explorer
                              }address/${sortedContracts[key].address}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <Icon
                                icon="gtp:gtp-block-explorer-alt"
                                className="h-[15px] w-[15px]"
                              />
                            </Link>
                            {/* <div className="h-[15px] w-[15px]">
                            {ownerProjectDisplayNameToProjectData[
                              sortedContracts[key].project_name
                            ][4] && (
                              <a
                                href={
                                  ownerProjectDisplayNameToProjectData[
                                    sortedContracts[key].project_name
                                  ][4]
                                }
                                target="_blank"
                                className="group flex items-center gap-x-[5px] text-xs"
                              >
                                <Icon
                                  icon="ri:twitter-x-fill"
                                  className="w-[15px] h-[15px]"
                                />
                              </a>
                            )}
                          </div>
                          <div className="h-[15px] w-[15px]">
                            {ownerProjectDisplayNameToProjectData[
                              sortedContracts[key].project_name
                            ][3] && (
                              <a
                                href={
                                  ownerProjectDisplayNameToProjectData[
                                    sortedContracts[key].project_name
                                  ][3]
                                }
                                target="_blank"
                                className="group flex items-center gap-x-[5px] text-xs"
                              >
                                <Icon
                                  icon="ri:github-fill"
                                  className="w-[15px] h-[15px]"
                                />
                              </a>
                            )}
                          </div> */}
                          </div>
                        </div>

                        <div>
                          {
                            master.blockspace_categories.main_categories[
                              sortedContracts[key].main_category_key
                            ]
                          }
                        </div>
                        <div>
                          {
                            master.blockspace_categories.sub_categories[
                              sortedContracts[key].sub_category_key
                            ]
                          }
                        </div>
                        <div className="flex items-center justify-end numbers-xs">
                          {selectedMode.includes("gas_fees_")
                            ? showUsd
                              ? `$${Number(
                                  sortedContracts[
                                    key
                                  ].gas_fees_absolute_usd.toFixed(0),
                                ).toLocaleString("en-GB")}`
                              : `Ξ${Number(
                                  sortedContracts[
                                    key
                                  ].gas_fees_absolute_eth.toFixed(0),
                                ).toLocaleString("en-GB")}`
                            : Number(
                                sortedContracts[key].txcount_absolute,
                              ).toLocaleString("en-GB")}
                        </div>
                      </GridTableRow>
                    );
                  })}
                <div className="mb-2 flex h-[60px] w-full justify-center">
                  <button
                    className={`p-[6px 16px] relative top-[21px] mx-auto h-[40px] w-[125px] rounded-full border-[1px] border-forest-50 hover:bg-forest-700 ${
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
