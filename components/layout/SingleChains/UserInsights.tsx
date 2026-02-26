"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { UserInsightsResponse } from "@/types/api/ChainUserInsightsResponse";
import ShowLoading from "@/components/layout/ShowLoading";
import { GridTableHeader, GridTableHeaderCell, GridTableRow, GridTableChainIcon, GridTableAddressCell } from "@/components/layout/GridTable";
import Heading from "@/components/layout/Heading";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { useLocalStorage } from "usehooks-ts";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useMaster } from "@/contexts/MasterContext";
import { getExplorerAddressUrl } from "@/lib/helpers";
import { useTheme } from "next-themes";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { GTPTooltipNew, GTPApplicationTooltip, OLIContractTooltip } from "@/components/tooltip/GTPTooltip";
import Image from "next/image";
import { Category } from "@/app/(layout)/applications/_components/Components";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import router from "next/router";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserInsightsProps {
  chainKey: string;
}

export default function UserInsights({ chainKey }: UserInsightsProps) {
  const { data, error, isLoading, isValidating } = useSWR<UserInsightsResponse>(
    `https://api.growthepie.com/v1/chains/${chainKey}/user_insights.json`,
    fetcher
  );

  const [showUsd] = useLocalStorage("showUsd", true);
  const { AllChainsByKeys, data: master } = useMaster();
  const { theme } = useTheme();
  const { ownerProjectToProjectData, projectNameToProjectData } = useProjectsMetadata();
  const [copyContract, setCopyContract] = useState<string | null>(null);

  // Helper to format numbers
  const formatNum = (num: number, currency: boolean = false) => {
    if (currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    }
    return new Intl.NumberFormat("en-GB").format(num);
  };

  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "txcount",
    sortOrder: "desc",
  });

  const [selectedTimespanNewUsers, setSelectedTimespanNewUsers] = useState("1d");
  const [selectedTimespanCrossChain, setSelectedTimespanCrossChain] = useState("1d");

  const [crossChainSort, setCrossChainSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "share_of_users",
    sortOrder: "desc",
  });

  const timespans = useMemo(() => {
    return {
      "1d": { label: "Yesterday", shortLabel: "1d", value: 1 },
      "7d": { label: "7 days", shortLabel: "7d", value: 7 },
      "30d": { label: "30 days", shortLabel: "30d", value: 30 },
      "90d": { label: "90 days", shortLabel: "90d", value: 90 },
      "180d": { label: "180 days", shortLabel: "180d", value: 180 },
      "365d": { label: "1 year", shortLabel: "1y", value: 365 },
      "max": { label: "Max", shortLabel: "Max", value: 0 },
    };
  }, []);

  const newUserContracts = useMemo(() => {
    if (!data?.data?.new_user_contracts) return [];

    const timeframe = data.data.new_user_contracts[selectedTimespanNewUsers];

    if (!timeframe) return [];

    return timeframe.data.map((row) => {
      // [address, contract_name, owner_project, sub_category_key, main_category_key, txcount, gas_fees_eth, gas_fees_usd]
      return {
        address: row[0],
        contract_name: row[1],
        owner_project: row[2],
        sub_category_key: row[3],
        main_category_key: row[4],
        txcount: row[5],
        gas_fees_eth: row[6],
        gas_fees_usd: row[7],
      }
    });
  }, [data, selectedTimespanNewUsers]);

  const sortedNewUserContracts = useMemo(() => {
    return [...newUserContracts].sort((a, b) => {
      let valueA: any = a[sort.metric as keyof typeof a];
      let valueB: any = b[sort.metric as keyof typeof b];

      // Handle specific sort metrics
      if (sort.metric === "contract") {
        valueA = a.contract_name || a.address;
        valueB = b.contract_name || b.address;
      } else if (sort.metric === "application") {
        const projectDataA = a.owner_project ? ownerProjectToProjectData[a.owner_project] : null;
        const projectDataB = b.owner_project ? ownerProjectToProjectData[b.owner_project] : null;
        valueA = projectDataA?.display_name || a.owner_project || "";
        valueB = projectDataB?.display_name || b.owner_project || "";
      } else if (sort.metric === "fees") {
        valueA = showUsd ? a.gas_fees_usd : a.gas_fees_eth;
        valueB = showUsd ? b.gas_fees_usd : b.gas_fees_eth;
      }

      // Handle string comparison
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sort.sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      // Handle number comparison
      return sort.sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [newUserContracts, sort, showUsd, ownerProjectToProjectData]);

  const crossChainUsage = useMemo(() => {
    if (!data?.data?.cross_chain_addresses) return [];

    const timeframe = data.data.cross_chain_addresses[selectedTimespanCrossChain];

    if (!timeframe) return [];

    return timeframe.data.map((row) => {
      // [cross_chain, current, previous, change, change_percent, share_of_users]
      return {
        cross_chain: row[0],
        current: row[1],
        previous: row[2],
        change: row[3],
        change_percent: row[4],
        share_of_users: row[5],
      }
    });
  }, [data, selectedTimespanCrossChain]);

  const sortedCrossChainUsage = useMemo(() => {
    return [...crossChainUsage].sort((a, b) => {
      let valueA: any = a[crossChainSort.metric as keyof typeof a];
      let valueB: any = b[crossChainSort.metric as keyof typeof b];

      if (crossChainSort.metric === "cross_chain") {
        const chainA = AllChainsByKeys[a.cross_chain]?.label || a.cross_chain;
        const chainB = AllChainsByKeys[b.cross_chain]?.label || b.cross_chain;
        return crossChainSort.sortOrder === "asc" ? chainA.localeCompare(chainB) : chainB.localeCompare(chainA);
      }

      // Handle number comparison
      return crossChainSort.sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
  }, [crossChainUsage, crossChainSort, AllChainsByKeys]);

  const maxCrossChainValue = useMemo(() => {
    return Math.max(...crossChainUsage.filter(row => !["total", "exclusive"].includes(row.cross_chain)).map(row => row.share_of_users), 0);
  }, [crossChainUsage]);


  if (isLoading || !data) {
    return (
      <div className="w-full h-[60vh] overflow-hidden">
        <ShowLoading
          dataLoading={[isLoading]}
          dataValidating={[isValidating]}
          section={true}
        />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center">Error loading user insights data</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
        <div className="flex gap-x-[8px] items-center scroll-mt-8 mt-[10px]" id="user-insights">
          <GTPIcon icon="gtp-users" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
          <Heading className="font-bold leading-[120%] text-[20px] md:text-[30px] break-inside-avoid" as="h2">
            {master?.chains?.[chainKey]?.name} User Insights
          </Heading>
        </div>
      </div>
      {/* <div className="flex items-center mb-[30px]">
        <div className="text-sm">
          Understand how new users discover this chain and where existing users are also active across the ecosystem.
        </div>
      </div> */}

      <div className="flex flex-col gap-y-[30px]">
        {/* New User Contracts Section */}
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="heading-lg">Where do new users start?</div>
            <div className="text-sm">
              The contracts and applications that serve as entry points for new users on this chain.
            </div>
          </div>

          {/* Timespan Selector */}
          <div className="w-full flex justify-end">
            <TopRowContainer className="w-auto !p-1">
              <TopRowParent>
                <></>
              </TopRowParent>
              <TopRowParent className="!gap-x-1">
                {Object.keys(timespans).filter(t => data?.data?.new_user_contracts && data.data.new_user_contracts[t]).map((timespan) => (
                  <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespanNewUsers === timespan}
                    onClick={() => setSelectedTimespanNewUsers(timespan)}
                    className="!py-0 !px-[12px] text-xs lg:text-sm h-[28px] md:h-[44px] flex items-center justify-center"
                  >
                    <span className="hidden md:block">{timespans[timespan].label}</span>
                    <span className="block md:hidden">{timespans[timespan].shortLabel}</span>
                  </TopRowChild>
                ))}
              </TopRowParent>
            </TopRowContainer>
          </div>

          <div className="flex flex-col w-full">
            <HorizontalScrollContainer includeMargin={false}>
              <GridTableHeader
                gridDefinitionColumns="grid-cols-[minmax(200px,1.5fr),minmax(150px,1fr),120px,140px,115px,130px]"
                className="!pl-[10px] !pr-[10px] pb-[4px] text-[12px] gap-x-[15px] z-[2]"
                style={{ paddingTop: "15px" }}
              >
                <GridTableHeaderCell
                  metric="contract"
                  sort={sort}
                  setSort={setSort}
                  className="heading-small-xs pl-2 whitespace-nowrap"
                >
                  Contract
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="application"
                  sort={sort}
                  setSort={setSort}
                  className="heading-small-xs whitespace-nowrap"
                >
                  Application
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="main_category_key"
                  sort={sort}
                  setSort={setSort}
                  className="heading-small-xs whitespace-nowrap"
                >
                  Category
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="sub_category_key"
                  sort={sort}
                  setSort={setSort}
                  className="heading-small-xs whitespace-nowrap"
                >
                  Subcategory
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="txcount"
                  sort={sort}
                  setSort={setSort}
                  justify="end"
                  className="heading-small-xs relative pl-[10px] mr-0 whitespace-nowrap"
                  extraRight={
                    <GTPTooltipNew
                      placement="top"
                      allowInteract={false}
                      unstyled
                      containerClass="z-50"
                      trigger={
                        <div className="pl-[2px]">
                          <Icon icon="feather:info" className="size-[15px]" />
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-y-[5px] items-center relative">
                        <div className="p-[15px] text-xs bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                          <div>Number of unique addresses that interacted with this contract/application.</div>
                        </div>
                      </div>
                    </GTPTooltipNew>
                  }
                >
                  # Users
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="fees"
                  sort={sort}
                  setSort={setSort}
                  justify="end"
                  className="heading-small-xs relative pl-[10px] mr-0 pr-2 whitespace-nowrap"
                  extraRight={
                    <GTPTooltipNew
                      placement="top"
                      allowInteract={false}
                      unstyled
                      containerClass="z-50"
                      trigger={
                        <div className="pl-[2px]">
                          <Icon icon="feather:info" className="size-[15px]" />
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-y-[5px] items-center relative">
                        <div className="p-[15px] text-xs bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                          <div>Total gas fees spent by users on this contract/application.</div>
                        </div>
                      </div>
                    </GTPTooltipNew>
                  }
                >
                  Fees Spent
                </GridTableHeaderCell>
              </GridTableHeader>

              <div className="flex flex-col gap-y-[3px] mt-[5px]">
                {sortedNewUserContracts.map((row, i) => {
                  const projectData = row.owner_project ? ownerProjectToProjectData[row.owner_project] : null;
                  const displayName = projectData?.display_name || row.owner_project || "Unknown";
                  const contractLabel = row.contract_name || row.address;

                  return (
                    <GridTableRow
                      key={i}
                      gridDefinitionColumns="grid-cols-[minmax(200px,1.5fr),minmax(150px,1fr),120px,140px,115px,130px]"
                      className="!px-[10px] group text-[12px] h-[34px] inline-grid transition-all duration-300 gap-x-[15px] !py-0 hover:bg-forest-50 dark:hover:bg-forest-900/20 rounded-[10px]"
                    >
                      <div className="pl-[10px] pr-[10px] flex items-center gap-x-[15px] justify-between w-full truncate min-w-0">
                        {row.contract_name ? (
                          <div className="truncate font-medium text-xs" title={row.contract_name}>
                            {row.contract_name}
                          </div>
                        ) : (
                          <GTPTooltipNew
                            placement="bottom-start"
                            allowInteract={true}
                            trigger={<div className="w-full h-[30px] flex items-center"><GridTableAddressCell address={row.address} showCopyIcon={false} /></div>}
                          >
                            <OLIContractTooltip
                              icon="gtp-project-monochrome"
                              iconClassName="text-[#5A6462]"
                              project_name={displayName}
                              message="Contract information not available."
                              contractAddress={row.address}
                              chain={chainKey}
                            />
                          </GTPTooltipNew>
                        )}
                        <div className="flex items-center gap-x-[5px]">
                          <div
                            className="group flex items-center cursor-pointer gap-x-[5px] text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(row.address);
                              setCopyContract(row.address);
                              setTimeout(() => {
                                setCopyContract(null);
                              }, 1000);
                            }}
                          >
                            <Icon
                              icon={copyContract === row.address ? "feather:check" : "feather:copy"}
                              className="w-[12px] h-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            />
                          </div>
                          {master?.chains[chainKey]?.block_explorer && (
                            <Link
                              href={getExplorerAddressUrl(master.chains[chainKey].block_explorer, row.address)}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              <Icon
                                icon="gtp:gtp-block-explorer-alt"
                                className="w-[12px] h-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="truncate flex items-center">
                        {projectData ? (
                          <GTPTooltipNew
                            placement="bottom-start"
                            allowInteract={true}
                            trigger={
                              <div className="flex items-center gap-x-[5px] cursor-pointer hover:underline">
                                {projectData.logo_path && (
                                  <Image
                                    src={`https://api.growthepie.com/v1/apps/logos/${projectData.logo_path}`}
                                    width={15}
                                    height={15}
                                    className="rounded-full"
                                    alt={displayName}
                                  />
                                )}
                                <span className="truncate">{displayName}</span>
                              </div>
                            }
                            containerClass="flex flex-col gap-y-[10px]"
                            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                          >
                            <GTPApplicationTooltip owner_project={row.owner_project} />
                          </GTPTooltipNew>
                        ) : (
                          <GTPTooltipNew
                            placement="bottom-start"
                            allowInteract={true}
                            trigger={
                              <div className="pl-[20px] flex h-[30px] items-center gap-x-[3px] text-[#5A6462] text-[10px] cursor-pointer select-none min-w-0">
                                <span className="block w-full truncate">
                                  Not Available
                                </span>
                              </div>
                            }
                            containerClass="flex flex-col gap-y-[10px]"
                            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                          >
                            <OLIContractTooltip
                              icon="gtp-project-monochrome"
                              iconClassName="text-[#5A6462]"
                              project_name="Not Available"
                              message="Project information not available."
                              contractAddress={row.address}
                              chain={chainKey}
                            />
                          </GTPTooltipNew>
                        )}
                      </div>
                      <div className="truncate flex items-center">
                        <Category category={row.main_category_key && master?.blockspace_categories?.main_categories?.[row.main_category_key] ? master.blockspace_categories.main_categories[row.main_category_key] : ""} />
                      </div>
                      <div className="truncate flex items-center">
                        {row.sub_category_key ? (
                          master?.blockspace_categories?.sub_categories?.[row.sub_category_key]
                            ? master.blockspace_categories.sub_categories[row.sub_category_key]
                            : row.sub_category_key
                        ) : (
                          <span className="text-[#5A6462]">Unknown</span>
                        )}
                      </div>
                      <div className="text-right numbers-xs flex items-center justify-end">{formatNum(row.txcount)}</div>
                      <div className="text-right pr-2 numbers-xs flex items-center justify-end">
                        {showUsd ? formatNum(row.gas_fees_usd, true) : `${formatNum(row.gas_fees_eth)} ETH`}
                      </div>
                    </GridTableRow>
                  )
                })}
                {newUserContracts.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">No data available</div>
                )}
              </div>
            </HorizontalScrollContainer>
          </div>
        </div>

        {/* Cross Chain Usage Section */}
        <div className="flex flex-col gap-y-[15px]">
          <div className="flex flex-col gap-y-[10px]">
            <div className="heading-lg">Where else are users active?</div>
            <div className="text-sm">
              Other chains where this network's users are also transacting (EVM chains only).
            </div>
          </div>

          {/* Timespan Selector */}
          <div className="w-full flex justify-end">
            <TopRowContainer className="w-auto !p-1">
              <TopRowParent>
                <></>
              </TopRowParent>
              <TopRowParent className="!gap-x-1">
                {Object.keys(timespans).filter(t => data?.data?.cross_chain_addresses && data.data.cross_chain_addresses[t]).map((timespan) => (
                  <TopRowChild
                    key={timespan}
                    isSelected={selectedTimespanCrossChain === timespan}
                    onClick={() => setSelectedTimespanCrossChain(timespan)}
                    className="!py-0 !px-[12px] text-xs lg:text-sm h-[28px] md:h-[44px] flex items-center justify-center"
                  >
                    <span className="hidden md:block">{timespans[timespan].label}</span>
                    <span className="block md:hidden">{timespans[timespan].shortLabel}</span>
                  </TopRowChild>
                ))}
              </TopRowParent>
            </TopRowContainer>
          </div>

          <div className="flex flex-col w-full">
            <HorizontalScrollContainer includeMargin={false}>
              <GridTableHeader
                gridDefinitionColumns="grid-cols-[20px,minmax(180px,1fr),120px,120px,100px]"
                className="mt-[10px] group heading-small-xs gap-x-[15px] z-[2] !pl-[30px] !pr-[10px] select-none h-[34px] !pb-0 !pt-0"
              >
                <div className=""></div>
                <GridTableHeaderCell
                  metric="cross_chain"
                  sort={crossChainSort}
                  setSort={setCrossChainSort}
                  className="pl-2"
                >
                  Chain
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="share_of_users"
                  sort={crossChainSort}
                  setSort={setCrossChainSort}
                  justify="end"
                  className="heading-small-xs relative pl-[10px] mr-0 whitespace-nowrap"
                  extraRight={
                    <GTPTooltipNew
                      placement="top"
                      allowInteract={false}
                      unstyled
                      containerClass="z-50"
                      trigger={
                        <div className="pl-[2px]">
                          <Icon icon="feather:info" className="size-[15px]" />
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-y-[5px] items-center relative">
                        <div className="p-[15px] text-xs bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                          <div>Percentage of users on this chain that also transacted on the destination chain.</div>
                        </div>
                      </div>
                    </GTPTooltipNew>
                  }
                >
                  % of Users
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="current"
                  sort={crossChainSort}
                  setSort={setCrossChainSort}
                  justify="end"
                  className="heading-small-xs relative pl-[10px] mr-0 whitespace-nowrap"
                  extraRight={
                    <GTPTooltipNew
                      placement="top"
                      allowInteract={false}
                      unstyled
                      containerClass="z-50"
                      trigger={
                        <div className="pl-[2px]">
                          <Icon icon="feather:info" className="size-[15px]" />
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-y-[5px] items-center relative">
                        <div className="p-[15px] text-xs bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                          <div>Number of users on this chain that also transacted on the destination chain.</div>
                        </div>
                      </div>
                    </GTPTooltipNew>
                  }
                >
                  # of Users
                </GridTableHeaderCell>
                <GridTableHeaderCell
                  metric="change_percent"
                  sort={crossChainSort}
                  setSort={setCrossChainSort}
                  justify="end"
                  className="heading-small-xs relative pl-[10px] mr-0 pr-2"
                  extraRight={
                    <GTPTooltipNew
                      placement="top"
                      allowInteract={false}
                      unstyled
                      containerClass="z-50"
                      trigger={
                        <div className="pl-[2px]">
                          <Icon icon="feather:info" className="size-[15px]" />
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-y-[5px] items-center relative">
                        <div className="p-[15px] text-xs bg-color-bg-default dark:bg-color-bg-default text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex gap-y-[5px] max-w-[300px] flex-col z-50">
                          <div>Change in the number of cross-chain users compared to the previous period.</div>
                        </div>
                      </div>
                    </GTPTooltipNew>
                  }
                >
                  Growth
                </GridTableHeaderCell>
              </GridTableHeader>

              <div className="flex flex-col gap-y-[5px] mt-[5px] w-full relative">
                {sortedCrossChainUsage.filter((row) => !["total", "exclusive"].includes(row.cross_chain)).map((row, i) => {
                  const chain = AllChainsByKeys[row.cross_chain];

                  return (
                    <GridTableRow
                      key={i}
                      gridDefinitionColumns="grid-cols-[20px,minmax(180px,1fr),120px,120px,100px]"
                      className="relative group text-[14px] gap-x-[10px] z-[2] !pl-[10px] !pr-[10px] select-none h-[34px] !pb-0 !pt-0"
                      bar={{
                        origin_key: chain?.key,
                        width: maxCrossChainValue > 0 ? row.share_of_users / maxCrossChainValue : 0,
                        containerStyle: {
                          left: 1,
                          right: 1,
                          top: 0,
                          bottom: 0,
                          borderRadius: "9999px 9999px 9999px 9999px",
                          zIndex: -1,
                          overflow: "hidden",
                          opacity: 1,
                        },
                      }}
                      onClick={() => {
                        router.push(`/chains/${chain?.urlKey}`);
                      }}
                    >
                      <div className="w-[15px] h-[15px] flex items-center justify-center">
                        {chain ? (
                          <GridTableChainIcon origin_key={chain.key} />
                        ) : (
                          <div className="w-[15px] h-[15px] rounded-full bg-gray-300"></div>
                        )}
                      </div>
                      <div className="truncate font-medium text-xs group-hover:underline">{chain?.label || row.cross_chain}</div>

                      <div className="text-right numbers-xs flex items-center justify-end">{(row.share_of_users * 100).toFixed(2)}%</div>
                      <div className="text-right numbers-xs flex items-center justify-end">{formatNum(row.current)}</div>
                      <div className={`text-right pr-2 numbers-xs flex items-center justify-end ${row.change_percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {row.change_percent > 0 ? "+" : ""}{(row.change_percent * 100).toFixed(1)}%
                      </div>
                    </GridTableRow>
                  );
                })}
                {crossChainUsage.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">No data available</div>
                )}
              </div>
            </HorizontalScrollContainer>
          </div>
        </div>
      </div>
    </>
  );
}
