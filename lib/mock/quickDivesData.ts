// File: lib/mock/quickDivesData.ts

export interface QuickDiveData {
    title: string;
    subtitle: string;
    content: string[];
    image: string;
    date: string;
    icon: string;
    related: string[];
    author?: {
      name: string;
      xUsername: string;
    };
  }
  
  export interface QuickDivesData {
    [key: string]: QuickDiveData;
  }
  
  const QUICK_DIVES_DATA: QuickDivesData = {
    "pectra-tx-type-4": {
      title: "Pectra: Tx type 4",
      subtitle: "Understanding transaction types and their impacts",
      content: [
        "This is a deep dive into Pectra's transaction type 4 and how it works.",
        "Transaction type 4 introduces a new way of handling gas fees, providing more predictability in volatile markets.",
        "These changes have significant implications for both users and developers working with the protocol."
      ],
      image: "/images/quick-dives/pectra-tx-type-4.png",
      date: "2025-04-17",
      icon: "gtp-metrics-transactioncount",
      related: ["optimism-bedrock", "arbitrum-nitro"],
      author: {
        name: "Alex Chen",
        xUsername: "alexchen_eth"
      }
    },
    "optimism-bedrock": {
      title: "Optimism Bedrock",
      subtitle: "A new foundation for Optimism's L2 solution",
      content: [
        "Bedrock represents a complete overhaul of Optimism's infrastructure, focusing on modularity and efficiency.",
        "The new architecture reduces fees by optimizing the way transactions are processed and data is stored.",
        "This update brings Optimism closer to Ethereum-equivalence, making it easier for developers to deploy their applications."
      ],
      image: "/images/quick-dives/optimism-bedrock.png",
      date: "2025-03-20",
      icon: "optimism-logo-monochrome",
      related: ["pectra-tx-type-4", "arbitrum-nitro"],
      author: {
        name: "Sarah Johnson",
        xUsername: "sarahj_crypto"
      }
    },
    "arbitrum-nitro": {
      title: "Arbitrum Nitro",
      subtitle: "Exploring Arbitrum's next-generation tech stack",
      content: [
        "Nitro introduces a completely redesigned prover that's significantly faster and more efficient than its predecessor.",
        "By implementing a WASM-based execution environment, Arbitrum achieves better compatibility with Ethereum tools.",
        "These improvements translate to lower fees and higher throughput for users of the network."
      ],
      image: "/images/quick-dives/arbitrum-nitro.png",
      date: "2025-01-15",
      icon: "arbitrum-logo-monochrome",
      related: ["pectra-tx-type-4", "optimism-bedrock"],
      author: {
        name: "Raj Patel",
        xUsername: "rajpatel_web3"
      }
    },
    "zksync-era": {
      title: "zkSync Era",
      subtitle: "A closer look at how zkSync's zkEVM works",
      content: [
        "zkSync Era introduces a novel approach to zero-knowledge proofs that significantly increases throughput.",
        "The new proof system allows for more efficient verification on Ethereum, reducing costs for users.",
        "This architecture represents a major step forward in making zkRollups practical for general-purpose applications."
      ],
      image: "/images/quick-dives/zksync-era.png",
      date: "2025-02-10",
      icon: "gtp-metrics-transactioncosts",
      related: ["pectra-tx-type-4", "optimism-bedrock"],
      author: {
        name: "Maya Rodriguez",
        xUsername: "maya_zkp"
      }
    },
    "starknet-volition": {
      title: "Starknet Volition",
      subtitle: "Data availability options in StarkNet",
      content: [
        "Volition allows users to choose where their data is stored, introducing flexibility into the StarkNet ecosystem.",
        "By separating data availability from computation, users can optimize for either cost or security based on their needs.",
        "This hybrid approach could become a standard feature across Layer 2 solutions in the future."
      ],
      image: "/images/quick-dives/starknet-volition.png",
      date: "2025-01-05",
      icon: "starknet-logo-monochrome",
      related: ["zksync-era", "arbitrum-nitro"],
      author: {
        name: "Liam Thompson",
        xUsername: "liam_stark"
      }
    }
  };
  
  export default QUICK_DIVES_DATA;
  
  // Helper functions for working with the mock data
  export const getQuickDiveBySlug = (slug: string): QuickDiveData | undefined => {
    return QUICK_DIVES_DATA[slug];
  };
  
  export const getAllQuickDives = (): QuickDiveData[] => {
    return Object.entries(QUICK_DIVES_DATA).map(([slug, data]) => ({
      ...data,
      slug
    }));
  };
  
  export const getRelatedQuickDives = (slugs: string[]): QuickDiveData[] => {
    return slugs
      .map(slug => ({
        ...QUICK_DIVES_DATA[slug],
        slug
      }))
      .filter(Boolean);
  };
  
  // Get featured quick dives for homepage (could be based on different logic)
  export const getFeaturedQuickDives = (count: number = 3): (QuickDiveData & { slug: string })[] => {
    return getAllQuickDives()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  };