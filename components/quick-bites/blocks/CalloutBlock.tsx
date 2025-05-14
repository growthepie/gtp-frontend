// File: components/quick-dives/blocks/CalloutBlock.tsx
import React from 'react';
import { CalloutBlock as CalloutBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface CalloutBlockProps {
  block: CalloutBlockType;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ block }) => {
  return (
    <div className={`my-6 p-4 bg-forest-50 dark:bg-forest-900 rounded-lg border-l-4 ${block.color ? `border-${block.color}` : 'border-forest-400'} ${block.className || ''}`}>
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