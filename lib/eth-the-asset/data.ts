// ─── eth_asset/*.json ─────────────────────────────────────────────────────────
// Response types for the four EthAssetURLs. Timestamps are unix ms (UTC);
// `percent` values and `change_pct` are fractions (0.0256 = 2.56%).

export type EthAssetSource = { name: string; url: string };

export const KPI_TIMEFRAMES = ["24h", "7d", "60d", "1y", "5y"] as const;
export type KpiTimeframe = (typeof KPI_TIMEFRAMES)[number];
export type KpiKey = "eth_price" | "eth_supply" | "staking_yield" | "staked_share" | "eth_burned";

export type KpiSeries = {
  granularity: string;
  /** [bucket start unix ms, value] */
  data: [number, number][];
  /** Latest value; for eth_burned, the total within the window. */
  current: number;
  /** Change vs the start of the window (eth_burned: vs the previous window). Null when unavailable. */
  change_pct: number | null;
};

export type EthAssetKpisResponse = {
  last_updated_utc: string;
  data: {
    kpis: Record<
      KpiKey,
      { name: string; unit: string; sources: EthAssetSource[]; timeframes: Record<KpiTimeframe, KpiSeries> }
    >;
  };
};

export type LiveStat = {
  name: string;
  unit: string;
  value: number;
  /** The moment `value` refers to. */
  timestamp: number;
  per_second_increase: number;
  sources: EthAssetSource[];
};

export type EthAssetStatsResponse = {
  last_updated_utc: string;
  data: {
    total_wallets: LiveStat;
    eth_per_person: LiveStat & {
      details: {
        eth_supply: number;
        eth_supply_per_second: number;
        world_population: number;
        world_population_per_second: number;
      };
    };
  };
};

/** A live counter's value at `now`, extrapolated from its last snapshot. */
export function liveStatValue(stat: LiveStat, now: number) {
  return stat.value + ((now - stat.timestamp) / 1000) * stat.per_second_increase;
}

type ScarcityAsset = { name: string; value: number; as_of: string; method: string; sources: EthAssetSource[] };
type CollateralPart = { eth: number; usd: number; share: number };

export type EthAssetPropertiesResponse = {
  last_updated_utc: string;
  data: {
    yield_breakdown: {
      total: number;
      breakdown: { issuance: number; tips: number; mev: number };
      sources: EthAssetSource[];
    };
    scarcity: { assets: { eth: ScarcityAsset; gold: ScarcityAsset; usd: ScarcityAsset } };
    collateral: {
      as_of: string;
      total_eth: number;
      total_usd: number;
      breakdown: { lending: CollateralPart; liquid_staking: CollateralPart; dex: CollateralPart };
      sources: EthAssetSource[];
    };
    gas_paid: {
      /** [unix ms, eth, usd] per day */
      data: [number, number, number][];
      chains: { count_l1: number; count_l2: number; origin_keys: string[] };
      sources: EthAssetSource[];
    };
  };
};

export type MarketCapCategory = "crypto" | "commodity" | "equity";

export type MarketCapItem = {
  key: string;
  name: string;
  category: MarketCapCategory;
  market_cap_usd: number;
  logo: string;
  sources: EthAssetSource[];
  ticker?: string;
  country?: string;
  /** How a commodity's cap is estimated. */
  method?: string;
};

export type EthAssetMarketCapsResponse = {
  last_updated_utc: string;
  data: {
    eth: { market_cap_usd: number; logo: string; sources: EthAssetSource[] };
    /** ETH market cap as a fraction of BTC's. */
    eth_btc_ratio: { current: number; data: [number, number][]; sources: EthAssetSource[] };
    categories: Record<MarketCapCategory, MarketCapItem[]>;
  };
};

// ─── eim/eth_supply.json ──────────────────────────────────────────────────────
// Real-data helper for the "ETH the Asset" page. Reads the same endpoint already
// used by lib/quick-bites/qb-ETH-supply.ts and lib/utils/dynamicContent.ts
// (eim/eth_supply.json), so the numbers on this page always agree with the
// existing "ETH Supply & Issuance Tracker" quick-bite.

export interface EthSupplySnapshot {
  /** Latest total ETH supply. */
  totalSupply: number;
  /** Net change in supply over the last 30 days (can be negative). */
  netIssuance30d: number;
  /** Latest annualized issuance rate, as a percentage (e.g. 0.44 for 0.44%/yr). */
  annualIssuanceRatePct: number;
  /** Issuance rate as a fraction (e.g. 0.0044), for percentage-of-supply math. */
  annualIssuanceRateFraction: number;
  /** Issued ETH per week implied by the current annualized rate, for the supply bathtub. */
  weeklyIssuanceEth: number;
  /** Timestamps of the most recent daily points, for charts that need a real time axis. */
  recentTimestamps: number[];
  /** Total supply for those same daily points. */
  recentSupply: number[];
  /** Timestamps of every daily point, for the hero's supply tile (sliced to the selected timespan there). */
  allTimestamps: number[];
  /** Total supply for those same daily points. */
  allSupply: number[];
}

// Mirrors the exact formulas already used in lib/utils/dynamicContent.ts for the
// {{eth_total_supply}} / {{eth_net_issuance_30d}} / {{eth_annual_issuance_rate}}
// placeholders, so this page's numbers match the existing ETH Supply quick-bite.
export function computeEthSupplySnapshot(json: any): EthSupplySnapshot | null {
  const supplyData = json?.data?.chart?.eth_supply?.daily?.data;
  const issuanceData = json?.data?.chart?.eth_issuance_rate?.daily?.data;
  if (!Array.isArray(supplyData) || !supplyData.length || !Array.isArray(issuanceData) || !issuanceData.length) {
    return null;
  }

  const totalSupply = supplyData[supplyData.length - 1][1];
  const thirtyDaysAgoIndex = Math.max(0, supplyData.length - 31);
  const netIssuance30d = totalSupply - supplyData[thirtyDaysAgoIndex][1];
  const annualIssuanceRateFraction = issuanceData[issuanceData.length - 1][1];
  const annualIssuanceRatePct = annualIssuanceRateFraction * 100;
  const weeklyIssuanceEth = (totalSupply * annualIssuanceRateFraction) / 52;
  const recent: [number, number][] = supplyData.slice(-90);

  return {
    totalSupply,
    netIssuance30d,
    annualIssuanceRatePct,
    annualIssuanceRateFraction,
    weeklyIssuanceEth,
    recentTimestamps: recent.map((point) => point[0]),
    recentSupply: recent.map((point) => point[1]),
    allTimestamps: supplyData.map((point: [number, number]) => point[0]),
    allSupply: supplyData.map((point: [number, number]) => point[1]),
  };
}
