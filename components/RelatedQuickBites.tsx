"use client";

import { QuickBiteWithSlug } from "@/lib/types/quickBites";
import QuickBiteCard from "./quick-bites/QuickBiteCard";
import { getRelatedQuickBites, getRelatedQuickBitesByTopic } from "@/lib/quick-bites/quickBites";
import QuickBitesGrid from "./quick-bites/QuickBitesGrid";
import { PageContainer } from "./layout/Container";
import { Title } from "./layout/TextHeadingComponents";

interface RelatedQuickBitesProps {
  slug: string
  isTopic?: boolean
}

const RelatedQuickBites: React.FC<RelatedQuickBitesProps> = ({ slug, isTopic = false }) => {
    const relatedQuickBites = isTopic ? getRelatedQuickBitesByTopic(slug) : getRelatedQuickBites(slug);

  
 
    if(Object.keys(relatedQuickBites).length === 0) {
        return null;
    }

    // Convert to array and sort by date (most recent first)
    const sortedQuickBites = Object.entries(relatedQuickBites)
        .map(([slug, item]) => ({
            ...item.data,
            slug
        }))
        .filter(item => item.date) // Filter out items without dates
        .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

 
    return (
    <div className="pt-[45px] md:pt-[30px] flex flex-col gap-y-[15px]">
        {!isTopic ? (
        <Title
            title="Related Quick Bites"
            icon="gtp-quick-bites"
            as="h1"
        />
        ) : (
        <div className="flex flex-col gap-y-[10px]">
            <span className="heading-large-md">Related Quick Bites</span>
            <span className="text-xs">Based on the topics discussed above, here are some more suggestions for you</span>
        </div>
        )}
        <QuickBitesGrid 
            QuickBites={sortedQuickBites as QuickBiteWithSlug[]} 
            IsLanding={false} 
            topicFilter={Object.values(relatedQuickBites).flatMap(item => item.relatedTopics)} 
        />

    </div>
    );
};

export default RelatedQuickBites;
