"use client";
import { useMemo, useState } from "react";
import Heading from "@/components/layout/Heading";
import Container from "@/components/layout/Container";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import EcosystemDropdown from "@/components/layout/EcosystemDropdown";
import Image from "next/image";
import { useSessionStorage, useLocalStorage } from "usehooks-ts";
import { ChainOverviewResponse } from "@/types/api/ChainOverviewResponse";
import { BlockspaceURLs } from "@/lib/urls";
import ReactJson from "react-json-view";
import useSWR from "swr";
import { Icon } from "@iconify/react";
import { navigationItems } from "@/lib/navigation";
import Subheading from "@/components/layout/Subheading";
import { useUIContext } from "@/contexts/UIContext";
import { AllChainsByKeys } from "@/lib/chains";
import { Chains } from "@/types/api/ChainOverviewResponse";

const ChainOverview = () => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "max",
  );
  const { isSidebarOpen } = useUIContext();
  const [showEthereumMainnet, setShowEthereumMainnet] = useSessionStorage(
    "blockspaceShowEthereumMainnet",
    false,
  );

  // const [optOpen, setOptOpen] = useState(false);
  // const [selectedStack, setSelectedStack] = useState("all-chains");

  const [chainEcosystemFilter, setChainEcosystemFilter] = useLocalStorage(
    "chainEcosystemFilter",
    "all-chains",
  );

  const pageData = navigationItems[2]?.options.find(
    (item) => item.urlKey === "chain-overview",
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  const chainFilter = useMemo(() => {
    const filteredChains: Chains = Object.keys(AllChainsByKeys)
      .filter((chain) =>
        AllChainsByKeys[chain].ecosystem.includes(chainEcosystemFilter),
      )
      .reduce((result, chain) => {
        const chainKey = AllChainsByKeys[chain].key;
        const chainData = usageData?.data.chains[chainKey];

        if (chainData) {
          result[chainKey] = chainData;
        }

        return result;
      }, {});

    return filteredChains;
  }, [chainEcosystemFilter, usageData]);

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] mb-[15px] relative">
          <div className="flex gap-x-[8px] items-center">
            <Image
              src="/GTP-Package.svg"
              alt="GTP Chain"
              className="object-contain w-[32px] h-[32px]"
              height={36}
              width={36}
            />
            <Heading
              className="text-[26px] leading-snug lg:text-[36px]"
              as="h1"
            >
              Chain Overview
            </Heading>
          </div>
          <EcosystemDropdown />
        </div>
        <div className="flex items-center w-[99%] mx-auto mb-[30px]">
          <div className="text-[16px]">
            An overview of chains high-level blockspace usage. All expressed in
            share of chain usage. You can toggle between share of chain usage or absolute numbers.
          </div>
        </div>
      </Container>

      {usageData && (
        <OverviewMetrics
          showEthereumMainnet={showEthereumMainnet}
          setShowEthereumMainnet={setShowEthereumMainnet}
          selectedTimespan={selectedTimespan}
          setSelectedTimespan={setSelectedTimespan}
          data={chainFilter}
        // data={!chainEcosystemFilter || chainEcosystemFilter=== "all-chains" ? usageData.data.chains : )}
        />
      )}
    </>
  );
};

export default ChainOverview;
