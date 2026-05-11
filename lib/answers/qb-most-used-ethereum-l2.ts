import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Charts are no longer hand-built here. The processor expands the
// `{{l2_*_chart}}` placeholders below into ```chart``` fenced blocks whose
// series are exactly the top-5 entries on each leaderboard, so the visible
// chart and the prose ranking always agree. See lib/answers/articleProcessor.ts
// and lib/answers/computeL2Leaderboard.ts:buildChartFencedBlock.

export const faqItems: FaqItem[] = [
  {
    q: 'What is the most used Ethereum L2?',
    a: 'It depends on the metric. Today by throughput (gas processed per second) the leader is {{l2_throughput_leader}}. By raw daily transactions: {{l2_txcount_leader}}. By daily active addresses: {{l2_daa_leader}}. These rankings are computed every day from growthepie\'s data — see the methodology section for the full L2 universe and exclusions. Live leaderboards: growthepie.com/fundamentals/throughput.',
  },
  {
    q: 'Why does the answer depend on the metric?',
    a: 'Different metrics measure different things. Throughput (Mgas/s) is hardest to game and best reflects sustained workload. Transaction count is intuitive but inflates chains with small, cheap transactions. Daily active addresses approximate users but addresses are not users — one person can control many addresses. The honest answer compares all three.',
  },
  {
    q: 'Which Ethereum L2 has the highest throughput?',
    a: "Today's top three by throughput are {{l2_throughput_top3}}. Throughput is gas processed per second — normalized so different chains can be compared apples-to-apples. This list is recomputed daily from growthepie's data.",
  },
  {
    q: 'Which L2 has the most daily transactions?',
    a: "Today's top three by daily transactions are {{l2_txcount_top3}}. Always check the live leaderboard at growthepie.com/fundamentals/transaction-count for the very latest values.",
  },
  {
    q: 'Which L2 has the most users (daily active addresses)?',
    a: "Today's top three by daily active addresses are {{l2_daa_top3}}. Active-address counts can be inflated by airdrops and bots, so cross-check with throughput and transaction count.",
  },
  {
    q: 'Is Polygon PoS an Ethereum L2?',
    a: 'No. Polygon PoS is a sidechain with its own validator set; it does not post transaction data to Ethereum for security and is therefore excluded from the L2 leaderboards on this page (and from L2BEAT). Polygon zkEVM is a ZK rollup and would qualify.',
  },
  {
    q: 'How many L2s are included in the ranking?',
    a: '{{l2_universe_size}} chains. The full list (computed today from growthepie\'s master chain catalogue) is: {{l2_universe_list}}.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'The leaderboards are derived in real time from two growthepie endpoints: master.json (the chain catalogue, including L1/L2/sidechain classification via the `bucket` and `chain_type` fields) and landing_page.json (the per-chain rankings used by the homepage tables). The L2 filter excludes any chain whose `bucket` is "Layer 1" or which is on an explicit non-L2 list. Today\'s active sidechain exclusions: {{l2_excluded_sidechains}}. No editorial overrides.',
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

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Ethereum L2 Throughput (per chain, daily)',
    description:
      'Daily gas processed per second for every tracked Ethereum L2, used to compare chain usage on a like-for-like basis.',
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@type': 'Organization', name: 'growthepie' },
    isAccessibleForFree: true,
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
    name: 'Ethereum L2 Transaction Count (per chain, daily)',
    description:
      'Daily transaction count for every tracked Ethereum L2.',
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@type': 'Organization', name: 'growthepie' },
    isAccessibleForFree: true,
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
    name: 'Ethereum L2 Daily Active Addresses (per chain)',
    description:
      'Daily active addresses for every tracked Ethereum L2.',
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@type': 'Organization', name: 'growthepie' },
    isAccessibleForFree: true,
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
    'A direct, data-backed answer across throughput, transactions, and active addresses — with live charts and methodology.',
  shortTitle: 'Most Used L2',
  summary:
    "The most used Ethereum L2 depends on the metric. growthepie's live leaderboards rank every tracked L2 by throughput (Mgas/s), daily transactions, and daily active addresses — this page shows all three with methodology, computed daily from growthepie's data. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded.",
  content: [
    "**Short answer:** By throughput, the leading Ethereum L2 is currently {{l2_throughput_leader}}. By daily transactions: {{l2_txcount_leader}}. By daily active addresses: {{l2_daa_leader}}. Computed from today's growthepie data.",

    "> Updated daily — every leaderboard, chart, and dataset on this page is recomputed from growthepie's public API. The numbers above reflect the most recent day for which all chains have reported data.",

    '# How we measure "most used"',
    'There three main metrics we use to measure L2 usage:',
    '- **Throughput (Mgas/s)** — gas processed per second on the chain, like a speedometer for real onchain work. Hard to inflate with cheap spam because every operation costs gas proportional to its complexity.',
    '- **Daily transactions** — raw count of transactions per day. Most intuitive but biased toward chains with very low fees and very small transaction sizes (e.g. cheap micro-payments).',
    '- **Daily active addresses (DAA)** — count of unique addresses that transacted that day. Best proxy for users, but a single person can hold many addresses and airdrops can briefly inflate the number.',

    '# Live leaderboard: Throughput',
    "**Top 5 by throughput today:** {{l2_throughput_top5}}.",
    '{{l2_throughput_chart}}',

    '# Live leaderboard: Daily Transactions',
    "**Top 5 by daily transactions today:** {{l2_txcount_top5}}.",
    '{{l2_txcount_chart}}',

    '# Live leaderboard: Daily Active Addresses',
    "**Top 5 by daily active addresses today:** {{l2_daa_top5}}.",
    '{{l2_daa_chart}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. Pull the [per-chain rankings](https://api.growthepie.com/v1/landing_page.json) — specifically `data.metrics.table_visual[chain].ranking[metric]`. This is the same ranking used by the growthepie homepage tables.",
    "3. Sort the chains by raw value for each metric and take the top entries.",

    "All charts and rankings on this page pull live from growthepie's public API and refresh daily:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Per-chain rankings used to compute the leaderboards: `https://api.growthepie.com/v1/landing_page.json` (path `data.metrics.table_visual`)',
    '- Throughput time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/throughput.json`',
    '- Transaction count time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/txcount.json`',
    '- Daily active addresses time series: `https://api.growthepie.com/v1/metrics/chains/{chain}/daa.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
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
  author: [
    {
      name: 'growthepie research analysts',
      xUsername: 'growthepie_eth',
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
