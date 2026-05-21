import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Leaderboard answer page ranking Ethereum L2 native tokens by USD market
// cap. growthepie tracks `market_cap` and `fdv` per chain, so this page
// can compare every L2 token apples-to-apples and explicitly call out the
// L2s that have no native token (Base, Linea pre-launch, etc.) rather than
// silently dropping them. Placeholders use `{{l2_token_*}}`.

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 token has the highest market cap?',
    a: 'As of {{l2_token_data_date}} UTC, the largest Ethereum L2 native token by USD market cap is **{{l2_token_leader_name}}** at **{{l2_token_leader_mc}}** (fully-diluted valuation **{{l2_token_leader_fdv}}**). Runner-up: {{l2_token_runner_up}}. Third place: {{l2_token_third_place}}. Combined market cap of every tracked L2 token: **{{l2_token_ecosystem_mc}}** (combined FDV: {{l2_token_ecosystem_fdv}}). **Important caveat:** some L2s use a token whose value is driven by something other than the L2 itself — most notably **UNI on Unichain**, where UNI is primarily Uniswap\'s DEX governance token and its market cap reflects Uniswap\'s entire ecosystem value rather than Unichain\'s L2 economics. See the "Is UNI really an Unichain token?" FAQ below. Live tracker: [growthepie.com/economics](https://www.growthepie.com/economics).',
  },
  {
    q: 'Is UNI really an "Unichain L2 token"?',
    a: 'Technically yes — **UNI is Unichain\'s native token** — but its market cap is dominated by its role as the **Uniswap protocol governance token**, not by Unichain L2 activity. UNI launched in September 2020 (years before Unichain) as the governance token for Uniswap, the largest DEX on Ethereum and across many chains. Today UNI\'s value reflects Uniswap\'s entire onchain footprint — DEX fee accrual, governance rights, multi-chain protocol revenue — and Unichain L2 specifically is a small fraction of that. So when UNI appears high on this ranking, it\'s because of Uniswap, not because of Unichain. If you want to isolate "how much value does the L2\'s own usage drive", token market cap is the wrong lens for UNI/Unichain — use activity metrics (transactions, DAA, throughput) or settlement-side metrics (fees / profit / TVL) instead. See [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2) and [/answers/most-profitable-ethereum-l2](/answers/most-profitable-ethereum-l2).',
  },
  {
    q: 'Are there other L2s with "shared" tokens like UNI?',
    a: 'Potentially yes — any L2 that adopts an existing pre-L2 token instead of launching a chain-specific one falls into the same category. Examples to watch for: **POL on Polygon zkEVM** would carry POL\'s entire Polygon-ecosystem value if it appears in this ranking (although Polygon PoS itself is a sidechain and excluded from growthepie\'s L2 universe — see [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain)). The pattern is the same: when a token predates its associated L2 or serves a broader protocol, its market cap is not a clean measure of "the L2\'s economic value". Read the ranking with that asymmetry in mind. Tokens that are unambiguously L2-native (ARB → Arbitrum, OP → Optimism, STRK → Starknet, MNT → Mantle) don\'t carry this caveat.',
  },
  {
    q: 'What\'s the difference between market cap and FDV?',
    a: '**Market cap** = circulating supply × current price. It only counts tokens already in circulation. **Fully-diluted valuation (FDV)** = total max supply × current price. FDV counts every token that will ever exist, including locked / vested / team / DAO-treasury tokens that haven\'t hit the market yet. **The MC / FDV ratio tells you what fraction of the supply is already in circulation** — a number close to 100% means most tokens are already trading; a low number (often 5–30% for newer L2 tokens) means a large portion of supply is still vested and could eventually enter the market.',
  },
  {
    q: 'Which L2s have no native token?',
    a: 'On {{l2_token_data_date}} UTC, the L2s in growthepie\'s tracked universe with **no native token** are: {{l2_token_no_token_list}}. The most prominent is **Base** — Coinbase has publicly stated they do not plan to issue a native token. Some others are early-stage chains that may launch tokens later. These chains are excluded from the market-cap ranking by definition, not because data is missing.',
  },
  // ----- The ranking -----
  {
    q: 'What are the top 10 Ethereum L2 tokens by market cap?',
    a: 'On {{l2_token_data_date}} UTC, the top 10 Ethereum L2 native tokens by USD market cap are: {{l2_token_top10}}. The list updates daily from growthepie\'s per-chain `/v1/metrics/chains/{chain}/market_cap.json` endpoints.',
  },
  {
    q: 'What is the combined market cap of all Ethereum L2 tokens?',
    a: 'Combined market cap across every tracked L2 token (data {{l2_token_data_date}} UTC): **{{l2_token_ecosystem_mc}}**. Combined FDV: **{{l2_token_ecosystem_fdv}}**. The ratio gives the ecosystem-wide circulating supply share — typically lower than for older crypto markets because most L2 tokens are still vesting.',
  },
  // ----- Why each ranks where it does -----
  {
    q: 'Why does ARB lead the L2 token rankings?',
    a: 'Arbitrum has had a mainnet token since the March 2023 airdrop, while many newer L2s launched tokens later or not at all. ARB benefits from being **the largest L2 by all-time TVL and one of the earliest production-grade rollups**, which translates into deeper liquidity, broader exchange listings, and a longer track record. The token serves DAO governance and ongoing emissions, with sequencer revenue and incentive programs flowing through Arbitrum\'s governance process.',
  },
  {
    q: 'Why does Base not have a token if it\'s one of the biggest L2s?',
    a: '**Coinbase has publicly committed not to issue a Base token.** This is an intentional strategy choice — Coinbase, as a public company, derives revenue from Base\'s sequencer fees directly and prefers that over the complexity of running a token (which would invite securities-law scrutiny in the US and could fragment Coinbase\'s own revenue). For users, this means Base has no governance token to hold or stake; for developers it means no native-token incentive programs the way other L2s offer. Base\'s onchain activity numbers continue to lead despite the no-token strategy — see [/answers/base-vs-arbitrum](/answers/base-vs-arbitrum).',
  },
  // ----- Methodology -----
  {
    q: 'How is the market cap calculated?',
    a: '**Market cap = circulating supply × current USD price.** growthepie pulls per-token market-cap and FDV time series from the per-chain endpoints (`/v1/metrics/chains/{chain}/market_cap.json` and `/v1/metrics/chains/{chain}/fdv.json`). The latest available daily row\'s USD value is the headline figure shown here. The endpoint sources its underlying price and supply data from standard market-data providers — so this page agrees directionally with CoinGecko / CoinMarketCap for the same tokens, though small differences in snapshot timing and circulating-supply definitions can produce minor variances.',
  },
  {
    q: 'Is the ranking restricted to "true" L2s only?',
    a: 'Yes — only chains in growthepie\'s curated Ethereum L2 universe are ranked here. That excludes sidechains (e.g. Polygon PoS — its token POL/MATIC has a large market cap but Polygon PoS is not an Ethereum L2 by the standard definition; see [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain)) and Ethereum L1 itself. **{{l2_token_universe_size}}** L2s are in the universe on {{l2_token_data_date}} UTC; **{{l2_token_tracked_count}}** of them have a native token tracked here; the remaining **{{l2_token_no_token_count}}** are listed under "no native token" above.',
  },
  {
    q: 'How does this compare to CoinGecko / CoinMarketCap?',
    a: 'CoinGecko and CoinMarketCap rank tokens globally without distinguishing whether the token is for an Ethereum L2, an L1, a DeFi protocol, or something else. This page restricts the ranking to **Ethereum L2 native tokens only**, using growthepie\'s own L2 classification (the same one used across all other answer pages on this site). So this page answers "which L2 token has the highest market cap" specifically, not "which crypto token in general". Absolute MC values should agree closely with CoinGecko / CoinMarketCap for any given token.',
  },
  {
    q: 'Why does this change rapidly over time?',
    a: 'Two reasons: **(1) Price.** Token market cap is dominated by short-term price swings — a 20% price move shifts MC by 20% with no fundamental change. **(2) Supply unlocks.** L2 tokens with low circulating-share figures have large vesting / treasury supplies that unlock over months and years. When an unlock hits, circulating supply rises, increasing the MC even if price is flat. Treat any single snapshot as a daily picture, not a long-term valuation.',
  },
  {
    q: 'Where can I see this updating live?',
    a: 'growthepie\'s [economics dashboard](https://www.growthepie.com/economics) tracks per-chain market cap, FDV, fees, profit, and other token-relevant metrics live. Per-chain pages (e.g. [/chains/arbitrum](https://www.growthepie.com/chains/arbitrum), [/chains/optimism](https://www.growthepie.com/chains/optimism)) show each token in context with the chain\'s usage metrics — useful for "is this token expensive vs the activity that backs it" comparisons.',
  },
  {
    q: 'Does a higher token market cap mean the chain is more important?',
    a: 'No. Token market cap measures the speculative + governance value of one specific asset, not the strategic or technical importance of the chain. **Base has zero token market cap but leads in daily transactions, daily active addresses, and aggregate user activity.** Conversely, a chain with a high token MC but low onchain activity may have a token-trading market that\'s much larger than its actual economic activity. Use both lenses; see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2) for activity rankings and [/answers/most-value-secured-ethereum-l2](/answers/most-value-secured-ethereum-l2) for value-secured rankings.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/highest-market-cap-l2-token';
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
    '@id': 'https://www.growthepie.com/datasets/l2-token-market-cap',
    name: 'Ethereum L2 native tokens — market cap and FDV',
    description:
      'USD market cap, fully-diluted valuation (FDV), and 30-day market-cap change for every Ethereum L2 native token in growthepie\'s tracked universe. Excludes chains without a native token.',
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
      'L2 token',
      'Market cap',
      'FDV',
      'Fully-diluted valuation',
      'ARB',
      'OP',
      'STRK',
      'MNT',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-chain market_cap and fdv USD daily time series from growthepie\'s per-chain endpoints. The latest available daily row provides the headline figures. 30-day change is computed as (latest_USD − USD_30_days_ago) / USD_30_days_ago. Circulating share = market_cap / FDV. Chains with no native-token data are listed separately rather than included with zero.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'market_cap_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'fdv_usd', unitText: 'USD' },
      { '@type': 'PropertyValue', name: 'circulating_share' },
      { '@type': 'PropertyValue', name: 'market_cap_30d_change_pct' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/market_cap.json',
        description: 'All chains, market-cap time series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/fdv.json',
        description: 'All chains, FDV time series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/market_cap.json',
        description: 'Per-chain market-cap daily series.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/metrics/chains/{chain}/fdv.json',
        description: 'Per-chain FDV daily series.',
      },
    ],
  },
];

const highestMarketCapL2Token: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 token has the highest market cap?',
  subtitle:
    'A direct, data-backed ranking of Ethereum L2 native tokens by USD market cap — with FDV, circulating share, and 30-day change for each.',
  shortTitle: 'Top L2 token MC',
  summary:
    "Ethereum L2 native tokens (ARB, OP, STRK, MNT, etc.) vary widely in market cap. growthepie tracks market cap and fully-diluted valuation per chain so the comparison is apples-to-apples across the L2 universe. Several major L2s — Base in particular — have no native token by design, and are listed separately rather than ranked with zeros. The ranking reflects market cap × current circulating supply only; activity rankings and value-secured rankings tell different stories.",
  content: [
    "**Short answer (data {{l2_token_data_date}} UTC):** The Ethereum L2 native token with the highest market cap is **{{l2_token_leader_name}}** at **{{l2_token_leader_mc}}** (FDV {{l2_token_leader_fdv}}). Runner-up: {{l2_token_runner_up}}. Third place: {{l2_token_third_place}}. Combined market cap across every tracked L2 token: **{{l2_token_ecosystem_mc}}**.",

    "> **Important caveat — shared tokens.** Some L2s use a token whose value is primarily driven by something other than the L2 itself. The clearest example is **UNI on Unichain**: UNI is the governance token of Uniswap (the DEX protocol that launched in 2018, years before Unichain), so UNI's market cap reflects Uniswap's entire ecosystem value — DEX fee accrual, governance rights, multi-chain protocol revenue — *not* Unichain's L2 economics. A similar consideration applies to any L2 that adopts an existing ecosystem token (e.g. POL if associated with Polygon zkEVM) rather than launching a chain-specific one. **The ranking shows what each L2's native-or-adopted token is worth — it does not isolate the value attributable to the L2's own usage.** This is the most important caveat to keep in mind when reading the headline number.",

    "> Updated daily — the ranking on this page recomputes from growthepie's per-chain market-cap and FDV endpoints. Token prices fluctuate by the minute; treat any single snapshot as a daily picture, not a long-term valuation.",

    '# Live ranking — L2 tokens by market cap',
    '{{l2_token_dense}}',

    '# Why some L2s aren\'t in the ranking',
    'Several Ethereum L2s in growthepie\'s tracked universe **have no native token** and are therefore excluded from the market-cap ranking by definition:',
    '',
    "**No native token** ({{l2_token_no_token_count}} of {{l2_token_universe_size}} tracked L2s): {{l2_token_no_token_list}}.",
    '',
    "The most prominent is **Base**, which Coinbase has publicly committed not to tokenise. This is a strategy choice (Coinbase prefers direct sequencer revenue over the complexities of running a token) rather than a data gap. Several others are early-stage chains that may launch tokens later. **In every case, the absence of a token means the chain has nothing to rank on market cap — not that its data is missing.**",

    '# Market cap, FDV, and circulating share',
    'Three numbers that often get conflated but mean different things:',
    '- **Market cap (MC) = circulating supply × current price.** Counts only tokens already in users\' hands or in circulating treasury allocations.',
    '- **Fully-diluted valuation (FDV) = total max supply × current price.** Counts every token that will ever exist, including locked / vested / team / DAO-treasury tokens that haven\'t hit the market yet.',
    '- **Circulating share = MC / FDV.** What fraction of the max supply is already trading. Close to 100% means most tokens are already in circulation; a low number (often 5–30% for newer L2 tokens) means significant supply is still vested and could enter the market over coming months or years.',
    '',
    'Why this matters: a token with a low circulating share has structural sell-pressure embedded as vesting cliffs unlock. Two tokens with identical market caps can have very different prospective price trajectories if their FDVs and unlock schedules differ. The full table on this page shows both MC and FDV side-by-side.',

    '# What the ranking does and does not tell you',
    'Market cap is one specific lens. It measures **the speculative + governance value of one specific asset** on top of the chain — not the chain\'s strategic or technical importance.',
    '- **Base has zero token market cap** but leads daily transactions, daily active addresses, and aggregate user activity among L2s. By any "is this chain important" measure, Base is in the top tier — yet it doesn\'t appear in this ranking because it has no token. See [/answers/base-vs-arbitrum](/answers/base-vs-arbitrum) for the activity head-to-head.',
    '- **A chain with a high token MC and low activity** has a token-trading market that may be much larger than its actual onchain economic activity. The price might be sustained by retail speculation, governance accumulation, or future-roadmap anticipation rather than current usage. Cross-check against [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2) to see if usage backs the valuation.',
    '- **A chain with low token MC but rising activity** may indicate an undervalued opportunity *or* a chain that simply doesn\'t plan to extract value through its token. Both are valid — but the token MC won\'t tell you which.',
    '- **A chain with a "shared" token** — a token whose value is dominated by something other than the L2 — will show a market cap that mostly reflects the *other* thing. The clearest case is **UNI on Unichain**: UNI is Uniswap\'s DEX governance token first and Unichain\'s native token second, and its market cap is dominated by Uniswap\'s entire ecosystem value rather than Unichain\'s L2 usage. When you see UNI high in this ranking, that\'s Uniswap appearing, not Unichain. See the FAQs above.',
    '',
    "Use this ranking alongside activity, value-secured (TVL), and profit rankings — they answer different questions.",

    '# Methodology and data sources',
    '**How the answer is derived (transparent methodology):**',
    "1. Pull the [master chain catalogue](https://api.growthepie.com/v1/master.json) and filter to the curated L2 universe (bucket !== \"Layer 1\", deployment === \"PROD\", excludes sidechains and aggregate keys).",
    "2. For each L2, pull `/v1/metrics/chains/{chain}/market_cap.json` and `/v1/metrics/chains/{chain}/fdv.json` — daily series with `[unix, usd, eth]` rows.",
    "3. Headline market cap = the latest USD row from the market-cap series (walking back if the trailing row has a null value). FDV = latest USD row from the FDV series.",
    "4. **30-day change** = (latest_USD − USD_30_days_ago) / USD_30_days_ago.",
    "5. **Circulating share** = MC / FDV.",
    "6. Chains whose market-cap AND FDV series are both empty are placed on the **\"no native token\"** list rather than ranked with zeros.",
    "7. Sort descending by market cap. Ecosystem totals = sum across the ranked list.",
    '',
    "All values shown were generated on {{l2_token_data_date}} UTC. Data is licensed CC BY-NC 4.0. Source code and methodology are open on [the growthepie GitHub organization](https://github.com/growthepie).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Some supporters operate chains whose tokens appear in the ranking. Rankings are computed mechanically from public market-data feeds — chains and tokens do not pay for inclusion or placement, and supporters do not receive ranking adjustments. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Token market caps shown here should agree closely with [CoinGecko](https://www.coingecko.com) and [CoinMarketCap](https://coinmarketcap.com) for the same tokens. Small differences come from snapshot timing and circulating-supply definitions. What this page adds vs general crypto trackers: **the universe is restricted to Ethereum L2 native tokens**, using growthepie's own L2 classification so the ranking is internally consistent with the rest of this site.",
    '',
    '# Which chains are included?',
    "The list of **{{l2_token_universe_size}}** chains in this page's universe: {{l2_token_universe_list}}.",
    '',
    "**What we exclude and why:**",
    '- **Ethereum mainnet** — ETH is Layer 1\'s native token, not an L2 token.',
    '- **Polygon PoS** — sidechain, not an Ethereum L2 (POL/MATIC is a sidechain token).',
    '- **Aggregate keys** (`all_l2s`, `multiple`) — not individual chains.',
    '- **L2s with no native token** ({{l2_token_no_token_list}}) — listed separately above rather than ranked.',

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-21',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Ethereum L2 token market-cap data currently unavailable. See growthepie.com/economics for the live tracker.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { icon: 'gtp-metrics-economics', name: 'Economics', url: '/economics' },
    { name: 'L2 Tokens', url: '/economics' },
    { name: 'ARB', url: '/chains/arbitrum' },
    { name: 'OP', url: '/chains/optimism' },
    { name: 'Market Cap', url: '/economics' },
    { name: 'FDV', url: '/economics' },
  ],
  icon: 'gtp-metrics-economics',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default highestMarketCapL2Token;
