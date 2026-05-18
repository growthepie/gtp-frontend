import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Seventh answer page in the L2 family. Ranks L2s by growth rate
// (month-over-month and quarter-over-quarter) across three metrics —
// throughput, transactions, and active addresses — using period-native
// aggregates so we never have to fake a rolling window. Placeholders use
// the `{{l2_growth_*}}` namespace.

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 is growing the fastest?',
    a: 'It depends on which metric and which window. As of {{l2_growth_data_date}} UTC, **month-over-month** growth leaders: {{l2_growth_throughput_monthly_leader}} by throughput; {{l2_growth_txcount_monthly_leader}} by transactions; {{l2_growth_daa_monthly_leader}} by active addresses; {{l2_growth_tvl_monthly_leader}} by total value secured (TVS). **Quarter-over-quarter** growth leaders may differ — see the per-metric tables below. Each ranking filters for minimum current-period activity so a brand-new chain with a tiny baseline doesn\'t claim implausible growth. Live leaderboards: [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput).',
  },
  {
    q: 'How is "growing fastest" measured?',
    a: 'We compare each L2\'s **last completed period** to the **period immediately before it**, for each of four metrics. Monthly = last completed month vs the month before. Quarterly = last completed quarter vs the quarter before. Growth is `(current − prior) / prior`, expressed as a percentage. The three flow metrics (throughput, transactions, active addresses) use growthepie\'s per-chain period-native timeseries, so we don\'t fake a rolling window by summing dailies — which matters for active addresses, where summing dailies would double-count multi-day users. **TVS is a stock metric**, so it\'s sampled point-in-time: latest day vs 30 days ago (monthly) or 90 days ago (quarterly).',
  },
  // ----- Per metric, monthly -----
  {
    q: 'Which Ethereum L2 has the fastest throughput growth month-over-month?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by month-over-month throughput growth are {{l2_growth_throughput_monthly_top3}}. Throughput growth is the hardest of the three metrics to game — a chain can\'t inflate gas-per-second with cheap spam.',
  },
  {
    q: 'Which Ethereum L2 has the fastest transaction growth month-over-month?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by month-over-month transaction growth are {{l2_growth_txcount_monthly_top3}}. Transaction growth often reflects fee reductions, hot apps launching, or airdrop farming — see the cross-check guidance below.',
  },
  {
    q: 'Which Ethereum L2 has the fastest active-address growth month-over-month?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by month-over-month active-address growth are {{l2_growth_daa_monthly_top3}}. Active addresses are unique per period — a wallet active on multiple days within the month is counted once, so this isn\'t inflated by per-user activity bursts the way summed-daily counts would be.',
  },
  {
    q: 'Which Ethereum L2 has the fastest total-value-secured (TVS) growth month-over-month?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by month-over-month TVS growth are {{l2_growth_tvl_monthly_top3}}. TVS measures the dollar value of assets bridged to or natively held on the chain — growth here reflects net deposits over the window. Sampled point-in-time (today vs 30 days ago) since TVS is a stock, not a flow.',
  },
  // ----- Per metric, quarterly -----
  {
    q: 'Which Ethereum L2 has the fastest throughput growth quarter-over-quarter?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by quarter-over-quarter throughput growth are {{l2_growth_throughput_quarterly_top3}}. Quarter-over-quarter smooths out monthly volatility — a chain that posts +200% one month and −80% the next won\'t lead this list, but a chain with steady multi-month growth will.',
  },
  {
    q: 'Which Ethereum L2 has the fastest transaction growth quarter-over-quarter?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by quarter-over-quarter transaction growth are {{l2_growth_txcount_quarterly_top3}}.',
  },
  {
    q: 'Which Ethereum L2 has the fastest active-address growth quarter-over-quarter?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by quarter-over-quarter active-address growth are {{l2_growth_daa_quarterly_top3}}.',
  },
  {
    q: 'Which Ethereum L2 has the fastest TVS growth quarter-over-quarter?',
    a: 'On {{l2_growth_data_date}} UTC, the top three Ethereum L2s by quarter-over-quarter TVS growth are {{l2_growth_tvl_quarterly_top3}}. Quarter-over-quarter TVS samples the same point-in-time on the latest day vs 90 days ago — smoother than monthly because short-term bridge flows wash out.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Why exclude tiny chains from the growth ranking?',
    a: 'Because tiny baselines produce silly numbers. A new L2 that goes from 100 daily transactions to 1,000 is growing 900%, but it\'s not meaningfully scaling Ethereum — and including it would push every chain that actually matters out of the top 10. We apply a minimum-activity threshold on the CURRENT period (e.g. ≥0.05 Mgas/s of throughput, ≥50k transactions per month, ≥1,000 unique addresses per month) before ranking by growth %. Adjust the threshold and you\'d get a different ranking — what we publish is the threshold that empirically produces a list of chains people recognise as meaningful.',
  },
  {
    q: 'What does "current period" mean exactly?',
    a: 'The most recent **completed** period. Monthly = the last calendar month that has fully closed. Quarterly = the last quarter that has fully closed. We deliberately avoid the in-progress period — its values change every day and would make the rankings flicker. As a result the "current" period is usually 1–30 days old depending on when in the month the page is fetched.',
  },
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from these growth rankings, matching the rest of the answer pages on growthepie. Polygon zkEVM is a ZK rollup and is included.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_growth_universe_size}} chains. The full list (computed on {{l2_growth_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_growth_universe_list}}. A chain only appears in a given ranking if it has data for at least two completed periods AND its current-period value clears the minimum-activity threshold for that metric.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Per-chain values come from growthepie\'s per-chain timeseries endpoints (`/v1/metrics/chains/{chain}/{metric}.json`). For the three flow metrics (throughput, txcount, daa) we read `details.timeseries.monthly.data` and `.quarterly.data` and take the most-recent-completed and prior entries. For TVS we read `details.timeseries.daily.data` (the per-chain TVL endpoint only exposes a daily series) and sample the USD column at the latest day plus offsets of 30 days (monthly prior) and 90 days (quarterly prior) — point-in-time comparison appropriate for a stock metric. Growth is `(current − prior) / prior`. L2 membership comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_growth_data_date}} UTC: {{l2_growth_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'Why does the fastest-growing chain not match the "most used" chain?',
    a: 'Because they answer different questions. "Most used" measures the absolute level of activity right now — which chain processes the most transactions, has the most users, the most throughput. "Fastest-growing" measures the rate of change — which chain is increasing fastest from period to period. A mature chain like Base or Arbitrum tops most-used rankings but rarely tops growth rankings; the growth rankings are usually led by smaller chains that recently launched a hot app, reduced fees, or won a major migration.',
  },
  {
    q: 'Can a chain be growing fast on one metric but flat on another?',
    a: 'Absolutely, and the page intentionally exposes all three. A chain that adds a token-launch platform may post massive transaction growth without much throughput growth (the transactions are cheap mints). A chain that wins a single high-value app may grow throughput without growing addresses. A chain that runs an airdrop campaign may grow addresses without sustained transaction growth. We rank all three metrics independently so an honest reader can see where the growth is concentrated.',
  },
  {
    q: 'Where can I see live L2 growth data?',
    a: 'growthepie tracks every L2 with daily, weekly, monthly, and quarterly timeseries at [growthepie.com/fundamentals/throughput](https://www.growthepie.com/fundamentals/throughput), [/transaction-count](https://www.growthepie.com/fundamentals/transaction-count), and [/daily-active-addresses](https://www.growthepie.com/fundamentals/daily-active-addresses). Per-chain pages (e.g. [/chains/base](https://www.growthepie.com/chains/base)) show period-over-period change inline.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/fastest-growing-ethereum-l2';
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
    '@id': 'https://www.growthepie.com/datasets/l2-growth-rates',
    name: 'Ethereum L2 Growth Rates (month-over-month and quarter-over-quarter)',
    description:
      'Per-chain period-over-period growth rates for throughput, transaction count, active addresses, and total value secured (TVS) across every tracked Ethereum L2. Used to answer "which L2 is growing the fastest" by metric and window.',
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
      'Growth',
      'Throughput',
      'Transaction count',
      'Active addresses',
      'TVS',
      'Total value secured',
      'TVL',
      'Onchain analytics',
    ],
    measurementTechnique:
      'For flow metrics (throughput, txcount, daa) the most recent completed monthly and quarterly aggregate is compared to the period immediately before it; aggregates are period-native (so DAA isn\'t double-counted from summed dailies). For TVS (a stock metric) the latest daily USD value is compared to the value 30 days ago (monthly) or 90 days ago (quarterly) — point-in-time comparison. Growth = (current − prior) / prior. Chains are filtered by minimum current-period activity (≥0.05 Mgas/s throughput; ≥50k transactions per month; ≥1,000 unique addresses per month; ≥$10M TVS) to prevent tiny-numerator inflation.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'chain' },
      { '@type': 'PropertyValue', name: 'metric' },
      { '@type': 'PropertyValue', name: 'window' },
      { '@type': 'PropertyValue', name: 'current_value' },
      { '@type': 'PropertyValue', name: 'prior_value' },
      { '@type': 'PropertyValue', name: 'growth_pct' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/{chain}/throughput.json',
        description: 'Per-chain throughput timeseries (daily / weekly / monthly / quarterly).',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/{chain}/txcount.json',
        description: 'Per-chain transaction count timeseries (daily / weekly / monthly / quarterly).',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/{chain}/daa.json',
        description: 'Per-chain active-address timeseries (daily / weekly / monthly / quarterly).',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/metrics/chains/{chain}/tvl.json',
        description: 'Per-chain TVL / TVS timeseries (daily, USD + ETH columns).',
      },
    ],
  },
];

const fastestGrowingEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 is growing the fastest?',
  subtitle:
    'Ranked by month-over-month and quarter-over-quarter growth across throughput, transactions, and active addresses — with a minimum-activity filter so tiny chains don\'t fake the leaderboard.',
  shortTitle: 'Fastest-Growing L2',
  summary:
    "The fastest-growing Ethereum L2 depends on which metric and which window. growthepie ranks every tracked L2 by month-over-month and quarter-over-quarter growth in throughput, transaction count, and active addresses. We use period-native aggregates so a multi-day user counts once per month (no double-counting from summed dailies), and we filter for minimum current-period activity so a brand-new chain with a tiny baseline can't claim implausible growth. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_growth_data_date}} UTC):** Month-over-month, the fastest-growing Ethereum L2s are **{{l2_growth_throughput_monthly_leader}}** by throughput, **{{l2_growth_txcount_monthly_leader}}** by transactions, **{{l2_growth_daa_monthly_leader}}** by active addresses, and **{{l2_growth_tvl_monthly_leader}}** by total value secured (TVS). Quarter-over-quarter leaders may differ — see the per-metric tables below.",

    '## Top 3 by metric and timeframe',
    '',
    '**Throughput growth (Mgas/s)**',
    '- Month-over-month: {{l2_growth_throughput_monthly_top3}}.',
    '- Quarter-over-quarter: {{l2_growth_throughput_quarterly_top3}}.',
    '',
    '**Transaction count growth**',
    '- Month-over-month: {{l2_growth_txcount_monthly_top3}}.',
    '- Quarter-over-quarter: {{l2_growth_txcount_quarterly_top3}}.',
    '',
    '**Active addresses growth**',
    '- Month-over-month: {{l2_growth_daa_monthly_top3}}.',
    '- Quarter-over-quarter: {{l2_growth_daa_quarterly_top3}}.',
    '',
    '**Total value secured (TVS) growth**',
    '- Month-over-month: {{l2_growth_tvl_monthly_top3}}.',
    '- Quarter-over-quarter: {{l2_growth_tvl_quarterly_top3}}.',

    "> Updated daily — every growth ranking on this page is recomputed from growthepie's public per-chain timeseries. Current = most recent **completed** period; we deliberately skip the in-progress period to keep the rankings stable day-to-day.",

    '# How we measure growth',
    'We compare each L2\'s last completed period to the period immediately before it, for four metrics:',
    '- **Throughput (Mgas/s)** — hardest to game. A chain can\'t inflate gas-per-second with cheap spam because every operation costs gas proportional to its complexity.',
    '- **Transaction count** — most intuitive. Sensitive to fee reductions and hot apps launching.',
    '- **Active addresses** — closest proxy for "real users". Period-native unique counts mean a multi-day user is counted once per window.',
    '- **Total value secured (TVS)** — the dollar value of assets bridged to or natively held on the chain. Capital-weight signal; growth here reflects new deposits net of withdrawals.',
    '',
    'Two windows:',
    '- **Month-over-month** — last completed month vs the month before. Responsive.',
    '- **Quarter-over-quarter** — last completed quarter vs the quarter before. Smooths out monthly volatility.',
    '',
    "**Minimum-activity filter.** Tiny chains with small baselines can post implausible growth percentages (100 → 1000 addresses reads as +900%). To keep the rankings meaningful, we require each chain to clear a minimum CURRENT-period value before being eligible: ≥0.05 Mgas/s throughput, ≥50k transactions per month, ≥1,000 unique addresses per month, ≥$10M TVS. Adjust the thresholds and you'd get a different list — what we publish is calibrated to surface chains people recognise.",

    '# Fastest-growing L2s — month-over-month',
    '{{l2_growth_monthly_dense}}',

    '# Fastest-growing L2s — quarter-over-quarter',
    '{{l2_growth_quarterly_dense}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. For each L2 and each metric, pull the per-chain timeseries endpoint (`/v1/metrics/chains/{chain}/{metric}.json`).",
    "3. For **flow metrics** (throughput, txcount, daa): read `details.timeseries.monthly.data` and `.quarterly.data`. Take the **second-to-last** entry as the current value (most recent completed period) and the **third-to-last** as the prior value.",
    "4. For **TVS** (a stock metric): the per-chain TVL endpoint only exposes a daily series, so read `details.timeseries.daily.data`, resolve the USD column by name, and sample the latest day plus offsets at −30 days (monthly prior) and −90 days (quarterly prior).",
    "5. Compute growth as `(current − prior) / prior`. Skip chains whose current value is below the minimum-activity threshold for that metric.",
    "6. Sort chains by growth %, descending. Take the top 10 per (metric, window) pair.",

    "All values shown on this page were generated on {{l2_growth_data_date}} UTC from growthepie's public API:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Per-chain throughput timeseries: `https://api.growthepie.com/v1/metrics/chains/{chain}/throughput.json`',
    '- Per-chain transaction-count timeseries: `https://api.growthepie.com/v1/metrics/chains/{chain}/txcount.json`',
    '- Per-chain active-address timeseries: `https://api.growthepie.com/v1/metrics/chains/{chain}/daa.json`',
    '- Per-chain TVL / TVS timeseries (daily, USD): `https://api.growthepie.com/v1/metrics/chains/{chain}/tvl.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the rankings above. Rankings are computed mechanically from public API data — chains do not pay for inclusion or placement, and supporters do not receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent L2 growth sources include [L2BEAT's activity view](https://l2beat.com) (per-chain transaction counts over time), [Dune Analytics](https://dune.com/) (community-built growth dashboards), and the chains' own community reports. Definitions differ — L2BEAT and growthepie can disagree on which chains count as L2s, and growth windows differ between providers. When rankings disagree, comparing the underlying chain inclusion lists and window definitions is usually more informative than the ranks themselves.",
    '',
    '# Which chains are included?',
    "The list of **{{l2_growth_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_growth_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it is Layer 1, not Layer 2.',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',
    '- **Chains below the minimum-activity threshold** — see methodology above. Excluding tiny chains from growth rankings is a deliberate choice, not an oversight.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/fundamentals/throughput for the live Ethereum L2 leaderboards.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/fundamentals/throughput' },
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
    {
      icon: 'gtp-metrics-activeaddresses',
      name: 'Active Addresses',
      url: '/fundamentals/daily-active-addresses',
    },
    {
      name: 'TVS',
      url: '/fundamentals/total-value-secured',
    },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default fastestGrowingEthereumL2;
