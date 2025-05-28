import { Metadata } from "next";
import { navigationItems } from "@/lib/navigation";

type Props = {
  params: { category: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Blockspace")
    ?.options.find((item) => item.urlKey === "chain-overview");

  if (option) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: option.page?.title,
      description: option.page?.description,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.com/v1/og_images/blockspace/chain-overview.png?date=${dateString}`,
            width: 1200,
            height: 627,
            alt: "growthepie.com",
          },
        ],
      },
    };
  }

  return {
    title: "Page not found",
    description: "Page not found",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
