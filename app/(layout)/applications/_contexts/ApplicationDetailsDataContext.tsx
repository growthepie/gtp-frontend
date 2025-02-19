"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs } from "@/lib/urls";
import { DailyData } from "@/types/api/EconomicsResponse";
import { createContext, useContext } from "react";
import useSWR from "swr";

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
  data:  number[];
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


const getContractDictArray = (contracts: Contracts): ContractDict[] => {
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

  return (
    <ApplicationDetailsDataContext.Provider value={{
      data: applicationDetailsData || {} as ApplicationDetailsResponse,
      owner_project,
      contracts: applicationDetailsData ? getContractDictArray(applicationDetailsData.contracts) : [],
    }}>
      <ShowLoading 
        dataLoading={[applicationDetailsLoading]} 
        dataValidating={[applicationDetailsValidating]} 
      />
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