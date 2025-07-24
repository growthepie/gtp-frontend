"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Container from '../Container';
import { useLocalStorage } from 'usehooks-ts';
import { GTPIcon } from '../GTPIcon';
import { Icon } from '@iconify/react';
import { useMaster } from '@/contexts/MasterContext';
import { useTransition, animated } from "@react-spring/web";
import { useSearchParamBoolean, useSearchParamState } from '@/hooks/useSearchParamState';
import { tooltipPositioner } from '@/lib/chartUtils';
import { useSSEMetrics } from './useSSEMetrics';
import { FeeDisplayRow } from './FeeDisplayRow';
import { formatUptime, getGradientColor } from './helpers';
import { EthereumEvents } from '@/types/api/MasterResponse';
import CalendarIcon from '@/icons/svg/GTP-Calendar.svg';
import Image from 'next/image';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import useSWR from 'swr';
import { ChainMetrics, HistoryData, HistoryItem } from './types';
import { useMediaQuery } from 'usehooks-ts';

import { TPSChart } from './TPSChart';
import { throttle } from 'lodash';
import { LinkButton } from '../LinkButton';
import moment from 'moment';

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




interface ExpandableCardContainerProps {
  /** The content of the card. */
  children: React.ReactNode;
  /** Controls the expanded/collapsed state of the card. */
  isExpanded: boolean;
  /** Callback function to toggle the expansion state. */
  onToggleExpand: (e: React.MouseEvent) => void;
  /** If true, the card is in a compact state, hiding the expansion button and content. */
  isCompact?: boolean;
  /** Optional className for the main container `div`. */
  className?: string;
  /** A slot for a component, like an icon with a tooltip, on the right side of the expand button. */
  infoSlot?: React.ReactNode;
}

/**
 * A reusable container for cards that can be expanded to show more details.
 * It provides the background, the main content area, an expandable content area,
 * and a button to control the expansion.
 */
export const ExpandableCardContainer: React.FC<ExpandableCardContainerProps> = ({
  children,
  isExpanded,
  onToggleExpand,
  isCompact = false,
  className = '',
  infoSlot,
}) => {
  const [isExpandButtonHovered, setIsExpandButtonHovered] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const ExpandButton = (
    <div
      className="expandable-card-expand-button absolute bottom-0 left-0 right-0 w-full py-[15px] px-[15px] h-fit flex items-center justify-center cursor-pointer"
      onClick={(e) => {
        // Don't expand if clicking on the tooltip trigger
        const target = e.target as HTMLElement;
        const isTooltipTrigger = target.closest('[data-tooltip-trigger]');
        if (!isTooltipTrigger || !isMobile) {
          onToggleExpand(e);
        }
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="w-[15px] h-fit" />
        <div className={`pointer-events-none transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <GTPIcon icon="gtp-chevrondown-monochrome" size="md" className="text-[#5A6462]" />
        </div>

        {/* Default info icon can be overridden by the infoSlot prop */}
        <div className='w-[15px] h-fit z-30'>
          <GTPTooltipNew
            placement="top-start"
            size="md"
            allowInteract={true}
            trigger={
              <div
                className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'}`}
                data-tooltip-trigger
              >
                <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-[#5A6462]" />
              </div>
            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}

          >
            <div>
              <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                {infoSlot}
              </TooltipBody>
            </div>
          </GTPTooltipNew>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative h-full min-h-[306px] w-full">
      <div
        className={`@container expandable-card-container w-full bg-[#1F2726] rounded-[15px] transition-all duration-300 flex flex-col py-[15px] px-[30px]
          ${isExpanded && !isCompact
            ? 'relative @[1040px]:absolute top-0 left-0 h-auto z-[1001] shadow-card-dark'
            : 'relative overflow-hidden duration-500'
          }
          ${isExpandButtonHovered && '!z-[1001]'}
          ${className}`
        }
        onMouseEnter={() => setIsExpandButtonHovered(true)}
        onMouseLeave={() => setIsExpandButtonHovered(false)}
      >
        {children}
        {!isCompact && ExpandButton}
      </div>
    </div>
  );
};

// --- Ethereum Uptime Card ---
interface EthereumUptimeCardProps {
  selectedBreakdownGroup: string;
  eventHover: string | null;
  setEventHover: (value: string | null) => void;
  eventExpanded: string | null;
  handleToggleEventExpansion: (eventKey: string) => void;
  handleSetExpandedEvent: (eventKey: string) => void;
  showEvents: boolean;
  handleToggleEvents: (e: React.MouseEvent) => void;
}

const EthereumUptimeCard = React.memo(({ selectedBreakdownGroup, eventHover, setEventHover, eventExpanded, handleToggleEventExpansion, handleSetExpandedEvent, showEvents, handleToggleEvents }: EthereumUptimeCardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [isEventsHovered, setIsEventsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update the time every second for live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const uptimeData = useMemo(() => {
    return formatUptime(currentTime - new Date(1438269973000).getTime());
  }, [currentTime]);

  const { data: masterData } = useMaster();

  const reversedEvents = useMemo(() => {
    return masterData ? [...masterData.ethereum_events].reverse() : [];
  }, [masterData]);


  // 1. Stable refs that always hold the latest values
  const showEventsRef = useRef(showEvents);
  const reversedEventsRef = useRef(reversedEvents);
  const eventExpandedRef = useRef(eventExpanded);

  useEffect(() => {
    showEventsRef.current = showEvents;
    reversedEventsRef.current = reversedEvents;
    eventExpandedRef.current = eventExpanded;
  });

  // 2. Create the throttled function once (1000 ms lock)
  const throttledWheelHandlerRef = useRef<(e: WheelEvent) => void>();
  if (!throttledWheelHandlerRef.current) {
    throttledWheelHandlerRef.current = throttle(
      (e: WheelEvent) => {
        if (
          !showEventsRef.current ||
          reversedEventsRef.current.length === 0 ||
          !eventExpandedRef.current
        ) {
          return;
        }

        const idx = reversedEventsRef.current.findIndex(
          ev => ev.date === eventExpandedRef.current
        );
        if (idx === -1) return;

        const next = e.deltaY > 0 ? idx + 1 : idx - 1;
        if (next >= 0 && next < reversedEventsRef.current.length) {
          handleSetExpandedEvent(reversedEventsRef.current[next].date);
        }
      },
      300,                       // ← throttle interval
      { leading: true, trailing: false }
    );
  }

  // 3. Attach / detach on hover
  useEffect(() => {
    if (!isEventsHovered || !showEvents || showEvents && !eventExpanded) return;

    const wheelListener = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      throttledWheelHandlerRef.current!(e);
    };

    document.addEventListener('wheel', wheelListener, { passive: false });
    return () => document.removeEventListener('wheel', wheelListener);
  }, [isEventsHovered, showEvents, eventExpanded]);


  const [listRef, { height: listHeight }] = useElementSizeObserver<HTMLDivElement>();

  if (!masterData) {
    return null;
  }

  const UNEXPANDED_LIST_HEIGHT = 164;
  const EXPANDED_LIST_HEIGHT = listHeight + 24 + 50;


  const isCompact = selectedBreakdownGroup === "Ethereum Ecosystem";
  const isHidden = selectedBreakdownGroup === "Builders & Apps";

  // Define the main content to pass to the container
  const mainContent = (
    <>
      <div className='heading-large-md pb-[15px]'>Ethereum Uptime</div>
      <div className='numbers-2xl pb-[30px] h-[73px] overflow-visible'>
        <div className='flex flex-col gap-y-[5px]'>
          <div className='bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>
            {uptimeData.heading}
          </div>
          <div className='numbers-sm text-[#5A6462]'>{uptimeData.subheading}</div>
        </div>
      </div>
    </>
  );

  // Define the expanded content to pass to the container
  const expandedContent = (
    <div 
      className={`relative flex flex-col overflow-hidden gap-y-[5px] transition-[max-height] duration-500 -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${showEvents ? 'pb-[10px]' : 'pb-0'}`}
      style={{
        maxHeight: showEvents ? `${EXPANDED_LIST_HEIGHT+10}px` : `${UNEXPANDED_LIST_HEIGHT+10}px`,
      }}
    >
      <div
        className={`flex flex-col gap-y-[2.5px] px-[15px] transition-height duration-300 overflow-y-hidden ${!showEvents && !isCompact ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''}`}
        style={{
          height: !showEvents ? `${UNEXPANDED_LIST_HEIGHT}px` : `${EXPANDED_LIST_HEIGHT}px`
        }}
      >
        <div className='heading-large-md text-[#5A6462] mb-2'>Network Upgrades</div>
        <div ref={listRef} className="relative">
          {reversedEvents.map((event: any, index: number) => {
            return (
              <div key={event.date}>
                <EventItem eventKey={event.date} eventHover={eventHover} setEventHover={setEventHover} eventExpanded={eventExpanded} handleToggleEventExpansion={handleToggleEventExpansion} event={event} index={index} nextEvent={reversedEvents[index + 1]} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`@container w-full transition-height duration-300
        ${isCompact ? 'h-[150px]'
          : isHidden ? 'h-[0px] overflow-hidden'
            : '@[1040px]:h-[306px] min-h-[306px]'
        }`}
      onMouseEnter={() => setIsEventsHovered(true)}
      onMouseLeave={() => setIsEventsHovered(false)}
    >
      <ExpandableCardContainer
        isExpanded={showEvents}
        onToggleExpand={handleToggleEvents}
        isCompact={isCompact}
        // this expandable card should have a higher z-index than the rest
        // infoSlot could be used here to add a tooltip if needed
        infoSlot={"Uptime shows how long Ethereum has been running without interruptions. It is calculated from the genesis block on July 30, 2015."}
      >
        {mainContent}

        {expandedContent}
      </ExpandableCardContainer>
    </div>
  );
});

EthereumUptimeCard.displayName = "EthereumUptimeCard";


// --- Ethereum Ecosystem TPS Card ---
interface EthereumEcosystemTPSCardProps {
  selectedBreakdownGroup: string;
  showChainsTPS: boolean;
  handleToggleTPS: (e: React.MouseEvent) => void;
  // activeGlobalMetrics: any;
  // activeChainData: any;
  // chainsTPSHistory: { [key: string]: number[] };
  // totalTPSLive: number[];
  // AllChainsByKeys: any;
  // showUsd: boolean;
}

// Define the type for a single history item for clarity
export type TPSChartHistoryItem = {
  tps: number;
  timestamp: string;
};

export const EthereumEcosystemTPSCard = React.memo(({
  selectedBreakdownGroup,
  showChainsTPS,
  handleToggleTPS,
}: EthereumEcosystemTPSCardProps) => {
  const { AllChainsByKeys } = useMaster();
  // const [showChainsTPS, setShowChainsTPS] = useSearchParamBoolean("showChainsTPS", false);

  // --- DATA FETCHING ---
  const { data: initialHistory } = useSWR<HistoryData>("https://sse.growthepie.com/api/history");
  const { chainData, globalMetrics, lastUpdated } = useSSEMetrics();

  // --- STATE MANAGEMENT ---

  // State for the TPS chart. Combines initial history with live updates.
  const [tpsHistory, setTpsHistory] = useState<TPSChartHistoryItem[]>([]);

  // 1. Initialize the chart's history from the initial API fetch.
  // The history is reversed to display time chronologically from left to right.
  useEffect(() => {
    if (initialHistory?.history) {
      setTpsHistory([...initialHistory.history].reverse());
    }
  }, [initialHistory]);

  // 2. Append new live data points from the SSE stream to the chart's history.
  useEffect(() => {
    if (globalMetrics.total_tps && lastUpdated && tpsHistory.length > 0) {
      const newPoint: TPSChartHistoryItem = {
        tps: globalMetrics.total_tps,
        timestamp: lastUpdated.toISOString(),
      };

      // Prevent adding duplicate points for the same timestamp
      if (tpsHistory[tpsHistory.length - 1]?.timestamp !== newPoint.timestamp) {
        setTpsHistory((prev) => {
          const updatedHistory = [...prev, newPoint];
          // Keep the chart performant by only showing the last ~100 data points
          return updatedHistory.slice(-100);
        });
      }
    }
  }, [globalMetrics.total_tps, lastUpdated]); // Note: tpsHistory is intentionally omitted from deps

  const isCompact = selectedBreakdownGroup === "Ethereum Ecosystem";
  const isHidden = selectedBreakdownGroup === "Builders & Apps";

  // --- MEMOIZED CALCULATIONS ---

  // Correctly derive the sorted list of chains for display directly from the live `chainData`
  const filteredTPSChains = useMemo(() => {
    return Object.entries(chainData)
      .map(([chainId, metrics]) => ({ ...metrics, chainId })) // Add chainId to the object
      .filter((data) => data.tps && data.tps > 0 )
      .sort((a, b) => (b.tps || 0) - (a.tps || 0))
      .map((data, index) => ({
        chainId: data.chainId,
        y: index * 21,
        height: 18,
      }));
  }, [chainData]);

  const tpsTransitions = useTransition(filteredTPSChains, {
    key: (item) => item.chainId,
    from: { opacity: 0, height: 0, y: 0 },
    enter: ({ y, height }) => ({ opacity: 1, y, height }),
    update: ({ y, height }) => ({ opacity: 1, y, height }),
    leave: { opacity: 0, height: 0 },
    config: { mass: 0.5, tension: 100, friction: 10, duration: 300 },
    trail: 25,
  });

  // const handleToggleTPS = useCallback((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   setShowChainsTPS(!showChainsTPS);
  // }, [showChainsTPS, setShowChainsTPS]);

  const UNEXPANDED_LIST_HEIGHT = 96;
  const EXPANDED_LIST_HEIGHT = filteredTPSChains.length * 21 + 24 + 50;

  // --- RENDER LOGIC ---

  const content = (
    <>
      <div className={`heading-large-md transition-transform duration-500 pb-[15px]`}>
        {isCompact ? 'Ecosystem Transactions Per Second' : 'Ethereum Ecosystem TPS'}
      </div>

      <div className='relative flex flex-col gap-y-[30px] mb-[20px]'>
        <div className={`grid ${isCompact ? 'grid-cols-[0fr,0fr,1fr] ' : 'grid-cols-[1fr,1fr,1fr] '} justify-between items-center transition-[grid-template-columns] duration-500`}>
          {/* All-Time High */}
          <div className={`group flex flex-col gap-y-[2px] overflow-hidden ${isCompact ? 'opacity-0' : 'opacity-100'}`}>
            <div className='heading-small-xxxs text-[#5A6462]'>
              <div className='group-hover:hidden'>All-Time High</div>
              <div className='hidden group-hover:block'>{moment.utc(globalMetrics.total_tps_ath_timestamp).format("D/M/Y HH:mm UTC")}</div>
            </div>
            <div className='numbers-sm'>{globalMetrics.total_tps_ath?.toLocaleString("en-GB", { maximumFractionDigits: 0 }) || 0} TPS</div>
          </div>
          {/* 24h Peak */}
          <div className={`group flex flex-col gap-y-[2px] overflow-hidden ${isCompact ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
            <div className='heading-small-xxxs text-[#5A6462]'>
              <div className='group-hover:hidden'>24h Peak</div>
              <div className='hidden group-hover:block'>{moment.utc(globalMetrics.total_tps_24h_high_timestamp).format("D/M/Y HH:mm UTC")}</div>
            </div>
            <div className='numbers-sm'>{globalMetrics.total_tps_24h_high?.toLocaleString("en-GB", { maximumFractionDigits: 0 }) || 0} TPS</div>
          </div>
          {/* Live TPS */}
          <div className={`flex flex-col ${isCompact ? 'items-start' : 'items-end '} transition-[justify-items] duration-500`}>
            <div className='flex flex-1 gap-x-1 numbers-2xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent whitespace-nowrap'>
              <div>{Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(globalMetrics.total_tps || 0)}</div>
              <div>TPS</div>
            </div>
            {isCompact && <div className='h-0 overflow-visible heading-small-xs text-[#5A6462] pt-[5px] whitespace-nowrap'>all chains combined</div>}
          </div>
        </div>

        {/* TPS Chart - Pass the combined historical and live data */}
        <div className={`relative transition-height duration-500 w-full ${isCompact ? 'h-0 overflow-hidden' : 'h-[63px] overflow-visible '}`}>
          <TPSChart data={tpsHistory} />
        </div>
      </div>

      {/* TPS Chains List */}
      <div className={`relative flex flex-col gap-y-[5px] transition-height duration-500 -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${isCompact ? 'h-0' : 'h-auto'}`}>
        <div
          className={`flex flex-col gap-y-[2.5px] px-[15px] duration-300 overflow-y-hidden ${!showChainsTPS && !isCompact ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''}`}
          style={{ height: !showChainsTPS ? `${UNEXPANDED_LIST_HEIGHT}px` : `${EXPANDED_LIST_HEIGHT}px` }}
        >
          <div className='heading-large-md text-[#5A6462]'>All Chains</div>
          <div className="relative">
            {tpsTransitions((style, { chainId }) => (
              <animated.div key={chainId} style={style} className='absolute w-full'>
                {/* Pass the complete `chainData` object */}
                <ChainTransitionItem chainId={chainId} chainData={chainData} AllChainsByKeys={AllChainsByKeys} globalMetrics={globalMetrics} type="tps" />
              </animated.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={`@container w-full min-w-0 transition-height duration-300
      ${isCompact ? 'h-[150px]'
        : isHidden ? 'h-[0px] overflow-hidden'
          : '@[1040px]:h-[306px] min-h-[306px]'
      }`}>
      <ExpandableCardContainer
        isExpanded={showChainsTPS}
        onToggleExpand={handleToggleTPS}
        isCompact={isCompact}
        infoSlot={"TPS (Transactions-per-second) values are calculated by analyzing recent blocks on Ethereum Mainnet and Layer 2s. Please reach out to us if your Layer 2 is missing. Source: growthepie"}
      >
        {content}
      </ExpandableCardContainer>
    </div>
  );
});

EthereumEcosystemTPSCard.displayName = 'EthereumEcosystemTPSCard';
interface TokenTransferFeeCardProps {
  selectedBreakdownGroup: string;
  showChainsCost: boolean;
  handleToggleCost: (e: React.MouseEvent) => void;
  activeGlobalMetrics: any;
  activeChainData: any;
  ethCostLive: number[];
  layer2CostLive: number[];
  chainsCostHistory: { [key: string]: number[] };
  AllChainsByKeys: any;
  showUsd: boolean;
}

export const TokenTransferFeeCard = React.memo(({
  selectedBreakdownGroup,
  showChainsCost,
  handleToggleCost,
  activeGlobalMetrics,
  activeChainData,
  ethCostLive,
  layer2CostLive,
  chainsCostHistory,
  AllChainsByKeys,
  showUsd,
}: TokenTransferFeeCardProps) => {
  const [ethCostHoverIndex, setEthCostHoverIndex] = useState<number | null>(null);
  const [ethCostSelectedIndex, setEthCostSelectedIndex] = useState<number>(17);
  const [l2CostHoverIndex, setL2CostHoverIndex] = useState<number | null>(null);
  const [l2CostSelectedIndex, setL2CostSelectedIndex] = useState<number>(17);

  const isCompact = selectedBreakdownGroup === "Ethereum Ecosystem";
  const isHidden = selectedBreakdownGroup === "Builders & Apps";

  const ethDisplayValue = useMemo(() => {
    const index = ethCostHoverIndex !== null ? ethCostHoverIndex : ethCostSelectedIndex;
    // Fallback to the last known value if the index is out of bounds
    return ethCostLive[index] ?? ethCostLive[ethCostLive.length - 1] ?? 0;
  }, [ethCostHoverIndex, ethCostSelectedIndex, ethCostLive]);

  const l2DisplayValue = useMemo(() => {
    const index = l2CostHoverIndex !== null ? l2CostHoverIndex : l2CostSelectedIndex;
    return layer2CostLive[index] ?? layer2CostLive[layer2CostLive.length - 1] ?? 0;
  }, [l2CostHoverIndex, l2CostSelectedIndex, layer2CostLive]);

  const filteredCostChains = useMemo(() => {
    const costKey = showUsd ? 'tx_cost_erc20_transfer_usd' : 'tx_cost_erc20_transfer';
    return Object.keys(chainsCostHistory)
      .filter((chain) => {
        const cost = activeChainData?.[chain]?.[costKey];
        const isEthereum = AllChainsByKeys[chain]?.key === 'ethereum';
        return cost > 0 && !isEthereum;
      })
      .sort((a, b) =>
        chainsCostHistory[b][chainsCostHistory[b].length - 1] -
        chainsCostHistory[a][chainsCostHistory[a].length - 1]
      ).reverse()
      .map((chainId, index) => ({
        chainId,
        y: index * 21,
        height: 18,
      }));
  }, [chainsCostHistory, activeChainData, showUsd, AllChainsByKeys]);

  const costTransitions = useTransition(filteredCostChains, {
    key: (item) => `cost-${item.chainId}`,
    from: { opacity: 0, height: 0, y: 0 },
    enter: ({ y, height }) => ({ opacity: 1, y, height }),
    update: ({ y, height }) => ({ opacity: 1, y, height }),
    leave: { opacity: 0, height: 0 },
    config: { mass: 0.5, tension: 200, friction: 10, duration: 200 },
    trail: 25,
  });

  const UNEXPANDED_LIST_HEIGHT = 96;
  const EXPANDED_LIST_HEIGHT = 35 + filteredCostChains.length * 20 + 50;

  const content = (
    <>
      <div className={`heading-large-md ${isCompact ? 'mb-[0px]' : 'mb-[30px]'}`}>
        Token Transfer Fees
      </div>
      <div className={`group pt-[15px] flex flex-col gap-y-[15px] ${isCompact ? '' : 'h-[123px]'}`}>
        <FeeDisplayRow
          title="Ethereum Mainnet"
          costValue={ethDisplayValue}
          costHistory={ethCostLive}
          showUsd={showUsd}
          gradientClass="from-[#596780] to-[#94ABD3]"
          selectedIndex={ethCostSelectedIndex}
          hoverIndex={ethCostHoverIndex}
          onSelect={(index) => setEthCostSelectedIndex(index)}
          onHover={(index) => setEthCostHoverIndex(index)}
          getGradientColor={getGradientColor}
          formatNumber={formatNumber}
          hoverText="new block every ~12s"
        />
        <FeeDisplayRow
          title="Layer 2s"
          costValue={l2DisplayValue}
          costHistory={layer2CostLive}
          showUsd={showUsd}
          gradientClass="from-[#FE5468] to-[#FFDF27]"
          selectedIndex={l2CostSelectedIndex}
          hoverIndex={l2CostHoverIndex}
          onSelect={(index) => setL2CostSelectedIndex(index)}
          onHover={(index) => setL2CostHoverIndex(index)}
          getGradientColor={getGradientColor}
          formatNumber={formatNumber}
          hoverText="new block every ~200ms to ~2s"
        />
      </div>
      {/* Cost Chains List */}
      <div className={`relative flex flex-col gap-y-[5px] mt-[3px] -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${isCompact ? 'h-0' : 'h-auto'}`}>
        <div className={`flex flex-col gap-y-[2.5px] px-[15px] transition-height duration-500 overflow-y-hidden ${!showChainsCost && !isCompact ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''}`}
          style={{ height: !showChainsCost ? `${UNEXPANDED_LIST_HEIGHT}px` : `${EXPANDED_LIST_HEIGHT}px` }}>
          <div className='heading-large-md text-[#5A6462]'>Layer 2 Chains</div>
          <div className="relative">
            {costTransitions((style, { chainId }) => (
              <animated.div key={`cost-${chainId}`} style={style} className='absolute w-full'>
                <ChainTransitionItem chainId={chainId} chainData={activeChainData} AllChainsByKeys={AllChainsByKeys} globalMetrics={activeGlobalMetrics} type="cost" showUsd={showUsd} />
              </animated.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={`@container w-full min-w-0 transition-height duration-300
      ${isCompact ? 'h-[150px]'
        : isHidden ? 'h-[0px] overflow-hidden'
          : '@[1040px]:h-[306px] min-h-[306px]'
      }`}>
      <ExpandableCardContainer
        isExpanded={showChainsCost}
        onToggleExpand={handleToggleCost}
        isCompact={isCompact}
        infoSlot={"Costs are based on gas fees paid in recent blocks. For token transfers (ERC20), we assume a gas usage of 65,000 gas. Source: growthepie"}
      >
        {content}
      </ExpandableCardContainer>
    </div>
  );
});

TokenTransferFeeCard.displayName = 'TokenTransferFeeCard';

interface EventIconProps {
  event: EthereumEvents;
  eventHover: string | null;
  index: number;
  eventExpanded: string | null;
}

const EventIcon = ({ event, eventHover, index, eventExpanded }: EventIconProps) => {
  const getMonthDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const fullMonth = date.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
      const shortMonth = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

      // If full month name is 4 characters or shorter, use it; otherwise use short version
      return fullMonth.length <= 4 ? fullMonth : shortMonth;
    } catch {
      return 'JULY'; // fallback
    }
  };

  const isThisEventHovered = eventHover === event.date;
  const isThisEventExpanded = eventExpanded === event.date;

  const showCalendar = isThisEventHovered || isThisEventExpanded;


  const svgClasses = showCalendar ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none';

  const circleClasses = !showCalendar ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none';


  return (
    <div className="relative flex items-end size-[24px]">
      {/* Calendar */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-[opacity,scale] duration-300 ease-in-out ${svgClasses}`}>
        <g clip-path="url(#clip0_1314_55745)">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M0 20V7H1.5V20C1.5 21.3807 2.61929 22.5 4 22.5H16V20C16 17.7909 17.7909 16 20 16H22.5V7H24V16L16 24H4C1.79086 24 0 22.2091 0 20ZM17 20C17 18.3431 18.3431 17 20 17H21.5858L17 21.5858V20Z"
            fill="url(#paint0_linear_1314_55745)" />
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M20 0C22.2091 0 24 1.79086 24 4V7H0V4C2.57702e-07 1.79086 1.79086 0 4 0H20Z"
            fill="url(#paint1_linear_1314_55745)" />
        </g>
        <text x="50%" y="4" fill='#1F2726' text-anchor="middle" dominant-baseline="middle" font-size="7" font-weight="bold" className='font-raleway'>
          {getMonthDisplay(event.date)}
        </text>
        <text x="50%" y="14" fill='url(#orange-day-gradient)' text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="medium" className='numbers-xxs'>
          {Intl.DateTimeFormat('en-GB', { day: 'numeric' }).format(new Date(event.date))}
        </text>
        <defs>
          <linearGradient id="paint0_linear_1314_55745" x1="12" y1="7" x2="12" y2="24"
            gradientUnits="userSpaceOnUse">
            <stop stop-color="#10808C" />
            <stop offset="1" stop-color="#1DF7EF" />
          </linearGradient>
          <linearGradient id="paint1_linear_1314_55745" x1="12" y1="0" x2="12" y2="7"
            gradientUnits="userSpaceOnUse">
            <stop stop-color="#FE5468" />
            <stop offset="1" stop-color="#FFDF27" />
          </linearGradient>
          <linearGradient id="orange-day-gradient"
            gradientUnits="objectBoundingBox" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FE5468" />
            <stop offset="1" stop-color="#FFDF27" />
          </linearGradient>
          <clipPath id="clip0_1314_55745">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
      {/* Circle */}
      <div className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 ease-in-out ${circleClasses}`}>
        <div className='w-[8px] h-[8px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full'></div>
      </div>
    </div>
  )
}

interface EventItemProps {
  eventKey: string;
  eventHover: string | null;
  setEventHover: (value: string | null) => void;
  eventExpanded: string | null;
  handleToggleEventExpansion: (eventKey: string) => void;
  event: EthereumEvents;
  index: number;
  nextEvent?: EthereumEvents;
}

const EventItem = React.memo(({ eventKey, eventHover, setEventHover, eventExpanded, handleToggleEventExpansion, event, index, nextEvent }: EventItemProps) => {
  const isExpanded = eventExpanded === eventKey;
  return (
    <div className={`relative transition-all flex flex-col duration-500 cursor-pointer ${isExpanded ? 'max-h-[230px]' : 'min-h-[28px] max-h-[38px]'} w-full`}
      onMouseEnter={() => setEventHover(eventKey)}
      onMouseLeave={() => setEventHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        handleToggleEventExpansion(eventKey);
      }}
    >
      <div className={`${isExpanded ? 'max-h-[50px]' : 'h-0'} flex relative items-center top-[2px] w-[24px] justify-center overflow-hidden gap-x-[2px] text-xxxs mb-[5px]`}>{Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(new Date(event.date))}</div>
      <div
        className={`event-item flex items-start gap-x-[5px] ${eventHover === eventKey || ((index === 0 && eventExpanded === null)) ? 'text-xs' : 'text-xxxs text-[#5A6462]'} w-fit`}

      >
        <EventIcon event={event} eventHover={eventHover} index={index} eventExpanded={eventExpanded} />
        <div className={`relative h-full flex items-start pt-[5px] ${eventHover === eventKey || ((eventExpanded === eventKey || (index === 0 && eventExpanded === null))) ? 'heading-small-xs text-[#C8D8D3]' : 'heading-small-xxxs text-[#5A6462]'} `}>{event.title}</div>
      </div>


      <div className={`flex w-full justify-between pl-0 transition-[max-height,opacity] duration-500 overflow-hidden ${isExpanded ? 'max-h-[200px] mt-0 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
        <div className={`flex flex-col pl-[30px] text-xs items-center w-full mt-[5px]`}>
          <div className="leading-relaxed overflow-y-hidden pb-[15px] flex flex-col w-full gap-y-[5px]">
            <div>{event.description || event.title}</div>
            {event.source && <div className="flex-1 flex justify-end"><LinkButton href={event.source}>More about this event</LinkButton></div>}
          </div>
        </div>
      </div>
      {/* Dots on the left side */}
      <div className={`absolute left-0 top-[38px] bottom-[-10px] flex flex-col justify-between gap-y-[4px] overflow-y-hidden min-w-[24px] max-w-[24px] items-center ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        <div className='flex flex-col gap-y-[6px] overflow-y-hidden pt-1'>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i + "event-item-description"} className='bg-[#5A6462] w-[2px] h-[2px] rounded-full flex-shrink-0' />
          ))}
        </div>
        <div className='rounded-full text-xxxs text-[#5A6462]'>{nextEvent ? new Date(nextEvent.date).toLocaleDateString('en-GB', { year: 'numeric' }) : ''}</div>
        
      </div>
    </div>
  );
});

EventItem.displayName = "EventItem";

interface TPSChartProps {
  totalTPSLive: number[];
  globalMetrics: any;
  showUsd: boolean;
}

interface ChainTransitionItemProps {
  chainId: string;
  chainData: Record<string, ChainMetrics>;
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

  const chainColor = chain?.colors?.dark?.[0] || "#7D8887";
  const chainName = chain?.name_short || chainData[chainId].display_name;

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
      return Intl.NumberFormat('en-GB', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value);
    } else {
      if (showUsd) {
        if (value < 0.0001) {
          return '< $0.0001';
        } else {
          return `$${Intl.NumberFormat('en-GB', {
            maximumFractionDigits: 4,
            minimumFractionDigits: 4
          }).format(value)}`;
        }
      } else {
        return Intl.NumberFormat('en-GB', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value * 1000000000);
      }
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

  //if (!chain) return null;

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
              <span className="heading-small-xxxs pt-[1px]"> Gwei</span>
            )}
            {type === 'tps' && (
              <span className="">TPS</span>
            )}
          </div>
        </div>
      </div>
      <div className='flex items-end w-full justify-end'>
        <div
          className='h-[2px] transition-[width] duration-300'
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
  const history = useSWR<HistoryData>("https://sse.growthepie.com/api/history")

  // Cached data state to maintain previous values when SSE fails
  const [cachedData, setCachedData] = useState<{
    chainData: any;
    globalMetrics: any;
    hasInitialData: boolean;
  }>({
    chainData: undefined,
    globalMetrics: undefined,
    hasInitialData: false,
  });

  // Consolidated state
  const [uiState, setUiState] = useState({
    eventHover: null as string | null,
    eventExpanded: null as string | null,
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

  // Track whether we've initialized with historical data
  const [hasInitializedWithHistory, setHasInitializedWithHistory] = useState(false);

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

  // Update cached data when new SSE data arrives
  useEffect(() => {
    if (chainData !== undefined && globalMetrics !== undefined) {
      setCachedData({
        chainData,
        globalMetrics,
        hasInitialData: true,
      });
    }
  }, [chainData, globalMetrics]);

  // Use cached data if available, otherwise use current SSE data
  const activeChainData = cachedData.chainData || chainData;
  const activeGlobalMetrics = cachedData.globalMetrics || globalMetrics;

  // Memoized calculations
  const filteredTPSChains = useMemo(() => {
    return Object.keys(historyState.chainsTPSHistory)
      .filter((chain) => activeChainData?.[chain]?.tps)
      .sort((a, b) =>
        historyState.chainsTPSHistory[b][historyState.chainsTPSHistory[b].length - 1] -
        historyState.chainsTPSHistory[a][historyState.chainsTPSHistory[a].length - 1]
      )
      .map((chainId, index) => ({
        chainId,
        y: index * 21,
        height: 18,
      }));
  }, [historyState.chainsTPSHistory, activeChainData]);

  const filteredCostChains = useMemo(() => {
    const costKey = showUsd ? 'tx_cost_erc20_transfer_usd' : 'tx_cost_erc20_transfer';
    return Object.keys(historyState.chainsCostHistory)
      .filter((chain) => {
        const cost = activeChainData?.[chain]?.[costKey];
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
  }, [historyState.chainsCostHistory, activeChainData, showUsd, AllChainsByKeys]);

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

    setShowChainsTPS(!showChainsTPS);
  }, [showChainsTPS, setShowChainsTPS]);

  const handleToggleCost = useCallback((e: React.MouseEvent) => {

    setShowChainsCost(!showChainsCost);
  }, [showChainsCost, setShowChainsCost]);

  const handleToggleEvents = useCallback((e: React.MouseEvent) => {

    setShowEvents(!showEvents);
  }, [showEvents, setShowEvents]);

  // const handleCloseModals = useCallback(() => {
  //   setShowChainsCost(false);
  //   setShowChainsTPS(false);
  //   setShowEvents(false);
  // }, [setShowChainsCost, setShowChainsTPS, setShowEvents]);

  const handleToggleEventExpansion = useCallback((eventKey: string) => {
    // if the Uptime section isn't expanded, expand it
    if (!showEvents) {
      setShowEvents(true);
    }

    setUiState(prev => ({
      ...prev,
      eventExpanded: prev.eventExpanded === eventKey ? null : eventKey
    }));
  }, []);

  // Separate function for scroll navigation that directly sets expanded event (no toggle)
  const handleSetExpandedEvent = useCallback((eventKey: string) => {
    setUiState(prev => ({
      ...prev,
      eventExpanded: eventKey
    }));
  }, []);

  // Initialize totalTPSLive with historical data when available
  useEffect(() => {
    if (!history.data?.history || hasInitializedWithHistory) return;

    const historicalTPS = history.data.history
      .slice(0, 40)
      .map(item => item.tps || 0);

    if (historicalTPS.length > 0) {
      setHistoryState(prev => ({
        ...prev,
        totalTPSLive: historicalTPS,
      }));
      setHasInitializedWithHistory(true);
    }
  }, [history.data, hasInitializedWithHistory]);



  // Optimized effects - append SSE data
  useEffect(() => {
    if (!activeGlobalMetrics) return;

    const ethCostValue = showUsd
      ? activeGlobalMetrics.ethereum_tx_cost_usd
      : activeGlobalMetrics.ethereum_tx_cost_eth;

    const layer2CostValue = showUsd
      ? activeGlobalMetrics.layer2s_tx_cost_usd
      : activeGlobalMetrics.layer2s_tx_cost_eth;

    setHistoryState(prev => ({
      ...prev,
      totalTPSLive: prev.totalTPSLive.length >= TPS_HISTORY_LIMIT
        ? [...prev.totalTPSLive.slice(1), activeGlobalMetrics.total_tps ?? 0]
        : [...prev.totalTPSLive, activeGlobalMetrics.total_tps ?? 0],
      ethCostLive: prev.ethCostLive.length >= HISTORY_LIMIT
        ? [...prev.ethCostLive.slice(1), activeGlobalMetrics.ethereum_tx_cost_usd ?? 0]
        : [...prev.ethCostLive, activeGlobalMetrics.ethereum_tx_cost_usd ?? 0],
      layer2CostLive: prev.layer2CostLive.length >= HISTORY_LIMIT
        ? [...prev.layer2CostLive.slice(1), activeGlobalMetrics.layer2s_tx_cost_usd ?? 0]
        : [...prev.layer2CostLive, activeGlobalMetrics.layer2s_tx_cost_usd ?? 0],
    }));
  }, [activeGlobalMetrics]);

  useEffect(() => {
    if (!activeChainData || Object.keys(activeChainData).length === 0) return;

    setHistoryState(prev => {
      const newCostHistory = { ...prev.chainsCostHistory };
      const newTpsHistory = { ...prev.chainsTPSHistory };
      let hasChanges = false;

      for (const chainId in activeChainData) {
        if (activeChainData.hasOwnProperty(chainId)) {
          const chain = activeChainData[chainId];

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
  }, [activeChainData, showUsd]);

  const handleCloseModals = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement && (e.target.closest('.expandable-card-expand-button') || e.target instanceof HTMLElement && e.target.closest('.event-item'))) {
      return;
    }

    // if on mobile, return
    // if (window.innerWidth < 1040) {
    //   return;
    // }

    setShowChainsCost(false);
    setShowChainsTPS(false);
    setShowEvents(false);
  };

  // add an event listener for closing the modals to the page body
  useEffect(() => {
    
    document.body.addEventListener('click', handleCloseModals, true);
    return () => {
      document.body.removeEventListener('click', handleCloseModals, true);
    };
  }, []);

  // const ethereumUptimeCardRef = useRef<HTMLDivElement>(null);
  const [
    ethereumUptimeCardRef,
    {height: ethereumUptimeCardHeight}
  ] = useElementSizeObserver<HTMLDivElement>();

  // Don't show anything until we have initial data
  if (!cachedData.hasInitialData && !hasInitializedWithHistory) {
    return null;
  }

  return (
    <>
      {(showChainsCost || showChainsTPS || showEvents) && (
        <div
          className='fixed inset-0 bg-[#1F2726]/75 z-[1000] pointer-events-none'
        />
      )}

      {(
        <div 
          className='grid grid-cols-[1fr,1fr,1fr] gap-[15px] w-full @container'
          // style={{
          //   gridTemplateRows: `auto, 306px`,
          // }}
        >
          <div className="col-span-3 @[1040px]:col-span-1">
            <EthereumUptimeCard
              selectedBreakdownGroup={selectedBreakdownGroup}
              eventHover={uiState.eventHover}
              setEventHover={(value) => setUiState(prev => ({ ...prev, eventHover: value }))}
              eventExpanded={uiState.eventExpanded}
              handleToggleEventExpansion={handleToggleEventExpansion}
              handleSetExpandedEvent={handleSetExpandedEvent}
              showEvents={showEvents}
              handleToggleEvents={handleToggleEvents}
            />
          </div>
          <div className="flex flex-col lg:flex-row gap-[15px] col-span-3 @[1040px]:col-span-2">
            <EthereumEcosystemTPSCard
              selectedBreakdownGroup={selectedBreakdownGroup}
              showChainsTPS={showChainsTPS}
              handleToggleTPS={handleToggleTPS}
              // activeGlobalMetrics={activeGlobalMetrics}
              // activeChainData={activeChainData}
              // chainsTPSHistory={historyState.chainsTPSHistory}
              // totalTPSLive={historyState.totalTPSLive}
              // AllChainsByKeys={AllChainsByKeys}
              // showUsd={showUsd}
            />
            <TokenTransferFeeCard
              selectedBreakdownGroup={selectedBreakdownGroup}
              showChainsCost={showChainsCost}
              handleToggleCost={handleToggleCost}
              activeGlobalMetrics={activeGlobalMetrics}
              activeChainData={activeChainData}
              ethCostLive={historyState.ethCostLive}
              layer2CostLive={historyState.layer2CostLive}
              chainsCostHistory={historyState.chainsCostHistory}
              AllChainsByKeys={AllChainsByKeys}
              showUsd={showUsd}
            />
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