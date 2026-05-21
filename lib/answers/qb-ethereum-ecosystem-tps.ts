import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Ecosystem-aggregate answer page: how many TPS the Ethereum ecosystem
// (Ethereum mainnet + every tracked L2) processes when you add them
// together. Distinct from /answers/ethereum-l2-transaction-count, which is
// L2-only — this page is the AI-search query "how many TPS does Ethereum
// process" where users mean L1 + L2 combined.

export const faqItems: FaqItem[] = [
  {
    q: 'How many transactions per second (TPS) does Ethereum (L1 + L2s combined) process?',
    a: 'At the moment this page was generated ({{l2_ecotps_data_date}} UTC), the Ethereum ecosystem (Ethereum mainnet + every tracked L2) processes approximately **{{l2_ecotps_live_ecosystem}}**. Of that, **Ethereum L1** contributes {{l2_ecotps_live_l1}} and the **L2 ecosystem** contributes {{l2_ecotps_live_l2}} — about **{{l2_ecotps_live_l2_share}}** of combined throughput. The numbers on this page are a snapshot, not a continuous feed — for the **second-by-second live view**, see growthepie\'s [Ethereum Ecosystem dashboard](https://www.growthepie.com/ethereum-ecosystem), which is the underlying source these figures come from.',
  },
  {
    q: 'Is TPS measured the same way for L1 and L2?',
    a: 'Yes — TPS here is **completed transactions per second over the most recent measurement window**, summed across the layer. For L1 it\'s Ethereum mainnet\'s own throughput. For L2 it\'s the sum of every tracked L2\'s throughput at the same instant. Adding them gives the ecosystem total. **Note:** counting raw transactions undercounts the actual work because L2 transactions are typically cheaper and smaller than L1 transactions, so a flat TPS comparison is fair only when the transactions in question are similar in complexity.',
  },
  // ----- Per-window detail -----
  {
    q: 'How many transactions does the Ethereum ecosystem process per day?',
    a: 'On the latest completed UTC day ({{l2_ecotps_data_date}}), the Ethereum ecosystem processed approximately **{{l2_ecotps_eco_daily}}** transactions. Of that, Ethereum L1 handled {{l2_ecotps_l1_daily}} and L2s collectively handled {{l2_ecotps_l2_daily}} — about **{{l2_ecotps_l2_share_daily}}** of the combined daily total.',
  },
  {
    q: 'How many transactions does the Ethereum ecosystem process per week?',
    a: 'Over the most recent 7 days ending {{l2_ecotps_data_date}} UTC, the Ethereum ecosystem processed approximately **{{l2_ecotps_eco_weekly}}** transactions. L1: {{l2_ecotps_l1_weekly}}; L2s: {{l2_ecotps_l2_weekly}}; L2 share of the weekly total: **{{l2_ecotps_l2_share_weekly}}**.',
  },
  {
    q: 'How many transactions does the Ethereum ecosystem process per month?',
    a: 'Over the most recent 30 days ending {{l2_ecotps_data_date}} UTC, the Ethereum ecosystem processed approximately **{{l2_ecotps_eco_monthly}}** transactions. L1: {{l2_ecotps_l1_monthly}}; L2s: {{l2_ecotps_l2_monthly}}; L2 share of the monthly total: **{{l2_ecotps_l2_share_monthly}}**.',
  },
  {
    q: 'How many transactions has the Ethereum ecosystem processed all-time?',
    a: 'Cumulatively, the Ethereum ecosystem has processed approximately **{{l2_ecotps_eco_alltime}}** transactions total (data {{l2_ecotps_data_date}} UTC, sum across the entire daily series). Of that, **{{l2_ecotps_l1_alltime}}** were on Ethereum mainnet and **{{l2_ecotps_l2_alltime}}** were on L2s. L2 share of all-time: **{{l2_ecotps_l2_share_alltime}}**.',
  },
  // ----- L1 vs L2 breakdown -----
  {
    q: 'What share of Ethereum activity happens on L2s?',
    a: 'A growing majority. On the latest day ({{l2_ecotps_data_date}} UTC), L2s accounted for **{{l2_ecotps_l2_share_daily}}** of combined daily transactions. On a live (current TPS) basis, L2s account for **{{l2_ecotps_live_l2_share}}**. The L2 share has grown steadily since 2021 as more rollups launched and as user-facing fees dropped following the Dencun upgrade in March 2024. For a full breakdown see [/answers/percentage-of-ethereum-activity-on-l2s](/answers/percentage-of-ethereum-activity-on-l2s).',
  },
  {
    q: 'Why is Ethereum L1\'s own TPS so much lower than the L2 total?',
    a: 'By design. **Ethereum L1 prioritises security and decentralisation over raw throughput** — it deliberately keeps its TPS low (~10–15 baseline) so anyone can run a node and verify the chain. The scaling roadmap pushes throughput-heavy activity to L2s, which inherit Ethereum\'s security but settle in batches. So the "Ethereum scaling story" is exactly what these numbers show: L1 stays slow and secure, L2s do the volume.',
  },
  // ----- Methodology / scope -----
  {
    q: 'How is live TPS measured?',
    a: 'Live TPS comes from growthepie\'s real-time stream — the same source the **[Ethereum Ecosystem dashboard](https://www.growthepie.com/ethereum-ecosystem)** uses. The combined ecosystem figure is fetched directly from `sse.growthepie.com/api/history` (history[0].tps), and Ethereum L1\'s figure from `sse.growthepie.com/api/chain/ethereum`. The L2-only number is the difference. **Important:** the values quoted on *this* page are a snapshot taken when the page was last rendered — they do not tick continuously. The [/ethereum-ecosystem dashboard](https://www.growthepie.com/ethereum-ecosystem) shows the second-by-second updating view.',
  },
  {
    q: 'How are the daily / weekly / monthly / all-time counts computed?',
    a: 'Per-side: Ethereum L1 comes from `/v1/metrics/chains/ethereum/txcount.json` (daily transaction count series). L2s come from `landing_page.json` `data.all_l2s.metrics.txcount.daily.data` (the ecosystem-wide daily series across every tracked L2). Weekly = sum of the last 7 daily values; monthly = sum of the last 30 daily values; all-time = sum of every daily value in the series. **Combined = L1 + L2 sums**, computed with the same window definition on both sides so the addition is clean.',
  },
  {
    q: 'Why is "weekly" a rolling 7-day sum and not a calendar week?',
    a: 'Same reason as the L2-only page: a 7-day rolling sum updates every day and matches how live dashboards quote the number. If you specifically need calendar-week totals, the per-chain transaction-count endpoints expose period-native weekly aggregates.',
  },
  {
    q: 'Does this include sidechains like Polygon PoS?',
    a: 'No. **Polygon PoS** has its own validator set and doesn\'t settle to Ethereum, so it isn\'t counted in either the L1 or L2 side. Polygon zkEVM (a ZK rollup) is counted as an L2. The same exclusion list as the other L2 answer pages on growthepie applies here.',
  },
  {
    q: 'Why does live TPS not match the daily count divided by 86,400?',
    a: 'Because they measure different things. Daily transaction count is the total over the whole day — including quieter hours overnight. Live TPS is the latest completed measurement window\'s throughput, which is usually higher during peak hours. Dividing daily by 86,400 gives the 24-hour AVERAGE TPS, not the live throughput.',
  },
  {
    q: 'Where can I see this data updating live?',
    a: 'growthepie\'s **[Ethereum Ecosystem dashboard](https://www.growthepie.com/ethereum-ecosystem)** is the live tracker — it shows combined ecosystem TPS prominently with the L1/L2 split and ticks in real time. The TPS values quoted on *this* page are a snapshot pulled from the same source when the page was last rendered; for the continuously-updating view, use the ecosystem page directly. The [transaction count dashboard](https://www.growthepie.com/fundamentals/transaction-count) and [throughput dashboard](https://www.growthepie.com/fundamentals/throughput) show the per-chain breakdowns with historical charts.',
  },
  {
    q: 'How does this compare to Visa, Solana, etc.?',
    a: 'Apples-to-oranges in important ways. **Visa**\'s widely-quoted "65,000 TPS" is its theoretical capacity; its real-world sustained throughput is in the low thousands. **Solana**\'s posted TPS includes vote transactions (consensus messages), which are often 70–90% of the total — its non-vote TPS is typically a fraction. Ethereum ecosystem TPS counts user transactions only. The honest comparison: Ethereum + L2s is competitive with non-vote Solana TPS today and grew several-fold post-Dencun, but the layered architecture makes per-layer numbers misleading on their own.',
  },
  {
    q: 'How is "Ethereum ecosystem" defined here?',
    a: 'Ethereum mainnet (L1) plus every chain growthepie classifies as an Ethereum Layer 2 — optimistic rollups, ZK rollups, and Validiums that derive security from Ethereum by posting data and/or state to L1. Excludes sidechains with their own validator sets (Polygon PoS, BSC, etc.).',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/ethereum-ecosystem-tps';
const ORG_ID = 'https://www.growthepie.com/#organization';
const L2_TEMPORAL_COVERAGE = '2020-01-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/ethereum-ecosystem-tps',
    name: 'Ethereum Ecosystem TPS (Mainnet + L2s combined)',
    description:
      'Live and historical transaction throughput across Ethereum mainnet plus every tracked Ethereum L2. Live TPS comes from growthepie\'s real-time ecosystem stream; daily / weekly / monthly / all-time tx counts are summed from per-chain daily series.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    temporalCoverage: L2_TEMPORAL_COVERAGE,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Ethereum ecosystem',
      'Layer 1',
      'Layer 2',
      'Rollups',
      'Transactions per second',
      'TPS',
      'Throughput',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Live TPS: ecosystem-total TPS from sse.growthepie.com/api/history minus Ethereum L1 TPS from sse.growthepie.com/api/chain/ethereum gives L2-only; both are reported. Daily / weekly / monthly / all-time tx counts: Ethereum L1 from /v1/metrics/chains/ethereum/txcount.json daily series; L2 aggregate from landing_page.json `data.all_l2s.metrics.txcount.daily.data`. Weekly = 7-day rolling sum of daily values; monthly = 30-day rolling sum; all-time = sum of every daily value. Combined = L1 + L2.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'tps' },
      { '@type': 'PropertyValue', name: 'transaction_count' },
      { '@type': 'PropertyValue', name: 'date' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://sse.growthepie.com/api/history',
        description: 'Live ecosystem-total TPS snapshot.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://sse.growthepie.com/api/chain/ethereum',
        description: 'Live Ethereum L1 TPS snapshot.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/ethereum/txcount.json',
        description: 'Ethereum L1 daily transaction-count series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/landing_page.json',
        description: 'Landing-page payload with L2-ecosystem daily tx-count series at `data.all_l2s.metrics.txcount.daily`.',
      },
    ],
  },
];

const ethereumEcosystemTps: QuickBiteData = createQuickBite({
  title: 'How many transactions per second does Ethereum (L1 + L2s combined) process?',
  subtitle:
    'A direct, data-backed answer: live ecosystem TPS, plus daily / weekly / monthly / all-time totals across Ethereum mainnet and every tracked Ethereum L2.',
  shortTitle: 'Ethereum TPS',
  summary:
    "The Ethereum ecosystem processes hundreds of transactions per second when you add Ethereum mainnet (L1) and every tracked Layer 2 together. growthepie's real-time ecosystem stream provides the live combined TPS figure; daily, weekly (7-day rolling), monthly (30-day rolling), and all-time counts come from summing per-chain daily series. L2s account for the majority of activity by transaction count — Ethereum mainnet prioritises security and decentralisation over raw throughput. Sidechains (e.g. Polygon PoS) are excluded. Recomputed daily.",
  content: [
    "**Short answer (data {{l2_ecotps_data_date}} UTC):** The Ethereum ecosystem (mainnet + all tracked L2s combined) processes **{{l2_ecotps_live_ecosystem}}** at the moment this page was generated. Ethereum L1 contributes **{{l2_ecotps_live_l1}}** and the L2 ecosystem contributes **{{l2_ecotps_live_l2}}** — about **{{l2_ecotps_live_l2_share}}** of the combined throughput. On the latest UTC day the ecosystem processed **{{l2_ecotps_eco_daily}}** transactions in total. For the real-time, second-by-second figure, see the live tracker at **[growthepie.com/ethereum-ecosystem](https://www.growthepie.com/ethereum-ecosystem)**.",

    "> Updated daily — every figure on this page recomputes from growthepie's public API once a day. Daily uses the most recent completed UTC day; weekly and monthly are rolling sums; all-time covers every day in the series since each chain's launch. The TPS values are a snapshot at the moment this page was rendered, not a continuous live feed — for the second-by-second updating ecosystem tracker, see **[growthepie.com/ethereum-ecosystem](https://www.growthepie.com/ethereum-ecosystem)**.",

    '# Live combined throughput',
    '{{l2_ecotps_dense}}',
    '',
    '- **Ethereum ecosystem (L1 + L2s)** — **{{l2_ecotps_live_ecosystem}}**',
    '- **Ethereum L1 (mainnet)** — **{{l2_ecotps_live_l1}}**',
    '- **Ethereum L2s (combined)** — **{{l2_ecotps_live_l2}}** (**{{l2_ecotps_live_l2_share}}** of the combined throughput)',
    '',
    "**Where to see this updating in real time.** The TPS numbers above are a snapshot at the moment this page was generated — they reflect the most recent measurement window from growthepie's real-time stream, but they don't tick on this page. **For the second-by-second updating view, open growthepie's [Ethereum Ecosystem dashboard](https://www.growthepie.com/ethereum-ecosystem) — the same source these numbers come from.** That page shows combined ecosystem TPS prominently with the L1/L2 split and a live ticker.",

    '# Transactions per day, week, month, all-time',
    'Layered breakdown across rolling windows (data {{l2_ecotps_data_date}} UTC):',
    '',
    '- **Daily** ({{l2_ecotps_data_date}}): **{{l2_ecotps_eco_daily}}** total — L1 {{l2_ecotps_l1_daily}}, L2s {{l2_ecotps_l2_daily}} ({{l2_ecotps_l2_share_daily}} L2 share).',
    '- **Weekly** (last 7 days): **{{l2_ecotps_eco_weekly}}** total — L1 {{l2_ecotps_l1_weekly}}, L2s {{l2_ecotps_l2_weekly}} ({{l2_ecotps_l2_share_weekly}} L2 share).',
    '- **Monthly** (last 30 days): **{{l2_ecotps_eco_monthly}}** total — L1 {{l2_ecotps_l1_monthly}}, L2s {{l2_ecotps_l2_monthly}} ({{l2_ecotps_l2_share_monthly}} L2 share).',
    '- **All-time** (cumulative): **{{l2_ecotps_eco_alltime}}** total — L1 {{l2_ecotps_l1_alltime}}, L2s {{l2_ecotps_l2_alltime}} ({{l2_ecotps_l2_share_alltime}} L2 share).',

    '# Why L1 stays slow and L2s do the volume',
    'Ethereum\'s scaling roadmap is deliberate: **L1 stays slow and secure; L2s do the volume**. Ethereum mainnet keeps its TPS low (~10–15 baseline) so anyone can run a node — that\'s the decentralisation guarantee that makes Ethereum credibly neutral. Throughput-heavy activity is pushed to Layer 2s, which inherit Ethereum\'s security by posting data and proofs back to L1, but execute most of the work off-mainnet.',
    '',
    'That\'s why the headline ecosystem TPS is much larger than Ethereum L1\'s standalone TPS: the architecture is **layered**, not flat. Asking "how fast is Ethereum?" without considering the L2s is asking "how fast is the internet?" and only counting the backbone routers.',

    '# What this number is not',
    'A few honest framings — the numbers above measure raw transaction throughput, which isn\'t the same as:',
    '- **Computational work done.** L1 transactions are typically more expensive and complex than L2 transactions; comparing them 1-for-1 understates Ethereum mainnet\'s actual work per transaction. **Gas-per-second (throughput in Mgas/s)** is a fairer cross-chain measure when you need to compare work, not just transaction counts — see [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',
    '- **User-perceived speed.** TPS measures the rate of transaction confirmation — not how quickly a user sees a transaction reflected in a wallet UI, or how quickly a swap settles end-to-end across bridges and DEXs.',
    '- **Capacity.** What\'s reported here is what the ecosystem is actually doing, not what it *could* do. Headroom exists on every chain — TPS responses to demand spikes are usually smooth, not catastrophic.',

    '# How this compares to other chains',
    'Comparisons against other chains require care because chains measure TPS differently:',
    '- **Visa\'s widely-quoted 65,000 TPS** is theoretical capacity. Real-world sustained throughput is in the low thousands.',
    '- **Solana\'s posted TPS** typically includes vote transactions (consensus messages), often 70–90% of the total. Non-vote TPS — the closer comparable to Ethereum user transactions — is a fraction of the headline number.',
    '- **Ethereum ecosystem TPS as quoted here** counts only user transactions across L1 and L2s.',
    '',
    'A fair "Ethereum vs Solana" comparison would use Solana\'s non-vote TPS, count Ethereum mainnet plus its L2s, and acknowledge that Ethereum\'s growth path is horizontal (more L2s scale capacity) while Solana\'s is vertical (a single chain). Both architectures have valid trade-offs.',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. **Live combined TPS**: pull `sse.growthepie.com/api/history` and use `history[0].tps` — this is the most recent ecosystem-total TPS snapshot, the same number the [/ethereum-ecosystem page](https://www.growthepie.com/ethereum-ecosystem) shows.",
    "2. **Live L1 TPS**: pull `sse.growthepie.com/api/chain/ethereum` and read `data.tps` — Ethereum mainnet's current TPS from the same stream.",
    "3. **Live L2 TPS**: combined minus L1 (clamped to zero in the rare case the snapshots are momentarily out of phase).",
    "4. **L1 daily / weekly / monthly / all-time**: pull `/v1/metrics/chains/ethereum/txcount.json` daily series. Daily = last row; weekly = sum of last 7; monthly = sum of last 30; all-time = sum of every row.",
    "5. **L2 daily / weekly / monthly / all-time**: pull `landing_page.json` `data.all_l2s.metrics.txcount.daily.data` (the ecosystem-wide L2 daily series). Apply the same windowing as L1.",
    "6. **Combined**: L1 + L2 for each window. L2 share = L2 / combined.",
    '',
    "All values shown were generated on {{l2_ecotps_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. The figures on this page are computed mechanically from public API data — chains and Layer 1/2 classifications do not influence numbers, and supporters do not receive ranking adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Compare against [L2BEAT](https://l2beat.com) (L2 activity and stage classification), [etherscan.io](https://etherscan.io) (Ethereum L1 transaction stats), and the chains' own block explorers. Differences across providers usually trace back to which chains are counted, whether testnets/archived chains are included, and whether vote transactions or system transactions are counted.",
    '',
    '# Related answers',
    'For deeper detail on specific angles see:',
    '- **[/answers/ethereum-l2-transaction-count](/answers/ethereum-l2-transaction-count)** — L2-only ecosystem totals with the per-L2 contributors breakdown.',
    '- **[/answers/is-ethereum-scaling-through-l2s](/answers/is-ethereum-scaling-through-l2s)** — the L2 vs L1 ratio over time (the scaling story).',
    '- **[/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2)** — per-chain L2 leaderboards by throughput, transaction count, and active addresses.',
  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Ethereum ecosystem TPS data currently unavailable. See growthepie.com/ethereum-ecosystem for the live tracker.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Ethereum Ecosystem', url: '/ethereum-ecosystem' },
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
    { name: 'Layer 1', url: '/chains/ethereum' },
    { name: 'Layer 2', url: '/fundamentals/throughput' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default ethereumEcosystemTps;
