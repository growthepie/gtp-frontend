"use client";

import { QuickBiteWithSlug } from "@/lib/types/quickBites";
import { getQuickBitesByMetric } from "@/lib/quick-bites/quickBites";
import QuickBitesGrid from "./quick-bites/QuickBitesGrid";
import { Title, SectionButtonLink } from "./layout/TextHeadingComponents";

interface MetricRelatedQuickBitesProps {
  metricKey: string;
  metricType?: string;
}

const MetricRelatedQuickBites: React.FC<MetricRelatedQuickBitesProps> = ({ metricKey, metricType = "fundamentals" }) => {
    const relatedQuickBites = getQuickBitesByMetric(metricKey, metricType);
    
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
        <div className="flex justify-between items-center">
            <Title
                title="Related Quick Bites"
                icon="gtp-quick-bites"
                as="h1"
            />
            <SectionButtonLink href="/quick-bites" label="See all quick bites" shortLabel="More bites" />
        </div>
        
        <div className="text-md leading-[150%] pl-[45px] pb-[15px]">
            See related quick bites for this metric. Quick bites are blog-style articles that go in-depth on certain topics, backed by live data.
        </div>
        
        <QuickBitesGrid 
            QuickBites={sortedQuickBites as QuickBiteWithSlug[]} 
            IsLanding={false} 
            topicFilter={Object.values(relatedQuickBites).flatMap(item => item.relatedTopics)} 
        />
    </div>
    );
};

export default MetricRelatedQuickBites;
