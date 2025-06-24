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