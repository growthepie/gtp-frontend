import { QuickBiteData } from '@/lib/types/quickBites';
import { createQuickBite } from '@/lib/quick-bites/createQuickBite';

const pectraUpgrade: QuickBiteData = createQuickBite({
  title: "Pectra: The People's Upgrade",
  subtitle: "Track the Adoption of Pectras UX + Scaling Improvements",
  shortTitle: "Pectra Upgrade",
  themes: ["scaling"],
  content: [
    "> Fewer clicks, fewer signatures, more blobs. Pectra is an upgrade for everyday users: it makes Ethereum easier and cheaper to use.",

    "# What's in Pectra",
    "- **EIP-7691, more blobs:** cheaper transactions and more room for Layer 2s, which had been running at blob capacity.",
    "- **EIP-7702, smarter wallets:** regular wallets (EOAs) can act as smart accounts, for example to pay gas in other tokens or have fees sponsored.",
    "- **EIP-7251, 7002, 6110, staking upgrades:** validators can hold up to 2,048 ETH instead of 32, so rewards compound, and withdrawals are simpler.",
    "- …plus 6 more EIPs with smaller protocol improvements.",

    "## EIP-7691: More Blobs",
    "The blob target doubled from 3 to 6 and the limit rose from 6 to 9, so Layer 2s get more blobs before the blob fee market kicks in.",
    "The chart shows how close blocks get to the new target. Above it, the cost per blob starts rising (the EIP-1559 mechanism).",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Submitted Blobs per Block",
      subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
      showOnChainTabs: ["ethereum"],
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Blob Count",
          color: "#FFC300",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_count.daily.values",
          dashStyle: "solid" 
        },
        {
          name: "Target",
          color: "#19D9D6",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_target.daily.values",
          dashStyle: "Dash" 
        }
        ],
      },
      height: 400,
      caption: "Ethereum Blob Count per Block vs Target. Data updated daily.",
      seeMetricURL: "https://www.growthepie.com/data-availability"
    }),
    "```",

    "## EIP-7702: Smarter Wallets",
    "EIP-7702 introduces a new transaction type that allows wallets to act as smart accounts. This improves the user experience by enabling wallets to pay network fees with custom gas tokens, delegate transactions, and more.",
    "The following chart shows the adoption of EIP-7702 wallets by visualizing the daily number of Set Code transactions on EVM chains (aka Type 4 transactions).",

    "```chart",
    JSON.stringify({
      type: "column",
      title: "Transactions that trigger smart wallet upgrades and downgrades",
      subtitle: "The number of Set Code transactions on EVM chains (aka Type 4 transactions)",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Ethereum L1",
          color: "#94ABD3",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.ethereum.daily.values",
        },
        {
          name: "Base",
          color: "#2151F5",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.base.daily.values",
        },
        {
          name: "OP Mainnet",
          color: "#FE5468",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.optimism.daily.values",
        },
        {
          name: "Unichain",
          color: "#FF47BB",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.unichain.daily.values",
        },
        {
          name: "Arbitrum",
          color: "#1DF7EF",
          stacking: "normal",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.com/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.arbitrum.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The number of Set Code transactions on EVM chains (aka Type 4 transactions). Data updated daily.",
    }),
    "```",

    "All charts on this page are updated daily so you can track the adoption of the Pectra upgrades over time.",
  ],
  image: "/quick-bites/pectra-upgrade.webp",
  og_image: "/quick-bites/pectra-upgrade.webp",
  date: "2025-05-22",
  related: [],
  author: [{
    name: "Matthias Seidl",
    xUsername: "web3_data"
  },
  {
    name: "Lorenz Lehmann",
    xUsername: "LehmannLorenz"
  }],
  topics: [{
    icon: "ethereum-logo-monochrome",
    color: "#94ABD3",
    name: "Ethereum Mainnet",
    url: "/chains/ethereum"
  },
  {
    icon: "base-logo-monochrome",
    color: "rgb(var(--chains-base))",
    name: "Base Chain",
    url: "/chains/base"
  },
  {
    icon: "optimism-logo-monochrome",
    color: "rgb(var(--chains-op-mainnet))",
    name: "OP Mainnet",
    url: "/chains/optimism"
  },
  {
    icon: "unichain-logo-monochrome",
    color: "rgb(var(--chains-unichain))",
    name: "Unichain",
    url: "/chains/unichain"
  },
  {
    icon: "arbitrum-logo-monochrome",
    color: "rgb(var(--chains-arbitrum-one))",
    name: "Arbitrum One",
    url: "/chains/arbitrum"
  },
  {
    icon: "gtp-da-blobs-number",
    name: "Blob Count",
    url: "/data-availability/blob-count"
  }],
  icon: "ethereum-logo-monochrome"
});

export default pectraUpgrade;
