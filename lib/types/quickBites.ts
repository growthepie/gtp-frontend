// File: lib/types/QuickBites.ts
import type { DashStyleValue, Options } from 'highcharts';

export interface Author {
    name: string;
    xUsername: string;
  }
  
  export interface Topic {
    icon: string;
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
    date: string;
    icon: string;
    related: string[];
    author?: Author[];
    topics?: Topic[];
  }
  
  export interface QuickBiteWithSlug extends QuickBiteData {
    slug: string;
  }
  
  // Type guards
  export function isQuickBiteWithSlug(dive: QuickBiteData | QuickBiteWithSlug): dive is QuickBiteWithSlug {
    return 'slug' in dive;
  }