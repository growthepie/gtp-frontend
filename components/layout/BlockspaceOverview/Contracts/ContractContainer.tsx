import { useContractContext } from "./ContractContext";
import { Icon } from "@iconify/react";
import { useMemo, useEffect, useState, CSSProperties } from "react";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { ContractContainerInterface } from "./ContextInterface";
import ContractRow from "./ContractRow";
import Link from "next/link";
import { ContractInfo } from "./ContextInterface";
import {
  GridTableChainIcon,
  GridTableHeader,
  GridTableHeaderCell,
  GridTableRow,
} from "@/components/layout/GridTable";
import { useMaster } from "@/contexts/MasterContext";
import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { Chains } from "@/types/api/ChainOverviewResponse";

function isChainsData(data: any): data is Chains {
  const potentialChainKey = Object.keys(data)[0];
  return !!potentialChainKey && typeof data[potentialChainKey] === 'object' && data[potentialChainKey] !== null && 'overview' in data[potentialChainKey];
}

export default function ContractContainer() {
  const [showUsd] = useLocalStorage("showUsd", true); // Keep for display logic if needed
  const { theme } = useTheme(); // Keep for styling potentially in row
  const [maxDisplayedContracts, setMaxDisplayedContracts] = useState(10);
  const [selectedContract, setSelectedContract] = useState<ContractInfo | null>(null);

  // const [sort, setSort] = useState<{ metric: string; sortOrder: "asc" | "desc" }>({
  //   metric: "txcount",
  //   sortOrder: "desc",
  // });

  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({ 
    metric: "txcount",
    sortOrder: "desc",
  });


  const [showMore, setShowMore] = useState(false);

  const [focusEnabled] = useLocalStorage("focusEnabled", false);

  const {
    data,
    selectedMode,
    selectedCategory,
    selectedTimespan,
    categories, // Keep if needed for display
    timespans, // Keep if needed for display
    formatSubcategories, // Keep if needed
    selectedValue, // Get selected value
    // Overview specific (might be undefined/null)
    forceSelectedChain,
    selectedChain,
    allCats,
    standardChainKey,
    // Category specific (might be undefined/null)
    selectedChains,
    selectedSubcategories,
  } = useContractContext() as ContractContainerInterface;

  // const [sortedContracts, setSortedContracts] = useState<{
  //   [key: string]: ContractInfo;
  // }>({});

  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
    "chainEcosystemFilter",
    "all-chains",
  );
  const { AllChainsByKeys } = useMaster();

  // Determine the mode based on context props
  const isCategoryView = useMemo(() => Array.isArray(selectedChains) && selectedChains.length > 0, [selectedChains]);
  const isOverviewView = useMemo(() => !isCategoryView, [isCategoryView]);

  const contracts = useMemo<{ [key: string]: ContractInfo }>(() => {
    const result: { [key: string]: ContractInfo } = {};
    if (!data || !selectedTimespan || !selectedCategory) return {};

    try { // Add try-catch for safer data access
      if (isCategoryView && data && !isChainsData(data)) {
        // --- Category View Logic ---
        const categoryData = data as CategoryComparisonResponseData;
        if (!categoryData[selectedCategory]?.aggregated?.[selectedTimespan]?.contracts) return {};
        const contractsData = categoryData[selectedCategory].aggregated[selectedTimespan].contracts.data;
        const types = categoryData[selectedCategory].aggregated[selectedTimespan].contracts.types;
        if (!contractsData || !types) return {};
        for (const contractKey in contractsData) {
          const values = contractsData[contractKey];
          // Ensure enough values exist based on 'types' array
          if (!values || values.length <= types.indexOf("txcount_share")) continue;
          const key = values[types.indexOf("address")] + values[types.indexOf("chain")];

          result[key] = {
            address: values[types.indexOf("address")],
            project_name: values[types.indexOf("project_name")],
            name: values[types.indexOf("name")],
            main_category_key: values[types.indexOf("main_category_key")],
            sub_category_key: values[types.indexOf("sub_category_key")],
            chain: values[types.indexOf("chain")],
            gas_fees_absolute_eth: values[types.indexOf("gas_fees_absolute_eth")] ?? 0,
            gas_fees_absolute_usd: values[types.indexOf("gas_fees_absolute_usd")] ?? 0,
            gas_fees_share: values[types.indexOf("gas_fees_share")] ?? 0,
            txcount_absolute: values[types.indexOf("txcount_absolute")] ?? 0,
            txcount_share: values[types.indexOf("txcount_share")] ?? 0,
          };
        }

      } else if (isOverviewView && isChainsData(data)) {
        // --- Overview View Logic ---
        const overviewData = data as Chains;
        const chainKey = standardChainKey ?? selectedChain; // Use standard key or selected chain
        if (!chainKey || !overviewData[chainKey]?.overview?.[selectedTimespan]) {
          console.warn(`No overview data found for chain ${chainKey} and timespan ${selectedTimespan}`);
          return {};
        }

        const processCategoryContracts = (catKey: string) => {
          const categoryContracts = overviewData[chainKey].overview[selectedTimespan]?.[catKey]?.contracts;
          if (!categoryContracts?.data || !categoryContracts?.types) return;

          const contractsData = categoryContracts.data;
          const types = categoryContracts.types;

          for (const contractKey in contractsData) {
            const values = contractsData[contractKey];
            const key = values[types.indexOf("address")] + values[types.indexOf("chain")]; // Use address + chain as key

            // Check if the key already exists (possible if allCats=true and contract appears in multiple cats)
            // Prioritize existing entry or sum values if needed? For now, overwrite/take first found.
            if (!result.hasOwnProperty(key)) {
              result[key] = {
                address: values[types.indexOf("address")],
                project_name: values[types.indexOf("project_name")],
                name: values[types.indexOf("name")],
                main_category_key: values[types.indexOf("main_category_key")],
                sub_category_key: values[types.indexOf("sub_category_key")],
                chain: values[types.indexOf("chain")],
                gas_fees_absolute_eth: values[types.indexOf("gas_fees_absolute_eth")] ?? 0,
                gas_fees_absolute_usd: values[types.indexOf("gas_fees_absolute_usd")] ?? 0,
                gas_fees_share: values[types.indexOf("gas_fees_share")] ?? 0,
                txcount_absolute: values[types.indexOf("txcount_absolute")] ?? 0,
                txcount_share: values[types.indexOf("txcount_share")] ?? 0,
              };
            }
          }
        };

        if (allCats) {
          const availableCategories = Object.keys(overviewData[chainKey].overview[selectedTimespan]);
          availableCategories.forEach(catKey => processCategoryContracts(catKey));
        } else if (selectedCategory) {
          processCategoryContracts(selectedCategory);
        }
      }
    } catch (error) {
      console.error("Error processing contract data:", error);
      return {}; // Return empty on error
    }

    return result;
  }, [data, selectedTimespan, selectedCategory, isCategoryView, isOverviewView, standardChainKey, selectedChain, allCats]);


  const [sortedContracts, setSortedContracts] = useState<{
    [key: string]: ContractInfo;
  }>({});


  // --- Reworked Filtering Logic ---
  useEffect(() => {
    if (!contracts) {
      setSortedContracts({});
      return;
    }

    const filteredContracts = Object.entries(contracts)
      .filter(([key, contract]) => {
        // Common Filters
        if (!contract || !contract.chain || !AllChainsByKeys.hasOwnProperty(contract.chain)) return false; // Basic validity check
        const passEcosystem = chainEcosystemFilter === "all-chains" || AllChainsByKeys[contract.chain].ecosystem.includes(chainEcosystemFilter ?? 'all-chains');
        const passEthFocus = contract.chain === "ethereum" ? !(focusEnabled ?? false) : true;

        let passViewSpecific = false;
        if (isCategoryView) {
          // Category View Filters
          const isChainSelected = Array.isArray(selectedChains) && selectedChains.includes(contract.chain);
          // Check BOTH main category AND subcategory (if subcategories are provided)
          const isMainCategorySelected = contract.main_category_key === selectedCategory;
          const isSubCategorySelected = !selectedSubcategories || selectedSubcategories.length === 0 || selectedSubcategories.includes(contract.sub_category_key);
          passViewSpecific = isChainSelected && isMainCategorySelected && isSubCategorySelected;

        } else if (isOverviewView) {
          // Overview View Filters
          const isChainSelected = !selectedChain || contract.chain === selectedChain; // True if no chain selected or matches
          const isCategorySelected = allCats || contract.main_category_key === selectedCategory;
          passViewSpecific = isChainSelected && isCategorySelected;
        }

        return passEcosystem && passEthFocus && passViewSpecific;
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

    const sortedContractKeys = Object.keys(filteredContracts).sort((aKey, bKey) => {
      const contractA = filteredContracts[aKey];
      const contractB = filteredContracts[bKey];
      if (!contractA || !contractB) return 0;

      switch (sort.metric) {
        case "project_name":
          // Handle null/undefined project names
          const nameA_proj = contractA.project_name ?? "";
          const nameB_proj = contractB.project_name ?? "";
          return sort.sortOrder === "asc" ? nameA_proj.localeCompare(nameB_proj) : nameB_proj.localeCompare(nameA_proj);
        case "name":
          // Sort by name, fallback to address
          const nameA = contractA.name ?? contractA.address;
          const nameB = contractB.name ?? contractB.address;
          return sort.sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        case "main_category_key":
          return sort.sortOrder === "asc" ? contractA.main_category_key.localeCompare(contractB.main_category_key) : contractB.main_category_key.localeCompare(contractA.main_category_key);
        case "sub_category_key":
          // Handle null/undefined subcategories
          const subA = contractA.sub_category_key ?? "";
          const subB = contractB.sub_category_key ?? "";
          return sort.sortOrder === "asc" ? subA.localeCompare(subB) : subB.localeCompare(subA);
        case "gas_fees":
          // Use sortFunction for value sorting, respect sortOrder toggle
          const ethSortResult = sortFunction(aKey, bKey);
          return sort.sortOrder === "asc" ? ethSortResult : -ethSortResult;
        case "txcount":
          // Use sortFunction for value sorting, respect sortOrder toggle
          const valueSortResult = sortFunction(aKey, bKey);
          return sort.sortOrder === "asc" ? valueSortResult : -valueSortResult;
        default:
          return 0; // Default case
      }
    });

    const sortedResult = sortedContractKeys.reduce((acc, key) => {
      acc[key] = filteredContracts[key];
      return acc;
    }, {});

    setSortedContracts(sortedResult);

  }, [contracts, isCategoryView, isOverviewView, selectedChains, selectedSubcategories, selectedChain, allCats, selectedCategory, chainEcosystemFilter, focusEnabled, sort, selectedMode, AllChainsByKeys, showUsd]);


  useEffect(() => {
    const currentMetricType = selectedMode.includes("gas_fees") ? "gas_fees" : "txcount";
    // If the sort metric doesn't match the current mode's type, reset it
    if (sort.metric !== currentMetricType) {
      // console.log(`Resetting sort metric from ${sort.metric} to ${currentMetricType} due to selectedMode change`);
      setSort({
        metric: currentMetricType,
        sortOrder: "desc", // Reset to default direction for the new metric
      });
    }
  }, [selectedMode]);

  return (
    <>
      {/* Modal backdrop */}
      <div
        className={`fixed inset-0 z-[90] flex items-center justify-center transition-opacity duration-200  ${selectedContract ? "bg-black opacity-50" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setSelectedContract(null)}
      ></div>
      {/* Container for table */}
      <div className="flex flex-col w-[100%] mx-auto min-w-[880px] mb-[15px]">
        {/* Grid Table Header */}
        <GridTableHeader
          gridDefinitionColumns="grid-cols-[20px,280px,150px,115px,minmax(115px,800px),130px]"
          className="pb-[4px] text-[12px] gap-x-[15px] z-[2]"
          style={{
            paddingTop: "15px",
          }}
        >
          <div></div>
          <GridTableHeaderCell
            metric="name"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
          >
            Contract
          </GridTableHeaderCell>

          <GridTableHeaderCell
            metric="project_name"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
          >
            Application
          </GridTableHeaderCell>
          
          <GridTableHeaderCell
            metric="main_category_key"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
          >
            Category
          </GridTableHeaderCell>
          <GridTableHeaderCell
            metric="sub_category_key"
            className="heading-small-xs"
            sort={sort}
            setSort={setSort}
          >
            Subcategory
          </GridTableHeaderCell>
          <GridTableHeaderCell
            justify="end"
            className="heading-small-xs"
            metric={selectedMode.includes("gas_fees") ? "gas_fees" : "txcount"}
            sort={sort}
            setSort={setSort}
          >
            {selectedMode.includes("gas_fees") ? "Gas Fees" : "Transaction Count"}
          </GridTableHeaderCell>
        </GridTableHeader>

        {/* Contract Rows */}
        <div className="flex flex-col w-full">
          {Object.keys(sortedContracts)
            .slice(0, maxDisplayedContracts)
            .map((key, i) => (
              <ContractRow
                key={key}
                rowKey={key}
                i={i}
                selectedContract={selectedContract}
                sortedContracts={sortedContracts}
                setSelectedContract={setSelectedContract}
              />
            ))}

          {/* Show More Button */}
          <div className="w-full flex justify-center pb-6">
            <button
              className={`relative mx-auto top-[21px] w-[125px] h-[40px] border-forest-50 border-[1px] rounded-full hover:bg-forest-700 transition-opacity ${Object.keys(sortedContracts).length > maxDisplayedContracts && maxDisplayedContracts < 50
                ? "opacity-100 visible"
                : "opacity-0 hidden"
                }`}
              onClick={() => {
                setMaxDisplayedContracts(prev => Math.min(prev + 10, 50));
              }}
              disabled={Object.keys(sortedContracts).length <= maxDisplayedContracts || maxDisplayedContracts >= 50}
            >
              Show More
            </button>
          </div>
        </div>
      </div>
    </>
  );
}