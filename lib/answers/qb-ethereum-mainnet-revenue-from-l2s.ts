import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'How much does Ethereum mainnet earn from L2s?',
    a: 'As of {{l2_rent_data_date}} UTC, Ethereum L2s pay Ethereum mainnet approximately **{{l2_rent_daily}}** per day in settlement fees, **{{l2_rent_30d}}** per month, **{{l2_rent_90d}}** over 90 days, and **{{l2_rent_alltime}}** all-time across {{l2_rent_universe_size}} tracked L2s. The top contributor over the last 30 days is **{{l2_rent_top_contributor}}**. Live leaderboards: [growthepie.com/economics](https://www.growthepie.com/economics).',
  },
  {
    q: 'What is "L2 rent" exactly?',
    a: '**Rent** is the L1 gas fee an L2 pays to Ethereum mainnet when it posts its batched transaction data (or proofs) back to L1. Every L2 has to settle on Ethereum periodically — that\'s what makes it an L2 — and each settlement transaction costs L1 gas, paid in ETH to Ethereum validators (post-Merge) and burned as base fee (post-EIP-1559). growthepie tracks this number per chain per day; the sum across all L2s is what Ethereum mainnet collectively earns from the rollup ecosystem.',
  },
  {
    q: 'How much has Ethereum earned from L2s all-time?',
    a: 'Approximately **{{l2_rent_alltime}}** cumulatively (data {{l2_rent_data_date}} UTC, across {{l2_rent_universe_size}} tracked L2s). This is the sum of every L1 settlement fee paid by every L2 since growthepie started tracking the metric. The number grew dramatically through 2023 (rollup adoption) but slowed after the **Dencun upgrade** in March 2024 — Dencun introduced blobs (EIP-4844), which made L2 settlement ~10× cheaper. Fusaka (December 2025) further reduced per-blob settlement cost.',
  },
  // ----- Per-window detail -----
  {
    q: 'How much does Ethereum earn from L2s per day?',
    a: 'On the latest day in growthepie\'s data ({{l2_rent_data_date}} UTC), Ethereum L2s collectively paid **{{l2_rent_daily}}** to Ethereum mainnet in settlement fees. The number fluctuates day-to-day with L2 activity and L1 base fee.',
  },
  {
    q: 'How much does Ethereum earn from L2s per month?',
    a: 'Over the most recent 30 days ending {{l2_rent_data_date}} UTC, Ethereum L2s collectively paid **{{l2_rent_30d}}** to Ethereum mainnet.',
  },
  {
    q: 'How much does Ethereum earn from L2s per quarter?',
    a: 'Over the most recent 90 days ending {{l2_rent_data_date}} UTC, Ethereum L2s collectively paid **{{l2_rent_90d}}** to Ethereum mainnet.',
  },
  // ----- Contributors -----
  {
    q: 'Which L2 pays Ethereum mainnet the most rent?',
    a: 'Over the last 30 days (data {{l2_rent_data_date}} UTC), the top three L2 contributors are {{l2_rent_top_contributors_top3}}. Larger L2s by activity tend to dominate this list — more activity means more batches to post means more L1 fees paid.',
  },
  // ----- Mechanics -----
  {
    q: 'Does L2 rent go directly to Ethereum?',
    a: 'It goes to Ethereum **validators** (the priority-fee portion) and to **burn** (the base-fee portion, since EIP-1559 in August 2021). Specifically: when an L2 posts a batch transaction to L1, it pays a base fee that\'s burned plus a priority tip that the proposer keeps. So L2 settlement fees are split between validator income and ETH supply contraction — which directly affects whether Ethereum is deflationary. See [/answers/is-ethereum-deflationary](/answers/is-ethereum-deflationary).',
  },
  {
    q: 'How did Dencun affect L2 rent to mainnet?',
    a: 'Dencun (March 2024) introduced **blobs** via EIP-4844 — a new transaction type optimised specifically for L2 data availability. Before Dencun, L2s posted their data as calldata, which is expensive. After Dencun, they post as blobs, which costs ~10× less. The effect: **per-L2-transaction L1 settlement cost dropped by an order of magnitude overnight**. L2 fees to users dropped roughly proportionally, and Ethereum mainnet\'s rent revenue from L2s dropped too — though the lower per-unit cost was partly offset by higher L2 activity.',
  },
  {
    q: 'How did Fusaka affect L2 rent to mainnet?',
    a: 'Fusaka (December 2025) tripled the blob target from 6 to 14 per block, and BPO2 raised it again in January 2026. More blob capacity = more L2 activity at the same per-blob price = more rent paid to mainnet in absolute terms, even at lower per-transaction cost. Fusaka also introduced **EIP-7918**, a floor on blob fees that prevented the "zero-fee blob era" — ensuring L2 rent stays meaningful even during quiet network periods. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed).',
  },
  // ----- Methodology -----
  {
    q: 'How is "rent paid" calculated?',
    a: 'Per-chain, per-day: growthepie aggregates all L1 transactions made by each L2\'s posting contract (batch submitter, proof verifier, etc.) and sums the gas fees paid. The number is published as a daily USD value in `/v1/metrics/chains/{chain}/rent_paid.json`. This page sums per-chain daily values over windows (30d / 90d / all-time) and across the L2 universe to produce the totals.',
  },
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain — it doesn\'t pay rent to Ethereum mainnet because it doesn\'t settle to Ethereum. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain) for the distinction.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_rent_universe_size}} chains. The full list (computed on {{l2_rent_data_date}} UTC): {{l2_rent_universe_list}}. Sidechain exclusions: {{l2_rent_excluded_sidechains}}.',
  },
  {
    q: 'Where can I see this data live?',
    a: 'growthepie\'s [economics dashboard](https://www.growthepie.com/economics) breaks down per-chain revenue, costs, and profit with timeseries charts. Per-chain pages (e.g. [/chains/base](https://www.growthepie.com/chains/base)) show rent paid history. [ultrasound.money](https://ultrasound.money/) tracks the burn side directly.',
  },
  {
    q: 'How does this relate to L2 profitability?',
    a: 'Two sides of the same transaction. **L2 rent to mainnet** = the L1 cost an L2 pays to settle. **L2 profit** = the L2\'s revenue minus that L1 cost. The two are linked: every dollar of rent paid is a dollar of cost for the L2 (and a dollar of revenue for Ethereum mainnet). See [/answers/most-profitable-ethereum-l2](/answers/most-profitable-ethereum-l2) for the L2-side ranking.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/ethereum-mainnet-revenue-from-l2s';
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
    '@id': 'https://www.growthepie.com/datasets/l2-rent-to-mainnet',
    name: 'Ethereum L2 → Mainnet Rent Paid (per chain, daily, USD)',
    description:
      'Daily L1 settlement fees ("rent") paid by every tracked Ethereum L2 to Ethereum mainnet, in USD. Summed across L2s to compute total mainnet revenue from the rollup ecosystem.',
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
      'Rent paid',
      'Settlement fees',
      'Ethereum revenue',
      'L1 economics',
    ],
    measurementTechnique:
      'Per-chain per-day aggregation of L1 gas fees paid by each L2\'s posting contract (batch submitter, proof verifier, blob carrier). 30d / 90d / all-time totals computed by summing daily values; ecosystem totals computed by summing across the L2 universe.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'rent_paid_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/rent_paid.json',
        description: 'Per-chain daily rent-paid timeseries.',
      },
    ],
  },
];

const ethereumMainnetRevenueFromL2s: QuickBiteData = createQuickBite({
  title: 'How much does Ethereum mainnet earn from L2s?',
  subtitle:
    'L2 settlement fees ("rent") paid to Ethereum mainnet — daily, monthly, quarterly, and all-time totals, plus the top L2 contributors.',
  shortTitle: 'L2 Rent to Mainnet',
  summary:
    "Ethereum L2s pay Ethereum mainnet a settlement fee (\"rent\") every time they post their batched transaction data and proofs back to L1. growthepie tracks this per-chain, per-day. Summed across all tracked L2s, this is how much Ethereum mainnet earns from the rollup ecosystem. After Dencun (March 2024) per-L2-transaction settlement cost dropped ~10×, then Fusaka (December 2025) tripled blob capacity again. Recomputed daily.",
  content: [
    "**Short answer (data {{l2_rent_data_date}} UTC):** Ethereum L2s pay Ethereum mainnet approximately **{{l2_rent_daily}}** per day, **{{l2_rent_30d}}** per month, **{{l2_rent_90d}}** over 90 days, and **{{l2_rent_alltime}}** all-time in L1 settlement fees. The top L2 contributor over the last 30 days is **{{l2_rent_top_contributor}}**.",

    "> Rent = the L1 gas fee an L2 pays when it posts batches (or proofs) to Ethereum mainnet. Summed across all tracked L2s, this is what Ethereum mainnet collectively earns from the rollup ecosystem.",

    '# L2 → mainnet rent totals',
    '{{l2_rent_dense}}',
    '',
    '- **Daily** ({{l2_rent_data_date}}): **{{l2_rent_daily}}** paid to Ethereum mainnet.',
    '- **Last 30 days**: **{{l2_rent_30d}}**.',
    '- **Last 90 days**: **{{l2_rent_90d}}**.',
    '- **All-time (cumulative)**: **{{l2_rent_alltime}}**.',

    '# Where does this money go?',
    'Every L1 transaction (including L2 batch posts) pays an Ethereum gas fee. Since **EIP-1559** (August 2021), that gas fee splits into two parts:',
    '- **Base fee** — burned (permanently removed from circulation). This is where the bulk of L2 rent goes. It directly affects ETH supply and is one of the main reasons Ethereum has periods of deflation. See [/answers/is-ethereum-deflationary](/answers/is-ethereum-deflationary).',
    '- **Priority fee (tip)** — paid to the validator that included the transaction in a block.',
    '',
    'So L2 rent doesn\'t go to "Ethereum" as an entity — it splits between **ETH supply reduction** (base fee burn) and **validator income** (priority fees). Both benefit ETH holders, but through different mechanisms.',

    '# Which L2s contribute the most?',
    "Top contributors over the last 30 days (data {{l2_rent_data_date}} UTC): **{{l2_rent_top_contributors_top3}}**. Larger L2s by activity dominate — more L2 transactions mean more batches to settle mean more L1 fees paid. See the table for the full top 10 with each chain's share of the L2 ecosystem total.",

    '# How upgrades have affected L2 rent',
    '**Dencun (March 2024)** — introduced blobs via EIP-4844. L2s switched from posting calldata (expensive) to blobs (~10× cheaper). Per-L2-transaction settlement cost dropped sharply; L2 user fees dropped roughly proportionally; aggregate L1 rent revenue dropped but was partly offset by higher L2 activity.',
    '',
    '**Pectra (May 2025)** — doubled blob capacity (target 3→6 per block). More headroom for L2 activity without driving the blob fee market into escalation.',
    '',
    '**Fusaka (December 2025) + BPO1/BPO2** — tripled blob target to 14 per block by January 2026. Also introduced **EIP-7918**, a floor on blob fees that ended the "zero-fee blob era" — ensuring L2 rent remains meaningful even during low-demand periods. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed) and [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed).',
    '',
    'Net effect of the 2024–2026 sequence: **per-L2-transaction cost down sharply, aggregate L2 activity up sharply**. Total rent to mainnet over time has been a noisy curve rather than monotonic growth or decline.',

    '# Methodology and data sources',
    '**How the answer is derived:**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to L2s.",
    "2. For each L2, pull `/v1/metrics/chains/{chain}/rent_paid.json` — daily timeseries of L1 settlement fees in USD.",
    '3. Sum each chain\'s daily values over the last 30 days, 90 days, and the entire series. Sum across L2s for ecosystem totals.',
    '4. Rank contributors by 30-day rent paid (descending) for the leaderboard table.',
    '',
    "All values shown were generated on {{l2_rent_data_date}} UTC.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Rent values are computed mechanically from public API data — chains don't influence the ranking. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [ultrasound.money](https://ultrasound.money/) tracks total ETH burn (which includes L2 base-fee burn). [L2BEAT's costs view](https://l2beat.com) tracks per-L2 data-posting costs. growthepie's [economics dashboard](https://www.growthepie.com/economics) shows the full revenue/cost/profit breakdown per chain.",
    '',
    '# Which chains are included?',
    'The list of **{{l2_rent_universe_size}}** chains: {{l2_rent_universe_list}}. **Excluded:** Ethereum mainnet (L1), sidechains like Polygon PoS (don\'t settle to Ethereum), aggregate keys.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/economics for the live Ethereum L2 economics leaderboard.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { icon: 'gtp-metrics-economics', name: 'Economics', url: '/economics' },
    { name: 'Layer 2', url: '/economics' },
    { name: 'Ethereum Mainnet', url: '/chains/ethereum' },
    { name: 'Rent paid', url: '/economics' },
    { name: 'EIP-1559', url: '/quick-bites/eth-supply' },
  ],
  icon: 'gtp-metrics-economics',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default ethereumMainnetRevenueFromL2s;
