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
    LineSeries,
    PieSeries,
    Series,
} from "react-jsx-highcharts";
import Highcharts, { chart } from "highcharts/highstock";
import { useLocalStorage } from "usehooks-ts";
import Image from "next/image";
import { useMemo } from "react";
import { useMaster } from "@/contexts/MasterContext";
import "@/app/highcharts.axis.css";
import Icon from "@/components/layout/Icon";
import { DAConsumerChart } from "@/types/api/DAOverviewResponse";
import { stringToDOM } from "million";
import { Any } from "react-spring";
import { format } from "path";

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};

type PieData = { name: string, y: number, color: string }[]
// @/public/da_table_watermark.png

export default function DATableCharts({selectedTimespan, data, isMonthly, da_name, pie_data}: {selectedTimespan: string, data?: any, isMonthly: boolean, da_name: string, pie_data: DAConsumerChart}) {

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


    const allChainsTotal = useMemo(() => {

        let totalArray = [[Number, Number]]
        Object.keys(data.da_consumers).forEach((key) => { 
          
          const values = data.da_consumers[key].daily.values;
          const types = data.da_consumers[key].daily.types;
          const total = values.map((d) => [
            d[types.indexOf("unix")], 
            d[types.indexOf("data_posted")]
          ])
          
        })
    }, [data]);


    const pieFormattedData = useMemo(() => {
        let pieRetData: [string, number][] = []; // Correctly define the type as an array of [string, number] tuples
    
        pie_data.data.forEach((d) => {
            pieRetData.push([d[0], d[4]]); // d[0] is string, d[4] is number
        });
    
        return pieRetData;
    }, [pie_data]);
    

    const formattedPieData = useMemo(() => {
        let pieRetData: PieData = []; // Correctly define the type as an array of [string, number] tuples

        pie_data.data.forEach((d) => {
            pieRetData.push({name: d[0], y: d[4], color: AllChainsByKeys[d[0]] ? AllChainsByKeys[d[0]].colors["dark"][0] : "#566462"}); // d[0] is string, d[4] is number
        });

        return pieRetData;
    }, [pie_data])


    



    return(
        <div className="flex h-full w-full gap-x-[10px]">
            <div className="min-w-[730px] w-full flex flex-1 h-[217px] relative mr-[20px]">
                <div className="absolute left-[calc(50%-113px)] top-[calc(50%-29.5px)]">
                    <Image src="/da_table_watermark.png" alt="chart_watermark" width={226} height={59} />
                </div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "217px",
                                width: "100%",
                                
                                

                                overflow: "visible",
                            },
                        }}
                        plotOptions={{
                            column: {
                                stacking: "normal",

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
                            },
                            area: {
                                stacking: "normal",
                                lineWidth: 2,
                                marker: {
                                    enabled: false,
                                },
                                
                            },
                            series: {
                                zIndex: 10,
                                animation: false,
                                marker: {
                                lineColor: "white",
                                radius: 0,
                                symbol: "circle",
                                },
                            },
                        }}
                    >
                    <Chart
                        backgroundColor={""}
                        type="column"
                        title={"test"}
                        overflow="visible"
                        panning={{ enabled: true }}
                        panKey="shift"
                        zooming={{ type: undefined }}
                        style={{ borderRadius: 15 }}
                        animation={{ duration: 50 }}
                        // margin={[0, 15, 0, 0]} // Use the array form for margin
                        //margin={[15, 21, 15, 0]}
                        marginLeft={40}
                        

                        marginBottom={30}

                        marginTop={2}
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
                            align: undefined,
                            rotation: 0,
                            // allowOverlap: false,
                            // staggerLines: 1,
                            // reserveSpace: true,

                            
                            overflow: "justify",
                            useHTML: true,
                            distance: -14,
                            style: {
                                color: COLORS.LABEL,
                                fontSize: "10px",
                                fontWeight: "550",
                                fontVariant: "small-caps",
                                textTransform: "lowercase",
                                fontFamily: "var(--font-raleway), sans-serif",
                                // fontVariant: "all-small-caps",
                                zIndex: 1000,
                                paddingTop: "22px",
                            },
                            enabled: true,

                            formatter: function () {
                            // Convert Unix timestamp to milliseconds
                            const date = new Date(this.value);
                            // Format the date as needed (e.g., "dd MMM yyyy")
                            const dateString = date
                                .toLocaleDateString("en-GB", {
                                day: !(
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                )
                                    ? "2-digit"
                                    : undefined,
                                month: "short",
                                year:
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                    ? "numeric"
                                    : undefined,
                                })
                                .toUpperCase();

                            return `<span class="font-bold">${dateString}</span>`;
                            },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: COLORS.PLOT_LINE,
                            snap: false,
                        }}
                        zoomEnabled={false}
                 
                        lineWidth={1}
                        
                        
                        startOnTick={true}
                        endOnTick={true}
                        tickAmount={0}

                        tickLength={5}
                        tickWidth={1}
                        // ordinal={true}
                        
                        minorTicks={false}
                        minorTickLength={2}
                        minorTickWidth={2}
                        minorGridLineWidth={0}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
                        // min={
                        //   timespans[selectedTimespan].xMin
                        //     ? newestUnixTimestamp -
                        //       1000 *
                        //         60 *
                        //         60 *
                        //         24 *
                        //         (timespans[selectedTimespan].value - 1)
                        //     : undefined
                        // }
                        min={timespans[selectedTimespan].xMin} // don't include the last day
                        max={timespans[selectedTimespan].xMax}
                        panningEnabled={true}
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
                        align: "right",
                        y: -2,
                        x: -2,
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
                            const types = data.da_consumers[key].daily.types;
                            const name = data.da_consumers[key].daily.values[0][1];
                            
                            return(
                                <AreaSeries
                                    key={key + "-DATableCharts" + da_name} 
                                    name={name} 
                                    visible={data.da_consumers[key].daily.values.length > 0}
                                    
                                    data={data.da_consumers[key].daily.values.map((d) => [
                                        d[types.indexOf("unix")], 
                                        d[types.indexOf("data_posted")]
                                    ])}
                                    color={AllChainsByKeys[key] ? AllChainsByKeys[key].colors["dark"][0] : "#566462"}
                                />
                            )
                        })}

                        
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
            <div className="min-w-[125px] flex flex-col gap-y-[2px] items-start h-full pt-[15px]">
                {/* Chains */}
                {Object.keys(data.da_consumers).map((key, index) => {

                    return(
                        <div key={key + "da_consumers_info"} className="flex gap-x-[2px] px-[5px] bg-[#344240] text-xxs rounded-full py-[2px] items-center">
                            <div>{AllChainsByKeys[data.da_consumers[key].daily.values[0][2]] ? (<Icon icon={`gtp:${AllChainsByKeys[data.da_consumers[key].daily.values[0][2]].urlKey}-logo-monochrome`} className="w-[12px] h-[12px]" style={{ color: AllChainsByKeys[key].colors["dark"][0] }} />) : (<div>{"+"}</div>)}</div>
                            <div>{data.da_consumers[key].daily.values[0][1]}</div>

                        </div>
                    )
                })}
            </div>
            <div className="min-w-[254px] flex items-center  relative ">
                {/* Pie Chart */}
                <div className="absolute left-[21%] w-[99px] flex items-center justify-center bottom-[52%] text-xxs font-semibold ">{"% OF TOTAL USAGE"}</div>
                <HighchartsProvider Highcharts={Highcharts}>
                    <HighchartsChart                             
                        containerProps={{
                            style: {
                                height: "254px",
                                width: "200px",
                                
                                

                                overflow: "visible",
                            },
                        }}
                        plotOptions={{
                            pie: {
                                allowPointSelect: true,
                                cursor: "pointer",
                                dataLabels: {
                                    enabled: true,
                                    format: "<b>{point.name}</b>: {point.percentage:.1f} %",
                                },
                                showInLegend: true,
                                borderWidth: 10,
                                borderColor: "transparent",
                            }
                        }}
                    >
                    <Chart
                        backgroundColor={""}
                        type="column"
                        title={"test"}
                        overflow="visible"
                        panning={{ enabled: true }}
                        panKey="shift"
                        zooming={{ type: undefined }}
                        style={{ borderRadius: 15 }}
                        animation={{ duration: 50 }}
                        // margin={[0, 15, 0, 0]} // Use the array form for margin
                        //margin={[15, 21, 15, 0]}
                        

                        marginBottom={30}

                        marginTop={2}
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
                            align: undefined,
                            rotation: 0,
                            // allowOverlap: false,
                            // staggerLines: 1,
                            // reserveSpace: true,

                            
                            overflow: "justify",
                            useHTML: true,
                            distance: -14,
                            style: {
                                color: COLORS.LABEL,
                                fontSize: "10px",
                                fontWeight: "550",
                                fontVariant: "small-caps",
                                textTransform: "lowercase",
                                fontFamily: "var(--font-raleway), sans-serif",
                                // fontVariant: "all-small-caps",
                                zIndex: 1000,
                                paddingTop: "22px",
                            },
                            enabled: true,

                            formatter: function () {
                            // Convert Unix timestamp to milliseconds
                            const date = new Date(this.value);
                            // Format the date as needed (e.g., "dd MMM yyyy")
                            const dateString = date
                                .toLocaleDateString("en-GB", {
                                day: !(
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                )
                                    ? "2-digit"
                                    : undefined,
                                month: "short",
                                year:
                                    timespans[selectedTimespan].value >= 90 ||
                                    selectedTimespan === "max"
                                    ? "numeric"
                                    : undefined,
                                })
                                .toUpperCase();

                            return `<span class="font-bold">${dateString}</span>`;
                            },
                        }}
                        crosshair={{
                            width: 0.5,
                            color: "transparent",
                            snap: false,

                        }}
                        zoomEnabled={false}
                 
                        lineWidth={1}
                        
                        
                        startOnTick={true}
                        endOnTick={true}
                        tickAmount={0}

                        tickLength={5}
                        tickWidth={1}
                        // ordinal={true}
                        
                        minorTicks={false}
                        minorTickLength={2}
                        minorTickWidth={2}
                        minorGridLineWidth={0}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
                        // min={
                        //   timespans[selectedTimespan].xMin
                        //     ? newestUnixTimestamp -
                        //       1000 *
                        //         60 *
                        //         60 *
                        //         24 *
                        //         (timespans[selectedTimespan].value - 1)
                        //     : undefined
                        // }
                        min={timespans[selectedTimespan].xMin} // don't include the last day
                        max={timespans[selectedTimespan].xMax}
                        panningEnabled={true}
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
                        align: "right",
                        y: -2,
                        x: -2,
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
                            <PieSeries
                                key={`${"Pie"}-DATableCharts-${da_name}`}
                                name={"Pie Chart"}
                                innerSize={"95%"}
                                dataLabels={{
                                    enabled: false,
                                }}
                                type="pie"
                                data={formattedPieData}
                                
                            /> 
                    </YAxis>                     
                        
                    </HighchartsChart>

                </HighchartsProvider>
            </div>
        </div>
    )
}