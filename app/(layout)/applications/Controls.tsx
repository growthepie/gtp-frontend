"use client"
import { useEffect, useState, useMemo } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import DAHeadCharts from "@/components/layout/DA-Overview/DAHeadCharts";
import DATable from "@/components/layout/DA-Overview/DATable";
import useSWR from "swr";
import { DAOverviewURL } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";
import Container from "@/components/layout/Container";
import { useApplicationsData } from "./ApplicationsDataContext";
import { MultipleSelectTopRowChild } from "./Components";
import { useTimespan } from "./TimespanContext";
import { useMetrics } from "./MetricsContext";
import { useSort } from "./SortContext";

export default function Controls() {
  const { sort, setSort } = useSort();
  const { metricsDef, selectedMetrics, setSelectedMetrics } = useMetrics();
  const { selectedTimespan, setSelectedTimespan, timespans } = useTimespan();


  return (
    <>
      <TopRowContainer className="gap-y-[10px] rounded-t-[15px] rounded-b-[24px] flex-col-reverse">
        <TopRowParent className="">

          <MultipleSelectTopRowChild 
          handleNext={() => {
            const metrics = Object.keys(metricsDef);
            const index = metrics.indexOf(selectedMetrics[0]);
            const newIndex = (index + 1) % metrics.length;
        
            if(sort.metric === selectedMetrics[0]){
              setSort({...sort, metric: metrics[newIndex]});
            }
        
            setSelectedMetrics([metrics[newIndex]]);
          }}
          handlePrev={() => {
            const metrics = Object.keys(metricsDef);
            const index = metrics.indexOf(selectedMetrics[0]);
            const newIndex = index === 0 ? metrics.length - 1 : index - 1;
        
            if(sort.metric === selectedMetrics[0]){
              setSort({...sort, metric: metrics[newIndex]});
            }
        
            setSelectedMetrics([metrics[newIndex]]);
          }}
          options={Object.keys(metricsDef).map((key) => {
            return {
              key,
              name: metricsDef[key].name,
              icon: metricsDef[key].icon,
            };
          })}
          selected={selectedMetrics}
          setSelected={setSelectedMetrics}
          />

        </TopRowParent>
        <TopRowParent className="-py-[10px]">
          {Object.keys(timespans).map((key) => {
            {
              return (
                <TopRowChild
                  className="flex items-center justify-center h-[28px] md:h-[44px]"
                  onClick={() => {
                    setSelectedTimespan(key);
                  }}
                  isSelected={selectedTimespan === key}
                >
                  {/* {selectedTimespan === key
                    ? timespans[key].label
                    : timespans[key].shortLabel} */}
                    {timespans[key].shortLabel}
                </TopRowChild>
              );
            }
          })}
        </TopRowParent>
      </TopRowContainer>
      
    </>
  )
}