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
}

export const ChartScaleProvider = ({ children, scaleDefs }: ChartScaleProviderProps) => {
  
  const [selectedScale, setSelectedScale] = useState<string>(Object.keys(scaleDefs)[0]);

  return (
    <ChartScaleContext.Provider value={{
      selectedScale,
      setSelectedScale,
      scaleDefs,
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