"use client";

import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipGeneral } from "@/components/GTPComponents/GTPTooltip";
import { animated, useTransition } from "@react-spring/web";
import ChainAnimations from "@/components/layout/ChainAnimations";
import { ChainSelectionDivider, ChainSelectionToggle } from "@/components/layout/ChainSelectionControls";
import { useApplicationsData } from "../_contexts/ApplicationsDataContext";
import { useTimespan } from "../_contexts/TimespanContext";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";

const AnimatedDiv = animated.div as any;

const formatAppCount = (value: number) => value.toLocaleString("en-GB");
const BAR_ROW_HEIGHT = 39;
const DIVIDER_ROW_HEIGHT = 20;

type ChainRow = { item: string; value: number; index: number; y: number; height: number };

export default function AppCountByChain({
  height,
  showTable = true,
  isInactive = false,
  onInactiveClick,
}: {
  height: number;
  showTable?: boolean;
  isInactive?: boolean;
  onInactiveClick?: () => void;
}) {
  const [scrollAreaRef, { height: scrollHeight }] = useElementSizeObserver<HTMLDivElement>();
  const {
    applicationCountsByChain,
    isLoading,
    selectedChains,
    setSelectedChains,
    allChainsDeselected,
    selectedMainCategories,
  } = useApplicationsData();
  const { selectedTimespan, timespans } = useTimespan();
  const { availableMainCategories } = useProjectsMetadata();
  const timespanLabel = selectedTimespan === "1d" ? "24h" : timespans[selectedTimespan].label;
  const categoryNames = selectedMainCategories.map((categoryKey) =>
    availableMainCategories.find((category) => category.toLowerCase() === categoryKey.toLowerCase()) ?? categoryKey,
  );
  const categoryText = categoryNames.length > 0
    ? ` with the ${categoryNames.length === 1 ? "category" : "categories"} ${categoryNames.slice(0, -1).join(", ")}${categoryNames.length > 1 ? " or " : ""}${categoryNames[categoryNames.length - 1]}`
    : "";
  const availableChains = applicationCountsByChain.map(({ chain }) => chain);
  const activeChains = allChainsDeselected ? [] : selectedChains.length > 0 ? selectedChains : availableChains;
  const allChainsSelected = availableChains.length > 0 && availableChains.every((chain) => activeChains.includes(chain));
  const selectedVisibleCount = availableChains.filter((chain) => activeChains.includes(chain)).length;

  const chainSelection = Object.fromEntries(
    [...new Set([...availableChains, ...activeChains])].map((chain) => [chain, activeChains.includes(chain)]),
  );
  const sortedCounts = [...applicationCountsByChain].sort((a, b) =>
    Number(chainSelection[b.chain]) - Number(chainSelection[a.chain]) || b.count - a.count,
  );
  const sortedValues = sortedCounts.map(({ chain, count }) => [chain, count]);
  const firstUnselectedIndex = sortedCounts.findIndex(({ chain }) => !chainSelection[chain]);
  const updateSelection = (updater: (previous: Record<string, boolean>) => Record<string, boolean>) => {
    const updated = updater(chainSelection);
    setSelectedChains(Object.keys(updated).filter((chain) => updated[chain]));
  };
  let listHeight = 0;
  const rows: ChainRow[] = [];
  sortedCounts.forEach(({ chain, count }, index) => {
    if (index === firstUnselectedIndex) {
      rows.push({ item: "divider", value: 0, index: -1, y: listHeight, height: DIVIDER_ROW_HEIGHT });
      listHeight += DIVIDER_ROW_HEIGHT;
    }
    rows.push({ item: chain, value: count, index, y: listHeight, height: BAR_ROW_HEIGHT });
    listHeight += BAR_ROW_HEIGHT;
  });
  const transitions = useTransition(rows, {
    key: (row: ChainRow) => row.item,
    from: { opacity: 0, height: 0 },
    leave: null,
    enter: ({ y, height }: ChainRow) => ({ y, height, opacity: 1 }),
    update: ({ y, height }: ChainRow) => ({ y, height, opacity: 1 }),
    config: { mass: 5, tension: 500, friction: 100 },
  });
  return (
    <section
      data-application-overview-card
      className="relative z-0 flex min-w-0 flex-col gap-[10px] rounded-[15px] bg-color-bg-default px-[30px] pt-[15px] pb-[44px]"
      style={{ height }}
      aria-labelledby="app-count-heading"
      onClickCapture={(event) => {
        if (isInactive) {
          event.preventDefault();
          event.stopPropagation();
          onInactiveClick?.();
        }
      }}
    >
      <div inert={isInactive} className="flex shrink-0 items-center justify-between gap-[10px]">
        <h2 id="app-count-heading" className="heading-large-md">Apps by Chain (Filter)</h2>
        {!allChainsSelected && (
          <ChainSelectionToggle
            state={selectedVisibleCount === 0 ? "none" : "normal"}
            onClick={() => setSelectedChains([])}
            ariaLabel="Select all chains"
            label="Select all"
            disabled={isLoading || availableChains.length === 0}
          />
        )}
      </div>
      <p inert={isInactive} className="text-xs shrink-0">
        Number of apps that have been active {selectedTimespan === "max" ? "across all time" : `within the last ${timespanLabel}`}{categoryText}. Select the bars to filter by chain
      </p>
      {/* Extend into the right padding to align the scroll track with the info icon. */}
      <div
        ref={scrollAreaRef}
        inert={isInactive}
        className="relative -mr-[23.5px] min-h-0 flex-1"
        role="region"
        aria-label="Application counts for all chains"
        aria-busy={isLoading}
      >
        <VerticalScrollContainer height={scrollHeight} enableTopShadow reserveScrollbarSpace>
          {isLoading ? (
            <div className="flex flex-col gap-[5px]" role="status" aria-label="Loading application counts">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="h-[34px] animate-pulse rounded-full bg-color-bg-medium" />
              ))}
            </div>
          ) : applicationCountsByChain.length === 0 ? (
            <p className="text-xs text-color-text-secondary">No application data available.</p>
          ) : (
            <div className="relative" style={{ height: listHeight }}>
              {transitions((style, row) => (
                <AnimatedDiv key={row.item} className="absolute w-full" style={style}>
                  {row.item === "divider" ? (
                    <ChainSelectionDivider label={`Not showing in ${showTable ? "table" : "map"}`} />
                  ) : (
                    <ChainAnimations
                      chain={row.item}
                      value={row.value}
                      index={row.index}
                      sortedValues={sortedValues}
                      selectedValue="absolute"
                      selectedMode="app_count"
                      selectedChains={chainSelection}
                      setSelectedChains={(updater) => {
                        if (allChainsSelected) {
                          setSelectedChains([row.item]);
                          return;
                        }
                        updateSelection(updater);
                      }}
                      disableAutoSelection
                      fitContainer
                      linkToChain={false}
                      formatValue={formatAppCount}
                    />
                  )}
                </AnimatedDiv>
              ))}
            </div>
          )}
        </VerticalScrollContainer>
      </div>
      <div inert={isInactive} className="absolute bottom-0 right-[15px] flex h-[44px] w-[15px] items-center justify-center">
        <GTPTooltipNew
          placement="top-start"
          unstyled
          trigger={
            <button type="button" aria-label="About application counts" className="flex size-[15px] shrink-0 items-center justify-center">
              <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
            </button>
          }
        >
          <GTPTooltipGeneral width={350}>
            Each app is counted once per chain if it has at least 3 transactions on that chain during the selected time span. Counts follow the selected time span, category, and metric filters.
          </GTPTooltipGeneral>
        </GTPTooltipNew>
      </div>
    </section>
  );
}
