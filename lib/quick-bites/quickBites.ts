import { QuickBiteData, QuickBiteWithSlug, RelatedData } from '@/lib/types/quickBites';
import QUICK_BITES_DATA from '.';

export default QUICK_BITES_DATA;

// interface RelatedData: [key: string]: {
//   relatedTopics: string[];
//   relatedQuickBites: string | null;
// }

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

// export const getRelatedQuickBites = (slugs: string[]): QuickBiteWithSlug[] => {
//   return slugs
//     .map(slug => {
//       const data = QUICK_BITES_DATA[slug];
//       console.log(data);
//       if (!data) return null;
//       return {
//         ...data,
//         slug
//       };
//     })
//     .filter((item): item is QuickBiteWithSlug => item !== null);
// };


export const getRelatedQuickBites = (slug: string): RelatedData => {
  const data = QUICK_BITES_DATA[slug];
  const relatedData: RelatedData = {};
  if (!data || !data.topics || data.topics.length === 0) return relatedData;

  // Prioritise matches on the first 3 topics
  const primaryTopicNames = new Set(data.topics.slice(0, 3).map((t) => t.name));
  const secondaryTopicNames = new Set(data.topics.slice(3).map((t) => t.name));

  const primaryMatches: RelatedData = {};
  const secondaryMatches: RelatedData = {};

  Object.entries(QUICK_BITES_DATA)
    .filter(([currentSlug]) => currentSlug !== slug)
    .forEach(([currentSlug, currentData]) => {
      if (!currentData.topics || currentData.topics.length === 0) return;

      const matchedPrimary: string[] = [];
      const matchedSecondary: string[] = [];

      currentData.topics.forEach((topic) => {
        if (primaryTopicNames.has(topic.name)) {
          if (!matchedPrimary.includes(topic.name)) {
            matchedPrimary.push(topic.name);
          }
        } else if (secondaryTopicNames.has(topic.name)) {
          if (!matchedSecondary.includes(topic.name)) {
            matchedSecondary.push(topic.name);
          }
        }
      });

      if (matchedPrimary.length > 0) {
        primaryMatches[currentSlug] = {
          relatedTopics: matchedPrimary,
          data: currentData,
        };
      } else if (matchedSecondary.length > 0) {
        secondaryMatches[currentSlug] = {
          relatedTopics: matchedSecondary,
          data: currentData,
        };
      }
    });

  // Build final result with bias toward primary topics.
  // Take up to 3 primary matches (most recent first), then fill from secondary if needed.
  const sortByDateDesc = (entries: [string, { relatedTopics: string[]; data: QuickBiteData | null }][]) =>
    entries
      .filter(([, value]) => value.data && value.data.date)
      .sort(
        (a, b) =>
          new Date(b[1].data!.date).getTime() -
          new Date(a[1].data!.date).getTime()
      );

  const primaryEntries = sortByDateDesc(Object.entries(primaryMatches));
  const secondaryEntries = sortByDateDesc(Object.entries(secondaryMatches));

  const maxRelated = 3;
  const selectedEntries: [string, { relatedTopics: string[]; data: QuickBiteData | null }][] = [];

  for (const entry of primaryEntries) {
    if (selectedEntries.length >= maxRelated) break;
    selectedEntries.push(entry);
  }

  if (selectedEntries.length < maxRelated) {
    for (const entry of secondaryEntries) {
      if (selectedEntries.length >= maxRelated) break;
      selectedEntries.push(entry);
    }
  }

  selectedEntries.forEach(([slugKey, value]) => {
    relatedData[slugKey] = value;
  });

  return relatedData;
};


export const getRelatedQuickBitesByTopic = (slug: string): RelatedData => {
  const relatedData: RelatedData = {};
  const quickBites = getAllQuickBites();

  // Find all quick bites that have a topic with the matching name
  quickBites.forEach(currentQuickBite => {
    const matchingTopics = currentQuickBite.topics?.filter(topic => topic.name === slug) || [];

    if (matchingTopics.length > 0) {
      relatedData[currentQuickBite.slug] = {
        relatedTopics: matchingTopics.map(topic => topic.name),
        data: currentQuickBite
      };
    }
  });

  return relatedData;
};

// Get featured quick bites for homepage
export const getFeaturedQuickBites = (count: number = 3): (QuickBiteData & { slug: string })[] => {
  return getAllQuickBites()
    .filter(item => item.showInMenu !== false) // Exclude items where showInMenu is explicitly false
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
};

// Get quick bites related to a specific metric using URL matching
export const getQuickBitesByMetric = (metricKey: string, metricType: string = "fundamentals"): RelatedData => {
  const relatedData: RelatedData = {};
  
  // Get the metric's URL pattern based on type
  const metricUrl = `/${metricType}/${metricKey}`;
  
  // Find quick bites that have topics with matching URLs
  Object.entries(QUICK_BITES_DATA).forEach(([slug, data]) => {
    const matchingTopics = data.topics?.filter(topic => {
      // Skip topics with empty URLs - they shouldn't match any metric pages
      if (!topic.url || topic.url.trim() === '') {
        return false;
      }
      
      // Direct URL match
      if (topic.url === metricUrl) {
        return true;
      }
      
      // Check if topic URL is a parent category that contains the metric
      const topicPath = topic.url;
      const metricPath = metricUrl;
      
      // If topic is a parent category of the metric
      if (topicPath !== metricPath && metricPath.startsWith(topicPath.replace(/\/$/, ''))) {
        return true;
      }
      
      return false;
    }) || [];

    if (matchingTopics.length > 0) {
      relatedData[slug] = {
        relatedTopics: matchingTopics.map(topic => topic.name),
        data: data
      };
    }
  });

  return relatedData;
};