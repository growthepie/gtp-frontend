"use client";
import { useState, useMemo } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import {
  GridTableHeader,
  GridTableHeaderCellButton,
  GridTableRow,
} from "@/components/layout/GridTable";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { useTheme } from "next-themes";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getExplorerAddressUrl, IS_PRODUCTION } from "@/lib/helpers";
import { track } from "@/lib/tracking";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

const CONTRACT_GRID_COLS = "grid-cols-[minmax(220px,1fr),130px,160px,105px,105px,100px]";

// Dev/preview-only: the timespan selector + the reworked header/subtitle live behind this
// flag. On production the component renders its original (pre-selector) layout untouched.
const SHOW_DEV_CONTRACTS_UI = !IS_PRODUCTION;

// Visual-only timespan options for the contracts table. Selection does not yet
// affect the displayed data — wiring that up is a follow-up.
const CONTRACT_TIMESPANS: { key: string; label: string; shortLabel: string; subtitle: string }[] = [
  { key: "1d", label: "Yesterday", shortLabel: "1d", subtitle: "yesterday" },
  { key: "7d", label: "7 days", shortLabel: "7d", subtitle: "in the last 7 days" },
  { key: "30d", label: "30 days", shortLabel: "30d", subtitle: "in the last 30 days" },
  { key: "180d", label: "180 days", shortLabel: "180d", subtitle: "in the last 180 days" },
  { key: "max", label: "Max", shortLabel: "Max", subtitle: "across all time" },
];

const MostActiveContracts = ({ data, containerHeight, owner_project }: { data: ApplicationDetailsData; containerHeight?: number; owner_project: string }) => {
  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "txcount",
    sortOrder: "desc",
  });
  const [selectedTableTimespan, setSelectedTableTimespan] = useState<string>("7d");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
  const { data: master, AllChainsByKeys } = useMaster();
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Prod uses the original 530px breakpoint for the bottom "Contract missing?" CTA; the dev
  // layout moves it (and the inline buttons) at the 767px breakpoint instead.
  const oliHide = useMediaQuery("(max-width: 530px)");
  const ctaCompact = SHOW_DEV_CONTRACTS_UI ? isMobile : oliHide;

  const [headingRowRef, { width: headingRowWidth }] = useElementSizeObserver<HTMLDivElement>();
  const [titleRef, { width: titleWidth }] = useElementSizeObserver<HTMLDivElement>();
  const [topPartsRef, { height: topPartsHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [tableHeaderRef, { height: tableHeaderHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [mobileDownloadRef, { height: mobileDownloadHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [bottomCtaRef, { height: bottomCtaHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [devBottomRef, { height: devBottomHeight }] = useElementSizeObserver<HTMLDivElement>();

  // Outer card has py-[15px] (30px) plus one gap between the intro and table (10px).
  const VERTICAL_OVERHEAD = 40 + (SHOW_DEV_CONTRACTS_UI
    ? (devBottomHeight > 0 ? devBottomHeight + 10 : 0)
    : (isMobile ? mobileDownloadHeight + 10 : 0) + (ctaCompact ? bottomCtaHeight + 10 : 0));
  const scrollAreaHeight = containerHeight && containerHeight > 0
    ? Math.max(100, containerHeight - topPartsHeight - tableHeaderHeight - VERTICAL_OVERHEAD)
    : 350;

  // The timespan selector is always the small (xs) size and absolutely positioned (so it
  // never shifts the title), which means it can overlap the title on narrow columns. Show
  // the long labels while there's room and switch to the short labels once there isn't.
  // ~305px ≈ xs selector w/ long labels + gap (Yesterday / 7 days / 30 days / 180 days / Max).
  const LONG_LABEL_RESERVE = 305;
  // ~220px ≈ short-label (xs) selector + gap. Below this even the short labels won't fit
  // beside the title, so the selector drops to its own row under the heading and we hide
  // the subheading to save vertical space.
  const SHORT_LABEL_RESERVE = 220;
  // When stacked, the selector gets its own full-width row, so it can show the long labels
  // again as long as they fit. ~300px ≈ xs selector with long labels.
  const STACKED_LONG_LABEL_WIDTH = 300;
  const roomBesideTitle = headingRowWidth > 0 ? headingRowWidth - titleWidth : Infinity;
  const stackSelector = roomBesideTitle < SHORT_LABEL_RESERVE;
  // compactSelector = use short labels. Inline: based on the space beside the title.
  // Stacked: based on the full row width (long labels if they fit, otherwise short).
  const compactSelector = stackSelector
    ? headingRowWidth > 0 && headingRowWidth < STACKED_LONG_LABEL_WIDTH
    : isMobile || roomBesideTitle < LONG_LABEL_RESERVE;

  // The bottom button row spans the full content width (same as the heading row). On narrow
  // screens the full "Contract missing? Label here." button pushes Download outside the row,
  // so drop its trailing text to keep both buttons inside. ~360px ≈ both full-label buttons.
  const BOTTOM_BUTTONS_COMPACT_BELOW = 360;
  const compactBottomContractButton =
    headingRowWidth > 0 && headingRowWidth < BOTTOM_BUTTONS_COMPACT_BELOW;
  // When even the short button + Download won't fit on one line, stack them so Download
  // drops below Contract missing. ~280px ≈ short Contract missing + Download on one row.
  const BOTTOM_BUTTONS_STACK_BELOW = 280;
  const stackBottomButtons =
    headingRowWidth > 0 && headingRowWidth < BOTTOM_BUTTONS_STACK_BELOW;

  const iconNames = {
    "finance": "gtp-defi",
    "collectibles": "gtp-nft",
    "token_transfers": "gtp-tokentransfers",
    "utility": "gtp-utilities",
    "social": "gtp-socials",
    "cefi": "gtp-cefi",
    "cross_chain": "gtp-crosschain",
  };

  // Contracts data for the currently selected timespan (1d / 7d / 180d / max).
  // Falls back to undefined if that timespan has no table, in which case the list is empty.
  const activeContractsTable = data.contracts_table?.[selectedTableTimespan];

  // Subtitle phrase that matches the selected timespan (e.g. "in the last 30 days").
  const activeTimespanSubtitle =
    CONTRACT_TIMESPANS.find((t) => t.key === selectedTableTimespan)?.subtitle ?? "in the last 7 days";

  const sortedContracts = useMemo(() => {
    if (!activeContractsTable) return [];
    const types = activeContractsTable.types;

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

    return [...Object.values(activeContractsTable.data)].sort((a, b) => {
      const aVal = a[colIdx];
      const bVal = b[colIdx];
      if (stringMetrics.has(sort.metric)) {
        return dir * ((bVal as string ?? "").localeCompare(aVal as string ?? ""));
      }
      return dir * ((aVal as number ?? 0) - (bVal as number ?? 0));
    });
  }, [activeContractsTable, sort, showUsd]);

  const handleCopy = (address: string, chainKey: string) => {
    const key = `${address}:${chainKey}`;
    navigator.clipboard.writeText(address);
    setCopiedAddress(key);
    setJustCopied(key);
    setTimeout(() => {
      setCopiedAddress(null);
      setTimeout(() => setJustCopied(null), 400);
    }, 1000);
  };

  const TRACKING_LOCATION = "application page - most active contracts";

  const handleTimespanChange = (key: string) => {
    track("changed Contracts Timespan", {
      location: TRACKING_LOCATION,
      page: window.location.pathname,
      owner_project,
      timespan: key,
    });
    setSelectedTableTimespan(key);
  };

  const handleContractMissingClick = () => {
    track("clicked Contract Missing Label", {
      location: TRACKING_LOCATION,
      page: window.location.pathname,
      owner_project,
    });
    window.location.href = `https://www.growthepie.com/applications/edit?source=application-page&project=${owner_project}&focus=contracts&start=contracts`;
  };

  const handleDownloadContracts = () => {
    if (!activeContractsTable) return;
    track("clicked Download Contracts", {
      location: TRACKING_LOCATION,
      page: window.location.pathname,
      owner_project,
      timespan: selectedTableTimespan,
    });
    const types = activeContractsTable.types;
    const headers = ["Address", "Name", "Chain", "Category", "Subcategory", "Transaction Count", "Active Addresses", "Fees Paid"];
    const rows = sortedContracts.map((contract) => {
      const contractMap = {
        address: contract[types.indexOf("address")],
        name: contract[types.indexOf("name")],
        chain_key: contract[types.indexOf("origin_key")],
        main_category_key: contract[types.indexOf("main_category_key")],
        sub_category_key: contract[types.indexOf("sub_category_key")],
        txcount: contract[types.indexOf("txcount")],
        daa: contract[types.indexOf("daa")],
        fees_paid: showUsd ? contract[types.indexOf("fees_paid_usd")] : contract[types.indexOf("fees_paid_eth")],
      };
      const chainName = AllChainsByKeys[contractMap.chain_key as string]?.label ?? contractMap.chain_key;
      const mainCategoryName = master?.blockspace_categories.main_categories?.[contractMap.main_category_key as string] ?? "Unlabeled";
      const subCategoryName = master?.blockspace_categories.sub_categories?.[contractMap.sub_category_key as string] ?? "Unlabeled";

      return [
        contractMap.address,
        contractMap.name,
        chainName,
        mainCategoryName,
        subCategoryName,
        contractMap.txcount,
        contractMap.daa,
        contractMap.fees_paid,
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contracts-${owner_project}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Inline (beside the heading) the selector hugs its content. When stacked below the
  // heading it spans the full width of the card and the buttons stretch to fill it equally.
  const timespanSelector = (
    <GTPButtonContainer className={stackSelector ? "w-full flex" : "!w-fit"}>
      <GTPButtonRow wrap={false} className="flex-nowrap" style={{ width: stackSelector ? "100%" : "auto" }}>
        {CONTRACT_TIMESPANS.map((timespan) => (
          <GTPButton
            key={timespan.key}
            className={stackSelector ? "w-full justify-center" : "justify-center"}
            innerStyle={stackSelector ? { width: "100%" } : undefined}
            label={compactSelector ? timespan.shortLabel : timespan.label}
            size="xs"
            variant="primary"
            isSelected={selectedTableTimespan === timespan.key}
            clickHandler={() => handleTimespanChange(timespan.key)}
          />
        ))}
      </GTPButtonRow>
    </GTPButtonContainer>
  );

  return (
    <div
      className="flex flex-col w-full rounded-[15px] bg-color-bg-default px-[30px] py-[15px] gap-y-[10px]"
      style={containerHeight && containerHeight > 0 ? { height: `${containerHeight}px` } : undefined}
    >
      {/* Header + Description (measured together as fixed top block) */}
      <div ref={topPartsRef} className="flex flex-col gap-y-[10px]">
        {SHOW_DEV_CONTRACTS_UI ? (
          <>
            <div ref={headingRowRef} className="relative flex items-center gap-x-[10px]">
                <div ref={titleRef} className="flex items-center gap-x-[5px]">
                <GTPIcon
                  icon="gtp-labeled"
                  className="!size-[16px]"
                  containerClassName="!size-[16px] flex items-center justify-center"
                />
                <div className="heading-large-md text-nowrap text-color-text-primary">
                  Most Active Contracts
                </div>
              </div>
              {/* Timespan selector — sits inline (absolute, right of the heading) while there's
                  room beside the title. When too narrow (stackSelector) it drops to its own row
                  below the heading and the subheading is hidden. */}
              {!stackSelector && (
                <div className="absolute right-0 top-[calc(50%-3px)] -translate-y-1/2">
                  {timespanSelector}
                </div>
              )}
            </div>
            {stackSelector && <div className="flex">{timespanSelector}</div>}
            {!stackSelector && (
              <div className="text-xs text-color-text-primary">
                See the most active contracts for this application {activeTimespanSubtitle}.
              </div>
            )}
          </>
        ) : (
          <>
            {/* PROD: original layout (before the timespan-selector work) */}
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
              <div className="relative w-full flex items-center justify-end">
                {!oliHide && (
                  <>
                    <GTPButton
                      label="Contract missing? Label here."
                      leftIcon={"oli-open-labels-initiative" as GTPIconName}
                      size="xs"
                      rightIcon={"in-button-right-monochrome" as GTPIconName}
                      className="z-30"
                      clickHandler={handleContractMissingClick}
                    />
                    <div
                      className="absolute -top-[0.5px] h-[22px] rounded-full w-[184px]"
                      style={{
                        background: "linear-gradient(33deg, #5C44C2 -14.22%, #69ADDA 42.82%, #FF1684 93.72%)",
                      }}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-x-[10px]">
              <div className="text-xs text-color-text-primary">
                See the most active contracts for this application in the last 7 days.
              </div>
              <div className="hidden md:block">
                <GTPButton
                  leftIcon={"gtp-download" as GTPIconName}
                  label="Download Contracts"
                  size="xs"
                  clickHandler={handleDownloadContracts}
                />
              </div>
            </div>
          </>
        )}
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
                const types = activeContractsTable?.types ?? [];

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
                const chainKey = contractMap.chain_key as string;
                const chainMeta = AllChainsByKeys[chainKey];
                const blockExplorer = master?.chains[chainKey]?.block_explorer;
                const address = contractMap.address as string;
                const chainColor = chainMeta.colors[theme ?? "dark"][0];

                return (
                  <GridTableRow
                    key={address + index.toString() + "CONTRACT_ROW"}
                    gridDefinitionColumns={CONTRACT_GRID_COLS}
                    className="h-[34px] text-[12px] !py-0 !gap-x-[10px]"
                    style={{ paddingLeft: "0px" }}
                  >
                    {/* Contract name + copy + explorer */}
                    <div className="group flex items-center gap-x-[6px] min-w-0">
                      <GTPIcon
                        icon={`gtp:${chainMeta.urlKey}-logo-monochrome` as GTPIconName}
                        className="!size-[16px]"
                        containerClassName="!size-[30px] flex items-center justify-center bg-color-ui-active rounded-full"
                        style={{ color: chainColor }}
                      />
                      <span className="truncate text-xs max-w-[165px]">{contractMap.name as string}</span>
                      <div className="flex items-center gap-x-[4px] shrink-0">
                        {contractMap.verified ? (
                          <GTPTooltipNew
                            placement="right"
                            size="fit"
                            allowInteract={true}
                            trigger={
                              <div className="w-[12px] h-[34px] flex items-center justify-center cursor-pointer">
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
                              <div className="w-[12px] h-[34px] flex items-center justify-center cursor-pointer">
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
                        {blockExplorer && (
                          <Link
                            href={getExplorerAddressUrl(blockExplorer, address)}
                            rel="noopener noreferrer"
                            target="_blank"
                            aria-label="Open contract in block explorer"
                            title="Open contract in block explorer"
                            className="flex h-[34px] w-[14px] items-center justify-center opacity-70 transition-opacity hover:opacity-100"
                          >
                            <Icon
                              icon="gtp:gtp-block-explorer"
                              className="size-[14px]"
                            />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopy(address, chainKey)}
                          aria-label="Copy contract address"
                          title="Copy contract address"
                          className="flex h-[34px] w-[14px] items-center justify-center"
                        >
                          <Icon
                            icon={copiedAddress === `${address}:${chainKey}` || justCopied === `${address}:${chainKey}` ? "gtp:gtp-checkmark-checked" : "gtp:gtp-copy"}
                            className={`size-[12px] transition-all ${
                              copiedAddress === `${address}:${chainKey}`
                                ? "opacity-100 text-color-text-primary"
                                : justCopied === `${address}:${chainKey}`
                                  ? "opacity-0 text-color-text-secondary"
                                  : "opacity-0 group-hover:opacity-70 text-color-text-secondary"
                            }`}
                          />
                        </button>
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
        {SHOW_DEV_CONTRACTS_UI ? (
          // Dev: both buttons sit together under the table — side by side, or stacked
          // (Download below Contract missing) when there isn't room for one row.
          <div
            ref={devBottomRef}
            className={`flex justify-start ${stackBottomButtons ? "flex-col items-start gap-y-[5px]" : "flex-row items-center gap-x-[10px]"}`}
          >
            <div className="relative flex items-center">
              <GTPButton
                label={compactBottomContractButton ? "Contract missing?" : "Contract missing? Label here."}
                leftIcon={"oli-open-labels-initiative" as GTPIconName}
                size="xs"
                rightIcon={"in-button-right-monochrome" as GTPIconName}
                className="z-30"
                clickHandler={handleContractMissingClick}
              />
              <div
                className="absolute -inset-[0.5px] rounded-full"
                style={{
                  background: "linear-gradient(33deg, #5C44C2 -14.22%, #69ADDA 42.82%, #FF1684 93.72%)",
                }}
              />
            </div>
            <GTPButton
              leftIcon={"gtp-download" as GTPIconName}
              label="Download Contracts"
              size="xs"
              clickHandler={handleDownloadContracts}
            />
          </div>
        ) : (
          <>
            <div ref={mobileDownloadRef} className="flex md:hidden items-center justify-start">
              <GTPButton
                leftIcon={"gtp-download" as GTPIconName}
                label="Download Contracts"
                size="xs"
                clickHandler={handleDownloadContracts}
              />
            </div>
            {ctaCompact && (
              <div ref={bottomCtaRef} className="relative flex items-center justify-start mt-[5px]">
                    <GTPButton
                      label="Contract missing? Label here."
                      leftIcon={"oli-open-labels-initiative" as GTPIconName}
                      size="xs"
                      rightIcon={"in-button-right-monochrome" as GTPIconName}
                      className="z-30"
                      clickHandler={handleContractMissingClick}
                    />
                    <div
                      className="absolute -top-[0.5px] h-[22px] rounded-full w-[183px]"
                      style={{
                        background: "linear-gradient(33deg, #5C44C2 -14.22%, #69ADDA 42.82%, #FF1684 93.72%)",
                      }}
                    />
              </div>
            )}
          </>
        )}

      {/* Footer CTA */}

    </div>
  );
};

export default MostActiveContracts;
