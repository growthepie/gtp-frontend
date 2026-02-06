import { Type } from "@google/genai";
import { InsightTool } from "./types";

const BASE_URL = "https://api.growthepie.com/v1";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

// ---------------------------------------------------------------------------
// Tool-level cache
// ---------------------------------------------------------------------------

const toolCache = new Map<string, { data: unknown; timestamp: number }>();

const TOOL_CACHE_TTL: Record<string, number> = {
  get_landing_summary: 5 * 60 * 1000,
  get_chain_overview: 30 * 60 * 1000,
  get_economics_data: 15 * 60 * 1000,
  get_blockspace_breakdown: 15 * 60 * 1000,
  get_metric_comparison: 10 * 60 * 1000,
  get_top_apps: 10 * 60 * 1000,
  get_da_metrics: 15 * 60 * 1000,
  get_fees_table: 5 * 60 * 1000,
  get_chain_timeseries: 5 * 60 * 1000,
};

function getCacheKey(toolName: string, args: Record<string, unknown>): string {
  const sortedArgs = Object.keys(args)
    .sort()
    .map((k) => `${k}=${args[k]}`)
    .join("&");
  return `${toolName}:${sortedArgs}`;
}

function getCached(toolName: string, args: Record<string, unknown>): unknown | null {
  const key = getCacheKey(toolName, args);
  const entry = toolCache.get(key);
  if (!entry) return null;
  const ttl = TOOL_CACHE_TTL[toolName] ?? 5 * 60 * 1000;
  if (Date.now() - entry.timestamp > ttl) {
    toolCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(toolName: string, args: Record<string, unknown>, data: unknown): void {
  const key = getCacheKey(toolName, args);
  toolCache.set(key, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchJSON(
  url: string,
  retries = MAX_RETRIES,
): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      return res.json();
    } catch (e) {
      const isLast = attempt === retries;
      if (isLast) throw e;
      // Wait briefly before retrying (200ms, then 600ms)
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  // Unreachable, but satisfies TS
  throw new Error(`Failed to fetch ${url}`);
}

/** Structured error response that helps the model recover */
function toolError(
  message: string,
  suggestion?: string,
): Record<string, unknown> {
  return {
    error: message,
    suggestion: suggestion ?? "Try a different parameter or tool",
    partial_data: null,
  };
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

// --- get_chain_timeseries ---

export const getChainTimeseries: InsightTool = {
  declaration: {
    name: "get_chain_timeseries",
    description:
      "Fetch daily timeseries data for a specific metric on a specific chain. Returns the last 30 data points.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chain: {
          type: Type.STRING,
          description:
            "The chain key, e.g. 'ethereum', 'arbitrum', 'base', 'optimism'.",
        },
        metric: {
          type: Type.STRING,
          description: "The metric to fetch.",
          enum: [
            "txcount",
            "daa",
            "fees_paid_eth",
            "fees_paid_usd",
            "tvl",
            "stables_mcap",
            "txcosts_median_eth",
            "txcosts_median_usd",
            "throughput_mgas",
            "rent_paid_eth",
            "rent_paid_usd",
            "profit_eth",
          ],
        },
      },
      required: ["chain", "metric"],
    },
  },
  execute: async (args) => {
    const cached = getCached("get_chain_timeseries", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { chain, metric } = args as { chain: string; metric: string };
      const raw = (await fetchJSON(
        `${BASE_URL}/metrics/chains/${chain}/${metric}.json`,
      )) as Record<string, unknown>;

      // Response: { details: { timeseries: { daily: { types, data } } } }
      const details = raw.details as Record<string, unknown> | undefined;
      const timeseries = details?.timeseries as Record<string, unknown> | undefined;
      const daily = timeseries?.daily as { types: string[]; data: number[][] } | undefined;

      if (!daily?.data) {
        return toolError("No timeseries data found", "Check the chain key and metric name are valid");
      }

      const truncated = daily.data.slice(-30);
      const result = { types: daily.types, data: truncated, count: truncated.length };
      setCache("get_chain_timeseries", args, result);
      return result;
    } catch (e) {
      return toolError(
        e instanceof Error ? e.message : String(e),
        "Check the chain key and metric name are valid",
      );
    }
  },
};

// --- get_landing_summary ---

export const getLandingSummary: InsightTool = {
  declaration: {
    name: "get_landing_summary",
    description:
      "Fetch the growthepie landing page summary data. Returns top 15 chains by users with key metrics.",
  },
  execute: async (args) => {
    const cached = getCached("get_landing_summary", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const data = (await fetchJSON(`${BASE_URL}/landing_page.json`)) as Record<
        string,
        unknown
      >;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          result[key] = value.slice(0, 15);
        } else if (typeof value === "object" && value !== null) {
          const entries = Object.entries(value as Record<string, unknown>);
          result[key] = Object.fromEntries(entries.slice(0, 15));
        } else {
          result[key] = value;
        }
      }
      const out = { data: result };
      setCache("get_landing_summary", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// --- get_economics_data ---

export const getEconomicsData: InsightTool = {
  declaration: {
    name: "get_economics_data",
    description:
      "Fetch economics data for all chains. Returns top 15 chains by TVL with key financial fields only.",
  },
  execute: async (args) => {
    const cached = getCached("get_economics_data", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const data = (await fetchJSON(`${BASE_URL}/economics.json`)) as Record<
        string,
        unknown
      >;
      const entries = Object.entries(data);
      const trimmed = entries.slice(0, 15).map(([chain, val]) => {
        if (typeof val === "object" && val !== null) {
          const v = val as Record<string, unknown>;
          return {
            chain,
            tvl: v.tvl,
            fees: v.fees,
            revenue: v.revenue,
            profit: v.profit,
            stables_mcap: v.stables_mcap,
            rent_paid: v.rent_paid,
          };
        }
        return { chain, raw: val };
      });
      const out = { data: trimmed, count: trimmed.length };
      setCache("get_economics_data", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// --- get_fees_table ---

export const getFeesTable: InsightTool = {
  declaration: {
    name: "get_fees_table",
    description:
      "Fetch the fees table data showing fee metrics across chains. Returns top 15 chains.",
  },
  execute: async (args) => {
    const cached = getCached("get_fees_table", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const data = (await fetchJSON(
        `${BASE_URL}/fees/table.json`,
      )) as unknown[];
      const truncated = Array.isArray(data) ? data.slice(0, 15) : data;
      const out = { data: truncated };
      setCache("get_fees_table", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// --- get_chain_overview ---

export const getChainOverview: InsightTool = {
  declaration: {
    name: "get_chain_overview",
    description:
      "Fetch detailed overview data for a specific chain including metadata, metrics, and statistics.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chain: {
          type: Type.STRING,
          description:
            "The chain key, e.g. 'ethereum', 'arbitrum', 'base', 'optimism'.",
        },
      },
      required: ["chain"],
    },
  },
  execute: async (args) => {
    const cached = getCached("get_chain_overview", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { chain } = args as { chain: string };
      const data = (await fetchJSON(
        `${BASE_URL}/chains/${chain}/overview.json`,
      )) as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const serialized = JSON.stringify(value);
        if (serialized.length > 2048 && typeof value === "object" && value !== null) {
          if (Array.isArray(value)) {
            result[key] = `[Array with ${value.length} items]`;
          } else {
            const keys = Object.keys(value as Record<string, unknown>);
            result[key] = `{Object with keys: ${keys.join(", ")}}`;
          }
        } else {
          result[key] = value;
        }
      }
      const out = { data: result };
      setCache("get_chain_overview", args, out);
      return out;
    } catch (e) {
      return toolError(
        e instanceof Error ? e.message : String(e),
        "Check the chain key is valid (e.g. 'base', 'arbitrum', 'optimism')",
      );
    }
  },
};

// --- get_blockspace_breakdown ---

export const getBlockspaceBreakdown: InsightTool = {
  declaration: {
    name: "get_blockspace_breakdown",
    description:
      "Fetch blockspace category breakdown showing what types of activity dominate each chain (DeFi, gaming, NFTs, utility, etc.). Returns category percentage shares.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        chain: {
          type: Type.STRING,
          description:
            "Optional chain key to filter results, e.g. 'base', 'arbitrum'. If omitted, returns top 10 chains.",
        },
        period: {
          type: Type.STRING,
          description: "Time period for the breakdown.",
          enum: ["7d", "30d", "90d"],
        },
      },
    },
  },
  execute: async (args) => {
    const cached = getCached("get_blockspace_breakdown", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { chain, period = "7d" } = args as {
        chain?: string;
        period?: string;
      };
      const raw = (await fetchJSON(
        `${BASE_URL}/blockspace/overview.json`,
      )) as Record<string, unknown>;

      // Response: { data: { metric_id, chains: { [chain]: { chain_name, overview, ... } } } }
      const inner = raw.data as Record<string, unknown> | undefined;
      const chains = inner?.chains as Record<string, Record<string, unknown>> | undefined;
      if (!chains) {
        return toolError("Unexpected blockspace data structure");
      }

      if (chain) {
        const chainData = chains[chain];
        if (!chainData) {
          return toolError(
            `No blockspace data found for chain '${chain}'`,
            `Available chains: ${Object.keys(chains).slice(0, 10).join(", ")}`,
          );
        }
        // Extract the overview for the requested period
        const overview = chainData.overview as Record<string, unknown> | undefined;
        const periodData = overview?.[period] ?? overview;
        const out = {
          chain,
          chain_name: chainData.chain_name,
          period,
          data: periodData,
        };
        setCache("get_blockspace_breakdown", args, out);
        return out;
      }

      // Return top 10 chains with their overview data for the period
      const chainEntries = Object.entries(chains)
        .filter(([key]) => key !== "all_l2s")
        .slice(0, 10);
      const summary = chainEntries.map(([key, val]) => {
        const overview = val.overview as Record<string, unknown> | undefined;
        return {
          chain: key,
          chain_name: val.chain_name,
          data: overview?.[period] ?? overview,
        };
      });
      const out = {
        period,
        data: summary,
        count: summary.length,
      };
      setCache("get_blockspace_breakdown", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// --- get_metric_comparison ---

export const getMetricComparison: InsightTool = {
  declaration: {
    name: "get_metric_comparison",
    description:
      "Compare a single metric across all chains with rankings and recent changes. Returns top N chains sorted by the metric with 7d and 30d percentage changes.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        metric: {
          type: Type.STRING,
          description: "The metric to compare across chains.",
          enum: ["daa", "fees", "tvl", "txcount", "stables_mcap", "profit"],
        },
        top_n: {
          type: Type.NUMBER,
          description:
            "Number of top chains to return (default 10, max 20).",
        },
      },
      required: ["metric"],
    },
  },
  execute: async (args) => {
    const cached = getCached("get_metric_comparison", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { metric, top_n = 10 } = args as {
        metric: string;
        top_n?: number;
      };
      const limit = Math.min(top_n, 20);

      // Map short metric names to API metric keys where needed
      const metricKeyMap: Record<string, string> = {
        daa: "daa",
        fees: "fees_paid_usd",
        tvl: "tvl",
        txcount: "txcount",
        stables_mcap: "stables_mcap",
        profit: "profit_eth",
      };
      const apiMetric = metricKeyMap[metric] ?? metric;

      const raw = (await fetchJSON(
        `${BASE_URL}/metrics/${apiMetric}.json`,
      )) as Record<string, unknown>;

      // Response: { data: { metric_id, chains: { [chain]: { chain_name, changes, daily: { types, data } } } } }
      const inner = raw.data as Record<string, unknown> | undefined;
      const chains = inner?.chains as Record<string, Record<string, unknown>> | undefined;
      if (!chains) {
        return toolError("Unexpected metric data structure");
      }

      const rankings: {
        chain: string;
        chain_name: string;
        current: number;
        change_7d: number | null;
        change_30d: number | null;
      }[] = [];

      for (const [chainKey, chainData] of Object.entries(chains)) {
        const daily = chainData.daily as { types: string[]; data: number[][] } | undefined;
        if (!daily?.data?.length) continue;

        const latest = daily.data[daily.data.length - 1];
        const currentVal = latest[1];

        // Use pre-computed changes from the API
        const changes = chainData.changes as Record<string, number[]> | undefined;
        const change7d = changes?.["7d"]?.[0] ?? null;
        const change30d = changes?.["30d"]?.[0] ?? null;

        rankings.push({
          chain: chainKey,
          chain_name: chainData.chain_name as string,
          current: currentVal,
          change_7d: change7d !== null ? Math.round(change7d * 10000) / 100 : null,
          change_30d: change30d !== null ? Math.round(change30d * 10000) / 100 : null,
        });
      }

      // Sort by current value descending, take top N
      rankings.sort((a, b) => b.current - a.current);
      const top = rankings.slice(0, limit);

      const out = {
        metric,
        metric_name: inner?.metric_name,
        data: top.map((r, i) => ({ rank: i + 1, ...r })),
        count: top.length,
        total_chains: rankings.length,
      };
      setCache("get_metric_comparison", args, out);
      return out;
    } catch (e) {
      return toolError(
        e instanceof Error ? e.message : String(e),
        "Check the metric name is valid: daa, fees, tvl, txcount, stables_mcap, profit",
      );
    }
  },
};

// --- get_top_apps ---

export const getTopApps: InsightTool = {
  declaration: {
    name: "get_top_apps",
    description:
      "Fetch top applications by activity. Can filter by chain. Returns app rankings with txcount, gas usage, and category.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        timespan: {
          type: Type.STRING,
          description: "Time period for app rankings.",
          enum: ["7d", "30d"],
        },
        chain: {
          type: Type.STRING,
          description:
            "Optional chain key to filter apps, e.g. 'base', 'arbitrum'. If omitted, returns top apps across all chains.",
        },
        limit: {
          type: Type.NUMBER,
          description: "Max number of apps to return (default 15, max 30).",
        },
      },
      required: ["timespan"],
    },
  },
  execute: async (args) => {
    const cached = getCached("get_top_apps", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { timespan = "7d", chain, limit = 15 } = args as {
        timespan: string;
        chain?: string;
        limit?: number;
      };
      const maxItems = Math.min(limit, 30);

      const raw = (await fetchJSON(
        `${BASE_URL}/apps/app_overview_${timespan}.json`,
      )) as Record<string, unknown>;

      // Response: { data: { types: [...], data: [[owner_project, origin_key, num_contracts, gas_fees_eth, prev_gas_fees_eth, gas_fees_usd, txcount, prev_txcount, daa, prev_daa], ...] } }
      const inner = raw.data as { types: string[]; data: unknown[][] } | undefined;
      if (!inner?.types || !inner?.data) {
        return toolError("Unexpected app overview data structure");
      }

      const types = inner.types;
      const colIdx = (name: string) => types.indexOf(name);

      // Convert columnar rows to objects
      let apps = inner.data.map((row) => ({
        name: row[colIdx("owner_project")] as string,
        chain: row[colIdx("origin_key")] as string,
        gas_fees_eth: row[colIdx("gas_fees_eth")] as number,
        gas_fees_usd: row[colIdx("gas_fees_usd")] as number,
        txcount: row[colIdx("txcount")] as number,
        prev_txcount: row[colIdx("prev_txcount")] as number,
        daa: row[colIdx("daa")] as number,
        prev_daa: row[colIdx("prev_daa")] as number,
      }));

      // Filter by chain if specified
      if (chain) {
        apps = apps.filter((app) => app.chain === chain);
      }

      // Sort by gas_fees_usd descending, truncate
      apps.sort((a, b) => (b.gas_fees_usd ?? 0) - (a.gas_fees_usd ?? 0));
      const truncated = apps.slice(0, maxItems);

      const out = {
        timespan,
        chain: chain ?? "all",
        data: truncated,
        count: truncated.length,
      };
      setCache("get_top_apps", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// --- get_da_metrics ---

export const getDaMetrics: InsightTool = {
  declaration: {
    name: "get_da_metrics",
    description:
      "Fetch data availability layer costs and usage. Shows fees, data posted, fees per MB, and consumer chains for each DA layer.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        da_layer: {
          type: Type.STRING,
          description:
            "Optional DA layer to filter, e.g. 'ethereum_blobs', 'celestia', 'eigen_da'. If omitted, returns all DA layers.",
        },
      },
    },
  },
  execute: async (args) => {
    const cached = getCached("get_da_metrics", args);
    if (cached) return cached as Record<string, unknown>;
    try {
      const { da_layer } = args as { da_layer?: string };
      const raw = (await fetchJSON(
        `${BASE_URL}/da_overview.json`,
      )) as Record<string, unknown>;

      // Response: { data: { all_da: {...}, da_breakdown: { da_celestia: {...}, da_ethereum_blobs: {...}, ... } } }
      const inner = raw.data as Record<string, unknown> | undefined;
      const breakdown = inner?.da_breakdown as Record<string, Record<string, unknown>> | undefined;

      if (da_layer) {
        // Try both with and without da_ prefix
        const key = da_layer.startsWith("da_") ? da_layer : `da_${da_layer}`;
        const layerData = breakdown?.[key] ?? breakdown?.[da_layer];
        if (!layerData) {
          const available = breakdown ? Object.keys(breakdown).join(", ") : "none";
          return toolError(
            `No data found for DA layer '${da_layer}'`,
            `Available layers: ${available}`,
          );
        }
        const out = { da_layer, data: layerData };
        setCache("get_da_metrics", args, out);
        return out;
      }

      // Return summary: all_da overview + breakdown layer names
      const allDa = inner?.all_da as Record<string, unknown> | undefined;
      const layerNames = breakdown ? Object.keys(breakdown) : [];
      const out = {
        all_da: allDa,
        layers: layerNames,
        breakdown,
      };
      setCache("get_da_metrics", args, out);
      return out;
    } catch (e) {
      return toolError(e instanceof Error ? e.message : String(e));
    }
  },
};

// ---------------------------------------------------------------------------
// Export all tools
// ---------------------------------------------------------------------------

/** All available tools indexed by name */
export const allTools: Record<string, InsightTool> = {
  get_chain_timeseries: getChainTimeseries,
  get_landing_summary: getLandingSummary,
  get_economics_data: getEconomicsData,
  get_fees_table: getFeesTable,
  get_chain_overview: getChainOverview,
  get_blockspace_breakdown: getBlockspaceBreakdown,
  get_metric_comparison: getMetricComparison,
  get_top_apps: getTopApps,
  get_da_metrics: getDaMetrics,
};
