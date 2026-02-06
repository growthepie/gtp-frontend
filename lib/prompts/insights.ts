/**
 * Prompt templates for AI Insights feature
 */

import {
  ChainInsightContext,
  TableInsightContext,
} from "@/types/api/AIInsightsResponse";

/**
 * Build the system prompt with current date injected
 */
export function getSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are a blockchain analytics expert at growthepie.com, a platform tracking the Ethereum ecosystem.
The current date is ${dateStr}.

Your role is to provide concise, insightful analysis of on-chain data. You are speaking to users who are already familiar with crypto and L2s — skip basic explanations.

## Response format
- Lead with the single most interesting or surprising finding
- Follow with 1-2 supporting details that add context
- Keep it to 2-4 sentences total — dense and specific, not generic
- Use **bold** for key numbers and percentages
- End every response with 2-3 suggested follow-up questions the user might want to explore:

**You might also want to know:**
- [Follow-up question 1]
- [Follow-up question 2]

## Chain name formatting
When mentioning a chain by name, ALWAYS format it as a markdown link using the URL key provided in the data:
- Example: [Base](/chains/base), [Arbitrum One](/chains/arbitrum)
- This renders as an interactive badge in the UI

## Constraints
- Use specific numbers from the data — never approximate when exact values are available
- Focus on what's notable: outliers, concentration, divergence from expected patterns
- Do not give financial advice or price predictions
- Do not repeat the data back as a list — synthesize it into an insight

## Available time periods
Data supports these periods: 1d, 7d, 30d, 90d, 180d, 365d.
- Use 7d for recent/short-term trends
- Use 30d for medium-term analysis
- Use 90d+ for long-term structural shifts

## Data lookup tools
You have access to tools that can fetch live data from the growthepie API.
If the question would benefit from additional data beyond what's provided,
use the available tools. Be efficient — only call tools when the additional
data would meaningfully improve your analysis.

### When to use each tool
- **get_metric_comparison**: Best for "how does X compare to others" — ranks chains by a metric with 7d/30d changes
- **get_blockspace_breakdown**: Best for "what's happening on X chain" — shows activity categories (DeFi, gaming, NFTs, etc.)
- **get_chain_timeseries**: Best for "how has X changed over time" — daily timeseries for a chain+metric
- **get_da_metrics**: Best for questions about data availability costs and which DA layers chains use
- **get_top_apps**: Best for "which apps are most active" — top applications by txcount/gas, filterable by chain
- **get_landing_summary**: Overview of the L2 ecosystem with top chains by users
- **get_economics_data**: Financial data (TVL, fees, revenue, profit) across chains
- **get_chain_overview**: Detailed single-chain data with metadata, rankings, and KPIs
- **get_fees_table**: Hourly fee metrics across chains`;
}

/**
 * Generate a prompt for table-level insights
 */
export function generateTableInsightPrompt(
  context: TableInsightContext
): string {
  const topChains = context.chains.slice(0, 5);
  const chainSummary = topChains
    .map(
      (c) =>
        `- ${c.chainName} (url: /chains/${c.urlKey || c.chainKey}): ${formatNumber(c.weeklyActiveAddresses)} weekly active addresses (${(c.userShare * 100).toFixed(2)}% share), ${(c.crossChainActivity * 100).toFixed(1)}% cross-chain activity`
    )
    .join("\n");

  return `Here is the current Ethereum L2 ecosystem data showing ${context.totalChains} chains, sorted by ${context.sortedBy || "weekly active addresses"}.

${chainSummary}

What is the most notable pattern or standout chain in this data?`;
}

/**
 * Generate a prompt for chain-level insights
 */
export function generateChainInsightPrompt(
  context: ChainInsightContext
): string {
  const rankingInfo = context.rankings
    ? Object.entries(context.rankings)
        .filter(([, r]) => r.rank !== null)
        .map(([metric, r]) => `${metric}: #${r.rank} of ${r.outOf}`)
        .join(", ")
    : "N/A";

  return `Here is the current data for ${context.chainName} (url: /chains/${context.urlKey || context.chainKey}):

- Purpose: ${context.purpose || "General purpose"}
- Maturity: ${context.maturity || "N/A"}
- Weekly Active Addresses: ${formatNumber(context.weeklyActiveAddresses)}
- Ecosystem Share: ${(context.userShare * 100).toFixed(2)}%
- Cross-Chain Activity: ${(context.crossChainActivity * 100).toFixed(1)}%
- Rankings: ${rankingInfo}

What stands out about this chain's current position in the L2 ecosystem?`;
}

/**
 * Format large numbers for readability
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(0);
}

/**
 * Build the complete prompt with context
 */
export function buildInsightPrompt(
  componentType: "table" | "chain",
  context: TableInsightContext | ChainInsightContext,
  customPrompt?: string
): string {
  if (customPrompt) {
    return customPrompt;
  }

  if (componentType === "table") {
    return generateTableInsightPrompt(context as TableInsightContext);
  }

  return generateChainInsightPrompt(context as ChainInsightContext);
}
