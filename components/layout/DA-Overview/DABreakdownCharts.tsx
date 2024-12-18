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

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};

// @/public/da_table_watermark.png

export default function DABreakdownCharts({selectedTimespan, data}: {selectedTimespan: string, data?: any}){

    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

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
                                pointPadding: 0.2,
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
                        margin={[15, 21, 15, 0]}
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
                        tickWidth={0}
                        tickLength={20}
                        ordinal={false}
                        minorTicks={false}
                        minorTickInterval={1000 * 60 * 60 * 24 * 1}
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
                        <ColumnSeries data={[[0, 5], [10, 15], [20, 45], [30, 50], [40, 65]]} />
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