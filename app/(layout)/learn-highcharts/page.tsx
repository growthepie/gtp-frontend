"use client"
import Container from "@/components/layout/Container"
import { useState } from "react";
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

      //are these set somewhere already - how would I have found and used them here instead of hardcoding?
    const dateRanges = { //co pilot helped with this - do I need to minus an extra day?
        "7d": [new Date().setDate(new Date().getDate() - 8), new Date().setDate(new Date().getDate() - 1)],
        "30d": [new Date().setDate(new Date().getDate() - 31), new Date().setDate(new Date().getDate() - 1)],
        "180d": [new Date().setDate(new Date().getDate() - 181), new Date().setDate(new Date().getDate() - 1)],
        // "max": [0, new Date().setDate(new Date().getDate() - 1)]
        "max": [new Date().setDate(new Date().getDate() - 1091), new Date().setDate(new Date().getDate() + 40)]// Why is it shifting? 
    };

    const dateRange = dateRanges[selectedTimespan];
 
    const handleTimespanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTimespan(event.target.value);
    };

    

   
    return (
        <Container>
            <div className={``}>Days </div>
            <select value={selectedTimespan} onChange={handleTimespanChange}>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="180d">180 Days</option>
                <option value="max">Max</option>
            </select>
            <HighchartsProvider Highcharts={Highcharts}>
                <HighchartsChart
                    containerProps={{
                    style: {
                        height: "197px",
                        width: "100%",
                        marginLeft: "auto",
                        marginRight: "auto",
                        position: "absolute",

                        overflow: "visible",
                    },
                    }}
                    
                >
                    <Chart 
                        backgroundColor={"transparent"}
                        type="line"
                        title={"test"}
                        
                    />
                    <YAxis><LineSeries name="Gas fees eth"  color={"#FF0420"} data={chainOverviewData?.data.chains["all_l2s"].daily["cefi"].data.map(
                        (d: any) => [
                        d[0],
                        showUsd ? d[2] : d[1], // 1 = ETH 2 = USD
                        ],
                    )} />
                    </YAxis>
                    <XAxis
                        type="datetime"
                        min={dateRange[0]}
                        max={dateRange[1]}
                    >
                    </XAxis>
                    <Tooltip
                    style={
                        { color: '#FFFFFF', padding: '10px' }
                    }
                    backgroundColor="#1b2135"
                    borderRadius={15}
                    ></Tooltip>
                    <Title>Chart Ex</Title>
                    
                </HighchartsChart>
            </HighchartsProvider>
        </Container>
    );
}