"use client";
import { useEffect, useMemo, useState, useRef } from "react";
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
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import ChainComponent from "@/components/charts/ChainComponent";
import { ChainURLs, BlockspaceURLs } from "@/lib/urls";
import ContractCard from "@/components/layout/ContractCard";
import { ChainResponse } from "@/types/api/ChainResponse";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import Swiper from "@/components/layout/Swiper";

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
  // } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: blockspaceData,
    error: blockspaceError,
    isValidating: blockspaceValidating,
    isLoading: blockspaceLoading,
  } = useSWR<any>(BlockspaceURLs["chain-overview"]);

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
        Object.keys(data.chains).includes(chain.key) && chain.key != "ethereum",
    );
  }, [data]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key),
  );

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, landingLoading]}
        dataValidating={[masterValidating, landingValidating]}
        fullScreen={true}
      />
      {/* )} */}

      <Container className="flex flex-col flex-1 w-full mt-[65px]">
        {/* <Heading className="font-bold text-[30px] leading-snug md:text-[36px] mb-[28px] lg:mb-[30px] max-w-[900px]">
          Growing Ethereum’s Ecosystem Together
        </Heading> */}
        <Heading className="font-bold text-[30px] leading-snug md:text-[36px] mb-[28px] lg:mb-[30px] max-w-[900px]">
          Mastering Ethereum Layer-2s: Your Gateway to Curated Analytics and
          Knowledge
        </Heading>
      </Container>
      <Container className="flex flex-col flex-1 w-full">
        <div className="flex space-x-2 mt-[25px] lg:mt-[70px] mb-[25px] md:mb-[32px] items-center">
          <Icon
            icon="gtp:fundamentals"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="most-recent-metrics-title"
            className="text-[20px] md:text-[30px] leading-snug font-bold"
          >
            Layer 2 Traction
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mb-[15px] px-[5px] lg:px-[45px]">
          Aggregated metrics across all Layer 2s we track.
        </Subheading>
      </Container>
      <Container className="">
        <Swiper ariaId={"most-recent-metrics-title"} />
      </Container>
      <Container className="flex flex-col flex-1 w-full">
        {/* {data && landing && master && <TopAnimation />} */}
        {/* <Subheading className="text-sm leading-snug">
              Compare Ethereum&apos;s Layer-2 solutions and better understand
              the metrics to grow the ecosystem.
            </Subheading> */}
        <div className="flex mt-[25px] lg:mt-[70px] mb-[25px] md:mb-[32px] space-x-2 items-center">
          <Icon
            icon="gtp:gtp-pie"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
            Layer 2 User Base
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mb-[15px] px-[5px] lg:px-[45px]">
          Number of unique addresses interacting with one or multiple Layer 2s
          in a given week.
        </Subheading>
      </Container>

      {data && landing && master && (
        <>
          <Container className="flex-1">
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
          </Container>
          <Container className="!pr-0">
            <LandingMetricsTable
              data={data}
              selectedChains={selectedChains}
              setSelectedChains={setSelectedChains}
              chains={chains}
              metric={selectedTimeInterval}
              master={master}
              interactable={selectedMetric !== "Total Users"}
            />
          </Container>
        </>
      )}
      <Container className="flex flex-col flex-1 w-full">
        <div className="flex space-x-2 mt-[30px] items-center">
          <Icon
            icon="gtp:package"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
            Blockspace
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mt-[30px] mb-[15px] px-[5px] lg:px-[45px]">
          Top 6 gas-consuming contracts across all tracked Layer-2s.
        </Subheading>
        {blockspaceData && (
          <div className="grid grid-rows-6 grid-cols-1 lg:grid-rows-3 lg:grid-cols-2 xl:grid-rows-2 xl:grid-cols-3 gap-x-[10px] gap-y-[15px]">
            {new Array(6).fill(0).map((_, i) => (
              <ContractCard
                key={i}
                data={
                  blockspaceData.data.chains.all_l2s.overview.max.defi.contracts
                    .data[i]
                }
                types={
                  blockspaceData.data.chains.all_l2s.overview.max.defi.contracts
                    .types
                }
              />
            ))}
          </div>
        )}
      </Container>
      <Container>
        <div className="flex gap-x-0 md:gap-x-12 w-full ml-0 mt-[15px] md:mt-[90px]">
          <div className="flex flex-col md:w-1/2 lg:w-2/3">
            <div className="flex space-x-2 mb-[30px] items-center">
              <Icon
                icon="gtp:gtp-about"
                className="w-[30px] h-[30px] md:w-9 md:h-9"
              />
              <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
                About growthepie
              </Heading>
            </div>
            <div className="block md:hidden relative mt-[0px] lg:mt-[15px] mb-[30px] lg:-mb-[30px] h-[190px]">
              <Image
                src="/GTP-Data-Kraken.png"
                fill={true}
                alt="About growthepie"
                className="object-contain"
              />
            </div>
            <div className="text-base md:text-sm lg:text-base">
              At growthepie, our mission is to provide comprehensive and
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
          <div className="hidden md:flex md:flex-1 relative mt-[5px] lg:mt-[15px] -mb-[10px] lg:-mb-[30px]">
            <Image
              src="/GTP-Data-Kraken.png"
              fill={true}
              alt="About growthepie"
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex mt-[25px] md:mt-[90px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
          <Icon
            icon="gtp:gtp-faq"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
            Frequently Asked Questions
          </Heading>
        </div>
        <div className="flex flex-col space-y-[15px] my-0 md:my-[30px]">
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="What's up with the name?"
            answer={
              <>
                We view the different layer 2 solutions for the Ethereum
                ecosystem as complementary technologies that enable more use
                cases, rather than competitors vying for market share. We
                believe that the space is a positive-sum game, where each unique
                flavor of layer 2 technology brings its own benefits to the
                table. Through collaboration and innovation, the Ethereum
                community can unlock the full potential of layer 2 solutions and
                continue to expand it&apos;s user-base and evolve in exciting
                ways.
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
                networks, such as Arbitrum and OP Mainnet, in the same week, it
                would be included in the &quot;multiple&quot; category, but not
                attributed to either Arbitrum or OP Mainnet. For a more detailed
                breakdown of active addresses on each individual chain, please
                refer to the{" "}
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
                partial weeks. The date that you can see in the chart is always
                the start of the week (Monday). Our landing page numbers will
                update every Monday.
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
                raw data of each L2. This makes adding new L2s time and resource
                consuming.
              </>
            }
          />
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="Are the dates on this website my regional timezone or UTC?"
            answer={
              <>
                All dates on our website use UTC time. This makes it easier for
                us to aggregate data and we avoid confusion when people in
                different timezones exchange charts.
              </>
            }
          />
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="Interested in collaborating with us?"
            answer={
              <>
                We are always looking for new collaborators. If you are
                interested in working with us, please send us a message in our{" "}
                <Link
                  href="https://discord.gg/fxjJFe7QyN"
                  className="underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Discord
                </Link>
                .
              </>
            }
          />
        </div>
      </Container>
    </>
  );
}
