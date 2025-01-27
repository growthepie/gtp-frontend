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

export default function Controls() {
  const { data, metricsDef, selectedMetrics, setSelectedMetrics, sort, setSort, selectedTimespan, setSelectedTimespan, isMonthly, setIsMonthly, timespans } = useApplicationsData();


  return (
    <>
      {data && (
          <TopRowContainer className="">
            <TopRowParent className="">
              {/* <TopRowChild
                isSelected={!isMonthly}
                onClick={() => {
                  const isTransferrableTimespan =
                    selectedTimespan === "max" || selectedTimespan === "365d";
                  if (!isTransferrableTimespan) {
                    setSelectedTimespan("max");
                  }
                  setIsMonthly(false);
                }}
                style={{
                  paddingTop: "10.5px",
                  paddingBottom: "10.5px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                }}
              >
                {"Daily"}
              </TopRowChild>
              <TopRowChild
                isSelected={isMonthly}
                onClick={() => {
                  const isTransferrableTimespan =
                    selectedTimespan === "max" || selectedTimespan === "365d";
                  if (!isTransferrableTimespan) {
                    setSelectedTimespan("max");
                  }
                  setIsMonthly(true);
                }}
                style={{
                  paddingTop: "10.5px",
                  paddingBottom: "10.5px",
                  paddingLeft: "16px",
                  paddingRight: "16px",
                }}
              >
                {"Monthly"}
              </TopRowChild> */}
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
                      className={`px-[10px]`}
                      onClick={() => {
                        setSelectedTimespan(key);
                      }}
                      key={key}
                      style={{
                        paddingTop: "10.5px",
                        paddingBottom: "10.5px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                      }}
                      isSelected={selectedTimespan === key}
                    >
                      {selectedTimespan === key
                        ? timespans[key].label
                        : timespans[key].shortLabel}
                    </TopRowChild>
                  );
                }
              })}
            </TopRowParent>
          </TopRowContainer>
      
      )}
    </>
  )
}