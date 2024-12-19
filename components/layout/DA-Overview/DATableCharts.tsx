"use client";
import {
    HighchartsProvider,
    HighchartsChart,
    Chart,
    XAxis,
    YAxis,
    Title,
    Tooltip,
    PlotBand,
    AreaSeries,
    ColumnSeries,
} from "react-jsx-highcharts";
import Highcharts, { chart } from "highcharts/highstock";
import { useLocalStorage } from "usehooks-ts";
import Image from "next/image";
import { useMemo } from "react";
import { useMaster } from "@/contexts/MasterContext";

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};

// @/public/da_table_watermark.png

export default function DATableCharts({selectedTimespan, data, isMonthly, da_name}: {selectedTimespan: string, data?: any, isMonthly: boolean, da_name: string}) {

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const { AllDALayersByKeys, AllChainsByKeys } = useMaster();
    

    const timespans = useMemo(() => {

        let xMax = 0;
        Object.keys(data.da_consumers).forEach((key) => { 
          
          const values = data.da_consumers[key].daily.values;
          const types = data.da_consumers[key].daily.types;
      
          if(values[0][types.indexOf("unix")] > xMax){
            xMax = values[0][types.indexOf("unix")];
          }
        })

    
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
      }, [isMonthly, data, selectedTimespan]);




    return(
        <div className="flex h-full">
            <div className="min-w-[700px] flex flex-1 h-[217px] relative">
                <div className="absolute left-[calc(50%-113px)] top-[calc(50%-29.5px)]">
                    <Image src="/da_table_watermark.png" alt="chart_watermark" width={226} height={59} />
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "217px",
                                width: "100%",
                                marginLeft: "auto",
                                marginRight: "auto",
                                

                                overflow: "visible",
                            },
                        }}
                        plotOptions={{
                            column: {
                                stacking: "normal",
                                groupPadding: 0.1,
                                pointWidth: 1,
                                borderWidth: 0,
                                color: {
                                    linearGradient: {
                                        x1: 0,
                                        y1: 1,
                                        x2: 0,
                                        y2: 0 // Adjust this for vertical or diagonal gradients if needed
                                    },
                                    stops: [
                                        [0, '#FE5468'], // 0% color
                                        [1, '#FFDF27']  // 100% color
                                    ]
                                }
                            }
                        }}
                    >
                    <Chart
                        backgroundColor={"transparent"}
                        type="area"
                        title={"test"}
                        panning={{ enabled: true }}
                        panKey="shift"
                        zooming={{ type: undefined }}
                        style={{ borderRadius: 15 }}
                        animation={{ duration: 50 }}
                        // margin={[0, 15, 0, 0]} // Use the array form for margin
                        //margin={[15, 21, 15, 0]}
                    
                        spacingBottom={0}
                        spacingTop={40}
                        spacingLeft={10}
                        spacingRight={10} 
                    />
                    <Tooltip
                        useHTML={true}
                        shared={true}
                        split={false}
                        followPointer={true}
                        followTouchMove={true}
                        backgroundColor={"#2A3433EE"}
                        padding={0}
                        hideDelay={300}
                        stickOnContact={true}
                        shape="rect"
                        borderRadius={17}
                        borderWidth={0}
                        outside={true}
                        shadow={{
                            color: "black",
                            opacity: 0.015,
                            offsetX: 2,
                            offsetY: 2,
                        }}
                        style={{
                            color: "rgb(215, 223, 222)",
                        }}
                    
                        // ensure tooltip is always above the chart
                        //positioner={tooltipPositioner}
                        valuePrefix={showUsd ? "$" : ""}
                        valueSuffix={showUsd ? "" : " Gwei"}
                    />
                    <XAxis
                        title={undefined}
                        type="datetime"
                        labels={{
                            useHTML: true,
                            style: {
                            color: COLORS.LABEL,
                            fontSize: "10px",
                            fontFamily: "var(--font-raleway), sans-serif",
                            zIndex: 1000,
                            },
                            enabled: true,
                            formatter: (item) => {
                            const date = new Date(item.value);
                            const isMonthStart = date.getDate() === 1;
                            const isYearStart =
                                isMonthStart && date.getMonth() === 0;
                            if (isYearStart) {
                                return `<span style="font-size:14px;">${date.getFullYear()}</span>`;
                            } else {
                                return `<span style="">${date.toLocaleDateString(
                                "en-GB",
                                {
                                    year: "numeric",
                                    month: "short",
                                },
                                )}</span>`;
                            }
                            },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: COLORS.PLOT_LINE,
                            snap: false,
                        }}
                        tickmarkPlacement="on"
                        tickWidth={4}
                        tickLength={20}
                        ordinal={false}
                        minorTicks={true}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
                        min={timespans[selectedTimespan].xMin}
                        max={timespans[selectedTimespan].xMax}
                    ></XAxis>
                    <YAxis
                    opposite={false}
                    type="linear"
                    gridLineWidth={0}
                    gridLineColor={"#5A64624F"}
                    showFirstLabel={false}
                    showLastLabel={false}
                    tickAmount={5}
                    labels={{
                        align: "left",
                        y: -2,
                        x: 2,
                
                        

                        style: {
                            backgroundColor: "#1F2726",
                            whiteSpace: "nowrap",
                            color: "rgb(215, 223, 222)",
                            fontSize: "9px",
                            fontWeight: "600",
                            fontFamily: "var(--font-raleway), sans-serif",
                        },
                        // formatter: function (
                        // t: Highcharts.AxisLabelsFormatterContextObject,
                        // ) {
                        //   return formatNumber(metricKey, t.value);
                        // },
                    }}
                    min={0}
                    
                    >
                        {Object.keys(data.da_consumers).map((key, index) => {
                           
                            return(
                                <ColumnSeries 
                                    key={key + "-DATableCharts" + da_name} name={key} 
                                    color={AllChainsByKeys[key] ? AllChainsByKeys[key].colors["dark"][0] : "FF0420"} 
                                    data={data.da_consumers[key].daily.values.map((d) => [d[4], d[3]])}
                                    
                                />
                            )
                        })}

                        
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
            <div className="min-w-[125px]">
                {/* Chains */}
                Fill test 
            </div>
            <div className="min-w-[254px] flex">
                {/* Pie Chart */}
                Fill test 
            </div>
        </div>
    )
}