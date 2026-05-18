import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page (no per-page leaderboard kind in
// articleProcessor — the few live KPIs use the existing `{{fusaka_*}}`
// placeholders served by processDynamicContent). Mirrors the rest of the
// /answers family for SEO shell, JSON-LD QAPage, and FAQ schema.
//
// All facts here come from growthepie's Fusaka tracker quick-bite
// (lib/quick-bites/qb-fusaka.ts) plus the Ethereum upgrade announcement —
// keep the two in sync if Fusaka's parameters change.

export const faqItems: FaqItem[] = [
  {
    q: 'What did Ethereum\'s "Fusaka" upgrade change?',
    a: 'Fusaka activated on **December 3rd, 2025** and bundled 12 EIPs across three goals: **scale blob capacity** (EIP-7594 "PeerDAS" + EIP-7892 "Blob-Parameter-Only" upgrades), **scale L1 gas** (EIP-7935 raised the default block gas limit to 60M with a 30M target), and **sustainable blob economics** (EIP-7918 puts a floor under blob fees so the "zero-fee" blob era ends). Two follow-up BPO upgrades activated soon after — **BPO1** on December 9th, 2025 (target 6→10 blobs/block, max 9→15) and **BPO2** on January 7th, 2026 (target 10→14, max 15→21). Since Dencun, Ethereum has posted **{{fusaka_total_blobs}}** blobs paying **Ξ{{fusaka_total_blob_fees_eth}}** in fees.',
  },
  {
    q: 'When did Fusaka activate?',
    a: 'Fusaka activated on **December 3rd, 2025**. Two follow-up Blob-Parameter-Only (BPO) upgrades followed: **BPO1 on December 9th, 2025** and **BPO2 on January 7th, 2026**. BPOs are lightweight protocol updates that only change blob-related parameters — they don\'t require a full hard fork.',
  },
  {
    q: 'How many EIPs did Fusaka include?',
    a: 'Twelve. The headline ones are EIP-7594 (PeerDAS), EIP-7892 (Blob-Parameter-Only upgrade framework), EIP-7935 (raised the L1 block gas limit to 60M default), and EIP-7918 (blob fee floor). See growthepie\'s [Fusaka tracker](/quick-bites/fusaka) for live data on what each one is doing in practice.',
  },
  // ----- Blob scaling -----
  {
    q: 'What is PeerDAS (EIP-7594)?',
    a: '**Peer Data Availability Sampling** — the protocol change that lets Ethereum nodes verify blob availability *without downloading every blob in full*. Each node downloads only a small randomly-sampled fraction of each blob and gossips its samples to peers; collectively the network can confirm that the blob is fully available even though no single node has all of it. This is what makes raising the blob target safe — without PeerDAS, every full node would have to download every blob, and the data load would saturate consumer-grade nodes.',
  },
  {
    q: 'What are Blob-Parameter-Only (BPO) upgrades?',
    a: 'BPOs (EIP-7892) are lightweight protocol updates that adjust blob-related parameters without introducing broader execution or consensus changes. The point is to scale blob capacity incrementally without needing a full hard fork each time — Ethereum can now raise blob targets between major upgrades. **BPO1** activated December 9th, 2025 (target 6→10 blobs/block, max 9→15). **BPO2** activated January 7th, 2026 (target 10→14, max 15→21).',
  },
  {
    q: 'Why does increasing blob capacity matter for L2s?',
    a: 'Blobs are how Ethereum rollups post their transaction data to L1 for data availability. More blob capacity = more transaction data L2s can post per block = either lower fees for the same volume of L2 transactions, or the same fees with more L2 transactions, or some mix of both. Fusaka roughly tripled the blob target through Fusaka + BPO1 + BPO2 (from 6 → 14 per block), substantially expanding the headroom for L2 throughput.',
  },
  // ----- L1 gas scaling -----
  {
    q: 'How much did Fusaka scale Ethereum L1 gas?',
    a: 'EIP-7935 set the **default L1 block gas limit to 60M** (with a 30M target). In practice the network reached this level shortly before the hard fork via validator signaling — Ethereum allows gradual gas-limit adjustments independent of fork activation. The net effect is more L1 execution capacity, which lowers the marginal cost of L1 gas under load.',
  },
  {
    q: 'Does Fusaka lower L1 gas fees?',
    a: 'It removes a capacity ceiling, which lowers fees *when L1 demand exceeds the old ceiling*. When demand is below capacity the gas market is already in equilibrium — additional headroom doesn\'t reduce fees further. The Fusaka tracker has [live L1 gas charts](/quick-bites/fusaka) comparing average gas used vs the gas limit over time.',
  },
  // ----- Blob economics / EIP-7918 -----
  {
    q: 'What does EIP-7918 do?',
    a: 'EIP-7918 introduces a **floor on blob gas price** by bounding the blob base fee to execution gas prices. Specifically, the cost of `GAS_PER_BLOB` of blob gas can\'t fall below the equivalent execution cost (`BLOB_BASE_COST × base_fee_per_gas`). When this floor binds, excess blob gas accumulates without subtracting the target, tightening the blob fee market and anchoring blob pricing to L1 execution economics. The practical effect: the "zero-fee blob era" — periods when blob fees collapsed to effectively nothing — is over. Since Fusaka, EIP-7918 has captured **Ξ{{fusaka_total_blob_fee_eth_with7918}}** in blob fees vs **Ξ{{fusaka_total_blob_fee_eth_without7918}}** under the old path — a **{{fusaka_total_blob_fee_eth_multiplier}}× multiplier**.',
  },
  {
    q: 'Why does Ethereum want blob fees to have a floor?',
    a: 'Two reasons. First, **economic sustainability** — blobs are part of Ethereum\'s value capture, and a market that frequently collapses to near-zero fees can\'t monetise data availability long-term. Second, **DoS protection** — a permanent near-zero blob fee makes it cheap to spam blob space, eroding the security model that L2s rely on. EIP-7918 ties blob pricing to L1 execution economics so blob fees track the broader Ethereum fee market instead of collapsing in isolation.',
  },
  // ----- User impact -----
  {
    q: 'What changed for end users?',
    a: 'Indirectly, a lot. **L2 fees got cheaper** because L2s have more blob capacity to post into. **L1 transactions can run a bit more cheaply at peak times** because the L1 gas limit is higher. **Blob fees are slightly higher** during quiet periods because of EIP-7918\'s floor (though absolute values are still tiny). Users don\'t see Fusaka mechanics directly — they see the downstream effects on whichever L2 or app they use.',
  },
  {
    q: 'Did Fusaka break anything for existing apps?',
    a: 'No. Fusaka is a non-breaking upgrade — existing smart contracts, wallets, and L2 implementations continue to work without changes. The relevant changes are validator-side (PeerDAS sampling), protocol-side (blob parameter changes via BPOs), and economic (the EIP-7918 floor). Apps don\'t need to migrate.',
  },
  // ----- Comparisons / context -----
  {
    q: 'How does Fusaka compare to Dencun and Pectra?',
    a: 'Dencun (March 2024) **introduced blobs** (EIP-4844 / proto-danksharding) with a target of 3 / max 6 per block — the foundation of modern L2 scaling. Pectra (May 2025) **doubled blob capacity** to a target of 6 / max 9 per block. Fusaka (December 2025) **tripled it again** to a target of 14 / max 21 by the time BPO2 landed in January 2026, and added PeerDAS so further increases are safer. So roughly: Dencun = blobs exist; Pectra = blobs scale 2×; Fusaka = blobs scale ~5× and the economics tighten.',
  },
  {
    q: 'How is Fusaka tracked on growthepie?',
    a: 'See the [Fusaka tracker](/quick-bites/fusaka) for live charts: blob count vs target since each upgrade, L1 gas used vs limit, blob fees vs L1 gas fees as a share of total ETH burn, and a comparison of blob fees under EIP-7918 vs the legacy path. The tracker is what backs the live numbers quoted on this answer page.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Where do these numbers come from?',
    a: 'Live KPIs ({{fusaka_total_blobs}}, {{fusaka_total_blob_fees_eth}}, EIP-7918 multipliers) come from growthepie\'s Fusaka data endpoints (`/v1/quick-bites/fusaka/totals.json` and `/v1/quick-bites/fusaka/eip7918_kpis.json`), which are refreshed daily from chain RPC data. Upgrade dates, EIP numbers, and parameter values come from the published Ethereum upgrade announcement and EIP repository. No editorial interpretation — every claim on this page is verifiable against the linked tracker or the EIP text.',
  },
  {
    q: 'What\'s next after Fusaka?',
    a: 'Two threads. Further **BPO upgrades** can raise blob targets again without a full hard fork — the framework introduced in Fusaka makes this routine. And **Glamsterdam**, Ethereum\'s next major scheduled upgrade, will introduce additional improvements to data availability and execution. Check [the Ethereum roadmap](https://ethereum.org/en/roadmap/) for the latest scheduled changes.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/what-fusaka-upgrade-changed';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/fusaka-totals',
    name: 'Ethereum Fusaka Upgrade — Live KPI Totals',
    description:
      'Live totals tracking the impact of the Fusaka upgrade: total blobs posted since Dencun, total blob fees paid (ETH), total blocks since Dencun.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Fusaka',
      'Hard fork',
      'Blobs',
      'PeerDAS',
      'EIP-7594',
      'EIP-7892',
      'EIP-7918',
      'EIP-7935',
      'Blob fees',
    ],
    measurementTechnique:
      'Cumulative counts of blobs and blob fees aggregated from Ethereum mainnet block-by-block data since the Dencun hard fork (March 2024). Refreshed daily.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'total_blobs_since_dencun' },
      { '@type': 'PropertyValue', name: 'total_blob_fees_eth_since_dencun', unitText: 'ETH' },
      { '@type': 'PropertyValue', name: 'total_blocks_since_dencun' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/quick-bites/fusaka/totals.json',
        description: 'Cumulative Fusaka KPIs (blobs, fees, blocks).',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/fusaka-eip7918',
    name: 'EIP-7918 Impact — With vs Without Blob Fee Floor',
    description:
      'Comparative dataset showing the impact of EIP-7918\'s blob fee floor: total blob fees paid under EIP-7918 vs the counterfactual fees that would have been paid without the floor.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'EIP-7918',
      'Blob fees',
      'Fee floor',
      'Fusaka',
      'Onchain analytics',
    ],
    measurementTechnique:
      'Per-block comparison of actual blob fees collected under EIP-7918\'s execution-cost-anchored floor versus the counterfactual blob fees that would have applied under the pre-Fusaka calculation. Aggregated since the Fusaka activation block.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'blob_fee_eth_with_7918', unitText: 'ETH' },
      { '@type': 'PropertyValue', name: 'blob_fee_eth_without_7918', unitText: 'ETH' },
      { '@type': 'PropertyValue', name: 'multiplier' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/quick-bites/fusaka/eip7918_kpis.json',
        description: 'EIP-7918 KPI snapshot.',
      },
    ],
  },
];

const whatFusakaUpgradeChanged: QuickBiteData = createQuickBite({
  title: 'What did Ethereum\'s "Fusaka" upgrade change?',
  subtitle:
    'A direct answer: Fusaka activated on December 3rd, 2025 with 12 EIPs that tripled blob capacity, raised the L1 gas limit, and put a floor under blob fees.',
  shortTitle: 'Fusaka Changes',
  summary:
    "Ethereum's Fusaka hard fork activated on December 3rd, 2025 and bundled 12 EIPs across three goals: scaling blob capacity (PeerDAS plus Blob-Parameter-Only upgrades that tripled the blob target from 6 to 14 by January 2026), scaling L1 execution (EIP-7935 raised the default block gas limit to 60M with a 30M target), and sustainable blob economics (EIP-7918 introduced a floor on blob fees so the 'zero-fee blob era' ends). The net effect is substantially more capacity for L2 rollups, modest L1 headroom, and tighter blob fee economics anchored to L1 execution.",
  content: [
    "**Short answer:** Fusaka activated on **December 3rd, 2025** and shipped 12 EIPs across three goals: **(1) scale blob capacity** through PeerDAS (EIP-7594) and the Blob-Parameter-Only framework (EIP-7892), which tripled the blob target from 6 → 14 per block via two follow-up BPO upgrades; **(2) scale L1 gas** (EIP-7935 raised the default block gas limit to 60M with a 30M target); and **(3) sustainable blob economics** (EIP-7918 puts a floor under blob fees so the 'zero-fee era' ends). Live impact so far — **{{fusaka_total_blobs}}** blobs posted and **Ξ{{fusaka_total_blob_fees_eth}}** in blob fees paid since Dencun.",

    "> The full data tracker with live charts is at [growthepie.com/quick-bites/fusaka](/quick-bites/fusaka). The summary below pulls the headline facts from the same source.",

    '# Timeline',
    '- **Dec 3, 2025** — Fusaka activates on Ethereum mainnet with 12 EIPs.',
    '- **Dec 9, 2025** — **BPO1**: blob target raised from 6 → 10 per block (max 9 → 15).',
    '- **Jan 7, 2026** — **BPO2**: blob target raised from 10 → 14 per block (max 15 → 21).',
    'BPOs (Blob-Parameter-Only upgrades) are lightweight protocol updates — they only change blob parameters, so they don\'t need a full hard fork each time.',

    '# 1. Scale blob capacity',
    'Fusaka roughly tripled Ethereum\'s data availability ceiling. Two changes work together:',
    '- **EIP-7594 (PeerDAS)** — Peer Data Availability Sampling lets nodes verify blob availability *without downloading every blob in full*. Each node samples a small random fraction of each blob and gossips its samples; collectively the network confirms the blob is available even though no single node has all of it.',
    '- **EIP-7892 (BPO framework)** — Blob-Parameter-Only upgrades. A way to raise blob targets between major hard forks. BPO1 (Dec 9, 2025) took target from 6 → 10; BPO2 (Jan 7, 2026) took it from 10 → 14.',
    'These matter because every L2 rollup posts its transaction data to Ethereum as blobs. More blob capacity = either lower L2 fees, more L2 transactions, or both.',

    '# 2. Scale L1 gas',
    '**EIP-7935** set the default L1 block gas limit to **60M** (with a 30M target). In practice the network reached this level shortly before Fusaka itself via validator signaling — Ethereum allows gradual gas-limit adjustments outside hard-fork cycles. The headroom matters most during peak demand: when L1 transaction volume runs into the old ceiling, the higher limit lets more transactions clear per block without driving fees up.',

    '# 3. Sustainable blob economics (EIP-7918)',
    '**EIP-7918** introduces a floor on blob gas price by bounding the blob base fee to execution gas prices. The exact rule: the cost of `GAS_PER_BLOB` of blob gas can\'t fall below the equivalent execution cost (`BLOB_BASE_COST × base_fee_per_gas`). When the floor binds, excess blob gas accumulates without subtracting the target — which tightens the blob fee market and anchors blob pricing to L1 execution economics.',
    '',
    'Why it matters:',
    '- Blob fees previously collapsed to effectively zero during periods of low rollup activity. That was great for L2 users but bad for Ethereum\'s long-term economic sustainability.',
    '- A permanent zero-fee floor also makes blob spam cheap — security implications, not just economic.',
    '- Anchoring blob pricing to L1 execution means blob fees now track the broader Ethereum fee market instead of collapsing in isolation.',
    '',
    '**Live impact since Fusaka:** **Ξ{{fusaka_total_blob_fee_eth_with7918}}** in blob fees under EIP-7918, vs **Ξ{{fusaka_total_blob_fee_eth_without7918}}** under the legacy path — a **{{fusaka_total_blob_fee_eth_multiplier}}× multiplier**. Verify on the [Fusaka tracker](/quick-bites/fusaka).',

    '# How does Fusaka compare to Dencun and Pectra?',
    '- **Dencun** (March 2024) — introduced blobs (EIP-4844 / proto-danksharding). Target 3 per block, max 6.',
    '- **Pectra** (May 2025) — doubled blob capacity. Target 6, max 9.',
    '- **Fusaka** (December 2025 + BPOs through January 2026) — roughly tripled blob capacity again to target 14, max 21. Added PeerDAS so further increases are safer. Added EIP-7918 so blob economics tighten.',
    '',
    'Short version: Dencun = blobs exist; Pectra = blobs scale 2×; Fusaka = blobs scale ~5× from Dencun *and* the fee market matures.',

    '# Methodology and data sources',
    "All facts on this page come from two sources:",
    "1. **growthepie's [Fusaka data tracker](/quick-bites/fusaka)** — the live KPIs quoted in this page (total blobs, blob fees, EIP-7918 multipliers) are served by `/v1/quick-bites/fusaka/totals.json` and `/v1/quick-bites/fusaka/eip7918_kpis.json` and refresh daily from chain RPC data.",
    "2. **Ethereum's published EIP repository and upgrade announcement** — for upgrade dates, EIP numbers, and parameter values (60M gas limit, 14 blob target, etc.).",
    'No editorial interpretation: every claim on this page is verifiable against the tracker or the EIP text.',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Fusaka is an Ethereum mainnet upgrade — no L2 chain operator (whether or not a growthepie supporter) influences the upgrade or how it's described here. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** For the canonical Ethereum-side documentation see [ethereum.org's Fusaka page](https://ethereum.org/en/roadmap/fusaka/), the [EIP index](https://eips.ethereum.org/) for individual EIP text, and the [ethereum/EIPs GitHub repo](https://github.com/ethereum/EIPs) for the discussion threads behind each change. The growthepie Fusaka tracker linked above quantifies the upgrade's *impact* on the chain in the days and weeks after activation.",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Fusaka activated on December 3rd, 2025 with 12 EIPs across three goals: scale blob capacity (PeerDAS + Blob-Parameter-Only upgrades tripled the blob target from 6 to 14 per block by January 2026), scale L1 gas (EIP-7935 raised the default block gas limit to 60M), and sustainable blob economics (EIP-7918 introduced a floor under blob fees, ending the "zero-fee" era). The full impact is tracked live at growthepie.com/quick-bites/fusaka.',
  related: [],
  author: [
    {
      name: 'Lorenz Lehmann',
      xUsername: 'LehmannLorenz',
    },
    {
      name: 'ETH Wave',
      xUsername: 'TrueWaveBreak',
    },
  ],
  topics: [
    {
      icon: 'ethereum-logo-monochrome',
      name: 'Ethereum Mainnet',
      url: '/chains/ethereum',
    },
    {
      icon: 'gtp-data-availability',
      name: 'Data Availability',
      url: '/data-availability',
    },
    {
      icon: 'gtp-metrics-economics',
      name: 'Economics',
      url: '/economics',
    },
    {
      name: 'Fusaka',
      url: '/quick-bites/fusaka',
    },
    {
      name: 'EIP-7594 PeerDAS',
      url: '/quick-bites/fusaka',
    },
    {
      name: 'EIP-7918',
      url: '/quick-bites/fusaka',
    },
  ],
  icon: 'gtp-data-availability',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default whatFusakaUpgradeChanged;
