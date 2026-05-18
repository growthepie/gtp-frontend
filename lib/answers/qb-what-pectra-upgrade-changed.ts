import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page mirroring qb-what-fusaka-upgrade-changed.
// Facts come from growthepie's Pectra quick-bite
// (lib/quick-bites/qb-pectra-upgrade.ts) plus the published EIPs — keep the
// two in sync if Pectra's interpretation changes. Pectra has no
// site-wide `{{pectra_*}}` placeholders processed by dynamicContent today,
// so this page is pure prose with no per-page leaderboard kind.

export const faqItems: FaqItem[] = [
  {
    q: 'What did Ethereum\'s "Pectra" upgrade change?',
    a: 'Pectra activated on **May 7th, 2025** and bundled **11 EIPs** across three user-facing goals: **more blob capacity for L2s** (EIP-7691 doubled the blob target from 3 to 6 per block, max 6→9), **smarter wallets** (EIP-7702 lets externally-owned accounts act as smart accounts — enabling gas sponsorship, paying fees in tokens other than ETH, and transaction batching via the new "Set Code" / Type 4 transaction type), and **staking upgrades** (EIP-7251 raised the effective validator cap from 32 ETH to 2,048 ETH so rewards can compound; EIP-7002 and EIP-6110 simplified the deposit and withdrawal pipeline). Live adoption tracker: [growthepie.com/quick-bites/pectra-upgrade](/quick-bites/pectra-upgrade).',
  },
  {
    q: 'When did Pectra activate?',
    a: 'Pectra activated on **May 7th, 2025** at slot 11,649,024 on the Ethereum mainnet beacon chain. The upgrade is the combined "Prague" execution-layer fork plus "Electra" consensus-layer fork — hence Pectra.',
  },
  {
    q: 'How many EIPs did Pectra include?',
    a: 'Eleven. The five most user-visible ones are EIP-7691 (more blobs), EIP-7702 (smarter wallets / Set Code transactions), EIP-7251 (raised validator cap to 2,048 ETH), EIP-7002 (execution-layer-triggered exits and withdrawals), and EIP-6110 (deposit pipeline simplification). The other six are protocol-internal improvements. See growthepie\'s [Pectra tracker](/quick-bites/pectra-upgrade) for live adoption data on the user-facing EIPs.',
  },
  // ----- More blobs -----
  {
    q: 'What is EIP-7691 (more blobs)?',
    a: 'EIP-7691 **doubled Ethereum\'s blob capacity** — the blob target per block went from **3 to 6**, and the maximum from **6 to 9**. Blobs are how L2 rollups post their transaction data to L1 for data availability. Doubling the target lowers fees for the same volume of L2 transactions and gives the blob-fee market more headroom before it kicks in via EIP-1559-style price increases. Rollups had been operating at full blob capacity for months before Pectra; EIP-7691 immediately relieved that pressure.',
  },
  {
    q: 'How big was the impact on L2 fees?',
    a: 'Pectra immediately roughly halved blob fees for L2s by doubling the capacity. The full effect was indirect: cheaper blobs meant L2s could pass savings through to users, and in the weeks after Pectra most major L2s saw their per-transaction fees drop noticeably. The relationship is approximate — blob fees only escalate via EIP-1559 once blob usage exceeds the target, so the *amount* of fee relief depended on demand at each moment. Growthepie\'s [Pectra tracker](/quick-bites/pectra-upgrade) has the live blob count vs target chart.',
  },
  // ----- EIP-7702 / smart accounts -----
  {
    q: 'What is EIP-7702 (smarter wallets)?',
    a: 'EIP-7702 introduces a new transaction type — **"Set Code" or Type 4** — that lets a regular Ethereum wallet (an EOA — externally-owned account) temporarily act as a smart contract account for one transaction. This unlocks features that previously required users to switch to a dedicated smart-contract wallet: **gas sponsorship** (someone else pays the fee), **paying gas in tokens other than ETH** (e.g. USDC), **transaction batching** (multiple actions in one user-signed transaction), and **session keys / delegation** (a dApp signs on the user\'s behalf within preset limits). EIP-7702 doesn\'t require users to change wallets — existing EOAs can opt in.',
  },
  {
    q: 'What is a "Set Code" or Type 4 transaction?',
    a: 'A new Ethereum transaction format introduced by EIP-7702 that carries an authorization list: signed instructions telling the protocol to temporarily install bytecode on the sender\'s EOA. While the transaction executes, the EOA behaves like a smart contract account; after the transaction completes the original code (none, since it\'s an EOA) is restored. The Pectra tracker chart on growthepie counts Type 4 transactions per chain — that\'s the simplest live adoption signal for EIP-7702.',
  },
  {
    q: 'Which apps benefit most from EIP-7702?',
    a: 'Wallets and dApps that want a "no-friction" UX without forcing users to switch to smart-contract wallets. Day-one beneficiaries include account-abstraction-aware wallets, dApps doing gas sponsorship for new-user onboarding, and DeFi protocols that previously needed two transactions (approve + action) and can now batch them. The growthepie [Pectra tracker](/quick-bites/pectra-upgrade) charts per-chain Type 4 adoption (Ethereum L1, Base, OP Mainnet, Unichain, Arbitrum) so you can see which ecosystems are picking it up fastest.',
  },
  // ----- Staking upgrades -----
  {
    q: 'What changed for Ethereum stakers in Pectra?',
    a: 'Three things, mostly via EIPs 7251, 7002, and 6110. **EIP-7251** raised the maximum effective stake per validator from 32 ETH to 2,048 ETH — large stakers can now consolidate many validators into one and let rewards compound rather than spinning up new validators every time the balance hits 32 ETH. **EIP-7002** lets validators trigger their own exits and partial withdrawals from the execution layer (no need to keep a separate withdrawal credential). **EIP-6110** moved the deposit pipeline onto the execution layer, removing the multi-hour deposit delay that previously existed.',
  },
  {
    q: 'Why raise the validator cap to 2,048 ETH?',
    a: 'Two reasons. First, **compounding** — at 32 ETH per validator, every reward over 32 ETH was idle until the operator manually deposited a new 32 ETH validator. Raising the cap to 2,048 ETH lets larger stakers (custodians, exchanges, big solo stakers) compound their rewards automatically. Second, **network-load reduction** — fewer validators means fewer messages on the consensus layer per epoch, which makes future consensus-layer upgrades easier. Small solo stakers can still run 32 ETH validators; the change is opt-in.',
  },
  // ----- Comparisons / context -----
  {
    q: 'How does Pectra compare to Dencun and Fusaka?',
    a: '**Dencun** (March 2024) introduced blobs (EIP-4844 / proto-danksharding) with a target of 3 blobs per block — the foundation of modern L2 scaling. **Pectra** (May 2025) doubled blob capacity to 6 and is the upgrade where Ethereum prioritised **user experience** for the first time (smart accounts via EIP-7702, easier staking). **Fusaka** (December 2025) added PeerDAS and tripled blob capacity again to a target of 14 by the time the BPO2 follow-up landed, plus introduced the EIP-7918 blob fee floor. So roughly: Dencun = blobs exist; Pectra = blobs scale 2× *and* UX improves; Fusaka = blobs scale ~5× and the economics tighten.',
  },
  {
    q: 'Was Pectra the "user experience" upgrade?',
    a: 'Yes — that\'s the framing. Past Ethereum upgrades have mostly been technical improvements (gas accounting, signature aggregation, new opcodes). Pectra was the first one where the user-visible features dominated the announcement: smart accounts (EIP-7702), cheaper L2 transactions (EIP-7691), and simpler staking (the EIP-7251 / 7002 / 6110 trio). The growthepie team called Pectra "less clicks, less signatures, more blobs" — which captures the change well.',
  },
  {
    q: 'Did Pectra break anything for existing apps?',
    a: 'No. Pectra was non-breaking — existing smart contracts, wallets, and L2 implementations continued to work without changes. EIP-7702 is opt-in (a wallet only acts as a smart account if the user signs an authorization); EIP-7691 affects validators and rollups but is transparent to user contracts; the staking EIPs only affect validators and stakers. Apps don\'t need to migrate.',
  },
  // ----- User impact -----
  {
    q: 'What changed for end users?',
    a: 'A few things became possible (or noticeably cheaper) after Pectra: **wallets can offer gas sponsorship and tokenised gas payment** via EIP-7702 (no need to hold ETH for fees if the wallet supports it); **L2 transactions got cheaper** because blob capacity doubled; **staking became simpler** for users running their own validators. The user-facing changes are gated by wallet support — your wallet has to expose EIP-7702 features for you to use them.',
  },
  // ----- Methodology / scope -----
  {
    q: 'Where do these facts come from?',
    a: 'Activation date and EIP numbers come from the [Ethereum Foundation\'s Pectra announcement](https://blog.ethereum.org/) and the [EIP repository](https://eips.ethereum.org/). User-facing summaries (blob target = 6, validator cap = 2,048 ETH, etc.) come from growthepie\'s [Pectra quick-bite](/quick-bites/pectra-upgrade) which tracks live adoption data. No editorial interpretation: every claim on this page is verifiable against the EIP text or the live tracker.',
  },
  {
    q: 'How is Pectra tracked on growthepie?',
    a: 'See the [Pectra tracker](/quick-bites/pectra-upgrade) for live charts: blob count vs target per Ethereum block (EIP-7691 adoption), and Set Code / Type 4 transaction count per chain (EIP-7702 adoption across Ethereum L1, Base, OP Mainnet, Unichain, Arbitrum). Both refresh daily from chain data.',
  },
  {
    q: 'What came next after Pectra?',
    a: 'Fusaka in December 2025 — see [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed) for the full breakdown. Fusaka tripled blob capacity again (to a target of 14 by January 2026), introduced PeerDAS for safer blob scaling, and added EIP-7918 to put a floor under blob fees. After Fusaka comes Glamsterdam — see [ethereum.org/roadmap](https://ethereum.org/en/roadmap/) for the latest scheduled upgrades.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/what-pectra-upgrade-changed';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/pectra-fork',
    name: 'Ethereum Pectra Upgrade — Adoption Tracker',
    description:
      'Live tracker for the impact of the Pectra upgrade: daily blob count vs target on Ethereum mainnet (EIP-7691 adoption), and daily Set Code / Type 4 transaction count per chain (EIP-7702 adoption across Ethereum L1, Base, OP Mainnet, Unichain, Arbitrum).',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Pectra',
      'Prague',
      'Electra',
      'Hard fork',
      'EIP-7691',
      'EIP-7702',
      'EIP-7251',
      'EIP-7002',
      'EIP-6110',
      'Blobs',
      'Smart accounts',
      'Account abstraction',
      'Staking',
    ],
    measurementTechnique:
      'Daily aggregation of Ethereum mainnet block data (blob count, blob target) and per-chain Set Code (Type 4) transaction counts across major EVM chains. Refreshed daily.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'ethereum_blob_count_daily' },
      { '@type': 'PropertyValue', name: 'ethereum_blob_target_daily' },
      { '@type': 'PropertyValue', name: 'type4_tx_count_per_chain_daily' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl:
          'https://api.growthepie.com/v1/quick-bites/pectra-fork.json',
        description:
          'Pectra tracker data — blob count vs target on Ethereum L1, Type 4 transaction counts per chain.',
      },
    ],
  },
];

const whatPectraUpgradeChanged: QuickBiteData = createQuickBite({
  title: 'What did Ethereum\'s "Pectra" upgrade change?',
  subtitle:
    'A direct answer: Pectra activated on May 7th, 2025 with 11 EIPs that doubled blob capacity, introduced smart-account features for regular wallets, and raised the validator staking cap.',
  shortTitle: 'Pectra Changes',
  summary:
    "Ethereum's Pectra hard fork activated on May 7th, 2025 and bundled 11 EIPs across three goals: doubling blob capacity for L2s (EIP-7691 raised the target from 3 to 6 blobs per block), enabling smart-account features for ordinary wallets (EIP-7702 introduced Set Code / Type 4 transactions, unlocking gas sponsorship, paying fees in non-ETH tokens, and transaction batching), and improving the staking experience (EIP-7251 raised the validator effective stake cap from 32 ETH to 2,048 ETH so rewards can compound; EIP-7002 and EIP-6110 simplified the deposit and withdrawal pipeline). Pectra is widely called the 'user experience' upgrade.",
  content: [
    "**Short answer:** Pectra activated on **May 7th, 2025** and shipped **11 EIPs** across three user-facing goals: **(1) more blobs** (EIP-7691 doubled the blob target from 3 to 6 per block, max 6→9 — cheaper L2 transactions), **(2) smarter wallets** (EIP-7702 lets ordinary wallets temporarily act as smart contract accounts via a new 'Set Code' / Type 4 transaction type — gas sponsorship, non-ETH gas, transaction batching), and **(3) staking upgrades** (EIP-7251 raised the validator effective stake cap from 32 ETH to 2,048 ETH so rewards compound; EIP-7002 and EIP-6110 simplified the deposit / withdrawal pipeline). Live adoption data: [growthepie.com/quick-bites/pectra-upgrade](/quick-bites/pectra-upgrade).",

    "> Less clicks, less signatures, more blobs. Past Ethereum upgrades focused on technical improvements; Pectra was the first one where user-experience features dominated the announcement.",

    '# Timeline',
    '- **May 7, 2025** — Pectra activates on Ethereum mainnet. The fork is the combined "Prague" execution-layer + "Electra" consensus-layer hard fork.',
    '- **December 3, 2025** — Fusaka follows, tripling blob capacity again (to a target of 14 by BPO2 in January 2026). See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed).',

    '# 1. More blobs (EIP-7691)',
    'Rollups had been operating at full blob capacity for months before Pectra — the blob market was perpetually saturated, driving up L2 fees. EIP-7691 fixed that immediately:',
    '- **Blob target per block:** doubled from **3 → 6**.',
    '- **Blob maximum per block:** raised from **6 → 9**.',
    '- **Net effect:** roughly halved blob fees the moment Pectra activated, with the savings flowing through to L2 users in the following weeks. The blob-fee market only escalates via EIP-1559 once usage exceeds the target, so the extra headroom also kept fees lower during demand spikes.',
    'See the live "blobs per block vs target" chart on the [Pectra tracker](/quick-bites/pectra-upgrade).',

    '# 2. Smarter wallets (EIP-7702)',
    'EIP-7702 introduces a new transaction format — **"Set Code"** or Type 4 — that lets a regular wallet (EOA — externally-owned account) temporarily act as a smart contract account for one transaction. This unlocks features that previously required dedicated smart-contract wallets:',
    '- **Gas sponsorship.** Someone else (a dApp, a custodian) pays the gas fee.',
    '- **Pay gas in non-ETH tokens.** Pay fees in USDC, a project\'s native token, or anything else the wallet supports.',
    '- **Transaction batching.** Multiple actions in one user-signed transaction — no more "approve, then swap" two-step.',
    '- **Session keys / delegation.** A dApp can sign on the user\'s behalf within preset limits.',
    '',
    'Critically, **users don\'t have to switch wallets** to use EIP-7702 features — their existing EOA can opt in by signing a Set Code authorization. Adoption is gated by wallet support: a wallet has to expose the Type 4 transaction format to its users for any of this to surface.',
    'See the live "Set Code transactions per chain" chart on the [Pectra tracker](/quick-bites/pectra-upgrade) for adoption across Ethereum L1, Base, OP Mainnet, Unichain, and Arbitrum.',

    '# 3. Staking upgrades (EIP-7251, 7002, 6110)',
    'Three EIPs together simplified the staking lifecycle:',
    '- **EIP-7251 — MaxEB.** Raised the maximum effective stake per validator from **32 ETH to 2,048 ETH**. Large stakers (custodians, exchanges, big solo stakers) can now consolidate many validators into one and **let rewards compound** rather than spinning up new validators every time the balance accrues above 32 ETH. Small solo stakers can still run 32 ETH validators — the change is opt-in.',
    '- **EIP-7002 — Execution-layer-triggered exits and withdrawals.** Validators can now trigger their own exits and partial withdrawals from the execution layer instead of requiring a separate withdrawal credential setup.',
    '- **EIP-6110 — On-chain deposits.** Moved the deposit pipeline onto the execution layer, removing the multi-hour deposit delay that previously existed.',
    '',
    'Side benefit: fewer validators on the network (because large stakers can now use one validator instead of N) reduces consensus-layer load and makes future consensus upgrades easier.',

    '# How does Pectra compare to Dencun and Fusaka?',
    '- **Dencun** (March 2024) — introduced blobs (EIP-4844 / proto-danksharding). Target 3 per block, max 6.',
    '- **Pectra** (May 2025) — doubled blob capacity (target 6, max 9) *and* introduced smart-account features via EIP-7702. The "user experience" upgrade.',
    '- **Fusaka** (December 2025 + BPOs through January 2026) — tripled blob capacity again (target 14, max 21). Added PeerDAS for safer blob scaling. Added EIP-7918 blob fee floor.',
    '',
    'Short version: Dencun = blobs exist; Pectra = blobs scale 2× *and* wallets get smarter; Fusaka = blobs scale ~5× from Dencun *and* fee economics tighten.',

    '# Methodology and data sources',
    "All facts on this page come from two sources:",
    "1. **growthepie's [Pectra tracker](/quick-bites/pectra-upgrade)** — live adoption charts (blob count vs target on Ethereum L1, Type 4 transactions per chain) served by `/v1/quick-bites/pectra-fork.json` and refreshed daily.",
    "2. **Ethereum's published EIP repository and Pectra announcement** — for upgrade dates, EIP numbers, parameter values (blob target = 6, validator cap = 2,048 ETH).",
    'No editorial interpretation: every claim on this page is verifiable against the tracker or the EIP text.',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Pectra is an Ethereum mainnet upgrade — no L2 chain operator (whether or not a growthepie supporter) influences the upgrade or how it\'s described here. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** For canonical documentation see [ethereum.org's Pectra page](https://ethereum.org/en/roadmap/pectra/), the [EIP index](https://eips.ethereum.org/) for individual EIP text, and the [ethereum/EIPs GitHub repo](https://github.com/ethereum/EIPs) for the discussion threads behind each change. The growthepie Pectra tracker linked above quantifies the upgrade's *adoption* in the weeks and months after activation.",

  ],
  image: '/quick-bites/pectra-upgrade.webp',
  og_image: '/quick-bites/pectra-upgrade.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Pectra activated on May 7th, 2025 with 11 EIPs across three goals: doubling blob capacity (EIP-7691 raised the blob target from 3 to 6 per block, halving L2 fees), introducing smart-account features for ordinary wallets (EIP-7702 added "Set Code" / Type 4 transactions enabling gas sponsorship, non-ETH gas payment, and transaction batching), and improving staking (EIP-7251 raised the validator effective stake cap from 32 ETH to 2,048 ETH so rewards can compound; EIP-7002 and EIP-6110 simplified the deposit and withdrawal pipeline). Pectra is widely called the "user experience" upgrade. Live adoption: growthepie.com/quick-bites/pectra-upgrade.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
    {
      name: 'Lorenz Lehmann',
      xUsername: 'LehmannLorenz',
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
      name: 'Pectra',
      url: '/quick-bites/pectra-upgrade',
    },
    {
      name: 'EIP-7702',
      url: '/quick-bites/pectra-upgrade',
    },
    {
      name: 'EIP-7691',
      url: '/quick-bites/pectra-upgrade',
    },
    {
      icon: 'gtp-da-blobs-number',
      name: 'Blob Count',
      url: '/data-availability/blob-count',
    },
  ],
  icon: 'ethereum-logo-monochrome',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default whatPectraUpgradeChanged;
