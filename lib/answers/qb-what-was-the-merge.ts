import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page about The Merge. Uses the same `{{eth_*}}`
// placeholders served by dynamicContent.ts (eth_supply.json) to make the
// "is Ethereum deflationary now" and "current issuance rate" numbers live.
// Companion to qb-is-ethereum-deflationary.ts.

export const faqItems: FaqItem[] = [
  {
    q: 'What was The Merge and how did it change Ethereum?',
    a: '**The Merge** activated on **September 15th, 2022** and transitioned Ethereum from **Proof-of-Work (PoW)** to **Proof-of-Stake (PoS)** — replacing miners with validators who stake ETH to secure the network. The three biggest immediate changes: **new ETH issuance dropped ~87%** (from ~13,000 ETH/day of mining rewards to ~1,700 ETH/day of staking rewards), **energy consumption fell ~99.95%** (no more electricity-intensive PoW mining), and **the conditions for ETH deflation were created** — combined with EIP-1559\'s base-fee burn (already active since August 2021), the lower issuance meant network activity could now burn more ETH than the protocol creates. Current annualised issuance rate: **{{eth_annual_issuance_rate}}%**.',
  },
  {
    q: 'When did The Merge happen?',
    a: '**September 15th, 2022**, at 06:42 UTC, at terminal total difficulty of 58,750,000,000,000,000,000,000 (the trigger used to detect the transition). It was the culmination of seven years of research and development, having been on Ethereum\'s roadmap since the project\'s earliest days. The mainnet beacon chain (Ethereum\'s PoS consensus layer) had launched in December 2020; The Merge connected it to the execution layer that users interact with.',
  },
  {
    q: 'What was Ethereum like before The Merge?',
    a: '**Proof-of-Work, like Bitcoin.** Specialised mining hardware (GPUs and ASICs) competed to find a hash satisfying the network\'s difficulty target. The miner who found the hash got the block reward — newly-issued ETH plus all transaction fees in the block. Mining was energy-intensive (Ethereum mining consumed ~78 TWh/year at peak — roughly the electricity use of a mid-sized country), and ETH issuance was high (~13,000 ETH/day, ~5M ETH/year).',
  },
  {
    q: 'What is Ethereum like after The Merge?',
    a: '**Proof-of-Stake.** Validators stake ETH (32 ETH minimum per validator, raised to optional 2,048 ETH in the Pectra upgrade) and are pseudorandomly selected to propose blocks. Honest validators earn staking rewards proportional to their stake; dishonest validators get **slashed** (lose part of their stake). No mining hardware, ~99.95% less energy consumption, ~87% less new ETH issuance, and a foundation for further protocol upgrades (sharding, faster slot times) that PoW couldn\'t support.',
  },
  // ----- Why -----
  {
    q: 'Why did Ethereum switch to Proof-of-Stake?',
    a: 'Three main reasons. **(1) Energy.** PoW mining is environmentally indefensible at scale — Ethereum at peak used more electricity than several countries. **(2) Economics.** PoW rewards external hardware suppliers and energy producers; PoS rewards ETH holders directly, keeping the economic flywheel inside the network. **(3) Scaling.** PoS is a prerequisite for further protocol upgrades like data availability sharding (which came with Dencun in 2024) and the broader rollup-centric roadmap. PoW would have been a hard ceiling on Ethereum\'s evolution.',
  },
  // ----- Issuance & deflation -----
  {
    q: 'How did The Merge affect ETH issuance?',
    a: 'New ETH issuance dropped **~87% overnight** — from ~13,000 ETH/day of mining rewards to ~1,700 ETH/day of staking rewards. Combined with **EIP-1559** (which had already been burning the base fee of every transaction since August 2021), this created the conditions for **net-deflationary ETH**: even modest network activity could now burn more ETH than the protocol issues. Current annualised issuance rate (live): **{{eth_annual_issuance_rate}}%**. Net change in ETH supply over the last 30 days: **Ξ{{eth_net_issuance_30d}}**. See [/answers/is-ethereum-deflationary](/answers/is-ethereum-deflationary).',
  },
  {
    q: 'Is Ethereum deflationary because of The Merge?',
    a: '**The Merge created the conditions but didn\'t guarantee deflation.** It cut issuance by 87% but didn\'t add any burn mechanism — that was already there from EIP-1559 (August 2021). The combination is what makes net-deflation possible: low issuance + active burn. Whether ETH is net-deflationary on any given day still depends on network activity. High activity (DeFi, peak L1 usage) → more burn → deflationary. Low activity → less burn → mildly inflationary. As of right now the annualised rate is **{{eth_annual_issuance_rate}}%** (negative = deflationary, positive = inflationary).',
  },
  // ----- Energy / environment -----
  {
    q: 'How much energy did The Merge save?',
    a: 'Approximately **99.95% reduction** in Ethereum\'s electricity consumption. Pre-Merge Ethereum mining used roughly 78 TWh/year at peak — comparable to the electricity consumption of countries like Chile or Austria. Post-Merge, Ethereum\'s entire validator infrastructure uses on the order of 0.01 TWh/year. The environmental case for Ethereum changed completely with The Merge: from "one of the largest electricity consumers on Earth" to "energy footprint of a mid-sized data centre".',
  },
  // ----- What didn\'t change -----
  {
    q: 'What did The Merge NOT change?',
    a: 'Critically: **transaction fees, transaction throughput, and existing smart contracts all stayed the same.** The Merge was purely a consensus-layer change — switching from miners to validators. It did **not** scale Ethereum (that\'s what L2s and the rollup-centric roadmap do); it did **not** lower gas fees directly (that\'s what Dencun and Fusaka eventually did via blob scaling for L2s); and it did **not** require any user or developer action. Existing wallets, contracts, and applications continued working without modification.',
  },
  // ----- Staking -----
  {
    q: 'How does staking work after The Merge?',
    a: 'Validators **stake 32 ETH** (or, after Pectra in May 2025, up to 2,048 ETH per consolidated validator) and run validator software 24/7. The protocol randomly selects validators to **propose** each block (every 12 seconds) and to **attest** to other validators\' blocks. Honest behaviour earns staking rewards (currently ~3–5% APY on the staked ETH); dishonest behaviour — equivocating on attestations or going offline for extended periods — gets **slashed**, removing part of the validator\'s stake. As of 2026, ~30M+ ETH is staked across hundreds of thousands of validators.',
  },
  {
    q: 'Can anyone become an Ethereum validator?',
    a: '**Yes** — staking is permissionless. You need 32 ETH minimum (or you can join a staking pool with less, or use a liquid staking token like stETH or rETH). You also need to run validator software reliably; downtime gets penalised. Pectra (May 2025) added the option to run a single consolidated validator with up to 2,048 ETH staked — useful for institutions and large solo stakers but optional. See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed) for the Pectra staking-upgrade details.',
  },
  // ----- Historical -----
  {
    q: 'How long did The Merge take to develop?',
    a: 'Roughly **seven years from research to mainnet**. Vitalik Buterin first proposed PoS for Ethereum in 2014 (before mainnet launched). The Casper FFG research program ran from 2017. The Beacon Chain (PoS consensus layer) launched in December 2020 and ran in parallel with the existing PoW chain for ~21 months. The Merge in September 2022 was the moment the two chains joined — execution moved off PoW and onto the Beacon Chain\'s PoS consensus. It\'s one of the largest live-system upgrades in software engineering history.',
  },
  // ----- Successive upgrades -----
  {
    q: 'What major upgrades came after The Merge?',
    a: '**Shanghai/Capella** (April 2023) — enabled staked-ETH withdrawals. **Dencun** (March 2024) — introduced blobs (EIP-4844), the foundation of cheap L2 fees. **Pectra** (May 2025) — doubled blob capacity, introduced EIP-7702 smart-account features, raised the validator effective stake cap to 2,048 ETH. See [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed). **Fusaka** (December 2025) — tripled blob capacity, added PeerDAS, introduced the EIP-7918 blob fee floor. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed). Each of these built on the foundation The Merge established.',
  },
  // ----- Methodology -----
  {
    q: 'Where do these numbers come from?',
    a: 'Historical facts (Merge activation date, 87% issuance reduction, 99.95% energy reduction) come from the Ethereum Foundation\'s post-Merge analysis and public on-chain data. Live numbers — current annualised issuance rate, net 30-day supply change — come from growthepie\'s ETH supply tracker (`/v1/eim/eth_supply.json`), which aggregates beacon chain data and burn events daily. For per-block burn detail and a cumulative-burn counter, see [ultrasound.money](https://ultrasound.money/).',
  },
  {
    q: 'Where can I see live data on The Merge\'s effects?',
    a: 'growthepie\'s [ETH supply tracker](/quick-bites/eth-supply) charts total supply and issuance rate over time, with **The Merge** explicitly marked as an annotation on the chart so you can see the issuance step-down visually. [ultrasound.money](https://ultrasound.money/) tracks live ETH burn and projected issuance. growthepie\'s [is-ethereum-deflationary answer](/answers/is-ethereum-deflationary) walks through the post-Merge supply dynamics in detail.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/what-was-the-merge';
const ORG_ID = 'https://www.growthepie.com/#organization';
const ETHEREUM_SPATIAL_COVERAGE = {
  '@type': 'Place',
  name: 'Ethereum blockchain ecosystem',
} as const;

export const jsonLdDatasets = [
  {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': 'https://www.growthepie.com/datasets/eth-supply',
    name: 'Ethereum Supply, Issuance, and Burn (post-Merge)',
    description:
      'Daily total ETH supply, annualised issuance rate, and 30-day net change. Shows the post-Merge step-down in issuance visually and quantitatively.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    temporalCoverage: '2015-07-30/..',
    keywords: [
      'Ethereum',
      'The Merge',
      'Proof of Stake',
      'Proof of Work',
      'ETH supply',
      'Issuance',
      'Monetary policy',
      'Validators',
      'EIP-1559',
    ],
    citation: ANSWER_PAGE_URL,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/eim/eth_supply.json',
        description: 'ETH supply and issuance-rate timeseries with The Merge marked as annotation.',
      },
    ],
  },
];

const whatWasTheMerge: QuickBiteData = createQuickBite({
  title: 'What was The Merge and how did it change Ethereum?',
  subtitle:
    'A direct answer: The Merge transitioned Ethereum from Proof-of-Work to Proof-of-Stake on Sep 15, 2022, cutting ETH issuance ~87%, energy use ~99.95%, and setting up the conditions for ETH deflation.',
  shortTitle: 'The Merge',
  summary:
    "The Merge activated on September 15, 2022 and transitioned Ethereum from Proof-of-Work (miners) to Proof-of-Stake (validators). Three immediate effects: new ETH issuance dropped ~87% (~13,000 ETH/day mining rewards → ~1,700 ETH/day staking rewards), energy consumption fell ~99.95% (no more mining hardware), and the conditions for ETH deflation were created — combined with EIP-1559's burn already in place, net-negative ETH issuance became possible during periods of high network activity. The Merge is one of the largest live-system upgrades in software engineering history.",
  content: [
    "**Short answer:** The Merge activated on **September 15, 2022**, transitioning Ethereum from Proof-of-Work to Proof-of-Stake. **Issuance dropped ~87%, energy use dropped ~99.95%**, and combined with EIP-1559's burn (already active), the conditions for **ETH net-deflation** were created. Current annualised issuance rate: **{{eth_annual_issuance_rate}}%** (negative = deflationary). Total supply: **Ξ{{eth_total_supply}}**.",

    "> Live numbers update daily from growthepie's [ETH supply tracker](/quick-bites/eth-supply), which marks The Merge explicitly on the chart so the issuance step-down is visible.",

    '# What changed',
    'Three big things, all immediate:',
    '',
    '**1. New ETH issuance: down ~87%.** Mining rewards (~13,000 ETH/day) were replaced with staking rewards (~1,700 ETH/day). The protocol now issues new ETH only as compensation for validators securing the network, not as compensation for energy-intensive computation.',
    '',
    '**2. Energy consumption: down ~99.95%.** Pre-Merge Ethereum mining consumed roughly **78 TWh/year** at peak — comparable to Chile or Austria. Post-Merge, the entire validator infrastructure uses on the order of **0.01 TWh/year**. The environmental case for Ethereum changed completely.',
    '',
    '**3. Conditions for net-deflation created.** EIP-1559 (active since August 2021) was already burning the base fee of every transaction. The Merge cut new issuance enough that, on busy network days, burn now routinely exceeds issuance — making **ETH net-deflationary** for the first time. See [/answers/is-ethereum-deflationary](/answers/is-ethereum-deflationary).',

    '# What didn\'t change',
    'Critically:',
    '- **Transaction fees** stayed the same. The Merge didn\'t lower gas costs.',
    '- **Throughput** stayed the same. The Merge didn\'t scale Ethereum — that\'s the rollup-centric roadmap.',
    '- **Smart contracts** stayed the same. Every existing contract continued working without modification.',
    '- **Users and developers** didn\'t need to do anything. Wallets, dApps, and integrations kept working transparently.',
    '',
    'The Merge was a **consensus-layer change** — replacing miners with validators. It didn\'t touch the execution layer that users interact with.',

    '# Proof-of-Work vs Proof-of-Stake — quick comparison',
    '',
    '| Aspect | Pre-Merge (PoW) | Post-Merge (PoS) |',
    '|---|---|---|',
    '| **Block producer** | Miner who finds the right hash | Validator pseudorandomly selected |',
    '| **Hardware needed** | GPUs or ASICs | Standard server / consumer hardware |',
    '| **Energy use** | ~78 TWh/year at peak | ~0.01 TWh/year |',
    '| **New ETH per day** | ~13,000 ETH | ~1,700 ETH |',
    '| **Validator entry cost** | Buy mining hardware | Stake 32 ETH (or up to 2,048 post-Pectra) |',
    '| **Slashing risk** | None (just wasted electricity) | Yes — dishonest validators lose stake |',
    '| **Block time** | ~13s average (variable) | 12s (fixed slots) |',
    '',

    '# Why did Ethereum switch?',
    'Three reasons:',
    '- **Energy.** PoW mining was environmentally indefensible at Ethereum\'s scale. The optics and ESG case were unsustainable.',
    '- **Economics.** PoW rewards external hardware suppliers and electricity producers. PoS keeps the economic flywheel internal to ETH holders.',
    '- **Scaling roadmap.** Future Ethereum upgrades (data availability sharding via Dencun, the broader rollup-centric roadmap, PeerDAS via Fusaka) needed PoS as a foundation. PoW would have been a hard ceiling on what Ethereum could become.',

    '# Staking after The Merge',
    'Validators **stake 32 ETH** (or, after Pectra in May 2025, up to 2,048 ETH per consolidated validator — see [/answers/what-pectra-upgrade-changed](/answers/what-pectra-upgrade-changed)) and run validator software 24/7. The protocol randomly selects validators to **propose** each block (every 12 seconds) and **attest** to other validators\' blocks.',
    '',
    'Honest validators earn staking rewards (~3–5% APY on the staked ETH today). Dishonest ones get **slashed** — losing part of their stake. As of 2026, ~30M+ ETH is staked across hundreds of thousands of validators. Staking is permissionless — anyone with 32 ETH can run a validator, and pools/liquid staking tokens (stETH, rETH) let smaller holders participate.',

    '# The seven-year journey',
    "The Merge was the culmination of work that started in 2014 — before Ethereum mainnet had even launched. The major milestones:",
    '- **2014** — Vitalik Buterin proposes PoS for Ethereum',
    '- **2017** — Casper FFG research begins in earnest',
    '- **December 2020** — Beacon Chain (PoS consensus) launches alongside existing PoW chain',
    '- **August 2021** — EIP-1559 (the burn) activates — sets up half of what makes The Merge transformative',
    '- **September 15, 2022** — The Merge: execution moves off PoW and onto Beacon Chain PoS',
    '',
    'It\'s one of the largest **live-system upgrades** in software engineering history — switching the consensus mechanism of a $200B+ network without any downtime.',

    '# What came after',
    '**Shanghai/Capella (April 2023)** — enabled withdrawals of staked ETH. Before this, stakers could only deposit, not withdraw. **Dencun (March 2024)** — introduced blobs (EIP-4844), the foundation of cheap L2 fees. **Pectra (May 2025)** — doubled blob capacity, introduced EIP-7702 smart accounts, raised the validator stake cap. **Fusaka (December 2025)** — tripled blob capacity, added PeerDAS, introduced the EIP-7918 blob fee floor.',
    '',
    'Each of these built on the foundation The Merge established. PoS was the prerequisite for the rollup-centric scaling roadmap that defines Ethereum today.',

    '# Methodology and data sources',
    "Historical facts (Merge activation date, 87% issuance reduction, 99.95% energy reduction) come from the Ethereum Foundation's post-Merge analysis and publicly verifiable on-chain data. Live numbers — total supply, current annualised issuance rate, net 30-day change — come from growthepie's [ETH supply tracker](/quick-bites/eth-supply) (`/v1/eim/eth_supply.json`), updated daily. For per-block burn detail and a live cumulative-burn counter, see [ultrasound.money](https://ultrasound.money/).",
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. The Merge is an Ethereum protocol event — supporter relationships don't affect the description. Full list of supporters: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** [ethereum.org's Merge page](https://ethereum.org/en/roadmap/merge/) is the canonical Ethereum Foundation reference. [ultrasound.money](https://ultrasound.money/) tracks live post-Merge supply dynamics. [Etherscan](https://etherscan.io/) and [Beaconcha.in](https://beaconcha.in/) show live validator and staking data.",

  ],
  image: '/quick-bites/eth-supply.webp',
  og_image: '/quick-bites/eth-supply.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'The Merge activated on September 15, 2022 and transitioned Ethereum from Proof-of-Work (miners) to Proof-of-Stake (validators staking ETH). Three immediate effects: new ETH issuance dropped ~87% (from ~13,000 ETH/day of mining rewards to ~1,700 ETH/day of staking rewards), energy consumption fell ~99.95% (no more mining hardware), and the conditions for ETH deflation were created — combined with EIP-1559\'s base-fee burn already in place, net-negative ETH issuance became possible during periods of high network activity. The Merge did NOT change transaction fees, throughput, or smart contracts — it was a pure consensus-layer change. It\'s widely regarded as one of the largest live-system upgrades in software engineering history.',
  related: [],
  author: [
    {
      name: 'Lorenz Lehmann',
      xUsername: 'LehmannLorenz',
    },
  ],
  topics: [
    { icon: 'ethereum-logo-monochrome', name: 'Ethereum Mainnet', url: '/chains/ethereum' },
    { icon: 'gtp-metrics-economics', name: 'Economics', url: '/economics' },
    { name: 'The Merge', url: '/quick-bites/eth-supply' },
    { name: 'Proof of Stake', url: '/quick-bites/eth-supply' },
    { name: 'Staking', url: '/quick-bites/eth-supply' },
    { name: 'EIP-1559', url: '/quick-bites/eth-supply' },
  ],
  icon: 'ethereum-logo-monochrome',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default whatWasTheMerge;
