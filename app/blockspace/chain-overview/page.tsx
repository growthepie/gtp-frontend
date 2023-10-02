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
      <Container className="flex flex-col w-full mt-[65px] md:mt-[75px]">
        <div className="flex items-center w-[99.8%] justify-between md:text-[36px] mb-[15px] md:mb-[30px]">
          <Heading className="text-[30px] leading-snug md:text-[36px]" as="h1">
            Chain Overview
          </Heading>
          <EcosystemDropdown
          // optOpen={optOpen}
          // setOptOpen={setOptOpen}
          // selectedStack={selectedStack}
          // setSelectedStack={setSelectedStack}
          />
        </div>
        <Subheading
          className="text-[16px]"
          leftIcon={
            pageData.icon && (
              <div className="self-start md:self-center pr-[7px] pl-[0px] pt-0.5 md:pt-0 md:pr-[10px] md:pl-[0px]">
                <Icon
                  icon={pageData.icon}
                  className={`relative  w-5 h-5 md:w-6 md:h-6 ${
                    isSidebarOpen
                      ? "bottom-8"
                      : "bottom-[0px] xs:bottom-[0px] sm:bottom-0 md:bottom-[70px] lg:bottom-6 "
                  }`}
                />
              </div>
            )
          }
          iconContainerClassName="items-center mb-[22px] md:mb-[32px] relative"
        >
          <p>{pageData.description}</p>
          {pageData.note && (
            <div className="absolute text-xs">
              <span className="font-semibold text-forest-200 dark:text-forest-400">
                Note:{" "}
              </span>
              {pageData.note}
            </div>
          )}
        </Subheading>
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
