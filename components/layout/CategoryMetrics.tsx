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
import { useLocalStorage } from "usehooks-ts";
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

  const [selectedMode, setSelectedMode] = useState("gas_fees_");
  const [selectedCategory, setSelectedCategory] = useState("native_transfers");

  const [animationFinished, setAnimationFinished] = useState(true);
  const [exitAnimation, setExitAnimation] = useState(false);

  const [openSub, setOpenSub] = useState(false);
  const [selectedValue, setSelectedValue] = useState("absolute");

  const [contractCategory, setContractCategory] = useState("chain");
  const [sortOrder, setSortOrder] = useState(true);
  const [chainValues, setChainValues] = useState<any[][] | null>(null);
  const [selectedType, setSelectedType] = useState("gas_fees_absolute_usd");
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

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

  useEffect(() => {
    if (contractCategory === "contract") {
      const clonedContracts = { ...contracts };
      const sortedContractKeys = Object.keys(clonedContracts).sort((a, b) =>
        clonedContracts[a].name.localeCompare(clonedContracts[b].name),
      );

      const sortedResult: { [key: string]: ContractInfo } =
        sortedContractKeys.reduce((acc, key) => {
          acc[key] = clonedContracts[key];
          return acc;
        }, {});

      setSortedContracts(sortedResult);
    } else if (contractCategory === "category") {
      const clonedContracts = { ...contracts };
      const sortedContractKeys = Object.keys(clonedContracts).sort((a, b) =>
        clonedContracts[a].main_category_key.localeCompare(
          clonedContracts[b].main_category_key,
        ),
      );

      const sortedResult: { [key: string]: ContractInfo } =
        sortedContractKeys.reduce((acc, key) => {
          acc[key] = clonedContracts[key];
          return acc;
        }, {});

      setSortedContracts(sortedResult);
    } else if (contractCategory === "chain") {
      const clonedContracts = { ...contracts };
      const sortedContractKeys = Object.keys(clonedContracts).sort((a, b) =>
        clonedContracts[a].chain.localeCompare(clonedContracts[b].chain),
      );

      const sortedResult: { [key: string]: ContractInfo } =
        sortedContractKeys.reduce((acc, key) => {
          acc[key] = clonedContracts[key];
          return acc;
        }, {});

      setSortedContracts(sortedResult);
    } else if (contractCategory === "value") {
      const clonedContracts = { ...contracts };
      const sortedContractKeys = Object.keys(clonedContracts).sort((a, b) => {
        const valueA =
          selectedMode === "gas_fees_"
            ? showUsd
              ? clonedContracts[a].gas_fees_absolute_usd
              : clonedContracts[a].gas_fees_absolute_eth
            : clonedContracts[a].txcount_absolute;

        const valueB =
          selectedMode === "gas_fees_"
            ? showUsd
              ? clonedContracts[b].gas_fees_absolute_usd
              : clonedContracts[b].gas_fees_absolute_eth
            : clonedContracts[b].txcount_absolute;

        // Compare the values
        return valueA - valueB;
      });

      const sortedResult: { [key: string]: ContractInfo } =
        sortedContractKeys.reduce((acc, key) => {
          acc[key] = clonedContracts[key];
          return acc;
        }, {});

      setSortedContracts(sortedResult);
    } else if (contractCategory === "share") {
      const clonedContracts = { ...contracts };
      const sortedContractKeys = Object.keys(clonedContracts).sort((a, b) => {
        const valueA =
          selectedMode === "gas_fees_"
            ? showUsd
              ? clonedContracts[a].gas_fees_absolute_usd
              : clonedContracts[a].gas_fees_absolute_eth
            : clonedContracts[a].txcount_absolute;

        const valueB =
          selectedMode === "gas_fees_"
            ? showUsd
              ? clonedContracts[b].gas_fees_absolute_usd
              : clonedContracts[b].gas_fees_absolute_eth
            : clonedContracts[b].txcount_absolute;

        // Compare the values
        return valueA - valueB;
      });

      const sortedResult: { [key: string]: ContractInfo } =
        sortedContractKeys.reduce((acc, key) => {
          acc[key] = clonedContracts[key];
          return acc;
        }, {});

      setSortedContracts(sortedResult);
    } else {
      setSortedContracts(contracts);
    }
  }, [contractCategory, contracts, selectedMode, showUsd]);

  const chartReturn = useMemo(() => {
    const today = new Date().getTime();
    const chainArray: ChainData[] = [];

    //Array of selected chains to return to chart
    for (let i in selectedChains) {
      if (
        selectedChains[i] === true &&
        data[selectedCategory].daily[String(i)]
      ) {
        const obj = {
          id: [String(i), selectedCategory, selectedType].join("_"),
          name: String(i),
          unixKey: "unix",
          dataKey: selectedType,
          data: data[selectedCategory].daily[String(i)],
        };
        chainArray.push(obj);
      }
    }

    return chainArray;
  }, [data, selectedChains, selectedCategory, selectedType]);

  const chartReturnTest = useMemo(() => {
    const today = new Date().getTime();
    const chainArray: ChainData[] = [];

    //Array of selected chains to return to chart
    for (let i in selectedChains) {
      if (selectedChains[i] === true) {
        const obj = {
          id: [String(i), "cefi", selectedType].join("_"),
          name: String(i),
          unixKey: "unix",
          dataKey: selectedType,
          data: data["cefi"].daily[String(i)],
        };
        chainArray.push(obj);
      }
    }

    return chainArray;
  }, [data, selectedChains, selectedCategory, selectedType]);

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

  const chartSeries = useMemo(() => {
    const today = new Date().getTime();

    if (selectedCategory && data) return chartReturn;
    return [
      {
        id: ["arbitrum", "native_transfers", selectedType].join("_"),
        name: "arbitrum",
        unixKey: "unix",
        dataKey: selectedType,
        data: data["native_transfers"].daily["arbitrum"]
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
        data: data["native_transfers"].daily["optimism"]
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
        data: data["native_transfers"].daily["zksync_era"]
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
        data: data["native_transfers"].daily["polygon_zkevm"]
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
        data: data["native_transfers"].daily["imx"]
          .map((item, i) => {
            // remap date keys so first is today and each day is subtracted from there
            const date = today - i * 24 * 60 * 60 * 1000;
            item[0] = date;
            return item;
          })
          .reverse(),
      },
    ];
  }, [selectedCategory, selectedType, data, chartReturn]);

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

  const categories: { [key: string]: string } =
    useMemo(() => {
      if (master) {
        const result: { [key: string]: string } = {};

        result.categories = "Categories";
        Object.keys(master.blockspace_categories.main_categories).forEach(
          (key) => {
            const words =
              master.blockspace_categories.main_categories[key].split(" ");
            const formatted = words
              .map((word) => {
                return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(" ");
            result[key] = formatted;
          },
        );

        // result.scaling = "Scaling";

        return result;
      }
    }, [master]) ?? {};

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
            height = "230px";
          } else if (subcategoryCount >= 5) {
            height = "180px";
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

  const [selectedSubcategories, setSelectedSubcategories] = useState<{
    [key: string]: any[];
  }>(() => {
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
  });

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

      Object.keys(selectedSubcategories[category]).forEach((subcategory) => {
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
    }, [category, type, timespan, selectedSubcategories, data, setChainValues]);
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
    sortedChainValues?.map(([item, value], index) => ({
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
            ? categorySizes[category].width
            : "140px",
      }),
      update: ({ category }) => ({
        width: !exitAnimation
          ? openSub && selectedCategory === category
            ? categorySizes[category].width
            : "140px"
          : "140px",
      }),
      leave: { width: "140px" },

      keys: ({ category }) => category,
      config: { mass: 5, tension: 500, friction: 100 },
    },
  );

  const categoryAnimation = useSpring({
    height: openSub ? categorySizes[selectedCategory].height : "67px",
    config: { mass: 5, tension: 500, friction: 100 },
    onRest: () => {
      setAnimationFinished(true);
    },
  });

  console.log(categories);

  return (
    <div className="w-full flex-col relative">
      <Container>
        <div className="flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs xl:text-base xl:flex xl:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 xl:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]">
          <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
            <button
              className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
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
              className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
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
          <div className="block xl:hidden w-[70%] mx-auto my-[10px]">
            <hr className="border-dotted border-top-[1px] h-[0.5px] border-forest-400" />
          </div>
          <div className="flex w-full xl:w-auto justify-between xl:justify-center items-stretch xl:items-center mx-4 xl:mx-0 space-x-[4px] xl:space-x-1">
            {Object.keys(timespans).map((timespan) => (
              <button
                key={timespan}
                //rounded-full sm:w-full px-4 py-1.5 xl:py-4 font-medium
                className={`rounded-full grow px-4 py-1.5 xl:py-4 font-medium ${
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
        </div>
      </Container>
      <Container className="block w-full !pr-0 lg:!px-[50px]">
        <div className="overflow-x-scroll lg:overflow-x-visible z-100 w-full scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller">
          <animated.div
            className={
              "relative min-w-[820px] md:min-w-[850px] w-[97.5%] h-[67px] m-auto border-x-[1px] border-y-[1px] rounded-[15px] dark:text-forest-50  text-forest-1000 border-forest-400 dark:border-forest-800  dark:bg-forest-1000 mt-8 overflow-hidden"
            }
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
                                <div
                                  key={categories[item.category]}
                                  className={`flex border-forest-500 rounded-[15px] border-[1.5px] p-[5px] justify-between items-center max-h-[35px] min-w-[90px] hover:bg-white/5 z-10    ${
                                    checkAllSelected(item.category)
                                      ? "opacity-100"
                                      : "opacity-30"
                                  }`}
                                  onClick={(e) => {
                                    handleSelectAllSubcategories(item.category);
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
                                {data[item.category].subcategories.list.map(
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
        <div className="flex w-[95%] m-auto mt-[30px]">
          <div className="w-1/2 ">
            <div className="flex flex-wrap items-center w-[87%] gap-y-2">
              <div className="font-bold text-sm pr-2 pl-2">
                {formatSubcategories(selectedCategory)}:{" "}
              </div>

              {selectedSubcategories[selectedCategory].map((subcategory) => (
                <div
                  key={subcategory}
                  className="bg-forest-50 border-forest-900 border-[1px] dark:bg-[#151A19] rounded-full text-xs px-[8px] py-[5px] mx-[5px]"
                >
                  {formatSubcategories(subcategory)}
                </div>
              ))}
            </div>
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
          </div>
          <div className="w-1/2 relative bottom-2">
            {chartSeries && (
              <Chart
                chartType="area"
                types={
                  selectedCategory === null || selectedCategory === "Chains"
                    ? data.native_transfers.daily.types
                    : data[selectedCategory].daily.types
                }
                timespan={selectedTimespan}
                series={chartSeries}
                yScale={
                  selectedValue === "share"
                    ? "percentage"
                    : selectedValue === "absolute_log"
                    ? "logarithmic"
                    : "linear"
                }
                // yScale="linear"
                chartHeight="400px"
                chartWidth="100%"
              />
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row w-full justify-normal md:justify-end items-center text-sm md:text-base rounded-2xl md:rounded-full bg-forest-50 dark:bg-[#1F2726] p-0.5 px-0.5 md:px-1 mt-8 gap-x-1 text-md py-[4px]">
          {/* <button onClick={toggleFullScreen}>Fullscreen</button> */}
          {/* <div className="flex justify-center items-center rounded-full bg-forest-50 p-0.5"> */}
          {/* toggle ETH */}

          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium  ${
              selectedValue === "absolute"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute");
            }}
          >
            Absolute
          </button>
          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium  ${
              selectedValue === "absolute_log"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("absolute_log");
            }}
          >
            Absolute Log
          </button>
          <button
            className={`rounded-full text-sm md:text-base py-1 lg:px-4 xl:px-6 font-medium ${
              selectedValue === "share"
                ? "bg-forest-500 dark:bg-forest-1000"
                : "hover:bg-forest-500/10"
            }`}
            onClick={() => {
              setSelectedValue("share");
            }}
          >
            Share of Chain Usage
          </button>
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
              reverse
            </TooltipContent>
          </Tooltip>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col mt-[30px] w-[98%] mx-auto min-w-[980px] ">
          <div className="flex text-[14px] font-bold justify-between mb-[10px]">
            <div className="flex gap-x-[15px]">
              <button
                className="flex gap-x-1 pl-4"
                onClick={() => {
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
              <button className="flex gap-x-1">
                Rank
                <Icon
                  icon={
                    contractCategory === "rank"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "rank" ? "opacity-100" : "opacity-20"
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
            <div className="flex gap-x-1">
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "category") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("category");
                }}
              >
                Category{" "}
                <Icon
                  icon={
                    contractCategory === "category"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "category"
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                />
              </button>
            </div>
            <div className="flex gap-x-[17px]">
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "value") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("value");
                }}
              >
                Value{" "}
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
              <button
                className="flex gap-x-1"
                onClick={() => {
                  if (contractCategory !== "share") {
                    setSortOrder(true);
                  } else {
                    setSortOrder(!sortOrder);
                  }
                  setContractCategory("share");
                }}
              >
                Share of Total Usage{" "}
                <Icon
                  icon={
                    contractCategory === "share"
                      ? sortOrder
                        ? "formkit:arrowdown"
                        : "formkit:arrowup"
                      : "formkit:arrowdown"
                  }
                  className={` text-white ${
                    contractCategory === "share" ? "opacity-100" : "opacity-20"
                  }`}
                />
              </button>
              <div className="flex gap-x-1 pr-8">Block Explorer </div>
            </div>
          </div>
          {sortOrder
            ? Object.keys(sortedContracts).map((key, i) => (
                <div key={key + "" + sortOrder}>
                  <div className="flex rounded-full border-forest-100 border-[1px] h-[60px] mt-[7.5px] ">
                    <div className="flex w-[100%] ml-4 mr-8 justify-between items-center ">
                      <div className="flex items-center w-[30%] gap-x-[30px] pl-1 ">
                        <div
                          className={`flex w-[34px] h-[34px] rounded-full items-center justify-center ${
                            AllChainsByKeys[sortedContracts[key].chain]
                              .backgrounds[theme][1]
                          }`}
                        >
                          <Icon
                            icon={`gtp:${sortedContracts[key].chain}-logo-monochrome`}
                            className="w-[21px] h-[21px] text-black"
                          />
                        </div>
                        <div className="flex w-[30px] items-center justify-center ">
                          {i + 1}
                        </div>
                        <div>{sortedContracts[key].name}</div>
                      </div>
                      <div className="flex items-center text-[14px] justify-center w-[30.3%] mr-[140px]">
                        <div className="flex">
                          {master &&
                            master.blockspace_categories.main_categories[
                              sortedContracts[key].main_category_key
                            ] +
                              " - " +
                              master.blockspace_categories.sub_categories[
                                sortedContracts[key].sub_category_key
                              ]}
                        </div>
                      </div>
                      <div className="flex gap-x-[80px] items-center w-[28%] mr-4 ">
                        <div className="flex justify-center w-[30%]">
                          {selectedMode === "gas_fees_"
                            ? showUsd
                              ? sortedContracts[
                                  key
                                ].gas_fees_absolute_usd.toFixed(2)
                              : sortedContracts[
                                  key
                                ].gas_fees_absolute_eth.toFixed(2)
                            : sortedContracts[key].txcount_absolute.toFixed(2)}
                        </div>
                        <div className="pr-[15px] text-right">
                          {selectedMode === "gas_fees_"
                            ? (
                                sortedContracts[key].gas_fees_share * 100.0
                              ).toFixed(2)
                            : (
                                sortedContracts[key].txcount_share * 100.0
                              ).toFixed(2)}
                          %
                        </div>
                        <div>
                          <Icon
                            icon="material-symbols:link"
                            className="w-[24px] h-[24px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : Object.keys(sortedContracts)
                .reverse()
                .map((key, i) => (
                  <div key={key + "" + sortOrder}>
                    <div className="flex rounded-full border-forest-100 border-[1px] h-[60px] mt-[7.5px] ">
                      <div className="flex w-[100%] ml-4 mr-8 justify-between items-center ">
                        <div className="flex items-center w-[30%] gap-x-[30px] pl-1 ">
                          <div
                            className={`flex w-[34px] h-[34px] rounded-full items-center justify-center ${
                              AllChainsByKeys[sortedContracts[key].chain]
                                .backgrounds[theme][1]
                            }`}
                          >
                            <Icon
                              icon={`gtp:${sortedContracts[key].chain}-logo-monochrome`}
                              className="w-[21px] h-[21px] text-black"
                            />
                          </div>
                          <div className="flex w-[30px] items-center justify-center ">
                            {i + 1}
                          </div>
                          <div>{sortedContracts[key].name}</div>
                        </div>
                        <div className="flex items-center text-[14px] justify-center w-[30.3%] mr-[140px]">
                          <div className="flex">
                            {master &&
                              master.blockspace_categories.main_categories[
                                sortedContracts[key].main_category_key
                              ] +
                                " - " +
                                master.blockspace_categories.sub_categories[
                                  sortedContracts[key].sub_category_key
                                ]}
                          </div>
                        </div>
                        <div className="flex gap-x-[80px] items-center w-[28%] mr-4 ">
                          <div className="flex justify-center w-[30%]">
                            {selectedMode === "gas_fees_"
                              ? showUsd
                                ? sortedContracts[
                                    key
                                  ].gas_fees_absolute_usd.toFixed(2)
                                : sortedContracts[
                                    key
                                  ].gas_fees_absolute_eth.toFixed(2)
                              : sortedContracts[key].txcount_absolute.toFixed(
                                  2,
                                )}
                          </div>
                          <div className="pr-[15px] text-right">
                            {selectedMode === "gas_fees_"
                              ? (
                                  sortedContracts[key].gas_fees_share * 100.0
                                ).toFixed(2)
                              : (
                                  sortedContracts[key].txcount_share * 100.0
                                ).toFixed(2)}
                            %
                          </div>
                          <div>
                            <Icon
                              icon="material-symbols:link"
                              className="w-[24px] h-[24px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
        </div>
      </Container>
    </div>
  );
}
