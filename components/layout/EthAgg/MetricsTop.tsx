"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Container from '../Container';
import HighchartsReact from 'highcharts-react-official';
import { HighchartsProvider, HighchartsChart, YAxis, Series, XAxis, Tooltip, Chart, ColumnSeries } from 'react-jsx-highcharts';
import Highcharts from 'highcharts';
import "@/app/highcharts.axis.css";
import { useLocalStorage } from 'usehooks-ts';
import { GTPIcon } from '../GTPIcon';
import { Icon } from '@iconify/react';
import { useMaster } from '@/contexts/MasterContext';
import { useTransition, animated } from "@react-spring/web";
import { useSearchParamBoolean, useSearchParamState } from '@/hooks/useSearchParamState';
import { tooltipPositioner } from '@/lib/chartUtils';
import { useSSEMetrics } from './useSSEMetrics';
import { FeeDisplayRow } from './FeeDisplayRow';
import { formatDuration, formatUptime, getGradientColor } from './helpers';
import { EthereumEvents } from '@/types/api/MasterResponse';
import CalendarIcon from '@/icons/svg/GTP-Calendar.svg';
import Image from 'next/image';
// Define the props type for TopEthAggMetricsComponent
interface TopEthAggMetricsProps {
  selectedBreakdownGroup: string;
}

// --- Configuration ---
const ETHEREUM_LAUNCH_DATE = new Date("2015-07-30T00:00:00Z");
const HISTORY_LIMIT = 18;
const TPS_HISTORY_LIMIT = 40;

// --- Utility Functions ---
const formatNumber = (number: number, decimals: number = 2): string => {
  if (number === 0) return "0";

  const absNumber = Math.abs(number);
  if (absNumber >= 1e12) return (number / 1e12).toFixed(decimals) + "T";
  if (absNumber >= 1e9) return (number / 1e9).toFixed(decimals) + "B";
  if (absNumber >= 1e6) return (number / 1e6).toFixed(decimals) + "M";
  if (absNumber >= 1e3) return (number / 1e3).toFixed(decimals) + "k";

  return number.toFixed(decimals);
};

const displayValue = (value: number | string | undefined, unit: string = '') => {
  if (value === undefined || value === null) return '-';
  const formattedValue = typeof value === 'number' && unit !== '' && !value.toString().includes('.')
    ? value
    : typeof value === 'number' ? value.toFixed(2) : value;
  return `${formattedValue}${unit}`;
};

// --- Sub-components ---
interface UptimeDisplayProps {
  selectedBreakdownGroup: string;
  eventHover: string | null;
  setEventHover: (value: string | null) => void;
  showEvents: boolean;
  handleToggleEvents: (e: React.MouseEvent) => void;
}



const UptimeDisplay = React.memo(({ selectedBreakdownGroup, eventHover, setEventHover, showEvents, handleToggleEvents }: UptimeDisplayProps) => {
  const uptimeData = useMemo(() => {
    return formatUptime(new Date().getTime() - new Date(1438269973000).getTime());
  }, []);

  const { data: masterData } = useMaster();

  const reversedEvents = useMemo(() => {
    return masterData ? [...masterData.ethereum_events].reverse() : [];
  }, [masterData]);

  if (!masterData) {
    return null;
  }

  const isCompact = selectedBreakdownGroup === "Ethereum Ecosystem";
  const isHidden = selectedBreakdownGroup === "Builders & Apps";

  return (
    <div className={`bg-[#1F2726] w-full transition-height duration-300 ${showEvents && 'z-dropdown'
      } ${isCompact ? 'h-[150px] overflow-hidden rounded-[15px] p-[15px]'
        : isHidden ? 'h-[0px] overflow-hidden p-0'
          : 'h-[306px] rounded-[15px] p-[15px]'
      }`}>
      <div className='heading-large-md mb-[15px]'>Ethereum Uptime</div>
      <div className='numbers-2xl mb-[30px]'>
        <div className='flex flex-col gap-y-[5px]'>
          <div className='bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
            {uptimeData.heading}
          </div>
          <div className='numbers-sm text-[#5A6462]'>{uptimeData.subheading}</div>
        </div>
      </div>

      {/* Events Section */}
      <div className={`relative flex flex-col overflow-hidden gap-y-[5px] transition-height duration-500 -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${showEvents ? 'pb-[10px] shadow-lg' : 'pb-0'
        } ${isCompact ? 'h-0' : 'h-auto'}`}>

        <div className={`flex flex-col gap-y-[2.5px] px-[15px] duration-300 overflow-y-hidden ${!showEvents ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''
          }`}
          style={{
            height: !showEvents ? `130px` : `${reversedEvents.length * 21 + 35}px`
          }}
        >
          <div className='heading-large-md text-[#5A6462]'>Events</div>
                    <div className="relative">
            {reversedEvents.map((event: any, index: number) => {
              const isThisEventHovered = eventHover === event.date;
              const isNextEventHovered = eventHover === reversedEvents[index + 1]?.date;

              return (
                <div key={event.date}>
                  {/* Event Item */}
                  <div
                    className="absolute w-full"
                    style={{ top: `${index * 21}px` }}
                  >
                    <EventItem
                      eventKey={event.date}
                      eventHover={eventHover}
                      setEventHover={setEventHover}
                      event={event}
                      index={index}
                    />
                  </div>
                  
                  {/* Separator Dots - only if not the last item */}
                  {index < reversedEvents.length - 1 && !isThisEventHovered && !isNextEventHovered && (index !== 0 || eventHover !== null) && (
                    <div
                      className="absolute flex-col gap-y-[3px] pt-[2px] flex items-center gap-x-[2px]"
                      style={{ 
                        top: `${index * 21 + 21 - 5}px`, // Position between items
                        left: '11px' // Center under the icon
                      }}
                    >
                      <div className="w-[2px] h-[2px] bg-[#5A6462] rounded-full"></div>
                      <div className="w-[2px] h-[2px] bg-[#5A6462] rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
        </div>

        <div className={`w-full h-[18px] flex items-center justify-center relative z-10 cursor-pointer top-[0px] transition-opacity duration-300 ${isCompact ? 'opacity-0' : 'opacity-100'
          }`} onClick={handleToggleEvents}>
          <div className={`pointer-events-none transition-transform absolute duration-300 ${showEvents ? 'rotate-180' : ''
            }`}>
            <GTPIcon icon='gtp-chevrondown-monochrome' size='md' className='text-[#5A6462]' />
          </div>
          <div className='pointer-events-none absolute right-[15px]'>
            <GTPIcon icon='gtp-info-monochrome' size='sm' className='text-[#5A6462]' />
          </div>
        </div>
      </div>
    </div>
  );
});

UptimeDisplay.displayName = "UptimeDisplay";

interface EventItemProps {
  eventKey: string;
  eventHover: string | null;
  setEventHover: (value: string | null) => void;
  event: EthereumEvents;
  index: number;
}

const EventIcon = ({ event, eventHover, index }: { event: EthereumEvents, eventHover: string | null, index: number }) => {
  const getMonthDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const fullMonth = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
      const shortMonth = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      
      // If full month name is 4 characters or shorter, use it; otherwise use short version
      return fullMonth.length <= 4 ? fullMonth : shortMonth;
    } catch {
      return 'JULY'; // fallback
    }
  };

  const eventHoverOverride = index === 0 && eventHover === null;

  const isThisEventHovered = eventHover === event.date;

  const showCalendar = isThisEventHovered || eventHoverOverride;

  return (
    <div className="relative min-w-[24px] min-h-[24px]">
      {/* Calendar */}
      <div className={`absolute inset-0 transition-all duration-300 ease-in-out ${
        showCalendar 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-90 pointer-events-none'
      }`}>
        <Image src={CalendarIcon} alt="Calendar" width={24} height={24} />
        <div className='absolute text-[#1F2726] -top-[0.5px] left-0 right-0 heading-small-xxxxxs text-center'>
          {getMonthDisplay(event.date)}
        </div>
        <div className='absolute text-[#1F2726] bottom-[5px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] bg-clip-text text-transparent left-0 right-0 numbers-xxxs text-center'>
          {Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(new Date(event.date))}
        </div>
      </div>
      
      {/* Circle */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
        !showCalendar 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-75 pointer-events-none'
      }`}>
        <div className='w-[8px] h-[8px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full'></div>
      </div>
    </div>
  )
}

const EventItem = React.memo(({ eventKey, eventHover, setEventHover, event, index }: EventItemProps) => (
  <div
    className={`transition-all h-[24px] text-truncate flex items-center gap-x-[2px] duration-300 cursor-default ${eventHover === eventKey || (eventHover === null && index === 0) ? 'text-xs' : 'text-xxxs text-[#5A6462]'
      } w-fit`}
    onMouseEnter={() => setEventHover(eventKey)}
    onMouseLeave={() => setEventHover(null)}
  >
    <EventIcon event={event} eventHover={eventHover} index={index} />
    <span className={`font-bold`}>{event.title}</span>
  </div>
));

EventItem.displayName = "EventItem";

interface TPSChartProps {
  totalTPSLive: number[];
  globalMetrics: any;
  showUsd: boolean;
}

const TPSChart = React.memo(({ totalTPSLive, globalMetrics, showUsd }: TPSChartProps) => {
  const tooltipFormatter = useCallback(function (this: any) {
    const { x, points } = this;
    const date = new Date(x);
    const valuePrefix = showUsd ? '$' : '';

    let dateString = date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timeDiff = points[0].series.xData[1] - points[0].series.xData[0];
    if (timeDiff < 1000 * 60 * 60 * 24) {
      dateString += " " + date.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const tooltip = `<div class="mt-3 mr-3 mb-3 text-xs font-raleway">
      <div class="w-full font-bold text-[13px] md:text-[1rem] ml-6 mb-2"></div>`;
    const tooltipEnd = `</div>`;

    const tooltipPoints = points
      .sort((a: any, b: any) => b.y - a.y)
      .map((point: any) => {
        const { y } = point;
        return `
        <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
          <div class="w-4 h-1.5 rounded-r-full" style="background-color: #1DF7EF"></div>
          <div class="tooltip-point-name text-xs"></div>
          <div class="flex-1 text-right justify-end flex numbers-xs">
            <div class="flex justify-end text-right w-full">
              <div class="${!valuePrefix && "hidden"}">${valuePrefix}</div>
              ${Intl.NumberFormat("en-GB", {
          notation: "standard",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(y)}
            </div>
          </div>
        </div>`;
      })
      .join("");

    return tooltip + tooltipPoints + tooltipEnd;
  }, [showUsd]);


  return <HighchartsProvider Highcharts={Highcharts}>
    <HighchartsChart>
      <Chart
        backgroundColor={"transparent"}
        type="column"
        colors={['#10808C', '#1DF7EF']}
        panning={{
          enabled: false,
          type: "x",
        }}
        panKey="shift"
        zooming={{
          mouseWheel: {
            enabled: false,
          },
        }}
        animation={{
          duration: 50,
        }}
        marginBottom={5}
        marginTop={5}
        marginLeft={40}
        marginRight={0}
        height={58} // 48 (figma) + 5 (marginBottom) + 5 (marginTop) = 58
        events={{
          redraw: function () {

            const chart = this;
            const series = chart.series[0];

            if (!series) {
              return;
            }

            const PLOT_WIDTH = chart.plotWidth; // Pixel width of plot area
            const BARS_VISIBLE = 40; // Number of bars to show
            const GAP_PX = 3; // pixel gap between bars

            const BAR_WIDTH_PX = (PLOT_WIDTH / BARS_VISIBLE) - GAP_PX;


            series.update({
              type: 'column',
              pointWidth: BAR_WIDTH_PX,
            }, false); // Update series with fixed point width


          },

        }}

      />
      <YAxis
        visible={true}
        type="linear"
        gridLineWidth={1}
        gridLineColor={"#5A6462"}
        gridLineDashStyle={"Solid"}
        startOnTick={true}
        endOnTick={true}
        tickAmount={2}
        gridZIndex={10}
        min={0}
        labels={{
          distance: 10,
          align: "right",
          useHTML: true,
          style: {
            whiteSpace: "nowrap",
            textAlign: "right",
            color: "rgb(215, 223, 222)",
            fontSize: "10px",
            fontWeight: "700",
            fontFamily: "Fira Sans",
          },
        }}
        zoomEnabled={false}
      >
        <ColumnSeries
          type="column"
          data={totalTPSLive}
          color={{
            linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
            stops: [
              [0, '#10808C'],
              [1, '#1DF7EF']
            ]
          }}
          shadow={{
            color: '#CDD8D3',
            offsetX: 0,
            offsetY: 0,
            opacity: 0.05,
            width: 2
          }}

          // pointPadding={4}
          // pointWidth={8}
          // groupPadding={0}
          colorByPoint={false}
          borderRadius={0}
          borderColor={"transparent"}
          animation={false}
        />
      </YAxis>
      <XAxis
        type="linear"
        gridLineWidth={0}
        lineWidth={0}
        tickLength={10}
        labels={{
          enabled: false
        }}
        min={0}
        max={39}
        tickColor={"#5A6462"}

        tickWidth={0}
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
        borderRadius={12}
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
        formatter={tooltipFormatter}
        // ensure tooltip is always above the chart
        valuePrefix={showUsd ? "$" : ""}
        valueSuffix={showUsd ? "" : " Gwei"}
        positioner={tooltipPositioner}
      />
    </HighchartsChart>

  </HighchartsProvider>;
});

TPSChart.displayName = "TPSChart";

interface ChainTransitionItemProps {
  chainId: string;
  chainData: any;
  AllChainsByKeys: any;
  globalMetrics: any;
  type: 'tps' | 'cost';
  showUsd?: boolean;
}

const ChainTransitionItem = React.memo(({
  chainId,
  chainData,
  AllChainsByKeys,
  globalMetrics,
  type,
  showUsd = false
}: ChainTransitionItemProps) => {
  const chain = AllChainsByKeys[chainId];


  const chainColor = chain.colors.dark[0];
  const chainName = chain.name_short;

  const value = useMemo(() => {
    if (type === 'tps') {
      return chainData[chainId]?.tps || 0;
    } else {
      const costKey = showUsd ? 'tx_cost_erc20_transfer_usd' : 'tx_cost_erc20_transfer';
      return chainData[chainId]?.[costKey] || 0;
    }
  }, [chainData, chainId, type, showUsd]);

  const displayValue = useMemo(() => {
    if (type === 'tps') {
      return Intl.NumberFormat('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value);
    } else {
      return showUsd
        ? "$" + Intl.NumberFormat('en-US', {
          maximumFractionDigits: 4,
          minimumFractionDigits: 4
        }).format(value)
        : formatNumber(value * 1000000000, 0);
    }
  }, [value, type, showUsd]);

  const barWidth = useMemo(() => {
    if (type === 'tps') {
      return value && globalMetrics.highest_tps ? `${value / globalMetrics.highest_tps * 100}%` : '0%';
    } else {
      return value && globalMetrics['highest_l2_cost_usd']
        ? `${chainData[chainId]['tx_cost_erc20_transfer_usd'] / globalMetrics.highest_l2_cost_usd * 100}%`
        : '0%';
    }
  }, [value, globalMetrics, type, chainData, chainId]);

  if (!chain) return null;

  return (
    <div className='flex flex-col w-full items-center justify-between'>
      <div className='flex w-full items-center justify-between'>
        <div className='flex w-[115px] gap-x-[5px] items-center'>
          <div
            className='w-[15px] h-[10px] rounded-r-full'
            style={{ backgroundColor: chainColor }}
          />
          <div className="text-xs">{chainName}</div>
        </div>
        <div className='flex items-center relative justify-end' style={{ width: '140px', height: '18px' }}>
          <div className='numbers-xs flex gap-x-[2px] items-center h-[10px]'>
            {displayValue}
            {!showUsd && type === 'cost' && (
              <span className="heading-small-xxxs pt-[2px]"> Gwei</span>
            )}
          </div>
        </div>
      </div>
      <div className='flex items-end w-full justify-end'>
        <div
          className='h-[2px]'
          style={{
            width: barWidth,
            backgroundColor: chainColor
          }}
        />
      </div>
    </div>
  );
});

ChainTransitionItem.displayName = "ChainTransitionItem";

// --- Main Components ---
interface RealTimeMetricsProps {
  selectedBreakdownGroup: string;
}

const RealTimeMetrics = ({ selectedBreakdownGroup }: RealTimeMetricsProps) => {
  const { chainData, globalMetrics, lastUpdated, connectionStatus } = useSSEMetrics();
  const { AllChainsByKeys } = useMaster();

  // Consolidated state
  const [uiState, setUiState] = useState({
    eventHover: null as string | null,
    ethCostHoverIndex: null as number | null,
    ethCostSelectedIndex: 17,
    l2CostHoverIndex: null as number | null,
    l2CostSelectedIndex: 17,
  });

  // History state with proper typing
  const [historyState, setHistoryState] = useState({
    totalTPSLive: [] as number[],
    ethCostLive: [] as number[],
    layer2CostLive: [] as number[],
    chainsCostHistory: {} as { [key: string]: number[] },
    chainsTPSHistory: {} as { [key: string]: number[] },
  });

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showChainsTPS, setShowChainsTPS] = useSearchParamBoolean("tps", false, {
    debounceMs: 150, // Longer debounce for UI toggles
  });
  const [showChainsCost, setShowChainsCost] = useSearchParamBoolean("cost", false, {
    debounceMs: 150,
  });
  const [showEvents, setShowEvents] = useSearchParamBoolean("events", false, {
    debounceMs: 150,
  });

  // Memoized calculations
  const filteredTPSChains = useMemo(() => {
    return Object.keys(historyState.chainsTPSHistory)
      .filter((chain) => chainData[chain]?.tps)
      .sort((a, b) =>
        historyState.chainsTPSHistory[b][historyState.chainsTPSHistory[b].length - 1] -
        historyState.chainsTPSHistory[a][historyState.chainsTPSHistory[a].length - 1]
      )
      .map((chainId, index) => ({
        chainId,
        y: index * 21,
        height: 18,
      }));
  }, [historyState.chainsTPSHistory, chainData]);

  const filteredCostChains = useMemo(() => {
    const costKey = showUsd ? 'tx_cost_erc20_transfer_usd' : 'tx_cost_erc20_transfer';
    return Object.keys(historyState.chainsCostHistory)
      .filter((chain) => {
        const cost = chainData[chain]?.[costKey];
        const isEthereum = AllChainsByKeys[chain]?.key === 'ethereum';
        return cost > 0 && !isEthereum;
      })
      .sort((a, b) =>
        historyState.chainsCostHistory[b][historyState.chainsCostHistory[b].length - 1] -
        historyState.chainsCostHistory[a][historyState.chainsCostHistory[a].length - 1]
      )
      .map((chainId, index) => ({
        chainId,
        y: index * 21,
        height: 18,
      }));
  }, [historyState.chainsCostHistory, chainData, showUsd, AllChainsByKeys]);

  // Optimized transitions
  const tpsTransitions = useTransition(filteredTPSChains, {
    key: (item) => item.chainId,
    from: { opacity: 0, height: 0, y: 0 },
    leave: { opacity: 0, height: 0 },
    enter: ({ y, height }) => ({ opacity: 1, y, height }),
    update: ({ y, height }) => ({ opacity: 1, y, height }),
    config: { mass: 1, tension: 280, friction: 60 },
    trail: 25,
  });

  const costTransitions = useTransition(filteredCostChains, {
    key: (item) => item.chainId,
    from: { opacity: 0, height: 0, y: 0 },
    leave: { opacity: 0, height: 0 },
    enter: ({ y, height }) => ({ opacity: 1, y, height }),
    update: ({ y, height }) => ({ opacity: 1, y, height }),
    config: { mass: 1, tension: 280, friction: 60 },
    trail: 25,
  });

  // Optimized event handlers
  const handleToggleTPS = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChainsTPS(!showChainsTPS);
  }, [showChainsTPS, setShowChainsTPS]);

  const handleToggleCost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChainsCost(!showChainsCost);
  }, [showChainsCost, setShowChainsCost]);

  const handleToggleEvents = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEvents(!showEvents);
  }, [showEvents, setShowEvents]);

  const handleCloseModals = useCallback(() => {
    setShowChainsCost(false);
    setShowChainsTPS(false);
    setShowEvents(false);
  }, [setShowChainsCost, setShowChainsTPS, setShowEvents]);

  // Optimized effects
  useEffect(() => {
    if (!globalMetrics) return;

    setHistoryState(prev => ({
      ...prev,
      totalTPSLive: prev.totalTPSLive.length >= TPS_HISTORY_LIMIT
        ? [...prev.totalTPSLive.slice(1), globalMetrics.total_tps ?? 0]
        : [...prev.totalTPSLive, globalMetrics.total_tps ?? 0],
      ethCostLive: prev.ethCostLive.length >= HISTORY_LIMIT
        ? [...prev.ethCostLive.slice(1), globalMetrics.ethereum_tx_cost_usd ?? 0]
        : [...prev.ethCostLive, globalMetrics.ethereum_tx_cost_usd ?? 0],
      layer2CostLive: prev.layer2CostLive.length >= HISTORY_LIMIT
        ? [...prev.layer2CostLive.slice(1), globalMetrics.layer2s_tx_cost_usd ?? 0]
        : [...prev.layer2CostLive, globalMetrics.layer2s_tx_cost_usd ?? 0],
    }));
  }, [globalMetrics]);

  useEffect(() => {
    if (!chainData || Object.keys(chainData).length === 0) return;

    setHistoryState(prev => {
      const newCostHistory = { ...prev.chainsCostHistory };
      const newTpsHistory = { ...prev.chainsTPSHistory };
      let hasChanges = false;

      for (const chainId in chainData) {
        if (chainData.hasOwnProperty(chainId)) {
          const chain = chainData[chainId];

          // Update cost history
          const costValue = chain[showUsd ? 'tx_cost_erc20_transfer_usd' : 'tx_cost_erc20_transfer'] ?? 0;
          const currentCostHistory = newCostHistory[chainId] || [];
          const updatedCostHistory = [...currentCostHistory, costValue].slice(-HISTORY_LIMIT);

          if (!newCostHistory[chainId] || newCostHistory[chainId].join(',') !== updatedCostHistory.join(',')) {
            newCostHistory[chainId] = updatedCostHistory;
            hasChanges = true;
          }

          // Update TPS history
          const tpsValue = chain.tps ?? 0;
          const currentTpsHistory = newTpsHistory[chainId] || [];
          const updatedTpsHistory = [...currentTpsHistory, tpsValue].slice(-HISTORY_LIMIT);

          if (!newTpsHistory[chainId] || newTpsHistory[chainId].join(',') !== updatedTpsHistory.join(',')) {
            newTpsHistory[chainId] = updatedTpsHistory;
            hasChanges = true;
          }
        }
      }

      return hasChanges ? {
        ...prev,
        chainsCostHistory: newCostHistory,
        chainsTPSHistory: newTpsHistory,
      } : prev;
    });
  }, [chainData, showUsd]);

  if (globalMetrics === undefined || chainData === undefined) {
    return null;
  }

  const isCompact = selectedBreakdownGroup === "Ethereum Ecosystem";
  const isHidden = selectedBreakdownGroup === "Builders & Apps";


  return (
    <>
      {(showChainsCost || showChainsTPS || showEvents) && (
        <div
          className='fixed inset-0 bg-black/30 z-dropdown-background'
          onClick={handleCloseModals}
        />
      )}

      {connectionStatus === 'connected' && (
        <div className='flex flex-col xl:flex-row gap-[15px] w-full'>
          <UptimeDisplay
            selectedBreakdownGroup={selectedBreakdownGroup}
            eventHover={uiState.eventHover}
            setEventHover={(value) => setUiState(prev => ({ ...prev, eventHover: value }))}
            showEvents={showEvents}
            handleToggleEvents={handleToggleEvents}
          />

          {/* TPS Section */}
          <div className={`flex flex-col gap-y-[15px] bg-[#1F2726] min-w-0 w-full transition-height duration-300 ${showChainsTPS && 'z-dropdown'
            } ${isCompact ? 'h-[150px] overflow-hidden rounded-[15px] p-[15px]'
              : isHidden ? 'h-[0px] overflow-hidden p-0'
                : 'h-[306px] rounded-[15px] p-[15px]'}`}>

            <div className={`heading-large-md transition-transform duration-500 ${isCompact ? 'mb-[10px]' : 'mb-[0px]'
              }`}>
              {isCompact ? 'Ecosystem Transactions Per Second' : 'Ethereum Ecosystem TPS'}
            </div>

            <div className='flex flex-col gap-y-[30px] mb-[20px]'>
              <div className="flex flex-row justify-between">
                <div className='numbers-2xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
                  {Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                  }).format(globalMetrics.total_tps || 0)}
                </div>
                <div className='numbers-xs flex items-center gap-x-0.5'><span className='text-xs'>Max (24h):</span>{globalMetrics.total_tps_24h_high || 0} TPS</div>
                <div className='numbers-xs flex items-center gap-x-0.5'><span className='text-xs'>ATH:</span>{globalMetrics.total_tps_ath || 0} TPS</div>
              </div>

              <div className={`w-full -mt-[5px]`}>
                <div className={`transition-height duration-500 overflow-hidden ${isCompact ? 'h-0' : 'h-[58px]'
                  }`}>
                  <TPSChart
                    totalTPSLive={historyState.totalTPSLive}
                    globalMetrics={globalMetrics}
                    showUsd={showUsd}
                  />
                </div>
              </div>
            </div>

            {/* TPS Chains List */}
            <div className={`relative flex flex-col gap-y-[5px] transition-height duration-500 -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${showChainsTPS ? 'pb-[10px] shadow-lg' : 'pb-0'
              } ${isCompact ? 'h-0' : 'h-auto'}`}>

              <div className={`flex flex-col gap-y-[2.5px] px-[15px] duration-300 overflow-y-hidden ${!showChainsTPS ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''
                }`}
                style={{
                  height: !showChainsTPS ? `80px` : `${filteredTPSChains.length * 21 + 35}px`
                }}
              >
                <div className='heading-large-md text-[#5A6462]'>Chains</div>
                <div className="relative">
                  {tpsTransitions((style, { chainId }) => (
                    <animated.div
                      key={chainId}
                      style={style}
                      className='absolute w-full'
                    >
                      <ChainTransitionItem
                        chainId={chainId}
                        chainData={chainData}
                        AllChainsByKeys={AllChainsByKeys}
                        globalMetrics={globalMetrics}
                        type="tps"
                      />
                    </animated.div>
                  ))}
                </div>
              </div>

              <div className={`w-full h-[18px] flex items-center justify-center relative z-10 cursor-pointer top-[0px] transition-opacity duration-300 ${isCompact ? 'opacity-0' : 'opacity-100'
                }`} onClick={handleToggleTPS}>
                <div className={`pointer-events-none transition-transform absolute duration-300 ${showChainsTPS ? 'rotate-180' : ''
                  }`}>
                  <GTPIcon icon='gtp-chevrondown-monochrome' size='md' className='text-[#5A6462]' />
                </div>
                <div className='pointer-events-none absolute right-[15px]'>
                  <GTPIcon icon='gtp-info-monochrome' size='sm' className='text-[#5A6462]' />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Section */}
          <div className={`bg-[#1F2726] min-w-0 w-full transition-height duration-300 ${showChainsCost && 'z-dropdown'
            } ${isCompact ? 'h-[150px] overflow-hidden rounded-[15px] py-[15px] px-[15px]'
              : isHidden ? 'h-[0px] overflow-hidden p-0'
                : 'h-[306px] rounded-[15px] py-[15px] px-[15px]'}`}>

            <div className={`heading-large-md ${isCompact ? 'mb-[10px]' : 'mb-[30px]'}`}>
              Token Transfer Fee
            </div>

            <div className='pt-[15px] mb-[50px] flex flex-col gap-y-[15px]'>
              <FeeDisplayRow
                title="Ethereum Mainnet"
                costValue={globalMetrics[showUsd ? 'ethereum_tx_cost_usd' : 'ethereum_tx_cost_eth'] || 0}
                costHistory={historyState.ethCostLive}
                showUsd={showUsd}
                gradientClass="from-[#596780] to-[#94ABD3]"
                selectedIndex={uiState.ethCostSelectedIndex}
                hoverIndex={uiState.ethCostHoverIndex}
                onSelect={(index) => setUiState(prev => ({ ...prev, ethCostSelectedIndex: index }))}
                onHover={(index) => setUiState(prev => ({ ...prev, ethCostHoverIndex: index }))}
                getGradientColor={getGradientColor}
                formatNumber={formatNumber}
              />
              <FeeDisplayRow
                title="Layer 2s"
                costValue={globalMetrics[showUsd ? 'layer2s_tx_cost_usd' : 'layer2s_tx_cost_eth'] || 0}
                costHistory={historyState.layer2CostLive}
                showUsd={showUsd}
                gradientClass="from-[#FE5468] to-[#FFDF27]"
                selectedIndex={uiState.l2CostSelectedIndex}
                hoverIndex={uiState.l2CostHoverIndex}
                onSelect={(index) => setUiState(prev => ({ ...prev, l2CostSelectedIndex: index }))}
                onHover={(index) => setUiState(prev => ({ ...prev, l2CostHoverIndex: index }))}
                getGradientColor={getGradientColor}
                formatNumber={formatNumber}
              />
            </div>

            {/* Cost Chains List */}
            <div className={`relative flex flex-col gap-y-[5px] -mx-[15px] bg-[#1F2726] z-10 rounded-b-[15px] ${showChainsCost ? 'z-dropdown pb-[10px] shadow-lg' : 'pb-0'
              }`}>

              <div className={`flex flex-col gap-y-[2.5px] px-[15px] transition-height duration-500 overflow-y-hidden ${!showChainsCost ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''
                }`}
                style={{
                  height: !showChainsCost ? `80px` : `${filteredCostChains.length * 21 + 35}px`
                }}
              >
                <div className='heading-large-md text-[#5A6462]'>Layer 2s</div>
                <div className="relative">
                  {costTransitions((style, { chainId }) => (
                    <animated.div
                      key={`cost-${chainId}`}
                      style={style}
                      className='absolute w-full'
                    >
                      <ChainTransitionItem
                        chainId={chainId}
                        chainData={chainData}
                        AllChainsByKeys={AllChainsByKeys}
                        globalMetrics={globalMetrics}
                        type="cost"
                        showUsd={showUsd}
                      />
                    </animated.div>
                  ))}
                </div>
              </div>

              <div className={`w-full h-[18px] flex items-center justify-center relative z-10 cursor-pointer top-[0px] transition-opacity duration-300 ${isCompact ? 'opacity-0' : 'opacity-100'
                }`} onClick={handleToggleCost}>
                <div className={`pointer-events-none transition-transform absolute duration-300 ${showChainsCost ? 'rotate-180' : ''
                  }`}>
                  <GTPIcon icon='gtp-chevrondown-monochrome' size='md' className='text-[#5A6462]' />
                </div>
                <div className='pointer-events-none absolute right-[15px]'>
                  <GTPIcon icon='gtp-info-monochrome' size='sm' className='text-[#5A6462]' />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function TopEthAggMetricsComponent({ selectedBreakdownGroup }: TopEthAggMetricsProps) {
  return (
    <Container className="">
      <RealTimeMetrics selectedBreakdownGroup={selectedBreakdownGroup} />
    </Container>
  );
}

export default TopEthAggMetricsComponent;