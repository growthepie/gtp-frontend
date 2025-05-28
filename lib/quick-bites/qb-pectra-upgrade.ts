import { QuickBiteData } from '@/lib/types/quickBites';

const pectraUpgrade: QuickBiteData = {
  title: "Pectra: The People's Upgrade",
  subtitle: "Track the Adoption of Pectras UX + Scaling Improvements",
  content: [
    "> Less clicks, less signatures, more Blobs. Many past Ethereum upgrades focused on technical improvements, but Pectra is different. It aims to enhance the user experience for everyday users, making it easier and cheaper to interact with the Ethereum ecosystem.",

    "## What is part of the Pectra upgrade?",
    "Pectra introduces several key features designed to simplify the user experience:",
    "- **EIP-7691: Boost Rollups through more Blobs** - Rollups have been operating at Blob capacity for a while. Now we get more Blobs! This means cheaper transactions and more space for Rollups.",
    "- **EIP-7702: Smarter Wallets** - Enables wallets (EOAs) to act as smart accounts, unlocking features like sponsorship, delegation transactions, paying gas in other tokens, and much more.",
    "- **EIP-7252, 7002, 6110: ETH Staking Upgrades** - The validator's effective staking limit was raised from 32 ETH to 2,048 ETH, meaning your rewards can compound. The withdrawal process is simplified - simpler is better.",
    "...and 6 more EIPs that include various improvements to the Ethereum protocol.",

    "## EIP-7691: More Blobs",
    "The Blob target was doubled from 3 to 6, and the limit was raised from 6 to 9. This means more blobs for Layer 2s and it takes longer for the Blob fee market to kick in.",
    "The following chart shows how close we are to the new Blob target. When the number of blobs submitted per block exceeds the target, the Blob fee market will kick in and increase the cost per blob (using the EIP-1559 mechanism).",

    "```chart",
    JSON.stringify({
      type: "line",
      title: "Submitted Blobs per Block",
      subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
      stacking: "normal",
      showXAsDate: true,
      dataAsJson: {
        meta: [{
          name: "Blob Count",
          color: "#FFC300",
          xIndex: 0,
          yIndex: 1,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
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
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.ethereum_blob_target.daily.values",
          dashStyle: "Dash" 
        }
        ],
      },
      height: 400,
      caption: "Ethereum Blob Count per Block vs Target. Data updated daily.",
      seeMetricURL: "https://www.growthepie.xyz/data-availability"
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
      stacking: "normal",
      showXAsDate: true,

      dataAsJson: {
        meta: [{
          name: "Ethereum",
          color: "#94ABD3",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.ethereum.daily.values",
        },
        {
          name: "Base",
          color: "#2151F5",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.base.daily.values",
        },
        {
          name: "OP Mainnet",
          color: "#FE5468",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.optimism.daily.values",
        },
        {
          name: "Unichain",
          color: "#FF47BB",
          xIndex: 1,
          yIndex: 0,
          suffix: null,
          prefix: null,
          url: "https://api.growthepie.xyz/v1/quick-bites/pectra-fork.json",
          pathToData: "data.type4_tx_count.unichain.daily.values",
        },
        ],
      },
      height: 400,
      caption: "The number of Set Code transactions on EVM chains (aka Type 4 transactions). Data updated daily.",
    }),
    "```",

    "All charts on this page are updated daily so you can track the adoption of the Pectra upgrades over time.",
  ],
  image: "/images/quick-bites/pectra-tx-type-4.png",
  og_image: "https://api.growthepie.com/v1/og_images/quick-bites/pectra-upgrade.png",
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
    name: "Ethereum",
    url: "/chains/ethereum"
  },
  {
    icon: "gtp-da-blobs-number",
    name: "Blob Count",
    url: "/data-availability/blob-count"
  }],
  icon: "ethereum-logo-monochrome"
};

export default pectraUpgrade; 