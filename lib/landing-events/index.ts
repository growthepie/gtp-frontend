import arbitrumTimeboost from "./arbitrum-timeboost";
import appCount from "./app-count";
import topAppsEvent from "./top-apps";
import eip8004 from "./eip-8004";
import fusaka from "./fusaka";
import stablecoinFiat from "./stablecoin-fiat";
import { metricItems } from "@/lib/metrics";
import { getChainMetricURL, MetricURLKeyToAPIKey } from "@/lib/urls";
import type { EventExample } from "./types";

export const EVENTS_BY_ID = {
  "eip-8004": eip8004,
  "top-apps": topAppsEvent,
  "app-count": appCount,
  "fusaka": fusaka,
  "stablecoin-fiat": stablecoinFiat,
  "ath-polygon-stablecoin": {
    allTimeHigh: {
      chainKey: "polygon_pos",
      metricKey: "stablecoin-market-cap",
    },
  },
  "arbitrum-timeboost": arbitrumTimeboost,
} as const;

export type EventId = keyof typeof EVENTS_BY_ID;

const MAX_FEATURED_EVENTS = 6;

const resolveMetricUrlKey = (metricKey: string): string | null => {
  if (MetricURLKeyToAPIKey[metricKey]) return metricKey;
  const metricItem = metricItems.find(
    (item) => item.urlKey === metricKey || item.key === metricKey,
  );
  return metricItem?.urlKey ?? null;
};

const getEventDataUrls = (event: EventExample): string[] => {
  const urls = (event.options ?? [])
    .map((opt) => opt.dataSource?.url)
    .filter((url): url is string => typeof url === "string");

  if (event.allTimeHigh) {
    const metricUrlKey = resolveMetricUrlKey(event.allTimeHigh.metricKey);
    if (metricUrlKey) {
      try {
        urls.push(getChainMetricURL(event.allTimeHigh.chainKey, metricUrlKey));
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[LandingEvents] Failed to resolve ATH metric URL:", error);
        }
      }
    }
  }

  return urls;
};

export const FEATURED_EVENT_IDS_MAX = (Object.keys(EVENTS_BY_ID) as EventId[]).slice(
  0,
  MAX_FEATURED_EVENTS,
);

/** All unique data-source URLs across every featured event, for eager prefetching. */
export const ALL_EVENT_DATA_URLS: string[] = Array.from(
  new Set(
    FEATURED_EVENT_IDS_MAX.flatMap((id) =>
      getEventDataUrls(EVENTS_BY_ID[id] as EventExample),
    ),
  ),
);

if (process.env.NODE_ENV !== "production" && Object.keys(EVENTS_BY_ID).length > MAX_FEATURED_EVENTS) {
  console.warn(
    `[LandingEvents] EVENTS_BY_ID has more than ${MAX_FEATURED_EVENTS} items; only the first ${MAX_FEATURED_EVENTS} will be shown.`,
  );
}
