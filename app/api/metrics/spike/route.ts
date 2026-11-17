// Explains a single spike in a fundamentals metric (transaction count or chain
// revenue): which apps, blockspace categories (incl. unlabeled contracts / trading
// bots) and chain events drove it, plus activity, economics and market context.
//
// GET /api/metrics/spike?metric=txcount&chain=base&date=2026-06-05
// GET /api/metrics/spike?metric=fees&chain=base&date=2026-02-05
//
// The inputs (per-category blockspace files are 2–15 MB each, app detail files
// 1–4 MB) are too heavy for the browser, so we compute here and return a few KB.
// Parsed sources are memoised per instance for an hour and the response is
// CDN-cached for a day. Long term this belongs in the backend pipeline as a
// precomputed JSON — the shape below is meant to be ported 1:1.

import { NextRequest, NextResponse } from "next/server";
import { MasterURL, LabelsURLS, getChainMetricURL } from "@/lib/urls";
import {
  DAY_MS,
  baselineAt,
  isSpikeMetric,
  type MetricSpikeExplanation,
  type SpikeAppDriver,
  type SpikeCategoryDriver,
  type SpikeContract,
  type SpikeEvent,
  type SpikeMetricKey,
  type SpikeMetricMove,
  type SpikePriceMove,
} from "@/lib/spikes/metricSpikes";

const API_BASE = "https://api.growthepie.com/v1";
const MAIN_CATEGORIES = [
  "finance",
  "utility",
  "token_transfers",
  "unlabeled",
  "cross_chain",
  "collectibles",
  "social",
] as const;
const SOURCE_TTL_MS = 60 * 60 * 1000;
const MAX_APP_CANDIDATES = 6;
const MAX_DRIVER_SUBCATEGORIES = 3;
/** Ignore categories / apps contributing less than this share of the spike. */
const MIN_DRIVER_SHARE = 0.03;

/** Per spiking metric: which blockspace / app fields measure it. */
const ATTRIBUTION = {
  txcount: { blockspace: "txcount", contract: "txcount", appMetric: "txcount", appColumn: "value" },
  fees: { blockspace: "fees", contract: "fees_usd", appMetric: "gas_fees", appColumn: "usd" },
} as const satisfies Record<SpikeMetricKey, unknown>;

// --- memoised fetch ----------------------------------------------------------

const sourceCache = new Map<string, { expires: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = sourceCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load().catch((error) => {
    sourceCache.delete(key);
    throw error;
  });
  sourceCache.set(key, { expires: Date.now() + SOURCE_TTL_MS, value });
  return value;
}

async function fetchJson<T>(url: string): Promise<T> {
  // no-store: most of these files exceed the 2 MB data-cache limit anyway; the
  // in-memory cache above is what avoids refetching.
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json() as Promise<T>;
}

type DailyByDay = Map<number, number>;

const toDailyMap = (rows: number[][] | undefined, valueIndex: number): DailyByDay => {
  const map: DailyByDay = new Map();
  (rows ?? []).forEach((row) => map.set(Number(row[0]), Number(row[valueIndex]) || 0));
  return map;
};

/** Index of `column` in a `types` header, falling back to the first value column. */
const columnIndex = (types: string[] | undefined, column: string) => {
  const index = types?.indexOf(column) ?? -1;
  return index > 0 ? index : 1;
};

type CategorySource = {
  /** sub_category -> chain -> daily series, for txcount and fees (USD) */
  subDaily: Record<string, Record<string, { txcount: DailyByDay; fees: DailyByDay }>>;
  /** window -> contracts (all chains) */
  contracts: Record<string, (SpikeContract & { chain: string })[]>;
};

function loadCategory(mainCategory: string): Promise<CategorySource> {
  return cached(`category:${mainCategory}`, async () => {
    const json = await fetchJson<any>(`${API_BASE}/blockspace/category_comparison/${mainCategory}.json`);
    const main = json?.data?.[mainCategory] ?? {};
    const subDaily: CategorySource["subDaily"] = {};

    Object.entries<any>(main.subcategories ?? {}).forEach(([sub, subData]) => {
      if (sub === "list" || !subData?.daily) return;
      const types = subData.daily.types as string[] | undefined;
      const txIndex = columnIndex(types, "txcount_absolute");
      const feesIndex = columnIndex(types, "gas_fees_absolute_usd");
      subDaily[sub] = {};
      Object.entries<any>(subData.daily).forEach(([chain, rows]) => {
        if (chain === "types") return;
        subDaily[sub][chain] = { txcount: toDailyMap(rows, txIndex), fees: toDailyMap(rows, feesIndex) };
      });
    });

    const contracts: CategorySource["contracts"] = {};
    Object.entries<any>(main.aggregated ?? {}).forEach(([window, windowData]) => {
      const types: string[] = windowData?.contracts?.types ?? [];
      const idx = (key: string) => types.indexOf(key);
      contracts[window] = (windowData?.contracts?.data ?? []).map((row: any[]) => ({
        address: row[idx("address")],
        project_name: row[idx("project_name")] ?? null,
        name: row[idx("name")] ?? null,
        main_category: row[idx("main_category_key")],
        sub_category: row[idx("sub_category_key")],
        chain: row[idx("chain")],
        txcount: Number(row[idx("txcount_absolute")]) || 0,
        fees_usd: Number(row[idx("gas_fees_absolute_usd")]) || 0,
      }));
    });

    return { subDaily, contracts };
  });
}

/** chain key -> its own token symbol (null when the chain has none). */
const loadMasterChains = () =>
  cached("master", async () => {
    const master = await fetchJson<any>(MasterURL);
    const chains = new Map<string, string | null>();
    Object.entries<any>(master?.chains ?? {}).forEach(([key, chain]) => {
      const symbol = typeof chain?.symbol === "string" && chain.symbol.toUpperCase() !== "ETH" ? chain.symbol : null;
      chains.set(key, symbol);
    });
    return chains;
  });

const loadDisplayNameToOwner = () =>
  cached("projects", async () => {
    const json = await fetchJson<any>(LabelsURLS.projectsFiltered);
    const types: string[] = json?.data?.types ?? [];
    const ownerIdx = types.indexOf("owner_project");
    const nameIdx = types.indexOf("display_name");
    const map = new Map<string, string>();
    (json?.data?.data ?? []).forEach((row: any[]) => {
      map.set(row[nameIdx], row[ownerIdx]);
      map.set(row[ownerIdx], row[ownerIdx]);
    });
    return map;
  });

/** Daily chain metric; `column` picks "value" or "usd" / "eth" for currency metrics. */
const loadChainMetric = (chain: string, metricUrlKey: string, column = "value") =>
  cached(`metric:${metricUrlKey}:${column}:${chain}`, async () => {
    const json = await fetchJson<any>(getChainMetricURL(chain, metricUrlKey));
    const daily = json?.details?.timeseries?.daily;
    return toDailyMap(daily?.data, columnIndex(daily?.types, column));
  });

/**
 * ETH price = ethereum market cap in USD / in ETH (exact, same price feed) — the
 * API has no raw price series.
 */
const loadEthPrice = () =>
  cached("eth-price", async () => {
    const [usd, eth] = await Promise.all([
      loadChainMetric("ethereum", "market-cap", "usd"),
      loadChainMetric("ethereum", "market-cap", "eth"),
    ]);
    const price: DailyByDay = new Map();
    usd.forEach((value, ts) => {
      const supply = eth.get(ts);
      if (supply) price.set(ts, value / supply);
    });
    return price;
  });

const loadChainEvents = (chain: string) =>
  cached(`events:${chain}`, async () => {
    const json = await fetchJson<any>(`${API_BASE}/chains/${chain}/overview.json`);
    return (json?.data?.events ?? []) as SpikeEvent[];
  });

const loadAppDaily = (ownerProject: string, chain: string, appMetric: string, column: string) =>
  cached(`app:${ownerProject}:${appMetric}:${column}:${chain}`, async () => {
    const json = await fetchJson<any>(`${API_BASE}/apps/details/${encodeURIComponent(ownerProject)}.json`);
    const daily = json?.metrics?.[appMetric]?.over_time?.[chain]?.daily;
    return toDailyMap(daily?.data, columnIndex(daily?.types, column));
  });

// --- attribution ---------------------------------------------------------------

const contractsWindowFor = (timestamp: number) => {
  const ageDays = (Date.now() - timestamp) / DAY_MS;
  if (ageDays <= 7) return "7d";
  if (ageDays <= 30) return "30d";
  if (ageDays <= 180) return "180d";
  return "max";
};

const increaseOn = (series: DailyByDay | undefined, timestamp: number) => {
  if (!series) return { value: 0, baseline: 0, increase: 0 };
  const value = series.get(timestamp) ?? 0;
  const baseline = baselineAt(series, timestamp);
  return { value, baseline, increase: value - baseline };
};

/** Day-over-day move of a context metric (null when it has no data that day). */
const moveOn = (series: DailyByDay | undefined, timestamp: number): SpikeMetricMove | null => {
  if (!series || !series.has(timestamp)) return null;
  const { value, baseline } = increaseOn(series, timestamp);
  return { value, baseline, change: baseline > 0 ? value / baseline - 1 : null };
};

/** Price move on the spike day plus the biggest daily move in the 3 days up to it. */
function priceMove(series: DailyByDay | undefined, timestamp: number): Omit<SpikePriceMove, "symbol"> | null {
  if (!series) return null;
  const pctOn = (ts: number) => {
    const value = series.get(ts);
    const previous = series.get(ts - DAY_MS);
    return value && previous ? value / previous - 1 : null;
  };
  const change = pctOn(timestamp);
  if (change === null) return null;
  const recent = [timestamp - 2 * DAY_MS, timestamp - DAY_MS, timestamp]
    .map(pctOn)
    .filter((v): v is number => v !== null);
  const largestRecentMove = recent.reduce((max, v) => (Math.abs(v) > Math.abs(max) ? v : max), 0);
  return { value: series.get(timestamp) ?? null, change, largestRecentMove };
}

const optional = <T,>(promise: Promise<T>) => promise.catch(() => undefined);

async function explainSpike(
  metric: SpikeMetricKey,
  chain: string,
  tokenSymbol: string | null,
  date: string,
): Promise<MetricSpikeExplanation> {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  const attribution = ATTRIBUTION[metric];

  const [
    txcountSeries,
    revenueSeries,
    revenueEthSeries,
    addressSeries,
    throughputSeries,
    txCostSeries,
    rentPaidSeries,
    profitSeries,
    ethPrice,
    tokenFdv,
    events,
    categorySources,
    displayNameToOwner,
  ] = await Promise.all([
    metric === "txcount" ? loadChainMetric(chain, "transaction-count") : optional(loadChainMetric(chain, "transaction-count")),
    metric === "fees"
      ? loadChainMetric(chain, "fees-paid-by-users", "usd")
      : optional(loadChainMetric(chain, "fees-paid-by-users", "usd")),
    optional(loadChainMetric(chain, "fees-paid-by-users", "eth")),
    optional(loadChainMetric(chain, "daily-active-addresses")),
    optional(loadChainMetric(chain, "throughput")),
    optional(loadChainMetric(chain, "transaction-costs", "usd")),
    optional(loadChainMetric(chain, "rent-paid", "usd")),
    optional(loadChainMetric(chain, "profit", "usd")),
    optional(loadEthPrice()),
    // A chain token's day-over-day price change = its FDV change (max supply is fixed).
    tokenSymbol ? optional(loadChainMetric(chain, "fully-diluted-valuation", "usd")) : Promise.resolve(undefined),
    loadChainEvents(chain).catch(() => [] as SpikeEvent[]),
    Promise.all(MAIN_CATEGORIES.map((c) => loadCategory(c).then((src) => [c, src] as const).catch(() => null))),
    loadDisplayNameToOwner().catch(() => new Map<string, string>()),
  ]);

  const totalSeries = metric === "txcount" ? txcountSeries : revenueSeries;
  const total = increaseOn(totalSeries, timestamp);
  const minDriver = Math.max(total.increase, 0) * MIN_DRIVER_SHARE;

  // 1) Blockspace: which sub-categories moved the most on that day.
  const categories: SpikeCategoryDriver[] = [];
  categorySources.forEach((entry) => {
    if (!entry) return;
    const [mainCategory, source] = entry;
    Object.entries(source.subDaily).forEach(([sub, byChain]) => {
      const { increase } = increaseOn(byChain[chain]?.[attribution.blockspace], timestamp);
      if (increase > minDriver) {
        categories.push({ main_category: mainCategory, sub_category: sub, increase });
      }
    });
  });
  categories.sort((a, b) => b.increase - a.increase);
  const driverSubs = new Set(categories.slice(0, MAX_DRIVER_SUBCATEGORIES).map((c) => c.sub_category));

  // 2) Top contracts in the driving sub-categories (closest aggregation window).
  const contractsWindow = contractsWindowFor(timestamp);
  const contractWeight = (c: SpikeContract) => c[attribution.contract];
  const driverContracts = categorySources
    .flatMap((entry) => entry?.[1].contracts[contractsWindow] ?? [])
    .filter((c) => c.chain === chain && driverSubs.has(c.sub_category))
    .sort((a, b) => contractWeight(b) - contractWeight(a));

  // 3) Apps: candidates = owners of those contracts, verified against their own daily series.
  const candidateWeight = new Map<string, number>();
  driverContracts.forEach((c) => {
    const owner = c.project_name ? displayNameToOwner.get(c.project_name) : undefined;
    if (owner) candidateWeight.set(owner, (candidateWeight.get(owner) ?? 0) + contractWeight(c));
  });
  // Native ETH transfers are tracked as the "eth" app on growthepie.
  if (driverSubs.has("native_transfer")) candidateWeight.set("eth", Number.MAX_SAFE_INTEGER);

  const candidates = Array.from(candidateWeight.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_APP_CANDIDATES)
    .map(([owner]) => owner);

  const apps: SpikeAppDriver[] = (
    await Promise.all(
      candidates.map(async (owner) => {
        try {
          const series = await loadAppDaily(owner, chain, attribution.appMetric, attribution.appColumn);
          return { owner_project: owner, ...increaseOn(series, timestamp) };
        } catch {
          return null;
        }
      }),
    )
  )
    .filter((a): a is SpikeAppDriver => Boolean(a && a.increase > minDriver))
    .sort((a, b) => b.increase - a.increase);

  const unownedContracts = driverContracts
    .filter((c) => !c.project_name)
    .slice(0, 5)
    .map(({ chain: _chain, ...contract }) => contract);

  const eventsNearSpike = events.filter((event) => {
    const eventTs = Date.parse(`${event.date}T00:00:00Z`);
    return eventTs >= timestamp - 7 * DAY_MS && eventTs <= timestamp + DAY_MS;
  });

  // Did the number of users move with the transactions? Tx growth with flat
  // addresses = the same wallets transacting more (bots / automation).
  const addressMove = addressSeries ? increaseOn(addressSeries, timestamp) : null;
  const txOnDay = txcountSeries ? increaseOn(txcountSeries, timestamp) : null;
  const activeAddresses =
    addressMove && addressMove.baseline > 0 && txOnDay
      ? {
          ...addressMove,
          txPerAddress: addressMove.value > 0 ? txOnDay.value / addressMove.value : null,
          txPerAddressBaseline: txOnDay.baseline / addressMove.baseline,
        }
      : null;

  const ethMove = priceMove(ethPrice, timestamp);
  const tokenMove = tokenFdv ? priceMove(tokenFdv, timestamp) : null;

  return {
    metric,
    chain,
    date,
    ...total,
    activeAddresses,
    prices: {
      eth: ethMove ? { symbol: "ETH", ...ethMove } : null,
      // Only the % change is meaningful for the token (the series is FDV, not price).
      token: tokenMove && tokenSymbol ? { symbol: tokenSymbol, ...tokenMove, value: null } : null,
    },
    activity: {
      txcount: moveOn(txcountSeries, timestamp),
      throughput: moveOn(throughputSeries, timestamp),
      txCost: moveOn(txCostSeries, timestamp),
    },
    economics: {
      revenue: moveOn(revenueSeries, timestamp),
      revenueEth: moveOn(revenueEthSeries, timestamp),
      rentPaid: moveOn(rentPaidSeries, timestamp),
      profit: moveOn(profitSeries, timestamp),
    },
    events: eventsNearSpike.map((e) => ({
      date: e.date,
      type: e.type,
      title: e.title,
      description: e.description,
      source: e.source ?? null,
    })),
    categories: categories.slice(0, 6),
    apps,
    unownedContracts,
    contractsWindow,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const metric = searchParams.get("metric") ?? "txcount";
  const chain = searchParams.get("chain") ?? "";
  const date = searchParams.get("date") ?? "";

  if (
    !isSpikeMetric(metric) ||
    !/^[a-z0-9_]{1,40}$/.test(chain) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date))
  ) {
    return NextResponse.json({ error: "Invalid metric, chain or date" }, { status: 400 });
  }

  try {
    const chains = await loadMasterChains();
    if (!chains.has(chain)) {
      return NextResponse.json({ error: "Unknown chain" }, { status: 404 });
    }

    const explanation = await explainSpike(metric, chain, chains.get(chain) ?? null, date);
    return NextResponse.json(explanation, {
      headers: {
        // Browsers always revalidate (otherwise stale-while-revalidate lets them
        // serve an old shape for a week); only the CDN holds it long.
        "Cache-Control": "public, max-age=0, must-revalidate",
        "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("[metric-spike]", error);
    return NextResponse.json({ error: "Failed to explain spike" }, { status: 502 });
  }
}
