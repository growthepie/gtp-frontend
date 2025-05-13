import { QuickDiveData, QuickDiveWithSlug } from '@/lib/types/quickDives';

export interface QuickDivesData {
  [key: string]: QuickDiveData;
}

const QUICK_DIVES_DATA: QuickDivesData = {
  "pectra-tx-type-4": {
    title: "Pectra: Tx type 4",
    subtitle: "Understanding transaction types and their impacts",
    content: [
      "## Introduction to Transaction Types",
      "Ethereum's transaction format has evolved over time to support new features and improvements. Each transaction type is identified by a specific number, with transaction type 4 being one of the latest innovations within the Pectra protocol.",
      
      "> Transaction type 4 is designed to optimize gas efficiency and provide more accurate fee estimations in congested networks. This is particularly important for Layer 2 solutions that aim to reduce costs for users.",
      
      "![Transaction type evolution diagram showing the progression from Legacy to Type 4](/images/quick-dives/transaction-types-evolution.png | width=800,height=400) \"Test\"",
      
      "## How Transaction Type 4 Works",
      "Transaction type 4 introduces a new field in the transaction data structure that allows for more granular control over gas limits and prioritization. This helps to address several key challenges:",
      
      "1. It reduces the impact of network congestion on transaction pricing",
      "2. It provides more predictable fee estimations, especially during high demand periods",
      "3. It optimizes calldata, resulting in lower overall costs for complex transactions",
      
      "The technical implementation involves changes to both the transaction envelope and the way gas calculations are performed by validators. The most significant change is the separation of execution gas from data availability costs, which allows for more flexible pricing models.",
      
      "![Transaction type 4 structure compared to earlier types](/images/quick-dives/tx-type-4-structure.png | width=700,height=500,align=center) \"Transaction envelope structure showing new fields\"",
      
      "## Real-world Impact",
      "Initial tests on the Pectra testnet showed a 15-30% reduction in gas costs for typical DeFi operations compared to traditional type 2 transactions. This substantial improvement could make certain applications viable that were previously too expensive to operate.",
      
      "For users, this translates to more predictable fees and fewer failed transactions due to gas estimation errors. For developers, it provides more flexibility in designing gas-efficient smart contracts and introduces new patterns for optimizing transaction batching.",
      
      "![Gas savings chart comparing transaction types](/images/quick-dives/tx-type-gas-comparison.png) \"Comparative gas costs across different transaction types and operations\""
    ],
    image: "/images/quick-dives/pectra-tx-type-4.png",
    date: "2025-04-17",
    icon: "gtp-metrics-transactioncount",
    related: ["optimism-bedrock", "arbitrum-nitro"],
    author: [{
      name: "Alex Chen",
      xUsername: "alexchen_eth"
    }],
    topics: [{
      icon: "optimism-logo-monochrome",
      color: "#FE5468",
      name: "Optimism",
      url: "/chains/optimism"
    },
    {
      icon: "arbitrum-logo-monochrome",
      color: "#2151F5",
      name: "Arbitrum",
      url: "/chains/arbitrum"
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
        type: "column",
        title: "Optimism Transaction Costs Before vs. After Bedrock",
        subtitle: "Average gas costs in USD for common operations",
        stacking: "normal",
        dataAsJson: {
          url: "https://api.growthepie.xyz/v1/da_timeseries.json",
          pathToData: "data.da_layers.da_celestia.90d.da_consumers.eclipse.daily.values",
          meta: [{
            name: "Before Bedrock",
            color: "#FF0420",
            xIndex: 4,
            yIndex: 3,
            suffix: null,
            prefix: "$"
          },
          {
            name: "After Bedrock",
            color: "#FF5A00",
            xIndex: 4,
            yIndex: 3,
            suffix: null,
            prefix: null
          }
          ],
        },
        data: [
          {
            name: "Before Bedrock",
            color: "#FF0420",
            data: [0.27, 0.48, 1.35, 2.14, 0.53]
          },
          {
            name: "After Bedrock",
            color: "#FF5A00",
            data: [0.15, 0.26, 0.79, 1.28, 0.32]
          }
        ],
        options: {
          xAxis: {
            categories: ["Token Transfer", "Swap", "NFT Mint", "Contract Deployment", "LP Addition"]
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
    image: "/images/quick-dives/optimism-bedrock.png",
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
    image: "/images/quick-dives/arbitrum-nitro.png",
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
  "zksync-era": {
    title: "zkSync Era",
    subtitle: "A closer look at how zkSync's zkEVM works",
    content: [
      "## zkSync Era: The zkEVM Revolution",
      "zkSync Era represents a breakthrough in zero-knowledge proof technology, offering a fully EVM-compatible Layer 2 solution with the security benefits of ZK proofs. Launched in March 2023, Era has quickly established itself as a leading zkEVM implementation.",
      
      "![zkSync Era architecture overview](/images/quick-dives/zksync-era-overview.png | width=900,height=500,align=center) \"High-level architecture of zkSync Era\"",
      
      "> Unlike optimistic rollups that have a challenge period of 7 days, zkSync Era provides near-immediate finality once proofs are generated and verified on Ethereum mainnet.",
      
      "## Technical Architecture",
      "zkSync Era's architecture includes several innovative components:",
      
      "- **Type 4 zkEVM**: An advanced implementation that achieves EVM equivalence while maintaining the efficiency advantages of ZK technology.",
      "- **LLVM-based Compiler**: A sophisticated compiler pipeline that translates Solidity and Vyper contracts into bytecode optimized for ZK proving.",
      "- **Recursive Proofs**: A mechanism for aggregating multiple transaction proofs into a single proof, dramatically reducing verification costs on Ethereum.",
      "- **Native Account Abstraction**: Built-in support for smart contract wallets and gasless transactions.",
      
      "![zkEVM compiler pipeline](/images/quick-dives/zksync-compiler-pipeline.png) \"LLVM-based compiler pipeline for zkSync Era\"",
      
      "## Interactive Fee Comparison",
      "The following interactive visualization lets you compare transaction costs across various L2 solutions including zkSync Era:",
      
      "```iframe",
      JSON.stringify({
        src: "https://www.growthepie.xyz/embed/fundamentals/transaction-costs?showUsd=true&theme=dark&timespan=90d&scale=absolute&interval=daily&showMainnet=true&chains=ethereum%2Carbitrum%2Cbase%2Czksync_era&zoomed=false",
        title: "Transaction Costs Comparison - growthepie",
        width: "100%",
        height: "600px",
        caption: "Comparative transaction costs across Ethereum and various L2 solutions including zkSync Era. Source: growthepie.xyz"
      }),
      "```",
      
      "## Performance and Scalability",
      "Era's performance metrics demonstrate the potential of zkEVM technology:",
      
      "- **Transaction Throughput**: Up to 100-200 TPS, with potential for 2000+ TPS with future optimizations",
      "- **Proof Generation Time**: 1-3 minutes for typical transaction batches",
      "- **Finality**: Once proofs are verified on Ethereum (approximately 10-30 minutes)",
      "- **Cost Reduction**: 10-50x lower fees compared to Ethereum mainnet",
      
      "![Performance comparison between different L2 solutions](/images/quick-dives/l2-performance-comparison.png | width=800,align=center) \"Performance metrics across various Layer 2 solutions\"",
      
      "## Developer Experience",
      "A key focus of zkSync Era has been maintaining compatibility with existing Ethereum development tools and practices. This compatibility has been achieved through:",
      
      "- Full support for Ethereum RPC API",
      "- Compatibility with popular development frameworks like Hardhat and Foundry",
      "- Native integration with ethers.js and web3.js libraries",
      
      "This has allowed developers to migrate their applications to zkSync Era with minimal changes to their codebase, accelerating adoption and ecosystem growth.",
      
      "![Developer tooling ecosystem for zkSync Era](/images/quick-dives/zksync-developer-tools.png | width=600,height=400) \"Developer tools and SDK ecosystem\""
    ],
    image: "/images/quick-dives/zksync-era.png",
    date: "2025-02-10",
    icon: "gtp-metrics-transactioncosts",
    related: ["pectra-tx-type-4", "optimism-bedrock"],
    author: [{
      name: "Maya Rodriguez",
      xUsername: "maya_zkp"
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
    image: "/images/quick-dives/l2-fee-comparison.png",
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

export default QUICK_DIVES_DATA;

// Helper functions for working with the mock data
export const getQuickDiveBySlug = (slug: string): QuickDiveData | undefined => {
  return QUICK_DIVES_DATA[slug];
};

export const getAllQuickDives = (): (QuickDiveData & { slug: string })[] => {
  return Object.entries(QUICK_DIVES_DATA).map(([slug, data]) => ({
    ...data,
    slug
  }));
};

export const getRelatedQuickDives = (slugs: string[]): QuickDiveWithSlug[] => {
  return slugs
    .map(slug => {
      const data = QUICK_DIVES_DATA[slug];
      if (!data) return null;
      return {
        ...data,
        slug
      };
    })
    .filter((item): item is QuickDiveWithSlug => item !== null);
};

// Get featured quick dives for homepage
export const getFeaturedQuickDives = (count: number = 3): (QuickDiveData & { slug: string })[] => {
  return getAllQuickDives()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};