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
}

const QuickDiveClientContent: React.FC<QuickDiveClientContentProps> = ({
  content,
  image,
  relatedQuickDives
}) => {
  return (
    <>
      <PageContainer>
        <QuickDiveContent content={content} image={image} />
      </PageContainer>
      
      <PageContainer>
        <RelatedQuickDives relatedQuickDives={relatedQuickDives} />
      </PageContainer>
    </>
  );
};

export default QuickDiveClientContent;