"use client";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { createContext, useContext, useState } from "react";
import useSWR from "swr";

type MasterContextType = {
  data: MasterResponse | undefined;
  formatMetric: (value: number, unit: string) => string;
};

const MasterContext = createContext<MasterContextType | null>({
  data: undefined,
  formatMetric: () => "MasterProvider: formatMetric not found",
});

export const MasterProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR<MasterResponse>(MasterURL);

  const formatMetric = (value: number, metric: string, unitType: string = "value") => {

    if (metric === "gas_fees_usd") {
      metric = "fees";
      unitType = "usd";
    }

    if (!data) {
      return `MasterProvider: data not found`;
    }

    const metricInfo = data.metrics[metric];

    if (!metricInfo) {
      return `MasterProvider: metricInfo not found: ${metric}`;
    }

    const unit = metricInfo.units[unitType];

    if (!unit) {
      return `MasterProvider: unitType not found: ${unitType}`;
    }

    const { currency, prefix, suffix, decimals, decimals_tooltip, agg, agg_tooltip } = unit;

    return `${prefix || ""}${value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix || ""}`;
  }


  return (
    <MasterContext.Provider
      value={{ data, formatMetric }}
    >
      {data && !isLoading ? children : null}
    </MasterContext.Provider>
  );
};

export const useMaster = () => {
  const ctx = useContext(MasterContext);

  if (!ctx) {
    throw new Error(
      "useMaster must be used within a MasterProvider",
    );
  }

  return ctx;
};