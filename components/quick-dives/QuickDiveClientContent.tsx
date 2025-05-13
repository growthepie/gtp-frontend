// File: components/quick-dives/QuickDiveClientContent.tsx
'use client';

import React from 'react';
import { PageContainer } from '@/components/layout/Container';
import QuickDiveContent from './QuickDiveContent';
import RelatedQuickDives from './RelatedQuickDives';
import { QuickDiveWithSlug } from '@/lib/types/quickDives';

interface QuickDiveClientContentProps {
  content: string[];
  image: string;
  relatedQuickDives: QuickDiveWithSlug[];
  topics?: {
    icon: string;
    color?: string;
    name: string;
    url: string;
  }[];
}

const QuickDiveClientContent: React.FC<QuickDiveClientContentProps> = ({
  content,
  image,
  relatedQuickDives,
  topics = []
}) => {
  return (
    <>
      <PageContainer>
        <QuickDiveContent content={content} image={image} />
      </PageContainer>
      
      <PageContainer>
        <RelatedQuickDives relatedQuickDives={relatedQuickDives} mainTopics={topics} />
      </PageContainer>
    </>
  );
};

export default QuickDiveClientContent;