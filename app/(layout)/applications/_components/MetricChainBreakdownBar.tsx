// MetricHeader.tsx
"use client";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { MetricData, useApplicationDetailsData } from '../_contexts/ApplicationDetailsDataContext';
import { ApplicationIcon } from './Components';
import { useProjectsMetadata } from '../_contexts/ProjectsMetadataContext';
import { useTimespan } from '../_contexts/TimespanContext';
import { useMaster } from '@/contexts/MasterContext';
import { useMetrics } from '../_contexts/MetricsContext';
import { useLocalStorage } from 'usehooks-ts';
import { useUIContext } from '@/contexts/UIContext';
import { useChartSync } from '../_contexts/GTPChartSyncContext';

interface FloatingTooltipProps {
  content: React.ReactNode;
  containerClassName?: string;
  // width?: number;
  offsetX?: number;
  offsetY?: number;
  children: React.ReactNode;
}

const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
  content,
  containerClassName,
  // width = 280,
  offsetX = 10,
  offsetY = 10,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [adjustedCoords, setAdjustedCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const newCoords = {
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
    };
    setCoords(newCoords);
  };
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Clear any existing fade out timeout
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current);
      fadeTimeout.current = null;
    }
    
    // Set initial coordinates from the mouse enter event before showing tooltip
    const initialCoords = {
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
    };
    setCoords(initialCoords);
    
    // Make tooltip visible first with opacity 0
    setVisible(true);
    
    // Then animate opacity in next frame for smooth transition
    requestAnimationFrame(() => {
      setOpacity(1);
    });
  };
  
  const handleMouseLeave = () => {
    // Start fade out animation
    setOpacity(0);
    
    // Remove from DOM after animation completes
    fadeTimeout.current = setTimeout(() => {
      setVisible(false);
    }, 150); // Match transition duration
  };

  useEffect(() => {
    // Clean up timeout on unmount
    return () => {
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (visible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let newX = coords.x;
      let newY = coords.y;
      // Prevent overflow on the right edge.
      if (coords.x + tooltipRect.width > window.innerWidth) {
        newX = window.innerWidth - tooltipRect.width - 20;
      }
      // Prevent overflow on the bottom edge.
      if (coords.y + tooltipRect.height > window.innerHeight) {
        newY = window.innerHeight - tooltipRect.height - 20;
      }

      // Prevent overflow on the left edge.
      if (coords.x < 0) {
        newX = 0 + 20;
      }

      // Prevent overflow on the top edge.
      if (coords.y < 0) {
        newY = 0 + 20;
      }

      setAdjustedCoords({ x: newX, y: newY });
    }
  }, [coords, visible]);

  return (
    <div
      className={"relative inline-block " + containerClassName || ""}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            left: adjustedCoords.x,
            top: adjustedCoords.y,
            // width: width,
            opacity: opacity,
            transition: 'opacity 150ms ease-in-out',
          }}
          className="fixed mt-3 mr-3 mb-3 text-xs font-raleway bg-[#2A3433EE] text-white rounded-[17px] shadow-lg pointer-events-none z-50"
        >
          {content}
        </div>
      )}
    </div>
  );
};

// Create a new shared tooltip provider component
interface TooltipContextType {
  showTooltip: (e: React.MouseEvent, content: React.ReactNode) => void;
  hideTooltip: () => void;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

const useTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [adjustedCoords, setAdjustedCoords] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState<React.ReactNode>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastCoords = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const offsetX = 10;
  const offsetY = 10;

  const showTooltip = useCallback((e: React.MouseEvent, newContent: React.ReactNode) => {
    // Clear any existing fade out timeout
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current);
      fadeTimeout.current = null;
    }
    
    // Set initial coordinates from the mouse event
    const initialCoords = {
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
    };
    setCoords(initialCoords);
    lastCoords.current = initialCoords;
    setContent(newContent);
    
    // Make tooltip visible first with opacity 0
    setVisible(true);
    
    // Then animate opacity in next frame for smooth transition
    requestAnimationFrame(() => {
      setOpacity(1);
    });
  }, []);
  
  const hideTooltip = useCallback(() => {
    // Start fade out animation
    setOpacity(0);
    
    // Remove from DOM after animation completes
    fadeTimeout.current = setTimeout(() => {
      setVisible(false);
    }, 150); // Match transition duration
  }, []);

  // Update position when mouse moves, but throttle updates
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!visible) return;
    
    // Throttle updates to every 16ms (roughly 60fps)
    const now = Date.now();
    if (now - lastUpdateTime.current < 16) return;
    
    const newCoords = {
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
    };
    
    // Only update if the mouse has moved at least 2 pixels
    const dx = Math.abs(newCoords.x - lastCoords.current.x);
    const dy = Math.abs(newCoords.y - lastCoords.current.y);
    if (dx < 2 && dy < 2) return;
    
    lastCoords.current = newCoords;
    lastUpdateTime.current = now;
    setCoords(newCoords);
  }, [visible, offsetX, offsetY]);

  useEffect(() => {
    // Add global mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current);
      }
    };
  }, [handleMouseMove]);

  useEffect(() => {
    if (visible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let newX = coords.x;
      let newY = coords.y;
      
      // Prevent overflow on edges
      if (coords.x + tooltipRect.width > window.innerWidth) {
        newX = window.innerWidth - tooltipRect.width - 20;
      }
      if (coords.y + tooltipRect.height > window.innerHeight) {
        newY = window.innerHeight - tooltipRect.height - 20;
      }
      if (coords.x < 0) {
        newX = 0 + 20;
      }
      if (coords.y < 0) {
        newY = 0 + 20;
      }

      // Only update adjusted coords if they've actually changed
      if (Math.abs(newX - adjustedCoords.x) > 1 || Math.abs(newY - adjustedCoords.y) > 1) {
        setAdjustedCoords({ x: newX, y: newY });
      }
    }
  }, [coords, visible, adjustedCoords.x, adjustedCoords.y]);

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            left: adjustedCoords.x,
            top: adjustedCoords.y,
            opacity: opacity,
            transition: 'opacity 150ms ease-in-out',
          }}
          className="fixed mt-3 mr-3 mb-3 text-xs font-raleway bg-[#2A3433EE] text-white rounded-[17px] shadow-lg pointer-events-none z-50"
        >
          {content}
        </div>
      )}
    </TooltipContext.Provider>
  );
};

const blendColors = (color1: string, color2: string, percentage: number): string => {
  // Ensure the percentage is clamped between 0 and 1
  percentage = Math.max(0, Math.min(1, percentage));

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex.split("").map((char) => char + char).join(""); // Expand shorthand hex
    }
    const bigint = parseInt(hex, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  // Interpolate between the two colors
  const r = Math.round(r1 + (r2 - r1) * percentage);
  const g = Math.round(g1 + (g2 - g1) * percentage);
  const b = Math.round(b1 + (b2 - b1) * percentage);

  return rgbToHex(r, g, b);
};

export const MetricChainBreakdownBar = ({ metric }: { metric: string }) => {
  // Get all necessary context and state
  const { data, owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan, timespans } = useTimespan();
  const { AllChainsByKeys } = useMaster();
  const { metricsDef } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { isSidebarOpen } = useUIContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate container width on mount and when the sidebar changes
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, [containerRef.current]);

  const handleResize = () => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(handleResize, 300);
    return () => clearTimeout(timeout);
  }, [isSidebarOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate formatting based on metric definition
  const metricDefinition = metricsDef[metric];
  let prefix = "";
  let valueKey = "value";
  let decimals = 0;
  if (metricDefinition.units.eth) {
    prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
    valueKey = showUsd ? "usd" : "eth";
    decimals = showUsd ? metricDefinition.units.usd.decimals : metricDefinition.units.eth.decimals;
  } else {
    prefix = Object.values(metricDefinition.units)[0].prefix || "";
    valueKey = Object.keys(metricDefinition.units)[0];
    decimals = Object.values(metricDefinition.units)[0].decimals || 0;
  }

  // Prepare data and calculations (e.g., chainsData, totals, percentages, etc.)
  const metricData = data.metrics[metric] as MetricData;
  
  const chainsData = Object.entries(metricData.aggregated.data)
    .filter(([chain, valsByTimespan]) => 
      valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] > 0
    )
    .sort(([chainA], [chainB]) => chainA.localeCompare(chainB));
    
  const values = chainsData.map(([chain, valsByTimespan]) =>
    valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]
  );
  const total = values.reduce((acc, v) => acc + v, 0);
  const percentages = values.map((v) => (v / total) * 100);

  // Example of allTooltipContent for the header area (could be extracted further if desired)
  const maxUnix = Math.max(
    ...Object.values(metricData.over_time).map(
      (chainData) => chainData.daily.data[chainData.daily.data.length - 1][0]
    )
  );
  const minUnix = Math.min(
    ...Object.values(metricData.over_time).map(
      (chainData) => chainData.daily.data[0][0]
    )
  );
  
  const allTooltipContent = useMemo(() => {
    const maxDate = moment.unix(maxUnix / 1000).utc().locale("en-GB").format("DD MMM YYYY");
    let minDate = moment
      .unix(maxUnix / 1000)
      .subtract(timespans[selectedTimespan].value, "days")
      .utc()
      .locale("en-GB")
      .format("DD MMM YYYY");

    if (selectedTimespan === "max") {
      minDate = moment.unix(minUnix / 1000).utc().locale("en-GB").format("DD MMM YYYY");
    }

    return (
      <div className="flex flex-col gap-y-[5px] min-w-[240px] h-full pr-[15px] py-[15px] text-color-text-primary">
        <div className="pl-[20px] h-[24px] flex items-center gap-x-[5px] whitespace-nowrap">
          <ApplicationIcon owner_project={owner_project} size="sm" />
          <div className='heading-small-xs !font-normal'>
            <span className='!font-bold'>{ownerProjectToProjectData[owner_project]?.display_name || ""}</span>
          </div>
        </div>
        <div className="flex flex-col">
          {[...chainsData]
            .sort(
              ([, a], [, b]) =>
                b[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] -
                a[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]
            )
            .map(([chain, valsByTimespan]) => {
              const value = valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)];
              return (
                <div className="h-[20px] flex flex-col justify-between" key={chain}>
                  <div className="h-[18px] flex w-full space-x-[5px] items-center font-medium">
                    <div
                      className="w-[15px] h-[10px] rounded-r-full"
                      style={{ backgroundColor: AllChainsByKeys[chain].colors.dark[0] }}
                    ></div>
                    <div className="tooltip-point-name text-xs">{AllChainsByKeys[chain].label}</div>
                    <div className="flex-1 text-right justify-end numbers-xs flex">
                      {prefix}{valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]
                        .toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
                    </div>
                  </div>
                  <div className="h-[2px] flex ml-[20px] w-[calc(100% - 1rem)] relative">
                    <div className="h-[2px] rounded-none absolute right-0 top-0 w-full bg-white/0"></div>
                    <div
                      className="h-[2px] rounded-none absolute right-0 top-0 bg-forest-900 dark:bg-forest-50"
                      style={{
                        width: `${(value / Math.max(...Object.values(metricData.aggregated.data)
                          .map((chainData) => chainData[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]))) * 100}%`,
                        backgroundColor: AllChainsByKeys[chain].colors.dark[0]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          <div className="pl-[20px] flex-1 flex items-center justify-between gap-x-[15px] whitespace-nowrap">
            <div className="text-xs">
              Metric: 
            </div>
            <div className="numbers-xs">
              {metricsDef[metric].name}
            </div>
          </div>
        </div>
      </div>
    );
  }, [maxUnix, timespans, selectedTimespan, owner_project, ownerProjectToProjectData, chainsData, metricsDef, metric, minUnix, metricData.aggregated.types, metricData.aggregated.data, valueKey, AllChainsByKeys, prefix, decimals]);

  
  if (!metricData) return null;

  return (
    <TooltipProvider>
      <div className="pb-[15px]">
        <div className="flex items-center h-[34px] rounded-full bg-color-bg-medium p-[2px]">
          <div className="flex items-center h-[30px] w-full rounded-full overflow-hidden bg-black/60 relative" ref={containerRef}>
            <BarHeaderSection 
              owner_project={owner_project} 
              total={total} 
              ownerProjectToProjectData={ownerProjectToProjectData} 
              prefix={prefix} 
              decimals={decimals}
              tooltipContent={allTooltipContent}
              zIndex={chainsData.length + 1}
            />
            <div className="flex flex-1 h-full">
              {chainsData.map(([chain, chainValues], i) => (
                <ChainBar 
                  key={chain}
                  chain={chain}
                  index={i}
                  total={total}
                  chainFirstSeen={data.first_seen[chain]}
                  metricData={metricData}
                  selectedTimespan={selectedTimespan}
                  timespans={timespans}
                  valueKey={valueKey}
                  percentages={percentages}
                  containerWidth={containerWidth}
                  AllChainsByKeys={AllChainsByKeys}
                  metricsDef={metricsDef}
                  metric={metric}
                  prefix={prefix}
                  decimals={decimals}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

const BarHeaderSection = ({ 
  owner_project, 
  total, 
  ownerProjectToProjectData, 
  prefix, 
  decimals,
  tooltipContent,
  zIndex
}: { 
  owner_project: string;
  total: number;
  ownerProjectToProjectData: any;
  prefix: string;
  decimals: number;
  tooltipContent: React.ReactNode;
  zIndex: number;
}) => {
  const { showTooltip, hideTooltip } = useTooltip();
  
  return (
    <div 
      className="absolute left-0 flex gap-x-[10px] items-center h-full w-[160px] bg-color-bg-default p-[2px] rounded-full pr-[10px]" 
      style={{ zIndex: zIndex }}
      onMouseEnter={(e) => showTooltip(e, tooltipContent)}
      onMouseLeave={hideTooltip}
    >
      <ApplicationIcon owner_project={owner_project} size="sm" />
      <div className="flex flex-1 flex-col -space-y-[2px] mt-[2px] truncate pr-[10px]">
        <div className="numbers-sm">{prefix}{total.toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}</div>
        <div className="text-xxs truncate">
          {ownerProjectToProjectData[owner_project]?.display_name || ""}
        </div>
      </div>
    </div>
  );
};


const ChainBar = memo(({
  chain,
  index,
  total,
  chainFirstSeen,
  metricData,
  selectedTimespan,
  timespans,
  valueKey,
  percentages,
  containerWidth,
  AllChainsByKeys,
  metricsDef,
  metric,
  prefix,
  decimals,
}: {
  chain: string;
  index: number;
  total: number;
  chainFirstSeen: string;
  metricData: MetricData;
  selectedTimespan: string;
  timespans: Record<string, { value: number; label: string }>;
  valueKey: string;
  percentages: number[];
  containerWidth: number;
  AllChainsByKeys: Record<string, any>;
  metricsDef: Record<string, any>;
  metric: string;
  prefix: string;
  decimals: number;
}) => {
  const { hoveredSeriesName, setHoveredSeriesName, selectedSeriesName, setSelectedSeriesName } = useChartSync();
  const { owner_project } = useApplicationDetailsData();
  const { showTooltip, hideTooltip } = useTooltip();

  // Determine if this bar is hovered or selected
  const isHovered = hoveredSeriesName === chain;
  const isSelected = selectedSeriesName === chain;
  const computedZIndex = percentages.length - index;

  // Calculate the width of the bar based on its percentage (with a minimum threshold)
  const lastPercentagesTotal = index === 0 ? 0 : percentages.slice(0, index).reduce((acc, v) => acc + v, 0);
  let thisPercentage = percentages[index];
  if (thisPercentage < 0.15) thisPercentage = 0.15;
  const thisPercentageWidth = thisPercentage + lastPercentagesTotal;
  const thisRenderWidth = (thisPercentageWidth / 100) * (containerWidth - 200);

  // Compute tooltip data – e.g., first seen, min/max dates
  const firstSeen = moment(chainFirstSeen);
  const maxUnix = Math.max(
    ...Object.values(metricData.over_time).map((chainData) =>
      chainData.daily.data[chainData.daily.data.length - 1][0]
    )
  );
  const minUnix = Math.min(
    ...Object.values(metricData.over_time).map((chainData) =>
      chainData.daily.data[0][0]
    )
  );
  const maxDate = moment.unix(maxUnix / 1000).utc().locale("en-GB").format("DD MMM YYYY");
  let min = selectedTimespan === "max"
    ? moment.unix(minUnix / 1000)
    : moment.unix(maxUnix / 1000).subtract(timespans[selectedTimespan].value, "days");
  let minDate = min.utc().locale("en-GB").format("DD MMM YYYY");
  if (firstSeen.isAfter(min)) {
    minDate = firstSeen.utc().locale("en-GB").format("DD MMM YYYY");
  }

  const tooltipContent = useMemo(() => (
    <div className="min-w-[245px] flex flex-col gap-y-[5px] w-fit h-full pr-[15px] py-[15px] text-color-text-primary">
      <div className="pl-[20px] h-[24px] flex items-center gap-x-[5px] whitespace-nowrap">
        <ApplicationIcon owner_project={owner_project} size="sm" />
        <div className='heading-small-xs !font-normal'>
          <span className='numbers-sm'>{((metricData.aggregated.data[chain][selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] / total) * 100).toFixed(1)}%</span> on <span className='!font-bold'>{AllChainsByKeys[chain].label}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="h-[20px] flex flex-col justify-between">
          <div className="h-[18px] flex w-full space-x-[5px] items-center font-medium">
            <div
              className="w-[15px] h-[10px] rounded-r-full"
              style={{ backgroundColor: AllChainsByKeys[chain].colors.dark[0] }}
            ></div>
            <div className="tooltip-point-name text-xs">{AllChainsByKeys[chain].label}</div>
            <div className="flex-1 text-right justify-end numbers-xs flex">
              {prefix}{metricData.aggregated.data[chain][selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]
                .toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
            </div>
          </div>
          <div className="h-[2px] flex ml-[20px] w-[calc(100% - 1rem)] relative">
            <div className="h-[2px] rounded-none absolute right-0 top-0 w-full bg-black/30"></div>
            <div
              className="h-[2px] rounded-none absolute right-0 top-0 bg-forest-900 dark:bg-forest-50"
              style={{
                width: `${(metricData.aggregated.data[chain][selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] / total) * 100}%`,
                  
                backgroundColor: AllChainsByKeys[chain].colors.dark[0]
              }}
            ></div>
          </div>
        </div>
      </div>
      <div>
        <div className="pl-[20px] flex-1 flex items-center justify-between gap-x-[15px] whitespace-nowrap">
          <div className="text-xs">
            Metric: 
          </div>
          <div className="numbers-xs">
            {metricsDef[metric].name}
          </div>
        </div>
        <div className="pl-[20px] flex-1 flex items-center justify-between gap-x-[15px] whitespace-nowrap">
          <div className="text-xs">
            First seen contract: 
          </div>
          <div className="numbers-xs">
            {firstSeen.utc().toDate().toLocaleString("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  ), [chain, owner_project, metricData, selectedTimespan, valueKey, total, AllChainsByKeys, prefix, decimals, metricsDef, metric, firstSeen]);

  const barColor = useMemo(() => {
    const isActiveOrNone = isHovered || isSelected || (hoveredSeriesName === null && selectedSeriesName === null);
    const color = AllChainsByKeys[chain].colors.dark[0];
    if (isActiveOrNone) {
      return color;
    }
    return blendColors(color, "#1F2726", 0.9);
  }, [isHovered, isSelected, hoveredSeriesName, selectedSeriesName, AllChainsByKeys, chain]);

  const textColor = useMemo(() => {
    return AllChainsByKeys[chain].darkTextOnBackground ? "#1F2726" : "#CDD8D3";
  }, [chain, AllChainsByKeys]);

  const boxShadow = useMemo(() => {
    return (isHovered || isSelected) ? `0 0 10px ${AllChainsByKeys[chain].colors.dark[0]}66` : "none";
  }, [isHovered, isSelected, chain, AllChainsByKeys]);

  const opacity = useMemo(() => {
    const isActiveOrNone = isHovered || isSelected || (hoveredSeriesName === null && selectedSeriesName === null);
    if(isActiveOrNone) return 1;
    if(hoveredSeriesName === chain){
      return 0.8;
    }else{
      return 0.4;
    }
  }, [chain, hoveredSeriesName, isHovered, isSelected, selectedSeriesName]);

  const handleClick = useCallback(() => {
    setSelectedSeriesName(isSelected ? null : chain);
  }, [chain, isSelected, setSelectedSeriesName]);

  return (
    <div
      className="absolute h-full rounded-full transition-[box-shadow, background, width] duration-300 cursor-pointer"
      onMouseEnter={(e) => {
        setHoveredSeriesName(chain);
        showTooltip(e, tooltipContent);
      }}
      onMouseLeave={() => {
        setHoveredSeriesName(null);
        hideTooltip();
      }}
      onClick={handleClick}
      style={{
        background: barColor,
        width: `calc(${thisRenderWidth}px + 195px)`,
        left: '5px',
        zIndex: computedZIndex,
        boxShadow: boxShadow,
      }}
    >
      <div
        className="@container absolute inset-0 left-[135px] right-[15px] flex items-center justify-end text-color-text-primary select-none"
        style={{ zIndex: computedZIndex + 1 }}
      >
        <div
          className="flex items-center gap-x-[5px]"
          style={{
            color: AllChainsByKeys[chain].darkTextOnBackground ? "#1F2726" : "#CDD8D3",
            opacity: opacity,
          }}
        >
          <div className="text-xs !font-semibold hidden @[80px]:block truncate">
            {AllChainsByKeys[chain].name_short}
          </div>
          <div className="numbers-xs hidden @[30px]:block">
            {percentages[index].toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
});

ChainBar.displayName = "ChainBar";