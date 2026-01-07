"use client";
import { createContext, useContext, useState } from "react";

export type ChartScaleContextType = {
  selectedScale: string;
  setSelectedScale: (value: string) => void;
  scaleDefs: {
    [key: string]: {
      label: string;
      value: string;
    }
  };
  selectedYAxisScale: string;
  setSelectedYAxisScale: (value: string) => void;
}

export const ChartScaleContext = createContext<ChartScaleContextType | undefined>(undefined);

type ChartScaleProviderProps = {
  children: React.ReactNode;
  scaleDefs: {
    [key: string]: {
      label: string;
      value: string;
    }
  };
  log_default?: boolean;
}

export const ChartScaleProvider = ({ children, scaleDefs, log_default = false }: ChartScaleProviderProps) => {
  
  const [selectedScale, setSelectedScale] = useState<string>(Object.keys(scaleDefs)[0]);
  const [selectedYAxisScale, setSelectedYAxisScale] = useState(log_default ? "logarithmic" : "linear");

  return (
    <ChartScaleContext.Provider value={{
      selectedScale,
      setSelectedScale,
      scaleDefs,
      selectedYAxisScale,
      setSelectedYAxisScale,
    }}>
      {children}
    </ChartScaleContext.Provider>
  );
}

export const useChartScale = () => {
  const context = useContext(ChartScaleContext);
  if (context === undefined) {
    throw new Error("useApplicationsData must be used within a ApplicationsDataProvider");
  }
  return context;
}