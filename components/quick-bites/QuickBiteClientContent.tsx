// File: components/quick-dives/QuickBiteClientContent.tsx
'use client';

import React from 'react';
import { PageContainer } from '@/components/layout/Container';
import QuickBiteContent from './QuickBiteContent';
import RelatedQuickBites from './RelatedQuickBites';
import { QuickBiteWithSlug } from '@/lib/types/quickBites';

interface QuickBiteClientContentProps {
  content: string[];
  image: string;
  relatedQuickBites: QuickBiteWithSlug[];
  topics?: {
    icon: string;
    color?: string;
    name: string;
    url: string;
  }[];
}

const QuickBiteClientContent: React.FC<QuickBiteClientContentProps> = ({
  content,
  image,
  relatedQuickBites,
  topics = []
}) => {
  return (
    <>
      <PageContainer>
        <QuickBiteContent content={content} image={image} />
      </PageContainer>
      
      <PageContainer>
        <RelatedQuickBites relatedQuickBites={relatedQuickBites} mainTopics={topics} />
      </PageContainer>
    </>
  );
};

export default QuickBiteClientContent;