"use client";
import React, { memo, useMemo, createContext, useContext, useEffect, useState } from "react";
import ChainComponent from "@/components/charts/ChainComponent";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { LandingURL } from "@/lib/urls";
import { navigationItems } from "@/lib/navigation";
import { metricItems } from "@/lib/metrics";

import "@splidejs/splide/css";
import { track } from "@vercel/analytics/react";
import { MasterURL } from "@/lib/urls";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { SplideSlide, SplideTrack } from "@splidejs/react-splide";
import { useLocalStorage } from "usehooks-ts";
import useAsyncStorage from "@/hooks/useAsyncStorage";

// Create a context to manage staggered chart updates
type FocusContextType = {
  currentUpdateIndex: number;
  focusValue: boolean;
  registerChart: (id: number, callback: () => void) => void;
  unregisterChart: (id: number) => void;
};

const FocusContext = createContext<FocusContextType>({
  currentUpdateIndex: -1,
  focusValue: false,
  registerChart: () => {},
  unregisterChart: () => {}
});

// Provider component to manage staggered updates
function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusEnabled] = useAsyncStorage("focusEnabled", true);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(-1);
  const [lastFocusValue, setLastFocusValue] = useState(focusEnabled);
  const chartCallbacks = React.useRef<Map<number, () => void>>(new Map());
  
  // When focusEnabled changes, start the staggered update process
  useEffect(() => {
    if (focusEnabled !== lastFocusValue) {
      setLastFocusValue(focusEnabled);
      setCurrentUpdateIndex(0);
    }
  }, [focusEnabled, lastFocusValue]);
  
  // When currentUpdateIndex changes, update the next chart after a short delay
  useEffect(() => {
    if (currentUpdateIndex >= 0 && currentUpdateIndex < chartCallbacks.current.size) {
      // Find the callback for the current index
      const callback = chartCallbacks.current.get(currentUpdateIndex);
      if (callback) {
        callback();
      }
      
      // Schedule the next update
      const timer = setTimeout(() => {
        setCurrentUpdateIndex(prev => prev + 1);
      }, 50); // 50ms between chart updates
      
      return () => clearTimeout(timer);
    }
  }, [currentUpdateIndex]);
  
  const registerChart = (id: number, callback: () => void) => {
    chartCallbacks.current.set(id, callback);
  };
  
  const unregisterChart = (id: number) => {
    chartCallbacks.current.delete(id);
  };
  
  return (
    <FocusContext.Provider 
      value={{ 
        currentUpdateIndex, 
        focusValue: focusEnabled,
        registerChart,
        unregisterChart
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

// Custom hook to use the focus context
function useFocusUpdate(chartId: number) {
  const context = useContext(FocusContext);
  const [shouldUpdate, setShouldUpdate] = useState(true);
  const [focusEnabled] = useAsyncStorage("focusEnabled", true);
  
  useEffect(() => {
    const updateCallback = () => {
      setShouldUpdate(true);
    };
    
    context.registerChart(chartId, updateCallback);
    
    return () => {
      context.unregisterChart(chartId);
    };
  }, [chartId, context]);
  
  useEffect(() => {
    // Reset shouldUpdate when a new cycle begins
    if (context.currentUpdateIndex === 0) {
      setShouldUpdate(false);
    }
  }, [context.currentUpdateIndex]);
  
  return { 
    focusEnabled,
    shouldUpdate: shouldUpdate || context.currentUpdateIndex === -1
  };
}

const SwiperItem = memo(({ metric_id, landing, master, chartId }: { metric_id: string, landing: any, master: MasterResponse, chartId: number }) => {
  const { focusEnabled, shouldUpdate } = useFocusUpdate(chartId);

  const urlKey =
  metricItems[metricItems.findIndex((item) => item.key === metric_id)]
    ?.urlKey;
    
  const chartComponent = useMemo(() => {
    if (!master || !landing) return null;
    
    return (
      <ChainComponent
        data={landing.data.all_l2s}
        ethData={landing.data.ethereum}
        focusEnabled={focusEnabled}
        chain={"all_l2s"}
        category={metric_id}
        selectedTimespan={"max"}
        selectedScale="linear"
        master={master}
        xMin={landing.data.all_l2s.metrics[metric_id].daily.data[0][0]}
      />
    );
  }, [landing, master, metric_id, focusEnabled]);

  const linkComponent = useMemo(() => {
    return (
      <Link
        className="flex space-x-2 items-center opacity-0 py-1.5 pl-[20px] text-xs md:text-base transition-all duration-300 -translate-y-10 group-hover:translate-y-0 group-hover:opacity-100 delay-[1000ms] group-hover:delay-[0ms] -z-10"
        href={`/fundamentals/${urlKey}`}
        onClick={() => {
          track("clicked Compare link", {
            location: `landing top chart - ${metric_id}`,
            page: window.location.pathname,
          });
        }}
      >
        Breakdown{" "}
        <Icon icon="feather:chevron-right" className="w-4 h-4 md:w-6 md:h-6" />{" "}
      </Link>
    );
  }, [metric_id, urlKey]);

  return (
    <>
      {chartComponent}
      {linkComponent}
    </>
  );
});

SwiperItem.displayName = "SwiperItem";

export default function LandingSwiperItems() {
  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<any>(LandingURL);

  const { data: master, error: masterError } =
    useSWR<MasterResponse>(MasterURL);

  const metricIds = useMemo(() => 
    ["txcount", "stables_mcap", "fees", "rent_paid", "market_cap"], 
    []
  );

  return (
    <FocusProvider>
      <SplideTrack>
        {metricIds.map(
          (metric_id, index) => (
            <SplideSlide key={metric_id}>
              <div
                className="group w-full chain relative"
              >
                {landing && master ? (
                  <SwiperItem 
                    metric_id={metric_id} 
                    landing={landing} 
                    master={master} 
                    chartId={index}
                  />
                ) : (
                  <div className="w-full h-[145px] md:h-[176px] rounded-[15px]  bg-forest-50 dark:bg-[#1F2726]">
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="w-8 h-8 border-[5px] border-forest-500/30 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                )}
              </div>
            </SplideSlide>
          ),
        )}
      </SplideTrack>
    </FocusProvider>
  );
}
