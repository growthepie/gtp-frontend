'use client';

import React from 'react';
import { ChartBlock as ChartBlockType, ChartToggleBlock as ChartToggleBlockType } from '@/lib/types/blockTypes';
import { ChartBlock } from './ChartBlock';
import GTPButtonRow from '@/components/GTPComponents/ButtonComponents/GTPButtonRow';
import GTPButtonContainer from '@/components/GTPComponents/ButtonComponents/GTPButtonContainer';
import { GTPButton } from '@/components/GTPComponents/ButtonComponents/GTPButton';

interface ChartToggleBlockProps {
  block: ChartToggleBlockType;
  chainQuickBitesTitleSuffix?: string;
}

const CHAIN_QUICK_BITES_TAB_BLOCK_CLASS = "chain-quick-bites-tab-block";
const CHAIN_QUICK_BITES_TAB_RIGHT_FLUSH_CLASS = "chain-quick-bites-tab-right-flush";
const CHAIN_QUICK_BITES_TAB_LEFT_FLUSH_CLASS = "chain-quick-bites-tab-left-flush";

const clampIndex = (index: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(Math.max(index, 0), max - 1);
};

export const ChartToggleBlock: React.FC<ChartToggleBlockProps> = ({ block, chainQuickBitesTitleSuffix }) => {
  const charts = block.charts ?? [];
  const isChainQuickBitesTabBlock = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_BLOCK_CLASS);
  const isChainQuickBitesTabRightFlush = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_RIGHT_FLUSH_CLASS);
  const isChainQuickBitesTabLeftFlush = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_LEFT_FLUSH_CLASS);

  const initialIndex = React.useMemo(() => {
    const defaultIndex = typeof block.defaultIndex === 'number' ? block.defaultIndex : 0;
    return clampIndex(defaultIndex, charts.length);
  }, [block.defaultIndex, charts.length]);

  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    setActiveIndex((prev) => clampIndex(prev, charts.length));
  }, [charts.length]);

  React.useEffect(() => {
    setActiveIndex(clampIndex(typeof block.defaultIndex === 'number' ? block.defaultIndex : 0, charts.length));
  }, [block.defaultIndex, charts.length]);


  if (!charts.length) {
    return null;
  }

  const selectedChart = charts[clampIndex(activeIndex, charts.length)];
  const selectedChartWidth = selectedChart?.width ?? "100%";
  const selectedChartMargins = selectedChart?.margins ?? "normal";
  const controlsWrapperClass = selectedChartMargins === "none" ? "px-0" : "md:px-[35px]";
  const isChainQuickBitesTabSideBySide = isChainQuickBitesTabBlock && (isChainQuickBitesTabRightFlush || isChainQuickBitesTabLeftFlush);
  const showControls = !isChainQuickBitesTabBlock || charts.length > 1 || isChainQuickBitesTabSideBySide;
  const showExternalControls = showControls && !isChainQuickBitesTabBlock;

  const { sideChart: rawSideChart, ...mainChartProps } = (selectedChart ?? {}) as ChartBlockType & { sideChart?: ChartBlockType };

  const chartForRender: ChartBlockType | undefined = selectedChart
    ? {
        ...mainChartProps,
        suppressWrapperSpacing: true,
        className: [
          mainChartProps.className,
          isChainQuickBitesTabRightFlush ? CHAIN_QUICK_BITES_TAB_RIGHT_FLUSH_CLASS : null,
          isChainQuickBitesTabLeftFlush ? CHAIN_QUICK_BITES_TAB_LEFT_FLUSH_CLASS : null,
        ]
          .filter((className): className is string => Boolean(className))
          .join(" "),
      }
    : undefined;

  const sideChartForRender: ChartBlockType | undefined = rawSideChart
    ? { ...rawSideChart, suppressWrapperSpacing: true }
    : undefined;

  const chainQuickBitesTopBar = showControls && isChainQuickBitesTabBlock ? (
    <div>
      <GTPButtonRow wrap className="!w-auto">
        {charts.map((chart, index) => {
          const isActive = index === activeIndex;
          const label = chart.toggleLabel || chart.title || `Chart ${index + 1}`;
          return (
            <GTPButton
              key={chart.id || `${label}-${index}`}
              label={label}
              size="sm"
              variant={isActive ? "primary" : "no-background"}
              visualState={isActive ? "active" : "default"}
              clickHandler={() => setActiveIndex(index)}
              className="justify-center"
            />
          );
        })}
      </GTPButtonRow>
    </div>
  ) : undefined;

  const renderDescription = () => {
    if (!block.description) {
      return null;
    }

    return (
      <p
        className="heading-small-xxxs md:heading-small-xxs pt-[5px] pb-[15px]"
        dangerouslySetInnerHTML={{ __html: block.description }}
      />
    );
  };

  const wrapperClassName = `${isChainQuickBitesTabBlock ? '' : 'my-8'} ${block.className || ''}`.trim();

  const renderMainChart = (extraProps?: { topBar?: React.ReactNode; titleSuffix?: string }) => {
    if (!chartForRender) return null;
    const mainChart = (
      <ChartBlock
        key={chartForRender.id}
        block={chartForRender}
        chainQuickBitesTopBar={extraProps?.topBar}
        chainQuickBitesTitleSuffix={extraProps?.titleSuffix}
      />
    );

    if (sideChartForRender) {
      return (
        <div className="@container">
          <div className="grid grid-cols-1 @[750px]:grid-cols-2 @[1200px]:grid-cols-[1fr_2fr] @[750px]:items-start gap-[15px]">
            <ChartBlock key={sideChartForRender.id} block={sideChartForRender} />
            {mainChart}
          </div>
        </div>
      );
    }

    return mainChart;
  };

  return (
    <div className={wrapperClassName}>
      {!isChainQuickBitesTabBlock && block.title && (
        <h3 className="heading-small-xxs md:heading-small-xs xl:heading-small-sm text-color-text-primary mb-1">
          {block.title}
        </h3>
      )}
      {!isChainQuickBitesTabBlock ? renderDescription() : null}
      {showExternalControls && (
        <div className={controlsWrapperClass}>
          <div className="max-w-full" style={{ width: selectedChartWidth }}>
            {/* The platform's tab bar (as on the fundamentals charts): one look for every
                toggle, whatever its `layout`; it rounds itself to 15px if it wraps. */}
            <GTPButtonContainer>
              <GTPButtonRow wrap autoFill>
                {charts.map((chart, index) => {
                  const label = chart.toggleLabel || chart.title || `Chart ${index + 1}`;
                  return (
                    <GTPButton
                      key={chart.id || `${label}-${index}`}
                      label={label}
                      size="sm"
                      isSelected={index === activeIndex}
                      clickHandler={() => setActiveIndex(index)}
                    />
                  );
                })}
              </GTPButtonRow>
            </GTPButtonContainer>
          </div>
        </div>
      )}
      {chartForRender
        ? showExternalControls
          ? (
            <div className="mt-[15px]">
              {renderMainChart({ topBar: chainQuickBitesTopBar, titleSuffix: chainQuickBitesTitleSuffix })}
            </div>
          )
          : renderMainChart({ topBar: chainQuickBitesTopBar, titleSuffix: chainQuickBitesTitleSuffix })
        : null}
    </div>
  );
};

export default ChartToggleBlock;
