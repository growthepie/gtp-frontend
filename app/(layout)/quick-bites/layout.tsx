// File: app/(layout)/quick-bites/layout.tsx
import { Metadata } from "next";
import { getPageMetadata } from "@/lib/metadata";
import QuickBitesUiFlags from "./QuickBitesUiFlags";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    '/quick-bites',
    {}
  );
  return {
    title: metadata.title || "Quick Bites | Ethereum Data Stories | growthepie",
    description: metadata.description || "Data-driven articles, updating daily with insights and stories from the Ethereum ecosystem.",
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.com/v1/og_images/landing.jpg`,
          width: 1200,
          height: 627,
          alt: "Quick Bites - growthepie.com",
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QuickBitesUiFlags />
      {children}
    </>
  );
}
