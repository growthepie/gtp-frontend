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
  hoverText?: string;
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
  hoverText,
}: FeeDisplayRowProps) {
  return (
    <div className='flex justify-between items-center'>
      <div className='relative w-[90px] 2xl:w-[115px] heading-small-xxs whitespace-nowrap'>
        {title === "Ethereum Mainnet" ? <><div className='hidden 2xl:block'>Ethereum Mainnet</div><div className='block 2xl:hidden'>Ethereum L1</div></> : title}
        {hoverText && (
          <div className="text-[#5A6462] group-hover:opacity-100 opacity-0 transition-opacity duration-300 absolute -bottom-[14px] left-0 text-xxxs">
            {hoverText}
          </div>
        )}
      </div>

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
        {(() => {
          const value = showUsd
            ? "$" + Intl.NumberFormat('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(costValue || 0)
            : formatNumber((costValue || 0) * 1_000_000_000, 0);
          return value.length > 6 ? (value).substring(0, 7) : value;
        })()}
        <span className={`heading-small-xxs mb-0.5 ${showUsd ? "hidden" : "block"}`}> Gwei</span>
      </div>
    </div>
  );
}