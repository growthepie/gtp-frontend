import { Type } from "@google/genai";
import { InsightTool } from "./types";

const BASE_URL = "https://api.growthepie.com/v1";
const TIMEOUT_MS = 8000;

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

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
    try {
      const { chain, metric } = args as { chain: string; metric: string };
      const data = (await fetchJSON(
        `${BASE_URL}/metrics/chains/${chain}/${metric}.json`,
      )) as unknown[];
      // Truncate to last 30 data points
      const truncated = data.slice(-30);
      return { data: truncated, count: truncated.length };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
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
  execute: async () => {
    try {
      const data = (await fetchJSON(`${BASE_URL}/landing_page.json`)) as Record<
        string,
        unknown
      >;
      // data is keyed by metric, each containing chain data
      // Truncate to top 15 chains by user count if possible
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
      return { data: result };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
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
  execute: async () => {
    try {
      const data = (await fetchJSON(`${BASE_URL}/economics.json`)) as Record<
        string,
        unknown
      >;
      // Truncate: take top 15 entries and pick key fields
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
      return { data: trimmed, count: trimmed.length };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
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
  execute: async () => {
    try {
      const data = (await fetchJSON(
        `${BASE_URL}/fees/table.json`,
      )) as unknown[];
      const truncated = Array.isArray(data) ? data.slice(0, 15) : data;
      return { data: truncated };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
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
    try {
      const { chain } = args as { chain: string };
      const data = (await fetchJSON(
        `${BASE_URL}/chains/${chain}/overview.json`,
      )) as Record<string, unknown>;
      // Summarize nested objects > 2KB
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
      return { data: result };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
};

/** All available tools indexed by name */
export const allTools: Record<string, InsightTool> = {
  get_chain_timeseries: getChainTimeseries,
  get_landing_summary: getLandingSummary,
  get_economics_data: getEconomicsData,
  get_fees_table: getFeesTable,
  get_chain_overview: getChainOverview,
};
