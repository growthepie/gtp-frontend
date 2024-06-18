import { useContractContext } from "./ContractContext";
import { Icon } from "@iconify/react";
import { useMemo, useEffect, useState, CSSProperties } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { ContractContainerInterface } from "./ContextInterface";
import ContractRow from "./ContractRow";
import Link from "next/link";
import { ContractInfo } from "./ContextInterface";

export default function ContractContainer() {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { theme } = useTheme();
  const [sortOrder, setSortOrder] = useState(true);
  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(
    null,
  );
  const [showMore, setShowMore] = useState(false);
  const [contractCategory, setContractCategory] = useState("value");

  const {
    data,
    selectedMode,
    selectedCategory,
    selectedChain,
    selectedTimespan,
    categories,
    allCats,
    timespans,
    standardChainKey,
    setAllCats,
  } = useContractContext() as ContractContainerInterface;

  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});

  const contracts = useMemo<{ [key: string]: ContractInfo }>(() => {
    const result: { [key: string]: ContractInfo } = {};
    for (const category of Object.keys(data)) {
      if (data) {
        const contractsData = allCats
          ? (() => {
            let contractArray = [];

            for (const categoryKey in data[standardChainKey]["overview"][
              selectedTimespan
            ]) {
              const categoryData =
                data[standardChainKey]["overview"][selectedTimespan][
                  categoryKey
                ].contracts.data;

              // Concatenate and flatten data to the contractArray
              contractArray = contractArray.concat(categoryData);
            }

            return contractArray;
          })()
          : data[standardChainKey]["overview"][selectedTimespan][
            selectedCategory
          ].contracts.data;

        const types =
          data[standardChainKey]["overview"][selectedTimespan][selectedCategory]
            .contracts.types;

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
  }, [data, selectedCategory, selectedTimespan, allCats]);

  useEffect(() => {
    if (!contracts) {
      return;
    }

    const filteredContracts = Object.entries(contracts)
      .filter(([key, contract]) => {
        const isAllChainsSelected = selectedChain === null;
        const isChainSelected =
          isAllChainsSelected || contract.chain === selectedChain;
        const isCategoryMatched = allCats
          ? true
          : contract.main_category_key === selectedCategory;
        const isEcosystemSelected = Object.keys(data).includes(contract.chain);

        return isChainSelected && isCategoryMatched && isEcosystemSelected;
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

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200  ${selectedContract ? "opacity-80" : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className={`absolute inset-0 bg-white dark:bg-black`}
          onClick={() => setSelectedContract(null)}
        ></div>
      </div>
      <div className="flex flex-col mt-[30px] w-full mx-auto min-w-[880px]">
        <div className="flex exl:text-[14px] text-[12px] font-bold mb-[10px] pl-4 pr-8">
          <div className="flex gap-x-[15px] w-[34%]">
            <button
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
                className={` dark:text-white text-black ${contractCategory === "chain" ? "opacity-100" : "opacity-20"
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
                className={` dark:text-white text-black ${contractCategory === "contract" ? "opacity-100" : "opacity-20"
                  }`}
              />
            </button>
          </div>
          <div className="flex w-[37%] ">
            <button className="flex w-[46%] -ml-2 ">Category</button>
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
          <div className="flex w-[29%]">
            <button
              className="flex gap-x-1 w-[49%] justify-end whitespace-nowrap "
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
                className={` dark:text-white text-black ${contractCategory === "value" ? "opacity-100" : "opacity-20"
                  }`}
              />
            </button>

            <div className="flex w-[51%] justify-end -ml-2 ">
              Block Explorer
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full">
          {(!sortOrder
            ? Object.keys(sortedContracts)
            : Object.keys(sortedContracts).reverse()
          )
            .slice(0, maxDisplayedContracts)
            .map((key, i) => {
              // if (i >= maxDisplayedContracts) {
              //   return null;
              // }

              return (
                <ContractRow
                  key={key}
                  rowKey={key}
                  i={i}
                  selectedContract={selectedContract}
                  sortedContracts={sortedContracts}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  setSelectedContract={setSelectedContract}
                />
              );
            })}
          <div className="w-full flex justify-center pb-2">
            <button
              className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full  hover:bg-forest-700 ${Object.keys(sortedContracts).length <= 10 ? "hidden" : "visible"
                } ${Object.keys(sortedContracts).length <= maxDisplayedContracts ||
                  maxDisplayedContracts >= 50
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
    </>
  );
}
