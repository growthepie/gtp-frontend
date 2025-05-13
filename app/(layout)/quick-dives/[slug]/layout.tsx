// File: app/(layout)/quick-dives/[slug]/layout.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import { getQuickDiveBySlug } from "@/lib/mock/quickDivesData";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params: { slug } }: Props): Promise<Metadata> {
  // Get the quick dive data from the central data store
  const quickDive = getQuickDiveBySlug(slug);
  
  // Check if the slug exists in our data
  if (!quickDive) {
    track("404 Error", {
      location: "404 Error",
      page: "/quick-dives/" + slug,
    });
    return notFound();
  }
  
  // Generate a description from the content if none is provided
  const description = quickDive.subtitle || 
    (quickDive.content && quickDive.content.length > 0 ? quickDive.content[0] : "");
  
  // Current date for the OG image cache busting
  const currentDate = new Date();
  currentDate.setHours(2, 0, 0, 0);
  const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  
  return {
    title: `${quickDive.title} - Quick Dive | growthepie`,
    description: description,
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