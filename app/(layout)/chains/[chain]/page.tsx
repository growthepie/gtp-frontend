"use client";
import Link from "next/link";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys, AllChainsByUrlKey } from "@/lib/chains";
import ChainChart from "@/components/layout/ChainChart";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon } from "@iconify/react";
import { ChainResponse } from "@/types/api/ChainResponse";
import { BlockspaceURLs, ChainURLs, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import {
  ChainOverviewResponse,
  Chains,
} from "@/types/api/ChainOverviewResponse";
import { useMemo, useState, useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";
import { notFound } from "next/navigation";
import { ChainsData } from "@/types/api/ChainResponse";

const Chain = ({ params }: { params: any }) => {
  const { chain } = params;

  const [chainKey, setChainKey] = useState<string[]>(
    AllChains.find((c) => c.urlKey === chain)?.key
      ? [AllChains.find((c) => c.urlKey === chain)?.key as string]
      : [],
  );

  const [chainError, setChainError] = useState(null);
  const [chainData, setChainData] = useState<ChainsData[] | null>(null);
  const [chainValidating, setChainValidating] = useState(true);
  const [chainLoading, setChainLoading] = useState(true);
  const [openChainList, setOpenChainList] = useState<boolean>(false);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const fetchChainData = async () => {
    if (!chainKey || chainKey.length === 0) {
      return;
    }

    try {
      const fetchPromises = chainKey.map(async (chainKey) => {
        const response = await fetch(ChainURLs[chainKey]);
        const data = await response.json();
        return data;
      });

      const responseData = await Promise.all(fetchPromises);

      // Flatten the structure by removing the "data" layer
      const flattenedData = responseData.map((item) => item.data);

      setChainData(flattenedData);
      setChainError(null);
    } catch (error) {
      setChainData(null);
      setChainError(error);
    } finally {
      setChainValidating(false);
      setChainLoading(false);
    }
  };

  useEffect(() => {
    fetchChainData();
  }, [chainKey]);

  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainOverviewResponse>(BlockspaceURLs["chain-overview"]);

  const chainFilter = useMemo(() => {
    const filteredChains: Chains = Object.keys(AllChainsByKeys)
      .filter((key) => key === chainKey[0] || key === "all_l2s")
      .reduce((result, chain) => {
        const filterKey = AllChainsByKeys[chain].key;
        const chainData = usageData?.data.chains[filterKey];

        if (chainData) {
          result[filterKey] = chainData;
        }

        return result;
      }, {});

    return filteredChains;
  }, [usageData?.data.chains]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "max",
  );

  if (!chainKey) return notFound();

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, chainLoading, usageLoading]}
        dataValidating={[masterValidating, chainValidating, usageLoading]}
      />
      <Container className="flex w-full mt-[65px] md:mt-[45px]">
        {master && (
          <div className="flex flex-col w-full">
            <div className="flex flex-col md:flex-row justify-between items-start w-full">
              <div className="flex flex-col md:flex-row mb-[15px] md:mb-[19px] items-start">
                <div className="flex">
                  <Image
                    src="/GTP-Link.svg"
                    alt="GTP Chain"
                    className="object-contain w-[32px] h-[32px] self-center mr-[8px]"
                    height={36}
                    width={36}
                  />
                  <Heading
                    className="text-2xl leading-snug text-[36px] break-inside-avoid"
                    as="h1"
                  >
                    {AllChainsByKeys[chainKey[0]].label}
                  </Heading>
                </div>
                <div className="hidden md:flex items-start space-x-[7px] font-inter uppercase">
                  <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                    {master.chains[chainKey[0]].technology}
                  </div>
                  {master.chains[chainKey[0]].purpose.includes("(EVM)") ? (
                    <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                      EVM
                    </div>
                  ) : (
                    <>
                      {master.chains[chainKey[0]].purpose
                        .split(", ")
                        .map((purpose: string) => (
                          <div
                            key={purpose}
                            className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]"
                          >
                            {purpose}
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </div>
              <div className="hidden lg:flex space-x-[10px] text-sm md:text-sm xl:text-base items-start">
                {/* <div
                  className={`flex flex-col bg-forest-900  px-4 py-2 
                  ${openChainList ? "rounded-2xl" : "rounded-full"}`}
                  onClick={() => {
                    setOpenChainList(!openChainList);
                  }}
                >
                  Chain List
                  {openChainList ? (
                    <div className="border-white border-[1px] ">
                      {AllChains.map((chainItem, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setChainKey([...chainKey, chainItem.key]);
                          }}
                        >
                          {chainItem.key}
                        </div>
                      ))}{" "}
                    </div>
                  ) : (
                    <></>
                  )}
                </div> */}
                <Link
                  href={master.chains[chainKey[0]].block_explorer}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:copy" className="w-4 h-4" />
                  <div>Block Explorer</div>
                </Link>
                <Link
                  href={master.chains[chainKey[0]].website}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div>Website</div>
                </Link>
                <Link
                  href={master.chains[chainKey[0]].twitter}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div>
                    <span className="">@</span>
                    {master.chains[chainKey[0]].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex items-center w-[99%] mx-auto  mb-[30px]">
              <div className="text-[16px]">
                {AllChainsByKeys[chainKey[0]].description
                  ? AllChainsByKeys[chainKey[0]].description
                  : ""}
              </div>
            </div>

            <div className="flex md:hidden items-start space-x-[7px] font-inter uppercase px-[7px] mb-[21px]">
              <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                {master.chains[chainKey[0]].technology}
              </div>
              {master.chains[chainKey[0]].purpose.includes("(EVM)") ? (
                <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                  EVM
                </div>
              ) : (
                <>
                  {master.chains[chainKey[0]].purpose
                    .split(", ")
                    .map((purpose: string) => (
                      <div
                        key={purpose}
                        className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]"
                      >
                        {purpose}
                      </div>
                    ))}
                </>
              )}
            </div>
            {chainData && (
              <ChainChart
                chain={chain}
                data={chainData}
                chainKey={chainKey}
                updateChainKey={setChainKey}
              />
            )}
            <div className="flex lg:hidden justify-between text-base items-start mb-8 mt-[30px] lg:mt-[15px]">
              <Link
                href={master.chains[chainKey[0]].block_explorer}
                className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                rel="noreferrer"
                target="_blank"
              >
                <Icon icon="feather:copy" className="w-4 h-4" />
                <div className="block">Block Explorer</div>
              </Link>
              <div className="flex space-x-[10px]">
                <Link
                  href={master.chains[chainKey[0]].website}
                  className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div className="hidden md:block">Website</div>
                </Link>
                <Link
                  href={master.chains[chainKey[0]].twitter}
                  className="flex  h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div className="hidden md:block">
                    <span className="">@</span>
                    {master.chains[chainKey[0]].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
      {/* {usageData && chainKey[0] !== "ethereum" && (
        <>
          <Container className="flex flex-col w-full mt-[65px] md:mt-[60px]">
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
                  className="text-[20px] leading-snug lg:text-[30px]"
                  as="h2"
                >
                  {AllChainsByKeys[chainKey[0]].label} Blockspace
                </Heading>
              </div>
            </div>
            <div className="flex items-center w-[99%] mx-auto mb-[30px]">
              <div className="text-[16px]">
                An overview of {AllChainsByKeys[chainKey[0]].label} high-level
                blockspace usage. All expressed in share of chain usage. You can
                toggle between share of chain usage or absolute numbers.
              </div>
            </div>
          </Container>

          <OverviewMetrics
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={chainFilter}
            forceSelectedChain={chainKey[0]}
          />
        </>
      )} */}
    </>
  );
};

export default Chain;
