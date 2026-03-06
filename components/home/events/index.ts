import arbitrumTimeboost from "./arbitrum-timeboost";
import topAppsEvent from "./top-apps";
import eip8004 from "./eip-8004";
import fusaka from "./fusaka";
import l2Activity from "./l2-activity";
import lineaBurn from "./linea-burn";

export const EVENTS_BY_ID = {
  "eip-8004": eip8004,
  "fusaka": fusaka,
  "top-apps": topAppsEvent,
  "l2-activity": l2Activity,
  "linea-burn": lineaBurn,
  "arbitrum-timeboost": arbitrumTimeboost,
} as const;

export type EventId = keyof typeof EVENTS_BY_ID;

const MAX_FEATURED_EVENTS = 6;

export const FEATURED_EVENT_IDS_MAX = (Object.keys(EVENTS_BY_ID) as EventId[]).slice(
  0,
  MAX_FEATURED_EVENTS,
);

if (process.env.NODE_ENV !== "production" && Object.keys(EVENTS_BY_ID).length > MAX_FEATURED_EVENTS) {
  console.warn(
    `[LandingEvents] EVENTS_BY_ID has more than ${MAX_FEATURED_EVENTS} items; only the first ${MAX_FEATURED_EVENTS} will be shown.`,
  );
}
