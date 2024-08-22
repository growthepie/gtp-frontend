"use client";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { MasterResponse } from "@/types/api/MasterResponse";
import { AllChains, AllChainsByKeys } from "@/lib/chains";
import ChainChart from "@/components/layout/SingleChains/ChainChart";
import Heading from "@/components/layout/Heading";
import { Icon } from "@iconify/react";
import { ChainBlockspaceURLs, ChainURLs, MasterURL } from "@/lib/urls";
import Container from "@/components/layout/Container";
import ShowLoading from "@/components/layout/ShowLoading";
import Image from "next/image";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import { ChainData } from "@/types/api/ChainOverviewResponse";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import ChainSectionHeadAlt from "@/components/layout/SingleChains/ChainSectionHeadAlt";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useSessionStorage, useLocalStorage } from "usehooks-ts";
import { notFound } from "next/navigation";
import { ChainsData } from "@/types/api/ChainResponse";
import { useTheme } from "next-themes";
import { useMediaQuery } from "usehooks-ts";
import { track } from "@vercel/analytics/react";
import UsageFeesAlt from "@/components/layout/SingleChains/UsageFeesAlt";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/layout/Tooltip";
import FeesHorizontalScrollContainer from "@/components/FeesHorizontalScrollContainer";
import { columns } from "@/components/table/contractTable/column";
import { ContractDataTable } from "@/components/table/contractTable/data-table";

const Chain = ({ params }: { params: any }) => {
  const { chain } = params;

  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  const { theme } = useTheme();

  const [chainKey, setChainKey] = useState<string>(
    AllChains.find((c) => c.urlKey === chain)?.key
      ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
      : "",
  );

  // const [openChainList, setOpenChainList] = useState<boolean>(false);

  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const isMobile = useMediaQuery("(max-width: 1024px)");
  // const { isSidebarOpen } = useUIContext();

  const rankChains = {
    daa: {
      Title: "Daily Active Addresses",
    },
    fees: {
      Title: "Fees Paid By Users",
    },
    stables_mcap: {
      Title: "Stablecoin Market Cap",
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
  } = useSWR<ChainData>(ChainBlockspaceURLs[chainKey]);
  // } = useSWR<LandingPageMetricsResponse>("/mock/landing_page.json");

  const {
    data: feeData,
    error: feeError,
    isLoading: feeLoading,
    isValidating: feeValidating,
  } = useSWR("https://api.growthepie.xyz/v1/fees/table.json");

  const {
    data: dataTest,
    error: errorTest,
    isLoading: loadingTest,
    isValidating: validatingTest,
  } = useSWR<any>("/mock/v2/operator-data.json");

  const { cache, mutate } = useSWRConfig();

  const fetchChainData = useCallback(async () => {
    setChainLoading(true);
    setChainValidating(true);

    try {
      // Fetch the data
      const response = await fetch(
        ChainURLs[chainKey].replace("/v1/", `/${apiRoot}/`),
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
            className={`${
              button.showIconBackground &&
              "bg-white dark:bg-forest-1000 relative "
            } rounded-full w-[25px] h-[25px] p-[5px]`}
          >
            <Icon
              icon={button.icon}
              className={`w-[15px] h-[15px] ${
                button.animateIcon &&
                "transition-transform duration-300 transform delay-0 group-hover/jump:delay-300 group-hover/jump:rotate-90"
              }`}
            />
            <Icon
              icon={"gtp:circle-arrow"}
              className={`w-[4px] h-[9px] absolute top-2 right-0 transition-transform delay-0 group-hover/jump:delay-300 duration-500 group-hover/jump:rotate-90 ${
                button.showIconBackground ? "block" : "hidden"
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
      <Container className="flex w-full pt-[30px] md:pt-[30px]" isPageRoot>
        {master && chainFeeData && chainData && (
          <div className="flex flex-col w-full">
            <div
              id="chains-page-title"
              className="flex flex-col md:flex-row justify-between items-start w-full"
            >
              <div className="flex flex-col md:flex-row pb-[15px] md:pb-[15px] items-start">
                <div className="flex gap-x-[8px] items-center">
                  <div className="w-9 h-9  ">
                    {/* <Icon
                      icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome`}
                      className="w-9 h-9"
                      style={{
                        color:
                          AllChainsByKeys[chainKey].colors[theme ?? "dark"][1],
                      }}
                    /> */}
                    <img
                      className="w-9 h-9"
                      src="/icons/exchange/eigen-layer-icon.png"
                      alt="Eigen Layer"
                    />
                  </div>
                  <Heading
                    className="leading-snug text-[30px] md:text-[36px] break-inside-avoid "
                    as="h1"
                  >
                    Eigen Layer
                    {/* {master.chains[chainKey].name} */}
                  </Heading>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col lg:flex-row gap-x-[5px] gap-y-[5px] bg-clip-content pb-[30px] md:pb-[60px]">
              <div className="relative flex lg:col-auto lg:w-[253px] lg:basis-[253px]">
                <ChainSectionHead
                  title={"Menu"}
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
                          label: "Website",
                          icon: "gtp:gtp-jump-to-section",
                          showIconBackground: true,
                        }}
                        items={[
                          {
                            label: "Home",
                            icon: "gtp:gtp-fundamentals",
                            href: "/",
                          },
                        ]}
                      />
                      {master.chains[chainKey].block_explorers &&
                        Object.keys(master.chains[chainKey].block_explorers)
                          .length > 0 && (
                          <ExpandingButtonMenu
                            className={`left-[5px] top-[50px] lg:top-[65px] right-[calc((100%/2)+5px)] lg:right-[120px]`}
                            button={{
                              label: "Docs",
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
                              Twitter
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </ChainSectionHead>
              </div>

              <div className="@container min-w-[67px] lg:max-w-[398px] lg:col-auto lg:basis-[398px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[398px] transition-all duration-300">
                <ChainSectionHeadAlt
                  title={"Background"}
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
                      </div>
                    </div>
                  </div>
                </ChainSectionHeadAlt>
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
                Risk Metrics
              </Heading>
            </div>
            <ChainSectionHead
              title={"Concentration of stake among operators"}
              enableDropdown={false}
              defaultDropdown={true}
              childrenHeight={isMobile ? 97 : 111}
              className="transition-all duration-300 w-full"
            ></ChainSectionHead>

            {master && overviewData !== null && chainKey !== "ethereum" && (
              <>
                <FeesHorizontalScrollContainer>
                  {overviewData && master && (
                    <ContractDataTable
                      columns={columns}
                      data={getData(dataTest)}
                    />
                  )}
                </FeesHorizontalScrollContainer>
              </>
            )}
          </div>
        )}
      </Container>
    </>
  );
};

const getData = (data: any): any[] => {
  // console.log("data test", data.operatorData[0]["Operator Address"]);
  // return [
  //   {
  //     icon: "icono",
  //     address: "r89ehpfzhsp8fher",
  //     name: "dorime",
  //     category: "basic",
  //     subcategory: "subasic",
  //     date_deployed: "15/01/12",
  //   },
  //   {
  //     icon: "icono",
  //     address: "v4ot8hv9ptvinsdhkfds",
  //     name: "ameno",
  //     category: "intermediate",
  //     subcategory: "susa",
  //     date_deployed: "22/08/20",
  //   },
  // ];
  return data.operatorData;
};

export default Chain;
