import React from 'react';
import { ContentBlock } from '@/lib/types/blockTypes';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ChartBlock } from './blocks/ChartBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { IframeBlock } from './blocks/IframeBlock';
import { ListBlock } from './blocks/ListBlock';

interface BlockProps {
  block: ContentBlock;
}

const Block: React.FC<BlockProps> = ({ block }) => {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'chart':
      return <ChartBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'iframe':
      return <IframeBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    default:
      console.warn(`Unknown block type: ${(block as any).type}`);
      return null;
  }
};

export default Block;