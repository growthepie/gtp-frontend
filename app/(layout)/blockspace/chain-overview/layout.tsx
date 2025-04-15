import { Metadata } from "next";
import { navigationItems } from "@/lib/navigation";
import { getPageMetadata } from "@/lib/metadata";
import { ProjectsMetadataProvider } from "../../applications/_contexts/ProjectsMetadataContext";


type Props = {
  params: { metric: string };
};

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/blockspace/chain-overview",
    {}
  );

  const currentDate = new Date();
  // Set the time to 2 am
  currentDate.setHours(2, 0, 0, 0);
  // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.xyz/v1/og_images/blockspace/chain-overview.png?date=${dateString}`,
            width: 1200,
            height: 627,
            alt: "growthepie.xyz",
          },
        ],
      },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    {children}
  )
}
