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
import { Metrics } from "@/types/api/MasterResponse";

// export interface Metrics {
//   [metric: string]: MetricDef;
// }

// export interface MetricDef {
//   name:                 string;
//   name_short:           string;
//   metric_keys:         string[];
//   units:                { [key: string]: Unit };
//   category:             string;
//   currency:             boolean;
//   priority:             number;
//   invert_normalization: boolean;
//   icon:                 string;
// }

// export interface Unit {
//   currency:         boolean;
//   prefix:           string;
//   suffix:           null;
//   decimals:         number;
//   decimals_tooltip: number;
//   agg:              boolean;
//   agg_tooltip:      boolean;
// }

// const metricsDef: Metrics = {
//   gas_fees: {
//     name: "Fees Paid",
//     name_short: "Gas Fees",
//     metric_keys: [
//       "fees_paid_usd",
//       "fees_paid_eth"
//     ],
//     units: {
//       usd: {
//         currency: true,
//         prefix: "$",
//         suffix: null,
//         decimals: 0,
//         decimals_tooltip: 2,
//         agg: true,
//         agg_tooltip: true,
//       },
//       eth: {
//         currency: false,
//         prefix: "Ξ",
//         suffix: null,
//         decimals: 0,
//         decimals_tooltip: 2,
//         agg: true,
//         agg_tooltip: true,
//       },
//     },
//     icon: "gtp-metrics-transactioncosts",
//     category: "Gas Fees",
//     currency: true,
//     priority: 1,
//     invert_normalization: false,
//   },
//   txcount: {
//     name: "Transaction Count",
//     name_short: "Transactions",
//     units: {
//       value: {
//         currency: false,
//         prefix: "",
//         suffix: null,
//         decimals: 0,
//         decimals_tooltip: 0,
//         agg: true,
//         agg_tooltip: true,
//       },
//     },
//     icon: "gtp-metrics-transactioncount",
//     category: "Transactions",
//     currency: false,
//     priority: 2,
//     invert_normalization: false,
//   },
//   daa: {
//     name: "Daily Active Addresses",
//     name_short: "DAAs",
//     units: {
//       value: {
//         currency: false,
//         prefix: "",
//         suffix: null,
//         decimals: 0,
//         decimals_tooltip: 0,
//         agg: true,
//         agg_tooltip: true,
//       },
//     },
//     icon: "gtp-metrics-activeaddresses",
//     category: "Addresses",
//     currency: false,
//     priority: 3,
//     invert_normalization: false,
//   },
// };

const metricIcons = {
  gas_fees: "gtp-metrics-transactioncosts",
  txcount: "gtp-metrics-transactioncount",
  daa: "gtp-metrics-activeaddresses",
};


export type MetricsContextType = {
  metricsDef: Metrics;
  metricIcons: { [key: string]: string };
  selectedMetrics: string[];
  setSelectedMetrics: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMetricKeys: string[];
}

export const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export const MetricsProvider = ({ children }: { children: React.ReactNode }) => {
  const {data: masterData} = useMaster();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(masterData ? [...Object.keys(masterData.app_metrics).slice(0,1)] : ["gas_fees"]);

  const selectedMetricKeys = useMemo(() => {
    return selectedMetrics.map((metric) => {
      if(metric === "gas_fees")
        return showUsd ? "gas_fees_usd" : "gas_fees_eth";
      return metric;
    });
  }, [selectedMetrics, showUsd]);

  return (
    <MetricsContext.Provider value={{
      metricsDef: masterData ? masterData.app_metrics : {},
      metricIcons,
      selectedMetrics: masterData ? Object.keys(masterData.app_metrics).filter((metric) => selectedMetrics.includes(metric)) : ["gas_fees"],
      setSelectedMetrics,
      selectedMetricKeys,
    }}>
      {children}
    </MetricsContext.Provider>
  );
}

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}