"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { ArbitrumChainResponse } from "@/types/api/ArbitrumChainResponse";
import { AllChains } from "@/lib/chains";
import ChainChart from "@/components/layout/ChainChart";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon } from "@iconify/react";
import { ChainResponse } from "@/types/api/ChainResponse";
import { ChainURLs, MasterURL } from "@/lib/urls";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const { chain } = params;

  const chainKey = AllChains.find((c) => c.urlKey === chain)?.key;

  const [pageName, setPageName] = useState(
    String(chain).charAt(0).toUpperCase() + String(chain).slice(1)
  );

  const { data: master, error: masterError } =
    useSWR<MasterResponse>(MasterURL);

  const { data: ChainResponse, error: ethError } = useSWR<ChainResponse>(
    chainKey ? ChainURLs[chainKey] : null
  );

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

  // const chainData = useMemo(() => {
  //   if (!master) return [];

  //   for (let chainName in master.chains) {
  //     if (chainName === chainKey) {
  //       return master.chains[chainName];
  //     }
  //   }
  // }, [master, chainKey]);

  // const chartData = useMemo(() => {
  //   if (!Arbitrum || !Ethereum || !Optimism || !Polygon || !Imx) return [];

  //   for (let i = 0; i < 5; i++) {
  //     if (chainArray[i]?.data.chain_id === chainKey) {
  //       return chainArray[i]?.data;
  //     }
  //   }
  // }, [chainKey, chainArray, Arbitrum, Optimism, Ethereum, Polygon, Imx]);

  if (!chainKey) {
    return <div>Chain not found</div>;
  }

  if (!master || !ChainResponse || !chainData || !chartData) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }
  // console.log(chainData.name);

  return (
    <>
      {/*Header */}
      <div className="flex w-full pl-2 md:pl-6 mt-10">
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-start w-full">
            <div className="flex items-start">
              <Heading className="text-2xl leading-snug text-[36px] mb-[19px]">
                {chainData.name}
              </Heading>
              <div className="flex items-start space-x-[7px] font-inter uppercase">
                <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 px-[4px] font-bold rounded-sm ml-[19px]">
                  {chainData.technology}
                </div>
                {chainData.purpose.includes("(EVM)") ? (
                  <div className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 bg-forest-400 text-forest-50 px-[4px] font-bold rounded-sm ml-[7px]">
                    EVM
                  </div>
                ) : (
                  <>
                    {chainData.purpose.split(", ").map((purpose: string) => (
                      <div
                        key={purpose}
                        className="inline-block text-xs leading-[16px] border-[1px] border-forest-400 bg-forest-400 text-forest-50 px-[4px] font-bold rounded-sm ml-[7px]"
                      >
                        {purpose}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-[10px] text-base md:text-sm xl:text-base items-start">
              <Link
                href={chainData.block_explorer}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-2"
              >
                <Icon icon="feather:copy" className="w-4 h-4" />
                <div>Block Explorer</div>
              </Link>
              <Link
                href={chainData.website}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-2"
              >
                <Icon icon="feather:external-link" className="w-4 h-4" />
                <div>Website</div>
              </Link>
              <Link
                href={chainData.twitter}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-2"
              >
                <Icon icon="feather:twitter" className="w-4 h-4" />
                <div>
                  <span className="">@</span>
                  {chainData.twitter.split("https://twitter.com/")}
                </div>
              </Link>
            </div>
          </div>
          <Subheading className="text-base leading-snug mb-[32px]">
            Lorem Ipsum about {pageName}
          </Subheading>
          {chartData && <ChainChart data={chartData} />}
        </div>
      </div>
      {/*Time selection */}
    </>
  );
};

export default Chain;
