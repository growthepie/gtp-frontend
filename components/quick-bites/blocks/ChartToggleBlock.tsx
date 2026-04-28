'use client';

import React from 'react';
import { ChartBlock as ChartBlockType, ChartToggleBlock as ChartToggleBlockType } from '@/lib/types/blockTypes';
import { ChartBlock } from './ChartBlock';
import GTPButtonRow from '@/components/GTPComponents/ButtonComponents/GTPButtonRow';
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
  const optionsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [hasMultipleOptionRows, setHasMultipleOptionRows] = React.useState(false);

  React.useEffect(() => {
    setActiveIndex((prev) => clampIndex(prev, charts.length));
  }, [charts.length]);

  React.useEffect(() => {
    setActiveIndex(clampIndex(typeof block.defaultIndex === 'number' ? block.defaultIndex : 0, charts.length));
  }, [block.defaultIndex, charts.length]);

  const detectMultipleRows = React.useCallback(() => {
    if (!isChainQuickBitesTabBlock) {
      setHasMultipleOptionRows(false);
      return;
    }

    const container = optionsContainerRef.current;
    if (!container) {
      setHasMultipleOptionRows(false);
      return;
    }

    const buttons = Array.from(container.querySelectorAll("button"));
    if (buttons.length <= 1) {
      setHasMultipleOptionRows(false);
      return;
    }

    const firstRowTop = buttons[0].offsetTop;
    const multiRow = buttons.some((button) => button.offsetTop > firstRowTop + 1);
    setHasMultipleOptionRows(multiRow);
  }, [isChainQuickBitesTabBlock]);

  React.useEffect(() => {
    detectMultipleRows();

    const container = optionsContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      detectMultipleRows();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [detectMultipleRows, activeIndex, charts.length]);

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
  const segmentedLayoutClass = block.layout === 'segmented'
    ? hasMultipleOptionRows && isChainQuickBitesTabBlock
      ? 'bg-color-bg-default rounded-[20px] p-1'
      : 'bg-color-bg-default rounded-2xl md:rounded-full p-1'
    : '';

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
    <div ref={optionsContainerRef}>
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] items-start gap-[15px]">
          <ChartBlock key={sideChartForRender.id} block={sideChartForRender} />
          {mainChart}
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
            <div
              ref={optionsContainerRef}
              className={`flex flex-wrap md:items-start items-center w-full md:justify-normal justify-evenly gap-2 ${segmentedLayoutClass}`}
            >
              {charts.map((chart, index) => {
                const isActive = index === activeIndex;
                const label = chart.toggleLabel || chart.title || `Chart ${index + 1}`;
                return (
                  <button
                    key={chart.id || `${label}-${index}`}
                    type="button"
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      isActive
                        ? 'bg-color-ui-active'
                        : 'bg-color-bg-default hover:bg-color-ui-hover'
                    }`}
                    onClick={() => setActiveIndex(index)}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
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
