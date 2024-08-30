"use client";
import { useMemo, useState, useEffect } from "react";
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
import { Get_SupportedChainKeys } from "@/lib/chains";
import { Chains } from "@/types/api/ChainOverviewResponse";
import ShowLoading from "@/components/layout/ShowLoading";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import { useMaster } from "@/contexts/MasterContext";
import { filter } from "lodash";

const ChainOverview = () => {
  const { AllChainsByKeys } = useMaster();
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

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

  const [chainEcosystemFilter, setChainEcosystemFilter] = useSessionStorage(
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

  useEffect(() => {
    if (selectedTimespan === "1d") {
      setSelectedTimespan("7d");
    }
  }, []);

  const chainFilter = useMemo(() => {
    const filteredChains: Chains = Object.keys(AllChainsByKeys)
      .filter((chain) => {
        const supportedChainKeys = Get_SupportedChainKeys(master);
        const isSupported =
          chain === "all_l2s" ? true : supportedChainKeys.includes(chain);
        const isMaster = master?.chains[chain] ? true : false;
        const passEcosystem =
          chain === "all_l2s"
            ? true
            : isMaster
            ? chainEcosystemFilter === "all-chains"
              ? true
              : AllChainsByKeys[chain].ecosystem.includes(chainEcosystemFilter)
            : false;

        return passEcosystem && isSupported;
      })
      .reduce((result, chain) => {
        const chainKey = AllChainsByKeys[chain].key;
        const chainData = usageData?.data.chains[chainKey];

        if (chainData) {
          result[chainKey] = chainData;
        }

        return result;
      }, {});

    return filteredChains;
  }, [chainEcosystemFilter, master, usageData?.data.chains]);

  console.log(chainFilter);

  return (
    <>
      {master && (
        <>
          <ShowLoading
            dataLoading={[usageLoading]}
            dataValidating={[usageValidating]}
          />
          <Container
            className="flex flex-col w-full pt-[65px] md:pt-[30px] gap-y-[15px] mb-[15px]"
            isPageRoot
          >
            <div className="flex items-center w-[99.8%] justify-between md:text-[36px] relative">
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
            <div className="flex items-center w-[99%] mx-auto ">
              <div className="text-[14px]">
                An overview of chains high-level blockspace usage. All expressed
                in share of chain usage. You can toggle between share of chain
                usage or absolute numbers.
              </div>
            </div>
          </Container>

          {usageData && (
            <OverviewMetrics
              selectedTimespan={selectedTimespan}
              setSelectedTimespan={setSelectedTimespan}
              data={chainFilter}
              master={master}
              // data={!chainEcosystemFilter || chainEcosystemFilter=== "all-chains" ? usageData.data.chains : )}
            />
          )}
        </>
      )}
    </>
  );
};

export default ChainOverview;
