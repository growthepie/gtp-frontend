'use client';

import React from 'react';
import { ChartBlock as ChartBlockType, ChartToggleBlock as ChartToggleBlockType } from '@/lib/types/blockTypes';
import { ChartBlock } from './ChartBlock';

interface ChartToggleBlockProps {
  block: ChartToggleBlockType;
}

const clampIndex = (index: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(Math.max(index, 0), max - 1);
};

export const ChartToggleBlock: React.FC<ChartToggleBlockProps> = ({ block }) => {
  const charts = block.charts ?? [];

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
      <div
        className={`flex flex-wrap gap-2 ${block.layout === 'segmented' ? 'bg-color-bg-default rounded-full p-1' : ''}`}
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
      {chartForRender && (
        <div className="mt-4">
          <ChartBlock key={chartForRender.id} block={chartForRender} />
        </div>
      )}
    </div>
  );
};

export default ChartToggleBlock;

