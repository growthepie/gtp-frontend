"use client";
import { useSearchParams } from "next/navigation";
import {  createContext, useContext, useState } from "react";

export type SortContextType = {
  sort: {
    metric: string;
    sortOrder: string;
  };
  setSort: React.Dispatch<React.SetStateAction<{ metric: string; sortOrder: string; }>>;
}

export const SortContext = createContext<SortContextType | undefined>(undefined);

type SortProviderProps = {
  children: React.ReactNode;
  defaultKey?: string;
  defaultOrder?: string;
}

export const SortProvider = ({ children, defaultKey, defaultOrder }: SortProviderProps) => {
  const searchParams = useSearchParams();

  const metricsParam = searchParams.get("metric") || defaultKey;
  const sortMetricParam = metricsParam ? metricsParam.split(",") : [defaultKey];


  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({ 
    metric: sortMetricParam[0] || defaultKey || "txcount",
    sortOrder: defaultOrder || "desc",
  });

  return (
    <SortContext.Provider value={{
      sort,
      setSort,
    }}>
      {children}
    </SortContext.Provider>
  );
}

export const useSort = () => {
  const context = useContext(SortContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}