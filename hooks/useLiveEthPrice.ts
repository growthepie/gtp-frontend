import { useCallback, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

const ETH_PRICE_SSE_URL = "https://sse.growthepie.com/events/eth-price";

/**
 * Live ETH/USD from growthepie's price stream: an "initial" message, then an "update"
 * about every 2s. A price flagged stale, or off from the stream's own cross-check,
 * doesn't count, and neither does one from a dropped connection: callers then fall
 * back to kpis.json's hourly price. Paused while the tab is hidden (useSSE).
 */
export function useLiveEthPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const onMessage = useCallback((event: MessageEvent) => {
    try {
      const d = JSON.parse(event.data)?.data;
      const ok = d && Number.isFinite(d.price) && d.price > 0 && !d.stale && !d.deviation_warning;
      setPrice(ok ? d.price : null);
    } catch {
      // Ignore a malformed message; the next one comes in ~2s.
    }
  }, []);
  const onError = useCallback(() => setPrice(null), []);
  useSSE(ETH_PRICE_SSE_URL, { onMessage, onError });
  return price;
}

/**
 * An hourly price series brought up to the live price: the last point becomes the live
 * price, and the change (in %) is re-measured from the same starting value. Without a
 * live price, or without a series to adjust, the series comes back unchanged.
 */
export function withLivePrice<S extends { values: number[]; current?: number; change: number | null }>(
  series: S,
  livePrice: number | null,
): S {
  if (livePrice === null || series.values.length === 0) return series;
  const values = [...series.values.slice(0, -1), livePrice];
  // The change is current vs some starting value; recover that value and measure the
  // live price against it, so the badge and the number never disagree.
  const start =
    series.change !== null && series.current !== undefined && series.change !== -100
      ? series.current / (1 + series.change / 100)
      : null;
  const change = start ? (livePrice / start - 1) * 100 : series.change;
  return { ...series, values, current: livePrice, change };
}
