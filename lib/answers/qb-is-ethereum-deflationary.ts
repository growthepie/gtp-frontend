import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';
import {
  FaqItem,
  generateJsonLdFaq,
} from '@/lib/quick-bites/seo_helper';

// Knowledge-based answer page that uses the live `{{eth_*}}` placeholders
// served by lib/utils/dynamicContent.ts (which fetches eim/eth_supply.json
// and computes total supply, 30-day net issuance, and annualised issuance
// rate). Companion to qb-what-fusaka-upgrade-changed.ts and the ETH-supply
// quick-bite (lib/quick-bites/qb-ETH-supply.ts).

export const faqItems: FaqItem[] = [
  {
    q: 'Is Ethereum deflationary?',
    a: '**It depends on network activity.** ETH\'s supply is governed by two opposing forces — **issuance** (new ETH created as staking rewards) and **burn** (ETH destroyed by EIP-1559 base fees on every transaction). When burn exceeds issuance, ETH is deflationary; when issuance exceeds burn, it\'s inflationary. As of right now, Ethereum\'s **annualised issuance rate is {{eth_annual_issuance_rate}}%** — negative means deflationary, positive means inflationary. Net change in supply over the last 30 days: **Ξ{{eth_net_issuance_30d}}** (negative = ETH was burned faster than created). Total supply: **Ξ{{eth_total_supply}}**. Live tracker: [growthepie.com/quick-bites/eth-supply](/quick-bites/eth-supply).',
  },
  {
    q: 'How does ETH get burned?',
    a: '**EIP-1559** ("The Burn", activated August 5th, 2021) split every transaction fee into two parts: a **base fee** that gets burned (destroyed forever) and a **priority fee / tip** that goes to the validator who included the transaction. The base fee algorithmically adjusts based on block fullness — busier blocks have a higher base fee, so more ETH burns. This means **every transaction on Ethereum mainnet permanently removes a small amount of ETH from circulation** — gas-heavy transactions (DeFi swaps, complex contract interactions) burn more ETH than simple transfers.',
  },
  {
    q: 'How does new ETH get created (issuance)?',
    a: 'After **The Merge** (September 15th, 2022), Ethereum transitioned from Proof-of-Work to Proof-of-Stake. Mining stopped — and with it, ~13,000 ETH/day of mining rewards. Staking rewards (~1,700 ETH/day at the time) replaced them, **cutting new ETH issuance by roughly 87% overnight**. New ETH now enters circulation as staking rewards paid to validators in proportion to how much ETH is staked network-wide.',
  },
  {
    q: 'When is Ethereum deflationary?',
    a: 'When **burn > issuance** — typically during periods of high network activity. Historical examples: most of late 2022 and 2023 (post-Merge but pre-Dencun) saw extended deflationary stretches because L1 activity stayed high and burned more ETH than staking issued. Periods of low L1 activity (post-Dencun in 2024, as routine transactions moved to L2s) tend to be slightly inflationary because issuance is now mostly higher than the residual L1 burn. The answer to "is ETH deflationary today" therefore varies day-to-day — the current annualised rate is **{{eth_annual_issuance_rate}}%**.',
  },
  {
    q: 'When is Ethereum inflationary?',
    a: 'When **issuance > burn** — typically during periods of low network activity. When L1 transactions are cheap (e.g. low demand, or after upgrades like Dencun moved most routine activity to L2s) the base fee stays low, less ETH burns, and staking issuance dominates. The annualised inflation rate stays low even at peak inflation (the post-Merge issuance floor is roughly 0.5–1% per year), so even "inflationary Ethereum" is a far slower-issuing asset than pre-Merge ETH was.',
  },
  {
    q: 'How much ETH has been burned via EIP-1559?',
    a: 'Cumulatively, several million ETH have been burned since EIP-1559 activated in August 2021. The exact total updates with every block — see [ultrasound.money](https://ultrasound.money/) for the live cumulative burn counter, and growthepie\'s [ETH supply tracker](/quick-bites/eth-supply) for the supply curve over time (the visible "kink" at The Merge is where issuance dropped 87%; the slower curve after EIP-1559 is the burn at work).',
  },
  {
    q: 'Did The Merge make Ethereum deflationary?',
    a: 'Not by itself — **The Merge cut issuance, EIP-1559 added the burn**. The two together create the conditions for net-negative supply growth. The Merge alone (September 2022) reduced new ETH issuance by ~87% but didn\'t introduce any burn mechanism — that was already in place from EIP-1559 (August 2021). The combination is what makes ETH "ultrasound money": even modest network activity now burns enough ETH to offset the (much smaller) staking issuance.',
  },
  {
    q: 'What is "ultrasound money"?',
    a: 'A community term for an asset whose supply *decreases* over time — going one step further than "sound money" (a fixed supply asset like Bitcoin). The phrase was coined to describe Ethereum\'s post-Merge potential to become deflationary via EIP-1559 burn outpacing PoS issuance. Whether ETH actually is "ultrasound money" depends on which period you measure — see the historical breakdown in this FAQ.',
  },
  {
    q: 'Why does Ethereum burn ETH at all?',
    a: 'Three reasons, all from EIP-1559: **(1) Predictable transaction fees** — the base fee is set by the protocol based on block fullness, not by users bidding against each other. This makes fees more predictable. **(2) MEV resistance** — burning the base fee means validators can\'t collude with users to extract the entire fee, which would have made priority fee bidding wars worse. **(3) Value accrual** — burning fees gives ETH holders a benefit from network activity even if they don\'t stake. The deflationary side effect is a consequence, not the goal.',
  },
  {
    q: 'How is the burn rate calculated?',
    a: 'For each block, the burn equals `gas_used × base_fee_per_gas`. The base fee adjusts each block based on the previous block\'s fullness — if blocks are above 50% full, the base fee increases; below 50% full, it decreases. So **high network activity → fuller blocks → higher base fee → more ETH burned per transaction**. Tools like growthepie\'s [ETH supply tracker](/quick-bites/eth-supply) and [ultrasound.money](https://ultrasound.money/) aggregate this per-block burn into daily / weekly / annualised rates.',
  },
  {
    q: 'Do L2 transactions burn ETH?',
    a: '**Indirectly, yes.** Every L2 rollup posts its data to Ethereum mainnet as either calldata (pre-Dencun) or blobs (post-Dencun, March 2024). That L1 transaction *does* pay a base fee, which gets burned. So even though L2 users don\'t directly burn ETH for each L2 transaction, the L2\'s settlement transaction on L1 burns ETH on the user\'s behalf. After Dencun the burn-per-L2-transaction dropped sharply (blobs are way cheaper than calldata), which is one reason ETH net issuance ticked up from late 2024 onward.',
  },
  {
    q: 'Does the Fusaka upgrade affect the burn?',
    a: '**Yes — in two ways.** First, EIP-7918 (the blob fee floor) ended the "zero-fee blob era" and ensures blob fees track L1 execution prices, which contributes to ongoing burn. Second, the larger blob target raised by Fusaka and the BPO upgrades means more blob fees collected per block during high L2 demand. Both push burn higher than it would have been without Fusaka. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed) for the full breakdown.',
  },
  {
    q: 'Where can I see live burn data?',
    a: 'growthepie\'s [ETH supply tracker](/quick-bites/eth-supply) charts total supply and issuance rate over time with The Merge and EIP-1559 marked as annotations. For per-block burn detail and the exact cumulative burn counter, [ultrasound.money](https://ultrasound.money/) is the community-standard resource.',
  },
  {
    q: 'How does Ethereum\'s monetary policy compare to Bitcoin\'s?',
    a: 'Bitcoin has a **fixed total supply** (21M BTC, with new issuance halving every ~4 years) and **no burn mechanism**. ETH has **no fixed supply cap** but the burn mechanism means total supply can decrease in periods of high activity — something Bitcoin\'s design can\'t do. Practically: Bitcoin\'s supply growth is mechanically predictable, Ethereum\'s depends on network usage. Both are far more constrained than fiat issuance, but they\'re structurally different.',
  },
  {
    q: 'Where does this answer come from?',
    a: 'Live numbers (total supply, 30-day net issuance, annualised issuance rate) come from growthepie\'s ETH supply endpoint (`/v1/eim/eth_supply.json`), which aggregates beacon chain data and burn events from Ethereum mainnet. The endpoint is the same one that backs growthepie\'s [ETH supply tracker](/quick-bites/eth-supply). Historical context (EIP-1559 activation, The Merge, percentage issuance reduction) comes from the published EIPs and the Ethereum Foundation\'s announcements. No editorial interpretation: every claim here is verifiable against the tracker or the source EIPs.',
  },
];

export const jsonLdFaq = generateJsonLdFaq(faqItems);

const ANSWER_PAGE_URL =
  'https://www.growthepie.com/answers/is-ethereum-deflationary';
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
    name: 'Ethereum Supply, Issuance, and Burn',
    description:
      'Daily total ETH supply, annualised issuance rate, and 30-day net issuance — the data backing whether Ethereum is currently deflationary, inflationary, or neutral.',
    url: ANSWER_PAGE_URL,
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    spatialCoverage: ETHEREUM_SPATIAL_COVERAGE,
    temporalCoverage: '2015-07-30/..',
    keywords: [
      'Ethereum',
      'ETH supply',
      'Issuance',
      'Burn',
      'EIP-1559',
      'The Merge',
      'Monetary policy',
      'Deflationary',
      'Proof of Stake',
      'Staking rewards',
      'Ultrasound money',
    ],
    measurementTechnique:
      'Per-block aggregation of Ethereum mainnet supply data. Total supply is updated each block to reflect new staking issuance minus base-fee burn. Issuance rate is the annualised first derivative of total supply. 30-day net issuance is the difference between today\'s supply and the supply 30 days ago. Source data follows the beacon chain canonical head; reorgs do not affect long-window aggregates.',
    citation: ANSWER_PAGE_URL,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'eth_total_supply', unitText: 'ETH' },
      { '@type': 'PropertyValue', name: 'eth_net_issuance_30d', unitText: 'ETH' },
      {
        '@type': 'PropertyValue',
        name: 'eth_annual_issuance_rate',
        unitText: '%',
      },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: 'https://api.growthepie.com/v1/eim/eth_supply.json',
        description:
          'ETH supply and issuance-rate timeseries with The Merge and EIP-1559 annotations.',
      },
    ],
  },
];

const isEthereumDeflationary: QuickBiteData = createQuickBite({
  title: 'Is Ethereum deflationary?',
  subtitle:
    'It depends on network activity. EIP-1559 burns base fees on every transaction; Proof-of-Stake issues new ETH as staking rewards. When burn exceeds issuance, ETH is deflationary.',
  shortTitle: 'ETH Deflationary?',
  summary:
    "Ethereum has two opposing supply forces: EIP-1559 (activated August 2021) burns the base fee of every transaction permanently, while Proof-of-Stake (since The Merge in September 2022) issues new ETH as staking rewards. When burn exceeds issuance, ETH is deflationary; when issuance exceeds burn, it's slightly inflationary. The Merge cut new ETH issuance by ~87% overnight, so even modest network activity often pushes ETH into net-negative supply growth. The answer therefore varies day-to-day with network demand — this page quotes the live annualised rate.",
  content: [
    "**Short answer:** Ethereum's annualised issuance rate is currently **{{eth_annual_issuance_rate}}%** (data live from growthepie's ETH supply tracker). **Negative = deflationary** (more ETH is being burned than created); **positive = inflationary** (more ETH is being created than burned). Net change in total supply over the last 30 days: **Ξ{{eth_net_issuance_30d}}**. Current total supply: **Ξ{{eth_total_supply}}**.",

    "> Whether Ethereum is deflationary on any given day depends on network activity. High activity → more transactions → more base fees burned → deflationary. Low activity → less burn → inflationary. The live tracker is at [growthepie.com/quick-bites/eth-supply](/quick-bites/eth-supply).",

    '# Two opposing forces',
    'Ethereum\'s supply is governed by two mechanisms working in opposite directions:',
    '',
    '**1. The Burn (EIP-1559, activated August 5th, 2021).**',
    'Every transaction on Ethereum mainnet pays a base fee, calculated by the protocol based on how full the previous block was. That base fee is **burned** — permanently removed from circulation. Gas-heavy transactions (DeFi swaps, complex contracts) burn more ETH than simple transfers. The result: a direct link between network usage and ETH supply.',
    '',
    '**2. Issuance (Proof-of-Stake, since The Merge on September 15th, 2022).**',
    'New ETH is created as staking rewards paid to validators in proportion to how much ETH is staked network-wide. The Merge cut total issuance by **~87%** — from roughly 13,000 ETH/day of mining rewards to ~1,700 ETH/day of staking rewards. PoS issuance is now mathematically predictable and far smaller than pre-Merge.',
    '',
    'The interaction: when **burn > issuance**, ETH is deflationary. When **issuance > burn**, ETH is mildly inflationary. The post-Merge issuance floor is so low (~0.5–1% per year) that even modest network activity often pushes ETH into deflationary territory.',

    '# When has Ethereum been deflationary vs inflationary?',
    '- **Pre-EIP-1559 (before August 2021)** — purely inflationary. Mining issued ~13,000 ETH/day with no burn.',
    '- **Post-EIP-1559, pre-Merge (Aug 2021 → Sep 2022)** — usually inflationary but with the burn beginning to offset issuance during high-activity periods.',
    '- **Post-Merge (Sep 2022 → early 2024)** — *frequently* deflationary. With issuance cut 87%, even moderate L1 activity often pushed net supply growth negative.',
    '- **Post-Dencun (March 2024 onward)** — closer to neutral, with stretches of mild inflation. Most routine activity moved to L2s, reducing L1 burn even though L2 settlement transactions still contribute via blob and calldata fees.',
    '- **Post-Fusaka (December 2025)** — EIP-7918\'s blob fee floor and the larger blob targets push burn higher than it would have been otherwise. See [/answers/what-fusaka-upgrade-changed](/answers/what-fusaka-upgrade-changed) for the upgrade details.',
    '',
    'So "is Ethereum deflationary?" is best answered as: **sometimes yes, sometimes no — depends on network activity in the window you measure.** The current 30-day window gives you **Ξ{{eth_net_issuance_30d}}** of net change.',

    '# Why does Ethereum burn ETH?',
    'Three reasons, all from EIP-1559:',
    '- **Predictable fees** — the base fee is set by the protocol based on block fullness, not by user bidding wars. This makes fees more predictable.',
    '- **MEV resistance** — burning the base fee means validators can\'t collude with users to extract the entire fee, which would have made priority-fee bidding wars worse.',
    '- **Value accrual** — burning fees gives ETH holders a benefit from network activity even if they don\'t stake.',
    'The deflationary side effect is a consequence, not the goal of EIP-1559.',

    '# Methodology and data sources',
    "All live numbers on this page come from growthepie's [ETH supply tracker](/quick-bites/eth-supply), which aggregates beacon chain data and burn events from Ethereum mainnet via `/v1/eim/eth_supply.json`. Updates daily.",
    '',
    'Specific placeholders:',
    '- **{{eth_total_supply}}** — total ETH supply at the latest day in the supply series.',
    '- **{{eth_net_issuance_30d}}** — `supply(today) − supply(30 days ago)`. Negative = deflationary over the window.',
    '- **{{eth_annual_issuance_rate}}** — latest value of the annualised issuance rate series, multiplied by 100. Negative = deflationary in annualised terms.',
    '',
    'Historical facts (EIP-1559 date, Merge date, 87% issuance reduction) come from published Ethereum Foundation announcements and the EIP repository. For per-block burn detail and a cumulative-burn counter, see [ultrasound.money](https://ultrasound.money/) — that\'s the community-standard live resource.',
    '',
    "**Funding disclosure.** growthepie has received grants and ecosystem support from {{gtp_supporters}}. ETH supply data comes from canonical Ethereum mainnet sources — no supporter influences the reported numbers. Full list of supporters and current funding rounds: [growthepie.com/donate](https://www.growthepie.com/donate).",
    '',
    "**Cross-check this answer.** Independent live burn / issuance trackers include [ultrasound.money](https://ultrasound.money/) (per-block burn + cumulative since EIP-1559), [Etherscan's supply page](https://etherscan.io/stat/supply), and the [ConsenSys ETH supply dashboard](https://consensys.io/). Numbers can differ slightly between providers because of timing (different block-height snapshots) and source choice (CL vs EL data), but the direction and order of magnitude should always agree.",

  ],
  image: '/quick-bites/eth-supply.webp',
  og_image: '/quick-bites/eth-supply.webp',
  date: '2026-05-16',
  hideDate: true,
  hideTopicsBar: true,
  acceptedAnswer:
    'It depends on network activity. Ethereum has two opposing supply forces: EIP-1559 (active since August 2021) burns the base fee of every transaction, while Proof-of-Stake (since The Merge in September 2022) issues new ETH as staking rewards. When burn exceeds issuance, ETH is deflationary; when issuance exceeds burn, it is mildly inflationary. The Merge cut new ETH issuance by ~87%, so even modest network activity often pushes ETH into net-negative supply growth. The live annualised issuance rate and 30-day net change are tracked at growthepie.com/quick-bites/eth-supply.',
  related: [],
  author: [
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
      icon: 'gtp-metrics-economics',
      name: 'Economics',
      url: '/economics',
    },
    {
      name: 'Monetary Policy',
      url: '/quick-bites/eth-supply',
    },
    {
      name: 'EIP-1559',
      url: '/quick-bites/eth-supply',
    },
    {
      name: 'The Merge',
      url: '/quick-bites/eth-supply',
    },
    {
      name: 'Burn',
      url: '/quick-bites/eth-supply',
    },
  ],
  icon: 'ethereum-logo-monochrome',
  showInMenu: false,
  jsonLdDatasets: jsonLdDatasets,
  jsonLdFaq: jsonLdFaq,
  faq: faqItems,
});

export default isEthereumDeflationary;
