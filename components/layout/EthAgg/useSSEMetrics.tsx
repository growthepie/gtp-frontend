import { useState, useCallback } from 'react';
import { useSSE } from '@/hooks/useSSE'; // Import our generic hook
import { SSEData, ChainMetrics, GlobalMetrics } from './types';

const SSE_URL = "https://sse.growthepie.com/events";

/**
 * A specific hook to fetch and parse real-time metrics data.
 * It uses the generic useSse hook for connection management.
 */
export function useSSEMetrics() {
  const [chainData, setChainData] = useState<Record<string, ChainMetrics>>({});
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Define the message handler logic once
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const parsedData: SSEData = JSON.parse(event.data);
      if (parsedData.type === 'initial' || parsedData.type === 'update') {
        setChainData(parsedData.data || {});
        setGlobalMetrics(parsedData.global_metrics || {});
        setLastUpdated(new Date(parsedData.timestamp));
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }, []); // Empty dependency array: this function never needs to change

  // Use the generic hook to manage the connection
  const { readyState } = useSSE(SSE_URL, { onMessage: handleMessage });

  // Map the native readyState to our custom status for the UI
  const connectionStatus =
    readyState === 0 ? 'connecting' :
    readyState === 1 ? 'connected' :
    'error';

  return { chainData, globalMetrics, lastUpdated, connectionStatus };
}