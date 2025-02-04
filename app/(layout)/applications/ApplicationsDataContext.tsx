"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { DALayerWithKey, useMaster } from "@/contexts/MasterContext";
import { Chain, Get_SupportedChainKeys } from "@/lib/chains";
import { IS_PRODUCTION } from "@/lib/helpers";
import { ApplicationsURLs, DAMetricsURLs, DAOverviewURL, LabelsURLS, MasterURL, MetricsURLs } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ChainData, MetricData, MetricsResponse } from "@/types/api/MetricsResponse";
import { AppDatum, AppOverviewResponse, AppOverviewResponseHelper, ParsedDatum } from "@/types/applications/AppOverviewResponse";
import { intersection } from "lodash";
import { RefObject, createContext, useContext, useEffect, useMemo, useState } from "react";
import { LogLevel } from "react-virtuoso";
import useSWR, { useSWRConfig, preload} from "swr";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useTimespan } from "./TimespanContext";
import { useMetrics } from "./MetricsContext";
import { useProjectsMetadata } from "./ProjectsMetadataContext";
import { useSort } from "./SortContext";



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
  gas_fees_eth_change_pct: number;
  gas_fees_usd_change_pct: number;
  txcount_change_pct: number;
  rank_gas_fees_eth: number;
  rank_gas_fees_usd: number;
  rank_txcount: number;
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
  };

  for (const entry of data) {
    const [
      owner, origin, numContracts, gasEth, prevGasEth, gasUsd, txCount, prevTxCount
    ] = [
      entry[typesInexes.owner_project] as string, entry[typesInexes.origin_key] as string, entry[typesInexes.num_contracts] as number, entry[typesInexes.gas_fees_eth] as number, entry[typesInexes.prev_gas_fees_eth] as number, entry[typesInexes.gas_fees_usd] as number, entry[typesInexes.txcount] as number, entry[typesInexes.prev_txcount] as number
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
    };
  });

  // Calculate ranks in a single pass for all metrics
  assignRanks(results, 'gas_fees_eth');
  assignRanks(results, 'gas_fees_usd');
  assignRanks(results, 'txcount');

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
  setSelectedStringFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ApplicationsDataContext = createContext<ApplicationsDataContextType | undefined>(undefined);

export const ApplicationsDataProvider = ({ children }: { children: React.ReactNode }) => {
  const {ownerProjectToProjectData} = useProjectsMetadata();
  const {timespans, selectedTimespan, setSelectedTimespan, isMonthly, setIsMonthly} = useTimespan();
  const { sort, setSort } = useSort();
  const { metricsDef } = useMetrics();


  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
  
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [selectedStringFilters, setSelectedStringFilters] = useState<string[]>([]);


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
      owner_project: selectedStringFilters,
      category: selectedStringFilters,
    })

  }, [applicationsTimespan, selectedTimespan, selectedChains, selectedStringFilters, ownerProjectToProjectData]);

  const applicationDataAggregated = useMemo(() => {
    const sorted = [...applicationDataFiltered];
    let metric = sort.metric;
    if(metric == "gas_fees")
      metric = showUsd ? "gas_fees_usd" : "gas_fees_eth";
    
    sorted.sort((a, b) => {
      if(!a[metric] && !b[metric]) return 0;

      if(!a[metric] || a[metric] == Infinity) return 1;
      if(!b[metric] || b[metric] == Infinity) return -1;

      if(sort.sortOrder === "asc")
        return a[metric] - b[metric];
      return b[metric] - a[metric];
    });
    return sorted;
  }, [applicationDataFiltered, showUsd, sort.metric, sort.sortOrder]);

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
        selectedChains, setSelectedChains,
        applicationDataAggregated,
        isLoading: applicationsTimespanLoading || masterLoading,

        applicationsChains,
        selectedStringFilters,
        setSelectedStringFilters,
      }}
    >
      <ShowLoading
        dataLoading={[masterLoading]}
        // dataValidating={[masterValidating]}
        // fullScreen={true}
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