// File: app/(layout)/quick-dives/[slug]/page.tsx
// This is a server component (default in Next.js App Router)

import { Suspense } from 'react';
import { PageContainer, PageRoot, Section } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { Title } from "@/components/layout/TextHeadingComponents";
import QuickDiveClientContent from "@/components/quick-dives/QuickDiveClientContent";
import Loading from "./loading";

// Mock data for now, later would be fetched from an API
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
  }
};

// Function to format date - can be used server-side
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function QuickDivePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const quickDiveData = MOCK_QUICK_DIVES[slug];

  if (!quickDiveData) {
    return (
      <PageRoot>
        <PageContainer>
          <Section>
            <div className="text-xl">Quick Dive not found</div>
          </Section>
        </PageContainer>
      </PageRoot>
    );
  }

  // Get related quick dives data
  const relatedQuickDives = quickDiveData.related
    .map(id => MOCK_QUICK_DIVES[id])
    .filter(Boolean);

  return (
    <PageRoot className="pt-[45px] md:pt-[30px]">
      <PageContainer paddingY="none">
        <Section>
          <Title
            icon={quickDiveData.icon as any}
            title={quickDiveData.title}
            as="h1"
          />
          <div className="flex justify-between items-center">
            <Description>{quickDiveData.subtitle}</Description>
            <div className="text-xs text-forest-800 dark:text-forest-400">
              {formatDate(quickDiveData.date)}
            </div>
          </div>
        </Section>
      </PageContainer>
      
      <Suspense fallback={<Loading />}>
        <QuickDiveClientContent 
          content={quickDiveData.content} 
          image={quickDiveData.image}
          relatedQuickDives={relatedQuickDives}
        />
      </Suspense>
    </PageRoot>
  );
}