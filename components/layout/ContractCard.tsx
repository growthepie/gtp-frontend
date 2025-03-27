"use client";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useLocalStorage, useWindowSize, useIsMounted } from "usehooks-ts";
import _merge from "lodash/merge";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Image from "next/image";
import d3 from "d3";
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
import { useMaster } from "@/contexts/MasterContext";

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

  const { AllChainsByKeys } = useMaster();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  // console.log(data);

  return (
    <div
      className="hover:cursor-pointer"
      onClick={() => {
        if (data[types.indexOf("main_category_key")]) {
          window.location.href = `/blockspace/category-comparison?category=${data[types.indexOf("main_category_key")]
            }&subcategories=${data[types.indexOf("sub_category_key")]}`;
        } else {
          navigator.clipboard.writeText(data[types.indexOf("address")]);
          handleCopy();
        }
      }}
    >
      <div className="group flex flex-col px-[22px] py-[14px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] hover:cursor-pointer hover:bg-forest-100 hover:dark:bg-forest-800 transition-colors duration-200 min-h-[156px]">
        <div className="flex flex-row justify-between items-center w-full relative ">
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
                        theme ?? "dark"
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
                <div className="flex flex-row items-center numbers-sm">
                  <div>{metric.includes("_usd") ? "$" : "Ξ"}</div>
                  <div>
                    {Intl.NumberFormat("en-GB", {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
              {metric.includes("daa") && (
                <div className="flex flex-row items-end space-x-1 numbers-sm">
                  <div>
                    <Icon icon="feather:users" className="w-4 h-4" />
                  </div>
                  <div>
                    {Intl.NumberFormat("en-GB", {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
              {metric.includes("txcount") && (
                <div className="flex flex-row items-end space-x-1 numbers-sm">
                  <div>
                    <Icon icon="feather:activity" className="w-4 h-4" />
                  </div>
                  <div>
                    {Intl.NumberFormat("en-GB", {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(data[types.indexOf(metric)])}
                  </div>
                </div>
              )}
            </>
            {data[types.indexOf(`${metric}_change_percent`)] ? (
              <div className="flex space-x-1 text-xxs items-end justify-end ">
                <div
                  className={`flex flex-row items-end space-x-1 numbers-xs font-semibold transition-colors duration-200 ${data[types.indexOf(`${metric}_change_percent`)] >= 0
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
                <div className="text-forest-900 dark:text-forest-300 leading-[10px]">
                  {changeSuffix}
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center space-x-1 text-xs md:text-xs">
                -
              </div>
            )}
          </div>
        </div>
        <div className="w-full my-2.5">
          <div className="text-[30px] font-bold">
            {data[types.indexOf("project_name")] ? (
              data[types.indexOf("project_name")]
            ) : (
              <>&nbsp;</>
            )}
          </div>
          <div className="flex items-center text-forest-600 dark:text-forest-400 ">
            <div className="text-md leading-snug max-w-[200px] truncate">
              {data[types.indexOf("name")]
                ? data[types.indexOf("name")]
                : data[types.indexOf("address")]}
            </div>
            {!data[types.indexOf("main_category_key")] && (
              <div className="flex flex-row items-center space-x-1">
                {copied ? (
                  <Icon
                    icon="feather:check-circle"
                    className="w-[16px] h-[16px] hidden group-hover:block"
                  />
                ) : (
                  <Icon
                    icon="feather:copy"
                    className="w-[16px] h-[16px] hidden group-hover:block"
                  />
                )}

              </div>
            )}
          </div>
        </div>
        <div className="flex flex-row justify-between items-end  w-full">
          <div
            className={`flex flex-row items-center space-x-1 text-xs md:text-sm`}
          >
            {master && (
              <div className="flex flex-row items-center justify-end space-x-1">
                {master.blockspace_categories.main_categories[
                  data[types.indexOf("main_category_key")]
                ]
                  ? master.blockspace_categories.main_categories[
                  data[types.indexOf("main_category_key")]
                  ]
                  : copied
                    ? "Address Copied to Clipboard"
                    : "No Category Assigned"}{" "}
                {!data[types.indexOf("main_category_key")] ? null : (
                  <span className="mx-1">&gt;</span>
                )}
                {
                  master.blockspace_categories.sub_categories[
                  data[types.indexOf("sub_category_key")]
                  ]
                }
              </div>
            )}
          </div>
          <div className={`flex flex-row items-center space-x-1 ${!data[types.indexOf("main_category_key")] && "opacity-0"}`}>
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
      </div>
    </div>
  );
}
