// lib/utils/dynamicContent.ts - Extended version
export const processDynamicContent = async (content: any[]): Promise<any[]> => {
  const dynamicDataCache = new Map();

  const fetchData = async (key: string, url: string) => {
    if (!dynamicDataCache.has(key)) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        dynamicDataCache.set(key, data);
      } catch (error) {
        console.error(`Failed to fetch ${key} data:`, error);
      }
    }
    return dynamicDataCache.get(key);
  };

  const processItem = async (item: any): Promise<any> => {
    if (typeof item === 'string') {
      let processedItem = item;

      // Handle timeboost data placeholders
      if (processedItem.includes('{{timeboost')) {
        const timeboostData = await fetchData('timeboost', "https://api.growthepie.xyz/v1/quick-bites/arbitrum-timeboost.json");
        const timeboostDataETHRounded = timeboostData.data.fees_paid_priority_eth.total.toFixed(2);
        const timeboostDataUSDRounded = parseFloat(timeboostData.data.fees_paid_priority_usd.total).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        if (timeboostDataETHRounded) {
          processedItem = processedItem.replace('{{timeboostTotalETH}}', timeboostDataETHRounded);
        }
        if (timeboostDataUSDRounded) {
          processedItem = processedItem.replace('{{timeboostTotalUSD}}', timeboostDataUSDRounded);
        }
      }

      // Handle hyperliquid data placeholders
      if (processedItem.includes('{{hyperliquid')) {
        const hyperliquidData = await fetchData('hyperliquid', "https://api.growthepie.xyz/v1/quick-bites/hyperliquid/kpis.json");
        const total_revenue_for_circle = (hyperliquidData.data.total_revenue_for_circle / 1000000).toFixed(2);
        const hyperliquid_usdc_last = (hyperliquidData.data.hyperliquid_usdc_last / 1000000000).toFixed(3);
        const percentage_hyperliquid_of_circle = hyperliquidData.data.percentage_hyperliquid_of_circle.toFixed(2);
        const estimates_yearly_revenue_hyperliquid_circle = (hyperliquidData.data.estimates_yearly_revenue_hyperliquid_circle / 1000000).toFixed(2);

        if (total_revenue_for_circle) {
          processedItem = processedItem.replace('{{hyperliquidTotalRevenueForCircle}}', total_revenue_for_circle);
        }
        if (hyperliquid_usdc_last) {
          processedItem = processedItem.replace('{{hyperliquidUSDCLast}}', hyperliquid_usdc_last);
        }
        if (percentage_hyperliquid_of_circle) {
          processedItem = processedItem.replace('{{percentageHyperliquidOfCircle}}', percentage_hyperliquid_of_circle);
        }
        if (estimates_yearly_revenue_hyperliquid_circle) {
          processedItem = processedItem.replace('{{estimatesYearlyRevenueHyperliquidCircle}}', estimates_yearly_revenue_hyperliquid_circle);
        }
      }

      // Handle shopify data placeholders
      if (processedItem.includes('{{shopify')) {
        const shopifyData = await fetchData('shopify', "https://api.growthepie.xyz/v1/quick-bites/shopify-usdc.json");
        //const shopifyDataETH = shopifyData.data.gross_volume_usdc.total.toFixed(2);
        const shopifyVolumeUSD = parseFloat(shopifyData.data.gross_volume_usdc.total).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        const shopifyMerchants = parseFloat(shopifyData.data.total_unique_merchants.total).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        const shopifyCustomers = parseFloat(shopifyData.data.total_unique_payers.total).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        if (shopifyVolumeUSD) {
          processedItem = processedItem.replace('{{shopifyVolumeUSD}}', shopifyVolumeUSD);
        }
        if (shopifyMerchants) {
          processedItem = processedItem.replace('{{shopifyMerchants}}', shopifyMerchants);
        }
        if (shopifyCustomers) {
          processedItem = processedItem.replace('{{shopifyCustomers}}', shopifyCustomers);
        }
      }

      // Handle Robinhood stock data placeholders
      if (processedItem.includes('{{robinhood')) {
        
        const robinhoodkpi = await fetchData('robinhood', "https://api.growthepie.com/v1/quick-bites/robinhood/kpi.json");
        
        const perc_change_market_value_usd_7d = robinhoodkpi?.data?.perc_change_market_value_usd_7d?.toFixed(2);
        const stockCount = robinhoodkpi?.data?.stockCount?.toString();

        const total_market_value_sum_usd = parseFloat(robinhoodkpi.data.total_market_value_sum_usd).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });

        // Replace all placeholders regardless of individual checks
        processedItem = processedItem
          .replace('{{robinhood_total_market_value_sum_usd}}', total_market_value_sum_usd || 'N/A')
          .replace('{{robinhood_perc_change_market_value_usd_7d}}', perc_change_market_value_usd_7d || 'N/A')
          .replace('{{robinhood_stockCount}}', stockCount || 'N/A');
      }

      // Handle Ethereum ETH supply placeholders
      if (processedItem.includes('{{eth_')) {
        const ethSupplyData = await fetchData('eth_supply', "https://api.growthepie.xyz/v1/eim/eth_supply.json");
        
        if (ethSupplyData?.data?.chart) {
          // Get the latest values from supply data
          const supplyData = ethSupplyData.data.chart.eth_supply.daily.data;
          const issuanceData = ethSupplyData.data.chart.eth_issuance_rate.daily.data;
          
          // Get the latest total supply
          const latestSupply = supplyData[supplyData.length - 1][1];
          const totalSupply = parseFloat(latestSupply).toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

          // Calculate net issuance over last 30 days
          const today = supplyData[supplyData.length - 1][1];
          const thirtyDaysAgo = supplyData[supplyData.length - 31][1];
          const netIssuance = (today - thirtyDaysAgo).toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

          // Get the latest annual issuance rate (already in percentage form)
          const annualIssuanceRate = (issuanceData[issuanceData.length - 1][1] * 100).toFixed(2);

          // Replace all placeholders
          processedItem = processedItem
            .replace('{{eth_total_supply}}', totalSupply || 'N/A')
            .replace('{{eth_net_issuance_30d}}', netIssuance || 'N/A')
            .replace('{{eth_annual_issuance_rate}}', annualIssuanceRate || 'N/A');
        }
      }

      // Add more API data sources here
      // Example for Ethereum data:
      // if (processedItem.includes('{{ethereum')) {
      //   const ethereumData = await fetchData('ethereum', "https://api.growthepie.xyz/v1/ethereum-data.json");
      //   if (ethereumData) {
      //     processedItem = processedItem.replace('{{ethereumPrice}}', ethereumData.price);
      //   }
      // }

      return processedItem;
    }
    
    return item;
  };

  return Promise.all(content.map(processItem));
};