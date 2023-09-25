"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import highchartsAnnotations from "highcharts/modules/annotations";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocalStorage, useWindowSize, useIsMounted } from "usehooks-ts";
import fullScreen from "highcharts/modules/full-screen";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
import { AllChainsByKeys } from "@/lib/chains";
import { debounce, forEach } from "lodash";
import Link from "next/link";
import useSWR from "swr";

import { navigationItems } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";
import { MasterResponse } from "@/types/api/MasterResponse";
import { LandingURL, MasterURL } from "@/lib/urls";

const COLORS = {
  GRID: "rgb(215, 223, 222)",
  PLOT_LINE: "rgb(215, 223, 222)",
  LABEL: "rgb(215, 223, 222)",
  LABEL_HOVER: "#6c7696",
  TOOLTIP_BG: "#1b2135",
  ANNOTATION_BG: "rgb(215, 223, 222)",
};

type ContractInfo = {
  address: string;
  project_name: string;
  name: string;
  main_category_key: string;
  sub_category_key: string;
  chain: string;
  gas_fees_absolute_eth: number;
  gas_fees_absolute_usd: number;
  gas_fees_share: number;
  txcount_absolute: number;
  txcount_share: number;
};

export default function ContractCard({
  data,
  types,
  metric,
  changeSuffix = "",
}: {
  data: any[];
  types: string[];
  metric: string;
  changeSuffix?: string;
}) {
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  return (
    <Link
      href={`/blockspace/category-comparison?category=${
        data[types.indexOf("main_category_key")]
      }&subcategories=${data[types.indexOf("sub_category_key")]}`}
    >
      <div className="group flex flex-col px-[22px] py-[14px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] hover:cursor-pointer hover:bg-forest-100 hover:dark:bg-forest-800 transition-colors duration-200">
        <div className="flex flex-row justify-between items-center w-full relative">
          <div className="flex flex-row items-center">
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <div className="relative">
                  {/* <div
                  className={`w-[22px] h-[22px] rounded-full ${
                    AllChainsByKeys[data.chain].backgrounds[
                      theme === "dark" ? "light" : "dark"
                    ][1]
                  }`}
                ></div> */}
                  <Icon
                    icon={`gtp:${data[types.indexOf("chain")].replace(
                      "_",
                      "-",
                    )}-logo-monochrome`}
                    className="w-5 h-5 text-white"
                    style={{
                      color:
                        AllChainsByKeys[data[types.indexOf("chain")]].colors[
                          theme
                        ][0],
                    }}
                  />
                </div>
                <div className="break-inside-avoid text-xs md:text-sm">
                  {AllChainsByKeys[data[types.indexOf("chain")]].label}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-x-3 space-y-1 justify-end absolute right-0 top-0">
            <>
              {metric.includes("gas_fees") && (
                <div className="flex flex-row items-center space-x-1 text-sm">
                  <div>{metric.includes("_usd") ? "$" : "Ξ"}</div>
                  <div>
                    {Intl.NumberFormat(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
              {metric.includes("daa") && (
                <div className="flex flex-row items-end space-x-1 text-sm">
                  <div>
                    <Icon icon="feather:users" className="w-4 h-4" />
                  </div>
                  <div>
                    {Intl.NumberFormat(undefined, {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
              {metric.includes("txcount") && (
                <div className="flex flex-row items-end space-x-1 text-sm">
                  <div>
                    <Icon icon="feather:activity" className="w-4 h-4" />
                  </div>
                  <div>
                    {Intl.NumberFormat(undefined, {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
            </>
            {data[types.indexOf(`${metric}_change_percent`)] ? (
              <div className="flex space-x-1 text-[0.6rem] items-end justify-end ">
                <div
                  className={`flex flex-row space-x-1 text-xs font-semibold transition-colors duration-200 ${
                    data[types.indexOf(`${metric}_change_percent`)] >= 0
                      ? " text-green-500 dark:group-hover:text-green-400"
                      : " text-red-500 dark:group-hover:text-red-400"
                  }`}
                >
                  {data[types.indexOf(`${metric}_change_percent`)] >= 0 ? (
                    <>
                      {/* <Icon
                      icon="feather:arrow-up"
                      className="w-3 h-3 transform rotate-45"
                    /> */}
                      +
                    </>
                  ) : (
                    // <Icon
                    //   icon="feather:arrow-down"
                    //   className="w-3 h-3 transform -rotate-45"
                    // />
                    <></>
                  )}
                  {Math.round(
                    data[types.indexOf(`${metric}_change_percent`)] * 10000.0,
                  ) / 100.0}
                  %
                </div>
                <div className="text-forest-900 dark:text-forest-300">
                  {changeSuffix}
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center space-x-1 text-xs md:text-sm">
                -
              </div>
            )}
          </div>
        </div>
        <div className="w-full text-[30px] font-bold">
          {data[types.indexOf("project_name")]}
        </div>
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-row items-center space-x-1 text-xs md:text-sm">
            {master && (
              <div className="flex flex-row items-center space-x-1">
                {
                  master.blockspace_categories.main_categories[
                    data[types.indexOf("main_category_key")]
                  ]
                }{" "}
                &gt;{" "}
                {
                  master.blockspace_categories.sub_categories[
                    data[types.indexOf("sub_category_key")]
                  ]
                }
              </div>
            )}
          </div>
          <Icon
            icon="feather:info"
            className="w-6 h-6 block group-hover:hidden"
          />
          <Icon
            icon="feather:chevron-right"
            className="w-6 h-6 hidden group-hover:block"
          />
        </div>
      </div>
    </Link>
  );
}
