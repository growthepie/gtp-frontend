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
}

export const TimespanProvider = ({ children, timespans }: TimespanProviderProps) => {
  const [selectedTimespan, setSelectedTimespan] = useState<string>("7d");
  const [isMonthly, setIsMonthly] = useState<boolean>(false);

  // const timespans = useMemo(() => {
  //   let xMax = Date.now();

  //   if (!isMonthly) {
  //     return {
  //       "1d": {
  //         shortLabel: "1d",
  //         label: "1 day",
  //         value: 1,
  //         xMin: xMax - 1 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       "7d": {
  //         shortLabel: "7d",
  //         label: "7 days",
  //         value: 7,
  //         xMin: xMax - 7 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       "30d": {
  //         shortLabel: "30d",
  //         label: "30 days",
  //         value: 30,
  //         xMin: xMax - 30 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       "90d": {
  //         shortLabel: "90d",
  //         label: "90 days",
  //         value: 90,
  //         xMin: xMax - 90 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       "365d": {
  //         shortLabel: "1y",
  //         label: "1 year",
  //         value: 365,
  //         xMin: xMax - 365 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       max: {
  //         shortLabel: "Max",
  //         label: "Max",
  //         value: 0,
  //         xMin: xMax - 365 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //     } as {
  //       [key: string]: {
  //         label: string;
  //         shortLabel: string;
  //         value: number;
  //         xMin: number;
  //         xMax: number;
  //       };
  //     };
  //   } else {
  //     return {
  //       "90d": {
  //         shortLabel: "3m",
  //         label: "3 months",
  //         value: 90,
  //         xMin: xMax - 90 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       "365d": {
  //         shortLabel: "1y",
  //         label: "1 year",
  //         value: 365,
  //         xMin: xMax - 365 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //       max: {
  //         shortLabel: "Max",
  //         label: "Max",
  //         value: 0,
  //         xMin: xMax - 365 * 24 * 60 * 60 * 1000,
  //         xMax: xMax,
  //       },
  //     } as {
  //       [key: string]: {
  //         label: string;
  //         shortLabel: string;
  //         value: number;
  //         xMin: number;
  //         xMax: number;
  //       };
  //     };
  //   }
  // }, [isMonthly]);

  return (
    <TimespanContext.Provider value={{
      timespans,
      selectedTimespan, setSelectedTimespan,
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