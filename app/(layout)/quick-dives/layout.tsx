// File: app/(layout)/quick-dives/layout.tsx
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    '/quick-dives',
    {}
  );
  return {
    title: metadata.title || "Quick Dives - growthepie",
    description: metadata.description || "In-depth looks at interesting blockchain development trends and technologies across the Ethereum ecosystem.",
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.xyz/v1/og_images/quick-dives.png`,
          width: 1200,
          height: 627,
          alt: "Quick Dives - growthepie.xyz",
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}