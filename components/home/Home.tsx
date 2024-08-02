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
      {/* <ShowLoading
        dataLoading={[masterLoading, landingLoading]}
        dataValidating={[masterValidating, landingValidating]}
        fullScreen={true}
      /> */}
      {/* )} */}

      {/* <Container className="flex flex-col flex-1 w-full mt-[65px] md:mt-[45px]">
        <Heading
          className="font-bold leading-snug text-[24px] sm:text-[32px] md:text-[36px] max-w-[900px]"
          as="h1"
        >
          Mastering Ethereum Layer 2s
        </Heading>
        <Subheading className="text-xs sm:text-sm md:text-xl font-medium">
          Your Gateway to Curated Analytics and Knowledge
        </Subheading>
      </Container>
      <Container className="flex flex-col flex-1 w-full">
        <div className="flex space-x-2 mt-[30px] md:mt-[60px] mb-[25px] md:mb-[32px] items-center">
          <Icon
            icon="gtp:fundamentals"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading
            id="layer-2-traction-title"
            className="text-[20px] md:text-[30px] leading-snug font-bold"
          >
            Layer 2 Traction
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mb-[15px] pl-[5px] lg:pl-[45px] flex justify-between items-end space-x-2">
          <div>Aggregated daily metrics across all tracked Layer 2s.</div>
        </Subheading>
      </Container> */}
      {/* <Container className="!px-0 fade-edge-div h-[calc(146px + 24px)] md:h-[calc(176px + 24px)] pb-[24px] -mb-[24px]">
        <Swiper ariaId={"layer-2-traction-title"} />
        <div className="h-[145px] md:h-[183px] w-full">
          <ShowLoading section />
        </div>
      </Container> */}
      {/* 
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
      )} */}
      {/* 
      <Container className="flex flex-col flex-1 w-full relative">
        <div className="flex space-x-2 mt-[30px] md:mt-[60px] items-center">
          <Icon
            icon="gtp:package"
            className="w-[30px] h-[30px] md:w-9 md:h-9"
          />
          <Heading className="text-[20px] md:text-[30px] leading-snug font-bold">
            Blockspace
          </Heading>
        </div>
        <Subheading className="text-base leading-normal md:leading-snug mt-[30px] mb-[15px] px-[5px] w-full lg:w-3/5 lg:px-[45px]">
          Top 6 gas-consuming contracts across all tracked Layer 2s.
        </Subheading>
        <LandingTopContracts />
      </Container> */}

      {/* <Container>
        <div className="flex gap-x-0 md:gap-x-12 w-full ml-0 mt-[30px] md:mt-[60px]">
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
                sizes="25vw"
              />
            </div>
            <div className="text-base md:text-sm lg:text-base">
              At growthepie, our mission is to provide comprehensive and
              accurate analytics Ethereum scaling solutions, 
              acting as a trusted data aggregator from reliable
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
              sizes="25vw"
            />
          </div>
        </div>

        <div className="flex mt-[25px] md:mt-[60px] mb-[25px] md:mb-[30px] ml-1.5 md:ml-0 space-x-2 items-center">
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
            question='What exactly does "Active on Multiple Chains" stand for?'
            answer={
              <>
                The &quot;Active on Multiple Chains&quot; KPI card denotes addresses that were
                active on multiple Layer 2 networks within a given week.
                I.e. if an address was active on Arbitrum and OP Mainnet, in the same week, 
                it would be included in this metric. For a more detailed
                breakdown of active addresses on each individual chain, please
                refer to the{" "}
                <Link
                  href="https://www.growthepie.xyz/fundamentals/daily-active-addresses"
                  className="underline"
                >
                  &quot;Active addresses&quot;
                </Link>{" "}
                tab.
              </>
            }
          />
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="Why have the numbers on the landing page not been updated for a few days?"
            answer={
              <>
                The numbers in the User Base chart use a weekly aggregation. In
                order to avoid confusion we only show completed weeks and no
                partial weeks. The date that you can see in the chart is always
                the start of the week (Monday). These numbers will
                update every Monday. All other numbers on this page update daily.
              </>
            }
          />
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="L2Beat has way more Layer 2s listed why do you not cover all of them?"
            answer={
              <>
                The goal is to cover as many Layer 2s as possible. We will add more
                Layer 2s over time. For our type of analysis, we need access to the
                raw data of each L2. This makes adding new L2s time and resource-consuming.
                Our goal is to cover at least 80% of all Ethereum ecosystem usage.
              </>
            }
          />
          <QuestionAnswer
            className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[46px] py-[23px] flex flex-col"
            question="Are the dates on this website my regional timezone or UTC?"
            answer={
              <>
                All dates on our website use UTC time. This makes it easier for
                us to aggregate data and avoid confusion when people in
                different timezones share charts.
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
      </Container> */}
    </>
  );
}
