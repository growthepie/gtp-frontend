import { memo, useEffect } from "react";
import { useState } from "react";
import { useMemo } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { useMaster } from "@/contexts/MasterContext";
import { useTheme } from "next-themes";
import { ProjectMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { formatNumber } from "@/app/(layout)/applications/_components/Components";
import { openExternalLinkWithDisclaimer } from "@/components/ExternalLink/ExternalLink";


type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];
const BAR_NOTIONAL = 10_000;
const BAR_OVERLAP = 8;
const BAR_MIN_SEG = 500;

const AboutApp = memo(({ data, owner_project, projectMetadata, defaultOpen = true }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, defaultOpen?: boolean }) => {

    const activeSinceDateFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        year: "numeric",
    });

    function getActiveSinceLabel(firstSeen?: ApplicationDetailsData["first_seen"]) {
        if (!firstSeen) {
            return null;
        }
        
        const earliestChainDate = Object.entries(firstSeen)
            .filter(([chain, date]) => chain !== "all" && typeof date === "string")
            .map(([, date]) => ({
            timestamp: Date.parse(date),
            }))
            .filter(({ timestamp }) => !Number.isNaN(timestamp))
            .sort((a, b) => a.timestamp - b.timestamp)[0];
        
        if (earliestChainDate) {
            return activeSinceDateFormatter.format(new Date(earliestChainDate.timestamp));
        }
        
        if (typeof firstSeen.all !== "string") {
            return null;
        }
        
        const allTimestamp = Date.parse(firstSeen.all);
        if (Number.isNaN(allTimestamp)) {
            return null;
        }
        
        return activeSinceDateFormatter.format(new Date(allTimestamp));
    }

      
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        setOpen(defaultOpen);
    }, [defaultOpen]);

    const activeSinceLabel = getActiveSinceLabel(data.first_seen);

    console.log(projectMetadata);

    return (
      <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none">
        {/* Header row: toggle + title + links (when closed) */}
        <div className="flex items-center justify-between gap-x-[10px]">
          <div
            className="flex items-center gap-x-[10px] cursor-pointer"
            onClick={() => setOpen((v) => !v)}
          >
            <GTPIcon
              icon="in-button-right-monochrome"
              size="sm"
              className="!size-[14px]"
              containerClassName={`!size-[26px] flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-all duration-300 ${
                open ? "rotate-90" : "rotate-0"
                }`}
            />
            <div className="heading-large-md text-color-text-secondary">App Overview</div>
          </div>
  
          {/* Links inline with header — shown only when closed */}
          {!open && (
            <div className="flex flex-wrap items-center gap-[5px]">
              {projectMetadata.website && (
                <GTPButton
                  size="sm"
                  leftIcon={"feather:globe" as GTPIconName}
                  label="Website"
                  clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.website ?? "")}
                />
              )}
              {projectMetadata.twitter && (
                <GTPButton
                  size="sm"
                  leftIcon={"gtp:x" as GTPIconName}
                  label="Twitter"
                  clickHandler={() => openExternalLinkWithDisclaimer(`https://x.com/${projectMetadata.twitter}`)}
                />
              )}
              {projectMetadata.main_github && (
                <GTPButton
                  size="sm"
                  leftIcon={"github" as GTPIconName}
                  label="Github"
                  clickHandler={() => openExternalLinkWithDisclaimer(`https://github.com/${projectMetadata.main_github}`)}
                />
              )}
              {projectMetadata.website && (
                <GTPButton
                  size="sm"
                  leftIcon="gtp-read"
                  label="Docs"
                  clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.website ?? "")}
                />
              )}
              {projectMetadata.governance && (
                <GTPButton
                  size="sm"
                  leftIcon={"gtp-file-text" as GTPIconName}
                  label="Governance"
                  clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.governance ?? "")}
                />
              )}
            </div>
          )}
        </div>
  
        {/* Collapsible body */}
        <div
          style={{
            maxHeight: open ? 400 : 0,
            paddingTop: open ? "12px" : 0,
            overflow: "visible",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding-top 0.3s ease-in-out",
          }}
        >
          {/* Description */}
          <p className="text-sm pb-[15px]">{projectMetadata.description}</p>
  
          {/* Metadata row */}
          <div className="flex flex-wrap items-start gap-x-[30px] gap-y-[12px]">
  
            {/* First Contract Seen */}
            <AppOverviewMetaCol label="Active Since">
              <div>{activeSinceLabel ?? "—"}</div>
            </AppOverviewMetaCol>
  
            {/* Ecosystem Rank */}
            <AppOverviewMetaCol label="Ethereum Ecosystem Rank">
              #{projectMetadata.ecosystem_rank}
            </AppOverviewMetaCol>
  
            {/* Active on: icons + stacked bar */}
            {projectMetadata.active_on && projectMetadata.txcount && (
              <ActiveOnSection
                active_on={projectMetadata.active_on}
                txcount={projectMetadata.txcount}
              />
            )}
  
            {/* Token */}
            <AppOverviewMetaCol label="Token">
              {projectMetadata.token_symbol ?? "—"}
            </AppOverviewMetaCol>
  
            {/* Links */}
            <div className="flex flex-col gap-y-[4px]">
              <div className="heading-xxs text-color-text-secondary whitespace-nowrap">Links</div>
              <div className="flex flex-wrap items-center gap-[5px]">
                {projectMetadata.website && (
                  <GTPButton
                    size="sm"
                    leftIcon={"feather:globe" as GTPIconName}
                    label="Website"
                    clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.website ?? "")}
                  />
                )}
                {projectMetadata.twitter && (
                  <GTPButton
                    size="sm"
                    leftIcon={"gtp:x" as GTPIconName}
                    label="Twitter"
                    clickHandler={() => openExternalLinkWithDisclaimer(`https://x.com/${projectMetadata.twitter}`)}
                  />
                )}
                {projectMetadata.main_github && (
                  <GTPButton
                    size="sm"
                    leftIcon={"github" as GTPIconName}
                    label="Github"
                    clickHandler={() => openExternalLinkWithDisclaimer(`https://github.com/${projectMetadata.main_github}`)}
                    />
                )}
                {projectMetadata.website && (
                  <GTPButton
                    size="sm"
                    leftIcon="gtp-read"
                    label="Docs"
                    clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.website ?? "")}
                  />
                )}
                {projectMetadata.governance && (
                  <GTPButton
                    size="sm"
                    leftIcon={"gtp-file-text" as GTPIconName}
                    label="Governance"
                    clickHandler={() => openExternalLinkWithDisclaimer(projectMetadata.governance ?? "")}
                  />
                )}
              </div>
            </div>
  
          </div>
        </div>
      </div>
    );
  });
  AboutApp.displayName = "AboutApp";
  export default AboutApp;


  const ActiveOnSection = ({ active_on, txcount }: { active_on: { [chainKey: string]: number }; txcount: number }) => {
    const { AllChainsByKeys } = useMaster();
    const { resolvedTheme } = useTheme();
    const chainColorTheme = resolvedTheme === "light" ? "light" : "dark";
    const [hoveredChain, setHoveredChain] = useState<string | null>(null);

    function clampSegmentWidths(naturalPx: number[], minPx: number, totalPx: number): number[] {
        const clamped = naturalPx.map((px) => Math.max(px, minPx));
        const excess = clamped.reduce((a, b) => a + b, 0) - totalPx;
        if (excess <= 0) return clamped;
        const shrinkableTotal = clamped.reduce(
          (a, px, i) => a + (naturalPx[i] >= minPx ? px : 0),
          0,
        );
        return clamped.map((px, i) => {
          if (naturalPx[i] < minPx) return px;
          return px - (px / shrinkableTotal) * excess;
        });
      }
      
  
    const sorted = useMemo(
      () => Object.entries(active_on).sort((a, b) => b[1] - a[1]),
      [active_on],
    );
  
    const totalCount = useMemo(
      () => sorted.reduce((acc, [, c]) => acc + c, 0),
      [sorted],
    );
  
    const filtered = useMemo(
      () => sorted.filter(([, count]) => totalCount > 0 && count / totalCount >= 0.005),
      [sorted, totalCount],
    );
  
    const renderPx = useMemo(() => {
      const naturalPx = filtered.map(([, count]) =>
        totalCount > 0 ? (count / totalCount) * BAR_NOTIONAL : 0,
      );
      return clampSegmentWidths(naturalPx, BAR_MIN_SEG, BAR_NOTIONAL);
    }, [filtered, totalCount]);
  
    const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      let cumulative = 0;
      for (let i = 0; i < filtered.length; i++) {
        cumulative += (renderPx[i] / BAR_NOTIONAL) * rect.width;
        if (mouseX <= cumulative) {
          setHoveredChain(filtered[i][0]);
          return;
        }
      }
    };
  
    const hoveredEntry = hoveredChain ? filtered.find(([c]) => c === hoveredChain) : null;
    const hoveredCount = hoveredEntry?.[1] ?? 0;
    const hoveredPct = txcount > 0 ? ((hoveredCount / txcount) * 100).toFixed(1) : "0";
    const hoveredColor = AllChainsByKeys[hoveredChain ?? ""]?.colors[chainColorTheme][0];
    const hoveredLabel = AllChainsByKeys[hoveredChain ?? ""]?.name_short ?? hoveredChain;
    const hoveredUrlKey = AllChainsByKeys[hoveredChain ?? ""]?.urlKey;
  

    return (
      <div className="flex flex-col gap-y-[6px] flex-1 min-w-[160px] max-w-[360px]">
        <div className="heading-xxs text-color-text-secondary">Active on</div>
  
        {/* Icon row */}
        <div
          className="flex flex-wrap items-center gap-[3px]"
          onMouseLeave={() => setHoveredChain(null)}
        >
          {filtered.map(([chain]) => {
            const chainData = AllChainsByKeys[chain];
            const chainColor = AllChainsByKeys[chain]?.colors[chainColorTheme][0];
            const isHovered = hoveredChain === chain;
            return (
              <div
                key={chain}
                className="flex items-center justify-center size-[22px] rounded-full transition-colors duration-150 cursor-default"
                style={{ backgroundColor: isHovered ? "rgba(var(--ui-active), 1)" : "transparent" }}
                onMouseEnter={() => setHoveredChain(chain)}
              >
                <GTPIcon
                  icon={`gtp:${chainData?.urlKey}-logo-monochrome` as GTPIconName}
                  className="!size-[24px]"
                  containerClassName="!size-[24px] flex items-center justify-center"
                  style={{ color: chainColor }}
                />
              </div>
            );
          })}
        </div>
  
        {/* Bar — outer ring matches MetricChainBreakdownBar sizing */}
        <div className="flex items-center h-[12px] w-full rounded-full p-[2px]">
          <div
            className="flex h-[10px] w-full rounded-full overflow-hidden cursor-default bg-black/60"
            onMouseMove={handleBarMouseMove}
            onMouseLeave={() => setHoveredChain(null)}
          >
            {filtered.map(([chain], index) => {
              const isFirst = index === 0;
              const isLast = index === filtered.length - 1;
              const leftExtra = isFirst ? 0 : BAR_OVERLAP;
              const rightExtra = isLast ? 0 : BAR_OVERLAP;
              const widthPct = (renderPx[index] / BAR_NOTIONAL) * 100;
              const baseColor = AllChainsByKeys[chain]?.colors[chainColorTheme][0];
              const isHovered = hoveredChain === chain;
              const isDimmed = hoveredChain !== null && !isHovered;
              const bgColor = isDimmed
                ? `color-mix(in srgb, ${baseColor} 15%, rgb(var(--bg-default)) 85%)`
                : baseColor;

              return (
                <div
                  key={chain + "-bar"}
                  className="h-full rounded-r-full shrink-0 pointer-events-none"
                  style={{
                    position: "relative",
                    width: `calc(${widthPct}% + ${leftExtra + rightExtra}px)`,
                    marginLeft: isFirst ? 0 : `-${leftExtra}px`,
                    marginRight: isLast ? 0 : `-${rightExtra}px`,
                    zIndex: sorted.length - index,
                    backgroundColor: bgColor,
                    boxShadow: isHovered ? `0 0 10px ${baseColor}66` : "none",
                    transition: "box-shadow 150ms, background-color 150ms",
                  }}
                />
              );
            })}
          </div>
        </div>
  
        {/* Hover info — fixed height prevents layout shift */}
        <div className="flex items-center gap-x-[6px] h-[16px]">
          {hoveredChain && hoveredEntry && (
            <>
              <GTPIcon
                icon={`gtp:${hoveredUrlKey}-logo-monochrome` as GTPIconName}
                className="!size-[12px]"
                containerClassName="!size-[12px] flex items-center justify-center"
                style={{ color: hoveredColor }}
              />
              <span className="text-xs " style={{ color: hoveredColor }}>
                {hoveredLabel}
              </span>
              <span className="text-xs text-color-text-primary">{hoveredPct}%</span>
              <span className="text-xs text-color-text-primary">
                ({formatNumber(hoveredCount)} transactions)
              </span>
            </>
          )}
        </div>
      </div>
    );
  };


  const AppOverviewMetaCol = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-y-[4px] shrink-0">
      <div className="heading-xxs text-color-text-secondary whitespace-nowrap">{label}</div>
      <div className="text-md">{children}</div>
    </div>
  );
