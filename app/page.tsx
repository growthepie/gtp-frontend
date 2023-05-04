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

export default function Home() {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  const { data: landing, error: landingError } =
    useSWR<LandingPageMetricsResponse>(
      "https://d2cfnw27176mbd.cloudfront.net/v0_3/landing_page.json"
    );

  const { data: master, error: masterError } = useSWR<MasterResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_3/master.json"
  );

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

  if (!master || !landing) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex w-full mt-[0rem]">
      <div className={`flex flex-col flex-1 pl-2 md:pl-6`}>
        {data && (
          <>
            <Heading className="text-2xl leading-snug md:text-3xl lg:text-4xl xl:text-5xl mb-[30px]">
              Growing the Ethereum Ecosystem Together
            </Heading>
            {/* <Subheading className="text-sm leading-snug">
              Compare Ethereum&apos;s Layer-2 solutions and better understand
              the metrics to grow the ecosystem.
            </Subheading> */}
            <div className="flex mt-10 mb-4 space-x-2 items-center">
              <Icon icon="gtp:gtp-pie" className="w-9 h-9" />
              <Heading className="text-[30px] leading-snug font-bold">
                Layer 2 User Base
              </Heading>
            </div>
            <Subheading className="text-base leading-snug mb-[15px]">
              Number of unique addresses interacting with one or multiple L2s in
              a given week.
            </Subheading>
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
                source={landing.data.metrics.user_base.source}
                latest_total={data.latest_total}
                l2_dominance={data.l2_dominance}
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
        <div className="flex mt-[90px] mb-[30px] space-x-2 items-center">
          <Icon icon="gtp:gtp-about" className="w-9 h-9" />
          <Heading className="text-[30px] leading-snug font-bold">
            About Grow The Pie
          </Heading>
        </div>
        <div className="flex">
          <div className="text-sm lg:text-base w-1/2 xl:w-1/3">
            At GrowThePie, our mission is to provide comprehensive and accurate
            analytics of layer 2 solutions for the Ethereum ecosystem, acting as
            a trusted data aggregator from reliable sources such as L2Beat and
            DefiLlama, while also developing our own metrics. Through our
            analytics interface, we aim to educate and increase transparency.
            Our goal is to be one of the go-to resources for those seeking to
            learn more about the potential of layer 2 technologies and their
            impact on the future of the Ethereum ecosystem.
          </div>
          <div className="flex-1 relative">
            <Image
              src="/GTP-Data-Kraken.png"
              fill={true}
              alt="About Grow The Pie"
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex mt-[90px] mb-[30px] space-x-2 items-center">
          <Icon icon="gtp:gtp-faq" className="w-9 h-9" />
          <Heading className="text-[30px] leading-snug font-bold">
            Frequently Asked Questions
          </Heading>
        </div>
        <div className="flex flex-col space-y-[15px]">
          <div className="rounded-3xl bg-forest-50 px-10 py-5 flex flex-col space-y-[15px]">
            <div className="font-semibold">What's up with the name?</div>
            <div>
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

          <div className="rounded-3xl bg-forest-50 px-10 py-5 flex flex-col space-y-[15px]">
            <div className="font-semibold">Am I a sophisticated question?</div>
            <div>
              Yes I think you are, and here is my lengthy sophisticated answer
              to your ridiculously sophisticated question. My main goal here is
              to explain that I try to use 2 lines of text, to see if this is
              good looking. And I think it is. Great!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
