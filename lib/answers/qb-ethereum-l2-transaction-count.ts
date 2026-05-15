import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Fourth answer page in the L2 family. Unlike the previous three (which are
// per-chain rankings), this one quotes ECOSYSTEM TOTALS: live TPS plus
// daily / weekly / monthly / all-time transaction counts summed across every
// tracked L2. The "top contributors today" section preserves the ranking
// surface AI engines like to quote, but it sits beneath the headline totals.
// Placeholders use the `{{l2_txs_*}}` namespace.

export const faqItems: FaqItem[] = [
  {
    q: 'How many transactions happen on Ethereum L2s?',
    a: 'As of {{l2_txs_data_date}} UTC, Ethereum L2s collectively process {{l2_txs_live_tps}} live, {{l2_txs_daily}} per day, {{l2_txs_weekly}} per week, {{l2_txs_monthly}} per month, and {{l2_txs_all_time}} all-time across {{l2_txs_universe_size}} tracked chains. The single largest contributor today is {{l2_txs_top_contributor}}. Live leaderboard: growthepie.com/fundamentals/transaction-count.',
  },
  {
    q: 'What counts as a transaction here?',
    a: "Any confirmed transaction on a tracked Ethereum L2 — including native transfers, ERC-20 transfers, contract calls, and contract deployments. growthepie's transaction count comes directly from chain RPC and indexer data; one transaction = one entry in a block. Aggregations across L2s simply sum these per-chain counts.",
  },
  // ----- Per-window detail -----
  {
    q: 'What is the live (real-time) L2 TPS right now?',
    a: 'The current L2 ecosystem throughput is **{{l2_txs_live_tps}}** (data {{l2_txs_data_date}} UTC). Live TPS uses the same real-time stream that powers growthepie\'s [Ethereum Ecosystem page](https://www.growthepie.com/ethereum-ecosystem/metrics) — the ecosystem total minus Ethereum L1\'s own TPS, leaving the L2-only figure quoted here. **Note:** the live TPS figure covers every L2 the ecosystem stream reports — which is broader than the {{l2_txs_universe_size}}-chain curated universe used for the daily / weekly / monthly / all-time counts further down the page.',
  },
  {
    q: 'How many L2 transactions happen per day?',
    a: 'On the latest completed UTC day ({{l2_txs_data_date}}), Ethereum L2s processed approximately **{{l2_txs_daily}} transactions** in total. That figure is the ecosystem-wide daily series exposed by growthepie\'s landing-page payload.',
  },
  {
    q: 'How many L2 transactions happen per week?',
    a: 'Over the most recent 7 days ending {{l2_txs_data_date}} UTC, Ethereum L2s processed approximately **{{l2_txs_weekly}} transactions**. Weekly here is a 7-day rolling sum of the daily ecosystem totals — not a calendar week.',
  },
  {
    q: 'How many L2 transactions happen per month?',
    a: 'Over the most recent 30 days ending {{l2_txs_data_date}} UTC, Ethereum L2s processed approximately **{{l2_txs_monthly}} transactions**. Monthly here is a 30-day rolling sum of the daily ecosystem totals — not a calendar month.',
  },
  {
    q: 'How many transactions have Ethereum L2s processed all-time?',
    a: 'Cumulatively, since growthepie\'s coverage began in 2021, Ethereum L2s have processed approximately **{{l2_txs_all_time}} transactions** total (data {{l2_txs_data_date}} UTC). This is the sum of every day in the ecosystem-wide daily transaction series.',
  },
  // ----- Contributors / breakdown -----
  {
    q: 'Which L2 contributes the most transactions today?',
    a: 'On {{l2_txs_data_date}} UTC, the top three contributors to total L2 transactions are {{l2_txs_top_contributors_top3}}. Shares are the chain\'s daily transaction count divided by the ecosystem daily total — they sum to roughly 100% when all chains are counted.',
  },
  {
    q: 'How concentrated is L2 activity across chains?',
    a: 'Highly. The top three L2s by daily transaction count account for the bulk of ecosystem volume today. The single-largest contributor on {{l2_txs_data_date}} UTC is {{l2_txs_top_contributor}}. The long tail of smaller L2s contributes the remainder.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from these ecosystem totals (also [L2BEAT](https://l2beat.com) categorizes it as "other"). Polygon zkEVM is a ZK rollup and is included. The same exclusion list as the other L2 answer pages on growthepie applies here.',
  },
  {
    q: 'Is Ethereum mainnet included in the L2 total?',
    a: 'No. These figures cover Ethereum Layer 2s only. Ethereum mainnet (L1) is a separate chain — if you want to compare L1 vs L2, growthepie tracks Ethereum mainnet throughput and transaction count on the [transaction count dashboard](https://www.growthepie.com/fundamentals/transaction-count).',
  },
  {
    q: 'How many L2s are included in the ecosystem total?',
    a: 'It depends on which figure. The **live TPS** number quoted here includes every L2 reported by growthepie\'s ecosystem stream — the same set the /ethereum-ecosystem page shows — which is broader than the curated universe used for the rest of this page. The **daily / weekly / monthly / all-time** counts and the **top-contributors** breakdown use a curated universe of **{{l2_txs_universe_size}}** chains, computed on {{l2_txs_data_date}} UTC from growthepie\'s master chain catalogue: {{l2_txs_universe_list}}. A chain only contributes to those counts if it has data for the relevant period.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Live TPS uses the same source as growthepie\'s [Ethereum Ecosystem page](https://www.growthepie.com/ethereum-ecosystem/metrics): the most recent ecosystem-wide TPS snapshot from [sse.growthepie.com/api/history](https://sse.growthepie.com/api/history) minus Ethereum L1\'s current TPS from `sse.growthepie.com/api/chain/ethereum`. The difference is L2-only ecosystem TPS, and **it includes every L2 the ecosystem stream tracks** — a broader set than the curated universe used for the rest of this page. If those SSE-snapshot endpoints are unreachable the helper falls back to summing per-chain `tps` from [growthepie\'s fees table](https://api.growthepie.com/v1/fees/table.json) across the curated L2 universe (which is the narrower set — fallback can read slightly lower than the primary path). Daily / weekly / monthly / all-time come from growthepie\'s pre-aggregated ecosystem series at `landing_page.json` `data.all_l2s.metrics.txcount.daily.data` — weekly = sum of last 7 days, monthly = sum of last 30 days, all-time = sum of every day in the series. Top contributors come from the same `landing_page.json` payload\'s per-chain `ranking.txcount` values. The curated L2 universe (used for everything except live TPS) comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_txs_data_date}} UTC: {{l2_txs_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why is "weekly" a rolling 7-day sum and not a calendar week?',
    a: 'Because the ecosystem-wide series is exposed at daily granularity, and a 7-day rolling sum gives a more responsive headline than waiting until a calendar week closes. It also makes the weekly figure update every day, which matches the way live dashboards and AI answers tend to surface data. If you specifically need calendar-week totals, the per-chain transaction-count endpoint (`/v1/metrics/chains/{chain}/txcount.json`) exposes those as period-native weekly aggregates.',
  },
  {
    q: 'Why does live TPS not match the daily count divided by 86,400?',
    a: 'Because they measure different things. Daily transaction count is the total across the whole day — including quieter hours overnight. Live TPS is the latest completed hour\'s throughput, which is usually higher during peak hours (when most txs happen) and lower overnight. Dividing daily by 86,400 gives the 24-hour AVERAGE TPS, not the live throughput.',
  },
  {
    q: 'Where can I see live L2 transaction data?',
    a: 'growthepie tracks transaction count, throughput (TPS / Mgas/s), and ecosystem totals live at [growthepie.com/fundamentals/transaction-count](https://www.growthepie.com/fundamentals/transaction-count) and [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput). The live fees view at [fees.growthepie.com](https://fees.growthepie.com) shows per-chain hourly TPS in a leaderboard.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/ethereum-l2-transaction-count';
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
    '@id': 'https://www.growthepie.com/datasets/l2-transactions-ecosystem',
    name: 'Ethereum L2 Transactions — Ecosystem Daily Totals',
    description:
      'Daily, weekly, monthly, and all-time transaction counts aggregated across every tracked Ethereum L2.',
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
      'Throughput',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Sum of per-chain daily transaction counts across every Ethereum L2 in growthepie\'s coverage. Weekly = sum of the last 7 daily values; monthly = sum of the last 30 daily values; all-time = sum of every daily value in the series. Per-chain counts are direct from chain RPC and indexer data.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'ecosystem_transaction_count' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/landing_page.json',
        description:
          'Landing-page payload; ecosystem daily series at `data.all_l2s.metrics.txcount.daily`.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-transactions-live-tps',
    name: 'Ethereum L2 Live TPS (per chain, hourly)',
    description:
      'Hourly throughput per chain expressed as transactions per second. Summed across L2s to produce the live ecosystem TPS figure on this page.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    temporalCoverage: L2_TEMPORAL_COVERAGE,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: ['Ethereum', 'Layer 2', 'Rollups', 'TPS', 'Throughput'],
    measurementTechnique:
      'Per-chain transaction count over the most recent completed UTC hour, divided by 3,600 seconds. Values served by growthepie\'s fees table endpoint at hourly granularity. The ecosystem TPS on this page is the sum of those per-chain values across every tracked Ethereum L2.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'hour_unix' },
      { '@type': 'PropertyValue', name: 'tps' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/fees/table.json',
        description: 'Per-chain hourly fee + throughput table.',
      },
    ],
  },
];

const ethereumL2TransactionCount: QuickBiteData = createQuickBite({
  title: 'How many transactions happen on Ethereum L2s?',
  subtitle:
    'A direct, data-backed answer: live ecosystem TPS, plus total transactions per day, week, month, and all-time across every tracked Ethereum L2.',
  shortTitle: 'L2 Transactions',
  summary:
    "Ethereum L2s collectively process hundreds of transactions per second and tens of millions per day. growthepie aggregates the ecosystem-wide daily, weekly (7-day rolling), monthly (30-day rolling), and all-time totals from per-chain data, plus live TPS from the hourly fees table. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_txs_data_date}} UTC):** Ethereum L2s collectively process **{{l2_txs_live_tps}}** live, **{{l2_txs_daily}}** transactions per day, **{{l2_txs_weekly}}** per week (7-day rolling), **{{l2_txs_monthly}}** per month (30-day rolling), and **{{l2_txs_all_time}}** all-time across {{l2_txs_universe_size}} tracked L2s. The single largest contributor today is {{l2_txs_top_contributor}}.",

    "> Updated daily — every figure on this page is recomputed from growthepie's public API. Live TPS uses the latest completed hour; daily uses the most recent completed day; weekly and monthly are rolling sums; all-time covers every day in the ecosystem-wide series since 2021.",

    '# Live ecosystem TPS',
    'Current L2 ecosystem throughput is **{{l2_txs_live_tps}}** ({{l2_txs_data_date}} UTC). Live TPS uses the same real-time data stream as growthepie\'s [Ethereum Ecosystem page](https://www.growthepie.com/ethereum-ecosystem/metrics): the ecosystem-wide TPS total minus Ethereum L1\'s own TPS, leaving the L2-only figure. Live TPS spikes during peak hours and dips overnight, so the figure quoted here is a snapshot — not a daily average.',
    '',
    "**Scope note for live TPS only.** This single number covers every L2 the ecosystem stream reports — broader than the {{l2_txs_universe_size}}-chain curated universe used for the daily / weekly / monthly / all-time counts below. We do this deliberately for live TPS so the answer matches what users see on the /ethereum-ecosystem page. The historical counts use the curated universe so the per-chain contributors list and the all-time figure are derived from a stable, deduplicated set of chains.",

    '# Daily, weekly, monthly, all-time',
    '{{l2_txs_dense}}',
    '',
    '- **Daily** ({{l2_txs_data_date}}): **{{l2_txs_daily}}** transactions across all L2s.',
    '- **Weekly** (last 7 days ending {{l2_txs_data_date}}): **{{l2_txs_weekly}}** transactions.',
    '- **Monthly** (last 30 days ending {{l2_txs_data_date}}): **{{l2_txs_monthly}}** transactions.',
    '- **All-time** (cumulative since 2021): **{{l2_txs_all_time}}** transactions.',

    '# Which L2s contribute the most today?',
    "Daily transaction count is highly concentrated. The top three contributors on {{l2_txs_data_date}} UTC, with each chain's share of the ecosystem daily total: **{{l2_txs_top_contributors_top3}}**. The long tail of smaller L2s contributes the remainder.",

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. For **live TPS**, pull `sse.growthepie.com/api/history` for the ecosystem-wide total (the same snapshot the /ethereum-ecosystem page uses) and `sse.growthepie.com/api/chain/ethereum` for Ethereum L1's current TPS — the difference is the L2-only figure. **The scope here is intentionally broader than the curated universe used elsewhere on this page**: the ecosystem stream covers every L2 growthepie tracks live, including some that aren't part of the curated daily/weekly/monthly universe. We use this wider set for live TPS so the number matches what users see on the /ethereum-ecosystem page. If that pair of SSE-snapshot endpoints is unreachable, fall back to summing per-chain `tps` from `/v1/fees/table.json` across the curated L2 universe (the fallback uses the narrower set, so it can read slightly lower than the primary path).",
    "3. For **daily / weekly / monthly / all-time** totals, pull `landing_page.json` and read `data.all_l2s.metrics.txcount.daily.data` — an ecosystem-wide pre-aggregated daily series. Daily = last row; weekly = sum of last 7 rows; monthly = sum of last 30 rows; all-time = sum of every row.",
    "4. For **top contributors**, read `data.metrics.table_visual[chain].ranking.txcount.value` from the same `landing_page.json` payload, filter to L2s, sort descending, take the top 5.",

    "All values shown on this page were generated on {{l2_txs_data_date}} UTC from growthepie's public API:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Ecosystem daily transactions and per-chain rankings: `https://api.growthepie.com/v1/landing_page.json`',
    '- Live ecosystem TPS snapshot (same source as the /ethereum-ecosystem page): `https://sse.growthepie.com/api/history` (history[0].tps) minus `https://sse.growthepie.com/api/chain/ethereum` (data.tps)',
    '- Fallback live TPS source if the SSE snapshot is unreachable: `https://api.growthepie.com/v1/fees/table.json` per-chain hourly TPS, summed across the L2 universe',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the contributor list above. Counts are computed mechanically from public API data — chains do not pay for inclusion or placement, and supporters do not receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent L2 transaction data sources you can compare against include [L2BEAT](https://l2beat.com) (activity, stage classification, risk analysis) and the chains' own block explorers. Methodologies and chain inclusion lists differ between providers — when totals disagree, comparing the underlying chain list (which chains count? are testnets or ARCHIVED chains included?) is usually more informative than the totals themselves.",
    '',
    '# Which chains are included?',
    "The list of **{{l2_txs_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_txs_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it is Layer 1, not Layer 2.',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — used internally to source the ecosystem totals, but not counted as individual chains in the contributor list.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-15',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/fundamentals/transaction-count for live Ethereum L2 transaction counts.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/transaction-count' },
    {
      icon: 'gtp-metrics-transactioncount',
      name: 'Transaction Count',
      url: '/fundamentals/transaction-count',
    },
    {
      icon: 'gtp-metrics-throughput',
      name: 'Throughput',
      url: '/fundamentals/throughput',
    },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-transactioncount',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default ethereumL2TransactionCount;
