import {
  ChainInsightContext,
  TableInsightContext,
} from "@/types/api/AIInsightsResponse";

/**
 * Build table context from landing page data
 */
export function buildTableContext(
  rows: Array<{
    data: {
      chain_name: string;
      purpose?: string;
      users: number;
      user_share: number;
      cross_chain_activity: number;
    };
    chain: { key: string; urlKey?: string };
  }>,
  master: { chains: { [key: string]: { maturity?: string } } },
  sortConfig?: { metric: string; sortOrder: "asc" | "desc" },
): TableInsightContext {
  return {
    totalChains: rows.length,
    chains: rows.map((row) => ({
      chainKey: row.chain.key,
      chainName: row.data.chain_name,
      urlKey: row.chain.urlKey || row.chain.key,
      purpose: row.data.purpose,
      maturity: master.chains[row.chain.key]?.maturity,
      weeklyActiveAddresses: row.data.users,
      userShare: row.data.user_share,
      crossChainActivity: row.data.cross_chain_activity,
    })),
    timeframe: "7d",
    sortedBy: sortConfig?.metric,
    sortOrder: sortConfig?.sortOrder,
  };
}

/**
 * Build chain context from row data
 */
export function buildChainContext(
  row: {
    data: {
      chain_name: string;
      purpose?: string;
      users: number;
      user_share: number;
      cross_chain_activity: number;
    };
    chain: { key: string; urlKey?: string };
  },
  master: { chains: { [key: string]: { maturity?: string } } },
  rankings?: {
    [metric: string]: {
      rank: number | null;
      out_of: number | null;
    };
  },
): ChainInsightContext {
  return {
    chainKey: row.chain.key,
    chainName: row.data.chain_name,
    urlKey: row.chain.urlKey || row.chain.key,
    purpose: row.data.purpose,
    maturity: master.chains[row.chain.key]?.maturity,
    weeklyActiveAddresses: row.data.users,
    userShare: row.data.user_share,
    crossChainActivity: row.data.cross_chain_activity,
    rankings: rankings
      ? Object.fromEntries(
          Object.entries(rankings).map(([metric, r]) => [
            metric,
            { rank: r.rank, outOf: r.out_of },
          ]),
        )
      : undefined,
  };
}
