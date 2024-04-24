import { Metadata } from "next";
import { navigationItems } from "@/lib/navigation";

type Props = {
  params: { metric: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Blockspace")
    ?.options.find((item) => item.urlKey === "category-comparison");

  if (option) {
    return {
      title: option.page?.title,
      description: option.page?.description,
      images: [
        {
          url: `http://api.growthepie.xyz/v1/og_images/blockspace/category-comparison.png`,
          width: 1200,
          height: 627,
          alt: "growthepie.xyz",
        },
      ],
    };
  }

  return {
    title: "Metric not found",
    description: "Metric not found",
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
