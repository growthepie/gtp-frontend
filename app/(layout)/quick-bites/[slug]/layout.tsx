// File: app/(layout)/quick-bites/[slug]/layout.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { getQuickBiteBySlug } from "@/lib/quick-bites/quickBites";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata> {
  // Normalize slug to lowercase for case-insensitive lookup
  const normalizedSlug = slug.toLowerCase();
  // Get the quick bite data from the central data store
  const QuickBite = getQuickBiteBySlug(normalizedSlug);
  
  // Check if the slug exists in our data
  if (!QuickBite) {
    track("404 Error", {
      location: "404 Error",
      page: "/quick-bites/" + normalizedSlug,
    });
    return notFound();
  }

  // YYYY-MM-DD UTC
  const current_date = new Date().toISOString().split("T")[0];

  
  // Generate a description from the content if none is provided
  const description = QuickBite.subtitle || 
    (QuickBite.content && QuickBite.content.length > 0 ? QuickBite.content[0] : "");
  
  return {
    title: `${QuickBite.title} | growthepie`,
    description: description,
    openGraph: {
      images: [
        {
          url: QuickBite.og_image || `https://api.growthepie.com/v1/og_images/quick-bites/${normalizedSlug}.png`,
          width: 1200,
          height: 627,
          alt: `${QuickBite.title} - growthepie.com`,
        },
      ],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}