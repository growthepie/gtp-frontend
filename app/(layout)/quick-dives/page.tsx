// File: app/(layout)/quick-dives/page.tsx
// This is a server component (default in Next.js App Router)

import { Suspense } from 'react';
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";
import QuickDivesGrid from "@/components/quick-dives/QuickDivesGrid";
import Loading from "./loading";

// Mock data for quick dives - in a real implementation, this would come from an API
const MOCK_QUICK_DIVES = {
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
    related: ["optimism-bedrock", "arbitrum-nitro"]
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
    related: ["pectra-tx-type-4", "arbitrum-nitro"]
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
    related: ["pectra-tx-type-4", "optimism-bedrock"]
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
    related: ["pectra-tx-type-4", "optimism-bedrock"]
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
    related: ["zksync-era", "arbitrum-nitro"]
  }
};

export default function QuickDivesIndexPage() {
  // Format and sort the quickDives data
  const quickDives = Object.entries(MOCK_QUICK_DIVES).map(([slug, data]) => ({
    ...data,
    slug
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon="gtp-insights"
            title="Quick Dives"
            as="h1"
          />
          <Description>
            In-depth looks at interesting blockchain development trends and technologies. 
            These quick dives provide focused analysis on specific features, updates, and innovations 
            across the Ethereum ecosystem.
          </Description>
        </Section>
        
        <Suspense fallback={<Loading />}>
          <Section className="mt-8">
            <QuickDivesGrid quickDives={quickDives} />
          </Section>
        </Suspense>
      </PageContainer>
    </PageRoot>
  );
}