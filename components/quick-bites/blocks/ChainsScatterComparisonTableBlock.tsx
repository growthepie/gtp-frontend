'use client';

import React, { useMemo, useEffect, useState } from 'react';
import useSWR from 'swr';
import { MasterURL } from '@/lib/urls';
import { MasterResponse } from '@/types/api/MasterResponse';
import Link from 'next/link';

interface ChainData {
  chainKey: string;
  chainName: string;
  activeAddresses30d: number;
  txCount30d: number;
  activeAddressesDaily: number;
  txCountDaily: number;
  color: string;
  urlKey: string;
}

interface MetricData {
  details?: {
    summary?: {
      last_30d?: {
        types?: string[];
        data?: number[];
      };
      last_1d?: {
        types?: string[];
        data?: number[];
      };
    };
  };
  summary?: {
    last_30d?: {
      types?: string[];
      data?: number[];
    };
    last_1d?: {
      types?: string[];
      data?: number[];
    };
  };
}

export const ChainsScatterComparisonTableBlock: React.FC = () => {
  const [daaDataArray, setDaaDataArray] = useState<(MetricData | null)[]>([]);
  const [txCountDataArray, setTxCountDataArray] = useState<(MetricData | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch master.json to get all chains
  const { data: masterData } = useSWR<MasterResponse>(MasterURL);
  
  // Get all chain keys from master.json that support both metrics
  const chainKeys = useMemo(() => {
    if (!masterData?.chains) return [];
    return Object.keys(masterData.chains).filter(key => {
      const chain = masterData.chains[key];
      return chain.supported_metrics?.includes('daa') && chain.supported_metrics?.includes('txcount');
    });
  }, [masterData]);

  // Fetch data for all chains
  useEffect(() => {
    if (chainKeys.length === 0) return;

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const daaUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/daa.json`);
        const txCountUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/txcount.json`);
        
        const [daaResults, txCountResults] = await Promise.all([
          Promise.all(
            daaUrls.map(async (url) => {
              try {
                const response = await fetch(url);
                if (!response.ok) return null;
                const data = await response.json();
                return data;
              } catch (error) {
                console.error(`Error fetching ${url}:`, error);
                return null;
              }
            })
          ),
          Promise.all(
            txCountUrls.map(async (url) => {
              try {
                const response = await fetch(url);
                if (!response.ok) return null;
                const data = await response.json();
                return data;
              } catch (error) {
                console.error(`Error fetching ${url}:`, error);
                return null;
              }
            })
          )
        ]);
        
        setDaaDataArray(daaResults);
        setTxCountDataArray(txCountResults);
      } catch (error) {
        console.error('Error fetching data:', error);
        setDaaDataArray([]);
        setTxCountDataArray([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [chainKeys]);

  // Process and format the data for comparison table
  const tableData = useMemo(() => {
    if (!masterData?.chains || !daaDataArray.length || !txCountDataArray.length) return [];
    
    const chainsWithData: ChainData[] = [];
    
    chainKeys.forEach((chainKey, index) => {
      const daaData = daaDataArray[index];
      const txCountData = txCountDataArray[index];
      
      if (!daaData || !txCountData) return;
      
      const chain = masterData.chains[chainKey];
      if (!chain) return;
      
      // Get 30-day data
      let activeAddresses30d: number | null = null;
      let txCount30d: number | null = null;
      
      if (daaData.details?.summary?.last_30d?.data?.[0] !== undefined) {
        activeAddresses30d = daaData.details.summary.last_30d.data[0];
      } else if (daaData.summary?.last_30d?.data?.[0] !== undefined) {
        activeAddresses30d = daaData.summary.last_30d.data[0];
      }
      
      if (txCountData.details?.summary?.last_30d?.data?.[0] !== undefined) {
        txCount30d = txCountData.details.summary.last_30d.data[0];
      } else if (txCountData.summary?.last_30d?.data?.[0] !== undefined) {
        txCount30d = txCountData.summary.last_30d.data[0];
      }
      
      // Get daily data (last_1d * 30)
      let activeAddressesDaily: number | null = null;
      let txCountDaily: number | null = null;
      
      if (daaData.details?.summary?.last_1d?.data?.[0] !== undefined) {
        activeAddressesDaily = daaData.details.summary.last_1d.data[0] * 30;
      } else if (daaData.summary?.last_1d?.data?.[0] !== undefined) {
        activeAddressesDaily = daaData.summary.last_1d.data[0] * 30;
      }
      
      if (txCountData.details?.summary?.last_1d?.data?.[0] !== undefined) {
        txCountDaily = txCountData.details.summary.last_1d.data[0] * 30;
      } else if (txCountData.summary?.last_1d?.data?.[0] !== undefined) {
        txCountDaily = txCountData.summary.last_1d.data[0] * 30;
      }
      
      if (activeAddresses30d === null || txCount30d === null || activeAddressesDaily === null || txCountDaily === null) return;
      
      chainsWithData.push({
        chainKey,
        chainName: chain.name,
        activeAddresses30d,
        txCount30d,
        activeAddressesDaily,
        txCountDaily,
        color: chain.colors?.light?.[0] || chain.colors?.dark?.[0] || '#666666',
        urlKey: chain.url_key || chainKey.replace(/_/g, '-')
      });
    });
    
    // Sort by 30-day transaction count descending and take top 10
    const top10Chains = chainsWithData
      .sort((a, b) => b.txCount30d - a.txCount30d)
      .slice(0, 10);
    
    return top10Chains;
  }, [masterData, daaDataArray, txCountDataArray, chainKeys]);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  if (!masterData || isLoading) {
    return <div className="my-8 text-center">Loading comparison data...</div>;
  }

  if (tableData.length === 0) {
    return <div className="my-8 text-center">No data available</div>;
  }

  return (
    <div className="my-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-forest-200 dark:border-forest-700">
              <th className="text-left p-3 font-semibold text-forest-900 dark:text-forest-100">Chain</th>
              <th className="text-right p-3 font-semibold text-forest-900 dark:text-forest-100">Active Addresses (30d)</th>
              <th className="text-right p-3 font-semibold text-forest-900 dark:text-forest-100">Tx Count (30d)</th>
              <th className="text-right p-3 font-semibold text-forest-900 dark:text-forest-100">Active Addresses (Daily × 30)</th>
              <th className="text-right p-3 font-semibold text-forest-900 dark:text-forest-100">Tx Count (Daily × 30)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((chain, index) => (
              <tr 
                key={chain.chainKey} 
                className={`border-b border-forest-100 dark:border-forest-800 ${index % 2 === 0 ? 'bg-forest-50 dark:bg-forest-900/20' : ''}`}
              >
                <td className="p-3">
                  <Link 
                    href={`/chains/${chain.urlKey}`}
                    className="flex items-center gap-2 text-forest-900 dark:text-forest-100 hover:text-forest-600 dark:hover:text-forest-400 transition-colors"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: chain.color }}
                    />
                    <span className="font-medium">{chain.chainName}</span>
                  </Link>
                </td>
                <td className="p-3 text-right text-forest-700 dark:text-forest-300">
                  {formatNumber(chain.activeAddresses30d)}
                </td>
                <td className="p-3 text-right text-forest-700 dark:text-forest-300">
                  {formatNumber(chain.txCount30d)}
                </td>
                <td className="p-3 text-right text-forest-700 dark:text-forest-300">
                  {formatNumber(chain.activeAddressesDaily)}
                </td>
                <td className="p-3 text-right text-forest-700 dark:text-forest-300">
                  {formatNumber(chain.txCountDaily)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
        Comparison of 30-day actual data vs daily projection (last 1 day × 30) for top 10 chains by transaction count.
      </figcaption>
    </div>
  );
};

