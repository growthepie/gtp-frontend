"use client"
import Container from "@/components/layout/Container"
import { useState, useMemo } from "react";
import {
    HighchartsProvider,
    HighchartsChart,
    Chart,
    XAxis,
    YAxis,
    Title,
    Tooltip,
    PlotBand,
    LineSeries,
} from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";
import useSWR from "swr";
import { BlockspaceURLs } from "@/lib/urls";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import { useEffect } from "react"; // not sure if this is needed
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import { time } from "console";





export default function Page(){
    const { data: chainOverviewData, 
            error: chainOverviewError, 
            isLoading: chainOverviewLoading, 
            isValidating: chainOverviewValidating } 
    = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

    const x = true

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

    const [selectedTimespan, setSelectedTimespan] = useSessionStorage( //is this setting to max by default?
        "blockspaceTimespan",
        "max",
    );
    useEffect(() => { // not sure if this is needed? if defualt is max?
        if (selectedTimespan === "1d") {
          setSelectedTimespan("7d");
        }
      }, []);
    const timespans = useMemo(() => {
    let xMax = Date.now();

    
        return {
        "1d": {
            shortLabel: "1d",
            label: "1 day",
            value: 1,
            xMin: xMax - 1 * 24 * 60 * 60 * 1000,
            xMax: xMax,
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
        
      }, []);



   

    

   
    return (
        <Container>
            <TopRowContainer>
                <TopRowParent>
                   {Object.keys(timespans).map((timespan) => (
                        <TopRowChild
                            isSelected={selectedTimespan === timespan}
                            key={timespan}
                            onClick={() => setSelectedTimespan(timespan)}
                            className={`${selectedTimespan === timespan ? "selected" : ""}`}
                        >
                            {timespans[timespan].shortLabel}
                        </TopRowChild>
                    ))}
                </TopRowParent>
            </TopRowContainer>
            <HighchartsProvider Highcharts={Highcharts}>
                <HighchartsChart
                    containerProps={{
                    style: {
                        height: "197px",
                        width: "100%",
                        marginLeft: "auto",
                        marginRight: "auto",
                        position: "relative",

                        overflow: "visible",
                    },
                    }}
                    
                >
                    <Chart 
                        backgroundColor={"transparent"}
                        type="line"
                        title={"test"}
                        
                    />
                    <YAxis><LineSeries 
                        name="All L2s"  
                        color={"#FF0420"} 
                        data={chainOverviewData?.data.chains["all_l2s"].daily["cefi"].data.map(
                        (d: any) => [
                        d[0],
                        showUsd ? d[2] : d[1], // 1 = ETH 2 = USD
                        ],
                    )} />
                    </YAxis>
                    <XAxis
                        type="datetime"
                        min={timespans[selectedTimespan].xMin}
                        max={timespans[selectedTimespan].xMax}
                    >
                    </XAxis>
                    <Tooltip
                        useHTML={true}
                        backgroundColor="rgba(31, 39, 38, 0.65)"
                        borderRadius={15}
                        style={{ color: '#FFFFFF', padding: '10px' }}
                        formatter={function () {
                            return `<div class="p-4 flex flex-col gap-y-[10px]">
                                        <b style="font-size: 16px;">${(new Date(Number (this.x)).toLocaleDateString())}</b><br/> 
                                        ${this.series.name}: ${this.y}<br/>
                                        <div class="w-[100%] h-[5px] mt-[10px]" style="background-color: ${this.color}"></div>
                                    </div>`;
                        }}
                    />
                    <Title>Chart Ex</Title>
                    
                </HighchartsChart>
            </HighchartsProvider>
        </Container>
    );
}