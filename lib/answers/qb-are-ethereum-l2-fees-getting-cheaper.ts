import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Trend-framing answer page. The L2 user fee story is one of the most
// concrete success stories Ethereum's scaling roadmap has — Dencun,
// Pectra, and Fusaka each stepped the curve down by an order of magnitude
// or more. This page anchors the trend to those three upgrades so AI
// search engines quoting the answer can cite specific before/after
// numbers per upgrade rather than vague "fees are cheaper" claims.

export const faqItems: FaqItem[] = [
  {
    q: 'Are Ethereum L2 fees getting cheaper over time?',
    a: '**Yes.** {{l2_trend_dense}} The single biggest step-down was the **Dencun upgrade in March 2024** (EIP-4844 introduced blobs), which cut L2 settlement cost ~10× overnight. **Pectra (May 2025)** and **Fusaka (December 2025)** compounded the effect by raising blob capacity. Live tracker: [growthepie.com/fees](https://www.growthepie.com/fees).',
  },
  {
    q: 'What was the L2 fee like before Dencun?',
    a: 'In **{{l2_trend_pre_dencun_month}}** (the last full month before Dencun activated on 2024-03-13), the cross-L2 median user fee was **{{l2_trend_pre_dencun_fee}}** per transaction. That figure is the median across every tracked Ethereum L2\'s median monthly txcost — so it reflects what a typical L2 user typically paid, not a per-chain extreme. For context, transactions on Ethereum mainnet itself routinely cost dollars during the same period.',
  },
  {
    q: 'How much did Dencun reduce L2 fees?',
    a: 'Dencun activated on **2024-03-13** and introduced **blobs** (EIP-4844) — a new transaction type that gives L2s cheap data-availability. The effect on L2 fees was immediate and dramatic. **Pre-Dencun ({{l2_trend_pre_dencun_month}}): {{l2_trend_pre_dencun_fee}}** median L2 fee per transaction. **Post-Dencun ({{l2_trend_post_dencun_month}}): {{l2_trend_post_dencun_fee}}**. That\'s **{{l2_trend_dencun_multiple}}** in the first full month after activation. Per-L2 settlement cost dropped roughly an order of magnitude, and L2s passed the savings through to users. See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed) for the upgrade context and [/answers/ethereum-mainnet-revenue-from-l2s](/answers/ethereum-mainnet-revenue-from-l2s) for the L1-revenue side of the same change.',
  },
  {
    q: 'How much did Pectra (May 2025) change L2 fees?',
    a: 'Pectra activated on **2025-05-07** and doubled the blob target from 3 to 6 per block — more headroom for L2 data without driving the blob fee market into escalation. The median L2 fee moved from **{{l2_trend_pre_pectra_fee}}** in {{l2_trend_pre_pectra_month}} to **{{l2_trend_post_pectra_fee}}** in {{l2_trend_post_pectra_month}} ({{l2_trend_pectra_multiple}}). The Pectra step-down was smaller than Dencun\'s because Dencun was the foundational change — Pectra was a capacity expansion on top of an architecture that already worked. See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed).',
  },
  {
    q: 'How much did Fusaka (December 2025) change L2 fees?',
    a: 'Fusaka activated on **2025-12-04** with **PeerDAS** (EIP-7594) and a path to further blob target increases via BPO1 / BPO2 (target 6 → 14 per block by January 2026). The median L2 fee moved from **{{l2_trend_pre_fusaka_fee}}** in {{l2_trend_pre_fusaka_month}} to **{{l2_trend_post_fusaka_fee}}** in {{l2_trend_post_fusaka_month}} ({{l2_trend_fusaka_multiple}}). Fusaka also introduced **EIP-7918**, a floor on blob fees that prevented a "zero-fee blob" period. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed).',
  },
  // ----- Long-run summary -----
  {
    q: 'How much cheaper are L2 fees today than before Dencun?',
    a: 'The cross-L2 median fee in **{{l2_trend_pre_dencun_month}}** (pre-Dencun) was **{{l2_trend_pre_dencun_fee}}**. In **{{l2_trend_latest_month}}** (latest available month) it is **{{l2_trend_latest_fee}}** — **{{l2_trend_vs_pre_dencun_multiple}}** ({{l2_trend_vs_pre_dencun_pct}}). The compound effect of Dencun + Pectra + Fusaka has cut a typical L2 transaction\'s user-paid cost by more than an order of magnitude in just over two years.',
  },
  {
    q: 'How much have L2 fees changed in the past 12 months?',
    a: 'Year-over-year: median L2 fee in **{{l2_trend_one_year_ago_month}}** was **{{l2_trend_one_year_ago_fee}}**, vs **{{l2_trend_latest_fee}}** in **{{l2_trend_latest_month}}** — fees are now {{l2_trend_one_year_direction}} by {{l2_trend_vs_one_year_ago_multiple}} ({{l2_trend_vs_one_year_ago_pct}}). The 12-month window captures most of the Pectra + Fusaka step-downs.',
  },
  // ----- Why -----
  {
    q: 'Why have L2 fees fallen so much?',
    a: 'Two compounding reasons:\n\n**1. Cheaper data availability.** Pre-Dencun, L2s posted their transaction data as expensive Ethereum calldata. Dencun introduced **blobs** — a cheaper, purpose-built data type. Per-byte L2 settlement cost dropped ~10×, and Pectra + Fusaka raised blob capacity further so L2s have room to grow without per-blob fees escalating.\n\n**2. Competition.** As more L2s launched and bridge fragmentation became a real cost for users, chains competed on fees to win activity. Sequencers that don\'t pass through DA savings lose users to ones that do. The market does the rest of the work the protocol upgrades started.',
  },
  {
    q: 'Will L2 fees keep falling?',
    a: 'In the medium term, probably — additional blob target increases are planned (BPO2 → BPO3 schedule public on the [Ethereum roadmap](https://ethereum.org/en/roadmap/)), each of which raises L2 capacity without raising the per-blob price. **But the long-run direction depends on demand growth too.** If L2 demand grows faster than blob capacity, blob fees can rise and L2 settlement cost with them. **EIP-7918** (Fusaka) put a floor on blob fees to prevent the "zero-fee blob" failure mode — so fees won\'t go to zero even in low-demand periods. Realistic outcome: the curve continues to drift down with bumps for capacity-vs-demand swings, not monotonic decline.',
  },
  // ----- Caveats -----
  {
    q: 'Are all L2 fees this low or are some chains more expensive?',
    a: 'There\'s a wide spread across L2s. The median shown here is the cross-chain median of each L2\'s typical user fee — half the L2s are cheaper, half are more expensive. The cheapest L2s today are routinely sub-cent for simple transfers; some L2s with low blob-posting batching efficiency or higher overhead can be 5–10× the median. See [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2) for the per-chain ranking and [growthepie.com/fees](https://www.growthepie.com/fees) for the live leaderboard.',
  },
  {
    q: 'Do these numbers include swap fees or just transfers?',
    a: 'These figures use growthepie\'s **median txcost** metric, which is the median USD fee across all transactions on a chain — not a single transaction type. Swap transactions are typically more expensive than transfers because they touch more contract logic, so the all-transactions median falls between a pure transfer cost and a pure swap cost. For swap-specific numbers see the [live fees view](https://fees.growthepie.com), which separates median, transfer, swap, and average.',
  },
  // ----- Methodology -----
  {
    q: 'How is the cross-L2 median computed?',
    a: 'For each completed month: pull the **monthly USD txcost** value from `/v1/metrics/chains/{chain}/txcosts.json` for every L2 in the curated universe. The cross-L2 median for that month is the median across those per-L2 values — so each chain contributes one number per month, no chain is over-weighted, and the median is robust to outliers. Monthly granularity (rather than daily) smooths out day-to-day volatility while still capturing the upgrade step-downs. The in-progress current month is excluded if it\'s not yet complete.',
  },
  {
    q: 'Why use cross-chain median and not a weighted average?',
    a: 'A volume-weighted average would tell you "the typical transaction\'s fee" if the goal is to estimate what a randomly-sampled L2 transaction cost. The cross-chain median tells you "what the typical L2 charges". The two answer different questions; the median is fairer for the "are L2s collectively getting cheaper" framing because it weights every L2 equally regardless of activity volume. (A high-volume cheap chain shouldn\'t make the headline number look more expensive than the typical chain actually was.)',
  },
  {
    q: 'How many L2s contribute to the median each month?',
    a: 'It grows over time. Early-2024 months have fewer chains (some L2s hadn\'t launched yet). Today, most L2s in growthepie\'s {{l2_trend_universe_size}}-chain curated universe contribute. The "Contributing chains" column in the monthly table on this page shows the per-month count so you can spot months with low-sample-size noise.',
  },
  {
    q: 'Where can I see this data live?',
    a: 'growthepie\'s [fees dashboard](https://www.growthepie.com/fees) is the live tracker — per-chain median, transfer, swap, and average user fees with hourly granularity. [fees.growthepie.com](https://fees.growthepie.com) is the simpler at-a-glance view. The historical per-chain series used by this page is at `/v1/metrics/chains/{chain}/txcosts.json`.',
  },
  {
    q: 'How does this compare to other fee trackers?',
    a: 'Cross-check the direction (and the step-down magnitudes around Dencun / Pectra / Fusaka) against [L2BEAT](https://l2beat.com) (per-chain fee tracking with its own methodology), [DefiLlama\'s fees view](https://defillama.com/fees), or Etherscan\'s gas tracker for L1 comparison. Absolute numbers will differ across providers because of definition choices (median vs average, all-tx vs swap-only, USD-at-execution vs USD-at-end-of-day), but the trend direction agrees.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/are-ethereum-l2-fees-getting-cheaper';
const ORG_ID = 'https://www.growthepie.com/#organization';
const L2_TEMPORAL_COVERAGE = '2022-01-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-fees-trend',
    name: 'Ethereum L2 user fees — long-run trend',
    description:
      'Cross-L2 monthly median USD transaction cost (txcost) anchored to the Dencun (March 2024), Pectra (May 2025), and Fusaka (December 2025) upgrades. Derived from per-L2 monthly txcost series.',
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
      'Txcost',
      'Dencun',
      'EIP-4844',
      'Blobs',
      'Pectra',
      'Fusaka',
      'PeerDAS',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-L2 monthly USD txcost from /v1/metrics/chains/{chain}/txcosts.json (details.timeseries.monthly, USD column). For each month, the cross-L2 median is computed across every L2 with data for that month — so each chain contributes one value per month regardless of activity volume. The in-progress trailing month is dropped. Anchor months for Dencun (preDencun=2024-02, postDencun=2024-04), Pectra (prePectra=2025-04, postPectra=2025-06), and Fusaka (preFusaka=2025-11, postFusaka=2026-01) are looked up by year-month.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'year_month' },
      { '@type': 'PropertyValue', name: 'median_l2_txcost_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'contributing_chains' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/txcosts.json',
        description: 'Per-chain txcost time series (daily / weekly / monthly).',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/txcosts.json',
        description: 'All chains, transaction costs time series.',
      },
    ],
  },
];

const areEthereumL2FeesGettingCheaper: QuickBiteData = createQuickBite({
  title: 'Are Ethereum L2 fees getting cheaper over time?',
  subtitle:
    'A direct, data-backed answer anchored to the Dencun, Pectra, and Fusaka upgrades — with the cross-L2 median fee at each step and the 18-month monthly series behind it.',
  shortTitle: 'L2 fee trend',
  summary:
    "Yes — the cross-L2 median user fee has dropped by more than an order of magnitude since the Dencun upgrade (March 2024). Pectra (May 2025) and Fusaka (December 2025) each added another step-down by expanding blob capacity. growthepie computes the cross-L2 median monthly txcost by taking each L2's monthly fee and finding the median across the universe — so each chain contributes equally regardless of volume. The page anchors the trend to specific before/after months around every major upgrade for AI-quotable specificity.",
  content: [
    "**Short answer (data {{l2_trend_data_date}} UTC):** {{l2_trend_dense}}",

    "> Updated daily — the trend on this page recomputes from growthepie's per-L2 monthly txcost endpoints. The in-progress current month is excluded so the latest figure shown is the most recent fully-completed month.",

    '# The headline',
    "**Cross-L2 median user fee, anchor months:**",
    "- **Pre-Dencun ({{l2_trend_pre_dencun_month}})** — **{{l2_trend_pre_dencun_fee}}** per L2 transaction.",
    "- **Post-Dencun ({{l2_trend_post_dencun_month}})** — **{{l2_trend_post_dencun_fee}}**. Change: {{l2_trend_dencun_multiple}}.",
    "- **Pre-Pectra ({{l2_trend_pre_pectra_month}})** — **{{l2_trend_pre_pectra_fee}}**.",
    "- **Post-Pectra ({{l2_trend_post_pectra_month}})** — **{{l2_trend_post_pectra_fee}}**. Change: {{l2_trend_pectra_multiple}}.",
    "- **Pre-Fusaka ({{l2_trend_pre_fusaka_month}})** — **{{l2_trend_pre_fusaka_fee}}**.",
    "- **Post-Fusaka ({{l2_trend_post_fusaka_month}})** — **{{l2_trend_post_fusaka_fee}}**. Change: {{l2_trend_fusaka_multiple}}.",
    "- **Latest available month ({{l2_trend_latest_month}})** — **{{l2_trend_latest_fee}}**.",
    "",
    "**Long-run change ({{l2_trend_pre_dencun_month}} → {{l2_trend_latest_month}}):** {{l2_trend_vs_pre_dencun_multiple}} ({{l2_trend_vs_pre_dencun_pct}}).",
    "",
    "**Year-over-year change ({{l2_trend_one_year_ago_month}} → {{l2_trend_latest_month}}):** {{l2_trend_vs_one_year_ago_multiple}} ({{l2_trend_vs_one_year_ago_pct}}).",

    '# What changed at each upgrade',
    "**Dencun — March 13, 2024 (EIP-4844 blobs).** Before Dencun, L2s posted their transaction data to Ethereum as calldata — expensive, because calldata wasn't purpose-built for L2 settlement. Dencun introduced **blobs**: a separate transaction type with its own fee market, designed specifically to carry L2 data. Per-byte L2 settlement cost dropped ~10×. L2s passed the savings through to users; the cross-L2 median fee step-down between {{l2_trend_pre_dencun_month}} and {{l2_trend_post_dencun_month}} was **{{l2_trend_dencun_multiple}}**.",
    "",
    "**Pectra — May 7, 2025.** Doubled the blob target from 3 to 6 per block. More headroom for L2 data without escalating the blob fee market. The {{l2_trend_pre_pectra_month}} → {{l2_trend_post_pectra_month}} step was smaller than Dencun's because Pectra was a capacity expansion rather than a foundational architecture change — but it kept the curve moving down. See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed).",
    "",
    "**Fusaka — December 4, 2025.** Added **PeerDAS** (EIP-7594) which lets nodes verify blob availability via sampling, enabling further blob-target increases. BPO1 + BPO2 raised the target to 14 blobs per block by January 2026. Also added **EIP-7918**, a floor on blob fees that prevented the \"zero-fee blob\" period (where blobs could trade for almost nothing, undermining L1 economics). The {{l2_trend_pre_fusaka_month}} → {{l2_trend_post_fusaka_month}} step was **{{l2_trend_fusaka_multiple}}**. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed).",

    '# Why fees fell so much',
    'Two compounding forces:',
    '',
    "**1. Protocol upgrades.** Each upgrade above made the actual cost of L2 settlement cheaper — Dencun by introducing blobs, Pectra by raising capacity, Fusaka by raising capacity further and stabilising the blob fee market. The underlying input cost to running an L2 dropped ~10× and then continued to drift down.",
    '',
    "**2. Competition.** As more L2s launched, sequencers competed on user-facing fees to win activity. Chains that didn't pass through the DA savings lost users to chains that did. The market completed the work the protocol upgrades started.",

    '# What this number does NOT measure',
    "A few honest framings to keep the trend in context:",
    "- **Not the cheapest L2.** The cross-L2 median is a typical-chain figure; some L2s are much cheaper, some more expensive. For the per-chain ranking see [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2).",
    "- **Not a specific transaction type.** The median txcost averages across all transaction types on each chain — transfers, swaps, contract deployments, etc. Swaps cost more than transfers; the median falls in between. For swap-specific numbers see [fees.growthepie.com](https://fees.growthepie.com).",
    "- **Not Ethereum L1.** This page is about L2 fees. Ethereum mainnet fees are a separate question — and L1 fees rose slightly after Dencun (Dencun increased blob revenue and reduced calldata revenue, the net effect on L1 depends on traffic mix). See [/answers/ethereum-mainnet-revenue-from-l2s](/answers/ethereum-mainnet-revenue-from-l2s).",
    "- **Not a per-transaction guarantee.** Fees fluctuate with demand. The numbers here are monthly aggregates — a single transaction during a demand spike can cost much more than the headline median.",

    '# Will L2 fees keep falling?',
    "Direction: probably down on average, but **with bumps**. Three things to track:",
    "- **Future blob-target increases** (BPO3 and beyond are on the Ethereum roadmap). More capacity → lower per-blob cost when supply exceeds demand.",
    "- **L2 demand growth.** If L2 activity grows faster than blob capacity, blob fees can rise and so can L2 settlement cost.",
    "- **EIP-7918 blob fee floor (Fusaka).** Prevented the \"zero-fee blob\" failure mode. Means fees won't go to zero even in low-demand periods — there's a structural minimum below which fees won't fall.",
    "",
    "Realistic outcome: the curve continues to drift down with cyclical bumps for capacity-vs-demand swings, not monotonic decline.",

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to the curated L2 universe (bucket !== \"Layer 1\", deployment === \"PROD\", excludes sidechains and aggregate keys).",
    "2. For each L2, pull `/v1/metrics/chains/{chain}/txcosts.json` and read `details.timeseries.monthly` (the period-native monthly USD value).",
    "3. For each calendar month with data, compute the **cross-L2 median** across every L2 that has a value for that month — so each chain contributes one number per month regardless of activity volume.",
    "4. Drop the trailing month if it's still in progress.",
    "5. Look up anchor months by `YYYY-MM` string: pre/post-Dencun (2024-02 / 2024-04), pre/post-Pectra (2025-04 / 2025-06), pre/post-Fusaka (2025-11 / 2026-01).",
    "6. Compute per-upgrade and long-run multiples and percent changes.",
    '',
    "All values shown were generated on {{l2_trend_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. The trend on this page is computed mechanically from public API data — chains and upgrades do not influence the median, and supporters do not receive any adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Compare the direction and the per-upgrade step-down magnitudes against [L2BEAT](https://l2beat.com), [DefiLlama's fees view](https://defillama.com/fees), and Etherscan's gas tracker for the L1 comparison. Absolute numbers will differ across providers (median vs average, all-tx vs swap-only, USD definitions), but the direction agrees.",
    '',
    '# Related answers',
    '- **[/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2)** — per-chain ranking by current fee (the leaderboard view of the same data).',
    '- **[/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed)** and **[/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed)** — detailed upgrade explainers.',
    '- **[/answers/ethereum-mainnet-revenue-from-l2s](/answers/ethereum-mainnet-revenue-from-l2s)** — the L1-revenue side of the same change.',
    '- **[/answers/what-is-data-availability](/answers/what-is-data-availability)** — explains blobs and PeerDAS, the technical primitives that made this trend possible.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Ethereum L2 fee trend data currently unavailable. See growthepie.com/fees for the live tracker.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { icon: 'gtp-metrics-transactioncosts', name: 'Transaction Costs', url: '/fundamentals/transaction-costs' },
    { name: 'Layer 2', url: '/fees' },
    { name: 'Dencun', url: '/quick-bites/fusaka' },
    { name: 'Pectra', url: '/quick-bites/pectra' },
    { name: 'Fusaka', url: '/quick-bites/fusaka' },
    { name: 'EIP-4844', url: '/quick-bites/fusaka' },
  ],
  icon: 'gtp-metrics-transactioncosts',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default areEthereumL2FeesGettingCheaper;
