"use client";
import {
    HighchartsProvider,
    HighchartsChart,
    Chart,
    XAxis,
    YAxis,
    Tooltip as HighchartsTooltip,
    PieSeries,
} from "react-jsx-highcharts";
import Highcharts from "highcharts/highstock";
import { useLocalStorage } from "usehooks-ts";
import { useMemo, memo, useState, useCallback, useRef, useEffect } from "react";
import { useMaster } from "@/contexts/MasterContext";
import "@/app/highcharts.axis.css";
import Icon from "@/components/layout/Icon";
import { DAConsumerChart } from "@/types/api/DAOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ChartWatermarkWithMetricName } from "../ChartWatermark";
import { Badge } from "@/app/(labels)/labels/Search";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useTheme } from "next-themes";
import GTPChart, { GTPChartSeries, GTPChartTooltipParams } from "@/components/GTPComponents/GTPChart";

type PieData = { name: string; y: number; color: string }[];

interface DATableChartsProps {
    selectedTimespan: string;
    data?: any;
    isOpen?: boolean;
    isMonthly: boolean;
    da_key: string;
    da_name: string;
    pie_data: DAConsumerChart;
    master: MasterResponse;
}

const UNLISTED_CHAIN_COLORS = ["#7D8887", "#717D7C", "#667170", "#5A6665", "#4F5B5A", "#43504F", "#384443", "#2C3938"];

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const COLORS = {
    PLOT_LINE: "rgb(215, 223, 222)",
};

const DATableChartsComponent = ({
    selectedTimespan,
    data,
    isMonthly,
    isOpen,
    da_key,
    da_name,
    pie_data,
    master,
}: DATableChartsProps) => {
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const { AllDALayersByKeys, AllChainsByKeys } = useMaster();
    const [selectedChain, setSelectedChain] = useState<string>("all");
    const pieChartComponent = useRef<Highcharts.Chart | null>(null);
    const [selectedScale, setSelectedScale] = useState<string>("stacked");
    const { theme } = useTheme();

    const timespans = useMemo(() => {
        let xMax = 0;
        let xMin = Infinity;

        Object.keys(data[selectedTimespan].da_consumers).forEach((key) => {
            const values = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values;
            const types = data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].types;

            if (values.length > 0) {
                const unixIndex = types.indexOf("unix");
                if (values[values.length - 1][unixIndex] > xMax) {
                    xMax = values[values.length - 1][unixIndex];
                }
                if (values[0][unixIndex] < xMin) {
                    xMin = values[0][unixIndex];
                }
            }
        });

        if (!isMonthly) {
            return {
                "1d": { xMin: xMax - 1 * 24 * 60 * 60 * 1000, xMax },
                "7d": { xMin: xMax - 7 * 24 * 60 * 60 * 1000, xMax },
                "30d": { xMin: xMax - 30 * 24 * 60 * 60 * 1000, xMax },
                "90d": { xMin: xMax - 90 * 24 * 60 * 60 * 1000, xMax },
                "180d": { xMin: xMax - 180 * 24 * 60 * 60 * 1000, xMax },
                "365d": { xMin: xMax - 365 * 24 * 60 * 60 * 1000, xMax },
                max: { xMin, xMax },
            };
        } else {
            return {
                "90d": { xMin: xMax - 90 * 24 * 60 * 60 * 1000, xMax },
                "180d": { xMin: xMax - 180 * 24 * 60 * 60 * 1000, xMax },
                "365d": { xMin: xMax - 365 * 24 * 60 * 60 * 1000, xMax },
                max: { xMin, xMax },
            };
        }
    }, [isMonthly, data, selectedTimespan]);

    const filteredChains = useMemo(() => {
        const baseData = data[selectedTimespan].da_consumers;
        const sumDataDaily = new Map<number, number>();
        const sumDataMonthly = new Map<number, number>();
        if (selectedChain === "all") {
            return baseData;
        } else {
            const filteredData: any = {};
            filteredData[selectedChain] = baseData[selectedChain];
            const dataWOChain = Object.keys(baseData)
                .filter((key) => key !== selectedChain)
                .reduce((result, key) => {
                    result[key] = baseData[key];
                    return result;
                }, {} as any);

            Object.values(dataWOChain).forEach((entries: any) => {
                entries.daily.values.forEach((entry: any) => {
                    const unix = entry[4];
                    const dataPosted = entry[3];
                    sumDataDaily.set(unix, (sumDataDaily.get(unix) ?? 0) + dataPosted);
                });
                entries.monthly.values.forEach((entry: any) => {
                    const unix = entry[4];
                    const dataPosted = entry[3];
                    sumDataMonthly.set(unix, (sumDataMonthly.get(unix) ?? 0) + dataPosted);
                });
            });

            const types = baseData[selectedChain].daily.types;
            const dailyValues = Array.from(sumDataDaily.entries()).map(([unix, sum]) => [
                "Other DA Consumers",
                "Other DA Consumers",
                "Other DA Consumers",
                sum,
                unix,
            ]);
            const monthlyValues = Array.from(sumDataMonthly.entries()).map(([unix, sum]) => [
                "Other DA Consumers",
                "Other DA Consumers",
                "Other DA Consumers",
                sum,
                unix,
            ]);

            if (selectedScale === "percentage") {
                filteredData["Other DA Consumers"] = {
                    daily: { types, values: dailyValues },
                    monthly: { types, values: monthlyValues },
                };
            }

            return filteredData;
        }
    }, [data, selectedChain, selectedTimespan, selectedScale]);

    const formattedPieData = useMemo((): PieData => {
        let pieTotal = 0;
        pie_data.data.forEach((d) => { pieTotal += d[4]; });

        const pieDataMap = new Map(
            pie_data.data.map((d, index) => [
                d[0],
                {
                    name: d[1],
                    y: d[4],
                    color: AllChainsByKeys[d[0]]
                        ? AllChainsByKeys[d[0]].colors[theme ?? "dark"][0]
                        : UNLISTED_CHAIN_COLORS[index],
                },
            ]),
        );

        if (selectedChain !== "all") {
            const result: PieData = [];
            let otherY = 0;
            pieDataMap.forEach((value, key) => {
                if (key !== selectedChain) otherY += value.y;
            });
            if (pieDataMap.has(selectedChain)) {
                result.push(pieDataMap.get(selectedChain)!);
                result.push({ name: "Other DA Consumers", y: otherY, color: UNLISTED_CHAIN_COLORS[0] });
            }
            return result;
        }

        return pie_data.data.map((d, index) => ({
            name: d[1] ? d[1] : d[0],
            y: d[4],
            color: AllChainsByKeys[d[0]]
                ? AllChainsByKeys[d[0]].colors[theme ?? "dark"][0]
                : UNLISTED_CHAIN_COLORS[index],
        }));
    }, [pie_data, selectedChain, AllChainsByKeys, theme]);

    const getNameFromKey = useMemo<Record<string, string>>(() => {
        return pie_data.data.reduce((acc, d) => {
            acc[d[0]] = d[1];
            return acc;
        }, {} as Record<string, string>);
    }, [pie_data]);

    const pieTooltipFormatter = useCallback(
        function (this: any) {
            const absolute = formatBytes(this.y);
            const percentage = Intl.NumberFormat("en-GB", {
                notation: "standard",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
            }).format(this.percentage);

            return `<div class="mt-3 mr-3 mb-3 w-40 text-xs font-raleway justify-between gap-x-[5px] flex items-center text-color-text-primary ">
                <div class="flex gap-x-[5px] items-center ">
                    <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${this.color}"></div>
                    <div class="tooltip-point-name text-xs">${this.key}</div>
                </div>
                <div class="tooltip-point-name numbers-xs flex flex-col items-end ">
                    <div class="text-right whitespace-pre">${absolute}</div>
                    <div class="text-right whitespace-pre">${percentage} %</div>
                </div>
            </div>`;
        },
        [],
    );

    const chartSeries = useMemo((): GTPChartSeries[] => {
        return Object.keys(filteredChains)
            .filter((key) => filteredChains[key][isMonthly ? "monthly" : "daily"].values?.[0])
            .map((key): GTPChartSeries => {
                const chainData = filteredChains[key][isMonthly ? "monthly" : "daily"];
                const types: string[] = chainData.types;
                const unixIdx = types.indexOf("unix");
                const dataPostedIdx = types.indexOf("data_posted");
                const realIndex =
                    key !== "Other DA Consumers"
                        ? Object.keys(data[selectedTimespan].da_consumers).findIndex((k) => k === key)
                        : 0;
                const color = AllChainsByKeys[key]
                    ? AllChainsByKeys[key].colors[theme ?? "dark"][0]
                    : UNLISTED_CHAIN_COLORS[realIndex];
                const name = chainData.values[0]?.[1] ?? key;

                return {
                    name,
                    data: chainData.values.map((d: any[]) => [
                        d[unixIdx] as number,
                        d[dataPostedIdx] as number,
                    ]),
                    seriesType: isMonthly ? "bar" : "area",
                    color,
                };
            });
    }, [filteredChains, isMonthly, AllChainsByKeys, theme, data, selectedTimespan]);

    const xBounds = timespans[selectedTimespan as keyof typeof timespans];

    const tooltipFormatter = useCallback(
        (params: GTPChartTooltipParams[]): string => {
            if (!params.length) return "";
            const timestamp = params[0].value[0];
            const dateStr = new Date(timestamp).toLocaleDateString("en-GB", {
                timeZone: "UTC",
                month: "short",
                day: !isMonthly ? "numeric" : undefined,
                year: "numeric",
            });

            const total = params.reduce((acc, p) => acc + (p.value[1] ?? 0), 0);
            const sorted = [...params].sort((a, b) => b.value[1] - a.value[1]);

            const rows = sorted
                .map((p) => {
                    const val = p.value[1] ?? 0;
                    const display =
                        selectedScale === "stacked"
                            ? formatBytes(val)
                            : `${total > 0 ? ((val / total) * 100).toFixed(1) : "0.0"}%`;
                    return `<div class="flex w-full items-center gap-x-[8px] font-medium mb-[2px]">
                    <div class="w-4 h-1.5 rounded-r-full flex-shrink-0" style="background-color:${p.color}"></div>
                    <div class="text-xs flex-1 truncate">${p.seriesName}</div>
                    <div class="numbers-xs text-right whitespace-nowrap">${display}</div>
                </div>`;
                })
                .join("");

            const totalRow =
                selectedScale === "stacked"
                    ? `<div class="flex items-center justify-between font-bold mt-[4px] pt-[4px] border-t border-color-bg-medium">
                    <div class="text-xs">Total</div>
                    <div class="numbers-xs">${formatBytes(total)}</div>
                </div>`
                    : "";

            return `<div class="mt-3 mr-3 mb-3 min-w-[200px] max-w-[280px] text-xs font-raleway text-color-text-primary">
                <div class="font-bold heading-small-xs mb-2 ml-6">${dateStr}</div>
                ${rows}
                ${totalRow}
            </div>`;
        },
        [isMonthly, selectedScale],
    );

    return (
        <>
            <div className="flex h-full w-full gap-x-[10px]">
                {/* Main time-series chart */}
                <div className="min-w-[450px] w-full flex flex-1 flex-col h-[264px] relative px-[10px] overflow-hidden pr-[5px]">
                    {/* Header row */}
                    <div className="relative flex items-center pl-[5px] justify-between h-[48px] w-full py-[10px]">
                        <div className="heading-large-xs h-[39px] flex items-center text-nowrap -top-[0px]">
                            Data Posted{selectedChain !== "all" ? ` (${getNameFromKey[selectedChain]})` : ""}
                        </div>
                        <div className="px-[10px] w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 12" preserveAspectRatio="none">
                                <polyline
                                    points="0,6 5,3 10,6 15,9 20,6 25,3 30,6 35,9 40,6 45,3 50,6 55,9 60,6 65,3 70,6 75,9 80,6 85,3 90,6 95,9 100,6 105,3 110,6 115,9 120,6 125,3 130,6 135,9 140,6 145,3 150,6 155,9 160,6 165,3 170,6 175,9 180,6 185,3 190,6 195,9 200,6 205,3 210,6 215,9 220,6 225,3 230,6 235,9 240,6 245,3 250,6 255,9 260,6 265,3 270,6 275,9 280,6 285,3 290,6 295,9 300,6 305,3 310,6 315,9 320,6 325,3 330,6 335,9 340,6 345,3 350,6 355,9 360,6 365,3 370,6 375,9 380,6 385,3 390,6 395,9 400,6"
                                    fill="none"
                                    stroke="rgb(var(--text-secondary))"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="h-[20px] relative bottom-[5px]">
                            <YAxisScaleControls selectedScale={selectedScale} setSelectedScale={setSelectedScale} />
                        </div>
                    </div>

                    {/* Watermark */}
                    <div className="absolute left-[calc(50%-85px)] top-[calc(39%-4.5px)] z-[100] opacity-40">
                        <ChartWatermarkWithMetricName
                            className="w-[225px] h-[45px] text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten"
                            metricName={da_name}
                        />
                    </div>

                    {/* GTPChart fills the area below the header */}
                    <div className="absolute left-[10px] right-[5px] top-[48px] bottom-0">
                        <GTPChart
                            series={chartSeries}
                            stack={selectedScale === "stacked"}
                            percentageMode={selectedScale === "percentage"}
                            xAxisType="time"
                            xAxisMin={xBounds?.xMin}
                            xAxisMax={xBounds?.xMax}
                            yAxisLabelFormatter={(value) =>
                                selectedScale === "stacked"
                                    ? formatBytes(value, 1)
                                    : `${Math.round(value)}%`
                            }
                            tooltipFormatter={tooltipFormatter}
                            height="100%"
                            showWatermark={false}
                            animation={false}
                            compactXAxis
                            grid={{ left: 50, right: 8, top: 10, bottom: 30 }}
                        />
                    </div>
                </div>

                {/* Legend + Pie chart */}
                <div className="p-[15px] pl-[30px] flex">
                    <ChartLegend
                        selectedTimespan={selectedTimespan}
                        data={data}
                        isMonthly={isMonthly}
                        setSelectedChain={setSelectedChain}
                        selectedChain={selectedChain}
                        isPie={true}
                        pie_data={pie_data}
                        pieChartComponent={pieChartComponent}
                        getNameFromKey={getNameFromKey}
                    />
                    <div className="min-w-[254px] flex items-center justify-center relative">
                        <div className="absolute left-[32%] w-[99px] flex items-center justify-center bottom-[48%] text-xxxs font-bold leading-[120%]">
                            {"% OF TOTAL USAGE"}
                        </div>
                        <HighchartsProvider Highcharts={Highcharts}>
                            <HighchartsChart
                                containerProps={{
                                    style: { height: "254px", width: "254px", overflow: "visible" },
                                }}
                                plotOptions={{
                                    pie: {
                                        allowPointSelect: false,
                                        cursor: "pointer",
                                        dataLabels: { enabled: false },
                                        showInLegend: true,
                                        borderWidth: 10,
                                        borderColor: "transparent",
                                    },
                                }}
                            >
                                <Chart
                                    backgroundColor=""
                                    type="pie"
                                    title="pie"
                                    overflow="visible"
                                    panning={{ enabled: false }}
                                    panKey="shift"
                                    zooming={{ type: undefined }}
                                    style={{ borderRadius: 15 }}
                                    animation={{ duration: 50 }}
                                    marginBottom={10}
                                    marginTop={2}
                                    onRender={function () {
                                        pieChartComponent.current = this as any;
                                    }}
                                />
                                <HighchartsTooltip
                                    useHTML
                                    shared
                                    split={false}
                                    followPointer
                                    followTouchMove
                                    backgroundColor="rgb(var(--bg-default))"
                                    padding={0}
                                    hideDelay={300}
                                    stickOnContact
                                    shape="rect"
                                    borderRadius={17}
                                    borderWidth={0}
                                    outside
                                    shadow={{ color: "black", opacity: 0.015, offsetX: 2, offsetY: 2 }}
                                    style={{ color: "rgb(215, 223, 222)" }}
                                    formatter={pieTooltipFormatter}
                                />
                                <XAxis title={undefined} type="datetime" labels={{ enabled: false }} />
                                <YAxis
                                    opposite={false}
                                    type="linear"
                                    gridLineWidth={0}
                                    labels={{ enabled: false }}
                                    min={0}
                                >
                                    <PieSeries
                                        key={`Pie-DATableCharts-${da_key}`}
                                        name="Pie Chart"
                                        innerSize="95%"
                                        size="100%"
                                        dataLabels={{ enabled: false }}
                                        type="pie"
                                        data={formattedPieData}
                                        point={{
                                            events: {
                                                click: function (event: any) {
                                                    if (event.point.options.name) {
                                                        const key = Object.entries(getNameFromKey).find(
                                                            ([_, value]) => value === event.point.options.name,
                                                        )?.[0];
                                                        if (key && key !== selectedChain) {
                                                            setSelectedChain(key);
                                                        } else if (key === selectedChain) {
                                                            setSelectedChain("all");
                                                        }
                                                    }
                                                },
                                            },
                                        }}
                                    />
                                </YAxis>
                            </HighchartsChart>
                        </HighchartsProvider>
                    </div>
                </div>
            </div>
        </>
    );
};

const ChartLegend = ({
    selectedTimespan,
    data,
    isMonthly,
    setSelectedChain,
    selectedChain,
    isPie,
    pie_data,
    pieChartComponent,
    getNameFromKey,
}: {
    selectedTimespan: string;
    data: any;
    isMonthly: boolean;
    setSelectedChain: React.Dispatch<React.SetStateAction<string>>;
    selectedChain: string;
    isPie: boolean;
    pie_data: DAConsumerChart;
    pieChartComponent: React.MutableRefObject<Highcharts.Chart | null>;
    getNameFromKey: Record<string, string>;
}) => {
    const { AllChainsByKeys, data: master } = useMaster();
    const [hoverChain, setHoverChain] = useState<string | null>(null);
    const { theme } = useTheme();

    // Sync hover state to pie chart only
    useEffect(() => {
        const chart = pieChartComponent.current;
        if (!chart) return;
        const series = chart.series[0];
        if (!series) return;
        series.points.forEach((point: any) => point.setState(""));
        if (hoverChain) {
            const matchedName = getNameFromKey[hoverChain];
            const matchedPoint = series.points.find((p: any) => p.name === matchedName);
            if (matchedPoint) {
                matchedPoint.setState("hover");
                chart.tooltip.refresh(matchedPoint as any);
            }
        } else {
            chart.tooltip.hide();
        }
    }, [hoverChain, pieChartComponent, getNameFromKey]);

    if (!master) return null;

    return (
        <div className="min-w-[125px] flex flex-col gap-y-[2px] items-start justify-center h-full">
            {Object.keys(data[selectedTimespan].da_consumers)
                .sort((a, b) => {
                    if (a === "others") return 1;
                    if (b === "others") return -1;
                    return 0;
                })
                .map((key, index) => {
                    const custom_logo_keys = Object.keys(master.custom_logos);
                    let icon = "gtp:chain-dark";
                    let color = UNLISTED_CHAIN_COLORS[index];

                    const chainKeyVal =
                        data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"].values[0]?.[2];
                    if (AllChainsByKeys[chainKeyVal]) {
                        icon = `gtp:${AllChainsByKeys[chainKeyVal].urlKey}-logo-monochrome`;
                        color = AllChainsByKeys[key].colors[theme ?? "dark"][0];
                    } else if (custom_logo_keys.includes(key)) {
                        icon = `gtp:${key}-custom-logo-monochrome`;
                        color = "#b5c4c3";
                    }

                    let bgBorderClass =
                        "border-[1px] border-color-bg-medium bg-color-bg-medium hover:border-color-ui-hover hover:bg-color-ui-hover h-[18px] !py-[2px] !px-[2px]";
                    if (selectedChain !== "all" && selectedChain !== key) {
                        bgBorderClass =
                            "border-[1px] border-color-bg-medium bg-transparent hover:border-color-ui-hover hover:bg-color-ui-hover h-[18px] !py-[2px] !px-[2px]";
                    }

                    return (
                        <Badge
                            key={index + "da_consumers"}
                            leftIcon={icon}
                            leftIconColor={color}
                            rightIcon={selectedChain === key ? "gtp:in-button-close-monochrome" : ""}
                            rightIconSize="md"
                            rightIconColor="#FE5468"
                            label={
                                data[selectedTimespan].da_consumers[key][isMonthly ? "monthly" : "daily"]
                                    .values[0]?.[1] ?? key
                            }
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedChain((prev) => (prev === key ? "all" : key));
                            }}
                            onMouseEnter={() => setHoverChain(key)}
                            onMouseLeave={() => setHoverChain(null)}
                            className={`cursor-pointer select-none ${bgBorderClass}`}
                        />
                    );
                })}
        </div>
    );
};

const YAxisScaleControls = ({
    selectedScale,
    setSelectedScale,
}: {
    selectedScale: string;
    setSelectedScale: React.Dispatch<React.SetStateAction<string>>;
}) => {
    return (
        <div className="select-none flex justify-between">
            <div className="flex items-center">
                <input type="checkbox" className="hidden" />
                <label htmlFor="toggle" className="flex items-center cursor-pointer">
                    <div
                        className="relative text-sm md:text-base font-medium"
                        onClick={() => setSelectedScale(selectedScale === "stacked" ? "percentage" : "stacked")}
                    >
                        <div className="w-[176px] h-[28px] heading-small flex gap-x-[20px] items-center pl-[10px] md:pr-[24px] rounded-full transition duration-200 ease-in-out text-forest-900 bg-color-bg-medium">
                            <div className="heading-small-xxs text-color-text-primary">Stacked</div>
                            <div className="heading-small-xxs text-color-text-primary">Percentage</div>
                            <div className="absolute top-[6px] z-20 right-[5px]">
                                <Tooltip placement="bottom">
                                    <TooltipTrigger>
                                        <Icon icon="feather:info" className="text-color-text-primary w-[15px] h-[15px]" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="flex flex-col items-center">
                                            <div className="p-[15px] text-sm bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                                                <div className="heading-small-xs">Stacked/Percentage</div>
                                                <div className="text-xxs text-wrap">
                                                    Toggle between "Stacked" view, which shows the total values by all DA consumers or
                                                    "Percentage" view which shows relative values.
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <div
                            className={`absolute flex justify-center items-center left-[2px] top-[2px] md:-left-[54px] md:top-0.5
                             w-full h-[24px] heading-small-xxs leading-[20px] rounded-full transition-transform duration-200 ease-in-out text-color-text-primary px-1.5 text-center ${
                                 selectedScale === "percentage" ? "transform translate-x-[42%]" : "translate-x-0"
                             }`}
                        >
                            <div className="bg-color-bg-default px-[8px] rounded-full h-[24px] flex items-center">
                                {selectedScale === "percentage" ? <>Percentage</> : <>Stacked</>}
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );
};

const DATableCharts = memo(DATableChartsComponent, (prevProps, nextProps) => {
    if (!prevProps.isOpen && !nextProps.isOpen) {
        return true;
    }
    return (
        prevProps.selectedTimespan === nextProps.selectedTimespan &&
        prevProps.isMonthly === nextProps.isMonthly &&
        prevProps.da_key === nextProps.da_key &&
        prevProps.data === nextProps.data &&
        prevProps.pie_data === nextProps.pie_data &&
        prevProps.master === nextProps.master
    );
});
export default DATableCharts;
