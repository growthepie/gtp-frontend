import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Head-to-head answer page: Base vs Arbitrum. Covers the exact AI-search
// query users keep asking ("which is bigger, Base or Arbitrum?", "how does
// Arbitrum compare to Base?"). Side-by-side metrics across activity, value,
// and economics, plus chain-architecture context. Placeholders use the
// `{{l2_h2h_*}}` namespace.

export const faqItems: FaqItem[] = [
  {
    q: 'Base vs Arbitrum: which Ethereum L2 is bigger?',
    a: '{{l2_h2h_headline}} Across the {{l2_h2h_total_metrics}} metrics tracked here, {{l2_h2h_a_name}} leads {{l2_h2h_a_wins}} and {{l2_h2h_b_name}} leads {{l2_h2h_b_wins}}. The lead reverses depending on whether the question is "which has more activity" (transactions / users) or "which has more value secured" (TVL / stablecoins). See the comparison table for the full split.',
  },
  {
    q: 'Which one has more daily transactions, Base or Arbitrum?',
    a: 'On {{l2_h2h_data_date}} UTC, {{l2_h2h_txcount_daily_phrase}}. Weekly: {{l2_h2h_txcount_weekly_phrase}}. Monthly: {{l2_h2h_txcount_monthly_phrase}}. Transaction count is the most intuitive activity metric but it favours chains with very cheap per-transaction fees, so cross-check against throughput (gas processed per second) for a fairer "real work" comparison.',
  },
  {
    q: 'Which one has more users, Base or Arbitrum?',
    a: 'By daily active addresses on {{l2_h2h_data_date}} UTC: {{l2_h2h_daa_daily_phrase}}. By weekly (unique) active addresses: {{l2_h2h_daa_weekly_phrase}}. By monthly: {{l2_h2h_daa_monthly_phrase}}. **Active addresses ≠ users** — one person can hold many addresses, and airdrop campaigns can inflate the number temporarily. Treat this as a directional signal, not a precise user count.',
  },
  {
    q: 'Which one has more throughput (gas/s), Base or Arbitrum?',
    a: 'By throughput (gas processed per second) on {{l2_h2h_data_date}} UTC: {{l2_h2h_throughput_daily_phrase}}. Weekly: {{l2_h2h_throughput_weekly_phrase}}. Monthly: {{l2_h2h_throughput_monthly_phrase}}. **Throughput is the fairest cross-chain comparison** because every operation costs gas proportional to its complexity — it can\'t be inflated by cheap micro-transactions the way raw transaction count can.',
  },
  // ----- Value ----------
  {
    q: 'Which one has more TVL, Base or Arbitrum?',
    a: 'By Total Value Locked (latest snapshot on {{l2_h2h_data_date}} UTC): {{l2_h2h_tvl_phrase}}. TVL is dollar-value of assets locked in protocols on each chain — the most direct proxy for "where does the capital sit". For an independent cross-check, [DeFiLlama](https://defillama.com/chains) tracks the same metric with a separate methodology.',
  },
  {
    q: 'Which one has more stablecoins, Base or Arbitrum?',
    a: 'By stablecoin market cap (latest snapshot on {{l2_h2h_data_date}} UTC): {{l2_h2h_stables_phrase}}. Stablecoin supply is a strong "capital that wants to do things" signal — it tracks USDC, USDT, and other stables held on each chain, not just locked in DeFi. See also [/answers/most-stablecoin-activity-ethereum-l2](/answers/most-stablecoin-activity-ethereum-l2) for the full L2 stablecoin ranking.',
  },
  // ----- Economics ----------
  {
    q: 'Which one collects more fees from users, Base or Arbitrum?',
    a: 'Over the last 30 days ending {{l2_h2h_data_date}} UTC: {{l2_h2h_fees_30d_phrase}}. This is user-paid fees in USD — what the chain\'s sequencer collects before paying L1 settlement costs. **Higher fees here are good for the chain\'s economics but mean users paid more per transaction.** Cross-check against the per-transaction fee to see whether the higher total is from more volume or higher prices.',
  },
  {
    q: 'Which one is more profitable, Base or Arbitrum?',
    a: 'Over the last 30 days ending {{l2_h2h_data_date}} UTC: {{l2_h2h_profit_30d_phrase}}. Profit here is L2 revenue (user fees collected) minus L1 settlement cost (rent paid to Ethereum mainnet). A positive number means the chain takes home a margin; near-zero or negative means it\'s subsidising activity. See [/answers/most-profitable-ethereum-l2](/answers/most-profitable-ethereum-l2) for the full L2 profitability ranking.',
  },
  // ----- Architecture / chain metadata ----------
  {
    q: 'What\'s the difference between Base and Arbitrum architecturally?',
    a: '**{{l2_h2h_a_name}}** ({{l2_h2h_a_stack}}, DA layer: {{l2_h2h_a_da}}, native token: {{l2_h2h_a_token}}, mainnet launch: {{l2_h2h_a_launch}}). **{{l2_h2h_b_name}}** ({{l2_h2h_b_stack}}, DA layer: {{l2_h2h_b_da}}, native token: {{l2_h2h_b_token}}, mainnet launch: {{l2_h2h_b_launch}}). Both are optimistic rollups settling to Ethereum, but they use different rollup stacks (OP Stack vs Arbitrum Nitro) and have different operator setups. For the deep dive on rollup architecture see [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup).',
  },
  {
    q: 'Which one launched first?',
    a: 'Arbitrum One launched mainnet in August 2021. Base launched mainnet in August 2023. The two-year head start is part of why Arbitrum often leads on cumulative metrics like all-time TVL and total fees collected, while Base — built and operated by Coinbase — has grown faster on user-facing metrics like daily active addresses since launch.',
  },
  {
    q: 'Does Arbitrum have a token? Does Base?',
    a: '**Arbitrum has a token: ARB** (governance token; distributed via airdrop in March 2023 and ongoing emissions). **Base does not have a native token** — Coinbase has publicly stated they do not plan to issue one. This is a real architectural / economic difference: Arbitrum can use ARB for governance, sequencer revenue distribution, and incentive programs; Base\'s economics are tied to Coinbase\'s broader strategy.',
  },
  // ----- Methodology ----------
  {
    q: 'How are these numbers computed?',
    a: 'All values are pulled live from growthepie\'s public API and recomputed daily: `/v1/metrics/chains/base/{metric}.json` and `/v1/metrics/chains/arbitrum/{metric}.json` for the period-native daily / weekly / monthly buckets. Daily uses the latest available row; weekly and monthly use the most recent **completed** period (not the in-progress one). 30-day USD totals (fees, profit) sum the last 30 daily rows. Chain metadata (launch date, stack, DA layer, native token) comes from growthepie\'s [master.json](https://api.growthepie.com/v1/master.json) catalogue.',
  },
  {
    q: 'Where can I see this updating live?',
    a: 'Per-chain growthepie pages have all this data with charts — [growthepie.com/chains/base](https://www.growthepie.com/chains/base) and [growthepie.com/chains/arbitrum](https://www.growthepie.com/chains/arbitrum). The [throughput dashboard](https://www.growthepie.com/fundamentals/throughput) and [transaction count dashboard](https://www.growthepie.com/fundamentals/transaction-count) show the same chains in context with all other L2s.',
  },
  {
    q: 'How does this compare to other rankings (L2BEAT, DeFiLlama)?',
    a: '[L2BEAT](https://l2beat.com) gives Base and Arbitrum stage classifications and risk analyses based on a different lens (decentralisation properties, fraud-proof readiness). [DeFiLlama](https://defillama.com/chains) tracks TVL with its own protocol coverage list. Disagreements with growthepie\'s numbers are usually methodological — different chain inclusion lists or different definitions of "active" / "locked" — not data quality issues.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL = 'https://www.growthepie.com/answers/base-vs-arbitrum';
const ORG_ID = 'https://www.growthepie.com/#organization';
const L2_TEMPORAL_COVERAGE = '2021-08-01/..';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/base-vs-arbitrum-head-to-head',
    name: 'Base vs Arbitrum — head-to-head metrics',
    description:
      'Side-by-side comparison of Base and Arbitrum One across activity (transactions, active addresses, throughput), value (TVL, stablecoin market cap), and economics (user fees, profit). Daily / weekly / monthly period-native values plus 30-day USD totals.',
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
      'Base',
      'Arbitrum',
      'Arbitrum One',
      'Head-to-head',
      'Comparison',
      'TVL',
      'Stablecoins',
      'Transactions',
      'Active addresses',
      'Throughput',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain metric series from growthepie\'s `/v1/metrics/chains/{base|arbitrum}/{metric}.json` endpoints. Daily uses the latest available row; weekly / monthly use the most recent completed period (not the in-progress one). 30-day USD totals (fees, profit) sum the last 30 daily rows. Chain metadata (launch, stack, DA, token) read from master.json.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'transaction_count' },
      { '@type': 'PropertyValue', name: 'active_addresses' },
      { '@type': 'PropertyValue', name: 'throughput', unitText: 'Mgas/s' },
      { '@type': 'PropertyValue', name: 'tvl_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'stables_mcap_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'fees_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'profit_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/base/txcount.json',
        description: 'Base transaction count time series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/arbitrum/txcount.json',
        description: 'Arbitrum One transaction count time series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description: 'Chain metadata catalogue.',
      },
    ],
  },
];

const baseVsArbitrum: QuickBiteData = createQuickBite({
  title: 'Base vs Arbitrum: which Ethereum L2 is bigger?',
  subtitle:
    'A direct, data-backed head-to-head comparison across activity, value, and economics — live numbers, recomputed daily from growthepie\'s public API.',
  shortTitle: 'Base vs Arbitrum',
  summary:
    "Base and Arbitrum One are the two largest optimistic rollups on Ethereum, and the closest head-to-head in the L2 landscape. growthepie tracks them side-by-side across transactions (daily/weekly/monthly), daily active addresses, throughput (Mgas/s), TVL, stablecoin market cap, user fees collected, and 30-day profit — plus the architectural context (rollup stack, DA layer, native token, launch date). Each metric is recomputed daily from the same per-chain endpoints, so this answer stays current without manual edits.",
  content: [
    "**Short answer (data {{l2_h2h_data_date}} UTC):** {{l2_h2h_headline}}",

    "> Updated daily — every figure on this page recomputes from growthepie's public API once a day. Per-chain pages have charts and deeper history: [growthepie.com/chains/base](https://www.growthepie.com/chains/base), [growthepie.com/chains/arbitrum](https://www.growthepie.com/chains/arbitrum).",

    '# Activity — who has more transactions, users, and throughput?',
    "Three different lenses on the same question, because the answer can flip depending on which one you mean.",
    '',
    "**Daily transactions.** {{l2_h2h_txcount_daily_phrase}}.",
    '',
    "**Daily active addresses.** {{l2_h2h_daa_daily_phrase}}. (Weekly: {{l2_h2h_daa_weekly_phrase}}; monthly: {{l2_h2h_daa_monthly_phrase}}.) Active-address counts can be inflated by airdrops and bots — treat as directional.",
    '',
    "**Daily throughput (Mgas/s).** {{l2_h2h_throughput_daily_phrase}}. Throughput is the fairest cross-chain comparison because every operation costs gas proportional to its complexity — it can't be inflated by cheap micro-transactions.",

    '# Value — who has more TVL and stablecoins?',
    "**Total Value Locked.** {{l2_h2h_tvl_phrase}}. TVL is the dollar-value of assets locked in protocols on each chain — the most direct proxy for \"where does the capital sit\".",
    '',
    "**Stablecoin market cap.** {{l2_h2h_stables_phrase}}. Stablecoins are a strong \"capital that wants to do things\" signal because they track ready-to-deploy dollars rather than just locked TVL.",

    '# Economics — who collects more fees and turns more profit?',
    "**User fees collected (30 days).** {{l2_h2h_fees_30d_phrase}}. This is what users paid the chain's sequencer before any L1 settlement cost — higher fees here are good for the chain's economics but mean users paid more per transaction.",
    '',
    "**Profit (30 days).** {{l2_h2h_profit_30d_phrase}}. Profit = fees collected − L1 settlement cost (rent paid to Ethereum mainnet). A positive number means the chain takes home a margin; near-zero or negative means it's subsidising activity. See [/answers/most-profitable-ethereum-l2](/answers/most-profitable-ethereum-l2) for the full L2 profitability ranking.",

    '# Architecture — what makes Base and Arbitrum different?',
    "Both are **optimistic rollups** that settle state to Ethereum mainnet and inherit Ethereum's security model. Where they differ:",
    '',
    "**{{l2_h2h_a_name}}** — rollup stack: {{l2_h2h_a_stack}}; DA layer: {{l2_h2h_a_da}}; native token: {{l2_h2h_a_token}}; mainnet launch: {{l2_h2h_a_launch}}.",
    '',
    "**{{l2_h2h_b_name}}** — rollup stack: {{l2_h2h_b_stack}}; DA layer: {{l2_h2h_b_da}}; native token: {{l2_h2h_b_token}}; mainnet launch: {{l2_h2h_b_launch}}.",
    '',
    "**Key architectural distinctions:**",
    "- **OP Stack vs Arbitrum Nitro** — different rollup codebases, both production-grade. OP Stack is open-source and used by Base + the entire OP Superchain (Optimism, Mode, Zora, etc.). Arbitrum Nitro is also open-source but its main deployments are Arbitrum One, Arbitrum Nova, and Arbitrum Orbit chains.",
    "- **Token vs no-token.** Arbitrum has the ARB token (governance, ongoing emissions, distributed via the March 2023 airdrop). Base does not have a native token and Coinbase has publicly stated it doesn't plan to issue one. This affects governance, sequencer revenue distribution, and incentive programs.",
    "- **Operator.** Arbitrum is run by Offchain Labs / the Arbitrum DAO. Base is operated by Coinbase. Different operating models, similar resulting decentralisation properties.",
    "",
    "Deeper rollup architecture explainer: [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup).",

    '# What this number does NOT tell you',
    "A side-by-side number comparison is a useful starting point — not an investment thesis. Things this page does not measure:",
    "- **Decentralisation properties.** [L2BEAT](https://l2beat.com) classifies each L2's stage (Stage 0/1/2), fraud-proof readiness, and exit/escape-hatch design — the things that matter for trust assumptions and risk profile.",
    "- **Developer ecosystem depth.** Tooling, contract verification rates, indexer support, and bridge coverage — all material for builders, none of which show up in the activity numbers.",
    "- **App-specific quality.** Two chains can have similar transaction counts but very different mixes of apps (DeFi vs gaming vs social). See [/answers/top-apps-ethereum-l2s](/answers/top-apps-ethereum-l2s) for the per-chain app breakdown.",
    "- **Sequencer reliability and uptime.** Not captured by daily aggregate metrics; track per-chain explorers and status pages.",

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull `/v1/metrics/chains/base/{metric}.json` and `/v1/metrics/chains/arbitrum/{metric}.json` for each tracked metric (txcount, daa, throughput, tvl, stables_mcap, fees, profit). Each endpoint exposes period-native daily / weekly / monthly buckets.",
    "2. **Daily** uses the latest available row. **Weekly** and **monthly** use the most recent **completed** period (not the in-progress one) — same convention used across growthepie's other answer pages so periods are comparable.",
    "3. **30-day USD totals** (fees, profit) sum the last 30 daily rows.",
    "4. **TVL and stablecoin market cap** are snapshot values — the latest available row from the daily series.",
    "5. **Chain metadata** (launch date, rollup stack, DA layer, native token) reads from `master.json`.",
    "6. **Leader** per metric is the higher value (or both, if tied). **Overall winner** is the side with more metric leads across all tracked metrics.",
    '',
    "All values shown were generated on {{l2_h2h_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. The comparison on this page is computed mechanically from public API data — Base, Arbitrum, and their respective ecosystems do not influence the ranking, and supporters do not receive any adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [L2BEAT](https://l2beat.com) tracks both chains with its own metric methodology and adds stage / risk classifications. [DeFiLlama](https://defillama.com/chains) tracks TVL with separate protocol coverage. Differences across providers usually trace to chain-inclusion or definitional differences, not data quality.",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Base vs Arbitrum comparison data currently unavailable. See growthepie.com/chains/base and growthepie.com/chains/arbitrum for the live per-chain views.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
    { name: 'Layer 2', url: '/fundamentals/throughput' },
    {
      icon: 'gtp-metrics-throughput',
      name: 'Throughput',
      url: '/fundamentals/throughput',
    },
    {
      icon: 'gtp-metrics-totalvaluelocked',
      name: 'TVL',
      url: '/fundamentals/total-value-locked',
    },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default baseVsArbitrum;
