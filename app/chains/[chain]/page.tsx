"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  AtSymbolIcon,
} from "@heroicons/react/24/outline";
import { dataTool } from "echarts";
import { Time } from "highcharts";
import useSWR from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { DAAMetricsResponse } from "@/types/api/DAAMetricsResponse";
import { AllChains } from "@/lib/chains";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const { chain } = params;

  const [pageName, setPageName] = useState(
    String(chain).charAt(0).toUpperCase() + String(chain).slice(1)
  );
  const [pageChain, setPageChain] = useState(null);
  const [metricTitle, setMetricTitle] = useState("");
  const [value, setValue] = useState("");
  const [buttons, setButtons] = useState();
  const [data, setData] = useState(null);

  const { data: master, error: masterError } = useSWR<MasterResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_3/master.json"
  );

  const { data: daa, error: daaError } = useSWR<DAAMetricsResponse>(
    "https://d2cfnw27176mbd.cloudfront.net/v0_3/metrics/daa.json"
  );

  /*Create some kind of map for metric cards*/

  const chainData = useMemo(() => {
    if (!master) return [];

    for (let chainName in master.chains) {
      if (chainName === chain) {
        return master.chains[chainName];
      }
    }
  }, [master, chain]);

  if (!master) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto pt-10 w-44[rem] lg:w-[88rem]">
      {/*Header */}
      <div className="ml-12 mr-14">
        <div className="flex justify-between items-center">
          <div className="flex gap-x-6 items-center">
            <h1 className="h-14 text-5xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
              {String(chain).charAt(0).toUpperCase() + String(chain).slice(1)}
            </h1>

            {/*Uppercase first letter */}
          </div>
          <div className="flex gap-x-10 h-10">
            <Link
              href={chainData.block_explorer}
              className="flex justify-between text-white dark:bg-[#2A3433] dark:text-[#CDD8D3] bg-blue-600 w-44 py-0 rounded-full w-168px pl-4 pr-6"
            >
              <LinkIcon className="h-4 w-4 self-center" />
              <p className="self-center font-semibold">Block Explorer</p>
            </Link>

            <Link
              href={chainData.twitter}
              className="flex justify-between text-white dark:bg-[#2A3433]  dark:text-[#CDD8D3] bg-blue-600 w-40 py-0 rounded-full w-168px pl-4 pr-6"
            >
              <AtSymbolIcon className="h-4 w-4 self-center" />
              <p className="self-center font-semibold">
                {chainData.twitter.split("https://twitter.com/")}
              </p>
            </Link>

            <Link
              href={chainData.website}
              className="flex justify-between text-white dark:bg-[#2A3433]  dark:text-[#CDD8D3] bg-blue-600 w-32 py-0 rounded-full w-168px pl-4 pr-6"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4 self-center" />
              <p className="self-center font-semibold">Website</p>
            </Link>
          </div>
        </div>

        <h1 className="text-lg text-gray-500 pt-4 font-[600] pl-1 dark:text-[#CDD8D3] w-2/5">
          Lorem Ipsum about {pageName}
        </h1>
      </div>
      {/*Time selection */}

      <div className="flex justify-center items-center gap-x-6 pt-8">
        {/*{Timestamps.map((selection) => (
          <button key={selection.key}   onClick={() => {
            updateButton(selection.key);
            console.log(selection.value)
          }}
            className={`${selection.value ? 'bg-blue-500 text-white py-1.5 px-4 font-[600]' : 'bg-none'} rounded-full self-center`} >
              {selection.name}
          </button>
        ))}*/}
      </div>

      <div className="flex py-2 ml-12 mr-14 gap-x-8 justify-start items-center rounded-[999px] h-[60px] dark:bg-[#2A3433] dark:justify-end dark: pr-6 md:justify-center">
        <button>90 Days</button>
        <button>180 Days</button>
        <button>1 Year</button>
        <button>Maximum</button>
      </div>

      {/*Metric Title Grid*/}
      <div className="flex-col pt-8">
        <div className="flex flex-col gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:justify-center lg:ml-0 lg:gap-y-0">
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
              Metric Title
            </h1>
            <BanknotesIcon className="relative h-[75px] w-[94px] text-blue-500 bottom-[1.7rem] left-[32rem] mr-4 dark:text-[#CDD8D3]" />
            <div className="flex pt-24 pl-6 pr-6 justify-between">
              <h1 className="text-white text-4xl font-[700] dark:text-[#CDD8D3]">
                10,000,000
              </h1>
              <h1 className="text-white text-xl font-[700] self-center dark:text-[#CDD8D3]">
                5 April 2023
              </h1>
            </div>
          </div>
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col pt-8 gap-x-6 justify-start ml-12 gap-y-8 lg:flex-row lg:justify-center lg:ml-0">
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433]bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
          <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-[#2A3433] bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-[#CDD8D3]">
                Metric Title
              </h1>
            </div>
          </div>
          {/*Generate cards in here in future*/}
        </div>
      </div>
    </div>
  );
};

export default Chain;
