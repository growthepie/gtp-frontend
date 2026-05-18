import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

export const faqItems: FaqItem[] = [
  {
    q: 'Which Ethereum L2 has the most smart-account (EIP-7702) activity?',
    a: 'As of {{l2_7702_data_date}} UTC, **{{l2_7702_leader}}** leads Ethereum L2s in EIP-7702 (smart account / Type 4 transaction) activity. Full L2 ranking: {{l2_7702_top10}}. Ethereum L1 (for context): **{{l2_7702_ethereum}}**. EIP-7702 activated with Pectra on May 7, 2025. Live tracker: [growthepie.com/quick-bites/pectra-upgrade](/quick-bites/pectra-upgrade).',
  },
  {
    q: 'What is EIP-7702?',
    a: '**EIP-7702** is a Pectra-era Ethereum upgrade (activated May 7, 2025) that introduces a new **"Set Code" or Type 4 transaction**. It lets a regular wallet (an EOA — externally-owned account) temporarily act as a smart contract account for one transaction. The unlocks: **gas sponsorship** (someone else pays the fee), **paying gas in tokens other than ETH** (USDC, project tokens), **transaction batching** (multiple actions in one user signature), and **session keys / delegation** (a dApp can sign on the user\'s behalf within preset limits). See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed) for the full Pectra story.',
  },
  {
    q: 'What\'s a "Type 4" transaction?',
    a: 'A new Ethereum transaction format introduced by EIP-7702 that carries an **authorization list** — signed instructions telling the protocol to temporarily install bytecode on the sender\'s EOA. While the transaction executes, the EOA behaves as a smart contract account; after the transaction completes the original (empty) code is restored. The chain accepts the temporary "set code" only if the EOA owner signed the authorization. Type 4 transactions count is the simplest live measure of EIP-7702 adoption.',
  },
  // ----- Adoption -----
  {
    q: 'Which L2s show meaningful EIP-7702 adoption?',
    a: 'As of {{l2_7702_data_date}} UTC, the L2s with measurable Type 4 transaction activity tracked by growthepie are listed in the table above. The leader is **{{l2_7702_leader}}**. Adoption depends heavily on **wallet support** — a chain only sees Type 4 transactions if its users\' wallets expose EIP-7702 features. Wallets that adopted early (Coinbase Wallet, MetaMask, Rabby) drove most of the initial activity; chains with those wallets in their default user flow have the highest counts.',
  },
  {
    q: 'How does L2 EIP-7702 activity compare to Ethereum L1?',
    a: 'As of {{l2_7702_data_date}} UTC, Ethereum L1 shows {{l2_7702_ethereum}}. L2 vs L1 activity can go either way depending on the use case: **dApps doing gas sponsorship for onboarding** tend to settle on L2s for cheaper transactions, so L2 Type 4 counts can outpace L1. **Native ETH transfers using EIP-7702 features** (e.g. paying with USDC for gas) often happen on L1 where ETH itself lives. The breakdown shifts as more wallets ship support.',
  },
  // ----- Why adoption matters -----
  {
    q: 'Why does EIP-7702 adoption matter?',
    a: 'EIP-7702 is the most user-visible feature of the Pectra upgrade — it\'s the change that lets Ethereum dApps offer the kind of UX users get on centralised platforms (no gas token needed, batched approvals, "log in" sessions). High Type 4 transaction counts mean wallets and dApps are actually using the upgrade, not just citing it in announcements. Low counts mean adoption is lagging despite the protocol-level feature being live.',
  },
  {
    q: 'Which use cases drive EIP-7702 transactions?',
    a: 'Several patterns. **Onboarding gas sponsorship** — dApps paying gas for first-time users (often via Paymaster contracts integrated with EIP-7702). **DeFi batching** — combining ERC-20 `approve` + DEX swap into one transaction. **Game and social dApps** — session keys that authorise a series of in-app actions without re-signing each one. **Multi-step bridge UX** — wallets bundling approvals + bridge transactions atomically. Each pattern produces Type 4 transactions; the chain counts on this page sum them all.',
  },
  // ----- Methodology -----
  {
    q: 'Where does this data come from?',
    a: 'Per-chain Type 4 transaction counts come from growthepie\'s Pectra tracker endpoint (`/v1/quick-bites/pectra-fork.json`) — specifically the `data.type4_tx_count.{chain}.daily` series. Counts are derived from on-chain transaction-type analysis: a transaction is a Type 4 if its `type` field is `0x04` (EIP-7702 Set Code transactions). The series starts on May 7, 2025 (Pectra activation) and updates daily.',
  },
  {
    q: 'Why don\'t all L2s appear in this ranking?',
    a: 'growthepie\'s Pectra tracker currently publishes Type 4 transaction counts for the most widely-used EVM chains where EIP-7702 has measurable adoption — Ethereum L1, Base, OP Mainnet, Unichain, and Arbitrum. Chains without published Type 4 counts may not have had any (low adoption) or may not yet be in growthepie\'s tracker coverage. As wallet support broadens and more chains see meaningful Type 4 activity, the coverage list will expand.',
  },
  // ----- Linked content -----
  {
    q: 'Where can I see this data live?',
    a: 'growthepie\'s [Pectra upgrade tracker](/quick-bites/pectra-upgrade) charts per-chain Type 4 transactions over time. The same page tracks blob count vs target (EIP-7691 adoption). For the full Pectra upgrade context — what EIP-7702 actually does, why it matters, how it relates to account abstraction — see [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed).',
  },
  {
    q: 'How is "Ethereum L2" defined here?',
    a: 'An Ethereum Layer 2 is a chain that derives security from Ethereum by posting transaction data and/or state to Ethereum mainnet. See [/answers/l2-vs-sidechain](/answers/l2-vs-sidechain) for the full definition. The L2s currently tracked in growthepie\'s Pectra Type 4 data are Base, OP Mainnet, Unichain, and Arbitrum.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/most-smart-account-activity-ethereum-l2';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/eip7702-type4-tx-counts',
    name: 'EIP-7702 Type 4 Transaction Counts (per chain, daily)',
    description:
      'Daily per-chain counts of Type 4 ("Set Code") transactions — the EIP-7702 transaction format introduced in Pectra (May 7, 2025) that enables smart-account features for ordinary wallets.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    temporalCoverage: '2025-05-07/..',
    keywords: [
      'Ethereum',
      'Pectra',
      'EIP-7702',
      'Type 4 transaction',
      'Set Code',
      'Smart account',
      'Account abstraction',
      'Layer 2',
    ],
    measurementTechnique:
      'Daily count of transactions on each chain with `type` field equal to 0x04 (Set Code / EIP-7702). Derived from chain RPC data and updated daily by growthepie.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'date' },
      { '@type': 'PropertyValue', name: 'type4_tx_count_per_chain' },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/quick-bites/pectra-fork.json',
        description: 'Pectra tracker data, including per-chain type4_tx_count daily timeseries.',
      },
    ],
  },
];

const mostSmartAccountActivityEthereumL2: QuickBiteData = createQuickBite({
  title: 'Which Ethereum L2 has the most smart-account (EIP-7702) activity?',
  subtitle:
    'Ranking of Ethereum L2s by EIP-7702 Type 4 transaction count — the live adoption signal for smart-account features introduced by the Pectra upgrade.',
  shortTitle: 'EIP-7702 Activity',
  summary:
    "EIP-7702 (activated with Pectra on May 7, 2025) introduces a new Type 4 / 'Set Code' transaction that lets ordinary Ethereum wallets temporarily act as smart accounts — enabling gas sponsorship, paying gas in non-ETH tokens, and transaction batching. growthepie tracks daily Type 4 transaction counts per chain as the live adoption signal. This page ranks Ethereum L2s by smart-account activity, with Ethereum L1 shown for context. Recomputed daily.",
  content: [
    "**Short answer (data {{l2_7702_data_date}} UTC):** Among Ethereum L2s, **{{l2_7702_leader}}** leads EIP-7702 (smart-account / Type 4 transaction) activity. Full L2 ranking: {{l2_7702_top10}}. For comparison, Ethereum L1: **{{l2_7702_ethereum}}**.",

    "> EIP-7702 introduces the 'Set Code' / Type 4 transaction, activated with the Pectra upgrade on May 7, 2025. It enables smart-account features (gas sponsorship, paying gas in non-ETH tokens, transaction batching) for ordinary wallets without requiring users to switch to a dedicated smart-contract wallet.",

    '# L2 ranking by EIP-7702 activity',
    '{{l2_7702_dense}}',

    '# What EIP-7702 actually does',
    'EIP-7702 lets a regular Ethereum wallet (an EOA — externally-owned account) temporarily act as a smart contract for one transaction. The mechanism: the user signs an **authorization** that tells the protocol to "act as if I had this contract bytecode for this transaction". The chain installs the code temporarily; the transaction executes with the contract\'s behaviour; afterwards the EOA goes back to having no code.',
    '',
    'What this unlocks:',
    '- **Gas sponsorship.** A dApp, paymaster, or third party pays the gas fee on the user\'s behalf.',
    '- **Pay gas in non-ETH tokens.** Pay fees in USDC, a project token, or anything the wallet supports.',
    '- **Transaction batching.** Multiple actions in one user-signed transaction (no more `approve` + `swap` two-step).',
    '- **Session keys / delegation.** A dApp signs on the user\'s behalf within preset limits.',
    '',
    'Users don\'t need to switch wallets — their existing EOA opts in by signing an authorization. Adoption is gated by wallet support.',

    '# How adoption is measured',
    'The simplest live signal is the number of **Type 4 transactions** per chain per day. A Type 4 transaction is a transaction whose `type` field equals `0x04` — these are EIP-7702 Set Code transactions by definition. growthepie tracks this per-chain in the Pectra fork data endpoint and exposes it on the [Pectra upgrade tracker](/quick-bites/pectra-upgrade).',
    '',
    'High Type 4 counts mean wallets and dApps are actually using the upgrade. Low counts mean adoption is lagging despite the protocol feature being live.',

    '# Why does L2 EIP-7702 activity matter?',
    'L2s are where most user-facing Ethereum activity happens today (see [/answers/ethereum-l2-transaction-count](/answers/ethereum-l2-transaction-count)). If EIP-7702 features genuinely improve UX, you\'d expect adoption to be highest on L2s — where users are most price-sensitive and most likely to interact with consumer dApps that benefit from gas sponsorship. The L2 ranking above is the live read on whether that\'s happening.',

    '# Methodology and data sources',
    "Per-chain Type 4 transaction counts come from growthepie's Pectra tracker endpoint (`/v1/quick-bites/pectra-fork.json`, path `data.type4_tx_count.{chain}.daily`). Counts are derived from on-chain transaction-type analysis: a transaction is a Type 4 if its `type` field is `0x04`. The series starts on May 7, 2025 (Pectra activation) and updates daily.",
    '',
    'Currently growthepie\'s Pectra tracker publishes per-chain Type 4 counts for Ethereum L1, Base, OP Mainnet, Unichain, and Arbitrum — the chains where adoption has been most measurable. Coverage expands as more chains accumulate meaningful Type 4 activity.',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Type 4 counts are computed mechanically from on-chain data — chains don't influence the ranking. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [Etherscan](https://etherscan.io/) lets you filter transactions by type — search Type 4 transactions per chain to verify counts. Per-chain block explorers (Basescan, Arbiscan, etc.) expose the same filter. growthepie's [Pectra tracker](/quick-bites/pectra-upgrade) has the live charts.",
    '',
    '# Related answers',
    '- [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed) — the full Pectra upgrade including EIP-7702, EIP-7691 (more blobs), and EIP-7251 (staking).',
    '- [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup) — the L2 architecture types EIP-7702 runs on top of.',

  ],
  image: '/quick-bites/pectra-upgrade.webp',
  og_image: '/quick-bites/pectra-upgrade.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data currently unavailable. See growthepie.com/quick-bites/pectra-upgrade for the live EIP-7702 adoption tracker.',
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
    { name: 'Pectra', url: '/quick-bites/pectra-upgrade' },
    { name: 'EIP-7702', url: '/quick-bites/pectra-upgrade' },
    { name: 'Smart Accounts', url: '/quick-bites/pectra-upgrade' },
    { name: 'Account Abstraction', url: '/quick-bites/pectra-upgrade' },
    { name: 'Base', url: '/chains/base' },
    { name: 'OP Mainnet', url: '/chains/op-mainnet' },
    { name: 'Arbitrum One', url: '/chains/arbitrum' },
    { name: 'Unichain', url: '/chains/unichain' },
  ],
  icon: 'gtp-metrics-transactioncount',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default mostSmartAccountActivityEthereumL2;
