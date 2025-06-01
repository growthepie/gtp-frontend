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

// Define the props type for EthAggMetricsComponent
interface EthAggMetricsProps {
  selectedBreakdownGroup: string;
}

// --- Configuration (replace with your actual values or import from a config file) ---
const SSE_URL = "http://localhost:8085/events"; // IMPORTANT: Replace with your actual SSE endpoint URL if it has a specific path e.g. /events
const RECONNECT_DELAY = 1000; // Initial reconnect delay: 1 second
const RECONNECT_MAX_DELAY = 30000; // Max reconnect delay: 30 seconds
const ETHEREUM_LAUNCH_DATE = new Date("2015-07-30T00:00:00Z");
// ----------------------------------------------------------------------------------

// --- Types for SSE Data (adjust based on your actual data structure) ---
interface ChainMetrics {
  name: string;
  tps?: number;
  cost?: number;
  tx_cost_native_usd?: number;
  tx_cost_native?: number;
  // Add other chain-specific metrics if needed
}

interface GlobalMetrics {
  total_tps?: number;
  eth_price_usd?: number;
  eth_tx_cost_usd?: number;
  avg_l2_tx_cost_usd?: number;
  avg_tx_cost_usd?: number;
}

interface SSEData {
  type: 'initial' | 'update';
  data?: Record<string, ChainMetrics>; // Chain-specific data, keyed by chain ID/name
  global_metrics?: GlobalMetrics;
  timestamp: string; 
}
// --------------------------------------------------------------------------

function EthAggMetricsComponent({ selectedBreakdownGroup }: EthAggMetricsProps) {
  return (
    <Container className="mt-[30px] min-h-[300px]"> {/* Added min-height for better loading view */}
      <RealTimeMetrics selectedBreakdownGroup={selectedBreakdownGroup} />
    </Container>
  );
}

interface RealTimeMetricsProps {
  selectedBreakdownGroup: string;
}

const RealTimeMetrics = ({ selectedBreakdownGroup }: RealTimeMetricsProps) => {
  const [chainData, setChainData] = useState<Record<string, ChainMetrics>>({});
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [uptimeCounter, setUptimeCounter] = useState<string>("00:00:00:00");
  const [uptimeYears, setUptimeYears] = useState<number>(0);
  const [totalTPSLive, setTotalTPSLive] = useState<number[]>([]);
  const [ethCostLive, setEthCostLive] = useState<number[]>([]);
  const [layer2CostLive, setLayer2CostLive] = useState<number[]>([]);
  const [chainsCostHistory, setChainsCostHistory] = useState<{[key: string]: number[]}>({});
  const [chainsTPSHistory, setChainsTPSHistory] = useState<{[key: string]: number[]}>({});
  const [eventHover, setEventHover] = useState<string | null>(null);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const [showChainsTPS, setShowChainsTPS] = useState<boolean>(false);
  const [showChainsCost, setShowChainsCost] = useState<boolean>(false);
  
  const { AllChainsByKeys } = useMaster();

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uptimeAnimationRef = useRef<number | null>(null);

  const HISTORY_LIMIT = 22; // Define a limit for history arrays

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours = Math.floor((totalSeconds / 3600) % 24);
    return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatUptime = (durationMs: number) => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    // Calculate years (accounting for leap years)
    const years = Math.floor(totalDays / 365.25);
    const remainingDaysAfterYears = totalDays - Math.floor(years * 365.25);
    
    // Calculate months (approximate - using 30.44 days per month average)
    const months = Math.floor(remainingDaysAfterYears / 30.44);
    const days = Math.floor(remainingDaysAfterYears - (months * 30.44));
    
    // Calculate remaining time units
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    
    return {heading: `${years}years, ${months}months, ${days}days`, subheading: `${hours}hours, ${minutes}minutes, ${seconds}seconds`};
  };

  const updateUptimeDisplay = useCallback(() => {
    const now = new Date();
    const durationMs = now.getTime() - ETHEREUM_LAUNCH_DATE.getTime();
    setUptimeCounter(formatDuration(durationMs));
    setUptimeYears(durationMs / (1000 * 60 * 60 * 24 * 365.25)); // Approximate years

    uptimeAnimationRef.current = requestAnimationFrame(updateUptimeDisplay);
  }, []);

  useEffect(() => {
    // make it so that if totalTPS is greater than 50 it removes the first(0) element and add the new globalMetrics.total_tps          
    setTotalTPSLive(prevData => {
      const newValue = globalMetrics.total_tps ?? 0;
      
      if (prevData.length >= 40) {
        // Remove first element and add new one (sliding window)
        return [...prevData.slice(1), newValue];
      } else {
        // Just add the new element
        return [...prevData, newValue];
      }
    });

    setEthCostLive(prevData => {
      const newValue = globalMetrics.eth_tx_cost_usd ?? 0;
      if (prevData.length >= HISTORY_LIMIT) {
        return [...prevData.slice(1), newValue];
      } else {
        return [...prevData, newValue];
      }
    });

    setLayer2CostLive(prevData => {
      const newValue = globalMetrics.avg_l2_tx_cost_usd ?? 0;
      if (prevData.length >= HISTORY_LIMIT) {
        return [...prevData.slice(1), newValue];
      } else {
        return [...prevData, newValue];
      }
    });
  }, [globalMetrics]);

 
  

  useEffect(() => {
    if (selectedBreakdownGroup === "Metrics") {
      uptimeAnimationRef.current = requestAnimationFrame(updateUptimeDisplay);
    } else {
      if (uptimeAnimationRef.current) {
        cancelAnimationFrame(uptimeAnimationRef.current);
      }
    }
    return () => {
      if (uptimeAnimationRef.current) {
        cancelAnimationFrame(uptimeAnimationRef.current);
      }
    };
  }, [selectedBreakdownGroup, updateUptimeDisplay]);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionStatus('connecting');
  

    eventSourceRef.current = new EventSource(SSE_URL);

    eventSourceRef.current.onopen = () => {
      console.log("SSE connection established.");
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
    };

    eventSourceRef.current.onmessage = (event) => {
      try {
        const parsedData: SSEData = JSON.parse(event.data);
        // console.log("Received SSE data:", parsedData);
        if (parsedData.type === 'initial' || parsedData.type === 'update') {
          
          setChainData(parsedData.data || {});
          setGlobalMetrics(parsedData.global_metrics || {}); 
          
          setLastUpdated(new Date(parsedData.timestamp));
        
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSourceRef.current.onerror = (err) => {
      console.error("EventSource failed:", err);
      setConnectionStatus('error');
      eventSourceRef.current?.close();

      reconnectAttemptsRef.current++;
      const delay = Math.min(
        RECONNECT_MAX_DELAY,
        RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current)
      );
      console.log(`SSE connection error. Reconnecting in ${delay / 1000}s... (Attempt ${reconnectAttemptsRef.current})`);
      reconnectTimeoutRef.current = setTimeout(connectSSE, delay);
    };
  }, []); // SSE_URL is a constant, so not needed in deps array if defined outside component

  useEffect(() => {
    if (selectedBreakdownGroup === "Metrics") {
      connectSSE();
    } else {
      setConnectionStatus('idle');
      setChainData({});
      setGlobalMetrics({});
      setLastUpdated(null);
      if (eventSourceRef.current) {
        console.log("Closing SSE connection due to group change.");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
       reconnectAttemptsRef.current = 0; // Reset attempts when not active
    }

    return () => {
      console.log("Cleaning up RealTimeMetrics: Closing SSE connection.");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [selectedBreakdownGroup, connectSSE]);

  useEffect(() => {
    if (!chainData || Object.keys(chainData).length === 0) return;

    // Update chainsCostHistory
    setChainsCostHistory(prevCostHistory => {
      const newCostHistoryState = { ...prevCostHistory };
      let hasCostChanges = false;
      for (const chainId in chainData) { // Use chainId (the key from chainData) directly
        
        if (chainData.hasOwnProperty(chainId)) {
          const chain = chainData[chainId]; // This is the ChainMetrics object
       
          const currentChainCostHistory = newCostHistoryState[chainId] || [];
          const costValue = chain[showUsd ? 'tx_cost_native_usd' : 'tx_cost_native'] ?? 0;
          const updatedChainCostHistory = [...currentChainCostHistory, costValue].slice(-HISTORY_LIMIT);

          // Avoid unnecessary updates if the array content is identical
          if (!newCostHistoryState[chainId] || newCostHistoryState[chainId].join(',') !== updatedChainCostHistory.join(',')) {
              newCostHistoryState[chainId] = updatedChainCostHistory;
              hasCostChanges = true;
          }
        }
      }
      return hasCostChanges ? newCostHistoryState : prevCostHistory;
    });

    // Update chainsTPSHistory
    setChainsTPSHistory(prevTpsHistory => {
      const newTpsHistoryState = { ...prevTpsHistory };
      let hasTpsChanges = false;
      for (const chainId in chainData) { // Use chainId (the key from chainData) directly
        if (chainData.hasOwnProperty(chainId)) {
          const chain = chainData[chainId]; // This is the ChainMetrics object
          const currentChainTpsHistory = newTpsHistoryState[chainId] || [];
          const tpsValue = chain.tps ?? 0;
          const updatedChainTpsHistory = [...currentChainTpsHistory, tpsValue].slice(-HISTORY_LIMIT);

          if (!newTpsHistoryState[chainId] || newTpsHistoryState[chainId].join(',') !== updatedChainTpsHistory.join(',')) {
              newTpsHistoryState[chainId] = updatedChainTpsHistory;
              hasTpsChanges = true;
          }
        }
      }
      return hasTpsChanges ? newTpsHistoryState : prevTpsHistory;
    });

  }, [chainData, showUsd]);

  if (selectedBreakdownGroup !== "Metrics" || globalMetrics === undefined || chainData === undefined ) {
    return null; 
  }

  // Helper to display values or a dash
  const displayValue = (value: number | string | undefined, unit: string = '') => {
    return value !== undefined && value !== null ? `${typeof value === 'number' && unit !== '' && !value.toString().includes('.') ? value : typeof value === 'number' ? value.toFixed(2) : value}${unit}` : '-';
  };

  const connectionStatusText = {
      idle: "Idle",
      connecting: "Connecting...",
      connected: "Connected",
      error: "Connection Error - Retrying..."
  };

  return (
  <>
  {connectionStatus === 'connected' && (
    <div className='flex gap-x-[15px] w-full px-[15px]'>

        <div className='bg-[#1F2726] rounded-[15px] p-[15px] w-full h-[306px]'>
            <div className='heading-large-md mb-[15px]'>Ethereum Uptime</div>
            <div className='numbers-2xl mb-[30px]'>
              {(() => {
                const uptime = formatUptime(new Date().getTime() - ETHEREUM_LAUNCH_DATE.getTime());
                return (
                  <div className='flex flex-col gap-y-[5px]'>
                    <div className='bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>{uptime.heading}</div>
                    <div className='numbers-sm text-[#5A6462]'>{uptime.subheading}</div>
                  </div>
                );
              })()}
            </div>
            <div className='flex flex-col gap-y-[5px]'>
              <div className='heading-large-md text-[#5A6462]'><span className='font-bold'>Events:</span></div>
              <div className='flex flex-col gap-y-[5px] pl-[15px]'>
                <div className={`transition-all duration-300 cursor-default ${eventHover === 'after' ? 'text-xs' : 'text-xxxs text-[#5A6462]'} w-fit`} onMouseEnter={() => setEventHover('after')} onMouseLeave={() => setEventHover(null)}><span className={`${eventHover !== 'after' ? 'font-bold' : ''}`}>Event after:</span> </div>
                <div className={`transition-all duration-300 cursor-default ${eventHover === null ? 'text-xs' : 'text-xxxs text-[#5A6462] w-fit'}`}><span className={`${eventHover !== null ? 'font-bold' : ''}`}> Main event</span></div>
                <div className={`transition-all duration-300 cursor-default ${eventHover === 'before' ? 'text-xs' : 'text-xxxs text-[#5A6462]'} w-fit`} onMouseEnter={() => setEventHover('before')} onMouseLeave={() => setEventHover(null)}><span className={`${eventHover !== 'before' ? 'font-bold' : ''}`}>Event before:</span></div>
              </div>
            </div>

        </div>
        <div className='flex flex-col gap-y-[15px] bg-[#1F2726] rounded-[15px] p-[15px] w-full h-[306px] '>
          <div className='heading-large-md'>Ecosystem TPS</div>
          <div className='flex flex-col gap-y-[30px]'>
            <div className='numbers-2xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>{Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(globalMetrics.total_tps || 0)}</div>
            <div className='w-full h-[58px] -mt-[5px] mb-[20px]'>
              <HighchartsProvider Highcharts={Highcharts}>
                  <HighchartsChart>
                    <Chart
                      backgroundColor={"transparent"}
                      type="line"
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
                          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                          stops: [
                            [0, '#10808C'],
                            [1, '#1DF7EF']
                          ]
                        }}

                        pointPadding={4}
                        pointWidth={8}
                        groupPadding={0}
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
                      max={40}
                      tickColor={"#5A6462"}
                    
                      tickWidth={0}
                    />
                    <Tooltip />
                  </HighchartsChart>
              
              </HighchartsProvider>
            </div>
          </div>
          <div className={`relative flex flex-col gap-y-[5px] -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${showChainsTPS ? 'pb-[10px]' : 'pb-0'}`}
          >
            <div className={`flex flex-col gap-y-[2.5px] px-[15px] duration-300  overflow-y-hidden ${!showChainsTPS ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''}`}
              style={{
                height: !showChainsTPS ? `80px` : `${Object.keys(chainsTPSHistory).length * 21 + 15}px`
              }}
            >
              <div className='heading-large-md text-[#5A6462] '>Chains</div>
              {Object.keys(chainsTPSHistory).map((chainId) => {
                const chain = AllChainsByKeys[chainId];
                
                const chainColor = chain.colors.dark[0];
                const chainName = chain.name_short;
                return (
                  <div key={chainId} className='flex w-full items-center justify-between h-[18px]'>
                    <div className='flex w-[115px] gap-x-[5px] items-center'>
                      <div className='w-[15px] h-[10px] rounded-r-full ' style={{ backgroundColor: chainColor }}></div>
                      <div className="text-xs ">{chainName}</div>
                    </div>
                    <div className='flex gap-x-[1px] items-center'>
                    {chainsTPSHistory[chainId].map((tps, index) => (
                      <div className={`rounded-full cursor-pointer ${index === 21 ? 'bg-blue-400 w-[10px] h-[10px]' : 'bg-red-400 hover:w-[8px] hover:h-[8px] w-[5px] h-[5px] '}`} key={index + chainId}/>
                    ))}
                    </div>
                    <div className='flex flex-col items-end w-[100px] numbers-xs'>
                      <div>{Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(chainData[chainId]?.tps || 0)}</div>
                      <div className='h-[2px] ' 
                        style={{
                          width: chainData[chainId].tps && globalMetrics.total_tps ? `${chainData[chainId].tps / globalMetrics.total_tps * 100}%` : '0%',
                          backgroundColor: chainColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className='w-full h-[18px] flex items-center justify-center relative z-10 cursor-pointer top-[0px] ' 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowChainsTPS(!showChainsTPS);
            }}>
              <div className={`transition-transform absolute duration-300 ${showChainsTPS ? 'rotate-180' : ''}`}><GTPIcon icon='gtp-chevrondown-monochrome' size='md' className='text-[#5A6462]' /></div>
              <div className='absolute right-[15px]'><GTPIcon icon='gtp-info-monochrome' size='sm' className='text-[#5A6462]' /></div>
            </div>
          </div>

        </div>
        <div className='bg-[#1F2726] rounded-[15px] py-[15px] px-[15px] w-full h-[306px]'>
          <div className='heading-large-md mb-[30px]'>Average Transaction Fee</div>
          <div className='pt-[15px] mb-[50px]'>
            <div className='flex justify-between items-center'>
              <div className='w-[115px] heading-small-xxs'>Ethereum Mainnet</div>
              <div className='flex gap-x-[1px] items-center'>
                {ethCostLive.map((cost, index) => (
                  <div className={`rounded-full cursor-pointer ${index === 21 ? 'bg-blue-400 w-[10px] h-[10px]' : 'bg-red-400 hover:w-[8px] hover:h-[8px] w-[5px] h-[5px] '}`} key={index + 'eth'}/>
                ))}
              </div>
              <div className='flex bg-gradient-to-b from-[#596780] to-[#94ABD3] bg-clip-text text-transparent flex-col items-end w-[100px] numbers-2xl'>{Intl.NumberFormat('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(globalMetrics.eth_tx_cost_usd || 0)}</div>
            </div>
            <div className='flex justify-between items-center mt-[15px]'>
              <div className='w-[115px] heading-small-xxs'>Layer 2s</div>
              <div className='flex gap-x-[1px] items-center'>
                {layer2CostLive.map((cost, index) => (
                  <div className={`rounded-full cursor-pointer ${index === 21 ? 'bg-blue-400 w-[10px] h-[10px]' : 'bg-red-400 hover:w-[8px] hover:h-[8px] w-[5px] h-[5px] '}`} key={index + 'eth'}/>
                ))}
              </div>
              <div className='flex bg-gradient-to-b from-[#FE5468] to-[#FFDF27] bg-clip-text text-transparent flex-col items-end w-[100px] numbers-2xl'>{Intl.NumberFormat('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(globalMetrics.avg_l2_tx_cost_usd || 0)}</div>
            </div>
          </div>
          <div className={`relative flex flex-col gap-y-[5px] -mx-[15px] bg-[#1F2726] rounded-b-[15px] ${showChainsCost ? 'pb-[10px]' : 'pb-0'}`}
          >
            <div className={`flex flex-col gap-y-[2.5px] px-[15px] duration-300  overflow-y-hidden ${!showChainsCost ? 'after:content-[""] after:absolute after:bottom-0 after:left-[5px] after:right-[5px] after:h-[50px] after:bg-gradient-to-t after:from-[#1F2726] after:via-[#1F2726]/80 after:to-[#1F2726]/20 after:pointer-events-none' : ''}`}
              style={{
                height: !showChainsCost ? `80px` : `${Object.keys(chainsTPSHistory).length * 21 + 15}px`
              }}
            >
              <div className='heading-large-md text-[#5A6462] '>Chains</div>
              {Object.keys(chainsTPSHistory).map((chainId) => {
                const chain = AllChainsByKeys[chainId];
                
                const chainColor = chain.colors.dark[0];
                const chainName = chain.name_short;
                return (
                  <div key={`cost-${chainId}`} className='flex w-full items-center justify-between h-[18px]'>
                    <div className='flex w-[115px] gap-x-[5px] items-center'>
                      <div className='w-[15px] h-[10px] rounded-r-full ' style={{ backgroundColor: chainColor }}></div>
                      <div className="text-xs ">{chainName}</div>
                    </div>
                    <div className='flex gap-x-[1px] items-center'>
                    {chainsTPSHistory[chainId].map((tps, index) => (
                      <div className={`rounded-full cursor-pointer ${index === 21 ? 'bg-blue-400 w-[10px] h-[10px]' : 'bg-red-400 hover:w-[8px] hover:h-[8px] w-[5px] h-[5px] '}`} key={index + chainId}/>
                    ))}
                    </div>
                    <div className='flex flex-col items-end w-[100px] numbers-xs'>
                      <div>{Intl.NumberFormat('en-US', { maximumFractionDigits: 5, minimumFractionDigits: 4 }).format(chainData[chainId]?.tx_cost_native_usd || 0)}</div>
                      <div className='h-[2px] ' 
                        style={{
                          width: chainData[chainId].tx_cost_native_usd && globalMetrics.avg_l2_tx_cost_usd && globalMetrics.eth_tx_cost_usd ? `${chainData[chainId].tx_cost_native_usd / (globalMetrics.avg_l2_tx_cost_usd + globalMetrics.eth_tx_cost_usd) * 100}%` : '0%',
                          backgroundColor: chainColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className='w-full h-[18px] flex items-center justify-center relative z-10 cursor-pointer top-[0px] ' 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowChainsCost(!showChainsCost);
            }}>
              <div className={`transition-transform absolute duration-300 ${showChainsCost ? 'rotate-180' : ''}`}><GTPIcon icon='gtp-chevrondown-monochrome' size='md' className='text-[#5A6462]' /></div>
              <div className='absolute right-[15px]'><GTPIcon icon='gtp-info-monochrome' size='sm' className='text-[#5A6462]' /></div>
            </div>
          </div>
        </div>
    </div>
    )}
    </>
  );
};

const arePropsEqual = (
  prevProps: Readonly<EthAggMetricsProps>,
  nextProps: Readonly<EthAggMetricsProps>
) => {
   // This comparison means EthAggMetricsComponent (and thus RealTimeMetrics) will only re-evaluate 
   // its rendering if selectedBreakdownGroup actually changes its value OR 
   // if selectedBreakdownGroup *becomes* or *stops being* "Metrics".
   // The RealTimeMetrics internal useEffect for SSE connection also depends on selectedBreakdownGroup === "Metrics".
   
   // If it was not "Metrics" and is now "Metrics", re-render (to mount RealTimeMetrics properly)
   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup === "Metrics") {
       return false;
   }
   // If it was "Metrics" and is now not "Metrics", re-render (to unmount/hide RealTimeMetrics)
   if (prevProps.selectedBreakdownGroup === "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
       return false;
   }
   // If it stays not "Metrics", and the group itself changes, it doesn't matter for *this* component as it renders null.
   // However, to be precise for general memoization: if it's not "Metrics" in both, and group changes, technically props changed.
   // But since it renders null, further optimization is to say they are equal if both are not "Metrics".
   if (prevProps.selectedBreakdownGroup !== "Metrics" && nextProps.selectedBreakdownGroup !== "Metrics") {
       return true; // Effectively, don't care about changes if not displaying Metrics.
   }
   // If it stays "Metrics", and the group (which is "Metrics") doesn't change, they are equal.
   // This case should be covered by the direct comparison: prevProps.selectedBreakdownGroup === nextProps.selectedBreakdownGroup
   return prevProps.selectedBreakdownGroup === nextProps.selectedBreakdownGroup;
};

export default React.memo(EthAggMetricsComponent, arePropsEqual);
