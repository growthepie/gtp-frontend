// lib/utils/dynamicContent.ts - Extended version
export const processDynamicContent = async (content: any[]): Promise<any[]> => {
  const dynamicDataCache = new Map<string, any>();
  const formatChainLabel = (value: string): string =>
    value
      .replace(/[_-]+/g, " ")
      .split(" ")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const sumLastNDays = (series: any, days: number = 7): number | null => {
    if (!Array.isArray(series)) return null;

    const points = series
      .filter((row: any) => Array.isArray(row) && row.length >= 2)
      .map((row: any) => [Number(row[0]), Number(row[1])])
      .filter(([timestamp, value]: [number, number]) => Number.isFinite(timestamp) && Number.isFinite(value))
      .sort((a: [number, number], b: [number, number]) => a[0] - b[0]);

    if (!points.length) return null;

    return points
      .slice(-days)
      .reduce((sum: number, [, value]: [number, number]) => sum + value, 0);
  };
  const getPreferredMetricIndex = (
    types: any,
    preferredOrder: string[] = ["usd", "eth"],
  ): number => {
    const normalizedTypes = Array.isArray(types)
      ? types.map((value: any) => String(value).toLowerCase())
      : [];

    for (const preferredType of preferredOrder) {
      const preferredIndex = normalizedTypes.indexOf(preferredType);
      if (preferredIndex >= 0) {
        return preferredIndex;
      }
    }

    const nonTimeIndex = normalizedTypes.findIndex(
      (type: string) => !["unix", "timestamp", "time", "date"].includes(type),
    );
    if (nonTimeIndex >= 0) {
      return nonTimeIndex;
    }

    return normalizedTypes.length > 1 ? 1 : 0;
  };
  const sumLastNDaysByIndex = (series: any, valueIndex: number, days: number = 7): number | null => {
    if (!Array.isArray(series)) return null;

    const points = series
      .filter((row: any) => Array.isArray(row) && row.length > valueIndex)
      .map((row: any) => [Number(row[0]), Number(row[valueIndex])])
      .filter(([timestamp, value]: [number, number]) => Number.isFinite(timestamp) && Number.isFinite(value))
      .sort((a: [number, number], b: [number, number]) => a[0] - b[0]);

    if (!points.length) return null;

    return points
      .slice(-days)
      .reduce((sum: number, [, value]: [number, number]) => sum + value, 0);
  };
  const averageLastNDays = (series: any, days: number = 7): number | null => {
    if (!Array.isArray(series)) return null;

    const points = series
      .filter((row: any) => Array.isArray(row) && row.length >= 2)
      .map((row: any) => [Number(row[0]), Number(row[1])])
      .filter(([timestamp, value]: [number, number]) => Number.isFinite(timestamp) && Number.isFinite(value))
      .sort((a: [number, number], b: [number, number]) => a[0] - b[0]);

    if (!points.length) return null;

    const lastPoints = points.slice(-days);
    if (!lastPoints.length) return null;

    const sum = lastPoints.reduce((acc: number, [, value]: [number, number]) => acc + value, 0);
    return sum / lastPoints.length;
  };
  const getSummaryValue = (summary: any): number | null => {
    if (!summary || !Array.isArray(summary.data) || summary.data.length === 0) {
      return null;
    }

    const data = summary.data.map((value: any) => Number(value));
    const types = Array.isArray(summary.types)
      ? summary.types.map((value: any) => String(value).toLowerCase())
      : [];

    const preferredIndices: number[] = [];
    const metricIndex = types.findIndex(
      (type: string) => !["unix", "timestamp", "time", "date"].includes(type),
    );
    if (metricIndex >= 0) preferredIndices.push(metricIndex);
    preferredIndices.push(1, 0);

    for (const index of Array.from(new Set(preferredIndices))) {
      const candidate = data[index];
      if (!Number.isFinite(candidate)) continue;
      if (types[index] && ["unix", "timestamp", "time", "date"].includes(types[index])) continue;
      return candidate;
    }

    return data.find((candidate: number) => Number.isFinite(candidate)) ?? null;
  };

  const fetchData = async (key: string, url: string): Promise<any> => {
    if (!dynamicDataCache.has(key)) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          dynamicDataCache.set(key, null);
          return null;
        }

        const contentType = response.headers.get("content-type")?.toLowerCase() || "";
        let data: any = null;

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const rawText = await response.text();
          const trimmedText = rawText.trim();

          if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
            data = JSON.parse(trimmedText);
          } else {
            data = null;
          }
        }

        dynamicDataCache.set(key, data);
      } catch (error) {
        dynamicDataCache.set(key, null);
        console.error(`Failed to fetch ${key} data:`, error);
      }
    }
    return dynamicDataCache.get(key);
  };
  const buildAvgActiveAddressTop10Series = async (
    metricKey: "txcount" | "throughput" | "stables_mcap" | "tvl" | "fees" | "profit" | "rent_paid",
  ) => {
    const landingRaw = await fetchData('landing_page', "https://api.growthepie.com/v1/landing_page.json");
    const masterRaw = await fetchData('master', "https://api.growthepie.com/v1/master.json");
    const tableVisual = landingRaw?.data?.metrics?.table_visual ?? {};
    const prodChainKeySet = new Set(
      Object.entries(masterRaw?.chains ?? {})
        .flatMap(([key, chain]: [string, any]) => {
          if (chain?.deployment !== "PROD") return [];

          const keyCandidates = [
            key,
            chain?.url_key,
          ]
            .filter((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0)
            .map((candidate) => candidate.trim().toLowerCase());

          return keyCandidates.flatMap((candidate) => [
            candidate,
            candidate.replace(/_/g, "-"),
            candidate.replace(/-/g, "_"),
          ]);
        }),
    );

    const chainRows = await Promise.all(
      Object.entries(tableVisual).map(async ([tableKey, tableEntry]: [string, any]) => {
        const weeklyActiveRaw = Number(tableEntry?.users);
        if (!Number.isFinite(weeklyActiveRaw)) {
          return null;
        }

        const rawChainKeyCandidate =
          typeof tableEntry?.origin_key === "string" && tableEntry.origin_key.trim().length > 0
            ? tableEntry.origin_key.trim().toLowerCase()
            : tableKey.trim().toLowerCase();

        const chainKeyCandidates = Array.from(
          new Set([
            rawChainKeyCandidate,
            rawChainKeyCandidate.replace(/_/g, "-"),
            rawChainKeyCandidate.replace(/-/g, "_"),
          ]),
        ).filter((candidate) => /^[a-z0-9_-]+$/.test(candidate));

        if (!chainKeyCandidates.length) {
          return null;
        }
        if (prodChainKeySet.size > 0 && !chainKeyCandidates.some((candidate) => prodChainKeySet.has(candidate))) {
          return null;
        }

        let resolvedChainKey: string | null = null;
        let metric7d: number | null = null;

        for (const chainKeyCandidate of chainKeyCandidates) {
          const metricRaw = await fetchData(
            `${metricKey}_${chainKeyCandidate}`,
            `https://api.growthepie.com/v1/metrics/chains/${chainKeyCandidate}/${metricKey}.json`,
          );

          if (metricKey === "throughput") {
            // Throughput in fundamentals is displayed as an average rate; for the quick bite
            // we take last_7d avg and convert Mgas/s -> gas/s for direct comparability.
            const summaryAvgMgasPerSecond = getSummaryValue(metricRaw?.details?.summary?.last_7d);
            const fallbackAvgMgasPerSecond = averageLastNDays(metricRaw?.details?.timeseries?.daily?.data, 7);
            const throughputMgasPerSecond = Number.isFinite(summaryAvgMgasPerSecond as number)
              ? summaryAvgMgasPerSecond
              : fallbackAvgMgasPerSecond;

            if (Number.isFinite(throughputMgasPerSecond as number)) {
              resolvedChainKey = chainKeyCandidate;
              metric7d = (throughputMgasPerSecond as number) * 1_000_000;
              break;
            }

            continue;
          }

          if (metricKey === "stables_mcap") {
            // Stablecoin market cap is a stock metric; use latest daily value (USD index)
            // to rank top stablecoin chains for the scatter.
            const dailyTypes = Array.isArray(metricRaw?.details?.timeseries?.daily?.types)
              ? metricRaw.details.timeseries.daily.types.map((entry: any) => String(entry).toLowerCase())
              : [];
            const preferredIndex = dailyTypes.indexOf("usd") >= 0 ? dailyTypes.indexOf("usd") : 1;
            const dailyPoints = Array.isArray(metricRaw?.details?.timeseries?.daily?.data)
              ? metricRaw.details.timeseries.daily.data
              : [];
            const lastPoint = dailyPoints[dailyPoints.length - 1];
            const stableMcapCandidate =
              Array.isArray(lastPoint) && lastPoint.length > preferredIndex
                ? Number(lastPoint[preferredIndex])
                : Number.NaN;

            if (Number.isFinite(stableMcapCandidate)) {
              resolvedChainKey = chainKeyCandidate;
              metric7d = stableMcapCandidate;
              break;
            }

            continue;
          }

          if (metricKey === "tvl") {
            // TVS/TVL is a stock metric; use latest daily value (USD index)
            // to rank top TVS chains for the scatter.
            const dailyTypes = Array.isArray(metricRaw?.details?.timeseries?.daily?.types)
              ? metricRaw.details.timeseries.daily.types.map((entry: any) => String(entry).toLowerCase())
              : [];
            const preferredIndex = dailyTypes.indexOf("usd") >= 0 ? dailyTypes.indexOf("usd") : 1;
            const dailyPoints = Array.isArray(metricRaw?.details?.timeseries?.daily?.data)
              ? metricRaw.details.timeseries.daily.data
              : [];
            const lastPoint = dailyPoints[dailyPoints.length - 1];
            const tvlCandidate =
              Array.isArray(lastPoint) && lastPoint.length > preferredIndex
                ? Number(lastPoint[preferredIndex])
                : Number.NaN;

            if (Number.isFinite(tvlCandidate)) {
              resolvedChainKey = chainKeyCandidate;
              metric7d = tvlCandidate;
              break;
            }

            continue;
          }

          if (metricKey === "fees" || metricKey === "profit" || metricKey === "rent_paid") {
            // Value-capture metrics are flow metrics; use weekly sum from daily series,
            // preferring USD values where available.
            const dailyTypes = metricRaw?.details?.timeseries?.daily?.types;
            const valueIndex = getPreferredMetricIndex(dailyTypes, ["usd", "eth"]);
            const weeklySumCandidate = sumLastNDaysByIndex(
              metricRaw?.details?.timeseries?.daily?.data,
              valueIndex,
              7,
            );

            if (Number.isFinite(weeklySumCandidate)) {
              resolvedChainKey = chainKeyCandidate;
              metric7d = weeklySumCandidate as number;
              break;
            }

            continue;
          }

          const metric7dCandidate = sumLastNDays(metricRaw?.details?.timeseries?.daily?.data, 7);
          if (Number.isFinite(metric7dCandidate as number)) {
            resolvedChainKey = chainKeyCandidate;
            metric7d = metric7dCandidate;
            break;
          }
        }

        if (!resolvedChainKey || !Number.isFinite(metric7d as number)) {
          return null;
        }

        const displayNameCandidate =
          tableEntry?.name ||
          tableEntry?.label ||
          tableEntry?.chain_name ||
          rawChainKeyCandidate;

        const displayName =
          typeof displayNameCandidate === "string" && displayNameCandidate.trim().length > 0
            ? displayNameCandidate
            : formatChainLabel(resolvedChainKey);

        return {
          chainKey: resolvedChainKey,
          displayName,
          weeklyActive: Math.round(weeklyActiveRaw),
          metric7d: Math.round(metric7d as number),
        };
      }),
    );

    return chainRows
      .filter(
        (
          row,
        ): row is {
          chainKey: string;
          displayName: string;
          weeklyActive: number;
          metric7d: number;
        } => Boolean(row),
      )
      .sort((a, b) => b.metric7d - a.metric7d)
      .slice(0, 10)
      .map((row) => ({
        name: row.displayName,
        key: row.chainKey,
        type: "scatter",
        data: [[row.weeklyActive, row.metric7d]],
        ...(metricKey === "throughput"
          ? {
              suffix: " gas/s",
              tooltipDecimals: 0,
            }
          : metricKey === "stables_mcap"
            ? {
                prefix: "$",
                tooltipDecimals: 0,
              }
          : metricKey === "tvl"
            ? {
                prefix: "$",
                tooltipDecimals: 0,
              }
          : metricKey === "fees" || metricKey === "profit" || metricKey === "rent_paid"
            ? {
                prefix: "$",
                tooltipDecimals: 0,
              }
          : {}),
      }));
  };

  const buildTxCostTop10Series = async (
    metricKey: "activeaddresses" | "txcount" | "throughput" | "fees" | "profit" | "tvl",
  ) => {
    const landingRaw = await fetchData('landing_page', "https://api.growthepie.com/v1/landing_page.json");
    const masterRaw = await fetchData('master', "https://api.growthepie.com/v1/master.json");
    const tableVisual = landingRaw?.data?.metrics?.table_visual ?? {};
    const prodChainKeySet = new Set(
      Object.entries(masterRaw?.chains ?? {})
        .flatMap(([key, chain]: [string, any]) => {
          if (chain?.deployment !== "PROD") return [];
          const keyCandidates = [key, chain?.url_key]
            .filter((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0)
            .map((candidate) => candidate.trim().toLowerCase());
          return keyCandidates.flatMap((candidate) => [
            candidate,
            candidate.replace(/_/g, "-"),
            candidate.replace(/-/g, "_"),
          ]);
        }),
    );

    const chainRows = await Promise.all(
      Object.entries(tableVisual).map(async ([tableKey, tableEntry]: [string, any]) => {
        const rawChainKeyCandidate =
          typeof tableEntry?.origin_key === "string" && tableEntry.origin_key.trim().length > 0
            ? tableEntry.origin_key.trim().toLowerCase()
            : tableKey.trim().toLowerCase();

        const chainKeyCandidates = Array.from(
          new Set([
            rawChainKeyCandidate,
            rawChainKeyCandidate.replace(/_/g, "-"),
            rawChainKeyCandidate.replace(/-/g, "_"),
          ]),
        ).filter((candidate) => /^[a-z0-9_-]+$/.test(candidate));

        if (!chainKeyCandidates.length) return null;
        if (prodChainKeySet.size > 0 && !chainKeyCandidates.some((candidate) => prodChainKeySet.has(candidate))) {
          return null;
        }

        let resolvedChainKey: string | null = null;
        let txCostX: number | null = null;
        let metricY: number | null = null;

        // X-axis: 7-day average transaction fee (USD) from txcosts endpoint
        for (const chainKeyCandidate of chainKeyCandidates) {
          const txcostsRaw = await fetchData(
            `txcosts_${chainKeyCandidate}`,
            `https://api.growthepie.com/v1/metrics/chains/${chainKeyCandidate}/txcosts.json`,
          );
          const dailyTypes = txcostsRaw?.details?.timeseries?.daily?.types;
          const valueIndex = getPreferredMetricIndex(dailyTypes, ["usd", "eth"]);
          const dailyData = txcostsRaw?.details?.timeseries?.daily?.data;
          const mappedData = Array.isArray(dailyData)
            ? dailyData.map((row: any) => (Array.isArray(row) ? [row[0], row[valueIndex]] : null)).filter(Boolean)
            : null;
          const txcostAvg = averageLastNDays(mappedData, 7);
          if (Number.isFinite(txcostAvg as number)) {
            resolvedChainKey = chainKeyCandidate;
            txCostX = txcostAvg as number;
            break;
          }
        }

        if (!resolvedChainKey || !Number.isFinite(txCostX as number)) return null;

        // Y-axis: the comparison metric
        if (metricKey === "activeaddresses") {
          const weeklyActive = Number(tableEntry?.users);
          if (Number.isFinite(weeklyActive)) metricY = Math.round(weeklyActive);
        } else {
          for (const chainKeyCandidate of chainKeyCandidates) {
            const metricRaw = await fetchData(
              `${metricKey}_${chainKeyCandidate}`,
              `https://api.growthepie.com/v1/metrics/chains/${chainKeyCandidate}/${metricKey}.json`,
            );

            if (metricKey === "throughput") {
              const summaryAvg = getSummaryValue(metricRaw?.details?.summary?.last_7d);
              const fallbackAvg = averageLastNDays(metricRaw?.details?.timeseries?.daily?.data, 7);
              const throughput = Number.isFinite(summaryAvg as number) ? summaryAvg : fallbackAvg;
              if (Number.isFinite(throughput as number)) {
                metricY = (throughput as number) * 1_000_000;
                break;
              }
              continue;
            }

            if (metricKey === "tvl") {
              const dailyTypes = Array.isArray(metricRaw?.details?.timeseries?.daily?.types)
                ? metricRaw.details.timeseries.daily.types.map((e: any) => String(e).toLowerCase())
                : [];
              const preferredIndex = dailyTypes.indexOf("usd") >= 0 ? dailyTypes.indexOf("usd") : 1;
              const dailyPoints = Array.isArray(metricRaw?.details?.timeseries?.daily?.data)
                ? metricRaw.details.timeseries.daily.data
                : [];
              const lastPoint = dailyPoints[dailyPoints.length - 1];
              const tvlCandidate =
                Array.isArray(lastPoint) && lastPoint.length > preferredIndex
                  ? Number(lastPoint[preferredIndex])
                  : Number.NaN;
              if (Number.isFinite(tvlCandidate)) {
                metricY = tvlCandidate;
                break;
              }
              continue;
            }

            if (metricKey === "fees" || metricKey === "profit") {
              const dailyTypes = metricRaw?.details?.timeseries?.daily?.types;
              const valueIndex = getPreferredMetricIndex(dailyTypes, ["usd", "eth"]);
              const weeklySum = sumLastNDaysByIndex(metricRaw?.details?.timeseries?.daily?.data, valueIndex, 7);
              if (Number.isFinite(weeklySum)) {
                metricY = weeklySum as number;
                break;
              }
              continue;
            }

            // txcount: weekly sum
            const weeklySum = sumLastNDays(metricRaw?.details?.timeseries?.daily?.data, 7);
            if (Number.isFinite(weeklySum as number)) {
              metricY = weeklySum;
              break;
            }
          }
        }

        if (!Number.isFinite(metricY as number)) return null;

        const displayNameCandidate = tableEntry?.name || tableEntry?.label || tableEntry?.chain_name || rawChainKeyCandidate;
        const displayName =
          typeof displayNameCandidate === "string" && displayNameCandidate.trim().length > 0
            ? displayNameCandidate
            : formatChainLabel(resolvedChainKey!);

        return {
          chainKey: resolvedChainKey,
          displayName,
          txCostX: txCostX!,
          metricY: metricY as number,
        };
      }),
    );

    return chainRows
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .sort((a, b) => b.metricY - a.metricY)
      .slice(0, 10)
      .map((row) => ({
        name: row.displayName,
        key: row.chainKey,
        type: "scatter",
        data: [[row.txCostX, Math.round(row.metricY)]],
        prefix: "$",
        tooltipDecimals: 4,
        ...(metricKey === "throughput"
          ? { suffix: " gas/s", tooltipDecimals: 4 }
          : metricKey === "tvl" || metricKey === "fees" || metricKey === "profit"
            ? { tooltipDecimals: 4 }
            : {}),
      }));
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

      // Handle EIP-8004 data placeholders
      if (processedItem.includes('{{eip8004_')) {
        const eip8004KpisRaw = await fetchData('eip8004_kpis', "https://api.growthepie.com/v1/quick-bites/eip8004/kpis.json");
        const eip8004UriQualityRaw = await fetchData('eip8004_uri_quality', "https://api.growthepie.com/v1/quick-bites/eip8004/uri_quality.json");

        const kpis = (eip8004KpisRaw?.data ?? {}) as Record<string, any>;
        const uriQualityRows = (eip8004UriQualityRaw?.data?.uri_quality?.rows ?? []) as any[][];
        const emptyUriRow = uriQualityRows[0] ?? [];
        const validUriRow = uriQualityRows[1] ?? [];

        const formatNumber = (value: any, decimals: number = 0): string => {
          const num = Number(value);
          if (!Number.isFinite(num)) return 'N/A';
          return num.toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        };

        const totalAgents = kpis.total_agents;
        const agentsWithFeedback = kpis.agents_with_feedback;
        const uniqueOwners = kpis.unique_owners;
        const emptyUriCount = emptyUriRow[1];
        const emptyUriShare = emptyUriRow[2];
        const validUriCount = validUriRow[1];
        const validUriShare = validUriRow[2];

        processedItem = processedItem
          .replace('{{eip8004_total_agents}}', formatNumber(totalAgents, 0))
          .replace('{{eip8004_agents_with_feedback}}', formatNumber(agentsWithFeedback, 0))
          .replace('{{eip8004_unique_owners}}', formatNumber(uniqueOwners, 0))
          .replace('{{eip8004_empty_uri_count}}', formatNumber(emptyUriCount, 0))
          .replace('{{eip8004_empty_uri_share}}', formatNumber(emptyUriShare, 2))
          .replace('{{eip8004_valid_uri_count}}', formatNumber(validUriCount, 0))
          .replace('{{eip8004_valid_uri_share}}', formatNumber(validUriShare, 2))
          // Backward-compatible replacements for old placeholders
          .replace('{{eip8004_invalid_uri_latest}}', formatNumber(emptyUriCount, 0))
          .replace('{{eip8004_invalid_uri_share_latest}}', formatNumber(emptyUriShare, 2))
          .replace('{{eip8004_invalid_uri_7d_avg}}', 'N/A');
      }

      // Handle Octant data placeholders
      if (processedItem.includes('{{octant_')) {
        const octantSummaryRaw = await fetchData('octant_summary', "https://api.growthepie.com/v1/trackers/octant/summary.json");
        const octantSummary = (octantSummaryRaw ?? {}) as Record<string, any>;

        const formatNumber = (value: any, decimals: number = 0): string => {
          const num = Number(value);
          if (!Number.isFinite(num)) return 'N/A';
          return num.toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        };

        const totalFunded = octantSummary?.total_funding_amount;
        const medianProjectFunding = octantSummary?.median_reward_amounts?.all;
        const totalWalletsLocked = octantSummary?.locked_changes?.now?.num_users_locked_glm;

        processedItem = processedItem
          .replace('{{octant_total_funded_eth}}', formatNumber(totalFunded, 0))
          .replace('{{octant_median_project_funding_eth}}', formatNumber(medianProjectFunding, 2))
          .replace('{{octant_total_wallets_locked}}', formatNumber(totalWalletsLocked, 0));
      }

      // Handle Base/Celo scatter placeholders:
      // - weekly active addresses from landing table (x-axis)
      // - 7d transaction count sums from chain metric endpoints (y-axis)
      if (processedItem.includes('{{avg_active_address_top10_series}}')) {
        const top10Series = await buildAvgActiveAddressTop10Series("txcount");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_series}}',
          JSON.stringify(top10Series),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_throughput_series}}')) {
        const top10ThroughputSeries = await buildAvgActiveAddressTop10Series("throughput");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_throughput_series}}',
          JSON.stringify(top10ThroughputSeries),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_stables_series}}')) {
        const top10StablecoinSeries = await buildAvgActiveAddressTop10Series("stables_mcap");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_stables_series}}',
          JSON.stringify(top10StablecoinSeries),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_tvs_series}}')) {
        const top10TvsSeries = await buildAvgActiveAddressTop10Series("tvl");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_tvs_series}}',
          JSON.stringify(top10TvsSeries),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_revenue_series}}')) {
        const top10RevenueSeries = await buildAvgActiveAddressTop10Series("fees");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_revenue_series}}',
          JSON.stringify(top10RevenueSeries),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_profit_series}}')) {
        const top10ProfitSeries = await buildAvgActiveAddressTop10Series("profit");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_profit_series}}',
          JSON.stringify(top10ProfitSeries),
        );
      }

      if (processedItem.includes('{{avg_active_address_top10_rent_paid_series}}')) {
        const top10RentPaidSeries = await buildAvgActiveAddressTop10Series("rent_paid");
        processedItem = processedItem.replace(
          '{{avg_active_address_top10_rent_paid_series}}',
          JSON.stringify(top10RentPaidSeries),
        );
      }

      if (processedItem.includes('{{txcost_top10_activeaddress_series}}')) {
        const series = await buildTxCostTop10Series("activeaddresses");
        processedItem = processedItem.replace('{{txcost_top10_activeaddress_series}}', JSON.stringify(series));
      }

      if (processedItem.includes('{{txcost_top10_txcount_series}}')) {
        const series = await buildTxCostTop10Series("txcount");
        processedItem = processedItem.replace('{{txcost_top10_txcount_series}}', JSON.stringify(series));
      }

      if (processedItem.includes('{{txcost_top10_throughput_series}}')) {
        const series = await buildTxCostTop10Series("throughput");
        processedItem = processedItem.replace('{{txcost_top10_throughput_series}}', JSON.stringify(series));
      }

      if (processedItem.includes('{{txcost_top10_revenue_series}}')) {
        const series = await buildTxCostTop10Series("fees");
        processedItem = processedItem.replace('{{txcost_top10_revenue_series}}', JSON.stringify(series));
      }

      if (processedItem.includes('{{txcost_top10_profit_series}}')) {
        const series = await buildTxCostTop10Series("profit");
        processedItem = processedItem.replace('{{txcost_top10_profit_series}}', JSON.stringify(series));
      }

      if (processedItem.includes('{{txcost_top10_tvs_series}}')) {
        const series = await buildTxCostTop10Series("tvl");
        processedItem = processedItem.replace('{{txcost_top10_tvs_series}}', JSON.stringify(series));
      }

      if (
        processedItem.includes('{{base_7d_') ||
        processedItem.includes('{{celo_7d_') ||
        processedItem.includes('{{base_weekly_active_addresses}}') ||
        processedItem.includes('{{celo_weekly_active_addresses}}')
      ) {
        const landingRaw = await fetchData('landing_page', "https://api.growthepie.com/v1/landing_page.json");
        const baseTxCountRaw = await fetchData('base_txcount', "https://api.growthepie.com/v1/metrics/chains/base/txcount.json");
        const celoTxCountRaw = await fetchData('celo_txcount', "https://api.growthepie.com/v1/metrics/chains/celo/txcount.json");

        const tableVisual = landingRaw?.data?.metrics?.table_visual ?? {};
        const baseWeeklyActive = Number(tableVisual?.base?.users);
        const celoWeeklyActive = Number(tableVisual?.celo?.users);
        const baseTxCount7d = sumLastNDays(baseTxCountRaw?.details?.timeseries?.daily?.data, 7);
        const celoTxCount7d = sumLastNDays(celoTxCountRaw?.details?.timeseries?.daily?.data, 7);

        const baseWeeklyActiveString = Number.isFinite(baseWeeklyActive) ? String(Math.round(baseWeeklyActive)) : '0';
        const celoWeeklyActiveString = Number.isFinite(celoWeeklyActive) ? String(Math.round(celoWeeklyActive)) : '0';

        processedItem = processedItem
          .replace('{{base_weekly_active_addresses}}', baseWeeklyActiveString)
          .replace('{{celo_weekly_active_addresses}}', celoWeeklyActiveString)
          // Backward compatibility for older placeholder names:
          .replace('{{base_7d_daa_sum}}', baseWeeklyActiveString)
          .replace('{{celo_7d_daa_sum}}', celoWeeklyActiveString)
          .replace('{{base_7d_txcount_sum}}', Number.isFinite(baseTxCount7d as number) ? String(Math.round(baseTxCount7d as number)) : '0')
          .replace('{{celo_7d_txcount_sum}}', Number.isFinite(celoTxCount7d as number) ? String(Math.round(celoTxCount7d as number)) : '0');
      }

      // Handle stablecoin fiat data placeholders
      if (processedItem.includes('{{stablecoin_fiat_')) {
        const stablecoinFiatData = await fetchData('stablecoin_fiat_timeseries', "https://api.growthepie.com/v1/quick-bites/stablecoins/fiat/timeseries.json");

        if (stablecoinFiatData?.data?.timeseries) {
          const types: string[] = stablecoinFiatData.data.timeseries.types ?? [];
          const values: any[][] = stablecoinFiatData.data.timeseries.values ?? [];
          const latestRow: any[] = values.length > 0 ? values[values.length - 1] : [];

          const fiatCount = types.length;

          // Sum all currency values in the latest row (index 0 is timestamp)
          const total = latestRow.slice(1).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);

          const usdRawIdx = types.findIndex((t: string) => t.toLowerCase() === "usd");
          const usdValue = usdRawIdx >= 0 ? (Number(latestRow[usdRawIdx + 1]) || 0) : 0;
          const usdDominance = total > 0 ? ((usdValue / total) * 100).toFixed(1) : 'N/A';
          const nonUsdMcap = total - usdValue;

          const formatBillions = (value: number) => {
            if (value >= 1e9) return (value / 1e9).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'B';
            if (value >= 1e6) return (value / 1e6).toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
            return value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          };

          processedItem = processedItem
            .replace('{{stablecoin_fiat_count}}', String(fiatCount))
            .replace('{{stablecoin_fiat_usd_dominance}}', usdDominance + '%')
            .replace('{{stablecoin_fiat_non_usd_mcap}}', '$' + formatBillions(nonUsdMcap));
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
