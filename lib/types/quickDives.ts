export interface Author {
  name: string;
  xUsername: string;
}

export interface QuickDiveData {
  title: string;
  subtitle: string;
  content: string[];
  image: string;
  date: string;
  icon: string;
  related: string[];
  authors?: Author[];
}

export interface QuickDiveWithSlug extends QuickDiveData {
  slug: string;
}

// Type guards
export function isQuickDiveWithSlug(dive: QuickDiveData | QuickDiveWithSlug): dive is QuickDiveWithSlug {
  return 'slug' in dive;
}