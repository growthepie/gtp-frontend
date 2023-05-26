"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
import ChainChart from "@/components/layout/ChainChart";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon } from "@iconify/react";
import { ChainResponse } from "@/types/api/ChainResponse";
import { ChainURLs, MasterURL } from "@/lib/urls";
import LoadingAnimation from "@/components/layout/LoadingAnimation";
import Container from "@/components/layout/Container";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const { chain } = params;

  const chainKey = AllChains.find((c) => c.urlKey === chain)?.key;

  const [pageName, setPageName] = useState(
    String(chain).charAt(0).toUpperCase() + String(chain).slice(1)
  );

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: ChainResponse,
    error: chainError,
    isValidating: chainValidating,
    isLoading: chainLoading,
  } = useSWR<ChainResponse>(chainKey ? ChainURLs[chainKey] : null);

  const [chainData, setChainData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!ChainResponse) return;

    setChartData(ChainResponse.data);
  }, [ChainResponse]);

  useEffect(() => {
    if (!master) return;

    for (let chainName in master.chains) {
      if (chainName === chainKey) {
        setChainData(master.chains[chainName]);
      }
    }
  }, [master, chainKey]);

  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);

  useEffect(() => {
    if (masterLoading || chainLoading) {
      setShowLoading(true);
      if (!masterValidating && !chainValidating) setLoadingTimeoutSeconds(1200);
    }

    if (!masterLoading && !chainLoading)
      setTimeout(() => {
        setShowLoading(false);
      }, loadingTimeoutSeconds);
  }, [
    loadingTimeoutSeconds,
    masterLoading,
    chainLoading,
    masterValidating,
    chainValidating,
  ]);

  if (!chainKey) {
    return <div>Chain not found</div>;
  }

  // console.log(chainData.name);

  return (
    <>
      <div
        className={`absolute w-full h-screen right flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-forest-50 dark:bg-forest-1000 z-50 ${
          showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
      <Container className="flex w-full mt-10">
        {chainData && master && (
          <div className="flex flex-col w-full">
            <div className="flex flex-col md:flex-row justify-between items-start w-full">
              <div className="flex md:hidden space-x-[10px] text-xs md:text-sm xl:text-base items-start mb-8 mt-1">
                <Link
                  href={chainData.block_explorer}
                  className="flex w-1/3 h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:copy" className="w-4 h-4" />
                  <div className="block">Block Explorer</div>
                </Link>
                <Link
                  href={chainData.website}
                  className="flex w-1/3 h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div className="block">Website</div>
                </Link>
                <Link
                  href={chainData.twitter}
                  className="flex w-1/3  h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div className="block">
                    <span className="">@</span>
                    {chainData.twitter.split("https://twitter.com/")}
                  </div>
                </Link>
              </div>
              <div className="flex items-start">
                <Heading className="text-2xl leading-snug text-[36px] mb-[19px]">
                  {chainData.name}
                </Heading>
                <div className="flex items-start space-x-[7px] font-inter uppercase">
                  <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                    {chainData.technology}
                  </div>
                  {chainData.purpose.includes("(EVM)") ? (
                    <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                      EVM
                    </div>
                  ) : (
                    <>
                      {chainData.purpose.split(", ").map((purpose: string) => (
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
              <div className="hidden md:flex space-x-[10px] text-sm md:text-sm xl:text-base items-start">
                <Link
                  href={chainData.block_explorer}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:copy" className="w-4 h-4" />
                  <div>Block Explorer</div>
                </Link>
                <Link
                  href={chainData.website}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div>Website</div>
                </Link>
                <Link
                  href={chainData.twitter}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div>
                    <span className="">@</span>
                    {chainData.twitter.split("https://twitter.com/")}
                  </div>
                </Link>
              </div>
            </div>
            <Subheading
              className="text-[16px] w-10/12 md:w-auto"
              leftIcon={
                AllChainsByKeys[chainKey].icon && (
                  <div className="h-[92%] md:h-auto">
                    <Icon
                      icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
                      className="w-6 h-6 mr-[10px] ml-[10px] md:ml-[30px]"
                    />
                  </div>
                )
              }
              iconContainerClassName="items-center mb-[32px]"
            >
              {AllChainsByKeys[chainKey].description
                ? AllChainsByKeys[chainKey].description
                : ""}
            </Subheading>
            {chartData && <ChainChart chain={chain} data={chartData} />}
          </div>
        )}
      </Container>
      {/*Time selection */}
    </>
  );
};

export default Chain;
