"use client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
// import { DataSelector } from "@/components/home/DataSelector";
// import { DataSources } from "@/components/home/DataSources";
import MainChart from "@/components/home/MainChart";
import Popover from "@/components/Popover";
import { useLocalStorage } from "usehooks-ts";
import {
  ArrowsRightLeftIcon,
  LinkIcon,
  TicketIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import { Icon } from "@iconify/react";
import styles from "./page.module.css";
import { Tag } from "@/components/Tag";
import { useEffect, useMemo, useState } from "react";
// import { useMetricsData } from "@/context/MetricsProvider";
import { ReactJson } from "@/components/ReactJson";
import Image from "next/image";
import Sidebar, { SidebarItems } from "@/components/layout/Sidebar";
import { useMediaQuery } from "@react-hook/media-query";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import ComparisonChart from "@/components/layout/ComparisonChart";
import useSWR from "swr";
import { DAAMetricsResponse } from "@/types/api/DAAMetricsResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains } from "@/lib/chains";
import _ from "lodash";
import MetricsTable from "@/components/layout/MetricsTable";
import { LandingPageMetricsResponse } from "@/types/api/LandingPageMetricsResponse";
import LandingChart from "@/components/layout/LandingChart";

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
    "https://d2cfnw27176mbd.cloudfront.net/v0_2/master.json"
  );

  const [data, setData] = useState(null);

  const [selectedTimeInterval, setSelectedTimeInterval] = useState("weekly");

  useEffect(() => {
    if (landing) {
      setData(landing.data.metrics.user_base[selectedTimeInterval]);
    }
  }, [landing]);

  const [selectedFilter, setSelectedFilter] = useState({
    name: "Fundamentals",
  });

  const [selectedFilterOption, setSelectedFilterOption] = useState({
    label: "Total Value Locked",
    rootKey: "metricsTvl",
  });

  const chains = useMemo(() => {
    if (!data) return [];

    if (selectedFilter.name === "Fundamentals")
      return AllChains.filter(
        (chain) =>
          Object.keys(data.chains).includes(chain.key) &&
          chain.key != "ethereum"
      );

    return AllChains.filter(
      (chain) =>
        Object.keys(data.chains).includes(chain.key) && chain.key != "ethereum"
    );
  }, [data, selectedFilter.name]);

  const [selectedChains, setSelectedChains] = useState(
    AllChains.map((chain) => chain.key)
  );

  const [errorCode, setErrorCode] = useState(0);

  if (!master || !landing) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex w-full mt-[5rem]">
      <div className={`flex flex-col flex-1 pl-2 md:pl-6`}>
        {data && (
          <>
            <Heading className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl mb-6">
              Growing the Ethereum Ecosystem Together
            </Heading>
            <Subheading className="text-sm">
              Compare Ethereum&apos;s Layer-2 solutions and better understand
              the metrics to grow the ecosystem.
            </Subheading>
            <Heading className="text-lg md:text-xl lg:text-2xl xl:text-3xl mt-10 mb-4 flex">
              <Image
                src="/landing-pie.png"
                alt="pie slice"
                width={32}
                height={32}
                className="mr-2"
              />
              Web3 User Base
            </Heading>
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
              />
            </div>
            {/* <MetricsTable
              data={daa.data.chains}
              selectedChains={selectedChains}
              setSelectedChains={setSelectedChains}
              chains={chains}
              metric={daa.data.metric_id}
              fixedWidth={false}
            /> */}
          </>
        )}
      </div>
    </div>
  );
}
