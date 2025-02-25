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

export interface ApplicationDetailsResponse {
  metrics:          Metrics;
  first_seen:       Date;
  contracts:        Contracts;
  last_updated_utc: Date;
}

export interface Contracts {
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
  aggregated:  Aggregated;
}

export interface Aggregated {
  types: string[];
  data:  AggData;
}

export interface AggData {
  [chain: string]: {[key: string]: number[]};
}

export interface OverTime {
  [chain: string]: OverTimeData;
}

export interface OverTimeData {
  daily: Daily;
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
    isValidating: applicationDetailsValidating 
  } = useSWR<ApplicationDetailsResponse>(
    owner_project ? ApplicationsURLs.details.replace("{owner_project}", owner_project) : null,
  );
  const {data:master} = useMaster();

  const { sort: overviewSort } = useSort();
  const { selectedMetrics } = useMetrics();
  const [showUsd] = useLocalStorage("showUsd", false);

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

  const contracts = useMemo(() => {
    if (!applicationDetailsData) return [];
    return contractsSorter(getContractDictArray(applicationDetailsData.contracts), sort.metric, sort.sortOrder as SortOrder);
  }, [applicationDetailsData, contractsSorter, sort]);



  return (
    <ApplicationDetailsDataContext.Provider value={{
      data: applicationDetailsData || {} as ApplicationDetailsResponse,
      owner_project,
      contracts: contracts,
      sort,
      setSort,
    }}>
      <ShowLoading 
        dataLoading={[applicationDetailsLoading]} 
        dataValidating={[applicationDetailsValidating]} 
      />
      {/* <>{JSON.stringify(sort)} {JSON.stringify(overviewSort)}</> */}
      {applicationDetailsData && children}
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