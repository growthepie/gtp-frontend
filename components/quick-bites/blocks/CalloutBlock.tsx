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
    <div className={`my-8 p-[15px] bg-color-bg-default rounded-[15px] border-l-4 text-md md:w-auto w-full border-color-ui-hover ${block.className || ''}`}>
      <div className="flex items-start gap-3">
        {block.icon && (
          <div className="flex-shrink-0 mt-[4px]">
            <GTPIcon icon={block.icon as any} size="sm" />
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: contentWithLinks }}  />
      </div>
    </div>
  );
};