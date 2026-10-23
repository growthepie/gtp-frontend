// Browse topics for Quick Bites: the chips on /quick-bites and the pages at
// /quick-bites/topic/<key>. "Trackers" and "Reports" collect Quick Bites by `kind`;
// the others by the `themes` each Quick Bite lists in its own file.
import QUICK_BITES_DATA from "@/lib/quick-bites/index";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { QuickBiteData, QuickBiteThemeKey, QuickBiteWithSlug } from "@/lib/types/quickBites";

export type QuickBiteTopicKey = "trackers" | "reports" | QuickBiteThemeKey;

export interface QuickBiteTopic {
  key: QuickBiteTopicKey;
  label: string;
  /** Shorter label for the topic tab bar on /quick-bites (defaults to `label`). */
  shortLabel?: string;
  icon: GTPIconName;
  /** Intro on the topic page; also its meta description. */
  description: string;
  includes: (quickBite: QuickBiteData) => boolean;
}

const hasTheme = (theme: QuickBiteThemeKey) => (quickBite: QuickBiteData) =>
  quickBite.themes?.includes(theme) ?? false;

/** In display order (after "All"). */
export const QUICK_BITE_TOPICS: QuickBiteTopic[] = [
  {
    key: "trackers",
    label: "Trackers",
    icon: "gtp-realtime",
    description:
      "Live dashboards to come back to: token supply and burns, stablecoin supply by chain, issuer and currency, and tokenized stocks.",
    includes: (quickBite) => quickBite.kind === "tracker",
  },
  {
    key: "reports",
    label: "Reports",
    icon: "gtp-calendar-clean",
    description: "Quarterly and anniversary reports on Ethereum Mainnet and its Layer 2s.",
    includes: (quickBite) => quickBite.kind === "report",
  },
  {
    key: "stablecoins",
    label: "Stablecoins & Payments",
    shortLabel: "Stablecoins",
    icon: "gtp-metrics-stablecoinmarketcap",
    description:
      "How much stablecoin supply sits on Ethereum and its Layer 2s, who issues it, which currencies it tracks, and how it's used for payments.",
    includes: hasTheme("stablecoins"),
  },
  {
    key: "scaling",
    label: "Scaling & Upgrades",
    shortLabel: "Scaling",
    icon: "gtp-ecosystem-scaling",
    description: "Ethereum's protocol upgrades and how it scales: Pectra, Fusaka, blob capacity, data availability and throughput.",
    includes: hasTheme("scaling"),
  },
  {
    key: "token-economics",
    label: "Token Economics",
    icon: "gtp-tokeneth",
    description: "Supply, issuance, burns and revenue: how ETH and Layer 2 tokens are created and destroyed.",
    includes: hasTheme("token-economics"),
  },
  {
    key: "activity",
    label: "Usage & Activity",
    shortLabel: "Activity",
    icon: "gtp-metrics-activity",
    description: "Who uses Ethereum and its Layer 2s, how much, and what it costs them.",
    includes: hasTheme("activity"),
  },
  {
    key: "real-world",
    label: "Real-World Use Cases",
    shortLabel: "Real World",
    icon: "gtp-tokentransfers",
    description: "Tokenized stocks, commerce payments and other real-world uses of Ethereum.",
    includes: hasTheme("real-world"),
  },
  {
    key: "developers-ai",
    label: "Developers & AI",
    icon: "gtp-book-open",
    description: "Smart contract languages and compilers, and AI agents onchain.",
    includes: hasTheme("developers-ai"),
  },
];

export const getQuickBiteTopic = (key: string) => QUICK_BITE_TOPICS.find((topic) => topic.key === key);

export const getQuickBiteTopicUrl = (key: QuickBiteTopicKey) => `/quick-bites/topic/${key}`;

/** Published Quick Bites (showInMenu !== false), newest first. */
export const getListedQuickBites = (): QuickBiteWithSlug[] =>
  Object.entries(QUICK_BITES_DATA)
    .map(([slug, data]) => ({ ...data, slug }))
    .filter((quickBite) => quickBite.showInMenu !== false && quickBite.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getQuickBitesForTopic = (key: QuickBiteTopicKey): QuickBiteWithSlug[] => {
  const topic = getQuickBiteTopic(key);
  return topic ? getListedQuickBites().filter((quickBite) => topic.includes(quickBite)) : [];
};

/** The topics a Quick Bite appears under (for "More on …" links). */
export const getTopicsForQuickBite = (quickBite: QuickBiteData): QuickBiteTopic[] =>
  QUICK_BITE_TOPICS.filter((topic) => topic.includes(quickBite));
