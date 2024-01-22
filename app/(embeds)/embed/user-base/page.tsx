"use client";
import Home from "@/components/home/Home";
import LandingUserBaseChart from "@/components/home/LandingUserBaseChart";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import Icon from "@/components/layout/ServerIcon";
// import ShowLoading from "@/components/layout/ShowLoading";
import Subheading from "@/components/layout/Subheading";
import { Metadata } from "next";
import { useEffect, useMemo, useState, useRef } from "react";
import { useMediaQuery } from "@react-hook/media-query";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import { LandingURL, MasterURL } from "@/lib/urls";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Growing Ethereum’s Ecosystem Together - Layer 2 User Base",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  };
}

export default function Page() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  const {
    data: landing,
    error: landingError,
    isLoading: landingLoading,
    isValidating: landingValidating,
  } = useSWR<LandingPageMetricsResponse>(LandingURL);
  // } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const [data, setData] = useState<any>(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  const [selectedMetric, setSelectedMetric] = useState("Total Users");

  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.user_base[selectedTimeInterval]);
    }
  }, [landing, selectedTimeInterval]);

  useEffect(() => {
    if (!data) return;

    setSelectedChains(
      Object.keys(data.chains)
        .filter((chainKey) => AllChainsByKeys.hasOwnProperty(chainKey))
        .map((chain) => chain),
    );
  }, [data, landing, selectedMetric, selectedTimeInterval]);

  const chains = useMemo(() => {
    if (!data) return [];

    return AllChains.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key) && chain.key != "ethereum",
    );
  }, [data]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key),
  );
  return (
    <>
      <Container className="flex flex-col flex-1 w-full">
        <div className="flex mt-[30px] md:mt-[60px] mb-[25px] md:mb-[32px] space-x-2 items-center">
          <Icon
            icon="gtp:gtp-pie"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
            Layer 2 User Base
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mb-[15px] px-[5px] lg:px-[45px]">
          Number of distinct addresses interacting with one or multiple Layer 2s
          in a given week.
        </Subheading>
      </Container>
      <LandingUserBaseChart />
    </>
  );
}
