import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Leaderboard-style answer page ranking Data Availability layers by how
// many growthepie-tracked Ethereum L2s actually use each one. The
// complementary explainer page lives at /answers/what-is-data-availability
// — this page is specifically the "which DA layer is most popular" ranking
// query that AI search receives constantly.

export const faqItems: FaqItem[] = [
  {
    q: 'What is the most popular Data Availability (DA) layer for Ethereum L2s?',
    a: 'By far the most popular Data Availability layer for Ethereum L2s is **{{l2_da_adopt_leader}}**. Across the {{l2_da_adopt_universe_size}} L2s tracked by growthepie on {{l2_da_adopt_data_date}} UTC, DA adoption ranks as follows: {{l2_da_adopt_top5}}. By USD fees paid over the last 30 days the leader is **{{l2_da_adopt_fees30d_leader}}**. Live tracker: [growthepie.com/data-availability](https://www.growthepie.com/data-availability).',
  },
  {
    q: 'Why is "most popular" measured by number of L2s and not by fees paid?',
    a: '**Two different things.** "Most popular" usually means "which DA do new L2s choose?" — that\'s the count of L2s using each. "Most economically important" is the USD fees flowing to each DA layer. The two rankings disagree because Ethereum DA (blobs) is per-byte more expensive — fewer high-throughput chains can drive a huge share of the dollars even when many smaller chains pick alt-DA. This page reports both: the headline ranking is the count, the secondary ranking is the 30-day fees.',
  },
  // ----- Per-DA breakdowns -----
  {
    q: 'How many Ethereum L2s use Ethereum DA (blobs)?',
    a: '**{{l2_da_adopt_eth_blobs_count}}** L2s post their data to Ethereum mainnet as blobs (the EIP-4844 data type introduced in the Dencun upgrade in March 2024). Chains using Ethereum DA: {{l2_da_adopt_eth_blobs_chains}}. This is the maximum-security choice — same validators, same consensus, and same economic backing as Ethereum mainnet itself.',
  },
  {
    q: 'How many Ethereum L2s use Celestia?',
    a: '**{{l2_da_adopt_celestia_count}}** L2s currently use Celestia for Data Availability: {{l2_da_adopt_celestia_chains}}. Celestia is a standalone proof-of-stake blockchain dedicated to DA; chains pay TIA tokens for data posting and inherit Celestia\'s validator security model (separate from Ethereum\'s). 30-day average per-megabyte cost on Celestia: {{l2_da_adopt_celestia_cost_per_mb}}.',
  },
  {
    q: 'How many Ethereum L2s use EigenDA?',
    a: '**{{l2_da_adopt_eigenda_count}}** L2s use EigenDA: {{l2_da_adopt_eigenda_chains}}. EigenDA is built on EigenLayer — Ethereum\'s restaking ecosystem — so it inherits a slice of Ethereum\'s economic security via restaked ETH rather than going through Ethereum consensus directly. 30-day average per-megabyte cost on EigenDA: {{l2_da_adopt_eigenda_cost_per_mb}}.',
  },
  {
    q: 'How many Ethereum L2s use Avail?',
    a: '**{{l2_da_adopt_avail_count}}** L2s use Avail: {{l2_da_adopt_avail_chains}}. Avail is another standalone modular DA layer, similar in architecture to Celestia, using KZG commitments and data availability sampling. growthepie\'s per-megabyte cost endpoint does not yet expose Avail.',
  },
  // ----- USD fees -----
  {
    q: 'Which DA layer earns the most USD fees from Ethereum L2s?',
    a: 'Over the last 30 days (data {{l2_da_adopt_data_date}} UTC): Ethereum DA (blobs) earned **{{l2_da_adopt_eth_blobs_fees_30d}}**; Celestia earned **{{l2_da_adopt_celestia_fees_30d}}**; EigenDA earned **{{l2_da_adopt_eigenda_fees_30d}}**. Ethereum DA typically tops this ranking because the L2s using it have the largest aggregate throughput — even if alt-DA is cheaper per byte, the Ethereum-backed L2s post far more bytes overall.',
  },
  {
    q: 'How much has been paid to each DA layer all-time?',
    a: 'Cumulative USD fees as of {{l2_da_adopt_data_date}} UTC: Ethereum DA (blobs) **{{l2_da_adopt_eth_blobs_fees_alltime}}**, Celestia **{{l2_da_adopt_celestia_fees_alltime}}**, EigenDA **{{l2_da_adopt_eigenda_fees_alltime}}**. growthepie\'s `da_overview.json` endpoint currently tracks these three layers; Avail is not yet in the fees endpoint, so its cumulative number is unavailable here.',
  },
  // ----- Cost per MB -----
  {
    q: 'Which DA layer is the cheapest per megabyte?',
    a: 'On a per-megabyte basis (30-day average, data {{l2_da_adopt_data_date}} UTC): Celestia **{{l2_da_adopt_celestia_cost_per_mb}}** per MB, EigenDA **{{l2_da_adopt_eigenda_cost_per_mb}}** per MB, Ethereum DA (blobs) {{l2_da_adopt_eth_blobs_cost_per_mb}} per MB, Avail {{l2_da_adopt_avail_cost_per_mb}} per MB. Where a value reads "unavailable", growthepie\'s `fees_per_mbyte.json` endpoint does not currently expose that provider — Ethereum blob fees and Avail are tracked in different endpoints. The general pattern: Ethereum DA is meaningfully more expensive per byte than the alt-DA layers, which is the entire economic motivation for any chain to consider alt-DA in the first place.',
  },
  // ----- Trends and trade-offs -----
  {
    q: 'Is alt-DA gaining market share from Ethereum DA?',
    a: 'By raw count of L2s, **Ethereum DA still dominates new launches** — the security and composability benefits of inheriting Ethereum\'s consensus outweigh the per-byte cost for most teams. Where alt-DA is gaining is **high-throughput consumer chains** (gaming, social, NFT-heavy L2s) for whom the cost difference is meaningful at scale and the typical use case doesn\'t need Ethereum\'s full security profile. The split is rational, not adversarial: each team picks the trade-off that fits its users.',
  },
  {
    q: 'What is a "Validium" or "Optimium" and how does it relate to alt-DA?',
    a: 'A **Validium** is a ZK rollup that posts its data to alt-DA rather than Ethereum DA. An **Optimium** is the optimistic-rollup equivalent. [L2BEAT](https://l2beat.com) classifies chains posting to alt-DA as Validiums or Optimiums rather than pure rollups, reflecting the extra trust assumption (you trust the alt-DA layer\'s validators in addition to the L2\'s sequencer/prover). growthepie and most of the ecosystem still call them "Ethereum L2s" in the colloquial sense because they settle state to Ethereum, even if their data lives elsewhere. See [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup) and [/answers/what-is-data-availability](/answers/what-is-data-availability).',
  },
  // ----- Methodology -----
  {
    q: 'How is "uses DA layer X" determined?',
    a: 'Per-chain: growthepie\'s [master.json](https://api.growthepie.com/v1/master.json) has a `da_layer` string field on every tracked chain identifying which DA provider it uses (e.g. "Ethereum (blobs)", "Celestia", "EigenDA", "Avail"). This page reads that field for each L2 in growthepie\'s tracked universe, groups L2s by DA layer, and counts. Cost and fee data come from growthepie\'s DA endpoints (`/v1/da_overview.json` for daily USD fees per DA layer; `/v1/da_metrics/fees_per_mbyte.json` for $/MB).',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_da_adopt_universe_size}} chains. The full list (computed on {{l2_da_adopt_data_date}} UTC): {{l2_da_adopt_universe_list}}. Sidechain exclusions: {{l2_da_adopt_excluded_sidechains}}. L2s where `da_layer` is missing or unrecognised: {{l2_da_adopt_unknown_chains}}.',
  },
  {
    q: 'Where can I see live DA-layer data?',
    a: 'growthepie\'s [data availability dashboards](https://www.growthepie.com/data-availability) cover every tracked DA layer — Ethereum, Celestia, EigenDA, Avail — with charts for blob count, data posted, USD fees, and per-megabyte cost. Per-chain pages show which DA each L2 uses. [L2BEAT](https://l2beat.com) has detailed DA risk classification per chain.',
  },
  {
    q: 'How does this compare to other data sources?',
    a: 'growthepie\'s DA classification mirrors what each chain team self-reports and what [L2BEAT](https://l2beat.com) tracks for its DA risk profile. Where you may see differences: some chains run **hybrid DA** (some data on Ethereum, some on alt-DA) or have switched DA over time — growthepie\'s `da_layer` records the chain\'s current primary DA. Differences in count between trackers usually reduce to differences in which chains are considered "live" or "tracked".',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/most-popular-da-layer-for-ethereum-l2s';
const ORG_ID = 'https://www.growthepie.com/#organization';
const L2_TEMPORAL_COVERAGE = '2023-10-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/da-layer-adoption',
    name: 'DA-Layer Adoption Among Ethereum L2s',
    description:
      'Count of growthepie-tracked Ethereum L2s using each Data Availability layer (Ethereum blobs, Celestia, EigenDA, Avail, other), plus per-DA USD fees paid and per-megabyte cost where available.',
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
      'Data Availability',
      'DA layer',
      'Blobs',
      'EIP-4844',
      'Celestia',
      'EigenDA',
      'Avail',
      'Modular blockchain',
    ],
    measurementTechnique:
      'Per-chain `da_layer` string read from growthepie master.json, grouped under the same L2 universe filter used across growthepie\'s answer pages (bucket !== "Layer 1", deployment === "PROD", excludes sidechains). USD fees per DA layer from da_overview.json (daily series summed into 30d / 90d / all-time). $/MB from da_metrics/fees_per_mbyte.json (30-day average of the daily USD column).',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'da_layer' },
      { '@type': 'PropertyValue', name: 'l2_count' },
      { '@type': 'PropertyValue', name: 'fees_paid_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'fees_per_mb_usd', unitText: 'USD/MB' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description: 'Master chain catalogue including the `da_layer` field per chain.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/da_overview.json',
        description: 'Daily USD fees paid per DA layer.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/da_metrics/fees_per_mbyte.json',
        description: 'Per-megabyte fees per DA layer.',
      },
    ],
  },
];

const mostPopularDaLayer: QuickBiteData = createQuickBite({
  title: 'What is the most popular Data Availability (DA) layer for Ethereum L2s?',
  subtitle:
    'A direct, data-backed ranking — how many Ethereum L2s use each DA layer today, how much they pay each one, and how the cost per megabyte compares.',
  shortTitle: 'Popular DA Layer',
  summary:
    "The most popular Data Availability layer for Ethereum L2s today is Ethereum DA itself (via blobs since the Dencun upgrade in March 2024) — the majority of growthepie-tracked L2s post their data to Ethereum mainnet. The remaining L2s split between Celestia, EigenDA, Avail, and a handful of custom DA solutions. By USD fees paid Ethereum DA also leads, because the L2s posting to it have the largest aggregate throughput. On a per-megabyte basis the alt-DA layers (Celestia, EigenDA) are meaningfully cheaper — which is the entire economic motivation for any chain to consider alt-DA. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_da_adopt_data_date}} UTC):** The most popular DA layer for Ethereum L2s is **{{l2_da_adopt_leader}}**. The full split across {{l2_da_adopt_universe_size}} tracked L2s ranks as: {{l2_da_adopt_top5}}. By USD fees paid over the last 30 days the leader is **{{l2_da_adopt_fees30d_leader}}**.",

    "> Updated daily — adoption counts, fee totals, and per-MB costs on this page are recomputed from growthepie's public API every day. Adoption is a snapshot at {{l2_da_adopt_data_date}} UTC; the underlying L2 → DA mapping changes whenever a chain switches DA provider or growthepie adds new coverage.",

    '# Adoption ranking — how many L2s use each DA layer',
    '{{l2_da_adopt_dense}}',

    '# Why the ranking matters',
    'The "most popular DA layer" question has two equally valid answers, and this page reports both:',
    '- **By number of L2s** — this is "which DA do chains *choose*?" The vast majority of L2s today post data to Ethereum mainnet via blobs because it gives the strongest possible security guarantee (Ethereum\'s validators, Ethereum\'s consensus, Ethereum\'s economic backing).',
    '- **By USD fees paid** — this is "which DA captures the most economic activity?" Ethereum DA typically leads here too because the L2s using it have the largest aggregate throughput — even when alt-DA is much cheaper per byte, the Ethereum-backed L2s post far more bytes.',
    '',
    'Where the two rankings can diverge is the **per-megabyte cost**: Celestia and EigenDA are typically much cheaper per byte than Ethereum DA. Cheap-per-byte is the entire economic motivation for any chain to consider alt-DA; the question is whether the cost saving outweighs the additional trust assumption (the alt-DA layer\'s own validators or restakers).',

    '# DA layers in detail',
    '**Ethereum DA (blobs).** **{{l2_da_adopt_eth_blobs_count}}** tracked L2s use it. Since **Dencun (March 2024, EIP-4844)** Ethereum mainnet provides DA through blobs — large ~128 KB data attachments priced separately from regular L1 gas. **Fusaka (December 2025)** added **PeerDAS** (EIP-7594) which lets nodes verify blob availability via sampling, enabling further capacity increases. Chains using it: {{l2_da_adopt_eth_blobs_chains}}.',
    '',
    '**Celestia.** **{{l2_da_adopt_celestia_count}}** tracked L2s use it. Standalone PoS blockchain dedicated to DA, mainnet October 2023. 30-day average per-megabyte cost: **{{l2_da_adopt_celestia_cost_per_mb}}**. Chains using it: {{l2_da_adopt_celestia_chains}}.',
    '',
    '**EigenDA.** **{{l2_da_adopt_eigenda_count}}** tracked L2s use it. Built on EigenLayer — Ethereum\'s restaking ecosystem. 30-day average per-megabyte cost: **{{l2_da_adopt_eigenda_cost_per_mb}}**. Chains using it: {{l2_da_adopt_eigenda_chains}}.',
    '',
    '**Avail.** **{{l2_da_adopt_avail_count}}** tracked L2s use it. Standalone modular DA layer with KZG commitments and data availability sampling. Chains using it: {{l2_da_adopt_avail_chains}}.',
    '',
    'Some chains use **other or custom DA** approaches — count: **{{l2_da_adopt_other_count}}**. Chains: {{l2_da_adopt_other_chains}}.',

    '# USD fees paid to each DA layer',
    'Total USD fees paid by L2s to each DA layer over the last 30 days (data {{l2_da_adopt_data_date}} UTC):',
    '- **Ethereum DA (blobs)** — {{l2_da_adopt_eth_blobs_fees_30d}}',
    '- **Celestia** — {{l2_da_adopt_celestia_fees_30d}}',
    '- **EigenDA** — {{l2_da_adopt_eigenda_fees_30d}}',
    '',
    'All-time cumulative USD fees:',
    '- **Ethereum DA (blobs)** — {{l2_da_adopt_eth_blobs_fees_alltime}}',
    '- **Celestia** — {{l2_da_adopt_celestia_fees_alltime}}',
    '- **EigenDA** — {{l2_da_adopt_eigenda_fees_alltime}}',
    '',
    'Avail is not yet exposed in growthepie\'s `da_overview.json` fees endpoint, so its dollar totals are unavailable on this page. Live charts: [growthepie.com/data-availability](https://www.growthepie.com/data-availability).',

    '# What "most popular" misses — the trade-off behind each chain\'s choice',
    'Adoption counts alone don\'t tell you *why* a chain picked the DA it picked. The honest framing:',
    '- **DeFi, settlement, treasury-grade L2s** tend to choose **Ethereum DA**. The premium is worth the strongest possible security; DeFi users are sensitive to trust assumptions.',
    '- **Gaming, social, NFT, high-throughput consumer L2s** are more likely to use **alt-DA**. The cost difference matters at scale and the typical use case can tolerate the extra trust assumption.',
    '- **Hybrid chains** split the difference, posting some data to Ethereum and bulk to alt-DA.',
    '',
    'The dominance of Ethereum DA in the adoption count therefore says less about Ethereum DA "winning" and more about most current L2s being settlement-leaning rather than throughput-leaning. As consumer L2s scale, the alt-DA share is the metric to watch.',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to L2s the same way the rest of growthepie's answer pages do (bucket !== \"Layer 1\", deployment === \"PROD\", excludes sidechains and aggregate keys).",
    "2. Read the `da_layer` string field from each L2's master entry, normalise it to one of the canonical buckets (Ethereum blobs / Celestia / EigenDA / Avail / other), and count.",
    "3. Pull [`/v1/da_overview.json`](https://api.growthepie.com/v1/da_overview.json) for the daily USD-fees-paid series per DA layer. Sum into daily / 30d / 90d / all-time.",
    "4. Pull [`/v1/da_metrics/fees_per_mbyte.json`](https://api.growthepie.com/v1/da_metrics/fees_per_mbyte.json) for per-megabyte cost. Take the 30-day average of the daily USD column.",
    "5. Sort the buckets descending by L2 count for the headline ranking; secondary rankings (USD fees over 30 days, $/MB) are reported alongside.",
    '',
    "All values shown were generated on {{l2_da_adopt_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains using specific DA layers. The ranking on this page is computed mechanically from `master.json` — chains and DA layers do not influence inclusion or placement, and supporters do not receive ranking adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent DA-layer data sources you can compare against include [L2BEAT's DA risk view](https://l2beat.com) (per-chain DA classification and risk profile), the DA layers' own dashboards ([celestia.org](https://celestia.org), [eigenda.xyz](https://eigenda.xyz), [availproject.org](https://www.availproject.org)), and the published EIPs themselves (EIP-4844 for blobs, EIP-7594 for PeerDAS).",
    '',
    '# Which chains are included?',
    'The {{l2_da_adopt_universe_size}} chains in this page\'s universe are: {{l2_da_adopt_universe_list}}.',
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it *is* the DA, not a consumer of DA.',
    '- **Polygon PoS** — a sidechain with its own validator set, not an Ethereum L2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',
    'L2s where `da_layer` is missing or unrecognised on {{l2_da_adopt_data_date}} UTC: {{l2_da_adopt_unknown_chains}}.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/data-availability for the live DA-layer adoption tracker.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { icon: 'gtp-data-availability', name: 'Data Availability', url: '/data-availability' },
    { name: 'Layer 2', url: '/data-availability' },
    { name: 'Blobs', url: '/data-availability' },
    { name: 'Celestia', url: '/data-availability' },
    { name: 'EigenDA', url: '/data-availability' },
    { name: 'Avail', url: '/data-availability' },
    { name: 'EIP-4844', url: '/quick-bites/fusaka' },
  ],
  icon: 'gtp-data-availability',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostPopularDaLayer;
