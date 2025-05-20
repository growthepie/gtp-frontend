// File: components/quick-dives/blocks/CalloutBlock.tsx
import React from 'react';
import { CalloutBlock as CalloutBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface CalloutBlockProps {
  block: CalloutBlockType;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ block }) => {
  return (
    <div className={`my-[15px] p-[15px] bg-forest-50 dark:bg-forest-900 rounded-[15px] border-l-4 text-xs md:text-sm leading-[1.5] ${block.color ? `border-${"[#E3E8E7]"}` : 'border-[#E3E8E7]'} ${block.className || ''}`}>
      <div className="flex items-start gap-3">
        {block.icon && (
          <div className="flex-shrink-0 mt-1">
            <GTPIcon icon={block.icon as any} size="sm" />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: block.content }} />
      </div>
    </div>
  );
};