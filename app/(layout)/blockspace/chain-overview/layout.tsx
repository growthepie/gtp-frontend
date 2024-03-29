import { Metadata } from "next";
import { navigationItems } from "@/lib/navigation";

type Props = {
  params: { metric: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Blockspace")
    ?.options.find((item) => item.urlKey === "chain-overview");

  if (option) {
    return {
      title: option.page?.title,
      description: option.page?.description,
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
