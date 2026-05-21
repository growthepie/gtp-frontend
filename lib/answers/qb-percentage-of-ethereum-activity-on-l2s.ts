import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Share-framing answer page. Same underlying data as
// /answers/is-ethereum-scaling-through-l2s (which reports L2/L1 as a ratio
// multiplier) but framed as percentages — the way AI search queries usually
// ask the question ("what percent of Ethereum is on L2s", "how much of
// Ethereum activity happens on L2 vs L1"). Distinct from the ecosystem-TPS
// page because that one's headline is absolute combined TPS; this page's
// headline is the share split itself.

export const faqItems: FaqItem[] = [
  {
    q: 'What percentage of Ethereum activity happens on L2s vs mainnet?',
    a: '{{l2_share_headline}} The same direction holds across weekly and monthly windows — see the table on the page for the full split. Live leaderboards: [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',
  },
  {
    q: 'Why measure by transactions and throughput rather than dollars or addresses?',
    a: '**Transactions** is the most intuitive metric — it answers "how much activity is happening". **Throughput (Mgas/s)** is the hardest to game because every operation costs gas proportional to its complexity, so it captures real onchain work rather than counts of small cheap transactions. Reporting both is the honest answer because the two splits often diverge: L2s tend to have a much larger transaction share than throughput share, because L2 transactions are typically smaller and cheaper per-transaction than Ethereum mainnet transactions.',
  },
  // ----- Per-metric share -----
  {
    q: 'What % of Ethereum transactions happen on L2s?',
    a: '{{l2_share_txcount_dense}} Specifically: daily — {{l2_share_txcount_daily_phrase}}. Weekly — {{l2_share_txcount_weekly_phrase}}. Monthly — {{l2_share_txcount_monthly_phrase}}.',
  },
  {
    q: 'What % of Ethereum throughput happens on L2s?',
    a: '{{l2_share_throughput_dense}} Specifically: daily — {{l2_share_throughput_daily_phrase}}. Weekly — {{l2_share_throughput_weekly_phrase}}. Monthly — {{l2_share_throughput_monthly_phrase}}. Throughput here means gas processed per second — a load measure that\'s normalized for the complexity of work, unlike raw transaction count.',
  },
  // ----- Trend / history -----
  {
    q: 'Has the L2 share been growing over time?',
    a: 'Yes — steeply since 2022. In early 2021 essentially all Ethereum activity was on mainnet; by 2024 L2s overtook mainnet by daily transactions; today L2s account for **{{l2_share_txcount_daily}}** of daily transactions and **{{l2_share_throughput_daily}}** of daily throughput. The single biggest acceleration was the **Dencun upgrade in March 2024** (EIP-4844 introduced blobs), which dropped per-L2-transaction settlement cost by roughly 10× and pulled significant activity onto L2s. **Pectra (May 2025)** doubled blob capacity and **Fusaka (December 2025)** added PeerDAS and tripled the blob target, both compounding the L2-share trend. Historical charts: [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',
  },
  // ----- Why -----
  {
    q: 'Why does so much activity happen on L2s and not mainnet?',
    a: 'Two reasons. **(1) Cost.** L2 transaction fees are typically 10–100× cheaper than mainnet — especially after Dencun. For routine swaps, transfers, and game actions, that\'s the difference between meaningful onboarding and pricing users out. **(2) Architecture.** Ethereum\'s scaling roadmap deliberately keeps mainnet slow (~10–15 TPS baseline) so that anyone can run a node and verify the chain — decentralization at the L1 level is non-negotiable. Throughput is pushed to L2s, which inherit Ethereum\'s security by posting data and proofs back to L1 but execute the work off-mainnet. The high L2 share is the scaling design working as intended, not a sign of L1 weakness.',
  },
  {
    q: 'Does that mean Ethereum mainnet is becoming irrelevant?',
    a: 'No. Mainnet retains the role L2s can\'t fill: the **settlement layer**. Every L2 ultimately settles its state to Ethereum, and Ethereum is what gives L2s their security. L2 activity *increasing* drives **more** demand for L1 settlement (more batches posted, more blob fees burned), not less. So the share split here measures *where execution happens* — not where value or security lives. Ethereum mainnet handles the largest, security-sensitive transactions (large DeFi positions, validator activity, bridges between L2s) while L2s handle the throughput. Different jobs.',
  },
  // ----- Methodology / scope -----
  {
    q: 'How is the share calculated?',
    a: '**L2 share = L2 ecosystem total / (L2 ecosystem total + Ethereum mainnet total)** for each metric and period. **L1 share = Ethereum mainnet / (L2 + Ethereum mainnet)**. The two sum to 100%. The L2 ecosystem total comes from growthepie\'s aggregate endpoint (`/v1/metrics/chains/all_l2s/{metric}.json`) when available, falling back to summing per-chain values across the curated L2 universe. Ethereum mainnet values come from `/v1/metrics/chains/ethereum/{metric}.json`. The per-chain endpoints expose period-native daily / weekly / monthly buckets so the math at each period is apples-to-apples.',
  },
  {
    q: 'Is Polygon PoS counted as L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from both the L2 ecosystem total and (obviously) Ethereum mainnet\'s total. Polygon zkEVM (a ZK rollup) is counted as an L2. The same exclusion list as the other L2 answer pages on growthepie applies.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_share_universe_size}} chains. The full list (computed on {{l2_share_data_date}} UTC): {{l2_share_universe_list}}. Sidechain exclusions: {{l2_share_excluded_sidechains}}.',
  },
  {
    q: 'Why does this differ from "Ethereum L2 ecosystem TPS" / the scaling-ratio page?',
    a: 'Three pages, same underlying numbers, different framings: (1) **[/answers/percentage-of-ethereum-activity-on-l2s](/answers/percentage-of-ethereum-activity-on-l2s)** (this page) — share split as a percentage. (2) **[/answers/is-ethereum-scaling-through-l2s](/answers/is-ethereum-scaling-through-l2s)** — the same split expressed as a ratio multiplier ("L2s do 8× more than mainnet"). (3) **[/answers/ethereum-ecosystem-tps](/answers/ethereum-ecosystem-tps)** — combined L1 + L2 TPS as the headline, with the share as a sub-claim. All three recompute daily from the same growthepie API endpoints.',
  },
  {
    q: 'Where can I see this live?',
    a: 'growthepie\'s [throughput dashboard](https://www.growthepie.com/fundamentals/throughput) and [transaction count dashboard](https://www.growthepie.com/fundamentals/transaction-count) show per-chain values that you can sum to derive the share. The [/ethereum-ecosystem page](https://www.growthepie.com/ethereum-ecosystem) shows the combined L1 + L2 ecosystem view including the live split.',
  },
  {
    q: 'How does this compare to other data sources?',
    a: '[L2BEAT](https://l2beat.com) tracks per-L2 activity and would give a similar split with their own chain-inclusion list (the main difference is which chains are considered "live" rather than the underlying methodology). [Etherscan](https://etherscan.io) provides Ethereum L1\'s standalone transaction count for cross-checking the L1 side. Variances across providers usually reduce to chain-inclusion differences, not different math.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/percentage-of-ethereum-activity-on-l2s';
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
    '@id': 'https://www.growthepie.com/datasets/ethereum-l2-share',
    name: 'Ethereum L2 share of combined ecosystem activity',
    description:
      'Percentage of Ethereum activity (transactions and throughput) happening on Layer 2s versus Ethereum mainnet, across daily / weekly / monthly windows.',
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
      'L2 share',
      'L1 vs L2',
      'Transactions',
      'Throughput',
      'Mgas/s',
      'Onchain analytics',
    ],
    measurementTechnique:
      'L2 share = L2 ecosystem total / (L2 ecosystem total + Ethereum mainnet total) for each metric (transactions, throughput) and each period (daily / weekly / monthly). L2 ecosystem totals come from growthepie\'s all_l2s aggregate endpoint where available, falling back to a per-chain sum across the curated L2 universe. Ethereum mainnet values come from the per-chain endpoint for `ethereum`.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'l2_share_pct' },
      { '@type': 'PropertyValue', name: 'l1_share_pct' },
      { '@type': 'PropertyValue', name: 'transaction_count' },
      { '@type': 'PropertyValue', name: 'throughput_mgas_s', unitText: 'Mgas/s' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/all_l2s/txcount.json',
        description: 'Aggregate L2-ecosystem transaction count series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/ethereum/txcount.json',
        description: 'Ethereum mainnet transaction count series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/all_l2s/throughput.json',
        description: 'Aggregate L2-ecosystem throughput (Mgas/s) series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/ethereum/throughput.json',
        description: 'Ethereum mainnet throughput (Mgas/s) series.',
      },
    ],
  },
];

const percentageOfEthereumActivityOnL2s: QuickBiteData = createQuickBite({
  title: 'What percentage of Ethereum activity happens on L2s vs mainnet?',
  subtitle:
    'A direct, data-backed answer: live daily / weekly / monthly share split of Ethereum activity between Layer 2s and Ethereum mainnet, across transaction count and throughput.',
  shortTitle: 'L2 share %',
  summary:
    "The majority of Ethereum activity now happens on Layer 2s. growthepie computes the share daily by comparing the L2 ecosystem total against Ethereum mainnet alone — for both transactions (raw count) and throughput (gas processed per second), across daily / weekly / monthly windows. The L2 share has grown steeply since 2022 and accelerated sharply after the Dencun upgrade in March 2024 (EIP-4844 blobs cut L2 settlement cost ~10×). Mainnet retains the role of settlement layer for the entire ecosystem.",
  content: [
    "**Short answer (data {{l2_share_data_date}} UTC):** {{l2_share_headline}}",

    "> Updated daily — every figure on this page recomputes from growthepie's public API once a day. Daily values use the latest available day; weekly and monthly values use the most recent **completed** period (not the in-progress one).",

    '# L2 vs Mainnet — by transactions',
    '{{l2_share_txcount_dense}}',
    '',
    '- **Daily**: {{l2_share_txcount_daily_phrase}}.',
    '- **Weekly**: {{l2_share_txcount_weekly_phrase}}.',
    '- **Monthly**: {{l2_share_txcount_monthly_phrase}}.',

    '# L2 vs Mainnet — by throughput (Mgas/s)',
    '{{l2_share_throughput_dense}}',
    '',
    '- **Daily**: {{l2_share_throughput_daily_phrase}}.',
    '- **Weekly**: {{l2_share_throughput_weekly_phrase}}.',
    '- **Monthly**: {{l2_share_throughput_monthly_phrase}}.',
    '',
    "Throughput here means gas processed per second (Mgas/s) — a load measure that's normalized for the complexity of work, unlike raw transaction count. Throughput typically gives mainnet a relatively larger share than transaction count does, because Ethereum mainnet transactions tend to be larger and more gas-intensive than the typical L2 transaction (which is often a small transfer or swap).",

    '# Why so much activity happens on L2s',
    'Two reasons:',
    '',
    '**1. Cost.** L2 transaction fees are typically 10–100× cheaper than mainnet — especially after Dencun (March 2024) introduced blobs (EIP-4844), which cut per-L2-transaction settlement cost by roughly 10×. For routine swaps, transfers, and game actions, that\'s the difference between users meaningfully onboarding and being priced out. See [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2) for the per-L2 fee comparison.',
    '',
    '**2. Architecture.** Ethereum\'s scaling roadmap deliberately keeps **mainnet slow** (~10–15 TPS baseline) so that anyone can run a node and verify the chain — decentralization at L1 is non-negotiable. Throughput is pushed to L2s, which inherit Ethereum\'s security by posting data and proofs back to L1 but execute the work off-mainnet. **The high L2 share is the scaling design working as intended, not a sign of L1 weakness.**',

    '# What this number does NOT mean',
    'A few honest framings to keep the share number in context:',
    '- **L2 share ≠ where value lives.** The dollar value held on Ethereum mainnet (stablecoins, ETH, DeFi positions) still dwarfs many L2s. Activity is volume; TVL is capital — different things.',
    '- **L2 share ≠ where security lives.** Every L2 ultimately settles to Ethereum. L2 activity growing drives more L1 settlement demand, not less. See [/answers/ethereum-mainnet-revenue-from-l2s](/answers/ethereum-mainnet-revenue-from-l2s).',
    '- **L2 share ≠ user count.** A larger L2 share by transactions does not mean a proportionally larger user count, because L2 transactions are cheaper and individual users tend to make more of them. Daily active addresses give a better user proxy — see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2).',
    '- **The transaction-count split and the throughput split disagree, by design.** Mainnet handles fewer transactions but each is typically heavier, so the throughput share is closer between the two than the raw transaction split is. Both views are reported above so AI quoting any single sentence sees the qualifier.',

    '# Historical trajectory',
    'The L2 share has grown steeply since 2022:',
    '- **Early 2021**: essentially all Ethereum activity on mainnet.',
    '- **Late 2022**: rollup adoption underway, L2 share approaching 20–30% of daily transactions.',
    '- **March 2024 — Dencun (EIP-4844)**: blobs introduced, L2 settlement cost ~10× cheaper. L2 share accelerated sharply.',
    '- **2024–2025**: L2s overtake mainnet by daily transactions; share keeps climbing.',
    '- **May 2025 — Pectra**: blob capacity doubled (target 3 → 6 per block).',
    '- **December 2025 — Fusaka (BPO1/BPO2)**: PeerDAS shipped; blob target raised to 14 per block by January 2026. Another step up in L2 capacity headroom.',
    '- **Today** ({{l2_share_data_date}}): L2s account for **{{l2_share_txcount_daily}}** of daily transactions and **{{l2_share_throughput_daily}}** of daily throughput.',
    '',
    'Historical charts: [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',

    '# Methodology and data sources',
    '**How the answer is derived:**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to the curated L2 universe (bucket !== \"Layer 1\", deployment === \"PROD\", excludes sidechains and aggregate keys).",
    "2. For Ethereum mainnet, pull `/v1/metrics/chains/ethereum/{metric}.json` (period-native daily / weekly / monthly buckets).",
    "3. For the L2 ecosystem total, pull `/v1/metrics/chains/all_l2s/{metric}.json` (the aggregate endpoint). If that endpoint isn't reachable, fall back to summing each L2 in the curated universe.",
    "4. **L2 share = L2 ecosystem total / (L2 ecosystem total + Ethereum mainnet)**. **L1 share = Ethereum mainnet / (L2 + Ethereum mainnet)**. The two sum to 100%.",
    '',
    "All values shown were generated on {{l2_share_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. The share split on this page is computed mechanically from public API data — chains and Layer 1/2 classifications do not influence numbers, and supporters do not receive any adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [L2BEAT](https://l2beat.com) tracks per-L2 activity using its own chain-inclusion list — useful for confirming the direction even when absolute numbers differ slightly. [Etherscan](https://etherscan.io) provides Ethereum mainnet's standalone transaction count for verifying the L1 side. Variances across providers usually reduce to chain-inclusion differences, not different math.",
    '',
    '# Related answers',
    'Same underlying data, different framings:',
    '- **[/answers/is-ethereum-scaling-through-l2s](/answers/is-ethereum-scaling-through-l2s)** — the same split expressed as a multiplier ("L2s do Nx more than mainnet").',
    '- **[/answers/ethereum-ecosystem-tps](/answers/ethereum-ecosystem-tps)** — combined L1 + L2 TPS, with the share as a sub-claim.',
    '- **[/answers/ethereum-l2-transaction-count](/answers/ethereum-l2-transaction-count)** — L2-only ecosystem totals, with the per-L2 contributors breakdown.',
    '- **[/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2)** — per-chain L2 leaderboards across throughput, transactions, and active addresses.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'L2 share data currently unavailable. See growthepie.com/fundamentals/throughput for the live L2 vs mainnet view.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/throughput' },
    { name: 'Ethereum Mainnet', url: '/chains/ethereum' },
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
    { name: 'Scaling', url: '/ethereum-ecosystem' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default percentageOfEthereumActivityOnL2s;
