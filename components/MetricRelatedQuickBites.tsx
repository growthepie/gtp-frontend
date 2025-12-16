"use client";

import { QuickBiteWithSlug } from "@/lib/types/quickBites";
import { getQuickBitesByMetric } from "@/lib/quick-bites/quickBites";
import QuickBitesGrid from "./quick-bites/QuickBitesGrid";
import { Title, SectionButtonLink } from "./layout/TextHeadingComponents";
import { PageContainer } from "./layout/Container";

interface MetricRelatedQuickBitesProps {
  metricKey: string;
  metricType?: string;
  includePageContainer?: boolean;
}

const MetricRelatedQuickBites: React.FC<MetricRelatedQuickBitesProps> = ({ metricKey, metricType = "fundamentals", includePageContainer = false }) => {
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

    const content = (
        <>
            <div className="flex justify-between items-center">
                <Title
                    title="Related Quick Bites"
                    icon="gtp-quick-bites"
                    as="h1"
                    titleSize="md"
                />
                <SectionButtonLink href="/quick-bites" label="See all Quick Bites" shortLabel="More Bites" />
            </div>
            
            <div className="text-md">
                See related quick bites for this metric. Quick bites are blog-style articles that go in-depth on certain topics, backed by live data.
            </div>
            
            <QuickBitesGrid 
                QuickBites={sortedQuickBites as QuickBiteWithSlug[]} 
                IsLanding={false} 
                topicFilter={Object.values(relatedQuickBites).flatMap(item => item.relatedTopics)} 
            />
        </>
    );

    // return null if no related quick bites
    if (sortedQuickBites.length === 0) {
        return null;
    }

    if (includePageContainer) {
        return (
            <PageContainer className="!pt-[45px] flex flex-col gap-y-[15px]">
                {content}
            </PageContainer>
        );
    }

    return content;
};

export default MetricRelatedQuickBites;
