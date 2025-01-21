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

export default function Controls() {
  const { data, selectedTimespan, setSelectedTimespan, isMonthly, setIsMonthly, timespans } = useApplicationsData();


  return (
    <>
      {data && (
          <TopRowContainer className="">
            <TopRowParent className="">
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
      
      )}
    </>
  )
}