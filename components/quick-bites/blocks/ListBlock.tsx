import React from 'react';
import { ListBlock as ListBlockType } from '@/lib/types/blockTypes';

interface ListBlockProps {
  block: ListBlockType;
}

// Helper function to parse bold text
const parseBoldText = (text: string): JSX.Element[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and wrap in strong
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export const ListBlock: React.FC<ListBlockProps> = ({ block }) => {
  return (
    <ul className="list-disc pl-3.5 my-4  text-xs md:text-sm space-y-2">
      {block.items.map((item, index) => (
        <li key={index} className="">
          {parseBoldText(item)}
        </li>
      ))}
    </ul>
  );
}; 