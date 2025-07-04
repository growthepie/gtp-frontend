// components/layout/EthAgg/FeeDisplayRow.tsx
import React from 'react';
import { HistoryDots } from './HistoryDots';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';

interface FeeDisplayRowProps {
  title: string;
  costValue: number;
  costHistory: number[];
  showUsd: boolean;
  gradientClass: string;
  selectedIndex: number;
  hoverIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  getGradientColor: (percentage: number) => string;
  formatNumber: (num: number, decimals?: number) => string;
}

export function FeeDisplayRow({
  title,
  costValue,
  costHistory,
  showUsd,
  gradientClass,
  selectedIndex,
  hoverIndex,
  onSelect,
  onHover,
  getGradientColor,
  formatNumber,
}: FeeDisplayRowProps) {
  return (
    <div className='flex justify-between items-center'>
      <div className='w-[115px] heading-small-xxs whitespace-nowrap'>{title}</div>

      <div className="flex-1 flex justify-end max-w-full min-w-[30px] px-[5px] overflow-x-hidden">
        <div className="flex-1 h-[18px]"></div>
        <div className='relative flex gap-[1px] items-center justify-center h-[18px]'>
          <HistoryDots
            data={costHistory}
            selectedIndex={selectedIndex}
            hoverIndex={hoverIndex}
            onSelect={onSelect}
            onHover={onHover}
            getGradientColor={getGradientColor}
          />
        </div>
        <div className="flex-1 h-[18px]"></div>
      </div>


      <div className={`flex bg-gradient-to-b ${gradientClass} bg-clip-text text-transparent justify-end text-end items-end w-[100px] numbers-2xl`}>
        {showUsd
          ? "$" + Intl.NumberFormat('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(costValue || 0)
          : formatNumber((costValue || 0) * 1_000_000_000, 0)
        }
        <span className={`heading-small-xxs mb-0.5 ${showUsd ? "hidden" : "block"}`}> Gwei</span>
      </div>
    </div>
  );
}