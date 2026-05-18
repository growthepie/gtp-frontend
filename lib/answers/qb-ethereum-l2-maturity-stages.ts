import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2s are Stage 1 or Stage 2 rollups?',
    a: 'Three related frameworks describe how decentralised an Ethereum L2 is: **L2BEAT\'s "Stages"** (Stage 0 = training wheels, Stage 1 = proofs live with security council backstop, Stage 2 = fully decentralised), **ethereum.org\'s "maturity"** (the Ethereum Foundation\'s own per-L2 maturity assessment), and **growthepie\'s "maturity"** scale (0–3 axis: Maturing / Developing / Emerging / Early phase). All three broadly correlate. As of {{l2_mat_data_date}} UTC, growthepie\'s {{l2_mat_universe_size}}-chain Ethereum L2 universe breaks down as: **Maturing ({{l2_mat_maturing_count}})**: {{l2_mat_maturing_chains}}. **Developing ({{l2_mat_developing_count}})**: {{l2_mat_developing_chains}}. **Emerging ({{l2_mat_emerging_count}})**: {{l2_mat_emerging_chains}}. **Early phase ({{l2_mat_early_count}})**: {{l2_mat_early_chains}}. For the strict Stage 0/1/2 view see [L2BEAT](https://l2beat.com); for the EF\'s own assessment see [ethereum.org\'s Layer 2 page](https://ethereum.org/en/layer-2/).',
  },
  {
    q: 'What is L2BEAT\'s "Stage" framework?',
    a: 'A three-level classification (Stage 0 → Stage 1 → Stage 2) that measures **how decentralised a rollup actually is in production**. **Stage 0** = training wheels are on — the team has full control via a security council that can override the protocol, fraud or validity proofs aren\'t live in production. **Stage 1** = proofs are live (the protocol can validate or invalidate state transitions independently), but a security council can still pause or override during emergencies. **Stage 2** = fully decentralised — no security council overrides, the protocol stands alone. As of 2026 only a handful of L2s have reached Stage 1; very few have reached Stage 2.',
  },
  {
    q: 'Does ethereum.org also classify L2 maturity?',
    a: '**Yes.** [ethereum.org\'s Layer 2 page](https://ethereum.org/en/layer-2/) publishes the Ethereum Foundation\'s own per-L2 **maturity** assessment, using the same word ("maturity") that growthepie uses. The EF framework considers factors like rollup stage, time live in production, total value secured, and ecosystem alignment with Ethereum. ethereum.org\'s "maturity", L2BEAT\'s "Stage", and growthepie\'s "maturity" are all parallel frameworks for the same underlying question — they\'re not identical, but they broadly agree on which L2s are most production-ready.',
  },
  {
    q: 'How do growthepie\'s "maturity", ethereum.org\'s "maturity", and L2BEAT\'s "Stage" differ?',
    a: 'All three measure how production-ready a rollup is, but they emphasise different things. **L2BEAT\'s Stage** is the strictest — it requires specific cryptographic and governance properties (fraud or validity proofs in production, no override mechanism for Stage 2, etc.) and reads as a binary protocol-property check. **ethereum.org\'s maturity** is the Ethereum Foundation\'s own assessment, incorporating L2BEAT\'s stage, time live, TVS, and Ethereum alignment. **growthepie\'s maturity** is broader still — it incorporates chain age, ecosystem size, production history, and decentralisation in a single 0–3 ordinal. The three frameworks roughly correlate (most L2s growthepie marks "Maturing" are L2BEAT Stage 1+ and rank highly on ethereum.org\'s maturity) but they\'re not identical. **For canonical protocol-decentralisation, use L2BEAT. For the EF\'s view, use ethereum.org. growthepie\'s scale is what we display on the site.**',
  },
  // ----- Per maturity level FAQs -----
  {
    q: 'Which Ethereum L2s are at the "Maturing" stage?',
    a: '{{l2_mat_maturing_count}} chains: **{{l2_mat_maturing_chains}}**. "Maturing" is the highest level on growthepie\'s scale and typically maps to L2BEAT Stage 1 or beyond. These chains have been in production for years, have substantial value secured, and have shipped (or are shipping) the cryptographic/governance properties that allow them to operate with reduced training wheels.',
  },
  {
    q: 'Which Ethereum L2s are at the "Developing" stage?',
    a: '{{l2_mat_developing_count}} chains: **{{l2_mat_developing_chains}}**. "Developing" L2s are typically in production with meaningful activity and TVS, but haven\'t yet shipped the full set of decentralisation properties needed to reach growthepie\'s "Maturing" tier. Many of them are on L2BEAT Stage 0 with a stated roadmap to Stage 1.',
  },
  {
    q: 'Which Ethereum L2s are at the "Emerging" stage?',
    a: '{{l2_mat_emerging_count}} chains: **{{l2_mat_emerging_chains}}**. "Emerging" L2s are newer or smaller production chains — often launched within the last 1–2 years, often with growing but not yet large activity. They tend to be on L2BEAT Stage 0 with security-council oversight as the primary safety mechanism.',
  },
  {
    q: 'Which Ethereum L2s are at the "Early phase"?',
    a: '{{l2_mat_early_count}} chains: **{{l2_mat_early_chains}}**. "Early phase" chains are very young or very experimental — the chain operator retains significant control via a centralised sequencer and governance, fraud/validity proofs may not yet be deployed in production. Users should treat these chains as higher-risk and follow the chain\'s own roadmap toward more decentralised operation.',
  },
  // ----- What stage matters -----
  {
    q: 'Does the maturity level actually matter for users?',
    a: 'Yes, especially for high-value use cases. At lower maturity levels the chain operator (or a small security council) can effectively pause, censor, or revert the chain in an emergency. This is **deliberate and reasonable** for chains still ironing out bugs — but it means the chain\'s trust model isn\'t just "Ethereum + the protocol", it\'s "Ethereum + the protocol + the team\'s good behaviour". For deposits of meaningful value, the more mature the L2, the closer its trust model is to Ethereum\'s. For small experiments or NFT projects, the practical difference may not matter.',
  },
  {
    q: 'Why do some L2s deliberately stay at Stage 0?',
    a: 'Engineering caution. Fraud-proof and validity-proof systems are some of the most complex software anyone has ever shipped — bugs in them can mean total loss of funds. Most teams ship the chain first with a security-council backstop (so they can override in an emergency), prove out the system in production, then retire the security council once they\'re confident the protocol can stand alone. Going from Stage 0 → Stage 1 → Stage 2 is **risk-progressive**, not laziness. L2BEAT publishes per-chain roadmaps for the stage transition.',
  },
  // ----- ZK vs Optimistic & stage -----
  {
    q: 'Does ZK vs Optimistic affect the stage?',
    a: 'Not directly. Both ZK and Optimistic rollups can be at any stage — the classification is independent of the proof system. **L2BEAT cares about whether proofs are live in production**, regardless of whether they\'re validity proofs (ZK) or fraud proofs (Optimistic). What matters is: can the protocol verify a state transition without a human in the loop? See [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup) for the proof-system comparison.',
  },
  // ----- Methodology -----
  {
    q: 'Where does this data come from?',
    a: 'growthepie\'s maturity classification comes from each chain\'s `maturity` field in [master.json](https://api.growthepie.com/v1/master.json). Values are: `3_maturing`, `2_developing`, `1_emerging`, `0_early_phase`, or `NA` (not classified). We don\'t make editorial calls — the classifications follow growthepie\'s published methodology and broadly align with **L2BEAT\'s Stage** assessment and **ethereum.org\'s maturity** view. For the strict L2BEAT Stage view see [l2beat.com](https://l2beat.com); for the Ethereum Foundation\'s own maturity rankings see [ethereum.org/en/layer-2](https://ethereum.org/en/layer-2/).',
  },
  {
    q: 'How many L2s are included?',
    a: '{{l2_mat_universe_size}} chains. Full list: {{l2_mat_universe_list}}. Sidechain exclusions on {{l2_mat_data_date}} UTC: {{l2_mat_excluded_sidechains}}. Ethereum mainnet is excluded because it\'s Layer 1, not Layer 2.',
  },
  {
    q: 'Where can I see this data live?',
    a: 'growthepie\'s [chains directory](https://www.growthepie.com/chains) shows each chain\'s maturity classification alongside its activity metrics. [L2BEAT\'s stages page](https://l2beat.com) is the canonical reference for protocol-level Stage 0/1/2 classification. [ethereum.org\'s Layer 2 page](https://ethereum.org/en/layer-2/) publishes the Ethereum Foundation\'s own per-L2 maturity assessment.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/ethereum-l2-maturity-stages';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-maturity',
    name: 'Ethereum L2 Maturity Classification',
    description:
      'Per-chain maturity classification on growthepie\'s 0–3 ordinal scale (Early phase / Emerging / Developing / Maturing). Captures decentralisation, production readiness, and chain age. Related but not identical to L2BEAT\'s Stage 0/1/2 framework or the Ethereum Foundation\'s "maturity" assessment published on ethereum.org.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Layer 2',
      'Rollups',
      'Maturity',
      'L2BEAT Stage',
      'ethereum.org maturity',
      'Decentralisation',
      'Security',
    ],
    measurementTechnique:
      'Per-chain ordinal classification on growthepie\'s 0–3 maturity scale: 0_early_phase, 1_emerging, 2_developing, 3_maturing. Classification incorporates chain age, production history, decentralisation properties, and ecosystem size. Reviewed periodically as chains progress.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'maturity', description: '0_early_phase | 1_emerging | 2_developing | 3_maturing | NA' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description: 'Master chain catalogue. Each chain has a `maturity` field.',
      },
    ],
  },
];

const ethereumL2MaturityStages: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2s are Stage 1 or Stage 2 rollups?',
  subtitle:
    'A direct map of every Ethereum L2 to growthepie\'s maturity classification, cross-referenced with L2BEAT\'s Stage 0/1/2 framework and the Ethereum Foundation\'s maturity assessment on ethereum.org.',
  shortTitle: 'L2 Maturity / Stages',
  summary:
    "Three frameworks describe how decentralised an Ethereum L2 is: L2BEAT's strict Stage 0/1/2 classification (protocol-property based), ethereum.org's maturity assessment (the Ethereum Foundation's own per-L2 view, also using the word 'maturity'), and growthepie's 0–3 maturity scale (Early phase / Emerging / Developing / Maturing). All three broadly correlate. This page lists every tracked Ethereum L2 grouped by growthepie's maturity level, with explicit references to L2BEAT and ethereum.org.",
  content: [
    "**Short answer (data {{l2_mat_data_date}} UTC):** growthepie's {{l2_mat_universe_size}}-chain Ethereum L2 universe breaks down on growthepie's **maturity scale** as: **Maturing ({{l2_mat_maturing_count}})**: {{l2_mat_maturing_chains}}. **Developing ({{l2_mat_developing_count}})**: {{l2_mat_developing_chains}}. **Emerging ({{l2_mat_emerging_count}})**: {{l2_mat_emerging_chains}}. **Early phase ({{l2_mat_early_count}})**: {{l2_mat_early_chains}}. For the **strict L2BEAT Stage 0/1/2** view see [l2beat.com](https://l2beat.com); for the **Ethereum Foundation's own maturity** assessment see [ethereum.org\/en/layer-2](https://ethereum.org/en/layer-2/).",

    "> **Three related frameworks** describe L2 decentralisation: **L2BEAT's Stage 0/1/2** (strict, protocol-property-based), **ethereum.org's maturity** (the Ethereum Foundation's own per-L2 assessment, using the same word \"maturity\" growthepie uses), and **growthepie's maturity** (broader, incorporates chain age + ecosystem size + decentralisation in a single 0–3 ordinal). All three broadly agree on which chains are most mature; they aren't identical.",

    '# The three frameworks',
    'Three widely-used frameworks describe "how decentralised is this Ethereum L2". They\'re parallel, not redundant — each emphasises a different angle of the same underlying question.',
    '',
    '**1. L2BEAT\'s Stage framework (strict, canonical for protocol decentralisation):**',
    '- **Stage 0** — training wheels on. Security council can override, fraud/validity proofs aren\'t live in production. Most newer L2s start here.',
    '- **Stage 1** — proofs are live (protocol can verify state without a human), but a security council can still pause or override during emergencies.',
    '- **Stage 2** — fully decentralised. No security-council override path. Very few L2s have reached this level as of 2026.',
    '',
    '**2. ethereum.org\'s maturity (the Ethereum Foundation\'s own per-L2 view):**',
    'The [ethereum.org Layer 2 page](https://ethereum.org/en/layer-2/) publishes the EF\'s **maturity** assessment for each tracked L2. It considers rollup Stage (drawing on L2BEAT), time live in production, total value secured, and ecosystem alignment with Ethereum. The EF uses the same word "maturity" that growthepie does — the frameworks are independent but the vocabulary overlaps.',
    '',
    '**3. growthepie\'s maturity scale (broader, used on growthepie):**',
    '- **Maturing** (highest) — established L2s with multi-year production history, large ecosystem, and strong decentralisation properties. Typically L2BEAT Stage 1 or higher.',
    '- **Developing** — production-grade with meaningful activity, working toward full decentralisation. Often L2BEAT Stage 0 with a roadmap to Stage 1.',
    '- **Emerging** — newer or smaller production chains. Activity is growing.',
    '- **Early phase** — very young or experimental. Significant centralisation in the operator.',
    '',
    '**How they relate:** L2BEAT\'s Stage is the strictest — a binary check on specific protocol properties. ethereum.org\'s maturity is the EF\'s holistic view that incorporates L2BEAT\'s Stage plus production history and alignment. growthepie\'s maturity is broader still, with a single 0–3 ordinal that rolls in chain age and ecosystem size. The three correlate strongly but aren\'t identical — a chain can be growthepie "Maturing" while sitting at L2BEAT Stage 0 if it has long production history but hasn\'t shipped proofs yet.',

    '# Every Ethereum L2 grouped by maturity',
    'Below is every tracked Ethereum L2 on growthepie, grouped by maturity level. Within each group chains are listed alphabetically.',
    '',
    '{{l2_mat_groups_md}}',

    '# Why does the stage matter?',
    'Practical consequence: **what could go wrong**.',
    '',
    'At lower maturity levels, the chain operator (or a small security council) can effectively pause, censor, or revert the chain. That\'s **deliberate and reasonable** for chains still proving out their bug-free operation — but it means the chain\'s trust model isn\'t just "Ethereum + the protocol", it\'s "Ethereum + the protocol + the team\'s good behaviour".',
    '',
    'At higher maturity levels, the chain operates increasingly close to "just the protocol" — Ethereum can verify state transitions cryptographically (or via fraud proofs) without trusting any single party. This is what users implicitly expect when they think of an L2 as "Ethereum but cheaper".',
    '',
    'For high-value use cases (DeFi treasuries, settlement, large NFT holdings), more mature = closer to Ethereum\'s actual trust model = lower extra risk. For low-value experiments and games, the practical difference may not matter.',

    '# How chains progress',
    'The path from Stage 0 → Stage 1 → Stage 2 is **risk-progressive**, not lazy. Fraud-proof and validity-proof systems are among the most complex software anyone has ever shipped; bugs in them can mean total loss of funds. Most teams:',
    '1. Launch with a centralised sequencer + security council (Stage 0).',
    '2. Ship fraud or validity proofs to production while keeping a security-council backstop (Stage 1).',
    '3. Retire the security council once the protocol has been proven over time (Stage 2).',
    '',
    'L2BEAT publishes per-chain roadmaps for these transitions; growthepie\'s `maturity` field is reviewed periodically as chains progress through these milestones.',

    '# Methodology and data sources',
    'Chain classifications on this page come from growthepie\'s [master chain catalogue](https://api.growthepie.com/v1/master.json), specifically the `maturity` field per chain. Values: `3_maturing`, `2_developing`, `1_emerging`, `0_early_phase`, `NA`.',
    '',
    'growthepie\'s classifications broadly align with **L2BEAT\'s Stage** assessment, **ethereum.org\'s maturity** view, and observable chain properties (age, ecosystem size, proof system status). For the **canonical strict Stage 0/1/2 view**, see [l2beat.com](https://l2beat.com). For the **Ethereum Foundation\'s own maturity rankings**, see [ethereum.org/en/layer-2](https://ethereum.org/en/layer-2/) — they publish per-L2 maturity using the same vocabulary growthepie uses.',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Many supporters operate L2 chains at various maturity levels. Classifications on this page follow growthepie's published methodology and L2BEAT — no editorial bias. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    '# Which chains are included?',
    "All **{{l2_mat_universe_size}}** chains in growthepie's L2 universe: {{l2_mat_universe_list}}. **Excluded:** Ethereum mainnet (L1), Polygon PoS (sidechain), aggregate keys.",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/chains, l2beat.com, and ethereum.org/en/layer-2 for live maturity / stage classifications.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/chains' },
    { name: 'Rollup Stages', url: '/chains' },
    { name: 'Maturity', url: '/chains' },
    { name: 'Decentralisation', url: '/chains' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default ethereumL2MaturityStages;
