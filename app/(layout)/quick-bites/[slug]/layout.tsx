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

  // YYYY-MM-DD UTC
  const current_date = new Date().toISOString().split("T")[0];

  const og_image = `${QuickBite.og_image}?date=${current_date}` || `https://api.growthepie.xyz/v1/og_images/quick-bites/default.png?date=${current_date}`;
  
  // Generate a description from the content if none is provided
  const description = QuickBite.subtitle || 
    (QuickBite.content && QuickBite.content.length > 0 ? QuickBite.content[0] : "");
  
  return {
    title: `${QuickBite.title} | growthepie`,
    description: description,
    openGraph: {
      images: [
        {
          url: og_image,
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