import { useState, useCallback } from 'react';
import { useSSE } from '@/hooks/useSSE';
import { ChainMetrics } from '../EthAgg/types';
import { ChainTPSHistoryItem } from './OverviewCards/TPSChartCard';
// Types specific to single chain SSE data
interface SingleChainSSEData {
  type: 'initial' | 'update';
  data?: ChainTPSHistoryItem; // Single chain data instead of Record<string, ChainMetrics>
  timestamp: string;
}

/**
 * A hook to fetch and parse real-time metrics data for a specific chain.
 * Uses the generic useSSE hook for connection management.
 * @param chainKey The key identifier for the specific chain (e.g., 'arbitrum', 'optimism')
 */
export function useSSEChains(chainKey: string) {
  const [chainData, setChainData] = useState<ChainTPSHistoryItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Construct the SSE URL dynamically based on chainKey
  const sseUrl = chainKey ? `https://sse.growthepie.com/events/chain/${chainKey}` : null;

  // Define the message handler logic once
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const parsedData: SingleChainSSEData = JSON.parse(event.data);
      if (parsedData.type === 'initial' || parsedData.type === 'update') {
        setChainData(parsedData.data || null);
        setLastUpdated(new Date(parsedData.timestamp));
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  }, []); // Empty dependency array: this function never needs to change

  // Use the generic hook to manage the connection
  const { readyState } = useSSE(sseUrl, { onMessage: handleMessage });

  // Map the native readyState to our custom status for the UI
  const connectionStatus =
    readyState === 0 ? 'connecting' :
    readyState === 1 ? 'connected' :
    'error';

  return { chainData, lastUpdated, connectionStatus };
}