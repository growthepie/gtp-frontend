// File: components/quick-dives/blocks/CalloutBlock.tsx
import React from 'react';
import { CalloutBlock as CalloutBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface CalloutBlockProps {
  block: CalloutBlockType;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ block }) => {
  return (
    <div className={`my-6 p-[15px] bg-forest-50 dark:bg-forest-900 rounded-[25px] md:rounded-lg border-l-4 text-xs md:text-sm md:w-auto w-full ${block.color ? `border-${"[#5A6462]"}` : 'border-[#5A6462]'} ${block.className || ''}`}>
      <div className="flex items-start gap-3">
        {block.icon && (
          <div className="flex-shrink-0 mt-1">
            <GTPIcon icon={block.icon as any} size="sm" />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: block.content }}  />
      </div>
    </div>
  );
};