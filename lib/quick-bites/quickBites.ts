import { QuickBiteData, QuickBiteWithSlug, RelatedData } from '@/lib/types/quickBites';
import QUICK_BITES_DATA from '.';
import { stringToDOM } from 'million';

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
  const relatedData: RelatedData = {};
  const data = QUICK_BITES_DATA[slug];
  if (!data) return relatedData;


  Object.entries(QUICK_BITES_DATA).filter(([currentSlug, currentData]) => currentSlug !== slug).map(([currentSlug, currentData]) => {
 
    currentData.topics?.map(topic => {
      

      data.topics?.map(t => {

        // console.log(t.name + currentSlug + " --- " + topic.name);
        if(t.name === topic.name) {
          // Initialize the entry if it doesn't exist
          if(!relatedData[currentSlug]) {
            relatedData[currentSlug] = {
              relatedTopics: [],
              data: null
            };
          }
          
          //add the topic to the relatedTopics array
          relatedData[currentSlug].relatedTopics.push(topic.name);
          relatedData[currentSlug].data = currentData;
        }
      });
    });
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