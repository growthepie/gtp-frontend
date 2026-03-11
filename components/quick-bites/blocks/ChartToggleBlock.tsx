'use client';

import React from 'react';
import { ChartBlock as ChartBlockType, ChartToggleBlock as ChartToggleBlockType } from '@/lib/types/blockTypes';
import { ChartBlock } from './ChartBlock';

interface ChartToggleBlockProps {
  block: ChartToggleBlockType;
}

const CHAIN_QUICK_BITES_TAB_BLOCK_CLASS = "chain-quick-bites-tab-block";

const clampIndex = (index: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(Math.max(index, 0), max - 1);
};

export const ChartToggleBlock: React.FC<ChartToggleBlockProps> = ({ block }) => {
  const charts = block.charts ?? [];
  const isChainQuickBitesTabBlock = (block.className || "").split(/\s+/).includes(CHAIN_QUICK_BITES_TAB_BLOCK_CLASS);

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
  const segmentedLayoutClass = block.layout === 'segmented'
    ? hasMultipleOptionRows && isChainQuickBitesTabBlock
      ? 'bg-color-bg-default rounded-[20px] p-1'
      : 'bg-color-bg-default rounded-2xl md:rounded-full p-1'
    : '';

  const chartForRender: ChartBlockType | undefined = selectedChart
    ? {
        ...selectedChart,
        suppressWrapperSpacing: true,
      }
    : undefined;

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

  return (
    <div className={`my-8 ${block.className || ''}`}>
      {block.title && (
        <h3 className="heading-small-xxs md:heading-small-xs xl:heading-small-sm text-color-text-primary mb-1">
          {block.title}
        </h3>
      )}
      {renderDescription()}
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
      {chartForRender && (
        <div className="mt-[15px]">
          <ChartBlock key={chartForRender.id} block={chartForRender} />
        </div>
      )}
    </div>
  );
};

export default ChartToggleBlock;

