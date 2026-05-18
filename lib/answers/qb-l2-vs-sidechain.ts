import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page. Pure prose with curated examples — chain
// categorisations come from growthepie's master.json `bucket` field, which
// is the same field the rest of the answer pages use to filter the L2
// universe. The live authoritative source is each chain's own classification.

export const faqItems: FaqItem[] = [
  {
    q: 'What is the difference between an Ethereum L2 and a sidechain?',
    a: 'An **Ethereum Layer 2 (L2)** is a chain that **derives its security from Ethereum** by posting transaction data (or a cryptographic proof of state) back to Ethereum mainnet. If the L2\'s sequencer disappears or cheats, users can recover their funds using only Ethereum data. A **sidechain** is a separate blockchain with its **own validator set, its own security**, and its own bridge to Ethereum — it doesn\'t post anything to Ethereum for security purposes. Polygon PoS is the most famous sidechain often confused with an L2; BNB Smart Chain and Gnosis Chain are other examples. (Note: Ronin was a sidechain through 2024 — including the 2022 bridge hack — but has since migrated to an L2 architecture.) L2s share Ethereum\'s trust assumptions; sidechains require trusting their own validators.',
  },
  {
    q: 'Is Polygon PoS an Ethereum L2?',
    a: '**No** — Polygon PoS is a **sidechain**, not an L2. It has its own ~100-validator Proof-of-Stake set, runs its own consensus, and does not post transaction data to Ethereum for security. The bridge between Polygon PoS and Ethereum is just a bridge — if the Polygon validator set were compromised, Ethereum couldn\'t help users recover their funds. **Polygon zkEVM**, on the other hand, *is* an Ethereum L2 (specifically a ZK rollup) — same brand, completely different architecture. L2BEAT also classifies Polygon PoS as "other" rather than as a Layer 2.',
  },
  {
    q: 'Why does this distinction matter?',
    a: '**Security guarantees.** When you bridge $100 of USDC to an Ethereum L2 like Arbitrum or Base, the worst case is the sequencer goes offline — you can still recover your funds because Ethereum has all the data. When you bridge $100 of USDC to a sidechain like Polygon PoS, the worst case is the validator set is compromised — at which point your funds are gone, because Ethereum has no record of the sidechain\'s state. The trust assumption is fundamentally different. For high-value use cases (DeFi, settlement), this matters; for low-value gaming or social, the sidechain trade-off may be acceptable.',
  },
  {
    q: 'How do you tell an L2 from a sidechain at a glance?',
    a: '**Ask: "if this chain went away tomorrow, could users withdraw their funds using only Ethereum?"** If yes, it\'s an L2 — the data needed to reconstruct user balances lives on Ethereum (either as calldata, blobs, or compressed state). If no, it\'s a sidechain — the chain\'s own validator set holds the only authoritative copy of the state. **L2BEAT** is the canonical resource for this classification; growthepie follows L2BEAT\'s conventions in our [master chain catalogue](https://api.growthepie.com/v1/master.json).',
  },
  // ----- Sidechain examples -----
  {
    q: 'What are the most well-known Ethereum sidechains?',
    a: '**Polygon PoS** (formerly Matic) — the most prominent. ~100 validators, its own PoS consensus, two-way bridge to Ethereum. **Gnosis Chain** (formerly xDai) — a DAI-stablecoin-native chain with its own consensus. **BNB Smart Chain** — Binance\'s EVM-compatible chain, often confused with an Ethereum L2 (it isn\'t). **Ronin** was a sidechain through 2024 (and is the source of the most-cited sidechain bridge hack, the $600M Ronin Bridge compromise in 2022) but has since **migrated to an Ethereum L2** — it\'s no longer a sidechain. Several other former sidechains are on similar paths: Polygon\'s "Polygon 2.0" plan involves shifting Polygon PoS toward a validium architecture too.',
  },
  // ----- L2 examples -----
  {
    q: 'What are the most well-known Ethereum L2s?',
    a: 'By usage today: **Base** (Coinbase\'s L2 on OP Stack), **Arbitrum One** (the largest by TVL), **OP Mainnet** (Optimism), **zkSync Era**, **Polygon zkEVM**, **Linea**, **Scroll**, **Mantle**, **Unichain** (Uniswap\'s OP-Stack L2), **Soneium** (Sony\'s L2), **Worldchain** (Worldcoin\'s L2). All of these post data to Ethereum and inherit Ethereum\'s security to varying degrees — see [/answers/which-ethereum-l2-stage-1-stage-2](/answers/which-ethereum-l2-stage-1-stage-2) for how the security guarantees differ chain-to-chain.',
  },
  // ----- Bridges and trust -----
  {
    q: 'Do sidechains have bridges to Ethereum?',
    a: 'Yes, every sidechain has a bridge — that\'s how users move assets back and forth. But the bridge is just a smart contract that **trusts the sidechain\'s validator set**, not Ethereum\'s. If the sidechain validators sign off on "user X has 1000 USDC, let them withdraw it", the bridge releases the USDC — even if the validator signature was obtained fraudulently. The 2022 **Ronin bridge hack ($600M)** is the textbook example of how sidechain bridge security can fail — at the time Ronin was a sidechain (it has since migrated to an Ethereum L2 architecture). L2 bridges, by contrast, can verify state cryptographically (ZK rollup proofs) or via fraud proofs (Optimistic rollups), inheriting Ethereum\'s security model.',
  },
  // ----- Performance -----
  {
    q: 'Are sidechains faster than Ethereum L2s?',
    a: 'Historically yes — sidechains optimised for high throughput and low fees by skipping the expensive step of posting data back to Ethereum. But the trade-off was security. As L2 technology has matured (blobs via Dencun in 2024, PeerDAS via Fusaka in 2025), L2 fees have collapsed and the speed gap has shrunk. Most major L2s in 2026 process more transactions per second than the typical sidechain, with stronger security guarantees. The "sidechain because it\'s faster" argument doesn\'t really hold up anymore.',
  },
  // ----- Validiums and ambiguity -----
  {
    q: 'Where do Validiums and Volitions fit?',
    a: 'A **Validium** is a chain that **proves state to Ethereum (like a rollup) but stores data off-chain** (like a sidechain). The state is secured cryptographically, but if the off-chain data is withheld, users can\'t reconstruct their balances. **Volitions** let users choose per-transaction whether their data goes on-chain (rollup mode) or off-chain (validium mode). Both are usually classified as L2s on growthepie because the state is provably secured by Ethereum — but they\'re a partial step from "true rollup" toward "sidechain-like data assumptions". L2BEAT classifies them as "Validium" with explicit risk caveats.',
  },
  // ----- Bucket / classification -----
  {
    q: 'How does growthepie classify chains?',
    a: 'In growthepie\'s [master.json](https://api.growthepie.com/v1/master.json) each chain has a `bucket` field that places it into one of: **Layer 1** (Ethereum itself), **Layer 2** (rollups + validiums), or **Others** (sidechains, alt-L1s sometimes tracked for context). The L2 answer pages on growthepie filter to `bucket: "Layer 2"`, which is why Polygon PoS doesn\'t appear in any of our L2 rankings — it\'s in the "Others" bucket. We follow L2BEAT\'s classification conventions; we don\'t make editorial calls.',
  },
  // ----- Edge cases -----
  {
    q: 'What about Polygon\'s migration to "Polygon 2.0"?',
    a: 'Polygon has publicly announced plans to migrate Polygon PoS toward a more L2-like architecture (specifically a Validium that posts state to Ethereum). If and when that migration completes, Polygon PoS would be reclassified as a Layer 2 in growthepie\'s catalogue. Until then, we follow the live state — Polygon PoS today is a sidechain, Polygon zkEVM is an L2. Categorisations on growthepie reflect what the chain *currently* is, not what it plans to become.',
  },
  // ----- Practical guidance -----
  {
    q: 'Should I use an L2 or a sidechain?',
    a: 'Depends on what you\'re doing. **For DeFi, treasury management, or anything where you\'d lose meaningful money if a validator set were compromised, use an Ethereum L2** — the inherited security is worth it. **For low-stakes use cases like gaming, social applications, or experimental dApps where the cost of being wrong is small, a sidechain\'s lower fees and higher throughput may be a fine trade-off.** That said, in 2026 L2 fees are usually competitive with sidechains anyway, so the trade-off is less pronounced than it used to be.',
  },
  {
    q: 'Where can I see live data for L2s vs sidechains?',
    a: 'growthepie\'s [chains directory](https://www.growthepie.com/chains) lists every tracked chain with its bucket (Layer 1 / Layer 2 / Others). [L2BEAT](https://l2beat.com) has detailed per-chain risk analysis and is the canonical source for the "is this really an L2?" question. For per-chain activity rankings restricted to actual L2s, see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2) — sidechains are deliberately excluded.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/l2-vs-sidechain';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-vs-sidechain-classification',
    name: 'Ethereum Chain Bucket Classification (Layer 1 / Layer 2 / Others)',
    description:
      'Per-chain bucket classification distinguishing Ethereum Layer 1, Layer 2s (rollups + validiums), and Others (sidechains and external chains tracked for context).',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Layer 2',
      'Sidechain',
      'Polygon PoS',
      'BNB Smart Chain',
      'Gnosis Chain',
      'Validium',
    ],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description: 'Master chain catalogue with `bucket`, `chain_type`, and `technology` fields.',
      },
    ],
  },
];

const l2VsSidechain: QuickBiteData = createQuickBite({
  title: 'What is the difference between an Ethereum L2 and a sidechain?',
  subtitle:
    'A clear explanation of why Polygon PoS isn\'t an L2, what makes a chain an "Ethereum L2", and which trust assumptions you take on with each.',
  shortTitle: 'L2 vs Sidechain',
  summary:
    "An Ethereum L2 derives security from Ethereum by posting transaction data (or state proofs) back to mainnet — users can recover funds with only Ethereum data if the L2 disappears. A sidechain has its own validator set and its own security, with just a bridge connecting it to Ethereum — if the validators are compromised, Ethereum can't help. Polygon PoS is the most famous sidechain that's often mistaken for an L2; the test is simple: can you recover your funds using only Ethereum data? L2BEAT and growthepie follow the same classification.",
  content: [
    "**Short answer:** An **Ethereum L2** derives security from Ethereum by posting data (or state proofs) back to mainnet — users can withdraw funds using only Ethereum data even if the L2 sequencer disappears. A **sidechain** has its own validator set and its own security; the only thing connecting it to Ethereum is a bridge. **Polygon PoS** is the most famous sidechain often mistaken for an L2 (Polygon **zkEVM** is the actual Polygon L2 — same brand, completely different architecture).",

    "> The simplest test: **\"if this chain went away tomorrow, could users withdraw their funds using only Ethereum?\"** If yes, it's an L2. If no, it's a sidechain.",

    '# The core distinction',
    '**Ethereum L2s** post their transaction data (or cryptographic proofs of state) back to Ethereum mainnet. This means **Ethereum holds an authoritative copy of the L2\'s state** — if the L2 sequencer disappears or cheats, anyone can use the Ethereum data to reconstruct user balances and withdraw funds. The security model: **L2 inherits Ethereum**.',
    '',
    '**Sidechains** run as separate blockchains with their own validator sets and their own consensus. They have a **bridge** to Ethereum, but the bridge only trusts the sidechain\'s validators — Ethereum doesn\'t verify the sidechain\'s state. If the validator set is compromised, the bridge can be drained. The security model: **sidechain has its own**.',
    '',
    'The 2022 Ronin bridge hack ($600M stolen) is the textbook example of how this can go wrong: an attacker compromised the Ronin validator set (Ronin was a sidechain at the time — it has since migrated to an Ethereum L2 architecture) and used the bridge\'s "trust the validators" model to drain the bridge contract.',

    '# Examples',
    '**Ethereum L2s:** Arbitrum One, OP Mainnet, Base, zkSync Era, Polygon **zkEVM**, Linea, Scroll, Mantle, Worldchain, Unichain, Soneium, and many more. All post data to Ethereum.',
    '',
    '**Sidechains:** Polygon **PoS** (~100 validators, own consensus), Gnosis Chain (formerly xDai), BNB Smart Chain (Binance\'s EVM chain — often called a "BNB sidechain" but technically a separate alt-L1). None of these post their state to Ethereum.',
    '',
    '**Former sidechain, now an L2:** **Ronin** (Axie Infinity\'s chain) was a sidechain through 2024 and is the source of the most-cited sidechain bridge hack — the 2022 $600M Ronin Bridge compromise. It has since migrated to an Ethereum L2 architecture and is no longer classified as a sidechain.',
    '',
    'Note: Polygon zkEVM and Polygon PoS share a brand but are completely different architectures. zkEVM is an Ethereum L2 (ZK rollup); PoS is a sidechain.',

    '# Why this matters',
    'The practical consequence is **what could go wrong**:',
    '- On an Ethereum L2, the worst plausible failure is the sequencer goes offline. Funds are still recoverable from Ethereum.',
    '- On a sidechain, the worst plausible failure is the validator set is compromised (collusion, hack, regulatory seizure). Funds are gone.',
    '',
    'For high-value use cases (DeFi, treasury management, NFTs with real value) this gap matters. For low-value gaming, social applications, or experiments, the sidechain trade-off may be acceptable for the lower fees and higher throughput.',
    '',
    'In 2026 the sidechain speed/cost argument is also weaker than it used to be — major Ethereum L2s now have throughput and fees competitive with sidechains, with stronger security guarantees.',

    '# Where Validiums and Volitions sit',
    '**Validium** = ZK rollup-like state proofs, sidechain-like off-chain data. **Volition** = user picks per-transaction whether data goes on-chain or off-chain. Both are usually classified as L2s on growthepie because the *state* is provably secured by Ethereum — but they\'re a partial step from "true rollup" toward "sidechain-like data assumptions". L2BEAT classifies them as "Validium" with explicit risk caveats. The category line isn\'t binary, but it\'s sharper than people often assume.',

    '# Methodology and data sources',
    "Chain classifications on this page come from growthepie's [master chain catalogue](https://api.growthepie.com/v1/master.json), specifically the `bucket` field. We use the same field to filter the L2 universe on every other answer page on growthepie — so chains classified as sidechains (Polygon PoS, BNB Smart Chain, Gnosis Chain, etc.) are deliberately excluded from L2 rankings. When a chain migrates from sidechain to L2 (as Ronin did), growthepie updates the bucket classification in master.json and the chain begins appearing in L2 rankings automatically.",
    '',
    "We follow L2BEAT's classification conventions — they're the canonical independent resource for L2 architecture. If a chain disputes its classification, that's a conversation with L2BEAT and the chain team, not editorial judgement on our side.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Several supporters are L2 chains. Sidechain classifications on this page follow L2BEAT and master.json — no editorial bias toward or against any chain. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [L2BEAT](https://l2beat.com) is the most-cited independent classifier of L2s vs sidechains — they explicitly publish a stage and bucket for every project. [ethereum.org's Layer 2 page](https://ethereum.org/en/layer-2/) has the EF's overview of what constitutes an L2. Both should agree with growthepie's classification.",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'An Ethereum Layer 2 (L2) derives security from Ethereum by posting transaction data or state proofs back to mainnet — users can withdraw funds using only Ethereum data even if the L2 sequencer disappears. A sidechain has its own validator set and its own security, with only a bridge connecting it to Ethereum; if the validators are compromised, Ethereum can\'t help. Polygon PoS is a sidechain often mistaken for an L2; Polygon zkEVM (same brand, different chain) is an actual Ethereum L2. The simplest test: can users withdraw funds using only Ethereum data? If yes, it\'s an L2.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/chains' },
    { name: 'Sidechain', url: '/chains' },
    { name: 'Polygon PoS', url: '/chains' },
    { name: 'Polygon zkEVM', url: '/chains' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
    { name: 'Base', url: '/chains/base' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default l2VsSidechain;
