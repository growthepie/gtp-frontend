import React from 'react';
import { KpiCardsBlock } from '@/lib/types/blockTypes';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
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
  const cards = block.items as KpiCard[];

  
  return (
    <div className='flex flex-row gap-x-[10px] flex-wrap w-full justify-center '>
      {cards.map((card, index) => (
        <div
          key={index}
          className='flex-1 p-[15px] pt-[10px] flex flex-col items-center rounded-[11px] bg-[#344240] shadow-md'
        >
          <div className="flex w-full justify-between items-center">
            <div className="flex-1"></div>
            <div className="flex flex-row items-center gap-x-[8px] -ml-[32px]">
              {card.icon && (<GTPIcon icon={card.icon as GTPIconName} size="md"/>)}
              <div className="heading-small-xxxs">{card.title}</div>
            </div>
            <div className="flex-1 flex justify-end">
              {card.info && (
                <GTPTooltipNew
                  placement="bottom-end"
                  allowInteract={true}
                  size="md"
                  trigger={
                    <div className="flex items-center justify-end w-full">
                      <GTPIcon icon="gtp-info-monochrome" size="sm"/>
                    </div>
                  }
                  containerClass="flex flex-col gap-y-[10px]"
                  positionOffset={{ mainAxis: 0, crossAxis: 20 }}
                >
                  <div className="px-[15px]">{card.info}</div>
                </GTPTooltipNew>
              )}
            </div>
          </div>
          <div className="heading-small-lg">{card.value}</div>
          {card.description && (
            <div className="text-xxs">{card.description}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KpiBlock; 