// File: components/quick-dives/blocks/CodeBlock.tsx
import React from 'react';
import { CodeBlock as CodeBlockType } from '@/lib/types/blockTypes';

interface CodeBlockProps {
  block: CodeBlockType;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ block }) => {
  return (
    <pre className={`my-6 p-4 bg-forest-900 dark:bg-forest-1000 text-forest-50 text-sm rounded-lg overflow-x-auto ${block.className || ''}`}>
      <code>{block.content}</code>
    </pre>
  );
};