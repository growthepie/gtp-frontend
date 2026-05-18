import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 has the most total value secured (TVS)?',
    a: 'As of {{l2_tvs_data_date}} UTC, the largest Ethereum L2 by total value secured is **{{l2_tvs_leader}}**. Full top 10 by TVS: {{l2_tvs_top10}}. TVS is the dollar value of all assets bridged to or natively held on the chain. Live leaderboards: [growthepie.com/chains](https://www.growthepie.com/chains).',
  },
  {
    q: 'What is TVS (total value secured)?',
    a: '**Total value secured** is the total USD value of all assets bridged into or natively held on an Ethereum L2 — stablecoins, ETH, ERC-20 tokens, wrapped assets, etc. Often used interchangeably with **TVL (total value locked)**, though TVS more accurately reflects what L2s do (they secure value on behalf of users, who can withdraw it back to Ethereum). growthepie\'s [chains directory](https://www.growthepie.com/chains) labels this metric "Total Value Secured" by default.',
  },
  {
    q: 'How is TVS different from TVL?',
    a: 'They\'re mostly the same metric, just labelled differently. **TVL ("locked")** is the older term, often used by DeFi protocols to describe assets deposited into smart contracts. **TVS ("secured")** is the newer label preferred for L2s — it emphasises that the chain *secures* the assets on behalf of users rather than locking them in a single application. The number is the same for an L2: total dollar value of assets the chain holds. growthepie\'s API uses the `tvl` endpoint name for both.',
  },
  {
    q: 'What\'s the total TVS across all Ethereum L2s?',
    a: 'As of {{l2_tvs_data_date}} UTC, the combined TVS across the {{l2_tvs_universe_size}}-chain Ethereum L2 universe is approximately **{{l2_tvs_ecosystem_total}}**. The leader **{{l2_tvs_leader}}** alone accounts for a significant share. See the full top-10 table for share breakdown.',
  },
  // ----- Per-chain detail -----
  {
    q: 'Which Ethereum L2 had the biggest TVS increase in the last 30 days?',
    a: 'See the "30d change" column in the top-10 table above — chains with positive change pulled in net new capital, chains with negative change saw outflows. For a dedicated growth ranking that\'s independent of absolute size, see [/answers/fastest-growing-ethereum-l2](/answers/fastest-growing-ethereum-l2).',
  },
  {
    q: 'How is TVS calculated?',
    a: 'growthepie aggregates per-chain TVS from on-chain bridge contracts and asset balances. The methodology follows the same patterns used by [DefiLlama](https://defillama.com/) and [L2BEAT](https://l2beat.com) — assets are priced in USD at current market rates and summed across all bridged tokens. Native ETH balances on the L2 are included. Each chain\'s number is the latest daily snapshot.',
  },
  {
    q: 'Why is one chain\'s TVS dominant?',
    a: 'TVS concentrates around chains that have **(a)** been live for longest, **(b)** built deep DeFi liquidity, and **(c)** captured institutional capital. The dominant L2 today (typically Arbitrum or Base, depending on cycle) accumulated TVS over multiple years; newer chains start with low TVS and grow it via incentive programs, native app deployments, and bridge integrations. TVS leadership is sticky — once liquidity concentrates somewhere it doesn\'t move easily.',
  },
  // ----- Methodology -----
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from these L2 rankings — matching the rest of the L2 answer pages on growthepie. Polygon zkEVM is a ZK rollup and is included. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain) for the full L2-vs-sidechain distinction.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_tvs_universe_size}} chains. The full list (computed on {{l2_tvs_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_tvs_universe_list}}.',
  },
  {
    q: 'Where does this data come from?',
    a: 'Per-chain TVS values come from growthepie\'s per-chain TVL endpoint (`/v1/metrics/chains/{chain}/tvl.json`) — the same endpoint that backs the [chains directory](https://www.growthepie.com/chains) and the "Total Value Secured" column there. We take the latest daily USD value as the current TVS and the value 30 days prior as the comparison baseline. L2 membership comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_tvs_data_date}} UTC: {{l2_tvs_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain) for the full definition.',
  },
  {
    q: 'Where can I see live TVS data?',
    a: 'growthepie\'s [chains directory](https://www.growthepie.com/chains) shows every tracked chain with its current TVS sortable. Per-chain pages (e.g. [/chains/arbitrum](https://www.growthepie.com/chains/arbitrum)) include TVS timeseries charts. For independent verification see [DefiLlama\'s L2 page](https://defillama.com/chains) and [L2BEAT](https://l2beat.com).',
  },
  {
    q: 'Why might TVS differ between providers?',
    a: 'Different providers use different asset price feeds, different methodology for what counts as "secured" (does native ETH count? bridged ETH only? LSTs?), and different chain coverage. growthepie, DefiLlama, and L2BEAT broadly agree on rank order but the exact dollar values can differ by 5–10%. When in doubt, compare on **direction and rank** rather than exact figures.',
  },
  {
    q: 'How does TVS compare across other metrics?',
    a: 'TVS measures **capital weight** — how much value is parked on the chain. It\'s different from activity (transaction count, throughput, active addresses), which measures *flow* not *stock*. A chain can be high-TVS but low-activity (capital parked but not moving) or vice versa. For activity rankings see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2). For stablecoin-specific value, see [/answers/most-stablecoin-activity-ethereum-l2](/answers/most-stablecoin-activity-ethereum-l2).',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/most-value-secured-ethereum-l2';
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
    '@id': 'https://www.growthepie.com/datasets/l2-tvs',
    name: 'Ethereum L2 Total Value Secured (per chain, daily, USD)',
    description:
      'Daily total value secured (TVS / TVL) per Ethereum L2 in USD. The sum of assets bridged to or natively held on each chain. Used to rank L2s by capital weight.',
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
      'TVL',
      'TVS',
      'Total value secured',
      'Total value locked',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain sum of asset balances (stablecoins, ETH, ERC-20s, wrapped assets) priced in USD at current market rates. Source data follows the same methodology used by DefiLlama and L2BEAT for L2 balances.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'tvs_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/tvl.json',
        description: 'Per-chain TVL / TVS timeseries (daily, USD + ETH columns).',
      },
    ],
  },
];

const mostValueSecuredEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 has the most total value secured (TVS)?',
  subtitle:
    'Top 10 Ethereum L2s ranked by current TVS (total value secured), with each chain\'s share of the ecosystem total and 30-day change.',
  shortTitle: 'Top L2 by TVS',
  summary:
    "Total value secured (TVS) is the dollar value of all assets bridged to or natively held on an Ethereum L2 — stablecoins, ETH, ERC-20 tokens. It's the standard 'capital weight' metric for L2s, often called TVL elsewhere. This page ranks every tracked Ethereum L2 by current TVS, shows each chain's share of the combined L2 ecosystem total, and tracks 30-day change. Recomputed daily from growthepie's per-chain TVL endpoint.",
  content: [
    "**Short answer (data {{l2_tvs_data_date}} UTC):** **{{l2_tvs_leader}}** is the Ethereum L2 with the most total value secured. The combined L2 ecosystem total is approximately **{{l2_tvs_ecosystem_total}}** across {{l2_tvs_universe_size}} tracked chains. Full top 10 by TVS: {{l2_tvs_top10}}.",

    "> Updated daily — every value on this page is recomputed from growthepie's per-chain TVL endpoint. TVS = total value secured = dollar value of all assets bridged to or natively held on the L2.",

    '# Top 10 Ethereum L2s by TVS',
    '{{l2_tvs_dense}}',

    '# What does "TVS" mean exactly?',
    '**Total Value Secured** is the total USD value of all assets the chain holds on behalf of its users — stablecoins (USDC, USDT, DAI, PYUSD), bridged ETH, native ETH, ERC-20 tokens, wrapped Bitcoin, liquid staking tokens, NFTs, and any other on-chain asset. It\'s the standard "how much capital lives here" metric for L2s.',
    '',
    'You\'ll also see this metric called **TVL (Total Value Locked)** — that\'s the older term, originally from DeFi protocols where "locked" meant deposited into smart contracts. **TVS** is the newer label preferred for L2s because the chain *secures* the assets (users can withdraw them back to Ethereum) rather than locking them in a single application. The underlying number is the same; growthepie\'s API uses the `tvl` endpoint name for both labels.',

    '# TVS vs other "size" metrics',
    'TVS measures **capital weight** — how much value is parked on the chain. It\'s different from:',
    '- **Throughput / transactions** ([/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2)) — measures *flow*, not *stock*. A chain can have low TVS but high activity (lots of micro-transactions, cheap fees) or vice versa.',
    '- **Stablecoin supply** ([/answers/most-stablecoin-activity-ethereum-l2](/answers/most-stablecoin-activity-ethereum-l2)) — a *subset* of TVS, just the stablecoin portion.',
    '- **Profit / revenue** ([/answers/most-profitable-ethereum-l2](/answers/most-profitable-ethereum-l2)) — what the chain *earns* from its activity, not what it holds.',
    '',
    'TVS leadership is sticky because liquidity is sticky — DeFi protocols, market makers, and large depositors don\'t move easily. The chains that built early TVS in 2022–2024 (Arbitrum, Base, OP Mainnet) tend to retain it.',

    '# Methodology and data sources',
    '**How the answer is derived:**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    '2. For each L2 in the universe, pull `/v1/metrics/chains/{chain}/tvl.json`. The endpoint exposes a daily timeseries with `[unix, usd, eth]` columns — we resolve the USD column by name and take the latest day\'s value as the current TVS.',
    '3. The 30-day change column uses the same series sampled 30 days back (point-in-time, since TVS is a stock metric).',
    '4. Sort chains descending by current TVS and take the top 10.',
    '5. Sum across the L2 universe to produce the ecosystem total used for share calculations.',
    '',
    "All values shown above were generated on {{l2_tvs_data_date}} UTC. Data licensed CC BY-NC 4.0.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Several supporters operate L2 chains that appear in the rankings above. Ranks are computed mechanically from public API data — chains don't pay for inclusion or placement. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent TVS / TVL data sources for Ethereum L2s include [DefiLlama's chains page](https://defillama.com/chains) and [L2BEAT](https://l2beat.com). Methodologies differ slightly between providers — what counts as \"secured\" (native ETH? bridged ETH only? LSTs? RWAs?) and the price feed used can produce 5–10% differences in absolute USD value. Rank order and direction of movement should agree.",
    '',
    '# Which chains are included?',
    "The list of **{{l2_tvs_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage: {{l2_tvs_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it\'s Layer 1, not Layer 2.',
    '- **Polygon PoS** — a sidechain with its own validator set, not an L2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/chains for the live Ethereum L2 TVS leaderboard.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/chains' },
    { name: 'TVS', url: '/chains' },
    { name: 'TVL', url: '/chains' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
    { name: 'Base', url: '/chains/base' },
    { name: 'OP Mainnet', url: '/chains/op-mainnet' },
  ],
  icon: 'gtp-metrics-totalvaluesecured',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostValueSecuredEthereumL2;
