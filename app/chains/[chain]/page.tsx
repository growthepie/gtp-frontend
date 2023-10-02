"use client";
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
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";

const Chain = ({ params }: { params: any }) => {
  const { chain } = params;

  const chainKey = AllChains.find((c) => c.urlKey === chain)?.key;
  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const {
    data: chainData,
    error: chainError,
    isValidating: chainValidating,
    isLoading: chainLoading,
  } = useSWR<ChainResponse>(chainKey ? ChainURLs[chainKey] : null);

  if (!chainKey) {
    return <div>Chain not found</div>;
  }

  return (
    <>
      <ShowLoading
        dataLoading={[masterLoading, chainLoading]}
        dataValidating={[masterValidating, chainValidating]}
      />
      <Container className="flex w-full mt-[65px] md:mt-[45px]">
        {master && (
          <div className="flex flex-col w-full">
            <div className="flex flex-col md:flex-row justify-between items-start w-full">
              <div className="flex flex-col md:flex-row mb-[15px] md:mb-[19px] items-start">
                <Heading
                  className="text-2xl leading-snug text-[36px] break-inside-avoid"
                  as="h1"
                >
                  {AllChainsByKeys[chainKey].label}
                </Heading>
                <div className="hidden md:flex items-start space-x-[7px] font-inter uppercase">
                  <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                    {master.chains[chainKey].technology}
                  </div>
                  {master.chains[chainKey].purpose.includes("(EVM)") ? (
                    <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                      EVM
                    </div>
                  ) : (
                    <>
                      {master.chains[chainKey].purpose
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
                  href={master.chains[chainKey].block_explorer}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:copy" className="w-4 h-4" />
                  <div>Block Explorer</div>
                </Link>
                <Link
                  href={master.chains[chainKey].website}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div>Website</div>
                </Link>
                <Link
                  href={master.chains[chainKey].twitter}
                  className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div>
                    <span className="">@</span>
                    {master.chains[chainKey].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
            <Subheading
              className="text-[16px] w-10/12 md:w-auto"
              leftIcon={
                AllChainsByKeys[chainKey].icon && (
                  <div className="self-start md:self-center pr-[7px] pl-[0px] pt-0.5 md:pt-0 md:pr-[10px] md:pl-[30px]">
                    <Icon
                      icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
                      className="w-5 h-5 md:w-6 md:h-6"
                    />
                  </div>
                )
              }
              iconContainerClassName="items-center mb-[15px] md:mb-[32px]"
            >
              {AllChainsByKeys[chainKey].description
                ? AllChainsByKeys[chainKey].description
                : ""}
            </Subheading>
            <div className="flex md:hidden items-start space-x-[7px] font-inter uppercase px-[7px] mb-[21px]">
              <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 dark:border-forest-500 px-[4px] font-bold rounded-sm ml-[19px]">
                {master.chains[chainKey].technology}
              </div>
              {master.chains[chainKey].purpose.includes("(EVM)") ? (
                <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400  bg-forest-400 text-forest-50 dark:border-forest-500 dark:bg-forest-500 dark:text-forest-900 px-[4px] font-bold rounded-sm ml-[7px]">
                  EVM
                </div>
              ) : (
                <>
                  {master.chains[chainKey].purpose
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
            {chainData && <ChainChart chain={chain} data={chainData.data} />}
            <div className="flex lg:hidden justify-between text-base items-start mb-8 mt-[30px] lg:mt-[15px]">
              <Link
                href={master.chains[chainKey].block_explorer}
                className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                rel="noreferrer"
                target="_blank"
              >
                <Icon icon="feather:copy" className="w-4 h-4" />
                <div className="block">Block Explorer</div>
              </Link>
              <div className="flex space-x-[10px]">
                <Link
                  href={master.chains[chainKey].website}
                  className="flex h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:external-link" className="w-4 h-4" />
                  <div className="hidden md:block">Website</div>
                </Link>
                <Link
                  href={master.chains[chainKey].twitter}
                  className="flex  h-[40px] items-center space-x-2 justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-4 py-2"
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon icon="feather:twitter" className="w-4 h-4" />
                  <div className="hidden md:block">
                    <span className="">@</span>
                    {master.chains[chainKey].twitter.split(
                      "https://twitter.com/",
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
      {/*Time selection */}
    </>
  );
};

export default Chain;
