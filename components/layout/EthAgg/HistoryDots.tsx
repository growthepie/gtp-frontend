// components/layout/EthAgg/HistoryDots.tsx
import React from 'react';

interface HistoryDotsProps {
  data: number[];
  selectedIndex: number;
  hoverIndex: number | null;
  onSelect: (index: number) => void;
  onHover: (index: number | null) => void;
  getGradientColor: (percentage: number) => string;
}

export function HistoryDots({
  data,
  selectedIndex,
  hoverIndex,
  onSelect,
  onHover,
  getGradientColor,
}: HistoryDotsProps) {
  if (!data || data.length === 0) return null;

  const totalDots = data.length;
  const positions: number[] = [];
  let cumulativeWidth = 0;
  const dotSizes: number[] = [];

  const maxCost = Math.max(...data);
  const minCost = Math.min(...data);

  // Pre-calculate positions and sizes
  for (let i = 0; i < totalDots; i++) {
    const size = selectedIndex === i ? 10 : 5;
    dotSizes.push(size);
    positions.push(cumulativeWidth);
    cumulativeWidth += size + (i < totalDots - 1 ? 1 : 0); // 1px gap
  }

  const totalWidth = cumulativeWidth;
  const startOffset = (140 - totalWidth) / 2; // 140 is the width of the container

  return (
    <>
      {data.map((cost, index) => {
        const dotSize = dotSizes[index];
        const halfDotSize = dotSize / 2;

        const range = maxCost - minCost;
        const percentage = range > 0 ? ((cost - minCost) / range) * 100 : 50; // default to 50 if no range
        const color = getGradientColor(percentage);

        const scale = selectedIndex === index ? 2 : hoverIndex === index ? 1.5 : 1;
        const size = selectedIndex === index ? 10 : hoverIndex === index ? 5 : 5;
        const zIndex = selectedIndex === index ? 10 : hoverIndex === index ? 5 : 0;

        return (
          <div 
          key={index} 
          className='relative flex items-center justify-center'
          style={{
            width: `${size}px`,
            height: `${size}px`,
            zIndex: zIndex,
          }}
          >
            <div
              className={`rounded-full transition-all duration-50 absolute w-[5px] h-[5px] cursor-pointer`}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
             
              style={{
                backgroundColor: color,
                transform: `scale(${scale})`,
                // zIndex: zIndex,
                // left: `${startOffset + positions[index] + halfDotSize}px`,
                // top: '50%',
                // transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        );
      })}
    </>
  );
}