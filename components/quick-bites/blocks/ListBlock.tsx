import React from 'react';
import { ListBlock as ListBlockType } from '@/lib/types/blockTypes';

interface ListBlockProps {
  block: ListBlockType;
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
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  // Replace reverse format (text)[url]
  result = result.replace(
    reverseLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  // Replace double bracket format [(text)[url]]
  result = result.replace(
    doubleBracketLinkRegex,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-400 hover:underline">$1</a>'
  );
  
  return result;
};

// Helper function to parse bold text and links
const parseBoldTextAndLinks = (text: string): JSX.Element[] => {
  // First process links
  const textWithLinks = parseMarkdownLinksToHtml(text);
  
  // Then process bold text
  const parts = textWithLinks.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and wrap in strong
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    // Check if this part contains HTML (from link parsing)
    if (part.includes('<a href=')) {
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    }
    return <span key={index}>{part}</span>;
  });
};

export const ListBlock: React.FC<ListBlockProps> = ({ block }) => {
  return (
    <ul className="list-disc pl-3.5 my-4  text-xs md:text-sm space-y-2">
      {block.items.map((item, index) => (
        <li key={index} className="">
          {parseBoldTextAndLinks(item)}
        </li>
      ))}
    </ul>
  );
}; 