// Types for a Notion-like block-based content system

export type BlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'image' 
  | 'chart' 
  | 'chart-toggle'
  | 'callout'
  | 'quote'
  | 'divider'
  | 'container'  // Container can hold multiple blocks horizontally
  | 'spacer'      // For vertical spacing
  | 'iframe'
  | 'list'      // For list items
  | 'kpi-cards' // For KPI card blocks
  | 'live-metrics' // For live data metric cards
  | 'live-metrics-row' // For multiple live metric cards in a row
  | 'dropdown'   // For dropdown blocks
  | 'titleButton'   // For title button blocks
  | 'faq' // For FAQ blocks
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
  columnOrder?: string[];
  columnDefinitions: {
    [key: string]: {
      sortByValue: boolean;
      label?: string;
      type?: string;
      isNumeric?: boolean;
      minWidth?: number;
      maxWidth?: number;
      copyable?: boolean; // Add this line
      hidden?: boolean;
      add_url?: string; // URL template with ${cellValue} placeholder
      sourceKey?: string; // Map display column key to a source key from JSON columns
      sourceIndex?: number; // Map display column key to a fixed source index
      infoTooltip?: { sourceKey?: string; text?: string }; // Optional info icon tooltip content
      autoIndex?: boolean; // Auto-generate 1-based row index when value is missing
      expand?: boolean; // Column absorbs remaining space (1fr). Only one column should have this.
      showIcon?: boolean; // For chain type: show chain icon (default true)
      showLabel?: boolean; // For chain type: show chain name from AllChainsByKeys (default false)
      uppercase?: boolean; // Render text in uppercase
      chip?: boolean; // Render value as a monospace pill badge
      valueMap?: Record<string, string>; // Map raw values to display strings (case-insensitive lookup)
      valueMapShowKey?: boolean; // Show original key after mapped value, e.g. "US Dollar (USD)"
      dateFormat?: 'short' | 'medium' | 'long'; // For date type: date display format (default 'medium')
      showTimeAgo?: boolean; // For date type: show relative time as secondary text (e.g. "100 days ago")
      cellBar?: {
        colorColumn?: string; // Column key with origin_key for chain color
        color?: string;       // Explicit color fallback
      };
      currencyMap?: Record<string, { symbol: string; name: string; country: string }>; // Map currency codes to symbol + name + country code for styled rendering
      iconMap?: Record<string, { icon: string; label: string }>; // Map raw values to icon + label pairs
      badgeSources?: Array<{ // For badges type: render color-coded pills from multiple source keys
        sourceKey: string;
        label: string;
        color: string;
      }>;
      maxVisibleBadges?: number; // For badges type in desktop table view: show first N badges, then "+X more"
      units?: {
        [key: string]: {
          decimals?: number;
          prefix?: string;
          suffix?: string;
        };
      };
    };
  };
  columnSortBy: "value" | "name" | undefined;
  rowBar?: {
    valueColumn: string;   // Column key whose numeric value drives bar width
    colorColumn?: string;  // Column key with origin_key for chain-based color
    color?: string;        // Explicit color fallback
  };
  scrollable?: boolean; // Wrap rows in VerticalScrollContainer (default true)
  cardView?: {
    titleColumn: string; // Column key for card title (header row, displayed prominently)
    imageColumn?: string; // Column key for avatar/icon (header row)
    linkColumn?: string; // Column key whose value is used as arrow link (header row)

    // New sections-based layout: ordered rows below the header, each with its own label/layout config.
    sections?: Array<{
      columns: string[]; // Column keys to show in this row
      labelPosition?: "right" | "left" | "top" | "bottom" | "hidden"; // Where column label appears relative to value (default "right")
      layout?: "spread" | "start" | "end"; // Horizontal distribution (default "spread")
    }>;

    // Legacy: used when sections is not provided. Kept for backward compatibility.
    topColumns?: string[];
    bottomColumns?: string[];

    hiddenColumns?: string[]; // Columns to suppress entirely in card view
    autoRowHeight?: boolean; // If true, allow card rows to grow with content instead of fixed 20px height
  };
  readFromJSON: boolean;
  filterOnStateKey?: {
    stateKey: string;
    columnKey: string;
  };
  jsonData?: {
    url?: string;
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
  margins?: "none" | "normal";
  options?: any; // Chart configuration options
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  caption?: string;
  className?: string;
  centerName?: string; // Center label for pie/donut charts
  chartCategories?: {
    name: string;
    color: string;
  }[];
  disableTooltipSort?: boolean;
  showXAsDate?: boolean;
  showZeroTooltip?: boolean;
  showTotalTooltip?: boolean;
  dataAsJson?: {
    meta?: {
      type?: string;
      name: string;
      nameFromPath?: string;
      color: string;
      stacking?: "normal" | "percent" | null;
      xIndex: number;
      yIndex: number;
      yaxis?: number;
      suffix?: string;
      prefix?: string;
      url?: string;
      pathToData?: string;
      dashStyle?: Highcharts.DashStyleValue;
      makeNegative?: boolean;
      aggregation?: "daily" | "weekly" | "monthly";
    }[];
    dynamicSeries?: {
      url: string;
      pathToData: string;
      pathToTypes?: string;
      ystartIndex?: number;
      names?: string | string[];
      colors: string | string[];
      type?: string;
      stacking?: "normal" | "percent" | null;
      xIndex?: number;
      tooltipDecimals?: number;
    };
    pieData?:
      | { name: string; y: number; color: string; tooltipDecimals?: number }[]
      | {
          url: string;
          pathToData: string;
          xIndex?: number;
          yIndex?: number;
          tooltipDecimals?: number;
          colors: string | string[];
          nameMap?: Record<string, string>; // Map raw slice names to display names
          showPercentage?: boolean; // Show percentage in tooltip (default false)
        };
  } | null;
  seeMetricURL?: string | null;
  yAxisLine?: {
    xValue: number;
    annotationPositionX: number; // Pixel offset X
    annotationPositionY: number; // Pixel offset Y
    annotationText: string;
    lineStyle?: "solid" | "dashed" | "dotted" | "dashdot" | "longdash" | "longdashdot";
    lineColor?: string;
    lineWidth?: number;
    textColor?: string;
    textFontSize?: string;
    backgroundColor?: string;
  }[];
  filterOnStateKey?: {
    stateKey: string;
    columnKey: string;
  };
  toggleLabel?: string;
  suppressWrapperSpacing?: boolean;
}

export interface ChartToggleBlock extends BaseBlock {
  type: 'chart-toggle';
  title?: string;
  description?: string;
  className?: string;
  layout?: 'tabs' | 'segmented';
  defaultIndex?: number;
  charts: ChartBlock[];
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
  blocks: ContentBlock[][]; 
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

export interface LiveMetricFormat {
  type?: 'number' | 'date' | 'duration';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  minDecimals?: number;
  maxDecimals?: number;
  compact?: boolean;
  multiply?: number;
  locale?: string;
  dateFormat?: string;
  fallback?: string;
}

export interface LiveMetricConfig {
  label: string;
  valuePath: string;
  valueFormat?: LiveMetricFormat;
  hoverLabel?: string;
  hoverValuePath?: string;
  hoverFormat?: LiveMetricFormat;
  align?: 'left' | 'right';
}

export interface LiveMetricsChartConfig {
  dataPath?: string;
  valueKey?: string;
  timeKey?: string;
  metricLabel?: string;
  seriesName?: string;
  seriesNamePath?: string;
  overrideColor?: string[];
  limit?: number;
  centerWatermark?: boolean;
  anchorZero?: boolean;
}

export interface LiveMetricsFeeDisplayRowConfig {
  title: string;
  historyPath?: string;
  valuePath?: string;
  valueKey?: string;
  showUsd?: boolean;
  gradientClass?: string;
  hoverText?: string;
  limit?: number;
}

export interface LiveMetricsCardConfig {
  title: string;
  icon?: string;
  className?: string;
  layout?: 'stacked' | 'chart-right';
  chartHeightClassName?: string;
  dataUrl: string;
  dataPath?: string;
  historyUrl?: string;
  historyPath?: string;
  refreshInterval?: number;
  metricsLeft?: LiveMetricConfig[];
  metricsRight?: LiveMetricConfig[];
  liveMetric?: LiveMetricConfig & {
    accentColor?: string;
    liveIcon?: string;
  };
  chart?: LiveMetricsChartConfig;
  feeDisplayRows?: LiveMetricsFeeDisplayRowConfig[];
}

export interface LiveMetricsBlock extends BaseBlock, LiveMetricsCardConfig {
  type: 'live-metrics';
}

export interface LiveMetricsRowBlock extends BaseBlock {
  type: 'live-metrics-row';
  items: LiveMetricsCardConfig[];
  className?: string;
}

export interface TitleButtonBlock extends BaseBlock {
  type: 'titleButton';
  text: string;
  url: string;
  className?: string;
}

export interface FaqBlockItem {
  question: string;
  answer: string;
}

export interface FaqBlock extends BaseBlock {
  type: 'faq';
  title?: string;
  description?: string;
  className?: string;
  layout?: 'accordion' | 'list';
  items: FaqBlockItem[];
}

import { DropdownOption } from '@/components/quick-bites/Dropdown';
export interface DropdownBlock extends BaseBlock {
  type: 'dropdown';
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  allowEmpty?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  stateKey?: string; // Key to use for storing the value in the shared state
  multiSelect?: boolean;
  exclusive?: boolean;
  inclusive?: boolean;
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
  | ContainerBlock
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | TableBlock
  | DropdownBlock
  | ChartBlock
  | ChartToggleBlock
  | CalloutBlock
  | QuoteBlock
  | DividerBlock
  | SpacerBlock
  | IframeBlock
  | ListBlock
  | KpiCardsBlock
  | LiveMetricsBlock
  | LiveMetricsRowBlock
  | TitleButtonBlock
  | FaqBlock;

// Helper function to generate a unique ID for blocks
export const generateBlockId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
