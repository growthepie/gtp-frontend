// Types for a Notion-like block-based content system

export type BlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'image' 
  | 'chart' 
  | 'callout'
  | 'quote'
  | 'divider'
  | 'container'  // Container can hold multiple blocks horizontally
  | 'spacer'      // For vertical spacing
  | 'iframe'
  | 'list'      // For list items
  | 'kpi-cards' // For KPI card blocks
  | 'dropdown'   // For dropdown blocks
  | 'table'; // For table blocks

export interface BaseBlock {
  id: string;
  type: BlockType;
  showInMenu?: boolean; // Optional property to control block visibility in menus, defaults to true
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
  columnKeys?: {
    [key: string]: {
      sortByValue: boolean;
      label?: string;
      type?: string;
    };
  };
  columnSortBy: "value" | "name" | undefined;
  readFromJSON: boolean;
  jsonData?: {
    url: string;
    pathToRowData: string;
    pathToColumnKeys?: string; // Optional - if not provided, will look for columnKeys in the same parent as rowData
  }

  rowData?: {
    [key: string]: {
      [columnKey: string]: {
        value: number | string | undefined;
        icon?: string | undefined;
        color?: string | undefined;
        link?: string | undefined;
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

import { DropdownOption } from '@/components/quick-bites/Dropdown';
export interface DropdownBlock extends BaseBlock {
  type: 'dropdown';
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  searchable?: boolean;
  disabled?: boolean;

  // For inline options (when readFromJSON is false or not specified)
  options?: DropdownOption[];

  readFromJSON?: boolean;
  jsonData?: {
    url: string;
    pathToOptions: string;
    valueField?: string; // Field to use for option value (defaults to 'value')
    labelField?: string; // Field to use for option label (defaults to 'label')
  };
}

export type ContentBlock = 
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | TableBlock
  | DropdownBlock
  | ChartBlock
  | CalloutBlock
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