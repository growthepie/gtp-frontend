// File: app/(layout)/quick-dives/[slug]/layout.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";

// Mock data for quick dives - replace with actual API call in production
const MOCK_QUICK_DIVES = {
  "pectra-tx-type-4": {
    title: "Pectra: Tx type 4",
    subtitle: "Understanding transaction types and their impacts",
    description: "A deep dive into Pectra's transaction type 4 and how it works, including implications for users and developers."
  },
  "optimism-bedrock": {
    title: "Optimism Bedrock",
    subtitle: "A new foundation for Optimism's L2 solution",
    description: "Exploring how Bedrock represents a complete overhaul of Optimism's infrastructure, focusing on modularity and efficiency."
  },
  "arbitrum-nitro": {
    title: "Arbitrum Nitro",
    subtitle: "Exploring Arbitrum's next-generation tech stack",
    description: "Analysis of how Nitro introduces a completely redesigned prover that's significantly faster and more efficient than its predecessor."
  },
  "zksync-era": {
    title: "zkSync Era",
    subtitle: "A closer look at how zkSync's zkEVM works",
    description: "Understanding zkSync Era's novel approach to zero-knowledge proofs that significantly increases throughput and reduces costs."
  },
  "starknet-volition": {
    title: "Starknet Volition",
    subtitle: "Data availability options in StarkNet",
    description: "Examining how Volition allows users to choose where their data is stored, introducing flexibility into the StarkNet ecosystem."
  }
};

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata> {
  // Check if the slug exists in our data
  if (!MOCK_QUICK_DIVES[slug]) {
    track("404 Error", {
      location: "404 Error",
      page: "/quick-dives/" + slug,
    });
    return notFound();
  }

  const quickDive = MOCK_QUICK_DIVES[slug];
  
  // Current date for the OG image cache busting
  const currentDate = new Date();
  currentDate.setHours(2, 0, 0, 0);
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  
  return {
    title: `${quickDive.title} - Quick Dive | growthepie`,
    description: quickDive.description || quickDive.subtitle,
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.xyz/v1/og_images/quick-dives/${slug}.png?date=${dateString}`,
          width: 1200,
          height: 627,
          alt: `${quickDive.title} - growthepie.xyz`,
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}