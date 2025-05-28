"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Container from '../Container';
import HighchartsReact from 'highcharts-react-official';
import { HighchartsProvider, HighchartsChart, YAxis, Series, XAxis, Tooltip, Chart, ColumnSeries } from 'react-jsx-highcharts';
import Highcharts from 'highcharts';
import "@/app/highcharts.axis.css";

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

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uptimeAnimationRef = useRef<number | null>(null);

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
  }, [globalMetrics]);

  console.log(totalTPSLive);

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
    console.log("Attempting to connect to SSE:", SSE_URL);

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

  console.log(totalTPSLive);
  return (
    <div className='flex gap-x-[15px] w-full'>
        <div className='bg-[#1F2726] rounded-[15px] p-[15px] w-full h-[306px]'>
            <div className='heading-large-md mb-[15px]'>Ethereum Uptime</div>
            <div className='numbers-4xl '>
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
        </div>
        <div className='flex flex-col gap-y-[15px] bg-[#1F2726] rounded-[15px] p-[15px] w-full h-[306px]'>
          <div className='heading-large-md'>Ecosystem TPS</div>
          <div className='flex flex-col gap-y-[30px]'>
            <div className='numbers-4xl bg-gradient-to-b from-[#10808C] to-[#1DF7EF] bg-clip-text text-transparent'>{Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(globalMetrics.total_tps || 0)}</div>
            <div className='w-full h-[58px] -mt-[5px]'>
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
        </div>
        <div className='bg-[#1F2726] rounded-[15px] p-[15px] w-full h-[306px]'>
        </div>
    </div>
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
