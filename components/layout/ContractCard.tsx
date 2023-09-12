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

import { navigationItems } from "@/lib/navigation";
import { useUIContext } from "@/contexts/UIContext";
import { useMediaQuery } from "usehooks-ts";
import ChartWatermark from "@/components/layout/ChartWatermark";
import { ChainsData } from "@/types/api/ChainResponse";

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
}: {
  data: any[];
  types: string[];
}) {
  const { theme } = useTheme();

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);

  return (
    <div className="group flex flex-col px-[22px] py-[14px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] hover:cursor-pointer hover:bg-forest-100 hover:dark:bg-forest-800">
      <div className="flex flex-row justify-between items-center w-full">
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
        <div className="flex flex-row items-center space-x-1 text-sm">
          <>
            {showUsd ? (
              <>
                <div>$</div>
                <div>
                  {Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(data[types.indexOf("gas_fees_absolute_usd")])}
                </div>
              </>
            ) : (
              <>
                <div>Ξ</div>
                <div>
                  {Intl.NumberFormat(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }).format(data[types.indexOf("gas_fees_absolute_eth")])}{" "}
                  ETH
                </div>
              </>
            )}
          </>
        </div>
      </div>
      <div className="w-full text-[30px] font-bold">
        {data[types.indexOf("project_name")]}
      </div>
      <div className="flex flex-row justify-between items-center w-full">
        <div className="flex flex-row items-center space-x-1 text-xs md:text-sm">
          <div className="flex flex-row items-center space-x-1">
            {data[types.indexOf("main_category_key")]} &gt;{" "}
            {data[types.indexOf("sub_category_key")]}
          </div>
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
  );
}
