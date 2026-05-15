import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Sister answer page to qb-most-used-ethereum-l2. Same shape (FAQ + Dataset
// blocks + dense leaderboard prose), but ranks by LOWEST fee instead of
// highest usage and combines two data granularities:
//   - Historical (daily / weekly / monthly): median fee in USD from the
//     per-chain txcosts timeseries.
//   - Live (latest hour): four fee facets (median, native transfer, swap,
//     average) from fees/table.json — the same payload the /fees page uses.
// Placeholders are namespaced `{{l2_fee_*}}` so they can't collide with the
// `{{l2_*}}` placeholders used by the usage answer page.

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 has the lowest fees?',
    a: 'It depends on the fee type and the time horizon. As of {{l2_fee_data_date}} UTC, by median transaction fee the daily-cheapest L2 is {{l2_fee_median_daily_leader}}. Live (latest hour): the cheapest L2 for native transfers is {{l2_fee_transfer_live_leader}}; for token swaps: {{l2_fee_swap_live_leader}}; by average fee: {{l2_fee_avg_live_leader}}. Weekly and monthly leaders may differ — see the per-period FAQ below. All rankings are computed daily from growthepie\'s public API; live fee table: growthepie.com/fees.',
  },
  {
    q: 'Why does the answer depend on the fee type?',
    a: 'Different fee types measure different onchain actions. Median fee is the cost of a typical transaction on the chain — robust to outliers and the most quotable single number. Native transfer fee is the median cost of sending ETH (or the chain\'s gas token) — the cheapest common action and a good lower-bound benchmark. Swap fee is the median cost of a token swap — the most common DeFi action and the one users feel most often. Average fee is the mean fee, which can be skewed by a small number of expensive transactions and so reads higher than the median.',
  },
  // ----- Live (latest hour) -----
  {
    q: 'Which Ethereum L2 has the cheapest median fee right now?',
    a: "Live (latest completed hour, data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest median transaction fee are {{l2_fee_median_live_top3}}. Live fee table: growthepie.com/fees.",
  },
  {
    q: 'Which Ethereum L2 has the cheapest native transfer right now?',
    a: "Live (latest completed hour, data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest native transfer fee are {{l2_fee_transfer_live_top3}}. Native transfer fee is the median cost of sending the chain\'s gas token — the cheapest common transaction type, useful as a floor.",
  },
  {
    q: 'Which Ethereum L2 has the cheapest token swap right now?',
    a: "Live (latest completed hour, data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest token swap fee are {{l2_fee_swap_live_top3}}. Swap fees reflect a representative DeFi swap and are usually the most expensive of the three categories because swaps touch multiple smart contracts.",
  },
  {
    q: 'Which Ethereum L2 has the lowest average fee right now?',
    a: "Live (latest completed hour, data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest average fee are {{l2_fee_avg_live_top3}}. Average fee is the arithmetic mean across all transactions on the chain and can run higher than the median when a single block contains a few expensive transactions.",
  },
  // ----- Historical (median fee, period-native) -----
  {
    q: 'Which Ethereum L2 had the lowest median fee today?',
    a: "On {{l2_fee_data_date}} UTC, the top three Ethereum L2s by lowest daily median transaction fee are {{l2_fee_median_daily_top3}}. Daily values use the most recent completed day from the per-chain txcosts timeseries.",
  },
  {
    q: 'Which Ethereum L2 had the lowest median fee this week?',
    a: "Over the most recent completed week (data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest weekly median transaction fee are {{l2_fee_median_weekly_top3}}. The weekly leader is {{l2_fee_median_weekly_leader}}.",
  },
  {
    q: 'Which Ethereum L2 had the lowest median fee this month?',
    a: "Over the most recent completed month (data {{l2_fee_data_date}} UTC), the top three Ethereum L2s by lowest monthly median transaction fee are {{l2_fee_median_monthly_top3}}. The monthly leader is {{l2_fee_median_monthly_leader}}.",
  },
  // ----- Methodology / scope -----
  {
    q: 'Are transfer, swap, and average fees available for daily / weekly / monthly?',
    a: 'Not on this page. growthepie\'s API exposes native-transfer, swap, and average fee facets at the hourly granularity (the live table). For daily / weekly / monthly we use median transaction fee from the per-chain txcosts timeseries — the most stable headline metric over longer horizons. If you need historical transfer or swap fee curves specifically, check the chain detail pages on growthepie.com.',
  },
  {
    q: 'Why are L2 fees quoted in cents?',
    a: 'L2 transaction fees are almost always sub-cent on a normal day, so quoting in dollars (e.g. "$0.0018") obscures the comparison. Cents (e.g. "0.18¢") read more naturally for AI answer cards and human readers alike. Fees above 100¢ are quoted in dollars.',
  },
  {
    q: 'Is Polygon PoS an Ethereum L2?',
    a: 'No. Polygon PoS is a sidechain with its own validator set; it does not post transaction data to Ethereum for security and is therefore excluded from the L2 fee leaderboards on this page (also [L2BEAT](https://l2beat.com) categorizes it as "other"). Polygon zkEVM is a ZK rollup and would qualify.',
  },
  {
    q: 'How many L2s are included in the ranking?',
    a: '{{l2_fee_universe_size}} chains. The full list (computed on {{l2_fee_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_fee_universe_list}}.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Live (latest hour) fees come from growthepie\'s public fees endpoint (`/v1/fees/table.json`), which exposes four fee metrics per chain at hourly granularity: median (`txcosts_median`), native-transfer (`txcosts_native_median`), swap (`txcosts_swap`), and average (`txcosts_avg`). Historical daily / weekly / monthly median fee comes from the per-chain transaction-cost timeseries (`/v1/metrics/chains/{chain}/txcosts.json`), USD column. L2 membership is computed from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_fee_data_date}} UTC: {{l2_fee_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why does the live median fee sometimes differ from the daily median?',
    a: 'They cover different windows. The live figure uses the last completed UTC hour — a tight slice that\'s sensitive to a single congested block. The daily figure uses the last completed UTC day — much smoother. Both are useful: live for "is this chain cheap right now?", daily for "is this chain consistently cheap?" If the two values diverge sharply, the chain probably had a fee spike in the most recent hour.',
  },
  {
    q: 'Where can I see live L2 fee data?',
    a: 'growthepie\'s dedicated fees view at [fees.growthepie.com](https://fees.growthepie.com) tracks live (hourly) median, native-transfer, and swap fees per chain, plus throughput and TPS. The same data backs this answer page; the dashboard is interactive and adds chart overlays.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL = 'https://www.growthepie.com/answers/lowest-fee-ethereum-l2';
const ORG_ID = 'https://www.growthepie.com/#organization';
// growthepie's fee data starts when each chain launched. 2021-01-01 brackets
// the earliest active L2s (Arbitrum One, Optimism). Adjust if a specific
// dataset has tighter bounds.
const L2_TEMPORAL_COVERAGE = '2021-01-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-fees-live',
    name: 'Ethereum L2 Live Fee Table (hourly)',
    description:
      'Hourly fee table for every tracked Ethereum L2: median, native-transfer median, token-swap median, and average transaction cost — quoted in ETH and USD. Powers the live answer to "which L2 has the lowest fees right now".',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    temporalCoverage: L2_TEMPORAL_COVERAGE,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Layer 2',
      'Rollups',
      'Fees',
      'Transaction cost',
      'Median fee',
      'Swap fee',
      'Transfer fee',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain hourly aggregation computed from on-chain transaction data. For each completed hour, the API reports the median across all transactions (`txcosts_median`), the median across native transfers only (`txcosts_native_median`), the median across token swaps (`txcosts_swap`), and the arithmetic mean across all transactions (`txcosts_avg`). Values are emitted in ETH and USD; this page quotes USD.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'hour_unix' },
      { '@type': 'PropertyValue', name: 'txcosts_median', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'txcosts_native_median', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'txcosts_swap', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'txcosts_avg', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/fees/table.json',
        description: 'All chains, hourly fee table — median, transfer, swap, average.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-fees-historical-median',
    name: 'Ethereum L2 Median Transaction Cost (per chain, daily)',
    description:
      'Daily median transaction cost for every tracked Ethereum L2, quoted in ETH and USD. Used as the headline historical fee metric for daily / weekly / monthly comparisons.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    temporalCoverage: L2_TEMPORAL_COVERAGE,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Layer 2',
      'Rollups',
      'Median fee',
      'Transaction cost',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain daily / weekly / monthly aggregation of the median transaction cost (USD). Daily uses the last completed UTC day; weekly and monthly are period-native aggregates served directly by growthepie\'s API (not sums of daily values).',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'median_tx_cost_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/txcosts.json',
        description: 'All chains, daily/weekly/monthly median transaction cost.',
      },
    ],
  },
];

const lowestFeeEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 has the lowest fees?',
  subtitle:
    'A direct, data-backed answer across median, transfer, swap, and average fees — with both live (hourly) and historical (daily / weekly / monthly) leaderboards.',
  shortTitle: 'Lowest L2 Fees',
  summary:
    "The cheapest Ethereum L2 depends on the fee type and the time horizon. growthepie's live fee table ranks every tracked L2 hourly by four fee metrics — median, native transfer, token swap, and average — and the historical leaderboard ranks by daily / weekly / monthly median fee. Native transfer, swap, and average fees are available live only; median fee is shown across all four time horizons. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_fee_data_date}} UTC):** By median transaction fee the daily-cheapest Ethereum L2 is {{l2_fee_median_daily_leader}}. Live (latest hour) — native transfer cheapest: {{l2_fee_transfer_live_leader}}. Token swap cheapest: {{l2_fee_swap_live_leader}}. Average fee cheapest: {{l2_fee_avg_live_leader}}. Weekly and monthly median leaders may differ — see the per-period sections below.",

    "> Updated daily — every leaderboard on this page is recomputed from growthepie's public API. Live fee values use the last completed hour; daily / weekly / monthly median values use the most recent **completed** period (not the in-progress one).",

    '# How we measure "lowest fees"',
    'We rank Ethereum L2s by four fee facets, two of which are exposed at both live and historical granularities:',
    '- **Median fee** — cost of a typical transaction on the chain. Most quotable single number; available live (hourly) and historical (daily / weekly / monthly).',
    '- **Native transfer fee** — median cost of sending the chain\'s gas token. The cheapest common action and a useful floor. **Live only.**',
    '- **Token swap fee** — median cost of a representative DEX swap. The most common DeFi action; usually the most expensive of the four categories because swaps touch multiple smart contracts. **Live only.**',
    '- **Average fee** — arithmetic mean across all transactions on the chain. Can run higher than the median when a single block contains a few expensive transactions. **Live only.**',

    '# Live leaderboard: by fee type (latest hour)',
    '{{l2_fee_live_dense}}',

    '# Live leaderboard: median fee',
    '**Top 3 cheapest right now (latest completed hour, {{l2_fee_data_date}} UTC):** {{l2_fee_median_live_top3}}.',

    '# Live leaderboard: native transfer fee',
    '**Top 3 cheapest right now (latest completed hour, {{l2_fee_data_date}} UTC):** {{l2_fee_transfer_live_top3}}.',

    '# Live leaderboard: token swap fee',
    '**Top 3 cheapest right now (latest completed hour, {{l2_fee_data_date}} UTC):** {{l2_fee_swap_live_top3}}.',

    '# Live leaderboard: average fee',
    '**Top 3 cheapest right now (latest completed hour, {{l2_fee_data_date}} UTC):** {{l2_fee_avg_live_top3}}.',

    '# Historical leaderboard: median fee (daily / weekly / monthly)',
    '{{l2_fee_historical_dense}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. For **live** fees, pull `/v1/fees/table.json` and read the latest completed hour from each of the four fee fields (`txcosts_median`, `txcosts_native_median`, `txcosts_swap`, `txcosts_avg`), USD column.",
    "3. For **historical** median fee, pull the per-chain endpoint (`/v1/metrics/chains/{chain}/txcosts.json`) — the API exposes daily / weekly / monthly aggregations natively. Daily uses the last completed day; weekly and monthly use the most recent **completed** period.",
    "4. Sort the chains ascending (cheapest first) for each (fee type, window) pair and take the top 3.",

    "All rankings on this page pull live from growthepie's public API and refresh daily; the values shown above were generated on {{l2_fee_data_date}} UTC:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Live hourly fee table (median / transfer / swap / average per chain): `https://api.growthepie.com/v1/fees/table.json`',
    '- Per-chain median fee timeseries (daily / weekly / monthly, USD): `https://api.growthepie.com/v1/metrics/chains/{chain}/txcosts.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the rankings above. Rankings are computed mechanically from public API data — chains do not pay for inclusion or placement, and supporters do not receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent L2 fee data sources you can compare against include [L2BEAT](https://l2beat.com) (activity, stage classification, risk analysis) and the chains' own block explorers. Methodologies and chain inclusion lists differ between providers — when rankings disagree, comparing the underlying fee definitions (which transactions are sampled? what time window?) is usually more informative than the ranks themselves.",
    '',
    '# Which chains are included?',
    "While growthepie tracks the fees of every L2 in the Ethereum ecosystem, our detailed leaderboards focus on the most widely used and adopted chains. The list of **{{l2_fee_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_fee_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it is Layer 1, not Layer 2.',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-15',
  hideDate: true,
  hideTopicsBar: true,
  // Fallback only — the processor overrides this with a live-data-derived
  // string. Keeping it as a "data unavailable" stub means we never quote a
  // hand-written ranking claim that could go stale.
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/fees for the live Ethereum L2 fee leaderboards.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fees' },
    { icon: 'gtp-metrics-transactioncosts', name: 'Fees', url: '/fees' },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-transactioncosts',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default lowestFeeEthereumL2;
