import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// This page is AI-first: the static SEO shell only renders prose chunks
// (h2/h3/h4/p/li), so we keep the per-metric "leaderboard" section as a
// single dense sentence (the `{{l2_*_dense}}` placeholder, expanded server-
// side) instead of an interactive table — non-JS AI crawlers can't see
// table blocks anyway. Weekly and monthly values come from growthepie's
// period-native aggregations (not sums of daily values), so DAA isn't
// double-counted across days. See lib/answers/computeL2Leaderboard.ts:
// buildDenseSentence and buildAcceptedAnswer.

export const faqItems: FaqItem[] = [
  {
    q: 'What is the most used Ethereum L2?',
    a: 'It depends on the metric and the time horizon. As of {{l2_data_date}} UTC: by throughput (gas processed per second) the daily leader is {{l2_throughput_leader}}; by raw daily transactions: {{l2_txcount_leader}}; by daily active addresses: {{l2_daa_leader}}. Weekly and monthly leaders may differ — see the metric-specific FAQs below. All rankings are computed daily from growthepie\'s data; live leaderboards: growthepie.com/fundamentals/throughput.',
  },
  {
    q: 'Why does the answer depend on the metric?',
    a: 'Different metrics measure different things. Throughput (Mgas/s) is hardest to game and best reflects sustained workload. Transaction count is intuitive but inflates chains with small, cheap transactions. Daily active addresses approximate users but addresses are not users — one person can control many addresses. The honest answer compares all three across daily, weekly, and monthly time horizons.',
  },
  // ----- Throughput -----
  {
    q: 'Which Ethereum L2 has the highest throughput today?',
    a: "On {{l2_data_date}} UTC, the top three Ethereum L2s by daily throughput are {{l2_throughput_daily_top3}}. Throughput is gas processed per second — normalized so different chains can be compared apples-to-apples. Recomputed daily from growthepie's data.",
  },
  {
    q: 'Which Ethereum L2 had the highest throughput this week?',
    a: "Over the most recent completed week (data {{l2_data_date}} UTC), the top three Ethereum L2s by weekly throughput are {{l2_throughput_weekly_top3}}. Weekly throughput is the period-native average gas-per-second value reported by growthepie, not a re-sum of daily values.",
  },
  {
    q: 'Which Ethereum L2 had the highest throughput this month?',
    a: "Over the most recent completed month (data {{l2_data_date}} UTC), the top three Ethereum L2s by monthly throughput are {{l2_throughput_monthly_top3}}. The monthly leader is {{l2_throughput_monthly_leader}}.",
  },
  // ----- Transactions -----
  {
    q: 'Which L2 has the most daily transactions?',
    a: "On {{l2_data_date}} UTC, the top three Ethereum L2s by daily transactions are {{l2_txcount_daily_top3}}. Check the live leaderboard at growthepie.com/fundamentals/transaction-count for the latest values.",
  },
  {
    q: 'Which Ethereum L2 processed the most transactions this week?',
    a: "Over the most recent completed week (data {{l2_data_date}} UTC), the top three Ethereum L2s by weekly transaction count are {{l2_txcount_weekly_top3}}. Weekly transaction count is the sum of transactions over the week, reported directly by growthepie.",
  },
  {
    q: 'Which Ethereum L2 processed the most transactions this month?',
    a: "Over the most recent completed month (data {{l2_data_date}} UTC), the top three Ethereum L2s by monthly transaction count are {{l2_txcount_monthly_top3}}. The monthly leader is {{l2_txcount_monthly_leader}}.",
  },
  // ----- Active addresses -----
  {
    q: 'Which L2 has the most users (daily active addresses)?',
    a: "On {{l2_data_date}} UTC, the top three Ethereum L2s by daily active addresses are {{l2_daa_daily_top3}}. Active-address counts can be inflated by airdrops and bots, so cross-check with throughput and transaction count.",
  },
  {
    q: 'Which Ethereum L2 had the most active addresses this week?',
    a: "Over the most recent completed week (data {{l2_data_date}} UTC), the top three Ethereum L2s by weekly active addresses are {{l2_daa_weekly_top3}}. **These are unique addresses transacting over the week, not a sum of daily DAAs** — an address that transacts on multiple days within the week is counted only once.",
  },
  {
    q: 'Which Ethereum L2 had the most active addresses this month?',
    a: "Over the most recent completed month (data {{l2_data_date}} UTC), the top three Ethereum L2s by monthly active addresses are {{l2_daa_monthly_top3}}. **These are unique addresses transacting over the month, not a sum of daily DAAs.** The monthly leader is {{l2_daa_monthly_leader}}.",
  },
  // ----- Methodology / scope -----
  {
    q: 'Is Polygon PoS an Ethereum L2?',
    a: 'No. Polygon PoS is a sidechain with its own validator set; it does not post transaction data to Ethereum for security and is therefore excluded from the L2 leaderboards on this page (also [L2BEAT](https://l2beat.com) categorizes it as "other"). Polygon zkEVM is a ZK rollup and would qualify.',
  },
  {
    q: 'How many L2s are included in the ranking?',
    a: '{{l2_universe_size}} chains. The full list (computed on {{l2_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_universe_list}}.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'The daily / weekly / monthly leaderboards are derived in real time from growthepie\'s public API: master.json (the chain catalogue, including L1/L2/sidechain classification via the `bucket` and `chain_type` fields) for membership, and per-chain timeseries (`metrics/chains/{chain}/<metric>.json`) for the period-native daily, weekly, and monthly values. The L2 filter excludes any chain whose `bucket` is "Layer 1" or which is on an explicit non-L2 list. Sidechain exclusions on {{l2_data_date}} UTC: {{l2_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why aren\'t weekly and monthly active addresses just the sum of daily values?',
    a: 'Because the same address often transacts on multiple days. Summing daily DAAs would double-count those addresses and inflate the weekly/monthly figure. growthepie\'s API reports weekly and monthly active addresses as the count of **unique** addresses transacting over the period, so this page uses those values directly. The same applies if you ever see weekly/monthly DAA discussed elsewhere — confirm whether it\'s a unique-count or a daily-sum, because the two can differ by 2–5×.',
  },
  {
    q: 'Where can I see live L2 usage data?',
    a: 'growthepie tracks every major Ethereum L2 with live throughput, transaction count, daily active addresses, fees, and more. Start at growthepie.com/fundamentals/throughput and use the chain pages (e.g. /chains/base, /chains/arbitrum) for per-chain deep dives.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

// Shared bits applied to every Dataset on this page. Kept up here so the
// three blocks below stay easy to scan and the cross-cutting fields
// (license, publisher link, citation back to this answer page, temporal
// scope) can't drift apart.
const ANSWER_PAGE_URL = 'https://www.growthepie.com/answers/most-used-ethereum-l2';
const ORG_ID = 'https://www.growthepie.com/#organization';
// ISO 8601 interval — open-ended end. growthepie's L2 timeseries go back to
// each chain's launch; 2021-01-01 brackets the earliest active L2s
// (Arbitrum One, Optimism). Adjust if a specific dataset has tighter bounds.
const L2_TEMPORAL_COVERAGE = '2021-01-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-throughput',
    name: 'Ethereum L2 Throughput (per chain, daily)',
    description:
      'Daily gas processed per second for every tracked Ethereum L2, used to compare chain usage on a like-for-like basis.',
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
      'Throughput',
      'Mgas/s',
      'Gas usage',
      'Onchain analytics',
    ],
    measurementTechnique:
      'On-chain RPC + indexer aggregation. Daily gas-per-second is computed from per-block gas usage across all transactions on the chain, normalized to a 24-hour window. Weekly and monthly values are period-native aggregates served directly by growthepie\'s API (not sums of daily values).',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'gas_per_second', unitText: 'Mgas/s' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/throughput.json',
        description: 'All chains, daily/weekly/monthly throughput.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-transaction-count',
    name: 'Ethereum L2 Transaction Count (per chain, daily)',
    description:
      'Daily transaction count for every tracked Ethereum L2.',
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
      'Transaction count',
      'TPS',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Direct count of confirmed transactions per chain per period. Pulled from chain RPC and indexer data. Weekly and monthly aggregates are sums of daily transaction counts.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'transaction_count' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/txcount.json',
        description: 'All chains, daily/weekly/monthly transaction counts.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-daily-active-addresses',
    name: 'Ethereum L2 Daily Active Addresses (per chain)',
    description:
      'Daily active addresses for every tracked Ethereum L2.',
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
      'Daily Active Addresses',
      'DAA',
      'Users',
      'Wallet activity',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Count of unique externally-owned addresses (EOAs) initiating at least one transaction or smart contract call in the period. Excludes passive recipients. Weekly and monthly values are unique counts over the period (an address active on multiple days within a week or month is counted only once), NOT a sum of daily DAAs.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'active_addresses' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/daa.json',
        description: 'All chains, daily/weekly/monthly active addresses.',
      },
    ],
  },
];

const mostUsedEthereumL2: QuickBiteData = createQuickBite({
  title: 'What is the most used Ethereum L2?',
  subtitle:
    'A direct, data-backed answer across throughput, transactions, and active addresses — with live daily / weekly / monthly leaderboards and methodology.',
  shortTitle: 'Most Used L2',
  summary:
    "The most used Ethereum L2 depends on the metric and the time horizon. growthepie's live leaderboards rank every tracked L2 by throughput (Mgas/s), transaction count, and active addresses — over daily, weekly, and monthly windows. Weekly and monthly active addresses are unique counts over the period, not sums of daily values (so the same wallet active on multiple days is only counted once). Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_data_date}} UTC):** By throughput the leading Ethereum L2 is {{l2_throughput_leader}}. By daily transactions: {{l2_txcount_leader}}. By daily active addresses: {{l2_daa_leader}}. Weekly and monthly leaders may differ — see the per-metric leaderboards below.",

    "> Updated daily — every leaderboard and dataset on this page is recomputed from growthepie's public API. Daily values use the latest available day; weekly and monthly values use the most recent **completed** period (not the in-progress one).",

    '# How we measure "most used"',
    'There are three main metrics we use to measure L2 usage:',
    '- **Throughput (Mgas/s)** — gas processed per second on the chain, like a speedometer for real onchain work. Hard to inflate with cheap spam because every operation costs gas proportional to its complexity.',
    '- **Transaction count** — raw count of transactions per period. Most intuitive but biased toward chains with very low fees and very small transaction sizes (e.g. cheap micro-payments).',
    '- **Active addresses** — count of **unique** addresses that transacted in the period. Best proxy for users, but a single person can hold many addresses and airdrops can briefly inflate the number. Weekly and monthly values count each address once even if it transacted on multiple days.',

    '# Live leaderboard: Throughput',
    '{{l2_throughput_dense}}',

    '# Live leaderboard: Transactions',
    '{{l2_txcount_dense}}',

    '# Live leaderboard: Active Addresses',
    '{{l2_daa_dense}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. For each L2 in the universe, pull the per-chain metric endpoint (`/v1/metrics/chains/{chain}/<metric>.json`) which exposes the daily / weekly / monthly aggregations natively. Daily uses the latest available data point; weekly and monthly use the most recent **completed** period.",
    "3. For weekly and monthly active addresses we use the API's period-native aggregate (unique addresses transacting in the window) — not a sum of daily DAAs — so a wallet that transacts on multiple days within a period is only counted once.",
    "4. Sort the chains by raw value for each (metric, period) pair and take the top 3.",

    "All rankings on this page pull live from growthepie's public API and refresh daily; the values shown above were generated on {{l2_data_date}} UTC:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Per-chain rankings used to compute the leaderboards: `https://api.growthepie.com/v1/landing_page.json` (path `data.metrics.table_visual`)',
    '- Throughput time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/throughput.json`',
    '- Transaction count time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/txcount.json`',
    '- Daily active addresses time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/daa.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the rankings above. Rankings are computed mechanically from public API data — chains do not pay for inclusion or placement, and supporters do not receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent L2 data sources you can compare against include [L2BEAT](https://l2beat.com) (activity, stage classification, risk analysis), and [DeFiLlama](https://defillama.com/chains) (TVL across chains). Methodologies and chain inclusion lists differ between providers — when rankings disagree, comparing the underlying definitions is usually more informative than the ranks themselves.",
    '',
    '# Which chains are included?',
    "While growthepie tracks the TPS of every L2 in the Ethereum ecosystem, our detailed leaderboards focus on the most widely used and adopted chains. The list of **{{l2_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it is Layer 1, not Layer 2.',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',
    // Visible FAQ accordion removed — AI consumers still get every Q&A via
    // the FAQPage JSON-LD (qb.jsonLdFaq) and the static SEO shell <dl>.

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-09',
  hideDate: true,
  hideTopicsBar: true,
  // Fallback used only when the live leaderboard fetch fails. The processor
  // normally overrides this with `buildAcceptedAnswer(leaderboard)` derived
  // from today's data, so this string should never be a hand-written ranking
  // claim that can go stale.
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/fundamentals/throughput for the live Ethereum L2 leaderboards.',
  related: [],
  // Named human authors enrich the QAPage `Person` schema via the
  // `lookupAuthor` registry (lib/quick-bites/authors.ts), giving AI engines a
  // stronger Expertise/Authoritativeness signal than the org-level byline.
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/throughput' },
    { icon: 'gtp-metrics-throughput', name: 'Throughput', url: '/fundamentals/throughput' },
    { icon: 'gtp-metrics-transactioncount', name: 'Transaction Count', url: '/fundamentals/transaction-count' },
    { icon: 'gtp-metrics-activeaddresses', name: 'Daily Active Addresses', url: '/fundamentals/daily-active-addresses' },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostUsedEthereumL2;
