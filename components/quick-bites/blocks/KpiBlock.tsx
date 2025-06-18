import React from 'react';
import { KpiCardsBlock } from '@/lib/types/blockTypes';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface KpiCard {
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  info?: string;
}

interface KpiBlockProps {
  block: KpiCardsBlock;
}

const KpiBlock: React.FC<KpiBlockProps> = ({ block }) => {
  console.log('KpiBlock received block:', block);
  const cards = block.items as KpiCard[];
  console.log('KpiBlock cards:', cards);
  
  return (
    <div className='flex flex-row gap-x-[15px] flex-wrap w-full'>
      {cards.map((card, index) => (
        <div
          key={index}
          className='flex-1 p-[15px] rounded-lg border-[1px] border-[#5A6462] shadow-md'
        >
          <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
          <div className="text-2xl font-bold mb-1">{card.value}</div>
          {card.description && (
            <p className="text-sm text-gray-600">{card.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default KpiBlock; 