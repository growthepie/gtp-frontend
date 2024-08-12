"use client";
import { useMemo, useEffect, useState } from "react";
import useSWR from "swr";
import { useCategory } from "../../../../contexts/CategoryCompContext";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MasterURL } from "@/lib/urls";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import Link from "next/link";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { useMaster } from "@/contexts/MasterContext";

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

interface CategoryContractsProps {
  data: CategoryComparisonResponseData;
  selectedCategory: string;
  selectedSubcategories: { [key: string]: string[] };
  selectedMode: string;
  selectedChains: { [key: string]: boolean };
  selectedTimespan: string;
  chainEcosystemFilter: string;
  showUsd: boolean;
  timespans: any;
  formatSubcategories: (str: string) => string;
}

const CategoryContracts: React.FC<CategoryContractsProps> = ({
  data,
  selectedCategory,
  selectedSubcategories,
  selectedMode,
  selectedChains,
  selectedTimespan,
  chainEcosystemFilter,
  showUsd,
  timespans,
  formatSubcategories,
}) => {
  const { AllChainsByKeys } = useMaster();

  const [contractCategory, setContractCategory] = useState("value");
  const [contracts, setContracts] = useState<{ [key: string]: ContractInfo }>(
    {},
  );
  const { theme } = useTheme();
  const [sortOrder, setSortOrder] = useState(true);
  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
  const { categories } = useCategory();
  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(
    null,
  );
  const [showMore, setShowMore] = useState(false);
  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});
  const [copyContract, setCopyContract] = useState(false);
  const { data: master, isLoading: masterLoading } =
    useSWR<MasterResponse>(MasterURL);

  //Labelling:
  const [isContractLabelModalOpen, setIsContractLabelModalOpen] =
    useState(false);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [labelFormMainCategoryKey, setLabelFormMainCategoryKey] = useState<
    string | null
  >("nft");

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

  return (
    <>
      {master && (
        <HorizontalScrollContainer paddingBottom={16}>
          <div
            className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200  ${selectedContract ? "opacity-80" : "opacity-0 pointer-events-none"
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
                    className={` dark:text-white text-black ${contractCategory === "chain"
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
                    className={` dark:text-white text-black ${contractCategory === "contract"
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
                    className={` dark:text-white text-black ${contractCategory === "subcategory"
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
                    className={` dark:text-white text-black ${contractCategory === "value"
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
                  const color =
                    AllChainsByKeys[sortedContracts[key].chain].colors[
                    theme ?? "dark"
                    ][1];

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
                                    background: color,

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
                                const formData = new FormData(e.target as any);

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
                                    color: color,
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
                                      {Object.keys(
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
                                        master.blockspace_categories["mapping"][
                                          labelFormMainCategoryKey
                                        ].map((key) => (
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
                              <div className="pl-[50px] flex flex-col space-y-[5px] text-[14px] items-start justify-center w-full ml-2 pt-[15px]">
                                <div>
                                  Please add your details to participate in ...
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
                                  background: color,
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
                                icon={`gtp:${sortedContracts[key].chain.replace(
                                  "_",
                                  "-",
                                )}-logo-monochrome`}
                                className="w-[29px] h-[29px]"
                                style={{
                                  color: color,
                                }}
                              />
                              {/* </div> */}
                            </div>
                            <div className="flex flex-grow">
                              <div
                                className={`flex flex-none items-center space-x-2 w-0 ${copyContract ? " delay-1000" : ""
                                  } overflow-clip transition-all duration-200 ease-in-out ${sortedContracts[key].name &&
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
                                        setSelectedContract(sortedContracts[key]);
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
                                  className={`rounded-full p-2 ${copyContract
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
                                      className={`min-w-full max-w-full text-base ${sortedContracts[key].project_name
                                        ? "font-bold"
                                        : "opacity-30 italic"
                                        }`}
                                    >
                                      {sortedContracts[key].project_name
                                        ? sortedContracts[key].project_name
                                        : "Project Label Missing"}
                                    </div>

                                    <div
                                      className={`min-w-full max-w-full text-sm ${sortedContracts[key].name
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
                              {
                                master.blockspace_categories.main_categories[
                                sortedContracts[key].main_category_key
                                ]
                              }
                            </div>
                            <div className="flex ">
                              {" "}
                              {master.blockspace_categories.sub_categories[
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div className="w-full flex justify-center mb-2">
                <button
                  className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full  hover:bg-forest-700 p-[6px 16px] ${Object.keys(sortedContracts).length <= 10
                    ? "hidden"
                    : "visible"
                    } ${Object.keys(sortedContracts).length <=
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
      )}
    </>
  );
};

export default CategoryContracts;
