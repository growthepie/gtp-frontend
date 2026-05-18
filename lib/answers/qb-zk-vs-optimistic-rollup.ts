import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page. Pure prose — no per-page leaderboard kind.
// Chain-categorisation lists below come from growthepie's master.json
// `technology` field (snapshot as of the date on the page); the live
// authoritative source is each chain's own /chains/{chain} page.

export const faqItems: FaqItem[] = [
  {
    q: 'What is the difference between a ZK rollup and an Optimistic rollup?',
    a: 'Both are **Ethereum Layer 2s** — they batch transactions and post the data back to Ethereum mainnet for security. They differ in **how they prove the batches are correct**. A **ZK rollup** generates a cryptographic validity proof (a "zero-knowledge proof") for every batch, which Ethereum verifies onchain — the batch is valid the moment the proof is accepted. An **Optimistic rollup** assumes batches are valid by default and lets anyone challenge them with a **fraud proof** during a multi-day **challenge window** (typically 7 days). Both inherit Ethereum\'s security, but ZK rollups get faster L1 finality and Optimistic rollups have simpler engineering and (historically) better EVM compatibility.',
  },
  {
    q: 'Which Ethereum L2s are ZK rollups?',
    a: 'As of 2026, the main ZK rollups on Ethereum include **zkSync Era**, **Polygon zkEVM**, **Linea**, **Scroll**, **Starknet** (its own VM, not EVM-equivalent), **Taiko** (a "based" ZK rollup), and several others. See [growthepie.com/chains](https://www.growthepie.com/chains) for the live list with each chain\'s current classification.',
  },
  {
    q: 'Which Ethereum L2s are Optimistic rollups?',
    a: 'As of 2026, the main Optimistic rollups include **Arbitrum One**, **OP Mainnet** (Optimism), **Base** (a Coinbase-operated OP Stack chain), **Mode**, **Mantle**, **Worldchain**, **Unichain**, **Soneium**, **Ink**, **Lisk**, and many others — most of which are built on the **OP Stack** (Optimism\'s open-source codebase) or **Arbitrum Orbit** (Arbitrum\'s codebase). See [growthepie.com/chains](https://www.growthepie.com/chains) for the full live list.',
  },
  {
    q: 'Which is more secure?',
    a: 'Both inherit Ethereum\'s security in principle. The practical difference: a **ZK rollup\'s validity proof is mathematical** — if the proof verifies, the state transition is correct, no human in the loop. An **Optimistic rollup\'s security depends on at least one honest verifier** running during the challenge window to submit a fraud proof if the sequencer cheats. That requires liveness assumptions (the verifier needs to be online) and an active fraud-proof system (which not every "Optimistic" rollup has fully shipped). Most experts consider validity proofs the stronger long-term model, which is why nearly every new L2 announced from 2024 onward has chosen the ZK path.',
  },
  {
    q: 'Which is faster?',
    a: 'For **L1 finality** (when the L2\'s state is settled on Ethereum), **ZK rollups are faster** — typically minutes to hours from when a batch is posted to when its proof is verified. Optimistic rollups have a **7-day challenge window** before L1 considers the batch final, which is also when withdrawals can be processed. For **user experience** (UX finality on the L2 itself — what your wallet shows), both are effectively instant — usually under a second. Most users never notice the L1 finality difference because L2-native applications treat L2 confirmations as final.',
  },
  {
    q: 'Why do Optimistic rollups need a 7-day challenge window?',
    a: 'To give honest verifiers enough time to detect and challenge fraud. If a sequencer posts an invalid state, anyone can submit a fraud proof during the window; if the fraud proof verifies, the bad batch is reverted. The window has to be long enough that a censorship attack (where an attacker tries to suppress fraud proofs) can\'t succeed. **Bridges built on top of Optimistic rollups often abstract this away** — they let users withdraw quickly via third-party liquidity providers who front the ETH/USDC and wait the 7 days themselves, charging a small fee for the service.',
  },
  {
    q: 'Why have most newer L2s chosen ZK?',
    a: 'Three reasons. **(1) Better finality** — no 7-day challenge window means simpler bridges, faster withdrawals, and cleaner UX. **(2) Cleaner security model** — validity proofs don\'t require trust assumptions about verifier liveness. **(3) Hardware improvements** — proving zkEVM circuits used to be slow and expensive; advances in ZK proving (and dedicated proving hardware) have made it economically viable. The trade-off is engineering complexity: ZK proof systems are much harder to design and audit than fraud-proof systems.',
  },
  {
    q: 'Are ZK rollups always EVM-compatible?',
    a: 'Not always. The spectrum runs from **fully EVM-equivalent** (your Ethereum contract works as-is — Linea, Scroll, Polygon zkEVM aim for this) to **EVM-compatible with caveats** (most contracts work but some opcodes behave differently — early zkSync Era was here) to **non-EVM** (Starknet uses its own VM called Cairo). Optimistic rollups are almost always **EVM-equivalent** by construction because their fraud-proof system runs the EVM directly. The compatibility gap is closing fast on the ZK side as proving tech matures.',
  },
  {
    q: 'Which has cheaper fees?',
    a: 'Per-transaction L2 fees depend more on **the chain\'s blob/calldata strategy** and **the chain\'s current activity level** than on whether it\'s ZK or Optimistic. Both ZK and Optimistic rollups post their batch data to Ethereum as blobs (post-Dencun), and that DA cost is by far the largest fee component for either. ZK rollups also have **proof generation cost** which is non-trivial; Optimistic rollups don\'t pay for proofs unless a fraud claim is made. For live per-chain fee comparison see [/answers/lowest-fee-ethereum-l2](/answers/lowest-fee-ethereum-l2).',
  },
  {
    q: 'What is a "Stage" and how does it relate to ZK vs Optimistic?',
    a: '**Rollup Stages** (introduced by [L2BEAT](https://l2beat.com)) measure how decentralised a rollup is — independent of whether it\'s ZK or Optimistic. **Stage 0** = training wheels on (security council can override, no fraud/validity proofs in production). **Stage 1** = proofs live but with a security council backstop. **Stage 2** = full decentralisation, no security council overrides. A rollup can be Stage 0 ZK or Stage 2 Optimistic — the two classifications are orthogonal. See [/answers/which-ethereum-l2-stage-1-stage-2](/answers/which-ethereum-l2-stage-1-stage-2) for which chains are at which stage.',
  },
  {
    q: 'What is a Validium and where does it fit?',
    a: 'A **Validium** is a ZK rollup variant that uses ZK proofs for state transitions but stores transaction data **off-chain** (typically with a data-availability committee or a separate DA layer like Celestia / EigenDA / Avail) instead of on Ethereum. Validiums get cheaper transactions but weaker data-availability guarantees — if the off-chain data is withheld, users can\'t reconstruct the state. Some chains are technically called "Validiums" or "Volitions" rather than "rollups". Validiums still count as Ethereum L2s on growthepie because they post their state to Ethereum, just not their data.',
  },
  {
    q: 'What is a "based" rollup?',
    a: 'A rollup whose transaction sequencing is done by **Ethereum validators (L1 proposers) directly** rather than by a separate L2 sequencer. The L2 inherits Ethereum\'s liveness and decentralisation properties — there\'s no centralised sequencer that could go down or censor users. Taiko is the most prominent example. "Based" can apply to either ZK or Optimistic rollups — it\'s about who sequences, not how state is proved.',
  },
  {
    q: 'Will Optimistic rollups eventually become ZK rollups?',
    a: 'Several have publicly committed to a "ZK upgrade" path — Optimism\'s OP Stack roadmap includes ZK fault proofs, and Arbitrum has the Orbit / Stylus ecosystem with optional ZK support. The practical end-state for most major Optimistic chains is likely **hybrid** — Optimistic execution with ZK validity proofs for finality, getting the best of both. This isn\'t a near-term migration for live chains, but it\'s the direction the engineering is pointing.',
  },
  {
    q: 'How does growthepie classify chains?',
    a: 'Each chain in growthepie\'s [master.json](https://api.growthepie.com/v1/master.json) carries a `technology` field describing its rollup type (ZK, Optimistic, Validium, etc.) and a `bucket` field identifying it as a Layer 2 vs Layer 1 vs other. We don\'t make editorial calls about which category a chain belongs to — we follow the chain team\'s own classification and L2BEAT\'s conventions. If a chain disputes its classification, that\'s a conversation with the chain team and L2BEAT, not with us.',
  },
  {
    q: 'Where can I see live data for ZK vs Optimistic rollups?',
    a: 'growthepie\'s [chains directory](https://www.growthepie.com/chains) lists every tracked chain with its technology classification. [L2BEAT](https://l2beat.com) has detailed per-chain risk analysis including security model, proof system, and Stage classification. For ZK vs Optimistic activity rankings — throughput, transactions, users — see [/answers/most-used-ethereum-l2](/answers/most-used-ethereum-l2).',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/zk-vs-optimistic-rollup';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/l2-rollup-technology',
    name: 'Ethereum L2 Rollup Technology Classification',
    description:
      'Per-chain rollup-technology classification (ZK rollup, Optimistic rollup, Validium, sidechain) and bucket (Layer 1 vs Layer 2 vs Other) for every chain tracked by growthepie.',
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
      'ZK rollup',
      'Optimistic rollup',
      'Validium',
      'Onchain analytics',
    ],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description:
          'Master chain catalogue with `technology`, `bucket`, and `chain_type` fields per chain.',
      },
    ],
  },
];

const zkVsOptimisticRollup: QuickBiteData = createQuickBite({
  title: 'What is the difference between a ZK rollup and an Optimistic rollup?',
  subtitle:
    'A direct comparison of Ethereum\'s two main rollup architectures — how they prove state, how fast they finalise, which chains use which, and which is "better".',
  shortTitle: 'ZK vs Optimistic',
  summary:
    "ZK rollups and Optimistic rollups are both Ethereum Layer 2s that batch transactions and post data back to mainnet. They differ in how they prove batches are correct: ZK rollups generate cryptographic validity proofs that Ethereum verifies onchain (so batches finalise in minutes); Optimistic rollups assume batches are valid and let anyone challenge them with fraud proofs during a 7-day window. ZK rollups get faster finality and cleaner security guarantees; Optimistic rollups have simpler engineering and (historically) better EVM compatibility. Most newer L2s have chosen ZK, but the biggest L2s by activity today are Optimistic.",
  content: [
    "**Short answer:** **ZK rollups** prove batches are valid with a cryptographic proof verified by Ethereum (fast finality, mathematical security). **Optimistic rollups** assume batches are valid and rely on a 7-day fraud-proof window (simpler engineering, slower L1 finality). Both inherit Ethereum's security; the difference is the proof system.",

    "> Both are Ethereum Layer 2s. They batch transactions, post the data to Ethereum, and inherit Ethereum's security. The only architectural difference is **how they convince Ethereum the batches are correct**.",

    '# The core difference',
    'Imagine you\'re processing transactions in batches off-chain and need Ethereum to trust the result.',
    '',
    '**ZK rollup:** "Here\'s the batch, and here\'s a cryptographic proof that every transaction in it was valid. Ethereum, verify the proof." If the proof verifies, the batch is final.',
    '',
    '**Optimistic rollup:** "Here\'s the batch. Assume it\'s correct unless someone proves otherwise within 7 days." Anyone can submit a fraud proof during the window; if it verifies, the bad batch is reverted.',
    '',
    'Same security guarantee in the limit (both inherit Ethereum), but the mechanics — and the user experience — differ.',

    '# Which Ethereum L2s are which?',
    'As of 2026, the major chains break down roughly like this:',
    '',
    '**ZK rollups** — zkSync Era, Polygon zkEVM, Linea, Scroll, Starknet (non-EVM), Taiko (based ZK rollup), and a growing list of newer chains. Nearly every new L2 announced from 2024 onward has chosen the ZK path.',
    '',
    '**Optimistic rollups** — Arbitrum One, OP Mainnet, Base, Mode, Mantle, Worldchain, Unichain, Soneium, Ink, Lisk, and many others. Most are built on either the **OP Stack** (Optimism\'s open-source codebase) or **Arbitrum Orbit** (Arbitrum\'s codebase).',
    '',
    'See [growthepie.com/chains](https://www.growthepie.com/chains) for the live list with each chain\'s current classification.',

    '# Trade-offs',
    'A practical comparison of the trade-offs that actually matter to users and developers:',
    '',
    '| Aspect | ZK rollup | Optimistic rollup |',
    '|---|---|---|',
    '| **L1 finality** | Minutes–hours | 7 days (challenge window) |',
    '| **Native withdrawal time** | Minutes–hours | 7 days (or via 3rd-party fast bridge) |',
    '| **Security model** | Cryptographic — proof must verify | Cryptoeconomic — at least one honest verifier |',
    '| **EVM compatibility** | Varies (some non-EVM, most EVM-compatible) | Almost always EVM-equivalent |',
    '| **Engineering complexity** | High (ZK circuits are hard) | Lower (fraud proofs reuse EVM) |',
    '| **Proof costs** | Pays for every proof | Only pays during a fraud challenge |',
    '| **Live examples** | zkSync, Linea, Scroll, Starknet, Polygon zkEVM | Arbitrum, OP, Base, Mantle, Worldchain |',
    '',
    'In practice, users feel the **withdrawal time** difference most (Optimistic chains require 7-day withdrawals to L1 unless you use a fast bridge), and developers feel the **EVM compatibility** difference (Optimistic chains tend to be plug-and-play; some ZK chains require contract adjustments).',

    '# Which is more secure?',
    'Both inherit Ethereum\'s security in principle, but the practical model differs:',
    '- **ZK rollups** have **mathematical security** — if the proof verifies, the state transition is correct. No humans in the loop, no liveness assumptions about verifiers.',
    '- **Optimistic rollups** have **cryptoeconomic security** — they require at least one honest verifier to be running during the challenge window. If a sequencer cheats and no one notices in 7 days, the cheat sticks.',
    '',
    'Most security experts consider validity proofs the stronger long-term model — that\'s why nearly every new L2 announced from 2024 onward has chosen the ZK path. But this is a *spectrum*, not a binary: an Optimistic rollup with a robust fraud-proof system and many independent verifiers can be very secure in practice. The L2BEAT [Stage classification](/answers/which-ethereum-l2-stage-1-stage-2) is the most rigorous way to compare actual decentralisation across chains, independent of ZK vs Optimistic.',

    '# Are they converging?',
    'Yes. Several Optimistic rollups have publicly committed to adopting ZK proofs in the future (Optimism\'s OP Stack roadmap includes ZK fault proofs; Arbitrum has Stylus + ZK research). The likely end-state for most major Optimistic chains is **hybrid** — Optimistic execution with ZK validity proofs for finality, getting the best of both. This isn\'t a near-term migration for any live mainnet chain, but it\'s the direction the engineering is pointing.',

    '# Methodology and data sources',
    "Chain classifications on this page come from growthepie's [master chain catalogue](https://api.growthepie.com/v1/master.json), specifically the `technology` and `bucket` fields. We follow chain teams' own classifications and L2BEAT's conventions — we don't make editorial calls about which category a chain belongs to.",
    '',
    "For the most rigorous per-chain analysis (proof system, fraud-proof status, security council composition, withdrawal mechanics), see [L2BEAT](https://l2beat.com) — they're the canonical resource for L2 architecture and risk classification.",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Many supporters operate L2 chains (both ZK and Optimistic). This page presents architectural facts only — chain classifications come from master.json and L2BEAT, not from editorial judgement. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [L2BEAT](https://l2beat.com) is the most-cited independent source for L2 architecture and risk. [ethereum.org's Layer 2 page](https://ethereum.org/en/layer-2/) has the EF's overview of the ecosystem. For each chain\'s own technical docs, follow the links on its growthepie [chain page](https://www.growthepie.com/chains).",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'ZK rollups and Optimistic rollups are both Ethereum Layer 2s that batch transactions and post data to mainnet. They differ in how they prove batches are correct: ZK rollups generate cryptographic validity proofs verified by Ethereum (fast L1 finality, minutes to hours); Optimistic rollups assume batches are valid and rely on a 7-day fraud-proof challenge window. Both inherit Ethereum\'s security. Major ZK rollups: zkSync Era, Polygon zkEVM, Linea, Scroll, Starknet, Taiko. Major Optimistic rollups: Arbitrum One, OP Mainnet, Base, Mantle, Worldchain, Unichain, Soneium. Most newer L2s have chosen the ZK path.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { name: 'Layer 2', url: '/chains' },
    { name: 'ZK Rollup', url: '/chains' },
    { name: 'Optimistic Rollup', url: '/chains' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
    { name: 'OP Mainnet', url: '/chains/op-mainnet' },
    { name: 'Base', url: '/chains/base' },
    { name: 'zkSync Era', url: '/chains/zksync_era' },
    { name: 'Linea', url: '/chains/linea' },
  ],
  icon: 'gtp-metrics-throughput',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default zkVsOptimisticRollup;
