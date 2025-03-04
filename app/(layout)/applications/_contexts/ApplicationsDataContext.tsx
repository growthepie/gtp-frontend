"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AppDatum } from "@/types/applications/AppOverviewResponse";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useLocalStorage } from "usehooks-ts";
import { useTimespan } from "./TimespanContext";
import { useMetrics } from "./MetricsContext";
import { useProjectsMetadata } from "./ProjectsMetadataContext";
import { useSort } from "./SortContext";
import { SortConfig, sortItems, SortOrder, SortType } from "@/lib/sorter";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export type AggregatedDataRow = {
  owner_project: string;
  origin_keys: string[];  // Add this line
  num_contracts: number;
  gas_fees_eth: number;
  prev_gas_fees_eth: number;
  gas_fees_usd: number;
  txcount: number;
  prev_txcount: number;
  daa: number;
  prev_daa: number;
  gas_fees_eth_change_pct: number;
  gas_fees_usd_change_pct: number;
  txcount_change_pct: number;
  daa_change_pct: number;
  rank_gas_fees_eth: number;
  rank_gas_fees_usd: number;
  rank_txcount: number;
  rank_daa: number;
}

const memoizedResults = new Map();
const MAX_CACHE_SIZE = 20;

function getCacheKey(timespan: string, filters: { [key: string]: string[] }) {
  return `${timespan}-${JSON.stringify(filters)}`;
}

function ownerProjectToOriginKeysMap(data: AppDatum[]): { [key: string]: string[] } {
  // Create cache key for this specific function
  const cacheKey = `ownerProjectToOriginKeysMap-${data.length}`;
  if (memoizedResults.has(cacheKey)) {
    return memoizedResults.get(cacheKey);
  }

  const result = data.reduce((acc, entry) => {
    const [owner, origin]: [string, string] = [entry[0] as string, entry[1] as string];
    if (!acc[owner]) acc[owner] = [];
    if (!acc[owner].includes(origin)) acc[owner].push(origin);
    return acc;
  }, {});

  memoizedResults.set(cacheKey, result);
  return result;
}

// Function to handle sorting and rank assignment - extracted for clarity
function assignRanks(items: AggregatedDataRow[], metric: string) {
  // Sort items by the specified metric in descending order
  items.sort((a, b) => b[metric] - a[metric]);
  
  // Assign ranks, handling ties
  let rank = 1;
  items.forEach((item, index) => {
    if (index > 0 && item[metric] < items[index - 1][metric]) rank = index + 1;
    item[`rank_${metric}`] = rank;
  });
}

// Improved calculation function with better type safety
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : Infinity;
  return ((current - previous) / previous) * 100;
}

function aggregateProjectData(
  data: AppDatum[], 
  typesArr: string[], 
  ownerProjectToProjectData: { [key: string]: any }, 
  filters: { [key: string]: string[] } = { origin_key: [], owner_project: [], category: [] }, 
  timespan: string
): AggregatedDataRow[] {
  // Generate cache key
  const cacheKey = getCacheKey(timespan, filters);
  
  // Check if we have cached results
  if (memoizedResults.has(cacheKey)) {
    return memoizedResults.get(cacheKey);
  }

  // Pre-process: get mapping of owner_project to origin_keys
  const ownerProjectToOriginKeys = ownerProjectToOriginKeysMap(data);

  // Convert chain filter to Set for O(1) lookups
  const chainFilter = new Set(filters.origin_key);
  const stringFilters = filters.owner_project;

  // Create a lookup object for faster type index access
  const typeIndexes = {
    owner_project: typesArr.indexOf("owner_project"),
    origin_key: typesArr.indexOf("origin_key"),
    num_contracts: typesArr.indexOf("num_contracts"),
    gas_fees_eth: typesArr.indexOf("gas_fees_eth"),
    prev_gas_fees_eth: typesArr.indexOf("prev_gas_fees_eth"),
    gas_fees_usd: typesArr.indexOf("gas_fees_usd"),
    txcount: typesArr.indexOf("txcount"),
    prev_txcount: typesArr.indexOf("prev_txcount"),
    daa: typesArr.indexOf("daa"),
    prev_daa: typesArr.indexOf("prev_daa"),
  };

  // Pre-filter data if possible to avoid processing unnecessary entries
  const filteredData = filters.origin_key.length > 0 
    ? data.filter(entry => chainFilter.has(entry[typeIndexes.origin_key] as string))
    : data;

  // Group data by owner_project in a single pass with reduced operations
  const aggregation = new Map();

  for (const entry of filteredData) {
    const owner = entry[typeIndexes.owner_project] as string;
    
    // Skip if not matching string filters (early bailout)
    if (stringFilters.length > 0) {
      const ownerProjectDisplay = ownerProjectToProjectData[owner]?.display_name?.toLowerCase();
      if (!ownerProjectDisplay || !stringFilters.some(filter => 
        ownerProjectDisplay.includes(filter.toLowerCase()))) {
        continue;
      }
    }

    // Initialize the group if it doesn't exist
    if (!aggregation.has(owner)) {
      aggregation.set(owner, {
        num_contracts: 0,
        gas_fees_eth: 0,
        prev_gas_fees_eth: 0,
        gas_fees_usd: 0,
        txcount: 0,
        prev_txcount: 0,
        daa: 0,
        prev_daa: 0,
      });
    }

    // Extract values once for performance
    const numContracts = entry[typeIndexes.num_contracts] as number || 0;
    const gasEth = entry[typeIndexes.gas_fees_eth] as number || 0;
    const prevGasEth = entry[typeIndexes.prev_gas_fees_eth] as number || 0;
    const gasUsd = entry[typeIndexes.gas_fees_usd] as number || 0;
    const txCount = entry[typeIndexes.txcount] as number || 0;
    const prevTxCount = entry[typeIndexes.prev_txcount] as number || 0;
    const daa = entry[typeIndexes.daa] as number || 0;
    const prevDaa = entry[typeIndexes.prev_daa] as number || 0;

    // Aggregate metrics
    const acc = aggregation.get(owner);
    acc.num_contracts += numContracts;
    acc.gas_fees_eth += gasEth;
    acc.prev_gas_fees_eth += prevGasEth;
    acc.gas_fees_usd += gasUsd;
    acc.txcount += txCount;
    acc.prev_txcount += prevTxCount;
    acc.daa += daa;
    acc.prev_daa += prevDaa;
  }

  // Convert to final array format and calculate percentage changes
  const results = Array.from(aggregation.entries()).map(([owner, metrics]) => {
    // Pre-calculate percentage changes
    const gasEthChangePct = calculatePercentageChange(metrics.gas_fees_eth, metrics.prev_gas_fees_eth);
    const txCountChangePct = calculatePercentageChange(metrics.txcount, metrics.prev_txcount);
    const daaChangePct = calculatePercentageChange(metrics.daa, metrics.prev_daa);

    return {
      owner_project: owner,
      origin_keys: ownerProjectToOriginKeys[owner]?.sort() || [],
      ...metrics,
      gas_fees_eth_change_pct: gasEthChangePct,
      gas_fees_usd_change_pct: gasEthChangePct, // These are the same in your code
      txcount_change_pct: txCountChangePct,
      daa_change_pct: daaChangePct
    };
  });

  // Calculate ranks in a single pass for all metrics - do this separately for clarity
  assignRanks(results, 'gas_fees_eth');
  assignRanks(results, 'gas_fees_usd');
  assignRanks(results, 'txcount');
  assignRanks(results, 'daa');

  // Cache the results
  memoizedResults.set(cacheKey, results);

  // Limit cache size to avoid memory leaks
  if (memoizedResults.size > MAX_CACHE_SIZE) {
    // Remove the oldest entry using iterator
    const firstKey = memoizedResults.keys().next().value;
    memoizedResults.delete(firstKey);
  }

  return results;
}

const devMiddleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    return useSWRNext(
      key,
      (url) => {
        if (url.includes("api.growthepie.xyz")) {
          // replace /v1/ with /dev/ to get JSON files from the dev folder in S3
          let newUrl = url.replace("/v1/", "/dev/");
          return fetch(newUrl).then((r) => r.json());
        } else {
          return fetch(url).then((r) => r.json());
        }
      },
      config,
    );
  };
};

export type ApplicationsDataContextType = {
  selectedChains: string[];
  setSelectedChains: (value: string[]) => void;
  applicationDataAggregated: AggregatedDataRow[];
  isLoading: boolean;
  applicationsChains: string[];
  selectedStringFilters: string[];
  setSelectedStringFilters: (value: string[]) => void;
  medianMetric: string;
  medianMetricKey: string;
  setMedianMetric: (value: string) => void;
  setMedianMetricKey: (value: string) => void;
}



export const ApplicationsDataContext = createContext<ApplicationsDataContextType | undefined>(undefined);

export const ApplicationsDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { timespans, selectedTimespan, setSelectedTimespan, isMonthly, setIsMonthly } = useTimespan();
  const { sort, setSort } = useSort();

  // bypass AWS rate limiting in development
  const headers = new Headers();
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  if (process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN)
    headers.set("X-Developer-Token", process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN);

  const requestOptions = {
    method: "GET",
    headers: headers,
  };

  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url, requestOptions).then((r) => r.json());


  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  // const [selectedChains, setSelectedChains] = useState<string[]>([]);
  // const [selectedStringFilters, setSelectedStringFilters] = useState<string[]>([]);

  const { metricsDef, setSelectedMetrics, selectedMetrics } = useMetrics();

  const getMetricKeyFromMetric = useCallback((metric: string) => {
    if (metric === "gas_fees") return showUsd ? "gas_fees_usd" : "gas_fees_eth";
    return metric;
  }, [showUsd]);

  const [medianMetric, setMedianMetric] = useState<string>(getMetricKeyFromMetric(sort.metric));
  const [medianMetricKey, setMedianMetricKey] = useState<string>(sort.metric);

  useEffect(() => {
    if (Object.keys(metricsDef).includes(sort.metric)) {
      const key = getMetricKeyFromMetric(sort.metric);
      setMedianMetric(sort.metric);
      setMedianMetricKey(key);
    }

  }, [metricsDef, sort.metric, showUsd, getMetricKeyFromMetric]);

  /* < Query Params > */


  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const selectedChainsParam = useMemo(() =>
    searchParams.get("origin_key")?.split(",") || [],
    [searchParams]
  );

  const selectedStringFiltersParam = useMemo(() =>
    searchParams.get("owner_project")?.split(",") || [],
    [searchParams]
  );


  enum FilterType {
    SEARCH = "owner_project",
    CHAIN = "origin_key",
  }
  const handleFilters = (type: FilterType, value: string[]) => {
    // update the params
    updateSearchQuery({
      [type]: value,
    });
  };

  const updateSearchQuery = (updatedQuery: { [key: string]: string[] }) => {
    // get existing query params
    let newSearchParams = new URLSearchParams(window.location.search)

    // update existing query params
    for (const key in updatedQuery) {
      if (updatedQuery[key].length === 0) {
        newSearchParams.delete(key);
        continue;
      }
      newSearchParams.set(key, updatedQuery[key].join(","));
    }

    // create new url
    let url = `${pathname}?${decodeURIComponent(newSearchParams.toString())}`;
    // router.replace(url, { scroll: false });
    window.history.replaceState(null, "", url);
  };
  /* </ Query Params > */

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const multiFetcher = (urls) => {
    if (!fetcher) return Promise.all(urls.map(url => fallbackFetcher(url)));

    return Promise.all(urls.map(url => fetcher(url)));
  }

  const {
    data: applicationsTimespan,
    error: applicationsTimespanError,
    isLoading: applicationsTimespanLoading,
    isValidating: applicationsTimespanValidating,
  } = useSWR(
    ["1d", "7d", "30d", "90d", "365d", "max"].map((timeframe) => ApplicationsURLs.overview.replace('{timespan}', `${timeframe}`)), multiFetcher);

  const applicationDataFiltered = useMemo(() => {
    if (!applicationsTimespan) return [];
    const applicationsDataTimespan = {
      "1d": applicationsTimespan[0],
      "7d": applicationsTimespan[1],
      "30d": applicationsTimespan[2],
      "90d": applicationsTimespan[3],
      "365d": applicationsTimespan[4],
      "max": applicationsTimespan[5],
    };

    if (!applicationsDataTimespan || !applicationsDataTimespan[selectedTimespan]) return [];

    return aggregateProjectData(
      applicationsDataTimespan[selectedTimespan].data.data, applicationsDataTimespan[selectedTimespan].data.types, ownerProjectToProjectData, {
        origin_key: selectedChainsParam,
        owner_project: selectedStringFiltersParam,
        category: selectedStringFiltersParam,
      },
      selectedTimespan // Use timespan as part of cache key
    )
  }, [applicationsTimespan, selectedTimespan, selectedChainsParam, selectedStringFiltersParam, ownerProjectToProjectData]);

  const createApplicationDataSorter = (
    ownerProjectToProjectData: Record<string, { main_category: string; display_name: string }>,
    showUsd: boolean
  ) => {
    return (items: AggregatedDataRow[], metric: string, sortOrder: SortOrder): AggregatedDataRow[] => {
      let actualMetric = metric === "gas_fees" ? (showUsd ? "gas_fees_usd" : "gas_fees_eth") : metric;

      const config: SortConfig<AggregatedDataRow> = {
        metric: actualMetric as keyof AggregatedDataRow,
        sortOrder,
        type: SortType.NUMBER,
        valueAccessor: (item, met) => {
          if (met === "category") {
            return ownerProjectToProjectData[item.owner_project].main_category;
          }
          if (met === "owner_project") {
            return ownerProjectToProjectData[item.owner_project].display_name;
          }
          return item[met];
        }
      };
      // Set correct sort type based on metric
      if (metric === "category" || metric === "owner_project") {
        config.type = SortType.STRING;
      } else if (metric === "origin_keys") {
        config.type = SortType.STRING_ARRAY;
      }
      return sortItems(items, config);
    };
  };

  const applicationDataSorter = createApplicationDataSorter(ownerProjectToProjectData, showUsd);

  const applicationDataAggregated = useMemo(() => {
    return applicationDataSorter(applicationDataFiltered, sort.metric, sort.sortOrder as SortOrder);
  }, [applicationDataFiltered, applicationDataSorter, sort.metric, sort.sortOrder]);

  // distinct chains across all data
  const applicationsChains = useMemo(() => {
    const chains = new Set<string>();
    applicationDataFiltered.forEach((app) => {
      app.origin_keys.forEach((chain) => {
        chains.add(chain);
      });
    });
    return Array.from(chains);
  }, [applicationDataFiltered]);

  return (
    <ApplicationsDataContext.Provider
      value={{
        selectedChains: selectedChainsParam,
        setSelectedChains: (value) => handleFilters(FilterType.CHAIN, value),
        applicationDataAggregated,
        isLoading: applicationsTimespanLoading || masterLoading,
        applicationsChains,
        selectedStringFilters: selectedStringFiltersParam,
        setSelectedStringFilters: (value) => handleFilters(FilterType.SEARCH, value),
        medianMetric,
        medianMetricKey,
        setMedianMetric: (value) => setMedianMetric(value),
        setMedianMetricKey: (value) => setMedianMetricKey(value),
      }}
    >
      <ShowLoading
        dataLoading={[masterLoading, applicationsTimespanLoading]}
        dataValidating={[masterValidating, applicationsTimespanValidating]}
      />
      {children}
    </ApplicationsDataContext.Provider>
  );
}

export const useApplicationsData = () => {
  const context = useContext(ApplicationsDataContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}