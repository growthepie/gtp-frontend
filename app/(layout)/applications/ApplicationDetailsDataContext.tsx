"use client";
import ShowLoading from "@/components/layout/ShowLoading";
import { ApplicationsURLs } from "@/lib/urls";
import { DailyData } from "@/types/api/EconomicsResponse";
import { createContext, useContext } from "react";
import useSWR from "swr";

export interface AppplicationDetailsRespomse {
  metrics:          Metrics;
  contracts:        Contracts;
  last_updated_utc: Date;
}

export interface Contracts {
  types: string[];
  data:  Array<Array<number | null | string>>;
}

export interface Metrics {
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
  [chain: string]: number[];
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


export type ApplicationDetailsDataContextType = {
  data: AppplicationDetailsRespomse;
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
  } = useSWR<AppplicationDetailsRespomse>(
    owner_project ? ApplicationsURLs.details.replace("{owner_project}", owner_project) : null,
  );

  return (
    <ApplicationDetailsDataContext.Provider value={{
      data: applicationDetailsData || {} as AppplicationDetailsRespomse,
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