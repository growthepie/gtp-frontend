"use client";
import Image from "next/image";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { useLocalStorage, useSessionStorage, useMediaQuery } from "usehooks-ts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import Container from "./Container";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { animated, useTransition } from "@react-spring/web";
import { Chart } from "../charts/chart";
import { Get_SupportedChainKeys } from "@/lib/chains";
import { useTheme } from "next-themes";
import { LabelsURLS } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainAnimations from "./ChainAnimations";
import { useUIContext } from "@/contexts/UIContext";
import CategoryBar from "@/components/layout/CategoryBar";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

import {
  TopRowContainer,
  TopRowChild,
  TopRowParent,
} from "@/components/layout/TopRow";
import HorizontalScrollContainer from "../HorizontalScrollContainer";
import { useMaster } from "@/contexts/MasterContext";

import "@/app/highcharts.axis.css";
import VerticalScrollContainer from "../VerticalScrollContainer";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { TitleButtonLink } from "./TextHeadingComponents";
import { ContractProvider } from "./BlockspaceOverview/Contracts/ContractContext";
import ContractContainer from "./BlockspaceOverview/Contracts/ContractContainer";
import { GridTableHeader, GridTableHeaderCell } from "./GridTable";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";

const AnimatedDiv = animated.div as any;

export default function CategoryMetrics({
  data,
  master,
  selectedTimespan,
  setSelectedTimespan,
}: {
  data: CategoryComparisonResponseData;
  master: MasterResponse;
  selectedTimespan: string;
  setSelectedTimespan: (timespan: string) => void;
}) {
  const { AllChainsByKeys } = useMaster();
  const [focusEnabled] = useLocalStorage("focusEnabled", false);
  const searchParams = useSearchParams();

  // get the category from the url
  const queryCategory = searchParams?.get("category");
  const querySubcategoriesParam = searchParams?.get("subcategories") ?? "";
  const querySubcategories = useMemo(() => {
    if (!querySubcategoriesParam) return undefined;
    return Array.from(
      new Set(
        querySubcategoriesParam
          .split(",")
          .map((subcategory) => subcategory.trim())
          .filter(Boolean),
      ),
    );
  }, [querySubcategoriesParam]);

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

  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const [selectedMode, setSelectedMode] = useState("txcount_");
  const [selectedCategory, setSelectedCategory] = useState(() =>
    queryCategory && data[queryCategory] ? queryCategory : "finance",
  );

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [openSub, setOpenSub] = useState(querySubcategories ? true : false);
  const [selectedValue, setSelectedValue] = useState("absolute");
  const [selectedChartType, setSelectedChartType] = useState("absolute");


  const [chainValues, setChainValues] = useState<[string, number][] | null>(
    null,
  );

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

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

  const lastAppliedQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const queryKey = `${queryCategory ?? ""}|${querySubcategoriesParam}`;

    // Only apply URL-derived state when query params are present and changed.
    if (queryKey === "|" || lastAppliedQueryKeyRef.current === queryKey) {
      return;
    }

    if (queryCategory && data[queryCategory]) {
      setSelectedCategory(queryCategory);
    }
    setSelectedSubcategories(updatedSubcategories);
    lastAppliedQueryKeyRef.current = queryKey;
  }, [queryCategory, querySubcategoriesParam, updatedSubcategories, data]);

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
      collectibles: false,
      defi: false,
      finance: false,
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

  const contractSelectedMode = useMemo(() => {
    
    if (selectedMode === 'gas_fees_') {
        return selectedValue === 'share'
            ? (showUsd ? 'gas_fees_share_usd' : 'gas_fees_share_eth')
            : (showUsd ? 'gas_fees_absolute_usd' : 'gas_fees_absolute_eth');
    } else { // txcount
        return selectedValue === 'share' ? 'txcount_share' : 'txcount_absolute';
    }
}, [selectedMode, selectedValue, showUsd]);

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

  // Chain select toggle state logic
  const chainSelectToggleState = useMemo(() => {
    if (!sortedChainValues) return "normal";
    
    const availableChainKeys = sortedChainValues.map(([key]) => key);
    
  
    const allAvailableSelected = availableChainKeys.every(key => selectedChains[key]);
    const noneAvailableSelected = availableChainKeys.every(key => !selectedChains[key]);
    
    if (noneAvailableSelected) {
      return "none";
    }
    
    if (allAvailableSelected) {
      return "all";
    }
    
    return "normal";
  }, [sortedChainValues, selectedChains]);

  
  const [hasExplicitlyDeselectedAll, setHasExplicitlyDeselectedAll] = useState(false);

  const [lastSelectedChains, setLastSelectedChains] = useSessionStorage(
    "categoryComparisonLastSelectedChains",
    Object.keys(AllChainsByKeys).filter(key => 
      Get_SupportedChainKeys(master).includes(AllChainsByKeys[key].key)
    )
  );


  const onChainSelectToggle = useCallback(() => {
    if (!sortedChainValues) return;
    
    const availableChainKeys = sortedChainValues.map(([key]) => key);
    
    if (chainSelectToggleState === "all") {
      setHasExplicitlyDeselectedAll(true);
      const newSelectedChains = { ...selectedChains };
      availableChainKeys.forEach(key => {
        newSelectedChains[key] = false;
      });
      setSelectedChains(newSelectedChains);
    } else if (chainSelectToggleState === "none") {
      setHasExplicitlyDeselectedAll(false);
      const newSelectedChains = { ...selectedChains };
      lastSelectedChains.forEach(key => {
        if (availableChainKeys.includes(key)) {
          newSelectedChains[key] = true;
        }
      });
      setSelectedChains(newSelectedChains);
    } else {
      setHasExplicitlyDeselectedAll(false);
      const newSelectedChains = { ...selectedChains };
      availableChainKeys.forEach(key => {
        newSelectedChains[key] = true;
      });
      setSelectedChains(newSelectedChains);
    }
  }, [chainSelectToggleState, sortedChainValues, selectedChains, setSelectedChains]); // Remove lastSelectedChains from dependencies

  // Wrapper function that handles the lastSelectedChains logic
  const handleSetSelectedChains = useCallback((updater: (prev: { [key: string]: boolean }) => { [key: string]: boolean }) => {
    setSelectedChains(prevSelectedChains => {
      const newSelectedChains = updater(prevSelectedChains);
      
      // Save the current selection for the "last selected" functionality
      const currentlySelected = Object.keys(newSelectedChains).filter(key => newSelectedChains[key]);
      setLastSelectedChains(currentlySelected);
      
      return newSelectedChains;
    });
  }, [setSelectedChains, setLastSelectedChains]);

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
                  <div className="z-0 w-full rounded-b-2xl rounded-t-none border border-color-border bg-color-bg-default py-1 text-center font-medium dark:border-forest-400 dark:bg-color-ui-active lg:rounded-b-none lg:rounded-t-2xl">
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
                <div className="flex w-full flex-col justify-between lg:w-[44%] -mt-[25px]">
                  <div>
                    <div className="relative pr-[0px] lg:pr-[45px]">
                      <GridTableHeader
                        gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                        className="z-[2] flex h-[30px] select-none items-center gap-x-[10px] !pb-0 !pl-[5px] !pr-[21px] !pt-0 text-[12px] !font-bold"
                      >
                        <GridTableHeaderCell>
                          <div></div>
                        </GridTableHeaderCell>
                        <GridTableHeaderCell>Chain</GridTableHeaderCell>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div className="text-xxs pt-[3px] text-end font-normal">Select all</div>
                  
                      </GridTableHeader>
                      
                      {/* Desktop select all button */}
                      <div 
                        className="absolute right-[37px] top-[5px] cursor-pointer hidden lg:block"
                        onClick={onChainSelectToggle}
                      >
                        <div 
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full" 
                          style={{
                            color: chainSelectToggleState === "all" ? undefined : "#5A6462",
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
                            className={`h-6 w-6 ${
                              chainSelectToggleState === "none" ? "opacity-100" : "opacity-0"
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
                          className={`rounded-full p-1 ${
                            chainSelectToggleState === "none"
                              ? "bg-forest-50 dark:bg-color-bg-default"
                              : "bg-white dark:bg-color-ui-active"
                          }`}
                        >
                          <Icon
                            icon="feather:check-circle"
                            className={`h-[15px] w-[15px] ${
                              chainSelectToggleState === "none" ? "opacity-0" : "opacity-100"
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

                    {/* Mobile select all button - separate from desktop */}
                    <div className="block lg:hidden">
                      <div className="relative pr-[16px] lg:pr-[45px]">
                        <GridTableHeader
                          gridDefinitionColumns="grid-cols-[26px_minmax(30px,2000px)_61px_61px_61px_61px]"
                          className="z-[2] flex h-[30px] select-none items-center gap-x-[10px] !pb-0 !pl-[5px] !pr-[21px] !pt-0 text-[12px] !font-bold"
                        >
                          <GridTableHeaderCell>
                            <div></div>
                          </GridTableHeaderCell>
                          <GridTableHeaderCell>Chain</GridTableHeaderCell>
                        </GridTableHeader>
                        <div 
                          className="absolute right-[5px] top-[5px] cursor-pointer"
                          onClick={onChainSelectToggle}
                        >
                          <div 
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full" 
                            style={{
                              color: chainSelectToggleState === "all" ? undefined : "#5A6462",
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
                              className={`h-6 w-6 ${
                                chainSelectToggleState === "none" ? "opacity-100" : "opacity-0"
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
                            className={`rounded-full p-1 ${
                              chainSelectToggleState === "none"
                                ? "bg-forest-50 dark:bg-color-bg-default"
                                : "bg-white dark:bg-color-ui-active"
                            }`}
                          >
                            <Icon
                              icon="feather:check-circle"
                              className={`h-[15px] w-[15px] ${
                                chainSelectToggleState === "none" ? "opacity-0" : "opacity-100"
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
                  </div>
                  <VerticalScrollContainer
                    height={452}
                    className="flex w-full flex-col justify-between mt-[8px] "
                  >
                    <div
                      ref={chainAnimationsContainer}
                      className="relative overflow-hidden"
                      style={{
                        height: height,
                        minHeight: isMobile ? undefined : "500px",
                      }}
                    >
                      {sortedChainValues &&
                        sortedChainValuesWithPlaceholder &&
                        master &&
                        transitions((style, item) => (
                          <AnimatedDiv
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
                                setSelectedChains={handleSetSelectedChains} // Use the wrapper function
                                selectedCategory={selectedCategory}
                                parentContainerWidth={
                                  chainAnimationsContainerWidth
                                }
                                master={master}
                                disableAutoSelection={true} // Disable auto-selection
                              />
                            ) : (
                              <div
                                className={`flex items-center transition-opacity duration-[1500ms] gap-x-[5px] ${
                                  updatePlaceholderOpacity
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              >
                                <div className="-mb-[3px] flex-grow border-t border-[#5A6462]"></div>
                                <span className=" heading-caps-xxs text-color-text-primary">
                                  Not showing in chart
                                </span>
                                <div className="-mb-[3px] flex-grow border-t border-[#5A6462]"></div>
                              </div>
                            )}
                          </AnimatedDiv>
                        ))}
                    </div>
                  </VerticalScrollContainer>
                </div>
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
            <div className="mx-auto mt-8 flex w-[100%] flex-row items-end justify-center gap-x-1 rounded-full bg-forest-50 p-0.5 px-0.5 py-[4px] text-md text-sm dark:bg-color-bg-default md:items-center md:justify-end md:rounded-full md:px-1 md:text-base">
              {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
              {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
              {/* toggle ETH */}
              <button
                className={`rounded-full px-[16px] py-[4px] ${
                  selectedChartType === "absolute"
                    ? "bg-color-ui-active"
                    : "bg-color-ui-default hover:bg-color-ui-hover"
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
                    ? "bg-color-ui-active"
                    : "bg-color-ui-default hover:bg-color-ui-hover"
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
                    ? "bg-color-ui-active"
                    : "bg-color-ui-default hover:bg-color-ui-hover"
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
            <div className="flex items-start justify-between">
                <h2 className="heading-large-md">Most Active Contracts</h2>
                <div className="hidden md:block">
                <TitleButtonLink
                  label="Don’t see your app? Label here."
                  icon={"oli-open-labels-initiative" as GTPIconName}
                  iconSize="md"
                  iconBackground="bg-transparent"
                  rightIcon={"feather:arrow-right" as GTPIconName}
                  href="https://www.openlabelsinitiative.org/?gtp.applications"
                  newTab
                  gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                  className="w-fit hidden md:block"
                  />
                </div>
                <div className="block md:hidden">
                  <TitleButtonLink
                    label={<div className="heading-small-xxs">Label here.</div>}
                    icon={"oli-open-labels-initiative" as GTPIconName}
                    iconSize="md"
                    iconBackground="bg-transparent"
                    href="https://www.openlabelsinitiative.org/?gtp.applications"
                    newTab
                    gradientClass="bg-[linear-gradient(4.17deg,#5C44C2_-14.22%,#69ADDA_42.82%,#FF1684_93.72%)]"
                    className="w-fit"
                    containerClassName=""
                  />
                </div>
              </div>
              <p className="mt-[15px] text-sm">
                See the most active contracts within the selected timeframe (
                {timespans[selectedTimespan].label}) and for your selected
                category/subcategories.{" "}
              </p>
            </div>
          </Container>
          {/* Contract Table Replacement */}
          <HorizontalScrollContainer paddingBottom={16}>
          <ProjectsMetadataProvider>
              <ContractProvider
                  // --- Pass props similar to OverviewMetrics, adapted for CategoryMetrics ---
                  value={{
                      // Data Source: Pass the main data prop for CategoryMetrics
                      data: data, // Type: CategoryComparisonResponseData
                      master: master,
                      // Mode/Value: Combine base mode, absolute/share, and usd/eth
                      selectedMode: contractSelectedMode, // e.g., "gas_fees_absolute_usd"
                      selectedValue: selectedValue, // "absolute" or "share"
                      showUsd: showUsd, // Pass showUsd state
                      // Selection Context
                      selectedCategory: selectedCategory,
                      selectedSubcategories: selectedSubcategories[selectedCategory] || [], // Pass the array of selected subcats for the current category
                      selectedChains: Object.keys(selectedChains).filter(k => selectedChains[k]), // Pass array of selected chain keys
                      selectedChain: null, // No single selected chain in this view
                      selectedTimespan: selectedTimespan,
                      timespans: timespans,
                      categories: categories,
                      // Flags/Defaults
                      forceSelectedChain: undefined, // Not applicable
                      allCats: false, // Not applicable in Category view like this
                      standardChainKey: null, // Or a reasonable default like "all_l2s" if needed
                      // Callbacks (Provide stubs or actual setters if interaction is needed *from* contracts)
                      setSelectedChain: () => {},
                      setSelectedCategory: () => {}, // Maybe link to main setter? No, usually Contracts don't change main category.
                      setAllCats: () => {},
                      // Utilities
                      formatSubcategories: formatSubcategories,
                        // Include focusEnabled if ContractContainer needs it
                      focusEnabled: focusEnabled,
                      // Include chainEcosystemFilter if ContractContainer needs it
                      chainEcosystemFilter: chainEcosystemFilter,
                  }}
              >
                <ContractContainer />
              </ContractProvider>
            </ProjectsMetadataProvider>
          </HorizontalScrollContainer>
        </div>
      )}
    </>
  );
}
