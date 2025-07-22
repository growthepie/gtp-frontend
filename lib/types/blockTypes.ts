// Types for a Notion-like block-based content system

export type BlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'image' 
  | 'chart' 
  | 'callout'
  | 'code'
  | 'quote'
  | 'divider'
  | 'container'  // Container can hold multiple blocks horizontally
  | 'spacer'      // For vertical spacing
  | 'iframe'
  | 'list'      // For list items
  | 'kpi-cards' // For KPI card blocks
  | 'table'; // For table blocks

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: string;
  className?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}


export interface TableBlock extends BaseBlock {
  type: 'table';
  content: string;
  className?: string;
  columnKeys: {
    [key: string]: {
      sortByValue: boolean;
      label?: string;
    };
  };
  columnSortBy: "value" | "name" | undefined;
  rowData: {
    [key: string]: {
      [columnKey: string]: {
        value: number | string | undefined;
        icon: string | undefined;
        color: string | undefined;
        link: string | undefined;
      };
    };
  };
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  chartType: 'line' | 'area' | 'column' | 'pie';
  data: any; // This would be the chart data structure
  options?: any; // Chart configuration options
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  caption?: string;
  className?: string;
  stacking?: "normal" | "percent" | null;
  chartCategories?: {
    name: string;
    color: string;
  }[];
  showXAsDate?: boolean;
  dataAsJson?: {
    meta: {
      name: string;
      color: string;
      xIndex: number;
      yIndex: number;
      suffix?: string;
      prefix?: string;
      url?: string;
      pathToData?: string;
      dashStyle?: Highcharts.DashStyleValue;
    }[];
  } | null;
  seeMetricURL?: string | null;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  content: string;
  icon?: string;
  color?: string;
  className?: string;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: string;
  language?: string;
  className?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  attribution?: string;
  className?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  className?: string;
}

export interface ContainerBlock extends BaseBlock {
  type: 'container';
  blocks: ContentBlock[];
  spacing?: number;
  alignment?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  className?: string;
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: number;
}

export interface IframeBlock extends BaseBlock {
  type: 'iframe';
  src: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  caption?: string;
  className?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  content: string;
  items: string[];
  className?: string;
}

export interface KpiCardsBlock extends BaseBlock {
  type: 'kpi-cards';
  items: Array<{
    title: string;
    value: string | number;
    description?: string;
  }>;
  className?: string;
}

export type ContentBlock = 
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | TableBlock
  | ChartBlock
  | CalloutBlock
  | CodeBlock
  | QuoteBlock
  | DividerBlock
  | ContainerBlock
  | SpacerBlock
  | IframeBlock
  | ListBlock
  | KpiCardsBlock;

// Helper function to generate a unique ID for blocks
export const generateBlockId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};