import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 is the most profitable?',
    a: 'Over the last 30 days (data {{l2_profit_data_date}} UTC), the most profitable Ethereum L2 is **{{l2_profit_leader_30d}}**. Profit = revenue from fees collected minus L1 settlement cost (rent paid to Ethereum mainnet). Full top 10: {{l2_profit_top10}}. The L2 ecosystem collectively earned **{{l2_profit_ecosystem_30d}}** in the last 30 days, **{{l2_profit_ecosystem_alltime}}** all-time. Live leaderboards: [growthepie.com/economics](https://www.growthepie.com/economics).',
  },
  {
    q: 'What is "L2 profit"?',
    a: '**Profit = fees collected from users − cost of posting data and proofs to Ethereum mainnet.** When a user transacts on an L2, they pay a fee in the L2\'s gas token (usually ETH). The chain operator (the sequencer) collects that fee. Periodically, the L2 has to post its transaction data (or proofs) back to Ethereum mainnet — and pay Ethereum\'s L1 gas fee to do so. The difference between what the chain collected and what it paid Ethereum is the chain\'s profit. A profitable L2 charges its users more than it costs to settle on Ethereum.',
  },
  {
    q: 'Can L2 profit be negative?',
    a: 'Yes, and several L2s have run at a loss at various points. A chain runs negative-profit when its L1 settlement cost exceeds the fees it collected — typically because (a) the chain runs an incentive program subsidising user fees, (b) the chain posts data more aggressively than its activity warrants, or (c) network demand drops below break-even. **Sustained negative profit is usually deliberate** — the chain is buying market share — but it can\'t go on forever.',
  },
  // ----- Period detail -----
  {
    q: 'Which L2 has earned the most all-time?',
    a: 'See the "All-time profit" column in the top-10 table above. The all-time leader is typically the L2 with the longest production history *and* the highest sustained activity — Arbitrum, OP Mainnet, and Base are perennial leaders. New L2s with high recent profit show up high on the 30-day ranking but lower on all-time.',
  },
  {
    q: 'Which L2 has earned the most in the last 90 days?',
    a: 'See the "90d profit" column in the top-10 table above. The 90-day window is a useful middle ground between recent (30d) and structural (all-time) views — it smooths over single-month volatility while still reflecting the current state of the chain.',
  },
  // ----- Methodology / economics -----
  {
    q: 'How does growthepie calculate L2 profit?',
    a: 'Per-day, per-chain: **revenue** (total transaction fees collected by the L2, USD-denominated) minus **L1 settlement cost** (rent paid to Ethereum mainnet for posting batches and proofs). The per-chain profit endpoint (`/v1/metrics/chains/{chain}/profit.json`) exposes a daily timeseries of that net figure in both USD and ETH. We sum daily values over 30d / 90d / all-time windows to produce this ranking.',
  },
  {
    q: 'How is L2 revenue different from L2 profit?',
    a: '**Revenue** is what the chain collects from users in fees. **Profit** is revenue minus what the chain pays Ethereum mainnet to settle. A chain can have high revenue but low profit if it pays a lot to Ethereum — which is exactly what happens to chains with high settlement frequency or pre-Dencun-style calldata posting. After Dencun (March 2024), L1 settlement costs dropped sharply via blobs, and L2 profit margins widened. Fusaka (December 2025) widened them again.',
  },
  {
    q: 'Where does L2 profit go?',
    a: 'To the chain operator — typically a foundation, company, or DAO. Some chains rebate part of their profit to ecosystem incentives (Optimism\'s RetroPGF, Base\'s ecosystem grants); some operate primarily as a business and retain the profit. The mechanics vary chain-to-chain; growthepie doesn\'t track downstream usage of L2 profit.',
  },
  // ----- Comparisons -----
  {
    q: 'Why might an L2 with lots of activity not be very profitable?',
    a: 'Three common reasons. **(1) Fee subsidy** — the chain runs an active incentive program rebating user fees, so collected revenue is depressed. **(2) Cheap-transaction profile** — the chain attracted high transaction count but with very low per-transaction fees (e.g. memecoin trading). **(3) Inefficient settlement** — the chain posts data to L1 more frequently than its activity warrants, paying L1 gas without proportional revenue. The top 10 profit ranking and the top 10 transactions ranking ([/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2)) are usually correlated but not identical.',
  },
  // ----- Scope / methodology -----
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain).',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_profit_universe_size}} chains. The full list (computed on {{l2_profit_data_date}} UTC): {{l2_profit_universe_list}}. A chain only appears in the ranking if growthepie has at least one day of profit data for it.',
  },
  {
    q: 'Where does this data come from?',
    a: 'Per-chain profit values come from growthepie\'s per-chain profit endpoint (`/v1/metrics/chains/{chain}/profit.json`). The endpoint exposes a daily timeseries of `(unix, USD, ETH)` rows; we sum the USD column over each window. L2 membership comes from `master.json`. Sidechain exclusions on {{l2_profit_data_date}} UTC: {{l2_profit_excluded_sidechains}}.',
  },
  {
    q: 'Where can I see this live?',
    a: 'growthepie\'s [economics page](https://www.growthepie.com/economics) shows live revenue, costs, and profit per L2 with timeseries charts. Per-chain pages (e.g. [/chains/base](https://www.growthepie.com/chains/base)) include profit history in the economics section.',
  },
  {
    q: 'How does this compare to "how much Ethereum mainnet earns from L2s"?',
    a: 'Different sides of the same transaction. **L2 profit** = revenue − L1 cost. **Ethereum mainnet rent from L2s** = the L1 cost side, summed across L2s. The two are linked: every dollar of L1 settlement cost for an L2 is a dollar of revenue for Ethereum mainnet. See [/answers/ethereum-mainnet-revenue-from-l2s](/answers/ethereum-mainnet-revenue-from-l2s) for the mainnet side.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/most-profitable-ethereum-l2';
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
    '@id': 'https://www.growthepie.com/datasets/l2-profit',
    name: 'Ethereum L2 Profit (per chain, daily, USD)',
    description:
      'Daily per-chain profit (USD) for every tracked Ethereum L2. Profit = revenue (transaction fees collected from users) minus L1 settlement cost (rent paid to Ethereum mainnet).',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    temporalCoverage: L2_TEMPORAL_COVERAGE,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: ['Ethereum', 'Layer 2', 'Rollups', 'Profit', 'Revenue', 'L2 economics', 'Onchain analytics'],
    measurementTechnique:
      'Per-day net of L2 revenue (user fees in USD) and L1 settlement cost (USD paid to Ethereum mainnet for posting batches and proofs). 30d / 90d / all-time totals are computed by summing daily values.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'profit_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/profit.json',
        description: 'Per-chain daily profit timeseries.',
      },
    ],
  },
];

const mostProfitableEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 is the most profitable?',
  subtitle:
    'Top 10 Ethereum L2s ranked by profit — fees collected from users minus L1 settlement cost paid to Ethereum mainnet. Daily, 30-day, 90-day, and all-time profit per chain.',
  shortTitle: 'Most Profitable L2',
  summary:
    "L2 profit is revenue (fees collected from users) minus L1 settlement cost (rent paid to Ethereum mainnet to post batches and proofs). It's the cleanest measure of which chains are running as sustainable businesses. growthepie tracks this per-day per-chain in USD; this page ranks the top 10 by 30-day profit, with 90-day and all-time columns for context. Recomputed daily.",
  content: [
    "**Short answer (data {{l2_profit_data_date}} UTC):** **{{l2_profit_leader_30d}}** is the most profitable Ethereum L2 over the last 30 days. The full top 10: {{l2_profit_top10}}. The L2 ecosystem collectively earned **{{l2_profit_ecosystem_30d}}** in profit over the last 30 days; **{{l2_profit_ecosystem_alltime}}** all-time across {{l2_profit_universe_size}} tracked chains.",

    "> Profit = chain revenue (fees collected from users) − L1 settlement cost (rent paid to Ethereum mainnet to post batches and proofs). Recomputed daily from growthepie's per-chain profit endpoint.",

    '# Top 10 Ethereum L2s by profit',
    '{{l2_profit_dense}}',

    '# What "profit" means for an L2',
    'An Ethereum L2 has two sides to its economics:',
    '- **Revenue.** Every L2 transaction pays a fee in the L2\'s gas token (usually ETH). The chain operator (the sequencer) collects that fee.',
    '- **Cost.** Periodically the L2 posts its transaction data and proofs to Ethereum mainnet. That costs L1 gas — paid in ETH to Ethereum validators. After Dencun (March 2024) this cost dropped sharply because L2s now use blobs instead of calldata. After Fusaka (December 2025) it dropped again.',
    '',
    '**Profit = Revenue − Cost.** A positive number means the chain is earning more from users than it pays Ethereum mainnet. A negative number means the chain is operating at a loss — usually because of an incentive program subsidising user fees, but sometimes structural.',

    '# Why does this ranking matter?',
    'Profitability is the cleanest single measure of whether an L2 is operating as a sustainable business. Chains that consistently lose money are either burning down a treasury, running on grants, or planning to recoup later by capturing market share. Chains that consistently earn money are self-sustaining and don\'t depend on external funding to keep running. For long-term users and developers, this is a useful health check on which chains will still be around in three years.',
    '',
    'Caveats:',
    '- **Profit isn\'t the only goal.** Some chains intentionally run at a loss to subsidise user growth (and treasury growth from token appreciation, when applicable).',
    '- **Profit isn\'t evenly captured.** Where the profit *goes* varies — some chains return it to ecosystem incentives, others retain it as a foundation or DAO treasury, others split it with token holders. growthepie tracks the gross number, not the downstream allocation.',

    '# Methodology and data sources',
    '**How the answer is derived:**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to L2s.",
    '2. For each L2, pull `/v1/metrics/chains/{chain}/profit.json`. The endpoint exposes a daily timeseries of `(unix, USD, ETH)` rows.',
    '3. Sum the USD column over the last 30 days, last 90 days, and the entire series (all-time).',
    '4. Rank chains by 30-day profit descending. Negative-profit chains still appear, just at the bottom.',
    '',
    "All values shown were generated on {{l2_profit_data_date}} UTC.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Profit values are computed mechanically from public API data — chains don't influence the ranking. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent L2 economics sources include [L2BEAT's costs view](https://l2beat.com) and growthepie's own [economics dashboard](https://www.growthepie.com/economics) which breaks down revenue vs cost vs profit per chain with charts.",
    '',
    '# Which chains are included?',
    'The list of **{{l2_profit_universe_size}}** chains: {{l2_profit_universe_list}}. **Excluded:** Ethereum mainnet (L1), Polygon PoS (sidechain), aggregate keys.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/economics for the live Ethereum L2 profit leaderboard.',
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
    { name: 'Profit', url: '/economics' },
    { name: 'Revenue', url: '/economics' },
  ],
  icon: 'gtp-metrics-economics',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostProfitableEthereumL2;
