"use client";

import { QuickBiteWithSlug } from "@/lib/types/quickBites";
import QuickBiteCard from "./quick-bites/QuickBiteCard";
import { getRelatedQuickBites } from "@/lib/quick-bites/quickBites";
import QuickBitesGrid from "./quick-bites/QuickBitesGrid";
import { PageContainer } from "./layout/Container";
import { Title } from "./layout/TextHeadingComponents";

interface RelatedQuickBitesProps {
  slug: string
}

const RelatedQuickBites: React.FC<RelatedQuickBitesProps> = ({ slug }) => {
    const relatedQuickBites = getRelatedQuickBites(slug);
    
    if(Object.keys(relatedQuickBites).length === 0) {
        return null;
    }

    console.log(Object.values(relatedQuickBites).flatMap(item => item.relatedTopics));
    return (
    <div className="pt-[45px] md:pt-[30px] flex flex-col gap-y-[15px]">
        
        <Title
            title="Related Quick Bites"
            icon="gtp-quick-bites"
            as="h1"
        />
        
        <QuickBitesGrid 
            QuickBites={Object.entries(relatedQuickBites).map(([slug, item]) => ({
                ...item.data,
                slug
            })) as QuickBiteWithSlug[]} 
            IsLanding={false} 
            topicFilter={Object.values(relatedQuickBites).flatMap(item => item.relatedTopics)} 
        />

    </div>
    );
};

export default RelatedQuickBites;
