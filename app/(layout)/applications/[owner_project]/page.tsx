"use client";
import Container from "@/components/layout/Container";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import { useMetrics } from "../_contexts/MetricsContext";
import { ContractDict, MetricData, useApplicationDetailsData } from "../_contexts/ApplicationDetailsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useMaster } from "@/contexts/MasterContext";
import { ApplicationDetailsChart } from "../_components/GTPChart";
import { ChartScaleProvider } from "../_contexts/ChartScaleContext";
import ChartScaleControls from "../_components/ChartScaleControls";
import { ApplicationCard, ApplicationDisplayName, ApplicationIcon, Category, Chains, formatNumber, Links, MetricTooltip } from "../_components/Components";
import { memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { GridTableAddressCell, GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";
import { Icon } from "@iconify/react";
import VerticalVirtuosoScrollContainer from "@/components/VerticalVirtuosoScrollContainer";
import Link from "next/link";
import { SortProvider, useSort } from "../_contexts/SortContext";
import { useHighchartsWrappers, useUIContext } from "@/contexts/UIContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Virtuoso } from "react-virtuoso";
import { useRouter } from "next/navigation";
import { AggregatedDataRow, useApplicationsData } from "../_contexts/ApplicationsDataContext";
import useDragScroll from "@/hooks/useDragScroll";
import { Sources } from "@/lib/datasources";
import moment from "moment";
// import { useGTPChartSyncProvider } from "../_contexts/GTPChartSyncContext";
import { MetricChainBreakdownBar } from "../_components/MetricChainBreakdownBar";
import { useChartSync } from "../_contexts/GTPChartSyncContext";

type Props = {
  params: { owner_project: string };
};

export default function Page({ params: { owner_project } }: Props) {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedMetrics } = useMetrics();
  const { selectedTimespan, timespans } = useTimespan();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { data: master } = useMaster();

  const SourcesDisplay = useMemo(() => {
    if (!master)
      return null;
    let sourcesByMetric = {};
    selectedMetrics.forEach((metric) => {
      const sources = master.app_metrics[metric].source;
      sourcesByMetric[metric] = sources && sources.length > 0 ? (
        sources
          .map<ReactNode>((s) => (
            <Link
              key={s}
              rel="noopener noreferrer"
              target="_blank"
              href={Sources[s] ?? ""}
              className="hover:text-forest-500 dark:hover:text-forest-500 underline"
            >
              {s}
            </Link>
          ))
          .reduce((prev, curr) => [prev, ", ", curr])
      ) : (
        <>Unavailable</>
      );
    })

    return sourcesByMetric;
  }, [master, selectedMetrics]);
 
  return (
    <>
    <ChartScaleProvider
          scaleDefs={{
            absolute: {
              label: 'Absolute',
              value: 'absolute',
            },
            stacked: {
              label: 'Stacked',
              value: 'stacked',
            },
            percentage: {
              label: 'Percentage',
              value: 'percentage',
            },

          }}
        >
      {selectedMetrics.map((metric, index) => (
          <MetricSection metric={metric} owner_project={owner_project} key={index} />
      ))}
      <Container className="pt-[30px]">
        
          <ChartScaleControls sources={SourcesDisplay && SourcesDisplay["gas_fees"]} />
      </Container>
      </ChartScaleProvider>

      <Container>
        <div className="pt-[30px] pb-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="heading-large">Most Active Contracts</div>
            <div className="text-xs">
              See the most active contracts for {ownerProjectToProjectData[owner_project] ? ` for ${ownerProjectToProjectData[owner_project].display_name}` : ""} (All Time).
            </div>
          </div>
        </div>
      </Container>
      <ContractsTable />
      <Container>
        {/* <div className="rounded-md bg-forest-1000/60 h-[152px] w-full"></div> */}
        <div className="pt-[30px] pb-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="heading-large">Similar Applications</div>
            <div className="text-xs">
              See other applications similar to 1inch sorted by their performance in terms of gas fees.
            </div>
          </div>

        </div>
        {/* <div className="rounded-md bg-forest-1000/60 h-[140px] w-full"></div> */}
      </Container>
      <SimilarApplications owner_project={owner_project} />

    </>
  );
}

const MetricSection = ({ metric, owner_project }: { metric: string; owner_project: string }) => {
  const { metricsDef, metricIcons } = useMetrics();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { data } = useApplicationDetailsData();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { data: master } = useMaster();
  const { selectedMetrics } = useMetrics();
  const { selectedTimespan } = useTimespan();
  const { selectedSeriesName } = useChartSync();
  const { AllChainsByKeys } = useMaster();

  

  useHighchartsWrappers();

  const def = metricsDef[metric];

  // create a list of the chain keys sorted by the aggregate value for the selected timespan
  const sortedChainKeys = Object.keys(data.metrics[metric].aggregated.data).sort((a, b) => {
    const hasUsd = data.metrics[metric].aggregated.types.includes("usd");
    let metricKey = "value";
    if (hasUsd) {
      metricKey = showUsd ? "usd" : "eth";
    }

    const aVal = data.metrics[metric].aggregated.data[a][selectedTimespan][data.metrics[metric].aggregated.types.indexOf(metricKey)];
    const bVal = data.metrics[metric].aggregated.data[b][selectedTimespan][data.metrics[metric].aggregated.types.indexOf(metricKey)];
    return aVal - bVal;
  });

  const metricDefinition = metricsDef[metric];
  let prefix = "";
  let suffix = "";
  let valueKey = "value";
  let valueIndex = 1;
  let decimals = 0;
  if (metricDefinition.units.eth) {
    prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
    suffix = showUsd ? metricDefinition.units.usd.suffix || "" : metricDefinition.units.eth.suffix || "";
    valueKey = showUsd ? "usd" : "eth";
    valueIndex = Object.values(data.metrics[metric].over_time)[0].daily.types.indexOf(valueKey);
    decimals = metricDefinition.units[valueKey].decimals || 0;
  } else {
    prefix = Object.values(metricDefinition.units)[0].prefix || "";
    suffix = Object.values(metricDefinition.units)[0].suffix || "";
    valueKey = Object.keys(metricDefinition.units)[0];
    valueIndex = Object.values(data.metrics[metric].over_time)[0].daily.types.indexOf(valueKey);
    decimals = Object.values(metricDefinition.units)[0].decimals || 0;
  }


  if (!def) {
    return null;
  }

  return (
    <>
      <Container className="pt-[30px] pb-[10px]">
        <div className="flex flex-col gap-y-[10px]">
          <div className="flex gap-x-[10px] items-center">
            <GTPIcon icon={metricIcons[metric] as GTPIconName} size="md" />
            <div className="text-sm md:text-xl">
              <span className="heading-large-sm md:heading-large-md">{def.name}</span> {selectedSeriesName ? `on ${AllChainsByKeys[selectedSeriesName].label}` : "across different chains"}
            </div>
          </div>
          {/* <div className="text-xs">
            {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name} is available on multiple chains. Here you see how much usage is on each based on the respective metric.
          </div> */}
        </div>
      </Container>
      <Container>
        <MetricChainBreakdownBar metric={metric} />
        <div className={`${selectedTimespan === "1d" ? "max-h-0" : "max-h-[400px]"} transition-all duration-300 overflow-hidden`}>
          <ApplicationDetailsChart
            metric={metric}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
            seriesTypes={data.metrics[metric].over_time[sortedChainKeys[0]].daily.types}
            seriesData={
              sortedChainKeys.map((chain) => ({
                name: chain,
                data: data.metrics[metric].over_time[chain].daily.data.map((d: number[]) => [d[0], d[valueIndex]])
              })
              )}
          />
        </div>
      </Container>
    </>
  );
}

// interface FloatingTooltipProps {
//   content: React.ReactNode;
//   containerClassName?: string;
//   // width?: number;
//   offsetX?: number;
//   offsetY?: number;
//   children: React.ReactNode;
// }

// const FloatingTooltip: React.FC<FloatingTooltipProps> = ({
//   content,
//   containerClassName,
//   // width = 280,
//   offsetX = 10,
//   offsetY = 10,
//   children,
// }) => {
//   const [visible, setVisible] = useState(false);
//   const [coords, setCoords] = useState({ x: 0, y: 0 });
//   const [adjustedCoords, setAdjustedCoords] = useState({ x: 0, y: 0 });
//   const tooltipRef = useRef<HTMLDivElement>(null);

//   const handleMouseMove = (e: React.MouseEvent) => {
//     const newCoords = {
//       x: e.clientX + offsetX,
//       y: e.clientY + offsetY,
//     };
//     setCoords(newCoords);
//   };

//   useEffect(() => {
//     if (visible && tooltipRef.current) {
//       const tooltipRect = tooltipRef.current.getBoundingClientRect();
//       let newX = coords.x;
//       let newY = coords.y;
//       // Prevent overflow on the right edge.
//       if (coords.x + tooltipRect.width > window.innerWidth) {
//         newX = window.innerWidth - tooltipRect.width - 20;
//       }
//       // Prevent overflow on the bottom edge.
//       if (coords.y + tooltipRect.height > window.innerHeight) {
//         newY = window.innerHeight - tooltipRect.height - 20;
//       }

//       // Prevent overflow on the left edge.
//       if (coords.x < 0) {
//         newX = 0 + 20;
//       }

//       // Prevent overflow on the top edge.
//       if (coords.y < 0) {
//         newY = 0 + 20;
//       }

//       setAdjustedCoords({ x: newX, y: newY });
//     }
//   }, [coords, visible]);

//   return (
//     <div
//       className={"relative inline-block " + containerClassName || ""}
//       onMouseEnter={() => setVisible(true)}
//       onMouseLeave={() => setVisible(false)}
//       onMouseMove={handleMouseMove}
//     >
//       {children}
//       {visible && (
//         <div
//           ref={tooltipRef}
//           style={{
//             left: adjustedCoords.x,
//             top: adjustedCoords.y,
//             // width: width,
//           }}
//           className="fixed mt-3 mr-3 mb-3 text-xs font-raleway bg-[#2A3433EE] text-white rounded-[17px] shadow-lg pointer-events-none z-50"
//         >
//           {content}
//         </div>
//       )}
//     </div>
//   );
// };

// const blendColors = (color1: string, color2: string, percentage: number): string => {
//   // Ensure the percentage is clamped between 0 and 1
//   percentage = Math.max(0, Math.min(1, percentage));

//   // Convert hex to RGB
//   const hexToRgb = (hex: string) => {
//     hex = hex.replace(/^#/, "");
//     if (hex.length === 3) {
//       hex = hex.split("").map((char) => char + char).join(""); // Expand shorthand hex
//     }
//     const bigint = parseInt(hex, 16);
//     return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
//   };

//   // Convert RGB to hex
//   const rgbToHex = (r: number, g: number, b: number) =>
//     `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

//   const [r1, g1, b1] = hexToRgb(color1);
//   const [r2, g2, b2] = hexToRgb(color2);

//   // Interpolate between the two colors
//   const r = Math.round(r1 + (r2 - r1) * percentage);
//   const g = Math.round(g1 + (g2 - g1) * percentage);
//   const b = Math.round(b1 + (b2 - b1) * percentage);

//   return rgbToHex(r, g, b);
// };

// const MetricChainBreakdownBar = ({ metric }: { metric: string }) => {
//   const { data, owner_project } = useApplicationDetailsData();
//   const { ownerProjectToProjectData } = useProjectsMetadata();
//   const { selectedTimespan, timespans } = useTimespan();
//   const { AllChainsByKeys } = useMaster();
//   const { metricsDef } = useMetrics();
//   const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
//   const { isSidebarOpen } = useUIContext();
//   const { hoveredSeriesName, setHoveredSeriesName } = useGTPChartSyncProvider();

//   const containerRef = useRef<HTMLDivElement>(null);

//   const [containerWidth, setContainerWidth] = useState(0);

//   useEffect(() => {
//     if (containerRef.current) {
//       setContainerWidth(containerRef.current.offsetWidth);
//     }
//   }, [containerRef.current]);

//   const handleResize = () => {
//     if (containerRef.current) {
//       setContainerWidth(containerRef.current.offsetWidth);
//     }
//   };

//   useEffect(() => {
//     // on sidebar open/close (timeout to wait for sidebar animation)
//     const timeout = setTimeout(() => {
//       handleResize();
//     }, 300);
//     return () => {
//       clearTimeout(timeout);
//     };
//   }, [isSidebarOpen]);

//   useEffect(() => {
//     window.addEventListener("resize", handleResize);
//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   const metricDefinition = metricsDef[metric];

//   let prefix = "";
//   let valueKey = "value";
//   let decimals = 0;
//   if (metricDefinition.units.eth) {
//     prefix = showUsd ? metricDefinition.units.usd.prefix || "" : metricDefinition.units.eth.prefix || "";
//     valueKey = showUsd ? "usd" : "eth";
//     decimals = showUsd ? metricDefinition.units.usd.decimals : metricDefinition.units.eth.decimals;
//   } else {
//     prefix = Object.values(metricDefinition.units)[0].prefix || "";
//     valueKey = Object.keys(metricDefinition.units)[0];
//     decimals = Object.values(metricDefinition.units)[0].decimals || 0;
//   }

//   const metricData = data.metrics[metric] as MetricData;
//   const firstSeenOn = data.first_seen;
//   // filter out chains with 0 value
//   const chainsData = Object.entries(metricData.aggregated.data).filter(([chain, valsByTimespan]) => valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] > 0)
//     // sort by chain asc
//     .sort(([chainA], [chainB]) => chainA.localeCompare(chainB));
//   const values = chainsData.map(([chain, valsByTimespan]) => valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]);
//   const total = Object.values(values).reduce((acc, v) => acc + v, 0);
//   const percentages = values.map((v) => (v / total) * 100);

//   const cumulativePercentages = percentages.reduce((acc, v, i) => {
//     const prev = acc[i - 1] || 0;
//     return [...acc, prev + v];
//   }, [] as number[]);

//   const maxUnix = Math.max(...Object.values(metricData.over_time).map((chainData) => chainData.daily.data[chainData.daily.data.length - 1][0]));
//   const minUnix = Math.min(...Object.values(metricData.over_time).map((chainData) => chainData.daily.data[0][0]));
//   const maxAggValue = Math.max(...Object.values(metricData.aggregated.data).map((chainData) => chainData[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]));



//   const getBarColor = useCallback((chain: string) => {
//     // const index = chainsData.findIndex(([c]) => c === chain);
//     const isHovered = hoveredSeriesName === chain;
//     const isHoveredOrNone = isHovered || hoveredSeriesName === null;

//     const color = AllChainsByKeys[chain].colors.dark[0];

//     if (isHoveredOrNone) {
//       return color;
//     }

//     const blendPercentage = 0.9;
//     return blendColors(color, "#1F2726", blendPercentage);

//   }, [hoveredSeriesName, AllChainsByKeys]);



//   // show all chains in the tooltip
//   const allTooltipContent = useMemo(() => {
//     const maxDate = moment.unix(maxUnix/1000).utc().locale("en-GB").format("DD MMM YYYY")

//     let minDate = moment.unix(maxUnix/1000).subtract(timespans[selectedTimespan].value, "days").utc().locale("en-GB").format("DD MMM YYYY");

//     if(selectedTimespan === "max"){
//       minDate = moment.unix(minUnix/1000).utc().locale("en-GB").format("DD MMM YYYY");
//     }

//     return (
//       <div className="flex flex-col gap-y-[5px] w-fit h-full pr-[15px] py-[15px] text-[#CDD8D3]">
//         <div className="pl-[20px] h-[18px] flex items-center justify-between gap-x-[15px] whitespace-nowrap">
//           {/* <div className="heading-small-xs h-[20px]">On {AllChainsByKeys[chain].label}</div> */}
//           <div className="heading-small-xs">{minDate} - {maxDate}</div>
//           <div className="text-xs">{metricsDef[metric].name}</div>
//         </div>
//         <div className="flex flex-col">
//           {[...chainsData].sort(
//             ([, a], [, b]) => b[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)] - a[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)]
//           ).map(([chain, valsByTimespan], i) => {
//             const value = valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)];
            
//             return (
//               <>
//                 <div key={chain} className="h-[20px] flex w-full space-x-[5px] items-center font-medium mb-[0.5]">
//                   <div
//                     className="w-[15px] h-[10px] rounded-r-full"
//                     style={{ backgroundColor: AllChainsByKeys[chain].colors.dark[0] }}
//                   ></div>
//                   <div className="tooltip-point-name text-xs">{AllChainsByKeys[chain].label}</div>
//                   <div className="flex-1 text-right justify-end numbers-xs flex">
//                     {prefix}{valsByTimespan[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)].toLocaleString("en-GB", { maximumFractionDigits: decimals })}
//                   </div>
//                 </div>
//                 <div className="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
//                   <div className="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
//                   <div className="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50"
//                     style={{ width: `${(value/ maxAggValue) * 100}%`, backgroundColor: `${AllChainsByKeys[chain].colors.dark[0]}` }}></div>
//                 </div>
//               </>
//             )
//           })}
//           <div className="h-[20px] flex w-full space-x-[5px] items-center font-medium mt-1.5 mb-0.5">
//             <div className="w-[15px] h-[10px] rounded-r-full" />
//             <div className="tooltip-point-name text-xs">Total</div>
//             <div className="flex-1 text-right justify-end numbers-xs flex">
//               {prefix}{total.toLocaleString("en-GB", { maximumFractionDigits: decimals })}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
    
//   }, [maxUnix, timespans, selectedTimespan, metricsDef, metric, chainsData, prefix, total, decimals, minUnix, metricData.aggregated.types, valueKey, AllChainsByKeys, maxAggValue]);

//   if (!metricData) {
//     return null;
//   }

//   return (
//     <div className="pb-[15px]">
//       <div className="flex items-center h-[34px] rounded-full bg-[#344240] p-[2px]">
//         <div className="flex items-center h-[30px] w-full rounded-full overflow-hidden bg-black/60 relative" ref={containerRef}>
//           <FloatingTooltip content={allTooltipContent} containerClassName="h-full">
//           <div className="absolute left-0 flex gap-x-[10px] items-center h-full w-[200px] bg-[#1F2726] p-[2px] rounded-full" style={{ zIndex: chainsData.length + 1 }}>
//             <ApplicationIcon owner_project={owner_project} size="sm" />
//             <div className="flex flex-1 flex-col -space-y-[2px] mt-[2px] truncate pr-[10px]">
//               <div className="numbers-sm">{prefix}{total.toLocaleString("en-GB", { maximumFractionDigits: decimals })}</div>
//               <div className="text-xxs truncate ">{ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].display_name || ""}</div>
//             </div>
//           </div>
//           </FloatingTooltip>
//           <div className="flex flex-1 h-full">
//             {chainsData.map(([chain, values], i) => {
//               // Determine whether this bar is hovered.
//               const isHovered = hoveredSeriesName === chain;
//               // If any bar is hovered and this one isn’t, reduce its opacity.
//               const barOpacity = hoveredSeriesName !== null && !isHovered ? 0.4 : 1;
//               // Bump the hovered bar to the top.
//               // const computedZIndex = isHovered ? chainsData.length + 1 : chainsData.length - i;
//               const computedZIndex = chainsData.length - i;

//               const barColor = isHovered || hoveredSeriesName === null ? AllChainsByKeys[chain].colors.dark[0] : "#1F2726";
//               const textColor = isHovered || hoveredSeriesName === null ? AllChainsByKeys[chain].darkTextOnBackground ? "#1F2726" : "#CDD8D3" : "#1F2726";

//               let lastPercentagesTotal = i === 0 ? 0 : percentages.slice(0, i).reduce((acc, v) => acc + v, 0);
//               let thisPercentage = percentages[i];


//               if (thisPercentage < 0.15) {
//                 thisPercentage = 0.15;
//               }
//               let thisPercentageWidth = thisPercentage + (i === 0 ? 0 : lastPercentagesTotal);
//               const thisRenderWidth = (thisPercentageWidth / 100) * (containerWidth - 200);

//               //convert incoming date (UTC) to timestamp
//               const firstSeen = moment.utc(firstSeenOn[chain]);
              
//               const maxDate = moment.unix(maxUnix/1000).utc().locale("en-GB").format("DD MMM YYYY");

//               let min = selectedTimespan === "max" ? moment.unix(minUnix/1000) : moment.unix(maxUnix/1000).subtract(timespans[selectedTimespan].value, "days");
              

//               let minDate = min.utc().locale("en-GB").format("DD MMM YYYY");
//               if(firstSeen.isAfter(min)){
//                 minDate = firstSeen.utc().locale("en-GB").format("DD MMM YYYY");
//               }

//               // let minDate = (moment.unix(maxUnix/1000).subtract(timespans[selectedTimespan].value, "days")).utc().locale("en-GB").format("DD MMM YYYY");

//               const tooltipContent = (
//                 <div className="flex flex-col gap-y-[5px] w-fit h-full pr-[15px] py-[15px] text-[#CDD8D3]">
//                   <div className="pl-[20px] h-[18px] flex items-center justify-between gap-x-[15px] whitespace-nowrap">
//                     {/* <div className="heading-small-xs h-[20px]">On {AllChainsByKeys[chain].label}</div> */}
//                     <div className="heading-small-xs">{minDate} - {maxDate}</div>
//                     <div className="text-xs">{metricsDef[metric].name}</div>
//                   </div>
//                   <div className="flex flex-col">
//                     {/* <div className="pl-[20px] text-xs">Timeframe: <span className="numbers-xs">{minDate} - {maxDate}</span></div> */}
//                     <div className="h-[20px] flex w-full space-x-[5px] items-center font-medium mb-0.5">
//                       <div
//                         className="w-[15px] h-[10px] rounded-r-full"
//                         style={{ backgroundColor: AllChainsByKeys[chain].colors.dark[0] }}
//                       ></div>
//                       <div className="tooltip-point-name text-xs">{AllChainsByKeys[chain].label}</div>
//                       <div className="flex-1 text-right justify-end numbers-xs flex">
//                         {prefix}{values[selectedTimespan][metricData.aggregated.types.indexOf(valueKey)].toLocaleString("en-GB", { maximumFractionDigits: 2 })}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="pl-[20px] flex flex-col items-start flex-1">
//                     {/* <div className="heading-small-xs h-[20px]">On {AllChainsByKeys[chain].label}</div> */}
//                     <div className=" text-xxxs">
//                       First seen on {firstSeen.utc().toDate().toLocaleString("en-GB", {
//                         year: "numeric",
//                         month: "short",
//                         day: "numeric",
//                         // hour: "numeric",
//                         // minute: "numeric",
//                         // second: "numeric",
//                       })}
//                     </div>
//                   </div>
//                 </div>
//               );

//               return (
//                 <FloatingTooltip key={chain} content={tooltipContent}>
//                   <div
//                     className="absolute h-full rounded-full transition-all"
//                     onMouseEnter={() => setHoveredSeriesName(chain)}
//                     onMouseLeave={() => setHoveredSeriesName(null)}
//                     style={{
//                       // background: isHovered || isHovered === null ? AllChainsByKeys[chain].colors.dark[0] : "#1F2726",
//                       background: getBarColor(chain),
//                       // take containerWidth and 140px into account
//                       width: `calc(${thisRenderWidth}px + 195px)`,
//                       left: '5px',
//                       zIndex: computedZIndex,
//                       // add inner glow to hovered bar
//                       boxShadow: isHovered ? `0 0 10px ${AllChainsByKeys[chain].colors.dark[0]}66` : "none",

//                     }}
//                   >
//                     <div
//                       className="@container absolute inset-0 left-[135px] right-[15px] flex items-center justify-end text-[#1F2726] truncate"
//                       style={{
//                         zIndex: computedZIndex + 1,
//                       }}
//                     >
//                       <div
//                         className="flex items-center gap-x-[5px]"
//                         style={{
//                           color: AllChainsByKeys[chain].darkTextOnBackground ? "#1F2726" : "#CDD8D3",
//                           opacity: barOpacity,
//                           // color: textColor,
//                         }}
//                       >
//                         <div className="text-xs !font-semibold hidden @[80px]:block truncate">
//                           {AllChainsByKeys[chain].name_short}
//                         </div>
//                         <div className="numbers-xs hidden @[30px]:block ">
//                           {percentages[i].toFixed(1)}%
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </FloatingTooltip>
//               )
//             })
//             }
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


const ContractsTable = () => {
  const { data, owner_project, contracts, sort, setSort } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { selectedTimespan } = useTimespan();
  const { AllChainsByKeys } = useMaster();
  const { metricsDef, selectedMetrics, setSelectedMetrics, selectedMetricKeys, } = useMetrics();
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showMore, setShowMore] = useState(false);

  const metricKey = useMemo(() => {
    let key = selectedMetrics[0];
    if (selectedMetrics[0] === "gas_fees")
      key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

    return key;
  }, [selectedMetrics, showUsd]);

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,800px) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  return (
    <>
    <HorizontalScrollContainer reduceLeftMask={true}>
      <GridTableHeader
        gridDefinitionColumns={gridColumns}
        className="group text-[14px] !pl-[5px] !pr-[30px] !py-0 gap-x-[15px] !pb-[4px]"
        style={{
          gridTemplateColumns: gridColumns,
        }}
      >
        <div />
        <GridTableHeaderCell
          metric="name"
          className="heading-small-xs pl-[0px]"
          sort={sort}
          setSort={setSort}
        >
          Contract Name
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="main_category_key"
          className="heading-small-xs"
          sort={sort}
          setSort={setSort}
        >
          Category
        </GridTableHeaderCell>
        <GridTableHeaderCell
          metric="sub_category_key"
          className="heading-small-xs"
          sort={sort}
          setSort={setSort}
        >
          Subcategory
        </GridTableHeaderCell>
        {selectedMetrics.map((metric, index) => {
          const metricMap = {
            "gas_fees": "fees_paid_",
            "txcount": "txcount",
            "daa": "daa",
          }
          const metricKey = `${metricMap[metric]}${metric === "gas_fees" && (showUsd ? "usd" : "eth")}`;
          return (
            <GridTableHeaderCell
              key={metric}
              metric={metric}
              className="heading-small-xs z-[0] whitespace-nowrap"
              justify="end"
              sort={sort}
              setSort={setSort}
            >
              {metricsDef[metric].name} {Object.keys(metricsDef[metric].units).includes("eth") && <>({showUsd ? "USD" : "ETH"})</>}
            </GridTableHeaderCell>
          )
        })}
      </GridTableHeader>
      {/* <div className="flex flex-col" style={{ height: `${contracts.length * 34 + contracts.length * 5}px` }}>
        <VerticalVirtuosoScrollContainer
          height={800}
          totalCount={contracts.length}
          itemContent={(index) => (
            <div key={index} className="pb-[5px]">
            <ContractsTableRow contract={contracts[index]} />
            </div>
          )}
        />
      </div> */}
      <div className="flex flex-col transition-[max-height] duration-300 overflow-hidden" style={{ maxHeight: showMore ? contracts.length * 34 + (contracts.length - 1) * 5 : 5 * 34 + 5 * 4 }}>

        <Virtuoso
          totalCount={contracts.length}
          itemContent={(index) => (
            <div key={index} className={index < contracts.length - 1 ? "pb-[5px]" : ""}>
              <ContractsTableRow contract={contracts[index]} />
            </div>
          )}
          useWindowScroll
          increaseViewportBy={{ top: 0, bottom: 400 }}
          overscan={50}
        />
      </div>
      
    </HorizontalScrollContainer>
    {contracts.length > 5 && (
      <div className="flex items-center justify-center pt-[21px]">
        <div className="flex items-center justify-center rounded-full h-[36px] w-[117px] border border-[#CDD8D3] text-[#CDD8D3] cursor-pointer text-md" onClick={() => setShowMore(!showMore)}>
          {showMore ? "Show less" : "Show more"}
        </div>
      </div>
    )}
    </>
  )
}


const ContractValue = memo(({ contract, metric }: { contract: ContractDict, metric: string }) => {
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { metricsDef } = useMetrics();

  const metricMap = {
    "gas_fees": "fees_paid_",
    "txcount": "txcount",
    "daa": "daa",
  }

  const prefix = useMemo(() => {
    const def = metricsDef[metric].units;

    if (Object.keys(def).includes("usd")) {
      return showUsd ? def.usd.prefix : def.eth.prefix;
    } else {
      return Object.values(def)[0].prefix;
    }
  }, [metricsDef, metric, showUsd]);

  const decimals = metricsDef[metric].units[Object.keys(metricsDef[metric].units).includes("usd") ? showUsd ? "usd": "eth" : Object.keys(metricsDef[metric].units)[0]].decimals;

  const metricKey = `${metricMap[metric]}${metric === "gas_fees" ? (showUsd ? "usd" : "eth") : ""}`;

  

  return (
    <div className="flex items-center justify-end gap-[5px] numbers-xs">
      {prefix}{contract[metricKey].toLocaleString("en-GB", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
    </div>
  )
});

ContractValue.displayName = 'Value';



const ContractsTableRow = memo(({ contract }: { contract: ContractDict }) => {
  const { owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { metricsDef, selectedMetrics, selectedMetricKeys, } = useMetrics();
  const { AllChainsByKeys, data: masterData } = useMaster();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1000);
  };

  // Memoize gridColumns to prevent recalculations
  const gridColumns = useMemo(() =>
    `26px 280px 110px minmax(135px,800px) ${selectedMetricKeys.map(() => `140px`).join(" ")}`,
    [selectedMetricKeys]
  );

  if (!masterData)
    return null;

  return (
    <GridTableRow
      gridDefinitionColumns={gridColumns}
      className={`group text-[14px] !pl-[5px] !pr-[30px] !py-0 h-[34px] gap-x-[15px] whitespace-nowrap`}
      style={{
        gridTemplateColumns: gridColumns,
      }}
    >
      <div className="sticky z-[3] -left-[12px] md:-left-[48px] w-[26px] flex items-center justify-center overflow-visible">
        <div
          className="absolute z-[3] -left-[5px] h-[32px] w-[35px] pl-[5px] flex items-center justify-start rounded-l-full bg-[radial-gradient(circle_at_-32px_16px,_#151A19_0%,_#151A19_72.5%,_transparent_90%)]"
        >
          <div className="size-[26px] flex items-center justify-center">
            <GTPIcon icon={`${contract.origin_key}-logo-monochrome` as GTPIconName} size="sm" style={{ color: AllChainsByKeys[contract.origin_key].colors.dark[0] }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-x-[15px] justify-between w-full truncate">
        
        {contract.name ? (<div>{contract.name}</div>) : (<GridTableAddressCell address={contract.address as string} showCopyIcon={false} />)}
        <div className="flex items-center gap-x-[5px]">
          <div className="h-[15px] w-[15px]">
            <div
              className="group flex items-center cursor-pointer gap-x-[5px] text-xs"
              onClick={() => handleCopyAddress(contract.address as string)}
            >
              <Icon
                icon={copiedAddress ? "feather:check" : "feather:copy"}
                className="w-[15px] h-[15px]"
              />
            </div>
          </div>
          <Link
            href={`${masterData.chains[contract.origin_key].block_explorer
              }address/${contract.address}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon
              icon="gtp:gtp-block-explorer-alt"
              className="w-[15px] h-[15px]"
            />
          </Link>
        </div>
      </div>
      <div className="text-xs">
        <Category category={ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].main_category : ""} />
      </div>
      <div className="text-xs">
        {contract.sub_category_key ? (masterData.blockspace_categories.sub_categories[contract.sub_category_key] ? masterData.blockspace_categories.sub_categories[contract.sub_category_key] : contract.sub_category_key) : <span className="text-[#5A6462]">Unknown</span>}
      </div>
      {selectedMetrics.map((key, index) => (
        <div
          key={key}
        >
          <ContractValue contract={contract} metric={selectedMetrics[index]} />
        </div>
      ))}
    </GridTableRow>
  )
});

ContractsTableRow.displayName = 'ApplicationTableRow';

const SimilarApplications = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const { applicationDataAggregated, isLoading } = useApplicationsData();
  const { selectedMetrics } = useMetrics();
  const { metricsDef } = useMetrics();
  const { sort } = useSort();

  const [medianMetricKey, setMedianMetricKey] = useState(selectedMetrics[0]);
  const [medianMetric, setMedianMetric] = useState(selectedMetrics[0]);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  useEffect(() => {
    if (Object.keys(metricsDef).includes(sort.metric)) {
      let key = sort.metric;
      if (sort.metric === "gas_fees")
        key = showUsd ? "gas_fees_usd" : "gas_fees_eth";

      setMedianMetricKey(key);
      setMedianMetric(sort.metric);
    }

  }, [metricsDef, sort.metric, showUsd]);



  const similarApps = useMemo(() => {
    if (!ownerProjectToProjectData || !ownerProjectToProjectData[owner_project] || !applicationDataAggregated || !applicationDataAggregated.length)
      return [];
    // filter out applications with previous value of 0 and that are not the same owner project
    const filteredApplications = applicationDataAggregated
      .filter((application) => ownerProjectToProjectData[application.owner_project].main_category === ownerProjectToProjectData[owner_project].main_category && application.owner_project !== owner_project);

    const medianMetricValues = filteredApplications.map((application) => application[medianMetricKey])
      .sort((a, b) => a - b);
      
    const medianValue = medianMetricValues[Math.floor(medianMetricValues.length / 2)];

    // top 3 applications with highest change_pct after filtering out applications with < median value
    return filteredApplications
      .filter((application) => application[medianMetricKey] >= medianValue)
      .sort((a, b) => b[medianMetricKey + "_change_pct"] - a[medianMetricKey + "_change_pct"])
      .slice(0, 6);
  }, [applicationDataAggregated, medianMetricKey, ownerProjectToProjectData, owner_project]);

  return (
    <>
      <div>
        <Container className="hidden md:grid md:grid-rows-3 md:grid-flow-col lg:grid-rows-2 lg:grid-flow-row pt-[10px] lg:grid-cols-3 gap-[10px]">
          {similarApps.map((application, index) => (
            <ApplicationCard key={application.owner_project} application={application} />
          ))}
          {isLoading && new Array(6).fill(0).map((_, index) => (
            <ApplicationCard key={index} application={undefined} />
          ))}
        </Container>
      </div>
      <div className="block md:hidden pt-[10px]">
        <CardSwiper cards={[...similarApps.map((application) => <ApplicationCard key={application.owner_project} application={application} />)]} />
      </div>
    </>
  )
}


const CardSwiper = ({ cards }: { cards: React.ReactNode[] }) => {
  // const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(2);

  const { containerRef, showLeftGradient, showRightGradient } =
    useDragScroll("horizontal", 0.96, { snap: true, snapThreshold: 0.2 });

  const onScroll = () => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const children = Array.from(containerRef.current.children);
      let closestIndex = 0;
      let closestDistance = Infinity;
      children.forEach((child, index) => {
        const rect = child.getBoundingClientRect();
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(childCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveIndex(closestIndex);
      setLeftIndex(Math.max(0, closestIndex - 1));
      setRightIndex(Math.min(children.length - 1, closestIndex + 1));
      setIsFirst(closestIndex === 0);
      setIsLast(closestIndex === children.length - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", onScroll);
    // Run once on mount to set the active index correctly.
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex overflow-x-scroll scrollbar-none px-[20px]"
    >
      {cards.map((card, index) => {
        return (
          <div
            key={index}
            className={`transition-[transform,opacity] duration-300 ease-in-out ${index === activeIndex ? "scale-100 opacity-100" : "scale-[0.75] opacity-50"
              }`}
            style={{
              minWidth: "calc(100% - 40px)",
              marginRight: !isLast && index === leftIndex ? "-40px" : 0,
              marginLeft: !isFirst && index === rightIndex ? "-40px" : 0,
            }}
          >
            {card}
          </div>
        )
      })}
    </div>
  );
};
