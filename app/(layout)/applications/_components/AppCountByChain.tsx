"use client";

import { ExpandableCardContainer } from "@/components/layout/ExpandableCardContainer";
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
  isExpanded,
  onToggleExpand,
  collapsedHeight,
  showTable = true,
}: {
  isExpanded: boolean;
  onToggleExpand: () => void;
  collapsedHeight: number;
  showTable?: boolean;
}) {
  const {
    applicationCountsByChain,
    isLoading,
    selectedChains,
    setSelectedChains,
    allChainsDeselected,
    deselectAllChains,
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
  const bottomFade = isExpanded
    ? "none"
    : "linear-gradient(to bottom, black calc(100% - 50px), transparent 100%)";

  return (
    <section
      data-application-overview-card
      className={`relative min-w-0 ${isExpanded ? "z-[1001]" : "z-0 has-[[data-card-animating]]:z-[1001]"}`}
      aria-labelledby="app-count-heading"
    >
      <ExpandableCardContainer
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        overlayOnExpand
        collapsedHeight={collapsedHeight}
        expandLabel="Apps by Chain"
        fullHeight={false}
        minHeightClass=""
        className="gap-[10px] !pb-[44px]"
        infoSlot="Each app is counted once per chain if it has at least 3 transactions on that chain during the selected time span. Counts follow the selected time span, category, and metric filters."
      >
        <div className="flex shrink-0 items-center justify-between gap-[10px]">
          <h2 id="app-count-heading" className="heading-large-md">Apps by Chain (Filter)</h2>
          <ChainSelectionToggle
            state={allChainsSelected ? "all" : selectedVisibleCount === 0 ? "none" : "normal"}
            onClick={() => allChainsSelected ? deselectAllChains() : setSelectedChains([])}
            ariaLabel={allChainsSelected ? "Deselect all chains" : "Select all chains"}
            label="Select all"
            disabled={isLoading || availableChains.length === 0}
          />
        </div>
        <p className="text-xs shrink-0">
          Number of apps that have been active {selectedTimespan === "max" ? "across all time" : `within the last ${timespanLabel}`}{categoryText}. Select the bars to filter by chain
        </p>
        <div
          className={`relative ${isExpanded ? "h-auto" : "min-h-0 flex-1 overflow-hidden"}`}
          style={{ maskImage: bottomFade, WebkitMaskImage: bottomFade }}
          role="region"
          aria-label="Application counts for all chains"
          aria-busy={isLoading}
        >
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
                      setSelectedChains={updateSelection}
                      onClick={() => {
                        if (!isExpanded) onToggleExpand();
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
        </div>
      </ExpandableCardContainer>
    </section>
  );
}
