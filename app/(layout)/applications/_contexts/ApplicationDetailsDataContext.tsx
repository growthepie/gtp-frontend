"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs } from "@/lib/urls";
import { DailyData } from "@/types/api/EconomicsResponse";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import useSWR from "swr";
import { useSort } from "./SortContext";
import { useMetrics } from "./MetricsContext";
import { SortConfig, sortItems, SortOrder, SortType } from "@/lib/sorter";
import { useMaster } from "@/contexts/MasterContext";
import { useLocalStorage } from "usehooks-ts";
import { notFound } from "next/navigation";
import { useTimespan } from "./TimespanContext";
import { useChartSync } from "./GTPChartSyncContext";
import { Get_SupportedChainKeys } from "@/lib/chains";

export interface ApplicationDetailsResponse {
  metrics:          Metrics;
  kpi_cards:        KpiCards;
  first_seen:       FirstSeenByChain;
  chains_by_size:   string[];
  contracts_table: {[timespan: string]: ContractsTable};
  last_updated_utc: Date;
}


export interface FirstSeenByChain {
  [chain: string]: string;
}

export interface KpiCards {
  txcount:  KpiCard;
  daa:      KpiCard;
  gas_fees: KpiCard;
  [key: string]: KpiCard;
}

export interface KpiCard {
  sparkline:      KpiSparkline;
  current_values: KpiValues;
  wow_change:     KpiValues;
}

export interface KpiSparkline {
  types: string[];
  data:  number[][];
}

export interface KpiValues {
  types: string[];
  data:  number[];
}
export interface Contracts {
  types: string[];
  data:  Array<Array<number | null | string>>;
}

export interface ContractsTable {
  types: string[];
  data:  Array<Array<number | null | string>>;
}

export interface Metrics {
  txcount:  MetricData;
  daa:      MetricData;
  gas_fees: MetricData;
  [key: string]: MetricData;
}

export interface MetricData {
  metric_name: string;
  avg:         boolean;
  over_time:   OverTime;
  // Removed from API — kept optional for backwards compatibility
  aggregated: Aggregated;
}

export interface Aggregated {
  types: string[];
  data:  AggData;
}

export interface AggData {
  [chain: string]: {[key: string]: number[]};
}

export interface OverTime {
  [chain: string]: OverTimeData | undefined;
  all?: OverTimeData;
}

export interface OverTimeData {
  daily?: Daily;
  hourly?: Daily;
  [interval: string]: Daily | undefined;
}

export interface Daily {
  types: string[];
  data:  number[][]; // [timestamp, value]
}

type ContractKeys = [
  "address",
  "name",
  "main_category_key",
  "sub_category_key",
  "origin_key",
  "txcount",
  "fees_paid_eth",
  "fees_paid_usd",
  "daa"
]

export type ContractDict = {
  [key in ContractKeys[number]]: string | number;
}


const getContractDictArray = (contracts: Contracts) => {
  const types = contracts.types;
  const data = contracts.data;

  return data.map((contractData) => {
    const contractDict: ContractDict = {} as ContractDict;
    types.forEach((type, index) => {
      contractDict[type] = contractData[index];
    });
    return contractDict;
  });
}


export type ApplicationDetailsDataContextType = {
  data: ApplicationDetailsResponse;
  owner_project: string;
  contracts: ContractDict[];
  sort: { metric: string; sortOrder: string };
  setSort: React.Dispatch<React.SetStateAction<{ metric: string; sortOrder: string; }>>;
  selectedSeriesName: string | null;
  setSelectedSeriesName: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ApplicationDetailsDataContext = createContext<ApplicationDetailsDataContextType | undefined>(undefined);

type ApplicationDetailsDataProviderProps = {
  owner_project: string;
  children: React.ReactNode;
}

export const ApplicationDetailsDataProvider = ({
  children,
  owner_project,
}: ApplicationDetailsDataProviderProps ) => {
  const { 
    data: applicationDetailsData,
    isLoading: applicationDetailsLoading,
    isValidating: applicationDetailsValidating,
    error: applicationDetailsError,
  } = useSWR<ApplicationDetailsResponse>(
    owner_project ? ApplicationsURLs.details.replace("{owner_project}", owner_project) : null,
  );

  const [selectedSeriesName, setSelectedSeriesName] = useState<string | null>(null);



  const {data:master} = useMaster();
  const { selectedTimespan } = useTimespan();
  const { sort: overviewSort } = useSort();
  const { selectedMetrics } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", false);
  const [focusEnabled] = useLocalStorage("focusEnabled", false);

  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({ 
    metric: overviewSort.metric || selectedMetrics[0] || "",
    sortOrder: "desc",
  });

  const createContractsSorter = useCallback(() => {
    return (items: ContractDict[], metric: string, sortOrder: SortOrder): ContractDict[] => {
      if(!master) return items;

      let actualMetric = metric === "gas_fees" ? (showUsd ? "gas_fees_usd" : "gas_fees_eth") : metric;
      
      const config: SortConfig<ContractDict> = {
        metric: actualMetric as keyof ContractDict,
        sortOrder,
        type: SortType.NUMBER,
        valueAccessor: (item, met) => {

          if (met === "main_category_key") {
            return master.blockspace_categories.main_categories[item.main_category_key];
          }
          if (met === "sub_category_key") {
            return master.blockspace_categories.sub_categories[item.sub_category_key];
          }
          if( met === "origin_key") {
            return master.chains[item.origin_key].name;
          }
          return item[met];
        }
      };

      // set non-numeric types (default is SortType.NUMBER)
      if (["address", "name", "main_category_key", "sub_category_key", "origin_key"].includes(metric)) {
        config.type = SortType.STRING;
      }

      return sortItems(items, config);
    };
  }, [master, showUsd]);

  const contractsSorter = useMemo(() => createContractsSorter(), [createContractsSorter]);

  const filteredApplicationDetailsData = useMemo(() => {
    
    
    // Return early if no data is available
    if (!applicationDetailsData) return undefined;


    // Create a deep clone of the data to avoid mutation issues
    const filteredData = JSON.parse(JSON.stringify(applicationDetailsData)) as ApplicationDetailsResponse;
    const supportedChainKeys = Get_SupportedChainKeys(master);

    // Filter out unsupported chains from metrics
    if (filteredData.metrics) {
      Object.keys(filteredData.metrics).forEach(metricKey => {
        const metric = filteredData.metrics[metricKey];

        // Filter over_time — skip for non-chain-specific metrics (their keys are interval names, not chains)
        if (metric.over_time && master?.app_metrics?.[metricKey]?.chain_specific) {
          Object.keys(metric.over_time).forEach(chain => {
            if (!supportedChainKeys.includes(chain)) {
              delete metric.over_time[chain];
            }
          });
        }

        // Filter aggregated.data
        if (metric.aggregated && metric.aggregated.data) {
          const aggData = metric.aggregated.data;
          Object.keys(aggData).forEach(chain => {
            if (!supportedChainKeys.includes(chain)) {
              delete aggData[chain];
            }
          });
        }
      });
    }

    // Filter out unsupported chains from contracts_table
    if (filteredData.contracts_table) {
      const contractsTable0 = filteredData.contracts_table;
      Object.keys(contractsTable0).forEach(timespan => {
        const contractsTable = contractsTable0[timespan];
        if (contractsTable && contractsTable.data) {
          const originKeyIndex = contractsTable.types.indexOf('origin_key');
          if (originKeyIndex !== -1) {
            contractsTable.data = contractsTable.data.filter(row => {
              const originKey = String(row[originKeyIndex]);
              return supportedChainKeys.includes(originKey);
            });
          }
        }
      });
    }

    if (filteredData.first_seen) {
      filteredData.first_seen = Object.fromEntries(
        Object.entries(filteredData.first_seen).filter(([chain]) => {
          return chain === "all" || supportedChainKeys.includes(chain);
        }),
      );
    }
  
    if (focusEnabled) {
      // Filter out Ethereum from metrics
      if (filteredData.metrics) {
        Object.keys(filteredData.metrics).forEach(metricKey => {
          const metric = filteredData.metrics[metricKey];
          
          // Filter out Ethereum from over_time data
          if (metric.over_time && metric.over_time['ethereum']) {
            const { ethereum, ...otherChains } = metric.over_time;
            metric.over_time = otherChains;
          }

          // Filter out Ethereum from aggregated data
          if (metric.aggregated && metric.aggregated.data && metric.aggregated.data['ethereum']) {
            const { ethereum, ...otherChains } = metric.aggregated.data;
            metric.aggregated.data = otherChains;
          }
        });
      }

      if (filteredData.first_seen?.ethereum) {
        const { ethereum, ...otherChains } = filteredData.first_seen;
        filteredData.first_seen = otherChains;
      }
      
      // Filter out Ethereum from contracts_table for all timespans
      if (filteredData.contracts_table) {
        const contractsTableData = filteredData.contracts_table;
        Object.keys(contractsTableData).forEach(timespan => {
          const contractsTable = contractsTableData[timespan];
          if (contractsTable && contractsTable.data) {
            // Find the index of origin_key in the types array
            const originKeyIndex = contractsTable.types.indexOf('origin_key');
            
            if (originKeyIndex !== -1) {
              // Filter out rows where origin_key is 'ethereum'
              contractsTable.data = contractsTable.data.filter(row => {
                const originKey = String(row[originKeyIndex]).toLowerCase();
                return originKey !== 'ethereum' && (selectedSeriesName ? originKey === selectedSeriesName : true);
              });
            }
          }
        });
      }
    }
    
    return filteredData;
  }, [applicationDetailsData, focusEnabled, selectedSeriesName, master]);





  const contracts = useMemo(() => {
    if (!filteredApplicationDetailsData?.contracts_table) return [];
    const table = filteredApplicationDetailsData.contracts_table[selectedTimespan];
    if (!table) return [];
    return contractsSorter(getContractDictArray(table).filter(contract => {
      if(selectedSeriesName) {
        return contract.origin_key === selectedSeriesName;
      }
      return true;
    }), sort.metric, sort.sortOrder as SortOrder);
  }, [filteredApplicationDetailsData, contractsSorter, selectedTimespan, sort.metric, sort.sortOrder, selectedSeriesName]);

  if( applicationDetailsError ) {
    return notFound();
  }



  return (
    <ApplicationDetailsDataContext.Provider value={{
      data: filteredApplicationDetailsData || {} as ApplicationDetailsResponse,
      owner_project,
      contracts: contracts,
      sort,
      setSort,
      selectedSeriesName,
      setSelectedSeriesName,
    }}>
      <ShowLoading 
        dataLoading={[applicationDetailsLoading]} 
        dataValidating={[applicationDetailsValidating]} 
      />
      {/* <>{JSON.stringify(sort)} {JSON.stringify(overviewSort)}</> */}
      {filteredApplicationDetailsData && children}
    </ApplicationDetailsDataContext.Provider>
  );
}

export const useApplicationDetailsData = () => {
  const context = useContext(ApplicationDetailsDataContext);
  if (context === undefined) {
    throw new Error("useApplicationDetailsData must be used within a ApplicationDetailsDataProvider");
  }
  return context;
}
