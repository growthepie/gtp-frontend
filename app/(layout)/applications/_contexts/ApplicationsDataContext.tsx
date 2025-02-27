"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs, MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AppDatum } from "@/types/applications/AppOverviewResponse";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useLocalStorage } from "usehooks-ts";
import { useTimespan } from "./TimespanContext";
import { useMetrics } from "./MetricsContext";
import { useProjectsMetadata } from "./ProjectsMetadataContext";
import { useSort } from "./SortContext";
import { SortConfig, sortItems, SortOrder, SortType } from "@/lib/sorter";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";

function calculatePercentageChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : Infinity;
  return ((current - previous) / previous) * 100;
}

function assignRanks(items, metric) {
  // Sort items by the specified metric in descending order
  items.sort((a, b) => b[metric] - a[metric]);
  // Assign ranks, handling ties
  let rank = 1;
  items.forEach((item, index) => {
    if (index > 0 && item[metric] < items[index - 1][metric]) rank = index + 1;
    item[`rank_${metric}`] = rank;
  });
}

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

function ownerProjectToOriginKeysMap(data: AppDatum[]): { [key: string]: string[] } {
  return data.reduce((acc, entry) => {
    const [owner, origin]: [string, string] = [entry[0] as string, entry[1] as string];
    if (!acc[owner]) acc[owner] = [];
    if (!acc[owner].includes(origin)) acc[owner].push(origin);
    return acc;
  }, {});
}

function aggregateProjectData(
  data: AppDatum[], typesArr: string[], ownerProjectToProjectData: {[key: string]: any}, filters: { [key: string]: string[] } = { origin_key: [], owner_project: [], category: [] }
): AggregatedDataRow[] {
  // const data = AppOverviewResponseHelper.fromResponse(rawData).response.data.data;
  // get Mapping of owner_project to origin_keys
  const ownerProjectToOriginKeys = ownerProjectToOriginKeysMap(data);

  // Convert chain filter to Set for O(1) lookups
  const chainFilter = new Set(filters.origin_key);

  // Group data by owner_project in a single pass
  const aggregation = new Map();

  const typesInexes = {
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

  for (const entry of data) {
    const [
      owner, 
      origin, 
      numContracts, 
      gasEth, prevGasEth, gasUsd, 
      txCount, prevTxCount, 
      daa, prevDaa
    ] = [
      entry[typesInexes.owner_project] as string, 
      entry[typesInexes.origin_key] as string, 
      entry[typesInexes.num_contracts] as number, 
      entry[typesInexes.gas_fees_eth] as number, entry[typesInexes.prev_gas_fees_eth] as number, entry[typesInexes.gas_fees_usd] as number, 
      entry[typesInexes.txcount] as number, entry[typesInexes.prev_txcount] as number,
      entry[typesInexes.daa] as number, entry[typesInexes.prev_daa] as number
    ];

    // Skip if not matching the filter
    if (chainFilter.size > 0 && !chainFilter.has(origin)) continue;

    // Skip if not matching the filter
    if(filters.owner_project.length > 0){
      // allow partial matches
      const ownerProjectDisplay = ownerProjectToProjectData[owner].display_name.toLowerCase();
      if(!filters.owner_project.some((filter) => ownerProjectDisplay.includes(filter.toLowerCase()))) continue;
    }

    // Initialize the group if it doesn't exist
    if (!aggregation.has(owner)) {
      aggregation.set(owner, {
        // origin_keys: new Set(),  // Use Set for unique keys
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

    // Aggregate metrics
    const acc = aggregation.get(owner);
    // acc.origin_keys.add(origin);
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
    const { origin_keys, ...otherMetrics} = metrics;
    return {
    owner_project: owner,
    origin_keys: ownerProjectToOriginKeys[owner].sort(),  // Sort origin_keys
    ...otherMetrics,
    gas_fees_eth_change_pct: calculatePercentageChange(
      metrics.gas_fees_eth,
      metrics.prev_gas_fees_eth
    ),
    gas_fees_usd_change_pct: calculatePercentageChange(
      metrics.gas_fees_eth,
      metrics.prev_gas_fees_eth
    ),
    txcount_change_pct: calculatePercentageChange(
      metrics.txcount,
      metrics.prev_txcount
    ),
    daa_change_pct: calculatePercentageChange(
      metrics.daa,
      metrics.prev_daa
    )};
  });

  // Calculate ranks in a single pass for all metrics
  assignRanks(results, 'gas_fees_eth');
  assignRanks(results, 'gas_fees_usd');
  assignRanks(results, 'txcount');
  assignRanks(results, 'daa');

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

const getMetricKeyFromMetric = (metric: string) => {
  if (metric === "gas_fees") return "gas_fees_eth";
  return metric;
}

export const ApplicationsDataContext = createContext<ApplicationsDataContextType | undefined>(undefined);

export const ApplicationsDataProvider = ({ children }: { children: React.ReactNode }) => {
  const {ownerProjectToProjectData} = useProjectsMetadata();
  const {timespans, selectedTimespan, setSelectedTimespan, isMonthly, setIsMonthly} = useTimespan();
  const { sort, setSort } = useSort();
  const { metricsDef , setSelectedMetrics, selectedMetrics} = useMetrics();

  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedStringFilters, setSelectedStringFilters] = useState<string[]>([]);

  const [medianMetric, setMedianMetric] = useState<string>(getMetricKeyFromMetric(sort.metric));
  const [medianMetricKey, setMedianMetricKey] = useState<string>(sort.metric);

  useEffect(() => {
    if(Object.keys(metricsDef).includes(sort.metric)){
      const key = getMetricKeyFromMetric(sort.metric);

      setMedianMetric(sort.metric);
      setMedianMetricKey(key);
    }
    
  }, [metricsDef, sort.metric]);

  /* < Query Params > */
  
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const selectedChainsParam = searchParams.get("origin_key")?.split(",") || [];
  const selectedStringFiltersParam = useMemo(() => 
    searchParams.get("owner_project")?.split(",") || [],
    [searchParams]
  );

  enum FilterType {
    SEARCH = "owner_project",
    CHAIN = "origin_key",
  }
  const handleFilters = (type: FilterType, value: string[]) => {
    if (type === FilterType.CHAIN) 
      setSelectedChains(value);

    if (type === FilterType.SEARCH) 
      setSelectedStringFilters(value);

    updateSearchQuery({
      origin_key: selectedChains,
      owner_project: selectedStringFilters,
      [type]: value,
    });
  };

  const updateSearchQuery = (updatedQuery: { [key: string]: string[] }) => {
    // get existing query params
    let searchParams = new URLSearchParams(window.location.search)
        
    // update existing query params
    for (const key in updatedQuery) {
      if (updatedQuery[key].length === 0) {
        searchParams.delete(key);
        continue;
      }
      searchParams.set(key, updatedQuery[key].join(","));
    }

    // create new url
    let url = `${pathname}?${decodeURIComponent(searchParams.toString())}`;
    
    router.replace(url, {scroll: false});
  };
  /* </ Query Params > */

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const multiFetcher = (urls) => {
    if(!fetcher) return Promise.all(urls.map(url => fallbackFetcher(url)));

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
    
    return aggregateProjectData(applicationsDataTimespan[selectedTimespan].data.data, applicationsDataTimespan[selectedTimespan].data.types, ownerProjectToProjectData, {
      origin_key: selectedChains,
      owner_project: selectedStringFiltersParam,
      category: selectedStringFiltersParam,
    })
  }, [applicationsTimespan, selectedTimespan, selectedChains, selectedStringFiltersParam, ownerProjectToProjectData]);

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
        selectedChains:selectedChainsParam,
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