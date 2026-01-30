// File: components/quick-bites/Block.tsx (Updated version)
import React from 'react';
import { ContentBlock } from '@/lib/types/blockTypes';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ChartBlock } from './blocks/ChartBlock';
import { ChartToggleBlock } from './blocks/ChartToggleBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { IframeBlock } from './blocks/IframeBlock';
import { ListBlock } from './blocks/ListBlock';
import KpiBlock from './blocks/KpiBlock';
import LiveMetricsBlock from './blocks/LiveMetricsBlock';
import LiveMetricsRowBlock from './blocks/LiveMetricsRowBlock';
import { TableBlock } from './blocks/TableBlock';
import { DropdownBlock } from './blocks/DropdownBlock';
import { ContainerBlock } from './blocks/ContainerBlock';
import { TitleButtonBlock } from './blocks/TitleButtonBlock';
import FaqBlock from './blocks/FaqBlock';
import { SpacerBlock } from './blocks/SpacerBlock';

interface BlockProps {
  block: ContentBlock;
}

const Block: React.FC<BlockProps> = ({ block }) => {
 
  
  // Check if block should be hidden from menu
  if (block.showInMenu === false) {
    return null;
  }
  
  switch (block.type) {
    case 'container':
      return <ContainerBlock block={block} />;
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'chart':
      return <ChartBlock block={block} />;
    case 'chart-toggle':
      return <ChartToggleBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'iframe':
      return <IframeBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'kpi-cards':
      return <KpiBlock block={block} />;
    case 'live-metrics':
      return <LiveMetricsBlock block={block} />;
    case 'live-metrics-row':
      return <LiveMetricsRowBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'dropdown': // Add this case
      return <DropdownBlock block={block} />;
    case 'titleButton':
      return <TitleButtonBlock block={block} />;
    case 'faq':
      return <FaqBlock block={block} />;
    case 'spacer':
      return <SpacerBlock block={block} />;
    default:
      console.warn(`Unknown block type: ${(block as any).type}`);
      return null;
  }
};

export default Block;
