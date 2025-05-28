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
        const timeboostDataRounded = timeboostData.data.fees_paid_priority_eth.total.toFixed(2);
        if (timeboostDataRounded) {
          processedItem = processedItem.replace('{{timeboostTotalETH}}', timeboostDataRounded);
          // Add more timeboost replacements as needed
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