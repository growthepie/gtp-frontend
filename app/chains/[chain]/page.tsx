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
import { ChainURLs } from "@/lib/urls";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const { chain } = params;

  const chainKey = AllChains.find((c) => c.urlKey === chain)?.key;

  const [pageName, setPageName] = useState(
    String(chain).charAt(0).toUpperCase() + String(chain).slice(1)
  );

  const { data: master, error: masterError } = useSWR<MasterResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_4/master.json"
  );

  const { data: ChainResponse, error: ethError } = useSWR<ChainResponse>(
    chainKey ? ChainURLs[chainKey] : null
  );

  // const { data: Arbitrum, error: arbError } = useSWR<ArbitrumChainResponse>(
  //   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/arbitrum.json"
  // );

  // const { data: Optimism, error: optError } = useSWR<ArbitrumChainResponse>(
  //   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/optimism.json"
  // );

  // const { data: Polygon, error: polyError } = useSWR<ArbitrumChainResponse>(
  //   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/polygon_zkevm.json"
  // );

  // const { data: Imx, error: imxError } = useSWR<ArbitrumChainResponse>(
  //   "https://d2cfnw27176mbd.cloudfront.net/v0_4/chains/imx.json"
  // );

  // const chainArray = [Arbitrum, Ethereum, Optimism, Polygon, Imx];

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
              <Heading className="text-2xl leading-snug md:text-3xl lg:text-4xl xl:text-5xl mb-[15px]">
                {chainData.name}
              </Heading>
              <div className="inline-block text-xs leading-[1] border-[1px] border-forest-400 p-0.5 uppercase font-semibold rounded-sm ml-5">
                {chainData.technology}
              </div>
            </div>
            <div className="flex space-x-4 text-xs md:text-sm xl:text-base items-start">
              <Link
                href={chainData.block_explorer}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-1"
              >
                <Icon icon="feather:copy" className="w-4 h-4" />
                <div>Block Explorer</div>
              </Link>
              <Link
                href={chainData.website}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-1"
              >
                <Icon icon="feather:external-link" className="w-4 h-4" />
                <div>Website</div>
              </Link>
              <Link
                href={chainData.twitter}
                className="flex items-center space-x-2 justify-between font-semibold bg-forest-50 rounded-full px-4 py-1"
              >
                <Icon icon="feather:twitter" className="w-4 h-4" />
                <div>
                  <span className="text-xl">@</span>
                  {chainData.twitter.split("https://twitter.com/")}
                </div>
              </Link>
            </div>
          </div>
          <Subheading className="text-base leading-snug mb-[30px]">
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
