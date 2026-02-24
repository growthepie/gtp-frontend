// File: lib/types/QuickBites.ts
import type { DashStyleValue, Options } from 'highcharts';
import { GTPIconName } from '@/icons/gtp-icon-names';

export interface Author {
    name: string;
    xUsername: string;
  }
  
  export interface Topic {
    icon?: GTPIconName; // Make icon optional
    name: string;
    url: string;
    color?: string;
  }
  
export interface ChartMeta {
    name: string;
    nameFromPath?: string;
    color: string;
    xIndex: number;
    yIndex: number;
    suffix?: string | null;
    prefix?: string | null;
    url?: string;
    pathToData?: string;
    dashStyle?: DashStyleValue;
    yMultiplication?: number;  // Multiplier for y-axis values (e.g., 100 for converting decimals to percentages)
    makeNegative?: boolean; // Flip y-values (e.g., for outflows)
  }
  
  export type ChartOptions = Partial<Options>;
  
export interface JsonLdThing {
  ['@context']: 'https://schema.org' | string; // minimal, flexible
  [k: string]: any;
}

  export type FaqItem = { q: string; a: string };

  export interface QuickBiteData {
    title: string;
    subtitle: string;
    shortTitle: string; // Must be <= 20 characters for card layouts
    summary?: string | ""; // Optional summary for SEO
    content: string[];
    image: string;
    og_image?: string;
    date: string;
    icon: string;
    related: string[];
    author?: Author[];
    topics?: Topic[];
    KpiCards?: KpiCard[];
    showInMenu?: boolean; // Optional property to control menu visibility, defaults to true
    ethUsdSwitchEnabled?: boolean; // Optional override for ETH/USD toggle on Quick Bites pages
    jsonLdFaq?: JsonLdThing;
    jsonLdDatasets?: JsonLdThing[];
    faq?: FaqItem[];
  }

  export interface KpiCard {
    title: string;
    value: string | number;
    description?: string;
    icon?: string;
    info?: string;
  }
  
  export interface QuickBiteWithSlug extends QuickBiteData {
    slug: string;
  }
  
  // Type guards
  export interface RelatedData {
    [key: string]: {
      relatedTopics: string[];
      data: QuickBiteData | null;
    };
  }
  
  export function isQuickBiteWithSlug(dive: QuickBiteData | QuickBiteWithSlug): dive is QuickBiteWithSlug {
    return 'slug' in dive;
  }
