import { QuickBiteData, QuickBiteWithSlug } from '@/lib/types/quickBites';
import QUICK_BITES_DATA from '.';

export default QUICK_BITES_DATA;

// Helper functions for working with the mock data
export const getQuickBiteBySlug = (slug: string): QuickBiteData | undefined => {
  return QUICK_BITES_DATA[slug];
};

export const getAllQuickBites = (): (QuickBiteData & { slug: string })[] => {
  return Object.entries(QUICK_BITES_DATA).map(([slug, data]) => ({
    ...data,
    slug
  }));
};

export const getRelatedQuickBites = (slugs: string[]): QuickBiteWithSlug[] => {
  return slugs
    .map(slug => {
      const data = QUICK_BITES_DATA[slug];
      if (!data) return null;
      return {
        ...data,
        slug
      };
    })
    .filter((item): item is QuickBiteWithSlug => item !== null);
};

// Get featured quick bites for homepage
export const getFeaturedQuickBites = (count: number = 3): (QuickBiteData & { slug: string })[] => {
  return getAllQuickBites()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};