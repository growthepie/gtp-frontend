// File: app/(layout)/quick-bites/layout.tsx
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    '/quick-bites',
    {}
  );
  return {
    title: metadata.title || "Quick Bites - growthepie",
    description: metadata.description || "In-depth looks at interesting blockchain development trends and technologies across the Ethereum ecosystem.",
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/quick-bites/default.png`,
          width: 1200,
          height: 627,
          alt: "Quick Bites - growthepie.com",
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}