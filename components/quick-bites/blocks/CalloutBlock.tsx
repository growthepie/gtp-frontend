// File: components/quick-dives/blocks/CalloutBlock.tsx
import React from 'react';
import { CalloutBlock as CalloutBlockType } from '@/lib/types/blockTypes';
import { GTPIcon } from '@/components/layout/GTPIcon';

interface CalloutBlockProps {
  block: CalloutBlockType;
}

const parseMarkdownLinksToHtml = (text: string): string => {
  if (!text) return '';
  // Regex to find links in markdown format [text](url) or (text)[url] or [(text)[url]]
  const standardLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const reverseLinkRegex = /\(([^)]+)\)\[(https?:\/\/[^\]]+)\]/g;
  const doubleBracketLinkRegex = /\[\(([^)]+)\)\[(https?:\/\/[^\]]+)\]\]/g;
  
  // Replace standard format [text](url)
  let result = text.replace(
    standardLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  
  // Replace reverse format (text)[url]
  result = result.replace(
    reverseLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  
  // Replace double bracket format [(text)[url]]
  result = result.replace(
    doubleBracketLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>'
  );
  
  return result;
};

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ block }) => {
  const contentWithLinks = parseMarkdownLinksToHtml(block.content);
  
  return (
    <div className={`my-6 p-[15px] bg-forest-50 dark:bg-forest-900 rounded-[25px] border-l-4 text-xs md:text-sm md:w-auto w-full ${block.color ? `border-${"[#5A6462]"}` : 'border-[#5A6462]'} ${block.className || ''}`}>
      <div className="flex items-start gap-3">
        {block.icon && (
          <div className="flex-shrink-0 mt-0.5">
            <GTPIcon icon={block.icon as any} size="sm" />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: contentWithLinks }}  />
      </div>
    </div>
  );
};