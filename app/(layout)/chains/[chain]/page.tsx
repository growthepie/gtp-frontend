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
import { useMediaQuery } from "usehooks-ts";
import { track } from "@vercel/analytics/react";

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
  const [chainValidating, setChainValidating] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);
  const [openChainList, setOpenChainList] = useState<boolean>(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

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
    if (chainData.length === 0) {
      setChainLoading(true);
      setChainValidating(true);
    }
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

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (chainKeys.length === 0) return notFound();

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, chainLoading, !usageError && usageLoading]}
        dataValidating={[masterValidating, chainValidating, !usageError && usageValidating]}
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
                      icon={`gtp:${AllChainsByKeys[chainKeys[0]].urlKey
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
                    {master.chains[chainKeys[0]].name}
                  </Heading>
                </div>
                <div className="hidden md:flex items-start space-x-[7px] font-inter uppercase pt-[11px] ">
                  <div
                    className={`inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm  ${isMobile ? "ml-[0px]" : "ml-[19px]"
                      } `}
                  >
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
              <div className="hidden lg:flex flex-row-reverse gap-x-[10px] text-sm items-start">
                <div className="peer group relative">
                  <div
                    className={`relative !z-[1] flex items-center gap-x-[8px] font-semibold border border-forest-50 dark:border-forest-900 bg-forest-50 dark:bg-forest-900 transition-all duration-300 rounded-full px-[16px] py-[7px] w-[91px] group-hover:w-[213px] delay-0`}
                  >
                    <Icon icon="feather:chevron-right" className={`w-4 h-4 transition-transform duration-300 transform group-hover:rotate-90`} />
                    <div>More</div>
                  </div>

                  <div
                    className="absolute top-[15px] left-0 !z-[-0] h-0 delay-0 group-hover:h-[119px] overflow-hidden transition-all duration-300 ease-in-out bg-forest-50 dark:bg-forest-1000 rounded-b-[22px] group-hover:pt-[29px] group-hover:pb-[10px] break-inside-avoid w-[91px] group-hover:w-[213px] shadow-transparent group-hover:shadow-[0px_4px_46.2px_0px_#000000]">
                    <Link
                      href={master.chains[chainKeys[0]].website}
                      className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[213px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Icon icon="feather:external-link" className="w-4 h-4" />
                      <div>Website</div>
                    </Link>
                    <Link
                      href={master.chains[chainKeys[0]].twitter}
                      className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[213px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
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
                <Link
                  href={master.chains[chainKeys[0]].block_explorer}
                  // className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-2"
                  className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[8px] transition-all duration-300 peer-hover:[&>div]:w-[0px] [&>div]:w-[99px] peer-hover:gap-x-0"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="gtp:gtp-block-explorer" className="w-4 h-4" />
                  <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">Block Explorer</div>
                </Link>
                {(master.chains[chainKeys[0]].rhino_listed &&
                  <Link
                    href={master.chains[chainKeys[0]].rhino_naming ? `https://app.rhino.fi/bridge?refId=PG_GrowThePie&token=ETH&chainOut=${master.chains[chainKeys[0]].rhino_naming}&chain=ETHEREUM` : "https://app.rhino.fi/bridge/?refId=PG_GrowThePie"}
                    className="flex p-[1px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full peer-hover:[&>div>div]:w-[0px] [&>div>div]:w-[45px] peer-hover:[&>div]:gap-x-0"
                    rel="noreferrer" target="_blank"
                    onClick={() => {
                      track("clicked RhinoFi Bridge link", {
                        location: isMobile ? `mobile Chain page` : `desktop Chain page`,
                        page: window.location.pathname,
                      });
                    }}
                  >
                    <div className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[7px] transition-all duration-300">
                      <Icon icon="gtp:gtp-bridge" className="w-4 h-4" />
                      <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">Bridge</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center mb-[15px]">
              <div className="text-[16px]">
                {master.chains[chainKeys[0]].description
                  ? master.chains[chainKeys[0]].description
                  : ""}
              </div>
            </div>

            <div className="flex md:hidden items-start space-x-[7px] font-inter uppercase  mb-[21px] ">
              <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ">
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
            <div className="flex lg:hidden flex-row-reverse gap-x-[10px] justify-between text-sm mb-8 mt-[30px] lg:mt-[15px]">
              <div className="peer group relative">
                <div
                  className={`relative !z-[1] flex items-center gap-x-[8px] font-semibold border border-forest-50 dark:border-forest-900 bg-forest-50 dark:bg-forest-900 transition-all duration-300 rounded-full px-[16px] py-[7px] w-[91px] group-hover:w-[213px] delay-0`}
                >
                  <Icon icon="feather:chevron-right" className={`w-4 h-4 transition-transform duration-300 transform group-hover:rotate-90`} />
                  <div>More</div>
                </div>

                <div
                  className="absolute top-[15px] left-0 !z-[-0] h-0 delay-0 group-hover:h-[119px] overflow-hidden transition-all duration-300 ease-in-out bg-forest-50 dark:bg-forest-1000 rounded-b-[22px] group-hover:pt-[29px] group-hover:pb-[10px] break-inside-avoid w-[91px] group-hover:w-[213px] shadow-transparent group-hover:shadow-[0px_4px_46.2px_0px_#000000]">
                  <Link
                    href={master.chains[chainKeys[0]].website}
                    className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[213px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon icon="feather:external-link" className="w-4 h-4" />
                    <div>Website</div>
                  </Link>
                  <Link
                    href={master.chains[chainKeys[0]].twitter}
                    className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[213px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
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
              <Link
                href={master.chains[chainKeys[0]].block_explorer}
                // className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-2"
                className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[8px] transition-all duration-300 peer-hover:[&>div]:w-[0px] [&>div]:w-[59px] peer-hover:gap-x-0"
                rel="noreferrer"
                target="_blank"
              >
                <Icon icon="gtp:gtp-block-explorer" className="w-4 h-4" />
                <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">Explorer</div>
              </Link>
              {(master.chains[chainKeys[0]].rhino_listed &&
                <Link
                  href={master.chains[chainKeys[0]].rhino_naming ? `https://app.rhino.fi/bridge?refId=PG_GrowThePie&token=ETH&chainOut=${master.chains[chainKeys[0]].rhino_naming}&chain=ETHEREUM` : "https://app.rhino.fi/bridge/?refId=PG_GrowThePie"}
                  className="flex p-[1px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full peer-hover:[&>div>div]:w-[0px] [&>div>div]:w-[45px] peer-hover:[&>div]:gap-x-0"
                  rel="noreferrer" target="_blank"
                  onClick={() => {
                    track("clicked RhinoFi Bridge link", {
                      location: isMobile ? `mobile Chain page` : `desktop Chain page`,
                      page: window.location.pathname,
                    });
                  }}
                >
                  <div className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[7px] transition-all duration-300">
                    <Icon icon="gtp:gtp-bridge" className="w-4 h-4" />
                    <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">Bridge</div>
                  </div>
                </Link>)}
            </div>
          </div>
        )}
      </Container >

      {master && overviewData !== null && chainKeys[0] !== "ethereum" && (
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
                  {master.chains[chainKeys[0]].name} Blockspace
                </Heading>
              </div>
            </div>
            <div className="flex items-center mb-[30px]">
              <div className="text-[16px]">
                An overview of {master.chains[chainKeys[0]].name} high-level
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
      )
      }
    </>
  );
};

export default Chain;
