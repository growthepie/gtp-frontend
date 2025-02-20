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
import { useRouter, useSearchParams, usePathname } from "next/navigation";


export type TimespanContextType = {
  selectedTimespan: string;
  setSelectedTimespan: (value: string) => void;
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  timespans: {
    [key: string]: {
      label: string;
      shortLabel: string;
      value: number;
      // xMin: number;
      // xMax: number;
    };
  }
}

export const TimespanContext = createContext<TimespanContextType | undefined>(undefined);

type TimespanProviderProps = {
  children: React.ReactNode;
  timespans: {
    [key: string]: {
      label: string;
      shortLabel: string;
      value: number;
      // xMin: number;
      // xMax: number;
    };
  };
  defaultTimespan?: string;
}

export const TimespanProvider = ({ children, timespans, defaultTimespan = "7d" }: TimespanProviderProps) => {
  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  /* < Query Params > */
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const selectedTimespanParam = searchParams.get("timespan") || defaultTimespan;
  
  enum FilterType {
    TIMESPAN = "timespan",
    CHAIN = "origin_key",
  }
  const handleTimepan = (type: FilterType, value: string) => {
    if (type === FilterType.TIMESPAN) {
      setSelectedTimespan(value);
    }

    updateSearchQuery({
      [type]: value
    });
  };

  const updateSearchQuery = (updatedQuery: { [key: string]: string }) => {
    // get existing query params
    let searchParams = new URLSearchParams(window.location.search)
    
    // update existing query params
    for (const key in updatedQuery) {
      searchParams.set(key, updatedQuery[key]);
    }

    // create new url
    let url = `${pathname}?${decodeURIComponent(searchParams.toString())}`;

    // update query params
    router.replace(url, {scroll: false});
  };
  /* </ Query Params > */

  return (
    <TimespanContext.Provider value={{
      timespans,
      selectedTimespan: selectedTimespanParam,
      setSelectedTimespan: (value: string) => handleTimepan(FilterType.TIMESPAN, value),
      isMonthly, setIsMonthly,
    }}>
      {children}
    </TimespanContext.Provider>
  );
}

export const useTimespan = () => {
  const context = useContext(TimespanContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}