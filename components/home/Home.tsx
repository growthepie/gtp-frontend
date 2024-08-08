"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import LandingChart from "@/components/layout/LandingChart";
import LandingMetricsTable from "@/components/layout/LandingMetricsTable";
import LandingTopContracts from "@/components/layout/LandingTopContracts";
import Swiper from "@/components/layout/SwiperItems";
import { Icon } from "@iconify/react";
import TopAnimation from "@/components/TopAnimation";
import { LandingURL, MasterURL } from "@/lib/urls";
import Link from "next/link";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";

export default function Home() {
  // const isLargeScreen = useMediaQuery("(min-width: 1280px)");

  // const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // useEffect(() => {
  //   setIsSidebarOpen(isLargeScreen);
  // }, [isLargeScreen]);

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
        .map((chain) => chain)
        .slice(0, 3),
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

  return <></>;
}
