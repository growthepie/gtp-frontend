"use client";

import { GTPIcon } from "../../GTPIcon";
import { useMaster } from "@/contexts/MasterContext";
import { ChainOverview, GetRankingColor } from "@/lib/chains";
import { MasterResponse, Metrics, MetricInfo } from "@/types/api/MasterResponse";
import ReactECharts from "echarts-for-react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useState, useCallback, useRef, useEffect } from "react";
import dayjs from "@/lib/dayjs";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useRouter } from "next/navigation";
import { getFundamentalsByKey } from "@/lib/metrics";
import { GTPTooltipNew, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";
import { useTheme } from "next-themes";

const formatLargeNumber = (value: number | null | undefined, decimals: number) => {
    if (value == null || Number.isNaN(value)) return "—";
    const absValue = Math.abs(value);
    if (absValue >= 1e9) {
        return (value / 1e9).toFixed(decimals) + 'B';
    } else if (absValue >= 1e6) {
        return (value / 1e6).toFixed(decimals) + 'M';
    } else if (absValue >= 1e3) {
        return (value / 1e3).toFixed(decimals) + 'K';
    }
    return value.toFixed(decimals);
};

// make sure data is loading from overview...kpi_cards


export default function MetricCards({ chainKey, master, metricKey, metricData, overviewData }: { chainKey: string, master: MasterResponse, metricKey: string, metricData: MetricInfo, overviewData: ChainOverview }) {
    const { AllChainsByKeys } = useMaster();
    const chainData = AllChainsByKeys[chainKey];
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    const isMobile = useMediaQuery("(max-width: 768px)");
    const router = useRouter();
    const { theme } = useTheme();
    
    // Custom tooltip state
    const [customTooltip, setCustomTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        data: any[];
    }>({ visible: false, x: 0, y: 0, data: [] });
    
    // Track if user is interacting (touching/moving) on mobile
    const [isInteracting, setIsInteracting] = useState(false);

    // Calculate prefix and suffix early
    const metricUseUSD = Object.keys(metricData.units).includes("usd");
    const prefix = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].prefix || "";
    const suffix = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].suffix || "";

    // Handle card click navigation
    const handleCardClick = useCallback(() => {
        const fundamentalsByKey = getFundamentalsByKey;
        const metricItem = fundamentalsByKey[metricKey];
        const chainUrlKey = chainData.urlKey;
        
        if (metricItem && metricItem.urlKey) {
            // Set localStorage values for chart controls
            // sessionStorage.setItem('fundamentalsScale', 'stacked');
            sessionStorage.setItem('fundamentalsChains', JSON.stringify([chainKey]));
            router.push(`/fundamentals/${metricItem.urlKey}/${chainUrlKey}`);
        }
    }, [metricKey, chainData, chainKey, router]);

    // Custom Tooltip Component - defined early to avoid hook order issues
    const CustomTooltip = useCallback(({ data, x, y, prefix, suffix }: { data: any[], x: number, y: number, prefix: string, suffix: string }) => {
        if (!data.length) return null;
        const dateStr = dayjs.utc(data[0].categoryLabel).format("DD MMM YYYY");

        const tooltipWidth = 200;
        const tooltipHeight = 80;
        const containerW = 100; // chart container width
        const containerH = 28; // chart container height
        const margin = 5;

        // Position tooltip
        let tooltipX = x + 5;
        let tooltipY = y - tooltipHeight - 5;

        // Adjust if tooltip goes outside bounds
        if (tooltipX + tooltipWidth > containerW - margin) {
            tooltipX = x - tooltipWidth - 5;
        }
        if (tooltipY < margin) {
            tooltipY = y + 5;
        }

        return (
         <div
            className={`absolute pointer-events-none z-[999] bg-color-bg-default/95 shadow-standard rounded-[15px] px-3 pt-3 pb-4 min-w-[200px] text-xs font-raleway `}
            style={{
              left: tooltipX,
              top: tooltipY,
              boxShadow: "0px 0px 27px 0px var(--color-ui-shadow, #151A19)",
            }}
            
          >
                <div className="flex items-center gap-x-[5px] justify-between mb-2 pl-[21px] ">
                    <div className="heading-small-xs text-color-text-primary">{dateStr}</div>
                </div>
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center gap-x-[10px] h-[12px]">
                        <div className="flex items-center gap-1">
                            <div 
                                className="w-4 h-2 rounded-r-full " 
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs whitespace-nowrap text-color-text-primary">{metricData.name}</span>
                        </div>
                            <span className="numbers-xs text-color-text-primary font-medium">
                                {prefix}{formatLargeNumber(item.value, 2)} {suffix}
                        </span>
                    </div>
                ))}
            </div>
        );
    }, [metricData.name]);

    if (!chainData || !overviewData.data.ranking[metricKey] || !metricData || !overviewData.data.kpi_cards[metricKey]) return null;

    const decimals = metricData.units[metricUseUSD ? showUsd ? "usd" : "eth" : "value"].decimals;
    const valueIndex = metricUseUSD ? showUsd ? 0 : 1 : 0;

    // Get ranking color based on the metric's ranking
    const rankingColor = GetRankingColor(overviewData.data.ranking[metricKey].color_scale * 100, false, theme as "dark" | "light" ?? "dark");

    return (
        <div 
            className="group relative rounded-[15px] bg-color-bg-default hover:bg-color-ui-hover xs:p-[10px] p-[15px] w-full flex justify-between h-2xl transition-colors duration-200 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="flex items-center gap-x-[10px] relative w-[80px] md:min-w-[175px] ">
                <div className="!size-[14px] xs:!size-[28px] relative flex items-center justify-center">
                    <GTPTooltipNew
                            placement="top-start"
                            allowInteract={true}
                            trigger={
                                <div className=" w-[12px] h-[12px] xs:w-[24px] xs:h-[24px] p-[2px] border-t-[1px] border-r-[1px] border-b-[1px] border-[#5A6462] rounded-r-full rounded-tl-full rounded-bl-full relative flex items-center justify-center">
                                    <GTPIcon icon={`gtp-${metricData.icon.replace(/^(metrics-)(.*)/, (match, prefix, rest) => prefix + rest.replace(/-/g, ''))}-monochrome` as GTPIconName} color={rankingColor} className="!w-[12px] !h-[12px] xs:!w-[15px] xs:!h-[15px]" containerClassName="relative flex items-center justify-center left-[0.5px] top-[0.5px] w-[12px] h-[12px]" />
                                    <div className="numbers-xxxs -left-[11px] absolute top-[0%] w-[12px] h-[12px] xs:w-[24px] xs:h-[24px] flex justify-center items-center" style={{color: rankingColor}}>
                                        {overviewData.data.ranking[metricKey].rank}
                                    </div>
                                </div>
                            }
                            containerClass="mb-[5px] pl-[10px] p-[2px] min-w-[300px] relative flex items-center justify-center"
                            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                          >
                            <div>
                                {`${master.chains[chainKey].name} ranks #${overviewData.data.ranking[metricKey].rank} for ${metricData.name} among chains listed on growthepie.`}
                            </div>
                    </GTPTooltipNew>

                </div>
                <div className="heading-large-xxs xs:heading-large-xs ">{metricData.name}</div>
            </div>
            <div className="flex-1 flex justify-center items-center max-w-[95px] xs:max-w-[160px] overflow-visible">
                <MetricChart 
                    metricKey={metricKey} 
                    metricData={metricData} 
                    overviewData={overviewData} 
                    chainColor={chainData.colors[theme ?? "dark"][0]}
                    customTooltip={customTooltip}
                    setCustomTooltip={setCustomTooltip}
                    isInteracting={isInteracting}
                    setIsInteracting={setIsInteracting}
                    CustomTooltip={CustomTooltip}
                    seriesData={overviewData.data.kpi_cards[metricKey].sparkline.data.map((item: any) => [item[0], item[1 + valueIndex]])}
                    prefix={prefix}
                    suffix={suffix}
                />
            </div>
            <div className="flex flex-col gap-y-[2px] justify-center items-end min-w-[90px] [md:min-w-[120px] pl-[5px] group-hover:pr-[20px] transition-all duration-200">
                <div className=" numbers-sm xs:numbers-md group-hover:!text-color-text-primary" style={{ color: chainData.colors[theme ?? "dark"][0] }}>
                    {prefix}{formatLargeNumber(overviewData.data.kpi_cards[metricKey].current_values.data[valueIndex], 2)} {suffix}
                </div>
                <div className="numbers-xxs " style={{ color: overviewData.data.kpi_cards[metricKey].wow_change.data[0] > 0 ? "rgb(var(--positive))" : "rgb(var(--negative))" }}>{Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 1 }).format(overviewData.data.kpi_cards[metricKey].wow_change.data[0] * 100)}%</div>

            </div>
            
            {/* Custom React Tooltip - positioned at card level */}
            {customTooltip.visible && (
                <CustomTooltip
                    data={customTooltip.data}
                    x={customTooltip.x + 155} // Adjust for card positioning
                    y={customTooltip.y + 10} // Adjust for card positioning
                    prefix={prefix}
                    suffix={suffix}
                />
            )}
            
            {/* Chevron that appears on hover */}
            <div className="absolute right-[10px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none" className="text-color-text-primary">
                    <path d="M0.662115 2.29808C0.293362 1.89949 0.278805 1.2785 0.645793 0.862551C1.01283 0.44657 1.63111 0.383401 2.07253 0.699746L2.15833 0.767964L7.62295 5.58974C9.02778 6.82932 9.07141 8.99007 7.75437 10.2872L7.62295 10.4103L2.15833 15.232L2.07253 15.3003C1.63111 15.6166 1.01283 15.5534 0.645793 15.1375C0.278805 14.7215 0.293362 14.1005 0.662115 13.7019L0.740378 13.6249L6.205 8.80356L6.24895 8.76255C6.68803 8.33017 6.67331 7.60965 6.205 7.19644L0.740378 2.37508L0.662115 2.29808Z" fill="currentColor"/>
                </svg>
            </div>
        </div>
    )
}





//Lets add a basic echart component here

const MetricChart = ({ 
    metricKey, 
    metricData, 
    overviewData, 
    chainColor, 
    customTooltip, 
    setCustomTooltip, 
    isInteracting, 
    setIsInteracting, 
    CustomTooltip,
    seriesData,
    prefix,
    suffix,
}: { 
    metricKey: string, 
    metricData: MetricInfo, 
    overviewData: ChainOverview, 
    chainColor: string,
    customTooltip: any,
    setCustomTooltip: any,
    isInteracting: boolean,
    setIsInteracting: any,
    CustomTooltip: any,
    seriesData: any,
    prefix: string,
    suffix: string
}) => {
    const chartRef = useRef<ReactECharts>(null);
    const types = overviewData.data.kpi_cards[metricKey].sparkline.types;
    
    // Extract timestamps and values from the sparkline data
    const timestamps = seriesData.map((item: any) => item[0]);
    const values = seriesData.map((item: any) => item[1]);
    
    // State for hovered data point index
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [circlePosition, setCirclePosition] = useState<{ x: number; y: number } | null>(null);
    const [isHovering, setIsHovering] = useState(false);
    
    // Get the actual text-primary color from CSS
    const getTextPrimaryColor = () => {
        if (typeof window !== 'undefined') {
            const computedStyle = getComputedStyle(document.documentElement);
            return computedStyle.getPropertyValue('--color-text-primary').trim() || '#ffffff';
        }
        return '#ffffff';
    };
    
    // Calculate circle position using ECharts coordinate conversion
    const updateCirclePosition = useCallback((dataIndex: number) => {
        const chartInstance = chartRef.current?.getEchartsInstance();
        if (chartInstance && dataIndex >= 0 && dataIndex < values.length) {
            const pixelPos = chartInstance.convertToPixel('grid', [dataIndex, values[dataIndex]]);
            if (pixelPos) {
                setCirclePosition({ x: pixelPos[0], y: pixelPos[1] });
            }
        }
    }, [values]);
    
    // Interpolate value between data points
    const interpolateValue = (dataIndex: number, values: number[]) => {
        const index = Math.floor(dataIndex);
        const fraction = dataIndex - index;
        
        if (index >= values.length - 1) {
            return values[values.length - 1];
        }
        
        const value1 = values[index];
        const value2 = values[index + 1];
        return value1 + (value2 - value1) * fraction;
    };
    
    // Set initial circle position to final data point
    useEffect(() => {
        const setInitialPosition = () => {
            if (values.length > 0 && !isHovering) {
                const finalIndex = values.length - 1;
                updateCirclePosition(finalIndex);
            }
        };
        
        // Small delay to ensure chart is rendered
        const timeoutId = setTimeout(setInitialPosition, 100);
        return () => clearTimeout(timeoutId);
    }, [values, updateCirclePosition, isHovering]);

    // Calculate a better yAxis min: slightly below the minimum value, but not negative if all values are positive
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    // Add a small margin below min, but don't go below zero if all values are positive
    const yAxisMin = minValue > 0
        ? Math.max(0, minValue - (maxValue - minValue) * 0.15)
        : minValue - (maxValue - minValue) * 0.15;

    const option = {
        xAxis: {
            type: 'category',
            data: timestamps,
            show: false
        },
        yAxis: {
            type: 'value',
            show: false,
            min: yAxisMin,
        },
        series: [{
            data: values,
            type: 'line',
            silent: true,
            smooth: false,
            symbol: 'circle',
            symbolSize: 0, // Hide symbols by default
            lineStyle: {
                color: chainColor,
                width: 2
            },
            itemStyle: {
                color: chainColor
            },
            emphasis: {
                symbolSize: 6, // Show symbol on hover
                itemStyle: {
                    color: chainColor + 'CC', // 80% opacity
                    borderWidth: 0
                }
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        {
                            offset: 0,
                            color: chainColor + '33' // 20% opacity at top
                        },
                        {
                            offset: 1,
                            color: chainColor + '00' // 0% opacity at bottom
                        }
                    ]
                }
            }
        }],
        grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        tooltip: {
            show: true,
            trigger: 'axis',
            formatter: () => '', // Return empty string to hide tooltip content but keep axisPointer
            backgroundColor: 'transparent',
            borderWidth: 0,
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#CDD8D3',
                    width: 1,
                    type: 'solid'
                }
            }
        },
        graphic: null
    }
    return (
        <div 
            className="h-[40px] relative w-full z-10 overflow-visible"
            onMouseMove={(e) => {
                const chartInstance = chartRef.current?.getEchartsInstance();
                if (chartInstance) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const dataPoint = chartInstance.convertFromPixel('grid', [x, y]);

                    if (dataPoint && dataPoint[0] >= 0 && dataPoint[0] < values.length) {
                        const categoryIndex = Math.round(dataPoint[0]);
                        const tooltipData = [{
                            seriesName: metricData.name,
                            value: values[categoryIndex] || 0,
                            color: chainColor,
                            categoryIndex,
                            categoryLabel: timestamps[categoryIndex]
                        }];

                        setCustomTooltip({
                            visible: tooltipData.length > 0,
                            x: x,
                            y: y,
                            data: tooltipData
                        });
                        
                        // Update hovered index for circle positioning
                        setHoveredIndex(categoryIndex);
                        updateCirclePosition(categoryIndex);
                        setIsHovering(true);
                    } else {
                        // Only hide tooltip, keep circle at current position
                        setCustomTooltip(prev => ({ ...prev, visible: false }));
                    }
                }
            }}
            onMouseLeave={() => {
                setCustomTooltip(prev => ({ ...prev, visible: false }));
                setIsInteracting(false);
                setIsHovering(false);
                // Reset hovered index to show circle at final point
                setHoveredIndex(null);
                if (values.length > 0) {
                    updateCirclePosition(values.length - 1);
                }
            }}
            onTouchStart={() => {
                setIsInteracting(true);
            }}
            onTouchMove={(e) => {
                setIsInteracting(true);
                const chartInstance = chartRef.current?.getEchartsInstance();
                if (chartInstance) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.touches[0].clientX - rect.left;
                    const y = e.touches[0].clientY - rect.top;

                    const dataPoint = chartInstance.convertFromPixel('grid', [x, y]);

                    if (dataPoint && dataPoint[0] >= 0 && dataPoint[0] < values.length) {
                        const categoryIndex = Math.round(dataPoint[0]);
                        const tooltipData = [{
                            seriesName: metricData.name,
                            value: values[categoryIndex] || 0,
                            color: chainColor,
                            categoryIndex,
                            categoryLabel: timestamps[categoryIndex]
                        }];

                        setCustomTooltip({
                            visible: tooltipData.length > 0,
                            x: x,
                            y: y,
                            data: tooltipData
                        });
                        
                        // Update hovered index for circle positioning
                        setHoveredIndex(categoryIndex);
                        updateCirclePosition(categoryIndex);
                        setIsHovering(true);
                    } else {
                        setCustomTooltip(prev => ({ ...prev, visible: false }));
                    }
                }
            }}
            onTouchEnd={() => {
                setIsInteracting(false);
                setIsHovering(false);
                // Reset hovered index to show circle at final point
                setHoveredIndex(null);
                if (values.length > 0) {
                    updateCirclePosition(values.length - 1);
                }
            }}
        >
            <ReactECharts 
                ref={chartRef}
                option={option} 
                style={{ height: '100%', width: '100%' }}
                opts={{ 
                    renderer: 'canvas',
                    devicePixelRatio: window.devicePixelRatio || 1,
                 }}
            />
            
            {/* Circle indicator overlay */}
            {circlePosition && (
                <div
                    className="absolute w-[10px] h-[10px] rounded-full pointer-events-none z-[60]"
                    style={{
                        left: circlePosition.x - 5,
                        top: circlePosition.y - 5,
                        backgroundColor: getTextPrimaryColor(),
                        opacity: 0.6
                    }}
                />
            )}
            
        </div>
    )
}
