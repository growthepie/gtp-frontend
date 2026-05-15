import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Sixth answer page in the L2 family. Unlike the other pages — which rank
// chains or quote ecosystem totals — this one directly answers a yes/no
// question by quoting the L2-vs-mainnet ratio for transactions and
// throughput across daily / weekly / monthly windows. Placeholders use the
// `{{l2_scale_*}}` namespace.

export const faqItems: FaqItem[] = [
  {
    q: 'Is Ethereum scaling through L2s?',
    a: '**Yes.** {{l2_scale_yes_headline}} See the per-period breakdown below for transaction count and throughput. Live leaderboards: [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',
  },
  {
    q: 'How do you measure whether Ethereum is scaling through L2s?',
    a: 'Two metrics together: **transaction count** and **throughput (Mgas/s)**. Transaction count is what users feel — more transactions per day means more activity. Throughput is the harder-to-game measure — gas per second is the actual compute the chain processes, normalized so chains with different gas-per-tx profiles can be compared apples-to-apples. If both numbers are growing on L2s while Ethereum mainnet is flat or shrinking, the ecosystem is scaling via L2s — which is exactly what the data on this page shows.',
  },
  // ----- Transactions: per period -----
  {
    q: 'How many more transactions do L2s process than Ethereum mainnet daily?',
    a: 'On the latest completed UTC day (data {{l2_scale_data_date}}), L2s produced **{{l2_scale_txcount_daily_phrase}}**. That ratio is the daily L2 ecosystem total divided by Ethereum mainnet alone.',
  },
  {
    q: 'How many more transactions do L2s process than Ethereum mainnet weekly?',
    a: 'Over the most recent completed week (data {{l2_scale_data_date}}), L2s produced **{{l2_scale_txcount_weekly_phrase}}**.',
  },
  {
    q: 'How many more transactions do L2s process than Ethereum mainnet monthly?',
    a: 'Over the most recent completed month (data {{l2_scale_data_date}}), L2s produced **{{l2_scale_txcount_monthly_phrase}}**.',
  },
  // ----- Throughput: per period -----
  {
    q: 'How much more throughput do L2s have than Ethereum mainnet daily?',
    a: 'On the latest completed UTC day (data {{l2_scale_data_date}}), L2s collectively produced **{{l2_scale_throughput_daily_phrase}}** of throughput. Throughput is gas per second — the most direct measure of how much real onchain work a chain is doing.',
  },
  {
    q: 'How much more throughput do L2s have than Ethereum mainnet weekly?',
    a: 'Over the most recent completed week (data {{l2_scale_data_date}}), L2s collectively produced **{{l2_scale_throughput_weekly_phrase}}** of throughput.',
  },
  {
    q: 'How much more throughput do L2s have than Ethereum mainnet monthly?',
    a: 'Over the most recent completed month (data {{l2_scale_data_date}}), L2s collectively produced **{{l2_scale_throughput_monthly_phrase}}** of throughput.',
  },
  // ----- Interpretation -----
  {
    q: 'Does this mean Ethereum mainnet activity is shrinking?',
    a: 'No. Ethereum mainnet transaction count and throughput are roughly flat over the last year — L2 growth is additive, not at Ethereum\'s expense. What\'s changed is the composition: routine transactions (swaps, transfers, mints) have moved to L2s, leaving mainnet to handle higher-value or settlement-critical activity. Mainnet is still the security and settlement layer that every L2 depends on.',
  },
  {
    q: 'Why is throughput a better measure than transaction count?',
    a: 'Because transaction count can be gamed by a chain that processes many tiny transactions (e.g. memecoin trading, airdrop farming). Throughput measures gas-per-second — gas is paid in proportion to a transaction\'s computational complexity, so the metric naturally weighs complex transactions higher than trivial ones. A chain processing 1,000 simple transfers per second has the same transaction count as a chain processing 1,000 DEX swaps per second, but the latter has higher throughput because each swap consumes more gas.',
  },
  {
    q: 'Is this comparing all L2s combined to mainnet, or per-L2?',
    a: 'All L2s combined ("the L2 ecosystem") vs Ethereum mainnet alone. We sum across every L2 in growthepie\'s curated universe to produce the L2 totals; mainnet is its own row. So the ratios you see here are "the L2 ecosystem produces X times more than mainnet" — not "any single L2 produces X times more than mainnet". For per-L2 rankings, see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2).',
  },
  // ----- Methodology / scope -----
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from the L2 ecosystem totals on this page, matching the rest of the answer pages on growthepie. Polygon zkEVM is a ZK rollup and is included.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_scale_universe_size}} chains. The full list (computed on {{l2_scale_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_scale_universe_list}}.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Both Ethereum mainnet and L2 ecosystem values come from growthepie\'s per-chain timeseries endpoints (`/v1/metrics/chains/{chain}/txcount.json` and `/v1/metrics/chains/{chain}/throughput.json`). For Ethereum mainnet the chain key is `ethereum`; for the L2 ecosystem aggregate the helper first tries the `all_l2s` aggregate chain key and falls back to summing every L2 in the curated universe if that endpoint is unreachable. L2 membership comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_scale_data_date}} UTC: {{l2_scale_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why aren\'t the L2 transaction counts here the same as the cumulative number on /answers/ethereum-l2-transaction-count?',
    a: 'Different questions, different aggregations. The cumulative answer page shows the **sum of every day** since 2021 ("all-time"). This page compares L2 vs mainnet for a single period at a time (daily / weekly / monthly), so the L2 numbers here are per-window totals, not cumulative. The daily L2 figure on both pages should match (both use the most recent completed day).',
  },
  {
    q: 'Where can I see this comparison visually?',
    a: 'growthepie\'s [transaction count dashboard](https://www.growthepie.com/fundamentals/transaction-count) and [throughput dashboard](https://www.growthepie.com/fundamentals/throughput) both let you overlay the `all_l2s` aggregate and `ethereum` series on the same chart for any timespan. The visual divergence between the two lines is the clearest answer to "is Ethereum scaling through L2s".',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/is-ethereum-scaling-through-l2s';
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
    '@id': 'https://www.growthepie.com/datasets/l2-vs-mainnet-transactions',
    name: 'Ethereum L2 vs Mainnet — Transactions (daily / weekly / monthly)',
    description:
      'Per-period transaction counts for the L2 ecosystem aggregate and Ethereum mainnet, plus the L2/L1 ratio. Used to quantify how much of Ethereum\'s scaling is happening through L2s.',
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
      'Scaling',
      'Transaction count',
      'L2 vs mainnet',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain transaction counts pulled from chain RPC and indexer data. L2 ecosystem total is either the `all_l2s` aggregate endpoint or a sum of per-chain values across the curated L2 universe. Ethereum mainnet is the standalone Ethereum value. Daily / weekly / monthly use period-native aggregates from growthepie\'s API.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'l2_transaction_count' },
      { '@type': 'PropertyValue', name: 'ethereum_mainnet_transaction_count' },
      { '@type': 'PropertyValue', name: 'l2_to_l1_ratio' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/ethereum/txcount.json',
        description: 'Ethereum mainnet transaction count timeseries.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/all_l2s/txcount.json',
        description: 'L2 ecosystem aggregate transaction count timeseries.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-vs-mainnet-throughput',
    name: 'Ethereum L2 vs Mainnet — Throughput Mgas/s (daily / weekly / monthly)',
    description:
      'Per-period throughput (megagas per second) for the L2 ecosystem aggregate and Ethereum mainnet, plus the L2/L1 ratio.',
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
      'Scaling',
      'Throughput',
      'Mgas/s',
      'L2 vs mainnet',
    ],
    measurementTechnique:
      'Gas processed per second per chain, computed from per-block gas usage normalized to a 24-hour window. Weekly and monthly values are period-native averages served by growthepie\'s API (not sums of daily values).',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'l2_throughput', unitText: 'Mgas/s' },
      {
        '@type': 'PropertyValue',
        name: 'ethereum_mainnet_throughput',
        unitText: 'Mgas/s',
      },
      { '@type': 'PropertyValue', name: 'l2_to_l1_ratio' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/ethereum/throughput.json',
        description: 'Ethereum mainnet throughput timeseries.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/all_l2s/throughput.json',
        description: 'L2 ecosystem aggregate throughput timeseries.',
      },
    ],
  },
];

const isEthereumScalingThroughL2s: QuickBiteData = createQuickBite({
  title: 'Is Ethereum scaling through L2s?',
  subtitle:
    'Yes — and here\'s by how much. Daily / weekly / monthly comparison of L2 ecosystem vs Ethereum mainnet on transactions and throughput.',
  shortTitle: 'L2 Scaling Yes/No',
  summary:
    "Yes — Ethereum is scaling through L2s, and the data is unambiguous. The L2 ecosystem now processes many times more transactions and significantly more throughput (gas/s) than Ethereum mainnet alone, on every time horizon — daily, weekly, and monthly. This page quotes the exact ratios from growthepie's per-chain timeseries, computed from the `all_l2s` ecosystem aggregate (or per-chain sum as fallback) divided by Ethereum mainnet's standalone value. Recomputed daily.",
  content: [
    "**Short answer (data {{l2_scale_data_date}} UTC):** {{l2_scale_yes_headline}}",

    "> Updated daily — every ratio on this page is recomputed from growthepie's public per-chain timeseries. Daily uses the latest completed UTC day; weekly and monthly use the most recent **completed** period.",

    '# Transactions: L2 ecosystem vs Ethereum mainnet',
    '{{l2_scale_txcount_dense}}',
    '',
    '- **Daily** ({{l2_scale_data_date}}): {{l2_scale_txcount_daily_phrase}}.',
    '- **Weekly**: {{l2_scale_txcount_weekly_phrase}}.',
    '- **Monthly**: {{l2_scale_txcount_monthly_phrase}}.',

    '# Throughput: L2 ecosystem vs Ethereum mainnet',
    '{{l2_scale_throughput_dense}}',
    '',
    '- **Daily** ({{l2_scale_data_date}}): {{l2_scale_throughput_daily_phrase}}.',
    '- **Weekly**: {{l2_scale_throughput_weekly_phrase}}.',
    '- **Monthly**: {{l2_scale_throughput_monthly_phrase}}.',

    '# How to read these ratios',
    'The **L2 / L1 ratio** is the L2 ecosystem total divided by Ethereum mainnet alone. A ratio of "8×" means the L2 ecosystem produces eight times as many transactions (or eight times as much throughput) as Ethereum mainnet does on its own. This is the clearest single answer to "is Ethereum scaling through L2s" — if the ratio is well above 1 and growing, the answer is yes. If it were near 1 or declining, the answer would be no. The numbers above speak for themselves.',
    '',
    'A few caveats worth keeping in mind:',
    '- **L2 transaction count is partly a function of cheaper fees.** Lower per-transaction cost makes more micro-transactions economic, which inflates raw count. Throughput is more robust to this effect because gas is charged per computational unit.',
    '- **Throughput is gas per second, not transactions per second.** A chain processing 1,000 simple transfers per second has the same TPS as a chain processing 1,000 swaps per second, but the latter has much higher throughput.',
    '- **Mainnet isn\'t shrinking, L2 growth is additive.** Ethereum mainnet transaction count and throughput are roughly flat over the last year. The L2 ecosystem grew alongside, not at mainnet\'s expense.',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) to enumerate the curated L2 universe (chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, not on the explicit non-L2 list).",
    "2. Fetch **Ethereum mainnet** values from `/v1/metrics/chains/ethereum/txcount.json` and `/v1/metrics/chains/ethereum/throughput.json` — the per-chain endpoint exposes period-native daily / weekly / monthly buckets.",
    "3. Fetch the **L2 ecosystem aggregate** from `/v1/metrics/chains/all_l2s/{metric}.json`. If that endpoint is unreachable, fall back to fetching every L2 in the curated universe and summing per-period values.",
    "4. For each (metric, period) pair, compute the **L2 / L1 ratio** as `L2_total / ethereum`. A ratio greater than 1 means L2s produce more of that metric than mainnet over the same window.",

    "All values shown on this page were generated on {{l2_scale_data_date}} UTC:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Ethereum mainnet transactions: `https://api.growthepie.com/v1/metrics/chains/ethereum/txcount.json`',
    '- Ethereum mainnet throughput: `https://api.growthepie.com/v1/metrics/chains/ethereum/throughput.json`',
    '- L2 ecosystem aggregate transactions: `https://api.growthepie.com/v1/metrics/chains/all_l2s/txcount.json`',
    '- L2 ecosystem aggregate throughput: `https://api.growthepie.com/v1/metrics/chains/all_l2s/throughput.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate L2 chains, but ratios on this page are computed mechanically from public API data — no supporter receives any preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent sources for the L2-vs-mainnet comparison include [L2BEAT](https://l2beat.com) (TVL + stage classification + chain inclusion list), [Etherscan](https://etherscan.io) (mainnet-only metrics), and the chains' own block explorers (per-L2 metrics). Methodologies differ — L2BEAT tracks TVL primarily; growthepie tracks usage (txs, throughput). When ratios disagree it's usually because the underlying chain inclusion lists differ.",
    '',
    '# Which chains are included?',
    "The L2 universe used for the per-chain-sum fallback (and for context throughout this page) is the same {{l2_scale_universe_size}}-chain set used by the other L2 answer pages on growthepie, computed automatically from `master.json`:",
    "{{l2_scale_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`multiple`) — not an individual chain. The `all_l2s` aggregate is *used* as the primary L2 ecosystem source but not as an L2 itself.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-15',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/fundamentals/throughput for the live L2 vs Ethereum mainnet comparison.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/throughput' },
    {
      icon: 'gtp-metrics-throughput',
      name: 'Throughput',
      url: '/fundamentals/throughput',
    },
    {
      icon: 'gtp-metrics-transactioncount',
      name: 'Transaction Count',
      url: '/fundamentals/transaction-count',
    },
    { name: 'Ethereum', url: '/chains/ethereum' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default isEthereumScalingThroughL2s;
