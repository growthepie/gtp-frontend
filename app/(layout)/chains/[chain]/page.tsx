"use client";
import Link from "next/link";
import useSWR, { preload } from "swr";
import { useSWRConfig } from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import ChainChart from "@/components/layout/SingleChains/ChainChart";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon } from "@iconify/react";
import { ChainResponse } from "@/types/api/ChainResponse";
import {
  BlockspaceURLs,
  ChainsBaseURL,
  FeesURLs,
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
import { getFundamentalsByKey } from "@/lib/navigation";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import ChainSectionHeadAlt from "@/components/layout/SingleChains/ChainSectionHeadAlt";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSessionStorage, useLocalStorage } from "usehooks-ts";
import { notFound } from "next/navigation";
import { ChainsData } from "@/types/api/ChainResponse";
import { useTheme } from "next-themes";
import { useMediaQuery } from "usehooks-ts";
import { useUIContext } from "@/contexts/UIContext";
import { track } from "@vercel/analytics/react";
import { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION } from "@/lib/helpers";
import UsageFees from "@/components/layout/SingleChains/UsageFees";
import UsageFeesAlt from "@/components/layout/SingleChains/UsageFeesAlt";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon, RankIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

const Chain = ({ params }: { params: any }) => {
  const { chain } = params;

  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const { theme } = useTheme();

  const { AllChains, AllChainsByKeys } = useMaster();

  const [chainKey, setChainKey] = useState<string>(
    AllChains.find((c) => c.urlKey === chain)?.key
      ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
      : "",
  );

  const [openChainList, setOpenChainList] = useState<boolean>(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  const { isSidebarOpen } = useUIContext();

  const rankChains = {
    daa: {
      Title: "Daily Active Addresses",
    },
    fees: {
      Title: "Fees Paid By Users",
    },
    stables_mcap: {
      Title: "Stablecoin Supply",
    },
    profit: {
      Title: "Onchain Profit",
    },
    txcosts: {
      Title: "Transaction Costs",
    },
    fdv: {
      Title: "Fully Diluted Valuation",
    },
    throughput: {
      Title: "Throughput",
    },
  };

  const {
    data: master,
    error: masterError,
    isLoading: masterLoading,
    isValidating: masterValidating,
  } = useSWR<MasterResponse>(MasterURL);

  const [chainError, setChainError] = useState(null);
  const [chainData, setChainData] = useState<ChainsData | null>(null);
  const [chainValidating, setChainValidating] = useState(false);
  const [chainLoading, setChainLoading] = useState(false);

  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainData>(`https://api.growthepie.com/v1/chains/blockspace/${chainKey}.json`);

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR(FeesURLs.table);

  const { cache, mutate } = useSWRConfig();

  const fetchChainData = useCallback(async () => {
    setChainLoading(true);
    setChainValidating(true);

    try {
      // Fetch the data
      const response = await fetch(
        `${ChainsBaseURL}${chainKey}.json`.replace("/v1/", `/${apiRoot}/`),
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      // Ensure responseData has the expected structure
      const flattenedData = data.data || data;

      // Update state with fetched data
      setChainData(flattenedData);
      setChainError(null);
    } catch (error) {
      // Handle errors
      setChainData(null);
      setChainError(error);
    } finally {
      // Ensure loading and validating states are correctly reset
      setChainLoading(false);
      setChainValidating(false);
    }
  }, [apiRoot, chainKey]);

  useEffect(() => {
    fetchChainData();
  }, [chainKey, fetchChainData]);

  const overviewData = useMemo(() => {
    if (!usageData) return null;

    return { [chainKey]: usageData };
  }, [chainKey, usageData]);

  const [selectedTimespan, setSelectedTimespan] = useSessionStorage(
    "blockspaceTimespan",
    "max",
  );

  useEffect(() => {
    if (selectedTimespan === "180d") {
      setSelectedTimespan("1d");
    }
  }, []);

  const chainFeeData = useMemo(() => {
    if (
      !feeData ||
      !chain ||
      !feeData.chain_data[String(chain).replace("-", "_")]
    )
      return [];

    return feeData.chain_data[String(chain).replace("-", "_")].hourly
      .txcosts_median.data;
  }, [feeData, chain]);

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const getGradientColor = useCallback((percentage, weighted = false) => {
    const colors = !weighted
      ? [
        { percent: 0, color: "#1DF7EF" },
        { percent: 20, color: "#76EDA0" },
        { percent: 50, color: "#FFDF27" },
        { percent: 70, color: "#FF9B47" },
        { percent: 100, color: "#FE5468" },
      ]
      : [
        { percent: 0, color: "#1DF7EF" },
        { percent: 2, color: "#76EDA0" },
        { percent: 10, color: "#FFDF27" },
        { percent: 40, color: "#FF9B47" },
        { percent: 80, color: "#FE5468" },
        { percent: 100, color: "#FE5468" }, // Repeat the final color to ensure upper bound
      ];

    let lowerBound = colors[0];
    let upperBound = colors[colors.length - 1];

    if (weighted) {
      // Adjust lower and upper bounds for weighted gradient
      lowerBound = colors[0];
      upperBound = colors[1];
    }

    for (let i = 0; i < colors.length - 1; i++) {
      if (
        percentage >= colors[i].percent &&
        percentage <= colors[i + 1].percent
      ) {
        lowerBound = colors[i];
        upperBound = colors[i + 1];
        break;
      }
    }

    const percentDiff =
      (percentage - lowerBound.percent) /
      (upperBound.percent - lowerBound.percent);

    const r = Math.floor(
      parseInt(lowerBound.color.substring(1, 3), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(1, 3), 16) -
        parseInt(lowerBound.color.substring(1, 3), 16)),
    );

    const g = Math.floor(
      parseInt(lowerBound.color.substring(3, 5), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(3, 5), 16) -
        parseInt(lowerBound.color.substring(3, 5), 16)),
    );

    const b = Math.floor(
      parseInt(lowerBound.color.substring(5, 7), 16) +
      percentDiff *
      (parseInt(upperBound.color.substring(5, 7), 16) -
        parseInt(lowerBound.color.substring(5, 7), 16)),
    );

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, []);

  const JumpToSections = {
    Fundamentals: {
      label: "Fundamentals",
      icon: "gtp:gtp-fundamentals",
      id: "fundamentals",
      ref: useRef<HTMLDivElement>(null),
    },
    Blockspace: {
      label: "Blockspace",
      icon: "gtp:gtp-package",
      id: "blockspace",
      ref: useRef<HTMLDivElement>(null),
    },
  };

  type ExpandingButtonMenuProps = {
    button: {
      label: string;
      icon: string;
      showIconBackground?: boolean;
      animateIcon?: boolean;
    };
    items: {
      label: string;
      icon: string;
      href: string;
    }[];
    className?: string;
  };

  // Jump to Section
  // "gtp:gtp-jump-to-section"

  const ExpandingButtonMenu = ({
    button,
    items,
    className,
  }: ExpandingButtonMenuProps) => {
    return (
      <div
        className={`absolute delay-0 hover:delay-300 group/jump flex flex-col cursor-pointer hover:top-[10px] hover:left-[5px] hover:right-[5px] transition-all duration-300 ${className}`}
      >
        <div
          className="!z-[15] group-hover/jump:!z-[25] transition-[z-index] delay-100 group-hover/jump:delay-0 w-full flex items-center h-[36px] gap-x-[8px] pl-[6px] pr-[10px] rounded-full dark:bg-[#263130] bg-forest-50"
          onMouseEnter={() => {
            track(`hovered ${button.label} button`, {
              location: isMobile ? `mobile Chain page` : `desktop Chain page`,
              page: window.location.pathname,
            });
          }}
        >
          <div
            className={`${button.showIconBackground &&
              "bg-white dark:bg-forest-1000 relative "
              } rounded-full w-[25px] h-[25px] p-[5px]`}
          >
            <Icon
              icon={button.icon}
              className={`w-[15px] h-[15px] ${button.animateIcon &&
                "transition-transform duration-300 transform delay-0 group-hover/jump:delay-300 group-hover/jump:rotate-90"
                }`}
            />
            <Icon
              icon={"gtp:circle-arrow"}
              className={`w-[4px] h-[9px] absolute top-2 right-0 transition-transform delay-0 group-hover/jump:delay-300 duration-500 group-hover/jump:rotate-90 ${button.showIconBackground ? "block" : "hidden"
                }`}
              style={{
                transformOrigin: "-8px 4px",
              }}
            />
          </div>
          <div className="whitespace-nowrap text-[14px] font-semibold lg:leading-normal leading-tight">
            {button.label}
          </div>
        </div>
        <div className="absolute !z-[11] group-hover/jump:!z-[21] delay-0 group-hover/jump:delay-300 overflow-hidden whitespace-nowrap  max-h-0 transition-all duration-300 left-0 right-0 top-[16px] bg-white dark:bg-[#151A19] pb-[0px] rounded-b-[22px] group-hover/jump:max-h-[300px] group-hover/jump:pt-[24px] group-hover/jump:pb-[10px] group-hover/jump:shadow-lg group-hover/jump:dark:shadow-[0px_4px_46.2px_0px_#000000]">
          {items.map((item: { label: string; icon: string; href: string }) => (
            <Link
              href={item.href}
              key={item.label}
              rel="noreferrer"
              target="_blank"
              onClick={(e) => {
                track(`clicked ${item.label} link`, {
                  location: isMobile
                    ? `mobile Chain page`
                    : `desktop Chain page`,
                  page: window.location.pathname,
                });
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  document.querySelector(item.href)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
              className="whitespace-nowrap flex items-center gap-x-[10px] h-[32px] font-medium text-sm px-4 py-2 group-hover:w-full w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            >
              <div className="w-4 h-4">
                <Icon icon={item.icon} className="w-4 h-4" />
              </div>
              <div>{item.label}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  function ordinal_suffix_of(i) {
    let j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return i + "st";
    }
    if (j === 2 && k !== 12) {
      return i + "nd";
    }
    if (j === 3 && k !== 13) {
      return i + "rd";
    }
    return i + "th";
  }

  function dataAvailToArray(x: string) {
    let retObject: { icon: string; label: string }[] = [];
    if (typeof x === "string") {
      // Ensure x is a string
      if (x.includes("calldata")) {
        retObject.push({
          icon: "calldata",
          label: "Calldata",
        });
      }

      if (x.includes("blobs")) {
        retObject.push({
          icon: "blobs",
          label: "Blobs",
        });
      }

      if (x.includes("MantleDA")) {
        retObject.push({
          icon: "customoffchain",
          label: "MantleDA",
        });
      }

      if (x.includes("DAC")) {
        retObject.push({
          icon: "committee",
          label: "DAC (committee)",
        });
      }

      if (x.includes("Celestia")) {
        retObject.push({
          icon: "celestiafp",
          label: "Celestia",
        });
      }

      if (x.includes("memo")) {
        retObject.push({
          icon: "memofp",
          label: "Memo",
        });
      }
    }
    return retObject;
  }

  if (chainKey.length === 0) return notFound();

  return (
    <>
      <ShowLoading
        dataLoading={[
          masterLoading,
          chainLoading,
          feeLoading,
          !usageError && usageLoading,
        ]}
        dataValidating={[
          masterValidating,
          chainValidating,
          feeValidating,
          !usageError && usageValidating,
        ]}
      />
      <Container className="flex w-full pt-[45px] md:pt-[30px]" isPageRoot>
        {master && chainFeeData && chainData && (
          <div className="flex flex-col w-full">
            <div
              id="chains-page-title"
              className="flex flex-col md:flex-row justify-between items-start w-full"
            >
              <div className="flex flex-col md:flex-row pb-[15px] md:pb-[15px] items-start">
                <div className="flex gap-x-[8px] items-center">
                  <div className="w-9 h-9  ">
                    <GTPIcon
                      icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome` as GTPIconName}
                      size="lg"
                      style={{
                        color:
                          AllChainsByKeys[chainKey].colors[theme ?? "dark"][1],
                      }}
                    />
                  </div>
                  <Heading
                    className="leading-snug text-[30px] md:text-[36px] break-inside-avoid "
                    as="h1"
                  >
                    {master.chains[chainKey].name}
                  </Heading>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col lg:flex-row gap-x-[5px] gap-y-[5px] bg-clip-content pb-[30px] md:pb-[60px]">
              <div className="relative flex lg:col-auto lg:w-[253px] lg:basis-[253px]">
                <ChainSectionHead
                  title={"Menu"}
                  icon={"gtp:gtp-menu"}
                  enableDropdown={false}
                  defaultDropdown={true}
                  childrenHeight={isMobile ? 97 : 111}
                  className="transition-all duration-300 w-full lg:!w-[253px]"
                >
                  <div className="relative h-[97px] lg:h-[111px] flex gap-x-[10px] px-[5px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] overflow-visible select-none">
                    <div className="flex flex-col justify-between gap-y-[10px] min-w-[120px] ">
                      <ExpandingButtonMenu
                        className={`left-[5px] top-[10px] lg:top-[10px] right-[calc((100%/2)+5px)] lg:right-[120px]`}
                        button={{
                          label: "Jump to ...",
                          icon: "gtp:gtp-jump-to-section",
                          showIconBackground: true,
                        }}
                        items={
                          overviewData
                            ? [
                              {
                                label: "Fundamentals",
                                icon: "gtp:gtp-fundamentals",
                                href: "#fundamentals",
                              },
                              {
                                label: "Blockspace",
                                icon: "gtp:gtp-package",
                                href: "#blockspace",
                              },
                            ]
                            : [
                              {
                                label: "Fundamentals",
                                icon: "gtp:gtp-fundamentals",
                                href: "#fundamentals",
                              },
                            ]
                        }
                      />
                      {master.chains[chainKey].block_explorers &&
                        Object.keys(master.chains[chainKey].block_explorers)
                          .length > 0 && (
                          <ExpandingButtonMenu
                            className={`left-[5px] top-[50px] lg:top-[65px] right-[calc((100%/2)+5px)] lg:right-[120px]`}
                            button={{
                              label: "Explorers",
                              icon: "gtp:gtp-block-explorer",
                              showIconBackground: true,
                            }}
                            items={Object.keys(
                              master.chains[chainKey].block_explorers,
                            ).map((explorerKey) => ({
                              label: explorerKey,
                              icon: "feather:external-link",
                              href: master.chains[chainKey].block_explorers[
                                explorerKey
                              ],
                            }))}
                          />
                        )}
                    </div>
                    <div className="flex flex-col justify-between gap-y-[10px] flex-1 min-w-[90px] ">
                      {master.chains[chainKey].rhino_listed ? (
                        <Link
                          href={
                            master.chains[chainKey].rhino_naming
                              ? `https://app.rhino.fi/bridge?refId=PG_GrowThePie&token=ETH&chainOut=${master.chains[chainKey].rhino_naming}&chain=ETHEREUM`
                              : "https://app.rhino.fi/bridge/?refId=PG_GrowThePie"
                          }
                          className="absolute right-[5px] top-[10px] lg:top-[10px] left-[calc((100%/2)+5px)] lg:left-[140px]"
                        >
                          <div className="flex items-center w-full h-[36px] gap-x-[8px] pl-[6px] pr-[10px] rounded-full dark:bg-[#263130] bg-forest-50">
                            <div className="bg-white dark:bg-forest-1000 rounded-full w-[25px] h-[25px] p-[5px]">
                              <Icon
                                icon="gtp:gtp-bridge"
                                className="w-[15px] h-[15px]"
                              />
                            </div>
                            <div className="text-[14px] font-semibold">
                              Bridge
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div></div>
                      )}
                      <ExpandingButtonMenu
                        className="right-[5px] top-[50px] lg:top-[65px] mt-auto left-[calc((100%/2)+5px)] lg:left-[140px]"
                        button={{
                          label: "More",
                          icon: "feather:chevron-right",
                          showIconBackground: false,
                          animateIcon: true,
                        }}
                        items={[
                          {
                            label: "Website",
                            icon: "feather:external-link",
                            href: master.chains[chainKey].website,
                          },
                          {
                            label: "X Profile",
                            icon: "ri:twitter-x-fill",
                            href: master.chains[chainKey].twitter,
                          },
                        ]}
                      />
                    </div>
                  </div>
                </ChainSectionHead>
              </div>

              <div className="@container min-w-[67px] lg:max-w-[398px] lg:col-auto lg:basis-[398px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[398px] transition-all duration-300">
                <ChainSectionHeadAlt
                  title={"Background"}
                  icon={"gtp:gtp-backgroundinformation"}
                  enableDropdown={isMobile}
                  childrenHeight={isMobile ? 200 : 111}
                  className={`transition-all duration-300 min-w-[67px] w-full flex flex-1`}
                  shadowElement={
                    <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[398px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                  }
                >
                  <div
                    className={`group bg-clip-border min-h-[111px] lg:max-h-[111px] relative flex flex-col justify-between transition-opacity duration-300 px-[10px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] overflow-hidden`}
                  >
                    <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[398px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                    <div className="w-full lg:w-[378px] h-auto lg:h-[calc(111px-20px)] flex flex-col justify-between gap-y-[5px]">
                      <div className="w-full">
                        <div className="text-[10px] font-semibold text-[#5A6462]">
                          Background Information
                        </div>
                        <div
                          className={`text-[10px] leading-[150%] md:min-w-[378px] md:max-w-[378px]`}
                        >
                          {master.chains[chainKey].description}
                        </div>
                      </div>
                      <div
                        className={`w-full flex gap-x-[10px] gap-y-[5px] justify-between flex-col lg:flex-row`}
                      >
                        <div className="min-w-[75px]">
                          <div className="text-[10px] font-semibold text-[#5A6462] leading-[120%]">
                            Launch Date
                          </div>
                          <div className="text-[10px] leading-[150%] whitespace-nowrap">
                            {new Date(
                              master.chains[chainKey].launch_date,
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                            })}
                          </div>
                        </div>
                        <div className="basis-auto">
                          <div className="text-[10px] font-semibold text-[#5A6462] leading-[120%]">
                            Rankings
                          </div>
                          <div className="flex gap-x-[2px] pt-[2px] lg:pt-0">
                            {chainData.ranking && (
                              <>
                                {Object.keys(rankChains).map((key, i) => {
                                  return (
                                    <Tooltip
                                      key={key + "rankings"}
                                      placement="bottom"
                                    >
                                      <TooltipTrigger>
                                        {/* <div
                                          className="w-[24px] h-[24px] rounded-full flex items-center justify-center z-0"
                                          style={{
                                            backgroundColor: chainData
                                              ? chainData.ranking[key]
                                                ? getGradientColor(
                                                    chainData.ranking[key]
                                                      .color_scale * 100,
                                                  )
                                                : "#5A6462"
                                              : "#5A6462",
                                          }}
                                        >
                                          <Icon
                                            icon={`gtp:${String(key).replace(
                                              "_",
                                              "-",
                                            )}`}
                                            className="w-[15px] h-[15px] z-10 text-[#344240]"
                                          />
                                        </div> */}
                                        <RankIcon colorScale={chainData.ranking[key] ? chainData.ranking[key].color_scale : -1} size="md">
                                          <GTPIcon
                                            icon={`${String(key).replace(
                                              "_",
                                              "-",
                                            ) as GTPIconName}`}
                                            size="sm"
                                            className={chainData.ranking[key] ? "text-[#1F2726]" : "text-[#5A6462]"}
                                          />
                                        </RankIcon>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="flex flex-col items-center">
                                          {/* tooltip pointer */}
                                          <div
                                            className="z-50 w-0 h-0 border-forest-100 dark:border-[#4B5553] border-b-[5px]"
                                            style={{
                                              borderLeft:
                                                "5px solid transparent",
                                              borderRight:
                                                "5px solid transparent",
                                            }}
                                          ></div>

                                          <div className="flex items-center gap-x-[10px] pl-1.5 pr-3 py-2 text-xs bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 w-auto max-w-md font-normal transition-all duration-300">
                                            <Icon
                                              icon={`gtp:${String(key).replace(
                                                "_",
                                                "-",
                                              )}`}
                                              className="w-[24px] h-[24px] z-10"
                                            />
                                            <div className="flex flex-col gap-y-[5px] items-center">
                                              <div className="flex items-center gap-x-[5px] text-[10px] whitespace-nowrap">
                                                <div
                                                  className="flex w-2 h-2 rounded-md"
                                                  style={{
                                                    backgroundColor: chainData
                                                      ? chainData.ranking[key]
                                                        ? getGradientColor(
                                                          chainData.ranking[
                                                            key
                                                          ].color_scale * 100,
                                                        )
                                                        : "#5A6462"
                                                      : "#5A6462",
                                                  }}
                                                ></div>
                                                {chainData.ranking[key] ? (
                                                  <div className="flex items-end gap-x-1">
                                                    <div className="flex text-[14px] font-medium ordinal">
                                                      {ordinal_suffix_of(
                                                        chainData.ranking[key]
                                                          .rank,
                                                      )}
                                                    </div>
                                                    <div className="flex items-end opacity-60">
                                                      {chainData.ranking[key] &&
                                                        `out of ${chainData.ranking[key].out_of} chains`}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="opacity-40">
                                                    Not Available
                                                  </div>
                                                )}
                                              </div>
                                              <div className="text-[12px] font-semibold capitalize">
                                                {master.metrics[key].name}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}{" "}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="relative flex flex-col items-start w-[108px] overflow-visible">
                          <div className="text-[10px] font-semibold text-[#5A6462] leading-[120%]">
                            Purpose
                          </div>
                          <div className="lg:absolute lg:top-3 lg:left-0 lg:right-0 text-[10px] leading-[150%] whitespace-normal">
                            {master.chains[chainKey].purpose}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChainSectionHeadAlt>
              </div>
              <div className="flex flex-col gap-y-[5px] lg:flex-row gap-x-[5px] flex-grow flex-shrink basis-0">
                <div className="@container min-w-full lg:min-w-[67px] lg:col-auto lg:basis-[228px] lg:flex-shrink lg:hover:min-w-[228px] transition-all duration-300">
                  <ChainSectionHeadAlt
                    title={"Usage"}
                    icon={"gtp:gtp-usage"}
                    enableDropdown={isMobile}
                    childrenHeight={isMobile ? 116 : 111}
                    className="transition-all duration-300 min-w-[67px] w-full"
                    shadowElement={
                      <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[228px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                    }
                  >
                    <div className="group flex flex-col gap-y-[5px] overflow-hidden relative">
                      <UsageFeesAlt
                        chainFeeData={chainFeeData}
                        showUsd={showUsd}
                        shadowElement={
                          <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[228px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                        }
                      />
                      <div className="bg-clip-border h-[48px] flex relative gap-x-[5px] px-[5px] py-[10px] items-center rounded-[15px] overflow-hidden bg-forest-50 dark:bg-[#1F2726] justify-between ">
                        <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[228px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                        <div className="flex-col flex pl-[48px] truncate">
                          <div className="text-[10px] text-[#5A6462] font-bold min-w-[150px] ">
                            Hottest Contract
                          </div>
                          <div
                            className="text-[10px] flex gap-x-1 font-bold min-w-[160px] whitespace-nowrap"
                            onClick={() => {
                              if (
                                !chainData.hottest_contract.data[0][
                                chainData.hottest_contract.types.indexOf(
                                  "name",
                                )
                                ]
                              ) {
                                navigator.clipboard.writeText(
                                  chainData.hottest_contract.data[0][
                                  chainData.hottest_contract.types.indexOf(
                                    "address",
                                  )
                                  ],
                                );
                              }
                            }}
                          >
                            {chainData ? (
                              chainData.hottest_contract ? (
                                chainData.hottest_contract.data[0] ? (
                                  <>
                                    <span
                                      className={` truncate ${chainData.hottest_contract.data[0][
                                        chainData.hottest_contract.types.indexOf(
                                          "project_name",
                                        )
                                      ]
                                        ? "max-w-[80px]"
                                        : "max-w-[140px]"
                                        }`}
                                    >
                                      {chainData.hottest_contract.data[0][
                                        chainData.hottest_contract.types.indexOf(
                                          "name",
                                        )
                                      ] ||
                                        chainData.hottest_contract.data[0][
                                        chainData.hottest_contract.types.indexOf(
                                          "address",
                                        )
                                        ]}
                                    </span>
                                    <span>
                                      {chainData.hottest_contract.data[0][
                                        chainData.hottest_contract.types.indexOf(
                                          "project_name",
                                        )
                                      ]
                                        ? "-"
                                        : ""}{" "}
                                    </span>
                                    <span>
                                      {
                                        chainData.hottest_contract.data[0][
                                        chainData.hottest_contract.types.indexOf(
                                          "project_name",
                                        )
                                        ]
                                      }
                                    </span>
                                  </>
                                ) : (
                                  "N/A"
                                )
                              ) : (
                                "N/A"
                              )
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </div>
                        <div className="h-full flex items-start pr-[5px]"></div>
                      </div>
                    </div>
                  </ChainSectionHeadAlt>
                </div>
                <div className="flex gap-x-[5px] flex-grow flex-shrink basis-0">
                  <div className="@container min-w-[calc(100%-130px)] lg:min-w-[67px] lg:basis-[232px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[232px] transition-all duration-300">
                    <ChainSectionHeadAlt
                      title={"Technology"}
                      icon={"gtp:gtp-technology"}
                      enableDropdown={isMobile}
                      childrenHeight={isMobile ? 116 : 111}
                      className={`transition-all duration-300 min-w-[67px]`}
                      shadowElement={
                        <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[232px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                      }
                    >
                      <div className="group relative h-[111px] flex px-[10px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] gap-x-[5px] overflow-hidden">
                        <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[232px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                        <div className="w-full min-w-[212px] flex">
                          <div className="flex flex-col w-full h-full justify-between min-w-[85px]">
                            <div>
                              <div className="text-[10px] font-semibold text-[#5A6462] ">
                                Stack
                              </div>
                              <div className="text-[10px] leading-[150%] font-medium">
                                {master.chains[chainKey].stack.label}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-[#5A6462]">
                                Technology
                              </div>
                              <div className="text-[10px] leading-[150%] font-medium">
                                {master.chains[chainKey].technology}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col w-full h-full justify-between min-w-[90px]">
                            <div className="">
                              <div className="text-[10px] font-semibold text-[#5A6462] ">
                                Data Availability
                              </div>
                              <div className="text-[10px] leading-[150%] font-medium  ">
                                {dataAvailToArray(
                                  master.chains[chainKey].da_layer,
                                ).map((x) => (
                                  <div
                                    className="flex items-center gap-x-1"
                                    key={x.label}
                                  >
                                    <Icon
                                      icon={`gtp:${x.icon}`}
                                      className="w-[12px] h-[12px]"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="">
                              <div className="text-[10px] font-semibold text-[#5A6462] ">
                                Rollup as a Service
                              </div>
                              <div className="text-[10px] leading-[150%] font-medium">
                                {master.chains[chainKey].raas}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ChainSectionHeadAlt>
                  </div>
                  <div className="flex gap-x-[5px] flex-grow flex-shrink basis-0 lg:max-w-[125px]">
                    <div className="@container group min-w-[125px] lg:min-w-[67px] lg:basis-[125px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[125px] min-[1700px]:min-w-[125px] transition-all duration-300">
                      <ChainSectionHeadAlt
                        title={"Risk"}
                        enableDropdown={isMobile}
                        childrenHeight={isMobile ? 116 : 111}
                        icon={"gtp:gtp-risk"}
                        className={`transition-all duration-300 min-w-[67px]`}
                        shadowElement={
                          <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[125px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                        }
                      >
                        <div className="relative h-[111px] flex justify-between px-[10px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] overflow-hidden">
                          <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[125px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                          <div className="flex flex-col justify-between gap-y-[10px] h-[91px] min-w-[80px]">
                            <div className="text-[10px] font-semibold text-[#5A6462]">
                              Rollup Stage
                            </div>
                            <div className="flex flex-col gap-y-[2px]">
                              <div
                                className="flex items-center justify-center font-bold text-white dark:text-forest-1000 rounded-[2px] text-[10px] leading-[120%]"
                                style={{
                                  background: master.chains[chainKey]
                                    .l2beat_stage
                                    ? master.chains[chainKey].l2beat_stage.hex
                                      ? master.chains[chainKey].l2beat_stage.hex
                                      : "#344240"
                                    : "#344240",
                                }}
                              >
                                {master.chains[chainKey].l2beat_stage
                                  ? master.chains[chainKey].l2beat_stage.stage
                                    ? master.chains[chainKey].l2beat_stage.stage
                                    : "N/A"
                                  : "N/A"}
                              </div>
                              <div className="text-[10px] leading-[150%] flex justify-center gap-x-1">
                                <div className="text-[#5A6462]">of</div>
                                <div>2 total</div>
                              </div>
                            </div>
                            <div className="h-[11px] flex items-center text-[8px] leading-[150%]">
                              Assessment by
                            </div>
                          </div>
                          <div className="flex flex-col justify-between gap-y-[10px] h-full">
                            <div className="flex justify-end items-center ">
                              <a
                                href={master.chains[chainKey].l2beat_link}
                                target="_blank"
                                className="rounded-full bg-forest-50 dark:bg-[#344240] w-[15px] h-[15px] p-[2px]"
                              >
                                <Icon
                                  icon="feather:arrow-right"
                                  className="w-[11px] h-[11px]"
                                />
                              </a>
                            </div>
                            <svg
                              width="25"
                              height="13"
                              viewBox="0 0 25 13"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                width: "24.57px",
                                height: "12.2px",
                              }}
                            >
                              <path
                                d="M5.65459 2.09461C5.65371 2.10293 5.64445 2.12051 5.62681 2.14736C5.36769 2.54015 5.23403 3.00167 5.22582 3.53192C5.2232 3.70668 5.24381 3.87718 5.28767 4.04341C5.31982 4.16468 5.38263 4.25856 5.47611 4.32505C5.54075 4.3713 5.60785 4.39368 5.67739 4.39219C5.71303 4.39134 5.74273 4.3778 5.7665 4.35159C5.79148 4.3241 5.8107 4.29053 5.82415 4.25089C5.86679 4.12472 5.89763 3.99429 5.91667 3.85959C5.93903 3.70039 5.98245 3.50357 6.04693 3.26914C6.14757 2.90299 6.31617 2.60558 6.55275 2.3769C6.67785 2.25605 6.8296 2.15205 7.00799 2.06488C7.44462 1.85176 7.8927 1.81446 8.35222 1.95299C8.53707 2.00862 8.69983 2.08438 8.84048 2.18029C9.09487 2.35377 9.30087 2.59801 9.45847 2.91301C9.5703 3.13657 9.65372 3.37495 9.70876 3.62814C9.74877 3.81164 9.76223 3.99802 9.74912 4.18727C9.73322 4.42085 9.70273 4.65103 9.65766 4.87779C9.62149 5.06086 9.57658 5.21857 9.52295 5.35092C9.46494 5.49435 9.39251 5.63725 9.30568 5.77962C9.09024 6.1334 8.91098 6.41046 8.76788 6.6108C7.56859 8.28829 6.36754 9.96397 5.16475 11.6378C4.99457 11.8748 4.94644 12.1444 5.02034 12.4466C5.02069 12.4483 5.02401 12.4574 5.0303 12.4738C5.03642 12.4892 5.03266 12.5007 5.01903 12.5083C4.78857 12.1631 4.55811 11.8178 4.32766 11.4726C4.30512 11.4389 4.27568 11.4237 4.23933 11.4269C4.21243 11.4098 4.21898 11.402 4.25899 11.4035C4.45555 11.4105 4.6363 11.3515 4.80124 11.2264C4.87672 11.1691 4.91001 11.0948 4.9011 11.0036C4.89393 10.9324 4.86169 10.8703 4.80439 10.8172C4.74253 10.7599 4.67142 10.7231 4.59105 10.7069C4.50316 10.6894 4.42524 10.6821 4.35727 10.6849C3.9271 10.7028 3.48174 10.7164 3.02117 10.7258C3.01242 10.726 3.00395 10.722 2.99755 10.7147C2.99115 10.7075 2.98731 10.6974 2.98684 10.6868C2.98177 10.5789 2.97836 10.4637 2.97661 10.3412C2.96613 9.58738 2.95827 8.83346 2.95303 8.07943C2.94831 7.42024 2.92428 6.76212 2.88095 6.10506C2.84741 5.59633 2.81683 5.0875 2.78922 4.57856C2.78258 4.45602 2.77018 4.35756 2.75201 4.28318C2.72405 4.16852 2.66622 4.06845 2.57851 3.98299C2.48154 3.88858 2.37504 3.83199 2.25903 3.81324C2.1327 3.79278 2.0214 3.80578 1.92513 3.85224C1.84266 3.89209 1.77959 3.9604 1.73591 4.05716C1.7076 4.1196 1.68821 4.21498 1.67773 4.34328C1.63964 4.80639 1.62863 5.22593 1.6447 5.60188C1.67633 6.3363 1.68568 6.96363 1.67275 7.48386C1.67266 7.48638 1.67225 7.48871 1.67155 7.49058C1.67085 7.49245 1.66881 7.49441 1.66881 7.49441L1.66436 7.49729C1.51497 7.28438 1.33317 6.99954 1.11896 6.64277C0.864217 6.21865 0.670362 5.76779 0.537399 5.29018C0.508569 5.18682 0.484283 5.07333 0.464539 4.94972C0.447067 4.83996 0.436584 4.72391 0.433089 4.60158C0.416316 4.02402 0.486554 3.4683 0.643805 2.93443C0.773274 2.49497 0.976127 2.10303 1.25236 1.75862C1.5417 1.39781 1.88381 1.14121 2.27868 0.988824C2.55772 0.880984 2.84225 0.820137 3.13229 0.806284C3.30946 0.797972 3.48401 0.804259 3.65593 0.825145C4.20264 0.891639 4.70776 1.13258 5.1713 1.54795C5.37223 1.72783 5.53333 1.91005 5.65459 2.09461Z"
                                fill="#5A6462"
                              />
                              <path
                                d="M5.01956 12.5065C5.03319 12.4988 5.03695 12.4873 5.03083 12.472C5.02454 12.4556 5.02122 12.4465 5.02087 12.4448C4.94696 12.1426 4.9951 11.873 5.16528 11.636C6.36807 9.96213 7.56911 8.28645 8.76841 6.60896C8.91151 6.40863 9.09077 6.13157 9.30621 5.77778C9.39304 5.63542 9.46547 5.49252 9.52348 5.34908C9.57711 5.21673 9.62202 5.05902 9.65819 4.87595C9.70326 4.64919 9.73375 4.41901 9.74965 4.18543C9.76276 3.99618 9.7493 3.8098 9.70929 3.6263C9.65425 3.37311 9.57083 3.13474 9.459 2.91117C9.3014 2.59617 9.0954 2.35193 8.84101 2.17845C8.70036 2.08255 8.5376 2.00678 8.35275 1.95115C7.89322 1.81262 7.44515 1.84992 7.00852 2.06304C6.83013 2.15021 6.67838 2.25422 6.55328 2.37506C6.3167 2.60374 6.1481 2.90115 6.04746 3.2673C5.98298 3.50173 5.93956 3.69855 5.9172 3.85776C5.89815 3.99245 5.86732 4.12288 5.82468 4.24905C5.81123 4.28869 5.79201 4.32226 5.76703 4.34975C5.74326 4.37596 5.71356 4.3895 5.67792 4.39035C5.60838 4.39184 5.54128 4.36946 5.47664 4.32322C5.38316 4.25672 5.32035 4.16284 5.2882 4.04157C5.24434 3.87534 5.22373 3.70484 5.22635 3.53008C5.23456 2.99983 5.36822 2.53831 5.62733 2.14552C5.64498 2.11867 5.65424 2.10109 5.65512 2.09278C5.93467 1.71597 6.24314 1.42314 6.58053 1.21428C7.07011 0.911434 7.59401 0.776527 8.15225 0.809561C8.33169 0.820004 8.50528 0.844407 8.67301 0.882769C9.39741 1.04837 9.96177 1.502 10.3661 2.24367C10.4613 2.41822 10.5429 2.60619 10.6109 2.80759C10.7171 3.12195 10.7884 3.4427 10.8247 3.76984C10.8464 3.9657 10.8617 4.2028 10.8706 4.48114C10.8776 4.6998 10.8418 4.9579 10.7634 5.25542C10.6661 5.62391 10.5325 5.97162 10.3627 6.29855C10.1675 6.67428 9.95137 7.03073 9.71427 7.36789C9.60839 7.51815 9.55492 7.59423 9.55492 7.59423C8.92522 8.50491 8.30208 9.42219 7.68548 10.3461C7.49084 10.6378 7.37369 10.8254 7.33403 10.9087C7.30135 10.9776 7.29506 11.0378 7.31516 11.0893C7.32896 11.1241 7.35158 11.1429 7.38303 11.1459C7.75502 11.18 8.12473 11.2035 8.49217 11.2163C9.17132 11.2399 9.68675 11.2673 10.0385 11.2984C10.1424 11.3076 10.2425 11.3456 10.3388 11.4125C10.4188 11.4684 10.4971 11.5496 10.5736 11.6561C10.7239 11.8654 10.8229 12.0978 10.8706 12.3534C10.9123 12.5774 10.8656 12.7333 10.7304 12.8211C10.6717 12.8594 10.5744 12.8828 10.4387 12.8911C10.2704 12.9015 10.1021 12.9083 9.93364 12.9115C8.81768 12.9333 7.70164 12.9529 6.58551 12.9704C6.32326 12.9744 6.06117 12.984 5.79926 12.9991C5.72448 13.0036 5.65014 12.9996 5.57623 12.987C5.34926 12.9491 5.17891 12.8101 5.06516 12.5701C5.05346 12.5454 5.03826 12.5242 5.01956 12.5065Z"
                                fill="#CDD8D3"
                              />
                              <path
                                d="M18.1456 11.4321C18.0768 11.3592 18.0388 11.2641 18.0319 11.1469C18.0271 11.0674 18.0271 10.9922 18.0319 10.9212C18.0381 10.8289 18.0413 10.7819 18.0413 10.7802C18.0523 10.5322 18.0682 10.2846 18.089 10.0376C18.1229 9.63309 18.1399 9.42935 18.1401 9.42637C18.1639 9.12735 18.1884 8.86372 18.2137 8.63547C18.3495 7.40979 18.4847 6.18402 18.6195 4.95813C18.6443 4.73307 18.6735 4.52315 18.7072 4.32835C18.7499 4.08283 18.7948 3.83796 18.842 3.59372C18.8624 3.4878 18.8997 3.40436 18.9539 3.3434C18.9755 3.3189 19.0011 3.30664 19.0307 3.30664H19.521C19.5511 3.30664 19.5773 3.319 19.5996 3.34372C19.6856 3.43878 19.7475 3.55663 19.7855 3.6973C19.8031 3.76272 19.8152 3.80535 19.8216 3.82517C19.8307 3.8533 19.8396 3.88154 19.8484 3.90989C19.8573 3.9378 19.8671 3.9653 19.878 3.99236C20.015 4.33358 20.1289 4.68587 20.2197 5.04924C20.4273 5.88106 20.639 6.71139 20.8548 7.54023C21.113 8.53253 21.3362 9.53655 21.5244 10.5523C21.5471 10.6755 21.5623 10.7831 21.57 10.8752C21.5761 10.9489 21.5671 11.0186 21.543 11.0842C21.5215 11.1422 21.485 11.1932 21.4334 11.2371C21.3616 11.2982 21.2829 11.3384 21.1973 11.3576C21.1304 11.3725 21.0467 11.378 20.9462 11.3742C20.8189 11.3691 20.6931 11.338 20.5691 11.2809C20.5322 11.2638 20.504 11.2377 20.4844 11.2025C20.4722 11.1806 20.4619 11.1418 20.4535 11.0862C20.3476 10.3905 20.2446 9.70076 20.1445 9.01685C20.1424 9.00238 20.1362 8.98928 20.127 8.97982C20.1178 8.97036 20.1062 8.96514 20.0942 8.96506C19.7507 8.96293 19.4127 8.96463 19.0802 8.97017C19.037 8.97081 19.0068 8.9787 18.9895 8.99383C18.9651 9.01515 18.9533 9.04765 18.9541 9.09134C18.9547 9.1233 18.9548 9.14025 18.9547 9.14217C18.9288 9.77322 18.8696 10.3994 18.777 11.0206C18.7567 11.1568 18.7297 11.2579 18.696 11.324C18.6497 11.4144 18.5868 11.4923 18.5073 11.5577C18.4947 11.5679 18.4798 11.5729 18.4648 11.5721C18.3336 11.5653 18.2272 11.5186 18.1456 11.4321ZM19.0469 8.15977L19.928 8.16585C19.9633 8.16606 19.9785 8.14454 19.9736 8.10127C19.9368 7.78073 19.8885 7.45839 19.829 7.13423C19.7965 6.95819 19.7516 6.75231 19.6943 6.5166C19.5899 6.08715 19.4842 5.66751 19.3771 5.25768C19.3611 5.1963 19.3495 5.19758 19.3425 5.26151L19.0335 8.14091C19.0333 8.14325 19.0334 8.14563 19.034 8.14789C19.0345 8.15015 19.0355 8.15224 19.0367 8.15402C19.038 8.15581 19.0396 8.15724 19.0413 8.15823C19.0431 8.15922 19.045 8.15975 19.0469 8.15977Z"
                                fill="#CDD8D3"
                              />
                              <path
                                d="M13.9234 8.04427C13.8984 8.06025 13.8983 8.07645 13.9231 8.09286C14.4155 8.41851 14.6894 8.92468 14.7447 9.61136C14.7526 9.70897 14.7579 9.80669 14.7605 9.90451C14.7634 10.0173 14.758 10.1144 14.7442 10.1961C14.7002 10.458 14.5968 10.6839 14.4342 10.8738C14.2636 11.0729 14.071 11.2235 13.8563 11.3258C13.7359 11.3834 13.5898 11.4221 13.4181 11.4419C13.0784 11.4809 12.7387 11.4783 12.3988 11.4342C12.3536 11.4282 12.3143 11.4063 12.2809 11.3684C12.1563 11.226 12.01 11.135 11.8419 11.0953C11.7088 11.0638 11.6476 10.9642 11.6584 10.7964C11.692 10.2824 11.711 9.86882 11.7156 9.55574C11.7175 9.41934 11.709 9.22753 11.6902 8.98031C11.6743 8.77336 11.6665 8.56599 11.6668 8.3582C11.6672 8.19623 11.6674 8.11396 11.6674 8.1114C11.6626 7.30814 11.6612 6.50499 11.6629 5.70194C11.6629 5.70023 11.6626 5.61072 11.6619 5.4334C11.6608 5.12864 11.672 4.8244 11.6954 4.5207C11.7111 4.31589 11.72 4.11875 11.7219 3.92929C11.7224 3.88624 11.7356 3.85001 11.7614 3.82059C11.9052 3.65692 12.0684 3.55089 12.251 3.50251C12.4373 3.45285 12.6256 3.42291 12.8161 3.41268C13.1508 3.39477 13.4691 3.47224 13.7708 3.64509C13.9349 3.73907 14.0781 3.8678 14.2004 4.03127C14.312 4.18024 14.413 4.37098 14.5034 4.6035C14.7179 5.15507 14.8217 5.75618 14.8147 6.40684C14.8132 6.55944 14.7988 6.68454 14.7717 6.78215C14.6912 7.07392 14.6045 7.30782 14.5118 7.48386C14.4286 7.64136 14.3209 7.76785 14.1886 7.86333C14.0998 7.92726 14.0114 7.98758 13.9234 8.04427ZM13.1513 4.14412C13.0936 4.07741 13.0256 4.03595 12.9471 4.01976C12.7315 3.97543 12.535 4.00154 12.3577 4.09808C12.3208 4.11833 12.3042 4.15285 12.3079 4.20166C12.3248 4.43354 12.3528 4.64432 12.3918 4.83399C12.4134 4.93864 12.4285 5.04467 12.4368 5.15208C12.5018 5.97516 12.5663 6.79824 12.6303 7.62133C12.631 7.63006 12.631 7.6518 12.6303 7.68654C12.6292 7.73194 12.643 7.74963 12.6717 7.73961C12.6725 7.7394 12.6904 7.73013 12.7254 7.7118C13.111 7.50827 13.3591 7.17323 13.4697 6.70671C13.5026 6.56797 13.5216 6.3818 13.5268 6.14822C13.5307 5.97857 13.5319 5.79039 13.5305 5.58366C13.5282 5.24799 13.487 4.93214 13.4068 4.63611C13.3551 4.44558 13.2699 4.28158 13.1513 4.14412ZM12.6897 10.6762L12.9586 10.8281C12.9857 10.8432 13.0188 10.8466 13.0577 10.8383C13.2134 10.8055 13.346 10.7257 13.4556 10.5989C13.5214 10.5228 13.5617 10.4441 13.5764 10.3629C13.6117 10.1671 13.6275 9.93329 13.6238 9.66155C13.6215 9.49724 13.6018 9.3473 13.5646 9.21176C13.5249 9.06726 13.458 8.94397 13.3638 8.84188C13.1888 8.65199 12.9684 8.55406 12.7029 8.54809C12.692 8.54783 12.6814 8.5528 12.6735 8.56194C12.6656 8.57108 12.6609 8.58367 12.6604 8.597C12.6389 9.17457 12.6292 9.7419 12.6313 10.299C12.6318 10.4094 12.641 10.5179 12.6588 10.6244C12.6608 10.6362 12.6646 10.6471 12.67 10.6561C12.6753 10.6651 12.6821 10.672 12.6897 10.6762Z"
                                fill="#CDD8D3"
                              />
                              <path
                                d="M15.4623 10.9895C15.4305 10.9671 15.4047 10.937 15.3848 10.899C15.3689 10.869 15.3609 10.8285 15.3609 10.7776C15.3623 10.3004 15.3452 9.82416 15.3095 9.34889C15.2627 8.72231 15.229 8.31482 15.2084 8.12642C15.1906 7.96338 15.1766 7.82858 15.1665 7.72202C15.1551 7.6016 15.1494 7.46606 15.1494 7.31538C15.1498 6.77575 15.1514 6.23623 15.1544 5.69681C15.1561 5.38928 15.1725 5.02494 15.2034 4.60381C15.2263 4.29265 15.3508 4.07687 15.5769 3.95645C15.7713 3.85309 15.9928 3.78521 16.2413 3.75281C16.5907 3.70742 16.9715 3.70273 17.3837 3.73875C17.4777 3.74706 17.5546 3.77903 17.6143 3.83465C17.621 3.84111 17.6258 3.84993 17.6282 3.85991C17.6495 3.95539 17.6336 4.02646 17.5805 4.07314C17.5531 4.09722 17.5023 4.11491 17.4282 4.1262C17.0758 4.1797 16.7492 4.24299 16.4483 4.3161C16.3924 4.32974 16.3429 4.36043 16.2997 4.40817C16.274 4.4363 16.2592 4.47093 16.2551 4.51206C16.252 4.54467 16.2503 4.58527 16.2502 4.63386C16.2484 5.17903 16.2579 5.66953 16.2785 6.10537C16.2877 6.30443 16.2965 6.51712 16.3047 6.74346C16.3136 6.99409 16.3277 7.24132 16.3471 7.48513C16.3482 7.49912 16.3536 7.51209 16.3622 7.52141C16.3708 7.53073 16.382 7.53571 16.3935 7.53532C16.7152 7.52424 17.0343 7.51081 17.3509 7.49504C17.4643 7.48929 17.5641 7.51987 17.6502 7.58679C17.7538 7.66714 17.7802 7.77711 17.7294 7.91671C17.7205 7.941 17.6956 7.96828 17.6549 7.99854C17.6296 8.01751 17.5995 8.03414 17.5645 8.04841C17.4641 8.08955 17.3617 8.12045 17.2574 8.14112C17.1006 8.17224 17.0204 8.18812 17.0168 8.18876C16.8225 8.23032 16.6307 8.24769 16.4415 8.24087C16.4374 8.24074 16.4333 8.2416 16.4294 8.2434C16.4256 8.24519 16.4221 8.2479 16.4191 8.25134C16.4161 8.25479 16.4138 8.25892 16.4121 8.26348C16.4105 8.26805 16.4096 8.27297 16.4095 8.27795L16.3809 10.3422C16.3809 10.3463 16.3816 10.3505 16.3829 10.3543C16.3842 10.3582 16.3861 10.3617 16.3886 10.3646C16.391 10.3676 16.3939 10.3699 16.3971 10.3714C16.4003 10.3729 16.4037 10.3736 16.4072 10.3735C16.665 10.3643 16.9119 10.3536 17.1478 10.3412C17.3496 10.3305 17.5418 10.3595 17.7244 10.4281C17.7639 10.4431 17.8006 10.4667 17.8345 10.4991C17.8682 10.5313 17.8925 10.5706 17.9073 10.6171C17.9452 10.7343 17.9209 10.8332 17.8342 10.9137C17.6668 11.0687 17.4642 11.1441 17.2264 11.1401C17.0016 11.1363 16.7766 11.1366 16.5516 11.141C16.2977 11.1459 16.0443 11.1361 15.7913 11.1116C15.6703 11.0999 15.5607 11.0592 15.4623 10.9895Z"
                                fill="#CDD8D3"
                              />
                              <path
                                d="M22.8134 4.39588C22.5627 4.39354 22.3121 4.393 22.0615 4.39428C21.8887 4.39514 21.7795 4.38437 21.7339 4.36199C21.6441 4.31788 21.6044 4.2451 21.6149 4.14365C21.6214 4.08057 21.6465 4.03197 21.6904 3.99787C21.7334 3.96441 21.7828 3.9479 21.8387 3.94832C21.9698 3.94918 22.1008 3.94545 22.2319 3.93713C22.5446 3.9171 22.9399 3.88023 23.4178 3.82652C23.6837 3.79669 23.9875 3.77623 24.3291 3.76514C24.3306 3.76514 24.3912 3.75918 24.5107 3.74724C24.6812 3.73019 24.8371 3.78347 24.9782 3.90708C24.9852 3.91331 24.9902 3.92198 24.9924 3.9317C25.0074 4.00096 25.0006 4.0617 24.972 4.11392C24.951 4.15185 24.9125 4.1818 24.8564 4.20375C24.703 4.26342 24.5462 4.30051 24.3859 4.315C24.3138 4.32161 24.2144 4.328 24.0879 4.33418C23.9887 4.33908 23.889 4.33759 23.7889 4.32971C23.7834 4.32932 23.7778 4.3303 23.7726 4.33259C23.7674 4.33489 23.7626 4.33844 23.7586 4.34305C23.7545 4.34766 23.7513 4.35322 23.7491 4.35938C23.7468 4.36555 23.7457 4.37221 23.7457 4.37894C23.7411 5.10846 23.7454 5.83009 23.7585 6.54384C23.7611 6.68791 23.7679 6.90082 23.7787 7.18257C23.7906 7.49949 23.7983 7.81661 23.802 8.13395C23.8043 8.32406 23.8083 8.53718 23.8141 8.77332C23.8289 9.37817 23.8237 9.9829 23.7983 10.5875C23.7894 10.7992 23.7728 11.0014 23.7485 11.1943C23.7417 11.2486 23.7196 11.2912 23.6822 11.3219C23.5797 11.4058 23.4719 11.4519 23.3588 11.46C23.1041 11.4781 22.9381 11.4778 22.8609 11.459C22.7162 11.424 22.6441 11.3095 22.6447 11.1153C22.6481 9.97449 22.656 9.13265 22.6682 8.58983C22.6892 7.66785 22.715 6.7461 22.7456 5.82455C22.7583 5.43795 22.7798 5.10025 22.81 4.81147C22.8259 4.65973 22.8316 4.52653 22.8271 4.41187C22.8269 4.40757 22.8254 4.4035 22.8229 4.40052C22.8203 4.39754 22.817 4.39588 22.8134 4.39588Z"
                                fill="#CDD8D3"
                              />
                              <path
                                d="M4.23948 11.4257C3.8495 11.4208 3.45961 11.425 3.0698 11.4382C3.02018 11.4399 2.93133 11.4505 2.80326 11.4698C2.74124 11.4792 2.67895 11.4843 2.6164 11.4852C2.54913 11.4858 2.48684 11.4885 2.42953 11.4932C2.26686 11.5066 2.10525 11.4951 1.94468 11.4587C1.89418 11.4474 1.85251 11.4325 1.81966 11.4142C1.77581 11.3899 1.73903 11.3602 1.70932 11.325C1.68818 11.3001 1.67761 11.2698 1.67761 11.2342C1.67761 10.0094 1.67761 8.80027 1.67761 7.60678C1.67761 7.55989 1.67324 7.52302 1.66451 7.49616L1.66896 7.49329C1.67005 7.49266 1.671 7.49133 1.6717 7.48946C1.6724 7.48759 1.67281 7.48526 1.67289 7.48274C1.68582 6.9625 1.67648 6.33518 1.64485 5.60075C1.62878 5.2248 1.63978 4.80527 1.67787 4.34216C1.68836 4.21385 1.70775 4.11848 1.73606 4.05604C1.77974 3.95928 1.84281 3.89097 1.92528 3.85112C2.02155 3.80466 2.13285 3.79166 2.25918 3.81212C2.37519 3.83087 2.48168 3.88746 2.57866 3.98187C2.66637 4.06733 2.7242 4.16739 2.75216 4.28205C2.77033 4.35643 2.78273 4.4549 2.78937 4.57744C2.81698 5.08638 2.84755 5.59521 2.8811 6.10394C2.92443 6.761 2.94846 7.41912 2.95317 8.07831C2.95842 8.83234 2.96628 9.58626 2.97676 10.3401C2.97851 10.4626 2.98192 10.5778 2.98698 10.6857C2.98746 10.6963 2.9913 10.7063 2.9977 10.7136C3.0041 10.7209 3.01257 10.7248 3.02132 10.7247C3.48188 10.7153 3.92725 10.7016 4.35742 10.6837C4.42539 10.681 4.50331 10.6883 4.5912 10.7058C4.67157 10.722 4.74268 10.7588 4.80453 10.8161C4.86184 10.8692 4.89408 10.9313 4.90124 11.0025C4.91015 11.0937 4.87687 11.168 4.80139 11.2253C4.63645 11.3504 4.4557 11.4094 4.25914 11.4024C4.21913 11.4009 4.21257 11.4087 4.23948 11.4257Z"
                                fill="#CDD8D3"
                              />
                            </svg>
                          </div>
                        </div>
                      </ChainSectionHeadAlt>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="flex gap-x-[8px] items-center pb-[15px] scroll-mt-8"
              ref={JumpToSections.Fundamentals.ref}
              id="fundamentals"
            >
              <div className="w-9 h-9  ">
                <Icon icon={`gtp:fundamentals`} className="w-9 h-9" />
              </div>
              <Heading
                className="leading-[120%] text-[20px] md:text-[30px] break-inside-avoid "
                as="h2"
              >
                Fundamental Metrics
              </Heading>
            </div>

            {chainData && (
              <ChainChart
                chain={chain}
                master={master}
                chainData={chainData}
                defaultChainKey={chainKey}
              />
            )}
          </div>
        )}
      </Container>

      {master && overviewData !== null && (
        <>
          <Container className="flex flex-col w-full pt-[30px] md:pt-[60px]">
            <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
              <div
                className="flex gap-x-[8px] items-center scroll-mt-8"
                ref={JumpToSections.Blockspace.ref}
                id="blockspace"
              >
                <Image
                  src="/GTP-Package.svg"
                  alt="GTP Chain"
                  className="object-contain w-[32px] h-[32px]"
                  height={36}
                  width={36}
                />
                <Heading
                  className="text-[20px] leading-snug md:text-[30px] !z-[-1]"
                  as="h2"
                >
                  {master.chains[chainKey].name} Blockspace
                </Heading>
              </div>
            </div>
            <div className="flex items-center mb-[30px]">
              <div className="text-[16px]">
                An overview of {master.chains[chainKey].name} high-level
                blockspace usage. All expressed in share of chain usage. You can
                toggle between share of chain usage or absolute numbers.
              </div>
            </div>
          </Container>

          <OverviewMetrics
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={overviewData}
            master={master}
            forceSelectedChain={chainKey}
          />
        </>
      )}
    </>
  );
};

export default Chain;
