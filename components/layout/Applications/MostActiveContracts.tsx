"use client";
import { useState, useMemo } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import {
  GridTableHeader,
  GridTableHeaderCellButton,
  GridTableRow,
} from "@/components/layout/GridTable";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { theme } from "highcharts";
import { useTheme } from "next-themes";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { openExternalLinkWithDisclaimer } from "@/components/ExternalLink/ExternalLink";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

const CONTRACT_GRID_COLS = "grid-cols-[minmax(200px,220px),130px,minmax(140px,1fr),105px,105px,100px]";

const MostActiveContracts = ({ data, containerHeight, owner_project }: { data: ApplicationDetailsData; containerHeight?: number; owner_project: string }) => {
  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "txcount",
    sortOrder: "desc",
  });
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { data: master, AllChainsByKeys } = useMaster();
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const oliHide = useMediaQuery("(max-width: 530px)");

  const [topPartsRef, { height: topPartsHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [tableHeaderRef, { height: tableHeaderHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [footerRef, { height: footerHeight }] = useElementSizeObserver<HTMLDivElement>();

  // Outer card has py-[15px] (30px) and gap-y-[10px] with 3 flex children → 2 gaps (20px)
  const VERTICAL_OVERHEAD = 50;
  const scrollAreaHeight = containerHeight && containerHeight > 0
    ? Math.max(100, containerHeight - topPartsHeight - tableHeaderHeight - footerHeight - VERTICAL_OVERHEAD)
    : 350;

  const iconNames = {
    "finance": "gtp-defi",
    "collectibles": "gtp-nft",
    "token_transfers": "gtp-tokentransfers",
    "utility": "gtp-utilities",
    "social": "gtp-socials",
    "cefi": "gtp-cefi",
    "cross_chain": "gtp-crosschain",
  };

  const sortedContracts = useMemo(() => {
    const types = data.contracts_table["7d"].types;

    const metricToTypeKey: Record<string, string> = {
      name: "name",
      category: "main_category_key",
      subcategory: "sub_category_key",
      txcount: "txcount",
      activeAddresses: "daa",
      feesPaid: showUsd ? "fees_paid_usd" : "fees_paid_eth",
    };

    const stringMetrics = new Set(["name", "category", "subcategory"]);

    const typeKey = metricToTypeKey[sort.metric] ?? "txcount";
    const colIdx = types.indexOf(typeKey);
    const dir = sort.sortOrder === "asc" ? 1 : -1;

    return [...Object.values(data.contracts_table["7d"].data)].sort((a, b) => {
      const aVal = a[colIdx];
      const bVal = b[colIdx];
      if (stringMetrics.has(sort.metric)) {
        return dir * ((bVal as string ?? "").localeCompare(aVal as string ?? ""));
      }
      return dir * ((aVal as number ?? 0) - (bVal as number ?? 0));
    });
  }, [data.contracts_table, sort, showUsd]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1000);
  };


  return (
    <div
      className="flex flex-col w-full rounded-[15px] bg-color-bg-default px-[30px] py-[15px] gap-y-[10px]"
      style={containerHeight && containerHeight > 0 ? { height: `${containerHeight}px` } : undefined}
    >
      {/* Header + Description (measured together as fixed top block) */}
      <div ref={topPartsRef} className="flex flex-col gap-y-[10px]">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-[5px]">
            <GTPIcon
              icon="gtp-labeled"
              className="!size-[16px]"
              containerClassName="!size-[16px] flex items-center justify-center"
            />
            <div className="heading-large-md text-nowrap text-color-text-primary">
              Most Active Contracts
            </div>
          </div>
          <div ref={footerRef} className="relative w-full flex items-center justify-end">
            {!oliHide && (
              <>
                <GTPButton
                  label="Don't see your contract? Label here."
                  leftIcon={"oli-open-labels-initiative" as GTPIconName}
                  size="xs"
                  rightIcon={"in-button-right-monochrome" as GTPIconName}
                  className="z-30"
                  clickHandler={() => {
                    window.location.href = `https://www.growthepie.com/applications/edit?source=application-page&project=${owner_project}&focus=contracts&start=contracts`;
                  }}
                />
                <div
                  className="absolute -top-[0.5px] h-[22px] rounded-full w-[212px]"
                  style={{
                    background: "linear-gradient(33deg, #5C44C2 -14.22%, #69ADDA 42.82%, #FF1684 93.72%)",
                  }}
                />
              </>
            )}
        </div>

        </div>
        <div className="text-xs text-color-text-primary">
          See the most active contracts for this application in the last 7 days.
        </div>
      </div>

      {/* Scrollable table */}
        <HorizontalScrollContainer enableDragScroll={true} includeMargin={false} forcedMinWidth={992} hideScrollbar={true}>
          <div ref={tableHeaderRef}>
          <GridTableHeader
            gridDefinitionColumns={CONTRACT_GRID_COLS}
            className="!pt-[0px] !pb-[0px] !gap-x-[10px] !pl-0 !pr-[65px]"
          >
            {/* Column 0: pl-[36px] = icon container (30px) + gap (6px), aligns label with contract name text */}
            <GridTableHeaderCellButton label="Contract"          metric="name"            sort={sort} setSort={setSort} justify="start" size="xs" className="pl-[36px]" />
            <GridTableHeaderCellButton label="Category"          metric="category"        sort={sort} setSort={setSort} justify="start" size="xs" className="pl-[4px]" />
            <GridTableHeaderCellButton label="Subcategory"       metric="subcategory"     sort={sort} setSort={setSort} justify="start" size="xs" className="" />
            <GridTableHeaderCellButton label="Transaction Count" metric="txcount"         sort={sort} setSort={setSort} justify="end"   size="xs" />
            <GridTableHeaderCellButton label="Active Addresses"  metric="activeAddresses" sort={sort} setSort={setSort} justify="end"   size="xs" />
            <GridTableHeaderCellButton label="Fees Paid (USD)"   metric="feesPaid"        sort={sort} setSort={setSort} justify="end"   size="xs" className="-mr-[12px]" />
          </GridTableHeader>
          </div>

          <VerticalScrollContainer
            height={scrollAreaHeight}
            enableDragScroll={true}
            scrollbarPosition="right"
            scrollbarAbsolute={true}
            paddingRight={30}
            
          >
            <div className="flex flex-col gap-y-[3px] pt-[5px]">
              {sortedContracts.map((contract, index) => {
                const types = data.contracts_table["7d"].types;

                const contractMap = {
                  address: contract[types.indexOf("address")],
                  name: contract[types.indexOf("name")],
                  main_category_key: contract[types.indexOf("main_category_key")],
                  sub_category_key: contract[types.indexOf("sub_category_key")],
                  chain_key: contract[types.indexOf("origin_key")],
                  txcount: contract[types.indexOf("txcount")],
                  daa: contract[types.indexOf("daa")],
                  fees_paid: showUsd ? contract[types.indexOf("fees_paid_usd")] : contract[types.indexOf("fees_paid_eth")],
                  verified: contract[types.indexOf("verified")],
                };

                const prefix = master?.app_metrics["gas_fees"]?.units[showUsd ? "usd" : "eth"]?.prefix ?? "";
                const suffix = master?.app_metrics["gas_fees"]?.units[showUsd ? "usd" : "eth"]?.suffix ?? "";
                const decimals = master?.app_metrics["gas_fees"]?.units[showUsd ? "usd" : "eth"]?.decimals ?? 2;
                const mainCategoryIcon = iconNames[contractMap.main_category_key as string] ?? "gtp-unknown";

                return (
                  <GridTableRow
                    key={contractMap.address + index.toString() + "CONTRACT_ROW"}
                    gridDefinitionColumns={CONTRACT_GRID_COLS}
                    className="h-[34px] text-[12px] !py-0 !gap-x-[10px]"
                    style={{ paddingLeft: "0px" }}
                  >
                    {/* Contract name + copy + explorer */}
                    <div className="flex items-center gap-x-[6px] min-w-0">
                      <GTPIcon
                        icon={`gtp:${AllChainsByKeys[contractMap.chain_key as string].urlKey}-logo-monochrome` as GTPIconName}
                        className="!size-[16px]"
                        containerClassName="!size-[30px] flex items-center justify-center bg-color-ui-active rounded-full"
                        style={{ color: AllChainsByKeys[contractMap.chain_key as string].colors[theme ?? "dark"][0] }}
                      />
                      <span className="truncate text-xs">{contractMap.name as string}</span>
                      <div className="flex items-center gap-x-[4px] shrink-0">
                        {contractMap.verified ? (
                          <GTPTooltipNew
                            placement="right"
                            size="fit"
                            allowInteract={true}
                            trigger={
                              <div className="w-[12px] h-[12px] flex items-center justify-center">
                                <GTPIcon
                                  icon="gtp-verified"
                                  className="!size-[12px]"
                                  containerClassName="!size-[12px] flex items-center justify-center"
                                />
                              </div>
                            }
                          >
                            <div className="text-xs pl-[15px]">Verified</div>
                          </GTPTooltipNew>
                        ) : (
                          <GTPTooltipNew
                            placement="right"
                            size="fit"
                            allowInteract={true}
                            trigger={
                              <div className="w-[12px] h-[12px] flex items-center justify-center">
                                <GTPIcon
                                  icon="gtp-unverified-monochrome"
                                  className="!size-[12px]"
                                  containerClassName="!size-[12px] flex items-center justify-center"
                                />
                              </div>
                            }
                          >
                            <div className="text-xs pl-[15px]">Unverified</div>
                          </GTPTooltipNew>
                        )}
                        {/* <button
                          onClick={() => handleCopy(contractMap.address as string)}
                          className="text-color-text-secondary hover:text-color-text-primary transition-colors"
                        >
                          <Icon
                            icon={copiedAddress === contractMap.address ? "feather:check" : "feather:copy"}
                            className="w-[11px] h-[11px]"
                          />
                        </button>
                        <Icon
                          icon="gtp:gtp-block-explorer-alt"
                          className="w-[11px] h-[11px] text-color-text-secondary"
                        /> */}
                      </div>
                    </div>

                    {/* Category badge */}
                    <div className="flex items-center bg-color-bg-medium h-full p-1 gap-x-[8px]">
                      <GTPIcon icon={mainCategoryIcon} className="!size-[16px]" containerClassName="bg-color-ui-active rounded-full flex items-center justify-center" />
                      <div className="text-xs">{master?.blockspace_categories.main_categories?.[contractMap.main_category_key as string] ?? "Unlabeled"}</div>
                    </div>

                    {/* Subcategory */}
                    <div className="truncate text-xs min-w-0">
                      {master?.blockspace_categories.sub_categories?.[contractMap.sub_category_key as string] ?? "Unlabeled"}
                    </div>

                    {/* Transaction Count */}
                    <div className="flex items-center justify-end numbers-xs">
                      {(contractMap.txcount as number).toLocaleString("en-GB")}
                    </div>

                    {/* Active Addresses */}
                    <div className="flex items-center justify-end numbers-xs">
                      {(contractMap.daa as number).toLocaleString("en-GB")}
                    </div>

                    {/* Fees Paid */}
                    <div className="flex items-center justify-end numbers-xs">
                      {prefix}{(contractMap.fees_paid as number).toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
                    </div>
                  </GridTableRow>
                );
              })}
            </div>
          </VerticalScrollContainer>
          
        </HorizontalScrollContainer>
        {oliHide && (
          <div className="relative flex items-center justify-start mt-[5px]">
                <GTPButton
                  label="Don't see your contract? Label here."
                  leftIcon={"oli-open-labels-initiative" as GTPIconName}
                  size="xs"
                  rightIcon={"in-button-right-monochrome" as GTPIconName}
                  className="z-30"
                  clickHandler={() => {
                    window.location.href = `https://www.growthepie.com/applications/edit?source=application-page&project=${owner_project}&focus=contracts&start=contracts`;
                  }}
                />
                <div
                  className="absolute -top-[0.5px] h-[22px] rounded-full w-[212px]"
                  style={{
                    background: "linear-gradient(33deg, #5C44C2 -14.22%, #69ADDA 42.82%, #FF1684 93.72%)",
                  }}
                />
          </div>
        )}

      {/* Footer CTA */}

    </div>
  );
};

export default MostActiveContracts;
