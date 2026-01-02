'use client';

import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { MasterURL } from '@/lib/urls';
import { MasterResponse } from '@/types/api/MasterResponse';
import ChartWrapper from '@/components/quick-bites/ChartWrapper';

interface ChainData {
  chainKey: string;
  chainName: string;
  activeAddresses: number;
  marketCap: number;
  color: string;
  urlKey: string;
}

interface MetricData {
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
}

// Calculate linear regression for trendline
const calculateTrendline = (points: Array<[number, number]>): Array<[number, number]> => {
  if (points.length < 2) return [];
  
  const n = points.length;
  const sumX = points.reduce((sum, [x]) => sum + x, 0);
  const sumY = points.reduce((sum, [, y]) => sum + y, 0);
  const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumXX = points.reduce((sum, [x]) => sum + x * x, 0);
  
  // Calculate slope (m) and intercept (b) for y = mx + b
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  
  // Find min and max x values
  const xValues = points.map(([x]) => x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  
  // Create trendline points at min and max x
  const y1 = m * minX + b;
  const y2 = m * maxX + b;
  
  return [[minX, y1], [maxX, y2]];
};

interface ChainsScatterMarketCapChartBlockProps {
  // No props needed - always uses last_30d data
}

interface ChartSeriesData {
  name: string;
  type: string;
  color: string;
  data: number[][];
  marker?: { enabled: boolean };
  lineWidth?: number;
  dashStyle?: string;
  enableMouseTracking?: boolean;
  zIndex?: number;
  showInLegend?: boolean;
  oppositeYAxis?: boolean;
  visible?: boolean;
}

export const ChainsScatterMarketCapChartBlock: React.FC<ChainsScatterMarketCapChartBlockProps> = () => {
  const { theme } = useTheme();
  const [daaDataArray, setDaaDataArray] = useState<(MetricData | null)[]>([]);
  const [marketCapDataArray, setMarketCapDataArray] = useState<(MetricData | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleChains, setVisibleChains] = useState<Set<string>>(new Set());
  const visibleChainsRef = useRef<Set<string>>(new Set());
  
  // Keep ref in sync with state
  useEffect(() => {
    visibleChainsRef.current = visibleChains;
  }, [visibleChains]);
  
  // Fetch master.json to get all chains
  const { data: masterData } = useSWR<MasterResponse>(MasterURL);
  
  // Get all chain keys from master.json that support both metrics
  const chainKeys = useMemo(() => {
    if (!masterData?.chains) return [];
    return Object.keys(masterData.chains).filter(key => {
      const chain = masterData.chains[key];
      // Only include chains that support both daa and market_cap metrics
      return chain.supported_metrics?.includes('daa') && chain.supported_metrics?.includes('market_cap');
    });
  }, [masterData]);

  // Fetch active addresses (DAA) and Market Cap for all chains
  useEffect(() => {
    if (chainKeys.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch DAA data
        const daaUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/daa.json`);
        const marketCapUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/market_cap.json`);
        
        const [daaResults, marketCapResults] = await Promise.all([
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
            marketCapUrls.map(async (url) => {
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
        setMarketCapDataArray(marketCapResults);
      } catch (error) {
        console.error('Error fetching data:', error);
        setDaaDataArray([]);
        setMarketCapDataArray([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [chainKeys]);

  // Process and format the data for scatter chart
  const scatterData = useMemo(() => {
    if (!masterData?.chains || !daaDataArray.length || !marketCapDataArray.length) return [];
    
    const chainsWithData: ChainData[] = [];
    
    // Get chain colors from master.json
    const getChainColor = (chainKey: string): string => {
      const chain = masterData.chains[chainKey];
      if (!chain) return '#666666';
      
      // Use theme-appropriate colors (light for light theme, dark for dark theme)
      const isDark = theme === 'dark';
      const colorArray = isDark ? chain.colors?.dark : chain.colors?.light;
      
      // Get the primary color (first color in the array)
      if (colorArray && Array.isArray(colorArray) && colorArray.length > 0) {
        return colorArray[0];
      }
      
      // Fallback to light colors if dark not available
      if (chain.colors?.light && Array.isArray(chain.colors.light) && chain.colors.light.length > 0) {
        return chain.colors.light[0];
      }
      
      // Final fallback to default colors for common chains
      const defaultColors: { [key: string]: string } = {
        'ethereum': '#94ABD3',
        'arbitrum': '#19D9D6',
        'base': '#2151F5',
        'optimism': '#FF0420',
        'polygon': '#8247E5',
        'zksync': '#8C8DFC',
        'starknet': '#FF0420',
      };
      return defaultColors[chainKey] || '#666666';
    };
    
    chainKeys.forEach((chainKey, index) => {
      const daaData = daaDataArray[index];
      const marketCapData = marketCapDataArray[index];
      
      if (!daaData || !marketCapData) return;
      
      const chain = masterData.chains[chainKey];
      if (!chain) return;
      
      // Get active addresses (last_30d)
      const daa30d = daaData.details?.summary?.last_30d?.data?.[0] ?? daaData.summary?.last_30d?.data?.[0];
      const activeAddresses = daa30d !== undefined ? daa30d : null;
      
      // Get market cap (last_30d) - data array is [usd, eth], we use USD (index 0)
      const marketCap30d = marketCapData.details?.summary?.last_30d?.data?.[0] ?? marketCapData.summary?.last_30d?.data?.[0];
      const marketCap = marketCap30d !== undefined ? marketCap30d : null;
      
      if (activeAddresses === null || marketCap === null) return;
      
      chainsWithData.push({
        chainKey,
        chainName: chain.name,
        activeAddresses,
        marketCap,
        color: getChainColor(chainKey),
        urlKey: chain.url_key || chainKey.replace(/_/g, '-')
      });
    });
    
    // Sort by active addresses descending, take top 10, then reverse to show smallest to biggest
    const top10Chains = chainsWithData
      .sort((a, b) => b.activeAddresses - a.activeAddresses)
      .slice(0, 10)
      .reverse();
    
    return top10Chains;
  }, [masterData, daaDataArray, marketCapDataArray, chainKeys, theme]);
  
  // Initialize visible chains to all chains when data is ready
  useEffect(() => {
    if (scatterData.length > 0 && visibleChains.size === 0) {
      setVisibleChains(new Set(scatterData.map(chain => chain.chainName)));
    }
  }, [scatterData, visibleChains.size]);
  
  // Create chart data (all chains, trendline will be added separately)
  const chartData = useMemo((): ChartSeriesData[] => {
    if (scatterData.length === 0) return [];
    
    // Convert to scatter plot format: one series per chain with one data point
    return scatterData.map(chain => ({
      name: chain.chainName,
      type: 'scatter',
      color: chain.color,
      data: [[chain.activeAddresses, chain.marketCap]]
    }));
  }, [scatterData]);
  
  // Calculate trendline based on visible chains
  const trendlineData = useMemo(() => {
    if (scatterData.length === 0) return [];
    
    // Get visible chains (default to all if none specified)
    const activeChains = visibleChains.size > 0 
      ? scatterData.filter(chain => visibleChains.has(chain.chainName))
      : scatterData;
    
    if (activeChains.length < 2) return [];
    
    // Calculate trendline from visible chains
    const trendlinePoints = activeChains.map(chain => [chain.activeAddresses, chain.marketCap] as [number, number]);
    return calculateTrendline(trendlinePoints);
  }, [scatterData, visibleChains]);
  
  // Combine chart data with trendline
  const chartDataWithTrendline = useMemo((): ChartSeriesData[] => {
    if (chartData.length === 0) return [];
    
    const result: ChartSeriesData[] = [...chartData];
    
    // Get visible chains count to determine if we should show trendline
    const activeChains = visibleChains.size > 0 
      ? scatterData.filter(chain => visibleChains.has(chain.chainName))
      : scatterData;
    
    // Add trendline as a line series if we have valid trendline data and at least 2 chains visible
    if (trendlineData.length > 0 && activeChains.length >= 2) {
      result.push({
        name: 'Trendline',
        type: 'line',
        color: theme === 'dark' ? '#CDD8D3' : '#293332',
        data: trendlineData,
        marker: { enabled: false },
        lineWidth: 2,
        dashStyle: 'Dash',
        enableMouseTracking: false,
        zIndex: 0,
        showInLegend: true,
        oppositeYAxis: true,
        visible: true
      });
    }
    
    return result;
  }, [chartData, trendlineData, theme, visibleChains, scatterData]);

  // Chart options to track legend clicks and update visible chains
  const chartOptions = useMemo(() => {
    // Get all chain names from scatterData
    const allChainNames = scatterData.map(chain => chain.chainName);
    
    // Helper function to get visible chains from chart
    const getVisibleChainsFromChart = (chart: any): Set<string> => {
      const visible = new Set<string>();
      if (!chart || !chart.series) return visible;
      
      chart.series.forEach((series: any) => {
        if (series.name !== 'Trendline' && series.visible !== false) {
          visible.add(series.name);
        }
      });
      return visible;
    };
    
    return {
      chart: {
        events: {
          load: function(this: any) {
            const visible = getVisibleChainsFromChart(this);
            if (visible.size === 0) {
              const newSet = new Set(allChainNames);
              setVisibleChains(newSet);
              visibleChainsRef.current = newSet;
            } else {
              setVisibleChains(visible);
              visibleChainsRef.current = visible;
            }
            
            if (this.xAxis && this.xAxis[0]) {
              const currentMin = this.xAxis[0].min;
              const currentMax = this.xAxis[0].max;
              if (currentMin === null || currentMin === undefined || currentMin < 0) {
                this.xAxis[0].setExtremes(0, currentMax || this.xAxis[0].max, false);
              }
            }
          }
        }
      },
      xAxis: {
        min: 0,
        minPadding: 0,
        startOnTick: true,
        endOnTick: true,
      },
      plotOptions: {
        scatter: {
          events: {
            legendItemClick: function(this: any) {
              requestAnimationFrame(() => {
                if (this.chart) {
                  const visible = getVisibleChainsFromChart(this.chart);
                  const currentArray = Array.from(visibleChainsRef.current).sort();
                  const newArray = Array.from(visible).sort();
                  if (JSON.stringify(currentArray) !== JSON.stringify(newArray)) {
                    setVisibleChains(new Set(visible));
                    visibleChainsRef.current = visible;
                  }
                }
              });
              return true;
            }
          }
        },
        line: {
          events: {
            legendItemClick: function(this: any) {
              if (this.name === 'Trendline') {
                const visibleChains = this.chart.series.filter((s: any) => 
                  s.name !== 'Trendline' && s.visible !== false
                );
                if (visibleChains.length >= 2) {
                  return false;
                }
              }
              return true;
            }
          }
        }
      }
    };
  }, [scatterData]);

  // Callback to update visible chains when ChartWrapper's filtering changes
  const handleFilterChange = useCallback((visibleChainNames: string[]) => {
    const newSet = new Set(visibleChainNames);
    const currentArray = Array.from(visibleChainsRef.current).sort();
    const newArray = Array.from(newSet).sort();
    if (JSON.stringify(currentArray) !== JSON.stringify(newArray)) {
      setVisibleChains(newSet);
      visibleChainsRef.current = newSet;
    }
  }, []);

  if (!masterData || isLoading) {
    return <div className="my-8 text-center">Loading chart data...</div>;
  }

  if (scatterData.length === 0) {
    return <div className="my-8 text-center">No data available</div>;
  }

  return (
    <div className="my-8">
      <ChartWrapper
        chartType="scatter"
        data={chartDataWithTrendline}
        margins="normal"
        width="100%"
        height={400}
        title="Market Cap"
        subtitle="30-day comparison for top 10 chains by active addresses"
        showXAsDate={false}
        disableTooltipSort={false}
        options={chartOptions}
        onFilterChange={handleFilterChange}
        ratioTitle="Market Cap per Address"
        xAxisLabel="Active Addresses"
        yAxisLabel="Market Cap"
      />
      <figcaption className="text-center text-xs mt-2 text-forest-700 dark:text-forest-400 italic">
        Scatter plot showing the relationship between active addresses (x-axis) and market cap (y-axis) for the top 10 chains by active addresses (last 30 days).<br />Trendline shows the correlation for selected chains.
      </figcaption>
    </div>
  );
};

