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
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorState from '@/components/ErrorState';

interface BlockProps {
  block: ContentBlock;
  chainQuickBitesTitleSuffix?: string;
}

const BlockContent: React.FC<BlockProps> = ({ block, chainQuickBitesTitleSuffix }) => {
 
  
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
      return <ChartBlock block={block} chainQuickBitesTitleSuffix={chainQuickBitesTitleSuffix} />;
    case 'chart-toggle':
      return <ChartToggleBlock block={block} chainQuickBitesTitleSuffix={chainQuickBitesTitleSuffix} />;
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

// One block that fails to render shows an error in its place instead of taking down the article
const Block: React.FC<BlockProps> = (props) => {
  const height = "height" in props.block ? (props.block as { height?: number }).height : undefined;
  return (
    <ErrorBoundary
      fallback={(reset) => (
        <ErrorState
          title="This part couldn't be displayed"
          message="Something went wrong while showing this section. The rest of the page is unaffected."
          onRetry={reset}
          minHeight={height}
          className="my-[15px]"
        />
      )}
    >
      <BlockContent {...props} />
    </ErrorBoundary>
  );
};

export default Block;
