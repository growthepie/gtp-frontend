'use client';

import React from 'react';
import { ScatterChartToggleBlock as ScatterChartToggleBlockType } from '@/lib/types/blockTypes';
import { ChainsScatterTxCountChartBlock } from './ChainsScatterTxCountChartBlock';
import { ChainsScatterStablesChartBlock } from './ChainsScatterStablesChartBlock';
import { ChainsScatterThroughputChartBlock } from './ChainsScatterThroughputChartBlock';
import { ChainsScatterTxCostsChartBlock } from './ChainsScatterTxCostsChartBlock';

interface ScatterChartToggleBlockProps {
  block: ScatterChartToggleBlockType;
}

const clampIndex = (index: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(Math.max(index, 0), max - 1);
};

export const ScatterChartToggleBlock: React.FC<ScatterChartToggleBlockProps> = ({ block }) => {
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

  const renderScatterChart = (chartType: string) => {
    switch (chartType) {
      case 'chains-scatter-chart':
        return <ChainsScatterTxCountChartBlock key="scatter-30d" />;
      case 'chains-scatter-stables-chart':
        return <ChainsScatterStablesChartBlock key="scatter-stables-30d" />;
      case 'chains-scatter-throughput-chart':
        return <ChainsScatterThroughputChartBlock key="scatter-throughput-30d" />;
      case 'chains-scatter-txcosts-chart':
        return <ChainsScatterTxCostsChartBlock key="scatter-txcosts-30d" />;
      default:
        return null;
    }
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
        className={`flex flex-wrap md:items-start items-center w-full md:justify-normal justify-evenly gap-2 ${block.layout === 'segmented' ? 'bg-color-bg-default rounded-2xl md:rounded-full p-1' : ''}`}
      >
        {charts.map((chart, index) => {
          const isActive = index === activeIndex;
          const label = chart.toggleLabel || `Chart ${index + 1}`;
          return (
            <button
              key={`${chart.type}-${index}`}
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
      {selectedChart && (
        <div className="mt-4">
          {renderScatterChart(selectedChart.type)}
        </div>
      )}
    </div>
  );
};

export default ScatterChartToggleBlock;

