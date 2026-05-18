import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page on DA — what it is and how the main providers
// differ. Pure prose, no per-page leaderboard kind. Live per-DA-layer data
// is available on growthepie's /data-availability dashboards; this page
// focuses on the conceptual explanation and the provider-by-provider
// comparison that AI search queries tend to ask for.

export const faqItems: FaqItem[] = [
  {
    q: 'What is Data Availability (DA) and what are the differences between providers?',
    a: '**Data Availability (DA)** is the guarantee that a chain\'s transaction data is **publicly available** — anyone who wants to reconstruct the chain\'s state can do so. It\'s the foundation L2 rollups stand on: an L2 can prove its state is *valid*, but unless the data is available, users can\'t verify that or withdraw their funds. The main DA providers for Ethereum L2s are **Ethereum mainnet (via blobs since Dencun)**, **Celestia**, **EigenDA**, and **Avail**. They differ on cost, throughput, security model, and who finalises the data. growthepie tracks them all at [growthepie.com/data-availability](https://www.growthepie.com/data-availability).',
  },
  {
    q: 'Why does data availability matter for an L2?',
    a: 'An L2\'s entire security model depends on data being available. Without it, three things break: **(1) Withdrawal safety** — users can\'t prove they own funds on the L2 if the data has disappeared. **(2) Fraud-proof construction** — Optimistic rollups need the underlying transaction data to construct fraud proofs. **(3) State verification** — any independent party that wants to verify the L2\'s state needs the data to do so. If a DA layer fails to make data available, even a "valid" L2 becomes effectively a custodial chain — you have to trust whoever holds the data.',
  },
  // ----- The main DA providers -----
  {
    q: 'What is "Ethereum DA" (blobs)?',
    a: 'Since the **Dencun upgrade (March 2024, EIP-4844)**, Ethereum mainnet itself provides DA through a new data type called **blobs** — large data attachments (~128 KB each) priced separately from regular L1 gas. Blobs live on Ethereum\'s consensus layer for ~18 days, long enough for any honest party to download and store them. After 18 days the chain still trusts that someone, somewhere, has the data; this is the same "weak subjectivity" assumption Ethereum already uses for consensus history. **Fusaka (December 2025)** added **PeerDAS** which lets nodes verify blob availability without downloading entire blobs, enabling further capacity increases. **Verdict: maximum security (inherits Ethereum), most expensive per byte, capacity capped by blob target.**',
  },
  {
    q: 'What is Celestia?',
    a: '**Celestia** is a dedicated **modular DA layer** — a standalone proof-of-stake blockchain whose only job is publishing and validating data blobs for other chains. Celestia launched mainnet in October 2023. L2s can post their data to Celestia instead of (or alongside) Ethereum, paying CelestiaTIA tokens for the data. Celestia validators sample a fraction of each block to confirm data availability — the same principle as Ethereum\'s PeerDAS, but Celestia shipped it first as a production design. **Verdict: cheap per byte, high throughput, separate trust assumption (you trust Celestia validators, not Ethereum validators).**',
  },
  {
    q: 'What is EigenDA?',
    a: '**EigenDA** is a DA service built on **EigenLayer** — Ethereum\'s restaking ecosystem. Users restake their ETH (or LSTs) to opt into providing DA services; the restaked ETH backs the cryptoeconomic security of the DA layer. EigenDA inherits a large portion of Ethereum\'s economic security without paying Ethereum gas for blob storage. Launched mainnet in 2024. **Verdict: cheap per byte, high throughput, ETH-backed security (you trust the restakers/operators with slashable ETH at risk, not pure Ethereum consensus).** Used by chains like MegaETH and others.',
  },
  {
    q: 'What is Avail?',
    a: '**Avail** (originally part of Polygon, now an independent project) is another **modular DA layer**, similar in architecture to Celestia. It uses KZG commitments and data availability sampling to allow light clients to verify data is available without downloading it. Mainnet launched in 2024. **Verdict: cheap per byte, high throughput, separate trust assumption (you trust Avail validators).**',
  },
  // ----- Comparison -----
  {
    q: 'Which DA provider is cheapest?',
    a: '**Live data (30-day average, data {{l2_da_data_date}} UTC):** Celestia: **{{l2_da_celestia_per_mb}}** per MB. EigenDA: **{{l2_da_eigenda_per_mb}}** per MB. Ethereum DA (blobs): **{{l2_da_ethereum_per_mb}}** per MB. Avail: **{{l2_da_avail_per_mb}}** per MB. Where a value reads "unavailable", growthepie\'s per-megabyte cost endpoint doesn\'t yet expose that provider — see the methodology FAQ for which providers are tracked where. **Pricing fluctuates** with each provider\'s native fee market (Celestia prices in TIA, EigenDA in ETH at restaker rates, Avail in AVAIL, Ethereum DA in ETH via the blob base fee), so the 30-day average smooths over short-term swings. Live charts: [growthepie.com/data-availability](https://www.growthepie.com/data-availability).',
  },
  {
    q: 'Which DA provider is most secure?',
    a: '**Ethereum DA (blobs) is the highest security** — same validators, same consensus, same economic backing as Ethereum mainnet itself. **EigenDA** comes second because it\'s backed by restaked ETH (slashing risk = real cost to attack). **Celestia and Avail** have their own dedicated validators and economic security, which is robust but lower than Ethereum\'s in absolute terms. For chains that need the strongest possible security guarantee (DeFi treasuries, settlement-critical assets), Ethereum DA is the conservative choice. For chains optimising for cheap, high-throughput data (gaming, social), alt-DA is the rational trade-off.',
  },
  {
    q: 'Are chains using alt-DA still "Ethereum L2s"?',
    a: 'It depends on definition. **L2BEAT classifies chains that post data to non-Ethereum DA layers as "Validiums" or "Optimiums"** rather than as pure rollups — the security model has an extra trust assumption (the alt-DA layer). growthepie and most of the ecosystem still consider them "Ethereum L2s" in the colloquial sense because they settle state to Ethereum, even if their data lives elsewhere. The technical term to be precise is **Validium** (ZK + alt-DA) or **Optimium** (Optimistic + alt-DA). See [/answers/zk-vs-optimistic-rollup](/answers/zk-vs-optimistic-rollup).',
  },
  // ----- Mechanics -----
  {
    q: 'How does Data Availability Sampling (DAS) work?',
    a: '**Data Availability Sampling** lets a node confirm that a large block is fully available *without* downloading the whole thing. Each node downloads a small random sample of pieces; if enough nodes each sample randomly, collectively they can verify any missing piece would have been detected. The underlying mathematical trick is **erasure coding** — the data is expanded so that any subset of pieces above a threshold can reconstruct the whole. DAS is the breakthrough that makes high-throughput DA practical: instead of every node needing a copy of every byte, the network collectively verifies availability at much lower per-node cost. Celestia shipped DAS first; Ethereum added it via **PeerDAS (EIP-7594) in the Fusaka upgrade** (December 2025).',
  },
  {
    q: 'How long does data have to be available?',
    a: 'Long enough that any honest party who wants the data has time to download and store it. Ethereum keeps blobs for **~18 days** on the consensus layer — after that the chain still trusts that someone, somewhere, has the data archived. Alt-DA layers have similar windows (Celestia keeps data for ~30 days, EigenDA configurable). After the on-chain window expires, the security model becomes "weak subjectivity" — you trust archives (the chain team, light-client archivists, third-party storage) to retain the data. This is the same assumption Ethereum itself uses for old block data older than the chain\'s reorg boundary.',
  },
  // ----- Specific chains -----
  {
    q: 'Which Ethereum L2s use which DA provider?',
    a: 'Most major L2s use **Ethereum DA (blobs)** — Arbitrum, OP Mainnet, Base, zkSync Era, Linea, Scroll, etc. Some chains use **alt-DA** for cost reasons — MegaETH uses EigenDA, Manta Network has used Celestia, several Polygon CDK chains can choose between options. Many chains are also **hybrid** — they post critical state to Ethereum and bulk data to alt-DA. growthepie\'s [data availability tracker](https://www.growthepie.com/data-availability) shows which chain uses which DA, plus per-DA-layer activity charts.',
  },
  // ----- Methodology -----
  {
    q: 'How does growthepie classify DA layers?',
    a: 'In growthepie\'s [master.json](https://api.growthepie.com/v1/master.json), each chain has a `da_layer` field identifying which DA provider it uses. There\'s also a top-level `da_layers` object describing each provider. growthepie publishes per-DA-layer dashboards under [/data-availability](https://www.growthepie.com/data-availability) with metrics like blobs per block, data posted (MB/day), fees paid (USD), and fees per megabyte (cost efficiency).',
  },
  {
    q: 'Why does the cost comparison show "unavailable" for some providers?',
    a: 'growthepie\'s `/v1/da_metrics/fees_per_mbyte.json` endpoint currently exposes per-megabyte fees for **Celestia and EigenDA**, but not yet for **Ethereum DA (blobs)** or **Avail**. Ethereum blob fees and total Avail fees are tracked elsewhere on growthepie (via `da_overview.json` for Ethereum blobs; Avail isn\'t in growthepie\'s DA coverage as of 2026), but a clean apples-to-apples per-MB number isn\'t served by the same endpoint. We don\'t fabricate values — where a number isn\'t directly available, the page reads "unavailable". As the upstream endpoint expands coverage, this page will automatically pick up the additional values.',
  },
  {
    q: 'Where can I see live DA data?',
    a: 'growthepie\'s [data availability section](https://www.growthepie.com/data-availability) has dashboards for each tracked DA layer — Ethereum, Celestia, EigenDA, Avail — with charts for blob count, data posted, fees paid, and per-megabyte cost. Per-chain pages also show which DA each L2 uses. [L2BEAT](https://l2beat.com) has architectural detail on each chain\'s DA choice and the resulting security profile.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/what-is-data-availability';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/da-layers',
    name: 'Data Availability Layers (per-layer metrics)',
    description:
      'Per-DA-layer activity and cost metrics: blob count, data posted (MB/day), fees paid (USD), and fees per megabyte. Covers Ethereum DA (blobs since Dencun), Celestia, EigenDA, and Avail.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    keywords: [
      'Ethereum',
      'Data Availability',
      'DA',
      'Blobs',
      'EIP-4844',
      'PeerDAS',
      'Celestia',
      'EigenDA',
      'Avail',
      'Validium',
      'Modular blockchain',
    ],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/master.json',
        description: 'Master chain catalogue with `da_layer` per chain and `da_layers` definitions.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/da_overview.json',
        description: 'DA layers overview snapshot.',
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/da_timeseries.json',
        description: 'DA layers per-day activity timeseries.',
      },
    ],
  },
];

const whatIsDataAvailability: QuickBiteData = createQuickBite({
  title: 'What is Data Availability (DA) and what are the differences between providers?',
  subtitle:
    'A direct explainer: what DA is, why L2s need it, and how Ethereum DA, Celestia, EigenDA, and Avail differ on cost, throughput, and security.',
  shortTitle: 'Data Availability',
  summary:
    "Data Availability (DA) is the guarantee that a chain's transaction data is publicly accessible — anyone wanting to reconstruct the state can. It's the foundation Ethereum L2s stand on. The main DA providers are Ethereum mainnet itself (via blobs since Dencun), Celestia, EigenDA, and Avail. They differ on cost, throughput, and security model. growthepie tracks live per-megabyte cost for Celestia and EigenDA; Ethereum blob fees are tracked separately in growthepie's DA overview. Ethereum DA inherits Ethereum's full security; alt-DA layers have their own validator sets or restaking-based economic security.",
  content: [
    "**Short answer:** Data Availability (DA) is the guarantee that a chain's transaction data is **publicly accessible**, so anyone can reconstruct the chain's state. It's foundational to how Ethereum L2s work — without DA, an L2 can prove its state is *valid* but you can't verify that or withdraw funds. The main DA providers are **Ethereum mainnet (blobs)**, **Celestia**, **EigenDA**, and **Avail**. They differ mainly on **cost**, **throughput**, and **security model** (Ethereum DA inherits Ethereum; alt-DA has separate trust assumptions). Live cost comparison: {{l2_da_dense}}",

    "> Live per-DA-layer metrics — blobs posted, data per day, fees paid, fees per MB — live at [growthepie.com/data-availability](https://www.growthepie.com/data-availability).",

    '# What is Data Availability?',
    'When an L2 batches up its transactions and settles to Ethereum, it has to give the world access to the underlying transaction data. Without that:',
    '- **Users can\'t withdraw.** If the L2 disappears, you need the transaction data to prove you own funds on Ethereum.',
    '- **Optimistic rollups can\'t verify state.** Fraud proofs need to replay the transactions; if the data is missing, fraud can\'t be challenged.',
    '- **Anyone wanting to run a node can\'t catch up.** A new validator or auditor needs the historical data to verify the chain.',
    '',
    'Data Availability is the guarantee that this data is **publicly accessible** for a long enough window that any honest party can grab it. Without DA, even a cryptographically valid L2 becomes effectively a custodial chain — you have to trust whoever\'s holding the data.',

    '# The four main DA providers',
    'For Ethereum L2s, four DA options dominate as of 2026:',
    '',
    '**1. Ethereum DA (blobs).** Since Dencun (March 2024, EIP-4844), Ethereum mainnet provides DA through **blobs** — large ~128 KB data attachments priced separately from regular L1 gas. Blobs live on Ethereum\'s consensus layer for ~18 days. **Fusaka (December 2025)** added **PeerDAS** which lets nodes verify blob availability via sampling, enabling further capacity increases. Maximum security (inherits Ethereum), most expensive per byte.',
    '',
    '**2. Celestia.** Standalone proof-of-stake blockchain dedicated to DA. Mainnet October 2023. L2s post data to Celestia (paying TIA tokens); Celestia validators sample blocks to confirm availability. Cheap, high-throughput, separate trust assumption (Celestia validators, not Ethereum).',
    '',
    '**3. EigenDA.** Built on EigenLayer — Ethereum\'s **restaking** ecosystem. Restaked ETH backs the DA layer\'s economic security. Cheap, high-throughput, ETH-backed (but not pure Ethereum consensus). Used by chains like MegaETH.',
    '',
    '**4. Avail.** Another standalone modular DA layer, similar in architecture to Celestia. Uses KZG commitments and data availability sampling. Cheap, high-throughput, separate trust assumption.',

    '# Provider comparison',
    'Practical comparison of the trade-offs that matter most:',
    '',
    '| Provider | Security model | Cost ($/MB, 30d avg) | Throughput | Native token | Mainnet since |',
    '|---|---|---|---|---|---|',
    '| **Ethereum DA (blobs)** | Inherits Ethereum (highest) | {{l2_da_ethereum_per_mb}} | Capped by blob target | ETH | March 2024 |',
    '| **EigenDA** | Restaked ETH (slashable) | {{l2_da_eigenda_per_mb}} | High | ETH (restaked) | 2024 |',
    '| **Celestia** | Own PoS validators | {{l2_da_celestia_per_mb}} | High | TIA | October 2023 |',
    '| **Avail** | Own PoS validators | {{l2_da_avail_per_mb}} | High | AVAIL | 2024 |',
    '',
    '**Costs are live 30-day averages from growthepie\'s `/v1/da_metrics/fees_per_mbyte.json` endpoint** (data {{l2_da_data_date}} UTC). Where a value reads "unavailable", growthepie\'s per-MB cost endpoint doesn\'t expose that provider today — see the methodology FAQ.',
    '',
    'The pattern: **Ethereum DA is the conservative, max-security option but the most expensive per byte. The alt-DA providers are typically much cheaper but introduce a separate trust assumption** (the alt-DA layer\'s validators or restakers). L2BEAT classifies chains posting to alt-DA as **Validiums** (ZK + alt-DA) or **Optimiums** (Optimistic + alt-DA) rather than pure rollups, reflecting the extra trust assumption.',

    '# How Data Availability Sampling works',
    '**DAS** is the technical breakthrough that makes high-throughput DA practical. Instead of every node downloading every byte of every block, nodes each download a small random sample. The data is **erasure-coded** so any subset of pieces above a threshold can reconstruct the whole. If enough nodes sample randomly, the network collectively confirms any missing piece would have been detected.',
    '',
    'Celestia shipped DAS first as a production design. Ethereum added it via **PeerDAS (EIP-7594) in Fusaka (December 2025)** — see [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed). PeerDAS is what makes the Fusaka and post-Fusaka blob target increases (target 6 → 14 per block by January 2026) safe at the network level.',

    '# Which Ethereum L2s use which DA?',
    'Most major L2s use **Ethereum DA (blobs)** — Arbitrum, OP Mainnet, Base, zkSync Era, Linea, Scroll, etc. Several chains use **alt-DA** for cost: MegaETH on EigenDA; Manta Network has used Celestia; many Polygon CDK chains can choose between options at deployment.',
    '',
    'Many chains are also **hybrid** — they post critical state to Ethereum and bulk data to alt-DA. growthepie\'s [data availability tracker](https://www.growthepie.com/data-availability) shows the live per-chain DA mapping.',

    '# How to pick a DA provider (if you\'re building an L2)',
    'The answer is rarely "the cheapest" or "the most secure" — it\'s "the right trade-off for the use case":',
    '- **DeFi, settlement, treasury-grade L2s** — Ethereum DA. The premium is worth the strongest possible security guarantee, and DeFi users are sensitive to trust assumptions.',
    '- **Gaming, social, NFT, high-throughput consumer L2s** — alt-DA. The cost difference is meaningful at scale, and the typical use case doesn\'t need Ethereum\'s full security profile.',
    '- **Hybrid chains** — split the difference, posting some data to Ethereum and bulk to alt-DA.',
    '',
    'There\'s no "right" choice — it\'s an engineering trade-off each chain team makes for their specific user base.',

    '# Methodology and data sources',
    "Conceptual material on this page is drawn from the published EIPs (EIP-4844 for blobs, EIP-7594 for PeerDAS), the Celestia / EigenDA / Avail whitepapers, and L2BEAT's DA risk framework. Live per-DA-layer metrics come from growthepie's DA endpoints (`/v1/da_overview.json`, `/v1/da_timeseries.json`, and the per-DA `/v1/da_metrics/*` endpoints).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. Several supporters are DA providers or chains using specific DA providers. This page presents technical facts — provider descriptions follow the providers' own published material and L2BEAT's risk classifications. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [L2BEAT](https://l2beat.com) has detailed DA risk analysis per L2. [ethereum.org's roadmap](https://ethereum.org/en/roadmap/) covers Ethereum's own DA approach. The DA providers' websites — [celestia.org](https://celestia.org), [eigenda.xyz](https://eigenda.xyz), [availproject.org](https://www.availproject.org) — have their own whitepapers and live dashboards.",

  ],
  image: '/quick-bites/ethereum-scaling.webp',
  og_image: '/quick-bites/ethereum-scaling.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'Data Availability (DA) is the guarantee that a chain\'s transaction data is publicly accessible — anyone wanting to reconstruct the chain\'s state can do so. It\'s foundational to how L2s work. The main DA providers for Ethereum L2s are: Ethereum mainnet (via blobs since the Dencun upgrade in March 2024 — maximum security, inherits Ethereum), Celestia (standalone PoS DA chain — separate validator set), EigenDA (built on Ethereum restaking — ETH-backed economic security), and Avail (another standalone modular DA layer). They differ on cost (live per-megabyte values for Celestia and EigenDA shown on the page; Ethereum blob fees tracked separately), throughput, and security model. Live per-DA-layer metrics at growthepie.com/data-availability.',
  related: [],
  author: [
    {
      name: 'Matthias Seidl',
      xUsername: 'web3_data',
    },
  ],
  topics: [
    { icon: 'gtp-data-availability', name: 'Data Availability', url: '/data-availability' },
    { name: 'Blobs', url: '/data-availability' },
    { name: 'Celestia', url: '/data-availability' },
    { name: 'EigenDA', url: '/data-availability' },
    { name: 'Avail', url: '/data-availability' },
    { name: 'EIP-4844', url: '/quick-bites/fusaka' },
    { name: 'PeerDAS', url: '/quick-bites/fusaka' },
  ],
  icon: 'gtp-data-availability',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default whatIsDataAvailability;
