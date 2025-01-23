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
import useSWR, { useSWRConfig } from "swr";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";

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
  gas_fees_eth_pct: number;
  gas_fees_usd_pct: number;
  txcount_pct: number;
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
  data: AppDatum[], typesArr: string[], timespan: string, chains: string[]
): AggregatedDataRow[] {
  // get Mapping of owner_project to origin_keys
  const ownerProjectToOriginKeys = ownerProjectToOriginKeysMap(data);

  // Convert chain filter to Set for O(1) lookups
  const chainFilter = chains.length === 0
    ? new Set(data.map(d => d[1]))
    : new Set(chains);

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
    if (!chainFilter.has(origin)) continue;

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
    gas_fees_eth_pct: calculatePercentageChange(
      metrics.gas_fees_eth,
      metrics.prev_gas_fees_eth
    ),
    gas_fees_usd_pct: calculatePercentageChange(
      metrics.gas_fees_eth,
      metrics.prev_gas_fees_eth
    ),
    txcount_pct: calculatePercentageChange(
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

function applicationsMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    /// Add logger to the original fetcher.
    const extendedFetcher = (...args) => {
      return fetcher(...args).then((data) => {
        const helper = AppOverviewResponseHelper.fromResponse(data);
        return helper;
      });
    };

    // Execute the hook with the new fetcher.
    return useSWRNext(key, extendedFetcher, config);
  };
}


export type ApplicationsDataContextType = {
  selectedTimespan: string;
  setSelectedTimespan: (value: string) => void;
  selectedMetrics: ("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[];
  setSelectedMetrics: (value: ("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[]) => void;
  selectedChains: string[];
  setSelectedChains: (value: string[]) => void;
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  timespans: {
    [key: string]: {
      label: string;
      shortLabel: string;
      value: number;
      xMin: number;
      xMax: number;
    };
  }
  data: any;
  topGainers: ParsedDatum[];
  topLosers: ParsedDatum[];
  ownerProjectToProjectData: {
    [key: string]: {
      owner_project: string;
      display_name: string;
      description: string;
      main_github: string;
      twitter: string;
      website: string;
      logo_path: string;
      main_category: string;
    }
  };
  dataWithRanking: { [key: string]: (ParsedDatum & { ranking: number }) };
  applicationDataAggregated: AggregatedDataRow[];
  isLoading: boolean;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
}

export const ApplicationsDataContext = createContext<ApplicationsDataContextType | undefined>(undefined);

export const ApplicationsDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { fetcher } = useSWRConfig();
  const fallbackFetcher = (url) => fetch(url).then((r) => r.json());

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const [selectedMetrics, setSelectedMetrics] = useState<("num_contracts" | "gas_fees_eth" | "gas_fees_usd" | "txcount")[]>(["gas_fees_usd"]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  const { data, error, isLoading, isValidating } = useSWR<DAOverviewResponse>(DAOverviewURL);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: applicationsData,
    error: applicationsError,
    isLoading: applicationsLoading,
    isValidating: applicationsValidating,
  } = useSWR<AppOverviewResponseHelper>(ApplicationsURLs.overview, fallbackFetcher, {
    use:
      apiRoot === "dev" && !IS_PRODUCTION
        ? [devMiddleware, applicationsMiddleware]
        : [applicationsMiddleware],
  });

  const {
    data: projectsData,
    error: projectsError,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<any>(LabelsURLS.projects, fallbackFetcher, {
    use: apiRoot === "dev" && !IS_PRODUCTION ? [devMiddleware] : [],
  });

  const ownerProjectToProjectData = useMemo(() => {
    if (!projectsData) return {};

    let ownerProjectToProjectData = {};
    const typesArr = projectsData.data.types;
    projectsData.data.data.forEach((project) => {
      ownerProjectToProjectData[project[typesArr.indexOf("owner_project")]] = {
        owner_project: project[typesArr.indexOf("owner_project")],
        display_name: project[typesArr.indexOf("display_name")],
        description: project[typesArr.indexOf("description")],
        main_github: project[typesArr.indexOf("main_github")],
        twitter: project[typesArr.indexOf("twitter")],
        website: project[typesArr.indexOf("website")],
        logo_path: project[typesArr.indexOf("logo_path")],
        main_category: project[typesArr.indexOf("main_category")],
      }
    });

    return ownerProjectToProjectData;
  }, [projectsData]);



  const timespans = useMemo(() => {
    let xMax = Date.now();

    if (!isMonthly) {
      return {
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
          xMin: xMax - 1 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
          xMin: xMax - 7 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
          xMin: xMax - 30 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
          xMin: number;
          xMax: number;
        };
      };
    } else {
      return {
        "90d": {
          shortLabel: "3m",
          label: "3 months",
          value: 90,
          xMin: xMax - 90 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
          xMin: xMax - 365 * 24 * 60 * 60 * 1000,
          xMax: xMax,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
          xMin: number;
          xMax: number;
        };
      };
    }
  }, [isMonthly]);

  const topGainers = useMemo(() => {
    if (!applicationsData) return [];
    return applicationsData.data.sort((a, b) => {
      // sort by descending order of the sum of all selected metrics
      const aSum = selectedMetrics.reduce((acc, metric) => acc + a[metric], 0);
      const bSum = selectedMetrics.reduce((acc, metric) => acc + b[metric], 0);
      return bSum - aSum;
    }).slice(0, 3);
  }, [applicationsData, selectedMetrics]);

  const topLosers = useMemo(() => {
    if (!applicationsData) return [];
    return applicationsData.data.sort((a, b) => {
      // sort by ascending order of the sum of all selected metrics
      const aSum = selectedMetrics.reduce((acc, metric) => acc + a[metric], 0);
      const bSum = selectedMetrics.reduce((acc, metric) => acc + b[metric], 0);
      return aSum - bSum;
    }).slice(0, 3);
  }, [applicationsData, selectedMetrics]);

  const dataWithRanking = useMemo(() => {
    // sort by descending order of the sum of all selected metrics
    if (!applicationsData) return [];

    const dataWithRanking = applicationsData.data.map((datum) => {
      const sum = selectedMetrics.reduce((acc, metric) => acc + datum[metric], 0);
      return {
        ...datum,
        sum,
      };
    }).sort((a, b) => b.sum - a.sum).reduce((acc, datum, index) => {
      // add ranking
      return {
        ...acc,
        [datum.origin_key]: {
          ...datum,
          ranking: index + 1,
        },
      };
    }, {});

    return dataWithRanking;

  }, [applicationsData, selectedMetrics]);

  const {
    data: applicationsDataTimespan,
    error: applicationsTimespanError,
    isLoading: applicationsTimespanLoading,
    isValidating: applicationsTimespanValidating,
  } = useSWR<AppOverviewResponseHelper>(ApplicationsURLs.overview.replace('_test', `_${selectedTimespan}`), fallbackFetcher, {
    use:
      apiRoot === "dev" && !IS_PRODUCTION
        ? [devMiddleware, applicationsMiddleware]
        : [applicationsMiddleware],
  });

  const applicationDataAggregated = useMemo(() => {
    if (!applicationsDataTimespan) return [];

    const result =  aggregateProjectData(applicationsDataTimespan.response.data.data, applicationsDataTimespan.response.data.types, selectedTimespan, selectedChains).sort((a, b) => {
      const aSum = a[selectedMetrics[0]];
      const bSum = b[selectedMetrics[0]];
      return sortOrder === "asc" ? aSum - bSum : bSum - aSum;
    });
    
    return result;

  }, [applicationsDataTimespan, selectedTimespan, selectedChains, sortOrder, selectedMetrics]);


  return (
    <ApplicationsDataContext.Provider value={{
      selectedTimespan, setSelectedTimespan,
      selectedMetrics, setSelectedMetrics,
      selectedChains, setSelectedChains,
      isMonthly, setIsMonthly,
      timespans,
      data,
      topGainers, topLosers,
      ownerProjectToProjectData,
      dataWithRanking,
      applicationDataAggregated,
      isLoading: applicationsTimespanLoading || applicationsLoading || masterLoading || projectsLoading,
      sortOrder,
      setSortOrder,
    }}>
      <ShowLoading
        dataLoading={[masterLoading, applicationsLoading, projectsLoading]}
        dataValidating={[masterValidating, applicationsValidating, projectsValidating]}
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