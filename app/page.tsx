"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains } from "@/lib/chains";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import LandingChart from "@/components/layout/LandingChart";
import LandingMetricsTable from "@/components/layout/LandingMetricsTable";
import { Icon } from "@iconify/react";
import TopAnimation from "@/components/TopAnimation";
import { LandingURL, MasterURL } from "@/lib/urls";
import Link from "next/link";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import LoadingAnimation from "@/components/layout/LoadingAnimation";
import { useSessionStorage } from "usehooks-ts";

export default function Home() {
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

    setSelectedChains(Object.keys(data.chains).map((chain) => chain));
  }, [data, landing, selectedMetric, selectedTimeInterval]);

  const chains = useMemo(() => {
    if (!data) return [];

    return AllChains.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key) && chain.key != "ethereum"
    );
  }, [data]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key)
  );

  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);

  useEffect(() => {
    if (masterLoading || landingLoading) {
      setShowLoading(true);
      if (!landingValidating || !masterValidating)
        setLoadingTimeoutSeconds(1200);
    }

    if (master && landing)
      setTimeout(() => {
        setShowLoading(false);
      }, loadingTimeoutSeconds);
  }, [
    landing,
    landingLoading,
    landingValidating,
    loadingTimeoutSeconds,
    master,
    masterLoading,
    masterValidating,
  ]);

  return (
    <>
      {!master && !landing ? (
        <div
          className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-forest-50 dark:bg-forest-1000 z-50 ${
            showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
          suppressHydrationWarning
        >
          <LoadingAnimation />
        </div>
      ) : (
        <div
          className={`absolute w-full h-screen right flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-forest-50 dark:bg-forest-1000 z-50 ${
            showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
          suppressHydrationWarning
        >
          <LoadingAnimation />
        </div>
      )}
      <div className="flex w-full mt-[65px]">
        <div className={`flex flex-col flex-1 pl-2 md:pl-6 w-full`}>
          <>
            <Heading className="font-bold text-[30px] leading-snug md:text-[36px] mb-[28px] lg:mb-[30px]">
              Growing Ethereum’s Ecosystem Together
            </Heading>
            {data && landing && master && <TopAnimation />}
            {/* <Subheading className="text-sm leading-snug">
              Compare Ethereum&apos;s Layer-2 solutions and better understand
              the metrics to grow the ecosystem.
            </Subheading> */}
            <div className="flex mt-0 lg:mt-[100px] mb-[15px] md:mb-[32px] space-x-2 items-center">
              <Icon icon="gtp:gtp-pie" className="w-[30px] h-[30px] md:w-9 md:h-9" />
              <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
                Layer 2 User Base
              </Heading>
            </div>
            <Subheading className="text-base leading-snug mb-[15px] px-[5px] md:px-[45px]">
              Number of unique addresses interacting with one or multiple Layer 2s 
              in a given week.
            </Subheading>
            {data && landing && master && (
              <>
                <div className="flex-1">
                  <LandingChart
                    data={Object.keys(data.chains)
                      .filter((chain) => selectedChains.includes(chain))
                      .map((chain) => {
                        return {
                          name: chain,
                          // type: 'spline',
                          types: data.chains[chain].data.types,
                          data: data.chains[chain].data.data,
                        };
                      })}
                    sources={landing.data.metrics.user_base.source}
                    latest_total={data.latest_total}
                    latest_total_comparison={data.latest_total_comparison}
                    l2_dominance={data.l2_dominance}
                    l2_dominance_comparison={data.l2_dominance_comparison}
                    selectedMetric={selectedMetric}
                    metric={selectedTimeInterval}
                    setSelectedMetric={setSelectedMetric}
                  />
                </div>
                {/* {master && <ReactJson src={master} collapsed={true} />} */}
                <LandingMetricsTable
                  data={data}
                  selectedChains={selectedChains}
                  setSelectedChains={setSelectedChains}
                  chains={chains}
                  metric={selectedTimeInterval}
                  master={master}
                  interactable={selectedMetric !== "Total Users"}
                />
              </>
            )}
          </>

          <div className="flex gap-x-12 ml-1.5 md:ml-0 mt-[90px]">
            <div className="flex flex-col w-[95%] md:w-1/2 lg:w-2/3">
              <div className="flex space-x-2 mb-[30px] items-center">
                <Icon icon="gtp:gtp-about" className="w-[30px] h-[30px] md:w-9 md:h-9" />
                <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
                  About Grow The Pie
                </Heading>
              </div>
              <div className="block md:hidden relative mt-[0px] lg:mt-[15px] -mb-[20px] lg:-mb-[30px] w-[95%] h-[190px]">
                <Image
                  src="/GTP-Data-Kraken.png"
                  fill={true}
                  alt="About Grow The Pie"
                  className="object-contain"
                />
              </div>
              <div className="text-base md:text-sm lg:text-base pt-8 md:pt-0">
                At GrowThePie, our mission is to provide comprehensive and
                accurate analytics of layer 2 solutions for the Ethereum
                ecosystem, acting as a trusted data aggregator from reliable
                sources such as L2Beat and DefiLlama, while also developing our
                own metrics. Through our analytics interface, we aim to educate
                and increase transparency. Our goal is to be one of the go-to
                resources for those seeking to learn more about the potential of
                layer 2 technologies and their impact on the future of the
                Ethereum ecosystem.
              </div>
            </div>
            <div className="hidden md:flex-1 relative mt-[5px] lg:mt-[15px] -mb-[10px] lg:-mb-[30px]">
              <Image
                src="/GTP-Data-Kraken.png"
                fill={true}
                alt="About Grow The Pie"
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex mt-[90px] mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
            <Icon icon="gtp:gtp-faq" className="w-[30px] h-[30px] md:w-9 md:h-9" />
            <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
              Frequently Asked Questions
            </Heading>
          </div>
          <div className="flex flex-col space-y-[15px] my-[30px] mr-1 md:mr-0">
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
              question="What's up with the name?"
              answer={
                <>
                  We view the different layer 2 solutions for the Ethereum
                  ecosystem as complementary technologies that enable more use
                  cases, rather than competitors vying for market share. We
                  believe that the space is a positive-sum game, where each
                  unique flavor of layer 2 technology brings its own benefits to
                  the table. Through collaboration and innovation, the Ethereum
                  community can unlock the full potential of layer 2 solutions
                  and continue to expand it&apos;s user-base and evolve in
                  exciting ways.
                </>
              }
            />
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
              question='What exactly does "multiple" stand for?'
              answer={
                <>
                  The &quot;multiple&quot; category denotes addresses that were
                  active on multiple Layer 2 (L2) networks within a given week.
                  This implies that if an address was active on different L2
                  networks, such as Arbitrum and Optimism, in the same week, it
                  would be included in the &quot;multiple&quot; category, but
                  not attributed to either Arbitrum or Optimism. For a more
                  detailed breakdown of active addresses on each individual
                  chain, please refer to the{" "}
                  <Link
                    href="https://www.growthepie.xyz/fundamentals/daily-active-addresses"
                    className="underline"
                  >
                    &quot;Daily active addresses&quot;
                  </Link>{" "}
                  tab.
                </>
              }
            />
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
              question="Why have the numbers on the landing page not updated for a few days?"
              answer={
                <>
                  The numbers on the landing page use a weekly aggregation. In
                  order to avoid confusion we only show completed weeks and no
                  partial weeks. The date that you can see in the chart is
                  always the start of the week (Monday). Our landing page
                  numbers will update every Monday.
                </>
              }
            />
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
              question="L2Beat has way more Layer 2s listed why do you not cover all of them?"
              answer={
                <>
                  The goal is to cover as many L2s as possible. We will add more
                  L2s over time. For our type of analysis we need access to the
                  raw data of each L2. This makes adding new L2s time and
                  resource consuming.
                </>
              }
            />
            <QuestionAnswer
              className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
              question="Are the dates on this website my regional timezone or UTC?"
              answer={
                <>
                  All dates on our website use UTC time. This makes it easier
                  for us to aggregate data and we avoid confusion when people in
                  different timezones exchange charts.
                </>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
