// lib/utils/dynamicContent.ts - Extended version

export const processDynamicContent = async (content: any[]): Promise<any[]> => {
  const dynamicDataCache = new Map<string, any>();

  const fetchData = async (key: string, url: string): Promise<any> => {
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
        
        const robinhoodkpi: any = await fetchData('robinhood', "https://api.growthepie.com/v1/quick-bites/robinhood/kpi.json");
        
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

      // Handle Fusaka totals placeholders
      if (processedItem.includes('{{fusaka_')) {
        const fusakaTotals: any = await fetchData('fusaka_totals', "https://api.growthepie.com/v1/quick-bites/fusaka/totals.json");
        let fusakaEip7918: any = null;
        if (processedItem.includes('{{fusaka_total_blob_fee_') || processedItem.includes('{{fusaka_total_blob_fee_usd_')) {
          fusakaEip7918 = await fetchData('fusaka_eip7918', "https://api.growthepie.com/v1/quick-bites/fusaka/eip7918_kpis.json");
        }

        if (fusakaTotals?.data) {
          const { fusaka_total_blobs, fusaka_total_blob_fees_eth, fusaka_total_blocks } = fusakaTotals.data;

          const formattedBlobs = typeof fusaka_total_blobs === 'number'
            ? fusaka_total_blobs.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : 'N/A';

          const formattedFees = typeof fusaka_total_blob_fees_eth === 'number'
            ? fusaka_total_blob_fees_eth.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : 'N/A';

          const formattedBlocks = typeof fusaka_total_blocks === 'number'
            ? fusaka_total_blocks.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : 'N/A';

          processedItem = processedItem
            .replace('{{fusaka_total_blobs}}', formattedBlobs)
            .replace('{{fusaka_total_blob_fees_eth}}', formattedFees)
            .replace('{{fusaka_total_blocks}}', formattedBlocks);
        }

        if (fusakaEip7918?.data) {
          const {
            fusaka_total_blob_fee_eth_with7918,
            fusaka_total_blob_fee_eth_without7918,
            fusaka_total_blob_fee_usd_with7918,
            fusaka_total_blob_fee_usd_without7918,
          } = fusakaEip7918.data;

          const fusaka_total_blob_fee_eth_multiplier =
            typeof fusaka_total_blob_fee_eth_with7918 === 'number' &&
            typeof fusaka_total_blob_fee_eth_without7918 === 'number' &&
            fusaka_total_blob_fee_eth_without7918 !== 0
              ? fusaka_total_blob_fee_eth_with7918 / fusaka_total_blob_fee_eth_without7918
              : null;

          const formatNumber = (val: number | undefined, decimals: number = 2) =>
            typeof val === 'number'
              ? val.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
              : 'N/A';

          processedItem = processedItem
            .replace('{{fusaka_total_blob_fee_eth_with7918}}', formatNumber(fusaka_total_blob_fee_eth_with7918, 2))
            .replace('{{fusaka_total_blob_fee_eth_without7918}}', formatNumber(fusaka_total_blob_fee_eth_without7918, 9))
            .replace('{{fusaka_total_blob_fee_usd_with7918}}', formatNumber(fusaka_total_blob_fee_usd_with7918, 2))
            .replace('{{fusaka_total_blob_fee_usd_without7918}}', formatNumber(fusaka_total_blob_fee_usd_without7918, 2))
            .replace('{{fusaka_total_blob_fee_eth_multiplier}}', formatNumber(fusaka_total_blob_fee_eth_multiplier ?? undefined, 0));
        }
      }

      // Handle ethereum scaling data placeholders
      if (processedItem.includes('{{ethereum')) {
        const ethereumScalingData = await fetchData('ethereum_scaling', "https://api.growthepie.xyz/v1/quick-bites/ethereum-scaling/data.json");

        const ethereumCurrentTPS = parseFloat(ethereumScalingData.data.historical_tps.total).toLocaleString("en-GB", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        });
        const ethereumHistoricalScale = (parseFloat(ethereumScalingData.data.historical_tps.total) / 0.71).toLocaleString("en-GB", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        });

        const ethereumMultiplier = (10000 / parseFloat(ethereumScalingData.data.historical_tps.total)).toLocaleString("en-GB", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        // Replace all placeholders regardless of individual checks
        processedItem = processedItem
          .replace('{{ethereumCurrentTPS}}', ethereumCurrentTPS || 'N/A')
          .replace('{{ethereumHistoricalScale}}', ethereumHistoricalScale || 'N/A')
          .replace('{{ethereumMultiplier}}', ethereumMultiplier || 'N/A')

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

      // Handle Linea burn data placeholders
      if (processedItem.includes('{{linea_') || processedItem.includes('{{total_usd_profits_allocated_for_burn}}')) {
        const lineaKpisData = await fetchData('linea_kpis', "https://api.growthepie.com/v1/quick-bites/linea/kpis.json");

        if (lineaKpisData?.data) {
          const data = lineaKpisData.data;

          // Format numbers with appropriate decimals
          const formatNumber = (value: number | string, decimals: number = 0) => {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            return numValue.toLocaleString("en-GB", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
            });
          };

          // Extract and format all values
          const lineaTokensBridged = data.totals_lineatokensbridged_linea 
            ? formatNumber(data.totals_lineatokensbridged_linea, 0) 
            : 'N/A';
          
          const lineaTokensBridgedUsd = data.totals_lineatokensbridged_usd 
            ? formatNumber(data.totals_lineatokensbridged_usd, 2) 
            : 'N/A';
          
          const ethBurnt = data.totals_ethburnt_eth 
            ? formatNumber(data.totals_ethburnt_eth, 2) 
            : 'N/A';
          
          const ethBurntUsd = data.totals_ethburnt_usd 
            ? formatNumber(data.totals_ethburnt_usd, 2) 
            : 'N/A';
          
          const gasFeeIncome = data.totals_gas_fee_income 
            ? formatNumber(data.totals_gas_fee_income, 2) 
            : 'N/A';
          
          const gasFeeIncomeUsd = data.totals_gas_fee_income_usd 
            ? formatNumber(data.totals_gas_fee_income_usd, 0) 
            : 'N/A';
          
          const operatingCosts = data.totals_operating_costs 
            ? formatNumber(data.totals_operating_costs, 2) 
            : 'N/A';
          
          const operatingCostsUsd = data.totals_operating_costs_usd 
            ? formatNumber(data.totals_operating_costs_usd, 0) 
            : 'N/A';
          
          const operatingCostsL1 = data.totals_operating_costs_l1 
            ? formatNumber(data.totals_operating_costs_l1, 2) 
            : 'N/A';
          
          const operatingCostsL1Usd = data.totals_operating_costs_l1_usd 
            ? formatNumber(data.totals_operating_costs_l1_usd, 2) 
            : 'N/A';
          
          const operatingCostsInfra = data.totals_operating_costs_infrastructure 
            ? formatNumber(data.totals_operating_costs_infrastructure, 2) 
            : 'N/A';
          
          const operatingCostsInfraUsd = data.totals_operating_costs_infrastructure_usd 
            ? formatNumber(data.totals_operating_costs_infrastructure_usd, 2) 
            : 'N/A';
          
          const amountForBurn = data.totals_amount_for_burn 
            ? formatNumber(data.totals_amount_for_burn, 2) 
            : 'N/A';
          
          const amountForBurnUsd = data.totals_amount_for_burn_usd 
            ? formatNumber(data.totals_amount_for_burn_usd, 0) 
            : 'N/A';

          // Calculate total USD burnt
          const lineaTotalUsdBurnt = formatNumber(Number(data.totals_lineatokensbridged_usd) + Number(data.totals_ethburnt_usd), 2);

          // Calculate the projected annual burn rate based on linea_totals_lineatokensbridged_linea
          // Amount burnt since September 11th 2025
          const startDate = new Date('2025-09-11').getTime();
          const currentDate = new Date().getTime();
          const daysSinceStart = (currentDate - startDate) / (1000 * 60 * 60 * 24);
          
          const dailyBurnRate = data.totals_lineatokensbridged_linea 
            ? data.totals_lineatokensbridged_linea / daysSinceStart
            : 0;
          
          const projectedAnnualBurnRate = dailyBurnRate * 365;
          
          const maxLineaSupply = 72009990000;
          const projectedAnnualBurnRatePercentage = projectedAnnualBurnRate > 0
            ? ((projectedAnnualBurnRate / maxLineaSupply) * 100).toFixed(3)
            : 'N/A';
          
          const formattedProjectedAnnualBurnRate = projectedAnnualBurnRate > 0
            ? projectedAnnualBurnRate.toLocaleString("en-GB", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })
            : 'N/A';
          
          const formattedMaxLineaSupply = maxLineaSupply.toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

          // Replace all placeholders
          processedItem = processedItem
            .replace('{{linea_totals_lineatokensburned_linea}}', lineaTokensBridged)
            .replace('{{linea_totals_lineatokensbridged_linea}}', lineaTokensBridged)
            .replace('{{linea_totals_lineatokensbridged_usd}}', lineaTokensBridgedUsd)
            .replace('{{linea_totals_ethburnt_eth}}', ethBurnt)
            .replace('{{linea_totals_ethburnt_usd}}', ethBurntUsd)
            .replace('{{linea_totals_gas_fee_income}}', gasFeeIncome)
            .replace('{{linea_totals_gas_fee_income_usd}}', gasFeeIncomeUsd)
            .replace('{{linea_totals_operating_costs}}', operatingCosts)
            .replace('{{linea_totals_operating_costs_usd}}', operatingCostsUsd)
            .replace('{{linea_totals_operating_costs_l1}}', operatingCostsL1)
            .replace('{{linea_totals_operating_costs_l1_usd}}', operatingCostsL1Usd)
            .replace('{{linea_totals_operating_costs_infrastructure}}', operatingCostsInfra)
            .replace('{{linea_totals_operating_costs_infrastructure_usd}}', operatingCostsInfraUsd)
            .replace('{{linea_totals_amount_for_burn}}', amountForBurn)
            .replace('{{linea_totals_amount_for_burn_usd}}', amountForBurnUsd)
            .replace('{{total_usd_profits_allocated_for_burn}}', amountForBurnUsd)
            // Locally calculated values
            .replace('{{linea_projected_annual_burn_rate}}', formattedProjectedAnnualBurnRate)
            .replace('{{linea_projected_annual_burn_rate_percentage}}', projectedAnnualBurnRatePercentage)
            .replace('{{linea_max_supply}}', formattedMaxLineaSupply)
            .replace('{{linea_total_usd_burnt}}', lineaTotalUsdBurnt);
        }
      }

      // Handle average address KPI placeholders
      if (processedItem.includes('{{avg_address_')) {
        const masterData = await fetchData('master', "https://api.growthepie.com/v1/master.json");
        
        if (masterData?.chains) {
          // Get all chain keys that support the required metrics
          const getChainKeysForMetrics = (metric1: string, metric2: string) => {
            return Object.keys(masterData.chains).filter(key => {
              const chain = masterData.chains[key];
              return chain.supported_metrics?.includes(metric1) && chain.supported_metrics?.includes(metric2);
            });
          };

          // Helper to fetch and calculate average per-address value
          const calculateAveragePerAddress = async (
            metric1: string,
            metric2: string,
            getValue: (data1: any, data2: any) => number | null,
            formatValue: (value: number) => string
          ): Promise<string> => {
            const chainKeys = getChainKeysForMetrics(metric1, metric2);
            
            if (chainKeys.length === 0) return 'N/A';

            const urls1 = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/${metric1}.json`);
            const urls2 = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/${metric2}.json`);

            const [results1, results2] = await Promise.all([
              Promise.all(urls1.map(async (url) => {
                try {
                  const response = await fetch(url);
                  if (!response.ok) return null;
                  return await response.json();
                } catch {
                  return null;
                }
              })),
              Promise.all(urls2.map(async (url) => {
                try {
                  const response = await fetch(url);
                  if (!response.ok) return null;
                  return await response.json();
                } catch {
                  return null;
                }
              }))
            ]);

            const chainsWithData: Array<{ activeAddresses: number; perAddressValue: number }> = [];

            chainKeys.forEach((chainKey, index) => {
              const data1 = results1[index];
              const data2 = results2[index];
              
              if (!data1 || !data2) return;

              const daa30d = data1.details?.summary?.last_30d?.data?.[0] ?? data1.summary?.last_30d?.data?.[0];
              const activeAddresses = daa30d !== undefined ? daa30d : null;
              
              if (activeAddresses === null || activeAddresses === 0) return;

              const value = getValue(data1, data2);
              if (value === null) return;

              chainsWithData.push({
                activeAddresses,
                perAddressValue: value / activeAddresses
              });
            });

            // Sort by active addresses descending, take top 10
            const top10Chains = chainsWithData
              .sort((a, b) => b.activeAddresses - a.activeAddresses)
              .slice(0, 10);

            if (top10Chains.length === 0) return 'N/A';

            // Calculate average per-address value
            const totalPerAddress = top10Chains.reduce((sum, chain) => sum + chain.perAddressValue, 0);
            const average = totalPerAddress / top10Chains.length;

            return formatValue(average);
          };

          // Format number helper
          const formatNumber = (val: number, decimals: number = 2): string => {
            if (val === 0) return "0";
            const absVal = Math.abs(val);
            
            if (absVal < 1000) {
              return val.toFixed(decimals).replace(/\.?0+$/, '');
            }
            
            // Format larger numbers with K, M, B suffixes
            if (absVal >= 1000000000) {
              return (val / 1000000000).toFixed(decimals).replace(/\.?0+$/, '') + 'B';
            }
            if (absVal >= 1000000) {
              return (val / 1000000).toFixed(decimals).replace(/\.?0+$/, '') + 'M';
            }
            if (absVal >= 1000) {
              return (val / 1000).toFixed(decimals).replace(/\.?0+$/, '') + 'K';
            }
            
            return val.toFixed(decimals).replace(/\.?0+$/, '');
          };

          // Calculate each metric
          if (processedItem.includes('{{avg_address_volume}}')) {
            const value = await calculateAveragePerAddress(
              'daa',
              'txcount',
              (daaData, txCountData) => {
                const tx30d = txCountData.details?.summary?.last_30d?.data?.[0] ?? txCountData.summary?.last_30d?.data?.[0];
                return tx30d !== undefined ? tx30d : null;
              },
              (val) => formatNumber(val, 2)
            );
            processedItem = processedItem.replace('{{avg_address_volume}}', value);
          }

          if (processedItem.includes('{{avg_address_complexity}}')) {
            const value = await calculateAveragePerAddress(
              'daa',
              'throughput',
              (daaData, throughputData) => {
                const throughput30d = throughputData.details?.summary?.last_30d?.data?.[0] ?? throughputData.summary?.last_30d?.data?.[0];
                return throughput30d !== undefined ? throughput30d * 1000000 : null; // Multiply by 1M like in the chart
              },
              (val) => formatNumber(val, 2)
            );
            processedItem = processedItem.replace('{{avg_address_complexity}}', value);
          }

          if (processedItem.includes('{{avg_address_value}}')) {
            const value = await calculateAveragePerAddress(
              'daa',
              'stables_mcap',
              (daaData, stablesData) => {
                const stables30d = stablesData.details?.summary?.last_30d?.data?.[0] ?? stablesData.summary?.last_30d?.data?.[0];
                return stables30d !== undefined ? stables30d : null;
              },
              (val) => `$${formatNumber(val, 2)}`
            );
            processedItem = processedItem.replace('{{avg_address_value}}', value);
          }

          if (processedItem.includes('{{avg_address_unit_cost}}')) {
            // For unit cost, calculate average transaction cost (not per address)
            const chainKeys = getChainKeysForMetrics('daa', 'txcosts');
            
            if (chainKeys.length === 0) {
              processedItem = processedItem.replace('{{avg_address_unit_cost}}', 'N/A');
            } else {
              const daaUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/daa.json`);
              const txCostsUrls = chainKeys.map(key => `https://api.growthepie.com/v1/metrics/chains/${key}/txcosts.json`);

              const [daaResults, txCostsResults] = await Promise.all([
                Promise.all(daaUrls.map(async (url) => {
                  try {
                    const response = await fetch(url);
                    if (!response.ok) return null;
                    return await response.json();
                  } catch {
                    return null;
                  }
                })),
                Promise.all(txCostsUrls.map(async (url) => {
                  try {
                    const response = await fetch(url);
                    if (!response.ok) return null;
                    return await response.json();
                  } catch {
                    return null;
                  }
                }))
              ]);

              const chainsWithData: Array<{ activeAddresses: number; txCost: number }> = [];

              chainKeys.forEach((chainKey, index) => {
                const daaData = daaResults[index];
                const txCostsData = txCostsResults[index];
                
                if (!daaData || !txCostsData) return;

                const daa30d = daaData.details?.summary?.last_30d?.data?.[0] ?? daaData.summary?.last_30d?.data?.[0];
                const activeAddresses = daa30d !== undefined ? daa30d : null;
                
                const txCosts30d = txCostsData.details?.summary?.last_30d?.data?.[0] ?? txCostsData.summary?.last_30d?.data?.[0];
                const txCost = txCosts30d !== undefined ? txCosts30d : null;

                if (activeAddresses === null || txCost === null) return;

                chainsWithData.push({ activeAddresses, txCost });
              });

              // Sort by active addresses descending, take top 10
              const top10Chains = chainsWithData
                .sort((a, b) => b.activeAddresses - a.activeAddresses)
                .slice(0, 10);

              if (top10Chains.length === 0) {
                processedItem = processedItem.replace('{{avg_address_unit_cost}}', 'N/A');
              } else {
                // Calculate average transaction cost (not per address)
                const totalTxCost = top10Chains.reduce((sum, chain) => sum + chain.txCost, 0);
                const averageTxCost = totalTxCost / top10Chains.length;
                processedItem = processedItem.replace('{{avg_address_unit_cost}}', `$${formatNumber(averageTxCost, 4)}`);
              }
            }
          }
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
