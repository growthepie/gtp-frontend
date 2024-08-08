import Container from "@/components/layout/Container";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  };
}

export default function Page() {
  return (
    <Container>Hi</Container>
  );
}
