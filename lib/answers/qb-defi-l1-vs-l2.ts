import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'Where does most DeFi happen — Ethereum mainnet or L2s?',
    a: '**Most DeFi activity happens on L2s, but DeFi capital still concentrates on L1.** Over the last 30 days (data {{l2_defi_data_date}} UTC), Ethereum L2s processed **{{l2_defi_l2_txs_30d}}** DeFi transactions vs **{{l2_defi_l1_txs_30d}}** on Ethereum L1 — L2s account for **{{l2_defi_l2_share_txs_30d}}** of all L1+L2 DeFi activity by transaction count, **{{l2_defi_l2_share_gas_30d}}** by gas fees paid. By **stablecoin liquidity** (the dominant pool of DeFi capital), L1 holds **{{l2_defi_stables_l1}}** vs **{{l2_defi_stables_l2}}** across all L2s — L2 share **{{l2_defi_stables_l2_share}}**. Top L2 DeFi contributors: {{l2_defi_top_l2s_30d}}. Live: [growthepie.com/blockspace/chain-overview](https://www.growthepie.com/blockspace/chain-overview).',
  },
  {
    q: 'What counts as "DeFi" here?',
    a: 'growthepie\'s blockspace classification groups DeFi into four subcategories: **DEX** (decentralised exchanges), **lending** (Aave, Compound, etc.), **derivative** (perps DEXes, options, structured products), and **staking** (liquid staking like Lido, Rocket Pool, plus restaking platforms). A transaction is "DeFi" if it touches a labelled contract in any of these subcategories. The classification is based on labelled contract data in growthepie\'s labels system — see [growthepie.com/applications](https://www.growthepie.com/applications) for the full per-app classification.',
  },
  // ----- Trend / why -----
  {
    q: 'Why has DeFi moved to L2s?',
    a: 'Three forces. **(1) Fee economics** — DeFi transactions are gas-heavy (swaps, lending operations, vault deposits often consume 100k+ gas). At Ethereum L1 fees, even a "cheap" swap can cost $5–50. On L2s the same swap costs cents. **(2) Composability within L2 ecosystems** — major L2s (Arbitrum, Base, OP Mainnet) have their own deep DeFi ecosystems with native protocols, making cross-protocol composability practical without leaving the chain. **(3) Network effects** — once liquidity is on a chain, more protocols deploy there to access that liquidity, attracting more liquidity. L2 DeFi is now self-sustaining.',
  },
  {
    q: 'Does this mean Ethereum L1 DeFi is dead?',
    a: 'No. Ethereum L1 still hosts the **largest absolute TVL** of any chain — major DeFi blue chips (Maker/Sky, Aave\'s main markets, Curve\'s reference markets, large Uniswap pools) remain on L1 because of legacy liquidity, integration with high-value institutional positions, and the security profile of mainnet. **By transaction count L2s dominate; by per-transaction value L1 often leads.** Big trades and treasury operations still go through L1; retail-scale activity has migrated to L2s.',
  },
  // ----- Per period -----
  {
    q: 'How much L2 DeFi activity is there across different time windows?',
    a: 'We don\'t surface live per-window L2 DeFi transaction counts on this page because growthepie\'s blockspace category data file (`/v1/blockspace/category_comparison.json`) is ~55MB — beyond Next.js\'s 2MB fetch-cache ceiling, so reading it from SSR would re-download the file every render (multi-minute page loads). For per-app DeFi rankings on L2s with live transaction counts, see [growthepie.com/applications](https://www.growthepie.com/applications) — the same data, queried client-side where the cache size limit doesn\'t apply.',
  },
  // ----- Per-L2 contributors -----
  {
    q: 'Which L2 has the most DeFi activity?',
    a: 'The largest L2 DeFi ecosystems in 2026 are Arbitrum One, Base, OP Mainnet, and Unichain — they host the major DEX deployments (Uniswap, PancakeSwap, Aerodrome) and lending protocols (Aave, Morpho, Spark) that drive the bulk of L2 DeFi activity. For live per-app rankings (with transaction counts and gas fees) see [growthepie.com/applications](https://www.growthepie.com/applications) — that page reads the same data client-side, where Next.js\'s 2MB SSR cache ceiling doesn\'t apply.',
  },
  // ----- Subcategories -----
  {
    q: 'What are the main DeFi subcategories?',
    a: 'growthepie\'s DeFi category breaks into four subcategories: **DEX** (swap, AMM, orderbook trading), **Lending** (overcollateralised lending markets), **Derivative** (perpetuals, options, structured products), and **Staking** (liquid staking, restaking, validator pools). The four together make up "DeFi" on this page. For per-subcategory breakdown see growthepie\'s [blockspace category comparison](https://www.growthepie.com/blockspace/category-comparison).',
  },
  // ----- Methodology -----
  {
    q: 'How is this calculated?',
    a: 'growthepie\'s [blockspace overview endpoint](https://api.growthepie.com/v1/blockspace/overview.json) exposes per-chain per-category activity rollups at multiple window lengths (7d / 30d / 90d / 365d / max). For Ethereum L1 we read `chains.ethereum.overview[window].defi.data`; for L2 ecosystem we read `chains.all_l2s.overview[window].defi.data`. Each `.defi.data` row carries transactions and USD gas-fees-paid in the DeFi category. We compute L1+L2 totals and the L2 share from those two rows.',
  },
  {
    q: 'Why does this use the `all_l2s` aggregate?',
    a: 'Because the question is "L1 vs L2 collectively", not "L1 vs each individual L2". growthepie\'s `all_l2s` aggregate sums activity across every L2 it tracks — much cleaner than asking us to sum manually. For the per-L2 breakdown, see the second table on this page (top 10 L2s by DeFi transactions). For activity rankings across all metrics (not just DeFi), see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2).',
  },
  // ----- Cross-links -----
  {
    q: 'How does this compare to "is Ethereum scaling through L2s"?',
    a: '[/answers/is-ethereum-scaling-through-l2s](/answers/is-ethereum-scaling-through-l2s) compares L1 vs L2 across **all** transaction activity. This page narrows it to **DeFi only**. The DeFi share on L2s tends to be higher than the all-activity share because DeFi transactions are particularly fee-sensitive and benefit most from L2 cost savings.',
  },
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain — it doesn\'t belong in the L2 ecosystem aggregate. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain). The `all_l2s` aggregate growthepie uses follows the same exclusion list.',
  },
  {
    q: 'Where can I see this live?',
    a: 'growthepie\'s [blockspace chain overview](https://www.growthepie.com/blockspace/chain-overview) and [blockspace category comparison](https://www.growthepie.com/blockspace/category-comparison) charts both expose this data interactively. Filter to the "defi" category to see per-chain per-window splits.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/defi-l1-vs-l2';
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
    '@id': 'https://www.growthepie.com/datasets/defi-l1-vs-l2',
    name: 'DeFi Activity — Ethereum L1 vs L2 Ecosystem',
    description:
      'L2 DeFi activity (transactions, gas fees, per-L2 contributors) plus L1 vs L2 TVS comparison and live swap-fee comparison. growthepie\'s blockspace category data covers L2s only — the L1 side of the comparison uses per-chain TVL endpoints and the hourly fees table.',
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
      'DeFi',
      'DEX',
      'Lending',
      'L1 vs L2',
      'Blockspace',
      'Onchain analytics',
    ],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/blockspace/overview.json',
        description:
          'Blockspace overview, `chains.all_l2s` aggregate. Read `overview[window].defi.data` for L2 DeFi activity per window.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/blockspace/category_comparison.json',
        description:
          'Per-L2 DeFi contributor breakdown. Read `data.defi.aggregated["30d"].data` keyed by chain.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/ethereum/stables_mcap.json',
        description: 'Ethereum L1 stablecoin supply timeseries — used as the L1 capital-weight proxy.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/all_l2s/stables_mcap.json',
        description: 'L2 ecosystem aggregate stablecoin supply (with per-chain sum fallback if the aggregate endpoint is unavailable).',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/fees/table.json',
        description: 'Per-chain hourly fees — used for the live swap-fee comparison.',
      },
    ],
  },
];

const defiL1VsL2: QuickBiteData = createQuickBite({
  title: 'Where does most DeFi happen — Ethereum mainnet or L2s?',
  subtitle:
    'DeFi activity has moved to L2s; DeFi capital still concentrates on L1. Backed by live L2 transaction counts, L1 vs L2 stablecoin supply, and the cheapest-L2-vs-L1 swap-fee comparison.',
  shortTitle: 'DeFi: L1 vs L2',
  summary:
    "DeFi activity has moved to L2s but DeFi capital still concentrates on L1. This page pulls live numbers from growthepie's blockspace overview (the per-chain finance-category transactions + gas, for both L1 and L2 aggregate), per-chain stables_mcap endpoints (L1 vs L2 stablecoin liquidity — the dominant pool of DeFi capital), and the hourly fees table (live swap-fee comparison between L1 and the cheapest L2).",
  content: [
    "**Short answer (data {{l2_defi_data_date}} UTC):** Most DeFi activity happens on L2s, but DeFi capital still concentrates on L1. Over the last 30 days, L2s processed **{{l2_defi_l2_txs_30d}}** DeFi transactions vs **{{l2_defi_l1_txs_30d}}** on Ethereum L1 — L2 share **{{l2_defi_l2_share_txs_30d}}** by transactions, **{{l2_defi_l2_share_gas_30d}}** by gas fees paid. By stablecoin liquidity, L1 holds **{{l2_defi_stables_l1}}** vs **{{l2_defi_stables_l2}}** across L2s (L2 share **{{l2_defi_stables_l2_share}}**). Top L2 DeFi contributors: **{{l2_defi_top_l2s_30d}}**.",

    "> Sourced from `/v1/blockspace/overview.json` `chains.{chain}.overview[window].finance` for the per-chain DeFi (finance-category) activity, plus per-chain stables_mcap endpoints for the capital comparison and the live fees table for the swap-fee comparison.",

    '# L1 vs L2 DeFi at a glance',
    '{{l2_defi_dense}}',

    '# Why has DeFi activity moved to L2s?',
    'Three forces:',
    '- **Fee economics.** DeFi transactions are gas-heavy — even a "cheap" swap consumes 100k+ gas, plus the cost of approvals, slippage checks, and routing. **Live (latest hour, data {{l2_defi_data_date}} UTC):** {{l2_defi_swap_phrase}} For active traders the difference is decisive. Pulled from the same `txcosts_swap` feed that powers [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2).',
    '- **Composability within L2 ecosystems.** Major L2s (Arbitrum, Base, OP Mainnet) host their own deep DeFi ecosystems — native AMMs, lending markets, perps DEXes. Cross-protocol DeFi composability is now practical without leaving the chain.',
    '- **Network effects.** Once liquidity concentrates on a chain, more protocols deploy there to access it, attracting more liquidity. L2 DeFi is now self-sustaining.',

    '# Does this mean L1 DeFi is dead?',
    '**No — far from it.** Ethereum L1 holds **{{l2_defi_stables_l1}}** in stablecoins vs **{{l2_defi_stables_l2}}** across all L2s (live, data {{l2_defi_data_date}} UTC). Stablecoins are the single biggest pool of DeFi capital, so this is the cleanest "where does the money sit" signal — and it still leans heavily L1. Major DeFi blue chips remain on L1 because of legacy liquidity, integration with high-value institutional positions, and the security profile of Ethereum mainnet. Maker/Sky, Aave\'s main markets, Curve\'s reference markets, and large Uniswap V3 pools all live on L1.',
    '',
    'The pattern: **L2s dominate by transaction count and user activity; L1 leads in stablecoin liquidity and per-transaction value**. Big trades and treasury operations still settle through L1 for the security guarantees; retail-scale activity has migrated to L2s for the cost savings.',

    '# Where to see per-app DeFi rankings',
    "The largest L2 DeFi ecosystems by activity in 2026 are **Arbitrum One**, **Base**, **OP Mainnet**, and **Unichain** — these chains host the major DEX deployments (Uniswap, PancakeSwap, Aerodrome) and lending protocols (Aave, Morpho, Spark) that drive most L2 DeFi activity. For live per-app DeFi rankings on L2s (transaction counts, gas fees, active addresses per protocol) see [growthepie.com/applications](https://www.growthepie.com/applications) and [/answers/top-apps-ethereum-l2s](/answers/top-apps-ethereum-l2s).",

    '# Methodology and data sources',
    "We deliberately use only **small, cacheable endpoints** so this page renders fast under Next.js SSR (the 2MB fetch-cache ceiling rules out some otherwise-useful sources — see methodology FAQ).",
    '',
    '**1. L1 vs L2 capital (stablecoin supply)** — per-chain stables_mcap endpoints. `/v1/metrics/chains/ethereum/stables_mcap.json` for L1 and `/v1/metrics/chains/all_l2s/stables_mcap.json` for the L2 aggregate (with a per-chain sum fallback). Latest daily USD value. Stablecoins are the single biggest pool of DeFi capital, so this is the cleanest "where does DeFi money sit" proxy. We use it instead of TVL because per-chain TVL isn\'t exposed for Ethereum L1 in growthepie\'s API today.',
    '',
    '**2. Live swap-fee comparison** — `/v1/fees/table.json`, path `chain_data[chain].hourly.txcosts_swap` (USD column). Picks Ethereum L1\'s value and the minimum across the L2 universe.',
    '',
    "**Why no per-window L1 vs L2 DeFi transaction count on this page?** growthepie's blockspace category endpoint (`/v1/blockspace/category_comparison.json`) does have per-L2 DeFi transactions, but the file is ~55MB — above Next.js's 2MB SSR fetch-cache ceiling, so it would re-download on every render (multi-minute page loads). Per-app DeFi rankings (which use the same data, queried client-side) live at [growthepie.com/applications](https://www.growthepie.com/applications). For L1 DeFi specifically, [DefiLlama](https://defillama.com/protocols) is the best source — growthepie doesn't break Ethereum L1 transactions into DeFi/non-DeFi categories.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Numbers on this page are computed mechanically from public API data. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [DefiLlama](https://defillama.com/) tracks DeFi TVL split between L1 and L2s (independent verification of the stablecoin-supply ratio). [L2BEAT's activity view](https://l2beat.com) tracks per-L2 activity. growthepie's [applications page](https://www.growthepie.com/applications) is the live per-app DeFi ranking.",
    '',
    '# Related answers',
    '- [/answers/is-ethereum-scaling-through-l2s](/answers/is-ethereum-scaling-through-l2s) — the broader L1 vs L2 activity comparison (all categories, not just DeFi).',
    '- [/answers/top-apps-ethereum-l2s](/answers/top-apps-ethereum-l2s) — per-app ranking on L2s including the major DeFi apps.',
    '- [/answers/most-value-secured-ethereum-l2](/answers/most-value-secured-ethereum-l2) — TVS ranking, the "where does the capital sit" question that\'s adjacent to "where does DeFi happen".',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/blockspace/chain-overview for the live DeFi breakdown.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'DeFi', url: '/blockspace/chain-overview' },
    { name: 'Layer 2', url: '/blockspace/chain-overview' },
    { name: 'DEX', url: '/blockspace/chain-overview' },
    { name: 'Lending', url: '/blockspace/chain-overview' },
    { name: 'Ethereum Mainnet', url: '/chains/ethereum' },
  ],
  icon: 'gtp-metrics-transactioncount',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default defiL1VsL2;
