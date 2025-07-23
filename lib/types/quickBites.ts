// File: lib/types/QuickBites.ts
import type { DashStyleValue, Options } from 'highcharts';
import { GTPIconName } from '@/icons/gtp-icon-names';

export interface Author {
    name: string;
    xUsername: string;
  }
  
  export interface Topic {
    icon: GTPIconName;
    name: string;
    url: string;
    color?: string;
  }
  
  export interface ChartMeta {
    name: string;
    color: string;
    xIndex: number;
    yIndex: number;
    suffix?: string | null;
    prefix?: string | null;
    url?: string;
    pathToData?: string;
    dashStyle?: DashStyleValue;
  }
  
  export type ChartOptions = Partial<Options>;
  
  export interface QuickBiteData {
    title: string;
    subtitle: string;
    content: string[];
    image: string;
    og_image?: string;
    date: string;
    icon: string;
    related: string[];
    author?: Author[];
    topics?: Topic[];
    KpiCards?: KpiCard[];
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
  export function isQuickBiteWithSlug(dive: QuickBiteData | QuickBiteWithSlug): dive is QuickBiteWithSlug {
    return 'slug' in dive;
  }