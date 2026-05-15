import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Fifth answer page in the L2 family. The shape is different from the
// rankings-by-chain pages: it answers a question about applications, not
// chains, and exposes three top-10 lists (txcount / daa / gas fees) plus a
// per-category top-5 (by txcount). Placeholders use the `{{l2_apps_*}}`
// namespace so they can't collide with the other namespaces in use
// (`l2_*`, `l2_fee_*`, `l2_stables_*`, `l2_txs_*`).

export const faqItems: FaqItem[] = [
  {
    q: 'What are the top apps on Ethereum L2s?',
    a: 'Over the {{l2_apps_window_label}}, the top apps on Ethereum L2s are: **{{l2_apps_leader_txcount}}** by transactions; **{{l2_apps_leader_daa}}** by active addresses (summed across chains); and **{{l2_apps_leader_gas_fees}}** by gas fees paid. Top 10 by transactions: {{l2_apps_top10_txcount}}. Data: {{l2_apps_data_date}} UTC. Live leaderboards: [growthepie.com/applications](https://www.growthepie.com/applications).',
  },
  {
    q: 'How is "top app" defined here?',
    a: 'We rank by three independent metrics and present all three so a single number can\'t mislead you. **Transaction count** is total transactions sent to the app\'s contracts across L2s. **Active addresses** is the sum of unique addresses interacting with the app per chain (summed across chains — see the cross-chain caveat below). **Gas fees paid** is the USD-denominated fees the app\'s users have paid to L2 sequencers. A high ranking by gas fees but low ranking by transactions suggests an app with infrequent but expensive transactions (e.g. heavy compute, large swaps). High by transactions and addresses but low by gas fees suggests cheap, high-frequency activity (e.g. memecoin trading on a low-fee L2).',
  },
  // ----- Top 10 lists -----
  {
    q: 'Which app has the most transactions on Ethereum L2s?',
    a: 'Over the {{l2_apps_window_label}}, the top app by transactions on Ethereum L2s is **{{l2_apps_leader_txcount}}**. Full top 10 by transactions (across all L2s): {{l2_apps_top10_txcount}}.',
  },
  {
    q: 'Which app has the most active addresses on Ethereum L2s?',
    a: 'Over the {{l2_apps_window_label}}, the top app by active addresses on Ethereum L2s is **{{l2_apps_leader_daa}}**. Full top 10 by active addresses (summed across chains; see cross-chain caveat below): {{l2_apps_top10_daa}}.',
  },
  {
    q: 'Which app pays the most gas fees on Ethereum L2s?',
    a: 'Over the {{l2_apps_window_label}}, the top app by gas fees paid on Ethereum L2s is **{{l2_apps_leader_gas_fees}}**. Full top 10 by gas fees paid (USD, summed across chains): {{l2_apps_top10_gas_fees}}. Gas fees paid is a useful "economic weight" signal — apps high on this list are paying real money to operate on L2s and contribute meaningfully to chain revenue.',
  },
  // ----- Per-category top 5 (by tx) -----
  {
    q: 'What are the top apps by category on Ethereum L2s?',
    a: 'We rank the top 5 apps in each main category by transaction count. Categories are sorted by combined transaction count (the largest category first). See the per-category section above for the full breakdown — the page renders one ranked list per category.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Why are active addresses summed across chains?',
    a: 'Because the source data exposes daily active addresses per (app, chain), not per app across chains. Summing across chains is the most we can do without an address-overlap dataset. A user who interacts with the same app on multiple L2s in the same window will be counted once per chain — so an app spanning many chains may rank higher by this metric than its true unique-address count would suggest. The transaction count and gas fees rankings are not affected by this caveat.',
  },
  {
    q: 'What window are these rankings computed over?',
    a: 'The {{l2_apps_window_label}}. We use this window for the headline lists because it\'s long enough to smooth out single-day spikes and short enough to reflect current activity. growthepie\'s [applications dashboard](https://www.growthepie.com/applications) lets you switch between 1d / 7d / 30d / 90d / 1y / max windows interactively.',
  },
  {
    q: 'Is Polygon PoS counted as an L2 here?',
    a: 'No. Polygon PoS is a sidechain with its own validator set and is excluded from these app rankings, matching the rest of the answer pages on growthepie. Polygon zkEVM is a ZK rollup and is included.',
  },
  {
    q: 'Is Ethereum mainnet activity counted?',
    a: 'No. Apps that operate on both Ethereum mainnet and L2s will only have their L2 activity counted in these rankings. Mainnet rows in the source data are filtered out before aggregation.',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_apps_universe_size}} chains. The full list (computed on {{l2_apps_data_date}} UTC from growthepie\'s master chain catalogue) is: {{l2_apps_universe_list}}. An app contributes to the rankings if it has activity on at least one chain in that list.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'App metrics come from growthepie\'s applications overview endpoint (`/v1/apps/app_overview_{{l2_apps_window}}.json`), which exposes per-(project, chain) rollups of transaction count, active addresses, and gas fees paid (USD) over the chosen window. App metadata — display name and main category — comes from growthepie\'s projects-filtered labels endpoint (`/v1/labels/projects_filtered.json`). L2 membership comes from `master.json` (chains where `bucket !== "Layer 1"` and `chain_type` indicates an Ethereum rollup or validium). Sidechain exclusions on {{l2_apps_data_date}} UTC: {{l2_apps_excluded_sidechains}}. No editorial overrides.',
  },
  {
    q: 'What if an app is missing from the rankings?',
    a: 'Apps need to be in growthepie\'s labelled-contracts dataset to show up. Unlabelled contracts roll up under "Unlabeled" in the blockspace view but don\'t appear here as named apps. If you operate an app and want it tracked, see growthepie\'s [labels portal](https://www.growthepie.com/labels) for the contract-submission flow.',
  },
  {
    q: 'Why is the "gas fees paid" number much smaller than typical fee discussions?',
    a: 'Because this number is what the app\'s USERS paid in total fees to L2 sequencers over the window — not the cost per transaction. A widely-used L2 app can pay millions of dollars in cumulative fees over 30 days while individual transactions cost fractions of a cent. For per-transaction fee costs, see growthepie\'s [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2).',
  },
  {
    q: 'Where can I see live app data?',
    a: 'growthepie\'s [applications dashboard](https://www.growthepie.com/applications) lists every tracked app on every supported chain with sortable columns for transactions, active addresses, gas fees, and chain breakdowns. Each app has a detail page at `/applications/{owner_project}` with per-chain charts and metadata.',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. This includes optimistic rollups, ZK rollups, and Validiums. Sidechains (independent validator sets, like Polygon PoS) are excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/top-apps-ethereum-l2s';
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
    '@id': 'https://www.growthepie.com/datasets/l2-apps-overview',
    name: 'Ethereum L2 Apps Overview (per project, per chain)',
    description:
      'Per-(application, chain) transaction count, active addresses, and gas fees paid over rolling windows (1d / 7d / 30d / 90d / 1y / max) across every tracked Ethereum L2.',
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
      'Applications',
      'dApps',
      'Transaction count',
      'Active addresses',
      'Gas fees',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-(project, chain) aggregation over a rolling window. Transactions are direct counts of confirmed transactions whose `to` address matches a labelled contract belonging to the project. Active addresses are unique `from` addresses interacting with the project\'s contracts over the window. Gas fees paid are the USD-denominated fees those transactions consumed.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'owner_project' },
      { '@type': 'PropertyValue', name: 'origin_key' },
      { '@type': 'PropertyValue', name: 'txcount' },
      { '@type': 'PropertyValue', name: 'daa' },
      { '@type': 'PropertyValue', name: 'gas_fees_usd', unitText: 'USD' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/apps/app_overview_30d.json',
        description:
          'Per-(app, chain) rollups, 30-day window. Swap "30d" for 1d/7d/90d/365d/max.',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-apps-projects-metadata',
    name: 'Ethereum L2 Apps — Project Metadata (display name, category)',
    description:
      'Per-project metadata (display name, main category, sub-categories, website, twitter, etc.) for every tracked application on the growthepie applications page.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    keywords: ['Ethereum', 'Applications', 'Project labels', 'dApp metadata'],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/labels/projects_filtered.json',
        description: 'Project-level metadata with display names and category labels.',
      },
    ],
  },
];

const topAppsEthereumL2s: QuickBiteData = createQuickBite({
  title: 'What are the top apps on Ethereum L2s?',
  subtitle:
    'Ranked across every tracked Ethereum L2 by transactions, active addresses, and gas fees paid — plus the top 5 apps in every category by transaction count.',
  shortTitle: 'Top L2 Apps',
  summary:
    "The top app on Ethereum L2s depends on what you measure. growthepie ranks every tracked app across L2s by transaction count, active addresses (summed across chains), and gas fees paid in USD. The headline window is the last 30 days; each app's metrics are summed across every L2 it operates on. Ethereum mainnet and sidechains (e.g. Polygon PoS) are excluded. Recomputed daily from growthepie's public API.",
  content: [
    "**Short answer (data {{l2_apps_data_date}} UTC, {{l2_apps_window_label}}):** The top app on Ethereum L2s by transactions is **{{l2_apps_leader_txcount}}**, by active addresses **{{l2_apps_leader_daa}}**, and by gas fees paid **{{l2_apps_leader_gas_fees}}**. Each ranking covers every L2 the app operates on, summed.",

    "> Updated daily — every leaderboard on this page is recomputed from growthepie's public applications endpoint. The headline window is the last 30 days; rankings within that window use the most recent completed data growthepie has published.",

    '# How we measure "top app"',
    'We rank Ethereum L2 apps by three independent metrics — each tells a different story, so we present all three:',
    '- **Transaction count** — total transactions sent to the app\'s labelled contracts across L2s. Best proxy for "how busy" an app is.',
    '- **Active addresses** — unique addresses interacting with the app per chain, summed across chains. Best proxy for "how many users". See the cross-chain caveat in the FAQ — a user on multiple L2s is counted per chain.',
    '- **Gas fees paid** — USD-denominated fees the app\'s users have paid to L2 sequencers over the window. Best proxy for "economic weight" — how much an app contributes to L2 revenue.',

    '# Top 10 apps by transactions',
    '**Over the {{l2_apps_window_label}} (data {{l2_apps_data_date}} UTC):** {{l2_apps_top10_txcount}}.',

    '# Top 10 apps by active addresses',
    '**Over the {{l2_apps_window_label}} (data {{l2_apps_data_date}} UTC):** {{l2_apps_top10_daa}}. Active addresses are summed across chains, so apps spanning many L2s rank higher than a strict unique-user count would suggest.',

    '# Top 10 apps by gas fees paid',
    '**Over the {{l2_apps_window_label}} (data {{l2_apps_data_date}} UTC):** {{l2_apps_top10_gas_fees}}. Gas fees paid is the cumulative USD-denominated fee the app\'s users have paid to L2 sequencers — a strong "economic weight" signal.',

    '# Top 5 apps per category (by transactions)',
    'Apps in growthepie\'s labels system are tagged with a main category (DeFi, NFT, gaming, social, etc.). Below is the top 5 in each category by transaction count, with categories ordered by combined transaction volume.',
    '',
    '{{l2_apps_category_top5_md}}',

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to chains where `bucket !== \"Layer 1\"`, `deployment === \"PROD\"`, and the chain key is not on the explicit non-L2 list below.",
    "2. Pull the apps overview (`/v1/apps/app_overview_{{l2_apps_window}}.json`) and drop every row whose `origin_key` is not in the L2 universe (this drops Ethereum mainnet + sidechain rows).",
    "3. For each `owner_project`, sum `txcount`, `daa`, and `gas_fees_usd` across the remaining rows.",
    "4. Pull project metadata (`/v1/labels/projects_filtered.json`) and attach each project's display name and main category.",
    "5. Sort the aggregated list three times — by txcount, daa, and gas_fees_usd — taking the top 10 of each as the headline lists.",
    "6. Group apps by main category, sort each group by transaction count, take the top 5 per category, and order categories by their combined top-5 transaction volume.",

    "All values shown on this page were generated on {{l2_apps_data_date}} UTC from growthepie's public API:",
    '- Master chain list (with bucket / chain_type classification): `https://api.growthepie.com/v1/master.json`',
    '- Per-(app, chain) rollups: `https://api.growthepie.com/v1/apps/app_overview_{{l2_apps_window}}.json` (swap `30d` for 1d/7d/90d/365d/max)',
    '- Project metadata (display name, main_category): `https://api.growthepie.com/v1/labels/projects_filtered.json`',
    'Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains that appear in the rankings above; some apps in the rankings have a token relationship with one or more supporters. Rankings are computed mechanically from public API data — apps don\'t pay for inclusion or ranking, and supporters don\'t receive ranking adjustments or preferential treatment. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent app-ranking sources you can compare against include [DefiLlama](https://defillama.com/protocols) (TVL-focused, broader chain coverage), [Dune Analytics](https://dune.com/) (community-built dashboards), and the chains' own ecosystem pages. Methodologies differ — DefiLlama ranks by TVL not activity, growthepie ranks by usage. When rankings disagree it's usually because the underlying metric is different, not the data.",
    '',
    '# Which chains are included?',
    "The list of **{{l2_apps_universe_size}}** chains is computed automatically from `master.json` and refreshed when growthepie adds or removes coverage:",
    "{{l2_apps_universe_list}}.",
    '',
    '**What we exclude and why:**',
    '- **Ethereum mainnet** — it is Layer 1, not Layer 2. Apps that operate on both L1 and L2s have their L1 activity excluded from these rankings.',
    '- **Polygon PoS** — a sidechain with its own validator set, not a Layer 2.',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-15',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/applications for the live Ethereum L2 apps leaderboard.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/applications' },
    { name: 'Applications', url: '/applications' },
    { name: 'DeFi', url: '/applications' },
    { name: 'Base', url: '/chains/base' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
  ],
  icon: 'gtp-metrics-transactioncount',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default topAppsEthereumL2s;
