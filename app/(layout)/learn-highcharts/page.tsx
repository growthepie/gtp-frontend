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



export default function Page(){
    const { data: chainOverviewData, 
            error: chainOverviewError, 
            isLoading: chainOverviewLoading, 
            isValidating: chainOverviewValidating } 
    = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

    const x = true

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    

    

   
    return (
        <Container>
            <div className={``}>Text </div>
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
                    <Tooltip></Tooltip>
                    <YAxis><LineSeries name="Gas fees eth"  color={"#FF0420"} data={chainOverviewData?.data.chains["all_l2s"].daily["cefi"].data.map(
                                  (d: any) => [
                                    d[0],
                                    showUsd ? d[2] : d[1], // 1 = ETH 2 = usd
                                  ],
                                )} /></YAxis>
                    <XAxis></XAxis>
                    <Title>Chart Ex</Title>
                    
                </HighchartsChart>
            </HighchartsProvider>
        </Container>
    )
}