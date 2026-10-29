// ─── eth_asset/*.json ─────────────────────────────────────────────────────────
// Response types for the eth_asset sections. They now arrive in the two EthAssetURLs
// bundles (read with useEthAssetSection), each in the shape of the single file it came
// from: { last_updated_utc, data }. Timestamps are unix ms (UTC);
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

export type YieldComparisonAsset = {
  key: string;
  name: string;
  /** Yearly yield as a fraction. */
  value: number;
  /** Date of the figure ("2026-10-16", or "2026-09" for monthly data); null for assets that pay nothing. */
  as_of: string | null;
  method: string;
  sources: EthAssetSource[];
};

// Stake / lend / borrow figures. Every rate and share is a fraction (0.0255 = 2.55%).
export type ProductiveMarket = { name: string; chain: string; url: string };

export type ProductiveUses = {
  /** ETH price for the "what it earns you" calculator. */
  price_usd: number;
  stake: {
    apr: number;
    apr_breakdown: { issuance: number; tips: number; mev: number };
    total_staked_eth: number;
    share_of_supply: number;
    /** The validator and queue figures can be null: hide their tiles then. */
    active_validators: number | null;
    /** Time until a new exit request would exit. */
    exit_queue: { days: number | null; eth: number | null; validators: number | null } | null;
    entry_queue: { days: number | null; eth: number | null } | null;
    sources: EthAssetSource[];
  };
  lend: {
    /** Supply APR. */
    apr: number;
    apr_breakdown: { borrower_interest: number };
    utilisation: number;
    /** The largest market. */
    market: ProductiveMarket;
    /** ETH supplied across all lending markets. */
    lending_supplied_eth: number;
    borrow_apr?: number;
    reserve_factor?: number;
    market_available_liquidity_eth?: number;
    sources: EthAssetSource[];
  };
  borrow: {
    /** Stablecoin borrow APR: the USDC/USDT average. */
    apr: number;
    apr_breakdown: { base_rate: number; utilisation: number; above_kink_premium: number };
    max_ltv: number;
    liquidation_threshold: number;
    eth_collateral_usd: number;
    eth_collateral_eth: number;
    market: ProductiveMarket;
    stablecoins: Record<string, { borrow_apr: number }>;
    sources: EthAssetSource[];
  };
};

export type EthAssetProductiveAssetResponse = {
  last_updated_utc: string;
  data: {
    productive_uses?: ProductiveUses;
    yield_comparison: { name: string; unit: string; assets: YieldComparisonAsset[] };
  };
};

export type PurchasingPowerItem = {
  key: string;
  name: string;
  /** The unit counted, e.g. "500 g loaf". */
  unit: string;
  /** The unit the source prices in, before conversion to `unit`. */
  source_unit: string;
  units_per_eth: number;
  units_per_eth_year_ago: number;
  /** units_per_eth vs a year ago, as a fraction. */
  change_pct: number;
  /** The change in units split by cause: the ETH price moving, and the shop price moving. They sum to the total change. */
  change_units: { eth_price: number; shop_price: number };
  /** Price of one `unit` in the region's currency. */
  price: number;
  price_year_ago: number;
  price_as_of: string;
  sources: EthAssetSource[];
};

export type PurchasingPowerRegion = {
  name: string;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  eth_price: number;
  eth_price_year_ago: number;
  items: PurchasingPowerItem[];
};

export type EthAssetPurchasingPowerResponse = {
  last_updated_utc: string;
  data: {
    year_ago_date: string;
    regions: Record<string, PurchasingPowerRegion>;
    eth_price_sources: EthAssetSource[];
  };
};

/** A bundle: each section's data under data.<section>, and when each was last updated. */
export type EthAssetBundle<Sections> = {
  last_updated_utc: string;
  sections_last_updated_utc: Partial<Record<keyof Sections, string>>;
  data: Partial<Sections>;
};

/** Sections of live.json (hourly). */
export type EthAssetLiveSections = {
  kpis: EthAssetKpisResponse["data"];
  stats: EthAssetStatsResponse["data"];
  properties: EthAssetPropertiesResponse["data"];
  productive_asset: EthAssetProductiveAssetResponse["data"];
};

export type SupplyFlowScenario = {
  key: string;
  name: string;
  /** The real week the burn is taken from (UTC dates, inclusive). */
  period: { start: string; end: string };
  /** Today's issuance in every scenario; last_week uses that week's actual issuance. */
  issued_per_week: number;
  burned_per_week: number;
  net_per_week: number;
  /** Fraction of supply a year. */
  net_annual_pct: number;
  burned_share_of_issuance: number;
  /**
   * 0–1: where the week's burn sits between the quiet week (0) and the highest weekly
   * burn (1), on a log scale: (ln burn − ln quiet) / (ln max − ln quiet).
   */
  demand_level: number;
  description: string;
  /** last_week only: [unix ms, issued, burned, supply at end of day] per day. */
  daily?: { types: string[]; data: [number, number, number, number][] };
};

export type SupplyFlow = {
  supply: { value: number; as_of: string };
  /** Weekly burn that exactly cancels today's issuance. */
  break_even_burn_per_week: number;
  break_even_demand_level: number;
  scenarios: SupplyFlowScenario[];
  sources: EthAssetSource[];
};

/** One daily "Today in ETH" card: a metric, picked and written up automatically. */
export type TodayCard = {
  /** The day the card was written (YYYY-MM-DD); cards come newest first. */
  date: string;
  /** The day the data is from, already formatted ("Oct 19, 2026"). */
  data_date: string;
  candidate_id: string;
  metric: string;
  unit: string;
  value: number;
  value_formatted: string;
  headline: string;
  sentence: string;
  /** Empty for milestone cards (e.g. lifetime totals). */
  sparkline: { types: string[]; data: [number, number][] };
  /** The model that wrote the headline and sentence. */
  model: string;
  sources: EthAssetSource[];
};

/** Sections of daily.json (daily). */
export type EthAssetDailySections = {
  purchasing_power: EthAssetPurchasingPowerResponse["data"];
  market_caps: EthAssetMarketCapsResponse["data"];
  supply_flow: SupplyFlow;
  today: { cards: TodayCard[] };
};
