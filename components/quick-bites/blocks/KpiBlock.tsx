import React from 'react';
import { KpiCardsBlock } from '@/lib/types/blockTypes';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import GTPInfoButton from "@/components/GTPComponents/GTPInfoButton";
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

// The platform's card (as on /eth and the metrics page): default background, standard
// shadow, 15px corners, and the i-button right after the title.
const KpiBlock: React.FC<KpiBlockProps> = ({ block }) => {
  const cards = block.items as KpiCard[];

  return (
    <div className='flex flex-row gap-[15px] flex-wrap w-full'>
      {cards.map((card, index) => (
        <div
          key={index}
          className='flex-1 min-w-[220px] p-[15px] flex flex-col gap-y-[10px] rounded-[15px] bg-color-bg-default shadow-standard'
        >
          <div className="flex items-center gap-x-[8px] min-w-0">
            {card.icon && (<GTPIcon icon={card.icon as GTPIconName} size="sm" className="shrink-0" />)}
            <div className="heading-small-xs truncate">{card.title}</div>
            {card.info && (
              <GTPInfoButton label={`About ${card.title}`}>
                {card.info}
              </GTPInfoButton>
            )}
          </div>
          <div className="flex items-baseline gap-x-[8px] flex-wrap">
            <span className="numbers-2xl">{card.value}</span>
            {card.description && (
              <span className="heading-small-xxxs text-color-text-secondary pt-[1px]">{card.description}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiBlock;
