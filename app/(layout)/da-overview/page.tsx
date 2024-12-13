"use client"
import { useEffect, useState, useMemo } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import DAHeadCharts from "@/components/layout/DA-Overview/DAHeadCharts";
import DATable from "@/components/layout/DA-Overview/DATable";
import useSWR from "swr";
import { DAOverviewURL } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";

export default function DAOverviewPage() {
    const [selectedTimespan, setSelectedTimespan] = useState("365d");
    const [isMonthly, setIsMonthly] = useState(false);

    const {data, error, isLoading, isValidating} = useSWR<DAOverviewResponse>(DAOverviewURL);
   
    const timespans = useMemo(() => {
        let xMax = Date.now();
    
        if (!isMonthly) {
          return {
            "1d": {
              shortLabel: "1d",
              label: "1 day",
              value: 1,
            },
            "7d": {
              shortLabel: "7d",
              label: "7 days",
              value: 7,
              xMin: xMax - 7 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "30d": {
              shortLabel: "30d",
              label: "30 days",
              value: 30,
              xMin: xMax - 30 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "90d": {
              shortLabel: "90d",
              label: "90 days",
              value: 90,
              xMin: xMax - 90 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        } else {
          return {
            "180d": {
              shortLabel: "6m",
              label: "6 months",
              value: 90,
              xMin: xMax - 180 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        }
      }, [isMonthly]);

    return (
      <>
      {data && (
        <>
      
            <TopRowContainer className="-py-[3px]">
                <TopRowParent className="-py-[10px]">
                <TopRowChild
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
                </TopRowChild>
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
            <DAHeadCharts selectedTimespan={selectedTimespan} isMonthly={isMonthly} data={data.data.all_da} />
            <DATable />
          
        </>
      )}
      </>        
    )
}