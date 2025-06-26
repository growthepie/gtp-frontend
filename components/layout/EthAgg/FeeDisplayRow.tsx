// components/layout/EthAgg/FeeDisplayRow.tsx
import React from 'react';
import { HistoryDots } from './HistoryDots';

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
      <div className='w-[115px] heading-small-xxs'>{title}</div>
      <div className='relative flex items-center justify-center' style={{ width: '140px', height: '18px' }}>
        <HistoryDots
          data={costHistory}
          selectedIndex={selectedIndex}
          hoverIndex={hoverIndex}
          onSelect={onSelect}
          onHover={onHover}
          getGradientColor={getGradientColor}
        />
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