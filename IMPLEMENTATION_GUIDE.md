# API Migration Implementation Guide

## Overview
This guide documents how we migrated from a single monolithic metrics API endpoint to per-chain endpoints, including implementation decisions, potential improvements, and lessons learned.

---

## Implementation Steps

### Step 1: Create Type Definitions
**File:** `types/api/ChainMetricResponse.d.ts`

Created a new TypeScript interface matching the new API structure:
- `ChainMetricResponse` - Top-level response
- `MetricDetails` - Contains timeseries, changes, and summary
- `Timeseries`, `Changes`, `Summary` - Nested data structures

**Why:** Type safety ensures we correctly handle the new API structure and catch errors at compile time.

---

### Step 2: Create URL Mapping and Builder
**File:** `lib/urls.ts`

Added:
1. `MetricURLKeyToAPIKey` - Maps frontend URL keys to API metric IDs
   ```typescript
   "daily-active-addresses" → "daa"
   "transaction-count" → "txcount"
   ```

2. `getChainMetricURL()` - Builds per-chain URLs
   ```typescript
   getChainMetricURL("arbitrum", "daily-active-addresses")
   // Returns: .../metrics/chains/arbitrum/daa.json
   ```

**Why:** Centralized URL management makes it easy to update endpoints and maintains consistency.

---

### Step 3: Create Custom Hook
**File:** `hooks/useChainMetrics.ts`

**Key Features:**
1. **Parallel Fetching** - Creates multiple SWR hooks (one per chain)
2. **Error Handling** - Silences expected 404/403 errors
3. **Data Aggregation** - Combines responses into old structure
4. **Data Transformation** - Converts new API format to existing `ChainData` format

**Implementation Pattern:**
```typescript
// Multiple SWR hooks in parallel
const chainResponses = chainKeys.map((chainKey) => {
  return useSWR<ChainMetricResponse>(getChainMetricURL(chainKey, metric), {
    onError: (error) => { /* Silence expected errors */ },
    shouldRetryOnError: (error) => { /* Don't retry 404/403 */ }
  });
});

// Aggregate results
const aggregatedData = useMemo(() => {
  // Filter successful responses
  // Transform to old structure
  // Return combined data
}, [chainResponses]);
```

**Why:**
- SWR automatically handles caching, deduplication, and revalidation
- Multiple hooks enable parallel requests
- Data transformation maintains backwards compatibility

---

### Step 4: Update MetricDataContext
**File:** `components/metric/MetricDataContext.tsx`

**Changes:**
1. Replaced single `useSWR<MetricsResponse>` with `useChainMetrics` hook
2. Added conditional logic for fundamentals vs DA metrics
3. Maintained same context API for consuming components

**Critical Decision:**
We kept the MetricDataContext returning `null` when data isn't loaded (original pattern), but moved data fetching to the page level to leverage SWR cache.

**Why:** Zero breaking changes for consuming components (charts, tables, controls).

---

### Step 5: Update Page-Level Data Fetching
**File:** `app/(layout)/fundamentals/[metric]/page.tsx`

**Changes:**
1. Added `useChainMetrics` call at page level
2. Updated `ShowLoading` to track both master and metric data
3. Conditional render only when both datasets are ready

**Critical Pattern:**
```typescript
// Fetch at page level (establishes SWR cache)
const { data: metricData, isLoading } = useChainMetrics(metric, chainsToFetch);

// Context reuses same hook with same params → instant cache hit
<MetricDataProvider metric={metric} ... />
```

**Why:** SWR cache ensures MetricDataContext gets instant data without refetching.

---

### Step 6: Error Console Suppression
**File:** `app/providers.tsx`

Added global `onError` handler to SWRConfig:
```typescript
onError: (error, key) => {
  if (key.includes('/metrics/chains/')) {
    // Silence JSON parse errors from 403/404
    // Silence CORS/fetch failures
    return;
  }
}
```

**Why:** Clean console output - only show actual errors, not expected missing data.

---

### Step 7: Update Types for Weekly Data
**File:** `types/api/MetricsResponse.d.ts`

Added optional `weekly` property to `ChainData`:
```typescript
weekly?: {
  types: string[];
  data: number[][];
}
```

**Why:** Some metrics have weekly data, making it required would break existing code.

---

## Architecture Decisions

### ✅ What Worked Well

1. **Backwards Compatibility**
   - Transformed new API structure to match old structure
   - Zero changes required in consuming components
   - Easy rollback if needed

2. **SWR Cache Leverage**
   - Page-level fetching establishes cache
   - Context-level access reads from cache
   - No duplicate requests

3. **Graceful Error Handling**
   - 404/403 errors silently excluded
   - Pages work with partial data
   - Critical errors still reported

4. **Parallel Loading**
   - All chains fetch simultaneously
   - Faster overall load times
   - Better user experience

---

## Potential Improvements

### 🎯 Performance Optimizations

1. **Request Batching**
   ```typescript
   // Current: 20 individual requests
   GET /chains/arbitrum/daa.json
   GET /chains/optimism/daa.json
   // ... 18 more

   // Better: Single batched request
   POST /chains/batch
   { chains: ['arbitrum', 'optimism', ...], metric: 'daa' }
   ```
   **Trade-off:** Requires backend changes, loses individual caching

2. **Progressive Loading**
   ```typescript
   // Show chains as they load (don't wait for all)
   if (successfulResponses.length > 0) {
     return partialData; // Show what we have
   }
   ```
   **Trade-off:** More complex UI states, potential layout shifts

3. **Request Prioritization**
   ```typescript
   // Load popular chains first
   const priorityChains = ['arbitrum', 'optimism', 'base'];
   const otherChains = [...];
   ```
   **Trade-off:** Added complexity, marginal gains

---

### 🔧 Code Quality Improvements

1. **Type Safety for Error Objects**
   ```typescript
   // Current: Loose error checking
   const status = error?.status || error?.response?.status;

   // Better: Type guard
   function isHttpError(error: unknown): error is { status: number } {
     return typeof error === 'object' && error !== null && 'status' in error;
   }
   ```

2. **Separate Hook for DA Metrics**
   ```typescript
   // Current: Mixed logic in useChainMetrics
   // Better: useDAMetrics hook for DA-specific logic
   export function useDAMetrics(metric: string, daLayers: string[]) { ... }
   ```

3. **Loading State Granularity**
   ```typescript
   // Current: Binary loading state
   isLoading: boolean

   // Better: Track individual chains
   loadingStates: {
     arbitrum: 'loading' | 'success' | 'error',
     optimism: 'loading' | 'success' | 'error',
     ...
   }
   ```

---

### 🎨 User Experience Enhancements

1. **Skeleton Loading**
   ```typescript
   // Show skeleton for each chain while loading
   {chainKeys.map(chain => (
     isLoading ? <ChainSkeleton /> : <ChainData data={...} />
   ))}
   ```

2. **Retry UI for Failed Chains**
   ```typescript
   // Allow manual retry for chains that failed
   {failedChains.map(chain => (
     <ErrorState onRetry={() => refetch(chain)} />
   ))}
   ```

3. **Loading Progress Indicator**
   ```typescript
   // Show "Loading 15/20 chains..."
   const progress = successfulResponses.length / totalChains;
   ```

---

### 🔍 Observability Improvements

1. **Performance Metrics**
   ```typescript
   // Track load times per chain
   const loadTimes = new Map<string, number>();
   performance.mark(`chain-${chain}-start`);
   // ... after load
   performance.measure(`chain-${chain}`, `chain-${chain}-start`);
   ```

2. **Error Tracking**
   ```typescript
   // Send 404/403 stats to analytics
   if (status === 404) {
     analytics.track('chain_metric_unavailable', { chain, metric });
   }
   ```

3. **Cache Hit Rate**
   ```typescript
   // Monitor SWR cache effectiveness
   const cacheHits = chainResponses.filter(r => !r.isValidating).length;
   ```

---

### 🏗️ Architecture Alternatives

#### Alternative 1: Server-Side Aggregation
**Current:** Client fetches and aggregates
**Alternative:** Backend provides aggregation endpoint
```typescript
GET /metrics/daa/aggregate?chains=arbitrum,optimism,base
```
**Pros:**
- Single request
- Less client-side logic
- Easier error handling

**Cons:**
- Requires backend changes
- Less flexible client-side caching
- Can't show partial results

---

#### Alternative 2: WebSocket/Server-Sent Events
**Current:** HTTP requests with SWR polling
**Alternative:** Real-time updates via WebSocket
```typescript
const ws = useWebSocket('/metrics/daa/stream');
ws.on('chain_update', (chain, data) => {
  updateChainData(chain, data);
});
```
**Pros:**
- Real-time updates
- Reduced bandwidth
- Better UX for live data

**Cons:**
- Complex infrastructure
- Connection management overhead
- Overkill for static historical data

---

#### Alternative 3: GraphQL Federation
**Current:** REST endpoints
**Alternative:** GraphQL with field-level caching
```graphql
query GetMetric($metric: String!, $chains: [String!]!) {
  metric(id: $metric) {
    chains(keys: $chains) {
      key
      timeseries { ... }
      changes { ... }
    }
  }
}
```
**Pros:**
- Flexible querying
- Automatic field-level caching
- Reduced over-fetching

**Cons:**
- Major backend rewrite
- Steeper learning curve
- More complex caching logic

---

## Testing Strategy

### Manual Testing Checklist
- [ ] All fundamentals pages load correctly
- [ ] Charts render with correct data
- [ ] Tables show all available chains
- [ ] Missing chain data doesn't break UI
- [ ] Loading states show appropriately
- [ ] No console errors (except browser network logs)
- [ ] Page navigation maintains cached data
- [ ] Browser refresh reloads data correctly

### Automated Testing (Recommended)
```typescript
// Test hook aggregation
describe('useChainMetrics', () => {
  it('aggregates multiple chain responses', () => { ... });
  it('handles 404 errors gracefully', () => { ... });
  it('returns undefined when all chains fail', () => { ... });
});

// Test data transformation
describe('transformToChainData', () => {
  it('converts new structure to old format', () => { ... });
  it('handles missing weekly data', () => { ... });
});
```

---

## Rollback Procedure

If issues arise in production:

### Immediate Rollback (5 minutes)
1. Revert `components/metric/MetricDataContext.tsx`:
   ```typescript
   const { data } = useSWR<MetricsResponse>(MetricsURLs[metric]);
   ```

2. Revert `app/(layout)/fundamentals/[metric]/page.tsx`:
   ```typescript
   const { data: metricData } = useSWR<MetricsResponse>(MetricsURLs[metric]);
   ```

3. Deploy

### Verify Old Endpoints Still Work
```bash
curl https://api.growthepie.com/v1/metrics/daa.json
# Should return all chains aggregated
```

---

## Future Considerations

### Gradual Migration Path
1. **Phase 1** (Current): Fundamentals metrics only
2. **Phase 2**: Data availability metrics
3. **Phase 3**: Economics metrics
4. **Phase 4**: Blockspace metrics
5. **Phase 5**: Deprecate old endpoints

### API Versioning
```typescript
// Support both v1 (old) and v2 (new) simultaneously
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v2';

if (API_VERSION === 'v1') {
  useSWR<MetricsResponse>(oldUrl);
} else {
  useChainMetrics(metric, chains);
}
```

### Feature Flags
```typescript
const USE_NEW_API = useFeatureFlag('new-metrics-api');

if (USE_NEW_API) {
  return useChainMetrics(metric, chains);
} else {
  return useSWR<MetricsResponse>(MetricsURLs[metric]);
}
```

---

## Lessons Learned

### ✅ What Went Right
1. **Type-first approach** - Caught many bugs at compile time
2. **Backwards compatibility** - No component rewrites needed
3. **SWR cache utilization** - Elegant solution to double-fetching
4. **Incremental migration** - Can rollback easily

### ⚠️ Challenges Faced
1. **Error handling complexity** - Many edge cases (404, 403, CORS, JSON parse)
2. **Console noise** - Browser logs can't be suppressed programmatically
3. **Loading state timing** - Had to carefully sequence data fetching
4. **Type gymnastics** - Maintaining old structure while using new types

### 🎓 Key Takeaways
1. **Leverage existing tools** - SWR cache solved many problems
2. **Backwards compatibility is worth it** - Saved weeks of component updates
3. **Error states matter** - Graceful degradation is crucial
4. **Test with real data** - Mock data hides edge cases (missing chains, 403s)

---

## Conclusion

This migration successfully moved from a monolithic API to per-chain endpoints while maintaining full backwards compatibility. The implementation leverages SWR's caching effectively, handles errors gracefully, and provides a solid foundation for future improvements.

The key insight was recognizing that we could transform new API responses to match the old structure, eliminating the need for widespread component changes. Combined with page-level fetching and context-level cache access, we achieved a clean separation of concerns.

While there are opportunities for further optimization (batching, progressive loading, better types), the current implementation strikes a good balance between complexity and functionality, making it a solid foundation for the next phase of API evolution.
