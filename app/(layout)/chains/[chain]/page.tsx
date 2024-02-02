"use client";
import Link from "next/link";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys, AllChainsByUrlKey } from "@/lib/chains";
import ChainChart from "@/components/layout/ChainChart";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon } from "@iconify/react";
import { ChainResponse } from "@/types/api/ChainResponse";
import {
  BlockspaceURLs,
  ChainBlockspaceURLs,
  ChainURLs,
  MasterURL,
} from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import {
  ChainData,
  ChainOverviewResponse,
  Chains,
} from "@/types/api/ChainOverviewResponse";
import { useMemo, useState, useEffect } from "react";
import { useSessionStorage } from "usehooks-ts";
import { notFound } from "next/navigation";
import { ChainsData } from "@/types/api/ChainResponse";
import { useTheme } from "next-themes";

const Chain = ({ params }: { params: any }) => {
  const { chain } = params;

  const { theme } = useTheme();

  const [chainKeys, setChainKeys] = useState<string[]>(
    AllChains.find((c) => c.urlKey === chain)?.key
      ? [AllChains.find((c) => c.urlKey === chain)?.key as string]
      : [],
  );

  const [chainError, setChainError] = useState(null);
  const [chainData, setChainData] = useState<ChainsData[]>([]);
  const [chainValidating, setChainValidating] = useState(true);
  const [chainLoading, setChainLoading] = useState(true);
  const [openChainList, setOpenChainList] = useState<boolean>(false);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const { cache, mutate } = useSWRConfig();

  const fetchChainData = async () => {
    if (chainKeys.length === 0) {
      return;
    }

    try {
      const fetchPromises = chainKeys.map(async (chainKey) => {
        // check if the chain is in the cache
        const cachedData = cache.get(ChainURLs[chainKey]);

        if (cachedData) {
          return cachedData.data;
        }

        // if not, fetch the data
        const response = await fetch(ChainURLs[chainKey]);
        const data = await response.json();

        // store the data in the cache
        mutate(ChainURLs[chainKey], data, false);

        return data;
      });

      const responseData = await Promise.all(fetchPromises);

      // Flatten the structure by removing the "data" layer
      const flattenedData = responseData.map((item) => item.data);

      setChainData(flattenedData);
      setChainError(null);
    } catch (error) {
      setChainData([]);
      setChainError(error);
    } finally {
      setChainValidating(false);
      setChainLoading(false);
    }
  };

  useEffect(() => {
    fetchChainData();
  }, [chainKeys]);

  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainData>(ChainBlockspaceURLs[chainKeys[0]]);

  const overviewData = useMemo(() => {
    if (!usageData) return null;

    return { [chainKeys[0]]: usageData };
  }, [chainKeys, usageData]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "max",
  );

  if (chainKeys.length === 0) return notFound();

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
              <div className="flex flex-col md:flex-row mb-[15px] md:mb-[15px] items-start">
                <div className="flex gap-x-[8px] items-center">
                  {/* <Image
                    src="/GTP-Link.svg"
                    alt="GTP Chain"
                    className="object-contain w-[32px] h-[32px] self-center mr-[8px]"
                    height={36}
                    width={36}
                  /> */}
                  <div className="w-9 h-9">
                    <Icon
                      icon={`gtp:${
                        AllChainsByKeys[chainKeys[0]].urlKey
                      }-logo-monochrome`}
                      className="w-9 h-9"
                      style={{
                        color: AllChainsByKeys[chainKeys[0]].colors[theme][1],
                      }}
                    />
                  </div>
                  <Heading
                    className="text-2xl leading-snug text-[36px] break-inside-avoid"
                    as="h1"
                  >
                    {AllChainsByKeys[chainKeys[0]].label}
                  </Heading>
                </div>
                <div className="hidden md:flex items-start space-x-[7px] font-inter uppercase pt-[11px]">
                  <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                    {master.chains[chainKeys[0]].technology}
                  </div>
                  {master.chains[chainKeys[0]].purpose.includes("(EVM)") ? (
                    <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                      EVM
                    </div>
                  ) : (
                    <>
                      {master.chains[chainKeys[0]].purpose
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
                <Link
                  href={master.chains[chainKeys[0]].block_explorer}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:copy" className="w-4 h-4" />
                  <div>Block Explorer</div>
                </Link>
                <Link
                  href={master.chains[chainKeys[0]].website}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div>Website</div>
                </Link>
                <Link
                  href={master.chains[chainKeys[0]].twitter}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div>
                    <span className="">@</span>
                    {master.chains[chainKeys[0]].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex items-center mb-[15px]">
              <div className="text-[16px]">
                {AllChainsByKeys[chainKeys[0]].description
                  ? AllChainsByKeys[chainKeys[0]].description
                  : ""}
              </div>
            </div>

            <div className="flex md:hidden items-start space-x-[7px] font-inter uppercase px-[7px] mb-[21px]">
              <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                {master.chains[chainKeys[0]].technology}
              </div>
              {master.chains[chainKeys[0]].purpose.includes("(EVM)") ? (
                <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                  EVM
                </div>
              ) : (
                <>
                  {master.chains[chainKeys[0]].purpose
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
            {chainData.length > 0 && (
              <ChainChart
                chain={chain}
                data={chainData}
                chainKey={chainKeys}
                updateChainKey={setChainKeys}
              />
            )}
            <div className="flex lg:hidden justify-between text-base items-start mb-8 mt-[30px] lg:mt-[15px]">
              <Link
                href={master.chains[chainKeys[0]].block_explorer}
                className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                rel="noreferrer"
                target="_blank"
              >
                <Icon icon="feather:copy" className="w-4 h-4" />
                <div className="block">Block Explorer</div>
              </Link>
              <div className="flex space-x-[10px]">
                <Link
                  href={master.chains[chainKeys[0]].website}
                  className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div className="hidden md:block">Website</div>
                </Link>
                <Link
                  href={master.chains[chainKeys[0]].twitter}
                  className="flex  h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div className="hidden md:block">
                    <span className="">@</span>
                    {master.chains[chainKeys[0]].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
      {overviewData !== null && chainKeys[0] !== "ethereum" && (
        <>
          <Container className="flex flex-col w-full mt-[65px] md:mt-[60px]">
            <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
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
                  {AllChainsByKeys[chainKeys[0]].label} Blockspace
                </Heading>
              </div>
            </div>
            <div className="flex items-center mb-[30px]">
              <div className="text-[16px]">
                An overview of {AllChainsByKeys[chainKeys[0]].label} high-level
                blockspace usage. All expressed in share of chain usage. You can
                toggle between share of chain usage or absolute numbers.
              </div>
            </div>
          </Container>

          <OverviewMetrics
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={overviewData}
            forceSelectedChain={chainKeys[0]}
          />
        </>
      )}
    </>
  );
};

export default Chain;
