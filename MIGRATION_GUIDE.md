# Fundamentals API Migration Guide

## Overview

This guide documents the migration from the old monolithic metrics API to the new per-chain metrics API structure for the fundamentals routes.

## What Changed

### Old Structure (Before)
- **Single API endpoint** per metric returning all chains' data
- URL: `https://api.growthepie.com/v1/metrics/{metric}.json`
- Response: `MetricsResponse` with all chains nested under `data.chains`

### New Structure (After)
- **Multiple API endpoints** - one per chain+metric combination
- URL: `https://api.growthepie.com/v1/metrics/chains/{chain}/{metric}.json`
- Response: `ChainMetricResponse` with single chain's data
- Client-side aggregation of multiple chain responses

## Files Created

### 1. Type Definitions
**`types/api/ChainMetricResponse.d.ts`**
- New generic interface for per-chain metric responses
- Mirrors the structure from your example (timeseries, changes, summary)
- Used by the new `useChainMetrics` hook

### 2. Custom Hook
**`hooks/useChainMetrics.ts`**
- Fetches multiple chains in parallel using multiple SWR hooks
- Aggregates responses into a structure compatible with existing components
- Transforms new API structure to old `MetricData` format
- Returns loading/error states for all requests

### 3. URL Builder
**`lib/urls.ts`** (updated)
- Added `MetricURLKeyToAPIKey` mapping (e.g., "daily-active-addresses" → "daa")
- Added `getChainMetricURL(chain, metricURLKey)` function
- Kept old `MetricsURLs` for backwards compatibility with DA metrics

## Files Modified

### 1. MetricDataContext
**`components/metric/MetricDataContext.tsx`**
- Now uses `useChainMetrics` hook for fundamentals metrics
- Falls back to old API for data-availability metrics (not yet migrated)
- Automatically determines which chains to fetch from MasterContext
- Data transformation is handled in the hook, so component logic remains unchanged

### 2. MetricsResponse Types
**`types/api/MetricsResponse.d.ts`**
- Added optional `weekly` property to `ChainData` type

## How It Works

### Data Flow (New)

1. **MetricDataContext** determines which chains to load:
   ```typescript
   const chainsToFetch = AllChains
     .filter(chain => SupportedChainKeys.includes(chain.key))
     .map(chain => chain.key);
   ```

2. **useChainMetrics** hook creates multiple SWR calls:
   ```typescript
   // For each chain: arbitrum, optimism, base, etc.
   useSWR("https://api.growthepie.com/v1/metrics/chains/arbitrum/daa.json")
   useSWR("https://api.growthepie.com/v1/metrics/chains/optimism/daa.json")
   useSWR("https://api.growthepie.com/v1/metrics/chains/base/daa.json")
   // ... etc
   ```

3. **Hook aggregates** all responses:
   ```typescript
   {
     metric_id: "daa",
     metric_name: "Daily Active Addresses",
     chains: {
       arbitrum: { /* ChainData */ },
       optimism: { /* ChainData */ },
       base: { /* ChainData */ },
       // ...
     }
   }
   ```

4. **Components consume** the same `data.chains[chainKey]` structure as before

## Error Handling

### 404/403 Responses
Some chains may not have data for certain metrics. The hook gracefully handles this:

- **404 (Not Found)** - Chain doesn't have this metric, silently excluded from results
- **403 (Forbidden)** - Access denied, silently excluded from results
- **500+ (Server Error)** - Temporary failure, silently excluded (could retry in future)
- **Other errors** - Reported as critical errors to the UI

This means:
- If 10 chains are requested but only 7 have data → 7 chains displayed
- If all chains return 404 → empty state shown (no data available)
- Charts and tables only show chains with successful responses

### Implementation
```typescript
// In useChainMetrics hook:
chainResponses.filter((response) => {
  const errorStatus = response.error?.status;
  // Exclude 404, 403, 500+ errors
  if (errorStatus === 404 || errorStatus === 403 || errorStatus >= 500) {
    return false; // Don't include in aggregated data
  }
  return !!response.data;
});
```

## Benefits

1. **Parallel Loading** - All chains load simultaneously instead of sequentially
2. **Better Caching** - SWR caches each chain independently
3. **Graceful Degradation** - Missing chain data doesn't break the page
4. **Progressive Enhancement** - Chains can load individually (future feature)
5. **API Scalability** - Backend can cache/serve individual chains more efficiently
6. **Backwards Compatible** - Existing components work without changes

## Migration Status

### ✅ Completed
- [x] Type definitions for new API structure
- [x] URL builder function
- [x] Custom `useChainMetrics` hook
- [x] MetricDataContext refactor for fundamentals
- [x] Backwards compatibility for DA metrics

### ⏳ Future Work
- [ ] Migrate data-availability metrics to new structure
- [ ] Add progressive loading UI (show chains as they load)
- [ ] Error handling per chain (show partial data if some chains fail)
- [ ] Retry logic for individual failed chain requests

## Testing

To test the migration:

1. **Start dev server**: `npm run dev`
2. **Navigate to any fundamentals page**:
   - `/fundamentals/daily-active-addresses`
   - `/fundamentals/fees-paid-by-users`
   - `/fundamentals/transaction-count`
   - etc.

3. **Check Network tab**:
   - Should see multiple parallel requests to `/v1/metrics/chains/{chain}/{metric}.json`
   - Each request should complete independently

4. **Verify functionality**:
   - Charts should render correctly
   - Tables should show all chains
   - Time interval switching should work
   - Chain selection should work

## Rollback Plan

If issues arise, you can rollback by:

1. Reverting `components/metric/MetricDataContext.tsx` to use:
   ```typescript
   const { data, error, isLoading, isValidating } =
     useSWR<MetricsResponse>(MetricsURLs[metric]);
   ```

2. The old API endpoints should remain functional during transition period

## Notes

- The transformation from new to old structure happens in `useChainMetrics.ts:transformToChainData()`
- SWR handles deduplication automatically if the same chain+metric is requested multiple times
- The hook follows React Hooks rules (can't be called conditionally), so we use conditional rendering in the context instead
- Loading states aggregate: `isLoading = any chain is loading`
- Error states: first error encountered is returned (future: could collect all errors)
