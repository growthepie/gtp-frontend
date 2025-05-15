import { QuickBiteData, QuickBiteWithSlug } from '@/lib/types/quickBites';
import { title } from 'process';

export interface QuickBitesData {
  [key: string]: QuickBiteData;
}

const QUICK_BITES_DATA: QuickBitesData = {
  "pectra-fork": {
    title: "Pectra: The Peoples Upgrade",
    subtitle: "Track the Adoption of Pectras UX + Scaling Improvements",
    content: [
        "> Less clicks, less signatures, more Blobs. Many past Ethereum upgrades focused on technical improvements, but Pectra is different. It aims to enhance the user experience for everyday users, making it easier and chepaer to interact with the Ethereum ecosystem.",

        "## What is part of the Pectra upgrade?",
        "Pectra introduces several key features designed to simplify the user experience:",
        "- **EIP-7691: Boost Rollups through more Blobs** - Rollupss have been operating at Blob capacity for a while. Now we get more Blobs! This means cheaper transactions and more space for Rollups.",
        "- **EIP-7702: Smarter Wallets** - Enables wallets (EOAs) to act as smart accounts. Unlocking features like sponsorship, delegation transactions, paying gas in other tokens, and much more.",
        "- **EIP-7252, 7002, 6110: ETH Staking Upgrades** - The validator staking limit is raised from 32 ETH to 2,048 ETH and the withdrawal process is simplified. Simpler is better.",
        "and 6 more EIPs that include various improvements to the Ethereum protocol.",

        "## EIP-7691: More Blobs",
        "The Blob limit was raised from 6 to 9 and the target was raised from 3 to 6. This means more blobs for Layer 2s and it takes longer for the Blob fee market to kick in.",
        "The following chart shows how close we are to the new Blob target. Whenever the number of submitted blobs per block is above the target, the Blob fee market will kick in and increse Blob fees.",

         "```chart",
        JSON.stringify({
          type: "line",
          title: "Submitted Blobs per Block",
          subtitle: "Compare the average #Blobs per block before and after the Pectra upgrade",
          stacking: "normal",
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
          seeMetricURL: "https://www.growthepie.xyz/data-availability/blob-count"
        }),
      "```",

      "## EIP-7702: Smarter Wallets",
      "EIP-7702 introduces a new transaction type that allows wallets to act as smart accounts. This improves the user experience by allowing wallets to pay for transactions, delegate transactions, and more.",
      "The following chart shows the adoption of EIP-7702 wallets by visualizing the daily number of Set Code transactions on EVM chains (aka Type 4 transactions).",

      "```chart",
      JSON.stringify({
        type: "column",
        title: "Transactions that trigger smart wallet upgrades and downgrades",
        subtitle: "The number of Set Code transactions on EVM chains (aka Type 4 transactions)",
        stacking: "normal",
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

    "All charts on this page are updated daily so that you can see the adoption of the Pectra upgrades over time.",

    ],
    image: "/images/quick-bites/pectra-tx-type-4.png",
    date: "2025-05-16",
    icon: "ethereum-logo-monochrome",
    related: [],
    author: [{
      name: "Matthias Seidl",
      xUsername: "web3_data"
    },
    {
      name: "Lorenz Lehmann",
      xUsername: "LehmannLorenz"
    }
  ],
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
    }
  ]
  },
  "optimism-bedrock": {
    title: "Optimism Bedrock",
    subtitle: "A new foundation for Optimism's L2 solution",
    content: [
      "## The Bedrock Upgrade",
      "Optimism's Bedrock upgrade represents a complete architectural overhaul of the protocol, focusing on modularity, efficiency, and improved developer experience. Launched in June 2023, Bedrock marks a significant milestone in Optimism's evolution toward becoming a more efficient and EVM-equivalent Layer 2 solution.",
      
      "> Bedrock reduces fees by up to 40% through optimized data compression and more efficient transaction processing - a game-changer for applications sensitive to gas costs.",
      
      "## Technical Improvements",
      "Bedrock introduced several key technical improvements:",
      
      "- **Modular Architecture**: The codebase was reorganized into distinct modules, making it easier to upgrade individual components without affecting the entire system.",
      "- **EVM Equivalence**: Full compatibility with Ethereum's execution environment, eliminating edge cases that previously caused some contracts to behave differently on Optimism.",
      "- **Fault Proofs**: A new system for verifying the correctness of state transitions, improving security without sacrificing performance.",
      "- **Data Compression**: Advanced techniques that reduce the amount of data posted to Ethereum L1, directly translating to lower fees for users.",
      
      "The most significant improvement is the redesigned rollup node, which handles transaction sequencing and execution more efficiently than its predecessor.",
      
      "```chart",
      JSON.stringify({
        type: "line",
        title: "Optimism Transaction Costs Before vs. After Bedrock",
        subtitle: "Average gas costs in USD for common operations",
        stacking: "normal",
        dataAsJson: {

          meta: [{
            name: "Before Bedrock",
            color: "#FF0420",
            xIndex: 4,
            yIndex: 3,
            suffix: null,
            prefix: "$",
            url: "https://api.growthepie.xyz/v1/da_timeseries.json",
            pathToData: "data.da_layers.da_celestia.90d.da_consumers.eclipse.daily.values",
            dashStyle: "LongDash" // Highcharts dashstylevalue
          },
          {
            name: "After Bedrock",
            color: "#FF5A00",
            xIndex: 4,
            yIndex: 3,
            suffix: null,
            prefix: null,
            url: "https://api.growthepie.xyz/v1/da_timeseries.json",
            pathToData: "data.da_layers.da_celestia.90d.da_consumers.lightlink.daily.values",
          }
          ],
        },
        options: {
          xAxis: {
            title: {
              text: "Date?"
            }
          },
          yAxis: {
            title: {
              text: "Cost in USD"
            }
          },
          plotOptions: {
            column: {
              dataLabels: {
                enabled: false
              }
            }
          }
        },
        height: 400,
        caption: "Gas cost reduction across different operation types after the Bedrock upgrade",
        seeMetricURL: "https://www.growthepie.xyz/chains/optimism"
      }),
      "```",
      
      "## Impact on the Ecosystem",
      "Since the Bedrock upgrade, Optimism has seen a 47% increase in daily active addresses and a 32% increase in total value locked. These metrics suggest that the lower fees and improved reliability have attracted both users and developers to the platform.",
      
      "```chart",
      JSON.stringify({
        type: "area",
        stacking: "percent",
        title: "Optimism Network Growth Post-Bedrock",
        chartCategories: [{
          name: "Revenue",
          color: "#FF5A00"
        },
        {
          name: "Total Value Locked",
          color: "#FF0420"
        }],
        data: [
          {
            name: "Daily Active Addresses",
            color: "#FF5A00", 
            data: [25000, 28500, 31200, 35600, 39800, 42300]
          },
          {
            name: "Total Value Locked (in millions $)",
            color: "#FF0420",
            data: [520, 610, 680, 750, 830, 920]
          }
        ],
        options: {
          xAxis: {
            categories: ["Jun 2023", "Jul 2023", "Aug 2023", "Sep 2023", "Oct 2023", "Nov 2023"]
          },
          yAxis: [
            {
              title: {
                text: "Daily Active Addresses"
              }
            },
            {
              title: {
                text: "TVL (millions $)"
              },
              opposite: true
            }
          ],
          tooltip: {
            shared: true
          },
          series: [
            {
              yAxis: 0
            },
            {
              yAxis: 1
            }
          ]
        },
        height: 450,
        caption: "Network growth metrics in the six months following the Bedrock upgrade"
      }),
      "```",
      
      "For developers, the upgrade has simplified the migration process from Ethereum, as applications now require minimal modifications to run on Optimism. This has led to a proliferation of new projects and services in the ecosystem, further driving adoption and usage."
    ],
    image: "/images/quick-bites/optimism-bedrock.png",
    date: "2025-03-20",
    icon: "optimism-logo-monochrome",
    related: ["pectra-tx-type-4", "arbitrum-nitro"],
    author: [{
      name: "Sarah Johnson",
      xUsername: "sarahj_crypto"
    },{
      name: "John Doe",
      xUsername: "johndoe_crypto"
    }],
    topics: [{
      icon: "optimism-logo-monochrome",
      color: "#FE5468",
      name: "Optimism",
      url: "/chains/optimism"
    }]
  },
  "arbitrum-nitro": {
    title: "Arbitrum Nitro",
    subtitle: "Exploring Arbitrum's next-generation tech stack",
    content: [
      "## Nitro: A New Era for Arbitrum",
      "Arbitrum Nitro represents a fundamental redesign of the Arbitrum technology stack, replacing the previous Arbitrum Classic architecture with a more efficient and developer-friendly implementation. Launched in August 2022, Nitro has dramatically improved Arbitrum's performance, cost-efficiency, and compatibility with Ethereum.",
      
      "> The WASM-based prover in Nitro is estimated to be 50x faster than the previous implementation, allowing for significantly more transaction throughput while maintaining security guarantees.",
      
      "## Key Technical Components",
      "Nitro consists of several major technical improvements:",
      
      "- **WASM-based Execution**: The core execution environment now uses WebAssembly (WASM), a highly optimized virtual machine format that provides better performance and compatibility.",
      "- **Geth Integration**: Nitro leverages Ethereum's own Geth client for EVM execution, ensuring complete compatibility with Ethereum smart contracts and developer tools.",
      "- **Advanced Prover**: The new proving system is significantly more efficient, reducing the computational resources required to generate and verify proofs of transaction execution.",
      "- **Advanced Compression**: Improved data compression techniques that minimize L1 calldata costs, directly translating to lower fees for users.",
      
      "## User Activity Visualization",
      "The following interactive visualization allows you to explore how Arbitrum's user activity compares with other Layer 2 solutions since the Nitro upgrade:",
      
      "```iframe",
      JSON.stringify({
        src: "https://www.growthepie.xyz/embed/fundamentals/daily-active-addresses?showUsd=true&theme=dark&timespan=90d&scale=absolute&interval=daily&showMainnet=false&chains=arbitrum%2Cbase%2Ccelo%2Cunichain&zoomed=false&startTimestamp=&endTimestamp=1745712000000",
        title: "Active Addresses - growthepie",
        width: "100%",
        height: "500px",
        caption: "Daily active addresses comparison across Layer 2 solutions. Source: growthepie.xyz"
      }),
      "```",
      
      "## Performance Metrics",
      "Since the Nitro upgrade, Arbitrum has demonstrated impressive performance improvements:",
      
      "- **Transaction Throughput**: Up to 7-10x increase in transaction processing capacity",
      "- **Fee Reduction**: 27-35% lower costs for typical user transactions",
      "- **Finality Time**: Reduced from approximately 10 minutes to 2-3 minutes for most transactions",
      
      "## Ecosystem Growth",
      "The Nitro upgrade catalyzed substantial growth in the Arbitrum ecosystem. In the six months following the upgrade, the network saw a 215% increase in daily transactions and became one of the dominant Layer 2 solutions by total value locked (TVL).",
      
      "The improved developer experience has also attracted hundreds of new projects to the platform, creating a rich ecosystem of applications across DeFi, gaming, and social platforms."
    ],
    image: "/images/quick-bites/arbitrum-nitro.png",
    date: "2025-01-15",
    icon: "arbitrum-logo-monochrome",
    related: ["pectra-tx-type-4", "optimism-bedrock"],
    author: [{
      name: "Raj Patel",
      xUsername: "rajpatel_web3"
    }],
    topics: [{
      icon: "base-logo-monochrome",
      color: "#2151F5",
      name: "Base",
      url: "/chains/base"
    }]
  },
  "l2-fee-comparison": {
    title: "L2 Fee Comparison",
    subtitle: "Analyzing transaction costs across Ethereum's scaling solutions",
    content: [
      "## The Current State of L2 Fees",
      "The Ethereum ecosystem continues to expand with various Layer 2 solutions competing to offer the most cost-effective scaling solution. This analysis examines the current fee structures across the major L2 platforms and how they compare to Ethereum mainnet.",
      
      "> While all L2s provide significant cost savings compared to Ethereum mainnet, the fee differences between L2s themselves can vary by up to 10x depending on the transaction type and network conditions.",
      
      "## Interactive Fee Comparison Tool",
      "To better understand how fees compare across different scaling solutions, the visualization below provides a real-time comparison of transaction costs:",
      
      "```iframe",
      JSON.stringify({
        src: "https://www.growthepie.xyz/embed/fundamentals/transaction-costs?showUsd=true&theme=dark&timespan=365d&scale=absolute&interval=daily&showMainnet=false&chains=arbitrum%2Cbase%2Ccelo%2Cfraxtal%2Credstone%2Cunichain",
        title: "Transaction Costs Comparison - growthepie",
        width: "100%",
        height: "600px",
        caption: "Comparative transaction costs across Ethereum and major L2 solutions. Source: growthepie.xyz"
      }),
      "```",
      
      "## What Drives Fee Differences?",
      "The variation in fees across L2s is influenced by several factors:",
      
      "### Data Availability Costs",
      "One of the most significant factors in L2 fees is how data availability is handled. Solutions using Ethereum for data availability (like Optimistic Rollups) have a base cost determined by Ethereum's calldata gas prices, while those using alternative data availability layers can achieve lower costs.",
      
      "### Proof Generation",
      "ZK-Rollups require computational resources to generate validity proofs, which adds to their operational costs. However, recent optimizations in proof generation have significantly reduced this overhead.",
      
      "### Sequencer Efficiency",
      "The efficiency of the sequencer in batching transactions can greatly impact fees. More sophisticated batching strategies can amortize fixed costs across more transactions.",
      
      "### Network Subsidies",
      "Some L2s subsidize transaction costs to drive adoption, particularly in their early stages. This can create temporarily lower fees that may not be sustainable long-term.",
      
      "## User Activity and Network Congestion",
      "The relationship between network activity and fees varies across different L2 solutions. The visualization below shows daily active addresses across several major platforms:",
      
      "```iframe",
      JSON.stringify({
        src: "https://www.growthepie.xyz/embed/fundamentals/daily-active-addresses?showUsd=true&theme=dark&timespan=90d&scale=absolute&interval=daily&showMainnet=false&chains=arbitrum%2Cbase%2Coptimism%2Czksync_era&zoomed=false",
        title: "Active Addresses - growthepie",
        width: "100%",
        height: "500px",
        caption: "Daily active addresses comparison across Layer 2 solutions. Source: growthepie.xyz"
      }),
      "```",
      
      "## Looking Ahead: Fee Trends",
      "As L2 technology continues to evolve, we can expect fees to trend downward due to several factors:",
      
      "- **EIP-4844 (Proto-Danksharding)**: This Ethereum upgrade will significantly reduce data availability costs for rollups.",
      "- **Proof Optimization**: Ongoing research in ZK proofs is reducing the computational overhead of generating and verifying proofs.",
      "- **L3s and App-Specific Chains**: The emergence of L3s built on top of existing L2s promises even greater fee reduction for specific applications.",
      "- **Alternative DA Layers**: New purpose-built data availability layers could further reduce costs compared to using Ethereum mainnet for DA.",
      
      "While fee differences between L2s will likely persist due to their architectural differences, the overall trend points toward increasingly affordable transaction costs across the Ethereum ecosystem."
    ],
    image: "/images/quick-bites/l2-fee-comparison.png",
    date: "2025-04-08",
    icon: "gtp-metrics-feespaidbyusers",
    related: ["zksync-era", "optimism-bedrock", "arbitrum-nitro"],
    author: [{
      name: "Lisa Thompson",
      xUsername: "lisa_crypto_econ"
    }],
    topics: [{
      icon: "base-logo-monochrome",
      color: "#2151F5",
      name: "Base",
      url: "/chains/base"
    }]

  }
};

export default QUICK_BITES_DATA;

// Helper functions for working with the mock data
export const getQuickBiteBySlug = (slug: string): QuickBiteData | undefined => {
  return QUICK_BITES_DATA[slug];
};

export const getAllQuickBites = (): (QuickBiteData & { slug: string })[] => {
  return Object.entries(QUICK_BITES_DATA).map(([slug, data]) => ({
    ...data,
    slug
  }));
};

export const getRelatedQuickBites = (slugs: string[]): QuickBiteWithSlug[] => {
  return slugs
    .map(slug => {
      const data = QUICK_BITES_DATA[slug];
      if (!data) return null;
      return {
        ...data,
        slug
      };
    })
    .filter((item): item is QuickBiteWithSlug => item !== null);
};

// Get featured quick bites for homepage
export const getFeaturedQuickBites = (count: number = 3): (QuickBiteData & { slug: string })[] => {
  return getAllQuickBites()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};