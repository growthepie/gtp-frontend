// File: app/(layout)/quick-bites/[slug]/layout.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { getQuickBiteBySlug } from "@/lib/mock/quickBitesData";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata> {
  // Get the quick bite data from the central data store
  const QuickBite = getQuickBiteBySlug(slug);
  
  // Check if the slug exists in our data
  if (!QuickBite) {
    track("404 Error", {
      location: "404 Error",
      page: "/quick-bites/" + slug,
    });
    return notFound();
  }
  
  // Generate a description from the content if none is provided
  const description = QuickBite.subtitle || 
    (QuickBite.content && QuickBite.content.length > 0 ? QuickBite.content[0] : "");
  
  // Current date for the OG image cache busting
  const currentDate = new Date();
  currentDate.setHours(2, 0, 0, 0);
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  
  return {
    title: `${QuickBite.title} - Quick Bite | growthepie`,
    description: description,
    openGraph: {
      images: [
        {
          url: `https://api.growthepie.xyz/v1/og_images/quick-bites/${slug}.png?date=${dateString}`,
          width: 1200,
          height: 627,
          alt: `${QuickBite.title} - growthepie.xyz`,
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}