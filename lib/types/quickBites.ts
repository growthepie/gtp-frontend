// File: lib/types/QuickBites.ts
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