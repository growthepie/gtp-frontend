import Home from "@/components/home/Home";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Growing Ethereum’s Ecosystem Together - Layer 2 User Base",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  };
}

const URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? `http://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/optimism-retropgf-3/projects`
    : `/api/optimism-retropgf-3/projects`;

export default function Page() {
  return <Home />;
}
