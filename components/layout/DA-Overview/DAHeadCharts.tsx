"use client"
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
} from "react-jsx-highcharts";
import Highcharts, { chart } from "highcharts/highstock";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import ChartWatermark from "../ChartWatermark";
import Link from "next/link";
import Icon from "@/components/layout/Icon";

const COLORS = {
    GRID: "rgb(215, 223, 222)",
    PLOT_LINE: "rgb(215, 223, 222)",
    LABEL: "rgb(215, 223, 222)",
    LABEL_HOVER: "#6c7696",
    TOOLTIP_BG: "#1b2135",
    ANNOTATION_BG: "rgb(215, 223, 222)",
};



  
export default function DAHeadCharts({selectedTimespan, timespans}: {selectedTimespan: string, timespans: any}) {

    const [chartWidth, setChartWidth] = useState<number | null>(null);
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

    const fakeData = {
        chartOne: {
            data: [
                [1629957600000, 0.010010]
            ]
        }, 
        chartTwo: {
            data: [
                [1629957600000, 0.010010]
            ]
        }
    }

    return (
        <>
        <div className="flex gap-x-[15px] mt-[15px] mb-[30px]">
        {Object.keys(fakeData)
            .map((key, i) => {        
            return (          
            <div className="relative flex flex-col w-full overflow-hidden h-[197px] bg-[#1F2726] rounded-2xl  group " key={key}>
                <div
                    className={`absolute items-center text-[16px] font-bold top-[15px] left-[15px] flex gap-x-[10px]  z-10 ${/*link ? "cursor-pointer" : ""*/ ""}`}
                    onClick={() => {
                        //if (link) window.location.href = link;
                    }}
                >
                

                    <div
                        className={`rounded-full w-[15px] h-[15px] bg-[#344240] flex items-center justify-center text-[10px] z-10 ${/*!link ? "hidden" : "block" */ ""}`}
                    >
                        <Icon
                        icon="feather:arrow-right"
                        className="w-[11px] h-[11px]"
                        />
                    </div>
                </div>
                <div className="absolute text-[18px] top-[18px] right-[30px] numbers">
                    Top Right Value
                </div>
                <hr className="absolute w-full border-t-[2px] top-[51px] border-[#5A64624F] my-4" />
                <hr className="absolute w-full border-t-[2px] top-[89px] border-[#5A64624F] my-4" />
                <hr className="absolute w-full border-t-[2px] top-[126px] border-[#5A64624F] my-4" />
                <div className="absolute bottom-[41.5%] left-0 right-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
                    <ChartWatermark className="w-[128.54px] h-[25.69px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten" />
                </div>

                <div className="h-[165px] pt-[15px]">
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
                            plotOptions={{
                            line: {
                                lineWidth: 2,
                                
                            },
                            area: {
                                stacking: "normal",
                                lineWidth: 2,
                                // shadow: {
                                //   color:
                                //     AllChainsByKeys[data.chain_id]?.colors[theme ?? "dark"][1] + "33",
                                //   width: 10,
                                // },
                                // borderColor: AllChainsByKeys[data.chain_id].colors[theme ?? "dark"][0],
                                // borderWidth: 1,
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
                            <Title
                            style={{ display: "none" }} // This hides the title
                            >
                            {"Test"}
                            </Title>
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
                            margin={[33, 21, 15, 0]}
                            spacingBottom={0}
                            spacingTop={40}
                            spacingLeft={10}
                            spacingRight={10}
                            onRender={(chartData) => {}}
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
                            //formatter={tooltipFormatter}
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
                            min={timespans[selectedTimespan].xMin + 1000 * 60 * 60 * 24 * 1} // don't include the last day
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
                                y: -5,
                                x: 2,
                                distance: 50,

                                style: {
                                backgroundColor: "#1F2726",
                                whiteSpace: "nowrap",
                                color: "rgb(215, 223, 222)",
                                fontSize: "10px",
                                fontWeight: "300",
                                fontFamily: "Fira Sans",
                                },
                                // formatter: function (
                                // t: Highcharts.AxisLabelsFormatterContextObject,
                                // ) {
                                // return formatNumber(key, t.value);
                                // },
                            }}
                            min={0}
                            >

                            </YAxis>
                        </HighchartsChart>
                    </HighchartsProvider>
                </div>
            </div>
            )})}
            </div>
        </>
    )
}