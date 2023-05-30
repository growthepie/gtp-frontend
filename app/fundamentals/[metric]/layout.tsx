import { Metadata, ResolvingMetadata } from "next";
import { MetricsURLs, MasterURL } from "@/lib/urls";
import { AllChains } from "@/lib/chains";
import { MasterResponse } from "@/types/api/MasterResponse";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import { navigationItems } from "@/lib/navigation";

type Props = {
  params: { metric: string };
};

export async function generateMetadata(
  { params }: Props,
  parent?: ResolvingMetadata
): Promise<Metadata> {
  const option = navigationItems
    .find((item) => item.label === "Fundamentals")
    ?.options.find((item) => item.urlKey === params.metric);

  if (option) {
    return {
      title: option.page?.title,
      description: option.page?.why,
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
