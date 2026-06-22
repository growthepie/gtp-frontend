import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Third answer page in the L2-leaderboard family. Mirrors the structure of
// qb-most-used-ethereum-l2 and qb-lowest-fee-ethereum-l2 but combines three
// data dimensions:
//   - Stablecoin SUPPLY per chain (per-chain stables_mcap timeseries, USD)
//   - Stablecoin TRANSACTIONS per chain (blockspace token_transfers →
//     stablecoin subcategory, txcount_absolute)
//   - GAS SPENT on stablecoins per chain (same subcategory,
//     gas_fees_absolute_usd)
//   - VARIETY of stablecoins per chain (row count of the quick-bite
//     stablecoins-by-chain table — a separate, period-independent ranking)
// Placeholders use the `{{l2_stables_*}}` namespace so they can't collide
// with the `{{l2_*}}` and `{{l2_fee_*}}` tokens from the sister pages.

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 has the most stablecoin activity?',
    a: 'It depends on what you measure. As of {{l2_stables_data_date}} UTC: by stablecoin supply the daily leader is {{l2_stables_supply_daily_leader}}; by daily stablecoin transactions: {{l2_stables_txcount_daily_leader}}; by daily gas spent on stablecoins: {{l2_stables_gas_spent_daily_leader}}. By distinct stablecoin variety: {{l2_stables_variety_leader}}. Weekly and monthly leaders may differ — see the per-metric FAQs below. All rankings are computed daily from growthepie\'s data; live leaderboard: growthepie.com/fundamentals/stablecoin-market-cap.',
  },
  {
    q: 'Why does the answer depend on the metric?',
    a: 'Each metric tells a different story. **Supply** is the total dollar value of stablecoins parked on the chain — a balance-sheet signal of how much capital sits there. **Transactions** count how many stablecoin transfers happen on the chain — a velocity signal. **Gas spent** is how much fee revenue the chain earned from stablecoin activity. **Variety** counts how many distinct stablecoin tokens the chain hosts — a breadth signal. A chain can be #1 in supply but #5 in transactions (capital parked but not moving) or vice versa.',
  },
  // ----- Stablecoin supply -----
  {
    q: 'Which Ethereum L2 has the largest stablecoin supply today?',
    a: "On {{l2_stables_data_date}} UTC, the top three Ethereum L2s by stablecoin supply are {{l2_stables_supply_daily_top3}}. Supply is the total USD value of every stablecoin parked on the chain. Pulled from growthepie's per-chain stables_mcap endpoint.",
  },
  {
    q: 'Which Ethereum L2 had the largest stablecoin supply this week?',
    a: "Over the most recent completed week (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by stablecoin supply are {{l2_stables_supply_weekly_top3}}. Weekly supply is the snapshot at end-of-week — supply is a stock, not a flow, so the weekly value is a single point in time, not a sum.",
  },
  {
    q: 'Which Ethereum L2 had the largest stablecoin supply this month?',
    a: "Over the most recent completed month (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by stablecoin supply are {{l2_stables_supply_monthly_top3}}. The monthly leader is {{l2_stables_supply_monthly_leader}}.",
  },
  // ----- Stablecoin transactions -----
  {
    q: 'Which L2 processed the most stablecoin transactions today?',
    a: "On {{l2_stables_data_date}} UTC, the top three Ethereum L2s by daily stablecoin transactions are {{l2_stables_txcount_daily_top3}}. Counts are precomputed daily on growthepie's backend from the blockspace stablecoin subcategory (`token_transfers.subcategories.stablecoin`) and published at `/v1/answers/stablecoin-activity.json`.",
  },
  {
    q: 'Which L2 processed the most stablecoin transactions this week?',
    a: "Over the most recent 7-day window (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by stablecoin transactions are {{l2_stables_txcount_weekly_top3}}. Weekly is a 7-day rolling sum, precomputed daily on the backend from the blockspace stablecoin subcategory.",
  },
  {
    q: 'Which L2 processed the most stablecoin transactions this month?',
    a: "Over the most recent 30-day window (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by stablecoin transactions are {{l2_stables_txcount_monthly_top3}}. The monthly leader is {{l2_stables_txcount_monthly_leader}}.",
  },
  // ----- Gas spent on stablecoins -----
  {
    q: 'Which L2 had the most gas spent on stablecoins today?',
    a: "On {{l2_stables_data_date}} UTC, the top three Ethereum L2s by daily gas spent on stablecoin transactions are {{l2_stables_gas_spent_daily_top3}}. Gas spent is denominated in USD and represents fee revenue the chain earned from stablecoin activity — a useful proxy for how economically important stablecoins are to the chain.",
  },
  {
    q: 'Which L2 had the most gas spent on stablecoins this week?',
    a: "Over the most recent 7-day window (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by gas spent on stablecoins are {{l2_stables_gas_spent_weekly_top3}}. Note that high gas spent is partly a function of high transaction count and partly a function of expensive transactions — a chain can rank well here either by volume or by fee level.",
  },
  {
    q: 'Which L2 had the most gas spent on stablecoins this month?',
    a: "Over the most recent 30-day window (data {{l2_stables_data_date}} UTC), the top three Ethereum L2s by gas spent on stablecoins are {{l2_stables_gas_spent_monthly_top3}}. The monthly leader is {{l2_stables_gas_spent_monthly_leader}}.",
  },
  // ----- Variety -----
  {
    q: 'Which Ethereum L2 hosts the widest variety of stablecoins?',
    a: 'As of {{l2_stables_data_date}} UTC, the top three Ethereum L2s by distinct stablecoin count are {{l2_stables_variety_top3}}. "Variety" here means the number of distinct stablecoin tokens deployed on the chain (USDC, USDT, DAI, PYUSD, etc.), pulled from growthepie\'s [stablecoins-by-chain quick-bite](https://www.growthepie.com/quick-bites/stables-by-chain). A chain can be high-variety but low-supply (lots of small stablecoins) or low-variety but high-supply (a few stablecoins doing all the volume).',
  },
  {
    q: 'Is "variety" a useful metric on its own?',
    a: 'Not in isolation, but combined with supply it tells you something the supply number alone doesn\'t: whether liquidity is concentrated in one or two dominant stablecoins, or spread across many. A chain with many stablecoins is more resilient to a single-issuer freeze (e.g. a USDC depeg in 2023) and more attractive to apps that need a specific token, but variety on its own says nothing about how much capital is actually parked on the chain.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Is Polygon PoS an Ethereum L2?',
    a: 'No. Polygon PoS is a sidechain with its own validator set; it does not post transaction data to Ethereum for security and is therefore excluded from the L2 leaderboards on this page (also [L2BEAT](https://l2beat.com) categorizes it as "other"). Polygon zkEVM is a ZK rollup and would qualify.',
  },
  {
    q: 'How many L2s are included in the ranking?',
    a: '{{l2_stables_universe_size}} chains. The full list (computed on {{l2_stables_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_stables_universe_list}}. A chain only appears in a given ranking if it has data for that metric — chains without stablecoin coverage simply don\'t show up.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Supply comes from growthepie\'s per-chain stables_mcap timeseries (`/v1/metrics/chains/{chain}/stables_mcap.json`), USD column. Transactions and gas spent come from the precomputed answer endpoint (`/v1/answers/stablecoin-activity.json`), which the backend recomputes daily from the blockspace stablecoin subcategory (`data.token_transfers.subcategories.stablecoin`) — daily = latest day, weekly = 7-day rolling sum, monthly = 30-day rolling sum, for `txcount` and `gas_spent`. Variety comes from the stablecoins-by-chain quick-bite table (`/v1/quick-bites/stablecoins/chains/table_{chain}.json`) — the row count is the number of distinct stablecoins on the chain. L2 membership comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_stables_data_date}} UTC: {{l2_stables_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why are weekly and monthly transaction counts called 7d and 30d sums?',
    a: 'Because the underlying blockspace data reports stablecoin transactions as rolling-window aggregations rather than calendar weeks or months. "Weekly" on this page = total stablecoin transactions over the most recent 7 days; "monthly" = total over the most recent 30 days. This is different from how the most-used-L2 answer page treats weekly DAA (which uses a calendar-week unique-address count). For supply, weekly and monthly use the per-chain timeseries\' native period buckets — those are calendar-aligned.',
  },
  {
    q: 'Where can I see live L2 stablecoin data?',
    a: 'growthepie\'s [stablecoins-by-chain quick-bite](https://www.growthepie.com/quick-bites/stables-by-chain) lists every stablecoin on every supported chain with live supply timeseries. The [stablecoin market cap dashboard](https://www.growthepie.com/fundamentals/stablecoin-market-cap) shows aggregate supply trends across chains, and the [blockspace overview](https://www.growthepie.com/blockspace/chain-overview) shows category-level activity (including stablecoins) per chain.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/most-stablecoin-activity-ethereum-l2';
const ORG_ID = 'https://www.growthepie.com/#organization';
const L2_TEMPORAL_COVERAGE = '2021-01-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-stablecoin-supply',
    name: 'Ethereum L2 Stablecoin Supply (per chain, daily)',
    description:
      'Daily, weekly, and monthly total circulating stablecoin supply (USD) for every tracked Ethereum L2.',
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
      'Stablecoins',
      'Market cap',
      'Supply',
      'USDC',
      'USDT',
      'DAI',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain sum of circulating supply (USD) across every tracked stablecoin on the chain, aggregated daily and exposed as period-native daily / weekly / monthly snapshots. Weekly and monthly values are end-of-period snapshots (supply is a stock, not a flow).',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'stablecoin_supply_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/stables_mcap.json',
        description: 'All chains, daily/weekly/monthly stablecoin supply.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-stablecoin-blockspace',
    name: 'Ethereum L2 Stablecoin Transactions and Gas Spent (per chain)',
    description:
      'Daily, 7-day, and 30-day rollups of stablecoin transaction count and gas spent on stablecoin transfers per Ethereum L2.',
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
      'Stablecoins',
      'Transactions',
      'Blockspace',
      'Gas fees',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain aggregation of transactions classified as stablecoin transfers (a subcategory of `token_transfers` in growthepie\'s blockspace classification). Reports `txcount_absolute` (count of stablecoin txs) and `gas_fees_absolute_usd` (gas spent on those txs, USD). Daily uses the latest completed UTC day; weekly is a 7-day rolling sum; monthly is a 30-day rolling sum.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'stablecoin_tx_count' },
      { '@type': 'PropertyValue', name: 'stablecoin_gas_spent_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/answers/stablecoin-activity.json',
        description:
          'Precomputed daily on the backend from the blockspace stablecoin subcategory (`data.token_transfers.subcategories.stablecoin`); exposes per-period top L2s by transaction count and gas spent.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-stablecoin-variety',
    name: 'Ethereum L2 Stablecoin Variety (distinct tokens per chain)',
    description:
      'Count of distinct stablecoin tokens deployed on each Ethereum L2 — a breadth signal for stablecoin coverage.',
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
      'Stablecoins',
      'Token coverage',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Row count of growthepie\'s per-chain stablecoin table. Each row is a distinct stablecoin token deployed on the chain (symbol, issuer, fiat backing). Stablecoins with negligible supply are still counted if they\'re tracked.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'distinct_stablecoin_count' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/quick-bites/stablecoins/chains/table_{chain}.json',
        description:
          'One file per chain; row count = number of distinct stablecoins deployed on that chain.',
      },
    ],
  },
];

const mostStablecoinActivityEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 has the most stablecoin activity?',
  subtitle:
    'A direct, data-backed answer across stablecoin supply, transactions, gas spent — plus the chain hosting the widest variety of stablecoins.',
  shortTitle: 'Top Stablecoin L2',
  summary:
    "The most stablecoin-active Ethereum L2 depends on what you measure. Supply, transactions, gas spent, and variety each tell different stories. growthepie's live leaderboards rank every tracked L2 across daily / weekly / monthly windows for the first three metrics, plus a static ranking of distinct stablecoin tokens deployed per chain. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_stables_data_date}} UTC):** By stablecoin supply the leader is {{l2_stables_supply_daily_leader}}. By daily stablecoin transactions: {{l2_stables_txcount_daily_leader}}. By gas spent on stablecoins: {{l2_stables_gas_spent_daily_leader}}. By distinct stablecoin variety: {{l2_stables_variety_leader}}. Weekly and monthly leaders may differ — see the per-metric leaderboards below.",

    "> Updated daily — every leaderboard on this page is recomputed from growthepie's public API. Daily values use the latest available day; weekly and monthly use the most recent **completed** period (or for blockspace metrics, the latest 7d / 30d rolling window).",

    '# How we measure "stablecoin activity"',
    'We rank Ethereum L2s by four dimensions that capture different facets of stablecoin presence:',
    '- **Stablecoin supply** — total USD value of every stablecoin parked on the chain. A balance-sheet signal; the chain with the most stablecoins as a store of value.',
    '- **Stablecoin transactions** — count of stablecoin transfers per period. A velocity signal; how often the stablecoins on the chain actually move.',
    '- **Gas spent on stablecoins** — fee revenue (USD) the chain earned from stablecoin transactions. A monetization signal; how economically important stablecoins are to the chain.',
    '- **Variety** — number of distinct stablecoin tokens deployed on the chain. A breadth signal; how many issuers and currencies are represented (USDC, USDT, DAI, PYUSD, EURC, etc.).',

    '# Live leaderboard: stablecoin supply',
    '{{l2_stables_supply_dense}}',

    '# Live leaderboard: stablecoin transactions',
    '{{l2_stables_txcount_dense}}',

    '# Live leaderboard: gas spent on stablecoins',
    '{{l2_stables_gas_spent_dense}}',

    '# Live leaderboard: variety of stablecoins',
    '{{l2_stables_variety_dense}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. For **stablecoin supply**, pull the per-chain endpoint (`/v1/metrics/chains/{chain}/stables_mcap.json`) — daily / weekly / monthly aggregations exposed natively, USD column.",
    "3. For **stablecoin transactions and gas spent**, pull the precomputed answer endpoint (`/v1/answers/stablecoin-activity.json`). The backend recomputes it daily from the blockspace stablecoin subcategory (`data.token_transfers.subcategories.stablecoin`): daily = latest day, weekly = 7-day rolling sum, monthly = 30-day rolling sum — using `txcount_absolute` for transactions and `gas_fees_absolute_usd` for gas spent. (This replaces directly downloading the ~43MB `category_comparison.json` from the page.)",
    "4. For **stablecoin variety**, pull the quick-bite table (`/v1/quick-bites/stablecoins/chains/table_{chain}.json`) and count the rows.",
    "5. Sort the chains by raw value for each ranking and take the top 3.",

    "All rankings on this page pull live from growthepie's public API and refresh daily; the values shown above were generated on {{l2_stables_data_date}} UTC:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Per-chain stablecoin supply (daily / weekly / monthly): `https://api.growthepie.com/v1/metrics/chains/{chain}/stables_mcap.json`',
    '- Precomputed stablecoin activity (txs + gas spent, recomputed daily from the blockspace stablecoin subcategory): `https://api.growthepie.com/v1/answers/stablecoin-activity.json`',
    '- Per-chain stablecoin table (variety / distinct token count): `https://api.growthepie.com/v1/quick-bites/stablecoins/chains/table_{chain}.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the rankings above. Rankings are computed mechanically from public API data — chains do not pay for inclusion or placement, and supporters do not receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent stablecoin data sources you can compare against include [DefiLlama's stablecoins dashboard](https://defillama.com/stablecoins) (per-chain supply with issuer-level breakdown) and [Artemis](https://www.artemis.xyz/) (chain-level stablecoin metrics). When rankings disagree, the underlying inclusion list (which stablecoins count? does the source include synthetic dollars like crvUSD?) is usually the source of the difference.",
    '',
    '# Which chains are included?',
    "While growthepie tracks stablecoins on every L2 it covers, our detailed leaderboards focus on the most widely used and adopted chains. The list of **{{l2_stables_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_stables_universe_list}}.",
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
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/quick-bites/stables-by-chain for the live Ethereum L2 stablecoin leaderboards.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/stablecoin-market-cap' },
    {
      name: 'Stablecoins',
      url: '/fundamentals/stablecoin-market-cap',
    },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-stablecoinmarketcap',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostStablecoinActivityEthereumL2;
