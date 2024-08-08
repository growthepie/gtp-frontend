"use client";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { createContext, useContext, useState } from "react";
import useSWR from "swr";
import ShowLoading from "@/components/layout/ShowLoading";

type MasterContextType = {
  data: MasterResponse;
  formatMetric: (value: number, unit: string, unitType?: string) => string;
};

const MasterContext = createContext<MasterContextType | null>({
  data: {} as MasterResponse,
  formatMetric: () => "MasterProvider: formatMetric not found",
});

export const MasterProvider = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading, error } = useSWR<MasterResponse>(MasterURL);

  const formatMetric = (
    value: number,
    metric: string,
    unitType: string = "value",
  ) => {
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

    const {
      currency,
      prefix,
      suffix,
      decimals,
      decimals_tooltip,
      agg,
      agg_tooltip,
    } = unit;

    return `${prefix || ""}${value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix || ""}`;
  };

  if (error) return <div>Failed to load</div>;
  if (!data)
    return (
      <div>
        <ShowLoading dataLoading={[isLoading]} />
      </div>
    );

  return (
    <MasterContext.Provider value={{ data, formatMetric }}>
      {children}
    </MasterContext.Provider>
  );
};

export const useMaster = () => {
  const ctx = useContext(MasterContext);

  if (!ctx) {
    throw new Error("useMaster must be used within a MasterProvider");
  }

  return ctx;
};
